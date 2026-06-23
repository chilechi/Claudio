import type { DiagnosticsResponse } from "@claudio/shared";
import { statusLabel } from "../../lib/utils";

export function DiagnosticsPanel({ diagnostics, summary, errors }: { diagnostics: DiagnosticsResponse | null; summary?: DiagnosticsResponse["summary"]; errors: string[] }) {
  return (
    <section className="panel diagnostics-panel">
      <p className="panel-label">配置诊断</p>
      <div className="settings-summary">
        <span>可用 {summary?.ready || 0}</span>
        <span>回退 {summary?.fallback || 0}</span>
        <span>缺少 {summary?.missing || 0}</span>
        <span>{diagnostics?.secretPolicy || "不展示密钥原文"}</span>
      </div>
      {!diagnostics ? <p className="empty-note">正在读取配置诊断。若长时间没有结果，请检查后端是否启动。</p> : null}
      {errors.length ? (
        <div className="error-list" aria-label="当前错误">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      ) : null}
      <div className="provider-list">
        {(diagnostics?.providers || []).map((provider) => (
          <article className={`provider-item ${provider.state}`} key={provider.id}>
            <strong>{provider.label}</strong>
            <span>{statusLabel(provider.state)}</span>
            <p>{provider.detail || provider.reason || "已配置"}</p>
            <small>{(provider.envVars || []).join(" / ") || "无需配置"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
