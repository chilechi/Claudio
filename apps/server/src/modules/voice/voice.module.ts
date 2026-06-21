import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { VoiceController } from "./voice.controller.js";
import { VoiceService } from "./voice.service.js";

@Module({
  imports: [ConfigModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService]
})
export class VoiceModule {}
