import { getPower, allPowers } from "./combo";
import { masteryLevel } from "./mastery";
import { MOVE_BOOK, type MoveDef } from "./moves.catalog";
import { AUTHORED, type AuthoredMove } from "./moves.authored";
import { elementOfPower } from "./elements";
import type { CatalogPower } from "./combo";
import type { DuelMove, Game, MoveStyle } from "./types";
import { markUltimate } from "./battle";
import { isKitPower, KIT_EDGE, kitById, kitFor, kitMoveById, kitMoveUnlocked, kitRank, type KitMove } from "./kits";

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

function dress(def: MoveDef, words: AuthoredMove | undefined): MoveDef {
  if (!words) return def;
  return {
    ...def,
    name: words.name,
    blurb: words.blurb || def.blurb,
    effect: words.effect || def.effect,
    style: words.style ?? def.style,
    kind: words.kind ?? def.kind,
    element: words.element ?? def.element,
  };
}

export function movesForPower(power: CatalogPower): MoveDef[] {
  return rawMovesForPower(power).map((def) => (def.element ? def : { ...def, element: elementOfPower(def.powerId) }));
}

function rawMovesForPower(power: CatalogPower): MoveDef[] {
  const hand = HAND.get(power.id);
  const words = AUTHORED[power.id];
  const plain = generatedMoves(power);
  const generated = [dress(plain[0]!, words?.a), dress(plain[1]!, words?.b)];
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
  { id: "street::haymaker", name: "Haymaker", blurb: "Ugly and sincere.", power: 4, style: "strike", kind: "burst", energy: 1, effect: "No power in it. Still counts.", cooldown: 0, element: "force" },
  { id: "street::slip", name: "Slip", blurb: "Don't be where the hit lands.", power: 3, style: "trick", kind: "dash", energy: 1, effect: "Footwork, not a gift.", cooldown: 0, element: "speed" },
  { id: "street::brace", name: "Brace", blurb: "Take the ugly one on purpose.", power: 3, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "shield" },
  { id: "street::shove", name: "Shove", blurb: "Space, rudely made.", power: 3, style: "strike", kind: "status", energy: 1, effect: "Their next swing arrives slowed.", cooldown: 1, element: "force" },
  { id: "street::feint", name: "Feint", blurb: "Look left. Be right.", power: 3, style: "trick", kind: "burst", energy: 1, effect: "Cheap, and it works once.", cooldown: 1, element: "shadow" },
  { id: "street::cover", name: "Cover Up", blurb: "Elbows in, chin down.", power: 2, style: "guard", kind: "guard", energy: 0, effect: "Free to use. Buys a breath.", cooldown: 1, element: "shield" },
];

export const MOVESET_SIZE = 6;

/** The three duel styles every six should try to cover. */
export const MOVE_STYLES = ["strike", "guard", "trick"] as const;

export function styleCounts(styles: Iterable<MoveStyle | undefined | null>): Record<MoveStyle, number> {
  const counts: Record<MoveStyle, number> = { strike: 0, guard: 0, trick: 0 };
  for (const style of styles) if (style === "strike" || style === "guard" || style === "trick") counts[style]++;
  return counts;
}

/** Styles with zero count, in strike → guard → trick order. */
export function missingStyles(counts: Record<MoveStyle, number>): MoveStyle[] {
  return MOVE_STYLES.filter((style) => (counts[style] ?? 0) <= 0);
}

/**
 * Clear shelf warnings when the equipped six cannot answer a tell.
 * Street padding may still cover the gap in a fight; this is about what you packed.
 */
export function loadoutWarnings(game: Pick<Game, "loadout">): string[] {
  const equipped = (game.loadout ?? []).map((id) => moveById(id)?.style).filter(Boolean) as MoveStyle[];
  if (!equipped.length) return [];
  const missing = missingStyles(styleCounts(equipped));
  const out: string[] = [];
  if (missing.includes("guard")) out.push("No guard move: strike tells have no answer.");
  if (missing.includes("strike")) out.push("No strike move: trick tells have no answer.");
  if (missing.includes("trick")) out.push("No trick move: guard tells have no answer.");
  return out;
}


export function allMoveDefs(): MoveDef[] {
  const out: MoveDef[] = [];
  for (const power of allPowers()) out.push(...movesForPower(power));
  return out;
}

export function moveById(id: string): MoveDef | null {
  const kit = kitMoveById(id);
  if (kit) return kit;
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

type UnlockGame = Pick<Game, "unlockedPowers" | "mastery"> & { preset?: string | null; age?: number };

export function grantMoveExp(game: Pick<Game, "moveExp" | "unlockedPowers" | "mastery"> & { preset?: string | null; age?: number }, ids: readonly string[], amount: number): string[] {
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

export function moveUnlocked(game: UnlockGame, def: MoveDef): boolean {
  if (isKitPower(def.powerId)) return kitMoveUnlocked(game, def as KitMove);
  if (!(game.unlockedPowers ?? []).includes(def.powerId)) return false;
  const power = getPower(def.powerId);
  const level = masteryLevel(game.mastery?.[def.powerId] ?? 0, power?.generation ?? 0);
  return level >= def.minMastery;
}

export function knownMoves(game: UnlockGame): { def: MoveDef; unlocked: boolean }[] {
  const out: { def: MoveDef; unlocked: boolean }[] = [];
  for (const id of game.unlockedPowers ?? []) {
    const power = getPower(id);
    if (!power) continue;
    for (const def of movesForPower(power)) out.push({ def, unlocked: moveUnlocked(game, def) });
  }
  // A legend kit (Batman's belt) sits on the shelf beside any powers, locked moves showing their age.
  for (const def of kitFor(game.preset)?.moves ?? []) out.push({ def, unlocked: moveUnlocked(game, def) });
  return out;
}

export function toDuel(def: MoveDef, level = 1): DuelMove {
  const rank = Math.max(1, Math.min(5, level));
  // Stage 3: signature / high-mastery moves cost real Energy so the bar is a choice.
  const energy = def.minMastery >= 4 ? Math.max(def.energy, 3) : def.minMastery >= 3 ? Math.max(def.energy, 2) : def.energy;
  return {
    id: def.id,
    name: def.name,
    blurb: def.blurb,
    power: scaledPower(def, rank),
    style: def.style,
    kind: def.kind,
    energy,
    effect: def.effect,
    cooldown: def.cooldown,
    element: def.element ?? elementOfPower(def.powerId),
    rank,
    ...((def as KitMove).applies !== undefined ? { applies: (def as KitMove).applies } : {}),
  };
}

type FightGame = Pick<Game, "loadout" | "unlockedPowers" | "mastery" | "moveExp"> & { focusPower?: string | null; stats?: { powerLevel: number }; preset?: string | null; age?: number };

/**
 * How much your training adds to a move in a real fight: power level (the slow lifetime grind, soft-capped
 * by age) plus that power's mastery rank. Street moves get half the power-level part and no mastery.
 * Without this, a 50-year-old hero swung the same 4–6 point moves as a 12-year-old against foes that scale.
 */
export function moveEdge(game: { stats?: { powerLevel: number }; mastery?: Record<string, number>; age?: number }, powerId?: string): number {
  const pl = Math.max(0, game.stats?.powerLevel ?? 0);
  if (!powerId) return Math.round(pl * 0.35);
  // Kit gear trains like a power (full power-level share) and wears in by decade instead of mastery.
  if (isKitPower(powerId)) return Math.round(pl * KIT_EDGE) + kitRank(game.age ?? 0) - 1;
  const power = getPower(powerId);
  const rank = masteryLevel(game.mastery?.[powerId] ?? 0, power?.generation ?? 0);
  return Math.round(pl * 0.55) + Math.max(0, rank - 1);
}

export function equippedMoves(game: FightGame): DuelMove[] {
  const picked = (game.loadout ?? []).map((id) => moveById(id)).filter((def): def is MoveDef => !!def && moveUnlocked(game, def));
  return picked.slice(0, 6).map((def) => {
    const move = toDuel(def, moveLevel(game.moveExp?.[def.id] ?? 0));
    const edge = game.stats ? moveEdge(game, def.powerId) : 0;
    return edge ? { ...move, power: move.power + edge } : move;
  });
}

/** The six a fight actually uses: the equipped moves, padded with street moves so it is always exactly six. */
export function battleMoves(game: FightGame): DuelMove[] {
  const picked = equippedMoves(game).slice(0, MOVESET_SIZE);
  const edge = game.stats ? moveEdge(game) : 0;
  // Street padding answers whatever style the kit is missing first, so every tell has a reply.
  const spare = [...STREET_MOVES];
  while (picked.length < MOVESET_SIZE && spare.length) {
    const gap = missingStyles(styleCounts(picked.map((move) => move.style)));
    const index = gap.length ? Math.max(0, spare.findIndex((move) => move.style === gap[0])) : 0;
    const move = spare.splice(index >= 0 ? index : 0, 1)[0]!;
    picked.push({ ...move, power: move.power + edge });
  }
  // Full six with a hole (five strikes + a trick, no guard): swap the weakest surplus for a street cover.
  for (;;) {
    const counts = styleCounts(picked.map((move) => move.style));
    const gap = missingStyles(counts)[0];
    if (!gap) break;
    const surplus = MOVE_STYLES.find((style) => (counts[style] ?? 0) >= 2);
    if (!surplus) break;
    const victim = picked
      .map((move, index) => ({ move, index }))
      .filter((row) => row.move.style === surplus && !(row.move.id ?? "").startsWith("street::"))
      .sort((a, b) => a.move.power - b.move.power)[0];
    const cover = spare.find((move) => move.style === gap) ?? STREET_MOVES.find((move) => move.style === gap);
    if (!victim || !cover) break;
    const at = spare.indexOf(cover);
    if (at >= 0) spare.splice(at, 1);
    picked[victim.index] = { ...cover, power: cover.power + edge };
  }
  const focus = game.focusPower && (game.unlockedPowers ?? []).includes(game.focusPower) ? game.focusPower : (game.unlockedPowers ?? [])[0];
  const power = focus ? getPower(focus) : null;
  const rank = focus && power ? masteryLevel(game.mastery?.[focus] ?? 0, power.generation) : 0;
  const focusMoveIds = power ? movesForPower(power).map((def) => def.id) : [];
  if (!focus) {
    // No power to focus: a legend kit arms its own Ultimate once the hero is old enough.
    const kit = kitFor(game.preset);
    if (kit) return markUltimate(picked, { focusPowerId: kit.id, masteryRank: (game.age ?? 0) >= kit.ultimateAge ? 4 : 0, focusMoveIds: kit.moves.map((def) => def.id) });
  }
  return markUltimate(picked, { focusPowerId: focus, masteryRank: rank, focusMoveIds });
}

export function fillLoadout(game: Game): void {
  if (!Array.isArray(game.loadout)) game.loadout = [];
  // Drop stale, duplicate or no-longer-unlocked ids first, then top up, so a pruned slot is refilled
  // the same tick instead of leaving the six at five.
  game.loadout = game.loadout
    .filter((id, index, list) => {
      if (list.indexOf(id) !== index) return false;
      const def = moveById(id);
      return !!def && moveUnlocked(game, def);
    })
    .slice(0, MOVESET_SIZE);
  const have = new Set(game.loadout);
  // Auto top-up covers the three styles first (strike, guard, trick), so every tell has an answer.
  // A slot the player filled by hand is never touched.
  const pool = knownMoves(game).filter((entry) => entry.unlocked && !have.has(entry.def.id)).map((entry) => entry.def);
  while (game.loadout.length < MOVESET_SIZE && pool.length) {
    const gap = missingStyles(styleCounts(game.loadout.map((id) => moveById(id)?.style)));
    let pick = gap.length ? pool.findIndex((def) => def.style === gap[0]) : -1;
    if (pick < 0) pick = 0;
    const def = pool.splice(pick, 1)[0]!;
    game.loadout.push(def.id);
    have.add(def.id);
  }
  // Once the six is full, if a style is still missing and the bench has one, swap out a surplus style.
  // Keeps authored defaults (and late unlocks) from locking a hero into five strikes.
  for (;;) {
    const counts = styleCounts(game.loadout.map((id) => moveById(id)?.style));
    const gap = missingStyles(counts)[0];
    if (!gap) break;
    const cover = pool.find((def) => def.style === gap);
    if (!cover) break;
    const surplus = MOVE_STYLES.find((style) => (counts[style] ?? 0) >= 2);
    if (!surplus) break;
    const victimAt = game.loadout.findIndex((id) => moveById(id)?.style === surplus);
    if (victimAt < 0) break;
    game.loadout[victimAt] = cover.id;
    pool.splice(pool.indexOf(cover), 1);
  }
}

/** Unlocked moves that are not in the six, in book order: what a dropped slot can be refilled from. */
function benchMoves(game: Game, skip: readonly string[]): MoveDef[] {
  const have = new Set([...(game.loadout ?? []), ...skip]);
  return knownMoves(game).filter((entry) => entry.unlocked && !have.has(entry.def.id)).map((entry) => entry.def);
}

/**
 * Tap-to-toggle, kept for old buttons and saved routes. The six stays exactly six whenever you know six:
 * dropping a move swaps the next bench move into the same slot (never the one you just dropped), and when
 * every move you know is already in, a drop is refused instead of leaving a hole that the next tap refills.
 */
export function toggleLoadout(game: Game, moveId: string): string {
  const def = moveById(moveId);
  if (!def) return "That move isn't in the book.";
  if (!moveUnlocked(game, def)) return lockedLine(def);
  if (!Array.isArray(game.loadout)) game.loadout = [];
  const at = game.loadout.indexOf(moveId);
  if (at >= 0) {
    const next = benchMoves(game, [moveId])[0];
    if (!next) return `Every move you know is already in the six. Unlock another to swap ${def.name} out.`;
    game.loadout = game.loadout.map((id, index) => (index === at ? next.id : id));
    return `${def.name} leaves the six. ${next.name} takes slot ${at + 1}.`;
  }
  if (game.loadout.length >= MOVESET_SIZE) return "Six moves already. Pick a slot to swap it into.";
  game.loadout = [...game.loadout, moveId];
  return `${def.name} takes slot ${game.loadout.length}.`;
}

export interface SlotResult {
  ok: boolean;
  line: string;
}

/**
 * Put a move into one slot in a single step, so a swap can never be half-done.
 * - A bench move replaces whatever is in that slot (or fills the next open slot).
 * - A move already in the six trades places with the slot's move, so you can reorder.
 * The six never shrinks: a slot is only ever replaced, never emptied.
 */
export function placeInSlot(game: Game, slot: number, moveId: string): SlotResult {
  const def = moveById(moveId);
  if (!def) return { ok: false, line: "That move isn't in the book." };
  if (!moveUnlocked(game, def)) return { ok: false, line: lockedLine(def) };
  if (!Number.isInteger(slot) || slot < 0 || slot >= MOVESET_SIZE) return { ok: false, line: "There are only six slots." };
  if (!Array.isArray(game.loadout)) game.loadout = [];
  const loadout = [...game.loadout];
  const from = loadout.indexOf(moveId);
  // Slots past the filled ones collapse onto the next open slot so there are never gaps.
  const target = Math.min(slot, from >= 0 ? loadout.length - 1 : loadout.length);
  if (from === target) return { ok: true, line: `${def.name} is already in slot ${target + 1}.` };
  if (from >= 0) {
    const other = loadout[target]!;
    loadout[target] = moveId;
    loadout[from] = other;
    game.loadout = loadout;
    const otherName = moveById(other)?.name ?? "That move";
    return { ok: true, line: `${def.name} moves to slot ${target + 1}. ${otherName} takes slot ${from + 1}.` };
  }
  const out = loadout[target];
  loadout[target] = moveId;
  game.loadout = loadout.slice(0, MOVESET_SIZE);
  const outName = out ? moveById(out)?.name : null;
  return { ok: true, line: outName ? `${def.name} in, ${outName} out. Slot ${target + 1}.` : `${def.name} takes slot ${target + 1}.` };
}

/** Where a move comes from, for shelf labels: the power's name, or the legend kit's (Utility Belt). */
export function moveSource(def: MoveDef): string {
  if (isKitPower(def.powerId)) return kitById(def.powerId)?.name ?? "Gear";
  return getPower(def.powerId)?.name ?? "";
}

/** Why a move can't go in the six yet. */
export function lockedLine(def: MoveDef): string {
  if (isKitPower(def.powerId)) return `${def.name} joins the ${moveSource(def)} at ${(def as KitMove).minAge}.`;
  return `${def.name} wants ${getPower(def.powerId)?.name ?? "that power"} at mastery ${def.minMastery}.`;
}
