import { AlertTriangle, BookOpen, CalendarRange, FastForward as FfIcon, HeartCrack, HeartPulse, Scale, Sparkles, Swords, Target, X, Zap } from "lucide-react";
import { STAT_COLOR, STAT_ICON } from "@/components/game/icons";
import { MONTHS, money } from "@/game/format";
import { skipMonths } from "@/game/skip";
import { useGame } from "@/game/store";
import type { Game, SkipReport, SkipSpan, SkipStopKind } from "@/game/types";
import type { CSSProperties } from "react";

const STOP: Record<SkipStopKind, { label: string; icon: typeof Zap; color: string }> = {
  reveal: { label: "Your power is waking", icon: Sparkles, color: "#e6b34d" },
  story: { label: "A story beat", icon: BookOpen, color: "#a78bfa" },
  chapter: { label: "New chapter", icon: BookOpen, color: "#e6b34d" },
  case: { label: "A case needs you", icon: Target, color: "#4dd8ff" },
  event: { label: "Your call", icon: Scale, color: "#ffc94d" },
  fight: { label: "A fight", icon: Swords, color: "#ef5d52" },
  health: { label: "Low health", icon: HeartPulse, color: "#ff5d6c" },
  bond: { label: "Relationship crisis", icon: HeartCrack, color: "#ff8fd0" },
  death: { label: "The end", icon: AlertTriangle, color: "#9aa3b8" },
};

const STAT_KEY: Record<string, string> = { powerLevel: "power", happiness: "happiness", health: "health", smarts: "smarts", looks: "looks", fame: "fame", reputation: "reputation", money: "money" };

const when = (at: { age: number; month: number }) => `${MONTHS[at.month ?? 0]?.slice(0, 3) ?? ""} · age ${at.age}`;

/** Bottom sheet with the two fast-forward lengths. Explains what it does and when it stops. */
export function SkipSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const skip = useGame((s) => s.skip);
  const go = (span: SkipSpan) => {
    onClose();
    skip(span);
  };
  const toBirthday = skipMonths(game, "year");
  const options: { span: SkipSpan; title: string; detail: string; months: number }[] = [
    { span: "season", title: "Skip a season", detail: "3 months", months: 3 },
    { span: "year", title: `Skip to age ${game.age + 1}`, detail: `${toBirthday} month${toBirthday === 1 ? "" : "s"}`, months: toBirthday },
  ];
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fast-forward" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card-glass anim-rise w-full max-w-[28rem] px-4 pt-3 pb-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between">
          <div>
            <p className="t-label text-[10px] text-gold">FAST-FORWARD</p>
            <h2 className="t-display !text-[1.9rem] leading-none text-fg">Let time pass</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="btn btn-ghost !min-h-11 !w-11 !p-0">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-pretty text-sm text-fg/85">Plays your usual months for you, leaning on what you&apos;ve been doing lately. Fights, stunts and big choices stay yours.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map((row, i) => (
            <button key={row.span} type="button" onClick={() => go(row.span)} className={`btn ${i === 1 ? "btn-gold" : "btn-ghost"} min-h-[5.5rem] flex-col !items-start !gap-1 !px-3.5 text-left`}>
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] uppercase opacity-80">
                {i === 0 ? <CalendarRange className="size-3.5" aria-hidden /> : <FfIcon className="size-3.5" aria-hidden />}
                {row.detail}
              </span>
              <span className="text-base leading-tight font-extrabold">{row.title}</span>
              <span className="flex gap-0.5" aria-hidden>
                {Array.from({ length: Math.min(12, row.months) }, (_, n) => (
                  <span key={n} className={`inline-block h-1 w-2 rounded-full ${i === 1 ? "bg-ink/40" : "bg-white/30"}`} />
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="t-label mt-4 text-[10px] text-muted">Stops by itself for</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(["reveal", "story", "chapter", "case", "event", "health", "bond"] as const).map((kind) => {
            const Icon = STOP[kind].icon;
            return (
              <span key={kind} className="chip !py-1 text-[11px] text-fg">
                <Icon className="size-3" style={{ color: STOP[kind].color }} aria-hidden /> {STOP[kind].label}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">Skipped months are quieter and a touch less sharp than playing them yourself, so it saves taps, not effort.</p>
      </div>
    </div>
  );
}

/** The montage card shown after a fast-forward: how long passed, what you did, what changed, and why it stopped. */
export function SkipSummary({ game }: { game: Game }) {
  const close = useGame((s) => s.closeSkip);
  const skip = useGame((s) => s.skip);
  const report = game.skipReport;
  if (!report || game.phase === "mini") return null;
  const stop = report.stop ? STOP[report.stop.kind] : null;
  const StopIcon = stop?.icon;
  const done = report.months >= report.planned && !report.stop;
  const canAgain = !report.stop && game.phase === "live" && !game.reveal && !game.chapterNotice;
  const title = report.months === 0 ? "Hold on" : done ? (report.span === "year" ? `Age ${report.to.age}` : "A season passes") : `${report.months} month${report.months === 1 ? "" : "s"} later`;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fast-forward summary">
      <div className="card-glass anim-pop max-h-[92%] w-full max-w-[380px] overflow-y-auto px-5 pt-5 pb-5" style={stop ? ({ borderColor: `${stop.color}99` } as CSSProperties) : undefined}>
        <p className="t-label flex items-center gap-1.5 text-[10px] text-gold">
          <FfIcon className="size-3.5" aria-hidden /> FAST-FORWARD · {report.span === "season" ? "SEASON" : "TO BIRTHDAY"}
        </p>
        <h2 className="t-display mt-1 !text-[2.3rem] leading-none text-fg">{title}</h2>
        <MonthTrack report={report} />
        {report.stop && stop && StopIcon && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border px-3 py-2.5" style={{ borderColor: `${stop.color}66`, background: `${stop.color}14` }}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `${stop.color}33`, color: stop.color }}>
              <StopIcon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="t-label block text-[10px]" style={{ color: stop.color }}>
                Stopped · {stop.label}
              </span>
              <span className="line-clamp-3 block text-sm font-semibold text-fg">{report.stop.text}</span>
            </span>
          </div>
        )}
        {report.stats.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {report.stats.slice(0, 9).map((row) => {
              const key = STAT_KEY[row.stat] ?? row.stat;
              const Icon = STAT_ICON[key] ?? Zap;
              const color = STAT_COLOR[key] ?? "#c59bff";
              const up = row.amount > 0;
              const shown = row.stat === "money" ? money(Math.abs(row.amount)) : row.stat === "powerLevel" ? Math.abs(row.amount).toFixed(2) : Math.round(Math.abs(row.amount));
              return (
                <div key={row.stat} className="rounded-xl border border-white/8 bg-white/[0.04] px-2 py-1.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-muted">
                    <Icon className="size-3" style={{ color }} aria-hidden /> {row.label}
                  </span>
                  <span className={`t-num block text-base font-black ${up ? "text-good" : "text-bad"}`}>
                    {up ? "+" : "−"}
                    {shown}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {report.ranks.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {report.ranks.map((row) => (
              <li key={row.name} className="flex items-center gap-2 text-sm text-fg">
                <Zap className="size-3.5 text-gold" aria-hidden />
                <span className="font-bold">{row.name}</span>
                <span className="text-muted">rank</span>
                <span className="t-num font-black text-muted">{row.from}</span>→<span className="t-num font-black text-gold">{row.to}</span>
              </li>
            ))}
          </ul>
        )}
        {report.did.length > 0 && (
          <>
            <p className="t-label mt-4 text-[10px] text-muted">What you did</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {report.did.slice(0, 6).map((row) => (
                <span key={row.id} className="chip !py-1 text-xs text-fg">
                  {row.label}
                  <span className="t-num text-gold">×{row.count}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {report.notes.length > 0 && (
          <>
            <p className="t-label mt-4 text-[10px] text-muted">Meanwhile</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {report.notes.slice(0, 4).map((line) => (
                <li key={line} className="flex gap-2 text-[13px] leading-snug text-fg/90">
                  <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span className="line-clamp-2">{line}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {report.months === 0 && report.did.length === 0 && !report.stop && <p className="mt-3 text-sm text-muted">Nothing to skip right now.</p>}
        <div className="mt-5 flex gap-2">
          {canAgain && (
            <button
              type="button"
              onClick={() => {
                close();
                skip(report.span);
              }}
              className="btn btn-ghost min-h-14 flex-1 flex-col !gap-0 text-sm"
            >
              <FfIcon className="size-4" aria-hidden />
              Again
            </button>
          )}
          <button type="button" onClick={close} className={`btn ${report.stop ? "btn-gold" : "btn-primary"} min-h-14 flex-[2] text-lg`}>
            {report.stop ? (report.stop.kind === "death" ? "Read on" : "Take it from here") : "Back to life"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthTrack({ report }: { report: SkipReport }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] font-bold text-muted">
        <span>{when(report.from)}</span>
        <span className="t-num text-fg">
          {report.months}/{report.planned} months
        </span>
        <span>{when(report.to)}</span>
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {Array.from({ length: report.planned }, (_, i) => (
          <span
            key={i}
            className={`anim-pop h-2 flex-1 rounded-full ${i < report.months ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : i === report.months && report.stop ? "bg-bad" : "bg-white/12"}`}
            style={{ animationDelay: `${80 + i * 45}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
