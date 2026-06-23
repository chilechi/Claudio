import React, { FormEvent, createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActiveLibrary, QueuePlan, State, TasteProfileResponse, Track } from "@claudio/shared";
import { api } from "../lib/api";
import type { BeforeInstallPromptEvent, HostNarrationResponse, RadioPlan, RuntimeApiResponse, RuntimeSnapshot, VoiceStatus } from "../lib/types";
import { playbackErrorMessage, providerLabel, sourceLabel } from "../lib/utils";

type ThemeName = "midnight" | "vinyl" | "blues" | "rock";

type RadioContextValue = {
  // 播放状态
  library: ActiveLibrary | null;
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentTrack?: Track;
  activeQueue: Track[];
  // 运行时状态
  runtime: RuntimeSnapshot | null;
  runtimeBusy: boolean;
  plan: QueuePlan | null;
  radio: RadioPlan | null;
  taste: TasteProfileResponse | null;
  hostMessage: string;
  message: string;
  // 语音状态
  voiceStatus: VoiceStatus | null;
  radioHostEnabled: boolean;
  setRadioHostEnabled: (value: boolean) => void;
  // UI 状态
  clock: string;
  theme: ThemeName;
  setTheme: (value: ThemeName) => void;
  installPrompt: BeforeInstallPromptEvent | null;
  appInstalled: boolean;
  installApp: () => Promise<void>;
  chatInput: string;
  setChatInput: (value: string) => void;
  // 错误
  errors: string[];
  // 派生值
  sourceHint: string;
  provider: string;
  queueCount: number;
  // 播放控制
  togglePlay: () => void;
  selectTrack: (index: number, options?: { continuePlayback?: boolean; eventType?: string }) => void;
  move: (delta: number) => void;
  sendPlayerEvent: (type: string, trackId?: string) => Promise<void>;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  // 运行时控制
  startRuntime: () => Promise<void>;
  stopRuntime: () => Promise<void>;
  submitChat: (event: FormEvent) => Promise<void>;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<ActiveLibrary | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [plan, setPlan] = useState<QueuePlan | null>(null);
  const [radio, setRadio] = useState<RadioPlan | null>(null);
  const [taste, setTaste] = useState<TasteProfileResponse | null>(null);
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
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("claudio-theme") as ThemeName | null;
      if (saved && ["midnight", "vinyl", "blues", "rock"].includes(saved)) return saved;
    }
    return "vinyl";
  });
  const setTheme = (value: ThemeName) => {
    setThemeState(value);
    if (typeof window !== "undefined") localStorage.setItem("claudio-theme", value);
  };
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

  const activeQueue = queue.length ? queue : library?.tracks || [];
  const currentTrack = activeQueue[currentIndex];

  useEffect(() => {
    const body = document.body;
    body.classList.remove("theme-midnight", "theme-vinyl", "theme-blues", "theme-rock");
    body.classList.add(`theme-${theme}`);
  }, [theme]);

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
    bootRadio().catch((error) => {
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

  async function bootRadio() {
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

    const [todayPlan, radioPlan, tasteProfile, voice, runtimeStatus] = await Promise.allSettled([
      api<QueuePlan>("/api/plan/today"),
      api<RadioPlan>("/api/radio/today"),
      api<TasteProfileResponse>("/api/taste/profile"),
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
            voiceAudio.onended = () => URL.revokeObjectURL(url);
            await voiceAudio.play();
            return;
          }
        }
      } catch {
        // 真实 TTS 失败时继续走浏览器回退，不能让 Claudio 沉默。
      }
    }

    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, " "));
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.pitch = 0.92;
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

  function seek(value: number) {
    const audio = audioRef.current;
    setProgress(value);
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (value / 1000) * audio.duration;
  }

  function setVolume(value: number) {
    if (audioRef.current) audioRef.current.volume = value;
  }

  const sourceHint = library?.fallbackReason || (library ? `当前音乐源：${sourceLabel(library.source)}。` : "音乐源读取中。");
  const provider = providerLabel(plan?.aiProvider);
  const queueCount = activeQueue.length;

  const value: RadioContextValue = {
    library,
    queue,
    currentIndex,
    playing,
    progress,
    currentTime,
    duration,
    currentTrack,
    activeQueue,
    runtime,
    runtimeBusy,
    plan,
    radio,
    taste,
    hostMessage,
    message,
    voiceStatus,
    radioHostEnabled,
    setRadioHostEnabled,
    clock,
    theme,
    setTheme,
    installPrompt,
    appInstalled,
    installApp,
    chatInput,
    setChatInput,
    errors,
    sourceHint,
    provider,
    queueCount,
    togglePlay,
    selectTrack,
    move,
    sendPlayerEvent,
    seek,
    setVolume,
    startRuntime,
    stopRuntime,
    submitChat,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
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
    </RadioContext.Provider>
  );
}
