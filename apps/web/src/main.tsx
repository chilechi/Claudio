import { AnimatePresence, motion } from "framer-motion";
import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ActiveLibrary, DiagnosticsResponse, QueuePlan, State, TasteProfileResponse, Track } from "../../../packages/shared/src/index.js";
import "./style.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type RadioPlan = {
  mode: string;
  slot?: { label?: string; prompt?: string };
  queue: Track[];
  profile?: unknown;
  calendar?: { configured?: boolean; reason?: string };
  reason: string;
  reply: string;
};

type LocalScanResponse = {
  configured: boolean;
  reason?: string;
  tracks: Track[];
  stats?: {
    trackCount: number;
    playableCount: number;
    taggedCount: number;
    fallbackFilenameCount: number;
  };
};

type HostNarrationResponse = {
  kind: "intro" | "between-tracks";
  trackId: string;
  previousTrackId?: string;
  text: string;
  source: "deepseek" | "local";
  generatedAt: string;
};

type VoiceStatus = {
  provider: string;
  configured: boolean;
  state: "ready" | "missing" | "fallback" | "error";
  audioSupported: boolean;
  fallbackProvider: string;
  reason?: string;
  envVars: string[];
};

type RuntimeSnapshot = {
  running: boolean;
  programId?: string;
  sessionTitle?: string;
  queue: Track[];
  currentTrack?: Track;
  currentIndex: number;
  hostMessage?: string;
  jobs: Array<{ type: string; key: string; createdAt: string }>;
  workerRunning: boolean;
  updatedAt: string;
};

type RuntimeApiResponse = {
  runtime?: RuntimeSnapshot;
  plan?: QueuePlan;
  hostMessage?: string;
  currentTrack?: Track;
  previousTrack?: Track;
  intent?: { action: string; reason: string; delta?: number };
  reason?: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.error || `请求失败：${path}，${response.status}`);
  return data as T;
}

function providerLabel(provider?: string) {
  return provider === "deepseek" ? "DeepSeek 脑" : "本地规则脑";
}

function sourceLabel(source?: ActiveLibrary["source"]) {
  const selected = source?.selected || "auto";
  const type = source?.type || "imported";
  const selectedLabel = { auto: "自动", local: "本地", netease: "网易云" }[selected] || selected;
  const typeLabel = { local: "本地音乐", netease: "网易云歌单", imported: "导入歌库" }[type] || type;
  return `${selectedLabel} · ${typeLabel}`;
}

function statusLabel(state: string) {
  return { ready: "可用", fallback: "回退", missing: "缺少", error: "错误" }[state] || state;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function playbackErrorMessage(error?: unknown) {
  const detail = error instanceof Error && error.name ? `（${error.name}）` : "";
  return `当前曲目播放失败${detail}，请检查音频文件或浏览器播放权限。`;
}

/* ── Mode → CSS class ── */
function modeClass(mode?: string): string {
  if (!mode) return "";
  if (mode === "bedtime") return "mode-bedtime";
  if (mode === "coding") return "mode-coding";
  if (mode === "emo") return "mode-emo";
  if (mode === "clear") return "mode-clear";
  if (mode === "night" || mode === "evening") return "mode-evening";
  return "mode-night";
}

/* ── Atmosphere label ── */
function atmosphereLabel(mode?: string, slotLabel?: string): string {
  if (slotLabel) return slotLabel;
  const labels: Record<string, string> = {
    coding: "专注电台",
    night: "深夜电台",
    emo: "情绪电台",
    bedtime: "睡前电台",
    clear: "晨醒电台",
    evening: "晚间电台"
  };
  return labels[mode || ""] || "Claudio 电台";
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI ORB
═══════════════════════════════════════════════════════════════════════════ */

function AiOrb(props: {
  running: boolean;
  workerRunning: boolean;
  ttsSpeaking: boolean;
  mode?: string;
}) {
  const stateClass = props.ttsSpeaking ? "speaking" : props.workerRunning ? "thinking" : "";

  return (
    <div className="orb-container">
      {/* Ripple rings — only when TTS speaking */}
      <AnimatePresence>
        {props.ttsSpeaking && (
          <>
            <motion.div
              className="orb-ripple"
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="orb-ripple"
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            />
            <motion.div
              className="orb-ripple"
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
            />
          </>
        )}
      </AnimatePresence>

      <motion.div
        className={`orb${stateClass ? ` ${stateClass}` : ""}`}
        animate={
          props.ttsSpeaking
            ? {
                scale: [1, 1.04, 1, 1.03, 1],
                transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
              }
            : props.workerRunning
              ? {
                  scale: [1, 1.02, 1],
                  transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                }
              : {
                  scale: [1, 1.015, 1],
                  transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
                }
        }
      >
        <span className="orb-name">Claudio</span>
        <span className="orb-status">
          {props.running && <span className="orb-status-dot" />}
          {props.running ? "LIVE" : "待命"}
        </span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE SUBTITLES
═══════════════════════════════════════════════════════════════════════════ */

function LiveSubtitles(props: {
  hostMessage: string;
  workerRunning: boolean;
  ttsSpeaking: boolean;
  running: boolean;
}) {
  if (props.workerRunning) {
    return (
      <div className="subtitles-container">
        <div className="subtitles-thinking">
          <span>Claudio 正在感受这一刻</span>
          <span className="subtitles-thinking-dots">
            <motion.span animate={{ opacity: [0.25, 1, 0.25] }} transition={{ repeat: Infinity, duration: 1.2 }} />
            <motion.span animate={{ opacity: [0.25, 1, 0.25] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.15 }} />
            <motion.span animate={{ opacity: [0.25, 1, 0.25] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="subtitles-container">
      <AnimatePresence mode="wait">
        {props.hostMessage ? (
          <motion.p
            key={props.hostMessage}
            className={`subtitles-text${props.ttsSpeaking ? " speaking" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {props.hostMessage}
          </motion.p>
        ) : (
          <motion.p
            key="placeholder"
            className="subtitles-placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {props.running
              ? "Claudio 正在为你挑选下一首歌..."
              : "跟 Claudio 说说话，或者选一种气氛"}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOW PLAYING
═══════════════════════════════════════════════════════════════════════════ */

function NowPlaying(props: { track?: Track; playing: boolean }) {
  if (!props.track) {
    return (
      <div className="now-playing">
        <span className="now-playing-icon">🎵</span>
        <span style={{ color: "var(--text-dim)" }}>等待歌曲...</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={props.track.id}
        className="now-playing"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <span className="now-playing-icon">{props.playing ? "▶" : "🎵"}</span>
        <span className="now-playing-track">{props.track.title}</span>
        <span className="now-playing-separator">—</span>
        <span>{props.track.artist}</span>
        {props.track.durationText && (
          <>
            <span className="now-playing-separator">·</span>
            <span className="now-playing-duration">{props.track.durationText}</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOOD CHIPS
═══════════════════════════════════════════════════════════════════════════ */

const MOODS = [
  { label: "夜晚", prompt: "今晚想听安静一点" },
  { label: "专注", prompt: "适合写代码的背景音乐" },
  { label: "Emo", prompt: "有点 emo 但别太丧" },
  { label: "睡前", prompt: "睡前安静收尾" },
  { label: "晨醒", prompt: "清醒明亮地开始" },
];

function MoodChips(props: { onSelect: (prompt: string) => void }) {
  return (
    <div className="moods-row">
      {MOODS.map((mood, i) => (
        <motion.button
          key={mood.label}
          className="mood-chip"
          type="button"
          onClick={() => props.onSelect(mood.prompt)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 350, damping: 26 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {mood.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION BAR
═══════════════════════════════════════════════════════════════════════════ */

function ConversationBar(props: {
  chatInput: string;
  setChatInput: (v: string) => void;
  submitChat: (e: FormEvent) => void;
}) {
  return (
    <form className="conversation-bar" onSubmit={props.submitChat}>
      <input
        className="conversation-input"
        value={props.chatInput}
        onChange={(e) => props.setChatInput(e.target.value)}
        placeholder="跟 Claudio 说说现在的心情..."
      />
      <motion.button
        className="conversation-submit"
        type="submit"
        disabled={!props.chatInput.trim()}
        whileTap={{ scale: 0.92 }}
      >
        ↗
      </motion.button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINIMAL TRANSPORT
═══════════════════════════════════════════════════════════════════════════ */

function MinimalTransport(props: {
  playing: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLike: () => void;
  onSkip: () => void;
  onProgress: (v: number) => void;
}) {
  return (
    <div className="transport">
      <div className="transport-controls">
        <motion.button className="transport-btn" type="button" title="上一首" onClick={props.onPrev} whileTap={{ scale: 0.9 }}>
          ◀◀
        </motion.button>

        <motion.button
          className="transport-btn play"
          type="button"
          title={props.playing ? "暂停" : "播放"}
          onClick={props.onPlay}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
        >
          {props.playing ? "❚❚" : "▶"}
        </motion.button>

        <motion.button className="transport-btn" type="button" title="下一首" onClick={props.onNext} whileTap={{ scale: 0.9 }}>
          ▶▶
        </motion.button>

        <motion.button className="transport-btn small" type="button" title="喜欢" onClick={props.onLike} whileTap={{ scale: 0.88 }}>
          ♡
        </motion.button>

        <motion.button className="transport-btn small" type="button" title="跳过" onClick={props.onSkip} whileTap={{ scale: 0.88 }}>
          ↝
        </motion.button>
      </div>

      <div className="transport-progress">
        <span className="transport-time">{formatTime(props.currentTime)}</span>
        <input
          type="range"
          min="0"
          max="1000"
          value={props.progress}
          onInput={(e) => props.onProgress(Number(e.currentTarget.value))}
          onChange={(e) => props.onProgress(Number(e.target.value))}
        />
        <span className="transport-time">{formatTime(props.duration)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUEUE DRAWER
═══════════════════════════════════════════════════════════════════════════ */

function QueueDrawer(props: {
  queue: Track[];
  currentIndex: number;
  selectTrack: (index: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const count = props.queue.length;

  return (
    <div className="queue-drawer">
      <motion.div className="queue-header" onClick={props.onToggle}>
        <div>
          <span className="queue-header-label">队列</span>
          <span className="queue-header-count"> · {count} 首</span>
        </div>
        <motion.span
          className="queue-header-chevron"
          animate={{ rotate: props.expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          ▾
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {props.expanded && (
          <motion.div
            className="queue-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {count === 0 ? (
              <div className="queue-empty">
                还没有可用队列。
                <br />
                先配置 LOCAL_MUSIC_DIR，或确认网易云歌单元数据已导入。
              </div>
            ) : (
              props.queue.map((track, index) => (
                <motion.div
                  key={track.id}
                  className={`queue-item${index === props.currentIndex ? " current" : ""}`}
                  onClick={() => props.selectTrack(index)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 28 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="queue-item-index">
                    {index === props.currentIndex ? "▶" : String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="queue-item-cover">
                    {track.coverUrl ? <img src={track.coverUrl} alt="" /> : "🎵"}
                  </div>
                  <div className="queue-item-info">
                    <p className="queue-item-title">{track.title}</p>
                    <p className="queue-item-meta">
                      {track.artist}{track.durationText ? ` · ${track.durationText}` : ""}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS DRAWER
═══════════════════════════════════════════════════════════════════════════ */

function SettingsDrawer(props: {
  open: boolean;
  onClose: () => void;
  radio: RadioPlan | null;
  reason: string;
  taste: TasteProfileResponse | null;
  localScan: LocalScanResponse | null;
  diagnostics: DiagnosticsResponse | null;
  providerSummary?: DiagnosticsResponse["summary"];
  errors: string[];
  radioHostEnabled: boolean;
  setRadioHostEnabled: (v: boolean) => void;
  voiceDetail: string;
}) {
  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.div
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={props.onClose}
          />
          <motion.div
            className="settings-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 330, damping: 32 }}
          >
            <div className="settings-header">
              <h2 className="settings-title">设置与诊断</h2>
              <button className="settings-close" type="button" onClick={props.onClose}>
                ✕
              </button>
            </div>

            {/* Today Plan */}
            <div className="settings-section">
              <p className="settings-section-label">今日计划</p>
              <p className="settings-text">{props.reason}</p>
              <div style={{ display: "grid", gap: 8 }}>
                <div className="provider-card ready">
                  <strong>{props.radio?.slot?.label || props.radio?.mode || "读取中"}</strong>
                  <p>{props.radio?.slot?.prompt || props.radio?.reply || "正在生成。"}</p>
                </div>
                <div className="provider-card fallback">
                  <strong>日历</strong>
                  <p>{props.radio?.calendar?.configured ? "已连接" : props.radio?.calendar?.reason || "未连接"}</p>
                </div>
              </div>
            </div>

            {/* Taste Profile */}
            <div className="settings-section">
              <p className="settings-section-label">口味画像</p>
              <p className="settings-muted">
                喜欢 {props.taste?.profile?.likedCount || 0} 首，跳过 {props.taste?.profile?.skippedCount || 0} 首。
                画像来自当前真实歌库和播放事件。
              </p>
              {(props.taste?.profile?.topTags || []).length > 0 && (
                <div className="tags-row" style={{ marginTop: 10 }}>
                  {props.taste?.profile?.topTags.map((item) => {
                    const tag = typeof item === "string" ? item : item.tag;
                    const count = typeof item === "string" ? "" : ` · ${item.count}`;
                    return <span key={tag} className="tag-chip">{tag}{count}</span>;
                  })}
                </div>
              )}
            </div>

            {/* Local Library */}
            <div className="settings-section">
              <p className="settings-section-label">本地歌库</p>
              {props.localScan?.configured ? (
                <>
                  <p className="settings-muted">
                    {props.localScan.stats?.trackCount || 0} 首本地音频，{props.localScan.stats?.playableCount || 0} 首可播放。
                  </p>
                  <div className="tags-row" style={{ marginTop: 8 }}>
                    <span className="tag-chip">标签识别 {props.localScan.stats?.taggedCount || 0}</span>
                    <span className="tag-chip">文件名兜底 {props.localScan.stats?.fallbackFilenameCount || 0}</span>
                  </div>
                </>
              ) : (
                <p className="settings-muted">{props.localScan?.reason || "还没有配置 LOCAL_MUSIC_DIR。"}</p>
              )}
            </div>

            {/* Voice Settings */}
            <div className="settings-section">
              <p className="settings-section-label">电台旁白</p>
              <label className="voice-row">
                <input
                  type="checkbox"
                  checked={props.radioHostEnabled}
                  onChange={(e) => props.setRadioHostEnabled(e.target.checked)}
                />
                <span>让 Claudio 自己解读歌曲</span>
              </label>
              <p className="settings-tiny">{props.voiceDetail}</p>
            </div>

            {/* Diagnostics */}
            <div className="settings-section">
              <p className="settings-section-label">配置诊断</p>
              <div className="settings-summary-row">
                <span>可用 {props.providerSummary?.ready || 0}</span>
                <span>回退 {props.providerSummary?.fallback || 0}</span>
                <span>缺少 {props.providerSummary?.missing || 0}</span>
                <span>{props.diagnostics?.secretPolicy || "不展示密钥原文"}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {(props.diagnostics?.providers || []).map((provider) => (
                  <div className={`provider-card ${provider.state}`} key={provider.id}>
                    <strong>{provider.label}</strong>
                    <span>{statusLabel(provider.state)}</span>
                    <p>{provider.detail || provider.reason || "已配置"}</p>
                    <small>{(provider.envVars || []).join(" / ") || "无需配置"}</small>
                  </div>
                ))}
              </div>
              {props.errors.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {props.errors.map((err) => (
                    <div className="error-item" key={err}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════════════════ */

function App() {
  /* ── State (preserved exactly) ── */
  const [library, setLibrary] = useState<ActiveLibrary | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [plan, setPlan] = useState<QueuePlan | null>(null);
  const [radio, setRadio] = useState<RadioPlan | null>(null);
  const [taste, setTaste] = useState<TasteProfileResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [localScan, setLocalScan] = useState<LocalScanResponse | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [runtime, setRuntime] = useState<RuntimeSnapshot | null>(null);
  const [runtimeBusy, setRuntimeBusy] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [hostMessage, setHostMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [clock, setClock] = useState("--:--");
  const [light, setLight] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [radioHostEnabled, setRadioHostEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const lastNarrationKeyRef = useRef("");

  /* ── New UI state ── */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);

  const activeQueue = queue.length ? queue : library?.tracks || [];
  const currentTrack = activeQueue[currentIndex];

  /* ── Effects (preserved exactly) ── */
  useEffect(() => {
    document.body.classList.toggle("light", light);
  }, [light]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    boot().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Claudio 没能读到歌单。先保持安静。");
    });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      setErrors((items) => ["PWA 离线缓存注册失败，仍可正常在线使用。", ...items].slice(0, 6));
    });
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.streamUrl) return;
    const absolute = new URL(currentTrack.streamUrl, window.location.href).href;
    if (audio.src !== absolute) {
      audio.src = absolute;
      setCurrentTime(0);
      setProgress(0);
    }
    if (playingRef.current) {
      audio.play().catch((error) => {
        setPlaying(false);
        setMessage(playbackErrorMessage(error));
      });
    }
  }, [currentTrack?.id, currentTrack?.streamUrl]);

  useEffect(() => {
    const events = new EventSource("/api/events");

    const applyRuntimeEvent = (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as RuntimeApiResponse & { type?: string; text?: string; action?: string; delta?: number };
      if (payload.runtime) applyRuntime(payload.runtime);
      if (payload.plan) setPlan(payload.plan);
      if (payload.text) {
        setHostMessage(payload.text);
        speak(payload.text);
      }
      if (payload.action === "pause") {
        audioRef.current?.pause();
        setPlaying(false);
      }
      if (payload.action === "resume" && currentTrack?.streamUrl) {
        audioRef.current?.play().then(() => setPlaying(true)).catch((error) => setMessage(playbackErrorMessage(error)));
      }
      if (payload.action === "volume" && typeof payload.delta === "number" && audioRef.current) {
        audioRef.current.volume = Math.min(1, Math.max(0, audioRef.current.volume + payload.delta));
      }
    };

    events.addEventListener("runtime-status", applyRuntimeEvent);
    events.addEventListener("program-start", applyRuntimeEvent);
    events.addEventListener("tracks-ready", applyRuntimeEvent);
    events.addEventListener("host-message", applyRuntimeEvent);
    events.addEventListener("now-playing", applyRuntimeEvent);
    events.addEventListener("control", applyRuntimeEvent);
    events.addEventListener("hourly-check", applyRuntimeEvent);
    events.onerror = () => {
      setErrors((items) => ["电台事件流暂时断开，页面仍可手动控制。", ...items].slice(0, 6));
      events.close();
    };

    return () => events.close();
  }, [currentTrack?.streamUrl, radioHostEnabled, voiceStatus?.audioSupported]);

  /* ── Handlers (preserved exactly) ── */
  async function boot() {
    const [activeLibrary, savedState] = await Promise.all([
      api<ActiveLibrary>("/api/music/active-library"),
      api<State>("/api/state")
    ]);
    setLibrary(activeLibrary);
    setState(savedState);

    const byId = new Map(activeLibrary.tracks.map((track) => [track.id, track]));
    const restoredQueue = (savedState.queue || []).map((id) => byId.get(id)).filter((track): track is Track => Boolean(track));
    const nextQueue = restoredQueue.length ? restoredQueue : activeLibrary.tracks.slice(0, 5);
    setQueue(nextQueue);
    const restoredIndex = nextQueue.findIndex((track) => track.id === savedState.currentTrackId);
    setCurrentIndex(restoredIndex >= 0 ? restoredIndex : 0);

    const [todayPlan, radioPlan, tasteProfile, settings, localMusic, voice, runtimeStatus] = await Promise.allSettled([
      api<QueuePlan>("/api/plan/today"),
      api<RadioPlan>("/api/radio/today"),
      api<TasteProfileResponse>("/api/taste/profile"),
      api<DiagnosticsResponse>("/api/settings/diagnostics"),
      api<LocalScanResponse>("/api/music/local/scan"),
      api<VoiceStatus>("/api/voice/status"),
      api<RuntimeSnapshot>("/api/runtime/status")
    ]);

    if (todayPlan.status === "fulfilled") setPlan(todayPlan.value);
    else {
      setMessage("今日计划暂时没有生成，已先使用真实歌库。");
      setErrors((items) => [...items, `今日计划失败：${todayPlan.reason instanceof Error ? todayPlan.reason.message : "未知错误"}`]);
    }
    if (radioPlan.status === "fulfilled") setRadio(radioPlan.value);
    else setErrors((items) => [...items, `电台计划失败：${radioPlan.reason instanceof Error ? radioPlan.reason.message : "未知错误"}`]);
    if (tasteProfile.status === "fulfilled") setTaste(tasteProfile.value);
    else setErrors((items) => [...items, `口味画像失败：${tasteProfile.reason instanceof Error ? tasteProfile.reason.message : "未知错误"}`]);
    if (settings.status === "fulfilled") setDiagnostics(settings.value);
    else setErrors((items) => [...items, `配置诊断失败：${settings.reason instanceof Error ? settings.reason.message : "未知错误"}`]);
    if (localMusic.status === "fulfilled") setLocalScan(localMusic.value);
    else setErrors((items) => [...items, `本地歌库扫描失败：${localMusic.reason instanceof Error ? localMusic.reason.message : "未知错误"}`]);
    if (voice.status === "fulfilled") setVoiceStatus(voice.value);
    else setErrors((items) => [...items, `电台旁白状态读取失败：${voice.reason instanceof Error ? voice.reason.message : "未知错误"}`]);
    if (runtimeStatus.status === "fulfilled") applyRuntime(runtimeStatus.value);
    else setErrors((items) => [...items, `电台运行态读取失败：${runtimeStatus.reason instanceof Error ? runtimeStatus.reason.message : "未知错误"}`]);
  }

  function applyRuntime(nextRuntime: RuntimeSnapshot) {
    setRuntime(nextRuntime);
    if (nextRuntime.queue?.length) {
      setQueue(nextRuntime.queue);
      setCurrentIndex(Math.max(0, Math.min(nextRuntime.currentIndex || 0, nextRuntime.queue.length - 1)));
    }
    if (nextRuntime.hostMessage) setHostMessage(nextRuntime.hostMessage);
    if (nextRuntime.sessionTitle) setMessage(`电台运行中：${nextRuntime.sessionTitle}`);
  }

  async function sendPlayerEvent(type: string, trackId = currentTrack?.id) {
    if (!trackId) return;
    const nextState = await api<State>("/api/player/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, trackId })
    }).catch(() => null);
    if (nextState) setState(nextState);
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const input = chatInput.trim();
    if (!input) return;
    setChatInput("");
    setMessage("Claudio 正在整理这一轮。");
    try {
      const result = await api<RuntimeApiResponse>("/api/runtime/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      if (result.runtime) applyRuntime(result.runtime);
      if (result.plan) setPlan(result.plan);
      if (result.intent?.action === "pause") audioRef.current?.pause();
      if (result.intent?.action === "resume") audioRef.current?.play().then(() => setPlaying(true)).catch((error) => setMessage(playbackErrorMessage(error)));
      if (result.intent?.action === "volume" && typeof result.intent.delta === "number" && audioRef.current) {
        audioRef.current.volume = Math.min(1, Math.max(0, audioRef.current.volume + result.intent.delta));
      }
      if (result.hostMessage) {
        setHostMessage(result.hostMessage);
        speak(result.hostMessage);
      }
      setMessage(result.intent?.reason || result.reason || result.runtime?.sessionTitle || "Claudio 已更新电台状态。");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      setMessage(`Claudio 暂时没有接住：${reason}`);
      setErrors((items) => [`聊天请求失败：${reason}`, ...items].slice(0, 6));
    }
  }

  async function startRuntime() {
    setRuntimeBusy(true);
    setMessage("Claudio 正在开播。");
    try {
      const result = await api<RuntimeApiResponse>("/api/runtime/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: chatInput.trim() || "打开 Claudio 电台" })
      });
      if (result.runtime) applyRuntime(result.runtime);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      setMessage(`电台开播失败：${reason}`);
      setErrors((items) => [`电台开播失败：${reason}`, ...items].slice(0, 6));
    } finally {
      setRuntimeBusy(false);
    }
  }

  async function stopRuntime() {
    setRuntimeBusy(true);
    try {
      const nextRuntime = await api<RuntimeSnapshot>("/api/runtime/stop", { method: "POST" });
      applyRuntime(nextRuntime);
      audioRef.current?.pause();
      setPlaying(false);
      setMessage("电台已停止。");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      setErrors((items) => [`电台停止失败：${reason}`, ...items].slice(0, 6));
    } finally {
      setRuntimeBusy(false);
    }
  }

  async function speak(text: string) {
    if (!radioHostEnabled) return;

    setTtsSpeaking(true);

    if (voiceStatus?.audioSupported) {
      try {
        const response = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.startsWith("audio/")) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const voiceAudio = voiceAudioRef.current;
          if (voiceAudio) {
            voiceAudio.pause();
            voiceAudio.src = url;
            voiceAudio.onended = () => {
              URL.revokeObjectURL(url);
              setTtsSpeaking(false);
            };
            await voiceAudio.play();
            return;
          }
        }
      } catch {
        // fall through to browser fallback
      }
    }

    if (!("speechSynthesis" in window)) {
      setTtsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, " "));
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.pitch = 0.92;
    utterance.onend = () => setTtsSpeaking(false);
    utterance.onerror = () => setTtsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function requestHostNarration(kind: "intro" | "between-tracks", track?: Track, previousTrack?: Track) {
    if (!radioHostEnabled || !track) return;
    const key = `${kind}:${previousTrack?.id || "none"}:${track.id}`;
    if (lastNarrationKeyRef.current === key) return;
    lastNarrationKeyRef.current = key;

    try {
      const narration = await api<HostNarrationResponse>(kind === "intro" ? "/api/host/intro" : "/api/host/between-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          previousTrackId: previousTrack?.id
        })
      });
      setHostMessage(narration.text);
      speak(narration.text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      setErrors((items) => [`电台旁白生成失败：${reason}`, ...items].slice(0, 6));
    }
  }

  function togglePlay() {
    if (!currentTrack) return;
    if (!currentTrack.streamUrl) {
      setPlaying(false);
      setMessage("当前曲目还没有可播放音频；网易云元数据模式不保证直接播放。");
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    const absolute = new URL(currentTrack.streamUrl, window.location.href).href;
    if (audio.src !== absolute) audio.src = absolute;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      requestHostNarration("intro", currentTrack);
      audio.play().then(() => {
        setPlaying(true);
        sendPlayerEvent("play");
      }).catch((error) => {
        setPlaying(false);
        setMessage(playbackErrorMessage(error));
      });
    }
  }

  function selectTrack(nextIndex: number, options: { continuePlayback?: boolean; eventType?: string } = {}) {
    if (!activeQueue.length) return;
    const normalizedIndex = (nextIndex + activeQueue.length) % activeQueue.length;
    const previousTrack = currentTrack;
    const nextTrack = activeQueue[normalizedIndex];
    const shouldContinue = options.continuePlayback ?? playing;
    setCurrentIndex(normalizedIndex);
    if (options.eventType) sendPlayerEvent(options.eventType, nextTrack.id);
    if (shouldContinue && !nextTrack.streamUrl) {
      setPlaying(false);
      setMessage("切到的曲目没有真实音频，已保持安静。");
      return;
    }
    setPlaying(shouldContinue && Boolean(nextTrack.streamUrl));
    if (nextTrack.streamUrl) requestHostNarration(previousTrack ? "between-tracks" : "intro", nextTrack, previousTrack);
  }

  function move(delta: number) {
    selectTrack(currentIndex + delta);
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setAppInstalled(true);
      setInstallPrompt(null);
    }
  }

  /* ── Derived values ── */
  const provider = providerLabel(plan?.aiProvider);
  const providerSummary = useMemo(() => diagnostics?.summary, [diagnostics]);
  const voiceDetail = voiceStatus?.audioSupported ? `真实 TTS：${voiceStatus.provider}` : "浏览器语音回退";
  const mode = plan?.mode || runtime?.sessionTitle || "";
  const atmosphere = atmosphereLabel(mode, radio?.slot?.label);

  const handleSelectMood = useCallback((prompt: string) => {
    setChatInput(prompt);
  }, []);

  /* ── Render ── */
  return (
    <main className={`shell ${modeClass(mode)}`}>
      {/* Top Bar */}
      <div className="topbar">
        <div className="atmosphere">
          <span className="atmosphere-label">{atmosphere}</span>
          <span className="clock-text">{clock}</span>
        </div>
        <div className="topbar-actions">
          {!appInstalled && installPrompt ? (
            <button className="topbar-btn" type="button" onClick={installApp}>安装应用</button>
          ) : null}
          <button className="topbar-btn" type="button" onClick={() => setLight((v) => !v)}>
            {light ? "亮色" : "暗色"}
          </button>
          <button
            className={`topbar-btn${runtime?.running ? " live" : ""}`}
            type="button"
            onClick={runtime?.running ? stopRuntime : startRuntime}
            disabled={runtimeBusy}
          >
            {runtime?.running ? (
              <><span className="topbar-btn-live-dot" /> 停播</>
            ) : (
              "开播"
            )}
          </button>
        </div>
      </div>

      {/* AI Host Orb */}
      <AiOrb
        running={runtime?.running || false}
        workerRunning={runtime?.workerRunning || false}
        ttsSpeaking={ttsSpeaking}
        mode={mode}
      />

      {/* Live Subtitles */}
      <LiveSubtitles
        hostMessage={hostMessage}
        workerRunning={runtime?.workerRunning || false}
        ttsSpeaking={ttsSpeaking}
        running={runtime?.running || false}
      />

      {/* Now Playing */}
      <NowPlaying track={currentTrack} playing={playing} />

      {/* Mood Chips */}
      <MoodChips onSelect={handleSelectMood} />

      {/* Conversation Bar */}
      <ConversationBar
        chatInput={chatInput}
        setChatInput={setChatInput}
        submitChat={submitChat}
      />

      {/* Minimal Transport */}
      <MinimalTransport
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        onPlay={togglePlay}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onLike={() => sendPlayerEvent("like")}
        onSkip={() => { sendPlayerEvent("skip"); selectTrack(currentIndex + 1, { continuePlayback: playing }); }}
        onProgress={(value) => {
          const audio = audioRef.current;
          setProgress(value);
          if (audio && Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (value / 1000) * audio.duration;
        }}
      />

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button
          className={`action-chip${queueExpanded ? " active" : ""}`}
          type="button"
          onClick={() => setQueueExpanded((v) => !v)}
        >
          队列 · {activeQueue.length}
        </button>
        <button
          className="action-chip"
          type="button"
          onClick={() => setSettingsOpen(true)}
        >
          设置
        </button>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer
        queue={activeQueue}
        currentIndex={currentIndex}
        selectTrack={selectTrack}
        expanded={queueExpanded}
        onToggle={() => setQueueExpanded((v) => !v)}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        radio={radio}
        reason={message || plan?.reason || "正在读取今日计划。"}
        taste={taste}
        localScan={localScan}
        diagnostics={diagnostics}
        providerSummary={providerSummary}
        errors={errors}
        radioHostEnabled={radioHostEnabled}
        setRadioHostEnabled={setRadioHostEnabled}
        voiceDetail={voiceDetail}
      />

      {/* Audio Elements */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration);
          setProgress(Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round((audio.currentTime / audio.duration) * 1000) : 0);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => move(1)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <audio ref={voiceAudioRef} preload="none" />
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOUNT
═══════════════════════════════════════════════════════════════════════════ */

declare global {
  interface Window {
    __claudioRoot?: ReturnType<typeof createRoot>;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = window.__claudioRoot || createRoot(container);
window.__claudioRoot = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
