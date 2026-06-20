import type { DeepSeekPlan, QueuePlan, State, Track } from "../../shared/src/index.js";

export const modeTags = {
  coding: ["coding", "quiet-groove", "groove", "rnb", "soft"],
  night: ["night", "rain", "soft", "wind", "gentle"],
  emo: ["emo", "ballad", "rain", "memory", "soft"],
  bedtime: ["bedtime", "quiet", "soft", "dream", "wind"],
  clear: ["light", "groove", "band", "rnb", "warm"]
} as const;

export type PlanMode = keyof typeof modeTags;
export type RecommendationState = Pick<State, "liked" | "skipped"> | Partial<Pick<State, "liked" | "skipped">>;

export function inferMode(input = "", hour = 20): PlanMode {
  const text = input.toLowerCase();

  if (/(睡觉|晚安|睡前|休息|bedtime)/i.test(text)) return "bedtime";
  if (/(代码|写作|工作|学习|专注|focus|coding)/i.test(text)) return "coding";
  if (/(emo|难过|低落|失恋|不开心|想哭)/i.test(text)) return "emo";
  if (/(清醒|振作|起床|上午|明亮)/i.test(text)) return "clear";
  if (/(雨|晚上|夜|安静|慢|轻一点)/i.test(text)) return "night";

  if (hour >= 23 || hour < 6) return "bedtime";
  if (hour >= 19) return "night";
  if (hour >= 9 && hour <= 17) return "coding";
  return "night";
}

export function recommendTracks(
  tracks: Track[],
  mode: string,
  count = 5,
  state: RecommendationState = {}
): Track[] {
  if (!tracks.length || count <= 0) return [];

  const desiredTags = modeTags[mode as PlanMode] || modeTags.night;
  const liked = new Set(state.liked || []);
  const skipped = new Set(state.skipped || []);
  const scored = tracks.map((track, index) => {
    const tags = new Set(track.tags || []);
    const tagScore = desiredTags.reduce((sum, tag) => sum + (tags.has(tag) ? 2 : 0), 0);
    const likeScore = liked.has(track.id) ? 3 : 0;
    const skipPenalty = skipped.has(track.id) ? 100 : 0;
    return { track, index, score: tagScore + likeScore - skipPenalty };
  });

  const nonSkipped = scored.filter((item) => !skipped.has(item.track.id));
  const candidates = nonSkipped.length ? nonSkipped : scored;

  return candidates
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title, "zh-Hans-CN") || a.index - b.index)
    .slice(0, count)
    .map((item) => item.track);
}

export function reasonForMode(mode: string): string {
  const reasons: Record<PlanMode, string> = {
    coding: "低干扰、有一点律动，适合放在后台。",
    night: "偏夜晚和雨天质感，情绪在，但不会太重。",
    emo: "承认低落感，但避免继续下沉。",
    bedtime: "刺激少，编曲轻，适合慢慢收尾。",
    clear: "稍微更明亮，帮助状态回到清醒。"
  };
  return reasons[mode as PlanMode] || reasons.night;
}

export function localReply(mode: string, tracks: Track[]): string {
  if (!tracks.length) return "Claudio 没能读到歌单。先保持安静。";

  const names = tracks.slice(0, 3).map((track) => `《${track.title.replace(/\s*\(.+?\)/g, "")}》`);
  const joined = names.join("、");
  const replies: Record<PlanMode, string> = {
    coding: `先把声音放低一点。\n${joined} 会比较稳，不太抢注意力。`,
    night: `今晚适合慢一点。\n先从 ${joined} 开始，留一点空间。`,
    emo: `先不急着把情绪推开。\n${joined} 这几首会接得比较顺。`,
    bedtime: `现在不放太满的歌。\n${joined} 会轻一些，适合慢慢收尾。`,
    clear: `可以稍微亮一点，但不吵。\n先用 ${joined} 把状态扶起来。`
  };
  return replies[mode as PlanMode] || replies.night;
}

export function buildLocalPlan(input: string, tracks: Track[], state: RecommendationState = {}, hour = 20): QueuePlan {
  const mode = inferMode(input, hour);
  const queue = recommendTracks(tracks, mode, 5, state);
  return {
    mode,
    queue,
    reply: localReply(mode, queue),
    reason: queue.length ? reasonForMode(mode) : "active library 为空，无法生成真实队列。",
    aiProvider: "local"
  };
}

export function repairDeepSeekPlan(
  aiPlan: DeepSeekPlan,
  tracks: Track[],
  state: RecommendationState = {},
  fallbackInput = "",
  count = 5
): QueuePlan {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const knownQueue = aiPlan.queueIds.map((id) => byId.get(id)).filter((track): track is Track => Boolean(track));
  const seen = new Set(knownQueue.map((track) => track.id));
  const fill = recommendTracks(
    tracks.filter((track) => !seen.has(track.id)),
    aiPlan.mode || inferMode(fallbackInput),
    Math.max(0, count - knownQueue.length),
    state
  );
  const queue = [...knownQueue, ...fill].slice(0, count);

  if (!queue.length) {
    return buildLocalPlan(fallbackInput, tracks, state);
  }

  return {
    mode: aiPlan.mode,
    queue,
    reply: aiPlan.reply,
    reason: aiPlan.reason,
    aiProvider: "deepseek"
  };
}
