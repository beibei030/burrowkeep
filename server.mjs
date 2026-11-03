import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const storePath = join(root, "referral-store.json");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

function loadStore() {
  const empty = { miners: {}, bonusMilli: {} };
  if (!existsSync(storePath)) return empty;
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8"));
    return { miners: parsed.miners || {}, bonusMilli: parsed.bonusMilli || {} };
  } catch {
    return empty;
  }
}

function saveStore(store) {
  writeFileSync(storePath, JSON.stringify(store));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); }
      catch (error) { reject(error); }
    });
  });
}

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/api/hello" && request.method === "POST") {
      const body = await readBody(request);
      const minerId = String(body.minerId || "");
      const requested = String(body.refId || "");
      if (!/^[a-z0-9]{8,32}$/i.test(minerId)) {
        send(response, 400, "{\"error\":\"bad id\"}");
        return;
      }
      const store = loadStore();
      const existing = store.miners[minerId];
      if (!existing) {
        const refOk = /^[a-z0-9]{8,32}$/i.test(requested) && requested !== minerId;
        store.miners[minerId] = { refId: refOk ? requested : "" };
        saveStore(store);
      }
      const miner = store.miners[minerId];
      send(response, 200, JSON.stringify({
        refId: miner.refId,
        bound: Boolean(miner.refId),
        locked: true,
      }));
      return;
    }
    if (url.pathname === "/api/pulse" && request.method === "POST") {
      const body = await readBody(request);
      const minerId = String(body.minerId || "");
      const ore = Math.max(0, Math.floor(Number(body.ore) || 0));
      if (!/^[a-z0-9]{8,32}$/i.test(minerId) || ore > 100000) {
        send(response, 400, "{\"error\":\"bad pulse\"}");
        return;
      }
      const store = loadStore();
      const miner = store.miners[minerId];
      if (!miner) {
        send(response, 200, "{\"ok\":true,\"accepted\":0}");
        return;
      }
      const now = Date.now();
      const elapsed = miner.pulsedAt ? Math.max(0, now - miner.pulsedAt) : 5000;
      const accepted = Math.min(ore, Math.max(0, Math.ceil(elapsed / 1000 * 200)));
      miner.pulsedAt = now;
      if (miner.refId && accepted > 0) {
        store.bonusMilli[miner.refId] = (store.bonusMilli[miner.refId] || 0) + accepted * 50;
      }
      saveStore(store);
      send(response, 200, JSON.stringify({ ok: true, accepted }));
      return;
    }
    if (url.pathname === "/api/bonus" && request.method === "GET") {
      const id = url.searchParams.get("id") || "";
      if (!/^[a-z0-9]{8,32}$/i.test(id)) {
        send(response, 400, "{\"error\":\"bad id\"}");
        return;
      }
      const store = loadStore();
      const milli = store.bonusMilli[id] || 0;
      const ore = Math.floor(milli / 1000);
      store.bonusMilli[id] = milli - ore * 1000;
      saveStore(store);
      send(response, 200, JSON.stringify({
        ore,
        pendingMilli: store.bonusMilli[id],
        refId: store.miners[id]?.refId || "",
        bound: Boolean(store.miners[id]?.refId),
      }));
      return;
    }
    if (url.pathname === "/api/board" && request.method === "POST") {
      const body = await readBody(request);
      const minerId = String(body.minerId || "");
      const gold = Math.max(0, Math.floor(Number(body.gold) || 0));
      const decor = Math.max(0, Math.floor(Number(body.decor) || 0));
      if (!/^[a-z0-9]{8,32}$/i.test(minerId) || gold > 1000000 || decor > 100000) {
        send(response, 400, "{\"error\":\"bad board\"}");
        return;
      }
      const store = loadStore();
      const existing = store.miners[minerId] || { refId: "" };
      const now = Date.now();
      const prevGold = Math.max(0, Math.floor(Number(existing.gold) || 0));
      const prevDecor = Math.max(0, Math.floor(Number(existing.decor) || 0));
      let goldNext = Math.min(gold, 1000000);
      let decorNext = Math.min(decor, 600);
      if (goldNext > prevGold || decorNext > prevDecor) {
        const elapsed = existing.scoredAt ? Math.max(0, now - existing.scoredAt) / 1000 : 0;
        if (goldNext > prevGold) {
          const goldCap = prevGold + (existing.scoredAt ? Math.ceil(elapsed * 0.05) + 1 : 50);
          goldNext = Math.min(goldNext, goldCap);
        }
        if (decorNext > prevDecor) {
          const decorCap = prevDecor + (existing.scoredAt ? Math.ceil(elapsed * 2) + 5 : 80);
          decorNext = Math.min(decorNext, decorCap);
        }
      }
      store.miners[minerId] = { ...existing, gold: goldNext, decor: decorNext, scoredAt: now };
      saveStore(store);
      send(response, 200, "{\"ok\":true}");
      return;
    }
    if (url.pathname === "/api/board" && request.method === "GET") {
      const store = loadStore();
      const rank = (key) => Object.entries(store.miners)
        .map(([id, row]) => ({ id, score: Math.max(0, Math.floor(Number(row[key]) || 0)) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .slice(0, 8);
      send(response, 200, JSON.stringify({ wealth: rank("gold"), decor: rank("decor") }));
      return;
    }
    const asked = decodeURIComponent(url.pathname);
    if (asked.includes("..") || asked.endsWith("referral-store.json")) {
      send(response, 404, "not found", "text/plain; charset=utf-8");
      return;
    }
    const path = join(root, asked === "/" ? "index.html" : asked.replace(/^[/\\]+/, ""));
    if (!path.startsWith(root) || !existsSync(path) || statSync(path).isDirectory()) {
      send(response, 404, "not found", "text/plain; charset=utf-8");
      return;
    }
    send(response, 200, readFileSync(path), types[extname(path)] || "application/octet-stream");
  } catch {
    send(response, 500, "{\"error\":\"server\"}");
  }
});

server.listen(8765, "127.0.0.1");
