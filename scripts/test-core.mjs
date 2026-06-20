import assert from "node:assert/strict";
import {
  buildLocalPlan,
  buildRadioPlan,
  buildTasteProfile,
  inferMode,
  recommendTracks,
  repairDeepSeekPlan,
  selectActiveLibrary
} from "../packages/core/dist/index.js";

const tracks = [
  {
    id: "t1",
    title: "Rain Window",
    artist: "A",
    source: "netease",
    playable: false,
    tags: ["night", "rain", "soft"]
  },
  {
    id: "t2",
    title: "Focus Light",
    artist: "B",
    source: "local",
    playable: true,
    streamUrl: "/api/tracks/t2/stream",
    tags: ["coding", "quiet-groove"]
  },
  {
    id: "t3",
    title: "Bright Start",
    artist: "C",
    source: "local",
    playable: true,
    streamUrl: "/api/tracks/t3/stream",
    tags: ["light", "warm"]
  }
];

assert.equal(inferMode("写代码", 21), "coding");
assert.equal(inferMode("睡前安静一点", 12), "bedtime");

const codingQueue = recommendTracks(tracks, "coding", 2, {});
assert.equal(codingQueue[0].id, "t2");

const clearQueue = recommendTracks(tracks, "clear", 3, {});
const likedClearQueue = recommendTracks(tracks, "clear", 3, { liked: ["t1"], skipped: [] });
assert.ok(likedClearQueue.findIndex((track) => track.id === "t1") < clearQueue.findIndex((track) => track.id === "t1"));

const allSkippedQueue = recommendTracks(tracks, "night", 2, { skipped: tracks.map((track) => track.id) });
assert.equal(allSkippedQueue.length, 2);

const emptyPlan = buildLocalPlan("随便听点", [], {}, 20);
assert.equal(emptyPlan.queue.length, 0);
assert.equal(emptyPlan.aiProvider, "local");

const repaired = repairDeepSeekPlan(
  {
    mode: "night",
    queueIds: ["missing", "t1"],
    reason: "AI returned one unknown id.",
    reply: "先慢一点。"
  },
  tracks,
  {},
  "晚上安静一点",
  3
);
assert.equal(repaired.aiProvider, "deepseek");
assert.equal(repaired.queue[0].id, "t1");
assert.equal(repaired.queue.length, 3);
assert.ok(!repaired.queue.some((track) => track.id === "missing"));

const taste = buildTasteProfile(tracks, { liked: ["t1"], skipped: ["t2"], memories: ["温柔克制"] });
assert.equal(taste.likedCount, 1);
assert.equal(taste.skippedCount, 1);
assert.ok(taste.topTags.some((item) => item.tag === "night" && item.count >= 4));

const radio = buildRadioPlan({ tracks, state: { skipped: ["t2"] }, hour: 21, count: 2 });
assert.equal(radio.mode, "evening");
assert.ok(radio.queue.every((track) => track.id !== "t2"));

const local = {
  configured: true,
  source: { name: "本地音乐", type: "local" },
  tracks: tracks.filter((track) => track.source === "local")
};
const netease = {
  configured: true,
  source: { name: "网易云歌单", type: "netease", playlistId: "7637838720" },
  tracks: tracks.filter((track) => track.source === "netease")
};

assert.equal(selectActiveLibrary({ selection: "auto", local, netease }).source.type, "local");
assert.equal(selectActiveLibrary({ selection: "local", local: { ...local, tracks: [] }, netease }).tracks.length, 0);
assert.equal(selectActiveLibrary({ selection: "netease", local, netease }).source.type, "netease");
assert.ok(selectActiveLibrary({ selection: "netease", local, netease }).fallbackReason?.includes("网易云"));

console.log(JSON.stringify({ pass: true, checks: 13 }, null, 2));
