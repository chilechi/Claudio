import type { FormEvent } from "react";
import type { QueuePlan } from "@claudio/shared";
import type { RuntimeSnapshot } from "../../lib/types";

export function ChatPanel(props: {
  plan: QueuePlan | null;
  message: string;
  chatInput: string;
  setChatInput: (value: string) => void;
  submitChat: (event: FormEvent) => void;
  radioHostEnabled: boolean;
  setRadioHostEnabled: (value: boolean) => void;
  runtime: RuntimeSnapshot | null;
  runtimeBusy: boolean;
  startRuntime: () => void;
  stopRuntime: () => void;
}) {
  return (
    <section className="panel chat-panel">
      <p className="panel-label">CLAUDIO</p>
      <div className="reply">{props.message || props.plan?.reply || "正在读取 Claudio 的回应。"}</div>
      <form className="composer" onSubmit={props.submitChat}>
        <input value={props.chatInput} onChange={(event) => props.setChatInput(event.target.value)} placeholder="比如：今晚想听安静一点 / 适合写代码的 / 有点 emo 但别太丧" />
        <button type="button" title="切换电台旁白" onClick={() => props.setRadioHostEnabled(!props.radioHostEnabled)}>旁白</button>
        <button type="submit">发送</button>
      </form>
      <div className="runtime-actions">
        <button type="button" onClick={props.runtime?.running ? props.stopRuntime : props.startRuntime} disabled={props.runtimeBusy}>
          {props.runtime?.running ? "停止电台" : "开始电台"}
        </button>
        <span>{props.runtime?.running ? `直播中 · ${props.runtime.sessionTitle || "自由电台"}` : "待命 · 可以先开播，也可以直接输入一句气氛"}</span>
      </div>
      <div className="quick-actions">
        {["夜晚", "写代码", "Emo", "睡前"].map((label) => <button key={label} type="button" onClick={() => props.setChatInput(label)}>{label}</button>)}
      </div>
    </section>
  );
}
