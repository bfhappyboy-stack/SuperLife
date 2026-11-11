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
