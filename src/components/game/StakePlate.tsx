/**
 * Stakes plate (2026-11-21 night): the skewed metal plate from the Arena's round slam and match verdict, shared with
 * the "Your call" crime scenes and the Duel K.O. card so every fight beat speaks the same visual language.
 * Non-character graphic (CSS); no faces. `STAKE_PLATES` off = the scene without a plate and the old flat K.O. label.
 */
import type { Plate, PlateTone } from "@/game/verdicts";

export const STAKE_PLATES = true;

const PLATE_TONE: Record<PlateTone, string> = { gold: "#ffcf4d", red: "#ff5a4f", steel: "#c9d6e8" };

export function StakePlate({ plate, className = "", delay = 0, streak = false, compact = false }: { plate: Plate; className?: string; delay?: number; streak?: boolean; compact?: boolean }) {
  return (
    <div className={`stake-plate relative flex flex-col items-center ${className}`} data-plate={plate.key} data-tone={plate.tone} style={{ "--ko": PLATE_TONE[plate.tone], "--plate-delay": `${delay}ms` } as React.CSSProperties}>
      {streak && <span className="stake-plate-streak" aria-hidden />}
      <span className={`stake-plate-tag t-label relative ${compact ? "is-compact" : ""}`}>{plate.label}</span>
      <span className={`stake-plate-line relative mt-1 px-4 text-center font-bold ${compact ? "text-[11px]" : "text-xs"}`}>{plate.line}</span>
    </div>
  );
}
