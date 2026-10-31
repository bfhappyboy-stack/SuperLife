/**
 * Lightweight hit effects: a ring burst, a fan of sparks, and a floating number. Pure CSS transforms,
 * keyed by a counter so each hit replays; all of it switches off under prefers-reduced-motion.
 */
import type React from "react";
import type { CSSProperties } from "react";
import { Atom, Brain, ChevronsRight, CircleDashed, Flame, Ghost, HeartPulse, Orbit, Shield as ShieldIcon, Snowflake, Spline, Sun, WandSparkles, Wind, Zap, Dumbbell } from "lucide-react";
import { ELEMENTS, isElement, type ElementId } from "@/game/elements";


export function HitBurst({ color, count = 9, size = 72, seed = 0 }: { color: string; count?: number; size?: number; seed?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      <span className="anim-burst absolute rounded-full" style={{ width: size, height: size, border: `3px solid ${color}`, boxShadow: `0 0 24px ${color}, inset 0 0 18px ${color}` }} />
      <span className="anim-burst absolute rounded-full opacity-70" style={{ width: size * 0.45, height: size * 0.45, background: `radial-gradient(circle, #fff, ${color} 60%, transparent 70%)` }} />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + ((seed * 37) % 10) / 10;
        const dist = size * (0.55 + ((i * 7 + seed) % 5) * 0.1);
        return (
          <span
            key={i}
            className="spark absolute rounded-full"
            style={{ width: i % 3 ? 5 : 8, height: i % 3 ? 5 : 8, background: i % 2 ? "#fff" : color, boxShadow: `0 0 8px ${color}`, "--dx": `${Math.cos(angle) * dist}px`, "--dy": `${Math.sin(angle) * dist}px` } as CSSProperties}
          />
        );
      })}
    </span>
  );
}

export function FloatNumber({ text, color, className = "" }: { text: string; color: string; className?: string }) {
  return (
    <span className={`anim-float-up pointer-events-none absolute font-display text-3xl ${className}`} style={{ color, textShadow: `0 2px 0 rgba(0,0,0,.6), 0 0 14px ${color}` }} aria-hidden>
      {text}
    </span>
  );
}

/** Fighter silhouette with a coloured rim and an aura; `hurt` plays the shake. */
export function Fighter({ color, flip = false, hurt = false, hurtKey = 0, label }: { color: string; flip?: boolean; hurt?: boolean; hurtKey?: number; label: string }) {
  return (
    <div key={hurt ? hurtKey : "idle"} className={`relative flex flex-col items-center ${hurt ? "anim-shake" : ""}`}>
      <div className="anim-float">
        <svg viewBox="0 0 80 110" className="h-24 w-20 drop-shadow-[0_6px_10px_rgba(0,0,0,.6)]" style={{ transform: flip ? "scaleX(-1)" : undefined }} aria-hidden>
          <defs>
            <radialGradient id={`aura-${label}`} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={color} stopOpacity="0.55" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`fbody-${label}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a4561" />
              <stop offset="1" stopColor="#141a28" />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="58" rx="38" ry="50" fill={`url(#aura-${label})`} />
          {/* fighting stance: lead fist forward, rear guard up */}
          <path d="M30 104 L34 74 L28 104 Z M48 104 L44 74 L54 104 Z" fill="#141a28" />
          <path d="M26 44 Q40 36 54 44 L52 78 Q40 82 28 78 Z" fill={`url(#fbody-${label})`} stroke={color} strokeWidth="2" />
          <path d="M28 76 L22 104 H34 L40 82 L46 104 H58 L52 76 Z" fill={`url(#fbody-${label})`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
          <path d="M52 48 L70 54 L74 50" fill="none" stroke={`url(#fbody-${label})`} strokeWidth="8" strokeLinecap="round" />
          <path d="M52 48 L70 54 L74 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <circle cx="75" cy="49" r="5" fill={color} />
          <path d="M28 48 L22 60 L36 52" fill="none" stroke="#1d2436" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="37" cy="51" r="4.2" fill={color} opacity="0.85" />
          <circle cx="42" cy="28" r="11" fill="#1d2436" stroke={color} strokeWidth="2" />
          <path d="M36 27 H50" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M26 44 Q40 36 54 44" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="mt-0.5 h-2 w-16 rounded-[50%] bg-black/50 blur-[2px]" />
    </div>
  );
}

/* ───────────────────────── Element VFX ───────────────────────── */


export const ELEMENT_ICON: Record<ElementId, typeof Flame> = {
  fire: Flame,
  ice: Snowflake,
  lightning: Zap,
  light: Sun,
  energy: Atom,
  psychic: Brain,
  speed: ChevronsRight,
  wind: Wind,
  gravity: Orbit,
  force: Dumbbell,
  shadow: Ghost,
  warp: CircleDashed,
  arcane: WandSparkles,
  life: HeartPulse,
  shield: ShieldIcon,
  stretch: Spline,
};

export function elementOf(value: string | undefined | null): ElementId {
  return isElement(value) ? value : "force";
}

export function ElementIcon({ element, className = "size-4", style }: { element: string | undefined; className?: string; style?: CSSProperties }) {
  const id = elementOf(element);
  const Icon = ELEMENT_ICON[id];
  return <Icon className={className} style={{ color: ELEMENTS[id].color, ...style }} aria-hidden />;
}

function rand(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280;
  return x - Math.floor(x);
}

/** Impact effect drawn at the target, shaped by the element. */
export function ElementBurst({ element, size = 90, seed = 1, big = false }: { element: string | undefined; size?: number; seed?: number; big?: boolean }) {
  const id = elementOf(element);
  const { color, glow } = ELEMENTS[id];
  const s = big ? size * 1.35 : size;
  const n = big ? 14 : 10;
  const parts: React.ReactNode[] = [];
  const fly = (i: number, spread = 1, up = 0) => {
    const angle = (i / n) * Math.PI * 2 + rand(seed, i) * 0.6;
    const dist = s * (0.45 + rand(seed, i + 7) * 0.45) * spread;
    return { "--dx": `${Math.cos(angle) * dist}px`, "--dy": `${Math.sin(angle) * dist - up}px` } as CSSProperties;
  };
  switch (id) {
    case "fire":
      for (let i = 0; i < n; i += 1)
        parts.push(<span key={i} className="spark absolute" style={{ width: 10 + (i % 3) * 4, height: 14 + (i % 3) * 6, borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%", background: `radial-gradient(circle at 50% 70%, #fff6c2, ${glow} 35%, ${color} 70%)`, boxShadow: `0 0 12px ${color}`, ...fly(i, 0.9, s * 0.35) }} />);
      break;
    case "ice":
      for (let i = 0; i < n; i += 1) {
        const angle = (i / n) * 360;
        parts.push(<span key={i} className="spark absolute" style={{ width: 6, height: 22 + (i % 3) * 6, background: `linear-gradient(${glow}, ${color})`, clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)", rotate: `${angle + 90}deg`, filter: `drop-shadow(0 0 4px ${glow})`, ...fly(i) }} />);
      }
      parts.push(<span key="frost" className="anim-burst absolute rounded-full" style={{ width: s, height: s, border: `2px dashed ${glow}`, boxShadow: `0 0 18px ${color}` }} />);
      break;
    case "lightning":
      parts.push(
        <svg key="bolts" className="fx-flicker absolute" width={s * 1.6} height={s * 1.6} viewBox="-50 -50 100 100" aria-hidden>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k / 5) * Math.PI * 2 + rand(seed, k);
            const pts = [0, 1, 2, 3, 4].map((j) => {
              const r = (j / 4) * 46;
              const off = j && j < 4 ? (rand(seed, k * 9 + j) - 0.5) * 16 : 0;
              return `${Math.cos(a) * r - Math.sin(a) * off},${Math.sin(a) * r + Math.cos(a) * off}`;
            });
            return <polyline key={k} points={pts.join(" ")} fill="none" stroke={k % 2 ? "#fff" : color} strokeWidth={k % 2 ? 1.6 : 2.6} strokeLinejoin="bevel" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />;
          })}
        </svg>,
      );
      break;
    case "light":
    case "energy":
      parts.push(<span key="h" className="fx-flare absolute" style={{ width: s * 1.8, height: 6, background: `linear-gradient(90deg, transparent, ${glow}, #fff, ${glow}, transparent)` }} />);
      parts.push(<span key="v" className="fx-flare absolute" style={{ width: 6, height: s * 1.4, background: `linear-gradient(180deg, transparent, ${glow}, #fff, ${glow}, transparent)` }} />);
      parts.push(<span key="r" className="anim-burst absolute rounded-full" style={{ width: s, height: s, border: `4px solid ${color}`, boxShadow: `0 0 30px ${color}, inset 0 0 20px ${glow}` }} />);
      break;
    case "psychic":
    case "life":
    case "shield":
      [0, 1, 2].forEach((k) =>
        parts.push(
          <span
            key={k}
            className="anim-burst absolute"
            style={{ width: s * (0.6 + k * 0.3), height: s * (0.6 + k * 0.3), animationDelay: `${k * 90}ms`, border: `3px solid ${k ? color : glow}`, borderRadius: id === "shield" ? 0 : "9999px", clipPath: id === "shield" ? "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)" : undefined, background: id === "shield" ? `color-mix(in srgb, ${color} 25%, transparent)` : undefined, boxShadow: `0 0 16px ${color}` }}
          />,
        ),
      );
      if (id === "life") for (let i = 0; i < 6; i += 1) parts.push(<span key={`p${i}`} className="spark absolute font-black" style={{ color, fontSize: 14, textShadow: `0 0 6px ${color}`, ...fly(i, 0.8, s * 0.2) }}>+</span>);
      break;
    case "speed":
    case "wind":
      for (let i = 0; i < 7; i += 1)
        parts.push(<span key={i} className="fx-streak absolute rounded-full" style={{ top: `calc(50% + ${(i - 3) * 9}px)`, width: s * (0.8 + rand(seed, i) * 0.8), height: i % 2 ? 2 : 3, background: `linear-gradient(90deg, transparent, ${glow}, ${color})`, animationDelay: `${i * 25}ms` }} />);
      if (id === "wind") parts.push(<span key="curl" className="fx-spin absolute rounded-full" style={{ width: s * 0.9, height: s * 0.9, border: `3px solid transparent`, borderTopColor: color, borderRightColor: glow }} />);
      break;
    case "gravity":
      parts.push(<span key="i" className="fx-implode absolute rounded-full" style={{ width: s * 1.5, height: s * 1.5, border: `3px solid ${color}`, boxShadow: `0 0 24px ${color}, inset 0 0 30px ${color}` }} />);
      parts.push(<span key="c" className="anim-pop absolute rounded-full" style={{ width: s * 0.3, height: s * 0.3, background: `radial-gradient(circle, #000 40%, ${color})`, boxShadow: `0 0 20px ${color}` }} />);
      break;
    case "warp":
    case "arcane":
      parts.push(<span key="d" className="fx-spin absolute rounded-full" style={{ width: s, height: s, background: id === "warp" ? `conic-gradient(from 0deg, ${color}, transparent, ${glow}, transparent, ${color})` : "transparent", border: id === "arcane" ? `3px dashed ${color}` : undefined, boxShadow: `0 0 20px ${color}`, opacity: 0.9 }} />);
      if (id === "arcane") parts.push(<span key="d2" className="fx-spin-rev absolute rounded-full" style={{ width: s * 0.65, height: s * 0.65, border: `2px dotted ${glow}` }} />);
      for (let i = 0; i < 6; i += 1) parts.push(<span key={`s${i}`} className="spark absolute rounded-full" style={{ width: 5, height: 5, background: glow, boxShadow: `0 0 8px ${color}`, ...fly(i) }} />);
      break;
    case "shadow":
      for (let i = 0; i < 7; i += 1) parts.push(<span key={i} className="spark absolute rounded-full" style={{ width: 22 + (i % 3) * 8, height: 22 + (i % 3) * 8, background: `radial-gradient(circle, ${color}, transparent 70%)`, filter: "blur(2px)", ...fly(i, 0.7) }} />);
      break;
    default: {
      parts.push(<span key="star" className="anim-burst absolute" style={{ width: s, height: s, background: `radial-gradient(circle, #fff 10%, ${glow} 35%, ${color} 60%)`, clipPath: "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" }} />);
      for (let i = 0; i < n; i += 1) parts.push(<span key={i} className="spark absolute" style={{ width: 6, height: 6, background: i % 2 ? "#fff" : color, rotate: `${i * 30}deg`, ...fly(i) }} />);
    }
  }
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      <span className="anim-burst absolute rounded-full" style={{ width: s * 0.5, height: s * 0.5, background: `radial-gradient(circle, #fff, ${glow} 45%, transparent 70%)` }} />
      {parts}
    </span>
  );
}

/** The attack crossing the arena, from the attacker toward the target. `reverse` = right to left. */
export function Projectile({ element, reverse = false, seed = 1 }: { element: string | undefined; reverse?: boolean; seed?: number }) {
  const id = elementOf(element);
  const { color, glow, travel } = ELEMENTS[id];
  const flip: CSSProperties = reverse ? { transform: "scaleX(-1)" } : {};
  let body: React.ReactNode = null;
  if (travel === "orb") {
    body = (
      <span className="fx-travel absolute top-1/2 size-7 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle at 40% 40%, #fff, ${glow} 40%, ${color} 75%)`, boxShadow: `0 0 18px ${color}, -18px 0 22px -4px ${color}, -34px 0 26px -10px ${glow}` }} />
    );
  } else if (travel === "beam") {
    body = <span className="fx-beam absolute top-1/2 left-0 h-3 w-full -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, #fff 40%, ${glow})`, boxShadow: `0 0 16px ${color}, 0 0 4px #fff` }} />;
  } else if (travel === "bolt") {
    const pts = Array.from({ length: 9 }, (_, j) => `${(j / 8) * 100},${j === 0 || j === 8 ? 10 : 10 + (rand(seed, j) - 0.5) * 16}`).join(" ");
    body = (
      <svg className="fx-flicker absolute inset-x-0 top-1/2 h-10 w-full -translate-y-1/2 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="3.5" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <polyline points={pts} fill="none" stroke="#fff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  } else if (travel === "ripple") {
    body = [0, 1, 2].map((k) => (
      <span key={k} className="fx-travel absolute top-1/2 size-8 -translate-y-1/2 rounded-full" style={{ animationDelay: `${k * 60}ms`, border: `3px solid ${k === 1 ? glow : color}`, boxShadow: `0 0 12px ${color}` }} />
    ));
  } else if (travel === "streak") {
    body = [0, 1, 2, 3].map((k) => (
      <span key={k} className="fx-beam absolute left-0 h-[3px] w-full rounded-full" style={{ top: `${30 + k * 13}%`, animationDelay: `${k * 30}ms`, background: `linear-gradient(90deg, transparent, ${glow} 60%, ${color})` }} />
    ));
  }
  if (!body) return null;
  return (
    <span className="pointer-events-none absolute inset-y-0 left-[26%] right-[26%]" style={flip} aria-hidden>
      {body}
    </span>
  );
}
