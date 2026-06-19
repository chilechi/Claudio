import cors from "@fastify/cors";
import Fastify from "fastify";
import { loadConfig, providerStatuses } from "./config.js";

const server = Fastify({
  logger: true
});
const config = loadConfig();

await server.register(cors, {
  origin: true
});

server.get("/api/health", async () => ({
  ok: true,
  name: "Claudio",
  version: "0.2.0"
}));

server.get("/api/config/status", async () => ({
  providers: providerStatuses(config)
}));

await server.listen({
  host: "127.0.0.1",
  port: config.PORT
});
