const routineSlots = [
  {
    id: "morning",
    label: "上午醒神",
    hours: [6, 7, 8, 9, 10, 11],
    tags: ["light", "warm", "groove", "mandopop"],
    prompt: "轻一点启动，不抢注意力。"
  },
  {
    id: "lunch",
    label: "午休韩语",
    hours: [12, 13],
    tags: ["soft", "quiet", "dream", "rnb"],
    prompt: "把速度放慢，适合吃饭或短暂离线。"
  },
  {
    id: "meeting",
    label: "会议间歇",
    hours: [14, 15, 16],
    tags: ["coding", "quiet-groove", "soft"],
    prompt: "背景感更强，保留一点律动。"
  },
  {
    id: "sport",
    label: "运动心率",
    hours: [17, 18],
    tags: ["groove", "band", "light"],
    prompt: "节奏稍微往前一点，但不做亢奋歌单。"
  },
  {
    id: "evening",
    label: "晚间冥想",
    hours: [19, 20, 21, 22],
    tags: ["night", "rain", "wind", "gentle"],
    prompt: "留白多一些，适合把一天慢慢收下来。"
  },
  {
    id: "night",
    label: "夜尾",
    hours: [23, 0, 1, 2, 3, 4, 5],
    tags: ["bedtime", "quiet", "soft", "dream"],
    prompt: "低刺激，慢收尾，不把情绪推高。"
  }
];

const fallbackSlot = routineSlots.find((slot) => slot.id === "evening");

export function routineForHour(hour = new Date().getHours()) {
  const normalized = Number(hour);
  return routineSlots.find((slot) => slot.hours.includes(normalized)) || fallbackSlot;
}

export function buildTasteProfile(tracks = [], state = {}) {
  const tagCounts = new Map();
  const artistCounts = new Map();
  const liked = new Set(state.liked || []);
  const skipped = new Set(state.skipped || []);

  for (const track of tracks) {
    const weight = (liked.has(track.id) ? 4 : 1) - (skipped.has(track.id) ? 2 : 0);
    if (weight <= 0) continue;

    for (const tag of track.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight);
    }
    if (track.artist) {
      artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + weight);
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
    .slice(0, 5)
    .map(([artist, count]) => ({ artist, count }));

  return {
    likedCount: liked.size,
    skippedCount: skipped.size,
    topTags,
    topArtists,
    memories: state.memories || []
  };
}

function scoreTrack(track, slot, profile, state = {}) {
  const tags = new Set(track.tags || []);
  const liked = new Set(state.liked || []);
  const skipped = new Set(state.skipped || []);
  const profileTags = new Map((profile.topTags || []).map((item) => [item.tag, item.count ?? item.score ?? 0]));

  if (skipped.has(track.id)) return -100;

  let score = liked.has(track.id) ? 8 : 0;
  for (const tag of slot.tags) {
    if (tags.has(tag)) score += 3;
  }
  for (const [tag, weight] of profileTags) {
    if (tags.has(tag)) score += Math.min(weight, 5);
  }
  return score;
}

export function buildRadioPlan({ tracks = [], state = {}, hour = new Date().getHours(), count = 6 } = {}) {
  const slot = routineForHour(hour);
  const profile = buildTasteProfile(tracks, state);
  const queue = [...tracks]
    .map((track) => ({ track, score: scoreTrack(track, slot, profile, state) }))
    .filter((item) => item.score > -100)
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title, "zh-Hans-CN"))
    .slice(0, count)
    .map((item) => item.track);

  const topTags = profile.topTags.slice(0, 3).map((item) => item.tag);
  const reasonParts = [
    `${slot.label}：${slot.prompt}`,
    topTags.length ? `口味权重来自 ${topTags.join(" / ")}。` : "还没有足够播放反馈，先按当前歌库标签推荐。",
    state.skipped?.length ? "已避开最近跳过的歌曲。" : "暂无跳过记录。"
  ];

  return {
    mode: slot.id,
    slot,
    queue,
    profile,
    calendar: {
      configured: false,
      reason: "尚未接入日历 provider，当前仅使用本地时间段规则。"
    },
    reason: reasonParts.join(" "),
    reply: `${slot.label}，先这样排一轮。\n${slot.prompt}`
  };
}

export function allRoutineSlots() {
  return routineSlots;
}
