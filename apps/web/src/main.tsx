import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ActiveLibrary, DiagnosticsResponse, QueuePlan, State, TasteProfileResponse, Track } from "../../../packages/shared/src/index.js";
import "./style.css";

type RadioPlan = {
  mode: string;
  slot?: { label?: string; prompt?: string };
  queue: Track[];
  profile?: unknown;
  calendar?: { configured?: boolean; reason?: string };
  reason: string;
  reply: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.error || `请求失败：${path}（${response.status}）`);
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

function App() {
  const [library, setLibrary] = useState<ActiveLibrary | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [plan, setPlan] = useState<QueuePlan | null>(null);
  const [radio, setRadio] = useState<RadioPlan | null>(null);
  const [taste, setTaste] = useState<TasteProfileResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [clock, setClock] = useState("--:--");
  const [light, setLight] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const userInteractedRef = useRef(false);

  const activeQueue = queue.length ? queue : library?.tracks || [];
  const currentTrack = activeQueue[currentIndex];

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
    const audio = audioRef.current;
    if (!audio || !currentTrack?.streamUrl) return;
    const absolute = new URL(currentTrack.streamUrl, window.location.href).href;
    if (audio.src !== absolute) {
      audio.src = absolute;
      setCurrentTime(0);
      setProgress(0);
    }
    if (playingRef.current) audio.play().catch((error) => {
      setPlaying(false);
      setMessage(playbackErrorMessage(error));
    });
  }, [currentTrack?.id, currentTrack?.streamUrl]);

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

    const [todayPlan, radioPlan, tasteProfile, settings] = await Promise.allSettled([
      api<QueuePlan>("/api/plan/today"),
      api<RadioPlan>("/api/radio/today"),
      api<TasteProfileResponse>("/api/taste/profile"),
      api<DiagnosticsResponse>("/api/settings/diagnostics")
    ]);
    if (todayPlan.status === "fulfilled") {
      setPlan(todayPlan.value);
    } else {
      setMessage("今日计划暂时没有生成，已先使用真实歌库。");
      setErrors((items) => [...items, `今日计划失败：${todayPlan.reason instanceof Error ? todayPlan.reason.message : "未知错误"}`]);
    }
    if (radioPlan.status === "fulfilled") setRadio(radioPlan.value);
    else setErrors((items) => [...items, `电台计划失败：${radioPlan.reason instanceof Error ? radioPlan.reason.message : "未知错误"}`]);
    if (tasteProfile.status === "fulfilled") setTaste(tasteProfile.value);
    else setErrors((items) => [...items, `口味画像失败：${tasteProfile.reason instanceof Error ? tasteProfile.reason.message : "未知错误"}`]);
    if (settings.status === "fulfilled") setDiagnostics(settings.value);
    else setErrors((items) => [...items, `配置诊断失败：${settings.reason instanceof Error ? settings.reason.message : "未知错误"}`]);
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
    userInteractedRef.current = true;
    const shouldContinue = playing;
    setChatInput("");
    setMessage("Claudio 正在整理这一轮。");
    try {
      const nextPlan = await api<QueuePlan>("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      setPlan(nextPlan);
      setQueue(nextPlan.queue);
      setCurrentIndex(0);
      setPlaying(shouldContinue && Boolean(nextPlan.queue[0]?.streamUrl));
      setMessage(nextPlan.reason);
      speak(nextPlan.reply);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      setMessage(`Claudio 暂时没有接住：${reason}`);
      setErrors((items) => [`聊天请求失败：${reason}`, ...items].slice(0, 6));
    }
  }

  function speak(text: string) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, " "));
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.pitch = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function togglePlay() {
    userInteractedRef.current = true;
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
    userInteractedRef.current = true;
    if (!activeQueue.length) return;
    const normalizedIndex = (nextIndex + activeQueue.length) % activeQueue.length;
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
  }

  function move(delta: number) {
    selectTrack(currentIndex + delta);
  }

  const sourceHint = library?.fallbackReason || (library ? `当前音乐源：${sourceLabel(library.source)}。` : "音乐源读取中。");
  const provider = providerLabel(plan?.aiProvider);
  const queueCount = activeQueue.length;
  const providerSummary = useMemo(() => diagnostics?.summary, [diagnostics]);

  return (
    <main className="shell">
      <header className="topbar" aria-label="Claudio 状态">
        <div>
          <p className="eyebrow">个人 AI 电台</p>
          <h1>Claudio</h1>
        </div>
        <div className="status-strip">
          <span>{provider}</span>
          <span>{plan?.mode || "读取中"}</span>
          <span>{sourceLabel(library?.source)}</span>
          <button className="theme-toggle" type="button" onClick={() => setLight((value) => !value)}>{light ? "亮色" : "暗色"}</button>
        </div>
      </header>

      <section className="workspace" aria-label="电台控制台">
        <PlayerPanel
          clock={clock}
          currentTrack={currentTrack}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          progress={progress}
          sourceHint={sourceHint}
          onPlay={togglePlay}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onLike={() => sendPlayerEvent("like")}
          onSkip={() => { sendPlayerEvent("skip"); selectTrack(currentIndex + 1, { continuePlayback: playing }); }}
          onHide={() => sendPlayerEvent("hide")}
          onProgress={(value) => {
            const audio = audioRef.current;
            setProgress(value);
            if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
              audio.currentTime = (value / 1000) * audio.duration;
            }
          }}
          onVolume={(value) => {
            if (audioRef.current) audioRef.current.volume = value;
          }}
        />

        <ChatPanel
          plan={plan}
          message={message}
          chatInput={chatInput}
          setChatInput={setChatInput}
          submitChat={submitChat}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
        />

        <QueuePanel queue={activeQueue} currentIndex={currentIndex} selectTrack={(index) => selectTrack(index)} queueCount={queueCount} />
      </section>

      <section className="lower-grid" aria-label="今日计划和设置">
        <TodayPlanPanel radio={radio} reason={message || plan?.reason || "正在读取今日计划。"} />
        <TastePanel taste={taste} />
        <div className="panel">
          <p className="panel-label">语音</p>
          <label className="voice-toggle">
            <input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} />
            <span>朗读 Claudio 的回应</span>
          </label>
        </div>
      </section>

      <DiagnosticsPanel diagnostics={diagnostics} summary={providerSummary} errors={errors} />

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
    </main>
  );
}

function PlayerPanel(props: {
  clock: string;
  currentTrack?: Track;
  playing: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  sourceHint: string;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLike: () => void;
  onSkip: () => void;
  onHide: () => void;
  onProgress: (value: number) => void;
  onVolume: (value: number) => void;
}) {
  const track = props.currentTrack;
  return (
    <aside className="panel player-panel">
      <p className="panel-label">播放器</p>
      <div className="clock-panel">
        <span>{props.clock}</span>
        <small>{props.playing ? "● 播放中" : "● 待命"}</small>
      </div>
      <div className="cover" aria-hidden="true"><span>{track?.artist?.slice(0, 1).toUpperCase() || "C"}</span></div>
      <p className="now-label">{props.playing ? "正在播放" : "当前曲目"}</p>
      <h2>{track?.title || "等待歌曲"}</h2>
      <p className="muted">{track ? `${track.artist} · ${track.album || "未知专辑"}` : "还没有队列"}</p>
      <div className="meter" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className="controls">
        <button type="button" title="上一首" onClick={props.onPrev} disabled={!track}>‹</button>
        <button className="primary" type="button" title="播放/暂停" onClick={props.onPlay} disabled={!track}>{props.playing ? "暂停" : "播放"}</button>
        <button type="button" title="下一首" onClick={props.onNext} disabled={!track}>›</button>
        <button type="button" title="喜欢" onClick={props.onLike}>♡</button>
        <button type="button" title="跳过" onClick={props.onSkip}>↷</button>
      </div>
      <div className="transport">
        <span>{formatTime(props.currentTime)}</span>
        <input type="range" min="0" max="1000" value={props.progress} onInput={(event) => props.onProgress(Number(event.currentTarget.value))} onChange={(event) => props.onProgress(Number(event.target.value))} />
        <span>{formatTime(props.duration)}</span>
      </div>
      <div className="utility-controls">
        <button type="button" onClick={props.onHide}>隐藏</button>
        <button type="button" onClick={props.onLike}>收藏</button>
        <label>音量<input type="range" min="0" max="1" step="0.01" defaultValue="0.8" onInput={(event) => props.onVolume(Number(event.currentTarget.value))} onChange={(event) => props.onVolume(Number(event.target.value))} /></label>
      </div>
      <p className="tiny">{props.sourceHint}</p>
    </aside>
  );
}

function ChatPanel(props: {
  plan: QueuePlan | null;
  message: string;
  chatInput: string;
  setChatInput: (value: string) => void;
  submitChat: (event: FormEvent) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (value: boolean) => void;
}) {
  return (
    <section className="panel chat-panel">
      <p className="panel-label">CLAUDIO</p>
      <div className="reply">{props.message || props.plan?.reply || "正在读取 Claudio 的回应。"}</div>
      <form className="composer" onSubmit={props.submitChat}>
        <input value={props.chatInput} onChange={(event) => props.setChatInput(event.target.value)} placeholder="比如：今晚想听安静一点 / 适合写代码的 / 有点 emo 但别太丧" />
        <button type="button" title="语音输入" onClick={() => props.setVoiceEnabled(!props.voiceEnabled)}>语音</button>
        <button type="submit">发送</button>
      </form>
      <div className="quick-actions">
        {["夜晚", "写代码", "Emo", "睡前"].map((label) => <button key={label} type="button" onClick={() => props.setChatInput(label)}>{label}</button>)}
      </div>
    </section>
  );
}

function QueuePanel({ queue, currentIndex, selectTrack, queueCount }: { queue: Track[]; currentIndex: number; selectTrack: (index: number) => void; queueCount: number }) {
  return (
    <aside className="panel queue-panel">
      <p className="panel-label">队列</p>
      <p className="queue-count">{queueCount} 首</p>
      <ol className="queue">
        {queue.map((track, index) => (
          <li key={track.id} className={index === currentIndex ? "active" : ""} onClick={() => selectTrack(index)}>
            <span className="queue-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="queue-title">{track.title}</p>
              <p className="queue-meta">{track.artist} · {track.durationText || track.duration || "未知时长"}</p>
            </div>
          </li>
        ))}
      </ol>
      {!queue.length ? <p className="empty-note">还没有可用队列。先配置 LOCAL_MUSIC_DIR，或确认网易云歌单元数据已导入。</p> : null}
    </aside>
  );
}

function TodayPlanPanel({ radio, reason }: { radio: RadioPlan | null; reason: string }) {
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

function TastePanel({ taste }: { taste: TasteProfileResponse | null }) {
  const profile = taste?.profile;
  return (
    <div className="panel">
      <p className="panel-label">口味</p>
      <p className="taste-summary">喜欢 {profile?.likedCount || 0} 首，跳过 {profile?.skippedCount || 0} 首。画像来自当前真实歌库和播放事件。</p>
      <div className="tags">
        {(profile?.topTags || []).length ? profile?.topTags.map((item) => {
          const tag = typeof item === "string" ? item : item.tag;
          const count = typeof item === "string" ? "" : ` · ${item.count}`;
          return <span key={tag}>{tag}{count}</span>;
        }) : <span>暂无足够口味记录</span>}
      </div>
    </div>
  );
}

function DiagnosticsPanel({ diagnostics, summary, errors }: { diagnostics: DiagnosticsResponse | null; summary?: DiagnosticsResponse["summary"]; errors: string[] }) {
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
