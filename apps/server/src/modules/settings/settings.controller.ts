import { Controller, Get } from "@nestjs/common";
import { diagnosticsResponseSchema } from "../../../../../packages/shared/dist/index.js";
import { ConfigService } from "../config/config.service.js";

@Controller()
export class SettingsController {
  constructor(private readonly config: ConfigService) {}

  @Get("/api/settings/diagnostics")
  diagnostics() {
    const providers = this.config.providerStatuses();
    return diagnosticsResponseSchema.parse({
      providers,
      summary: {
        ready: providers.filter((provider) => provider.state === "ready").length,
        fallback: providers.filter((provider) => provider.state === "fallback").length,
        missing: providers.filter((provider) => provider.state === "missing").length
      },
      docs: "docs/phases/v0.2/missing-inputs.md",
      secretPolicy: "只返回需要配置的变量名，不返回任何 .env 原文或密钥值。"
    });
  }

  @Get("/api/config/status")
  configStatus() {
    return {
      providers: this.config.providerStatuses()
    };
  }

  @Get("/api/providers/status")
  providersStatus() {
    return {
      providers: this.config.providerStatuses()
    };
  }
}
