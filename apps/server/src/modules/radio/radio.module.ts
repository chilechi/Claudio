import { Module } from "@nestjs/common";
import { MusicModule } from "../music/music.module.js";
import { StateModule } from "../state/state.module.js";
import { RadioController } from "./radio.controller.js";
import { RadioService } from "./radio.service.js";

@Module({
  imports: [MusicModule, StateModule],
  controllers: [RadioController],
  providers: [RadioService],
  exports: [RadioService]
})
export class RadioModule {}
