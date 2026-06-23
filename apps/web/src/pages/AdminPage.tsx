import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DiagnosticsResponse } from "@claudio/shared";
import { api } from "../lib/api";
import type { LocalScanResponse } from "../lib/types";
import { useRadio } from "../context/RadioProvider";
import { DiagnosticsPanel } from "../components/admin/DiagnosticsPanel";
import { LocalLibraryPanel } from "../components/admin/LocalLibraryPanel";
import { VoiceConfigPanel } from "../components/admin/VoiceConfigPanel";

export default function AdminPage() {
  const radio = useRadio();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [localScan, setLocalScan] = useState<LocalScanResponse | null>(null);
  const [adminErrors, setAdminErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootAdmin() {
      const [settings, localMusic] = await Promise.allSettled([
        api<DiagnosticsResponse>("/api/settings/diagnostics"),
        api<LocalScanResponse>("/api/music/local/scan")
      ]);

      if (cancelled) return;

      if (settings.status === "fulfilled") setDiagnostics(settings.value);
      else setAdminErrors((items) => [...items, `配置诊断失败：${settings.reason instanceof Error ? settings.reason.message : "未知错误"}`]);

      if (localMusic.status === "fulfilled") setLocalScan(localMusic.value);
      else setAdminErrors((items) => [...items, `本地歌库扫描失败：${localMusic.reason instanceof Error ? localMusic.reason.message : "未知错误"}`]);

      setLoading(false);
    }

    bootAdmin();
    return () => { cancelled = true; };
  }, []);

  const allErrors = [...radio.errors, ...adminErrors];

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Claudio 管理后台</p>
          <h1>配置与诊断</h1>
        </div>
        <Link to="/" className="admin-back">← 返回电台</Link>
      </header>

      {loading ? (
        <p className="empty-note">正在读取配置信息…</p>
      ) : null}

      <section className="admin-grid">
        <VoiceConfigPanel
          voiceStatus={radio.voiceStatus}
          radioHostEnabled={radio.radioHostEnabled}
          setRadioHostEnabled={radio.setRadioHostEnabled}
          runtime={radio.runtime}
        />
        <LocalLibraryPanel localScan={localScan} />
      </section>

      <DiagnosticsPanel
        diagnostics={diagnostics}
        summary={diagnostics?.summary}
        errors={allErrors}
      />
    </main>
  );
}
