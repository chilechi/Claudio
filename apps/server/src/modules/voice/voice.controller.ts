import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { voiceSpeakRequestSchema, voiceStatusSchema } from "../../../../../packages/shared/dist/index.js";
import { VoiceService } from "./voice.service.js";

@Controller()
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Get("/api/voice/status")
  status() {
    return voiceStatusSchema.parse(this.voice.status());
  }

  @Get("/api/voice/speak")
  async speakGet(@Query("text") text: string, @Res() reply: FastifyReply) {
    return this.sendSpeech(text, reply);
  }

  @Post("/api/voice/speak")
  async speakPost(@Body() body: unknown, @Res() reply: FastifyReply) {
    const request = voiceSpeakRequestSchema.parse(body);
    return this.sendSpeech(request.text, reply);
  }

  @Get("/api/voice/cache/:filename")
  async cached(@Param("filename") filename: string, @Res() reply: FastifyReply) {
    const result = this.voice.cachedSpeech(filename);
    if (!result) return reply.code(404).send({ error: "语音缓存不存在" });
    reply.header("Content-Type", result.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.header("X-Claudio-Voice-Provider", result.provider);
    reply.header("X-Claudio-Voice-Cache", "hit");
    return reply.send(result.audio);
  }

  private async sendSpeech(text: string, reply: FastifyReply) {
    const request = voiceSpeakRequestSchema.parse({ text });
    const result = await this.voice.speak(request.text);
    if (!result) {
      return reply.code(200).send({
        provider: this.voice.status().provider,
        fallback: true,
        reason: "当前没有可用的真实 TTS 音频，前端应使用浏览器语音回退。"
      });
    }

    reply.header("Content-Type", result.contentType);
    reply.header("Cache-Control", result.cached ? "public, max-age=31536000, immutable" : "no-store");
    reply.header("X-Claudio-Voice-Provider", result.provider);
    if (result.cached) reply.header("X-Claudio-Voice-Cache", "hit");
    if (result.filename) reply.header("X-Claudio-Voice-Filename", result.filename);
    return reply.send(result.audio);
  }
}
