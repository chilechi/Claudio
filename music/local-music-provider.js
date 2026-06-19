import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { createHash } from "node:crypto";

const audioExtensions = new Set([".mp3", ".flac", ".wav", ".m4a", ".aac", ".ogg", ".opus"]);

export async function scanLocalMusic(rootDir) {
  if (!rootDir) {
    return {
      configured: false,
      reason: "缺少 LOCAL_MUSIC_DIR",
      tracks: []
    };
  }

  const root = resolve(rootDir);
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    return {
      configured: false,
      reason: `LOCAL_MUSIC_DIR 不存在或不是目录：${root}`,
      tracks: []
    };
  }

  const files = await walkAudioFiles(root);
  return {
    configured: true,
    reason: undefined,
    tracks: files.map((file) => toTrack(root, file))
  };
}

export async function resolveLocalTrack(rootDir, trackId) {
  const scan = await scanLocalMusic(rootDir);
  if (!scan.configured) return null;
  return scan.tracks.find((track) => track.id === trackId) || null;
}

export function streamLocalTrack(track) {
  return createReadStream(track.path);
}

export function contentTypeForTrack(track) {
  const ext = extname(track.path).toLowerCase();
  const types = {
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".wav": "audio/wav"
  };
  return types[ext] || "application/octet-stream";
}

async function walkAudioFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkAudioFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && audioExtensions.has(extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }

  return results;
}

function toTrack(root, filePath) {
  const relativePath = filePath.slice(root.length + 1);
  const id = `local-${createHash("sha1").update(relativePath).digest("hex").slice(0, 16)}`;
  const filename = relativePath.replace(/\\/g, "/").split("/").pop() || relativePath;
  const title = filename.replace(/\.[^.]+$/, "");

  return {
    id,
    title,
    artist: "本地音乐",
    album: "Local Library",
    duration: null,
    source: "local",
    playable: true,
    path: filePath,
    relativePath,
    streamUrl: `/api/tracks/${encodeURIComponent(id)}/stream`,
    tags: ["local"]
  };
}
