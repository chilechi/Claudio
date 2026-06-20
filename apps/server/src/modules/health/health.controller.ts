import { Controller, Get } from "@nestjs/common";

@Controller("/api/health")
export class HealthController {
  @Get()
  health() {
    return {
      ok: true,
      name: "Claudio",
      version: "0.3.0"
    };
  }
}
