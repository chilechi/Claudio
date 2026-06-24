import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { playerEventSchema, stateSchema } from "../../../../../packages/shared/dist/index.js";
import type { PlayerEvent, State } from "../../../../../packages/shared/src/index.js";
import { ConfigService } from "../config/config.service.js";

const DEFAULT_STATE: State = {
  mode: "night",
  queue: [],
  liked: [],
  skipped: [],
  recentPrompts: [],
  memories: [
    "Claudio 不主动称呼用户。",
    "Claudio 的语气温柔克制，回复简短。",
    "当前口味偏华语流行、独立流行、Live、雨天夜晚和轻 R&B。"
  ]
};

@Injectable()
export class StateService {
  private readonly statePath: string;

  constructor(config: ConfigService) {
    this.statePath = join(config.rootDir, "data", "state.json");
  }

  async getState(): Promise<State> {
    try {
      const content = await readFile(this.statePath, "utf8");
      const raw = JSON.parse(content.replace(/^\uFEFF/, ""));
      if (raw.updatedAt === null) delete raw.updatedAt;
      return stateSchema.parse(raw);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return DEFAULT_STATE;
      }
      throw err;
    }
  }

  async saveState(state: State): Promise<State> {
    const next = {
      ...state,
      updatedAt: new Date().toISOString()
    };
    await writeFile(this.statePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return stateSchema.parse(next);
  }

  async recordPlayerEvent(input: unknown): Promise<State> {
    const event = playerEventSchema.parse(input) as PlayerEvent;
    const state = await this.getState();
    const trackId = event.trackId;

    if (event.type === "play" && trackId) {
      state.currentTrackId = trackId;
    }
    if (event.type === "like" && trackId && !state.liked.includes(trackId)) {
      state.liked.push(trackId);
    }
    if ((event.type === "skip" || event.type === "hide") && trackId) {
      if (event.type === "skip" && !state.skipped.includes(trackId)) state.skipped.push(trackId);
      if (event.type === "hide") {
        state.hidden = state.hidden || [];
        if (!state.hidden.includes(trackId)) state.hidden.push(trackId);
      }
    }

    return this.saveState(state);
  }
}
