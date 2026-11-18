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

/**
 * The chase runner is you, painted (2026-11-18 am): your suit cutout from 13, a legend's painting, or your painted face
 * before the suit, standing in the lane instead of the drawn orange token. The side figure steps out of the backdrop
 * so you are not on screen twice. Off = the token.
 */
export const CHASE_RUNNER = true;

/**
 * The chase road gets lit set pieces (2026-11-18 pm): the wrecks are a concrete barrier, a crashed car or a girder pile
 * with shadows and hazard lights, the sparks are energy shards with a motion streak, and the asphalt carries grain and
 * speed streaks (ChaseProps.tsx). Off = the striped blocks and glowing dots.
 */
export const CHASE_PROPS = true;

/**
 * Minigame headers wear a lit emblem (2026-11-18 night): a dark beveled badge in the kind's colour with a rim light,
 * a top sheen, an inner ring, a soft glow and an embossed icon, so the header sits next to the painted art instead of
 * the flat app-style icon tile. Non-character graphic. Off = the flat ico-tile.
 */
export const MINI_EMBLEM = true;

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
