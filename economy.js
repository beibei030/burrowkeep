export const MAX_LEVEL = 8;
export const FOOD_COST = 8;
export const BASE_HASHES_PER_ORE = 400000;
export const FRIEND_RATE = 0.05;

export function hashesPerOre(hamsterLevel, hungry, ease = 1) {
  const level = Math.max(1, Math.min(MAX_LEVEL, hamsterLevel || 1));
  const throughFive = BASE_HASHES_PER_ORE - (Math.min(level, 5) - 1) * 80000;
  const afterFive = Math.max(0, level - 5) * 10000;
  const eased = Math.max(50000, throughFive - afterFive);
  const scaled = Math.max(30000, Math.floor(eased * ease));
  return hungry ? scaled * 2 : scaled;
}

export function threadsFor(gearLevel, cores) {
  return Math.max(1, Math.min(gearLevel, cores || 1, MAX_LEVEL));
}

export function upgradeCost(kind, level) {
  if (kind === "hamster") return 12 * 2 ** (level - 1);
  return 18 * 2 ** (level - 1);
}

export function mintOre(bankedHashes, hamsterLevel, hungry, ease = 1) {
  const need = hashesPerOre(hamsterLevel, hungry, ease);
  const ore = Math.floor(bankedHashes / need);
  return { ore, leftover: bankedHashes - ore * need, need };
}

export const SNACK_COST = 6;
export const SNACK_MS = 15000;
export const SNACK_COOLDOWN_MS = 60000;

export function snack(state, now = Date.now()) {
  if (!(state.owned || []).includes("tin") || state.ore < SNACK_COST) return null;
  if ((state.snackReady || 0) > now) return null;
  return {
    ...state,
    ore: state.ore - SNACK_COST,
    satiety: Math.min(MAX_LEVEL, (state.satiety || 0) + 1),
    snackUntil: now + SNACK_MS,
    snackReady: now + SNACK_COOLDOWN_MS,
  };
}

export function feed(state) {
  if (state.ore < FOOD_COST || state.satiety >= MAX_LEVEL) return null;
  return { ...state, ore: state.ore - FOOD_COST, satiety: state.satiety + 1 };
}

export function upgrade(state, kind) {
  const level = state[kind];
  if (level >= MAX_LEVEL) return null;
  const cost = upgradeCost(kind, level);
  if (state.ore < cost) return null;
  return { ...state, ore: state.ore - cost, [kind]: level + 1 };
}

export function friendOreMilli(ore) {
  return Math.max(0, Math.floor(ore)) * 50;
}

export const ORE_PER_IRON = 100;
export const IRON_PER_SILVER = 10;
export const SILVER_PER_GOLD = 10;

export function exchange(state, kind) {
  if (kind === "iron") {
    if (state.ore < ORE_PER_IRON) return null;
    return { ...state, ore: state.ore - ORE_PER_IRON, iron: state.iron + 1 };
  }
  if (kind === "silver") {
    if (state.iron < IRON_PER_SILVER) return null;
    return { ...state, iron: state.iron - IRON_PER_SILVER, silver: state.silver + 1 };
  }
  if (kind === "gold") {
    if (state.silver < SILVER_PER_GOLD) return null;
    return { ...state, silver: state.silver - SILVER_PER_GOLD, gold: state.gold + 1 };
  }
  return null;
}

export function buyItem(state, item) {
  if (state.owned.includes(item.id) || state[item.sand] < item.cost) return null;
  return {
    ...state,
    [item.sand]: state[item.sand] - item.cost,
    owned: [...state.owned, item.id],
    levels: { ...(state.levels || {}), [item.id]: 1 },
  };
}

export const MAX_DECOR_LEVEL = 3;

export function upgradeDecor(state, item) {
  if (!state.owned.includes(item.id)) return null;
  const level = state.levels?.[item.id] || 1;
  if (level >= MAX_DECOR_LEVEL) return null;
  const cost = item.cost * level;
  if (state[item.sand] < cost) return null;
  return {
    ...state,
    [item.sand]: state[item.sand] - cost,
    levels: { ...(state.levels || {}), [item.id]: level + 1 },
  };
}
