import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { StateService } from "./state.service.js";

@Module({
  imports: [ConfigModule],
  providers: [StateService],
  exports: [StateService]
})
export class StateModule {}
