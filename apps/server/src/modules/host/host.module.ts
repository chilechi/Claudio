import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { MusicModule } from "../music/music.module.js";
import { StateModule } from "../state/state.module.js";
import { HostController } from "./host.controller.js";
import { HostService } from "./host.service.js";

@Module({
  imports: [ConfigModule, MusicModule, StateModule],
  controllers: [HostController],
  providers: [HostService],
  exports: [HostService]
})
export class HostModule {}
