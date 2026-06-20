import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import type { Track } from "../../../../../../packages/shared/src/index.js";

const audioExtensions = new Set([".mp3", ".flac", ".wav", ".m4a", ".aac", ".ogg", ".opus"]);

export type LocalTrack = Track & {
  path: string;
  relativePath: string;
};

@Injectable()
export class LocalMusicProvider {
  async scan(rootDir?: string) {
    if (!rootDir) {
      return {
        configured: false,
        reason: "缺少 LOCAL_MUSIC_DIR",
        tracks: [] as LocalTrack[]
      };
    }

    const root = resolve(rootDir);
    const rootStat = await stat(root).catch(() => null);
    if (!rootStat?.isDirectory()) {
      return {
        configured: false,
        reason: `LOCAL_MUSIC_DIR 不存在或不是目录：${root}`,
        tracks: [] as LocalTrack[]
      };
    }

    const files = await walkAudioFiles(root);
    return {
      configured: true,
      tracks: files.map((file) => toTrack(root, file))
    };
  }

  async resolveTrack(rootDir: string | undefined, trackId: string) {
    const scan = await this.scan(rootDir);
    if (!scan.configured) return null;
    return scan.tracks.find((track) => track.id === trackId) || null;
  }

  stream(track: LocalTrack) {
    return createReadStream(track.path);
  }

  contentType(track: LocalTrack) {
    const ext = extname(track.path).toLowerCase();
    const types: Record<string, string> = {
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
}

async function walkAudioFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];

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

function toTrack(root: string, filePath: string): LocalTrack {
  const relativePath = filePath.slice(root.length + 1);
  const id = `local-${createHash("sha1").update(relativePath).digest("hex").slice(0, 16)}`;
  const filename = relativePath.replace(/\\/g, "/").split("/").pop() || relativePath;

  return {
    id,
    title: filename.replace(/\.[^.]+$/, ""),
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
