/**
 * Battle HUD pieces shared by the life-sim duel and Arena (DESIGN §17 Stage 2):
 * status pills, the mix-up combo pips, the habit warning, and the BURST / FINISHER cinematic beat.
 */
import type React from "react";
import { Eye, Flame, ShieldPlus, Snowflake, Sparkles, Shield, Swords, Zap } from "lucide-react";
import { COMBO_LEN, STATUSES, type StatusInst } from "@/game/battle";
import type { MoveStyle, StatusId } from "@/game/types";

const STATUS_ICON: Record<StatusId, typeof Flame> = {
  burn: Flame,
  frost: Snowflake,
  shock: Zap,
  expose: Eye,
  ward: ShieldPlus,
};

const STYLE_HEX: Record<MoveStyle, string> = { strike: "#ff5a4f", guard: "#3fe0c5", trick: "#ffcf4d" };
const STYLE_ICON: Record<MoveStyle, typeof Swords> = { strike: Swords, guard: Shield, trick: Sparkles };

export function StatusIcon({ id, className = "size-3" }: { id: StatusId; className?: string }) {
  const Icon = STATUS_ICON[id];
  return <Icon className={className} style={{ color: STATUSES[id].color }} aria-hidden />;
}

/** Small pills under an HP bar: icon + turns left. Keeps a fixed height so the HUD never jumps. */
export function StatusPills({ list, right = false }: { list: readonly StatusInst[] | undefined; right?: boolean }) {
  const items = list ?? [];
  return (
    <div className={`mt-0.5 flex h-4 items-center gap-1 ${right ? "justify-end" : ""}`} aria-live="polite">
      {items.map((s) => {
        const def = STATUSES[s.id];
        return (
          <span
            key={s.id}
            className="anim-pop inline-flex h-4 items-center gap-0.5 rounded-full px-1.5 text-[10px] leading-none font-extrabold"
            style={{ background: `color-mix(in srgb, ${def.color} 20%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${def.color} 60%, transparent)`, color: def.color }}
            title={`${def.title}: ${def.blurb}`}
          >
            <StatusIcon id={s.id} className="size-3" />
            <span className="text-fg">{def.title}</span>
            <span className="t-num opacity-80">{s.turns}</span>
            <span className="sr-only">
              {def.title}, {def.blurb}, {s.turns} turns left
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Three pips that fill with the style of each won edge. Lives inside the stage, top-left. */
export function ComboPips({ chain, className = "" }: { chain: readonly MoveStyle[] | undefined; className?: string }) {
  const c = chain ?? [];
  return (
    <div className={`pointer-events-none flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur-[2px] ${className}`} aria-label={`Combo ${c.length} of ${COMBO_LEN}`} role="img">
      <span className="t-label text-[9px] text-white/80">Combo</span>
      {Array.from({ length: COMBO_LEN }, (_, i) => {
        const style = c[i];
        const Icon = style ? STYLE_ICON[style] : null;
        return (
          <span
            key={i}
            className={`grid size-4 place-items-center rounded-full transition-all duration-300 ${style ? "scale-110" : ""}`}
            style={{ background: style ? STYLE_HEX[style] : "rgb(255 255 255 / 0.14)", boxShadow: style ? `0 0 8px ${STYLE_HEX[style]}` : undefined }}
          >
            {Icon && <Icon className="size-2.5 text-ink" aria-hidden />}
          </span>
        );
      })}
    </div>
  );
}

/** The cinematic beat for a Burst or a combo Finisher: a slash of colour and a word, ~0.9s. */
export function StrikeBanner({ word, sub, color }: { word: string; sub?: string; color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-hidden" aria-hidden>
      <span className="battle-slash absolute inset-x-[-20%] top-1/2 h-16 -translate-y-1/2" style={{ "--slash": color } as React.CSSProperties} />
      <span className="battle-word relative flex flex-col items-center">
        <span className="font-display text-[44px] leading-none tracking-wide text-white" style={{ textShadow: `0 3px 0 rgba(0,0,0,.65), 0 0 22px ${color}` }}>
          {word}
        </span>
        {sub && (
          <span className="t-label mt-0.5 text-[10px]" style={{ color }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}
