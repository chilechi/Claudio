import { Module } from "@nestjs/common";
import { MusicModule } from "../music/music.module.js";
import { StateModule } from "../state/state.module.js";
import { TasteController } from "./taste.controller.js";
import { TasteService } from "./taste.service.js";

@Module({
  imports: [MusicModule, StateModule],
  controllers: [TasteController],
  providers: [TasteService],
  exports: [TasteService]
})
export class TasteModule {}
