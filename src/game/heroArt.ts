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

/** The power family a single power belongs to (for NPC fighters). */
export function familyOfPower(powerId: string | null | undefined): CapeFamily | null {
  if (!powerId) return null;
  return capeTheme({ powerId, unlockedPowers: [powerId], powerless: false, secondaryId: null } as never).cape;
}
