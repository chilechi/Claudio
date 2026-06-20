import { Injectable } from "@nestjs/common";
import type { Track } from "../../../../../../packages/shared/src/index.js";

@Injectable()
export class NeteaseProvider {
  async fetchPlaylist({ playlistId, apiBaseUrl, cookie }: { playlistId?: string; apiBaseUrl?: string; cookie?: string }) {
    if (!playlistId) {
      return {
        configured: false,
        reason: "缺少 NETEASE_PLAYLIST_ID",
        tracks: [] as Track[]
      };
    }

    const endpoint = apiBaseUrl
      ? `${apiBaseUrl.replace(/\/$/, "")}/playlist/detail?id=${encodeURIComponent(playlistId)}`
      : `https://music.163.com/api/playlist/detail?id=${encodeURIComponent(playlistId)}`;

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 Claudio/0.3",
        Referer: "https://music.163.com/",
        ...(cookie ? { Cookie: cookie } : {})
      }
    }).catch((error) => error instanceof Error ? error : new Error(String(error)));

    if (response instanceof Error) {
      return {
        configured: true,
        reason: `网易云元数据请求失败：${response.message}`,
        tracks: [] as Track[],
        endpoint
      };
    }

    if (!response.ok) {
      return {
        configured: true,
        reason: `网易云元数据请求失败：${response.status}`,
        tracks: [] as Track[],
        endpoint
      };
    }

    const data = await response.json();
    const playlist = data.playlist || data.result;
    const rawTracks = playlist?.tracks || [];

    if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
      return {
        configured: true,
        reason: "网易云返回为空，可能需要 Cookie 或歌单不可访问。",
        tracks: [] as Track[],
        endpoint
      };
    }

    return {
      configured: true,
      playlist: {
        id: String(playlist.id || playlistId),
        name: playlist.name || `网易云歌单 ${playlistId}`,
        source: "netease"
      },
      tracks: rawTracks.map(toTrack),
      endpoint
    };
  }
}

function toTrack(track: any): Track & { sourceId: string } {
  const artists = track.artists || track.ar || [];
  const album = track.album || track.al || {};
  const id = String(track.id);

  return {
    id: `netease-${id}`,
    sourceId: id,
    title: track.name || "未命名歌曲",
    artist: artists.map((item: any) => item.name).filter(Boolean).join(", ") || "未知歌手",
    album: album.name || "",
    durationText: typeof track.duration === "number" ? millisecondsToText(track.duration) : typeof track.dt === "number" ? millisecondsToText(track.dt) : null,
    source: "netease",
    playable: false,
    tags: ["netease"]
  };
}

function millisecondsToText(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
