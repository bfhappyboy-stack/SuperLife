/**
 * Which painted card a non-legend character wears (2026-11-11 art pass). Pure data, no React: the cards themselves
 * are drawn by `components/game/heroArt.tsx`. `ART_HEROES` turns the layer off and restores the paper dolls.
 */
import { capeTheme, type CapeFamily } from "./theme";
import type { Sex } from "./types";

export const ART_HEROES = true;
/** Painted cards start at this age; younger lives keep the paper doll. */
export const ART_MIN_AGE = 16;
export const ART_FAMILIES: readonly CapeFamily[] = ["fire", "ice", "storm", "mind", "might", "swift", "veil", "life", "arcane"];

/**
 * Second costume per power family (2026-11-14 night). Every life is born wearing suit line "a" or "b", picked once from
 * the life seed and stored on the save (`Game.suit`; old saves get one from their name and face, see `ensureSuit`).
 * Suit B art is keyed `<key>-b` (`mystery-fire-f-b`, `cut-mystery-fire-f-b`); when a B painting is missing the UI wears
 * suit A, so the line can ship one painting at a time. The male speedster keeps his suit for good. `SUIT_B` off = all A.
 */
export type Suit = "a" | "b";
export const SUIT_B = true;
/** Suits that never change: the swift male hero stays exactly as painted (owner, 2026-11-11). */
export const SUIT_LOCKED: readonly string[] = ["mystery-swift-m"];

/** Suit line for a life seed: a stable 50/50 split that does not touch the game's random stream. */
export function suitForSeed(seed: number): Suit {
  let h = (seed >>> 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) & 1) === 1 ? "b" : "a";
}

/** Old saves have no suit: derive one from things that never change on a life (name and face seed). */
export function ensureSuit(game: { suit?: Suit; name?: string; portrait?: number }): Suit {
  if (game.suit === "a" || game.suit === "b") return game.suit;
  let h = (game.portrait ?? 1) >>> 0;
  for (const ch of game.name ?? "") h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  game.suit = suitForSeed(h);
  return game.suit;
}

/** Keys to try for a Mystery painting, best first: suit B (when this life wears it and the suit isn't locked), then A. */
export function suitKeys(key: string, suit: Suit | null | undefined): string[] {
  if (!key) return [];
  if (!SUIT_B || suit !== "b" || SUIT_LOCKED.includes(key)) return [key];
  return [`${key}-b`, key];
}

/** Art key for a painted Mystery hero, or "" when there is none (no family, too young, art off). Always suit A. */
export function mysteryKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30): string {
  if (!ART_HEROES || !family || age < ART_MIN_AGE) return "";
  return `mystery-${family}-${sex === "female" ? "f" : "m"}`;
}

/**
 * Teens on the stage (2026-11-14 pm): from 13 a Mystery hero with a power family stands in the ring as their painted
 * cutout, a little smaller each year younger than 16 (the paper doll already showed them grown). Cards and posters still
 * start at 16. Under 13 keeps the doll.
 */
export const TEEN_STAGE_AGE = 13;

/** Stage cutout key (without the `cut-` prefix) for your Mystery hero, or "" (no family, under 13, art off). */
export function stageKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30): string {
  if (age < TEEN_STAGE_AGE) return "";
  return mysteryKey(family, sex, Math.max(age, ART_MIN_AGE));
}

/**
 * Painted teen suits (2026-11-14 night, art pending): from 13 to 15 the stage first looks for a teen painting keyed
 * `cut-<key>-teen` (suit B: `cut-<key>-b-teen`), then falls back to the grown suit shrunk by `stageScale`. Best first.
 */
export function stageKeys(family: CapeFamily | null | undefined, sex: Sex | undefined, age: number, suit?: Suit | null): string[] {
  const grown = suitKeys(stageKey(family, sex, age), suit);
  if (!grown.length || age >= ART_MIN_AGE) return grown;
  return [...grown.map((key) => `${key}-teen`), ...grown];
}

/** How tall a teen stands next to a grown fighter: 13 → 0.86, 14 → 0.9, 15 → 0.94, 16+ → 1. */
export function stageScale(age: number): number {
  if (age >= ART_MIN_AGE) return 1;
  return Math.max(0.86, 0.86 + (age - TEEN_STAGE_AGE) * 0.04);
}

/** The power family a single power belongs to (for NPC fighters). */
export function familyOfPower(powerId: string | null | undefined): CapeFamily | null {
  if (!powerId) return null;
  return capeTheme({ powerId, unlockedPowers: [powerId], powerless: false, secondaryId: null } as never).cape;
}

/** Street-villain archetypes with a painted stage cutout (keys match the legacy power ids in duelKit). */
export const STREET_CUTS = ["fire", "ice", "lightning", "speed", "mind", "strength", "blasts", "telekinesis", "invisibility", "shapeshift", "forcefield", "elastic", "healing", "intellect", "flight"] as const;

/** Stage cutout for a villain with no named painting: their power's archetype, or the unpowered street thug. */
export function streetCutKey(power: string | null | undefined): string {
  if (!ART_HEROES) return "";
  return `cut-street-${power && (STREET_CUTS as readonly string[]).includes(power) ? power : "street"}`;
}
