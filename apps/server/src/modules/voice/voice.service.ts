import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VoiceStatus } from "../../../../../packages/shared/src/index.js";
import { voiceStatusSchema } from "../../../../../packages/shared/dist/index.js";
import { ConfigService } from "../config/config.service.js";
import { synthesizeWithEdgeTts } from "./edge-tts.client.js";

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
        envVars: ["TTS_PROVIDER", "EDGE_TTS_VOICE"]
      });
    }

    if (provider === "edge" || provider === "edge-tts" || provider === "edgetts") {
      return voiceStatusSchema.parse({
        provider: "edge-tts",
        configured: true,
        state: "ready",
        audioSupported: true,
        fallbackProvider: "browser",
        envVars: ["TTS_PROVIDER", "EDGE_TTS_VOICE"]
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

    if (status.provider === "edge-tts") {
      const cached = this.readCachedSpeech(text, status.provider);
      if (cached) return cached;
      return this.speakWithEdgeTts(text);
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
      voice: this.config.env.EDGE_TTS_VOICE || "zh-CN-XiaoxiaoNeural",
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

  private async speakWithEdgeTts(text: string): Promise<SpeechAudio | null> {
    try {
      const audio = await synthesizeWithEdgeTts(text, {
        voice: this.config.env.EDGE_TTS_VOICE || "zh-CN-XiaoxiaoNeural"
      });
      const filename = this.writeCachedSpeech(text, "edge-tts", audio);
      return {
        audio,
        contentType: "audio/mpeg",
        provider: "edge-tts",
        filename,
        cached: false
      };
    } catch {
      return null;
    }
  }
}
