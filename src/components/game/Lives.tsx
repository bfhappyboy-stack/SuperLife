import { ArrowLeft, Clock, Crown, Plus, Skull, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { LegendThumb, SealedOrb } from "@/components/game/Legends";
import { Portrait } from "@/components/game/Portrait";
import { TitleArt } from "@/components/game/Scene";
import { presetById } from "@/game/presets";
import { SLOT_COUNT, type SlotSummary } from "@/game/save";
import { useGame } from "@/game/store";
import type { CSSProperties } from "react";

const MODE_STYLE: Record<NonNullable<SlotSummary["modeKind"]>, { color: string; icon: typeof Sparkles }> = {
  mystery: { color: "#e6b34d", icon: Sparkles },
  legend: { color: "#a78bfa", icon: Crown },
  own: { color: "#4dd8ff", icon: Wand2 },
  classic: { color: "#9aa3b8", icon: Sparkles },
};

/** "Just now", "12 min ago", "Yesterday", "3 days ago", then a date. */
function playedAgo(at: number | undefined, now = Date.now()): string {
  if (!at) return "Not played yet";
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function LivesScreen() {
  const lives = useGame((s) => s.lives);
  const active = useGame((s) => s.slot);
  const toTitle = useGame((s) => s.toTitle);
  const playSlot = useGame((s) => s.playSlot);
  const newLifeIn = useGame((s) => s.newLifeIn);
  const removeLife = useGame((s) => s.removeLife);
  const [confirm, setConfirm] = useState<SlotSummary | null>(null);
  const used = lives.filter((row) => !row.empty).length;
  const rows = lives.length ? lives : Array.from({ length: SLOT_COUNT }, (_, i) => ({ slot: i + 1, empty: true }) as SlotSummary);
  // Most recently played first; empty slots after, in slot order.
  const sorted = [...rows].sort((a, b) => (a.empty === b.empty ? (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0) || a.slot - b.slot : a.empty ? 1 : -1));

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <TitleArt className="pointer-events-none absolute inset-0 size-full object-cover opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
      <header className="relative flex shrink-0 items-center gap-2 px-4 pt-4">
        <button type="button" onClick={toTitle} aria-label="Back to title" className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="t-label text-[10px] text-muted">SAVE SLOTS</p>
          <h1 className="t-display !text-[2rem] leading-none text-fg">Your lives</h1>
        </div>
        <span className="chip shrink-0 text-fg" aria-label={`${used} of ${SLOT_COUNT} slots used`}>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: SLOT_COUNT }, (_, i) => (
              <span key={i} className={`inline-block size-1.5 rounded-full ${i < used ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : "bg-white/20"}`} />
            ))}
          </span>
          <span className="t-num">{used}/{SLOT_COUNT}</span>
        </span>
      </header>
      <p className="relative mt-2 shrink-0 px-5 text-sm text-muted">Up to five lives at once. Each one saves on its own and never touches the others.</p>
      <ol className="stagger relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-24">
        {sorted.map((row) => (
          <li key={row.slot}>{row.empty ? <EmptySlot row={row} onNew={() => newLifeIn(row.slot)} /> : <LifeCard row={row} current={row.slot === active} onPlay={() => playSlot(row.slot)} onDelete={() => setConfirm(row)} />}</li>
        ))}
      </ol>
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="del-title" onClick={(event) => event.target === event.currentTarget && setConfirm(null)}>
          <div className="card-glass anim-rise w-full max-w-[28rem] px-5 py-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center gap-3">
              <SlotFace row={confirm} className="size-14 rounded-2xl" />
              <div className="min-w-0">
                <p className="t-label text-[10px] text-bad">DELETE THIS LIFE?</p>
                <h2 id="del-title" className="truncate text-lg font-extrabold text-fg">{confirm.name}</h2>
                <p className="truncate text-xs text-muted">Age {confirm.age} · {confirm.mode}</p>
              </div>
            </div>
            <p className="mt-3 text-pretty text-sm text-fg/90">This can&apos;t be undone. Slot {confirm.slot} will be empty and your other lives stay exactly as they are.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="btn btn-ghost min-h-13 flex-1 text-base">
                Keep it
              </button>
              <button
                type="button"
                onClick={() => {
                  removeLife(confirm.slot);
                  setConfirm(null);
                }}
                className="btn btn-primary min-h-13 flex-1 text-base"
                style={{ "--color-cape": "#d23a32" } as CSSProperties}
              >
                <Trash2 className="size-4" aria-hidden /> Delete life
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SlotFace({ row, className }: { row: SlotSummary; className: string }) {
  const legend = row.preset ? presetById(row.preset as never) : undefined;
  if (legend) return <LegendThumb legend={legend} className={`${className} border border-white/15`} />;
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden bg-panel-2 ${className}`}>
      <Portrait seed={row.portrait ?? 1} age={row.age ?? 0} powerId={row.powerId} rank={row.rank} mood={row.dead ? 30 : row.mood} sex={row.sex} look={row.look} className="block size-full" />
    </span>
  );
}

function LifeCard({ row, current, onPlay, onDelete }: { row: SlotSummary; current: boolean; onPlay: () => void; onDelete: () => void }) {
  const style = MODE_STYLE[row.modeKind ?? "classic"];
  const Icon = row.dead ? Skull : style.icon;
  return (
    <article className="card relative overflow-hidden" style={{ borderColor: `${style.color}${current ? "cc" : "55"}` }}>
      <div className="pointer-events-none absolute -top-10 -left-10 size-36 rounded-full opacity-35 blur-2xl" style={{ background: style.color }} />
      <button type="button" onClick={onPlay} className="relative flex w-full items-center gap-3 px-3 pt-3 pb-2.5 text-left" aria-label={`${row.dead ? "Read" : "Continue"} ${row.name}, age ${row.age}, ${row.mode}`}>
        <span className={`relative shrink-0 ${row.dead ? "grayscale-[60%]" : ""}`}>
          <SlotFace row={row} className="size-[4.5rem] rounded-2xl" />
          <span className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full border-2 border-ink text-ink shadow" style={{ background: row.dead ? "#9aa3b8" : style.color }}>
            <Icon className="size-3.5" aria-hidden />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="t-label text-[9px]" style={{ color: style.color }}>
              {row.mode}
            </span>
            {current && <span className="t-label rounded-full bg-gold/20 px-1.5 py-0.5 text-[8px] text-gold">LAST PLAYED</span>}
          </span>
          <span className="block truncate text-[19px] leading-tight font-extrabold text-fg">{row.name}</span>
          <span className="block truncate text-xs font-semibold text-muted">
            {row.dead ? `Died at ${row.age}${row.score != null ? ` · score ${row.score}` : ""}` : `Age ${row.age} · ${row.city}`}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <Clock className="size-3" aria-hidden /> {playedAgo(row.lastPlayed)}
          </span>
        </span>
        <span className="t-display shrink-0 !text-[2.4rem] leading-none text-white/10" aria-hidden>
          {row.slot}
        </span>
      </button>
      <div className="relative flex gap-2 border-t border-white/8 px-3 py-2">
        <button type="button" onClick={onPlay} className="btn btn-gold !min-h-11 flex-1 text-sm">
          {row.dead ? "Read the obituary" : "Continue"}
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${row.name}`} className="btn btn-ghost !min-h-11 !w-12 !px-0 text-muted">
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

function EmptySlot({ row, onNew }: { row: SlotSummary; onNew: () => void }) {
  return (
    <button type="button" onClick={onNew} className="group relative flex w-full items-center gap-3 rounded-[22px] border border-dashed border-white/20 bg-white/[0.03] px-3 py-3 text-left transition-colors active:bg-white/[0.07]" aria-label={`Start a new life in slot ${row.slot}`}>
      <span className="relative grid size-[4.5rem] shrink-0 place-items-center rounded-2xl bg-ink/60">
        <SealedOrb className="size-12 opacity-50 transition-opacity group-active:opacity-90" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-label block text-[9px] text-muted">SLOT {row.slot} · EMPTY</span>
        <span className="block text-base font-extrabold text-fg">Start a new life</span>
        <span className="block text-xs text-muted">Mystery, a legend, or build your own.</span>
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
        <Plus className="size-5" aria-hidden />
      </span>
    </button>
  );
}
