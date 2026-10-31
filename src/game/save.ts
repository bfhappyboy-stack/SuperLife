import { RANKS, UPBRINGINGS, powerById } from "./data";
import { getPower, legacyComboId } from "./combo";
import { ensureWardrobe } from "./costume";
import { migrateChapters } from "./chapters";
import { clamp } from "./format";
import { mergeHeroes } from "./heroes";
import { resolveLook } from "./look";
import { STARTER_IDS } from "./powers.catalog";
import type { Game } from "./types";

const GAME_KEY = "superlife.save.v1";
const SCORE_KEY = "superlife.scores.v1";

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
  return next;
}

const FREEBIES = new Set<string>([...STARTER_IDS, "lightning-control"]);

function pruneStarterBundle(game: Game) {
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

export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return validGame(parsed) ? migrate(parsed) : null;
  } catch {
    return null;
  }
}

export function saveGame(game: Game | null): void {
  try {
    if (!game) localStorage.removeItem(GAME_KEY);
    else localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    /* private mode / quota — keep playing in memory */
  }
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
