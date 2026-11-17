/** Switch, context and figure pick for the painted minigame stage (MiniStage.tsx). */
import { createContext } from "react";
import { hasArt } from "@/assets/art";
import type { DuelHero } from "@/components/game/Duel";
import { stageArtKey } from "@/components/game/heroArt";
import { toneOf } from "@/game/outfit";

export const MINI_STAGE = true;

/** The hero of the life playing the minigame (the same bundle the duel gets). */
export const MiniHeroContext = createContext<DuelHero | undefined>(undefined);

/** Which painting stands in the minigame arena: "legend", "cut-<key>", "face", or "" (backdrop only). */
export function miniFigureKind(hero: DuelHero | undefined): string {
  if (!hero) return "";
  if (hero.legend && hasArt(hero.legend.art)) return "legend";
  const key = stageArtKey(hero.family, hero.sex, hero.age, hero.suit, toneOf(hero.look));
  return key ? `cut-${key}` : "face";
}

/** Rescue windows show painted people (PhotoFace) instead of the drawn person/baby glyphs. Off = the glyphs. */
export const RESCUE_FACES = true;

/**
 * Press reporters show a painted face (PhotoFace, from the portrait sheets) instead of a coloured initials tile
 * (2026-11-17 night). Off = the letter tile.
 */
export const PRESS_FACES = true;

/** Who each reporter looks like on the painted sheets: a fixed seed, age and sex per reporter id. */
export const REPORTER_FACE: Record<string, { seed: number; age: number; sex: "male" | "female" }> = {
  tabloid: { seed: 4101, age: 34, sex: "female" },
  anchor: { seed: 4217, age: 52, sex: "female" },
  blogger: { seed: 4339, age: 19, sex: "male" },
  critic: { seed: 4451, age: 61, sex: "male" },
  kid: { seed: 4567, age: 9, sex: "female" },
  rival: { seed: 4673, age: 42, sex: "male" },
};
