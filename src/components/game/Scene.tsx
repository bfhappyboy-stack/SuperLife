/**
 * Backdrops: painted key art for the three signature cities (lazy webp chunks, ~15-29 KB each), layered SVG skylines
 * for the rest, and a chapter-phase light wash on top. Purely decorative and pointer-events: none.
 */
import { memo, useEffect, useState } from "react";
import { cachedArt, hasArt, loadArt } from "@/assets/art";
import { phaseStyle } from "@/components/game/phaseStyle";

/** Resolves a key-art data URI lazily; undefined until loaded (callers fade it in). */
export function useArt(key: string): string | undefined {
  const [src, setSrc] = useState(() => cachedArt(key));
  useEffect(() => {
    if (!hasArt(key)) return setSrc(undefined);
    let alive = true;
    loadArt(key).then((url) => alive && setSrc(url));
    return () => {
      alive = false;
    };
  }, [key]);
  return src;
}

const SKY: Record<string, [string, string, string]> = {
  metro: ["#18233f", "#2f3f6b", "#f2b866"],
  harbor: ["#0f2633", "#1f4d5e", "#ffd08a"],
  neon: ["#1a0f2e", "#3b1d5e", "#ff6fd8"],
  dust: ["#2a1a14", "#7a4a2a", "#ffcf7a"],
  crown: ["#14162a", "#2c2f52", "#e6c27a"],
  default: ["#121a2c", "#26324f", "#e6b34d"],
};

export const PHASE_TINT: Record<string, string> = {
  origin: "rgba(255, 196, 120, 0.22)",
  coming: "rgba(80, 220, 200, 0.18)",
  early: "rgba(120, 160, 255, 0.18)",
  rising: "rgba(255, 200, 90, 0.2)",
  crisis: "rgba(255, 70, 70, 0.22)",
  legacy: "rgba(255, 170, 90, 0.2)",
  mentor: "rgba(190, 140, 255, 0.2)",
  final: "rgba(255, 130, 160, 0.18)",
};

function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const Skyline = memo(function Skyline({ cityId }: { cityId: string }) {
  const [top, mid, glow] = SKY[cityId] ?? SKY.default;
  const r = rand(cityId.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const layer = (base: number, maxH: number, w: [number, number], count: number) => {
    let x = -10;
    const out: { x: number; w: number; h: number; spire: boolean }[] = [];
    for (let i = 0; i < count && x < 400; i++) {
      const bw = w[0] + r() * (w[1] - w[0]);
      out.push({ x, w: bw, h: base + r() * maxH, spire: r() < 0.18 });
      x += bw + r() * 4;
    }
    return out;
  };
  const far = layer(120, 220, [18, 40], 40);
  const near = layer(60, 150, [28, 60], 30);
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`sky-${cityId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="0.75" stopColor={glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={top} />
        </linearGradient>
        <radialGradient id={`moon-${cityId}`} cx="0.75" cy="0.18" r="0.35">
          <stop offset="0" stopColor={glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="844" fill={`url(#sky-${cityId})`} />
      <rect width="390" height="844" fill={`url(#moon-${cityId})`} />
      <circle cx="292" cy="150" r="26" fill={glow} opacity="0.5" />
      <g fill={mid} opacity="0.7">
        {far.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={620 - b.h} width={b.w} height={b.h + 240} />
            {b.spire && <path d={`M${b.x + b.w / 2 - 2} ${620 - b.h} L${b.x + b.w / 2} ${580 - b.h} L${b.x + b.w / 2 + 2} ${620 - b.h} Z`} />}
          </g>
        ))}
      </g>
      <g fill={top}>
        {near.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={700 - b.h} width={b.w} height={b.h + 160} />
            {Array.from({ length: Math.floor(b.h / 16) }).map((_, j) =>
              r() < 0.32 ? <rect key={j} x={b.x + 4 + (j % 3) * ((b.w - 10) / 3)} y={706 - b.h + j * 14} width="4" height="5" fill={glow} opacity={0.35 + r() * 0.5} /> : null,
            )}
          </g>
        ))}
      </g>
    </svg>
  );
});

/** Full-bleed city backdrop. `bright` keeps the top of the art visible (title, chapter card). */
export function CityScene({ cityId, phase, bright = false, drift = false }: { cityId: string; phase?: string | null; bright?: boolean; drift?: boolean }) {
  const art = useArt(cityId);
  return (
    <div className={`scene ${bright ? "scene-bright" : ""}`} aria-hidden>
      {hasArt(cityId) ? art && <img src={art} alt="" decoding="async" className={`anim-fade ${drift ? "anim-drift" : ""}`} /> : <Skyline cityId={cityId} />}
      {phase && <div className="absolute inset-0" style={{ background: `radial-gradient(120% 60% at 50% 0%, ${PHASE_TINT[phase] ?? "transparent"}, transparent 70%)` }} />}
    </div>
  );
}

/** Chapter card illustration: phase-lit sky, sun or moon on its arc, rays, the city skyline, and the chapter numeral. */
/** Title key art, lazily loaded. */
export function TitleArt({ className = "" }: { className?: string }) {
  const art = useArt("title");
  return art ? <img src={art} alt="" aria-hidden className={`anim-fade ${className}`} /> : null;
}

export function ChapterArt({ index, phase, cityId, className = "h-56" }: { index: number; phase: string; cityId: string; className?: string }) {
  const order = ["origin", "coming", "early", "rising", "crisis", "legacy", "mentor", "final"];
  const t = Math.max(0, order.indexOf(phase)) / (order.length - 1);
  const sunX = 60 + t * 270;
  const sunY = 150 - Math.sin(Math.PI * (0.15 + t * 0.7)) * 90;
  const tint = PHASE_TINT[phase] ?? "rgba(255,200,90,.2)";
  const crisis = phase === "crisis";
  const art = useArt(cityId);
  return (
    <div className={`relative overflow-hidden bg-ink ${className}`} aria-hidden>
      {hasArt(cityId) ? art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0"><Skyline cityId={cityId} /></div>}
      <svg viewBox="0 0 390 224" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="ch-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={crisis ? "#ff8a7a" : "#fff3d1"} />
            <stop offset="0.4" stopColor={crisis ? "#ff4d4d" : "#ffc861"} stopOpacity="0.8" />
            <stop offset="1" stopColor={crisis ? "#ff4d4d" : "#ffc861"} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ch-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect width="390" height="224" fill={tint} />
        <g opacity="0.35" stroke={crisis ? "#ff8a7a" : "#ffe2a0"} strokeWidth="2">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={sunX + Math.cos(a) * 40} y1={sunY + Math.sin(a) * 40} x2={sunX + Math.cos(a) * 140} y2={sunY + Math.sin(a) * 140} />;
          })}
        </g>
        <circle cx={sunX} cy={sunY} r="70" fill="url(#ch-sun)" className="anim-glow" style={{ transformOrigin: `${sunX}px ${sunY}px` }} />
        <circle cx={sunX} cy={sunY} r="16" fill={crisis ? "#ffb0a0" : "#fff6dc"} />
        <PhaseMotif phase={phase} seed={index * 31 + 7} />
        <rect width="390" height="224" fill="url(#ch-fade)" />
        <text x="20" y="206" fontFamily="Anton, sans-serif" fontSize="120" fill="#fff" opacity="0.14">
          {String(index).padStart(2, "0")}
        </text>
      </svg>
    </div>
  );
}

/** A quiet, phase-specific layer over the chapter art (sparks, rising motes, window grid, spotlights, rain, laurel, stars, moon). */
function PhaseMotif({ phase, seed }: { phase: string; seed: number }) {
  const { accent, motif } = phaseStyle(phase);
  const r = rand(seed);
  const pts = Array.from({ length: 18 }, () => [r() * 390, r() * 224, r()] as const);
  switch (motif) {
    case "sparks":
      return <g fill={accent}>{pts.map(([x, y, k], i) => <circle key={i} cx={x} cy={y * 0.8} r={0.8 + k * 1.6} opacity={0.25 + k * 0.45} className="anim-glow" style={{ animationDelay: `${(k * 2).toFixed(2)}s` }} />)}</g>;
    case "rise":
      return <g fill={accent}>{pts.map(([x, y, k], i) => <rect key={i} x={x} y={60 + y * 0.7} width="1.6" height={6 + k * 14} rx="0.8" opacity={0.15 + k * 0.35} />)}</g>;
    case "grid":
      return <g stroke={accent} strokeOpacity="0.14" strokeWidth="1">{Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 48 + 6} y1="0" x2={i * 48 + 6} y2="224" />)}{Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 48 + 10} x2="390" y2={i * 48 + 10} />)}</g>;
    case "beams":
      return <g fill={accent} opacity="0.16">{[60, 200, 330].map((x, i) => <polygon key={i} points={`${x - 6},224 ${x + 6},224 ${x + 40 - i * 40},0 ${x + 10 - i * 40},0`} />)}</g>;
    case "rain":
      return <g stroke={accent} strokeOpacity="0.32" strokeWidth="1.2">{pts.concat(pts.map(([x, y, k]) => [(x + 97) % 390, (y + 53) % 224, k] as const)).map(([x, y, k], i) => <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 12 + k * 10} />)}</g>;
    case "laurel":
      return <g fill={accent} opacity="0.22" transform="translate(330 40)">{Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={Math.cos(Math.PI * (0.55 + i * 0.13)) * 34} cy={Math.sin(Math.PI * (0.55 + i * 0.13)) * 34} rx="8" ry="3.4" transform={`rotate(${100 + i * 24} ${Math.cos(Math.PI * (0.55 + i * 0.13)) * 34} ${Math.sin(Math.PI * (0.55 + i * 0.13)) * 34})`} />)}</g>;
    case "stars": {
      const s = pts.slice(0, 7).map(([x, y]) => [x, y * 0.6] as const);
      return <g stroke={accent} strokeOpacity="0.3" fill={accent}><polyline points={s.map((p) => p.join(",")).join(" ")} fill="none" />{s.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" opacity="0.7" />)}</g>;
    }
    case "moon":
      return <g><circle cx="320" cy="44" r="18" fill={accent} opacity="0.35" /><circle cx="328" cy="38" r="16" fill="#0b0f1a" opacity="0.55" />{pts.slice(0, 10).map(([x, y, k], i) => <circle key={i} cx={x} cy={y * 0.5} r={0.7 + k} fill="#fff" opacity={0.2 + k * 0.4} />)}</g>;
  }
}
