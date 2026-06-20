import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module.js";
import { SettingsController } from "./settings.controller.js";

@Module({
  imports: [ConfigModule],
  controllers: [SettingsController]
})
export class SettingsModule {}
