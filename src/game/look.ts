import type { Look } from "./types";

export const SKIN = [
  "#f6e2c8", "#f0c7a4", "#d9a066", "#a86b3c", "#6b3a22", "#e7b898",
  // Added later; random looks still roll from the first six so old portraits keep their faces.
  "#fbeee2", "#c98b5a", "#8a5232", "#4e2a1a", "#b9c7d6", "#9fd1b5",
];
export const HAIR = [
  "#1c1a22", "#3a2418", "#6e3418", "#c4552a", "#d7a441", "#8e8e96", "#5c1d28",
  "#f1e6c8", "#ececf2", "#2f4f9e", "#1f8f86", "#7b3fb8", "#e05d9b", "#c22b2b",
];
export const SKIN_NAMES = ["Fair", "Warm", "Golden", "Tan", "Deep", "Bronze", "Porcelain", "Honey", "Umber", "Ebony", "Frost-touched", "Verdant"];
export const HAIR_NAMES = ["Ink", "Brown", "Auburn", "Copper", "Blonde", "Silver", "Wine", "Platinum", "Snow", "Cobalt", "Teal", "Violet", "Rose", "Crimson"];
export const STYLE_NAMES = ["Short", "Sweep", "Crop", "Long", "Waves", "Tied"];
export const BUILD_NAMES = ["Lean", "Solid"];
/** Random rolls only use the original palettes, so seeded NPC faces never change between versions. */
const BASE_SKIN = 6;
const BASE_HAIR = 7;
export const FEATURE_NAMES = ["Clear", "Scar", "Glasses", "Freckles"];

function mix(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

export function resolveLook(seed: number, look?: Partial<Look> | null): Look {
  const h = mix(seed || 1);
  const skin = clampIndex(look?.skin, SKIN.length, h % BASE_SKIN);
  const hair = clampIndex(look?.hair, HAIR.length, (h >>> 4) % BASE_HAIR);
  const style = clampIndex(look?.style, STYLE_NAMES.length, (h >>> 8) % STYLE_NAMES.length);
  const build = clampIndex(look?.build, BUILD_NAMES.length, (h >>> 20) % BUILD_NAMES.length);
  const feature = clampIndex(look?.feature, FEATURE_NAMES.length, (h >>> 12) % FEATURE_NAMES.length);
  return { skin, hair, style, build, feature };
}

function clampIndex(value: number | undefined, length: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const index = Math.floor(value);
  if (index < 0 || index >= length) return fallback;
  return index;
}
