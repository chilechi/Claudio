const tracks = [
  {
    title: "雨虹",
    artist: "曹方",
    album: "WanderLust",
    duration: "03:55"
  },
  {
    title: "一日 (The Day You Left Me)",
    artist: "丁世光",
    album: "神经志",
    duration: "05:08"
  },
  {
    title: "偶尔也有风",
    artist: "吴炳文",
    album: "偶尔也有风",
    duration: "02:50"
  },
  {
    title: "慢慢喜欢你 (Live at EasON AIR)",
    artist: "陈奕迅",
    album: "EasON AIR",
    duration: "04:19"
  }
];

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
  mode: document.querySelector("#modePill")
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
  const track = tracks[currentIndex];
  els.trackTitle.textContent = track.title;
  els.trackArtist.textContent = `${track.artist} · ${track.album}`;
  els.coverInitial.textContent = track.artist.slice(0, 1).toUpperCase();
  els.play.textContent = playing ? "Ⅱ" : "▶";

  els.queue.innerHTML = "";
  tracks.forEach((item, index) => {
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
      render();
    });
    els.queue.appendChild(li);
  });
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
}

document.querySelector("#prevBtn").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  render();
});

document.querySelector("#nextBtn").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % tracks.length;
  render();
});

document.querySelector("#playBtn").addEventListener("click", () => {
  playing = !playing;
  render();
});

document.querySelector("#likeBtn").addEventListener("click", () => {
  els.reason.textContent = "已经记下这一首。后面会多给一点相近的声音。";
});

document.querySelector("#skipBtn").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % tracks.length;
  els.reason.textContent = "这首先避开，队列往后走。";
  render();
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = els.input.value.trim();
  if (!input) return;
  els.input.value = "";
  const mode = /代码|学习|专注/.test(input) ? "coding" : /emo|难过|低落/.test(input) ? "emo" : /睡|困/.test(input) ? "bedtime" : "night";
  setMode(mode);
});

render();
