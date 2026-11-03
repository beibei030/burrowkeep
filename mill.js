import {
  FOOD_COST,
  IRON_PER_SILVER,
  MAX_LEVEL,
  ORE_PER_IRON,
  SILVER_PER_GOLD,
  buyItem,
  exchange,
  feed,
  hashesPerOre,
  MAX_DECOR_LEVEL,
  mintOre,
  snack,
  SNACK_COST,
  threadsFor,
  upgrade,
  upgradeCost,
  upgradeDecor,
} from "./economy.js";

const API = /(?:^|\.)imd\.site$|identitymd\.eth\.limo$/.test(location.hostname)
  ? "https://aiqiang888.com/burrowkeep-api"
  : "";
const KEY = "burrowkeep-cpu-v1";
const $ = (id) => document.getElementById(id);

const COPY = {
  zh: {
    lang: "English",
    lede: "点开始之后，这个网页才用你的 CPU 做 SHA-256。矿砂只从这些哈希里换。好友挖到的矿砂他自己留着，你额外得到他入账矿砂的 5%。",
    ore: "矿砂",
    satiety: "饱食",
    hamster: "仓鼠",
    gear: "矿机",
    feed: "喂食",
    feedHint: `${FOOD_COST} 矿砂，饱食 +1。挖着的时候会慢慢饿。`,
    grow: "升级仓鼠",
    growHint: (cost, now, next) => `${cost} 矿砂。现在 ${now.toLocaleString()} 次哈希换 1 矿砂，升级后 ${next.toLocaleString()} 次。`,
    tighten: "加一台矿机",
    tightenHint: (cost, threads) => `${cost} 矿砂。可同时用 ${threads} 个 CPU 线程。`,
    start: "开始挖矿",
    stop: "停止挖矿",
    gentle: "温和：1 个线程",
    full: "全力：用满已解锁的线程",
    maxed: "已经满级",
    need: (n) => `还差 ${n} 矿砂`,
    hungry: "饿着的时候，同样的哈希只能换一半矿砂。",
    rate: (kh) => `真实算力 ${kh} kH/s · SHA-256`,
    idle: "挖矿没开。没有在做哈希运算。",
    proof: (hashes, shares) => `累计 ${hashes.toLocaleString()} 次哈希，命中 ${shares.toLocaleString()} 个份额。`,
    nextOre: (left) => `再算 ${left.toLocaleString()} 次哈希得到下一块矿砂。`,
    invite: "邀请好友",
    gameInvite: "矿砂邀请",
    inviteHint: "好友自己的矿砂一分不扣。他每入账 20 矿砂，你额外得到 1。",
    chainInvite: "Squeekchain 邀请",
    bound: (id) => `邀请已绑定 ${id}。第一次打开邀请链接时写死，不能改。`,
    unbound: "没有邀请人。这个编号是直接打开的，之后的链接也不会再绑。",
    friendPay: (pending, earned) => `好友奖励待入账 ${pending}，已经拿到 ${earned} 矿砂。`,
    copy: "复制邀请链接",
    copyGame: "复制矿砂邀请",
    copied: "已经复制",
    footer: "Burrowkeep hashes SHA-256 on this tab's CPU only after you press start. The invite pays 5% of a friend's booked ore, minted extra. It does not make Squeektoshi run.",
    stream: "看轮子",
    level: (n) => `${n} 级`,
    tabsHome: "家园商店",
    tabsRaise: "养成",
    sandIron: "铁砂",
    sandSilver: "银砂",
    sandGold: "金砂",
    toIron: "100 矿砂换 1 铁砂",
    toSilver: "10 铁砂换 1 银砂",
    toGold: "10 银砂换 1 金砂",
    owned: "已放入家园",
    sandNeed: (name, n) => `还差 ${n} ${name}`,
    threads: (n, cores) => `本机 ${cores} 核，这级可用 ${n} 线程`,
    snack: "喂零食",
    snackHint: `${SNACK_COST} 矿砂。饱食 +1，15 秒内少算 20% 哈希，60 秒后才能再喂。`,
    snackLocked: "先在商店买零食罐",
    snackOn: "零食还在生效",
    snackWait: "零食还在冷却",
    wealthTitle: "财富榜",
    decorTitle: "装饰榜",
    boardEmpty: "还没有人上榜",
    wealthMine: (n) => `我的金砂 ${n}`,
    decorMine: (n) => `我的装饰度 ${n}`,
    decorWord: "装饰度",
    decorMax: "装饰已满级",
    decorUp: (now, next, cost, sand) => `装饰度 ${now} → ${next} · ${cost} ${sand}`,
  },
  en: {
    lang: "中文",
    lede: "SHA-256 starts only after you press start. Ore comes only from those hashes. Friends keep their ore. You receive an extra 5% of the ore they book.",
    ore: "Ore",
    satiety: "Food",
    hamster: "Hamster",
    gear: "Rigs",
    feed: "Feed",
    feedHint: `${FOOD_COST} ore, food +1. Mining makes the hamster hungry.`,
    grow: "Raise the hamster",
    growHint: (cost, now, next) => `${cost} ore. Now ${now.toLocaleString()} hashes per ore, then ${next.toLocaleString()}.`,
    tighten: "Add a rig",
    tightenHint: (cost, threads) => `${cost} ore. Unlocks ${threads} CPU threads at once.`,
    start: "Start mining",
    stop: "Stop mining",
    gentle: "Gentle: 1 thread",
    full: "Full: every unlocked thread",
    maxed: "Maxed",
    need: (n) => `Need ${n} more ore`,
    hungry: "While hungry, the same hashes make half as much ore.",
    rate: (kh) => `Real hashrate ${kh} kH/s · SHA-256`,
    idle: "Mining is off. No hashing is running.",
    proof: (hashes, shares) => `${hashes.toLocaleString()} hashes computed, ${shares.toLocaleString()} shares found.`,
    nextOre: (left) => `${left.toLocaleString()} hashes to the next ore.`,
    invite: "Invite a friend",
    gameInvite: "Ore invite",
    inviteHint: "Friends keep every ore they mine. Every 20 ore they book adds 1 to you.",
    chainInvite: "Squeekchain invite",
    bound: (id) => `Invite locked to ${id}. Set the first time this id opened an invite link.`,
    unbound: "No inviter. This id opened the page directly, so a later link cannot bind it.",
    friendPay: (pending, earned) => `Friend reward waiting ${pending}, already received ${earned} ore.`,
    copy: "Copy invite link",
    copyGame: "Copy ore invite",
    copied: "Copied",
    footer: "Burrowkeep hashes SHA-256 on this tab's CPU only after you press start. The invite pays 5% of a friend's booked ore, minted extra. It does not make Squeektoshi run.",
    stream: "Watch the wheel",
    level: (n) => `Lv ${n}`,
    tabsHome: "Home shop",
    tabsRaise: "Care",
    sandIron: "Iron",
    sandSilver: "Silver",
    sandGold: "Gold",
    toIron: "100 ore → 1 iron",
    toSilver: "10 iron → 1 silver",
    toGold: "10 silver → 1 gold",
    owned: "Placed",
    sandNeed: (name, n) => `Need ${n} more ${name}`,
    threads: (n, cores) => `${cores} cores on this machine, ${n} threads at this level`,
    snack: "Give a snack",
    snackHint: `${SNACK_COST} ore. Food +1, 20% fewer hashes for 15 seconds, then a 60 second wait.`,
    snackLocked: "Buy the snack tin in the shop first",
    snackOn: "Snack is still active",
    snackWait: "Snack is cooling down",
    wealthTitle: "Wealth",
    decorTitle: "Decor",
    boardEmpty: "Nobody is ranked yet",
    wealthMine: (n) => `My gold ${n}`,
    decorMine: (n) => `My decor ${n}`,
    decorWord: "Decor",
    decorMax: "Decor maxed",
    decorUp: (now, next, cost, sand) => `Decor ${now} → ${next} · ${cost} ${sand}`,
  },
};

const ITEMS = [
  { id: "bowl", sand: "iron", cost: 2, decor: 2, zh: "食盆", en: "Bowl" },
  { id: "mat", sand: "iron", cost: 3, decor: 3, zh: "草垫", en: "Mat" },
  { id: "ball", sand: "iron", cost: 3, decor: 2, zh: "木球", en: "Ball" },
  { id: "crate", sand: "iron", cost: 4, decor: 3, zh: "木箱", en: "Crate" },
  { id: "lamp", sand: "iron", cost: 5, decor: 4, zh: "木灯", en: "Lamp" },
  { id: "frame", sand: "iron", cost: 6, decor: 5, zh: "挂画", en: "Picture" },
  { id: "nest", sand: "iron", cost: 8, decor: 6, zh: "软窝", en: "Nest", zhNote: "饱食掉得更慢", enNote: "Hunger slows" },
  { id: "plant", sand: "silver", cost: 2, decor: 8, zh: "花盆", en: "Plant" },
  { id: "curtain", sand: "silver", cost: 3, decor: 9, zh: "窗帘", en: "Curtain" },
  { id: "clock", sand: "silver", cost: 3, decor: 8, zh: "座钟", en: "Clock" },
  { id: "shelf", sand: "silver", cost: 4, decor: 10, zh: "书架", en: "Shelf" },
  { id: "tin", sand: "silver", cost: 4, decor: 8, zh: "零食罐", en: "Snack tin", zhNote: "养成里可以喂零食", enNote: "Unlocks a snack" },
  { id: "bell", sand: "gold", cost: 2, decor: 14, zh: "金铃", en: "Bell" },
  { id: "banner", sand: "gold", cost: 2, decor: 14, zh: "挂毯", en: "Banner" },
  { id: "crown", sand: "gold", cost: 3, decor: 18, zh: "王冠", en: "Crown" },
  { id: "oil", sand: "gold", cost: 3, decor: 16, zh: "润滑油", en: "Oil", zhNote: "每块矿砂少算 10% 哈希", enNote: "10% fewer hashes per ore" },
  { id: "rim", sand: "gold", cost: 4, decor: 20, zh: "金轮框", en: "Gold rim" },
];

let lang = localStorage.getItem("burrowkeep-lang") === "en" ? "en" : "zh";
const refFromUrl = new URLSearchParams(location.search).get("ref");
let state = load();
save();
let shopTab = "home";
let running = false;
let fullPower = false;
let workers = [];
let bank = 0;
let unsentOre = 0;
let pendingMilli = 0;
let hashesWindow = [];
let friendWindow = [];
let shownRate = 0;
let lastHunger = 0;
let angle = 0;
let pops = [];
let board = { wealth: [], decor: [] };
let postedKey = "";

function text() { return COPY[lang]; }

function fresh() {
  const minerId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const refId = refFromUrl && /^[a-z0-9]{8,32}$/i.test(refFromUrl) && refFromUrl !== minerId ? refFromUrl : "";
  return { version: 2, ore: 0, satiety: 3, hamster: 1, gear: 1, iron: 0, silver: 0, gold: 0, owned: [], levels: {}, snackUntil: 0, snackReady: 0, minerId, refId, welcomed: false, totalHashes: 0, shares: 0, friendOre: 0 };
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || (parsed.version !== 1 && parsed.version !== 2) || !/^[a-z0-9]{8,32}$/i.test(parsed.minerId || "")) return fresh();
    for (const key of ["ore", "satiety", "hamster", "gear"]) {
      if (!Number.isInteger(parsed[key]) || parsed[key] < 0 || parsed[key] > MAX_LEVEL && key !== "ore") return fresh();
    }
    parsed.iron = Number.isInteger(parsed.iron) ? parsed.iron : 0;
    parsed.silver = Number.isInteger(parsed.silver) ? parsed.silver : 0;
    parsed.gold = Number.isInteger(parsed.gold) ? parsed.gold : 0;
    parsed.owned = Array.isArray(parsed.owned) ? parsed.owned.filter((id) => ITEMS.some((item) => item.id === id)) : [];
    const rawLevels = parsed.levels && typeof parsed.levels === "object" ? parsed.levels : {};
    parsed.levels = {};
    for (const id of parsed.owned) {
      const level = Number(rawLevels[id]);
      parsed.levels[id] = level >= 2 && level <= MAX_DECOR_LEVEL ? level : 1;
    }
    parsed.snackUntil = Number.isFinite(parsed.snackUntil) ? parsed.snackUntil : 0;
    parsed.snackReady = Number.isFinite(parsed.snackReady) ? parsed.snackReady : 0;
    parsed.version = 2;
    parsed.totalHashes = Number.isFinite(parsed.totalHashes) ? parsed.totalHashes : 0;
    parsed.shares = Number.isInteger(parsed.shares) ? parsed.shares : 0;
    parsed.friendOre = Number.isInteger(parsed.friendOre) ? parsed.friendOre : 0;
    parsed.refId = /^[a-z0-9]{8,32}$/i.test(parsed.refId || "") ? parsed.refId : "";
    if (!parsed.welcomed && refFromUrl && /^[a-z0-9]{8,32}$/i.test(refFromUrl) && refFromUrl !== parsed.minerId) {
      parsed.refId = refFromUrl;
    }
    return parsed;
  } catch {
    return fresh();
  }
}

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

function cores() { return navigator.hardwareConcurrency || 1; }

function activeThreads() {
  return fullPower ? threadsFor(state.gear, cores()) : 1;
}

function stopMiners() {
  running = false;
  for (const worker of workers) {
    worker.postMessage({ type: "stop" });
    worker.terminate();
  }
  workers = [];
}

function startMiners() {
  stopMiners();
  running = true;
  lastHunger = Date.now();
  const count = activeThreads();
  for (let i = 0; i < count; i += 1) {
    const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    worker.onmessage = (event) => {
      const hashes = event.data.hashes || 0;
      bank += hashes;
      state.totalHashes += hashes;
      state.shares += event.data.shares || 0;
      hashesWindow.push([Date.now(), hashes]);
      if (event.data.shares) pops.push({ life: 1 });
    };
    worker.postMessage({ type: "start" });
    workers.push(worker);
  }
}

function ease() {
  let rate = 1;
  if ((state.owned || []).includes("oil")) rate *= 0.9;
  if ((state.snackUntil || 0) > Date.now()) rate *= 0.8;
  return rate;
}

function takeOre() {
  if (!running && bank <= 0) return;
  const minted = mintOre(bank, state.hamster, state.satiety <= 0, ease());
  if (minted.ore > 0) {
    state = { ...state, ore: state.ore + minted.ore };
    unsentOre += minted.ore;
    pops.push({ life: 1.2, ore: minted.ore });
    save();
  }
  bank = minted.leftover;
  const hungerEvery = (state.owned || []).includes("nest") ? 120000 : 75000;
  if (running && Date.now() - lastHunger > hungerEvery) {
    lastHunger = Date.now();
    state = { ...state, satiety: Math.max(0, state.satiety - 1) };
    save();
  }
}

function hashrate(windowRows) {
  const now = Date.now();
  const recent = windowRows.filter((row) => now - row[0] < 4000);
  windowRows.length = 0;
  windowRows.push(...recent);
  const hashes = recent.reduce((sum, row) => sum + row[1], 0);
  const seconds = recent.length ? Math.max(1, (now - recent[0][0]) / 1000) : 1;
  return hashes / seconds;
}

function noteFor(cost, level) {
  const t = text();
  if (level >= MAX_LEVEL) return t.maxed;
  if (state.ore < cost) return t.need(cost - state.ore);
  return "";
}

function sandName(key) {
  const t = text();
  return { iron: t.sandIron, silver: t.sandSilver, gold: t.sandGold }[key];
}

function renderSands() {
  const root = $("sands");
  root.replaceChildren();
  for (const [key, amount] of [["iron", state.iron || 0], ["silver", state.silver || 0], ["gold", state.gold || 0]]) {
    const chip = document.createElement("div");
    chip.className = `sand sand-${key}`;
    const name = document.createElement("span");
    name.textContent = sandName(key);
    const strong = document.createElement("strong");
    strong.textContent = String(amount);
    chip.append(name, strong);
    root.appendChild(chip);
  }
}

function renderShop() {
  const t = text();
  const tabs = $("tabs");
  tabs.replaceChildren();
  for (const [id, label] of [["home", t.tabsHome], ["raise", t.tabsRaise]]) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.textContent = label;
    tab.className = shopTab === id ? "on" : "";
    tab.addEventListener("click", () => { shopTab = id; render(); });
    tabs.appendChild(tab);
  }
  const root = $("shop");
  root.replaceChildren();
  root.className = shopTab === "home" ? "shop home-shop" : "shop";
  if (shopTab === "raise") {
    const items = [
      { name: t.feed, hint: t.feedHint, block: noteFor(FOOD_COST, state.satiety), run: () => feed(state) },
      {
        name: t.grow,
        hint: t.growHint(upgradeCost("hamster", state.hamster), hashesPerOre(state.hamster, false), hashesPerOre(Math.min(MAX_LEVEL, state.hamster + 1), false)),
        block: noteFor(upgradeCost("hamster", state.hamster), state.hamster),
        run: () => upgrade(state, "hamster"),
      },
      {
        name: t.tighten,
        hint: t.tightenHint(upgradeCost("gear", state.gear), threadsFor(state.gear + 1, cores())),
        block: noteFor(upgradeCost("gear", state.gear), state.gear),
        run: () => upgrade(state, "gear"),
      },
      {
        name: t.snack,
        hint: t.snackHint,
        block: !(state.owned || []).includes("tin")
          ? t.snackLocked
          : (state.snackUntil || 0) > Date.now()
            ? t.snackOn
            : (state.snackReady || 0) > Date.now()
              ? t.snackWait
              : state.ore < SNACK_COST ? t.need(SNACK_COST - state.ore) : "",
        run: () => snack(state),
      },
    ];
    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = Boolean(item.block);
      const name = document.createElement("strong");
      name.textContent = item.name;
      const hint = document.createElement("small");
      hint.textContent = item.block ? `${item.hint} · ${item.block}` : item.hint;
      button.append(name, hint);
      button.addEventListener("click", () => {
        const next = item.run();
        if (!next) return;
        const grewGear = next.gear !== state.gear;
        state = next;
        save();
        if (grewGear && running && fullPower) startMiners();
        render();
      });
      root.appendChild(button);
    }
    return;
  }
  const trades = [
    ["iron", t.toIron, (state.ore || 0) < ORE_PER_IRON],
    ["silver", t.toSilver, (state.iron || 0) < IRON_PER_SILVER],
    ["gold", t.toGold, (state.silver || 0) < SILVER_PER_GOLD],
  ];
  for (const [kind, label, disabled] of trades) {
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = disabled;
    button.textContent = label;
    button.addEventListener("click", () => {
      const next = exchange(state, kind);
      if (!next) return;
      state = next;
      save();
      render();
      syncBoard();
    });
    root.appendChild(button);
  }
  for (const item of ITEMS) {
    const owned = (state.owned || []).includes(item.id);
    const level = itemLevel(item.id);
    const have = state[item.sand] || 0;
    const button = document.createElement("button");
    button.type = "button";
    const name = document.createElement("strong");
    name.textContent = owned ? `${lang === "zh" ? item.zh : item.en} ${t.level(level)}` : (lang === "zh" ? item.zh : item.en);
    const hint = document.createElement("small");
    const effect = lang === "zh" ? item.zhNote : item.enNote;
    if (!owned) {
      button.disabled = have < item.cost;
      const price = `${item.cost} ${sandName(item.sand)}`;
      hint.textContent = `${t.decorWord} ${item.decor}${effect ? ` · ${effect}` : ""} · ${price}${have < item.cost ? ` · ${t.sandNeed(sandName(item.sand), item.cost - have)}` : ""}`;
      button.addEventListener("click", () => {
        const next = buyItem(state, item);
        if (!next) return;
        state = next;
        save();
        render();
        syncBoard();
      });
    } else if (level >= MAX_DECOR_LEVEL) {
      button.disabled = true;
      hint.textContent = `${t.decorWord} ${item.decor * level} · ${t.decorMax}`;
    } else {
      const nextCost = item.cost * level;
      button.disabled = have < nextCost;
      hint.textContent = t.decorUp(item.decor * level, item.decor * (level + 1), nextCost, sandName(item.sand));
      if (have < nextCost) hint.textContent += ` · ${t.sandNeed(sandName(item.sand), nextCost - have)}`;
      button.addEventListener("click", () => {
        const next = upgradeDecor(state, item);
        if (!next) return;
        state = next;
        save();
        render();
        syncBoard();
      });
    }
    button.append(name, hint);
    root.appendChild(button);
  }
}

function renderMeters() {
  const t = text();
  const root = $("meters");
  root.replaceChildren();
  for (const [name, value, filled] of [
    [t.satiety, `${state.satiety}/${MAX_LEVEL}`, state.satiety],
    [t.hamster, t.level(state.hamster), state.hamster],
    [t.gear, t.level(state.gear), state.gear],
  ]) {
    const block = document.createElement("div");
    block.className = "meter";
    const label = document.createElement("span");
    label.textContent = name;
    const strong = document.createElement("strong");
    strong.textContent = value;
    const pips = document.createElement("div");
    pips.className = "pips";
    for (let i = 0; i < MAX_LEVEL; i += 1) {
      const pip = document.createElement("i");
      pip.className = i < filled ? "pip on" : "pip";
      pips.appendChild(pip);
    }
    block.append(label, strong, pips);
    root.appendChild(block);
  }
}

function itemLevel(id) {
  if (!(state.owned || []).includes(id)) return 0;
  const level = state.levels?.[id];
  return level >= 2 && level <= MAX_DECOR_LEVEL ? level : 1;
}

function decorTotal() {
  return ITEMS.reduce((sum, item) => sum + item.decor * itemLevel(item.id), 0);
}

function renderBoards() {
  const t = text();
  $("wealth-title").textContent = t.wealthTitle;
  $("decor-title").textContent = t.decorTitle;
  $("wealth-mine").textContent = t.wealthMine(state.gold || 0);
  $("decor-mine").textContent = t.decorMine(decorTotal());
  fillBoard($("wealth-list"), board.wealth || []);
  fillBoard($("decor-list"), board.decor || []);
}

function fillBoard(root, rows) {
  const t = text();
  root.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = t.boardEmpty;
    root.appendChild(empty);
    return;
  }
  rows.forEach((row, index) => {
    const li = document.createElement("li");
    if (row.id === state.minerId) li.className = "me";
    const who = document.createElement("span");
    who.textContent = `${index + 1}. ${row.id}`;
    const score = document.createElement("strong");
    score.textContent = String(row.score);
    li.append(who, score);
    root.appendChild(li);
  });
}

async function syncBoard() {
  const gold = state.gold || 0;
  const decor = decorTotal();
  const key = `${state.minerId}:${gold}:${decor}`;
  if (key !== postedKey) {
    postedKey = key;
    const ok = await fetch(`${API}/api/board`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minerId: state.minerId, gold, decor }),
    }).then((response) => response.ok).catch(() => false);
    if (!ok) postedKey = "";
  }
  const response = await fetch(`${API}/api/board`).catch(() => null);
  if (!response || !response.ok) return;
  board = await response.json();
  renderBoards();
}

function renderInvite() {
  const t = text();
  const root = $("invite");
  const link = `${location.origin}${location.pathname}?ref=${state.minerId}`;
  root.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = t.gameInvite;
  const status = document.createElement("p");
  status.className = "note";
  status.textContent = state.welcomed
    ? (state.refId ? t.bound(state.refId) : t.unbound)
    : t.inviteHint;
  const pay = document.createElement("p");
  pay.className = "note";
  pay.textContent = t.friendPay((pendingMilli / 1000).toFixed(2), state.friendOre || 0);
  const field = document.createElement("input");
  field.readOnly = true;
  field.value = link;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = t.copyGame;
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(link).catch(() => field.select());
    button.textContent = t.copied;
  });
  root.append(title, status, pay, field, button);
}

function paintLive() {
  const t = text();
  $("ore").textContent = String(state.ore);
  const own = hashrate(hashesWindow);
  shownRate = own;
  $("rate").textContent = running ? t.rate((own / 1000).toFixed(1)) : t.idle;
  const need = hashesPerOre(state.hamster, state.satiety <= 0, ease());
  $("provisional").textContent = t.nextOre(Math.max(0, need - bank));
  $("power").textContent = running ? t.stop : t.start;
  $("power").classList.toggle("mining", running);
  $("note").textContent = [(state.snackUntil || 0) > Date.now() ? t.snackOn : "", state.satiety <= 0 ? t.hungry : "", t.threads(activeThreads(), cores())].filter(Boolean).join(" ");
}

function render() {
  const t = text();
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  $("lede").textContent = t.lede;
  $("lang").textContent = t.lang;
  $("ore").textContent = String(state.ore);
  $("ore-label").textContent = t.ore;
  $("footer-line").textContent = t.footer;
  $("stream-link").textContent = t.stream;
  $("chain-link").textContent = t.chainInvite;
  $("mode").textContent = fullPower ? t.full : t.gentle;
  paintLive();
  renderMeters();
  renderSands();
  renderShop();
  renderInvite();
  renderBoards();
}

function drawPixel(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}

const WORLD_W = 192;
const WORLD_H = 96;
const PIXEL = 5;
let roomScratch = null;

function draw(now) {
  const canvas = $("room");
  const bufW = WORLD_W * PIXEL;
  const bufH = WORLD_H * PIXEL;
  if (canvas.width !== bufW || canvas.height !== bufH) {
    canvas.width = bufW;
    canvas.height = bufH;
  }
  const pix = new Uint8ClampedArray(WORLD_W * WORLD_H * 4);
  const set = (x, y, rgb) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    const i = (y * WORLD_W + x) * 4;
    pix[i] = (rgb >> 16) & 255;
    pix[i + 1] = (rgb >> 8) & 255;
    pix[i + 2] = rgb & 255;
    pix[i + 3] = 255;
  };
  const at = (x, y) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return -1;
    const i = (y * WORLD_W + x) * 4;
    if (!pix[i + 3]) return -1;
    return (pix[i] << 16) | (pix[i + 1] << 8) | pix[i + 2];
  };
  const fill = (x0, y0, w, h, rgb) => {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) set(x, y, rgb);
    }
  };
  const ellipse = (cx, cy, rx, ry, rgb) => {
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    for (let y = -ry; y <= ry; y += 1) {
      for (let x = -rx; x <= rx; x += 1) {
        if (x * x * ry2 + y * y * rx2 <= rx2 * ry2) set(cx + x, cy + y, rgb);
      }
    }
  };
  const ring = (cx, cy, rOut, rIn, rgb) => {
    const outer = rOut * rOut;
    const inner = rIn * rIn;
    for (let y = cy - rOut; y <= cy + rOut; y += 1) {
      for (let x = cx - rOut; x <= cx + rOut; x += 1) {
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d <= outer && d >= inner) set(x, y, rgb);
      }
    }
  };
  const has = (id) => (state.owned || []).includes(id);
  const floorY = 74;
  const INK = 0x1c140e;
  const FUR = 0xe0974a;
  const FUR2 = 0xf6c27a;
  const BELLY = 0xf8e2c4;
  const EAR = 0xe56b8a;
  const EYE = 0x1a120c;
  const WOOD = 0xd8c4a2;
  const WOOD2 = 0xb8946a;
  const GOLD = 0xf2b544;

  for (let y = 0; y < floorY; y += 1) {
    for (let x = 0; x < WORLD_W; x += 1) {
      const panel = Math.floor(x / 16) % 2 === 0 ? 0x4e382c : 0x453226;
      const seam = x % 16 === 0;
      const top = y < 8;
      set(x, y, seam ? 0x2c1e16 : top ? 0x3a281e : panel);
    }
  }
  fill(0, floorY - 5, WORLD_W, 5, 0x6b442c);
  fill(0, floorY - 5, WORLD_W, 1, 0x8a5a38);
  for (let y = floorY; y < WORLD_H; y += 1) {
    const row = Math.floor((y - floorY) / 5);
    for (let x = 0; x < WORLD_W; x += 1) {
      const gap = (x + row * 11) % 28 === 0;
      set(x, y, gap ? 0x5c3818 : row % 2 ? 0x8d5a32 : 0xa56b3c);
    }
  }

  const wx = 12;
  const wy = 14;
  fill(wx, wy, 44, 30, 0x6b4428);
  fill(wx + 2, wy + 2, 18, 11, 0xc5ebf6);
  fill(wx + 22, wy + 2, 18, 11, 0x9fd4ea);
  fill(wx + 2, wy + 15, 18, 11, 0x9fd4ea);
  fill(wx + 22, wy + 15, 18, 11, 0xb7e4f4);
  fill(wx + 20, wy + 2, 2, 24, 0xf4efe6);
  fill(wx + 2, wy + 13, 38, 2, 0xf4efe6);
  fill(wx - 1, wy + 28, 46, 3, 0xc4a574);
  if (has("curtain")) {
    fill(wx + 2, wy + 2, 8, 24, 0xc45b55);
    fill(wx + 32, wy + 2, 8, 24, 0xa84842);
    fill(wx + 2, wy + 2, 38, 3, 0x8d3a36);
  }

  if (has("shelf")) {
    fill(70, 22, 36, 3, 0x8a5a32);
    fill(70, 25, 2, 8, 0x6b4428);
    fill(104, 25, 2, 8, 0x6b4428);
    for (let i = 0; i < 4; i += 1) {
      const colors = [0xc45b55, 0x67b36a, 0x7eb0d4, 0xf2b544];
      fill(74 + i * 8, 16, 5, 6, colors[i]);
      set(75 + i * 8, 15, 0xf4efe6);
    }
  }
  if (has("lamp")) {
    fill(112, 10, 2, 16, INK);
    ellipse(113, 28, 5, 3, GOLD);
    ellipse(113, 27, 2, 1, 0xfff1c4);
  }
  if (has("plant")) {
    fill(58, 64, 10, 8, 0x6b3a22);
    fill(57, 62, 12, 3, 0x8a4e2c);
    ellipse(63, 56, 6, 5, 0x2f6b32);
    ellipse(56, 58, 4, 3, 0x67b36a);
    ellipse(70, 57, 4, 3, 0x8fd18a);
  }
  if (has("mat")) {
    fill(8, 78, 36, 12, 0xc47a3a);
    fill(8, 78, 36, 2, 0xe0a060);
    fill(8, 88, 36, 2, 0x8a4e24);
    for (let y = 80; y < 88; y += 2) {
      for (let x = 10; x < 42; x += 4) set(x, y, 0xf2b544);
    }
  }
  if (has("bowl")) {
    ellipse(26, 82, 8, 3, 0xf4efe6);
    ellipse(26, 81, 6, 2, 0xe7d3b0);
    set(24, 80, GOLD);
    set(26, 80, GOLD);
    set(28, 80, 0xc45b55);
  }
  if (has("bell")) {
    const swing = Math.round(Math.sin(now / 280) * (running ? 3 : 1));
    fill(96, 6, 1, 8, INK);
    ellipse(96 + swing, 16, 3, 3, GOLD);
    set(96 + swing, 19, INK);
  }
  if (has("frame")) {
    fill(58, 14, 10, 12, 0x6b4428);
    fill(60, 16, 6, 8, 0x7eb0d4);
    fill(61, 18, 4, 3, 0x67b36a);
  }
  if (has("banner")) {
    fill(160, 6, 2, 4, INK);
    fill(178, 6, 2, 4, INK);
    fill(160, 10, 20, 10, 0x8d3a36);
    fill(164, 12, 12, 4, GOLD);
  }
  if (has("clock")) {
    fill(90, 58, 10, 14, 0xf4efe6);
    fill(90, 58, 10, 2, 0x6b4428);
    set(95, 64, INK);
    set(95, 61, INK);
    set(97, 64, INK);
  }
  if (has("tin")) {
    fill(78, 66, 8, 8, 0xc45b55);
    fill(79, 64, 6, 2, 0xf4efe6);
    set(81, 68, GOLD);
  }
  if (has("nest")) {
    ellipse(40, 84, 12, 4, 0xc45b55);
    ellipse(40, 83, 8, 2, 0xf6d7b0);
  }
  if (has("ball")) {
    const roll = running ? Math.round(Math.sin(now / 180) * 5) : 0;
    ellipse(50 + roll, floorY - 4, 3, 3, 0xc45b55);
    set(50 + roll, floorY - 5, 0xf4efe6);
  }
  if (has("crate")) {
    fill(8, floorY - 10, 30, 10, 0x8a5a32);
    fill(8, floorY - 10, 30, 2, 0x6b4428);
    fill(8, floorY - 2, 30, 2, 0x6b4428);
  }
  if (has("oil")) {
    fill(102, 66, 6, 8, 0x2a1c14);
    fill(103, 64, 4, 3, GOLD);
  }

  const cx = 142;
  const cy = 48;
  const stand = 0xc4a574;
  const standDark = 0x6b4428;
  for (let y = floorY; y < floorY + 4; y += 1) {
    for (let x = cx - 20; x < cx + 20; x += 1) {
      if ((x - cx) * (x - cx) / 3 + (y - floorY) * 8 < 80) set(x, y, 0x5c3818);
    }
  }
  if (running) angle += Math.max(0.04, Math.min(0.22, shownRate / 1600000)) * (has("oil") ? 1.35 : 1);
  ring(cx, cy, 24, 22, INK);
  ring(cx, cy, 22, 16, has("rim") ? GOLD : WOOD);
  ring(cx, cy, 17, 15, WOOD2);
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const t = angle + (spoke * Math.PI) / 4;
    const px = -Math.sin(t);
    const py = Math.cos(t);
    for (let dist = 4; dist <= 15; dist += 1) {
      set(cx + Math.cos(t) * dist, cy + Math.sin(t) * dist, 0xf0e2c4);
      set(cx + Math.cos(t) * dist + px, cy + Math.sin(t) * dist + py, WOOD);
    }
  }
  fill(cx - 34, cy - 2, 14, 5, stand);
  fill(cx + 20, cy - 2, 14, 5, stand);
  fill(cx - 34, cy - 3, 14, 1, INK);
  fill(cx + 20, cy - 3, 14, 1, INK);
  for (let y = cy + 2; y < floorY + 4; y += 1) {
    fill(cx - 34, y, 4, 1, standDark);
    set(cx - 34, y, stand);
    fill(cx + 30, y, 4, 1, standDark);
    set(cx + 33, y, stand);
  }
  fill(cx - 36, floorY + 1, 12, 4, standDark);
  fill(cx + 24, floorY + 1, 12, 4, standDark);
  ellipse(cx, cy, 3, 3, 0xc9cdd4);
  set(cx, cy, 0x6d7388);

  const bob = running ? Math.floor(now / 130) % 2 : 0;
  const step = Math.floor(now / 130) % 2;
  const blink = !running && Math.floor(now / 2400) % 8 === 0;
  const hx = cx - 2;
  const hy = cy + 8 + bob;
  ellipse(hx - 6, hy + 1, 2, 1, FUR);
  ellipse(hx, hy, 6, 4, FUR);
  ellipse(hx, hy + 1, 3, 2, BELLY);
  ellipse(hx + 5, hy - 1, 3, 3, FUR2);
  ellipse(hx + 7, hy, 2, 1, FUR2);
  ellipse(hx + 6, hy - 5, 2, 2, FUR);
  ellipse(hx + 6, hy - 4, 1, 1, EAR);
  ellipse(hx + 3, hy - 5, 1, 2, FUR);
  if (blink) {
    fill(hx + 5, hy - 1, 3, 1, EYE);
  } else {
    set(hx + 6, hy - 2, EYE);
    set(hx + 6, hy - 3, 0xfff6e8);
  }
  set(hx + 8, hy, 0xc45b55);
  set(hx + 4, hy, EAR);
  if (running) {
    if (step === 0) {
      fill(hx - 3, hy + 3, 2, 2, FUR);
      fill(hx + 2, hy + 4, 2, 2, FUR);
    } else {
      fill(hx - 4, hy + 4, 2, 2, FUR);
      fill(hx + 1, hy + 3, 2, 2, FUR);
    }
  } else {
    fill(hx - 2, hy + 3, 2, 1, FUR);
    fill(hx + 2, hy + 3, 2, 1, FUR);
  }

  const family = new Set([FUR, FUR2, BELLY, EAR, EYE, 0xc45b55, 0xfff6e8]);
  const contour = [];
  for (let y = hy - 8; y <= hy + 7; y += 1) {
    for (let x = hx - 9; x <= hx + 11; x += 1) {
      if (!family.has(at(x, y))) continue;
      const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of neighbors) {
        if (!family.has(at(x + dx, y + dy))) contour.push([x + dx, y + dy]);
      }
    }
  }
  for (const [x, y] of contour) set(x, y, INK);

  if (has("crown")) {
    fill(hx + 3, hy - 7, 5, 1, GOLD);
    fill(hx + 3, hy - 9, 1, 2, GOLD);
    fill(hx + 5, hy - 10, 1, 3, 0xffe7b0);
    fill(hx + 7, hy - 9, 1, 2, GOLD);
  }
  for (const [id, x, y] of [
    ["bowl", 20, 79], ["mat", 10, 80], ["ball", 48, 68], ["crate", 10, 66],
    ["lamp", 116, 26], ["frame", 58, 14], ["nest", 30, 82], ["plant", 56, 60],
    ["curtain", 14, 14], ["clock", 90, 58], ["shelf", 70, 20], ["tin", 78, 64],
    ["bell", 92, 12], ["banner", 160, 10], ["oil", 102, 64],
    ["crown", hx + 4, hy - 10], ["rim", cx, cy - 23],
  ]) {
    const level = itemLevel(id);
    if (level >= 2) set(x, y, 0xffe7b0);
    if (level >= 3) set(x + 2, y, GOLD);
  }

  const pile = Math.min(8, Math.floor((state.ore || 0) / 8));
  for (let i = 0; i < pile; i += 1) {
    const nx = 16 + (i % 4) * 5;
    const ny = floorY - 4 - Math.floor(i / 4) * 4;
    ellipse(nx, ny, 2, 2, GOLD);
    set(nx, ny - 1, 0xffe7b0);
  }

  const glyph = {
    "+": ["#.#", "###", "#.#"],
    "0": ["###", "#.#", "#.#", "#.#", "###"],
    "1": [".#.", "##.", ".#.", ".#.", "###"],
    "2": ["###", "..#", "###", "#..", "###"],
    "3": ["###", "..#", "###", "..#", "###"],
    "4": ["#.#", "#.#", "###", "..#", "..#"],
    "5": ["###", "#..", "###", "..#", "###"],
    "6": ["###", "#..", "###", "#.#", "###"],
    "7": ["###", "..#", ".#.", ".#.", ".#."],
    "8": ["###", "#.#", "###", "#.#", "###"],
    "9": ["###", "#.#", "###", "..#", "###"],
  };
  const stamp = (text, x, y) => {
    let cursor = x;
    for (const ch of text) {
      const rows = glyph[ch];
      if (!rows) continue;
      rows.forEach((row, ry) => {
        [...row].forEach((cell, rx) => {
          if (cell === "#") set(cursor + rx, y + ry, 0xfff1c4);
        });
      });
      cursor += 4;
    }
  };
  pops.forEach((pop) => {
    pop.life -= 0.016;
    const rise = Math.round((1.4 - pop.life) * 10);
    stamp(pop.ore ? `+${pop.ore}` : "+", 24, 28 - rise);
  });
  pops = pops.filter((pop) => pop.life > 0);

  if (!roomScratch) roomScratch = document.createElement("canvas");
  roomScratch.width = WORLD_W;
  roomScratch.height = WORLD_H;
  const scratch = roomScratch.getContext("2d");
  scratch.putImageData(new ImageData(pix, WORLD_W, WORLD_H), 0, 0);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(roomScratch, 0, 0, bufW, bufH);
  requestAnimationFrame(draw);
}

async function hello() {
  const response = await fetch(`${API}/api/hello`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ minerId: state.minerId, refId: state.welcomed ? "" : state.refId }),
  }).catch(() => null);
  if (!response || !response.ok) return;
  const body = await response.json();
  state = { ...state, refId: body.refId || "", welcomed: true };
  save();
  render();
}

async function pulse() {
  if (!state.welcomed) return;
  if (unsentOre > 0) {
    const ore = unsentOre;
    unsentOre = 0;
    const sent = await fetch(`${API}/api/pulse`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minerId: state.minerId, ore }),
    }).then((response) => response.ok).catch(() => false);
    if (!sent) unsentOre += ore;
  }
  const response = await fetch(`${API}/api/bonus?id=${state.minerId}`).catch(() => null);
  if (!response || !response.ok) return;
  const body = await response.json();
  pendingMilli = body.pendingMilli || 0;
  if (body.ore > 0) {
    state = { ...state, ore: state.ore + body.ore, friendOre: (state.friendOre || 0) + body.ore };
    pops.push({ life: 1.4, ore: body.ore });
    save();
  }
  render();
}

function friendWindowPush(hashes) { friendWindow.push([Date.now(), hashes]); }

$("power").addEventListener("click", () => {
  try {
    if (running) stopMiners();
    else startMiners();
    render();
  } catch (error) {
    $("note").textContent = String(error && error.stack || error);
  }
});
$("mode").addEventListener("click", () => {
  fullPower = !fullPower;
  if (running) startMiners();
  render();
});
$("lang").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem("burrowkeep-lang", lang);
  render();
});

setInterval(() => { takeOre(); paintLive(); }, 500);
setInterval(() => { pulse(); syncBoard(); }, 5000);
render();
hello().then(() => syncBoard());
requestAnimationFrame(draw);
