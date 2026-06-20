import type { State, TasteProfile, Track } from "../../shared/src/index.js";

export type TasteState = Partial<Pick<State, "liked" | "skipped" | "memories">>;

export function buildTasteProfile(tracks: Track[] = [], state: TasteState = {}): TasteProfile {
  const tagCounts = new Map<string, number>();
  const artistCounts = new Map<string, number>();
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

  return {
    likedCount: liked.size,
    skippedCount: skipped.size,
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count })),
    topArtists: [...artistCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
      .slice(0, 5)
      .map(([artist, count]) => ({ artist, count })),
    memories: state.memories || []
  };
}
