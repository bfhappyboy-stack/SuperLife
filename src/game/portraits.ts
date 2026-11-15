/**
 * Painted portraits for every procedural person (2026-11-14 portraits pass). Five painted sheets were cropped into
 * 192px webp heads (`src/assets/art/portraits-<sheet>.ts`); this file holds their metadata and the deterministic
 * picker. Same seed → same person: someone who crosses an age band moves to the matching portrait in the next band.
 */
import type { Look, Sex } from "./types";

export type AgeBand = "baby" | "child" | "teen" | "adult" | "older";
export type Tone = "light" | "medium" | "brown" | "dark";
export type HairTone = "black" | "brown" | "blond" | "red" | "grey";
export type Sheet = "child" | "teen" | "adult" | "older" | "capes";

export interface PortraitMeta {
  id: string;
  sheet: Sheet;
  band: AgeBand | "cape";
  sex: Sex;
  skin: Tone;
  hair: HairTone;
  /** In a hero suit: kept out of the everyday pool. */
  suited?: boolean;
}

const P = (id: string, band: PortraitMeta["band"], sex: Sex, skin: Tone, hair: HairTone, suited?: boolean): PortraitMeta => ({
  id,
  sheet: id.split("-")[0] as Sheet,
  band,
  sex,
  skin,
  hair,
  suited,
});
const M: Sex = "male";
const F: Sex = "female";

export const PORTRAITS: readonly PortraitMeta[] = [
  P("child-0", "baby", M, "light", "blond"),
  P("child-1", "baby", M, "dark", "black"),
  P("child-2", "baby", F, "light", "black"),
  P("child-3", "child", M, "medium", "brown"),
  P("child-4", "child", F, "brown", "black"),
  P("child-5", "child", M, "light", "red"),
  P("child-6", "child", F, "dark", "black"),
  P("child-7", "child", M, "light", "brown"),
  P("child-8", "child", F, "medium", "black"),
  P("teen-0", "teen", M, "light", "blond"),
  P("teen-1", "teen", F, "dark", "black"),
  P("teen-2", "teen", M, "light", "black"),
  P("teen-3", "teen", F, "medium", "brown"),
  P("teen-4", "teen", M, "brown", "black", true),
  P("teen-5", "teen", F, "light", "red"),
  P("teen-6", "teen", M, "dark", "black"),
  P("teen-7", "teen", F, "light", "black"),
  P("teen-8", "teen", M, "medium", "brown"),
  P("adult-0", "adult", M, "light", "brown"),
  P("adult-1", "adult", F, "dark", "black"),
  P("adult-2", "adult", M, "brown", "black"),
  P("adult-3", "adult", F, "light", "black"),
  P("adult-4", "adult", M, "medium", "black", true),
  P("adult-5", "adult", M, "medium", "black"),
  P("adult-6", "adult", F, "light", "red"),
  P("adult-7", "adult", M, "medium", "black"),
  P("adult-8", "adult", F, "brown", "black"),
  P("adult-9", "adult", M, "light", "blond"),
  P("older-0", "older", M, "dark", "grey"),
  P("older-1", "older", F, "light", "grey"),
  P("older-2", "older", M, "light", "grey"),
  P("older-3", "older", F, "medium", "grey"),
  P("older-4", "older", M, "brown", "grey"),
  P("older-5", "older", F, "medium", "grey"),
  P("older-6", "older", M, "medium", "grey"),
  P("older-7", "older", F, "light", "grey"),
  P("older-8", "older", F, "dark", "grey"),
  P("capes-0", "cape", F, "dark", "black"),
  P("capes-1", "cape", M, "medium", "black"),
  P("capes-2", "cape", M, "medium", "black"),
  P("capes-3", "cape", F, "light", "blond"),
  P("capes-4", "cape", M, "brown", "black"),
  P("capes-5", "cape", F, "medium", "black"),
  P("capes-6", "cape", M, "light", "brown"),
  P("capes-7", "cape", F, "medium", "black"),
  P("capes-8", "cape", M, "dark", "black"),
];

/** Skin palette index (look.ts SKIN) → portrait tone. */
const SKIN_TONE: Tone[] = ["light", "light", "medium", "brown", "dark", "medium", "light", "medium", "brown", "dark", "light", "medium"];
/** Hair palette index (look.ts HAIR) → portrait hair; dyed colours read as black. */
const HAIR_TONE: HairTone[] = ["black", "brown", "red", "red", "blond", "grey", "red", "blond", "grey", "black", "black", "black", "black", "black"];
const TONE_ORDER: Tone[] = ["light", "medium", "brown", "dark"];

export function ageBand(age: number): AgeBand {
  if (age < 4) return "baby";
  if (age < 13) return "child";
  if (age < 18) return "teen";
  if (age < 55) return "adult";
  return "older";
}

function hash(seed: number): number {
  let x = (seed | 0) || 1;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * The portrait for a person: same band (rival capes from 16 use the masked sheet), same sex when the band has one,
 * then the closest skin tone and hair; ties broken by the seed, so a person keeps "their" face.
 */
export function pickPortrait(seed: number, age: number, sex: Sex, look?: Pick<Look, "skin" | "hair"> | null, cape = false): PortraitMeta {
  const band: PortraitMeta["band"] = cape && age >= 16 ? "cape" : ageBand(age);
  const inBand = PORTRAITS.filter((p) => p.band === band && !p.suited);
  const pool = inBand.some((p) => p.sex === sex) ? inBand.filter((p) => p.sex === sex) : inBand;
  const tone = look ? SKIN_TONE[look.skin] : undefined;
  const hair = look ? HAIR_TONE[look.hair] : undefined;
  const score = (p: PortraitMeta) => {
    let s = 0;
    if (tone) s += 2 - Math.min(2, Math.abs(TONE_ORDER.indexOf(p.skin) - TONE_ORDER.indexOf(tone)));
    if (hair && band !== "older" && p.hair === hair) s += 1;
    return s;
  };
  const best = Math.max(...pool.map(score));
  const top = pool.filter((p) => score(p) === best);
  return top[hash(seed) % top.length]!;
}

/** Every portrait that fits a band and sex (the creator's reroll cycles through these). */
export function portraitsFor(age: number, sex: Sex): PortraitMeta[] {
  const band = ageBand(age);
  return PORTRAITS.filter((p) => p.band === band && p.sex === sex && !p.suited);
}
