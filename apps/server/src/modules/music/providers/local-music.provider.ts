import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import { parseFile } from "music-metadata";
import type { IAudioMetadata, IPicture } from "music-metadata";
import type { Track } from "../../../../../../packages/shared/src/index.js";
import { ConfigService } from "../../config/config.service.js";

const audioExtensions = new Set([".mp3", ".flac", ".wav", ".m4a", ".aac", ".ogg", ".opus"]);

type MetadataQuality = "tag" | "filename" | "manual";

export type LocalTrack = Track & {
  path: string;
  relativePath: string;
  coverKey?: string;
};

type CachedTrack = Omit<LocalTrack, "path"> & {
  cacheKey: string;
  size: number;
  mtimeMs: number;
};

type LocalLibraryCache = {
  version: 1;
  tracks: Record<string, CachedTrack>;
};

@Injectable()
export class LocalMusicProvider {
  private readonly cachePath: string;
  private readonly coverDir: string;

  constructor(config: ConfigService) {
    this.cachePath = join(config.rootDir, "data", "local-library-cache.json");
    this.coverDir = join(config.rootDir, "data", "cache", "covers");
  }

  async scan(rootDir?: string) {
    if (!rootDir) {
      return {
        configured: false,
        reason: "缺少 LOCAL_MUSIC_DIR",
        tracks: [] as LocalTrack[],
        stats: emptyStats()
      };
    }

    const root = resolve(rootDir);
    const rootStat = await stat(root).catch(() => null);
    if (!rootStat?.isDirectory()) {
      return {
        configured: false,
        reason: `LOCAL_MUSIC_DIR 不存在或不是目录：${root}`,
        tracks: [] as LocalTrack[],
        stats: emptyStats()
      };
    }

    const cache = await this.readCache();
    const files = await walkAudioFiles(root);
    const tracks: LocalTrack[] = [];
    let changed = false;

    for (const filePath of files) {
      const fileStat = await stat(filePath);
      const relativePath = toRelativePath(root, filePath);
      const id = localTrackId(relativePath);
      const cacheKey = buildCacheKey(relativePath, fileStat.size, fileStat.mtimeMs);
      const cached = cache.tracks[id];

      if (cached?.cacheKey === cacheKey) {
        tracks.push({ ...cached, path: filePath });
        continue;
      }

      const track = await this.readTrackMetadata(root, filePath, fileStat.size, fileStat.mtimeMs);
      cache.tracks[id] = toCachedTrack(track, cacheKey, fileStat.size, fileStat.mtimeMs);
      tracks.push(track);
      changed = true;
    }

    const liveIds = new Set(tracks.map((track) => track.id));
    for (const id of Object.keys(cache.tracks)) {
      if (!liveIds.has(id)) {
        delete cache.tracks[id];
        changed = true;
      }
    }

    if (changed) await this.writeCache(cache);

    return {
      configured: true,
      tracks,
      stats: buildStats(tracks)
    };
  }

  async resolveTrack(rootDir: string | undefined, trackId: string) {
    const scan = await this.scan(rootDir);
    if (!scan.configured) return null;
    return scan.tracks.find((track) => track.id === trackId) || null;
  }

  stream(track: LocalTrack, options?: { start?: number; end?: number }) {
    return createReadStream(track.path, options);
  }

  async size(track: LocalTrack) {
    return (await stat(track.path)).size;
  }

  contentType(track: LocalTrack) {
    return audioContentType(track.path);
  }

  async resolveCover(coverKey: string) {
    if (!/^[a-f0-9]{40}\.(jpg|jpeg|png|webp|gif)$/i.test(coverKey)) return null;
    const path = join(this.coverDir, coverKey);
    const coverStat = await stat(path).catch(() => null);
    if (!coverStat?.isFile()) return null;
    return {
      stream: createReadStream(path),
      contentType: imageContentType(path),
      size: coverStat.size
    };
  }

  private async readTrackMetadata(root: string, filePath: string, size: number, mtimeMs: number): Promise<LocalTrack> {
    const relativePath = toRelativePath(root, filePath);
    const id = localTrackId(relativePath);
    const filenameTitle = cleanFilenameTitle(basename(filePath, extname(filePath)));
    const fallbackTrack: LocalTrack = {
      id,
      title: filenameTitle,
      artist: "本地音乐",
      album: "Local Library",
      duration: null,
      durationText: null,
      source: "local",
      playable: true,
      path: filePath,
      relativePath,
      streamUrl: `/api/tracks/${encodeURIComponent(id)}/stream`,
      metadataQuality: "filename",
      tags: ["local"]
    };

    const metadata = await parseFile(filePath, { duration: true }).catch(() => null);
    if (!metadata) return fallbackTrack;

    const tagged = metadata.common.title || metadata.common.artist || metadata.common.album;
    const coverKey = await this.writeCover(relativePath, metadata, size, mtimeMs);
    const duration = Number.isFinite(metadata.format.duration) ? metadata.format.duration || null : null;
    const quality: MetadataQuality = tagged ? "tag" : "filename";

    return {
      ...fallbackTrack,
      title: metadata.common.title?.trim() || fallbackTrack.title,
      artist: firstValue(metadata.common.artists) || metadata.common.artist?.trim() || fallbackTrack.artist,
      album: metadata.common.album?.trim() || fallbackTrack.album,
      duration,
      durationText: duration ? formatDuration(duration) : fallbackTrack.durationText,
      coverKey: coverKey || undefined,
      coverUrl: coverKey ? `/api/assets/covers/${encodeURIComponent(coverKey)}` : undefined,
      metadataQuality: quality,
      tags: ["local", quality]
    };
  }

  private async writeCover(relativePath: string, metadata: IAudioMetadata, size: number, mtimeMs: number) {
    const picture = metadata.common.picture?.[0];
    if (!picture) return null;

    const extension = pictureExtension(picture);
    if (!extension) return null;

    await mkdir(this.coverDir, { recursive: true });
    const coverKey = `${createHash("sha1").update(`${relativePath}:${size}:${mtimeMs}:${picture.format}`).digest("hex")}.${extension}`;
    await writeFile(join(this.coverDir, coverKey), picture.data);
    return coverKey;
  }

  private async readCache(): Promise<LocalLibraryCache> {
    const content = await readFile(this.cachePath, "utf8").catch(() => null);
    if (!content) return { version: 1, tracks: {} };
    try {
      const parsed = JSON.parse(content.replace(/^\uFEFF/, ""));
      if (parsed?.version === 1 && parsed.tracks && typeof parsed.tracks === "object") return parsed;
    } catch {
      // Broken cache is safe to discard; it is fully rebuildable from local audio files.
    }
    return { version: 1, tracks: {} };
  }

  private async writeCache(cache: LocalLibraryCache) {
    await mkdir(resolve(this.cachePath, ".."), { recursive: true });
    await writeFile(this.cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
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

  return results.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function toRelativePath(root: string, filePath: string) {
  return relative(root, filePath).replace(/\\/g, "/");
}

function localTrackId(relativePath: string) {
  return `local-${createHash("sha1").update(relativePath).digest("hex").slice(0, 16)}`;
}

function buildCacheKey(relativePath: string, size: number, mtimeMs: number) {
  return createHash("sha1").update(`${relativePath}:${size}:${mtimeMs}`).digest("hex");
}

function toCachedTrack(track: LocalTrack, cacheKey: string, size: number, mtimeMs: number): CachedTrack {
  const { path: _path, ...rest } = track;
  return { ...rest, cacheKey, size, mtimeMs };
}

function emptyStats() {
  return {
    trackCount: 0,
    playableCount: 0,
    taggedCount: 0,
    fallbackFilenameCount: 0
  };
}

function buildStats(tracks: LocalTrack[]) {
  return {
    trackCount: tracks.length,
    playableCount: tracks.filter((track) => track.playable).length,
    taggedCount: tracks.filter((track) => track.metadataQuality === "tag").length,
    fallbackFilenameCount: tracks.filter((track) => track.metadataQuality !== "tag").length
  };
}

function cleanFilenameTitle(raw: string) {
  const normalized = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*\[[^\]]*(?:hash|checksum|uuid|download|obj)[^\]]*\]\s*/gi, " ")
    .replace(/\s*\((?:[a-f0-9]{12,}|copy|\d+)\)\s*/gi, " ")
    .trim();

  const objMatch = /obj\s+wo3DlMOGwrbDjj7DisKw\s+(\d+)/i.exec(normalized);
  if (objMatch) return `本地曲目 ${objMatch[1]}`;

  if (/^obj\s+/i.test(normalized) || /^[a-f0-9]{24,}$/i.test(normalized)) {
    return `本地曲目 ${createHash("sha1").update(raw).digest("hex").slice(0, 6)}`;
  }

  return normalized || "未命名本地曲目";
}

function firstValue(values?: string[]) {
  return values?.map((value) => value.trim()).find(Boolean);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function audioContentType(path: string) {
  const ext = extname(path).toLowerCase();
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

function pictureExtension(picture: IPicture) {
  const format = picture.format.toLowerCase();
  if (format.includes("jpeg") || format.includes("jpg")) return "jpg";
  if (format.includes("png")) return "png";
  if (format.includes("webp")) return "webp";
  if (format.includes("gif")) return "gif";
  return null;
}

function imageContentType(path: string) {
  const ext = extname(path).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}
