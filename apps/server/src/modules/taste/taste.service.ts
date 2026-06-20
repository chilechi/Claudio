import { Injectable } from "@nestjs/common";
import { buildTasteProfile } from "../../../../../packages/core/dist/index.js";
import { tasteProfileResponseSchema } from "../../../../../packages/shared/dist/index.js";
import { MusicService } from "../music/music.service.js";
import { StateService } from "../state/state.service.js";

@Injectable()
export class TasteService {
  constructor(
    private readonly music: MusicService,
    private readonly state: StateService
  ) {}

  async profile() {
    const library = await this.music.activeLibrary();
    const state = await this.state.getState();
    return tasteProfileResponseSchema.parse({
      source: library.source,
      profile: buildTasteProfile(library.tracks, state)
    });
  }
}
