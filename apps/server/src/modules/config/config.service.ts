import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { ProviderStatus } from "../../../../../packages/shared/src/index.js";

const rootDir = fileURLToPath(new URL("../../../../..", import.meta.url));

const envSchema = z.object({
  AI_PROVIDER: z.string().default("local"),
  ASR_PROVIDER: z.string().optional(),
  CALENDAR_PROVIDER: z.string().optional(),
  DATABASE_PATH: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
  EDGE_TTS_VOICE: z.string().default("zh-CN-XiaoxiaoNeural"),
  LOCAL_MUSIC_DIR: z.string().optional(),
  MUSIC_SOURCE: z.enum(["auto", "local", "netease"]).default("auto"),
  NETEASE_API_BASE_URL: z.string().optional(),
  NETEASE_COOKIE: z.string().optional(),
  NETEASE_PLAYLIST_ID: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_TTS_MODEL: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(8080),
  TTS_PROVIDER: z.string().optional(),
  UPNP_DEVICE_NAME: z.string().optional(),
  UPNP_ENABLED: z.string().optional(),
  WEATHER_CITY: z.string().optional(),
  WEATHER_PROVIDER: z.string().optional(),
  WHISPER_API_KEY: z.string().optional()
});

export type ServerConfig = z.infer<typeof envSchema>;

@Injectable()
export class ConfigService {
  readonly env: ServerConfig;
  readonly rootDir = rootDir;

  constructor() {
    this.env = envSchema.parse({ ...readLocalEnv(), ...process.env });
  }

  get port() {
    return this.env.PORT;
  }

  providerStatuses(): ProviderStatus[] {
    return [
      status("music-source", "音乐源选择", true, undefined, undefined, ["MUSIC_SOURCE"], `当前：${this.env.MUSIC_SOURCE}`),
      status("local-music", "本地音乐目录", Boolean(this.env.LOCAL_MUSIC_DIR), "缺少 LOCAL_MUSIC_DIR", undefined, ["LOCAL_MUSIC_DIR"]),
      status("deepseek", "DeepSeek AI DJ", Boolean(this.env.DEEPSEEK_API_KEY), "缺少 DEEPSEEK_API_KEY", undefined, [
        "DEEPSEEK_API_KEY",
        "DEEPSEEK_MODEL",
        "DEEPSEEK_BASE_URL"
      ]),
      status("netease", "网易云歌单", Boolean(this.env.NETEASE_PLAYLIST_ID), "缺少 NETEASE_PLAYLIST_ID", undefined, [
        "NETEASE_PLAYLIST_ID",
        "NETEASE_COOKIE",
        "NETEASE_API_BASE_URL"
      ]),
      ttsStatus(this.env),
      status("asr", "ASR 预留", Boolean(this.env.ASR_PROVIDER), "v0.5 不接收用户声音；后续需要时再配置 ASR_PROVIDER", "fallback", [
        "ASR_PROVIDER",
        "WHISPER_API_KEY"
      ]),
      status("weather", "天气", Boolean(this.env.OPENWEATHER_API_KEY && this.env.WEATHER_CITY), "缺少 OPENWEATHER_API_KEY 或 WEATHER_CITY", undefined, [
        "WEATHER_PROVIDER",
        "OPENWEATHER_API_KEY",
        "WEATHER_CITY"
      ]),
      status("calendar", "日历/日程", Boolean(this.env.CALENDAR_PROVIDER), "尚未选择日历接入方式", undefined, ["CALENDAR_PROVIDER"]),
      status("upnp", "家庭音响/UPnP", this.env.UPNP_ENABLED === "true" && Boolean(this.env.UPNP_DEVICE_NAME), "缺少 UPNP_ENABLED=true 或 UPNP_DEVICE_NAME", undefined, [
        "UPNP_ENABLED",
        "UPNP_DEVICE_NAME"
      ])
    ];
  }
}

function ttsStatus(env: ServerConfig): ProviderStatus {
  const provider = (env.TTS_PROVIDER || "").toLowerCase();
  if (!provider) {
    return status("tts", "真实 TTS", false, "未选择 TTS_PROVIDER，当前使用浏览器语音回退", "fallback", [
      "TTS_PROVIDER",
      "EDGE_TTS_VOICE"
    ]);
  }

  if (provider === "edge" || provider === "edge-tts" || provider === "edgetts") {
    return status("tts", "Edge TTS", true, undefined, undefined, [
      "TTS_PROVIDER",
      "EDGE_TTS_VOICE"
    ], `语音：${env.EDGE_TTS_VOICE}`);
  }

  return {
    id: "tts",
    label: "真实 TTS",
    configured: false,
    state: "error",
    reason: `暂不支持的 TTS_PROVIDER：${env.TTS_PROVIDER}`,
    envVars: ["TTS_PROVIDER"],
    docs: "docs/phases/v0.5/radio-host-voice-plan.md"
  };
}

function readLocalEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return {};

  const result: Record<string, string> = {};
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function status(
  id: string,
  label: string,
  configured: boolean,
  reason?: string,
  fallbackState?: "fallback",
  envVars: string[] = [],
  detail?: string
): ProviderStatus {
  return {
    id,
    label,
    configured,
    state: configured ? "ready" : fallbackState || "missing",
    reason: configured ? undefined : reason,
    detail,
    envVars,
    docs: "docs/phases/v0.2/missing-inputs.md"
  };
}
