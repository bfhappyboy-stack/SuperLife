// The braid book's room: how many powers a life can hold, and how fast it can add them.
// Without this, a player who chases every mentor and mix ends up owning ~130 powers by 80.
import type { Game } from "./types";
import { presetById, wakeAge } from "./presets";

/** Hard ceiling for a whole life. */
export const LIBRARY_MAX = 30;

/** Pages the book can hold at this age: 6 at 8, 9 at 20, 14 at 40, 19 at 60, 24 at 80. */
export function libraryCap(age: number): number {
  return Math.min(LIBRARY_MAX, 4 + Math.floor(Math.max(0, age) / 4));
}

/** New pages per year of age, with diminishing returns as the book fills: 3, then 2, then 1. */
export function yearlyRoom(owned: number): number {
  if (owned < 8) return 3;
  if (owned < 16) return 2;
  return 1;
}

/** Most pages a legend's book can ever hold: canon kit plus a handful of stretches. */
export const LEGEND_MAX = 12;

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
  return Math.min(LEGEND_MAX, legend.powers.length + 2 + Math.floor(since / 6));
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
  const cap = legend ?? libraryCap(g.age);
  const thisYear = g.flags.libraryAge === g.age ? (g.flags.libraryYear ?? 0) : 0;
  const yearRoom = yearlyRoom(owned);
  let block: string | null = null;
  if (owned >= LIBRARY_MAX)
    block = `Your book is full (${LIBRARY_MAX} pages). Master what you hold.`;
  else if (owned >= cap && legend != null)
    block = `This Earth's legend holds ${cap} powers at ${g.age}: the canon kit and a few stretches. One more page every 6 years.`;
  else if (owned >= cap)
    block = `Book full for your age: ${owned}/${cap}. Room for one more page every 4 years.`;
  else if (thisYear >= yearRoom)
    block = `${thisYear} new ${thisYear === 1 ? "power" : "powers"} this year already. The body needs a birthday to catch up.`;
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
