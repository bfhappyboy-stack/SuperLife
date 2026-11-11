// The money report (2026-11-10 am): what a Play step did to your money, under the story card.
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Newspaper, Store, Wallet } from "lucide-react";
import { fmt, type PeriodReport } from "@/game/economy";

const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts from `from` to `to` over ~0.7s (instant under reduced motion). */
function useCountUp(to: number, from = 0, ms = 700): number {
  const [shown, setShown] = useState(reduced() ? to : from);
  useEffect(() => {
    if (reduced() || from === to) {
      setShown(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, ms]);
  return shown;
}

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
const pct = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100).toFixed(1)}%`;

/** One slim line for a card that is waiting on a choice. */
export function MoneyLine({ report }: { report: PeriodReport }) {
  const home = report.groups.find((g) => g.key === "home");
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-bold opacity-80">
      <Wallet className="size-3.5" aria-hidden />
      <span>{report.months === 1 ? "This month" : `${report.months} months`}:</span>
      <span className={report.net >= 0 ? "text-emerald-700" : "text-red-700"}>cash {signed(report.net)}</span>
      {home && <span>· home {signed(home.amount)}</span>}
    </p>
  );
}

/** The full report: net cash (ticking up), where it came from and went, what moved, and the headlines. */
export function MoneyReport({ report, onOpen }: { report: PeriodReport; onOpen: () => void }) {
  const net = useCountUp(report.net);
  const biggest = Math.max(1, ...report.groups.map((g) => Math.abs(g.amount)));
  const span = report.months === 1 ? "This month" : report.months === 12 ? "This year" : `These ${report.months} months`;
  return (
    <section className="card anim-rise mt-3 px-4 py-3" aria-label="Money report">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-label flex items-center gap-1.5 text-muted">
            <Wallet className="size-3.5" aria-hidden /> {span} · money
          </p>
          <p className={`t-num mt-0.5 text-2xl font-extrabold ${report.net >= 0 ? "text-good" : "text-bad"}`} aria-live="polite">
            {signed(net)}
            <span className="ml-1.5 text-xs font-bold text-muted">cash</span>
          </p>
        </div>
        <button type="button" onClick={onOpen} className="flex min-h-11 shrink-0 items-center gap-0.5 rounded-xl bg-white/5 px-3 text-xs font-extrabold tracking-wide text-fg uppercase">
          Money <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      {report.groups.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {report.groups.map((g) => (
            <li key={g.key} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-[13px]">
              <span className="truncate text-muted">{g.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <span className={`block h-full rounded-full ${g.amount >= 0 ? "bg-good" : "bg-bad"}`} style={{ width: `${Math.max(4, (Math.abs(g.amount) / biggest) * 100)}%`, opacity: 0.8 }} />
              </span>
              <span className={`t-num text-right font-bold ${g.amount >= 0 ? "text-good" : "text-bad"}`}>{signed(g.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">
        Net worth <span className="t-num font-bold text-fg">{fmt(report.worth)}</span>{" "}
        <span className={`t-num font-bold ${report.worthDelta >= 0 ? "text-good" : "text-bad"}`}>({signed(report.worthDelta)})</span>
      </p>
      {report.movers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {report.movers.map((m) => {
            const Icon = m.pct >= 0 ? ArrowUpRight : ArrowDownRight;
            return (
              <span key={m.key} className={`chip text-[12px] ${m.mine ? "text-fg" : "text-muted"}`}>
                <Icon className={`size-3.5 ${m.pct >= 0 ? "text-good" : "text-bad"}`} aria-hidden />
                {m.name}
                <span className={`t-num font-bold ${m.pct >= 0 ? "text-good" : "text-bad"}`}>{pct(m.pct)}</span>
                {m.mine && <span className="text-[10px] font-bold text-gold uppercase">yours</span>}
              </span>
            );
          })}
        </div>
      )}
      {(report.biz ?? []).length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {(report.biz ?? []).map((h) => (
            <li key={h.text} className={`flex items-start gap-1.5 rounded-lg px-2 py-1 text-[13px] leading-snug ${h.tone > 0 ? "bg-good/10" : h.tone < 0 ? "bg-bad/10" : "bg-white/5"} text-fg`}>
              <Store className={`mt-0.5 size-3.5 shrink-0 ${h.tone > 0 ? "text-good" : h.tone < 0 ? "text-bad" : "text-muted"}`} aria-hidden />
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
      )}
      {report.headlines.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {report.headlines.slice(0, 2).map((h) => (
            <li key={h.text} className="flex items-start gap-1.5 text-[13px] leading-snug text-fg">
              <Newspaper className={`mt-0.5 size-3.5 shrink-0 ${h.tone > 0 ? "text-good" : h.tone < 0 ? "text-bad" : "text-muted"}`} aria-hidden />
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The header cash figure: ticks to the new amount and floats the change (+$4,210) when money moves by at least
 * $10, green up and red down. `format` is the header's short money format.
 */
export function CashTicker({ value, format }: { value: number; format: (n: number) => string }) {
  const [prev, setPrev] = useState(value);
  const [pop, setPop] = useState<{ id: number; delta: number } | null>(null);
  const [base, setBase] = useState(value);
  if (value !== prev) {
    const delta = value - prev;
    setBase(prev);
    setPrev(value);
    if (Math.abs(delta) >= 10) setPop({ id: Date.now(), delta });
  }
  const shown = useCountUp(value, base, 650);
  useEffect(() => {
    if (!pop) return;
    const t = setTimeout(() => setPop(null), 1400);
    return () => clearTimeout(t);
  }, [pop]);
  return (
    <span className="relative">
      <span className="t-num">{format(shown)}</span>
      {pop && (
        <span
          key={pop.id}
          aria-hidden
          className={`t-num pointer-events-none absolute top-full right-0 mt-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap ${pop.delta >= 0 ? "text-good" : "text-bad"}`}
          style={{ animation: "float-up 1.4s ease-out forwards" }}
        >
          {signed(pop.delta)}
        </span>
      )}
    </span>
  );
}
