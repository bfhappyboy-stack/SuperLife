import type { Look } from "./types";

export const SKIN = ["#f6e2c8", "#f0c7a4", "#d9a066", "#a86b3c", "#6b3a22", "#e7b898"];
export const HAIR = ["#1c1a22", "#3a2418", "#6e3418", "#c4552a", "#d7a441", "#8e8e96", "#5c1d28"];
export const SKIN_NAMES = ["Fair", "Warm", "Golden", "Tan", "Deep", "Bronze"];
export const HAIR_NAMES = ["Ink", "Brown", "Auburn", "Copper", "Blonde", "Silver", "Wine"];
export const STYLE_NAMES = ["Short", "Sweep", "Crop", "Long", "Waves", "Tied"];
export const BUILD_NAMES = ["Lean", "Solid"];
export const FEATURE_NAMES = ["Clear", "Scar", "Glasses", "Freckles"];

function mix(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

export function resolveLook(seed: number, look?: Partial<Look> | null): Look {
  const h = mix(seed || 1);
  const skin = clampIndex(look?.skin, SKIN.length, h % SKIN.length);
  const hair = clampIndex(look?.hair, HAIR.length, (h >>> 4) % HAIR.length);
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
