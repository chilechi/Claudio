import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { MusicModule } from "./music/music.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { StateModule } from "./state/state.module.js";

@Module({
  imports: [ConfigModule, HealthModule, SettingsModule, StateModule, MusicModule]
})
export class AppModule {}
