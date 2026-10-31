/**
 * Shared shell for every skill minigame: kind badge, title, rule line, round pips, an arena that
 * fills the screen, a ready/go intro, and a graded result stamp. Each game only draws its arena.
 */
import type React from "react";
import type { ReactNode } from "react";
import { HitBurst } from "@/components/game/Vfx";
import { clampDifficulty, gradeOf, KIND_ICON, skinColor, type Mark } from "@/components/game/miniUtil";
import { MINI_KINDS, type SkillKind } from "@/game/minis";
import type { MinigameSpec } from "@/game/types";

export function Pips({ marks, current }: { marks: Mark[]; current: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {marks.map((mark, index) => (
        <span
          key={index}
          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${mark === "perfect" ? "bg-gold shadow-[0_0_10px_var(--color-gold)]" : mark === "good" ? "bg-spark" : mark === "miss" ? "bg-bad" : index === current ? "animate-pulse bg-fg/80" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
}

/** Kind badge, difficulty pips, title and subtitle. */
export function MiniHead({ spec, kind }: { spec: MinigameSpec; kind: SkillKind }) {
  const def = MINI_KINDS[kind];
  const Icon = KIND_ICON[kind];
  const difficulty = clampDifficulty(spec.difficulty);
  return (
    <div className="anim-rise flex items-start gap-3">
        <span className="ico-tile mt-0.5 size-11 shrink-0" style={{ "--tile": def.color } as React.CSSProperties}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-label flex items-center gap-2" style={{ color: def.color }}>
            {def.name}
            <span className="flex gap-0.5" aria-label={`Difficulty ${difficulty} of 3`}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`size-1.5 rounded-full ${n <= difficulty ? "bg-current" : "bg-white/15"}`} />
              ))}
            </span>
          </p>
          <p className="t-display truncate text-fg">{spec.title}</p>
          {spec.subtitle && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{spec.subtitle}</p>}
        </div>
      </div>
  );
}

export function MiniFrame({
  spec,
  kind,
  note,
  pips,
  hud,
  intro,
  result,
  children,
  footer,
  shake = 0,
}: {
  spec: MinigameSpec;
  kind: SkillKind;
  note?: string;
  pips?: ReactNode;
  hud?: ReactNode;
  intro?: boolean;
  result: number | null;
  children: ReactNode;
  footer?: ReactNode;
  shake?: number;
}) {
  const def = MINI_KINDS[kind];
  const accent = skinColor(spec, kind);
  const grade = result == null ? null : gradeOf(result);
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden px-4 pt-2 pb-4" style={{ "--mini": accent } as React.CSSProperties}>
      <MiniHead spec={spec} kind={kind} />
      <p role="status" className="min-h-5 text-[13px] font-semibold text-gold">{note ?? def.how}</p>
      {pips}
      <div
        key={shake ? `s${shake}` : "arena"}
        className={`scene-arena relative min-h-0 flex-1 overflow-hidden rounded-[1.6rem] border border-white/10 ${shake ? "anim-shake" : ""}`}
        style={{ boxShadow: `inset 0 0 60px -20px ${accent}, 0 18px 40px -24px rgba(0,0,0,.8)` }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(90% 60% at 50% 100%, color-mix(in srgb, ${accent} 22%, transparent), transparent 70%)` }} />
        {hud && <div className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">{hud}</div>}
        {children}
        {intro === false && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-ink/40">
            <span className="stamp-in rounded-2xl bg-paper px-5 py-1 font-display text-4xl tracking-wide text-paper-ink shadow-xl">READY</span>
          </div>
        )}
        {grade && (
          <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-ink/55 backdrop-blur-[2px]">
            <div className="relative grid place-items-center">
              <HitBurst color={grade.color} size={160} count={grade.tone === "lose" ? 0 : 14} seed={Math.round((result ?? 0) * 100)} />
              <span className="stamp-in rounded-2xl px-5 py-1.5 font-display text-5xl tracking-wide shadow-2xl" style={{ background: grade.color, color: grade.tone === "lose" ? "#fff" : "#1c140e" }}>
                {grade.label}
              </span>
              <span className="t-num mt-3 rounded-full bg-black/50 px-3 py-0.5 text-sm text-fg">{Math.round((result ?? 0) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
