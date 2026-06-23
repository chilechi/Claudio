import "reflect-metadata";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fastifyStatic from "@fastify/static";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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

  // SPA fallback: 用 onRequest 钩子拦截非 API、非静态文件路由，返回 index.html
  // 不能用 setNotFoundHandler，因为 NestJS 内部已注册了同一个 prefix 的 handler
  const indexHtml = readFileSync(join(webDist, "index.html"), "utf-8");
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  fastifyInstance.addHook("onRequest", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    const url = request.url.split("?")[0];
    // 跳过 API 路由
    if (url.startsWith("/api/")) return done();
    // 跳过有文件扩展名的请求（静态资源如 .js .css .ico .svg）
    if (/\.[^/]+$/.test(url)) return done();
    // 跳过根路径（由 @fastify/static 的 index 选项处理）
    if (url === "/") return done();
    // 其他路径（如 /admin）返回 index.html，由前端路由处理
    reply.type("text/html").send(indexHtml);
  });
}

await app.listen(config.port, "127.0.0.1");
