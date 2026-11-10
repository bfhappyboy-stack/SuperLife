/**
 * Life Flow: "Your routine" on Life ▸ Today. Pin up to three everyday things; they fill every block of free
 * time you don't spend yourself when you tap Play. Empty = the game follows what you've been doing lately.
 */
import { Briefcase, Check, Heart, Repeat, X } from "lucide-react";
import { useState } from "react";
import { buzz } from "@/components/game/haptics";
import { ROUTINE_MAX, routineOptions } from "@/game/flow";
import { monthPlan } from "@/game/skip";
import { useGame } from "@/game/store";
import type { Game } from "@/game/types";

export function RoutineCard({ game }: { game: Game }) {
  const setRoutine = useGame((s) => s.setRoutine);
  const [edit, setEdit] = useState(false);
  const options = routineOptions(game);
  const label = (id: string) => options.find((o) => o.id === id)?.label ?? id;
  const pinned = (game.routine ?? []).filter((id) => options.some((o) => o.id === id));
  // With nothing pinned, show what Play will lean on (your habits).
  const auto = pinned.length ? [] : monthPlan(game).filter((r) => !r.id.startsWith("time:")).slice(0, ROUTINE_MAX).map((r) => r.id);
  const toggle = (id: string) => {
    buzz("tap");
    const cur = game.routine ?? [];
    setRoutine(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-ROUTINE_MAX));
  };
  return (
    <article className="card mt-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <Repeat className="size-4 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="t-label text-muted">Your routine</p>
          <p className="truncate text-sm font-bold text-fg">
            {(pinned.length ? pinned : auto).map(label).join(" · ") || "Live a little first"}
            {!pinned.length && auto.length > 0 && <span className="ml-1 text-[11px] font-semibold text-muted">(from your habits)</span>}
          </p>
        </div>
        <button type="button" aria-expanded={edit} onClick={() => setEdit(!edit)} className="btn btn-ghost !min-h-11 shrink-0 !px-3 text-xs">
          {edit ? <X className="size-4" aria-hidden /> : "Edit"}
        </button>
      </div>
      {edit && (
        <div className="anim-rise mt-2.5">
          <p className="text-xs text-muted">Pick up to {ROUTINE_MAX}, in order: habits, a shift at your business, time with someone. Play spends any free time you don&apos;t use on these. Fights, dates and big moves stay yours.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((o) => {
              const n = pinned.indexOf(o.id);
              const on = n >= 0;
              return (
                <button key={o.id} type="button" aria-pressed={on} onClick={() => toggle(o.id)} className={`chip !min-h-11 !px-3 text-xs ${on ? "!border-gold/70 !bg-gold/15 text-fg" : "text-muted"}`}>
                  {on ? <span className="t-num grid size-4 place-items-center rounded-full bg-gold text-[10px] text-ink">{n + 1}</span> : <Check className="size-3 opacity-30" aria-hidden />}
                  {o.kind === "work" && <Briefcase className="size-3 text-gold" aria-hidden />}
                  {o.kind === "people" && <Heart className="size-3 text-cape" aria-hidden />}
                  {o.label}
                </button>
              );
            })}
          </div>
          {pinned.length > 0 && (
            <button type="button" onClick={() => setRoutine([])} className="mt-2 text-xs font-bold text-muted underline">
              Clear: follow my habits
            </button>
          )}
        </div>
      )}
    </article>
  );
}
