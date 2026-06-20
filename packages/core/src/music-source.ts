import type { ActiveLibrary, MusicSourceSelection, Track } from "../../shared/src/index.js";

export type MusicLibraryCandidate = {
  configured: boolean;
  source: ActiveLibrary["source"];
  tracks: Track[];
  reason?: string;
};

export function selectActiveLibrary({
  selection,
  local,
  netease
}: {
  selection: MusicSourceSelection;
  local: MusicLibraryCandidate;
  netease: MusicLibraryCandidate;
}): ActiveLibrary {
  if (selection === "local") {
    return withSelection(local, selection, local.tracks.length ? undefined : local.reason || "MUSIC_SOURCE=local，但本地没有可播放音频。");
  }

  if (selection === "netease") {
    return withSelection(
      netease,
      selection,
      "网易云当前作为歌单元数据和口味来源；真实播放仍需要本地音频或后续播放适配。"
    );
  }

  if (local.configured && local.tracks.length) {
    return withSelection(local, selection);
  }

  return withSelection(
    netease,
    selection,
    netease.tracks.length
      ? "MUSIC_SOURCE=auto，未找到本地可播放音频，当前使用网易云歌单元数据。"
      : netease.reason || local.reason || "没有可用音乐源。"
  );
}

function withSelection(candidate: MusicLibraryCandidate, selected: MusicSourceSelection, fallbackReason?: string): ActiveLibrary {
  return {
    source: {
      ...candidate.source,
      selected
    },
    tracks: candidate.tracks,
    fallbackReason
  };
}
