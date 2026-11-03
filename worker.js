import { isShare, sha256 } from "./hash.js";

let running = false;
const block = new Uint8Array(24);

self.onmessage = (event) => {
  if (event.data?.type === "stop") running = false;
  if (event.data?.type === "start" && !running) {
    running = true;
    crypto.getRandomValues(block.subarray(0, 8));
    setTimeout(batch, 0);
  }
};

function batch() {
  if (!running) return;
  let hashes = 0;
  let shares = 0;
  let nonce = (Math.random() * 0x100000000) >>> 0;
  for (let i = 0; i < 3000; i += 1) {
    nonce = (nonce + 1) >>> 0;
    block[8] = nonce >>> 24;
    block[9] = nonce >>> 16;
    block[10] = nonce >>> 8;
    block[11] = nonce;
    const hash = sha256(block);
    hashes += 1;
    if (isShare(hash)) shares += 1;
  }
  self.postMessage({ hashes, shares });
  setTimeout(batch, 0);
}
