import { useId } from "react";
import { HAIR, SKIN } from "@/game/look";
import type { Look } from "@/game/types";

/**
 * Painted bust for people (2026-11-14 pm): the same night-city, rim-lit, painted
 * style as the hero and villain cards, drawn in SVG so every procedural person
 * (you, family, friends, partners, mentors, rival capes) costs no download.
 * Soft-shaded head with a real jaw, small almond eyes, clothes on the shoulders,
 * a key light from the upper left, a rim light in the power colour from the
 * right, city bokeh behind and a vignette. `Portrait` picks it via PAINTED_FACES.
 */

/** Muted wardrobe for the shoulders, picked by seed. */
const COATS = ["#22262f", "#2b3446", "#3a2f2a", "#33402f", "#4a2430", "#5a4632", "#2f3c44", "#40364c"];
const SHIRTS = ["#d9d4c8", "#8f9aa8", "#1b1d22", "#b98e5c", "#6d7f8f", "#c9b9a0"];
const IRIS = ["#3b2414", "#2a3f5c", "#3d4f2a", "#5a3a1a", "#1d1a18"];
const BOKEH = ["#f5c46b", "#6fb7ff", "#ff7a6b", "#9ef0d8", "#c79bff"];

function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function rnd(seed: number, k: number): number {
  let x = (seed * 2654435761 + k * 40503) | 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d);
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39);
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

export function PaintedFace({
  seed,
  age,
  female,
  face,
  rank,
  mood,
  beard,
}: {
  seed: number;
  age: number;
  female: boolean;
  face: Look;
  rank: number;
  mood: number;
  beard: "full" | "stubble" | "none";
}) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const baby = age < 4;
  const kid = age < 13;
  const teen = !kid && age < 18;
  const old = age > 62;
  const skin = SKIN[face.skin] ?? SKIN[0];
  const hairBase = age > 68 ? "#cfd1d8" : age > 56 && rnd(seed, 9) < 0.5 ? shade(HAIR[face.hair] ?? HAIR[0], 0.35) : (HAIR[face.hair] ?? HAIR[0]);
  const hair = hairBase;
  const coat = COATS[Math.floor(rnd(seed, 1) * COATS.length)];
  const shirt = SHIRTS[Math.floor(rnd(seed, 2) * SHIRTS.length)];
  const iris = IRIS[Math.floor(rnd(seed, 3) * IRIS.length)];
  const masked = rank > 0 && !baby;
  const smile = mood >= 70 ? 2 : mood >= 45 ? 1 : 0;
  // Proportions: kids have bigger heads on narrower shoulders.
  const s = baby ? 1 : kid ? 1.06 : 1;
  const headT = `translate(40 40) scale(${s}) translate(-40 -40)`;
  const jaw = baby
    ? "M25.6 39.4 C25.6 26.4 32 21 40 21 C48 21 54.4 26.4 54.4 39.4 C54.4 50 48.2 55.6 40 55.6 C31.8 55.6 25.6 50 25.6 39.4 Z"
    : female || kid
    ? "M28.4 35 C28.4 22.5 33.4 17.2 40 17.2 C46.6 17.2 51.6 22.5 51.6 35 C51.6 44.6 47.2 52 40 54.6 C32.8 52 28.4 44.6 28.4 35 Z"
    : "M27.6 35 C27.6 22 33 16.6 40 16.6 C47 16.6 52.4 22 52.4 35 C52.4 43 50.4 49.4 46.2 53.2 Q43.4 55.6 40 55.8 Q36.6 55.6 33.8 53.2 C29.6 49.4 27.6 43 27.6 35 Z";
  const shoulders = kid
    ? "M13 96 C14 80 20 71.6 29 68.6 C32.6 67.4 34.6 65 35.4 62.6 L40 66 L44.6 62.6 C45.4 65 47.4 67.4 51 68.6 C60 71.6 66 80 67 96 Z"
    : female
      ? "M8 96 C9 77 16 68.6 26 65.6 C30.6 64.2 33.4 62 34.8 59.4 L40 71 L45.2 59.4 C46.6 62 49.4 64.2 54 65.6 C64 68.6 71 77 72 96 Z"
      : "M2 96 C3 76 12 67 24 64 C29 62.4 32 60.4 33.6 57.6 L40 72 L46.4 57.6 C48 60.4 51 62.4 56 64 C68 67 77 76 78 96 Z";
  const neck = kid
    ? "M35.4 47 L35.2 64.4 L44.8 64.4 L44.6 47 Z"
    : female
      ? "M35.2 47 L34.8 61 L40 72 L45.2 61 L44.8 47 Z"
      : "M33.6 47 L33.2 60 L40 74 L46.8 60 L46.4 47 Z";
  const bokeh = [0, 1, 2, 3, 4].map((k) => ({
    x: 6 + rnd(seed, 20 + k) * 68,
    y: 6 + rnd(seed, 30 + k) * 44,
    r: 2.4 + rnd(seed, 40 + k) * 4.2,
    c: BOKEH[Math.floor(rnd(seed, 50 + k) * BOKEH.length)],
  }));
  const lipColor = female ? shade("#a8505a", -0.05) : shade(skin, -0.38);
  const browW = female ? 1.05 : 1.6;
  const eyeY = 36.8;

  return (
    <>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2233" />
          <stop offset="60%" stopColor="#10141f" />
          <stop offset="100%" stopColor="#07090e" />
        </linearGradient>
        <radialGradient id={id("halo")} cx="72%" cy="34%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.42" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("vig")} cx="46%" cy="40%" r="74%">
          <stop offset="62%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id={id("coat")} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor={shade(coat, 0.22)} />
          <stop offset="55%" stopColor={coat} />
          <stop offset="100%" stopColor={shade(coat, -0.55)} />
        </linearGradient>
        <linearGradient id={id("neck")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(skin, -0.42)} />
          <stop offset="55%" stopColor={shade(skin, -0.14)} />
          <stop offset="100%" stopColor={shade(skin, -0.25)} />
        </linearGradient>
        <radialGradient id={id("skin")} cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor={shade(skin, 0.16)} />
          <stop offset="48%" stopColor={skin} />
          <stop offset="100%" stopColor={shade(skin, -0.34)} />
        </radialGradient>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="58%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={id("hair")} x1="0.15" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={shade(hair, 0.3)} />
          <stop offset="40%" stopColor={hair} />
          <stop offset="100%" stopColor={shade(hair, -0.5)} />
        </linearGradient>
        <clipPath id={id("head")}>
          <path d={jaw} />
        </clipPath>
        <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed={seed % 97} />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.55 0" />
        </filter>
      </defs>

      {/* Night city behind */}
      <rect width="80" height="96" fill={url("sky")} />
      <rect width="80" height="96" fill={url("halo")} />
      <g filter={url("blur")} opacity="0.55">
        {bokeh.map((b, k) => (
          <circle key={k} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={0.35 + (k % 3) * 0.12} />
        ))}
      </g>
      <path d="M0 64 H7 V55 H12 V58.6 H17.6 V49 H23 V56.4 H27 V60 H53 V51.6 H57.4 V45.6 H62.6 V54 H68 V48.6 H73.6 V56 H80 V96 H0 Z" fill="#0a0d14" opacity="0.78" />
      <g fill="#ffd27a" opacity="0.5">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={k < 3 ? 8.4 + k * 5.2 + rnd(seed, 60 + k) * 2 : 56 + (k - 3) * 6 + rnd(seed, 60 + k) * 2} y={52 + rnd(seed, 70 + k) * 9} width="0.9" height="1.2" />
        ))}
      </g>

      {/* Hair behind the head */}
      {!baby && <HairBack female={female} kid={kid} style={face.style} fill={url("hair")} />}

      {/* Neck, then shoulders and clothes */}
      <path d={neck} fill={url("neck")} />
      <path d={shoulders} fill={url("coat")} />
      {!kid && !female && (
        <path d="M34.6 59.4 L40 72.4 L45.4 59.4 L43.8 58.6 L40 66 L36.2 58.6 Z" fill={shirt} />
      )}
      {!kid && !female && rnd(seed, 6) < 0.4 && <path d="M38.8 66.6 L40 65.6 L41.2 66.6 L40.7 72 L40 73 L39.3 72 Z" fill={shade(coat, -0.45)} />}
      {!kid && female && rnd(seed, 7) < 0.5 && <path d="M36 61 Q40 67.4 44 61" fill="none" stroke="#e8c98a" strokeWidth="0.45" opacity="0.85" />}
      {kid && <path d="M35.2 62.8 Q40 67.6 44.8 62.8" fill="none" stroke={shirt} strokeWidth="1.8" />}
      <path d={shoulders} fill="none" stroke={url("rim")} strokeWidth="1.4" filter={url("soft")} />

      <g transform={headT}>
        {/* Ears */}
        <ellipse cx={baby ? 26 : female || kid ? 28.6 : 27.8} cy={baby ? 40.6 : 38.4} rx="1.9" ry={baby ? 3 : 3.4} fill={shade(skin, -0.12)} />
        <ellipse cx={baby ? 54 : female || kid ? 51.4 : 52.2} cy={baby ? 40.6 : 38.4} rx="1.9" ry={baby ? 3 : 3.4} fill={shade(skin, -0.28)} />
        {/* Head, painted shading */}
        <path d={jaw} fill={url("skin")} />
        <g clipPath={url("head")}>
          <ellipse cx="52" cy="40" rx="8" ry="20" fill={shade(skin, -0.55)} opacity="0.5" filter={url("blur")} />
          <ellipse cx="40" cy="57" rx="13" ry="4" fill={shade(skin, -0.6)} opacity="0.45" filter={url("blur")} />
          <ellipse cx="34" cy="27" rx="7" ry="4" fill="#fff" opacity="0.16" filter={url("blur")} />
          <ellipse cx="33" cy="43" rx="3.2" ry="2" fill="#e0606a" opacity={baby || kid ? 0.28 : female ? 0.16 : 0.08} filter={url("soft")} />
          <ellipse cx="47" cy="43" rx="3.2" ry="2" fill="#e0606a" opacity={baby || kid ? 0.22 : female ? 0.12 : 0.06} filter={url("soft")} />
          {beard === "none" && !female && age >= 18 && <path d="M27.4 40 Q29 52 34 54 Q40 58 46 54 Q51 52 52.6 40 Q51 48.6 46.6 49.6 Q40 48 33.4 49.6 Q29 48.6 27.4 40 Z" fill={shade(skin, -0.5)} opacity="0.14" filter={url("soft")} />}
          {beard === "stubble" && <path d="M27 40 Q29 52 34 54 Q40 58 46 54 Q51 52 53 40 Q52 49 47 49.5 Q40 47.5 33 49.5 Q28 49 27 40 Z" fill={hair} opacity="0.28" filter={url("soft")} />}
          {beard === "full" && <path d="M27 38 Q28 52 33.5 55 Q40 59.5 46.5 55 Q52 52 53 38 Q51.5 47 47 48 Q40 46 33 48 Q28.5 47 27 38 Z" fill={url("hair")} />}
          {old && (
            <g fill="none" stroke={shade(skin, -0.45)} strokeWidth="0.45" opacity="0.6">
              <path d="M34.4 26.6 Q40 25.6 45.6 26.6" />
              <path d="M30.6 39.8 Q31.4 41.2 32.8 41.4" />
              <path d="M49.4 39.8 Q48.6 41.2 47.2 41.4" />
              <path d="M35.4 46.6 Q34.2 49.6 35 51.6" />
              <path d="M44.6 46.6 Q45.8 49.6 45 51.6" />
            </g>
          )}
        </g>
        <path d={jaw} fill="none" stroke={url("rim")} strokeWidth="1.3" filter={url("soft")} />

        <g transform={baby ? "translate(40 44) scale(0.86) translate(-40 -40)" : undefined}>
        {/* Brows */}
        {!baby && (
          <g fill={shade(hair === "#cfd1d8" ? "#8e8e96" : hair, -0.25)}>
            <path d={`M30.8 ${33.4} Q33.8 ${31.6 - (female ? 0.4 : 0)} 37.4 ${32.9} L37.2 ${32.9 + browW} Q34 ${32.6 + browW * 0.4} 31 ${33.4 + browW * 0.7} Z`} />
            <path d={`M49.2 ${33.4} Q46.2 ${31.6 - (female ? 0.4 : 0)} 42.6 ${32.9} L42.8 ${32.9 + browW} Q46 ${32.6 + browW * 0.4} 49 ${33.4 + browW * 0.7} Z`} />
          </g>
        )}

        {/* Eyes */}
        {masked ? (
          <g>
            <path d="M27.6 34.6 Q30 32.4 34 33.4 L40 35.4 L46 33.4 Q50 32.4 52.4 34.6 L52 39.8 Q48.6 42.2 44.2 40.8 L40 39.2 L35.8 40.8 Q31.4 42.2 28 39.8 Z" fill="#14161c" />
            <path d="M27.6 34.6 Q30 32.4 34 33.4 L40 35.4 L46 33.4 Q50 32.4 52.4 34.6" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.7" />
            <path d="M31.6 37.2 Q34.4 35.6 37 37.4 Q34.2 38.4 31.6 37.2 Z" fill="#eef3ff" opacity="0.92" />
            <path d="M48.4 37.2 Q45.6 35.6 43 37.4 Q45.8 38.4 48.4 37.2 Z" fill="#eef3ff" opacity="0.92" />
          </g>
        ) : (
          <g>
            {[34.4, 45.6].map((cx) => (
              <g key={cx}>
                <path d={`M${cx - 3} ${eyeY} Q${cx} ${eyeY - (baby ? 2.6 : 1.9)} ${cx + 3} ${eyeY} Q${cx} ${eyeY + (baby ? 2.2 : 1.5)} ${cx - 3} ${eyeY} Z`} fill="#ece6de" />
                <circle cx={cx + 0.2} cy={eyeY - 0.05} r={baby ? 1.6 : 1.25} fill={iris} />
                <circle cx={cx + 0.2} cy={eyeY - 0.05} r={baby ? 0.8 : 0.6} fill="#0b0908" />
                <circle cx={cx - 0.35} cy={eyeY - 0.55} r="0.38" fill="#fff" opacity="0.9" />
                <path d={`M${cx - 3.2} ${eyeY + 0.1} Q${cx} ${eyeY - (baby ? 2.9 : 2.25)} ${cx + 3.2} ${eyeY + 0.1}`} fill="none" stroke="#1a110c" strokeWidth={female ? 0.85 : 0.65} strokeLinecap="round" />
                {age > 72 && <path d={`M${cx - 2.6} ${eyeY - 0.6} Q${cx} ${eyeY - 1.2} ${cx + 2.6} ${eyeY - 0.6}`} fill="none" stroke={shade(skin, -0.3)} strokeWidth="1.2" />}
              </g>
            ))}
          </g>
        )}

        {/* Nose */}
        <path d="M40.6 38.4 Q41.6 43.2 42 44.6 Q40.8 45.8 39 45.2" fill="none" stroke={shade(skin, -0.42)} strokeWidth="0.75" strokeLinecap="round" opacity="0.75" />
        <ellipse cx="39.9" cy="45.4" rx="2.4" ry="0.8" fill={shade(skin, -0.5)} opacity="0.28" />
        <ellipse cx="39.4" cy="42.4" rx="0.6" ry="2.2" fill="#fff" opacity="0.14" />

        {/* Mouth */}
        {smile === 2 ? (
          <>
            <path d="M35.4 49.4 Q40 52.6 44.6 49.4 Q40 50.4 35.4 49.4 Z" fill={lipColor} />
            {age < 60 && <path d="M36.4 49.8 Q40 51.6 43.6 49.8" fill="none" stroke="#f2ece4" strokeWidth="0.6" opacity="0.8" />}
          </>
        ) : smile === 1 ? (
          <>
            <path d="M36 49.6 Q38 48.8 40 49.2 Q42 48.8 44 49.6 Q40 50.4 36 49.6 Z" fill={lipColor} />
            <path d="M36.4 49.9 Q40 51.8 43.6 49.9 Q40 51 36.4 49.9 Z" fill={shade(lipColor, 0.12)} opacity={female ? 0.95 : 0.5} />
          </>
        ) : (
          <>
            <path d="M36.2 50.2 Q40 49.2 43.8 50.2 Q40 50.7 36.2 50.2 Z" fill={lipColor} />
            <path d="M36.8 50.5 Q40 51.8 43.2 50.5" fill="none" stroke={shade(lipColor, 0.1)} strokeWidth="0.8" opacity={female ? 0.9 : 0.4} />
          </>
        )}

        {face.feature === 1 && <path d="M47.6 40.6 L50.6 46.4" stroke={shade(skin, -0.38)} strokeWidth="0.7" strokeLinecap="round" opacity="0.9" />}
        {face.feature === 3 && (
          <g fill={shade(skin, -0.32)} opacity="0.7">
            {[[32, 41.4], [34, 42.6], [36.2, 41.8], [44, 41.8], [46.2, 42.6], [48.2, 41.4], [38.6, 41.2], [41.4, 41.4]].map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r="0.32" />
            ))}
          </g>
        )}

        </g>

        {/* Hair in front */}
        {!baby ? <HairFront female={female} kid={kid} teen={teen} style={face.style} fill={url("hair")} dark={shade(hair, -0.5)} light={shade(hair, 0.45)} /> : <g fill={url("hair")} opacity="0.9">
            <path d="M30 27.4 Q34 20.4 41 20.8 Q48 21 51 27.4 Q46.4 23.8 41.4 24.6 Q42.4 22.6 40.4 22.4 Q36.4 25 30 27.4 Z" />
          </g>}

        {face.feature === 2 && !masked && age >= 6 && (
          <g fill="none" stroke="#14110f" strokeWidth="0.8">
            <rect x="30.4" y="34.4" width="8" height="5.2" rx="1.6" />
            <rect x="41.6" y="34.4" width="8" height="5.2" rx="1.6" />
            <path d="M38.4 36.4 Q40 35.4 41.6 36.4" />
            <path d="M30.4 36 L28.4 35.4 M49.6 36 L51.6 35.4" />
            <path d="M31.4 35.2 L33.4 35.2" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.5" />
          </g>
        )}
      </g>

      {/* Paint finish: grain and vignette */}
      <rect width="80" height="96" filter={url("grain")} opacity="0.12" style={{ mixBlendMode: "overlay" }} />
      <rect width="80" height="96" fill={url("vig")} />
    </>
  );
}

function HairBack({ female, kid, style, fill }: { female: boolean; kid: boolean; style: number; fill: string }) {
  if (female) {
    if (style === 0 || style === 3) return <path d="M26 34 C24 18 31 11.6 40 11.6 C49 11.6 56 18 54 34 L57 66 C52 74 46 71 44 62 L40 58 L36 62 C34 71 28 74 23 66 Z" fill={fill} />;
    if (style === 4) return <path d="M24.4 36 C21 18 30 11 40 11 C50 11 59 18 55.6 36 C59 46 58 58 54 64 C48 68 32 68 26 64 C22 58 21 46 24.4 36 Z" fill={fill} />;
    if (style === 5) return <ellipse cx="40" cy="15.4" rx="5.6" ry="4.8" fill={fill} />;
    if (kid) return null;
    return <path d="M26.6 34 C25 19 31 13 40 13 C49 13 55 19 53.4 34 L54.6 52 C50 56 30 56 25.4 52 Z" fill={fill} />;
  }
  if (style === 3 && !kid) return <path d="M26.6 32 C25.4 18 31 12.6 40 12.6 C49 12.6 54.6 18 53.4 32 L54.4 56 C49 59 31 59 25.6 56 Z" fill={fill} />;
  if (style === 5 && !kid) return <ellipse cx="40" cy="14.4" rx="4.4" ry="3.6" fill={fill} />;
  return null;
}

function HairFront({
  female,
  kid,
  teen,
  style,
  fill,
  dark,
  light,
}: {
  female: boolean;
  kid: boolean;
  teen: boolean;
  style: number;
  fill: string;
  dark: string;
  light: string;
}) {
  const strands = (d: string) => <path d={d} fill="none" stroke={light} strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />;
  if (female) {
    const cap =
      style === 1
        ? "M27.6 34 C27 19 33 14 41 14.4 C49 14.8 53.6 20 52.6 33 C50 25 44 22.6 36 24.4 C32 25.4 29.4 29 27.6 34 Z"
        : style === 2
          ? "M28 32 C27.6 19.4 33 14.6 40 14.6 C47 14.6 52.4 19.4 52 32 C49 24.6 45.6 22.2 40 22.6 C34.4 22.2 31 24.6 28 32 Z"
          : style === 4
            ? "M27 36 C25.6 18.6 32 13.6 40 13.6 C48 13.6 54.4 18.6 53 36 C51 26 46.4 21 40 23.6 C33.6 21 29 26 27 36 Z"
            : style === 5
              ? "M28.4 30 C28.6 19.6 33.6 15.4 40 15.4 C46.4 15.4 51.4 19.6 51.6 30 C48 23.4 44 22 40 22 C36 22 32 23.4 28.4 30 Z"
              : "M27.2 38 C25.6 18.6 32 13.8 40 13.8 C48 13.8 54.4 18.6 52.8 38 C51.6 30 49 25 43 23.2 C40 26 35 27.4 30 27.6 C28.6 30.6 27.8 34 27.2 38 Z";
    return (
      <>
        <path d={cap} fill={fill} />
        <path d={cap} fill="none" stroke={dark} strokeWidth="0.4" opacity="0.6" />
        {strands("M33 17.6 Q37 16 42 16.6")}
        {strands("M31 22 Q34 18.6 38.4 18")}
        {(style === 0 || style === 3) && !kid && strands("M51 40 Q53 50 52.4 60")}
      </>
    );
  }
  const cap =
    style === 1
      ? "M27.4 33 C26.4 19 32 13.6 41.6 13.8 C50.4 14 54.4 20.6 52.8 31 C51 25.4 47 22.6 40.6 22.4 C34.6 22.4 30.4 26 27.4 33 Z"
      : style === 2
        ? "M28 30.6 C27.8 20 33 15.8 40 15.8 C47 15.8 52.2 20 52 30.6 C50 25.6 46.6 23.6 40 23.6 C33.4 23.6 30 25.6 28 30.6 Z"
        : style === 3
          ? "M27.2 36 C25.8 19 32 13.6 40 13.6 C48 13.6 54.2 19 52.8 36 C51.4 27 47 22.6 40 23 C33 22.6 28.6 27 27.2 36 Z"
          : style === 4
            ? "M27 33 C25.4 18.4 32 13 40 13.2 C48 13 54.6 18.4 53 33 C51.6 27.6 49.4 25 46.6 24 C44.6 26 41.6 23 39 24.6 C36.2 26 33.4 23.6 31.4 25.4 C29.6 27 28.2 29.6 27 33 Z"
            : style === 5
              ? "M28 31.4 C27.6 19.6 33 15 40 15 C47 15 52.4 19.6 52 31.4 C49.6 25.4 45.6 22.8 40 22.8 C34.4 22.8 30.4 25.4 28 31.4 Z"
              : "M27.6 32 C27 19.4 32.6 14.6 40 14.6 C47.4 14.6 53 19.4 52.4 32 C50.6 26.6 47.4 23.6 42 23.4 C38 25 33.6 24.4 31.4 24.8 C29.6 26.4 28.4 29 27.6 32 Z";
  return (
    <>
      <path d={cap} fill={fill} />
      <path d={cap} fill="none" stroke={dark} strokeWidth="0.4" opacity="0.6" />
      {strands(style === 1 ? "M31 22 Q38 16 47 17.4" : "M32 19.6 Q37 16.6 43 17")}
      {strands("M35 21.4 Q40 19 45.6 20.6")}
      {(kid || teen) && style !== 2 && strands("M30 25 Q33 22 36 22.4")}
    </>
  );
}
