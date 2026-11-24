/**
 * Year pacing (2026-11-16, "let me do every option up to 3 times a year, like BitLife").
 *
 * Before: three blocks of free time a month, and Life Flow stepped a year (or a season) per Play tap, so a
 * grown-up only ever got three choices a year. Now the year is yours: every option in the game (each power's
 * drill, each person, each business, the gym, a shift, a patrol...) can be done up to three times per in-game
 * year, as many different options as you like, and "Age up" moves to the next birthday when you're ready.
 *
 * Balance: the economy underneath is unchanged. A year still holds 36 blocks of free time (3 a month). What you
 * spend yourself comes out of the months still to come this year (yearDebt), and your routine fills whatever
 * is left as the year plays out. So a year can never hold more time than it did, only more of it is yours.
 * Things that cost no time (rest, flirting, a gift) count against their own 3-a-year cap.
 */
import type { Game } from "./types";

/** Flip off to get the old monthly move budget back (tests and emergencies). Default: on. */
export const PACING = { year: true };
export const USES_PER_YEAR = 3;
export const BLOCKS_PER_MONTH = 3;

/** Once-a-month gates (cleared every month). Under year pacing the 3-a-year cap stands in for them on your own taps. */
export function isMonthGate(key: string): boolean {
  return (
    key === "rested" || key === "omened" || key === "mentored" || key === "tutored" || key === "powerLesson" || key === "shifted" || key === "patrolled" || key === "hobby" || key === "crewjob" || key === "crewpay" || key === "crewcool" || key === "moved" || key === "walked" || key.startsWith("time:") || key.startsWith("flirt:") || key.startsWith("gift:") || key.startsWith("talks:")
  );
}

/**
 * Ids that are settings, answers or story steps, not options: never counted, never capped. A case's next step
 * still costs free time, but a story isn't something you "do 3 times a year".
 */
const FREE_PREFIX = ["equip|", "slot|", "buy-fit|", "wear-fit|", "clear-fit|", "suit-line|", "focus|", "set-save|", "set-load|", "tie|", "routine|", "pace|", "mask|", "canon|", "guess|", "arc-start|"];
const FREE_IDS = new Set(["arc-step", "arc-drop"]);

/**
 * The option an action id counts against. Each power, person and business is its own option; amounts and
 * sizes at the end of an id are not ("econ|biz|staff|b3|2" counts as "econ|biz|staff|b3").
 * Drilling counts per power: "train" is keyed by the power you're focused on.
 */
export function optionKey(g: Pick<Game, "focusPower" | "unlockedPowers">, id: string): string | null {
  if (!id || FREE_IDS.has(id) || FREE_PREFIX.some((p) => id.startsWith(p))) return null;
  if (id === "train") return `train|${g.focusPower ?? g.unlockedPowers?.[0] ?? ""}`;
  const parts = id.split("|");
  // A flirt is one option per person, whatever line you open with.
  if (parts[0] === "love" && parts[1] === "flirt") return parts.slice(0, 3).join("|");
  while (parts.length > 1 && /^-?\d+(\.\d+)?$/.test(parts[parts.length - 1]!)) parts.pop();
  return parts.join("|");
}

/**
 * Power lessons (a braid session, a mentor's lesson, a hero waking a power) share one pool of 3 a year, so rare
 * powers stay rare: it used to be one lesson a month, and Life Flow's yearly step left most players one a year.
 */
export const LESSON_KEY = "lesson";
export function lessonsLeft(g: Pick<Game, "yearUses">): number {
  if (!PACING.year) return 1;
  return Math.max(0, USES_PER_YEAR - (g.yearUses?.[LESSON_KEY] ?? 0));
}
/** What the power screens say when no lesson is left. */
export function lessonLine(g: Pick<Game, "yearUses" | "flags">, monthly: string): string | null {
  if (PACING.year) return lessonsLeft(g) <= 0 ? `${USES_PER_YEAR} power lessons this year already. Age up for more.` : null;
  return g.flags.powerLesson ? monthly : null;
}

export function usesOf(g: Pick<Game, "yearUses" | "focusPower" | "unlockedPowers">, id: string): number {
  const key = optionKey(g, id);
  return key ? (g.yearUses?.[key] ?? 0) : 0;
}

/** Blocks of free time left in this year (this month's plus every later month's, less what you've borrowed). */
export function blocksLeft(g: Pick<Game, "majorsLeft" | "month" | "yearDebt">): number {
  if (!PACING.year) return Math.max(0, g.majorsLeft);
  return Math.max(0, g.majorsLeft + BLOCKS_PER_MONTH * (11 - (g.month ?? 0)) - (g.yearDebt ?? 0));
}

/** Can you spend a block of free time right now? (What the money screens and power lab check.) */
export function hasTime(g: Pick<Game, "majorsLeft" | "month" | "yearDebt">): boolean {
  return blocksLeft(g) > 0;
}

/** Old saves: nothing used yet this year, nothing borrowed. */
export function migratePacing(g: Game): Game {
  if (!g.yearUses || typeof g.yearUses !== "object") g.yearUses = {};
  if (typeof g.yearDebt !== "number" || !Number.isFinite(g.yearDebt) || g.yearDebt < 0) g.yearDebt = 0;
  return g;
}
