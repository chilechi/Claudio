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
  mode: document.querySelector("#modePill"),
  voice: document.querySelector("#voiceToggle"),
  providerList: document.querySelector("#providerList"),
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

function render() {
  const activeQueue = queue.length ? queue : tracks;
  const track = activeQueue[currentIndex];
  if (!track) return;
  els.trackTitle.textContent = track.title;
  els.trackArtist.textContent = `${track.artist} · ${track.album}`;
  els.coverInitial.textContent = track.artist.slice(0, 1).toUpperCase();
  els.play.textContent = playing ? "Ⅱ" : "▶";
  els.queueCount.textContent = `${activeQueue.length} TRACKS`;
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
        <p class="queue-meta">${escapeHtml(item.artist)} · ${escapeHtml(item.duration)}</p>
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

els.theme.addEventListener("click", () => {
  const light = document.body.classList.toggle("light");
  els.theme.textContent = light ? "Light" : "Dark";
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
  document.querySelector("#providerPill").textContent = `${plan.aiProvider || "local"} brain`;
  els.reply.textContent = plan.reply;
  els.reason.textContent = plan.reason;
  speak(plan.reply);
  render();
}

async function boot() {
  const [response, stateResponse] = await Promise.all([fetch("/api/library"), fetch("/api/state")]);
  const library = await response.json();
  savedState = await stateResponse.json();
  tracks = library.tracks;
  const localScan = await fetch("/api/music/local/scan").then((item) => item.json()).catch(() => ({ tracks: [] }));
  const hasLocalTracks = Boolean(localScan.configured && localScan.tracks.length);
  if (localScan.configured && localScan.tracks.length) {
    tracks = localScan.tracks;
  }
  const byId = new Map(tracks.map((track) => [track.id, track]));
  queue = (savedState.queue || []).map((id) => byId.get(id)).filter(Boolean);
  currentIndex = Math.max(0, queue.findIndex((track) => track.id === savedState.currentTrackId));

  const planResponse = await fetch("/api/plan/today");
  const plan = await planResponse.json();
  if (!queue.length) queue = hasLocalTracks ? tracks.slice(0, 5) : plan.queue;
  els.mode.textContent = plan.mode;
  document.querySelector("#providerPill").textContent = `${plan.aiProvider || "local"} brain`;
  els.reply.textContent = plan.reply;
  els.reason.textContent = plan.reason;
  render();
  loadProviderStatus();
}

async function loadProviderStatus() {
  const response = await fetch("/api/config/status");
  const { providers } = await response.json();
  els.providerList.innerHTML = "";

  for (const provider of providers) {
    const item = document.createElement("article");
    item.className = `provider-item ${provider.state}`;
    item.innerHTML = `
      <strong>${escapeHtml(provider.label)}</strong>
      <span>${escapeHtml(provider.state)}</span>
      <p>${escapeHtml(provider.reason || "已配置")}</p>
    `;
    els.providerList.appendChild(item);
  }
}

boot().catch((error) => {
  els.reply.textContent = "Claudio 没能读到歌单。先保持安静。";
  console.error(error);
});

updateClock();
setInterval(updateClock, 30_000);
