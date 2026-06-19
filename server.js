import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlan } from "./brain/recommender.js";
import { callDeepSeek } from "./brain/deepseek.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(rootDir, "public");
const dataDir = join(rootDir, "data");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function loadEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return;

  const content = await readFile(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

await loadEnv();

const config = {
  port: Number(process.env.PORT || 8080),
  aiProvider: process.env.AI_PROVIDER || "local",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  localMusicDir: process.env.LOCAL_MUSIC_DIR || "",
  neteasePlaylistId: process.env.NETEASE_PLAYLIST_ID || "",
  neteaseCookie: process.env.NETEASE_COOKIE || "",
  ttsProvider: process.env.TTS_PROVIDER || "",
  asrProvider: process.env.ASR_PROVIDER || "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || "",
  weatherCity: process.env.WEATHER_CITY || "",
  upnpEnabled: process.env.UPNP_ENABLED || "",
  upnpDeviceName: process.env.UPNP_DEVICE_NAME || ""
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

async function readJsonFile(filePath) {
  const content = await readFile(filePath, "utf8");
  // Windows 工具可能写入 UTF-8 BOM，这里剥掉，避免状态文件无法解析。
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function writeJsonFile(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function loadLibrary() {
  return readJsonFile(join(dataDir, "library.json"));
}

async function loadState() {
  return readJsonFile(join(dataDir, "state.json"));
}

async function saveState(state) {
  state.updatedAt = new Date().toISOString();
  await writeJsonFile(join(dataDir, "state.json"), state);
}

function providerStatuses() {
  return [
    providerStatus("local-music", "本地音乐目录", Boolean(config.localMusicDir), "缺少 LOCAL_MUSIC_DIR"),
    providerStatus("deepseek", "DeepSeek AI DJ", Boolean(config.deepseekApiKey), "缺少 DEEPSEEK_API_KEY"),
    providerStatus("netease", "网易云歌单", Boolean(config.neteasePlaylistId), "缺少 NETEASE_PLAYLIST_ID"),
    providerStatus("tts", "真实 TTS", Boolean(config.ttsProvider), "未选择 TTS_PROVIDER，当前只能使用浏览器语音回退", "fallback"),
    providerStatus("asr", "语音输入", Boolean(config.asrProvider), "未选择 ASR_PROVIDER，当前只能使用浏览器能力", "fallback"),
    providerStatus("weather", "天气", Boolean(config.openWeatherApiKey && config.weatherCity), "缺少 OPENWEATHER_API_KEY 或 WEATHER_CITY"),
    providerStatus("calendar", "日历/日程", false, "尚未选择日历接入方式"),
    providerStatus("upnp", "家庭音响/UPnP", config.upnpEnabled === "true" && Boolean(config.upnpDeviceName), "缺少 UPNP_ENABLED=true 或 UPNP_DEVICE_NAME")
  ];
}

function providerStatus(id, label, configured, reason, fallbackState) {
  return {
    id,
    label,
    configured,
    state: configured ? "ready" : fallbackState || "missing",
    reason: configured ? undefined : reason
  };
}

async function planWithAiOrLocal(input, library, state = {}) {
  if (config.aiProvider === "deepseek" && config.deepseekApiKey) {
    try {
      const aiPlan = await callDeepSeek({ config, input, library });
      const byId = new Map(library.tracks.map((track) => [track.id, track]));
      const queue = (aiPlan?.queueIds || []).map((id) => byId.get(id)).filter(Boolean);

      if (queue.length && aiPlan?.reply) {
        return {
          mode: aiPlan.mode || "night",
          queue,
          reply: aiPlan.reply,
          reason: aiPlan.reason || "由 DeepSeek 根据当前输入和口味生成。",
          aiProvider: "deepseek"
        };
      }
    } catch (error) {
      // AI 失败不能阻塞电台，回退到本地规则脑。
      console.warn(error.message);
    }
  }

  return {
    ...buildPlan(input, library.tracks, state),
    aiProvider: "local"
  };
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(publicDir, normalized);
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const filePath = safeStaticPath(url.pathname);

  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        name: "Claudio",
        version: "0.1.0"
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/library") {
      sendJson(response, 200, await loadLibrary());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/config/status") {
      sendJson(response, 200, { providers: providerStatuses() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/state") {
      sendJson(response, 200, await loadState());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/plan/today") {
      const library = await loadLibrary();
      const state = await loadState();
      sendJson(response, 200, await planWithAiOrLocal("今晚想听安静一点", library, state));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = await readBody(request);
      const input = String(body.input || "").trim();
      if (!input) {
        sendJson(response, 400, { error: "input is required" });
        return;
      }

      const library = await loadLibrary();
      const state = await loadState();
      const plan = await planWithAiOrLocal(input, library, state);

      state.mode = plan.mode;
      state.queue = plan.queue.map((track) => track.id);
      state.currentTrackId = state.queue[0] || state.currentTrackId;
      state.recentPrompts = [{ input, reply: plan.reply, at: new Date().toISOString() }, ...(state.recentPrompts || [])].slice(0, 12);
      await saveState(state);

      sendJson(response, 200, plan);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/player/event") {
      const body = await readBody(request);
      const state = await loadState();
      const trackId = String(body.trackId || "");

      if (body.type === "like" && trackId && !state.liked.includes(trackId)) {
        state.liked.push(trackId);
      }
      if (body.type === "skip" && trackId && !state.skipped.includes(trackId)) {
        state.skipped.push(trackId);
      }
      if (body.type === "play" && trackId) {
        state.currentTrackId = trackId;
      }

      await saveState(state);
      sendJson(response, 200, state);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(config.port, () => {
  console.log(`Claudio 正在运行：http://localhost:${config.port}`);
});
