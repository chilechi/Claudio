import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { SettingsModule } from "./settings/settings.module.js";

@Module({
  imports: [ConfigModule, HealthModule, SettingsModule]
})
export class AppModule {}
