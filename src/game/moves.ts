import { getPower, allPowers } from "./combo";
import { masteryLevel } from "./mastery";
import { MOVE_BOOK, type MoveDef } from "./moves.catalog";
import type { CatalogPower } from "./combo";
import type { DuelMove, Game, MoveStyle } from "./types";

const HAND = new Map<string, MoveDef[]>();
for (const entry of MOVE_BOOK) {
  const list = HAND.get(entry.powerId) ?? [];
  list.push(entry);
  HAND.set(entry.powerId, list);
}

function styleFor(tags: string[], index: number): MoveStyle {
  if (index === 1) return tags.includes("defense") ? "guard" : "trick";
  if (tags.includes("defense")) return "guard";
  if (tags.includes("mobility")) return "trick";
  return "strike";
}

function kindFor(tags: string[], index: number): MoveDef["kind"] {
  if (index === 1 && tags.includes("control")) return "status";
  if (index === 1) return "area";
  if (tags.includes("defense")) return "guard";
  if (tags.includes("mobility")) return "dash";
  return "burst";
}

const KIND_NOUN: Record<MoveDef["kind"], string> = {
  burst: "Strike",
  area: "Wave",
  status: "Hex",
  guard: "Ward",
  dash: "Rush",
};

const KIND_EFFECT: Record<MoveDef["kind"], string> = {
  burst: "One target, full weight.",
  area: "Hits wide. A little extra on everything.",
  status: "Their next swing arrives slowed.",
  guard: "Takes the edge off what comes back.",
  dash: "Hits harder when it answers their tell.",
};

/** Short, readable stem for a generated move: drops filler words, keeps up to two. */
function stem(name: string): string {
  const skip = new Set(["of", "the", "a", "an", "and", "with", "your", "you"]);
  const words = name.replace(/[,.]/g, "").split(/\s+/).filter((word) => word && !skip.has(word.toLowerCase()));
  return (words.length ? words : [name]).slice(0, 2).join(" ");
}

export function movesForPower(power: CatalogPower): MoveDef[] {
  const hand = HAND.get(power.id);
  const generated = generatedMoves(power);
  if (hand?.length) {
    const sorted = [...hand].sort((a, b) => a.minMastery - b.minMastery).map((entry, index) => (index === 0 ? { ...entry, minMastery: 1 } : entry));
    // Every power owns at least two moves: a hand-authored one plus a generated signature if the book stops at one.
    if (sorted.length >= 2) return sorted;
    const extra = generated[1]!;
    return [...sorted, { ...extra, name: sorted.some((entry) => entry.name === extra.name) ? `${extra.name} II` : extra.name }];
  }
  return generated;
}

function generatedMoves(power: CatalogPower): MoveDef[] {
  const gen = power.generation;
  const word = stem(power.name);
  const kindA = kindFor(power.tags, 0);
  const kindB = kindFor(power.tags, 1);
  const nounA = KIND_NOUN[kindA];
  const nounB = gen === 2 ? "Verdict" : KIND_NOUN[kindB] === nounA ? "Shape" : KIND_NOUN[kindB];
  const base: MoveDef = {
    id: `${power.id}::a`,
    name: `${word} ${nounA}`,
    powerId: power.id,
    blurb: power.description,
    minMastery: 1,
    power: gen === 0 ? 4 : gen === 1 ? 7 : 11,
    style: styleFor(power.tags, 0),
    kind: kindA,
    energy: 1 + Math.min(2, gen),
    effect: gen === 0 ? `${KIND_EFFECT[kindA]} Mixed powers hit harder.` : KIND_EFFECT[kindA],
    cooldown: gen === 2 ? 1 : 0,
  };
  const signature: MoveDef = {
    id: `${power.id}::b`,
    name: `${word} ${nounB}`,
    powerId: power.id,
    blurb: gen === 2 ? "The version that ends a conversation." : "The version with a trick in it.",
    minMastery: gen === 0 ? 3 : gen === 1 ? 4 : 5,
    power: gen === 0 ? 6 : gen === 1 ? 10 : 15,
    style: styleFor(power.tags, 1),
    kind: kindB,
    energy: 2 + gen,
    effect: KIND_EFFECT[kindB],
    cooldown: Math.max(1, gen),
  };
  return [base, signature];
}

/**
 * Unpowered street moves. They never take a saved slot; they only pad an unfinished six
 * when a fight starts, so every battle is played with exactly six moves.
 */
export const STREET_MOVES: readonly DuelMove[] = [
  { id: "street::haymaker", name: "Haymaker", blurb: "Ugly and sincere.", power: 4, style: "strike", kind: "burst", energy: 1, effect: "No power in it. Still counts.", cooldown: 0 },
  { id: "street::slip", name: "Slip", blurb: "Don't be where the hit lands.", power: 3, style: "trick", kind: "dash", energy: 1, effect: "Footwork, not a gift.", cooldown: 0 },
  { id: "street::brace", name: "Brace", blurb: "Take the ugly one on purpose.", power: 3, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0 },
  { id: "street::shove", name: "Shove", blurb: "Space, rudely made.", power: 3, style: "strike", kind: "status", energy: 1, effect: "Their next swing arrives slowed.", cooldown: 1 },
  { id: "street::feint", name: "Feint", blurb: "Look left. Be right.", power: 3, style: "trick", kind: "burst", energy: 1, effect: "Cheap, and it works once.", cooldown: 1 },
  { id: "street::cover", name: "Cover Up", blurb: "Elbows in, chin down.", power: 2, style: "guard", kind: "guard", energy: 0, effect: "Free to use. Buys a breath.", cooldown: 1 },
];

export const MOVESET_SIZE = 6;

export function allMoveDefs(): MoveDef[] {
  const out: MoveDef[] = [];
  for (const power of allPowers()) out.push(...movesForPower(power));
  return out;
}

export function moveById(id: string): MoveDef | null {
  for (const list of HAND.values()) {
    const found = list.find((entry) => entry.id === id);
    if (found) return found;
  }
  const mark = id.lastIndexOf("::");
  if (mark < 0) return null;
  const power = getPower(id.slice(0, mark));
  if (!power) return null;
  return movesForPower(power).find((entry) => entry.id === id) ?? null;
}

const MOVE_STEPS = [0, 18, 48, 100, 180] as const;

export function moveLevel(exp: number): number {
  let level = 1;
  for (let i = 0; i < MOVE_STEPS.length; i++) {
    if (exp >= (MOVE_STEPS[i] ?? 0)) level = i + 1;
  }
  return level;
}

export function scaledPower(def: MoveDef, level: number): number {
  const gen = getPower(def.powerId)?.generation ?? 0;
  const rank = Math.max(1, Math.min(5, level));
  const tier = gen === 0 ? 0 : gen === 1 ? 2 : 4;
  const step = gen === 0 ? 1 : gen === 1 ? 1 : 2;
  return def.power + tier + (rank - 1) * step;
}

export function grantMoveExp(game: Pick<Game, "moveExp" | "unlockedPowers" | "mastery">, ids: readonly string[], amount: number): string[] {
  if (!game.moveExp || typeof game.moveExp !== "object") game.moveExp = {};
  const notes: string[] = [];
  for (const id of [...new Set(ids)]) {
    const def = moveById(id);
    if (!def || !moveUnlocked(game, def)) continue;
    const before = moveLevel(game.moveExp[id] ?? 0);
    if (before >= 5) continue;
    game.moveExp[id] = (game.moveExp[id] ?? 0) + Math.max(1, amount);
    const after = moveLevel(game.moveExp[id] ?? 0);
    if (after > before) notes.push(`${def.name} is move rank ${after}`);
  }
  return notes;
}

export function moveUnlocked(game: Pick<Game, "unlockedPowers" | "mastery">, def: MoveDef): boolean {
  if (!(game.unlockedPowers ?? []).includes(def.powerId)) return false;
  const power = getPower(def.powerId);
  const level = masteryLevel(game.mastery?.[def.powerId] ?? 0, power?.generation ?? 0);
  return level >= def.minMastery;
}

export function knownMoves(game: Pick<Game, "unlockedPowers" | "mastery">): { def: MoveDef; unlocked: boolean }[] {
  const out: { def: MoveDef; unlocked: boolean }[] = [];
  for (const id of game.unlockedPowers ?? []) {
    const power = getPower(id);
    if (!power) continue;
    for (const def of movesForPower(power)) out.push({ def, unlocked: moveUnlocked(game, def) });
  }
  return out;
}

export function toDuel(def: MoveDef, level = 1): DuelMove {
  const rank = Math.max(1, Math.min(5, level));
  return {
    id: def.id,
    name: def.name,
    blurb: def.blurb,
    power: scaledPower(def, rank),
    style: def.style,
    kind: def.kind,
    energy: def.energy,
    effect: `${def.effect} · move ${rank}`,
    cooldown: def.cooldown,
  };
}

export function equippedMoves(game: Pick<Game, "loadout" | "unlockedPowers" | "mastery" | "moveExp">): DuelMove[] {
  const picked = (game.loadout ?? []).map((id) => moveById(id)).filter((def): def is MoveDef => !!def && moveUnlocked(game, def));
  return picked.slice(0, 6).map((def) => toDuel(def, moveLevel(game.moveExp?.[def.id] ?? 0)));
}

/** The six a fight actually uses: the equipped moves, padded with street moves so it is always exactly six. */
export function battleMoves(game: Pick<Game, "loadout" | "unlockedPowers" | "mastery" | "moveExp">): DuelMove[] {
  const picked = equippedMoves(game).slice(0, MOVESET_SIZE);
  for (const move of STREET_MOVES) {
    if (picked.length >= MOVESET_SIZE) break;
    picked.push({ ...move });
  }
  return picked;
}

export function fillLoadout(game: Game): void {
  if (!Array.isArray(game.loadout)) game.loadout = [];
  const have = new Set(game.loadout);
  for (const entry of knownMoves(game)) {
    if (game.loadout.length >= MOVESET_SIZE) break;
    if (!entry.unlocked || have.has(entry.def.id)) continue;
    game.loadout.push(entry.def.id);
    have.add(entry.def.id);
  }
  game.loadout = game.loadout.filter((id, index, list) => {
    if (list.indexOf(id) !== index) return false;
    const def = moveById(id);
    return !!def && moveUnlocked(game, def);
  }).slice(0, MOVESET_SIZE);
}

export function toggleLoadout(game: Game, moveId: string): string {
  const def = moveById(moveId);
  if (!def) return "That move isn't in the book.";
  if (!moveUnlocked(game, def)) {
    const power = getPower(def.powerId);
    return `${def.name} wants ${power?.name ?? "that power"} at mastery ${def.minMastery}.`;
  }
  if (!Array.isArray(game.loadout)) game.loadout = [];
  if (game.loadout.includes(moveId)) {
    game.loadout = game.loadout.filter((id) => id !== moveId);
    return `${def.name} leaves the six.`;
  }
  if (game.loadout.length >= MOVESET_SIZE) return "Six moves already. Drop one first.";
  game.loadout = [...game.loadout, moveId];
  return `${def.name} takes a slot.`;
}
