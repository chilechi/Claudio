import type { RadioPlan } from "../../lib/types";

export function TodayPlanPanel({ radio, reason }: { radio: RadioPlan | null; reason: string }) {
  return (
    <div className="panel">
      <p className="panel-label">今日计划</p>
      <p className="reason">{reason}</p>
      <div className="routine-segments">
        <div className="routine-item"><strong>{radio?.slot?.label || radio?.mode || "读取中"}</strong><span>{radio?.slot?.prompt || radio?.reply || "正在生成。"}</span></div>
        <div className="routine-item"><strong>日历</strong><span>{radio?.calendar?.configured ? "已连接" : radio?.calendar?.reason || "未连接"}</span></div>
      </div>
    </div>
  );
}
