/**
 * Fight tally (2026-11-22 am): the numbers after a fight speak the same metal language as the K.O. title and plates.
 * - `MetalStat`: the Duel K.O. card's Dealt / Taken / Turns tiles as beveled steel tiles with metal-cast digits that
 *   count up; the side that hit harder is lit (gold Dealt or red Taken).
 * - `HpClash`: an Arena results row's "0% HP left vs 41%" as two thin fighting-game HP bars meeting in the middle.
 * Non-character graphics (CSS); painted fighters untouched, no faces. Reduced motion: final numbers, no count or fill.
 * `FIGHT_TALLY` off = the old flat stat cards and the plain HP text line.
 */
import { useEffect, useState } from "react";
import { hitShare, hpPercent } from "@/game/verdicts";

export const FIGHT_TALLY = true;
/**
 * 2026-11-22 pm: the last plain text lines after a fight take the same metal. `BestHit`: the Duel K.O. card's
 * "Best hit: Dive Kick for 11" as a skewed steel callout with a metal-cast number and its share of the damage.
 * `MvpPlate`: the Arena MVP card's "Won round 2 with 62% HP left." as a gold-rimmed plate with a slanted gold HP bar.
 * Off = the old plain text lines. Non-character graphics (CSS); painted fighters untouched, no faces drawn.
 */
export const FIGHT_CALLOUT = true;

type Tone = "gold" | "red" | "steel";
const TONE: Record<Tone, string> = { gold: "#ffcf4d", red: "#ff5a4f", steel: "#c9d6e8" };
const FILL: Record<Tone, string> = {
  gold: "linear-gradient(180deg, #fff8dc 0%, #ffd36a 45%, #c9781c 100%)",
  red: "linear-gradient(180deg, #ffe1dd 0%, #ff6a5f 50%, #9a2219 100%)",
  steel: "linear-gradient(180deg, #ffffff 0%, #d7dde8 48%, #7d8494 100%)",
};

function reducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts 0 → target once, after `delay` ms, over `ms` (ease-out). Reduced motion or no window: the target at once. */
function useCountUp(target: number, delay: number, ms = 650): number {
  const [n, setN] = useState(() => (reducedMotion() ? target : 0));
  useEffect(() => {
    if (reducedMotion() || target <= 0) { setN(target); return; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / ms));
      setN(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, ms]);
  return n;
}

export function MetalStat({ label, value, tone = "steel", lit = false, delay = 0 }: { label: string; value: number; tone?: Tone; lit?: boolean; delay?: number }) {
  const shown = useCountUp(Math.max(0, Math.round(value)), delay);
  return (
    <div className={`metal-stat relative px-2 pt-1.5 pb-1 ${lit ? "is-lit" : ""}`} data-tone={tone} style={{ "--ko": TONE[tone], "--stat-delay": `${delay}ms` } as React.CSSProperties} aria-label={`${label}: ${Math.round(value)}`}>
      <span className="metal-stat-sheen" aria-hidden />
      <p className="ko-title metal-stat-num relative font-display text-[1.7rem] leading-none tabular-nums" style={{ backgroundImage: FILL[tone] }} aria-hidden>{shown}</p>
      <p className="t-label relative mt-0.5 text-[10px] text-muted" aria-hidden>{label}</p>
    </div>
  );
}

/** Two HP bars meeting in the middle: yours (gold) on the left, theirs (red) on the right, each drained toward the centre. */
export function HpClash({ mine, theirs, res, delay = 0 }: { mine: number | undefined; theirs: number | undefined; res: 0 | 1 | null | undefined; delay?: number }) {
  const a = hpPercent(mine);
  const b = hpPercent(theirs);
  return (
    <span className="hp-clash mt-1 flex items-center gap-1.5" data-res={res ?? "none"} style={{ "--clash-delay": `${delay}ms` } as React.CSSProperties} aria-label={`${a}% HP left vs ${b}%`}>
      <span className={`hp-clash-num t-num ${a === 0 ? "is-ko" : "text-gold"}`} aria-hidden>{a === 0 ? "KO" : a}</span>
      <span className="hp-clash-track is-mine" aria-hidden><span className="hp-clash-fill" style={{ width: `${a}%` }} /></span>
      <span className="hp-clash-pin" aria-hidden />
      <span className="hp-clash-track is-theirs" aria-hidden><span className="hp-clash-fill" style={{ width: `${b}%` }} /></span>
      <span className={`hp-clash-num t-num ${b === 0 ? "is-ko" : "text-cape"}`} aria-hidden>{b === 0 ? "KO" : b}</span>
    </span>
  );
}

/** The Duel K.O. card's best hit: a skewed steel callout, gold number counting up, and its share of what you dealt. */
export function BestHit({ name, dealt, total, delay = 0 }: { name: string; dealt: number; total: number; delay?: number }) {
  const value = Math.max(0, Math.round(dealt));
  const shown = useCountUp(value, delay, 520);
  const share = hitShare(dealt, total);
  return (
    <div className="best-hit relative mx-auto mt-2.5 flex max-w-full items-center gap-2.5 py-1 pr-3 pl-1" style={{ "--hit-delay": `${delay}ms` } as React.CSSProperties} aria-label={`Best hit: ${name} for ${value}${share ? `, ${share}% of your damage` : ""}`}>
      <span className="best-hit-sheen" aria-hidden />
      <span className="best-hit-tag t-label relative shrink-0" aria-hidden>Best hit</span>
      <span className="relative min-w-0 truncate text-[13px] font-extrabold text-fg" aria-hidden>{name}</span>
      <span className="ko-title relative shrink-0 font-display text-[1.35rem] leading-none tabular-nums" style={{ backgroundImage: FILL.gold }} aria-hidden>{shown}</span>
      {share > 0 && <span className="relative shrink-0 text-[10px] font-bold text-muted" aria-hidden>{share}%</span>}
    </div>
  );
}

/** The Arena MVP card's line: round tag, a slanted gold HP bar that fills, and the HP left in metal digits. */
export function MvpPlate({ round, hp, delay = 0 }: { round: number; hp: number; delay?: number }) {
  const pct = hpPercent(hp);
  const shown = useCountUp(pct, delay + 200, 620);
  return (
    <div className="mvp-plate mt-1.5" style={{ "--clash-delay": `${delay}ms` } as React.CSSProperties} aria-label={pct < 1 ? `Won round ${round + 1} by a whisker.` : `Won round ${round + 1} with ${pct}% HP left.`}>
      <div className="flex items-baseline justify-between gap-2" aria-hidden>
        <span className="t-label text-[10px] text-muted">Round {round + 1} · {pct < 1 ? "by a whisker" : "HP left"}</span>
        {pct >= 1 && (
          <span className="ko-title font-display text-[1.25rem] leading-none tabular-nums" style={{ backgroundImage: FILL.gold }}>
            {shown}<span className="text-[0.8rem]">%</span>
          </span>
        )}
      </div>
      <span className="hp-clash-track is-solo mt-1 block" aria-hidden><span className="hp-clash-fill" style={{ width: `${Math.max(pct, 2)}%` }} /></span>
    </div>
  );
}
