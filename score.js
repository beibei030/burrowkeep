import { columnAt, kindOf, midiBytes, noteOf, paintCloth, readSettlements } from "./cloth.js";

const COPY = {
  zh: {
    lang: "English",
    reading: "正在读已确认的结算",
    live: (round, moving) => `第 ${round} 轮还没锁针 · ${moving ? "笔在走" : "笔停着"}`,
    empty: "还没有确认过的轮次。",
    stitch: (round, kind, work) => `第 ${round} 轮 · ${kind} · 工作量 ${work}`,
    rest: "休止",
    jog: "短线",
    sprint: "重音",
    play: "播放昨夜",
    stop: "停止",
    png: "下载布",
    midi: "下载曲子",
    footer: "布和曲子只认 Squeekchain Sepolia 已确认的结算。笔只跟着轮子的转速和里程动。这页不催仓鼠跑，也不花钱包。",
    stream: "看轮子",
  },
  en: {
    lang: "中文",
    reading: "Reading confirmed settlements",
    live: (round, moving) => `Round ${round} is still open · ${moving ? "the pen is moving" : "the pen is still"}`,
    empty: "No confirmed round yet.",
    stitch: (round, kind, work) => `Round ${round} · ${kind} · work ${work}`,
    rest: "Rest",
    jog: "Short",
    sprint: "Accent",
    play: "Play last night",
    stop: "Stop",
    png: "Save cloth",
    midi: "Save score",
    footer: "The cloth and the score use confirmed Squeekchain Sepolia settlements. The pen follows wheel speed and distance. The page does not run the hamster or spend a wallet.",
    stream: "Watch the wheel",
  },
};

let voices = [];
let saved = {};
try { saved = JSON.parse(localStorage.getItem("burrowkeep-score-v1") || "{}"); } catch { saved = {}; }
let lang = saved.lang === "en" ? "en" : "zh";
let stitches = [];
let pen = { index: 0, moving: false, rpm: 0 };
let penTarget = 0;
let picked = null;
let heard = -1;
let playing = false;
let playToken = 0;
let audioCtx = null;
let baseRound = "";
let baseMm = 0;
const $ = (id) => document.getElementById(id);
const text = () => COPY[lang];

function kindName(work) {
  const kind = kindOf(work);
  return text()[kind];
}

function renderCopy() {
  const t = text();
  $("lang").textContent = t.lang;
  $("play").textContent = playing ? t.stop : t.play;
  $("png").textContent = t.png;
  $("midi").textContent = t.midi;
  $("footer-line").textContent = t.footer;
  $("stream-link").textContent = t.stream;
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hans";
  if (baseRound) $("live").textContent = t.live(String(BigInt(baseRound) + 1n), pen.moving);
  else if (!$("live").textContent) $("live").textContent = t.reading;
  if (picked) $("picked").textContent = t.stitch(picked.round, kindName(picked.work), picked.work);
  else $("picked").textContent = stitches.length ? "" : t.empty;
}

function draw() {
  if (!pen.moving) pen.index = penTarget;
  else if (pen.index < penTarget) pen.index = Math.min(penTarget, pen.index + (pen.rpm > 80 ? 3 : 1));
  else if (pen.index > penTarget) pen.index = penTarget;
  paintCloth($("cloth").getContext("2d"), stitches, pen, heard);
  const canvas = $("cloth");
  const room = canvas.parentElement.clientWidth - 24;
  const scale = room >= canvas.width * 3 ? 3 : room >= canvas.width * 2 ? 2 : 1;
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

async function pull() {
  const [eventsResponse, statusResponse] = await Promise.all([
    fetch("https://api.squeekchain.com/v1/events?category=protocol&limit=100").catch(() => null),
    fetch("https://api.squeekchain.com/v1/status").catch(() => null),
  ]);
  if (eventsResponse?.ok) stitches = readSettlements(await eventsResponse.json());
  if (statusResponse?.ok) {
    const status = await statusResponse.json();
    const round = String(status.builder?.anchor?.settledThroughRound || "");
    const mm = Number(status.measurement?.distanceMm) || 0;
    const rpm = (Number(status.measurement?.rpmMilli) || 0) / 1000;
    if (round !== baseRound) {
      baseRound = round;
      baseMm = mm;
    }
    const moving = rpm > 0 || status.measurement?.coreStatus === "SPINNING";
    penTarget = Math.min(29, Math.round(Math.max(0, mm - baseMm) / 80));
    pen = { ...pen, moving, rpm };
    $("live").textContent = round ? text().live(String(BigInt(round) + 1n), moving) : text().reading;
  }
  if (!stitches.length) {
    picked = null;
    $("picked").textContent = text().empty;
  }
  renderCopy();
  draw();
}

function beep(ctx, when, midi, duration, gain) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  voices.push(osc);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function stopPlay() {
  playing = false;
  playToken += 1;
  heard = -1;
  for (const voice of voices) {
    try { voice.stop(); } catch { /* already ended */ }
  }
  voices = [];
  renderCopy();
  draw();
}

function play() {
  if (playing) {
    stopPlay();
    return;
  }
  if (!stitches.length) return;
  audioCtx = audioCtx || new AudioContext();
  audioCtx.resume();
  playing = true;
  const token = ++playToken;
  const step = 0.22;
  stitches.forEach((stitch, index) => {
    const note = noteOf(stitch.work);
    const when = audioCtx.currentTime + index * step;
    if (note === null) return;
    beep(audioCtx, when, note, stitch.work >= 500 ? 0.18 : 0.11, stitch.work >= 500 ? 0.16 : 0.09);
    if (stitch.work >= 500) beep(audioCtx, when, note + 7, 0.18, 0.07);
  });
  stitches.forEach((stitch, index) => {
    window.setTimeout(() => {
      if (token !== playToken) return;
      heard = index;
      picked = stitch;
      $("picked").textContent = text().stitch(stitch.round, kindName(stitch.work), stitch.work);
      draw();
      if (index === stitches.length - 1) {
        window.setTimeout(() => { if (token === playToken) stopPlay(); }, 240);
      }
    }, index * 220);
  });
  renderCopy();
}

function download(bytes, name, type) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function bind() {
  $("lang").addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    localStorage.setItem("burrowkeep-score-v1", JSON.stringify({ lang }));
    renderCopy();
    pull();
  });
  $("play").addEventListener("click", play);
  $("png").addEventListener("click", () => {
    $("cloth").toBlob((blob) => { if (blob) download(blob, "burrowkeep-cloth.png", "image/png"); });
  });
  $("midi").addEventListener("click", () => {
    download(midiBytes(stitches), "burrowkeep-score.mid", "audio/midi");
  });
  $("cloth").addEventListener("mousemove", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = event.currentTarget.width / rect.width;
    const index = columnAt((event.clientX - rect.left) * scale, stitches.length);
    const stitch = stitches[index];
    if (!stitch) return;
    picked = stitch;
    $("picked").textContent = text().stitch(stitch.round, kindName(stitch.work), stitch.work);
  });
  window.setInterval(pull, 15000);
  window.setInterval(draw, 180);
}

bind();
renderCopy();
pull();
