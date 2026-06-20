import { Injectable } from "@nestjs/common";
import { buildRadioPlan } from "../../../../../packages/core/dist/index.js";
import { MusicService } from "../music/music.service.js";
import { StateService } from "../state/state.service.js";

@Injectable()
export class RadioService {
  constructor(
    private readonly music: MusicService,
    private readonly state: StateService
  ) {}

  async today(hour: number) {
    const library = await this.music.activeLibrary();
    const state = await this.state.getState();
    return buildRadioPlan({
      tracks: library.tracks,
      state,
      hour: Number.isFinite(hour) ? hour : new Date().getHours()
    });
  }
}
