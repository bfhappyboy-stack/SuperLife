import { RANKS, UPBRINGINGS, powerById } from "./data";
import { getPower, legacyComboId } from "./combo";
import { ensureWardrobe } from "./costume";
import { migrateChapters } from "./chapters";
import { ensureMarket } from "./market";
import { clamp } from "./format";
import { mergeHeroes } from "./heroes";
import { resolveLook } from "./look";
import { STARTER_IDS } from "./powers.catalog";
import { presetById } from "./presets";
import { asDifficulty, DEFAULT_DIFFICULTY } from "./difficulty";
import type { Game } from "./types";

/** The original single save. Kept untouched after migration as a backup. */
export const LEGACY_KEY = "superlife.save.v1";
const SCORE_KEY = "superlife.scores.v1";
/** Up to five lives at a time, one localStorage key each, plus a small index. */
export const SLOT_COUNT = 5;
export const LIVES_KEY = "superlife.lives.v1";
export const slotKey = (slot: number) => `superlife.life.${slot}.v1`;

export interface LivesIndex {
  version: 1;
  active: number | null;
  lastPlayed: Record<string, number>;
  /** True once the old single save has been copied into slot 1 (never copied twice). */
  migrated: boolean;
}

export interface SlotSummary {
  slot: number;
  empty: boolean;
  name?: string;
  age?: number;
  dead?: boolean;
  score?: number;
  mode?: string;
  modeKind?: "mystery" | "legend" | "own" | "classic";
  city?: string;
  portrait?: number;
  sex?: Game["sex"];
  powerId?: Game["powerId"];
  rank?: number;
  mood?: number;
  look?: Game["look"];
  /** Legend preset id, so the card can show the painted portrait. */
  preset?: string | null;
  lastPlayed?: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  age: number;
  detail: string;
  at: number;
}

function validGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const g = value as { version?: number; age?: unknown; name?: unknown; stats?: unknown; card?: unknown };
  return (g.version === 1 || g.version === 2) && typeof g.age === "number" && typeof g.name === "string" && !!g.stats && !!g.card;
}

function migrate(game: Game): Game {
  const next = game;
  next.version = 2;
  if (typeof next.month !== "number") next.month = 0;
  if (next.secondaryId === undefined) next.secondaryId = null;
  if (!Array.isArray(next.roster)) next.roster = [];
  if (next.sex !== "female" && next.sex !== "male") next.sex = ((next.portrait ?? 0) & 1) === 0 ? "female" : "male";
  if (typeof next.stats.karma !== "number") next.stats.karma = clamp(Math.round((next.stats.reputation ?? 0) / 2), -100, 100);
  if (!Array.isArray(next.unlockedPowers)) next.unlockedPowers = [];
  pruneStarterBundle(next);
  for (const id of [legacyComboId(next.powerId), legacyComboId(next.secondaryId)]) {
    if (id && !next.unlockedPowers.includes(id)) next.unlockedPowers.push(id);
  }
  if (next.crew === undefined) next.crew = null;
  if (next.crew) {
    if (typeof next.crew.heat !== "number") next.crew.heat = 15;
    if (typeof next.crew.loyalty !== "number") next.crew.loyalty = 55;
    if (!next.crew.motto) next.crew.motto = "No real names.";
  }
  next.heroes = mergeHeroes(next.heroes);
  if (!next.mastery || typeof next.mastery !== "object") next.mastery = {};
  if (!Array.isArray(next.loadout)) next.loadout = [];
  const priorSets = Array.isArray(next.moveSets) ? next.moveSets : [];
  if (priorSets.length < 2) {
    next.moveSets = [
      { name: "Set A", moves: Array.isArray(priorSets[0]?.moves) ? priorSets[0].moves : [] },
      { name: "Set B", moves: Array.isArray(priorSets[1]?.moves) ? priorSets[1].moves : [] },
    ];
  }
  if (next.focusPower === undefined) next.focusPower = null;
  if (!next.story || typeof next.story !== "object") next.story = { active: null, cleared: [], progress: {} };
  if (!Array.isArray(next.story.cleared)) next.story.cleared = [];
  if (!next.story.progress || typeof next.story.progress !== "object") next.story.progress = {};
  if (!Array.isArray(next.discovered)) next.discovered = [...next.unlockedPowers];
  if (!next.moveExp || typeof next.moveExp !== "object") next.moveExp = {};
  if (!Array.isArray(next.traits)) next.traits = [];
  next.look = resolveLook(next.portrait ?? 1, next.look);
  next.wardrobe = ensureWardrobe(next.wardrobe);
  if (next.giftId === undefined) next.giftId = legacyComboId(next.powerId) ?? next.unlockedPowers[0] ?? null;
  if (next.focusPower && !next.unlockedPowers.includes(next.focusPower)) next.focusPower = next.unlockedPowers[0] ?? null;
  if (!UPBRINGINGS.some((row) => row.id === next.upbringing)) next.upbringing = "supportive";
  for (const id of next.unlockedPowers) {
    if (next.mastery[id] == null) next.mastery[id] = 0;
  }
  migrateChapters(next);
  ensureMarket(next);
  next.difficulty = asDifficulty(next.difficulty ?? DEFAULT_DIFFICULTY);
  const rg = next.regroup as unknown;
  if (rg !== undefined && rg !== null && !(typeof rg === "object" && typeof (rg as { name?: unknown }).name === "string" && typeof (rg as { until?: unknown }).until === "number")) next.regroup = null;
  return next;
}

const FREEBIES = new Set<string>([...STARTER_IDS, "lightning-control"]);

function pruneStarterBundle(game: Game) {
  // Mystery and God lives postdate the old free starter bundle; God picks can legitimately own several base powers.
  if (game.mode) return;
  const owned = game.unlockedPowers ?? [];
  const freeOwned = owned.filter((id) => FREEBIES.has(id));
  if (freeOwned.length < 2) return;
  const keep = new Set<string>();
  for (const id of [legacyComboId(game.powerId), legacyComboId(game.secondaryId), game.giftId]) {
    if (id) keep.add(id);
  }
  for (const id of owned) {
    if (FREEBIES.has(id)) continue;
    for (const ingredient of getPower(id)?.ingredients ?? []) keep.add(ingredient);
  }
  const next = owned.filter((id) => {
    if (!FREEBIES.has(id)) return true;
    if ((game.mastery?.[id] ?? 0) > 0) return true;
    return keep.has(id);
  });
  const removed = new Set(owned.filter((id) => !next.includes(id)));
  game.unlockedPowers = next;
  if (Array.isArray(game.discovered)) game.discovered = game.discovered.filter((id) => !removed.has(id));
}

function store(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: string): Game | null {
  try {
    const raw = store()?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return validGame(parsed) ? migrate(parsed) : null;
  } catch {
    return null;
  }
}

const validSlot = (slot: unknown): slot is number => typeof slot === "number" && Number.isInteger(slot) && slot >= 1 && slot <= SLOT_COUNT;

export function readIndex(): LivesIndex {
  const blank: LivesIndex = { version: 1, active: null, lastPlayed: {}, migrated: false };
  try {
    const raw = store()?.getItem(LIVES_KEY);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as Partial<LivesIndex>;
    return {
      version: 1,
      active: validSlot(parsed.active) ? parsed.active : null,
      lastPlayed: parsed.lastPlayed && typeof parsed.lastPlayed === "object" ? { ...parsed.lastPlayed } : {},
      migrated: parsed.migrated === true,
    };
  } catch {
    return blank;
  }
}

function writeIndex(index: LivesIndex): void {
  try {
    store()?.setItem(LIVES_KEY, JSON.stringify(index));
  } catch {
    /* quota — the lives themselves still saved */
  }
}

/**
 * One-time move from the single save to slot 1. The old key is left in place as a backup and
 * the index remembers the move, so deleting slot 1 later never brings the old life back.
 */
export function migrateLegacySave(): LivesIndex {
  const index = readIndex();
  if (index.migrated) return index;
  index.migrated = true;
  const legacy = readRaw(LEGACY_KEY);
  const taken = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).some((slot) => !!store()?.getItem(slotKey(slot)));
  if (legacy && !taken) {
    try {
      store()?.setItem(slotKey(1), JSON.stringify(legacy));
      index.active = 1;
      index.lastPlayed["1"] = index.lastPlayed["1"] ?? Date.now();
    } catch {
      index.migrated = false;
      return index;
    }
  }
  writeIndex(index);
  return index;
}

export function loadSlot(slot: number): Game | null {
  return validSlot(slot) ? readRaw(slotKey(slot)) : null;
}

/** Writes one life into its own slot. Never touches any other slot. */
export function saveSlot(slot: number, game: Game, now = Date.now()): void {
  if (!validSlot(slot)) return;
  try {
    store()?.setItem(slotKey(slot), JSON.stringify(game));
  } catch {
    /* private mode / quota — keep playing in memory */
    return;
  }
  const index = readIndex();
  index.lastPlayed[String(slot)] = now;
  index.active = slot;
  writeIndex(index);
}

export function deleteSlot(slot: number): void {
  if (!validSlot(slot)) return;
  try {
    store()?.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
  const index = readIndex();
  delete index.lastPlayed[String(slot)];
  if (index.active === slot) index.active = null;
  writeIndex(index);
}

export function setActiveSlot(slot: number | null): void {
  const index = readIndex();
  index.active = validSlot(slot) ? slot : null;
  writeIndex(index);
}

export function firstEmptySlot(): number | null {
  for (let slot = 1; slot <= SLOT_COUNT; slot++) if (!store()?.getItem(slotKey(slot))) return slot;
  return null;
}

export function modeOf(game: Game): { label: string; kind: NonNullable<SlotSummary["modeKind"]> } {
  if (game.preset) {
    const legend = presetById(game.preset);
    return { label: legend ? `God Mode · ${legend.hero}` : "God Mode legend", kind: "legend" };
  }
  if (game.mode === "god") return { label: "Build your own", kind: "own" };
  if (game.mode === "mystery") return { label: "Mystery", kind: "mystery" };
  return { label: "Classic", kind: "classic" };
}

export function summarize(slot: number, game: Game | null, lastPlayed?: number): SlotSummary {
  if (!game) return { slot, empty: true };
  const mode = modeOf(game);
  return {
    slot,
    empty: false,
    name: game.name,
    age: game.age,
    dead: game.phase === "dead",
    score: game.death?.score,
    mode: mode.label,
    modeKind: mode.kind,
    city: game.city,
    portrait: game.portrait,
    sex: game.sex,
    powerId: game.powerId,
    rank: game.leagueRank,
    mood: game.stats.happiness,
    look: game.look,
    preset: game.preset ?? null,
    lastPlayed,
  };
}

export function listSlots(): SlotSummary[] {
  const index = readIndex();
  return Array.from({ length: SLOT_COUNT }, (_, i) => summarize(i + 1, loadSlot(i + 1), index.lastPlayed[String(i + 1)]));
}

/** The life you were last playing (after the one-time migration). */
export function loadGame(): Game | null {
  const index = migrateLegacySave();
  return index.active ? loadSlot(index.active) : null;
}

/** Saves into the given or active slot (else the first empty one; never over another life). Clearing just drops the active pointer. */
export function saveGame(game: Game | null, slot?: number): void {
  if (!game) {
    setActiveSlot(null);
    return;
  }
  const target = slot ?? readIndex().active ?? firstEmptySlot();
  if (target) saveSlot(target, game);
}

export function loadScores(): ScoreRow[] {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row.score === "number" && typeof row.name === "string").slice(0, 8);
  } catch {
    return [];
  }
}

export function saveScores(rows: ScoreRow[]): void {
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify(rows.slice(0, 8)));
  } catch {
    /* ignore quota */
  }
}

export function pushScore(rows: ScoreRow[], game: Game): ScoreRow[] {
  if (!game.death) return rows;
  if (rows.some((row) => row.at === game.death?.at)) return rows;
  const next: ScoreRow = {
    name: game.name,
    score: game.death.score,
    age: game.age,
    detail: `${RANKS[game.leagueRank] ?? "Civilian"} · ${powerById(game.powerId)?.name ?? "Unpowered"}`,
    at: game.death.at,
  };
  return [...rows, next].sort((a, b) => b.score - a.score).slice(0, 8);
}
