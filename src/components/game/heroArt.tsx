/**
 * Painted character art for lives that aren't God Mode legends (2026-11-11 art pass).
 * Mystery heroes (and hero-side NPC fighters) stand in the ring as a painted card picked by their power family and
 * sex, in the same style as the legend and villain paintings. Kids under 16 keep the paper doll until the suit fits.
 * `ART_HEROES` turns the whole layer off and restores the old figures.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { useArt } from "@/components/game/Scene";
import { anchorOf, toneKeys, type Outfit, type PartLayer } from "@/game/outfit";
import type { Tone } from "@/game/portraits";
import type { HeroAnchor } from "@/game/heroAnchors";
import { PART_FRAMES } from "@/game/partFrames";
import { CLOAK_CAPES, CLOAK_WIDEN } from "@/game/outfit";
import type { Pose } from "@/components/game/Figure";
import { hasArt } from "@/assets/art";
import { mysteryKey, stageKeys, suitKeys, type Suit } from "@/game/heroArt";
import type { CapeFamily } from "@/game/theme";
import type { Sex } from "@/game/types";

export { familyOfPower } from "@/game/heroArt";

/**
 * Art key for a painted Mystery hero card that exists in the asset table (suit B first when worn and painted), or "".
 * `tone` (the creator's skin, `toneOf(look)`) prefers that character's skin-tone painting (`<key>-s1..4`), else the
 * closest tone painted (2026-11-16 suits pass).
 */
export function mysteryArtKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30, suit?: Suit | null, tone?: Tone | null): string {
  return suitKeys(mysteryKey(family, sex, age), suit).flatMap((key) => toneKeys(key, tone ?? null)).find((key) => hasArt(key)) ?? "";
}

/** Stage cutout key (no `cut-` prefix) for your Mystery hero from 13 that exists in the asset table: a teen painting at 13-15, suit B first, or "". */
export function stageArtKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30, suit?: Suit | null, tone?: Tone | null): string {
  return stageKeys(family, sex, age, suit).flatMap((key) => toneKeys(key, tone ?? null)).find((key) => hasArt(`cut-${key}`)) ?? "";
}

/** A painted fighter card on the duel stage, with the same pose cues the paper doll had. */
export function Standee({ src, name, color, glow, pose, flip, children }: { src?: string; name: string; color: string; glow: string; pose: Pose; flip?: boolean; children?: ReactNode }) {
  return (
    <div className="flex h-full w-full items-end justify-center" style={flip ? { transform: "scaleX(-1)" } : undefined} role="img" aria-label={name}>
      <div
        className={`duel-standee relative aspect-[3/4.4] h-[98%] w-auto max-w-none shrink-0 overflow-hidden rounded-2xl border-2 ${pose === "hit" ? "duel-standee-hit" : ""} ${pose === "attack" ? "duel-standee-attack" : ""} ${pose === "ko" ? "grayscale" : ""}`}
        style={{ borderColor: color, boxShadow: `0 10px 28px -10px ${glow}, inset 0 0 0 1px rgb(255 255 255 / 0.12)` }}
      >
        {children ?? (src ? <img src={src} alt="" className="size-full object-cover object-top" draggable={false} /> : null)}
        {pose === "guard" && <span className="absolute inset-0 rounded-2xl border-4 border-[#4dd8ff]/70 shadow-[inset_0_0_24px_#4dd8ff88]" aria-hidden />}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent px-1.5 pt-5 pb-1 text-center text-[10px] leading-tight font-black tracking-wide text-fg uppercase">
          {name}
        </span>
      </div>
    </div>
  );
}

/**
 * A full-body painted cutout standing on the duel stage (2026-11-11 art2): ground shadow, rim light in the power colour,
 * idle breathing, a white hit flash with a shake, a forward lean on attack and a fall on KO. `face` flips the art so
 * the fighter looks at their opponent (the stage mirrors the foe side, so foe cutouts painted facing left pass flip).
 * With an `outfit` (your own hero, 2026-11-16) the figure wears what the Closet says: see `HeroFigure`.
 */
export function Cutout({ src, name, glow, pose, flip, scale = 1, outfit, artKey }: { src: string; name: string; glow: string; pose: Pose; flip?: boolean; scale?: number; outfit?: Outfit | null; artKey?: string }) {
  const poseClass = `${pose === "idle" || pose === "stand" ? "cut-breathe" : ""} ${pose === "hit" ? "cut-hit" : ""} ${pose === "attack" ? "cut-attack" : ""} ${pose === "ko" ? "cut-ko" : ""} ${pose === "guard" ? "cut-guard" : ""}`;
  const dressed = !!outfit && (!!outfit.tint || outfit.layers.length > 0);
  return (
    <div className="relative flex h-full w-full items-end justify-center" role="img" aria-label={name}>
      <span className="cut-shadow pointer-events-none absolute bottom-[1%] left-1/2 h-[9%] w-[78%] -translate-x-1/2 rounded-[50%]" style={{ background: `radial-gradient(closest-side, rgb(0 0 0 / 0.75), color-mix(in srgb, ${glow} 25%, transparent) 70%, transparent)` }} aria-hidden />
      {dressed ? (
        <HeroFigure src={src} artKey={artKey ?? ""} outfit={outfit!} glow={glow} flip={flip} className={`cut-fig relative h-[96%] ${poseClass}`} style={{ height: scale < 1 ? `${96 * scale}%` : undefined }} />
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          className={`cut-fig relative h-[96%] w-auto max-w-none object-contain object-bottom ${poseClass}`}
          style={{ height: scale < 1 ? `${96 * scale}%` : undefined, transform: flip ? "scaleX(-1)" : undefined, filter: rimFilter(glow, outfit?.rim) }}
        />
      )}
    </div>
  );
}

function rimFilter(glow: string, rim?: string | null): string {
  return `drop-shadow(0 0 1.5px color-mix(in srgb, ${rim ?? glow} 85%, white)) drop-shadow(0 0 10px color-mix(in srgb, ${glow} 45%, transparent))`;
}

function lum(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isFinite(n) ? (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 : 0.5;
}

/**
 * Your painted hero wearing the Closet (2026-11-16 suits pass). The painting itself, then:
 * - the suit colourway: the same painting again, recoloured by an SVG filter (luminance-preserving colour blend on the
 *   darker, painted cloth, with a soft lift so black suits take the colour too; bright glows and highlights keep their
 *   paint) and masked off above the neck so the face, hair and mask stay as painted;
 * - painted part layers (a cape behind, a mark on the chest...) once their paintings exist, anchored per painting;
 * - the worn piece's trim as the thin rim light.
 * The box takes its size from the painting, so every layer shares its coordinates. Sized by `className` / `style` height.
 */
export function HeroFigure({ src, artKey, outfit, glow, flip, className = "", style }: { src: string; artKey: string; outfit: Outfit; glow: string; flip?: boolean; className?: string; style?: CSSProperties }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const anchor = anchorOf(artKey);
  const neck = Math.round((anchor?.neck ?? 0.15) * 1000) / 10;
  // A hero painted in their own cloak or long coat (arcane, veil, some suit B) wears the bought cape as a wider mantle
  // behind it, so its edges and hem show past the painted cloak (`CLOAK_CAPES`; off = named on the mirror only).
  const cloaked = !!anchor?.cape;
  const behind = outfit.layers.filter((layer) => layer.behind && !(layer.slot === "cape" && cloaked && !CLOAK_CAPES));
  const front = outfit.layers.filter((layer) => !layer.behind);
  const tint = outfit.tint;
  const lift = tint ? Math.round(0.3 * (1 - lum(tint)) * 100) / 100 : 0;
  const neckMask = `linear-gradient(to bottom, transparent ${neck - 1.5}%, #000 ${neck + 2.5}%)`;
  return (
    <span className={`inline-block max-w-none ${className}`} style={{ ...style, filter: rimFilter(glow, outfit.rim) }} data-outfit={tint ?? "painted"} data-layers={outfit.layers.map((l) => l.key).join(" ")}>
      <span className="relative block h-full" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
        {behind.map((layer) => (
          <PartArt key={layer.key} layer={layer} artKey={artKey} anchor={anchor} cloaked={cloaked} />
        ))}
        <img src={src} alt="" draggable={false} className="relative block h-full w-auto max-w-none" />
        {tint && <Dye src={src} id={`suit-${uid}`} tint={tint} strength={outfit.strength} lift={lift} mask={neckMask} data="suit" />}
        {front.map((layer) => (
          <PartArt key={layer.key} layer={layer} artKey={artKey} anchor={anchor} />
        ))}
      </span>
    </span>
  );
}

/**
 * The painting again, recoloured by an SVG filter: a luminance-preserving colour blend on the darker, painted cloth,
 * with a soft lift so black cloth takes the colour too; bright glows and highlights keep their paint. `mask` / `clip`
 * keep it to one region (the suit below the neck).
 */
function Dye({ src, id, tint, strength, lift, mask, clip, data }: { src: string; id: string; tint: string; strength: number; lift: number; mask?: string; clip?: string; data: string }) {
  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="lum" />
          <feComponentTransfer in="lum" result="dark">
            <feFuncA type="table" tableValues="1 1 0.75 0.3 0 0" />
          </feComponentTransfer>
          <feComposite in="dark" in2="SourceAlpha" operator="in" result="cloth" />
          <feFlood floodColor={tint} floodOpacity={strength} result="dye" />
          <feComposite in="dye" in2="cloth" operator="in" result="dyed" />
          <feBlend in="dyed" in2="SourceGraphic" mode="color" result="coloured" />
          <feFlood floodColor={tint} floodOpacity={lift} result="glow" />
          <feComposite in="glow" in2="cloth" operator="in" result="lifted" />
          <feBlend in="lifted" in2="coloured" mode="screen" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      <img
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 block size-full"
        style={{ filter: `url(#${id})`, maskImage: mask, WebkitMaskImage: mask, clipPath: clip }}
        data-dye={data}
        data-suit-tint={data === "suit" ? tint : undefined}
      />
    </>
  );
}

/**
 * One painted part. A layer painted for this exact figure (`cut-<hero>-part-<slot>-<kind>`, full frame, registered to
 * the cutout) wins; otherwise a generic painted part (`part-<slot>-<kind>`) fitted to the painting's anchors:
 * - capes behind the hero, the cape's measured shoulder band laid on the hero's measured shoulders (a touch wider),
 *   capped so the hem stops at the ankles;
 * - a belt or buckle across the waist, a badge or brand on the chest, a sash from one shoulder across to the other hip.
 * Nothing shows until a painting exists.
 */
function PartArt({ layer, artKey, anchor, cloaked = false }: { layer: PartLayer; artKey: string; anchor: HeroAnchor | null; cloaked?: boolean }) {
  const own = artKey ? `cut-${artKey.replace(/-s[1-4]$/, "")}-${layer.key}` : "";
  const ownArt = useArt(own && hasArt(own) ? own : "");
  const generic = useArt(!ownArt && hasArt(layer.key) ? layer.key : "");
  if (ownArt) return <img src={ownArt} alt="" draggable={false} className="pointer-events-none absolute inset-0 block size-full" data-part={own} />;
  if (!generic || !anchor) return null;
  const place = partPlace(layer.key, anchor, cloaked);
  if (!place) return null;
  return <img src={generic} alt="" draggable={false} className="pointer-events-none absolute block max-w-none" style={place} data-part={layer.key} />;
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

/** Where a generic part sits in a hero cutout's box (all fractions of that box), or null for parts with no generic fit. */
function partFit(key: string, a: HeroAnchor, cloaked = false): { left: number; top: number; width: number; height: number; rotate?: number } | null {
  const f = PART_FRAMES[key];
  if (!f) return null;
  const aspect = f.h / f.w; // part height per unit width (px)
  // Box height per unit part width, in box-height fractions: a part w wide (box fraction) is w * ar * aspect tall.
  const tall = (w: number) => w * a.ar * aspect;
  if (key.startsWith("part-cape-")) {
    const band = f.band ?? 0.07;
    const bandW = Math.max(0.2, (f.sr ?? 0.75) - (f.sl ?? 0.25));
    let width = (a.sw * 1.1) / bandW;
    const room = (a.bottom - a.sy) * 0.97;
    if (tall(width) * (1 - band) > room) width *= room / (tall(width) * (1 - band));
    const height = tall(width);
    // On a cloaked hero the mantle is drawn wider at the same length (the cloth fans out), so it clears the painted cloak.
    // Its hem also has to clear the painted cloak's own hem (`cl`..`cr`), so it is centred on the cloak and at least
    // a little wider than it.
    if (cloaked) {
      const cloak = a.cl != null && a.cr != null ? (a.cr - a.cl) * 1.12 : 0;
      width = Math.max(width, (a.sw * CLOAK_WIDEN) / bandW, cloak);
      const centre = a.cl != null && a.cr != null ? (a.cl + a.cr) / 2 : a.cx;
      return { left: centre - width / 2, top: a.sy - band * height - 0.004, width, height };
    }
    const mid = ((f.sl ?? 0.25) + (f.sr ?? 0.75)) / 2;
    return { left: a.cx - mid * width, top: a.sy - band * height - 0.004, width, height };
  }
  if (key === "part-emblem-belt" || key === "part-emblem-buckle") {
    const width = a.ww * (key === "part-emblem-belt" ? 1.1 : 1.0);
    const height = tall(width);
    return { left: a.wx - width / 2, top: a.wy - height / 2, width, height };
  }
  if (key === "part-emblem-badge" || key === "part-emblem-brand") {
    const width = a.sw * (key === "part-emblem-badge" ? 0.24 : 0.3);
    const height = tall(width);
    return { left: a.cx - width / 2, top: a.cy - height / 2, width, height };
  }
  if (key === "part-emblem-sash") {
    // From the shoulder line down to just past the belt; the painted strip runs corner to corner.
    const height = a.wy - a.sy + 0.05;
    const width = height / (a.ar * aspect);
    return { left: a.cx - width / 2, top: a.sy - 0.005, width, height };
  }
  return null;
}

function partPlace(key: string, a: HeroAnchor, cloaked = false): CSSProperties | null {
  const fit = partFit(key, a, cloaked);
  if (!fit) return null;
  // Front pieces pick up the painting's light a little: a soft contact shadow and slightly lowered brightness.
  const front = !key.startsWith("part-cape-");
  return {
    left: pct(fit.left),
    top: pct(fit.top),
    width: pct(fit.width),
    height: pct(fit.height),
    filter: front ? "brightness(0.86) saturate(0.92) drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.55))" : "brightness(0.9) drop-shadow(0 2px 4px rgb(0 0 0 / 0.5))",
  };
}
