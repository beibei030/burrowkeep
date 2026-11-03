import { ACTIONS, CAP, KEEPSAKES, OUTCOMES, apply, braceChart, classify, gradeBrace, nightMarks, ownedKeepsakes, rehearsalDeck, settlementRecords } from "./rules.js";

const LIVE_KEY = "burrowkeep-live-v1";
const LANG_KEY = "burrowkeep-lang";
const STATUS_URL = "https://api.squeekchain.com/v1/status";
const CLOCK_URL = "https://api.squeekchain.com/v1/settlements";
const EVENTS_URL = "https://api.squeekchain.com/v1/events?category=protocol&limit=100";

const COPY = {
  zh: {
    lang: "English",
    lede: "每一轮真实的轮上记录会把洞摇起来。哪里亮了就按哪里，接住才留得下东西。",
    volume: (n, survived, best) => `第 ${n} 卷 · 已撑 ${survived} 轮 · 最长 ${best}`,
    short: { stores: "粮", lamp: "灯", timber: "梁" },
    hold: "不动",
    volumeEnd: "这一卷结束",
    mark: "夜功",
    gotMarks: (n) => `夜功 +${n}`,
    keepsake: { rug: "毛毯", bell: "铜铃", moon: "月缝", nest: "草窝" },
    marksLine: (n, next) => (next ? `夜功 ${n} · 下一件${next.name}还差 ${next.left}` : `夜功 ${n} · 洞里的东西都留住了`),
    practiceMarks: (n) => `这场排演的夜功 ${n}，不带回今夜`,
    unlocked: (name) => `新的东西留在洞里：${name}`,
    stream: "看轮子",
    live: "今夜",
    practice: "排演已写下的夜",
    stores: "储粮",
    lamp: "灯油",
    timber: "梁",
    stock: "收粮",
    trim: "剪灯",
    shore: "撑梁",
    listen: "只听",
    hints: {
      stock: "安静的时候把罐子装满",
      trim: "轮子转起来再管灯",
      shore: "有节奏时把梁撑住",
      listen: "什么都不做",
    },
    outcomes: { nap: "睡着", jog: "小跑", zoomies: "冲刺", bundled: "并在一起", missed: "没赶上" },
    wheel: {
      unknown: "轮子的信号不清楚。先别把它当成停下。",
      still: "轮子现在停着。这一轮还没结算，他仍可能跑起来。",
      gentle: "轮子在慢慢转。结算之前，这一轮仍可能变。",
      hard: "轮子转得很急。结算之前，他仍可能停下来。",
      sealed: "这一轮已经写在记录里。先看代价，再选。",
    },
    clockUnknown: "还没有读到这一轮几点结束。",
    clockOpen: (round, left) => `第 ${round} 轮 · 还剩 ${left}`,
    clockLock: (round, left) => `第 ${round} 轮 · ${left} 后锁上`,
    clockWait: (round) => `第 ${round} 轮已经结束，在等它的结算。`,
    clockGap: "两轮之间。下一轮的钟还没出现。",
    promptLive: "这一轮结束前，你做什么？",
    promptLate: "最后二十秒。选定之后就不能改。",
    promptLocked: "选择已经锁上。",
    promptWait: "在等链上的这一轮。",
    promptPractice: "这一轮还没揭晓。开始之后，亮了就按。",
    startBrace: (round) => `开始接第 ${round} 轮`,
    playLive: (round) => `接住刚写下的第 ${round} 轮`,
    braceProgress: (hits, total) => `接住 ${hits}/${total}`,
    braceMiss: "没按上。",
    station: { stores: "接粮", lamp: "护灯", timber: "扶梁" },
    caught: (hits, total) => `接住了 ${hits}/${total}`,
    promptClosed: "这一卷结束了。排演停在这里。",
    promptDone: "这十二轮排演完了。",
    noteDefault: "结束前二十秒会锁上。你若一直不选，又从这一轮开始就在看，就按「只听」记。",
    noteLate: "你是最后二十秒才进来的。不选就不记这一轮，不会被算成只听。",
    notePending: (n) => `还有 ${n} 轮在等结算。`,
    revealWork: (work) => `这一轮记下 ${work} 次轮上计数。`,
    revealBundled: "这次结算把好几轮并在一起，分不出每一轮。这一下不算。",
    revealMissed: "这一轮滑出了这页能看见的记录。不算进洞穴。",
    nextRound: "下一轮",
    again: "再排演一次",
    loading: "在读已经结算的轮次。",
    practiceLatest: "这是记录里最近的十二个单轮结算。",
    practiceEarlier: "最近这一段他几乎没跑。这里改读更早的十二轮，里面既有睡着，也有在跑。",
    practiceEmpty: "记录里没有可以单独结算的一轮。排演先停着。",
    practiceError: "这一次没读到记录。洞穴还在，过一会儿再试。",
    chronicle: "已经写下的页",
    chronicleLive: "今夜锁上并结算过的页。",
    chroniclePractice: "只属于这次排演，不改你正在守的那一卷。",
    empty: "还没有一页。",
    lost: { stores: "储粮见底", lamp: "灯灭了", timber: "梁断了" },
    newVolume: "新的一卷从三罐粮、三格灯油、三根梁重新开始。",
    tx: "Sepolia 上的这笔结算",
    rules: "这一夜怎么算",
    rulesIntro: "只在结算正好盖住一轮时才算。0 是睡着，1 到 499 是小跑，500 及以上是冲刺。夜功等于这一下真正留下的净添置：加上的减去失去的，小于 0 记 0。这一卷因此结束就记 0。已经满到 5 的不会再加。只听着他睡着，净添置是 0。听着的小跑先补灯，灯满了才补粮。",
    rulesCap: "任何一项掉到 0，这一卷结束。",
    footer: "Burrowkeep is a survival night settled on Squeekchain rounds. Testnet only. The hamster is not made to run.",
    lines: {
      stock: {
        nap: "安静让罐子自己稳住了。",
        jog: "轮子在晃的时候，你躲在粮架后面。",
        zoomies: "这一阵跑把藏粮震了出来，灯也被烟熏了。",
      },
      trim: {
        nap: "没有风，你却把灯芯剪短了。",
        jog: "跑得稳，火焰干净。",
        zoomies: "轮子甩出火星。你喂给了灯，花掉一点粮。",
      },
      shore: {
        nap: "墙没有动，你却敲了很久。",
        jog: "你跟上了那一阵节奏。",
        zoomies: "冲刺想把洞压塌。支架撑住了，粮被花掉。",
      },
      listen: {
        nap: "你听见他睡着。洞穴里什么都没动。",
        jog: "你数了步子。",
        zoomies: "你站在门口，粮、灯和梁都晃了一下。",
      },
    },
  },
  en: {
    lang: "中文",
    lede: "Each real round shakes the burrow. Press the station that lights. What you catch is what stays.",
    volume: (n, survived, best) => `Volume ${n} · ${survived} rounds · best ${best}`,
    short: { stores: "stores", lamp: "lamp", timber: "timber" },
    hold: "holds",
    volumeEnd: "volume ends",
    mark: "marks",
    gotMarks: (n) => `+${n} marks`,
    keepsake: { rug: "rug", bell: "bell", moon: "moon crack", nest: "nest" },
    marksLine: (n, next) => (next ? `${n} marks · ${next.name} in ${next.left}` : `${n} marks · the burrow is furnished`),
    practiceMarks: (n) => `Rehearsal marks ${n}. They stay in the rehearsal.`,
    unlocked: (name) => `Something new stays in the burrow: ${name}`,
    stream: "Watch the wheel",
    live: "Tonight",
    practice: "Rehearse a written night",
    stores: "Stores",
    lamp: "Lamp",
    timber: "Timber",
    stock: "Stock",
    trim: "Trim",
    shore: "Shore",
    listen: "Listen",
    hints: {
      stock: "Fill the jars while it is quiet",
      trim: "Tend the lamp once the wheel turns",
      shore: "Brace the beams to the rhythm",
      listen: "Do nothing",
    },
    outcomes: { nap: "nap", jog: "jog", zoomies: "sprint", bundled: "bundled", missed: "unseen" },
    wheel: {
      unknown: "The wheel's signal is unclear. Do not treat that as stillness.",
      still: "The wheel is still right now. This round is not settled, and he can still run.",
      gentle: "The wheel is turning gently. The round can still change before it settles.",
      hard: "The wheel is turning hard. He can still stop before the round settles.",
      sealed: "This round is already in the record. Read the cost, then choose.",
    },
    clockUnknown: "The round clock has not been read yet.",
    clockOpen: (round, left) => `Round ${round} · ${left} left`,
    clockLock: (round, left) => `Round ${round} · locks in ${left}`,
    clockWait: (round) => `Round ${round} is over. Waiting for its settlement.`,
    clockGap: "Between rounds. The next clock is not up yet.",
    promptLive: "What do you do before this round ends?",
    promptLate: "The last twenty seconds. A choice sticks.",
    promptLocked: "Your choice is locked.",
    promptWait: "Waiting for this round onchain.",
    promptPractice: "This round stays hidden. When it starts, press whatever lights.",
    startBrace: (round) => `Catch round ${round}`,
    playLive: (round) => `Catch the round just written, ${round}`,
    braceProgress: (hits, total) => `Caught ${hits}/${total}`,
    braceMiss: "Missed.",
    station: { stores: "Grain", lamp: "Lamp", timber: "Beam" },
    caught: (hits, total) => `Caught ${hits}/${total}`,
    promptClosed: "This volume is over. The rehearsal stops here.",
    promptDone: "Those twelve rounds are read.",
    noteDefault: "The choice locks twenty seconds before the end. If you watched from the start and never chose, it is counted as Listen.",
    noteLate: "You arrived in the last twenty seconds. Leaving it blank does not count as Listen.",
    notePending: (n) => `${n} round${n === 1 ? "" : "s"} still waiting on a settlement.`,
    revealWork: (work) => `The round recorded ${work} wheel counts.`,
    revealBundled: "That settlement covered several rounds, so this one does not count.",
    revealMissed: "That round slipped out of the record this page can see. The burrow is unchanged.",
    nextRound: "Next round",
    again: "Rehearse again",
    loading: "Reading settled rounds.",
    practiceLatest: "The twelve most recent single-round settlements.",
    practiceEarlier: "The latest stretch is almost all stillness. These twelve are an earlier stretch with both sleep and running.",
    practiceEmpty: "No single-round settlement was in the record.",
    practiceError: "The record did not load. The burrow is still here.",
    chronicle: "Pages already written",
    chronicleLive: "Pages locked and settled tonight.",
    chroniclePractice: "This rehearsal only. It does not touch the volume you are keeping.",
    empty: "No pages yet.",
    lost: { stores: "The stores ran out", lamp: "The lamp went out", timber: "A beam gave way" },
    newVolume: "The next volume starts again at three jars, three measures of oil, and three beams.",
    tx: "Settlement on Sepolia",
    rules: "How a night is scored",
    rulesIntro: "A round counts only when its settlement covers that round alone. 0 is a nap, 1–499 a jog, 500 or more a sprint. Night marks are the net added that round: gains minus losses, and a negative net is 0. The round scores 0 if the volume ends. A store already at 5 does not add more. Listening through a nap adds nothing. Listening through a jog fills the lamp first, then the stores.",
    rulesCap: "If any store hits 0, the volume ends.",
    footer: "Burrowkeep is a survival night settled on Squeekchain rounds. Testnet only. The hamster is not made to run.",
    lines: {
      stock: {
        nap: "The quiet let the jars settle.",
        jog: "You were in the pantry while the wheel shook the posts.",
        zoomies: "The sprint shook a cache loose and soot'd the lamp.",
      },
      trim: {
        nap: "You trimmed a wick that had nothing to burn.",
        jog: "A steady run. A clean flame.",
        zoomies: "The wheel threw sparks. You fed them and spent grain.",
      },
      shore: {
        nap: "You hammered a wall that was not moving.",
        jog: "You caught the rhythm and braced.",
        zoomies: "The sprint tried to cave the burrow. The braces held.",
      },
      listen: {
        nap: "You heard him sleep. Nothing in the burrow moved.",
        jog: "You counted the steps.",
        zoomies: "You stood in the doorway. Grain, lamp, and timber all shifted.",
      },
    },
  },
};

const $ = (id) => document.getElementById(id);

let lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh";
let mode = "live";
let live = loadLive();
let clock = null;
let wheel = { kind: "unknown", rpm: 0 };
let records = { ok: false, byRound: new Map(), singles: [], oldest: null, frontier: null };
let practice = freshPractice();
let angle = 0;
let spin = 0;
const shown = { stores: 3, lamp: 3, timber: 3 };
let lastFrame = 0;
let fetchError = "";

function text() {
  return COPY[lang];
}

function freshLive() {
  return {
    version: 1,
    volume: 1,
    stores: 3,
    lamp: 3,
    timber: 3,
    survived: 0,
    best: 0,
    marks: 0,
    keepsakes: [],
    freshKeepsake: null,
    freshAt: 0,
    openRound: null,
    choice: null,
    locked: false,
    sawBeforeLock: false,
    pending: [],
    pages: [],
  };
}

function freshPractice() {
  return {
    status: "idle",
    deck: [],
    index: 0,
    phase: "choose",
    volume: 1,
    stores: 3,
    lamp: 3,
    timber: 3,
    survived: 0,
    best: 0,
    marks: 0,
    pages: [],
    closed: false,
    page: null,
    kind: "latest",
  };
}

function loadLive() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
    if (!parsed || parsed.version !== 1) return freshLive();
    const resourceOk = ["stores", "lamp", "timber"].every(
      (key) => Number.isInteger(parsed[key]) && parsed[key] >= 0 && parsed[key] <= CAP,
    );
    if (!resourceOk || !Number.isInteger(parsed.volume) || parsed.volume < 1) return freshLive();
    parsed.pending = Array.isArray(parsed.pending)
      ? parsed.pending.filter((item) => /^\d+$/.test(item?.round) && ACTIONS.includes(item?.action))
      : [];
    parsed.pages = Array.isArray(parsed.pages) ? parsed.pages.slice(-80) : [];
    if (!Number.isInteger(parsed.survived) || parsed.survived < 0) parsed.survived = 0;
    if (!Number.isInteger(parsed.best) || parsed.best < 0) parsed.best = 0;
    if (!Number.isInteger(parsed.marks) || parsed.marks < 0) parsed.marks = 0;
    parsed.keepsakes = Array.isArray(parsed.keepsakes)
      ? parsed.keepsakes.filter((id) => KEEPSAKES.some((item) => item.id === id))
      : [];
    if (!ACTIONS.includes(parsed.choice)) parsed.choice = null;
    return parsed;
  } catch {
    return freshLive();
  }
}

function saveLive() {
  localStorage.setItem(LIVE_KEY, JSON.stringify(live));
}

function resourcesOf(source) {
  return { stores: source.stores, lamp: source.lamp, timber: source.timber };
}

function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readClock(body) {
  if (!body || body.schemaVersion !== 3 || body.status !== "available") return null;
  if (String(body.chain?.chainId) !== "11155111") return null;
  const next = body.mining?.nextRound;
  if (!next || !/^\d+$/.test(String(next.round))) return null;
  const endsAt = Date.parse(next.endsAt);
  if (!Number.isFinite(endsAt)) return null;
  return { round: String(next.round), endsAt, state: next.state };
}

function readWheel(body) {
  if (!body || body.schemaVersion !== 1 || !body.measurement) return { kind: "unknown", rpm: 0 };
  const measurement = body.measurement;
  if (measurement.freshness !== "online" || typeof measurement.rpmMilli !== "number") {
    return { kind: "unknown", rpm: 0 };
  }
  const rpm = measurement.rpmMilli / 1000;
  if (!Number.isFinite(rpm) || rpm < 0) return { kind: "unknown", rpm: 0 };
  if (measurement.coreStatus !== "SPINNING" && rpm < 0.5) return { kind: "still", rpm: 0 };
  return { kind: rpm >= 40 ? "hard" : "gentle", rpm };
}

function enqueue(round, action) {
  if (live.pending.some((item) => item.round === round)) return;
  live.pending.push({ round, action });
}

function closeOpenRound() {
  if (!live.openRound || live.locked || !live.sawBeforeLock) return;
  live.locked = true;
  enqueue(live.openRound, live.choice || "listen");
}

function syncLive() {
  return false;
}

function resolvePending() {
  return false;
}

function chooseLive(action) {
  if (mode !== "live" || !clock || Date.now() >= clock.endsAt || live.locked) return;
  if (live.openRound !== clock.round) return;
  live.choice = action;
  if (Date.now() >= clock.endsAt - 20000) {
    live.locked = true;
    enqueue(clock.round, action);
  }
  saveLive();
  render();
}

function practiceChoose(action) {
  const round = practice.deck[practice.index];
  if (!round || practice.phase !== "choose" || practice.closed) return;
  const outcome = classify(round.work);
  const result = apply(resourcesOf(practice), action, outcome);
  const gained = nightMarks(result.delta, result.lost);
  const page = {
    round: round.round.toString(),
    action,
    outcome,
    work: round.work.toString(),
    tx: round.tx,
    delta: result.delta,
    lost: result.lost,
    marks: gained,
    volume: practice.volume,
  };
  if (!result.lost.length) {
    const before = ownedKeepsakes(practice.marks).length;
    practice.marks += gained;
    const after = ownedKeepsakes(practice.marks);
    if (after.length > before) {
      practice.freshKeepsake = after[after.length - 1].id;
      practice.freshAt = Date.now();
    }
  }
  practice.pages.push(page);
  practice.page = page;
  practice.phase = "reveal";
  if (result.lost.length) {
    practice.best = Math.max(practice.best, practice.survived + 1);
    practice.survived = 0;
    practice.closed = true;
    practice.volume += 1;
    practice.stores = 3;
    practice.lamp = 3;
    practice.timber = 3;
  } else {
    practice.survived += 1;
    practice.best = Math.max(practice.best, practice.survived);
    Object.assign(practice, result.resources);
  }
  render();
}

function practiceNext() {
  if (practice.closed) return;
  if (practice.index + 1 >= practice.deck.length) {
    practice.status = "done";
    practice.phase = "choose";
    practice.page = null;
    render();
    return;
  }
  practice.index += 1;
  practice.phase = "choose";
  practice.page = null;
  render();
}

async function startPractice() {
  mode = "practice";
  practice = freshPractice();
  practice.status = "loading";
  render();
  try {
    const body = await fetchJson(EVENTS_URL);
    const parsed = settlementRecords(body);
    if (!parsed.ok) throw new Error(parsed.reason);
    const picked = rehearsalDeck(parsed.singles);
    practice.deck = picked.deck;
    practice.kind = picked.kind;
    practice.status = practice.deck.length ? "ready" : "empty";
  } catch {
    practice.status = "error";
  }
  render();
}

function chips(delta) {
  const t = text();
  const wrap = document.createElement("div");
  wrap.className = "chips";
  for (const key of ["stores", "lamp", "timber"]) {
    const amount = delta?.[key] || 0;
    if (!amount) continue;
    const chip = document.createElement("span");
    chip.className = `chip ${amount > 0 ? "up" : "down"}`;
    chip.textContent = `${t[key]} ${amount > 0 ? "+" : ""}${amount}`;
    wrap.appendChild(chip);
  }
  return wrap;
}

function txLink(hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash || "")) return null;
  const link = document.createElement("a");
  link.href = `https://sepolia.etherscan.io/tx/${hash}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = text().tx;
  return link;
}

function drawCard(canvas, page) {
  const ctx = canvas.getContext("2d");
  const colors = { nap: "#d5e0ea", jog: "#f0d7a4", zoomies: "#e7b09a", bundled: "#ddd4c6", missed: "#ddd4c6" };
  ctx.fillStyle = colors[page.outcome] || "#efe2cb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#2a2118";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(46, 36, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(46, 22);
  ctx.lineTo(46, 50);
  ctx.moveTo(28, 36);
  ctx.lineTo(64, 36);
  ctx.stroke();
}

function renderPages(pages) {
  const t = text();
  const root = $("pages");
  root.replaceChildren();
  if (!pages.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t.empty;
    root.appendChild(empty);
    return;
  }
  for (const page of [...pages].reverse()) {
    const card = document.createElement("article");
    card.className = "card";
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 96;
    drawCard(canvas, page);
    const title = document.createElement("h3");
    title.textContent = `${page.round} · ${t[page.action] || ""} · ${t.outcomes[page.outcome] || ""}`;
    const prose = document.createElement("p");
    prose.textContent = t.lines[page.action]?.[page.outcome]
      || (page.outcome === "bundled" ? t.revealBundled : t.revealMissed);
    card.append(canvas, title, prose, chips(page.delta));
    if (page.lost?.length) {
      const mark = document.createElement("p");
      mark.className = "ended-mark";
      mark.textContent = `${page.lost.map((key) => t.lost[key]).join(" · ")} ${t.newVolume}`;
      card.appendChild(mark);
    }
    const link = txLink(page.tx);
    if (link) card.appendChild(link);
    root.appendChild(card);
  }
}

function renderMeters(source) {
  const t = text();
  const root = $("meters");
  root.replaceChildren();
  for (const key of ["stores", "lamp", "timber"]) {
    const block = document.createElement("div");
    block.className = `meter ${key}`;
    const name = document.createElement("span");
    name.textContent = t[key];
    const value = document.createElement("strong");
    value.textContent = `${source[key]}/${CAP}`;
    const pips = document.createElement("div");
    pips.className = "pips";
    for (let i = 0; i < CAP; i += 1) {
      const pip = document.createElement("i");
      pip.className = i < source[key] ? "pip on" : "pip";
      pips.appendChild(pip);
    }
    block.append(name, value, pips);
    root.appendChild(block);
  }
}

function renderActions(selected, disabled, onPick, resources) {
  const t = text();
  const root = $("actions");
  root.replaceChildren();
  for (const action of ACTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = disabled;
    button.setAttribute("aria-pressed", String(selected === action));
    const name = document.createElement("strong");
    name.textContent = t[action];
    const hint = document.createElement("small");
    hint.textContent = t.hints[action];
    const stakes = document.createElement("small");
    stakes.className = "stakes";
    for (const outcome of OUTCOMES) {
      const result = apply(resources, action, outcome);
      const line = document.createElement("span");
      const bits = ["stores", "lamp", "timber"]
        .filter((key) => result.delta[key])
        .map((key) => `${t.short[key]} ${result.delta[key] > 0 ? "+" : ""}${result.delta[key]}`);
      const gained = nightMarks(result.delta, result.lost);
      line.textContent = `${t.outcomes[outcome]} ${bits.join(" ") || t.hold} · ${t.mark} +${gained}`;
      if (result.lost.length) {
        line.className = "bad";
        line.textContent += ` · ${t.volumeEnd}`;
      }
      stakes.appendChild(line);
    }
    button.append(name, hint, stakes);
    button.addEventListener("click", () => onPick(action));
    root.appendChild(button);
  }
}

function renderReveal(page, showNext) {
  const box = $("reveal");
  const t = text();
  if (!page) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  box.hidden = false;
  box.replaceChildren();
  const prose = document.createElement("p");
  prose.textContent = t.lines[page.action]?.[page.outcome] || t.revealMissed;
  box.appendChild(prose);
  if (page.work !== null) {
    const work = document.createElement("p");
    work.textContent = t.revealWork(page.work);
    box.appendChild(work);
  }
  if (Number.isInteger(page.marks)) {
    const marks = document.createElement("p");
    marks.textContent = text().gotMarks(page.marks);
    box.appendChild(marks);
  }
  box.appendChild(chips(page.delta));
  const link = txLink(page.tx);
  if (link) box.appendChild(link);
  if (page.lost?.length) {
    const ended = document.createElement("p");
    ended.textContent = `${page.lost.map((key) => t.lost[key]).join(" · ")} ${t.newVolume}`;
    box.appendChild(ended);
  }
  if (showNext) {
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = practice.closed ? t.again : t.nextRound;
    next.addEventListener("click", () => {
      if (practice.closed || practice.status === "done") startPractice();
      else practiceNext();
    });
    box.appendChild(next);
  }
}

function renderRules() {
  const t = text();
  $("rules-summary").textContent = t.rules;
  const body = $("rules-body");
  body.replaceChildren();
  const intro = document.createElement("p");
  intro.textContent = t.rulesIntro;
  const table = document.createElement("table");
  table.className = "rule-table";
  const head = document.createElement("tr");
  for (const label of ["", ...OUTCOMES.map((outcome) => t.outcomes[outcome])]) {
    const cell = document.createElement("th");
    cell.textContent = label;
    head.appendChild(cell);
  }
  table.appendChild(head);
  for (const action of ACTIONS) {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.textContent = t[action];
    row.appendChild(name);
    for (const outcome of OUTCOMES) {
      const cell = document.createElement("td");
      const result = apply({ stores: 3, lamp: 3, timber: 3 }, action, outcome);
      const marks = nightMarks(result.delta, result.lost);
      cell.textContent = `${["stores", "lamp", "timber"]
        .filter((key) => result.delta[key])
        .map((key) => `${t[key]} ${result.delta[key] > 0 ? "+" : ""}${result.delta[key]}`)
        .join(", ") || "—"} · ${t.mark} +${marks}`;
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  const cap = document.createElement("p");
  cap.textContent = t.rulesCap;
  body.append(intro, table, cap);
}

function render() {
  const t = text();
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  $("lede").textContent = t.lede;
  $("lang").textContent = t.lang;
  $("tab-live").textContent = t.live;
  $("tab-practice").textContent = t.practice;
  $("tab-live").setAttribute("aria-selected", String(mode === "live"));
  $("tab-practice").setAttribute("aria-selected", String(mode === "practice"));
  $("chronicle-title").textContent = t.chronicle;
  $("footer-line").textContent = t.footer;
  $("stream-link").textContent = t.stream;
  paintReward();
  renderRules();

  if (mode === "practice") {
    $("volume").textContent = t.volume(practice.volume, practice.survived, practice.best);
    $("chronicle-hint").textContent = t.chroniclePractice;
    renderMeters(practice);
    renderPages(practice.pages);
    $("wheel-line").textContent = t.wheel.sealed;
    if (practice.status === "loading") {
      $("clock").textContent = t.loading;
      $("prompt").textContent = "";
      $("note").textContent = "";
      renderActions(null, true, () => {}, resourcesOf(practice));
      renderReveal(null, false);
      return;
    }
    if (practice.status === "error" || practice.status === "empty") {
      $("clock").textContent = practice.status === "empty" ? t.practiceEmpty : t.practiceError;
      $("prompt").textContent = "";
      $("note").textContent = "";
      renderActions(null, true, () => {}, resourcesOf(practice));
      renderReveal(null, false);
      return;
    }
    if (practice.status === "done") {
      $("clock").textContent = t.promptDone;
      $("prompt").textContent = "";
      $("note").textContent = "";
      renderActions(null, true, () => {}, resourcesOf(practice));
      renderReveal(null, false);
      const again = document.createElement("button");
      again.type = "button";
      again.textContent = t.again;
      again.addEventListener("click", startPractice);
      $("reveal").hidden = false;
      $("reveal").replaceChildren(again);
      return;
    }
    const round = practice.deck[practice.index];
    $("clock").textContent = `${round.round.toString()} · ${practice.index + 1}/${practice.deck.length}`;
    $("prompt").textContent = practice.closed
      ? t.promptClosed
      : (practice.phase === "reveal" ? "" : t.promptPractice);
    $("note").textContent = t[practice.kind === "earlier" ? "practiceEarlier" : "practiceLatest"];
    renderActions(practice.page?.action || null, practice.phase !== "choose" || practice.closed, practiceChoose, resourcesOf(practice));
    renderReveal(practice.phase === "reveal" ? practice.page : null, practice.phase === "reveal");
    return;
  }

  $("volume").textContent = t.volume(live.volume, live.survived, live.best);
  $("chronicle-hint").textContent = t.chronicleLive;
  renderMeters(live);
  renderPages(live.pages);
  $("wheel-line").textContent = fetchError || t.wheel[wheel.kind] || t.wheel.unknown;
  const now = Date.now();
  let clockLine = t.clockUnknown;
  let prompt = t.promptLive;
  let disabled = true;
  if (!clock) {
    prompt = "";
  } else if (now < clock.endsAt && live.openRound === clock.round) {
    const left = formatLeft(clock.endsAt - now);
    const inLock = now >= clock.endsAt - 20000;
    clockLine = inLock ? t.clockLock(clock.round, left) : t.clockOpen(clock.round, left);
    disabled = live.locked;
    prompt = live.locked ? t.promptLocked : (inLock ? t.promptLate : t.promptLive);
  } else if (clock && now >= clock.endsAt) {
    clockLine = t.clockWait(clock.round);
    prompt = t.promptWait;
  } else {
    clockLine = t.clockGap;
    prompt = "";
  }
  $("clock").textContent = clockLine;
  $("prompt").textContent = prompt;
  const notes = [];
  if (clock && live.openRound === clock.round && !live.sawBeforeLock && now < clock.endsAt) notes.push(t.noteLate);
  else if (!live.locked && clock && now < clock.endsAt && live.openRound === clock.round) notes.push(t.noteDefault);
  if (live.pending.length) notes.push(t.notePending(live.pending.length));
  if (fetchError) notes.push(fetchError);
  $("note").textContent = notes.join(" ");
  renderActions(live.choice, disabled, chooseLive, resourcesOf(live));
  renderReveal(live.pages[live.pages.length - 1] || null, false);
}

function updateLiveChrome() {
  if (mode !== "live") return;
  const before = JSON.stringify({
    open: live.openRound,
    choice: live.choice,
    locked: live.locked,
    pending: live.pending.length,
    pages: live.pages.length,
    volume: live.volume,
  });
  syncLive(Date.now());
  const after = JSON.stringify({
    open: live.openRound,
    choice: live.choice,
    locked: live.locked,
    pending: live.pending.length,
    pages: live.pages.length,
    volume: live.volume,
  });
  if (before !== after || $("actions").children.length !== ACTIONS.length) {
    render();
    return;
  }
  const t = text();
  const now = Date.now();
  let clockLine = t.clockUnknown;
  let prompt = t.promptLive;
  let disabled = true;
  if (clock && now < clock.endsAt && live.openRound === clock.round) {
    const left = formatLeft(clock.endsAt - now);
    const inLock = now >= clock.endsAt - 20000;
    clockLine = inLock ? t.clockLock(clock.round, left) : t.clockOpen(clock.round, left);
    disabled = live.locked;
    prompt = live.locked ? t.promptLocked : (inLock ? t.promptLate : t.promptLive);
  } else if (clock && now >= clock.endsAt) {
    clockLine = t.clockWait(clock.round);
    prompt = t.promptWait;
  } else if (clock) {
    clockLine = t.clockGap;
    prompt = "";
  }
  $("clock").textContent = clockLine;
  $("prompt").textContent = prompt;
  const notes = [];
  if (clock && live.openRound === clock.round && !live.sawBeforeLock && now < clock.endsAt) notes.push(t.noteLate);
  else if (!live.locked && clock && now < clock.endsAt && live.openRound === clock.round) notes.push(t.noteDefault);
  if (live.pending.length) notes.push(t.notePending(live.pending.length));
  if (fetchError) notes.push(fetchError);
  $("note").textContent = notes.join(" ");
  paintReward();
  [...$("actions").children].forEach((button, index) => {
    button.disabled = disabled;
    button.setAttribute("aria-pressed", String(live.choice === ACTIONS[index]));
  });
}

function nextKeepsake(marks) {
  const next = KEEPSAKES.find((item) => marks < item.at);
  if (!next) return null;
  return { name: text().keepsake[next.id], left: next.at - marks };
}

function paintReward() {
  const t = text();
  const el = $("reward");
  if (!el) return;
  if (mode === "practice") {
    const fresh = practice.freshAt && Date.now() - practice.freshAt < 2800;
    el.textContent = fresh
      ? t.unlocked(t.keepsake[practice.freshKeepsake])
      : t.practiceMarks(practice.marks);
    return;
  }
  const fresh = live.freshAt && Date.now() - live.freshAt < 2800;
  el.textContent = fresh
    ? t.unlocked(t.keepsake[live.freshKeepsake])
    : t.marksLine(live.marks || 0, nextKeepsake(live.marks || 0));
}

const roomImage = new Image();
roomImage.src = "burrow-room.jpg";
const motes = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), v: 0.15 + Math.random() * 0.4 }));

function drawIllustrated(ctx, width, height, now) {
  if (!roomImage.complete || !roomImage.naturalWidth) return false;
  const source = mode === "practice" ? practice : live;
  const scale = Math.max(width / roomImage.width, height / roomImage.height);
  const dw = roomImage.width * scale;
  const dh = roomImage.height * scale;
  const ox = (width - dw) / 2;
  const oy = (height - dh) / 2;
  ctx.drawImage(roomImage, ox, oy, dw, dh);
  const at = (nx, ny) => ({ x: ox + nx * dw, y: oy + ny * dh });
  const hub = at(0.785, 0.46);
  const radius = dw * 0.145;
  const hook = at(0.355, 0.29);
  const owned = new Set(ownedKeepsakes(source.marks || 0).map((item) => item.id));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dt = Math.min(0.05, lastFrame ? (now - lastFrame) / 1000 : 0);
  lastFrame = now;
  const targetRpm = mode === "live" && wheel.kind !== "unknown" ? wheel.rpm : 0;
  const targetSpin = reduce ? 0 : (targetRpm * Math.PI * 2) / 60;
  const ease = 1 - Math.exp(-dt * 1.8);
  spin += (targetSpin - spin) * ease;
  if (Math.abs(spin) < 0.01 && targetSpin === 0) spin = 0;
  if (!reduce) angle += spin * dt;
  for (const key of ["stores", "lamp", "timber"]) {
    const target = source[key] ?? 3;
    shown[key] += (target - shown[key]) * (1 - Math.exp(-dt * 3.5));
  }
  const draft = Math.min(1, Math.abs(spin) / 4);

  ctx.save();
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#1a120d";
  ctx.fillRect(hub.x - radius, hub.y - radius, radius * 2, radius * 2);
  ctx.translate(hub.x, hub.y);
  ctx.rotate(reduce ? 0.4 : angle);
  ctx.strokeStyle = "#f3e6cf";
  ctx.lineWidth = Math.max(3, radius * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const spoke = (i / 8) * Math.PI * 2;
    ctx.moveTo(Math.cos(spoke) * radius * 0.12, Math.sin(spoke) * radius * 0.12);
    ctx.lineTo(Math.cos(spoke) * radius * 0.78, Math.sin(spoke) * radius * 0.78);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#f0e2c8";
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();

  if (draft > 0.02 && !reduce) {
    motes.forEach((mote) => {
      mote.y -= mote.v * dt * (0.4 + draft * 3);
      if (mote.y < 0) mote.y = 1;
      ctx.fillStyle = `rgba(243, 230, 207, ${0.15 + draft * 0.35})`;
      ctx.fillRect(hub.x - radius + mote.x * radius * 2, hub.y - radius + mote.y * radius * 2, 2, 2);
    });
  }

  const level = shown.stores;
  const jarW = dw * 0.032;
  const gap = dw * 0.01;
  const shelf = at(0.075, 0.5);
  for (let i = 0; i < 5; i += 1) {
    const x = shelf.x + i * (jarW + gap);
    const y = shelf.y;
    const h = dh * 0.07;
    const fill = Math.max(0, Math.min(1, level - i));
    ctx.fillStyle = "rgba(234, 220, 192, 0.94)";
    ctx.fillRect(x, y, jarW, h);
    if (fill > 0) {
      ctx.fillStyle = "#c9843a";
      ctx.fillRect(x + 3, y + h * (1 - 0.62 * fill), jarW - 6, h * 0.62 * fill);
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const fill = Math.max(0, Math.min(1, shown.timber - i));
    ctx.fillStyle = fill > 0 ? `rgba(176, 132, 85, ${0.35 + fill * 0.65})` : "rgba(20,14,11,0.45)";
    ctx.fillRect(shelf.x + i * (jarW + gap), shelf.y + dh * 0.085, jarW, 4);
  }

  const oil = shown.lamp;
  const flick = reduce ? 1 : 0.9 + Math.sin(now / 160) * (0.04 + draft * 0.12) + Math.sin(now / 70) * 0.04;
  ctx.strokeStyle = "#2a2118";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hook.x, hook.y);
  ctx.lineTo(hook.x, hook.y + dh * 0.08);
  ctx.stroke();
  const cupY = hook.y + dh * 0.08;
  if (oil > 0 && !(mode === "live" && wheel.kind === "unknown")) {
    const glow = ctx.createRadialGradient(hook.x, cupY, 2, hook.x, cupY, (18 + oil * 10) * flick);
    glow.addColorStop(0, "rgba(255, 214, 140, 0.9)");
    glow.addColorStop(1, "rgba(242, 160, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hook.x, cupY, (16 + oil * 9) * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1a3";
    ctx.beginPath();
    ctx.ellipse(hook.x, cupY - 8 * flick, 3 + oil * 0.4, (8 + oil) * flick, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#241910";
  ctx.beginPath();
  ctx.moveTo(hook.x - 8, cupY);
  ctx.lineTo(hook.x + 8, cupY);
  ctx.lineTo(hook.x + 5, cupY + 10);
  ctx.lineTo(hook.x - 5, cupY + 10);
  ctx.closePath();
  ctx.fill();

  if (owned.has("rug")) {
    ctx.fillStyle = "rgba(140, 62, 42, 0.85)";
    ctx.beginPath();
    ctx.ellipse(shelf.x + dw * 0.16, shelf.y + dh * 0.22, dw * 0.12, dh * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (owned.has("bell")) {
    const swing = reduce ? 0 : Math.sin(now / 380) * (0.18 + draft * 0.55);
    ctx.save();
    ctx.translate(hook.x + dw * 0.04, hook.y);
    ctx.rotate(swing);
    ctx.fillStyle = "#e2b657";
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(6, 10);
    ctx.lineTo(4, 22);
    ctx.lineTo(-4, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (owned.has("moon")) {
    ctx.fillStyle = "rgba(244, 231, 208, 0.8)";
    ctx.beginPath();
    ctx.arc(at(0.18, 0.16).x, at(0.18, 0.16).y, 10, 0.2, Math.PI * 1.4);
    ctx.strokeStyle = "rgba(244, 231, 208, 0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (owned.has("nest")) {
    ctx.fillStyle = "#c6a15a";
    ctx.beginPath();
    ctx.ellipse(shelf.x + dw * 0.28, shelf.y + dh * 0.2, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (source.freshAt && now - source.freshAt < 2600 && !reduce) {
    const alpha = 1 - (now - source.freshAt) / 2600;
    ctx.fillStyle = `rgba(242, 181, 68, ${0.18 * alpha})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (mode === "live" && wheel.kind === "unknown") {
    ctx.fillStyle = "rgba(20, 14, 11, 0.4)";
    ctx.fillRect(0, 0, width, height);
  }
  return true;
}

function drawRoom(now) {
  const canvas = $("room");
  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 460;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bufferW = Math.max(1, Math.floor(width * dpr));
  const bufferH = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== bufferW || canvas.height !== bufferH) {
    canvas.width = bufferW;
    canvas.height = bufferH;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (drawIllustrated(ctx, width, height, now)) {
    requestAnimationFrame(drawRoom);
    return;
  }
  const source = mode === "practice" ? practice : live;
  const timber = source.timber ?? 3;
  const stores = source.stores ?? 3;
  const oil = source.lamp ?? 3;
  const narrow = width < 560;
  const radius = narrow ? 42 : Math.min(86, height * 0.2);
  const hub = { cx: width - radius - 16, cy: narrow ? radius + 28 : height * 0.42, r: radius };
  const jarW = narrow ? 26 : 34;
  const jarGap = narrow ? 8 : 12;
  const jarX = 22;
  const jarY = height * 0.64;
  const lampX = jarX + 2 * (jarW + jarGap) + jarW / 2;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#2a1c14");
  sky.addColorStop(0.55, "#3d291c");
  sky.addColorStop(1, "#1a110c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#120d0a";
  ctx.beginPath();
  ctx.ellipse(width * 0.4, height * 0.94, width * 0.62, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  const rafterStop = hub.cx - hub.r - 18;
  for (let i = 0; i < 5; i += 1) {
    const x = 26 + i * (narrow ? 22 : 36);
    if (x > rafterStop) break;
    const standing = i < timber;
    ctx.fillStyle = standing ? "#b08455" : "#241910";
    ctx.fillRect(x, 14, standing ? (narrow ? 8 : 12) : 3, Math.max(24, jarY - 24));
    if (standing) {
      ctx.fillStyle = "#e4c79a";
      ctx.fillRect(x, 14, 2, Math.max(24, jarY - 24));
    }
  }

  ctx.fillStyle = "#100c09";
  ctx.beginPath();
  ctx.arc(hub.cx, hub.cy, hub.r + 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6d5340";
  ctx.lineWidth = narrow ? 6 : 10;
  ctx.stroke();

  const moving = mode === "live" && (wheel.kind === "gentle" || wheel.kind === "hard");
  const dt = Math.min(0.05, lastFrame ? (now - lastFrame) / 1000 : 0);
  lastFrame = now;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (moving && !reduce) angle += ((wheel.rpm * Math.PI * 2) / 60) * dt;

  ctx.save();
  ctx.beginPath();
  ctx.arc(hub.cx, hub.cy, hub.r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#241910";
  ctx.fillRect(hub.cx - hub.r, hub.cy - hub.r, hub.r * 2, hub.r * 2);
  ctx.translate(hub.cx, hub.cy);
  ctx.rotate(reduce ? 0.4 : angle);
  ctx.strokeStyle = mode === "practice" ? "#8d7b66" : "#f3e6cf";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, hub.r - 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const spoke = (i / 8) * Math.PI * 2;
    ctx.moveTo(Math.cos(spoke) * 7, Math.sin(spoke) * 7);
    ctx.lineTo(Math.cos(spoke) * (hub.r - 9), Math.sin(spoke) * (hub.r - 9));
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#f0e2c8";
  ctx.beginPath();
  ctx.arc(hub.cx, hub.cy, 6, 0, Math.PI * 2);
  ctx.fill();

  const jarH = narrow ? 36 : 46;
  ctx.fillStyle = "#5c4632";
  ctx.fillRect(jarX - 8, jarY + jarH, 5 * jarW + 4 * jarGap + 16, 8);
  for (let i = 0; i < 5; i += 1) {
    const x = jarX + i * (jarW + jarGap);
    ctx.fillStyle = "#eadcc0";
    ctx.fillRect(x, jarY, jarW, jarH);
    ctx.strokeStyle = "#8d7352";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, jarY, jarW, jarH);
    if (i < stores) {
      ctx.fillStyle = "#c9843a";
      ctx.fillRect(x + 4, jarY + 14, jarW - 8, jarH - 20);
    }
  }

  const cupY = jarY - (narrow ? 54 : 84);
  ctx.strokeStyle = "#3a2e24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lampX, 12);
  ctx.lineTo(lampX, cupY);
  ctx.stroke();
  if (oil > 0 && !(mode === "live" && wheel.kind === "unknown")) {
    const glow = ctx.createRadialGradient(lampX, cupY, 2, lampX, cupY, 16 + oil * 12);
    glow.addColorStop(0, "rgba(242, 196, 92, 0.92)");
    glow.addColorStop(1, "rgba(242, 181, 68, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lampX, cupY - 6, 12 + oil * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1a3";
    ctx.beginPath();
    ctx.ellipse(lampX, cupY - 10, 3 + oil * 0.6, 7 + oil * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#241910";
  ctx.beginPath();
  ctx.moveTo(lampX - 11, cupY);
  ctx.lineTo(lampX + 11, cupY);
  ctx.lineTo(lampX + 7, cupY + 12);
  ctx.lineTo(lampX - 7, cupY + 12);
  ctx.closePath();
  ctx.fill();

  if (mode === "live" && wheel.kind === "unknown") {
    ctx.fillStyle = "rgba(20, 14, 11, 0.42)";
    ctx.fillRect(0, 0, width, height);
  }
  requestAnimationFrame(drawRoom);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function pollStatus() {
  const previous = wheel.kind;
  try {
    wheel = readWheel(await fetchJson(STATUS_URL));
    fetchError = "";
  } catch {
    wheel = { kind: "unknown", rpm: 0 };
    fetchError = text().practiceError;
  }
  if (mode !== "live") return;
  if (fetchError || previous !== wheel.kind) render();
  else $("wheel-line").textContent = text().wheel[wheel.kind] || text().wheel.unknown;
}

async function pollClock() {
  try {
    const next = readClock(await fetchJson(CLOCK_URL));
    if (next) clock = next;
    fetchError = "";
  } catch {
    fetchError = text().practiceError;
  }
  const changed = syncLive(Date.now());
  if (mode === "live" && (changed || fetchError)) render();
}

async function pollEvents() {
  try {
    const parsed = settlementRecords(await fetchJson(EVENTS_URL));
    if (parsed.ok) {
      records = parsed;
      fetchError = "";
      if (resolvePending() && mode === "live") render();
      return;
    }
  } catch {
    fetchError = text().practiceError;
  }
  if (mode === "live" && fetchError) render();
}

$("lang").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem(LANG_KEY, lang);
  render();
});
$("tab-live").addEventListener("click", () => {
  mode = "live";
  render();
});
$("tab-practice").addEventListener("click", () => {
  if (mode === "practice" && practice.status === "ready") return;
  startPractice();
});

render();
requestAnimationFrame(drawRoom);
pollStatus();
pollClock();
pollEvents();
setInterval(pollStatus, 5000);
setInterval(pollClock, 8000);
setInterval(pollEvents, 12000);
setInterval(updateLiveChrome, 250);
