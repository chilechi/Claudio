import { applySchema, databasePath, openDatabase, readJson } from "./db-common.js";

const db = openDatabase();
applySchema(db);

const library = readJson("data/library.json");
const state = readJson("data/state.json");

const insertTrack = db.prepare(`
  INSERT INTO tracks (id, title, artist, album, duration_text, source, source_id, playable, tags_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    artist = excluded.artist,
    album = excluded.album,
    duration_text = excluded.duration_text,
    tags_json = excluded.tags_json,
    updated_at = CURRENT_TIMESTAMP
`);

const insertPlaylist = db.prepare(`
  INSERT INTO playlists (id, name, source, source_id)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    source = excluded.source,
    source_id = excluded.source_id
`);

const insertPlaylistTrack = db.prepare(`
  INSERT INTO playlist_tracks (playlist_id, track_id, position)
  VALUES (?, ?, ?)
  ON CONFLICT(playlist_id, track_id) DO UPDATE SET position = excluded.position
`);

const insertPreference = db.prepare(`
  INSERT INTO preferences (key, value_json, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP
`);

const insertMemory = db.prepare("INSERT INTO memories (content) VALUES (?)");
const insertEvent = db.prepare("INSERT INTO play_events (track_id, event_type, detail_json) VALUES (?, ?, ?)");

function importData() {
  db.exec("BEGIN");
  try {
  const playlistId = library.source?.playlistId ? `netease-${library.source.playlistId}` : "imported-v1";
  insertPlaylist.run(playlistId, library.source?.name || "v1 imported library", "netease", library.source?.playlistId || null);

  library.tracks.forEach((track, index) => {
    insertTrack.run(
      track.id,
      track.title,
      track.artist,
      track.album || null,
      track.duration || null,
      "netease",
      track.id,
      0,
      JSON.stringify(track.tags || [])
    );
    insertPlaylistTrack.run(playlistId, track.id, index + 1);
  });

  insertPreference.run("mode", JSON.stringify(state.mode || "night"));
  insertPreference.run("currentTrackId", JSON.stringify(state.currentTrackId || null));
  insertPreference.run("queue", JSON.stringify(state.queue || []));
  insertPreference.run("liked", JSON.stringify(state.liked || []));
  insertPreference.run("skipped", JSON.stringify(state.skipped || []));

  for (const memory of state.memories || []) {
    insertMemory.run(memory);
  }
  for (const trackId of state.liked || []) {
    insertEvent.run(trackId, "like", "{}");
  }
  for (const trackId of state.skipped || []) {
    insertEvent.run(trackId, "skip", "{}");
  }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

importData();
db.close();

console.log(`v1 数据已导入 SQLite：${databasePath()}`);
