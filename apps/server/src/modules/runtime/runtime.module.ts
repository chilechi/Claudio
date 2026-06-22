import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module.js";
import { HostModule } from "../host/host.module.js";
import { StateModule } from "../state/state.module.js";
import { RuntimeController } from "./runtime.controller.js";
import { RuntimeService } from "./runtime.service.js";

@Module({
  imports: [AiModule, HostModule, StateModule],
  controllers: [RuntimeController],
  providers: [RuntimeService],
  exports: [RuntimeService]
})
export class RuntimeModule {}
