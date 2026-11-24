import { hasArt } from "@/assets/art";
import { mysteryKey, type Suit } from "@/game/heroArt";
import { wornLine } from "@/game/outfit";
import type { CapeFamily } from "@/game/theme";
import type { Sex } from "@/game/types";

/**
 * The suit line a life is drawn in (2026-11-16 pm): the line the player picked in the Closet, else the line painted
 * closest to their creator skin tone (outfit.ts `wornLine`). Pass this, not the raw `game.suit`, to the art lookups.
 */
export function lifeLine(life: { suit?: Suit | null; suitPicked?: boolean | null; look?: { skin?: number } | null } | null | undefined, family: CapeFamily | null | undefined, sex: Sex | undefined): Suit {
  if (!life) return "a";
  return wornLine(life, mysteryKey(family, sex, 30), hasArt);
}
