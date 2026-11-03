export const CAP = 5;
export const ACTIONS = ["stock", "trim", "shore", "listen"];
export const OUTCOMES = ["nap", "jog", "zoomies"];

export function classify(work) {
  if (typeof work !== "bigint" || work < 0n) return null;
  if (work === 0n) return "nap";
  if (work < 500n) return "jog";
  return "zoomies";
}

function parseUint(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return BigInt(value);
}

function isTx(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function apply(resources, action, outcome) {
  if (!ACTIONS.includes(action) || !OUTCOMES.includes(outcome)) return null;
  const next = {
    stores: resources.stores,
    lamp: resources.lamp,
    timber: resources.timber,
  };
  const delta = { stores: 0, lamp: 0, timber: 0 };
  const add = (key, amount) => {
    const before = next[key];
    next[key] = Math.max(0, Math.min(CAP, before + amount));
    delta[key] += next[key] - before;
  };

  if (action === "stock" && outcome === "nap") add("stores", 1);
  else if (action === "stock" && outcome === "jog") add("timber", -1);
  else if (action === "stock" && outcome === "zoomies") {
    add("stores", 2);
    add("lamp", -1);
  } else if (action === "trim" && outcome === "nap") add("lamp", -1);
  else if (action === "trim" && outcome === "jog") add("lamp", 1);
  else if (action === "trim" && outcome === "zoomies") {
    add("lamp", 2);
    add("stores", -1);
  } else if (action === "shore" && outcome === "nap") add("timber", -1);
  else if (action === "shore" && outcome === "jog") add("timber", 1);
  else if (action === "shore" && outcome === "zoomies") {
    add("timber", 2);
    add("stores", -1);
  } else if (action === "listen" && outcome === "jog") {
    if (next.lamp < CAP) add("lamp", 1);
    else add("stores", 1);
  } else if (action === "listen" && outcome === "zoomies") {
    add("stores", -1);
    add("lamp", -1);
    add("timber", -1);
  }

  const lost = ["stores", "lamp", "timber"].filter((key) => next[key] === 0);
  return { resources: next, delta, lost };
}

export function settlementRecords(events) {
  if (!events || events.schemaVersion !== 3 || events.status !== "available") {
    return { ok: false, reason: "unavailable" };
  }
  if (String(events.chain?.chainId) !== "11155111") {
    return { ok: false, reason: "chain" };
  }
  const byRound = new Map();
  const singles = [];
  let oldest = null;
  let frontier = null;
  for (const event of events.events || []) {
    if (event?.type !== "system.settlement_completed") continue;
    if (event.source?.confirmationStatus !== "safe") continue;
    const prev = parseUint(event.payload?.previousSettledThroughRound);
    const end = parseUint(event.payload?.settledThroughRound);
    const work = parseUint(event.payload?.workAdded);
    const tx = event.source?.transactionHash;
    if (prev === null || end === null || work === null || !isTx(tx)) continue;
    const span = end - prev;
    if (span <= 0n || span > 16n) continue;
    if (frontier === null || end > frontier) frontier = end;
    if (oldest === null || prev < oldest) oldest = prev;
    if (span === 1n) {
      if (!byRound.has(end)) {
        const record = { kind: "single", round: end, work, tx };
        byRound.set(end, record);
        singles.push(record);
      }
    } else {
      for (let round = prev + 1n; round <= end; round++) {
        if (!byRound.has(round)) {
          byRound.set(round, { kind: "bundled", round, span, tx });
        }
      }
    }
  }
  return { ok: true, byRound, singles, oldest, frontier };
}

export function rehearsalDeck(singles) {
  const playable = (window) => [...window].reverse();
  const shape = (window) => {
    let nap = 0;
    let jog = 0;
    let sprint = 0;
    for (const item of window) {
      if (item.work === 0n) nap += 1;
      else if (item.work < 500n) jog += 1;
      else sprint += 1;
    }
    return { nap, jog, sprint, moving: jog + sprint };
  };
  if (singles.length <= 12) return { deck: playable(singles), kind: "latest" };
  const windows = [];
  for (let index = 0; index + 12 <= singles.length; index += 1) {
    windows.push({ index, window: singles.slice(index, index + 12), ...shape(singles.slice(index, index + 12)) });
  }
  const chosen = windows.find((item) => item.nap > 0 && item.jog > 0 && item.sprint > 0 && item.moving >= 4)
    || windows.find((item) => item.nap > 0 && item.moving > 0)
    || windows[0];
  return {
    deck: playable(chosen.window),
    kind: chosen.index === 0 ? "latest" : "earlier",
  };
}

export function nightMarks(delta, lost) {
  if (lost?.length) return 0;
  const net = (delta?.stores || 0) + (delta?.lamp || 0) + (delta?.timber || 0);
  return Math.max(0, net);
}

export const KEEPSAKES = [
  { id: "rug", at: 3 },
  { id: "bell", at: 8 },
  { id: "moon", at: 15 },
  { id: "nest", at: 24 },
];

export function ownedKeepsakes(marks) {
  return KEEPSAKES.filter((item) => marks >= item.at);
}

export function braceChart(work) {
  const kind = classify(work);
  if (!kind) return null;
  const count = kind === "nap" ? 4 : kind === "jog" ? 6 : 8;
  const gap = kind === "nap" ? 980 : kind === "jog" ? 700 : 480;
  const windowMs = kind === "nap" ? 620 : kind === "jog" ? 460 : 340;
  const beats = [];
  for (let i = 0; i < count; i += 1) {
    let station = "stores";
    if (kind === "jog") station = i % 2 === 0 ? "lamp" : "timber";
    if (kind === "zoomies") station = ["timber", "lamp", "stores"][i % 3];
    beats.push({ at: 700 + i * gap, station, windowMs });
  }
  return {
    kind,
    beats,
    duration: beats[beats.length - 1].at + windowMs + 350,
    rpm: kind === "nap" ? 0 : kind === "jog" ? 26 : 62,
  };
}

export function gradeBrace(chart, presses) {
  const used = new Set();
  const byStation = { stores: 0, lamp: 0, timber: 0 };
  for (const press of presses) {
    const index = chart.beats.findIndex((beat, beatIndex) => (
      !used.has(beatIndex)
      && press.station === beat.station
      && press.at >= beat.at
      && press.at <= beat.at + beat.windowMs
    ));
    if (index < 0) continue;
    used.add(index);
    byStation[press.station] += 1;
  }
  const hits = used.size;
  const rate = hits / chart.beats.length;
  let action = "listen";
  if (rate >= 0.67) {
    if (chart.kind === "nap") action = "stock";
    else if (chart.kind === "zoomies") action = "shore";
    else action = byStation.timber > byStation.lamp ? "shore" : "trim";
  } else if (rate >= 0.34) {
    action = chart.kind === "zoomies" ? "stock" : "listen";
  } else if (chart.kind === "nap") action = "trim";
  else if (chart.kind === "jog") action = "stock";
  return { hits, total: chart.beats.length, rate, action };
}
