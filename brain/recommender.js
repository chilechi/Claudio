export function inferMode(input = "", hour = new Date().getHours()) {
  const text = input.toLowerCase();

  if (/(睡|困|晚安|睡前|休息)/.test(text)) return "bedtime";
  if (/(代码|写|工作|学习|专注|focus|coding)/.test(text)) return "coding";
  if (/(emo|难过|低落|失恋|丧|不开心|想哭)/.test(text)) return "emo";
  if (/(清醒|振作|起床|上午|明亮)/.test(text)) return "clear";
  if (/(雨|晚上|夜|安静|慢|轻一点)/.test(text)) return "night";

  if (hour >= 23 || hour < 6) return "bedtime";
  if (hour >= 19) return "night";
  if (hour >= 9 && hour <= 17) return "coding";
  return "night";
}

const modeTags = {
  coding: ["coding", "quiet-groove", "groove", "rnb", "soft"],
  night: ["night", "rain", "soft", "wind", "gentle"],
  emo: ["emo", "ballad", "rain", "memory", "soft"],
  bedtime: ["bedtime", "quiet", "soft", "dream", "wind"],
  clear: ["light", "groove", "band", "rnb", "warm"]
};

export function recommendTracks(tracks, mode, count = 5, state = {}) {
  const desiredTags = modeTags[mode] || modeTags.night;
  const skipped = new Set(state.skipped || []);
  const liked = new Set(state.liked || []);

  return [...tracks]
    .filter((track) => !skipped.has(track.id))
    .map((track) => {
      const tags = new Set(track.tags || []);
      const tagScore = desiredTags.reduce((sum, tag) => sum + (tags.has(tag) ? 2 : 0), 0);
      const likeScore = liked.has(track.id) ? 3 : 0;
      const score = tagScore + likeScore;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title, "zh-Hans-CN"))
    .slice(0, count)
    .map(({ track }) => track);
}

export function reasonForMode(mode) {
  const reasons = {
    coding: "低干扰、有一点律动，适合放在后台。",
    night: "偏夜晚和雨天质感，情绪在，但不会太重。",
    emo: "承认低落感，但避免继续下沉。",
    bedtime: "刺激少，编曲轻，适合慢慢收尾。",
    clear: "稍微更明亮，帮助状态回到清醒。"
  };
  return reasons[mode] || reasons.night;
}

export function localReply(mode, tracks) {
  const names = tracks.slice(0, 3).map((track) => `《${track.title.replace(/\s*\(.+?\)/g, "")}》`);
  const joined = names.join("、");

  // 这里保持 Claudio 的克制语气：不称呼用户，不解释太多，只把队列轻轻摆好。
  const replies = {
    coding: `先把声音放低一点。\n${joined} 会比较稳，不太抢注意力。`,
    night: `今晚适合慢一点。\n先从 ${joined} 开始，留一点空间给你。`,
    emo: `先不急着把情绪推开。\n${joined} 这几首会接得比较顺。`,
    bedtime: `现在不放太满的歌。\n${joined} 会轻一些，适合慢慢收尾。`,
    clear: `可以稍微亮一点，但不吵。\n先用 ${joined} 把状态抬起来。`
  };

  return replies[mode] || replies.night;
}

export function buildPlan(input, tracks, state = {}) {
  const mode = inferMode(input);
  const queue = recommendTracks(tracks, mode, 5, state);

  return {
    mode,
    queue,
    reply: localReply(mode, queue),
    reason: reasonForMode(mode)
  };
}
