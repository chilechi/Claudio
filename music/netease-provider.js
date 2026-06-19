import { DatabaseSync } from "node:sqlite";
import { applySchema, databasePath } from "../scripts/db-common.js";

export async function fetchNeteasePlaylist({ playlistId, apiBaseUrl, cookie }) {
  if (!playlistId) {
    return {
      configured: false,
      reason: "缺少 NETEASE_PLAYLIST_ID",
      tracks: []
    };
  }

  const endpoint = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}/playlist/detail?id=${encodeURIComponent(playlistId)}`
    : `https://music.163.com/api/playlist/detail?id=${encodeURIComponent(playlistId)}`;

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0 Claudio/0.2",
      Referer: "https://music.163.com/",
      ...(cookie ? { Cookie: cookie } : {})
    }
  }).catch((error) => ({
    ok: false,
    status: "NETWORK",
    text: async () => error.message
  }));

  if (!response.ok) {
    return {
      configured: true,
      reason: `网易云元数据请求失败：${response.status}`,
      tracks: [],
      endpoint
    };
  }

  const data = await response.json();
  const playlist = data.playlist || data.result;
  const rawTracks = playlist?.tracks || [];

  if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
    return {
      configured: true,
      reason: "网易云返回为空，可能需要 Cookie 或歌单不可访问",
      tracks: [],
      endpoint
    };
  }

  return {
    configured: true,
    reason: undefined,
    playlist: {
      id: String(playlist.id || playlistId),
      name: playlist.name || `网易云歌单 ${playlistId}`,
      source: "netease"
    },
    tracks: rawTracks.map(toTrack),
    endpoint
  };
}

export function importNeteasePlaylistToDb(result) {
  if (!result.configured || !result.tracks?.length) return { imported: 0 };

  const db = new DatabaseSync(databasePath());
  db.exec("PRAGMA foreign_keys = ON");
  applySchema(db);

  const insertTrack = db.prepare(`
    INSERT INTO tracks (id, title, artist, album, duration_text, source, source_id, playable, tags_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      artist = excluded.artist,
      album = excluded.album,
      duration_text = excluded.duration_text,
      source_id = excluded.source_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  const insertPlaylist = db.prepare(`
    INSERT INTO playlists (id, name, source, source_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, source_id = excluded.source_id
  `);
  const insertPlaylistTrack = db.prepare(`
    INSERT INTO playlist_tracks (playlist_id, track_id, position)
    VALUES (?, ?, ?)
    ON CONFLICT(playlist_id, track_id) DO UPDATE SET position = excluded.position
  `);

  db.exec("BEGIN");
  try {
    const playlistId = `netease-${result.playlist.id}`;
    insertPlaylist.run(playlistId, result.playlist.name, "netease", result.playlist.id);
    result.tracks.forEach((track, index) => {
      insertTrack.run(
        track.id,
        track.title,
        track.artist,
        track.album || null,
        track.durationText || null,
        "netease",
        track.sourceId,
        0,
        JSON.stringify(track.tags || [])
      );
      insertPlaylistTrack.run(playlistId, track.id, index + 1);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }

  return { imported: result.tracks.length };
}

function toTrack(track) {
  const artists = track.artists || track.ar || [];
  const album = track.album || track.al || {};
  const id = String(track.id);

  return {
    id: `netease-${id}`,
    sourceId: id,
    title: track.name || "未命名歌曲",
    artist: artists.map((item) => item.name).filter(Boolean).join(", ") || "未知歌手",
    album: album.name || "",
    durationText: typeof track.duration === "number" ? millisecondsToText(track.duration) : typeof track.dt === "number" ? millisecondsToText(track.dt) : null,
    source: "netease",
    playable: false,
    tags: ["netease"]
  };
}

function millisecondsToText(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
