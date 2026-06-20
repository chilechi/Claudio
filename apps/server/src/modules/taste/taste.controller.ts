import { Controller, Get } from "@nestjs/common";
import { TasteService } from "./taste.service.js";

@Controller()
export class TasteController {
  constructor(private readonly taste: TasteService) {}

  @Get("/api/taste/profile")
  profile() {
    return this.taste.profile();
  }
}
