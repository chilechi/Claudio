let tracks = [];
let queue = [];
let savedState = null;

let currentIndex = 0;
let playing = false;

const els = {
  coverInitial: document.querySelector("#coverInitial"),
  trackTitle: document.querySelector("#trackTitle"),
  trackArtist: document.querySelector("#trackArtist"),
  queue: document.querySelector("#queue"),
  play: document.querySelector("#playBtn"),
  reply: document.querySelector("#reply"),
  reason: document.querySelector("#reason"),
  form: document.querySelector("#chatForm"),
  input: document.querySelector("#chatInput"),
  mic: document.querySelector("#micBtn"),
  mode: document.querySelector("#modePill"),
  musicSource: document.querySelector("#musicSourcePill"),
  sourceHint: document.querySelector("#sourceHint"),
  voice: document.querySelector("#voiceToggle"),
  settingsSummary: document.querySelector("#settingsSummary"),
  providerList: document.querySelector("#providerList"),
  routineSegments: document.querySelector("#routineSegments"),
  tasteTags: document.querySelector("#tasteTags"),
  tasteSummary: document.querySelector("#tasteSummary"),
  audio: document.querySelector("#audioPlayer"),
  clock: document.querySelector("#clockText"),
  queueCount: document.querySelector("#queueCount"),
  currentTime: document.querySelector("#currentTime"),
  durationTime: document.querySelector("#durationTime"),
  progress: document.querySelector("#progressRange"),
  volume: document.querySelector("#volumeRange"),
  theme: document.querySelector("#themeToggle")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function aiProviderLabel(provider) {
  return provider === "deepseek" ? "DeepSeek 脑" : "本地规则脑";
}

function musicSourceLabel(source) {
  const selected = source?.selected || "auto";
  const type = source?.type || "unknown";
  const selectedLabel = { auto: "自动", local: "本地", netease: "网易云" }[selected] || selected;
  const typeLabel = { local: "本地音乐", netease: "网易云歌单", unknown: "未知来源" }[type] || type;
  return `${selectedLabel} · ${typeLabel}`;
}

function statusLabel(state) {
  return { ready: "可用", fallback: "回退", missing: "缺少" }[state] || state;
}

function render() {
  const activeQueue = queue.length ? queue : tracks;
  const track = activeQueue[currentIndex];
  if (!track) return;
  els.trackTitle.textContent = track.title;
  els.trackArtist.textContent = `${track.artist} · ${track.album}`;
  els.coverInitial.textContent = track.artist.slice(0, 1).toUpperCase();
  els.play.textContent = playing ? "暂停" : "播放";
  els.queueCount.textContent = `${activeQueue.length} 首`;
  if (track.streamUrl && els.audio.src !== new URL(track.streamUrl, window.location.href).href) {
    els.audio.src = track.streamUrl;
  }

  els.queue.innerHTML = "";
  activeQueue.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = index === currentIndex ? "active" : "";
    li.innerHTML = `
      <span class="queue-index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <p class="queue-title">${escapeHtml(item.title)}</p>
        <p class="queue-meta">${escapeHtml(item.artist)} · ${escapeHtml(item.duration || "未知时长")}</p>
      </div>
    `;
    li.addEventListener("click", () => {
      currentIndex = index;
      playing = true;
      sendPlayerEvent("play", item.id);
      render();
    });
    els.queue.appendChild(li);
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function updateClock() {
  const now = new Date();
  els.clock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function updateProgress() {
  els.currentTime.textContent = formatTime(els.audio.currentTime);
  els.durationTime.textContent = formatTime(els.audio.duration);
  els.progress.value = Number.isFinite(els.audio.duration) && els.audio.duration > 0 ? String(Math.round((els.audio.currentTime / els.audio.duration) * 1000)) : "0";
}

function currentTrack() {
  const activeQueue = queue.length ? queue : tracks;
  return activeQueue[currentIndex];
}

async function sendPlayerEvent(type, trackId = currentTrack()?.id) {
  if (!trackId) return;
  await fetch("/api/player/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, trackId })
  }).catch(() => {});
}

function setMode(mode) {
  const copy = {
    night: ["今晚适合慢一点。\n先从《雨虹》开始，后面接丁世光和吴炳文。", "偏夜晚和雨天质感，情绪在，但不会太重。"],
    coding: ["先把声音放低一点。\n这轮会更稳，不太抢注意力。", "低干扰、有一点律动，适合放在后台。"],
    emo: ["先不急着把情绪推开。\n这几首会接得比较顺。", "承认低落感，但避免继续下沉。"],
    bedtime: ["现在不放太满的歌。\n让声音轻一点，慢慢收尾。", "刺激少，编曲轻，适合睡前。"]
  };
  const [reply, reason] = copy[mode] || copy.night;
  els.mode.textContent = mode;
  els.reply.textContent = reply;
  els.reason.textContent = reason;
  speak(reply);
}

function speak(text) {
  if (!els.voice?.checked || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, " "));
  utterance.lang = "zh-CN";
  utterance.rate = 0.92;
  utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
}

function browserSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function startVoiceInput() {
  const SpeechRecognition = browserSpeechRecognition();
  if (!SpeechRecognition) {
    els.reason.textContent = "当前浏览器不支持语音输入。";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.continuous = false;

  els.mic.classList.add("listening");
  els.mic.textContent = "听";
  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    els.input.value = text;
  };
  recognition.onerror = () => {
    els.reason.textContent = "语音输入没有成功，先用文字也可以。";
  };
  recognition.onend = () => {
    els.mic.classList.remove("listening");
  els.mic.textContent = "语音";
  };
  recognition.start();
}

document.querySelector("#prevBtn").addEventListener("click", () => {
  const size = (queue.length ? queue : tracks).length;
  currentIndex = (currentIndex - 1 + size) % size;
  render();
});

document.querySelector("#nextBtn").addEventListener("click", () => {
  const size = (queue.length ? queue : tracks).length;
  currentIndex = (currentIndex + 1) % size;
  render();
});

document.querySelector("#playBtn").addEventListener("click", () => {
  playing = !playing;
  if (playing) {
    sendPlayerEvent("play");
    els.audio.play().catch(() => {
      els.reason.textContent = "当前曲目还没有可播放音频，请先配置 LOCAL_MUSIC_DIR。";
    });
  } else {
    els.audio.pause();
  }
  render();
});

document.querySelector("#likeBtn").addEventListener("click", () => {
  sendPlayerEvent("like");
  els.reason.textContent = "已经记下这一首。后面会多给一点相近的声音。";
});

document.querySelector("#favBtn").addEventListener("click", () => {
  sendPlayerEvent("like");
  els.reason.textContent = "已收藏当前声音。";
});

document.querySelector("#hideBtn").addEventListener("click", () => {
  sendPlayerEvent("skip");
  els.reason.textContent = "这首会暂时隐藏，后续少推荐。";
});

document.querySelector("#skipBtn").addEventListener("click", () => {
  sendPlayerEvent("skip");
  const size = (queue.length ? queue : tracks).length;
  currentIndex = (currentIndex + 1) % size;
  els.reason.textContent = "这首先避开，队列往后走。";
  render();
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

els.mic.addEventListener("click", startVoiceInput);

els.theme.addEventListener("click", () => {
  const light = document.body.classList.toggle("light");
  els.theme.textContent = light ? "亮色" : "暗色";
});

els.volume.addEventListener("input", () => {
  els.audio.volume = Number(els.volume.value);
});

els.progress.addEventListener("input", () => {
  if (!Number.isFinite(els.audio.duration) || els.audio.duration <= 0) return;
  els.audio.currentTime = (Number(els.progress.value) / 1000) * els.audio.duration;
});

els.audio.addEventListener("timeupdate", updateProgress);
els.audio.addEventListener("loadedmetadata", updateProgress);
els.audio.addEventListener("ended", () => {
  document.querySelector("#nextBtn").click();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = els.input.value.trim();
  if (!input) return;
  els.input.value = "";
  sendChat(input).catch((error) => {
    els.reply.textContent = "刚才没有接住。先保持当前队列。";
    console.error(error);
  });
});

async function sendChat(input) {
  els.reply.textContent = "Claudio 正在整理这一轮。";
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  });
  const plan = await response.json();
  queue = plan.queue;
  currentIndex = 0;
  playing = true;
  els.mode.textContent = plan.mode;
  document.querySelector("#providerPill").textContent = aiProviderLabel(plan.aiProvider || "local");
  els.reply.textContent = plan.reply;
  els.reason.textContent = plan.reason;
  speak(plan.reply);
  render();
}

async function boot() {
  const [response, stateResponse] = await Promise.all([fetch("/api/music/active-library"), fetch("/api/state")]);
  const library = await response.json();
  savedState = await stateResponse.json();
  tracks = library.tracks;
  els.musicSource.textContent = musicSourceLabel(library.source);
  els.sourceHint.textContent = library.fallbackReason || `当前音乐源：${musicSourceLabel(library.source)}。`;
  const byId = new Map(tracks.map((track) => [track.id, track]));
  queue = (savedState.queue || []).map((id) => byId.get(id)).filter(Boolean);
  currentIndex = Math.max(0, queue.findIndex((track) => track.id === savedState.currentTrackId));

  const planResponse = await fetch("/api/plan/today");
  const plan = await planResponse.json();
  if (!queue.length) queue = plan.queue?.length ? plan.queue : tracks.slice(0, 5);
  els.mode.textContent = plan.mode;
  document.querySelector("#providerPill").textContent = aiProviderLabel(plan.aiProvider || "local");
  els.reply.textContent = plan.reply;
  els.reason.textContent = plan.reason;
  render();
  loadProviderStatus().catch(() => {});
  loadRadioPlan().catch(() => {
    els.reason.textContent = "今日电台没有生成成功，请检查服务端日志。";
  });
  loadTasteProfile().catch(() => {
    els.tasteSummary.textContent = "长期口味暂时不可用。";
  });
}

async function loadProviderStatus() {
  const response = await fetch("/api/settings/diagnostics");
  const diagnostics = await response.json();
  const providers = diagnostics.providers || [];

  els.settingsSummary.innerHTML = `
    <span>可用 ${diagnostics.summary?.ready || 0}</span>
    <span>回退 ${diagnostics.summary?.fallback || 0}</span>
    <span>缺少 ${diagnostics.summary?.missing || 0}</span>
    <span>${escapeHtml(diagnostics.secretPolicy || "不展示密钥原文")}</span>
  `;
  els.providerList.innerHTML = "";

  for (const provider of providers) {
    const item = document.createElement("article");
    item.className = `provider-item ${provider.state}`;
    const envVars = (provider.envVars || []).join(" / ");
    item.innerHTML = `
      <strong>${escapeHtml(provider.label)}</strong>
      <span>${escapeHtml(statusLabel(provider.state))}</span>
      <p>${escapeHtml(provider.detail || provider.reason || "已配置")}</p>
      <small class="provider-env">${escapeHtml(envVars || "无需配置")}</small>
    `;
    els.providerList.appendChild(item);
  }
}

async function loadRadioPlan() {
  const response = await fetch("/api/radio/today");
  const plan = await response.json();
  if (!response.ok) throw new Error(plan.error || "radio plan failed");

  els.reason.textContent = plan.reason;
  els.routineSegments.innerHTML = "";

  const slotItem = document.createElement("div");
  slotItem.className = "routine-item";
  slotItem.innerHTML = `
    <strong>${escapeHtml(plan.slot?.label || plan.mode)}</strong>
    <span>${escapeHtml(plan.slot?.prompt || plan.reply || "")}</span>
  `;
  els.routineSegments.appendChild(slotItem);

  const calendarItem = document.createElement("div");
  calendarItem.className = "routine-item";
  calendarItem.innerHTML = `
    <strong>日历</strong>
    <span>${escapeHtml(plan.calendar?.configured ? "已连接" : plan.calendar?.reason || "未连接")}</span>
  `;
  els.routineSegments.appendChild(calendarItem);
}

async function loadTasteProfile() {
  const response = await fetch("/api/taste/profile");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "taste profile failed");

  const profile = data.profile || {};
  els.tasteSummary.textContent = `喜欢 ${profile.likedCount || 0} 首，跳过 ${profile.skippedCount || 0} 首。画像来自当前真实歌库和播放事件。`;
  els.tasteTags.innerHTML = "";

  for (const item of profile.topTags || []) {
    const tag = document.createElement("span");
    tag.textContent = `${item.tag} · ${item.count ?? item.score ?? 0}`;
    els.tasteTags.appendChild(tag);
  }

  if (!els.tasteTags.children.length) {
    const empty = document.createElement("span");
    empty.textContent = "暂无足够口味记录";
    els.tasteTags.appendChild(empty);
  }
}

boot().catch((error) => {
  els.reply.textContent = "Claudio 没能读到歌单。先保持安静。";
  console.error(error);
});

updateClock();
setInterval(updateClock, 30_000);
