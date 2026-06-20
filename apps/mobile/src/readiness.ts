import { buildLocalPlan, buildTasteProfile } from "../../../packages/core/src/index.js";
import { activeLibrarySchema, diagnosticsResponseSchema, queuePlanSchema, type Track } from "../../../packages/shared/src/index.js";

const tracks: Track[] = [
  {
    id: "mobile-demo-1",
    title: "移动端复用检查",
    artist: "Claudio",
    album: "Readiness",
    source: "local",
    playable: true,
    streamUrl: "/api/tracks/mobile-demo-1/stream",
    tags: ["local", "coding"]
  }
];

export function assertMobileReusableContracts() {
  activeLibrarySchema.parse({
    source: { name: "本地音乐目录", type: "local", selected: "local" },
    tracks
  });

  const plan = buildLocalPlan("适合写代码", tracks, { liked: [], skipped: [] });
  queuePlanSchema.parse(plan);

  const profile = buildTasteProfile(tracks, { liked: ["mobile-demo-1"], skipped: [] });
  diagnosticsResponseSchema.parse({
    providers: [],
    summary: { ready: 0, fallback: 0, missing: 0 },
    secretPolicy: "移动端只消费变量名，不接收密钥原文。"
  });

  return {
    plan,
    profile
  };
}
