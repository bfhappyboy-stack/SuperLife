import { money } from "./format";
import type { CostumeSlot, Game, Wardrobe } from "./types";

export type MaskKind = "none" | "domino" | "hood" | "cowl" | "helm" | "crown" | "halo";
export type CapeKind = "none" | "short" | "long" | "coat" | "banner" | "tatter";
export type ChestKind = "jacket" | "suit" | "mesh" | "plate" | "skin" | "leather";
export type GloveKind = "none" | "wraps" | "gloves" | "gauntlet" | "claws" | "medic";
export type BootKind = "sneaker" | "boot" | "silent" | "rocket" | "tread";
export type MarkKind = "none" | "badge" | "belt" | "buckle" | "brand" | "sash";

export interface Fit {
  id: string;
  slot: CostumeSlot;
  name: string;
  detail: string;
  cost: number;
  minAge: number;
  minFame?: number;
  minRank?: number;
  karmaAtLeast?: number;
  karmaAtMost?: number;
  strike?: number;
  guard?: number;
  hp?: number;
  fame?: number;
  cash?: number;
  looks?: number;
  cloth: string;
  trim: string;
  mask?: MaskKind;
  cape?: CapeKind;
  chest?: ChestKind;
  glove?: GloveKind;
  boot?: BootKind;
  mark?: MarkKind;
}

export interface FitMods {
  strike: number;
  guard: number;
  hp: number;
  fame: number;
  cash: number;
  looks: number;
}

const FITS: Fit[] = [
  fit({ id: "bare-head", slot: "cowl", name: "Bare head", detail: "A face the block already knows.", cost: 0, minAge: 0, cloth: "#1c140e", trim: "#e6b34d", mask: "none" }),
  fit({ id: "domino", slot: "cowl", name: "Domino mask", detail: "The classic lie. It works on nobody who knows you, and on everyone else.", cost: 60, minAge: 0, looks: 2, cloth: "#1c140e", trim: "#e6b34d", mask: "domino" }),
  fit({ id: "knit-hood", slot: "cowl", name: "Knit hood", detail: "Warm, anonymous, slightly criminal even when you aren't.", cost: 140, minAge: 10, guard: 4, cloth: "#243044", trim: "#c9ccd4", mask: "hood" }),
  fit({ id: "full-cowl", slot: "cowl", name: "Full cowl", detail: "Ears optional. The point is the eyes.", cost: 900, minAge: 14, minFame: 8, guard: 6, fame: 1, cloth: "#141820", trim: "#e6b34d", mask: "cowl" }),
  fit({ id: "visor-helm", slot: "cowl", name: "Visor helm", detail: "A face the cameras can't invoice.", cost: 2600, minAge: 16, minFame: 18, guard: 8, hp: 4, cloth: "#8d97a8", trim: "#3cb8b0", mask: "helm" }),
  fit({ id: "block-crown", slot: "cowl", name: "Crown of the block", detail: "Not a king. A warning with jewelry.", cost: 700, minAge: 15, karmaAtMost: -8, strike: 6, fame: 2, cloth: "#3a2418", trim: "#e23b3b", mask: "crown" }),
  fit({ id: "halo-band", slot: "cowl", name: "Halo band", detail: "A thin ring of light. The city decides if it believes you.", cost: 1800, minAge: 16, karmaAtLeast: 18, looks: 4, fame: 1, cloth: "#f4ead6", trim: "#e6b34d", mask: "halo" }),

  fit({ id: "street-jacket", slot: "chest", name: "Street jacket", detail: "What you already own. It photographs like a person, not a poster.", cost: 0, minAge: 0, looks: 1, cloth: "#4a5c78", trim: "#f4ead6", chest: "jacket" }),
  fit({ id: "training-suit", slot: "chest", name: "Training suit", detail: "The gym's logo, then yours.", cost: 180, minAge: 8, strike: 3, hp: 4, cloth: "#1f3a4a", trim: "#3cb8b0", chest: "suit" }),
  fit({ id: "patrol-mesh", slot: "chest", name: "Patrol mesh", detail: "Breathes. Doesn't apologize.", cost: 740, minAge: 13, guard: 5, hp: 6, cloth: "#1a2744", trim: "#e6b34d", chest: "mesh" }),
  fit({ id: "armored-vest", slot: "chest", name: "Armored vest", detail: "The ugly hit has to work for it.", cost: 2400, minAge: 16, minFame: 12, guard: 10, hp: 12, cloth: "#6e7684", trim: "#d5d8e0", chest: "plate" }),
  fit({ id: "second-skin", slot: "chest", name: "Second skin", detail: "Neon enough that the Stacks nod. Everywhere else, they stare.", cost: 1600, minAge: 14, strike: 6, looks: 3, cloth: "#12312e", trim: "#3ecfc0", chest: "skin" }),
  fit({ id: "ceremonial-plate", slot: "chest", name: "Ceremonial plate", detail: "Parade armor that still stops a knife. The tailor is proud and expensive.", cost: 8200, minAge: 18, minFame: 32, looks: 6, fame: 3, hp: 8, cloth: "#f4ead6", trim: "#e6b34d", chest: "plate" }),
  fit({ id: "rogue-leather", slot: "chest", name: "Rogue leather", detail: "A jacket that already knows the exits.", cost: 980, minAge: 15, karmaAtMost: -6, strike: 8, fame: 1, cloth: "#2a140f", trim: "#e23b3b", chest: "leather" }),

  fit({ id: "no-cape", slot: "cape", name: "No cape", detail: "Some cities respect the absence.", cost: 0, minAge: 0, cloth: "#10141c", trim: "#10141c", cape: "none" }),
  fit({ id: "short-cape", slot: "cape", name: "Short cape", detail: "Enough cloth to catch a photo and not a bus.", cost: 180, minAge: 0, looks: 2, fame: 1, cloth: "#8f1d2c", trim: "#e6b34d", cape: "short" }),
  fit({ id: "long-cape", slot: "cape", name: "Long cape", detail: "The classic. It argues with doors and wins on camera.", cost: 860, minAge: 14, looks: 4, fame: 2, guard: 3, cloth: "#6e1524", trim: "#f4ead6", cape: "long" }),
  fit({ id: "trench", slot: "cape", name: "Trench coat", detail: "A cape for people who pretend they don't have one.", cost: 640, minAge: 16, guard: 6, looks: 2, cloth: "#2c241c", trim: "#c9b59a", cape: "coat" }),
  fit({ id: "banner-cape", slot: "cape", name: "Banner cape", detail: "A flag with your shoulders in it.", cost: 4200, minAge: 18, minFame: 28, looks: 6, fame: 4, cloth: "#e6b34d", trim: "#10141c", cape: "banner" }),
  fit({ id: "tattered-wing", slot: "cape", name: "Tattered wing", detail: "It used to be a cape. Now it's a reputation.", cost: 540, minAge: 15, karmaAtMost: -12, strike: 6, fame: 2, cloth: "#4a1218", trim: "#1c140e", cape: "tatter" }),

  fit({ id: "bare-hands", slot: "gloves", name: "Bare hands", detail: "Knuckles, unbranded.", cost: 0, minAge: 0, cloth: "#d9a066", trim: "#1c140e", glove: "none" }),
  fit({ id: "hand-wraps", slot: "gloves", name: "Hand wraps", detail: "The gym's cheapest lie about discipline.", cost: 40, minAge: 0, strike: 3, cloth: "#f4ead6", trim: "#8f1d2c", glove: "wraps" }),
  fit({ id: "patrol-gloves", slot: "gloves", name: "Patrol gloves", detail: "Grip, and a little padding for other people's teeth.", cost: 280, minAge: 12, strike: 4, hp: 2, cloth: "#1c2433", trim: "#e6b34d", glove: "gloves" }),
  fit({ id: "gauntlets", slot: "gloves", name: "Gauntlets", detail: "The punch arrives wearing armor.", cost: 1700, minAge: 16, strike: 8, hp: 4, cloth: "#8d97a8", trim: "#e6b34d", glove: "gauntlet" }),
  fit({ id: "medic-gloves", slot: "gloves", name: "Medic gloves", detail: "You meant to help. The grip is still excellent.", cost: 920, minAge: 14, hp: 8, guard: 3, cloth: "#e7f4ec", trim: "#1a6b48", glove: "medic" }),
  fit({ id: "claw-tips", slot: "gloves", name: "Claw tips", detail: "Unnecessary, which is the point.", cost: 760, minAge: 15, karmaAtMost: -10, strike: 10, cloth: "#1c140e", trim: "#e23b3b", glove: "claws" }),

  fit({ id: "sneakers", slot: "boots", name: "Sneakers", detail: "Fast enough for a bus. Not a myth.", cost: 0, minAge: 0, hp: 1, cloth: "#f4ead6", trim: "#e23b3b", boot: "sneaker" }),
  fit({ id: "patrol-boots", slot: "boots", name: "Patrol boots", detail: "The sidewalk hears you and decides to cooperate.", cost: 320, minAge: 12, hp: 4, guard: 3, cloth: "#2a241c", trim: "#c9b59a", boot: "boot" }),
  fit({ id: "silent-soles", slot: "boots", name: "Silent soles", detail: "You arrive without the soundtrack.", cost: 1200, minAge: 15, guard: 5, looks: 2, cloth: "#141820", trim: "#3cb8b0", boot: "silent" }),
  fit({ id: "rocket-boots", slot: "boots", name: "Rocket boots", detail: "A bad idea with excellent lift and a worse landing.", cost: 3600, minAge: 17, minFame: 16, strike: 8, fame: 2, cloth: "#c4552a", trim: "#e6b34d", boot: "rocket" }),
  fit({ id: "heavy-treads", slot: "boots", name: "Heavy treads", detail: "Each step is a small argument with the floor.", cost: 880, minAge: 14, hp: 6, strike: 4, cloth: "#3a4258", trim: "#8d97a8", boot: "tread" }),

  fit({ id: "no-mark", slot: "emblem", name: "No mark", detail: "Unsigned work.", cost: 0, minAge: 0, cloth: "#e6b34d", trim: "#10141c", mark: "none" }),
  fit({ id: "cloth-badge", slot: "emblem", name: "Cloth badge", detail: "A patch from a shop that also sells lighters.", cost: 40, minAge: 0, fame: 1, cloth: "#e6b34d", trim: "#8f1d2c", mark: "badge" }),
  fit({ id: "utility-belt", slot: "emblem", name: "Utility belt", detail: "Pouches, a light, and the feeling of a plan.", cost: 640, minAge: 14, hp: 4, cash: 4, cloth: "#c9b59a", trim: "#2a241c", mark: "belt" }),
  fit({ id: "champion-buckle", slot: "emblem", name: "Champion buckle", detail: "The League doesn't issue it. The photographer does.", cost: 3200, minAge: 18, minFame: 24, karmaAtLeast: 8, fame: 3, looks: 4, cloth: "#e6b34d", trim: "#f4ead6", mark: "buckle" }),
  fit({ id: "fear-brand", slot: "emblem", name: "Fear brand", detail: "A mark people describe instead of naming.", cost: 480, minAge: 15, karmaAtMost: -8, strike: 6, fame: 2, cloth: "#e23b3b", trim: "#1c140e", mark: "brand" }),
  fit({ id: "relic-sash", slot: "emblem", name: "Relic sash", detail: "Something old agreed to be worn. It still has opinions.", cost: 5400, minAge: 20, minRank: 2, strike: 6, guard: 6, cloth: "#6e3418", trim: "#e6b34d", mark: "sash" }),
];

function fit(entry: Fit): Fit {
  return entry;
}

const BY_ID = new Map(FITS.map((item) => [item.id, item]));

export const SLOT_LABEL: Record<CostumeSlot, string> = {
  cowl: "Mask",
  chest: "Suit",
  cape: "Cape",
  gloves: "Hands",
  boots: "Boots",
  emblem: "Mark",
};

export const SLOTS: CostumeSlot[] = ["cowl", "chest", "cape", "gloves", "boots", "emblem"];

export function fitById(id: string | null | undefined): Fit | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function fitsIn(slot: CostumeSlot): Fit[] {
  return FITS.filter((item) => item.slot === slot);
}

export function starterWardrobe(): Wardrobe {
  return {
    owned: ["bare-head", "street-jacket", "no-cape", "bare-hands", "sneakers", "no-mark"],
    worn: { chest: "street-jacket", boots: "sneakers" },
  };
}

export function ensureWardrobe(value: Wardrobe | undefined): Wardrobe {
  const base = starterWardrobe();
  if (!value || !Array.isArray(value.owned)) return base;
  const owned = [...new Set([...base.owned, ...value.owned.filter((id) => !!fitById(id))])];
  const worn: Wardrobe["worn"] = {};
  for (const slot of SLOTS) {
    const id = value.worn?.[slot];
    if (id && owned.includes(id) && fitById(id)?.slot === slot) worn[slot] = id;
  }
  return { owned, worn };
}

export function costumeMods(game: Pick<Game, "wardrobe">): FitMods {
  const mods: FitMods = { strike: 0, guard: 0, hp: 0, fame: 0, cash: 0, looks: 0 };
  const worn = game.wardrobe?.worn ?? {};
  for (const slot of SLOTS) {
    const item = fitById(worn[slot]);
    if (!item) continue;
    mods.strike += item.strike ?? 0;
    mods.guard += item.guard ?? 0;
    mods.hp += item.hp ?? 0;
    mods.fame += item.fame ?? 0;
    mods.cash += item.cash ?? 0;
    mods.looks += item.looks ?? 0;
  }
  mods.strike = Math.min(40, mods.strike);
  mods.guard = Math.min(40, mods.guard);
  return mods;
}

export function buffLine(item: Pick<Fit, "strike" | "guard" | "hp" | "fame" | "cash" | "looks">): string {
  const bits: string[] = [];
  if (item.strike) bits.push(`+${item.strike}% hits`);
  if (item.guard) bits.push(`+${item.guard}% grit`);
  if (item.hp) bits.push(`+${item.hp} fight hp`);
  if (item.fame) bits.push(`+${item.fame} fame a year`);
  if (item.cash) bits.push(`paycheck +${item.cash}%`);
  if (item.looks) bits.push(`+${item.looks} presence`);
  return bits.length ? bits.join(" · ") : "No stat change. It just looks like you.";
}

export function modsLine(mods: FitMods): string {
  return buffLine(mods);
}

export function fitBlock(game: Pick<Game, "age" | "stats" | "leagueRank">, item: Fit): string | null {
  if (game.age < item.minAge) return `The shop wants age ${item.minAge}.`;
  if (item.minFame && game.stats.fame < item.minFame) return `They want fame ${item.minFame}.`;
  if (item.minRank && game.leagueRank < item.minRank) return "The League has to know your name first.";
  if (item.karmaAtLeast != null && (game.stats.karma ?? 0) < item.karmaAtLeast) return "Your name isn't clean enough for this rack.";
  if (item.karmaAtMost != null && (game.stats.karma ?? 0) > item.karmaAtMost) return "Too bright a reputation for this rack.";
  if (game.stats.money < item.cost) return `Costs ${money(item.cost)}.`;
  return null;
}
