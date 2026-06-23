import type { ActiveLibrary } from "@claudio/shared";

export function providerLabel(provider?: string) {
  return provider === "deepseek" ? "DeepSeek 脑" : "本地规则脑";
}

export function sourceLabel(source?: ActiveLibrary["source"]) {
  const selected = source?.selected || "auto";
  const type = source?.type || "imported";
  const selectedLabel = { auto: "自动", local: "本地", netease: "网易云" }[selected] || selected;
  const typeLabel = { local: "本地音乐", netease: "网易云歌单", imported: "导入歌库" }[type] || type;
  return `${selectedLabel} · ${typeLabel}`;
}

export function statusLabel(state: string) {
  return { ready: "可用", fallback: "回退", missing: "缺少", error: "错误" }[state] || state;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function playbackErrorMessage(error?: unknown) {
  const detail = error instanceof Error && error.name ? `（${error.name}）` : "";
  return `当前曲目播放失败${detail}，请检查音频文件或浏览器播放权限。`;
}
