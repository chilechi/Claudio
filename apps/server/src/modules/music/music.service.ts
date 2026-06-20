import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { selectActiveLibrary } from "../../../../../packages/core/dist/index.js";
import { activeLibrarySchema, trackSchema } from "../../../../../packages/shared/dist/index.js";
import type { ActiveLibrary, Track } from "../../../../../packages/shared/src/index.js";
import { ConfigService } from "../config/config.service.js";
import { StateService } from "../state/state.service.js";
import { LocalMusicProvider } from "./providers/local-music.provider.js";
import { NeteaseProvider } from "./providers/netease.provider.js";

@Injectable()
export class MusicService {
  constructor(
    private readonly config: ConfigService,
    private readonly localMusic: LocalMusicProvider,
    private readonly netease: NeteaseProvider,
    private readonly state: StateService
  ) {}

  async scanLocalMusic() {
    return this.localMusic.scan(this.config.env.LOCAL_MUSIC_DIR);
  }

  async activeLibrary(): Promise<ActiveLibrary> {
    const local = await this.localMusic.scan(this.config.env.LOCAL_MUSIC_DIR);
    const imported = await this.loadImportedLibrary();
    return activeLibrarySchema.parse(selectActiveLibrary({
      selection: this.config.env.MUSIC_SOURCE,
      local: {
        configured: local.configured,
        reason: local.reason,
        source: { name: "本地音乐目录", type: "local" },
        tracks: local.tracks
      },
      netease: {
        configured: true,
        source: { ...imported.source, type: "netease" },
        tracks: imported.tracks,
        reason: imported.fallbackReason
      }
    }));
  }

  async neteaseStatus() {
    return {
      configured: Boolean(this.config.env.NETEASE_PLAYLIST_ID),
      reason: this.config.env.NETEASE_PLAYLIST_ID ? undefined : "缺少 NETEASE_PLAYLIST_ID",
      playlistId: this.config.env.NETEASE_PLAYLIST_ID || null
    };
  }

  async importNeteasePlaylist(playlistId: string) {
    const result = await this.netease.fetchPlaylist({
      playlistId,
      apiBaseUrl: this.config.env.NETEASE_API_BASE_URL,
      cookie: this.config.env.NETEASE_COOKIE
    });
    return {
      ...result,
      imported: 0,
      note: "Nest 服务当前只读取网易云元数据，不写入数据库；真实导入会在状态/SQLite 统一后接入。"
    };
  }

  async resolveLocalTrack(trackId: string) {
    return this.localMusic.resolveTrack(this.config.env.LOCAL_MUSIC_DIR, trackId);
  }

  async streamLocalTrack(track: Awaited<ReturnType<LocalMusicProvider["resolveTrack"]>>, options?: { start?: number; end?: number }) {
    if (!track) return null;
    return {
      stream: this.localMusic.stream(track, options),
      contentType: this.localMusic.contentType(track),
      size: await this.localMusic.size(track)
    };
  }

  async recordPlayerEvent(body: unknown) {
    return this.state.recordPlayerEvent(body);
  }

  private async loadImportedLibrary(): Promise<ActiveLibrary> {
    const filePath = join(this.config.rootDir, "data", "library.json");
    const content = await readFile(filePath, "utf8");
    const raw = JSON.parse(content.replace(/^\uFEFF/, ""));
    const source = {
      ...(raw.source || { name: "网易云歌单" }),
      type: "netease" as const
    };
    const tracks = (raw.tracks || []).map((track: any) => normalizeTrack(track, "netease"));
    return activeLibrarySchema.parse({
      source,
      tracks,
      fallbackReason: "网易云当前作为歌单元数据和口味来源；真实播放仍需要本地音频或后续播放适配。"
    });
  }
}

function normalizeTrack(track: any, fallbackSource: Track["source"]) {
  const duration = typeof track.duration === "number" ? track.duration : undefined;
  const durationText = typeof track.duration === "string" ? track.duration : track.durationText;
  return trackSchema.parse({
    ...track,
    duration,
    durationText: durationText || undefined,
    source: track.source || fallbackSource,
    playable: typeof track.playable === "boolean" ? track.playable : false,
    tags: Array.isArray(track.tags) ? track.tags : []
  });
}
