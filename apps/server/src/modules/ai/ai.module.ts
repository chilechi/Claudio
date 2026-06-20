import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { MusicModule } from "../music/music.module.js";
import { StateModule } from "../state/state.module.js";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";

@Module({
  imports: [ConfigModule, MusicModule, StateModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
