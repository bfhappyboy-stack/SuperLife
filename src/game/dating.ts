/**
 * Dating (Priority 0a, owner's call 2026-11-11): meet someone somewhere real, flirt with choices that can land or
 * backfire, ask them out, then grow it a step at a time: Dating → Together → Living together → Engaged → Married,
 * or break up at any step. A crush's closeness bar is how into you they are.
 * Pure data and helpers; the engine applies them (engine.ts `love|` actions) with its own dice.
 */
import { hash } from "./economy";
import type { Game, LoveStage, Person } from "./types";

/** Ship switch. Off restores the old one-roll "Go on a date". */
export const DATING_ON = true;

export const STAGE_LABEL: Record<LoveStage, string> = {
  dating: "Dating",
  together: "Together",
  living: "Living together",
  engaged: "Engaged",
  married: "Married",
};

/** A partner's stage. Saves from before dating stages read as Married (if wed) or Dating. */
export function stageOf(g: Pick<Game, "flags">, p: Pick<Person, "stage">): LoveStage {
  return p.stage ?? (g.flags.married ? "married" : "dating");
}

export type Spark = "wit" | "bold" | "sweet";

export const FLIRTS: readonly { id: Spark; label: string; uses: string }[] = [
  { id: "wit", label: "Make them laugh", uses: "Smarts" },
  { id: "bold", label: "Be bold", uses: "Looks and nerve" },
  { id: "sweet", label: "Be sweet", uses: "Kindness" },
];

/** What wins this person over. Fixed for life, never shown: the odds on each flirt are the clue. */
export function tasteOf(p: Pick<Person, "id" | "name">): Spark {
  const r = hash("taste", p.id, p.name);
  return r < 1 / 3 ? "wit" : r < 2 / 3 ? "bold" : "sweet";
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Chance a flirt lands: your matching stat, plus a big lift if it's what they like. */
export function flirtChance(g: Pick<Game, "stats">, p: Pick<Person, "id" | "name">, style: Spark): number {
  const s = g.stats;
  const stat = style === "wit" ? s.smarts : style === "bold" ? s.looks * 0.7 + Math.min(100, s.fame) * 0.3 : clamp(s.karma + 50, 0, 100) * 0.6 + s.happiness * 0.4;
  const fit = tasteOf(p) === style ? 0.22 : -0.04;
  return clamp(0.3 + stat / 250 + fit, 0.1, 0.9);
}

export function oddsLabel(chance: number): string {
  return chance >= 0.65 ? "Good odds" : chance >= 0.45 ? "Fair odds" : "Long shot";
}

export interface Place {
  id: "work" | "gym" | "night" | "online";
  label: string;
  detail: string;
  cost: number;
  spark: number;
}

/** Where you can meet someone. Each costs a block of free time. */
export const PLACES: readonly Place[] = [
  { id: "work", label: "Someone at work", detail: "The coworker who laughs at the right moment.", cost: 0, spark: 0.6 },
  { id: "gym", label: "At the gym", detail: "Same time, same rack, every week.", cost: 0, spark: 0.5 },
  { id: "night", label: "A night out", detail: "Music too loud to hear a bad opener.", cost: 60, spark: 0.56 },
  { id: "online", label: "Try a dating app", detail: "Swipe. Regret. Swipe.", cost: 0, spark: 0.44 },
];

export const MET_AT: Record<Place["id"], string> = { work: "Met at work", gym: "Met at the gym", night: "Met on a night out", online: "Met on an app" };

/** Why you can't try this place now, if you can't. */
export function placeBlock(g: Pick<Game, "jobId" | "stats" | "age">, place: Place): string | undefined {
  if (place.id === "work" && !g.jobId) return "You need a job for this one.";
  if (place.id === "gym" && g.stats.health < 40) return "Rest up first.";
  if (place.id === "night" && g.age < 18) return "18+ only.";
  if (place.cost > 0 && g.stats.money < place.cost) return "Too broke.";
  return undefined;
}

export function meetChance(g: Pick<Game, "stats">, place: Place): number {
  return clamp(place.spark + g.stats.looks / 400 + g.stats.happiness / 600, 0.2, 0.9);
}

/** Crushes at a time. */
export const MAX_CRUSHES = 2;
/** How into you a crush must be before you can ask them out. */
export const ASK_AT = 50;
export const ASK_COST = 50;
export function askChance(p: Pick<Person, "closeness">): number {
  return clamp(0.35 + p.closeness / 140, 0.35, 0.92);
}

/** Closeness each step needs. Propose stays at 72 (and a $700 ring). */
export const OFFICIAL_AT = 55;
export const MOVE_IN_AT = 65;
export const PROPOSE_AT = 72;
export const WEDDINGS = { small: { cost: 400, label: "Small wedding", happiness: 8, closeness: 6, fame: 0 }, big: { cost: 6000, label: "Big wedding", happiness: 14, closeness: 10, fame: 2 } } as const;

/** Living with a partner splits the bills: cost of living × this. */
export const SHARED_LIVING = 0.8;
export function livesWithPartner(g: Pick<Game, "flags" | "relationships">): boolean {
  if (!DATING_ON) return false;
  const p = g.relationships.find((r) => r.role === "partner" && r.alive);
  if (!p) return false;
  const st = stageOf(g, p);
  return st === "living" || st === "engaged" || st === "married";
}

/** A divorce takes a quarter of your cash. A breakup before marriage costs nothing but feelings. */
export function splitCost(g: Pick<Game, "stats" | "flags">, p: Pick<Person, "stage">): number {
  return stageOf(g, p) === "married" ? Math.round(Math.max(0, g.stats.money) * 0.25) : 0;
}
