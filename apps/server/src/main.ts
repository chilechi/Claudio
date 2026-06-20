import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./modules/app.module.js";
import { ConfigService } from "./modules/config/config.service.js";

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
  logger: ["error", "warn", "log"]
});
const config = app.get(ConfigService);

app.enableCors({
  origin: true
});

await app.listen(config.port, "127.0.0.1");
