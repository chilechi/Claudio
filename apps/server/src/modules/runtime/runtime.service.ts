import { Injectable, OnModuleDestroy } from "@nestjs/common";
import type { ServerResponse } from "node:http";
import type { QueuePlan, Track } from "../../../../../packages/shared/src/index.js";
import { AiService } from "../ai/ai.service.js";
import { HostService } from "../host/host.service.js";
import { StateService } from "../state/state.service.js";
import { routeRuntimeIntent, type RuntimeIntent } from "./intent-router.js";

type RuntimeJobType = "program_start" | "music_refill" | "bridge_generation" | "hourly_check";

type RuntimeJob = {
  type: RuntimeJobType;
  key: string;
  input?: string;
  trackId?: string;
  previousTrackId?: string;
  createdAt: string;
};

type RuntimeEvent = {
  type: string;
  [key: string]: unknown;
};

export type RuntimeSnapshot = {
  running: boolean;
  programId?: string;
  sessionTitle?: string;
  queue: Track[];
  currentTrack?: Track;
  currentIndex: number;
  hostMessage?: string;
  jobs: Array<Pick<RuntimeJob, "type" | "key" | "createdAt">>;
  workerRunning: boolean;
  updatedAt: string;
};

@Injectable()
export class RuntimeService implements OnModuleDestroy {
  private readonly clients = new Set<ServerResponse>();
  private readonly jobs: RuntimeJob[] = [];
  private readonly timer: NodeJS.Timeout;
  private workerRunning = false;
  private running = false;
  private programId: string | undefined;
  private sessionTitle: string | undefined;
  private queue: Track[] = [];
  private currentIndex = 0;
  private hostMessage = "";
  private lastHour = new Date().getHours();

  constructor(
    private readonly ai: AiService,
    private readonly host: HostService,
    private readonly state: StateService
  ) {
    this.timer = setInterval(() => {
      this.hourlyCheck().catch(() => undefined);
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
    for (const client of this.clients) client.end();
    this.clients.clear();
  }

  attachClient(response: ServerResponse) {
    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    response.write(`event: runtime-status\ndata: ${JSON.stringify({ type: "runtime-status", runtime: this.snapshot() })}\n\n`);
    this.clients.add(response);
    response.on("close", () => {
      this.clients.delete(response);
    });
  }

  snapshot(): RuntimeSnapshot {
    return {
      running: this.running,
      programId: this.programId,
      sessionTitle: this.sessionTitle,
      queue: this.queue,
      currentTrack: this.currentTrack(),
      currentIndex: this.currentIndex,
      hostMessage: this.hostMessage || undefined,
      jobs: this.jobs.map(({ type, key, createdAt }) => ({ type, key, createdAt })),
      workerRunning: this.workerRunning,
      updatedAt: new Date().toISOString()
    };
  }

  now() {
    return {
      runtime: this.snapshot(),
      track: this.currentTrack(),
      hostMessage: this.hostMessage || null
    };
  }

  async start(input = "打开 Claudio 电台") {
    const job = this.enqueue("program_start", { input });
    await this.drainJobs();
    return { job, runtime: this.snapshot() };
  }

  stop() {
    this.running = false;
    this.broadcast({ type: "control", action: "pause", reason: "电台已停止" });
    this.broadcast({ type: "runtime-status", runtime: this.snapshot() });
    return this.snapshot();
  }

  async refill(input = "根据现在的气氛续播") {
    const job = this.enqueue("music_refill", { input });
    await this.drainJobs();
    return { job, runtime: this.snapshot() };
  }

  async next() {
    if (!this.queue.length) return { runtime: this.snapshot(), reason: "队列里还没有歌曲" };
    const previousTrack = this.currentTrack();
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    const currentTrack = this.currentTrack();
    this.broadcast({ type: "control", action: "next", track: currentTrack });
    this.broadcast({ type: "now-playing", track: currentTrack, runtime: this.snapshot() });
    if (currentTrack) {
      this.enqueue("bridge_generation", {
        trackId: currentTrack.id,
        previousTrackId: previousTrack?.id,
        input: "切歌过渡"
      });
      await this.drainJobs();
    }
    return { runtime: this.snapshot(), previousTrack, currentTrack };
  }

  async request(input: string) {
    const intent = routeRuntimeIntent(input);
    if (intent.action === "next") return this.next();
    if (intent.action === "pause" || intent.action === "resume" || intent.action === "volume") {
      this.broadcast(controlEvent(intent));
      return { intent, runtime: this.snapshot() };
    }
    if (intent.action === "speech-only") {
      const text = await this.generateHostMessage("intro", this.currentTrack(), undefined, input);
      return { intent, hostMessage: text, runtime: this.snapshot() };
    }
    return this.running ? this.refill(input) : this.start(input);
  }

  private currentTrack() {
    return this.queue[this.currentIndex];
  }

  private enqueue(type: RuntimeJobType, input: Omit<RuntimeJob, "type" | "key" | "createdAt"> = {}) {
    const key = `${type}:${input.trackId || input.input || "job"}:${Date.now()}`;
    const job: RuntimeJob = {
      type,
      key,
      createdAt: new Date().toISOString(),
      ...input
    };
    this.jobs.push(job);
    this.broadcast({ type: "job-status", job, runtime: this.snapshot() });
    return job;
  }

  private async drainJobs() {
    if (this.workerRunning) return;
    this.workerRunning = true;
    try {
      while (this.jobs.length) {
        const job = this.jobs.shift();
        if (!job) continue;
        await this.runJob(job);
      }
    } finally {
      this.workerRunning = false;
      this.broadcast({ type: "runtime-status", runtime: this.snapshot() });
    }
  }

  private async runJob(job: RuntimeJob) {
    if (job.type === "program_start") {
      const plan = await this.ai.plan(job.input || "打开 Claudio 电台", new Date().getHours(), true);
      this.applyPlan(plan, true);
      this.running = true;
      this.programId = `program-${Date.now()}`;
      this.sessionTitle = plan.mode;
      this.broadcast({ type: "program-start", plan, runtime: this.snapshot() });
      await this.generateHostMessage("intro", this.currentTrack(), undefined, job.input);
      return;
    }

    if (job.type === "music_refill") {
      const plan = await this.ai.plan(job.input || "继续这个气氛", new Date().getHours(), true);
      const seen = new Set(this.queue.map((track) => track.id));
      const additions = plan.queue.filter((track) => !seen.has(track.id));
      this.queue = additions.length ? [...this.queue, ...additions] : plan.queue;
      if (this.currentIndex >= this.queue.length) this.currentIndex = 0;
      this.sessionTitle = plan.mode;
      await this.persistRuntimeState();
      this.broadcast({ type: "tracks-ready", plan, additions, runtime: this.snapshot() });
      return;
    }

    if (job.type === "bridge_generation") {
      const track = this.queue.find((item) => item.id === job.trackId);
      const previousTrack = this.queue.find((item) => item.id === job.previousTrackId);
      await this.generateHostMessage("between-tracks", track, previousTrack, job.input);
      return;
    }

    if (job.type === "hourly_check") {
      const track = this.currentTrack();
      const text = await this.generateHostMessage("intro", track, undefined, "整点轻声检查，不换歌");
      this.broadcast({ type: "hourly-check", text, runtime: this.snapshot() });
    }
  }

  private applyPlan(plan: QueuePlan, resetIndex: boolean) {
    this.queue = plan.queue;
    if (resetIndex || this.currentIndex >= this.queue.length) this.currentIndex = 0;
  }

  private async generateHostMessage(
    kind: "intro" | "between-tracks",
    track: Track | undefined,
    previousTrack?: Track,
    context?: string
  ) {
    if (!track) {
      this.hostMessage = "歌单还没有准备好，先保持安静。";
      this.broadcast({ type: "host-message", text: this.hostMessage, source: "local", runtime: this.snapshot() });
      return this.hostMessage;
    }

    try {
      const narration = await this.host.narrate(kind, {
        trackId: track.id,
        previousTrackId: previousTrack?.id,
        context
      });
      this.hostMessage = narration.text;
      this.broadcast({ type: "host-message", narration, text: narration.text, runtime: this.snapshot() });
      return narration.text;
    } catch {
      this.hostMessage = `现在是《${track.title}》。先让它自己展开。`;
      this.broadcast({ type: "host-message", text: this.hostMessage, source: "local", runtime: this.snapshot() });
      return this.hostMessage;
    }
  }

  private async persistRuntimeState() {
    const state = await this.state.getState();
    await this.state.saveState({
      ...state,
      mode: this.sessionTitle || state.mode,
      queue: this.queue.map((track) => track.id),
      currentTrackId: this.currentTrack()?.id || state.currentTrackId
    });
  }

  private async hourlyCheck() {
    if (!this.running || !this.queue.length) return;
    const hour = new Date().getHours();
    if (hour === this.lastHour) return;
    this.lastHour = hour;
    this.enqueue("hourly_check", { input: "整点轻声检查" });
    await this.drainJobs();
  }

  private broadcast(event: RuntimeEvent) {
    const text = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      if (client.destroyed) {
        this.clients.delete(client);
        continue;
      }
      client.write(text);
    }
  }
}

function controlEvent(intent: RuntimeIntent): RuntimeEvent {
  if (intent.action === "pause") return { type: "control", action: "pause", reason: intent.reason };
  if (intent.action === "resume") return { type: "control", action: "resume", reason: intent.reason };
  if (intent.action === "volume") return { type: "control", action: "volume", delta: intent.delta, reason: intent.reason };
  return { type: "control", action: intent.action, reason: intent.reason };
}
