export type RuntimeIntent =
  | { action: "next"; reason: string }
  | { action: "pause"; reason: string }
  | { action: "resume"; reason: string }
  | { action: "volume"; delta: number; reason: string }
  | { action: "speech-only"; reason: string }
  | { action: "program"; reason: string };

export function routeRuntimeIntent(input: string): RuntimeIntent {
  const text = input.trim().toLowerCase();

  if (/下一首|下首|跳过|切歌|next|skip/.test(text)) {
    return { action: "next", reason: "识别为切到下一首" };
  }
  if (/暂停|停一下|先停|pause|stop/.test(text)) {
    return { action: "pause", reason: "识别为暂停播放" };
  }
  if (/继续|播放|接着|resume|play/.test(text)) {
    return { action: "resume", reason: "识别为继续播放" };
  }
  if (/大声|音量大|调高|louder|volume up/.test(text)) {
    return { action: "volume", delta: 0.12, reason: "识别为调高音量" };
  }
  if (/小声|音量小|调低|quieter|volume down/.test(text)) {
    return { action: "volume", delta: -0.12, reason: "识别为调低音量" };
  }
  if (/只说|别换歌|不要换歌|说两句|speech|talk/.test(text)) {
    return { action: "speech-only", reason: "识别为只生成旁白" };
  }

  return { action: "program", reason: "识别为重新组织电台节目" };
}
