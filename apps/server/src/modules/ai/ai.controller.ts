import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { chatRequestSchema } from "../../../../../packages/shared/dist/index.js";
import { AiService } from "./ai.service.js";

@Controller()
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("/api/plan/today")
  today() {
    return this.ai.plan("今晚想听安静一点", new Date().getHours());
  }

  @Post("/api/chat")
  @HttpCode(200)
  chat(@Body() body: unknown) {
    const request = chatRequestSchema.parse(body);
    return this.ai.plan(request.input, new Date().getHours(), true);
  }
}
