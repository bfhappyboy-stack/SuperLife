/**
 * Poster art for a saved mystery life in the Arena (2026-11-10 am): a backlit hero silhouette with a rim light in
 * their power's colour, glowing lenses, their family emblem on the chest, a cape and the city behind them.
 * Replaces the paper doll for custom heroes; legends use their painted portraits. Pure SVG, seeded, no assets.
 */
import { useId } from "react";
import { FAMILY_PATH } from "@/components/game/icons";
import type { CapeFamily } from "@/game/theme";

function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MALE =
  "M104 112L100 122C86 124 76 130 72 142L62 200 58 248C57 256 62 262 68 258L76 206 84 168 88 214 84 250 80 330 74 372 96 374 104 300 120 262 136 300 144 374 166 372 160 330 156 250 152 214 156 168 164 206 172 258C178 262 183 256 182 248L178 200 168 142C164 130 154 124 140 122L136 112Z";
const FEMALE =
  "M106 112L103 122C91 124 83 130 79 142L69 198 64 246C63 254 68 260 74 256L82 204 89 168 92 210 86 250 82 330 77 372 98 374 105 300 120 264 135 300 142 374 163 372 158 330 154 250 148 210 151 168 158 204 166 256C172 260 177 254 176 246L171 198 161 142C157 130 149 124 137 122L134 112Z";
const HAIR_F = "M101 86C99 66 111 58 120 58 132 58 142 66 140 88 146 104 148 124 142 140 136 128 138 108 134 96 128 104 112 104 106 96 102 108 104 128 98 140 92 124 96 104 101 86Z";
const HAIR_M = "M102 88C100 70 110 62 121 62 133 62 141 71 138 90 134 80 128 76 120 77 112 77 106 80 102 88Z";

export function LifeHeroArt({ seed, sex, family, accent, className = "" }: { seed: number; sex: "male" | "female"; family: CapeFamily | null; accent: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const r = rng(seed);
  const body = sex === "female" ? FEMALE : MALE;
  // A skyline of eleven towers with a few lit windows, the same every time for this hero.
  const towers = Array.from({ length: 11 }, (_, i) => {
    const w = 18 + r() * 12;
    const h = 40 + r() * 70;
    return { x: i * 22 - 6 + r() * 6, w, h, lit: Array.from({ length: 3 }, () => ({ dx: 3 + r() * (w - 8), dy: 6 + r() * (h - 20), on: r() < 0.55 })) };
  });
  const tilt = (r() - 0.5) * 6;
  return (
    <svg viewBox="20 44 200 340" preserveAspectRatio="xMidYMin slice" className={`absolute inset-0 block size-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f1d" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#05070d" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="50%" cy="38%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.75" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2438" />
          <stop offset="100%" stopColor="#090c15" />
        </linearGradient>
        <linearGradient id={`${id}cape`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141a2b" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
        </linearGradient>
        <filter id={`${id}blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      <rect width="240" height="400" fill={`url(#${id}bg)`} />
      <g className="life-rays" style={{ transformOrigin: "120px 150px" }} opacity="0.5">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d="M120 150 L114 -60 L126 -60 Z" fill={accent} opacity="0.12" transform={`rotate(${(i * 360) / 14} 120 150)`} />
        ))}
      </g>
      <circle cx="120" cy="150" r="130" fill={`url(#${id}glow)`} />
      <g fill="#060910">
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={400 - t.h} width={t.w} height={t.h} />
            {t.lit.map((w, k) => w.on && <rect key={k} x={t.x + w.dx} y={400 - t.h + w.dy} width="3" height="4" fill={accent} opacity="0.55" />)}
          </g>
        ))}
      </g>
      <ellipse cx="120" cy="378" rx="62" ry="8" fill="#000" opacity="0.55" />
      <g transform={`rotate(${tilt} 120 380)`}>
        <path d="M100 122C68 162 46 282 34 388L206 388C194 282 172 162 140 122Z" fill={`url(#${id}cape)`} />
        <path d="M100 122C68 162 46 282 34 388M140 122C172 162 194 282 206 388" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" />
        {sex === "female" && <path d={HAIR_F} fill="#0b0e18" />}
        <g filter={`url(#${id}blur)`} opacity="0.9">
          <path d={body} fill="none" stroke={accent} strokeWidth="4" />
          <ellipse cx="120" cy="92" rx="17" ry="21" fill="none" stroke={accent} strokeWidth="4" />
        </g>
        <path d={body} fill={`url(#${id}body)`} stroke={accent} strokeOpacity="0.95" strokeWidth="1.6" strokeLinejoin="round" />
        <ellipse cx="120" cy="92" rx="17" ry="21" fill="#151b2c" stroke={accent} strokeOpacity="0.95" strokeWidth="1.6" />
        {sex === "male" && <path d={HAIR_M} fill="#0b0e18" />}
        <path d="M104 88C110 84 130 84 136 88L135 97C128 95 112 95 105 97Z" fill="#05070d" />
        <g filter={`url(#${id}blur)`}>
          <path d="M108 90L117 92 116 95 109 94Z M132 90L123 92 124 95 131 94Z" fill={accent} />
        </g>
        <path d="M108 90L117 92 116 95 109 94Z M132 90L123 92 124 95 131 94Z" fill="#fff" />
        <circle cx="120" cy="178" r="17" fill="#0a0e19" stroke={accent} strokeWidth="2" />
        <circle cx="120" cy="178" r="17" fill="none" stroke={accent} strokeWidth="5" opacity="0.4" filter={`url(#${id}blur)`} />
        {family ? (
          <path d={FAMILY_PATH[family]} transform="translate(108 166)" fill={accent} fillRule="evenodd" />
        ) : (
          <path d="M120 167l3 7 7.5.6-5.7 4.9 1.8 7.4-6.6-4-6.6 4 1.8-7.4-5.7-4.9 7.5-.6Z" fill={accent} />
        )}
      </g>
    </svg>
  );
}
