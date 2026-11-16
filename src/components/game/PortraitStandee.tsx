/**
 * Painted portrait posters (2026-11-16 night): a life with no suit painting to wear (a kid under 13 with a fresh power,
 * a powerless life, a saved Arena life with no power family) stands in as their own painted portrait in a lit fighter
 * card, instead of the drawn paper doll or the drawn silhouette poster. Painted art only: the same face the header, the
 * Closet mirror and the "Your call" scene show (creator picks included), feathered into a night city and lit in the
 * power colour. `PORTRAIT_STANDEES` (src/game/heroArt.ts) is the off switch.
 */
import { PhotoFace } from "@/components/game/PhotoFace";
import { useArt } from "@/components/game/Scene";
import { resolveLook } from "@/game/look";
import type { Look, Sex } from "@/game/types";

export function PortraitPoster({
  seed,
  age,
  sex,
  look,
  accent,
  city,
  mine = false,
  head = false,
}: {
  seed: number;
  age: number;
  sex: Sex;
  look?: Partial<Look> | null;
  accent: string;
  /** A city painting key for the backdrop (optional). */
  city?: string;
  /** Your own life: creator face features (scar, freckles, eyes) apply, as on every other painted portrait of you. */
  mine?: boolean;
  /** Small square avatars: the portrait fills the tile. */
  head?: boolean;
}) {
  const cityArt = useArt(city ?? "");
  const face = resolveLook(seed, look);
  const feature = mine && look && typeof look.feature === "number" ? look.feature : null;
  const eyes = mine && look && typeof look.eyes === "number" ? look.eyes : null;
  const dark = <span className="photo-wait block size-full bg-[#141a26]" aria-hidden />;
  return (
    <span className="absolute inset-0 block overflow-hidden bg-[#0b0f18]" data-portrait-poster aria-hidden>
      {cityArt && <img src={cityArt} alt="" draggable={false} className="anim-fade absolute inset-0 size-full object-cover opacity-25 saturate-[.5] blur-[1px]" />}
      <span className="absolute inset-0" style={{ background: `radial-gradient(85% 55% at 50% 30%, color-mix(in srgb, ${accent} 45%, transparent), transparent 72%), linear-gradient(180deg, rgb(11 15 24 / .2), rgb(11 15 24 / .6) 62%, rgb(11 15 24 / .85) 100%)` }} />
      <span
        className={`absolute inset-x-0 top-0 block ${head ? "h-full" : "aspect-square"}`}
        style={head ? undefined : { maskImage: "linear-gradient(180deg, #000 58%, transparent 97%)", WebkitMaskImage: "linear-gradient(180deg, #000 58%, transparent 97%)" }}
      >
        <PhotoFace seed={seed} age={age} sex={sex} look={face} feature={feature} eyes={eyes} className="size-full !rounded-none" fallback={dark} />
      </span>
      {/* The power stirring below the frame: a low glow in the power colour lifts the empty foot of the card. */}
      {!head && <span className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `radial-gradient(80% 70% at 50% 100%, color-mix(in srgb, ${accent} 60%, transparent), color-mix(in srgb, ${accent} 12%, transparent) 55%, transparent 80%)` }} />}
      {/* Rim light in the power colour, the way the suit cutouts are lit. */}
      <span className="absolute inset-0" style={{ boxShadow: `inset 0 0 22px -6px ${accent}` }} />
    </span>
  );
}
