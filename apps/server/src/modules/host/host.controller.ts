import { Body, Controller, Post } from "@nestjs/common";
import { hostNarrationRequestSchema, hostNarrationResponseSchema } from "../../../../../packages/shared/dist/index.js";
import { HostService } from "./host.service.js";

@Controller()
export class HostController {
  constructor(private readonly host: HostService) {}

  @Post("/api/host/intro")
  async intro(@Body() body: unknown) {
    const request = hostNarrationRequestSchema.parse(body);
    return hostNarrationResponseSchema.parse(await this.host.narrate("intro", request));
  }

  @Post("/api/host/between-tracks")
  async betweenTracks(@Body() body: unknown) {
    const request = hostNarrationRequestSchema.parse(body);
    return hostNarrationResponseSchema.parse(await this.host.narrate("between-tracks", request));
  }
}
