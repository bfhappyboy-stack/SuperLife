// The braid book's room: how many powers a life can hold, and how fast it can add them.
// Without this, a player who chases every mentor and mix ends up owning ~130 powers by 80.
//
// 2026-11-10 eve (owner's call): "Super powers are the most rare and powerful thing in this world and should be
// trained and nurtured." A typical life holds one power for years. A new one is a milestone: a base awakens only
// after long training with someone you're close to (or a rare story moment), years apart and only once the power
// you hold is well drilled; a braid is a months-long project with both halves drilled. Growth is mostly depth:
// mastery ranks and the moves they unlock.
import type { Game } from "./types";
import { presetById, wakeAge } from "./presets";
import { getPower } from "./combo";
import { masteryLevel, powerRank } from "./mastery";

/** Hard ceiling for a whole life. */
export const LIBRARY_MAX = 10;

/**
 * Pages the book can hold at this age: 1 before 15, then 3, plus one every 4 years (5 at 23, 7 at 31). A safety
 * ceiling: the awakening and braid rules below are what keep powers rare.
 */
export function libraryCap(age: number): number {
  if (age < 15) return 1;
  return Math.min(LIBRARY_MAX, 3 + Math.floor((age - 15) / 4));
}

/** New pages per year of age: one, at most. */
export function yearlyRoom(_owned: number): number {
  return 1;
}

/** Most pages a legend's book can ever hold: canon kit plus a few stretches. */
export const LEGEND_MAX = 10;

// --- Rarity rules (2026-11-10 eve) -------------------------------------------------------------------------

/** Years between two new powers of any kind (a braid too). */
export const PAGE_GAP = 2;
/** Years between two awakenings (new base powers). */
export const AWAKEN_GAP = 5;
/** Base powers an ordinary life can ever hold. */
export const BASE_MAX = 4;
/** Lessons to awaken a base power (one power lesson a month at most). */
export const AWAKEN_LESSONS = 8;
/** Lessons to braid: Gen 1 and Gen 2. */
export const BRAID_LESSONS: Record<1 | 2, number> = { 1: 6, 2: 10 };
/** A braid you work on alone moves at half a mentor's pace. */
export const SOLO_RATE = 0.5;
/** Bond needed before a mentor will try to wake a new power in you, and before a hero will. */
export const MENTOR_AWAKEN_BOND = 35;
export const HERO_AWAKEN_BOND = 50;
/** Owned powers mastered to at least this rank before a braid: both halves at C. */
export const BRAID_RANK = 2;

/** Rank your best power needs before the next awakening: C for the second base, B for the third, A for the fourth. */
export function awakenRank(basesOwned: number): number {
  return Math.min(5, 1 + Math.max(1, basesOwned));
}

type RarityGame = Pick<Game, "age" | "flags" | "unlockedPowers" | "mastery"> & { preset?: string | null };

const bases = (g: RarityGame) => (g.unlockedPowers ?? []).filter((id) => getPower(id)?.generation === 0);

/** Highest mastery rank among the powers you hold. */
export function bestRank(g: RarityGame): number {
  let best = 0;
  for (const id of g.unlockedPowers ?? []) {
    const p = getPower(id);
    if (p) best = Math.max(best, masteryLevel(g.mastery?.[id] ?? 0, p.generation));
  }
  return best;
}

function sinceLast(g: RarityGame, key: "lastPageAge" | "lastAwakenAge"): number {
  const at = g.flags?.[key];
  return at === undefined ? 99 : g.age - at;
}

/** Why a new base power can't awaken now (null = it can). Pass the power to check the book too. */
export function awakenBlock(g: RarityGame, powerId?: string | null): string | null {
  if (!(g.unlockedPowers ?? []).length) return g.age < 10 ? "Not yet." : powerId ? pageBlock(g, powerId) : library(g).block;
  if (g.age < 15) return "New powers don't wake before 15. Grow the one you have.";
  const legend = !!presetById(g.preset);
  if (!legend && bases(g).length >= BASE_MAX) return `${BASE_MAX} base powers is a legend's share already. Deepen them.`;
  const gap = AWAKEN_GAP - sinceLast(g, "lastAwakenAge");
  if (gap > 0) return `Your last power is still settling in. ${gap} more year${gap === 1 ? "" : "s"} before another can wake.`;
  const need = awakenRank(bases(g).length);
  if (bestRank(g) < need) return `Drill a power you hold to rank ${powerRank(need)} first. New powers only answer someone who's mastered one.`;
  return powerId ? pageBlock(g, powerId) : bookBlock(g);
}

/** Why this braid can't be worked on now (null = it can). */
export function braidBlock(g: RarityGame, left: string, right: string, resultId: string): string | null {
  if (g.age < 15) return "Mixing unlocks at 15.";
  for (const id of [left, right]) {
    const p = getPower(id);
    if (!p) return "Not a power you hold.";
    if (masteryLevel(g.mastery?.[id] ?? 0, p.generation) < BRAID_RANK) return `Drill ${p.name} to rank ${powerRank(BRAID_RANK)} first. A braid needs both halves steady.`;
  }
  return pageBlock(g, resultId);
}

/** The book's room plus the years between new powers. */
function bookBlock(g: RarityGame): string | null {
  const gap = PAGE_GAP - sinceLast(g, "lastPageAge");
  if (gap > 0) return `You gained a power ${PAGE_GAP - gap === 0 ? "this year" : "last year"}. The body needs ${gap} more year${gap === 1 ? "" : "s"} before the next.`;
  return library(g).block;
}

/**
 * Why a new page can't land (null = it can): every non-story source of a power passes this. A base also needs an
 * awakening (gap, mastery, base count); a braid needs the years between pages and room in the book.
 */
export function pageBlock(g: RarityGame, powerId: string): string | null {
  const p = getPower(powerId);
  if (!p) return "Not a power.";
  // A life with no power at all can still be found by its first one, rarely (the old human route).
  if (p.generation === 0 && !(g.unlockedPowers ?? []).length) return g.age < 10 ? "Not yet." : library(g).block;
  if (p.generation === 0) {
    if (g.age < 15) return "New powers don't wake before 15. Grow the one you have.";
    const legend = !!presetById(g.preset);
    if (!legend && bases(g).length >= BASE_MAX) return `${BASE_MAX} base powers is a legend's share already. Deepen them.`;
    const gap = AWAKEN_GAP - sinceLast(g, "lastAwakenAge");
    if (gap > 0) return `Your last power is still settling in. ${gap} more year${gap === 1 ? "" : "s"} before another can wake.`;
    const need = awakenRank(bases(g).length);
    if (bestRank(g) < need) return `Drill a power you hold to rank ${powerRank(need)} first. New powers only answer someone who's mastered one.`;
  }
  return bookBlock(g);
}

/** Record when a power landed: the clock for the gaps above. */
export function notePower(g: Pick<Game, "age" | "flags">, generation: number): void {
  g.flags.lastPageAge = g.age;
  if (generation === 0) g.flags.lastAwakenAge = g.age;
}

/**
 * A God Mode legend lives one hero's life, not a sampler: the book holds the canon kit plus 2 pages,
 * then one more every 6 years after the wake, up to LEGEND_MAX. Without this a Wolverine ended life
 * with Flight, Sorcery and 20 other powers that have nothing to do with the claws.
 */
export function legendCap(presetId: string | null | undefined, age: number): number | null {
  const legend = presetById(presetId);
  if (!legend || !legend.powers.length) return null;
  const wake = wakeAge(legend.id) ?? 0;
  const since = Math.max(0, age - wake);
  return Math.min(LEGEND_MAX, legend.powers.length + 1 + Math.floor(since / 10));
}

export interface LibraryState {
  owned: number;
  cap: number;
  /** New powers already added this year of age. */
  thisYear: number;
  yearRoom: number;
  /** Why a new page can't be added right now, or null if it can. */
  block: string | null;
}

export function library(g: Pick<Game, "age" | "flags" | "unlockedPowers"> & { preset?: string | null }): LibraryState {
  const owned = (g.unlockedPowers ?? []).length;
  const legend = legendCap(g.preset, g.age);
  const cap = legend ?? libraryCap(g.age) + Math.max(0, (g.flags?.startPages ?? 1) - 1);
  const thisYear = g.flags.libraryAge === g.age ? (g.flags.libraryYear ?? 0) : 0;
  const yearRoom = yearlyRoom(owned);
  let block: string | null = null;
  if (owned >= LIBRARY_MAX)
    block = `Your book is full (${LIBRARY_MAX} pages). Master what you hold.`;
  else if (owned >= cap && legend != null)
    block = `This Earth's legend holds ${cap} powers at ${g.age}: the canon kit and a stretch. One more every 10 years.`;
  else if (owned >= cap)
    block = g.age < 15 ? "One power is all a child can carry. More can only wake from 15." : `Your book holds ${cap} powers at ${g.age}. Room for one more every 4 years.`;
  else if (thisYear >= yearRoom)
    block = "A new power already woke this year. The body needs a birthday to catch up.";
  return { owned, cap, thisYear, yearRoom, block };
}

/** Record one new page for this year of age. */
export function notePage(g: Pick<Game, "age" | "flags">): void {
  if (g.flags.libraryAge !== g.age) {
    g.flags.libraryAge = g.age;
    g.flags.libraryYear = 0;
  }
  g.flags.libraryYear = (g.flags.libraryYear ?? 0) + 1;
}
