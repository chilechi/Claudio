import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VoiceStatus } from "../../../../../packages/shared/src/index.js";
import { voiceStatusSchema } from "../../../../../packages/shared/dist/index.js";
import { ConfigService } from "../config/config.service.js";

type SpeechAudio = {
  audio: Buffer;
  contentType: string;
  provider: string;
  filename?: string;
  cached?: boolean;
};

@Injectable()
export class VoiceService {
  private readonly cacheDir: string;

  constructor(private readonly config: ConfigService) {
    this.cacheDir = join(this.config.rootDir, "data", "cache", "tts");
  }

  status(): VoiceStatus {
    const provider = (this.config.env.TTS_PROVIDER || "").toLowerCase();
    if (!provider) {
      return voiceStatusSchema.parse({
        provider: "browser",
        configured: false,
        state: "fallback",
        audioSupported: false,
        fallbackProvider: "browser",
        reason: "未配置真实 TTS，前端使用浏览器语音回退。",
        envVars: ["TTS_PROVIDER", "FISH_AUDIO_API_KEY", "FISH_AUDIO_VOICE_ID"]
      });
    }

    if (provider === "fish" || provider === "fish-audio" || provider === "fishaudio") {
      const configured = Boolean(this.config.env.FISH_AUDIO_API_KEY && this.config.env.FISH_AUDIO_VOICE_ID);
      return voiceStatusSchema.parse({
        provider: "fish-audio",
        configured,
        state: configured ? "ready" : "fallback",
        audioSupported: configured,
        fallbackProvider: "browser",
        reason: configured ? undefined : "Fish Audio 需要 FISH_AUDIO_API_KEY 和 FISH_AUDIO_VOICE_ID。",
        envVars: ["TTS_PROVIDER", "FISH_AUDIO_API_KEY", "FISH_AUDIO_VOICE_ID", "FISH_AUDIO_MODEL", "FISH_AUDIO_BASE_URL"]
      });
    }

    return voiceStatusSchema.parse({
      provider,
      configured: false,
      state: "error",
      audioSupported: false,
      fallbackProvider: "browser",
      reason: `暂不支持的 TTS_PROVIDER：${this.config.env.TTS_PROVIDER}`,
      envVars: ["TTS_PROVIDER"]
    });
  }

  async speak(text: string): Promise<SpeechAudio | null> {
    const status = this.status();
    if (!status.audioSupported) return null;
    if (status.provider === "fish-audio") {
      const cached = this.readCachedSpeech(text, status.provider);
      if (cached) return cached;
      return this.speakWithFishAudio(text);
    }
    return null;
  }

  cachedSpeech(filename: string): SpeechAudio | null {
    if (!/^[a-f0-9]{40}\.mp3$/.test(filename)) return null;
    const path = join(this.cacheDir, filename);
    if (!existsSync(path)) return null;
    return {
      audio: readFileSync(path),
      contentType: "audio/mpeg",
      provider: "cache",
      filename,
      cached: true
    };
  }

  private cacheFilename(text: string, provider: string) {
    const key = JSON.stringify({
      provider,
      voice: this.config.env.FISH_AUDIO_VOICE_ID || "",
      model: this.config.env.FISH_AUDIO_MODEL || "",
      text
    });
    return `${createHash("sha1").update(key).digest("hex")}.mp3`;
  }

  private readCachedSpeech(text: string, provider: string): SpeechAudio | null {
    const filename = this.cacheFilename(text, provider);
    const path = join(this.cacheDir, filename);
    if (!existsSync(path)) return null;
    return {
      audio: readFileSync(path),
      contentType: "audio/mpeg",
      provider,
      filename,
      cached: true
    };
  }

  private writeCachedSpeech(text: string, provider: string, audio: Buffer) {
    mkdirSync(this.cacheDir, { recursive: true });
    const filename = this.cacheFilename(text, provider);
    writeFileSync(join(this.cacheDir, filename), audio);
    return filename;
  }

  private async speakWithFishAudio(text: string): Promise<SpeechAudio | null> {
    const response = await fetch(`${this.config.env.FISH_AUDIO_BASE_URL}/v1/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.env.FISH_AUDIO_API_KEY}`,
        model: this.config.env.FISH_AUDIO_MODEL
      },
      body: JSON.stringify({
        text,
        reference_id: this.config.env.FISH_AUDIO_VOICE_ID,
        format: "mp3"
      })
    });

    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const audio = Buffer.from(arrayBuffer);
    const filename = this.writeCachedSpeech(text, "fish-audio", audio);
    return {
      audio,
      contentType,
      provider: "fish-audio",
      filename,
      cached: false
    };
  }
}
