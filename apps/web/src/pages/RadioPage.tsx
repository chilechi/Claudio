import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRadio } from "../context/RadioProvider";
import { formatTime, sourceLabel } from "../lib/utils";

const THEMES = [
  { name: "vinyl" as const, label: "黑胶" },
  { name: "midnight" as const, label: "暗夜" },
  { name: "blues" as const, label: "蓝调" },
  { name: "rock" as const, label: "摇滚" },
];

export function RadioPage() {
  const radio = useRadio();
  const track = radio.currentTrack;
  const volumeSegments = Math.round(8 * 0.8);
  const signalActive = radio.runtime?.running ? 5 : radio.playing ? 3 : 1;

  const [expanded, setExpanded] = useState<Set<string>>(new Set(["queue"]));

  // Toggle body.playing class for wave animation speed
  useEffect(() => {
    document.body.classList.toggle("playing", radio.playing);
  }, [radio.playing]);

  const togglePanel = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => expanded.has(id);

  return (
    <>
      {/* Wave Background */}
      <div className="wave-bg" aria-hidden="true">
        <div className="wave-layer" />
        <div className="wave-layer" />
        <div className="wave-layer" />
      </div>

      <main className="shell">
        {/* ── Topbar ── */}
        <header className="topbar">
          <div>
            <p className="eyebrow">个人 AI 电台</p>
            <h1>Claudio</h1>
          </div>
          <div className="status-strip">
            <span>{radio.provider}</span>
            <span>{radio.plan?.mode || "读取中"}</span>
            <span>{sourceLabel(radio.library?.source)}</span>
            {!radio.appInstalled && radio.installPrompt ? (
              <button className="theme-toggle" type="button" onClick={radio.installApp}>安装</button>
            ) : null}
            <div className="theme-switcher" role="radiogroup" aria-label="主题切换">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  className={`theme-dot ${radio.theme === t.name ? "active" : ""}`}
                  data-theme={t.name}
                  role="radio"
                  aria-checked={radio.theme === t.name}
                  aria-label={t.label}
                  title={t.label}
                  onClick={() => radio.setTheme(t.name)}
                />
              ))}
            </div>
            <Link to="/admin" className="admin-link">管理</Link>
          </div>
        </header>

        {/* ── Workspace ── */}
        <section className="workspace">
          {/* Left: Vinyl Record + Track Info */}
          <div className="cover-zone">
            <div className={`vinyl-record ${radio.playing ? "spinning" : ""}`} aria-hidden="true">
              <div className="vinyl-grooves" />
              <div className="vinyl-shine" />
              <div className="vinyl-label">
                {track?.coverUrl
                  ? <img src={track.coverUrl} alt="" />
                  : <span className="vinyl-label-text">{track?.artist?.slice(0, 1).toUpperCase() || "C"}</span>
                }
              </div>
              <div className="vinyl-hole" />
              <div className="vinyl-tonearm" />
            </div>
            <div className="cover-meta">
              <div className="clock-display">{radio.clock}</div>
              <div className="clock-status">{radio.playing ? "● ON AIR" : "● STANDBY"}</div>
            </div>
            <div className="track-info-compact">
              <div className="track-title-sm">{track?.title || "等待歌曲"}</div>
              <div className="track-artist-sm">{track ? `${track.artist} · ${track.album || ""}` : "还没有队列"}</div>
            </div>
          </div>

          {/* Center: Music Fountain */}
          <div className="track-hero">
            <div className="fountain-info">
              <h2 className="fountain-title">{track?.title || "等待歌曲"}</h2>
              <p className="fountain-artist">
                {track ? `${track.artist} · ${track.album || ""}` : "还没有队列"}
              </p>
            </div>

            <div className="fountain-zone" aria-hidden="true">
              {Array.from({ length: 18 }, (_, i) => (
                <div key={i} className="fountain-bar" />
              ))}
            </div>

            <div className="fountain-narration" aria-live="polite">
              {radio.hostMessage || ""}
            </div>
          </div>

          {/* Right: Chat + Collapsible Cards */}
          <div className="side-panel">
            {/* Chat Panel */}
            <div className="chat-panel">
              <p className="chat-reply">{radio.message || radio.plan?.reply || "正在读取 Claudio 的回应。"}</p>
              <form className="composer" onSubmit={radio.submitChat}>
                <input
                  value={radio.chatInput}
                  onChange={(e) => radio.setChatInput(e.target.value)}
                  placeholder="比如：今晚想听安静一点"
                />
                <button type="button" title="切换电台旁白" onClick={() => radio.setRadioHostEnabled(!radio.radioHostEnabled)}>
                  旁白
                </button>
                <button type="submit">发送</button>
              </form>
              <div className="quick-actions">
                {["夜晚", "写代码", "Emo", "睡前"].map((label) => (
                  <button key={label} type="button" onClick={() => radio.setChatInput(label)}>{label}</button>
                ))}
                <button
                  type="button"
                  onClick={radio.runtime?.running ? radio.stopRuntime : radio.startRuntime}
                  disabled={radio.runtimeBusy}
                >
                  {radio.runtime?.running ? "停止电台" : "开始电台"}
                </button>
              </div>
            </div>

            {/* Queue Card */}
            <div className={`collapse-card ${isExpanded("queue") ? "expanded" : ""}`}>
              <div className="collapse-header" onClick={() => togglePanel("queue")} role="button" tabIndex={0}>
                <div className="collapse-header-left">
                  <span className="collapse-icon">▶</span>
                  <span className="collapse-title">队列</span>
                </div>
                <span className="collapse-badge">{radio.queueCount} 首</span>
              </div>
              <div className="collapse-content">
                <div className="collapse-inner">
                  <ol className="queue">
                    {radio.activeQueue.map((t, i) => (
                      <li key={t.id} className={i === radio.currentIndex ? "active" : ""} onClick={() => radio.selectTrack(i)}>
                        <span className="queue-index">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="queue-title">{t.title}</p>
                          <p className="queue-meta">{t.artist} · {t.durationText || t.duration || "未知"}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {!radio.activeQueue.length ? <p className="empty-note">还没有可用队列。</p> : null}
                </div>
              </div>
            </div>

            {/* Today's Plan Card */}
            <div className={`collapse-card ${isExpanded("plan") ? "expanded" : ""}`}>
              <div className="collapse-header" onClick={() => togglePanel("plan")} role="button" tabIndex={0}>
                <div className="collapse-header-left">
                  <span className="collapse-icon">▶</span>
                  <span className="collapse-title">今日计划</span>
                </div>
                <span className="collapse-badge">{radio.radio?.mode || "—"}</span>
              </div>
              <div className="collapse-content">
                <div className="collapse-inner">
                  <p className="reason">{radio.message || radio.plan?.reason || "正在读取今日计划。"}</p>
                  <div className="routine-segments">
                    <div className="routine-item">
                      <strong>{radio.radio?.slot?.label || radio.radio?.mode || "读取中"}</strong>
                      <span>{radio.radio?.slot?.prompt || radio.radio?.reply || "正在生成。"}</span>
                    </div>
                    <div className="routine-item">
                      <strong>日历</strong>
                      <span>{radio.radio?.calendar?.configured ? "已连接" : radio.radio?.calendar?.reason || "未连接"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Taste Card */}
            <div className={`collapse-card ${isExpanded("taste") ? "expanded" : ""}`}>
              <div className="collapse-header" onClick={() => togglePanel("taste")} role="button" tabIndex={0}>
                <div className="collapse-header-left">
                  <span className="collapse-icon">▶</span>
                  <span className="collapse-title">口味</span>
                </div>
                <span className="collapse-badge">♥ {radio.taste?.profile?.likedCount || 0}</span>
              </div>
              <div className="collapse-content">
                <div className="collapse-inner">
                  <p className="taste-summary">
                    喜欢 {radio.taste?.profile?.likedCount || 0} 首，跳过 {radio.taste?.profile?.skippedCount || 0} 首。
                  </p>
                  <div className="tags">
                    {(radio.taste?.profile?.topTags || []).length
                      ? radio.taste?.profile?.topTags.map((item) => {
                          const tag = typeof item === "string" ? item : item.tag;
                          const count = typeof item === "string" ? "" : ` · ${item.count}`;
                          return <span key={tag}>{tag}{count}</span>;
                        })
                      : <span>暂无足够口味记录</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Card */}
            <div className={`collapse-card ${isExpanded("voice") ? "expanded" : ""}`}>
              <div className="collapse-header" onClick={() => togglePanel("voice")} role="button" tabIndex={0}>
                <div className="collapse-header-left">
                  <span className="collapse-icon">▶</span>
                  <span className="collapse-title">电台旁白</span>
                </div>
                <span className="collapse-badge">{radio.radioHostEnabled ? "开" : "关"}</span>
              </div>
              <div className="collapse-content">
                <div className="collapse-inner">
                  <label className="voice-toggle">
                    <input
                      type="checkbox"
                      checked={radio.radioHostEnabled}
                      onChange={(e) => radio.setRadioHostEnabled(e.target.checked)}
                    />
                    <span>让 Claudio 自己解读歌曲</span>
                  </label>
                  <p className="tiny">{radio.voiceStatus?.audioSupported ? `真实 TTS：${radio.voiceStatus.provider}` : "浏览器语音回退"}</p>
                  <p className="tiny">
                    {radio.runtime?.running ? `正在播出：${radio.runtime.sessionTitle || "自由电台"}` : "电台未开播。"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom Control Bar ── */}
        <footer className="control-bar">
          <div className="power-zone">
            <div className={`power-dot ${radio.runtime?.running || radio.playing ? "on" : ""}`} />
            <span className="power-label">{radio.runtime?.running ? "ON AIR" : "STANDBY"}</span>
          </div>

          <div className="transport-controls">
            <button type="button" title="上一首" onClick={() => radio.move(-1)} disabled={!track}>‹</button>
            <button className="play-btn" type="button" title="播放/暂停" onClick={radio.togglePlay} disabled={!track}>
              {radio.playing ? "❚❚" : "▶"}
            </button>
            <button type="button" title="下一首" onClick={() => radio.move(1)} disabled={!track}>›</button>
            <button type="button" title="喜欢" onClick={() => radio.sendPlayerEvent("like")}>♡</button>
            <button type="button" title="跳过" onClick={() => { radio.sendPlayerEvent("skip"); radio.selectTrack(radio.currentIndex + 1, { continuePlayback: radio.playing }); }}>↝</button>
          </div>

          <div className="progress-zone">
            <span className="progress-time">{formatTime(radio.currentTime)}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(radio.progress / 1000) * 100}%` }} />
              <input
                type="range" min="0" max="1000" value={radio.progress}
                onInput={(e) => radio.seek(Number(e.currentTarget.value))}
                onChange={(e) => radio.seek(Number(e.target.value))}
                aria-label="播放进度"
              />
            </div>
            <span className="progress-time">{formatTime(radio.duration)}</span>
          </div>

          <div className="signal-zone">
            <span className="signal-label">SIGNAL</span>
            <div className="signal-bars" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span key={n} className={n <= signalActive ? "on" : ""} />
              ))}
            </div>
          </div>

          <div className="volume-zone">
            <span className="volume-label">VOL</span>
            <div className="volume-wrapper">
              <div className="volume-segments" aria-hidden="true">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <span key={n} className={n <= volumeSegments ? "on" : ""} />
                ))}
              </div>
              <input
                type="range" min="0" max="1" step="0.01" defaultValue="0.8"
                onInput={(e) => radio.setVolume(Number(e.currentTarget.value))}
                onChange={(e) => radio.setVolume(Number(e.target.value))}
                aria-label="音量"
              />
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
