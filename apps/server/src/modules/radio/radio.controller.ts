import { Controller, Get, Query } from "@nestjs/common";
import { RadioService } from "./radio.service.js";

@Controller()
export class RadioController {
  constructor(private readonly radio: RadioService) {}

  @Get("/api/radio/today")
  today(@Query("hour") hour?: string) {
    return this.radio.today(hour === undefined ? new Date().getHours() : Number(hour));
  }
}
