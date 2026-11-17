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
