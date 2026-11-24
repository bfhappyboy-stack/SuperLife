/**
 * Lit props for the chase road (2026-11-18 pm): the wrecks you dodge and the sparks you grab, drawn as shaded SVG
 * set pieces (concrete barrier, crashed car, girder pile; an energy shard with a motion streak) instead of flat striped
 * blocks and glowing dots. Non-character graphics only. Switch: CHASE_PROPS in miniStageState.ts.
 */
import { useId } from "react";

/** Which wreck stands at a row/lane: fixed per course, so a replay looks the same. */
export function wreckVariant(row: number, lane: number): 0 | 1 | 2 {
  return ((row * 7 + lane * 3) % 3) as 0 | 1 | 2;
}

function Shadow({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}sh`}>
          <stop offset="0" stopColor="#000" stopOpacity=".75" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="76" rx="54" ry="7" fill={`url(#${id}sh)`} />
    </>
  );
}

function Blinker({ cx, cy, delay }: { cx: number; cy: number; delay: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#ffb02e" opacity=".0">
        <animate attributeName="opacity" values=".55;0;.55" dur="0.9s" begin={delay} repeatCount="indefinite" />
      </circle>
      <rect x={cx - 2.6} y={cy - 2} width="5.2" height="4.2" rx="1.2" fill="#3a2a10" />
      <rect x={cx - 2} y={cy - 1.6} width="4" height="3" rx="1" fill="#ffd27a">
        <animate attributeName="fill" values="#fff2c4;#6b4a12;#fff2c4" dur="0.9s" begin={delay} repeatCount="indefinite" />
      </rect>
    </g>
  );
}

function Barrier({ id, color }: { id: string; color: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}cf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9da2ab" />
          <stop offset=".45" stopColor="#5d626d" />
          <stop offset="1" stopColor="#262932" />
        </linearGradient>
        <linearGradient id={`${id}side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".45" />
          <stop offset=".18" stopColor="#000" stopOpacity="0" />
          <stop offset=".82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".5" />
        </linearGradient>
        <pattern id={`${id}hz`} width="10" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
          <rect width="10" height="12" fill="#17171a" />
          <rect width="5" height="12" fill="#f2b632" />
        </pattern>
      </defs>
      <Shadow id={id} />
      {/* base lip, face, top cap */}
      <path d="M2 76 L5 64 L95 64 L98 76 Z" fill="#1d2027" />
      <path d="M5 66 L9 34 L91 34 L95 66 Z" fill={`url(#${id}cf)`} />
      <path d="M5 66 L9 34 L91 34 L95 66 Z" fill={`url(#${id}side)`} />
      <path d="M9 34 L13 28 L87 28 L91 34 Z" fill="#c4c8cf" />
      <path d="M13 28 L87 28" stroke={color} strokeOpacity=".8" strokeWidth="1.2" />
      {/* reflective hazard band */}
      <rect x="10" y="42" width="80" height="10" fill={`url(#${id}hz)`} opacity=".92" />
      <rect x="10" y="42" width="80" height="2" fill="#fff" opacity=".22" />
      {/* chips and cracks */}
      <path d="M62 34 L58 41 L61 44 M24 56 L29 60 L27 65 M80 54 L76 58" stroke="#1a1c22" strokeWidth="1" fill="none" />
      <path d="M86 34 L91 34 L90 40 Z" fill="#2a2d35" />
      <Blinker cx={22} cy={24} delay="0s" />
      <Blinker cx={78} cy={24} delay="0.45s" />
    </>
  );
}

function Car({ id, color }: { id: string; color: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6475" />
          <stop offset=".35" stopColor="#2b313d" />
          <stop offset="1" stopColor="#0e1118" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".55" />
          <stop offset=".5" stopColor="#0b1020" stopOpacity=".95" />
          <stop offset="1" stopColor="#1b2438" />
        </linearGradient>
        <radialGradient id={`${id}tl`}>
          <stop offset="0" stopColor="#ff4a3a" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff2a2a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <Shadow id={id} />
      {/* smoke from the crumpled hood */}
      <g filter={`url(#${id}blur)`} fill="#8a8f99">
        {[0, 1, 2].map((n) => (
          <circle key={n} cx={46 + n * 6} cy="16" r="6">
            <animate attributeName="cy" values="20;-14" dur="2.4s" begin={`${n * 0.8}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="4;11" dur="2.4s" begin={`${n * 0.8}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values=".55;0" dur="2.4s" begin={`${n * 0.8}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <g transform="rotate(-5 50 70)">
        {/* tyres */}
        <rect x="11" y="60" width="15" height="16" rx="3" fill="#07080b" />
        <rect x="74" y="60" width="15" height="16" rx="3" fill="#07080b" />
        {/* cabin and rear glass */}
        <path d="M24 40 L31 21 Q33 18 37 18 L63 18 Q67 18 69 21 L76 40 Z" fill="#141923" />
        <path d="M30 37 L35 24 L65 24 L70 37 Z" fill={`url(#${id}glass)`} />
        <path d="M44 24 L49 31 L46 37 M49 31 L58 29 L64 33 M49 31 L53 37" stroke="#cfe0ff" strokeOpacity=".55" strokeWidth=".7" fill="none" />
        <path d="M31 21 Q33 18 37 18 L63 18 Q67 18 69 21" stroke={color} strokeOpacity=".7" strokeWidth="1" fill="none" />
        {/* body */}
        <path d="M7 66 L9 47 Q11 40 20 40 L80 40 Q89 40 91 47 L93 66 Q93 70 89 70 L11 70 Q7 70 7 66 Z" fill={`url(#${id}body)`} />
        <path d="M10 46 Q12 41 20 41 L80 41 Q88 41 90 46" stroke="#a9b3c6" strokeOpacity=".55" strokeWidth="1" fill="none" />
        {/* taillights with glow */}
        <ellipse cx="19" cy="48" rx="12" ry="7" fill={`url(#${id}tl)`} />
        <ellipse cx="81" cy="48" rx="12" ry="7" fill={`url(#${id}tl)`}>
          <animate attributeName="opacity" values="1;.25;1;1" dur="1.3s" repeatCount="indefinite" />
        </ellipse>
        <rect x="12" y="45" width="15" height="6" rx="1.5" fill="#ff3b2f" />
        <rect x="73" y="45" width="15" height="6" rx="1.5" fill="#ff3b2f" />
        <rect x="13" y="45.6" width="13" height="1.6" rx=".8" fill="#ffd0c8" opacity=".8" />
        <rect x="74" y="45.6" width="13" height="1.6" rx=".8" fill="#ffd0c8" opacity=".8" />
        {/* plate and dented bumper */}
        <rect x="41" y="50" width="18" height="7" rx="1" fill="#d9dde4" />
        <rect x="41" y="50" width="18" height="7" rx="1" fill="#000" opacity=".25" />
        <path d="M8 60 L40 61 L46 64 L54 61 L92 60 L92 66 L8 66 Z" fill="#161a22" />
        <path d="M8 60 L40 61 L46 64 L54 61 L92 60" stroke="#6c7587" strokeWidth=".8" fill="none" />
      </g>
    </>
  );
}

function Debris({ id, color }: { id: string; color: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b0603a" />
          <stop offset=".5" stopColor="#6e321c" />
          <stop offset="1" stopColor="#2c140b" />
        </linearGradient>
        <linearGradient id={`${id}slab`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f949d" />
          <stop offset="1" stopColor="#2c2f37" />
        </linearGradient>
        <radialGradient id={`${id}ember`}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".95" />
          <stop offset=".4" stopColor="#ff7a2a" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff4a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow id={id} />
      {/* ember glow behind the pile */}
      <ellipse cx="52" cy="66" rx="30" ry="14" fill={`url(#${id}ember)`}>
        <animate attributeName="opacity" values=".9;.55;1;.7;.9" dur="1.1s" repeatCount="indefinite" />
      </ellipse>
      {/* crossed girders */}
      <g transform="rotate(-22 50 50)">
        <rect x="4" y="44" width="92" height="9" fill={`url(#${id}beam)`} />
        <rect x="4" y="42" width="92" height="2.5" fill="#d27a4a" />
        <rect x="4" y="53" width="92" height="2.5" fill="#3a1a0e" />
        {[16, 34, 52, 70, 88].map((x) => (
          <circle key={x} cx={x} cy="48.5" r="1.3" fill="#2a120a" />
        ))}
      </g>
      <g transform="rotate(14 50 50)">
        <rect x="10" y="50" width="80" height="8" fill={`url(#${id}beam)`} />
        <rect x="10" y="48" width="80" height="2.4" fill="#d27a4a" />
        <path d="M10 48 L90 48" stroke={color} strokeOpacity=".7" strokeWidth=".9" />
      </g>
      {/* concrete slabs with rebar */}
      <path d="M8 76 L14 58 L38 54 L44 76 Z" fill={`url(#${id}slab)`} />
      <path d="M14 58 L38 54" stroke="#c9ccd2" strokeWidth="1.2" />
      <path d="M56 76 L60 60 L84 57 L94 76 Z" fill={`url(#${id}slab)`} />
      <path d="M60 60 L84 57" stroke="#c9ccd2" strokeWidth="1.2" />
      <path d="M22 56 L18 40 M30 55 L33 38 M70 58 L74 42" stroke="#4a3a30" strokeWidth="1.4" strokeLinecap="round" />
      {/* falling embers */}
      {[0, 1, 2, 3].map((n) => (
        <circle key={n} cx={36 + n * 9} cy="60" r=".9" fill="#ffd27a">
          <animate attributeName="cy" values="64;34" dur={`${1 + n * 0.25}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0" dur={`${1 + n * 0.25}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

/** A lit wreck that blocks one lane; fills its box, sits on the box's bottom edge. */
export function ChaseWreck({ variant, color }: { variant: 0 | 1 | 2; color: string }) {
  const id = `cw${useId().replace(/:/g, "")}`;
  const Prop = variant === 0 ? Barrier : variant === 1 ? Car : Debris;
  return (
    <svg viewBox="0 16 100 64" preserveAspectRatio="xMidYMax meet" className="h-full w-full overflow-visible" aria-hidden="true">
      <Prop id={id} color={color} />
    </svg>
  );
}

/** A spark to grab: an energy shard with a halo, a pulse ring and a motion streak trailing up the road. */
export function ChaseSpark() {
  const id = `cs${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}st`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffb84d" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}halo`}>
          <stop offset="0" stopColor="#fff6d6" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffcf4d" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}core`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#ff9f2e" />
        </linearGradient>
      </defs>
      {/* glow pool on the road */}
      <ellipse cx="30" cy="62" rx="22" ry="5" fill="#ffb84d" opacity=".35" />
      {/* motion streak */}
      <path d="M24 30 L28 -40 L32 -40 L36 30 Z" fill={`url(#${id}st)`} opacity=".7" />
      <path d="M29 30 L29.6 -55 L30.4 -55 L31 30 Z" fill="#fff" opacity=".5" />
      <circle cx="30" cy="30" r="26" fill={`url(#${id}halo)`}>
        <animate attributeName="r" values="22;27;22" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="30" cy="30" r="14" fill="none" stroke="#ffe7a3" strokeWidth="1.2">
        <animate attributeName="r" values="10;24" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".9;0" dur="1s" repeatCount="indefinite" />
      </circle>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 30 30;360 30 30" dur="3s" repeatCount="indefinite" />
        <path d="M30 4 L33 27 L56 30 L33 33 L30 56 L27 33 L4 30 L27 27 Z" fill="#fff4cf" opacity=".55" />
      </g>
      <path d="M30 16 L37 30 L30 44 L23 30 Z" fill={`url(#${id}core)`} stroke="#fff" strokeWidth=".8" />
      <path d="M30 16 L37 30 L30 30 Z" fill="#fff" opacity=".55" />
    </svg>
  );
}
