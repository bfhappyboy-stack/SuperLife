/**
 * What your painted hero is wearing (2026-11-16 suits pass, owner: "it says it's on but doesn't actually change").
 *
 * The Closet used to dress the old paper doll. Since the 2026-11-14 art pass every hero is a painted cutout, and the
 * cutout only ever looked at the life's suit line, so buying and wearing a piece changed the buffs and the "Wearing"
 * chip but never the picture. This file turns the wardrobe into things the painting can actually show:
 * - Suit line: A or B, the two painted costumes, now chosen in the Closet (`suit-line|a` / `suit-line|b`).
 * - Suit colourway: the worn Suit piece recolours the painted suit (face and glow left alone), see `HeroFigure`.
 * - Trim: the worn piece's trim colour is the figure's rim light.
 * - Parts: cape, mask, hands, boots and mark each map to a painted overlay layer (`part-<slot>-<kind>`), anchored per
 *   painting (heroAnchors.ts). A layer shows only once its painting is in the asset table; until then the piece is
 *   named on the mirror instead of drawn (no code-drawn capes). Image list: /workspace/pt1116suits/IMAGES.md.
 * Pure data, no React. `OUTFIT_ON` off = the painting as painted, like before.
 */
import { fitById, SLOTS } from "./costume";
import { suitKeys, SUIT_LOCKED, type Suit } from "./heroArt";
import { HERO_ANCHORS, type HeroAnchor } from "./heroAnchors";
import type { CostumeSlot, Game, Look } from "./types";
import type { Tone } from "./portraits";

export const OUTFIT_ON = true;
/** Painted part layers (capes, masks...). On: a layer shows as soon as its painting exists. */
export const PART_LAYERS = true;

/** The suit piece that is "the suit as painted": no recolour. */
export const PAINTED_SUIT = "street-jacket";

export type PartAnchor = "back" | "face" | "chest" | "waist" | "hands" | "feet";
export interface PartLayer {
  slot: CostumeSlot;
  /** Art key of the painted overlay (`part-cape-long`). */
  key: string;
  anchor: PartAnchor;
  /** Behind the figure (a cape) or over it. */
  behind: boolean;
  /** The piece's cloth colour, for a colour-matched layer. */
  cloth: string;
}

export interface Outfit {
  line: Suit;
  /** Colourway for the painted suit (the worn Suit piece's cloth), or null = as painted. */
  tint: string | null;
  /** Rim light colour (the worn Suit piece's trim), or null = the power colour. */
  rim: string | null;
  /** How strongly the colourway is laid on (0..1). Light colours get less, so ivory reads as cloth, not paint. */
  strength: number;
  layers: PartLayer[];
  /** Worn pieces that change how you look, for the mirror's caption ("Training suit · Long cape"). */
  worn: { slot: CostumeSlot; name: string }[];
}

const PART_ANCHOR: Record<Exclude<CostumeSlot, "chest">, { anchor: PartAnchor; behind: boolean }> = {
  cape: { anchor: "back", behind: true },
  cowl: { anchor: "face", behind: false },
  gloves: { anchor: "hands", behind: false },
  boots: { anchor: "feet", behind: false },
  emblem: { anchor: "chest", behind: false },
};

/** The "nothing" piece in each slot: wearing it shows nothing extra. */
const BARE = new Set(["bare-head", "no-cape", "bare-hands", "sneakers", "no-mark", PAINTED_SUIT]);

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (!Number.isFinite(n)) return 0.5;
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Art key for a part layer: `part-<slot>-<kind>` (kind from the costume data: `part-cape-long`, `part-cowl-domino`). */
export function partKey(slot: CostumeSlot, id: string): string {
  const fit = fitById(id);
  if (!fit || BARE.has(fit.id)) return "";
  const kind = fit.cape ?? fit.mask ?? fit.glove ?? fit.boot ?? fit.mark;
  return kind && kind !== "none" ? `part-${slot}-${kind}` : "";
}

export function outfitOf(game: { wardrobe?: Game["wardrobe"]; suit?: Game["suit"] }): Outfit {
  const line: Suit = game.suit === "b" ? "b" : "a";
  const worn = game.wardrobe?.worn ?? {};
  const chest = fitById(worn.chest);
  const tinted = OUTFIT_ON && chest && chest.id !== PAINTED_SUIT ? chest : null;
  const layers: PartLayer[] = [];
  const named: Outfit["worn"] = [];
  if (tinted) named.push({ slot: "chest", name: tinted.name });
  for (const slot of SLOTS) {
    if (slot === "chest") continue;
    const fit = fitById(worn[slot]);
    if (!fit || BARE.has(fit.id)) continue;
    named.push({ slot, name: fit.name });
    const key = partKey(slot, fit.id);
    // A belt or buckle sits at the waist; a badge, brand or sash on the chest.
    const place = slot === "emblem" && (fit.mark === "belt" || fit.mark === "buckle") ? { anchor: "waist" as const, behind: false } : PART_ANCHOR[slot];
    if (OUTFIT_ON && PART_LAYERS && key) layers.push({ slot, key, ...place, cloth: fit.cloth });
  }
  const light = tinted ? luminance(tinted.cloth) : 0;
  return {
    line,
    tint: tinted?.cloth ?? null,
    rim: tinted?.trim ?? null,
    strength: tinted ? Math.round((light > 0.7 ? 0.62 : light > 0.45 ? 0.78 : 0.9) * 100) / 100 : 0,
    layers,
    worn: named,
  };
}

/** Can this life switch suit lines? (The male speedster's suit is locked; the B painting must exist, checked by the UI.) */
export function suitLineLocked(key: string): boolean {
  return SUIT_LOCKED.includes(key);
}

/** Both lines' art keys for a painted hero key, A first (`mystery-fire-m` → [`mystery-fire-m`, `mystery-fire-m-b`]). */
export function lineKeys(key: string): Record<Suit, string> {
  return { a: suitKeys(key, "a")[0] ?? key, b: `${key}-b` };
}

/* ---------- Skin tone (creator) on the painted heroes ---------- */

export const TONES: readonly Tone[] = ["light", "medium", "brown", "dark"];
/** Skin palette index (look.ts SKIN) → tone, same table the painted portraits use. */
export const SKIN_TONE: readonly Tone[] = ["light", "light", "medium", "brown", "dark", "medium", "light", "medium", "brown", "dark", "light", "medium"];

export function toneOf(look: { skin?: Look["skin"] } | null | undefined): Tone | null {
  if (!look || typeof look.skin !== "number") return null;
  return SKIN_TONE[look.skin] ?? null;
}

/** Variant suffix for a tone: `-s1` light, `-s2` medium, `-s3` brown, `-s4` dark. */
export function toneSuffix(tone: Tone): string {
  return `-s${TONES.indexOf(tone) + 1}`;
}

/** Anchors for a painting: a skin-tone variant has its own row (repaints frame a little differently), else its base's. */
export function anchorOf(key: string): HeroAnchor | null {
  const own = key.replace(/^cut-/, "");
  return HERO_ANCHORS[own] ?? HERO_ANCHORS[own.replace(/-s[1-4]$/, "")] ?? null;
}

/** The tone a painting was painted in (variants say it in their name; base paintings in heroAnchors.ts). */
export function nativeTone(key: string): Tone | null {
  const m = /-s([1-4])$/.exec(key);
  if (m) return TONES[Number(m[1]) - 1] ?? null;
  return anchorOf(key)?.tone ?? null;
}

/**
 * Skin-tone variants of one painting, best first for a wanted tone: every `<key>-s<n>` plus the base painting at its
 * own tone, sorted by distance from the wanted tone (ties: the base painting, then lighter). No wanted tone = [key].
 * Variants are new paintings of the same character (IMAGES.md); the UI keeps the first one that exists.
 */
export function toneKeys(key: string, tone: Tone | null): string[] {
  if (!key || !tone) return key ? [key] : [];
  const want = TONES.indexOf(tone);
  const native = nativeTone(key);
  const rows = TONES.map((t, i) => ({ key: `${key}${toneSuffix(t)}`, d: Math.abs(i - want), base: false, i }));
  if (native) {
    const at = TONES.indexOf(native);
    rows.push({ key, d: Math.abs(at - want), base: true, i: at });
  } else rows.push({ key, d: 9, base: true, i: 9 });
  rows.sort((a, b) => a.d - b.d || Number(b.base) - Number(a.base) || a.i - b.i);
  return rows.map((r) => r.key);
}
