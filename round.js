import { classifyWork, resolvePack } from "./economy.js";

const KEY = "burrowkeep-round-v1";
const $ = (id) => document.getElementById(id);
const CARRY = ["ration", "sack", "torch", "chart", "quilt"];
const GEAR = [
  { id: "quilt", cost: [80, 240] },
  { id: "chart", cost: [100, 300] },
  { id: "torch", cost: [140, 400] },
];

const COPY = {
  zh: {
    lang: "English",
    lede: "每轮结算前，从五件东西里带两件出门。Squeekchain Sepolia 确认这轮是小睡、慢跑还是冲刺之后，带回的矿砂和饱食才定下来。",
    ore: "矿砂",
    food: "饱食",
    wait: "正在读 Squeekchain 的轮子",
    live: (round, status, rpm, km) => `第 ${round} 轮还没结算 · 轮子 ${status} · ${rpm} 转/分 · 累计 ${km} 公里`,
    last: (round, name, work) => `上一轮 ${round}：${name}，做功 ${work}`,
    nap: "小睡", jog: "慢跑", sprint: "冲刺",
    ration: "干粮", sack: "袋子", torch: "火把", chart: "地图", quilt: "毯子",
    carry: "这一轮带上",
    full: "只能带两件",
    depart: "出发",
    locked: "已经出发，等这轮结算。",
    gear: "把家伙做牢一点",
    gearHint: (name, cost, level) => level >= 2 ? `${name}已经做满` : `${name}升到 ${level + 1} 级 · ${cost} 矿砂`,
    need: (n) => `还差 ${n} 矿砂`,
    logTitle: "已经过去的轮",
    emptyLog: "还没有一轮带着东西结算。",
    hungry: "饱食是 0 的时候，这一轮带回的矿砂减半。",
    preview: (name, ore, before, after) => `${name}：矿砂 ${ore > 0 ? "+" : ""}${ore}，饱食 ${before}→${after}`,
    missed: (round) => `第 ${round} 轮已经结算，这包东西没赶上。`,
    settled: (round, name, ore, food) => `第 ${round} 轮${name}：矿砂 ${ore > 0 ? "+" : ""}${ore}，饱食 ${food > 0 ? "+" : ""}${food}`,
    footer: "Round results come from confirmed Squeekchain Sepolia settlements. The page does not run the hamster or spend a wallet.",
    stream: "看轮子",
  },
  en: {
    lang: "中文",
    lede: "Carry two things before the round settles. A confirmed Squeekchain Sepolia nap, jog, or sprint decides the ore and food you bring home.",
    ore: "Ore",
    food: "Food",
    wait: "Reading the Squeekchain wheel",
    live: (round, status, rpm, km) => `Round ${round} is open · wheel ${status} · ${rpm} rpm · ${km} km`,
    last: (round, name, work) => `Round ${round}: ${name}, work ${work}`,
    nap: "Nap", jog: "Jog", sprint: "Sprint",
    ration: "Ration", sack: "Sack", torch: "Torch", chart: "Chart", quilt: "Quilt",
    carry: "Carry this round",
    full: "Only two things fit",
    depart: "Head out",
    locked: "Already out. Waiting for this round to settle.",
    gear: "Make the gear sturdier",
    gearHint: (name, cost, level) => level >= 2 ? `${name} is finished` : `${name} to level ${level + 1} · ${cost} ore`,
    need: (n) => `Need ${n} more ore`,
    logTitle: "Rounds already settled",
    emptyLog: "No packed round has settled yet.",
    hungry: "At 0 food, ore brought home is halved.",
    preview: (name, ore, before, after) => `${name}: ore ${ore > 0 ? "+" : ""}${ore}, food ${before}→${after}`,
    missed: (round) => `Round ${round} settled before this pack was home.`,
    settled: (round, name, ore, food) => `Round ${round} ${name}: ore ${ore > 0 ? "+" : ""}${ore}, food ${food > 0 ? "+" : ""}${food}`,
    footer: "Round results come from confirmed Squeekchain Sepolia settlements. The page does not run the hamster or spend a wallet.",
    stream: "Watch the wheel",
  },
};

let lang = localStorage.getItem("burrowkeep-lang") === "en" ? "en" : "zh";
let state = load();
let wheelOpen = "";
let wheelLatest = null;
let wheelLive = "";
let wheelRpm = 0;
let wheelCore = "";
let wheelKm = "";
let angle = 0;

function text() { return COPY[lang]; }
function fresh() {
  return { ore: 0, satiety: 3, levels: { quilt: 0, chart: 0, torch: 0 }, pack: [], callRound: "", resolvedRound: "", log: [], packNote: "", departed: false };
}
function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || parsed.ore == null) return fresh();
    parsed.pack = Array.isArray(parsed.pack) ? parsed.pack.filter((id) => CARRY.includes(id)).slice(0, 2) : [];
    parsed.levels = parsed.levels || { quilt: 0, chart: 0, torch: 0 };
    parsed.log = Array.isArray(parsed.log) ? parsed.log.slice(0, 8) : [];
    if (parsed.callRound && parsed.pack.length) parsed.departed = true;
    return parsed;
  } catch { return fresh(); }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function broughtHome(outcome) {
  const result = resolvePack(state.pack, state.levels, outcome);
  if (!result) return null;
  const ore = state.satiety <= 0 ? Math.floor(result.ore / 2) : result.ore;
  const satiety = Math.max(0, Math.min(8, state.satiety + result.food));
  return { ore, food: result.food, satiety };
}
function outcomeName(id) {
  const names = text();
  return names[id] || id;
}

function render() {
  const t = text();
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  $("lede").textContent = t.lede;
  $("lang").textContent = t.lang;
  $("ore").textContent = String(state.ore);
  $("ore-label").textContent = t.ore;
  $("food").textContent = `${t.food} ${state.satiety}/8`;
  $("live").textContent = [wheelLive || t.wait, state.packNote].filter(Boolean).join(" · ");
  $("last").textContent = wheelLatest ? t.last(wheelLatest.round, outcomeName(classifyWork(wheelLatest.work)), wheelLatest.work) : "";
  $("carry-label").textContent = t.carry;
  $("gear-label").textContent = t.gear;
  $("hungry").textContent = state.satiety <= 0 ? t.hungry : "";
  const preview = $("preview");
  preview.replaceChildren();
  if (state.pack.length) {
    for (const outcome of ["nap", "jog", "sprint"]) {
      const result = broughtHome(outcome);
      const line = document.createElement("p");
      line.className = "note";
      line.textContent = t.preview(outcomeName(outcome), result.ore, state.satiety, result.satiety);
      preview.appendChild(line);
    }
  }
  $("footer-line").textContent = t.footer;
  $("stream-link").textContent = t.stream;
  const carry = $("carry");
  carry.replaceChildren();
  for (const id of CARRY) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = t[id];
    button.setAttribute("aria-pressed", state.pack.includes(id) ? "true" : "false");
    button.disabled = !wheelOpen || state.departed;
    button.addEventListener("click", () => togglePack(id));
    carry.appendChild(button);
  }
  const depart = document.createElement("button");
  depart.type = "button";
  depart.id = "depart";
  depart.textContent = state.departed ? t.locked : t.depart;
  depart.disabled = state.departed || state.pack.length !== 2 || !wheelOpen;
  depart.addEventListener("click", () => {
    if (state.departed || state.pack.length !== 2 || !wheelOpen) return;
    state = { ...state, departed: true, callRound: wheelOpen, packNote: "" };
    save();
    render();
  });
  carry.appendChild(depart);
  const gear = $("gear");
  gear.replaceChildren();
  for (const item of GEAR) {
    const level = state.levels[item.id] || 0;
    const cost = item.cost[level];
    const button = document.createElement("button");
    button.type = "button";
    const name = document.createElement("strong");
    name.textContent = t[item.id];
    const hint = document.createElement("small");
    hint.textContent = t.gearHint(t[item.id], cost || 0, level);
    if (level < 2 && state.ore < cost) hint.textContent += ` · ${t.need(cost - state.ore)}`;
    button.disabled = level >= 2 || state.ore < cost;
    button.append(name, hint);
    button.addEventListener("click", () => buyGear(item));
    gear.appendChild(button);
  }
  const log = $("log");
  $("log-title").textContent = t.logTitle;
  log.replaceChildren();
  if (!state.log.length) {
    const empty = document.createElement("p");
    empty.className = "note";
    empty.textContent = t.emptyLog;
    log.appendChild(empty);
    return;
  }
  for (const line of state.log) {
    const row = document.createElement("p");
    row.textContent = line;
    log.appendChild(row);
  }
}

function togglePack(id) {
  if (!wheelOpen || state.departed) return;
  const t = text();
  if (state.pack.includes(id)) {
    state = { ...state, pack: state.pack.filter((item) => item !== id), callRound: "", packNote: "" };
  } else if (state.pack.length >= 2) {
    state = { ...state, packNote: t.full };
  } else {
    state = { ...state, pack: [...state.pack, id], callRound: "", packNote: "" };
  }
  save();
  render();
}

function buyGear(item) {
  const level = state.levels[item.id] || 0;
  const cost = item.cost[level];
  if (level >= 2 || state.ore < cost) return;
  state = { ...state, ore: state.ore - cost, levels: { ...state.levels, [item.id]: level + 1 } };
  save();
  render();
}

function settle(record) {
  if (!state.pack.length || state.callRound !== record.round || state.resolvedRound === record.round) return;
  const outcome = classifyWork(record.work);
  const home = broughtHome(outcome);
  if (!home) return;
  const satiety = Math.max(0, Math.min(8, state.satiety + home.food));
  const line = text().settled(record.round, outcomeName(outcome), home.ore, home.food);
  state = {
    ...state,
    ore: state.ore + home.ore,
    satiety,
    pack: [],
    callRound: "",
    departed: false,
    resolvedRound: record.round,
    log: [line, ...state.log].slice(0, 8),
  };
  save();
}

let pulling = false;

async function pullWheel() {
  if (pulling) return;
  pulling = true;
  try {
  const [eventsResponse, statusResponse] = await Promise.all([
    fetch("https://api.squeekchain.com/v1/events?category=protocol&limit=20").catch(() => null),
    fetch("https://api.squeekchain.com/v1/status").catch(() => null),
  ]);
  if (statusResponse?.ok) {
    const status = await statusResponse.json();
    wheelRpm = Math.round((Number(status.measurement?.rpmMilli) || 0) / 1000);
    wheelCore = status.measurement?.coreStatus || "UNKNOWN";
    wheelKm = ((Number(status.measurement?.distanceMm) || 0) / 1e6).toFixed(1);
  }
  if (eventsResponse?.ok) {
    const body = await eventsResponse.json();
    const records = [];
    for (const event of body.events || []) {
      if (event?.type !== "system.settlement_completed") continue;
      if (event.source?.confirmationStatus !== "safe") continue;
      const prev = String(event.payload?.previousSettledThroughRound || "");
      const end = String(event.payload?.settledThroughRound || "");
      const work = String(event.payload?.workAdded || "");
      if (!/^\d+$/.test(prev) || !/^\d+$/.test(end) || !/^\d+$/.test(work)) continue;
      if (BigInt(end) !== BigInt(prev) + 1n) continue;
      records.push({ round: end, work });
    }
    records.sort((a, b) => (BigInt(a.round) > BigInt(b.round) ? -1 : 1));
    if (records[0]) {
      wheelLatest = records[0];
      wheelOpen = String(BigInt(records[0].round) + 1n);
      wheelLive = text().live(wheelOpen, wheelCore || "UNKNOWN", wheelRpm, wheelKm || "0.0");
      if (state.callRound && BigInt(state.callRound) < BigInt(wheelOpen)) {
        const mine = records.find((row) => row.round === state.callRound);
        if (mine) settle(mine);
        else {
          const line = text().missed(state.callRound);
          state = { ...state, pack: [], callRound: "", departed: false, resolvedRound: records[0].round, log: [line, ...state.log].slice(0, 8) };
          save();
        }
      }
    }
  }
  render();
  } finally {
    pulling = false;
  }
}

function draw(now) {
  const canvas = $("room");
  const scale = 4;
  const width = 160;
  const height = 80;
  if (canvas.width !== width * scale) {
    canvas.width = width * scale;
    canvas.height = height * scale;
  }
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const sky = wheelLatest && classifyWork(wheelLatest.work) === "sprint" ? "#3a2a55" : "#34261c";
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#8d5a32";
  ctx.fillRect(0, 58 * scale, canvas.width, 22 * scale);
  if (wheelRpm > 0) angle += Math.min(0.2, wheelRpm / 3000);
  const cx = 112;
  const cy = 46;
  ctx.strokeStyle = "#f4efe6";
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.arc(cx * scale, cy * scale, 16 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx * scale, cy * scale);
  ctx.lineTo((cx + Math.cos(angle) * 12) * scale, (cy + Math.sin(angle) * 12) * scale);
  ctx.stroke();
  ctx.fillStyle = "#e0a060";
  ctx.fillRect(78 * scale, 50 * scale, 10 * scale, 8 * scale);
  for (const [index, id] of state.pack.entries()) {
    ctx.fillStyle = { ration: "#f2b544", sack: "#c4a574", torch: "#e26a3d", chart: "#d7e7ef", quilt: "#c45b55" }[id];
    ctx.fillRect((18 + index * 14) * scale, 62 * scale, 8 * scale, 8 * scale);
  }
  requestAnimationFrame(draw);
}

$("lang").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem("burrowkeep-lang", lang);
  render();
});

render();
pullWheel();
setInterval(pullWheel, 15000);
requestAnimationFrame(draw);
