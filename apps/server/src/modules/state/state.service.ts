import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { playerEventSchema, stateSchema } from "../../../../../packages/shared/dist/index.js";
import type { PlayerEvent, State } from "../../../../../packages/shared/src/index.js";
import { ConfigService } from "../config/config.service.js";

@Injectable()
export class StateService {
  private readonly statePath: string;

  constructor(config: ConfigService) {
    this.statePath = join(config.rootDir, "data", "state.json");
  }

  async getState(): Promise<State> {
    const content = await readFile(this.statePath, "utf8");
    const raw = JSON.parse(content.replace(/^\uFEFF/, ""));
    if (raw.updatedAt === null) delete raw.updatedAt;
    return stateSchema.parse(raw);
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
