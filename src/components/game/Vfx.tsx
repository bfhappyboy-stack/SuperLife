/**
 * Lightweight hit effects: a ring burst, a fan of sparks, and a floating number. Pure CSS transforms,
 * keyed by a counter so each hit replays; all of it switches off under prefers-reduced-motion.
 */
import type { CSSProperties } from "react";

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
