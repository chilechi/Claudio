import { z } from "zod";
import type { ProviderStatus } from "../../../packages/shared/src/index.js";

const envSchema = z.object({
  ASR_PROVIDER: z.string().optional(),
  DATABASE_PATH: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
  FISH_AUDIO_API_KEY: z.string().optional(),
  FISH_AUDIO_VOICE_ID: z.string().optional(),
  LOCAL_MUSIC_DIR: z.string().optional(),
  NETEASE_API_BASE_URL: z.string().optional(),
  NETEASE_COOKIE: z.string().optional(),
  NETEASE_PLAYLIST_ID: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(8080),
  TTS_PROVIDER: z.string().optional(),
  UPNP_DEVICE_NAME: z.string().optional(),
  UPNP_ENABLED: z.string().optional(),
  WEATHER_CITY: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env = process.env): AppConfig {
  return envSchema.parse(env);
}

export function providerStatuses(config: AppConfig): ProviderStatus[] {
  return [
    status("local-music", "本地音乐目录", Boolean(config.LOCAL_MUSIC_DIR), "缺少 LOCAL_MUSIC_DIR"),
    status("deepseek", "DeepSeek AI DJ", Boolean(config.DEEPSEEK_API_KEY), "缺少 DEEPSEEK_API_KEY"),
    status("netease", "网易云歌单", Boolean(config.NETEASE_PLAYLIST_ID), "缺少 NETEASE_PLAYLIST_ID"),
    status("tts", "真实 TTS", Boolean(config.TTS_PROVIDER), "未选择 TTS_PROVIDER，当前只能使用浏览器语音回退", "fallback"),
    status("asr", "语音输入", Boolean(config.ASR_PROVIDER), "未选择 ASR_PROVIDER，当前只能使用浏览器能力", "fallback"),
    status("weather", "天气", Boolean(config.OPENWEATHER_API_KEY && config.WEATHER_CITY), "缺少 OPENWEATHER_API_KEY 或 WEATHER_CITY"),
    status("calendar", "日历/日程", false, "尚未选择日历接入方式"),
    status("upnp", "家庭音响/UPnP", config.UPNP_ENABLED === "true" && Boolean(config.UPNP_DEVICE_NAME), "缺少 UPNP_ENABLED=true 或 UPNP_DEVICE_NAME")
  ];
}

function status(id: string, label: string, configured: boolean, reason: string, fallbackState?: "fallback"): ProviderStatus {
  return {
    id,
    label,
    configured,
    state: configured ? "ready" : fallbackState || "missing",
    reason: configured ? undefined : reason
  };
}
