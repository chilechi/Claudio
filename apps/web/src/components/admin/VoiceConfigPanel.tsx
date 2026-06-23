import type { VoiceStatus, RuntimeSnapshot } from "../../lib/types";

export function VoiceConfigPanel(props: {
  voiceStatus: VoiceStatus | null;
  radioHostEnabled: boolean;
  setRadioHostEnabled: (value: boolean) => void;
  runtime: RuntimeSnapshot | null;
}) {
  const voiceDetail = props.voiceStatus?.audioSupported
    ? `真实 TTS：${props.voiceStatus.provider}`
    : "浏览器语音回退";

  return (
    <div className="panel">
      <p className="panel-label">电台旁白</p>
      <label className="voice-toggle">
        <input type="checkbox" checked={props.radioHostEnabled} onChange={(event) => props.setRadioHostEnabled(event.target.checked)} />
        <span>让 Claudio 自己解读歌曲</span>
      </label>
      <p className="tiny">{voiceDetail}</p>
      {props.voiceStatus ? (
        <p className="tiny">
          状态：{props.voiceStatus.state} · {props.voiceStatus.configured ? "已配置" : "未配置"}
          {props.voiceStatus.reason ? ` · ${props.voiceStatus.reason}` : ""}
        </p>
      ) : null}
      <p className="tiny">
        {props.runtime?.running ? `正在播出：${props.runtime.sessionTitle || "自由电台"}` : "电台未开播，仍可手动播放。"}
        {props.runtime?.jobs?.length ? ` · 队列任务 ${props.runtime.jobs.length}` : ""}
      </p>
    </div>
  );
}
