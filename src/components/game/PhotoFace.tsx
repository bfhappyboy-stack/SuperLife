/**
 * Painted portrait for a procedural person (2026-11-14 portraits pass): one of the cropped painted heads, picked by
 * `pickPortrait` from the person's seed, age, sex and look, in a rounded frame with a soft rim. Sheets load lazily,
 * one chunk each; until a sheet arrives the SVG bust (`fallback`) shows instead.
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { FEATURE, pickPortrait, portraitVariantKeys, variantHasFeature, type AgeBand, type PortraitMeta, type Sheet } from "@/game/portraits";
import { hasArt } from "@/assets/art";
import { useArt } from "@/components/game/Scene";
import type { Look, Sex } from "@/game/types";

const LOADERS: Record<Sheet, () => Promise<{ default: Record<string, string> }>> = {
  child: () => import("@/assets/art/portraits-child"),
  teen: () => import("@/assets/art/portraits-teen"),
  adult: () => import("@/assets/art/portraits-adult"),
  older: () => import("@/assets/art/portraits-older"),
  capes: () => import("@/assets/art/portraits-capes"),
};
const sheets = new Map<Sheet, Record<string, string>>();
const pending = new Map<Sheet, Promise<Record<string, string>>>();

function loadSheet(sheet: Sheet): Promise<Record<string, string>> {
  const hit = sheets.get(sheet);
  if (hit) return Promise.resolve(hit);
  let job = pending.get(sheet);
  if (!job) {
    job = LOADERS[sheet]().then((mod) => {
      sheets.set(sheet, mod.default);
      return mod.default;
    });
    pending.set(sheet, job);
  }
  return job;
}

export function PhotoFace({
  seed,
  age,
  sex,
  look,
  cape = false,
  feature = null,
  eyes = null,
  className = "h-16 w-16",
  fallback,
  children,
}: {
  seed: number;
  age: number;
  sex: Sex;
  look?: Pick<Look, "skin" | "hair"> | null;
  cape?: boolean;
  /** The life's own creator face feature (look.feature), only for a player's life: prefers a portrait painted with it,
   * else lays freckles or a scar on softly (FACE_MARKS). Random NPC rolls never pass this, so their faces don't move. */
  feature?: number | null;
  /** The life's own creator eye colour (look.eyes), player's life only: picks a painted variant when one exists. */
  eyes?: number | null;
  className?: string;
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  const meta = pickPortrait(seed, age, sex, look, cape, feature);
  const [table, setTable] = useState(() => sheets.get(meta.sheet));
  useEffect(() => {
    let alive = true;
    loadSheet(meta.sheet).then((t) => alive && setTable(t));
    return () => {
      alive = false;
    };
  }, [meta.sheet]);
  // A painted variant of this same face with the life's feature or eyes (2026-11-16 am), when one exists.
  const variant = PORTRAIT_VARIANTS ? (portraitVariantKeys(meta, feature, eyes).find((key) => hasArt(key)) ?? "") : "";
  const variantSrc = useArt(variant);
  const base = table?.[meta.id];
  const src = (variant && variantSrc) || base;
  if (!src) return <>{fallback}</>;
  const painted = !!variant && !!variantSrc && typeof feature === "number" && variantHasFeature(variant, feature);
  return (
    <span className={`relative block overflow-hidden rounded-[26%] bg-[#141a26] ${className}`} data-portrait={meta.id} data-variant={variant && variantSrc ? variant : undefined}>
      <img src={src} alt="" draggable={false} decoding="async" className="block size-full object-cover object-top" />
      {FACE_MARKS && typeof feature === "number" && !painted && <FaceMarks meta={meta} feature={feature} seed={seed} />}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_-14px_18px_-12px_rgb(0_0_0/0.55)]" aria-hidden />
      {children}
    </span>
  );
}

/** Painted variants of a portrait (same face, the life's feature or eye colour painted in). Off = the base portrait. */
export const PORTRAIT_VARIANTS = true;

/** Soft freckles and a healed scar laid on a painted portrait for a life that picked them (2026-11-16). Off = portraits only. */
export const FACE_MARKS = true;

/** Where the eyes sit in each band's painted heads (fraction of the square crop); the faces are centred. */
const EYES: Record<AgeBand | "cape", { y: number; w: number }> = {
  baby: { y: 0.45, w: 0.11 },
  child: { y: 0.44, w: 0.1 },
  teen: { y: 0.37, w: 0.09 },
  adult: { y: 0.38, w: 0.09 },
  older: { y: 0.42, w: 0.09 },
  cape: { y: 0.4, w: 0.09 },
};

function rand(seed: number) {
  let s = (seed | 0) ^ 0x5bd1e995 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * Freckles: a few dozen soft, uneven flecks over the nose bridge and cheeks, multiplied into the paint so they take the
 * skin's own colour and light. Scar: a thin healed line on the cheek, pale centre with a faint darker edge. Nothing is
 * drawn when the portrait already has that feature painted, or for glasses (painted portraits only, IMAGES.md).
 */
function FaceMarks({ meta, feature, seed }: { meta: PortraitMeta; feature: number; seed: number }) {
  const uid = useId().replace(/:/g, "");
  if (meta.marks?.includes(feature) || meta.band === "cape") return null;
  if (feature !== FEATURE.freckles && feature !== FEATURE.scar) return null;
  const eye = EYES[meta.band];
  const ey = eye.y * 100;
  const ew = eye.w * 100;
  const r = rand(seed);
  if (feature === FEATURE.freckles) {
    const dots: { x: number; y: number; r: number; o: number }[] = [];
    const patch = (cx: number, cy: number, rx: number, ry: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r());
        dots.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r: 0.16 + r() * 0.22, o: (0.1 + r() * 0.22) * (1 - d * 0.55) });
      }
    };
    patch(50, ey + ew * 0.5, ew * 0.4, ew * 0.28, 22);
    patch(50 - ew * 0.85, ey + ew * 0.72, ew * 0.62, ew * 0.4, 38);
    patch(50 + ew * 0.85, ey + ew * 0.72, ew * 0.62, ew * 0.4, 38);
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute inset-0 size-full mix-blend-multiply" data-face-marks="freckles" aria-hidden>
        <defs>
          <filter id={`fr-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.13" />
          </filter>
        </defs>
        <g filter={`url(#fr-${uid})`} fill="#7a4126">
          {dots.map((d, i) => (
            <ellipse key={i} cx={d.x} cy={d.y} rx={d.r} ry={d.r * 0.82} opacity={d.o} />
          ))}
        </g>
      </svg>
    );
  }
  const side = r() < 0.5 ? -1 : 1;
  const x0 = 50 + side * ew * 0.95;
  const y0 = ey + ew * 0.55;
  const path = `M${x0} ${y0} Q${x0 + side * ew * 0.12} ${y0 + ew * 0.5} ${x0 + side * ew * 0.42} ${y0 + ew * 0.95}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute inset-0 size-full" data-face-marks="scar" aria-hidden>
      <defs>
        <filter id={`sc-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>
      <g filter={`url(#sc-${uid})`} fill="none" strokeLinecap="round">
        <path d={path} stroke="#5a2a1e" strokeOpacity="0.36" strokeWidth="1.3" style={{ mixBlendMode: "multiply" }} />
        <path d={path} stroke="#e3a898" strokeOpacity="0.34" strokeWidth="0.55" style={{ mixBlendMode: "screen" }} />
      </g>
    </svg>
  );
}
