import "reflect-metadata";
import { existsSync } from "node:fs";
import { join } from "node:path";
import fastifyStatic from "@fastify/static";
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

const webDist = join(config.rootDir, "apps", "web", "dist");
if (existsSync(webDist)) {
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
    index: ["index.html"]
  });
}

await app.listen(config.port, "127.0.0.1");
