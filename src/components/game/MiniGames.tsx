/**
 * Four skill minigames beyond the timing bar: Crack (rotating lock rings), Rescue (window triage),
 * Press (read the reporter, pick the line) and Hold (keep a load inside a moving zone).
 * All of them render inside MiniFrame, are touch-first with 56px+ targets, and score 0–1.
 */
import { Baby, Flame, PersonStanding, User, Weight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HitBurst } from "@/components/game/Vfx";
import { buzz } from "@/components/game/haptics";
import { MiniFrame, Pips } from "@/components/game/MiniKit";
import { clampDifficulty, seeded, skinColor, useFinish, useIntro, type Mark } from "@/components/game/miniUtil";
import { pressRounds, pressScore, type Tone } from "@/game/minis";
import type { MinigameSpec } from "@/game/types";

type Props = { spec: MinigameSpec; onDone: (ratio: number) => void };

function useFrame(active: boolean, fn: (dt: number, now: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ref.current(dt, now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}

/* ------------------------------------------------------------------ */
/* Crack: lock rings                                                   */
/* ------------------------------------------------------------------ */

export function Hack({ spec, onDone }: Props) {
  const difficulty = clampDifficulty(spec.difficulty);
  const count = difficulty >= 3 ? 4 : 3;
  const tol = 24 - difficulty * 3;
  const rings = useMemo(() => {
    const rand = seeded(spec.seed ?? 11);
    return Array.from({ length: count }, (_, i) => ({
      radius: 86 - i * 17,
      speed: (110 + difficulty * 38 + i * 26 + rand() * 30) * (i % 2 ? -1 : 1),
      start: rand() * 360,
    }));
  }, [count, difficulty, spec.seed]);
  const go = useIntro();
  const { result, finish } = useFinish(onDone);
  const angles = useRef(rings.map((r) => r.start));
  const [, setTick] = useState(0);
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Mark[]>(() => rings.map(() => null));
  const [locked, setLocked] = useState<number[]>(() => rings.map(() => 0));
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(0);
  const [note, setNote] = useState<string | undefined>();
  const score = useRef(0);
  const color = skinColor(spec, "hack");

  useFrame(go && result == null, (dt) => {
    angles.current = angles.current.map((a, i) => (i < index ? a : (a + rings[i]!.speed * dt + 360) % 360));
    setTick((t) => (t + 1) % 1000);
  });

  function lock() {
    if (!go || result != null || index >= rings.length) return;
    const a = angles.current[index]!;
    const off = Math.min(a, 360 - a);
    const mark: Mark = off <= tol * 0.4 ? "perfect" : off <= tol ? "good" : "miss";
    const points = mark === "perfect" ? 1 : mark === "good" ? 0.65 : 0;
    score.current += points;
    setMarks((m) => m.map((x, i) => (i === index ? mark : x)));
    setLocked((l) => l.map((x, i) => (i === index ? (mark === "miss" ? -1 : 1) : x)));
    if (mark === "miss") {
      setShake((s) => s + 1);
      buzz("miss");
      setNote("Jammed. That ring sticks crooked.");
    } else {
      // Snap a clean lock to the gate.
      if (mark === "perfect") angles.current[index] = 0;
      setBurst((b) => b + 1);
      buzz(mark === "perfect" ? "big" : "hit");
      setNote(mark === "perfect" ? "Click. Dead on the gate." : "Close enough. It turns.");
    }
    const next = index + 1;
    setIndex(next);
    if (next >= rings.length) finish(score.current / rings.length);
  }

  return (
    <MiniFrame
      spec={spec}
      kind="hack"
      note={note}
      intro={go}
      result={result}
      shake={shake}
      pips={<Pips marks={marks} current={index} />}
      footer={
        <button type="button" onClick={lock} disabled={!go || result != null} className="btn btn-primary min-h-16 text-xl tracking-wide">
          LOCK RING {Math.min(index + 1, rings.length)}/{rings.length}
        </button>
      }
    >
      <div
        className="absolute inset-0 grid place-items-center"
        onPointerDown={(e) => {
          e.preventDefault();
          lock();
        }}
      >
        <svg viewBox="0 0 200 200" className="aspect-square h-[88%] max-h-[340px] max-w-[92%]" role="img" aria-label={`Lock, ring ${index + 1} of ${rings.length}`}>
          <defs>
            <radialGradient id="hack-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="98" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.08)" />
          <circle cx="100" cy="100" r="22" fill="url(#hack-core)" />
          {/* Gate: a wedge at the top. */}
          <path d="M100 4 L92 -6 L108 -6 Z" transform="translate(0 8)" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          <rect x={100 - 1} y="8" width="2" height="88" fill={color} opacity="0.18" />
          {rings.map((ring, i) => {
            const state = locked[i];
            const active = i === index && result == null;
            const angle = angles.current[i] ?? 0;
            const stroke = state === 1 ? "#3fe0c5" : state === -1 ? "#ef5d52" : active ? "#f4efe4" : "rgba(244,239,228,.35)";
            const circ = 2 * Math.PI * ring.radius;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <circle cx="100" cy="100" r={ring.radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="11" />
                <circle cx="100" cy="100" r={ring.radius} fill="none" stroke={stroke} strokeOpacity={active ? 0.55 : 0.3} strokeWidth="2" strokeDasharray={`${circ / 48 - 2} 2`} />
                {/* The notch that has to reach the gate. */}
                <rect
                  x={100 - 5}
                  y={100 - ring.radius - 6}
                  width="10"
                  height="12"
                  rx="3"
                  fill={state === 1 ? "#3fe0c5" : state === -1 ? "#ef5d52" : active ? color : "rgba(255,255,255,.45)"}
                  style={active ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
              </g>
            );
          })}
        </svg>
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute top-[10%] left-1/2 size-0">
            <HitBurst color={color} size={70} count={8} seed={burst} />
          </span>
        )}
      </div>
    </MiniFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Rescue: window triage                                               */
/* ------------------------------------------------------------------ */

type Spawn = { id: number; cell: number; at: number; life: number; hazard: boolean; icon: number };

export function Rescue({ spec, onDone }: Props) {
  const difficulty = clampDifficulty(spec.difficulty);
  const people = 7 + difficulty * 2;
  const plan = useMemo(() => {
    const rand = seeded(spec.seed ?? 5);
    const hazards = 2 + difficulty;
    const kinds = [...Array(people).fill(false), ...Array(hazards).fill(true)].map((h) => ({ h, k: rand() })).sort((a, b) => a.k - b.k).map((x) => x.h as boolean);
    const gap = 640 - difficulty * 80;
    const list: Spawn[] = [];
    const busy: number[] = Array(9).fill(-1);
    let t = 300;
    kinds.forEach((hazard, i) => {
      const life = hazard ? 1500 : 2100 - difficulty * 260;
      let cell = Math.floor(rand() * 9);
      for (let tries = 0; tries < 9 && busy[cell]! > t; tries++) cell = (cell + 1) % 9;
      busy[cell] = t + life;
      list.push({ id: i, cell, at: t, life, hazard, icon: Math.floor(rand() * 3) });
      t += gap * (0.7 + rand() * 0.6);
    });
    return list;
  }, [difficulty, people, spec.seed]);
  const go = useIntro();
  const { result, finish } = useFinish(onDone);
  const start = useRef<number | null>(null);
  const [now, setNow] = useState(0);
  const [taken, setTaken] = useState<Record<number, "saved" | "burnt">>({});
  const [shake, setShake] = useState(0);
  const [note, setNote] = useState<string | undefined>();
  const end = plan.length ? plan[plan.length - 1]!.at + plan[plan.length - 1]!.life + 200 : 0;
  const color = skinColor(spec, "rescue");

  useFrame(go && result == null, (_dt, t) => {
    if (start.current == null) start.current = t;
    const elapsed = t - start.current;
    setNow(elapsed);
    if (elapsed > end) {
      const saved = Object.values(taken).filter((v) => v === "saved").length;
      const burnt = Object.values(taken).filter((v) => v === "burnt").length;
      finish(saved / people - burnt * 0.12);
    }
  });

  const saved = Object.values(taken).filter((v) => v === "saved").length;
  const lost = plan.filter((s) => !s.hazard && !taken[s.id] && now > s.at + s.life).length;
  const live = plan.filter((s) => !taken[s.id] && now >= s.at && now <= s.at + s.life);

  function tap(spawn: Spawn) {
    if (result != null || taken[spawn.id]) return;
    if (spawn.hazard) {
      setTaken((m) => ({ ...m, [spawn.id]: "burnt" }));
      setShake((s) => s + 1);
      buzz("miss");
      setNote("That was the fire. It bites back.");
    } else {
      setTaken((m) => ({ ...m, [spawn.id]: "saved" }));
      buzz("hit");
      setNote(undefined);
    }
  }

  const ICONS = [User, PersonStanding, Baby];

  return (
    <MiniFrame
      spec={spec}
      kind="rescue"
      note={note}
      intro={go}
      result={result}
      shake={shake}
      hud={
        <>
          <span className="chip bg-black/50 text-fg">Saved <span className="t-num text-good">{saved}</span>/{people}</span>
          <span className="chip bg-black/50 text-fg">Lost <span className="t-num text-bad">{lost}</span></span>
        </>
      }
      footer={
        <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (now / Math.max(1, end)) * 100)}%`, background: `linear-gradient(90deg, ${color}, #ffcf4d)` }} />
        </div>
      }
    >
      {/* A building facade: three floors of windows. */}
      <div className="absolute inset-x-5 top-14 bottom-4 rounded-t-[1.4rem] border border-white/10 bg-gradient-to-b from-[#2a2f3f] to-[#161a24] p-3 shadow-[inset_0_2px_0_rgba(255,255,255,.06)]">
        <div className="grid h-full grid-cols-3 grid-rows-3 gap-2.5">
          {Array.from({ length: 9 }, (_, cell) => {
            const spawn = live.find((s) => s.cell === cell);
            const done = plan.find((s) => s.cell === cell && taken[s.id] && now - (s.at + 0) < s.life + 400 && now >= s.at);
            const left = spawn ? 1 - (now - spawn.at) / spawn.life : 0;
            const Icon = spawn ? (spawn.hazard ? Flame : ICONS[spawn.icon]!) : null;
            return (
              <button
                key={cell}
                type="button"
                aria-label={spawn ? (spawn.hazard ? "Fire" : "Person") : "Empty window"}
                disabled={!spawn || result != null}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (spawn) tap(spawn);
                }}
                className="relative grid min-h-14 place-items-center overflow-hidden rounded-xl border border-black/40 transition-colors"
                style={{
                  background: spawn
                    ? spawn.hazard
                      ? "radial-gradient(circle at 50% 70%, #ff8a3d, #a8300f 70%)"
                      : "linear-gradient(180deg, #ffe7a8, #f0b85a)"
                    : "linear-gradient(180deg, #1d2333, #0f131c)",
                  boxShadow: spawn ? `0 0 18px -2px ${spawn.hazard ? "#ff6a2b" : "#ffcf4d"}` : "inset 0 2px 6px rgba(0,0,0,.6)",
                }}
              >
                {spawn && Icon && (
                  <>
                    {!spawn.hazard && (
                      <span
                        className="absolute top-1/2 left-1/2 aspect-square w-[78%] max-w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{ background: `conic-gradient(${left > 0.35 ? "#3dba8c" : "#ef5d52"} ${left * 360}deg, rgba(0,0,0,.18) 0)`, mask: "radial-gradient(circle, transparent 58%, #000 60%)", WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%)" }}
                      />
                    )}
                    <Icon className={`anim-pop size-8 ${spawn.hazard ? "text-[#ffe0a0]" : "text-[#3a2410]"}`} style={spawn.hazard ? { filter: "drop-shadow(0 0 8px #ffb347)" } : undefined} />
                  </>
                )}
                {!spawn && done && taken[done.id] === "saved" && <HitBurst color="#3dba8c" size={56} count={7} seed={done.id} />}
              </button>
            );
          })}
        </div>
      </div>
    </MiniFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Press: read the reporter                                            */
/* ------------------------------------------------------------------ */

const TONE_LABEL: Record<Tone, { label: string; color: string }> = {
  bold: { label: "Bold", color: "#ff6a3d" },
  humble: { label: "Humble", color: "#7fd8ff" },
  witty: { label: "Witty", color: "#ffcf4d" },
  straight: { label: "Straight", color: "#c9c2b0" },
};

export function Press({ spec, onDone }: Props) {
  const difficulty = clampDifficulty(spec.difficulty);
  const total = difficulty >= 3 ? 4 : 3;
  const seconds = 8 - difficulty;
  const rounds = useMemo(() => pressRounds(spec.seed ?? 3, total), [spec.seed, total]);
  const go = useIntro();
  const { result, finish } = useFinish(onDone);
  const [round, setRound] = useState(0);
  const [marks, setMarks] = useState<Mark[]>(() => rounds.map(() => null));
  const [picked, setPicked] = useState<Tone | "late" | null>(null);
  const [left, setLeft] = useState(seconds);
  const score = useRef(0);
  const roundStart = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const current = rounds[round]!;

  function answer(tone: Tone | "late") {
    if (picked || result != null) return;
    const points = tone === "late" ? 0 : pressScore(current.reporter, tone);
    score.current += points;
    setPicked(tone);
    const mark: Mark = points >= 1 ? "perfect" : points > 0 ? "good" : "miss";
    setMarks((m) => m.map((x, i) => (i === round ? mark : x)));
    buzz(points >= 1 ? "big" : points > 0 ? "hit" : "miss");
    timer.current = window.setTimeout(() => {
      if (round + 1 >= rounds.length) {
        finish(score.current / rounds.length);
        return;
      }
      roundStart.current = null;
      setPicked(null);
      setLeft(seconds);
      setRound(round + 1);
    }, 1250);
  }

  useFrame(go && result == null && !picked, (_dt, t) => {
    if (roundStart.current == null) roundStart.current = t;
    const remain = Math.max(0, seconds - (t - roundStart.current) / 1000);
    setLeft(remain);
    if (remain <= 0) answer("late");
  });

  const reaction =
    picked == null
      ? null
      : picked === "late"
        ? { text: "Dead air. They run the blooper.", color: "#ef5d52" }
        : pressScore(current.reporter, picked) >= 1
          ? { text: "Front page. They love it.", color: "#ffcf4d" }
          : pressScore(current.reporter, picked) > 0
            ? { text: "They'll run it on page six.", color: "#3fe0c5" }
            : { text: "Wrong room for that line. Ouch.", color: "#ef5d52" };
  const initials = current.reporter.name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";

  return (
    <MiniFrame
      spec={spec}
      kind="press"
      intro={go}
      result={result}
      note={reaction?.text}
      pips={<Pips marks={marks} current={round} />}
      footer={
        <div className="grid grid-cols-2 gap-2">
          {current.order.map((tone) => {
            const meta = TONE_LABEL[tone];
            const chosen = picked === tone;
            const best = picked && tone === current.reporter.wants[0];
            return (
              <button
                key={`${round}-${tone}`}
                type="button"
                disabled={!go || !!picked || result != null}
                onClick={() => answer(tone)}
                className={`card flex min-h-[5.25rem] flex-col items-start gap-1 px-3 py-2 text-left text-[13px] leading-snug font-semibold text-fg transition-transform active:scale-[.98] disabled:opacity-100 ${picked && !chosen && !best ? "opacity-45" : ""}`}
                style={chosen || best ? { borderColor: best ? "#ffcf4d" : meta.color, boxShadow: `0 0 20px -6px ${best ? "#ffcf4d" : meta.color}` } : undefined}
              >
                <span className="t-label" style={{ color: meta.color }}>{meta.label}</span>
                <span>{current.question.lines[tone]}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="absolute inset-0 flex flex-col justify-center gap-3 px-4 py-4">
        {/* Camera flashes */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-60" style={{ background: "radial-gradient(4px 4px at 12% 40%, #fff, transparent), radial-gradient(3px 3px at 78% 30%, #fff, transparent), radial-gradient(5px 5px at 55% 60%, #fff, transparent)" }} />
        <div key={`r${round}`} className="anim-rise flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-2xl text-paper-ink shadow-lg" style={{ background: current.reporter.color }}>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold text-fg">{current.reporter.name}</p>
            <p className="truncate text-xs font-semibold text-muted">{current.reporter.outlet}</p>
            <p className="mt-0.5 text-xs leading-snug text-gold">{current.reporter.tell}</p>
          </div>
          <span className={`t-num grid size-12 shrink-0 place-items-center rounded-full border-2 text-lg ${left < 2.5 ? "border-bad text-bad" : "border-white/25 text-fg"}`} aria-label={`${Math.ceil(left)} seconds`}>
            {Math.ceil(left)}
          </span>
        </div>
        <div key={`q${round}`} className="anim-pop card-paper relative px-4 py-3">
          <span className="absolute -top-2 left-8 size-4 rotate-45 bg-paper" aria-hidden />
          <p className="font-display text-[1.45rem] leading-tight text-paper-ink">“{current.question.q}”</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-gold transition-[width] duration-100" style={{ width: `${(left / seconds) * 100}%` }} />
        </div>
      </div>
    </MiniFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Hold: stay in the zone                                              */
/* ------------------------------------------------------------------ */

export function Hold({ spec, onDone }: Props) {
  const difficulty = clampDifficulty(spec.difficulty);
  const duration = 6 + difficulty * 0.5;
  const half = 0.15 - difficulty * 0.02;
  const phase = useMemo(() => seeded(spec.seed ?? 9)() * Math.PI * 2, [spec.seed]);
  const go = useIntro();
  const { result, finish } = useFinish(onDone);
  const holding = useRef(false);
  const level = useRef(0.1);
  const vel = useRef(0);
  const inZone = useRef(0);
  const elapsed = useRef(0);
  const [view, setView] = useState({ level: 0.1, center: 0.5, t: 0, ok: false, pressed: false });
  const color = skinColor(spec, "hold");

  useFrame(go && result == null, (dt) => {
    elapsed.current += dt;
    const t = elapsed.current;
    const speed = 0.7 + difficulty * 0.25;
    const center = 0.5 + 0.27 * Math.sin(t * speed + phase) + 0.07 * Math.sin(t * 2.3 * speed);
    // Momentum: holding pushes up, releasing lets gravity win. Damped so it is controllable.
    vel.current += (holding.current ? 1.5 : -1.25) * dt;
    vel.current *= Math.pow(0.18, dt);
    level.current = Math.max(0, Math.min(1, level.current + vel.current * dt * 2.2));
    if (level.current <= 0 || level.current >= 1) vel.current = 0;
    const ok = Math.abs(level.current - center) <= half;
    if (ok) inZone.current += dt;
    setView({ level: level.current, center, t, ok, pressed: holding.current });
    if (t >= duration) finish(inZone.current / duration / 0.8);
  });

  const press = (on: boolean) => {
    if (on && !holding.current) buzz("tap");
    holding.current = on;
  };
  const pct = Math.round((inZone.current / Math.max(0.01, elapsed.current || 1)) * 100);

  return (
    <MiniFrame
      spec={spec}
      kind="hold"
      intro={go}
      result={result}
      note={go ? (view.ok ? "Steady. Keep it there." : view.level > view.center ? "Too high. Ease off." : "Too low. Push.") : undefined}
      hud={
        <>
          <span className="chip bg-black/50 text-fg">In zone <span className="t-num text-gold">{elapsed.current ? pct : 0}%</span></span>
          <span className="chip bg-black/50 text-fg"><span className="t-num">{Math.max(0, duration - view.t).toFixed(1)}s</span></span>
        </>
      }
      footer={
        <button
          type="button"
          disabled={!go || result != null}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
            press(true);
          }}
          onPointerUp={() => press(false)}
          onPointerCancel={() => press(false)}
          onLostPointerCapture={() => press(false)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              press(true);
            }
          }}
          onKeyUp={() => press(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`btn btn-primary min-h-16 touch-none text-xl tracking-wide select-none ${view.pressed ? "translate-y-[3px] brightness-110" : ""}`}
        >
          {view.pressed ? "HOLDING…" : "PRESS & HOLD"}
        </button>
      }
    >
      <div className="absolute inset-0 flex items-stretch gap-4 px-5 pt-14 pb-5">
        {/* Meter */}
        <div className="relative w-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/45 shadow-[inset_0_2px_8px_rgba(0,0,0,.7)]">
          <div
            className="absolute inset-x-1 rounded-xl border-2 transition-colors"
            style={{
              bottom: `${(view.center - half) * 100}%`,
              height: `${half * 200}%`,
              borderColor: view.ok ? "#ffcf4d" : "rgba(255,207,77,.55)",
              background: view.ok ? "rgba(255,207,77,.28)" : "rgba(255,207,77,.12)",
              boxShadow: view.ok ? "0 0 22px -2px #ffcf4d" : undefined,
            }}
          />
          <div className="absolute inset-x-0 bottom-0" style={{ height: `${view.level * 100}%`, background: `linear-gradient(0deg, color-mix(in srgb, ${color} 55%, black), ${color})`, opacity: 0.85 }} />
          <div className="absolute inset-x-0 h-1 bg-white shadow-[0_0_12px_#fff]" style={{ bottom: `calc(${view.level * 100}% - 2px)` }} />
        </div>
        {/* The load: rises with the meter and strains when outside the zone. */}
        <div className="relative flex-1">
          <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-black/50" />
          <div
            className={`absolute inset-x-2 grid place-items-center ${view.ok ? "" : "anim-shake"}`}
            key={view.ok ? "ok" : `bad${Math.floor(view.t * 3)}`}
            style={{ bottom: `${8 + view.level * 70}%` }}
          >
            <div className="relative flex h-16 w-full items-center justify-center rounded-xl border border-black/50 shadow-xl" style={{ background: "repeating-linear-gradient(135deg, #f0b85a 0 14px, #2a2018 14px 28px)" }}>
              <Weight className="size-9 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.8)]" />
            </div>
            <div className="absolute top-full left-1/2 h-[60vh] w-1.5 -translate-x-1/2 rounded-full" style={{ background: `linear-gradient(${color}, transparent 40%)`, opacity: view.pressed ? 0.9 : 0.35 }} />
          </div>
        </div>
      </div>
    </MiniFrame>
  );
}

