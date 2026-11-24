/**
 * Measured frames of the painted costume parts (2026-11-16 suits pass), written by
 * `import-cutouts.py --keep-frame` (`frames.json`). Each part is trimmed to its own pixels and keeps its own scale.
 * - `w`, `h`: the image size (px).
 * - Capes: `collar` = top of the cloth, `band` = the shoulder band row (7% down the cape) and `sl`..`sr` its left/right
 *   edges, all as fractions of the image. The game fits that band to each hero's measured shoulders (`heroAnchors.ts`),
 *   so a cape painted wider in its frame (the short cape) still sits on the shoulders, not by frame width.
 */
export interface PartFrame {
  w: number;
  h: number;
  collar?: number;
  band?: number;
  sl?: number;
  sr?: number;
}

export const PART_FRAMES: Record<string, PartFrame> = {
  "part-cape-banner": { w: 352, h: 640, collar: 0.0031, band: 0.0719, sl: 0.2188, sr: 0.7812 },
  "part-cape-coat": { w: 341, h: 640, collar: 0.0031, band: 0.0719, sl: 0.3109, sr: 0.6774 },
  "part-cape-long": { w: 299, h: 640, collar: 0.0031, band: 0.0719, sl: 0.2408, sr: 0.7458 },
  "part-cape-short": { w: 428, h: 640, collar: 0.0016, band: 0.0703, sl: 0.2407, sr: 0.8575 },
  "part-cape-tatter": { w: 370, h: 640, collar: 0.0016, band: 0.0703, sl: 0.273, sr: 0.7081 },
  "part-emblem-badge": { w: 307, h: 320 },
  "part-emblem-belt": { w: 320, h: 90 },
  "part-emblem-brand": { w: 320, h: 282 },
  "part-emblem-buckle": { w: 320, h: 218 },
  "part-emblem-sash": { w: 320, h: 318 },
};
