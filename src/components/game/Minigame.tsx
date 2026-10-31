import type React from "react";
import { Eye, Flame, Shield, Star, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Duel, type DuelHero } from "@/components/game/Duel";
import { HitBurst } from "@/components/game/Vfx";
import { buzz } from "@/components/game/haptics";
import { MiniHead } from "@/components/game/MiniKit";
import { skinColor } from "@/components/game/miniUtil";
import { Hack, Hold, Press, Rescue } from "@/components/game/MiniGames";
import type { MinigameSpec } from "@/game/types";

const ICONS = [
  { id: "zap", label: "Bolt", Icon: Zap, color: "#ffcf4d" },
  { id: "shield", label: "Shield", Icon: Shield, color: "#3fe0c5" },
  { id: "flame", label: "Flame", Icon: Flame, color: "#ff6a3d" },
  { id: "eye", label: "Eye", Icon: Eye, color: "#a59bff" },
  { id: "star", label: "Star", Icon: Star, color: "#ff7ac8" },
];

type Grade = "perfect" | "good" | "miss";

export function Minigame({ spec, onDone, hero }: { spec: MinigameSpec; onDone: (ratio: number, used?: string[]) => void; hero?: DuelHero }) {
  if (spec.kind === "duel" && spec.duel) return <Duel spec={spec} onDone={onDone} hero={hero} />;
  if (spec.kind === "pattern") return <Pattern spec={spec} onDone={onDone} />;
  if (spec.kind === "hack") return <Hack spec={spec} onDone={onDone} />;
  if (spec.kind === "rescue") return <Rescue spec={spec} onDone={onDone} />;
  if (spec.kind === "press") return <Press spec={spec} onDone={onDone} />;
  if (spec.kind === "hold") return <Hold spec={spec} onDone={onDone} />;
  return <Timing spec={spec} onDone={onDone} />;
}

function difficultyOf(value: number): number {
  return Math.max(1, Math.min(3, value));
}

function zoneFor(difficulty: number, round: number): number {
  const base = Math.max(0.18, 0.42 - difficulty * 0.04);
  return Math.max(0.14, base * (1 - (round - 1) * 0.12));
}

function Timing({ spec, onDone }: { spec: MinigameSpec; onDone: (ratio: number) => void }) {
  const difficulty = difficultyOf(spec.difficulty);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<Grade | null>(null);
  const [marks, setMarks] = useState<Array<Grade | null>>([null, null, null]);
  const [note, setNote] = useState("Strike inside the band. The solid center is perfect.");
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const running = useRef(true);
  const lock = useRef(false);
  const done = useRef(false);
  const scoreRef = useRef(0);
  const roundRef = useRef(1);
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const zone = zoneFor(difficulty, round);
  const perfect = zone * 0.42;

  useEffect(() => {
    root.current?.focus();
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running.current) {
        const speed = (0.42 + difficulty * 0.12) * (1 + (roundRef.current - 1) * 0.18);
        let next = posRef.current + dirRef.current * speed * dt;
        if (next >= 1) {
          next = 1;
          dirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          dirRef.current = 1;
        }
        posRef.current = next;
        setPos(next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [difficulty]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function finish(total: number) {
    if (done.current) return;
    done.current = true;
    running.current = false;
    later(() => onDone(total / 3), 520);
  }

  function strike() {
    if (lock.current || done.current) return;
    const width = zoneFor(difficulty, roundRef.current);
    const sweet = width * 0.42;
    const dist = Math.abs(posRef.current - 0.5);
    const grade: Grade = dist <= sweet / 2 ? "perfect" : dist <= width / 2 ? "good" : "miss";
    const points = grade === "perfect" ? 1 : grade === "good" ? 0.55 : 0;
    const total = scoreRef.current + points;
    scoreRef.current = total;
    setScore(total);
    setFlash(grade);
    buzz(grade === "perfect" ? "big" : grade === "good" ? "hit" : "miss");
    setMarks((current) => current.map((mark, index) => (index === roundRef.current - 1 ? grade : mark)));
    setNote(grade === "perfect" ? "Perfect. The next band is meaner." : grade === "good" ? "In the band. Not the center." : "Outside. Watch the bounce.");
    lock.current = true;
    running.current = false;
    if (roundRef.current >= 3) {
      finish(total);
      return;
    }
    later(() => {
      roundRef.current += 1;
      setRound(roundRef.current);
      setFlash(null);
      lock.current = false;
      running.current = true;
      setNote(`Round ${roundRef.current} of 3. Faster, narrower.`);
    }, 520);
  }

  const stamp = flash === "perfect" ? "PERFECT" : flash === "good" ? "HIT" : flash === "miss" ? "MISS" : null;

  return (
    <div
      ref={root}
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 pt-3 pb-4"
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          strike();
        }
      }}
      tabIndex={0}
    >
      <MiniHead spec={spec} kind="timing" />
      <p role="status" className="text-sm font-semibold text-gold">{note}</p>
      <div className="flex gap-2" aria-hidden="true">
        {marks.map((mark, index) => (
          <span
            key={index}
            className={`h-2.5 flex-1 rounded-full transition-colors ${mark === "perfect" ? "bg-gold shadow-[0_0_10px_var(--color-gold)]" : mark === "good" ? "bg-spark" : mark === "miss" ? "bg-bad" : index + 1 === round ? "animate-pulse bg-fg" : "bg-panel-2"}`}
          />
        ))}
      </div>
      <div className={`scene-arena relative min-h-32 flex-1 overflow-hidden rounded-[1.6rem] border border-white/10 ${flash === "miss" ? "anim-shake" : ""}`} style={{ boxShadow: `inset 0 0 60px -20px ${skinColor(spec, "timing")}` }} key={flash === "miss" ? `m${round}` : "track"}>
        <div className="absolute inset-x-4 top-1/2 h-3 -translate-y-1/2 rounded-full bg-black/50 shadow-[inset_0_1px_2px_rgba(0,0,0,.7)]" />
        <div className="absolute inset-x-4 top-1/2 h-28 -translate-y-1/2">
          <div className="absolute top-3 bottom-3 rounded-2xl border border-gold/50 bg-gold/20 shadow-[0_0_24px_-4px_var(--color-gold)]" style={{ left: `${(0.5 - zone / 2) * 100}%`, width: `${zone * 100}%` }} />
          <div className="absolute top-5 bottom-5 rounded-xl bg-gradient-to-b from-[#fff3c4] to-gold shadow-[0_0_18px_var(--color-gold)]" style={{ left: `${(0.5 - perfect / 2) * 100}%`, width: `${perfect * 100}%` }} />
          <div className="absolute top-1/2 size-9 -translate-y-1/2" style={{ left: `calc(${pos * 100}% - 1.125rem)` }}>
            <div className={`size-full rounded-full border-2 border-white ${flash === "miss" ? "bg-bad" : flash === "good" ? "bg-spark" : flash === "perfect" ? "bg-gold" : "bg-gradient-to-br from-white to-[#9fb4ff]"}`} style={{ boxShadow: "0 0 18px 4px rgba(255,255,255,.55)" }} />
            {flash && flash !== "miss" && <HitBurst key={`${round}-${flash}`} color={flash === "perfect" ? "#ffcf4d" : "#3fe0c5"} size={flash === "perfect" ? 90 : 60} count={flash === "perfect" ? 12 : 7} seed={round} />}
          </div>
        </div>
        {stamp && (
          <p className="stamp-in pointer-events-none absolute inset-x-0 top-1 flex justify-center">
            <span className={`rounded-xl px-3 py-0.5 font-display text-3xl tracking-wide shadow-lg ${flash === "miss" ? "bg-bad text-white" : flash === "perfect" ? "bg-gold text-paper-ink" : "bg-paper text-paper-ink"}`}>{stamp}</span>
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="chip text-fg">Round <span className="t-num">{round}/3</span></span>
        <span className="chip text-gold">Score <span className="t-num">{score.toFixed(1)}/3</span></span>
      </div>
      <button type="button" onClick={strike} className="btn btn-primary min-h-16 text-xl tracking-wide">
        STRIKE
      </button>
    </div>
  );
}

function Pattern({ spec, onDone }: { spec: MinigameSpec; onDone: (ratio: number) => void }) {
  const difficulty = difficultyOf(spec.difficulty);
  const length = 2 + difficulty;
  const sequence = useRef<number[]>([]);
  if (sequence.current.length === 0) {
    let seed = spec.title.length * 17 + difficulty * 13 + spec.subtitle.length;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      sequence.current.push(seed % ICONS.length);
    }
  }
  const [phase, setPhase] = useState<"watch" | "go">("watch");
  const [lit, setLit] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [note, setNote] = useState("Watch the order. You get one replay.");
  const [replays, setReplays] = useState(1);
  const [play, setPlay] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const done = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    const local: number[] = [];
    setPhase("watch");
    setLit(null);
    setShown(0);
    setCursor(0);
    setHint(null);
    sequence.current.forEach((icon, index) => {
      local.push(
        window.setTimeout(() => {
          setLit(icon);
          setShown(index + 1);
        }, 380 + index * 520),
      );
      local.push(window.setTimeout(() => setLit(null), 380 + index * 520 + 320));
    });
    local.push(
      window.setTimeout(() => {
        setPhase("go");
        setLit(null);
        setNote("Your turn. Repeat it in order.");
      }, 380 + sequence.current.length * 520 + 180),
    );
    return () => local.forEach((timer) => window.clearTimeout(timer));
  }, [play]);

  function finish(ratio: number) {
    if (done.current) return;
    done.current = true;
    timers.current.push(window.setTimeout(() => onDone(ratio), 640));
  }

  function tap(icon: number) {
    if (phase !== "go" || done.current) return;
    const expected = sequence.current[cursor];
    setLit(icon);
    if (icon !== expected) {
      buzz("miss");
      const ratio = cursor / sequence.current.length;
      setHint(expected ?? null);
      setNote(`${ICONS[icon]?.label ?? "That"} breaks it. ${ICONS[expected]?.label ?? "The next one"} was next. You keep ${cursor}.`);
      finish(ratio);
      return;
    }
    const next = cursor + 1;
    buzz(next >= sequence.current.length ? "win" : "tap");
    setCursor(next);
    if (next >= sequence.current.length) {
      setNote(`${ICONS[icon]?.label ?? "That"} — the whole drill. Locked in.`);
      finish(1);
      return;
    }
    setNote(`${ICONS[icon]?.label ?? "That"} — right. ${next} of ${sequence.current.length}.`);
    timers.current.push(window.setTimeout(() => setLit((current) => (current === icon ? null : current)), 160));
  }

  const stage = lit != null ? ICONS[lit] : null;
  const StageIcon = stage?.Icon;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 pt-3 pb-4">
      <MiniHead spec={spec} kind="pattern" />
      <p role="status" className="text-sm font-semibold text-gold">{note}</p>
      <div className="flex gap-1.5">
        {sequence.current.map((icon, index) => {
          const known = phase === "watch" ? index < shown : index < cursor;
          const label = known ? ICONS[icon]?.label : phase === "go" ? String(index + 1) : "·";
          return (
            <span
              key={`${icon}-${index}`}
              className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl border px-1 text-[11px] font-bold transition-colors ${index < cursor && phase === "go" ? "border-gold bg-gold/20 text-fg" : known && phase === "watch" ? "border-white/30 bg-white/5" : "border-white/10 text-muted"}`}
              style={known && ICONS[icon] ? { color: ICONS[icon]!.color } : undefined}
            >
              {known && ICONS[icon] ? (() => {
                const I = ICONS[icon]!.Icon;
                return <I className="size-4" aria-label={label} />;
              })() : label}
            </span>
          );
        })}
      </div>
      <div className="scene-arena relative flex min-h-28 flex-1 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10" style={{ boxShadow: `inset 0 0 60px -20px ${skinColor(spec, "pattern")}` }}>
        {StageIcon && stage ? (
          <span key={`${lit}-${shown}-${cursor}`} className="anim-pop relative grid size-20 place-items-center rounded-3xl" style={{ background: `radial-gradient(circle, ${stage.color}55, transparent 70%)` }}>
            <StageIcon className="size-12" style={{ color: stage.color, filter: `drop-shadow(0 0 12px ${stage.color})` }} />
            <HitBurst color={stage.color} size={70} count={8} seed={cursor + shown} />
          </span>
        ) : (
          <p className="t-label text-muted">{phase === "watch" ? "Memorize" : "Your move"}</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ICONS.map((icon, index) => {
          const Icon = icon.Icon;
          const hot = lit === index && phase === "go";
          const called = hint === index;
          return (
            <button
              key={icon.id}
              type="button"
              aria-label={icon.label}
              aria-pressed={hot || called}
              disabled={phase !== "go" || done.current}
              onClick={() => tap(index)}
              className={`card flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-bold text-fg disabled:opacity-50 ${called ? "!border-spark" : hot ? "!bg-panel-2" : ""}`}
              style={hot ? { borderColor: icon.color, boxShadow: `0 0 20px -4px ${icon.color}` } : undefined}
            >
              <span className="ico-tile size-9" style={{ "--tile": icon.color } as React.CSSProperties}>
                <Icon className="size-5" />
              </span>
              {icon.label}
            </button>
          );
        })}
      </div>
      {phase === "watch" && replays > 0 ? (
        <button
          type="button"
          onClick={() => {
            setReplays(0);
            setNote("Once more. Then it's yours.");
            setPlay((value) => value + 1);
          }}
          className="btn btn-ghost min-h-12"
        >
          Watch it again
        </button>
      ) : (
        <p className="text-sm text-muted tabular-nums">{phase === "watch" ? "Memorize" : `${cursor} / ${sequence.current.length}`}</p>
      )}
    </div>
  );
}
