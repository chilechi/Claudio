import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { StateModule } from "../state/state.module.js";
import { LocalMusicProvider } from "./providers/local-music.provider.js";
import { NeteaseProvider } from "./providers/netease.provider.js";
import { MusicController } from "./music.controller.js";
import { MusicService } from "./music.service.js";

@Module({
  imports: [ConfigModule, StateModule],
  controllers: [MusicController],
  providers: [MusicService, LocalMusicProvider, NeteaseProvider],
  exports: [MusicService]
})
export class MusicModule {}
