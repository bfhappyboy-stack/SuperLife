/**
 * Painted character art for lives that aren't God Mode legends (2026-11-11 art pass).
 * Mystery heroes (and hero-side NPC fighters) stand in the ring as a painted card picked by their power family and
 * sex, in the same style as the legend and villain paintings. Kids under 16 keep the paper doll until the suit fits.
 * `ART_HEROES` turns the whole layer off and restores the old figures.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { useArt } from "@/components/game/Scene";
import { anchorOf, type Outfit, type PartLayer } from "@/game/outfit";
import type { HeroAnchor } from "@/game/heroAnchors";
import type { Pose } from "@/components/game/Figure";
import { hasArt } from "@/assets/art";
import { mysteryKey, stageKeys, suitKeys, type Suit } from "@/game/heroArt";
import type { CapeFamily } from "@/game/theme";
import type { Sex } from "@/game/types";

export { familyOfPower } from "@/game/heroArt";

/** Art key for a painted Mystery hero card that exists in the asset table (suit B first when worn and painted), or "". */
export function mysteryArtKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30, suit?: Suit | null): string {
  return suitKeys(mysteryKey(family, sex, age), suit).find((key) => hasArt(key)) ?? "";
}

/** Stage cutout key (no `cut-` prefix) for your Mystery hero from 13 that exists in the asset table: a teen painting at 13-15, suit B first, or "". */
export function stageArtKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30, suit?: Suit | null): string {
  return stageKeys(family, sex, age, suit).find((key) => hasArt(`cut-${key}`)) ?? "";
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
  const behind = outfit.layers.filter((layer) => layer.behind && !(layer.slot === "cape" && anchor?.cape));
  const front = outfit.layers.filter((layer) => !layer.behind);
  const tint = outfit.tint;
  const lift = tint ? Math.round(0.3 * (1 - lum(tint)) * 100) / 100 : 0;
  const neckMask = `linear-gradient(to bottom, transparent ${neck - 1.5}%, #000 ${neck + 2.5}%)`;
  return (
    <span className={`inline-block max-w-none ${className}`} style={{ ...style, filter: rimFilter(glow, outfit.rim) }} data-outfit={tint ?? "painted"} data-layers={outfit.layers.map((l) => l.key).join(" ")}>
      <span className="relative block h-full" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
        {behind.map((layer) => (
          <PartArt key={layer.key} layer={layer} artKey={artKey} anchor={anchor} />
        ))}
        <img src={src} alt="" draggable={false} className="relative block h-full w-auto max-w-none" />
        {tint && (
          <>
            <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
              <filter id={`suit-${uid}`} colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
                <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="lum" />
                <feComponentTransfer in="lum" result="dark">
                  <feFuncA type="table" tableValues="1 1 0.75 0.3 0 0" />
                </feComponentTransfer>
                <feComposite in="dark" in2="SourceAlpha" operator="in" result="cloth" />
                <feFlood floodColor={tint} floodOpacity={outfit.strength} result="dye" />
                <feComposite in="dye" in2="cloth" operator="in" result="dyed" />
                <feBlend in="dyed" in2="SourceGraphic" mode="color" result="coloured" />
                <feFlood floodColor={tint} floodOpacity={lift} result="glow" />
                <feComposite in="glow" in2="cloth" operator="in" result="lifted" />
                <feBlend in="lifted" in2="coloured" mode="screen" result="lit" />
                <feComposite in="lit" in2="SourceAlpha" operator="in" />
              </filter>
            </svg>
            <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 block size-full" style={{ filter: `url(#suit-${uid})`, maskImage: neckMask, WebkitMaskImage: neckMask }} data-suit-tint={tint} />
          </>
        )}
        {front.map((layer) => (
          <PartArt key={layer.key} layer={layer} artKey={artKey} anchor={anchor} />
        ))}
      </span>
    </span>
  );
}

/**
 * One painted part. A layer painted for this exact figure (`cut-<hero>-part-<slot>-<kind>`, full frame, registered to
 * the cutout) wins; otherwise a generic painted part (`part-<slot>-<kind>`) placed on the painting's anchors. Nothing
 * shows until a painting exists.
 */
function PartArt({ layer, artKey, anchor }: { layer: PartLayer; artKey: string; anchor: HeroAnchor | null }) {
  const own = artKey ? `cut-${artKey}-${layer.key}` : "";
  const ownArt = useArt(own && hasArt(own) ? own : "");
  const generic = useArt(!ownArt && hasArt(layer.key) ? layer.key : "");
  if (ownArt) return <img src={ownArt} alt="" draggable={false} className="pointer-events-none absolute inset-0 block size-full" data-part={own} />;
  if (!generic) return null;
  const a = anchor ?? { top: 0, bottom: 1, neck: 0.15, shoulder: 0.2, sl: 0.3, sr: 0.7, hx: 0.5 };
  const span = Math.max(0.2, a.sr - a.sl);
  const place: Record<PartLayer["anchor"], CSSProperties> = {
    // Generic capes are painted with the shoulder line at 10% height across the middle 40% of the canvas (IMAGES.md).
    back: { left: `${(a.sl - span * 0.75) * 100}%`, width: `${span * 250}%`, top: `${a.shoulder * 100}%`, transform: "translateY(-10%)" },
    chest: { left: `${a.hx * 100}%`, width: `${span * 34}%`, top: `${(a.shoulder + (a.bottom - a.top) * 0.07) * 100}%`, transform: "translate(-50%, -50%)" },
    waist: { left: `${a.hx * 100}%`, width: `${span * 80}%`, top: `${(a.top + (a.bottom - a.top) * 0.43) * 100}%`, transform: "translate(-50%, -50%)" },
    face: { display: "none" },
    hands: { display: "none" },
    feet: { display: "none" },
  };
  return <img src={generic} alt="" draggable={false} className="pointer-events-none absolute block h-auto max-w-none" style={{ ...place[layer.anchor], mixBlendMode: layer.anchor === "chest" ? "normal" : undefined }} data-part={layer.key} />;
}
