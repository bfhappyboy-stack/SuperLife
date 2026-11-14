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

/** Art key for a painted Mystery hero, or "" when there is none (no family, too young, art off). */
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
