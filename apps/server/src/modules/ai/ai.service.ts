import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { buildLocalPlan, repairDeepSeekPlan } from "../../../../../packages/core/dist/index.js";
import { deepSeekPlanSchema, queuePlanSchema } from "../../../../../packages/shared/dist/index.js";
import type { ActiveLibrary, DeepSeekPlan, QueuePlan, State, Track } from "../../../../../packages/shared/src/index.js";
import { ConfigService } from "../config/config.service.js";
import { MusicService } from "../music/music.service.js";
import { StateService } from "../state/state.service.js";

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    private readonly music: MusicService,
    private readonly state: StateService
  ) {}

  async plan(input: string, hour = new Date().getHours(), persist = false): Promise<QueuePlan> {
    const library = await this.music.activeLibrary();
    const state = await this.state.getState();
    const plan = await this.planFromLibrary(input, library, state, hour);

    if (persist) {
      await this.state.saveState({
        ...state,
        mode: plan.mode,
        queue: plan.queue.map((track) => track.id),
        currentTrackId: plan.queue[0]?.id || state.currentTrackId,
        recentPrompts: [{ input, reply: plan.reply, at: new Date().toISOString() }, ...(state.recentPrompts || [])].slice(0, 12)
      });
    }

    return queuePlanSchema.parse(plan);
  }

  async planFromLibrary(input: string, library: ActiveLibrary, state: Partial<State>, hour = new Date().getHours()): Promise<QueuePlan> {
    if (!library.tracks.length) {
      return queuePlanSchema.parse(buildLocalPlan(input, [], state, hour));
    }

    if (this.config.env.AI_PROVIDER === "deepseek" && this.config.env.DEEPSEEK_API_KEY) {
      try {
        const aiPlan = await this.callDeepSeek(input, library.tracks);
        return queuePlanSchema.parse(repairDeepSeekPlan(aiPlan, library.tracks, state, input, 5));
      } catch (error) {
        // AI 错误不能让电台空白，统一回退本地规则脑。
      }
    }

    return queuePlanSchema.parse(buildLocalPlan(input, library.tracks, state, hour));
  }

  async callDeepSeek(input: string, tracks: Track[]): Promise<DeepSeekPlan> {
    const persona = await readFile(join(this.config.rootDir, "brain", "persona.md"), "utf8");
    const body = {
      model: this.config.env.DEEPSEEK_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${persona}\n\n只返回 JSON：{"reply": string, "mode": string, "queueIds": string[], "reason": string}。queueIds 必须来自候选歌曲 id。`
        },
        {
          role: "user",
          content: JSON.stringify({
            input,
            tracks: tracks.map((track) => ({
              id: track.id,
              title: track.title,
              artist: track.artist,
              tags: track.tags
            }))
          })
        }
      ]
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${this.config.env.DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`DeepSeek 请求失败：${response.status} ${detail}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return deepSeekPlanSchema.parse(parsed);
    } finally {
      clearTimeout(timeout);
    }
  }
}
