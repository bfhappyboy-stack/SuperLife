/**
 * Painted character art for lives that aren't God Mode legends (2026-11-11 art pass).
 * Mystery heroes (and hero-side NPC fighters) stand in the ring as a painted card picked by their power family and
 * sex, in the same style as the legend and villain paintings. Kids under 16 keep the paper doll until the suit fits.
 * `ART_HEROES` turns the whole layer off and restores the old figures.
 */
import type { ReactNode } from "react";
import type { Pose } from "@/components/game/Figure";
import { hasArt } from "@/assets/art";
import { mysteryKey } from "@/game/heroArt";
import type { CapeFamily } from "@/game/theme";
import type { Sex } from "@/game/types";

export { familyOfPower } from "@/game/heroArt";

/** Art key for a painted Mystery hero that exists in the asset table, or "". */
export function mysteryArtKey(family: CapeFamily | null | undefined, sex: Sex | undefined, age = 30): string {
  const key = mysteryKey(family, sex, age);
  return key && hasArt(key) ? key : "";
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
 */
export function Cutout({ src, name, glow, pose, flip }: { src: string; name: string; glow: string; pose: Pose; flip?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-end justify-center" role="img" aria-label={name}>
      <span className="cut-shadow pointer-events-none absolute bottom-[1%] left-1/2 h-[9%] w-[78%] -translate-x-1/2 rounded-[50%]" style={{ background: `radial-gradient(closest-side, rgb(0 0 0 / 0.75), color-mix(in srgb, ${glow} 25%, transparent) 70%, transparent)` }} aria-hidden />
      <img
        src={src}
        alt=""
        draggable={false}
        className={`cut-fig relative h-[96%] w-auto max-w-none object-contain object-bottom ${pose === "idle" || pose === "stand" ? "cut-breathe" : ""} ${pose === "hit" ? "cut-hit" : ""} ${pose === "attack" ? "cut-attack" : ""} ${pose === "ko" ? "cut-ko" : ""} ${pose === "guard" ? "cut-guard" : ""}`}
        style={{ transform: flip ? "scaleX(-1)" : undefined, filter: `drop-shadow(0 0 1.5px color-mix(in srgb, ${glow} 85%, white)) drop-shadow(0 0 10px color-mix(in srgb, ${glow} 45%, transparent))` }}
      />
    </div>
  );
}
