const SCALE = [0, 2, 4, 7, 9];

export function readSettlements(body) {
  const rows = [];
  for (const event of body?.events || []) {
    if (event?.type !== "system.settlement_completed") continue;
    if (event.source?.confirmationStatus !== "safe") continue;
    const prev = String(event.payload?.previousSettledThroughRound || "");
    const end = String(event.payload?.settledThroughRound || "");
    const work = String(event.payload?.workAdded || "");
    if (!/^\d+$/.test(prev) || !/^\d+$/.test(end) || !/^\d+$/.test(work)) continue;
    if (BigInt(end) !== BigInt(prev) + 1n) continue;
    rows.push({ round: end, work: Number(work) });
  }
  rows.sort((a, b) => (Number(a.round) > Number(b.round) ? 1 : -1));
  return rows;
}

export function kindOf(work) {
  if (work <= 0) return "rest";
  if (work < 500) return "jog";
  return "sprint";
}

export function noteOf(work) {
  if (work <= 0) return null;
  return 60 + SCALE[work % 5];
}

function vlq(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

export function midiBytes(stitches) {
  const events = [];
  let tick = 0;
  for (const stitch of stitches) {
    const note = noteOf(stitch.work);
    const span = stitch.work >= 500 ? 200 : 140;
    if (note !== null) {
      events.push({ tick, data: [0x90, note, stitch.work >= 500 ? 110 : 78] });
      events.push({ tick: tick + span, data: [0x80, note, 0] });
      if (stitch.work >= 500) {
        events.push({ tick, data: [0x90, note + 7, 92] });
        events.push({ tick: tick + span, data: [0x80, note + 7, 0] });
      }
    }
    tick += 240;
  }
  events.sort((a, b) => a.tick - b.tick || a.data[0] - b.data[0]);
  const track = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20];
  let last = 0;
  for (const event of events) {
    track.push(...vlq(event.tick - last), ...event.data);
    last = event.tick;
  }
  track.push(...vlq(Math.max(0, tick - last)), 0xff, 0x2f, 0x00);
  const header = [0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, 0x01, 0xe0];
  const size = track.length;
  const head = [0x4d, 0x54, 0x72, 0x6b, (size >> 24) & 0xff, (size >> 16) & 0xff, (size >> 8) & 0xff, size & 0xff];
  return new Uint8Array([...header, ...head, ...track]);
}

export const COL = 8;
export const CELL_H = 24;
export const HEM = 4;
const WEFTS = [4, 8, 12, 16, 20];

function cellOrigin(index) {
  return { x: index * COL, y: HEM };
}

function weave(ctx, x, y) {
  for (let py = 0; py < CELL_H; py += 2) {
    for (let px = 0; px < COL; px += 2) {
      ctx.fillStyle = ((px + py) / 2) % 2 === 0 ? "#6b4a36" : "#5c3e2e";
      ctx.fillRect(x + px, y + py, 2, 2);
    }
  }
}

function pathPoint(index) {
  const row = Math.floor(index / 6) % WEFTS.length;
  const col = index % 6;
  const x = row % 2 === 0 ? 1 + col : 6 - col;
  return { x, y: WEFTS[row] };
}

export function paintCloth(ctx, stitches, pen, heard) {
  const cols = Math.max(1, stitches.length + 1);
  const width = cols * COL;
  const height = CELL_H + HEM * 2;
  const canvas = ctx.canvas;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.fillStyle = "#3a281c";
  ctx.fillRect(0, 0, width, height);
  const drawCell = (index) => {
    const origin = cellOrigin(index);
    weave(ctx, origin.x, origin.y);
    return origin;
  };
  stitches.forEach((stitch, index) => {
    const origin = drawCell(index);
    if (stitch.work <= 0) {
      ctx.fillStyle = "#4a3226";
      ctx.fillRect(origin.x + 3, origin.y + 12, 1, 1);
    } else {
      const weft = WEFTS[stitch.work % 5];
      const fromRight = index % 2 === 1;
      const x0 = fromRight ? origin.x + 3 : origin.x + 1;
      ctx.fillStyle = stitch.work >= 500 ? "#f6e7a8" : "#e2a04a";
      ctx.fillRect(x0, origin.y + weft, stitch.work >= 500 ? 5 : 4, 1);
      if (stitch.work >= 500) {
        ctx.fillStyle = "#e24b32";
        ctx.fillRect(origin.x + 3, origin.y + weft, 2, 2);
      }
    }
    if (index === heard && stitch.work > 0) {
      const weft = WEFTS[stitch.work % 5];
      ctx.fillStyle = "#f3e6d0";
      ctx.fillRect(origin.x + 2, origin.y + weft, 1, 1);
    }
  });
  const origin = drawCell(stitches.length);
  const point = pathPoint(pen.index || 0);
  if (pen.moving) {
    ctx.fillStyle = "#f3e6d0";
    for (let i = 0; i < (pen.index || 0); i += 1) {
      const trail = pathPoint(i);
      ctx.fillRect(origin.x + trail.x, origin.y + trail.y, 1, 1);
    }
  }
  ctx.fillStyle = "#fff8e8";
  ctx.fillRect(origin.x + point.x, origin.y + point.y, 1, 1);
}

export function columnAt(offsetX, count) {
  const index = Math.floor(offsetX / COL);
  if (index < 0 || index >= count) return -1;
  return index;
}
