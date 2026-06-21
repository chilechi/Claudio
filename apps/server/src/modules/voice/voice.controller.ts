import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
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
    reply.header("Cache-Control", "no-store");
    reply.header("X-Claudio-Voice-Provider", result.provider);
    return reply.send(result.audio);
  }
}
