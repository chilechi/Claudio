import cors from "@fastify/cors";
import Fastify from "fastify";

const server = Fastify({
  logger: true
});

await server.register(cors, {
  origin: true
});

server.get("/api/health", async () => ({
  ok: true,
  name: "Claudio",
  version: "0.2.0"
}));

server.get("/api/config/status", async () => ({
  providers: [
    {
      id: "local-music",
      label: "本地音乐目录",
      configured: Boolean(process.env.LOCAL_MUSIC_DIR),
      state: process.env.LOCAL_MUSIC_DIR ? "ready" : "missing",
      reason: process.env.LOCAL_MUSIC_DIR ? undefined : "缺少 LOCAL_MUSIC_DIR"
    },
    {
      id: "deepseek",
      label: "DeepSeek AI DJ",
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      state: process.env.DEEPSEEK_API_KEY ? "ready" : "missing",
      reason: process.env.DEEPSEEK_API_KEY ? undefined : "缺少 DEEPSEEK_API_KEY"
    }
  ]
}));

const port = Number(process.env.PORT || 8080);

await server.listen({
  host: "127.0.0.1",
  port
});
