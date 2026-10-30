import { Eye, Flame, Shield, Star, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Duel } from "@/components/game/Duel";
import type { MinigameSpec } from "@/game/types";

const ICONS = [
  { id: "zap", label: "Bolt", Icon: Zap },
  { id: "shield", label: "Shield", Icon: Shield },
  { id: "flame", label: "Flame", Icon: Flame },
  { id: "eye", label: "Eye", Icon: Eye },
  { id: "star", label: "Star", Icon: Star },
];

type Grade = "perfect" | "good" | "miss";

export function Minigame({ spec, onDone }: { spec: MinigameSpec; onDone: (ratio: number, used?: string[]) => void }) {
  if (spec.kind === "duel" && spec.duel) return <Duel spec={spec} onDone={onDone} />;
  if (spec.kind === "pattern") return <Pattern spec={spec} onDone={onDone} />;
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
    return () => timers.current.forEach((id) => window.clearTimeout(id));
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
      <div>
        <p className="text-xs font-semibold tracking-widest text-muted">DRILL</p>
        <p className="truncate font-display text-2xl tracking-wide text-fg">{spec.title}</p>
        <p className="mt-1 text-sm text-muted">{spec.subtitle}</p>
      </div>
      <p role="status" className="text-sm font-semibold text-gold">{note}</p>
      <div className="flex gap-2" aria-hidden="true">
        {marks.map((mark, index) => (
          <span
            key={index}
            className={`h-2 flex-1 rounded-full ${mark === "perfect" ? "bg-gold" : mark === "good" ? "bg-spark" : mark === "miss" ? "bg-bad" : index + 1 === round ? "bg-fg" : "bg-panel-2"}`}
          />
        ))}
      </div>
      <div className="relative h-24 overflow-hidden rounded-3xl bg-panel-2">
        <div className="absolute top-0 bottom-0 bg-gold/35" style={{ left: `${(0.5 - zone / 2) * 100}%`, width: `${zone * 100}%` }} />
        <div className="absolute top-0 bottom-0 bg-gold" style={{ left: `${(0.5 - perfect / 2) * 100}%`, width: `${perfect * 100}%` }} />
        <div
          className={`absolute top-4 h-16 w-6 rounded-full border-2 border-ink ${flash === "miss" ? "bg-bad" : flash === "good" ? "bg-spark" : "bg-fg"}`}
          style={{ left: `calc(${pos * 100}% - 0.75rem)` }}
        />
        {stamp && (
          <p className="stamp-in pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className={`rounded-xl bg-paper px-3 py-1 font-display text-4xl tracking-wide ${flash === "miss" ? "text-bad" : "text-paper-ink"}`}>{stamp}</span>
          </p>
        )}
      </div>
      <p className="text-sm text-muted tabular-nums">
        Round {round} / 3 · Score {score.toFixed(1)} / 3
      </p>
      <button type="button" onClick={strike} className="mt-auto min-h-14 rounded-2xl bg-cape px-4 text-lg font-semibold text-fg">
        Strike
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
    return () => timers.current.forEach((id) => window.clearTimeout(id));
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
      const ratio = cursor / sequence.current.length;
      setHint(expected ?? null);
      setNote(`${ICONS[icon]?.label ?? "That"} breaks it. ${ICONS[expected]?.label ?? "The next one"} was next. You keep ${cursor}.`);
      finish(ratio);
      return;
    }
    const next = cursor + 1;
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
      <div>
        <p className="text-xs font-semibold tracking-widest text-muted">DRILL</p>
        <p className="truncate font-display text-2xl tracking-wide text-fg">{spec.title}</p>
        <p className="mt-1 text-sm text-muted">{spec.subtitle}</p>
      </div>
      <p role="status" className="text-sm font-semibold text-gold">{note}</p>
      <div className="flex gap-1.5">
        {sequence.current.map((icon, index) => {
          const known = phase === "watch" ? index < shown : index < cursor;
          const label = known ? ICONS[icon]?.label : phase === "go" ? String(index + 1) : "·";
          return (
            <span
              key={`${icon}-${index}`}
              className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl border px-1 text-[11px] font-semibold ${index < cursor && phase === "go" ? "border-gold bg-panel-2 text-fg" : known && phase === "watch" ? "border-gold text-gold" : "border-line text-muted"}`}
            >
              {label}
            </span>
          );
        })}
      </div>
      <div className="flex h-20 items-center justify-center rounded-2xl bg-panel">
        {StageIcon ? <StageIcon className="size-10 text-fg" /> : <p className="text-sm text-muted">{phase === "watch" ? "Memorize" : "Your move"}</p>}
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
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-semibold disabled:opacity-50 ${called ? "border-spark bg-panel-2 text-fg" : hot ? "border-gold bg-gold text-ink" : "border-line bg-panel text-fg"}`}
            >
              <Icon className="size-5" />
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
          className="min-h-12 rounded-2xl border border-line px-4 font-semibold text-fg"
        >
          Watch it again
        </button>
      ) : (
        <p className="text-sm text-muted tabular-nums">{phase === "watch" ? "Memorize" : `${cursor} / ${sequence.current.length}`}</p>
      )}
    </div>
  );
}
