import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { MusicModule } from "./music/music.module.js";
import { RadioModule } from "./radio/radio.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { StateModule } from "./state/state.module.js";
import { TasteModule } from "./taste/taste.module.js";

@Module({
  imports: [ConfigModule, HealthModule, SettingsModule, StateModule, MusicModule, AiModule, RadioModule, TasteModule]
})
export class AppModule {}
