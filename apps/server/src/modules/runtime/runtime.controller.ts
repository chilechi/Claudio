import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { RuntimeService } from "./runtime.service.js";

const inputSchema = z.object({
  input: z.string().trim().min(1).max(800).optional()
}).optional();

@Controller()
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  @Get("/api/events")
  events(@Res() reply: FastifyReply) {
    this.runtime.attachClient(reply.raw);
  }

  @Get("/api/runtime/status")
  status() {
    return this.runtime.snapshot();
  }

  @Get("/api/now")
  now() {
    return this.runtime.now();
  }

  @Post("/api/runtime/start")
  start(@Body() body: unknown) {
    const request = inputSchema.parse(body);
    return this.runtime.start(request?.input);
  }

  @Post("/api/runtime/stop")
  stop() {
    return this.runtime.stop();
  }

  @Post("/api/runtime/refill")
  refill(@Body() body: unknown) {
    const request = inputSchema.parse(body);
    return this.runtime.refill(request?.input);
  }

  @Post("/api/runtime/next")
  next() {
    return this.runtime.next();
  }

  @Post("/api/runtime/previous")
  previous() {
    return this.runtime.previous();
  }

  @Post("/api/runtime/request")
  request(@Body() body: unknown) {
    const request = z.object({ input: z.string().trim().min(1).max(800) }).parse(body);
    return this.runtime.request(request.input);
  }
}
