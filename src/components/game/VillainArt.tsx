import { memo, useId, type ReactNode } from "react";
import { type VillainArtId } from "@/components/game/villainArt.data";
import { useArt } from "@/components/game/Scene";

/**
 * Illustrated villain cards for the Arena (and anywhere a signature villain needs a portrait).
 *
 * The 11 legends have painted portraits; the 18 villains used the life-sim paper doll, which looked
 * unfinished next to them. Each villain here is a hand-drawn vector bust in the same card language as
 * the painted heroes: a storm sky in their colour, their home skyline, a lit bust with one rim light,
 * glowing eyes and their signature silhouette (Goblin's glider, Ock's arms, Loki's horns, Hela's
 * antlers…). Pure SVG, no assets, so it costs nothing to load and scales to any card.
 *
 * Coordinates: the bust is authored in a 200×260 space (head ≈ x66–134, y70–164; chest y190–262),
 * drawn into a 200×300 card with a 40px drop.
 */

type Spec = {
  /** Suit and skin gradients, light → dark. */
  suit: [string, string];
  skin: [string, string];
  /** Rim light / storm colour. Defaults to the fighter colour. */
  rim?: string;
  /** Sky tint at the top of the card. */
  sky: string;
  eyes?: { color: string; shape: "slit" | "cat" | "none"; size?: number };
  big?: boolean;
  /** A custom head outline (helmets, skulls). */
  head?: string;
  back?: (k: Kit) => ReactNode;
  front?: (k: Kit) => ReactNode;
  /** A second lightning colour (Reverse-Flash's red). */
  bolt?: string;
};

type Kit = { uid: string; rim: string; glow: string; soft: string; gold: string };

const SHOULDERS = "M4 272 C8 214 40 196 72 188 C82 184 84 176 84 156 L116 156 C116 176 118 184 128 188 C160 196 192 214 196 272 Z";
const SHOULDERS_BIG = "M-14 272 C-10 204 28 184 66 178 C78 174 80 168 80 150 L120 150 C120 168 122 174 134 178 C172 184 210 204 214 272 Z";
const HEAD = "M66 108 C66 80 82 70 100 70 C118 70 134 80 134 108 C134 132 126 150 112 160 C106 164 94 164 88 160 C74 150 66 132 66 108 Z";
const HEAD_BIG = "M62 110 C62 80 80 68 100 68 C120 68 138 80 138 110 C138 136 128 152 114 162 C106 167 94 167 86 162 C72 152 62 136 62 110 Z";

/** Mirror an authored left-side path to the right (x → 200 − x). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);
const both = (d: string, props: React.SVGProps<SVGPathElement>) => (
  <>
    <path d={d} {...props} />
    <path d={mirror(d)} {...props} />
  </>
);

const SPECS: Record<VillainArtId, Spec> = {
  goblin: {
    suit: ["#5a9a34", "#1a3410"], skin: ["#8cd250", "#2c5a18"], sky: "#2a1446",
    eyes: { color: "#ffe14a", shape: "slit", size: 1.25 },
    back: ({ glow }) => (
      <g>
        {/* the glider, wings out behind the shoulders */}
        {both("M70 214 L-6 176 L22 204 L-14 206 L30 226 L4 238 L64 236 Z", { fill: "#2a3a26", stroke: "#8acb5a", strokeWidth: 1.4, strokeLinejoin: "round" })}
        <ellipse cx="100" cy="246" rx="70" ry="9" fill="#ffb02e" opacity=".5" filter={glow} />
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <path d="M58 202 C80 194 120 194 142 202 L152 272 L48 272 Z" fill="#5b2a86" />
        <path d="M60 204 C82 198 118 198 140 204" stroke="#9a62d0" strokeWidth="2" fill="none" />
        {/* hood */}
        <path d="M66 106 C62 76 82 58 104 56 C124 54 142 42 154 22 C150 50 138 72 134 104 C126 88 114 84 100 84 C86 84 72 90 66 106 Z" fill="#5b2a86" stroke="#2a0f44" strokeWidth="1" />
        {both("M67 112 L44 92 L69 128 Z", { fill: "#7cc24a", stroke: "#2c5a18", strokeWidth: 1 })}
        {/* grin */}
        <path d="M78 136 C90 152 110 152 122 136 C112 146 88 146 78 136 Z" fill="#1a0a10" />
        <path d="M82 138 L86 143 L90 140 L94 145 L98 141 L102 145 L106 141 L110 145 L114 140 L118 138" stroke="#f4f0d8" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        {/* pumpkin bomb */}
        <g filter={glow}>
          <circle cx="164" cy="232" r="13" fill="#ff8a1a" />
          <path d="M157 228 L161 225 L163 230 Z M171 228 L167 225 L165 230 Z M157 236 C162 241 166 241 171 236" stroke="#3a1400" strokeWidth="1.8" fill="#3a1400" />
          <path d="M164 219 L166 213" stroke="#5a3a1a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
    ),
  },
  venom: {
    suit: ["#2c2e40", "#05060a"], skin: ["#34364a", "#06070c"], rim: "#b8c4ff", sky: "#12142a", big: true,
    eyes: { color: "#fff", shape: "none" },
    back: ({ rim }) => (
      <g stroke={rim} strokeWidth="1.2" fill="#0a0b12">
        {both("M40 206 C20 190 6 196 -6 180 C10 190 22 182 34 190 C24 170 14 166 8 150 C24 164 36 168 48 194 Z", {})}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <g filter={glow}>{both("M70 96 C80 92 96 102 98 122 C86 124 72 116 70 96 Z", { fill: "#f6f8ff" })}</g>
        <path d="M72 130 C84 156 116 156 128 130 C118 166 82 166 72 130 Z" fill="#2a0a14" />
        <path d="M74 132 L79 139 L83 133 L88 141 L92 134 L97 142 L101 134 L106 142 L110 134 L115 141 L119 133 L123 139 L126 132" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        <path d="M80 152 L84 147 L89 154 L94 148 L100 156 L106 148 L111 154 L116 147 L120 152" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        <path d="M97 150 C94 168 86 180 94 194 C104 184 106 166 103 150 Z" fill="#d0283c" />
        {/* the white spider */}
        <g fill="#f6f8ff" stroke="#f6f8ff" strokeLinecap="round">
          <ellipse cx="100" cy="222" rx="8" ry="14" />
          <ellipse cx="100" cy="204" rx="5" ry="6" />
          {both("M94 214 C76 200 60 196 40 200 M94 222 C74 218 56 222 40 236 M95 228 C80 236 70 248 64 268 M96 234 C88 246 84 258 84 272", { strokeWidth: 5, fill: "none" })}
        </g>
      </g>
    ),
  },
  ock: {
    suit: ["#64744a", "#1c2412"], skin: ["#e4b88c", "#8a5a3a"], rim: "#ffb02e", sky: "#2a1a10",
    eyes: { color: "#ffb02e", shape: "none" },
    back: () => (
      <g fill="none" strokeLinecap="round">
        {["M72 214 C40 198 18 160 34 116", "M70 228 C28 238 4 212 4 176", "M128 214 C160 198 182 160 166 116", "M130 228 C172 238 196 212 196 176"].map((d) => (
          <g key={d}>
            <path d={d} stroke="#3a3e46" strokeWidth="12" />
            <path d={d} stroke="#aab0ba" strokeWidth="8" />
            <path d={d} stroke="#3a3e46" strokeWidth="9" strokeDasharray="2 7" />
            <path d={d} stroke="#eef2f8" strokeWidth="1.6" strokeOpacity=".7" />
          </g>
        ))}
        {[[34, 116], [4, 176], [166, 116], [196, 176]].map(([x, y]) => (
          <g key={`${x}`} stroke="#ffb02e" strokeWidth="2.4">
            <path d={`M${x} ${y} l-6 -10 M${x} ${y} l0 -12 M${x} ${y} l6 -10`} />
            <circle cx={x} cy={y} r="3.4" fill="#ffd27a" stroke="none" />
          </g>
        ))}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <path d="M66 104 C64 74 82 64 100 64 C118 64 136 74 134 104 C126 90 112 86 100 86 C88 86 74 90 66 104 Z" fill="#2e2016" />
        <g filter={glow}>
          <circle cx="84" cy="114" r="11" fill="#191512" stroke="#c99a2e" strokeWidth="3" />
          <circle cx="116" cy="114" r="11" fill="#191512" stroke="#c99a2e" strokeWidth="3" />
          <circle cx="84" cy="114" r="5" fill="#ffb02e" opacity=".85" />
          <circle cx="116" cy="114" r="5" fill="#ffb02e" opacity=".85" />
        </g>
        <path d="M95 114 L105 114" stroke="#c99a2e" strokeWidth="3" />
        <path d="M86 146 C94 141 106 141 114 146" stroke="#4a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M86 188 L100 214 L114 188 Z" fill="#d8d2c0" />
        <path d="M98 194 L102 194 L104 214 L100 220 L96 214 Z" fill="#3a2a1a" />
      </g>
    ),
  },
  joker: {
    suit: ["#7038a8", "#220c38"], skin: ["#f4f1e8", "#a8a49a"], rim: "#8cff6a", sky: "#2a1040",
    eyes: { color: "#d8ff9a", shape: "slit" },
    front: ({ glow }) => (
      <g>
        <path d="M64 104 C58 80 66 62 80 56 L84 66 L92 48 L98 62 L108 46 L112 62 L126 50 L122 66 L138 62 C142 80 140 96 136 106 C130 88 118 82 100 82 C84 82 70 90 64 104 Z" fill="#3fbf4a" stroke="#1a5a20" strokeWidth="1" />
        {both("M76 104 C82 100 92 102 96 110 C92 122 80 120 76 104 Z", { fill: "#3a1840", opacity: 0.55 })}
        <path d="M74 132 C86 158 114 158 126 132 C114 146 86 146 74 132 Z" fill="#c81e3a" />
        <path d="M79 135 C90 147 110 147 121 135 C110 142 90 142 79 135 Z" fill="#fff" />
        <path d="M70 128 C72 134 74 136 76 136 M130 128 C128 134 126 136 124 136" stroke="#c81e3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M82 188 L100 244 L118 188 Z" fill="#3fbf4a" />
        <path d="M90 192 L100 200 L110 192 L110 204 L100 198 L90 204 Z" fill="#ff8a1a" />
        <g filter={glow}><circle cx="136" cy="206" r="6" fill="#ff7ab8" /><circle cx="136" cy="206" r="2.4" fill="#ffe14a" /></g>
        <g transform="rotate(14 160 236)">
          <rect x="148" y="218" width="24" height="34" rx="3" fill="#fbf8f0" stroke="#2a0f44" strokeWidth="1.2" />
          <text x="153" y="232" fontSize="11" fontWeight="900" fill="#c81e3a" fontFamily="serif">J</text>
          <path d="M160 238 C156 242 158 248 160 248 C162 248 164 242 160 238 Z" fill="#c81e3a" />
        </g>
      </g>
    ),
  },
  bane: {
    suit: ["#5c5248", "#16120e"], skin: ["#3a3a42", "#0e0e12"], rim: "#5aff7a", sky: "#1a2016", big: true,
    eyes: { color: "#fff2d8", shape: "slit" },
    back: ({ glow }) => <g filter={glow} fill="none" strokeLinecap="round">{both("M72 128 C52 140 40 168 44 200", { stroke: "#4ad06a", strokeWidth: 5 })}</g>,
    front: () => (
      <g>
        {both("M74 106 C80 100 94 104 98 112 C94 124 80 124 74 106 Z", { fill: "#c49a7a" })}
        <path d="M100 70 L100 162" stroke="#7a6a5a" strokeWidth="2.2" />
        {[78, 88, 98, 132, 142, 152].map((y) => <path key={y} d={`M94 ${y} L106 ${y}`} stroke="#9a8a7a" strokeWidth="1.6" />)}
        <rect x="84" y="134" width="32" height="18" rx="4" fill="#1a1a1e" stroke="#5a5a62" strokeWidth="1.4" />
        {[90, 96, 102, 108].map((x) => <path key={x} d={`M${x} 136 L${x} 150`} stroke="#5a5a62" strokeWidth="1.4" />)}
        <path d="M20 214 C60 238 140 238 180 214" stroke="#2a241e" strokeWidth="6" fill="none" />
      </g>
    ),
  },
  stane: {
    suit: ["#9aa2ae", "#262a32"], skin: ["#a8b0bc", "#3a3e48"], rim: "#7ae8ff", sky: "#14202e", big: true,
    head: "M60 102 L70 72 L100 60 L130 72 L140 102 L136 142 L118 166 L82 166 L64 142 Z",
    eyes: { color: "#7ae8ff", shape: "none" },
    front: ({ glow }) => (
      <g>
        <path d="M100 60 L100 108 M70 72 L84 104 M130 72 L116 104 M82 166 L88 140 L112 140 L118 166" stroke="#4a505a" strokeWidth="1.6" fill="none" />
        <path d="M74 110 L126 110 L120 120 L80 120 Z" fill="#7ae8ff" filter={glow} />
        {both("M-2 228 C4 196 36 180 68 182 L74 212 C46 210 22 220 -2 240 Z", { fill: "#b8c0cc", stroke: "#4a505a", strokeWidth: 1.4 })}
        {[[30, 204], [50, 196]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="2" fill="#4a505a" /><circle cx={200 - x} cy={y} r="2" fill="#4a505a" /></g>)}
        <g filter={glow}>
          <circle cx="100" cy="224" r="16" fill="#bff6ff" stroke="#7ae8ff" strokeWidth="4" />
          <circle cx="100" cy="224" r="7" fill="#fff" />
        </g>
      </g>
    ),
  },
  ultron: {
    suit: ["#d4dae6", "#3a4252"], skin: ["#e4e8f2", "#4a5262"], rim: "#ff3a2a", sky: "#2a0e14",
    head: "M66 106 C66 82 80 68 100 60 C120 68 134 82 134 106 C134 132 124 150 110 162 L100 168 L90 162 C76 150 66 132 66 106 Z",
    eyes: { color: "#ff3a2a", shape: "slit", size: 1.15 },
    front: ({ glow }) => (
      <g>
        <path d="M100 60 L100 98 M78 80 L88 104 M122 80 L112 104 M72 124 L86 134 M128 124 L114 134" stroke="#8a94a8" strokeWidth="1.6" fill="none" />
        <path d="M84 142 C92 148 108 148 116 142" stroke="#ff3a2a" strokeWidth="3.4" fill="none" strokeLinecap="round" filter={glow} />
        <g filter={glow}>
          <circle cx="100" cy="222" r="9" fill="#ff5a3a" />
          {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M100 208 L100 196" stroke="#ff3a2a" strokeWidth="2" transform={`rotate(${a} 100 222)`} />)}
        </g>
        {both("M40 200 C56 192 70 192 80 196 L76 214 C62 210 50 212 40 218 Z", { fill: "#aab2c2" })}
      </g>
    ),
  },
  abomination: {
    suit: ["#6a9a6a", "#1a3420"], skin: ["#78a874", "#22402a"], rim: "#d8ff6a", sky: "#0e2416", big: true,
    eyes: { color: "#ffd040", shape: "slit", size: 1.2 },
    front: () => (
      <g>
        {both("M63 110 L40 96 L48 114 L36 120 L50 126 L42 134 L64 132 Z", { fill: "#5a8a5a", stroke: "#1a3420", strokeWidth: 1 })}
        <path d="M80 76 L88 54 L96 70 L100 50 L104 70 L112 54 L120 76" fill="#5a8a5a" stroke="#1a3420" strokeWidth="1" strokeLinejoin="round" />
        <path d="M82 140 C92 150 108 150 118 140 L114 150 C106 156 94 156 86 150 Z" fill="#1a1a10" />
        <path d="M88 142 L90 149 L92 143 M108 143 L110 149 L112 142" stroke="#f0ead0" strokeWidth="1.6" fill="none" />
        <g stroke="#2a5030" strokeWidth="1.4" fill="none" opacity=".8">
          {[[40, 220], [60, 210], [140, 210], [160, 220], [80, 236], [120, 236], [50, 246], [150, 246], [100, 222]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 8} ${y} C${x - 4} ${y - 6} ${x + 4} ${y - 6} ${x + 8} ${y}`} />)}
        </g>
      </g>
    ),
  },
  lex: {
    suit: ["#3e4250", "#0e1016"], skin: ["#ecc4a2", "#8a5e46"], rim: "#4aff7a", sky: "#0e2216",
    eyes: { color: "#d6ecff", shape: "slit", size: 0.85 },
    front: ({ glow }) => (
      <g>
        <ellipse cx="94" cy="84" rx="20" ry="9" fill="#fff" opacity=".28" />
        <path d="M88 146 C96 150 104 150 112 146" stroke="#6a3a2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M84 188 L100 230 L116 188 Z" fill="#f4f4f6" />
        <path d="M96 196 L104 196 L107 230 L100 240 L93 230 Z" fill="#6a2a9a" />
        <g filter={glow}>
          <path d="M150 248 L158 214 L168 206 L174 220 L170 250 Z" fill="#6aff8a" stroke="#c8ffd4" strokeWidth="1.2" />
          <path d="M158 214 L164 236 L170 250 M168 206 L164 236" stroke="#2aa04a" strokeWidth="1" fill="none" />
        </g>
        <circle cx="162" cy="230" r="34" fill="#4aff7a" opacity=".16" />
      </g>
    ),
  },
  zod: {
    suit: ["#2e2e3c", "#08080c"], skin: ["#e2ba98", "#7a5038"], rim: "#ff4a2a", sky: "#1a0e10",
    eyes: { color: "#ff4020", shape: "slit", size: 1.1 },
    back: ({ rim }) => <path d="M44 196 C54 160 72 150 84 156 L116 156 C128 150 146 160 156 196 Z" fill="#0c0c12" stroke={rim} strokeWidth="1" />,
    front: ({ glow }) => (
      <g>
        <path d="M66 102 C64 76 82 64 100 64 C120 64 136 76 134 102 C128 86 114 80 100 82 C86 80 72 86 66 102 Z" fill="#101014" />
        <path d="M74 98 L96 106 M126 98 L104 106" stroke="#101014" strokeWidth="3" strokeLinecap="round" />
        <path d="M88 148 C92 166 108 166 112 148 C106 156 94 156 88 148 Z" fill="#141418" />
        <path d="M90 144 C96 141 104 141 110 144" stroke="#141418" strokeWidth="2.6" fill="none" />
        <g filter={glow} opacity=".75">{both("M86 116 L40 98", { stroke: "#ff4020", strokeWidth: 2.4, strokeLinecap: "round" })}</g>
        <path d="M100 206 L118 214 L112 236 L88 236 L82 214 Z" fill="none" stroke="#c8ccd8" strokeWidth="2.6" />
        <path d="M92 218 C100 214 108 218 104 224 C98 228 94 230 106 232" stroke="#c8ccd8" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  doomsday: {
    suit: ["#8a8a92", "#26262c"], skin: ["#9a9aa2", "#34343a"], rim: "#ff5a3a", sky: "#201410", big: true,
    eyes: { color: "#ff4030", shape: "slit", size: 1.2 },
    back: () => <g fill="#ece2cc" stroke="#6a6252" strokeWidth="1">{both("M28 214 L4 166 L42 202 Z", {})}{both("M50 196 L40 148 L64 190 Z", {})}</g>,
    front: () => (
      <g>
        <g fill="#ece2cc" stroke="#6a6252" strokeWidth="1">
          {both("M68 100 L46 66 L78 88 Z", {})}
          {both("M76 82 L70 52 L88 76 Z", {})}
          {both("M64 130 L48 128 L64 138 Z", {})}
          {both("M30 236 L10 226 L28 250 Z", {})}
        </g>
        {both("M84 72 C74 58 62 60 54 74", { stroke: "#f4f0e8", strokeWidth: 2, fill: "none" })}
        <path d="M80 140 C92 150 108 150 120 140 L116 150 C106 156 94 156 84 150 Z" fill="#1a1010" />
        <path d="M84 142 L86 148 L90 143 L94 149 L98 143 L102 149 L106 143 L110 149 L114 143 L116 148" stroke="#ece2cc" strokeWidth="1.4" fill="none" />
        <path d="M60 214 C72 222 70 236 82 244 M140 214 C128 222 130 236 118 244 M92 196 C96 210 104 210 108 196" stroke="#4a4a52" strokeWidth="1.6" fill="none" />
      </g>
    ),
  },
  cheetah: {
    suit: ["#e4aa44", "#6a4010"], skin: ["#eab24a", "#7a4e14"], rim: "#ffcf6a", sky: "#2a1a08",
    eyes: { color: "#9cff4a", shape: "cat" },
    back: () => <g>{both("M70 94 L62 56 L92 78 Z", { fill: "#d89a2a", stroke: "#6a4010", strokeWidth: 1.2 })}{both("M72 88 L68 66 L86 80 Z", { fill: "#f0a0a0" })}</g>,
    front: () => (
      <g>
        <g fill="#3a2208" opacity=".85">
          {[[78, 88], [90, 80], [112, 80], [122, 90], [72, 124], [128, 124], [84, 156], [116, 156], [40, 214], [58, 202], [30, 236], [62, 228], [160, 214], [142, 202], [170, 236], [138, 228], [100, 210], [90, 236], [112, 248], [76, 256], [126, 262]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={i % 3 ? 3 : 4.2} ry={i % 2 ? 2.4 : 3.2} transform={`rotate(${(i * 37) % 90} ${x} ${y})`} />)}
        </g>
        <path d="M95 130 L105 130 L100 137 Z" fill="#2a1408" />
        <path d="M100 137 L100 142 M100 142 C96 146 90 146 88 142 M100 142 C104 146 110 146 112 142" stroke="#2a1408" strokeWidth="1.6" fill="none" />
        <path d="M91 145 L93 152 L95 146 M105 146 L107 152 L109 145" fill="#fff" />
        {both("M36 272 C30 262 30 254 34 248 M46 272 C40 262 40 254 44 246 M56 272 C52 262 52 254 56 248", { stroke: "#fff8e8", strokeWidth: 2.2, fill: "none", strokeLinecap: "round" })}
      </g>
    ),
  },
  "red-skull": {
    suit: ["#4a5040", "#12140e"], skin: ["#d42a2a", "#5a0a0a"], rim: "#5ad0ff", sky: "#1e0a0a",
    head: "M68 104 C68 78 82 68 100 68 C118 68 132 78 132 104 C132 124 126 138 118 148 L116 164 L84 164 L82 148 C74 138 68 124 68 104 Z",
    eyes: { color: "#ffd0a0", shape: "none" },
    back: () => <g fill="#3a4032" stroke="#12140e" strokeWidth="1">{both("M60 196 L76 150 L86 170 L84 194 Z", {})}</g>,
    front: ({ glow }) => (
      <g>
        {both("M72 104 C76 96 92 98 96 108 C94 124 76 124 72 104 Z", { fill: "#2a0404" })}
        <g filter={glow}><circle cx="85" cy="111" r="2.4" fill="#ffd0a0" /><circle cx="115" cy="111" r="2.4" fill="#ffd0a0" /></g>
        <path d="M100 124 L94 136 L100 134 L106 136 Z" fill="#2a0404" />
        <path d="M84 146 L116 146 M88 146 L88 156 M94 146 L94 158 M100 146 L100 158 M106 146 L106 158 M112 146 L112 156" stroke="#5a0a0a" strokeWidth="1.6" />
        <g stroke="#c4242a" strokeWidth="2.2" fill="none">
          <circle cx="100" cy="222" r="11" />
          {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M100 211 C96 202 104 198 100 190" transform={`rotate(${a} 100 222)`} />)}
        </g>
        <g filter={glow}>
          <path d="M150 230 L164 222 L178 230 L178 246 L164 254 L150 246 Z" fill="#5ad0ff" opacity=".9" />
          <path d="M150 230 L164 238 L178 230 M164 238 L164 254" stroke="#e6fbff" strokeWidth="1.2" fill="none" />
        </g>
      </g>
    ),
  },
  loki: {
    suit: ["#2e6a3a", "#0a1a0e"], skin: ["#ecd4be", "#8a6a54"], rim: "#e2b13c", sky: "#0e2414",
    eyes: { color: "#c8ffd0", shape: "slit", size: 0.9 },
    back: () => <g fill="#0c0c10">{both("M68 100 C58 150 56 190 46 222 L80 196 Z", {})}</g>,
    front: ({ glow, gold }) => (
      <g>
        <path d="M66 102 C70 76 84 66 100 66 C116 66 130 76 134 102 L128 106 C120 88 110 84 100 84 C90 84 80 88 72 106 Z" fill={gold} stroke="#6a4a10" strokeWidth="1" />
        {both("M78 80 C58 50 50 28 62 4 C66 32 78 54 92 72 Z", { fill: gold, stroke: "#6a4a10", strokeWidth: 1.2 })}
        <path d="M90 144 C96 148 104 148 112 142" stroke="#6a4a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        {both("M60 196 L84 188 L92 210 L70 216 Z", { fill: gold, stroke: "#6a4a10", strokeWidth: 1 })}
        <path d="M150 276 L166 186" stroke={gold} strokeWidth="4" strokeLinecap="round" />
        <g filter={glow}><path d="M166 170 L174 184 L166 198 L158 184 Z" fill="#6ad6ff" /></g>
        <path d="M156 196 C160 188 172 188 176 196" stroke={gold} strokeWidth="3" fill="none" />
      </g>
    ),
  },
  hela: {
    suit: ["#24402e", "#050c08"], skin: ["#ece6de", "#8a847c"], rim: "#5aff9a", sky: "#0a1a10",
    eyes: { color: "#5aff9a", shape: "slit", size: 1.05 },
    back: ({ rim, glow }) => (
      <g>
        <g fill="#0a0e0c" stroke={rim} strokeWidth="1.2" strokeLinejoin="round">
          {both("M80 80 C68 56 58 36 54 6 C66 32 80 52 90 72 Z", {})}
          {both("M74 88 C56 70 40 52 30 26 C46 48 62 62 80 76 Z", {})}
          {both("M70 98 C50 88 32 76 16 56 C36 70 52 78 72 86 Z", {})}
          <path d="M94 70 C96 46 98 30 100 4 C102 30 104 46 106 70 Z" />
        </g>
        <g filter={glow} fill="#1a3a24" stroke={rim} strokeWidth="1">
          <path d="M20 250 L30 150 L36 150 L32 250 Z" />
          <path d="M180 250 L170 150 L164 150 L168 250 Z" />
        </g>
      </g>
    ),
    front: () => (
      <g>
        <path d="M66 104 C70 80 84 72 100 72 C116 72 130 80 134 104 C124 90 112 86 100 86 C88 86 76 90 66 104 Z" fill="#0a0e0c" />
        {both("M74 104 C80 98 94 102 97 112 C92 122 78 122 74 104 Z", { fill: "#1a201c", opacity: 0.7 })}
        <path d="M90 144 C96 147 104 147 110 144 C104 150 96 150 90 144 Z" fill="#1a2a20" />
        <path d="M72 196 L100 236 L128 196" stroke="#3aa060" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  killmonger: {
    suit: ["#3a3022", "#0a0806"], skin: ["#3a3226", "#0a0806"], rim: "#ffd04a", sky: "#22180a",
    eyes: { color: "#fff6d8", shape: "slit" },
    back: () => <g>{both("M74 94 L68 62 L94 80 Z", { fill: "#221c14", stroke: "#e2b13c", strokeWidth: 1.4 })}</g>,
    front: ({ glow }) => (
      <g>
        <g stroke="#e2b13c" strokeWidth="1.4" fill="none" opacity=".9">
          <path d="M100 72 L92 96 L100 104 L108 96 Z" />
          <path d="M78 90 L90 100 M122 90 L110 100 M80 130 L92 124 M120 130 L108 124 M100 112 L100 140" />
          <path d="M40 210 L70 222 L100 210 L130 222 L160 210 M60 244 L100 232 L140 244" />
        </g>
        <g fill="#ffd04a" filter={glow}>
          {Array.from({ length: 11 }).map((_, i) => {
            const t = (i - 5) / 5;
            const x = 100 + t * 42;
            const y = 196 - Math.abs(t) * 6;
            return <path key={i} d={`M${x - 3} ${y} L${x} ${y + 11} L${x + 3} ${y} Z`} />;
          })}
        </g>
      </g>
    ),
  },
  sabretooth: {
    suit: ["#7a5a3a", "#22160a"], skin: ["#dcac86", "#7a4a30"], rim: "#ffd27a", sky: "#1e140a",
    eyes: { color: "#ffd040", shape: "cat", size: 1.05 },
    back: () => <path d="M50 136 C36 100 48 60 74 48 C70 38 86 32 94 42 C100 28 116 32 118 44 C132 34 148 46 140 58 C160 68 164 104 150 136 C146 112 134 92 100 88 C70 90 56 110 50 136 Z" fill="#d8b060" stroke="#7a5a20" strokeWidth="1" />,
    front: () => (
      <g>
        <path d="M66 106 C62 80 78 64 100 62 C122 64 138 80 134 106 C126 90 114 86 100 86 C86 86 74 90 66 106 Z" fill="#d8b060" />
        {both("M66 112 C64 130 70 146 82 156 C76 140 74 126 74 112 Z", { fill: "#c89a4a" })}
        <path d="M84 140 C92 136 108 136 116 140 C110 150 90 150 84 140 Z" fill="#2a1008" />
        <path d="M88 140 L91 152 L94 141 M106 141 L109 152 L112 140" fill="#fff" />
        <path d="M20 200 L36 188 L44 200 L58 186 L66 200 L82 186 L90 198 L100 186 L110 198 L118 186 L134 200 L142 186 L156 200 L164 188 L180 200 C166 212 34 212 20 200 Z" fill="#c8a870" stroke="#6a4a20" strokeWidth="1" />
        <g stroke="#fff8e8" strokeWidth="2.4" strokeLinecap="round">{both("M24 272 L30 250 M34 272 L40 248 M44 272 L48 250", {})}</g>
      </g>
    ),
  },
  "reverse-flash": {
    suit: ["#f2d838", "#6a5a08"], skin: ["#f2d838", "#6a5a08"], rim: "#ff3a2a", sky: "#2a0808", bolt: "#ff3a2a",
    eyes: { color: "#ff3a2a", shape: "slit", size: 1.1 },
    front: ({ glow }) => (
      <g>
        <path d="M80 128 C84 150 92 162 100 162 C108 162 116 150 120 128 C112 134 88 134 80 128 Z" fill="#e2ba98" />
        <path d="M90 146 C96 150 104 150 110 146" stroke="#6a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g filter={glow}>{both("M68 112 L40 94 L56 106 L34 86 L64 100 L60 92 Z", { fill: "#e0241c" })}</g>
        <g filter={glow}>
          <circle cx="100" cy="220" r="17" fill="#1a0806" stroke="#e0241c" strokeWidth="3" />
          <path d="M106 204 L93 222 L101 222 L95 236 L109 217 L101 217 Z" fill="#e0241c" />
        </g>
        <path d="M60 196 L100 206 L140 196" stroke="#e0241c" strokeWidth="2.4" fill="none" />
      </g>
    ),
  },
  // ── Legend rogues (2026-11-03 pm): the most-seen story villains get their own cards too. ──
  mysterio: {
    suit: ["#3e8a4a", "#0c2412"], skin: ["#7affa0", "#0c3a20"], rim: "#9affd0", sky: "#162a1c",
    eyes: { color: "#fff", shape: "none" },
    back: () => <g>{both("M40 272 C30 230 34 204 64 190 L80 196 L70 272 Z", { fill: "#5a2a7a", stroke: "#2a0a3a", strokeWidth: 1 })}</g>,
    front: ({ glow }) => (
      <g>
        {/* green smoke inside the fishbowl */}
        <g opacity=".75" fill="none" stroke="#c8ffd8" strokeWidth="3" strokeLinecap="round">
          <path d="M76 132 C84 116 98 130 106 112 C112 100 124 108 120 122" />
          <path d="M82 96 C92 86 104 98 114 88" opacity=".6" />
        </g>
        <circle cx="100" cy="112" r="50" fill="#dff8ff" opacity=".1" />
        <circle cx="100" cy="112" r="50" fill="none" stroke="#d8f4ff" strokeWidth="2.6" opacity=".9" filter={glow} />
        <path d="M70 84 C78 72 90 66 104 66" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7" />
        <path d="M60 160 C76 172 124 172 140 160 L136 176 C120 184 80 184 64 176 Z" fill="#3a6a4a" stroke="#9affd0" strokeWidth="1" />
        {/* chainmail and the two eye brooches */}
        <g stroke="#2a5a34" strokeWidth="1" fill="none" opacity=".8">
          {[206, 218, 230, 242, 254].map((y) => <path key={y} d={`M40 ${y} C70 ${y + 6} 130 ${y + 6} 160 ${y}`} />)}
        </g>
        {[-1, 1].map((d) => (
          <g key={d} filter={glow}>
            <ellipse cx={100 + d * 40} cy="200" rx="11" ry="7" fill="#e2b13c" stroke="#6a4a10" strokeWidth="1" />
            <circle cx={100 + d * 40} cy="200" r="3.6" fill="#2a0a3a" />
          </g>
        ))}
      </g>
    ),
  },
  vulture: {
    suit: ["#4a5a48", "#101610"], skin: ["#d8b49a", "#6a4a36"], rim: "#5ad8ff", sky: "#101a26",
    eyes: { color: "#6aff9a", shape: "none" },
    back: ({ rim }) => (
      <g stroke={rim} strokeWidth="1" strokeLinejoin="round">
        {[0, 1, 2, 3, 4].map((i) => <g key={i}>{both(`M${70 - i * 4} ${200 - i * 4} L${-10 - i * 2} ${130 + i * 22} L${0 + i * 3} ${142 + i * 22} L${66 - i * 2} ${214 - i * 2} Z`, { fill: i % 2 ? "#2a3440" : "#3a4654" })}</g>)}
        {both("M60 210 L4 120 L14 118 L70 196 Z", { fill: "#5a6a7a" })}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <path d="M64 108 C62 74 82 60 100 60 C118 60 138 74 136 108 L128 100 C120 88 110 84 100 84 C90 84 80 88 72 100 Z" fill="#2a3440" stroke="#5a6a7a" strokeWidth="1.2" />
        <path d="M100 60 L100 84" stroke="#5ad8ff" strokeWidth="1.4" opacity=".7" />
        <g filter={glow}>
          <path d="M72 104 L96 104 L94 120 L76 120 Z" fill="#6aff9a" stroke="#1a2a20" strokeWidth="2" />
          <path d="M104 104 L128 104 L124 120 L106 120 Z" fill="#6aff9a" stroke="#1a2a20" strokeWidth="2" />
        </g>
        <path d="M96 106 L104 106 L100 130 Z" fill="#2a3440" />
        <path d="M88 148 C94 144 106 144 112 148" stroke="#4a2a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* feather ruff */}
        <g fill="#c8c0b0" stroke="#5a544a" strokeWidth=".8">
          {Array.from({ length: 13 }).map((_, i) => {
            const t = (i - 6) / 6;
            const x = 100 + t * 40;
            return <path key={i} d={`M${x - 6} 178 L${x} ${200 + (1 - Math.abs(t)) * 6} L${x + 6} 178 Z`} />;
          })}
        </g>
      </g>
    ),
  },
  kraven: {
    suit: ["#c89a4a", "#4a2e10"], skin: ["#d8a882", "#6a4430"], rim: "#ffb24a", sky: "#2a1a0a",
    eyes: { color: "#ffe08a", shape: "slit", size: 0.9 },
    back: () => <path d="M44 150 C30 110 44 70 70 58 C74 44 90 40 100 48 C110 40 126 44 130 58 C156 70 170 110 156 150 C148 120 130 100 100 96 C70 100 52 120 44 150 Z" fill="#3a2410" />,
    front: () => (
      <g>
        <path d="M66 104 C64 78 80 64 100 64 C120 64 136 78 134 104 C126 90 114 84 100 84 C86 84 74 90 66 104 Z" fill="#3a2410" />
        <path d="M74 134 C80 160 92 168 100 168 C108 168 120 160 126 134 C118 148 110 150 100 150 C90 150 82 148 74 134 Z" fill="#3a2410" />
        <path d="M90 140 C96 136 104 136 110 140" stroke="#3a2410" strokeWidth="3" fill="none" />
        {/* the lion's-head vest */}
        <path d="M14 230 C20 194 46 180 70 182 L84 196 L100 210 L116 196 L130 182 C154 180 180 194 186 230 C160 214 140 226 128 250 L100 272 L72 250 C60 226 40 214 14 230 Z" fill="#c8862a" stroke="#6a3a10" strokeWidth="1.2" />
        <g fill="#e6a640" stroke="#6a3a10" strokeWidth=".8">{both("M20 226 L8 206 L30 214 L22 192 L44 204 L42 182 L58 198 Z", {})}</g>
        <g fill="#5a3412">{[[60, 232], [76, 244], [124, 244], [140, 232], [100, 252]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="4" ry="3" />)}</g>
        <path d="M166 272 L186 150" stroke="#8a6a3a" strokeWidth="4" strokeLinecap="round" />
        <path d="M186 150 L180 134 L194 140 Z" fill="#d8d8e0" stroke="#6a6a72" strokeWidth="1" />
      </g>
    ),
  },
  "two-face": {
    suit: ["#e8e6ee", "#1a1a22"], skin: ["#e6c0a2", "#8a5e44"], rim: "#ffcf4a", sky: "#1a1424",
    eyes: { color: "#fff", shape: "none" },
    front: ({ glow, gold }) => (
      <g>
        {/* the clean half: neat hair, one calm eye */}
        <path d="M66 104 C64 78 80 66 100 66 L100 84 C86 84 74 90 66 104 Z" fill="#2a2018" />
        <path d="M78 110 C82 106 90 106 94 110 C90 114 82 114 78 110 Z" fill="#fff" />
        <circle cx="86" cy="110" r="2.4" fill="#2a3a5a" />
        {/* the scarred half */}
        <path d="M100 66 C120 66 136 78 134 108 C134 132 126 150 112 160 C108 162 104 164 100 164 Z" fill="#8a3a4a" />
        <g stroke="#5a1a2a" strokeWidth="1.2" fill="none" opacity=".9">
          <path d="M104 80 C112 86 120 84 128 92 M106 130 C114 128 122 134 128 128 M104 146 C110 142 116 148 122 142" />
        </g>
        <g filter={glow}>
          <circle cx="116" cy="111" r="9" fill="#fff6e8" />
          <circle cx="116" cy="111" r="4" fill="#d02a2a" />
        </g>
        <path d="M100 146 L118 140 M104 150 L106 146 M110 148 L112 144 M116 146 L117 142" stroke="#fff" strokeWidth="1.4" />
        <path d="M86 146 C90 148 96 148 100 146" stroke="#6a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* split suit */}
        <path d="M100 188 L100 272 L196 272 C192 214 160 196 128 188 Z" fill="#1a1a22" opacity=".9" />
        <path d="M86 188 L100 214 L114 188 Z" fill="#fff" />
        <path d="M100 194 L104 214 L100 230 L96 214 Z" fill="#c81e3a" />
        <g filter={glow}>
          <circle cx="152" cy="236" r="12" fill={gold} stroke="#fff0a8" strokeWidth="1.4" />
          <path d="M146 232 L158 240 M146 240 L158 232" stroke="#7a5414" strokeWidth="1.8" />
        </g>
      </g>
    ),
  },
  riddler: {
    suit: ["#3aa04a", "#0c2c12"], skin: ["#e6c0a2", "#8a5e44"], rim: "#8aff5a", sky: "#121c2a",
    eyes: { color: "#d8ffb8", shape: "slit", size: 0.85 },
    front: ({ glow }) => (
      <g>
        {/* bowler hat */}
        <path d="M54 92 C70 86 130 86 146 92 C140 98 60 98 54 92 Z" fill="#1a5a24" stroke="#0a2a10" strokeWidth="1" />
        <path d="M68 90 C66 62 82 46 100 46 C118 46 134 62 132 90 Z" fill="#2a7a34" stroke="#0a2a10" strokeWidth="1" />
        <path d="M68 84 L132 84" stroke="#6a2a9a" strokeWidth="5" />
        {/* domino mask */}
        <path d="M70 106 C80 100 92 102 100 108 C108 102 120 100 130 106 C128 118 116 122 106 118 L100 114 L94 118 C84 122 72 118 70 106 Z" fill="#6a2a9a" />
        <path d="M88 146 C96 152 106 150 114 144" stroke="#6a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* question marks on the suit, one glowing */}
        <g fill="none" stroke="#0e3a14" strokeWidth="3" strokeLinecap="round" opacity=".7">
          <path d="M42 216 C42 206 56 206 56 214 C56 220 48 220 48 228 M140 236 C140 226 154 226 154 234 C154 240 146 240 146 248" />
        </g>
        <g filter={glow}>
          <path d="M90 214 C90 200 112 200 112 212 C112 222 100 222 100 234" stroke="#c8ff6a" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="246" r="3.6" fill="#c8ff6a" />
        </g>
        <path d="M176 272 L176 196" stroke="#e2b13c" strokeWidth="3.4" />
        <path d="M176 196 C176 178 196 178 196 190 C196 200 184 200 184 208" stroke="#e2b13c" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  scarecrow: {
    suit: ["#8a7448", "#2a2010"], skin: ["#c8b07a", "#5a4626"], rim: "#ff9a2a", sky: "#1a1408",
    head: "M66 108 C64 84 74 70 84 68 L90 62 L96 70 L104 60 L110 70 L118 64 L120 72 C130 78 136 92 134 108 C134 134 126 150 112 160 C106 164 94 164 88 160 C74 150 66 134 66 108 Z",
    eyes: { color: "#ffb03a", shape: "slit", size: 1.05 },
    front: () => (
      <g>
        {/* floppy hat */}
        <path d="M40 90 C60 76 140 76 160 90 C150 96 130 92 120 96 C110 92 90 92 80 96 C70 92 50 96 40 90 Z" fill="#4a3a20" stroke="#1a1408" strokeWidth="1" />
        <path d="M70 84 C70 56 86 40 104 42 C122 44 132 62 130 84 Z" fill="#5a4626" stroke="#1a1408" strokeWidth="1" />
        {/* stitching */}
        <g stroke="#3a2a10" strokeWidth="1.4" fill="none">
          <path d="M100 96 L100 126" strokeDasharray="3 3" />
          <path d="M80 142 L120 142" />
          {[84, 90, 96, 102, 108, 114].map((x) => <path key={x} d={`M${x} 137 L${x + 2} 147`} />)}
        </g>
        {/* noose and straw */}
        <path d="M74 176 C90 186 110 186 126 176 L124 186 C110 194 90 194 76 186 Z" fill="#a08a50" stroke="#4a3a1a" strokeWidth="1" />
        <path d="M100 188 L100 214" stroke="#a08a50" strokeWidth="4" />
        <g stroke="#e6c86a" strokeWidth="1.6" strokeLinecap="round">
          {both("M70 186 L58 198 M74 188 L66 204 M66 182 L50 190", {})}
          {both("M30 272 L22 252 M38 272 L34 250", {})}
        </g>
        <g fill="none" stroke="#3a2a10" strokeWidth="1" opacity=".7">{both("M40 220 L70 214 M36 240 L66 236", {})}</g>
      </g>
    ),
  },
  penguin: {
    suit: ["#2a2a34", "#06060a"], skin: ["#ecc8ac", "#7a5440"], rim: "#7ad8ff", sky: "#0e1624", big: true,
    eyes: { color: "#fff", shape: "none" },
    front: ({ glow }) => (
      <g>
        {/* top hat */}
        <path d="M50 86 C70 80 130 80 150 86 C144 92 56 92 50 86 Z" fill="#101016" />
        <path d="M70 84 L74 24 L126 24 L130 84 Z" fill="#16161e" stroke="#2a2a34" strokeWidth="1" />
        <path d="M72 74 L128 74" stroke="#6a2a9a" strokeWidth="5" />
        <path d="M84 108 C88 104 94 104 96 108" stroke="#2a1a10" strokeWidth="2" fill="none" />
        <g filter={glow}>
          <circle cx="116" cy="110" r="9" fill="#bfefff" opacity=".35" stroke="#e2b13c" strokeWidth="2.2" />
          <path d="M125 114 C132 130 128 150 132 170" stroke="#e2b13c" strokeWidth="1" fill="none" />
        </g>
        <circle cx="116" cy="110" r="2.4" fill="#1a1a2a" />
        {/* the beak of a nose */}
        <path d="M96 114 C100 112 106 118 106 128 C104 136 100 138 94 134 Z" fill="#d8a080" stroke="#8a5a40" strokeWidth="1" />
        <path d="M86 146 C94 152 106 152 114 146" stroke="#6a3a2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M78 178 L100 196 L122 178 L120 272 L80 272 Z" fill="#f4f2ec" />
        <path d="M86 190 L100 198 L114 190 L114 202 L100 198 L86 202 Z" fill="#6a2a9a" />
        {[214, 230, 246].map((y) => <circle key={y} cx="100" cy={y} r="2" fill="#1a1a22" />)}
        {/* umbrella */}
        <path d="M162 272 L172 168" stroke="#2a2a34" strokeWidth="3" />
        <path d="M150 196 C150 172 170 160 176 162 C182 168 196 186 190 208 C178 198 166 196 150 196 Z" fill="#16161e" stroke="#7ad8ff" strokeWidth="1" />
      </g>
    ),
  },
  whiplash: {
    suit: ["#4a4a54", "#0c0c12"], skin: ["#d8b49a", "#6a4a36"], rim: "#5ae8ff", sky: "#0a1a2a",
    eyes: { color: "#d8f8ff", shape: "slit", size: 0.85 },
    back: ({ glow }) => (
      <g filter={glow} fill="none" strokeLinecap="round">
        <path d="M40 232 C10 200 -6 150 14 96 C24 70 44 66 52 40" stroke="#bff6ff" strokeWidth="4" />
        <path d="M40 232 C10 200 -6 150 14 96 C24 70 44 66 52 40" stroke="#5ae8ff" strokeWidth="9" opacity=".35" />
        <path d="M160 232 C190 206 206 160 190 110 C180 80 196 60 180 30" stroke="#bff6ff" strokeWidth="4" />
        <path d="M160 232 C190 206 206 160 190 110 C180 80 196 60 180 30" stroke="#5ae8ff" strokeWidth="9" opacity=".35" />
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <path d="M68 96 C70 74 84 66 100 66 C116 66 130 74 132 96 C122 84 112 80 100 80 C88 80 78 84 68 96 Z" fill="#3a3028" opacity=".75" />
        <path d="M76 136 C84 158 116 158 124 136 C116 150 84 150 76 136 Z" fill="#4a3a2a" opacity=".55" />
        <path d="M86 146 L114 146" stroke="#3a2a1a" strokeWidth="2" />
        <path d="M88 147 L91 151 L94 147 L97 151 L100 147 L103 151 L106 147 L109 151 L112 147" stroke="#d8c890" strokeWidth="1.2" fill="none" />
        {/* tattoos */}
        <g stroke="#2a3a5a" strokeWidth="1.4" fill="none" opacity=".85">
          <path d="M84 166 L84 184 M90 168 C94 176 90 182 94 188 M116 166 L116 184 M110 168 C106 176 110 182 106 188" />
          {both("M40 214 C50 206 60 210 64 220 M34 236 L52 232", {})}
        </g>
        {/* the chest harness and reactor */}
        <path d="M54 200 L100 230 L146 200 M100 230 L100 272" stroke="#2a2a30" strokeWidth="7" fill="none" />
        <g filter={glow}>
          <circle cx="100" cy="230" r="14" fill="#0a1a24" stroke="#8a929e" strokeWidth="3" />
          <circle cx="100" cy="230" r="8" fill="#bff6ff" />
        </g>
      </g>
    ),
  },
  mandarin: {
    suit: ["#2a5a4a", "#08160f"], skin: ["#e0b48a", "#7a5034"], rim: "#ffcc4a", sky: "#2a0e0e",
    eyes: { color: "#ffe6a8", shape: "slit", size: 0.85 },
    back: ({ glow }) => (
      <g filter={glow}>
        {["#ff5a3a", "#5ad8ff", "#c86aff", "#6aff8a", "#ffcc4a", "#ff5ab0", "#9ae8ff", "#ffa04a", "#e8e8ff", "#5a8aff"].map((c, i) => {
          const a = Math.PI * (0.92 + (i / 9) * 1.16);
          const x = 100 + Math.cos(a) * 96;
          const y = 126 + Math.sin(a) * 84;
          return <circle key={c} cx={x.toFixed(1)} cy={y.toFixed(1)} r="6" fill="none" stroke={c} strokeWidth="3.4" />;
        })}
      </g>
    ),
    front: ({ gold }) => (
      <g>
        <path d="M64 104 C62 74 82 62 100 62 C120 62 138 74 136 104 C128 88 116 82 100 82 C84 82 72 88 64 104 Z" fill="#1a1612" />
        <path d="M80 70 C92 64 108 64 120 70" stroke="#8a8a8a" strokeWidth="3" fill="none" />
        <path d="M90 150 C94 168 106 168 110 150 C104 156 96 156 90 150 Z" fill="#2a2220" />
        <path d="M88 142 C96 138 104 138 112 142" stroke="#2a2220" strokeWidth="2.6" fill="none" />
        {/* robe with gold dragon trim */}
        <path d="M70 186 L100 272 L130 186" stroke={gold} strokeWidth="6" fill="none" />
        <path d="M70 186 L100 272 L130 186" stroke="#7a5414" strokeWidth="1" fill="none" />
        <g fill="none" stroke={gold} strokeWidth="1.8" opacity=".85">{both("M30 230 C40 214 54 220 50 232 C46 244 62 248 66 236", {})}</g>
      </g>
    ),
  },
  leader: {
    suit: ["#3a3a6a", "#0e0e26"], skin: ["#8ad86a", "#2a5a1a"], rim: "#c8ff6a", sky: "#0e1a10",
    head: "M58 100 C52 44 74 8 100 8 C126 8 148 44 142 100 C140 128 128 150 112 160 C106 164 94 164 88 160 C72 150 60 128 58 100 Z",
    eyes: { color: "#f6ffd8", shape: "slit", size: 0.8 },
    front: ({ glow }) => (
      <g>
        <g stroke="#3a7a2a" strokeWidth="1.6" fill="none" opacity=".75">
          <path d="M100 16 L100 70 M80 26 C88 40 84 56 92 70 M120 26 C112 40 116 56 108 70 M66 54 C76 60 78 72 86 80 M134 54 C124 60 122 72 114 80" />
        </g>
        <g filter={glow} opacity=".55"><ellipse cx="100" cy="46" rx="26" ry="18" fill="#d8ff8a" /></g>
        <path d="M90 144 C96 148 104 148 110 144" stroke="#1a3a10" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* lab coat collar */}
        <g fill="#e8eef4" stroke="#8a94a8" strokeWidth="1">{both("M30 272 C30 220 52 196 78 186 L92 220 L80 272 Z", {})}</g>
        <path d="M86 188 L100 214 L114 188 Z" fill="#1a1a3a" />
      </g>
    ),
  },
  brainiac: {
    suit: ["#6a2a8a", "#14061e"], skin: ["#6ad86a", "#1a4a1a"], rim: "#4affd0", sky: "#0a1418",
    eyes: { color: "#ffffff", shape: "slit", size: 0.95 },
    back: ({ rim }) => (
      <g fill="none" strokeLinecap="round">
        {both("M70 120 C40 110 20 130 10 100 M72 140 C40 150 12 150 -6 130", { stroke: "#2a3a3a", strokeWidth: 6 })}
        {both("M70 120 C40 110 20 130 10 100 M72 140 C40 150 12 150 -6 130", { stroke: rim, strokeWidth: 1.4, opacity: 0.7 })}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <g filter={glow}>
          {[84, 100, 116].map((x, i) => <circle key={x} cx={x} cy={i === 1 ? 82 : 88} r="6.5" fill="#c86aff" stroke="#f0d0ff" strokeWidth="1.4" />)}
        </g>
        <path d="M90 146 C96 142 104 142 110 146" stroke="#1a3a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M60 192 L100 206 L140 192 L132 272 L68 272 Z" fill="#4a1a6a" />
        <g filter={glow}>
          <path d="M100 210 L118 232 L100 254 L82 232 Z" fill="#14061e" stroke="#4affd0" strokeWidth="2.4" />
          <circle cx="100" cy="232" r="5" fill="#4affd0" />
        </g>
      </g>
    ),
  },
  winter: {
    suit: ["#2a2e3a", "#08090e"], skin: ["#d8b49a", "#6a4a36"], rim: "#9ad0ff", sky: "#0e1624",
    eyes: { color: "#cfe6ff", shape: "slit", size: 0.85 },
    back: () => <path d="M62 98 C56 140 54 176 60 200 L76 190 L74 130 Z M138 98 C144 140 146 176 140 200 L124 190 L126 130 Z" fill="#1a140e" />,
    front: () => (
      <g>
        <path d="M64 108 C62 74 82 62 100 62 C118 62 138 74 136 108 C128 90 114 82 100 84 C86 82 72 90 64 108 Z" fill="#1a140e" />
        {/* eye black and the muzzle */}
        <path d="M72 104 L128 104 L124 120 L76 120 Z" fill="#000" opacity=".45" />
        <path d="M76 132 C84 128 116 128 124 132 L120 156 C110 164 90 164 80 156 Z" fill="#14161c" stroke="#3a3e4a" strokeWidth="1" />
        {[90, 100, 110].map((x) => <path key={x} d={`M${x} 136 L${x} 154`} stroke="#3a3e4a" strokeWidth="1.2" />)}
        {/* the metal arm */}
        <path d="M128 188 C160 192 186 206 196 240 L196 272 L150 272 C150 240 140 214 128 206 Z" fill="#b8c0cc" stroke="#5a6272" strokeWidth="1.2" />
        <g stroke="#5a6272" strokeWidth="1" fill="none">{[208, 224, 240, 256].map((y) => <path key={y} d={`M${140 + (y - 200) * 0.3} ${y} C160 ${y - 6} 180 ${y - 2} 196 ${y + 4}`} />)}</g>
        <path d="M168 210 L172 220 L182 220 L174 226 L177 236 L168 230 L159 236 L162 226 L154 220 L164 220 Z" fill="#c4242a" />
        <path d="M40 210 L100 236 L100 272" stroke="#3a2a1a" strokeWidth="5" fill="none" />
      </g>
    ),
  },
  zemo: {
    suit: ["#4a3a6a", "#120c1e"], skin: ["#8a3ab0", "#24082e"], rim: "#e0a8ff", sky: "#1a0e24",
    eyes: { color: "#fff6ff", shape: "slit", size: 0.95 },
    front: ({ gold, glow }) => (
      <g>
        <path d="M66 96 C70 78 84 72 100 72 C116 72 130 78 134 96 L130 100 C120 90 110 88 100 88 C90 88 80 90 70 100 Z" fill={gold} stroke="#6a4a10" strokeWidth="1" />
        <g filter={glow}><path d="M95 80 L100 72 L105 80 L100 88 Z" fill="#ff5ad8" /></g>
        <g stroke="#5a1a7a" strokeWidth="1.4" fill="none" opacity=".8">
          <path d="M100 124 L100 160 M86 134 C92 138 108 138 114 134" />
        </g>
        {/* fur collar */}
        <path d="M24 214 C34 186 60 176 84 178 L100 196 L116 178 C140 176 166 186 176 214 C150 202 126 206 100 222 C74 206 50 202 24 214 Z" fill="#d8d0c4" stroke="#7a7064" strokeWidth="1" />
        <g fill="none" stroke="#9a9084" strokeWidth="1">{both("M36 206 L42 196 M52 198 L56 188 M68 194 L72 184", {})}</g>
        <path d="M150 272 L174 196" stroke="#c8ccd8" strokeWidth="2.6" />
        <path d="M168 204 L182 200 M171 196 L177 210" stroke={gold} strokeWidth="3" />
      </g>
    ),
  },
  klaw: {
    suit: ["#b03a3a", "#320808"], skin: ["#d8a882", "#6a4430"], rim: "#ff8a3a", sky: "#1a0c08",
    eyes: { color: "#ffe0a8", shape: "slit", size: 0.85 },
    back: ({ glow, rim }) => (
      <g filter={glow} fill="none" stroke={rim} strokeLinecap="round">
        {[20, 34, 48].map((r, i) => <path key={r} d={`M${164 - r * 0.2} ${200 - r} C${164 + r * 0.8} ${200 - r * 0.6} ${164 + r * 0.8} ${200 + r * 0.6} ${164 - r * 0.2} ${200 + r}`} strokeWidth={3 - i * 0.6} opacity={0.9 - i * 0.22} />)}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        <ellipse cx="96" cy="80" rx="18" ry="7" fill="#fff" opacity=".22" />
        <path d="M74 136 C82 160 118 160 126 136 C116 150 84 150 74 136 Z" fill="#7a5a44" opacity=".5" />
        <path d="M86 146 C94 150 106 150 114 144" stroke="#4a2a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M114 96 L124 120" stroke="#8a4a3a" strokeWidth="2" />
        {/* the sonic cannon arm */}
        <path d="M120 200 C136 196 150 194 158 190 L170 186 L178 214 L164 216 C152 220 140 226 126 230 Z" fill="#5a5a62" stroke="#2a2a30" strokeWidth="1.4" />
        <g filter={glow}>
          <ellipse cx="172" cy="200" rx="6" ry="15" fill="#ffb06a" />
          <ellipse cx="172" cy="200" rx="3" ry="9" fill="#fff4d8" />
        </g>
        <path d="M60 196 L84 188 L100 214 L116 188" stroke="#e2b13c" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  circe: {
    suit: ["#2a8a5a", "#08261a"], skin: ["#e6c4a6", "#7a5440"], rim: "#6aff9a", sky: "#0c2214",
    eyes: { color: "#9affb8", shape: "cat", size: 0.9 },
    back: () => <path d="M60 96 C44 140 40 200 30 272 L80 272 L76 150 Z M140 96 C156 140 160 200 170 272 L120 272 L124 150 Z" fill="#141018" />,
    front: ({ gold, glow }) => (
      <g>
        <path d="M64 110 C60 76 80 60 100 60 C120 60 140 76 136 110 C128 88 116 80 100 80 C84 80 72 88 64 110 Z" fill="#141018" />
        <path d="M74 84 C86 78 114 78 126 84 L120 90 L100 86 L80 90 Z" fill={gold} />
        <g filter={glow}><path d="M96 82 L100 72 L104 82 L100 88 Z" fill="#6aff9a" /></g>
        <path d="M90 146 C96 151 104 151 110 146 C104 149 96 149 90 146 Z" fill="#8a2a4a" stroke="#8a2a4a" strokeWidth="2" />
        {both("M68 128 L66 138", { stroke: gold, strokeWidth: 2.4, strokeLinecap: "round" })}
        <path d="M70 184 C84 194 116 194 130 184 L120 272 L80 272 Z" fill="#1e6a44" />
        <path d="M70 184 C84 194 116 194 130 184" stroke={gold} strokeWidth="2.4" fill="none" />
        {/* witchfire */}
        <g filter={glow}>
          <path d="M162 250 C150 236 156 222 164 214 C164 224 172 222 170 210 C182 220 186 238 176 250 Z" fill="#6aff9a" opacity=".9" />
          <path d="M166 248 C160 240 164 232 168 228 C170 236 176 236 174 228 C180 236 178 246 172 250 Z" fill="#e8ffe8" />
        </g>
      </g>
    ),
  },
  malekith: {
    suit: ["#2a2e3a", "#06060a"], skin: ["#eceaf2", "#8a8a9a"], rim: "#ff3a3a", sky: "#140a14",
    eyes: { color: "#bfe6ff", shape: "slit", size: 0.95 },
    back: () => <path d="M64 100 C54 150 52 200 56 240 L80 220 L76 130 Z M136 100 C146 150 148 200 144 240 L120 220 L124 130 Z" fill="#f4f4f8" />,
    front: () => (
      <g>
        {/* the burned half */}
        <path d="M100 70 C118 70 134 80 134 108 C134 132 126 150 112 160 C108 162 104 164 100 164 Z" fill="#14141a" />
        <path d="M100 96 L106 120 L100 140" stroke="#3a3a4a" strokeWidth="1.2" fill="none" />
        <path d="M66 98 C68 76 84 66 100 66 C116 66 132 76 134 98 C124 84 112 80 100 80 C88 80 76 84 66 98 Z" fill="#f4f4f8" />
        <path d="M88 146 C96 149 104 149 112 146" stroke="#3a3a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* dark elf helm and pauldrons */}
        {both("M70 92 L36 52 L58 60 L50 34 L80 78 Z", { fill: "#3a3e4a", stroke: "#8a8e9a", strokeWidth: 1 })}
        {both("M10 230 C16 196 44 182 72 182 L80 204 C56 204 34 214 10 238 Z", { fill: "#3a3e4a", stroke: "#8a8e9a", strokeWidth: 1.2 })}
        <path d="M84 188 L100 230 L116 188" stroke="#ff3a3a" strokeWidth="2" fill="none" opacity=".8" />
      </g>
    ),
  },
  // ── 2026-11-03 night: the last 15 legend rogues, so every villain in the game has a card ──
  hammer: {
    suit: ["#4a5a7a", "#121a2a"], skin: ["#f0c8a0", "#9a6a4a"], rim: "#7ab8ff", sky: "#141a2a",
    eyes: { color: "#7ab8ff", shape: "none" },
    back: ({ glow }) => (
      <g filter={glow} opacity=".85">
        {/* his drone line-up behind him */}
        {[22, 178].map((x) => (
          <g key={x}>
            <path d={`M${x - 12} 150 L${x + 12} 150 L${x + 9} 196 L${x - 9} 196 Z`} fill="#3a4250" stroke="#8a96aa" strokeWidth="1" />
            <circle cx={x} cy="162" r="4" fill="#ff4a3a" />
          </g>
        ))}
      </g>
    ),
    front: () => (
      <g>
        <path d="M66 104 C64 78 80 68 100 68 C120 68 136 78 134 104 C130 90 116 82 100 84 C84 82 70 90 66 104 Z" fill="#c89a5a" />
        {/* tinted glasses and smug grin */}
        <rect x="74" y="106" width="22" height="12" rx="4" fill="#2a3a5a" stroke="#c0c8d8" strokeWidth="1.4" />
        <rect x="104" y="106" width="22" height="12" rx="4" fill="#2a3a5a" stroke="#c0c8d8" strokeWidth="1.4" />
        <path d="M96 111 L104 111" stroke="#c0c8d8" strokeWidth="1.4" />
        <path d="M84 142 C94 150 108 148 118 138" stroke="#6a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* suit, shirt and a loud tie */}
        <path d="M84 186 L100 236 L116 186 Z" fill="#f4f4f8" />
        <path d="M96 192 L104 192 L106 228 L100 236 L94 228 Z" fill="#c83a3a" />
        <path d="M82 186 L100 236 L90 236 L72 196 Z M118 186 L100 236 L110 236 L128 196 Z" fill="#2a3450" />
      </g>
    ),
  },
  "ross-red": {
    suit: ["#8a2a1a", "#2a0806"], skin: ["#e04a2a", "#5a0c06"], rim: "#ffb02e", sky: "#2a0a06", big: true,
    eyes: { color: "#ffe14a", shape: "slit", size: 1.15 },
    head: HEAD_BIG,
    back: ({ glow }) => <ellipse cx="100" cy="230" rx="96" ry="40" fill="#ff5a1a" opacity=".35" filter={glow} />,
    front: () => (
      <g>
        {/* the general's moustache and flat-top */}
        <path d="M62 102 C62 76 80 64 100 64 C120 64 138 76 138 102 C128 92 114 88 100 88 C86 88 72 92 62 102 Z" fill="#1a0a06" />
        <path d="M78 136 C88 130 112 130 122 136 C114 142 106 140 100 138 C94 140 86 142 78 136 Z" fill="#f0f0f0" />
        <path d="M82 148 C94 156 106 156 118 148" stroke="#2a0606" strokeWidth="3" fill="none" strokeLinecap="round" />
        {both("M78 98 L96 106", { stroke: "#2a0606", strokeWidth: 4, strokeLinecap: "round" })}
        {/* torn uniform scraps */}
        {both("M20 236 C40 214 62 206 80 200 L72 230 Z", { fill: "#3a4a2a", stroke: "#1a2410", strokeWidth: 1 })}
      </g>
    ),
  },
  maestro: {
    suit: ["#5a8a3a", "#14240a"], skin: ["#6ab84a", "#1a4010"], rim: "#e6c35a", sky: "#1a1408", big: true,
    eyes: { color: "#ff3a2a", shape: "slit" },
    head: HEAD_BIG,
    back: ({ glow }) => (
      <g>
        {/* a throne of broken heroes' gear */}
        <path d="M22 272 L28 120 L60 140 L72 260 Z M178 272 L172 120 L140 140 L128 260 Z" fill="#3a2e1a" stroke="#e6c35a" strokeWidth="1.2" />
        <circle cx="100" cy="74" r="36" fill="#e6c35a" opacity=".22" filter={glow} />
      </g>
    ),
    front: () => (
      <g>
        {/* grey beard and long hair: Hulk, a century of tyranny later */}
        <path d="M62 104 C58 74 78 60 100 60 C122 60 142 74 138 104 C146 140 148 170 138 196 C132 168 132 140 134 118 Z" fill="#c8c8c0" />
        <path d="M62 104 C54 140 52 170 62 196 C68 168 68 140 66 118 Z" fill="#c8c8c0" />
        <path d="M76 140 C80 172 92 184 100 186 C108 184 120 172 124 140 C116 150 108 154 100 154 C92 154 84 150 76 140 Z" fill="#d8d8d0" />
        <path d="M88 146 C96 150 104 150 112 146" stroke="#1a2a10" strokeWidth="2" fill="none" />
        {/* purple sash and gold clasp */}
        <path d="M30 214 C70 198 130 198 170 214 L168 232 C130 218 70 218 32 232 Z" fill="#5a2a7a" />
        <circle cx="100" cy="212" r="7" fill="#e6c35a" stroke="#7a5a1a" strokeWidth="1.4" />
      </g>
    ),
  },
  ares: {
    suit: ["#4a4a52", "#101014"], skin: ["#d8a888", "#6a3a2a"], rim: "#ff5a2a", sky: "#2a0e08", big: true,
    eyes: { color: "#ff5a2a", shape: "slit", size: 1.1 },
    back: ({ glow }) => (
      <g>
        <path d="M150 272 L176 20" stroke="#6a6a72" strokeWidth="5" strokeLinecap="round" />
        <path d="M176 20 L166 54 L186 54 Z" fill="#c8c8d0" stroke="#ff5a2a" strokeWidth="1" filter={glow} />
      </g>
    ),
    front: ({ glow }) => (
      <g>
        {/* corinthian war helm with a crest of fire */}
        <path d="M60 114 C58 76 78 58 100 58 C122 58 142 76 140 114 L132 156 L118 162 L116 120 L84 120 L82 162 L68 156 Z" fill="#3a3a42" stroke="#8a8a92" strokeWidth="1.2" />
        <path d="M96 120 L104 120 L104 150 L96 150 Z" fill="#3a3a42" />
        <path d="M100 58 C88 36 96 16 100 6 C104 16 112 36 100 58 Z" fill="#ff5a2a" filter={glow} />
        <path d="M100 58 C70 40 66 24 72 12 C86 30 96 40 100 58 Z M100 58 C130 40 134 24 128 12 C114 30 104 40 100 58 Z" fill="#c83a1a" />
        {both("M14 236 C18 200 46 184 76 182 L80 206 C54 206 32 216 14 244 Z", { fill: "#4a4a52", stroke: "#a8a8b0", strokeWidth: 1.2 })}
      </g>
    ),
  },
  medusa: {
    suit: ["#3a6a4a", "#0a1a10"], skin: ["#a8c8a0", "#3a5a3a"], rim: "#c8ff5a", sky: "#0a1a12",
    eyes: { color: "#e6ff3a", shape: "cat", size: 1.2 },
    back: ({ rim }) => (
      <g fill="none" strokeLinecap="round">
        {/* a crown of snakes */}
        {["M78 84 C60 60 40 70 32 50", "M88 74 C80 44 60 40 56 18", "M100 70 C100 40 92 24 100 6", "M112 74 C120 44 140 40 144 18", "M122 84 C140 60 160 70 168 50", "M70 100 C46 96 30 110 14 98", "M130 100 C154 96 170 110 186 98"].map((d) => (
          <g key={d}>
            <path d={d} stroke="#1a3a1a" strokeWidth="9" />
            <path d={d} stroke="#4a8a3a" strokeWidth="6" />
            <path d={d} stroke={rim} strokeWidth="1" strokeDasharray="2 5" />
          </g>
        ))}
      </g>
    ),
    front: () => (
      <g>
        {[[32, 50], [56, 18], [100, 6], [144, 18], [168, 50], [14, 98], [186, 98]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="5.5" fill="#4a8a3a" stroke="#1a3a1a" strokeWidth="1" />
            <circle cx={x! - 2} cy={y! - 1} r="1.2" fill="#e6ff3a" />
          </g>
        ))}
        <path d="M86 146 C94 150 106 150 114 146" stroke="#3a1a2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M60 204 C80 194 120 194 140 204 L148 272 L52 272 Z" fill="#c8a43a" opacity=".85" />
        <path d="M60 204 C80 196 120 196 140 204" stroke="#f0d88a" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  crossbones: {
    suit: ["#3a3a3a", "#0a0a0a"], skin: ["#d8b090", "#6a4a3a"], rim: "#ff3a3a", sky: "#1a0a0a", big: true,
    eyes: { color: "#ff3a3a", shape: "slit" },
    front: () => (
      <g>
        {/* black skull mask */}
        <path d="M62 112 C60 78 78 64 100 64 C122 64 140 78 138 112 C138 136 130 152 114 162 C106 166 94 166 86 162 C70 152 62 136 62 112 Z" fill="#141414" />
        <path d="M78 102 C76 92 90 92 94 102 C94 116 82 118 78 102 Z M122 102 C124 92 110 92 106 102 C106 116 118 118 122 102 Z" fill="#f0f0f0" opacity=".9" />
        <path d="M96 124 L100 132 L104 124 Z" fill="#f0f0f0" />
        <path d="M84 144 L116 144 M88 138 L88 150 M94 138 L94 150 M100 138 L100 150 M106 138 L106 150 M112 138 L112 150" stroke="#f0f0f0" strokeWidth="1.8" />
        {/* the crossed bones on the vest */}
        <g stroke="#f0f0f0" strokeWidth="6" strokeLinecap="round">
          <path d="M76 202 L124 254 M124 202 L76 254" />
        </g>
        {both("M8 240 C12 202 40 186 70 182 L76 206 C52 208 30 218 8 248 Z", { fill: "#2a2a2a", stroke: "#6a6a6a", strokeWidth: 1.2 })}
      </g>
    ),
  },
  surtur: {
    suit: ["#3a1a0a", "#0a0200"], skin: ["#4a2010", "#0a0200"], rim: "#ff7a1a", sky: "#3a0c02", big: true,
    eyes: { color: "#ffe14a", shape: "slit", size: 1.3 },
    head: HEAD_BIG,
    back: ({ glow }) => (
      <g>
        <ellipse cx="100" cy="150" rx="96" ry="130" fill="#ff5a0a" opacity=".3" filter={glow} />
        {/* the Twilight Sword */}
        <path d="M170 272 L178 26 L186 272 Z" fill="#ff9a2a" filter={glow} />
        <path d="M176 262 L180 40" stroke="#fff3a0" strokeWidth="1.5" />
      </g>
    ),
    front: ({ glow }) => (
      <g>
        {/* the burning crown of horns */}
        {both("M70 90 C50 70 40 40 46 12 C56 40 70 58 82 74 Z", { fill: "#2a0e04", stroke: "#ff7a1a", strokeWidth: 1.4 })}
        {both("M80 76 C72 56 70 36 78 20 C82 40 88 56 92 70 Z", { fill: "#2a0e04", stroke: "#ff7a1a", strokeWidth: 1.2 })}
        {/* cracks of fire across the face and chest */}
        <g stroke="#ff9a2a" strokeWidth="2" fill="none" filter={glow} strokeLinecap="round">
          <path d="M80 92 L88 104 L84 118 M120 92 L112 104 L116 118 M90 134 L100 142 L110 134" />
          <path d="M60 210 L80 222 L76 244 M140 210 L120 222 L124 244 M100 200 L96 226 L104 252" />
        </g>
        <path d="M80 148 C90 158 110 158 120 148 C112 164 88 164 80 148 Z" fill="#ffb02e" filter={glow} />
      </g>
    ),
  },
  mbaku: {
    suit: ["#6a5a4a", "#1a140e"], skin: ["#6a4630", "#24140a"], rim: "#e6e0c8", sky: "#14200e", big: true,
    eyes: { color: "#f0e6c8", shape: "none" },
    back: () => (
      <g>
        {/* the white gorilla pelt over his shoulders */}
        <path d="M-6 272 C-4 206 30 176 66 168 C60 140 70 112 100 106 C130 112 140 140 134 168 C170 176 204 206 206 272 Z" fill="#e8e2d0" stroke="#a8a090" strokeWidth="1.2" />
        <path d="M66 168 C80 160 120 160 134 168" stroke="#c8c0b0" strokeWidth="6" fill="none" />
      </g>
    ),
    front: () => (
      <g>
        {/* gorilla-skull helm crest */}
        <path d="M66 100 C64 72 82 60 100 60 C118 60 136 72 134 100 C124 90 112 86 100 86 C88 86 76 90 66 100 Z" fill="#e8e2d0" stroke="#a8a090" strokeWidth="1" />
        <path d="M74 96 C84 88 116 88 126 96" stroke="#5a5040" strokeWidth="3" fill="none" />
        <path d="M80 112 C86 108 92 108 96 112 M104 112 C108 108 114 108 120 112" stroke="#f0e6c8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M84 146 C94 140 106 140 116 146" stroke="#14080a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* jabari war club */}
        <path d="M158 272 L170 170" stroke="#5a3a1a" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="171" cy="164" rx="11" ry="15" fill="#6a4a2a" stroke="#e8e2d0" strokeWidth="1.2" />
      </g>
    ),
  },
  namor: {
    suit: ["#1a6a5a", "#04201a"], skin: ["#a87a5a", "#3a2214"], rim: "#4ae0d0", sky: "#062a2a",
    eyes: { color: "#4ae0d0", shape: "none" },
    back: ({ glow }) => (
      <g>
        <path d="M-6 272 C20 230 50 210 100 206 C150 210 180 230 206 272 Z" fill="#0a4a5a" opacity=".6" />
        {/* the trident */}
        <path d="M30 272 L40 34" stroke="#c8a43a" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 60 C26 44 30 34 40 22 C50 34 54 44 56 60 M40 22 L40 4" stroke="#e6c35a" strokeWidth="3.4" fill="none" strokeLinecap="round" filter={glow} />
      </g>
    ),
    front: ({ rim }) => (
      <g>
        {/* swept-back hair, pointed ears and ankle wings echoed as ear fins */}
        <path d="M66 104 C62 72 82 60 102 60 C124 60 140 72 136 98 C126 84 114 78 100 80 C86 80 72 88 66 104 Z" fill="#14100c" />
        {both("M66 112 L50 100 L56 116 L66 122 Z", { fill: "#a87a5a", stroke: "#3a2214", strokeWidth: 1 })}
        <path d="M84 146 C94 150 106 150 116 146" stroke="#3a1a10" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* jade and gold collar */}
        <path d="M58 196 C80 186 120 186 142 196 L138 212 C118 202 82 202 62 212 Z" fill="#2a9a6a" stroke="#e6c35a" strokeWidth="1.6" />
        {[76, 88, 100, 112, 124].map((x) => <circle key={x} cx={x} cy={202} r="2.4" fill={rim} />)}
      </g>
    ),
  },
  deathstrike: {
    suit: ["#3a2a3a", "#0a060a"], skin: ["#ecd2b8", "#8a6a54"], rim: "#ff3a6a", sky: "#1a0612",
    eyes: { color: "#ff3a6a", shape: "slit" },
    back: () => (
      <path d="M68 96 C50 140 44 200 50 260 L74 236 L76 140 Z M132 96 C150 140 156 200 150 260 L126 236 L124 140 Z" fill="#0a0a10" />
    ),
    front: ({ glow }) => (
      <g>
        <path d="M66 104 C64 74 82 62 100 62 C118 62 136 74 134 104 C126 88 112 82 100 82 C88 82 74 88 66 104 Z" fill="#0a0a10" />
        <path d="M86 146 C94 150 106 150 114 146" stroke="#7a1a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* adamantium talons raised */}
        <g filter={glow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${140 + i * 6} 242 L${150 + i * 9} ${150 - i * 4}`} stroke="#e0e6f0" strokeWidth="2.6" strokeLinecap="round" />
          ))}
        </g>
        <path d="M134 236 C140 228 160 228 172 240 L168 256 L138 256 Z" fill="#ecd2b8" />
        <path d="M84 188 L100 220 L116 188" stroke="#ff3a6a" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  "omega-red": {
    suit: ["#a81a1a", "#2a0404"], skin: ["#e8dcd0", "#8a7a70"], rim: "#ffcb3a", sky: "#2a0a0a", big: true,
    eyes: { color: "#ffcb3a", shape: "slit" },
    back: ({ glow }) => (
      <g fill="none" strokeLinecap="round">
        {/* carbonadium coils whipping out of his wrists */}
        {["M40 240 C10 220 -4 180 20 150 C40 126 20 100 6 90", "M160 240 C190 220 204 180 180 150 C160 126 180 100 194 90"].map((d) => (
          <g key={d}>
            <path d={d} stroke="#5a5a64" strokeWidth="7" />
            <path d={d} stroke="#c8ccd8" strokeWidth="4" strokeDasharray="4 3" />
            <path d={d} stroke="#ffcb3a" strokeWidth="1.2" opacity=".8" filter={glow} />
          </g>
        ))}
      </g>
    ),
    front: () => (
      <g>
        <path d="M66 100 C64 72 82 62 100 62 C118 62 136 72 134 100 C124 86 112 82 100 82 C88 82 76 86 66 100 Z" fill="#f4f0e8" />
        <path d="M84 146 C94 140 106 140 116 146" stroke="#3a0a0a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* the red star of his old super-soldier suit */}
        <path d="M100 196 L106 212 L122 212 L109 222 L114 238 L100 228 L86 238 L91 222 L78 212 L94 212 Z" fill="#ffcb3a" />
        {both("M60 196 C70 190 80 188 86 188 L82 206 L62 214 Z", { fill: "#6a0a0a" })}
      </g>
    ),
  },
  "silver-samurai": {
    suit: ["#c8ccd8", "#4a4e5a"], skin: ["#d8b490", "#6a4a34"], rim: "#ffe14a", sky: "#0e1424",
    eyes: { color: "#ffe14a", shape: "slit" },
    back: ({ glow }) => (
      <g>
        {/* the tachyon katana, charged */}
        <path d="M30 270 L176 30" stroke="#fff6c0" strokeWidth="4" strokeLinecap="round" filter={glow} />
        <path d="M30 270 L50 238" stroke="#2a2a34" strokeWidth="7" strokeLinecap="round" />
      </g>
    ),
    front: () => (
      <g>
        {/* kabuto helmet with crescent maedate and face guard */}
        <path d="M58 112 C56 78 76 58 100 58 C124 58 144 78 142 112 L148 120 L52 120 Z" fill="#c8ccd8" stroke="#6a6e7a" strokeWidth="1.4" />
        <path d="M70 70 C60 44 70 28 82 22 C78 40 84 56 100 64 C116 56 122 40 118 22 C130 28 140 44 130 70" fill="none" stroke="#e6c35a" strokeWidth="4" strokeLinecap="round" />
        <path d="M74 130 L126 130 L120 160 C110 166 90 166 80 160 Z" fill="#8a8e9a" stroke="#4a4e5a" strokeWidth="1.2" />
        <path d="M82 140 L118 140 M84 150 L116 150" stroke="#4a4e5a" strokeWidth="1.6" />
        {/* lamellar shoulders */}
        {both("M10 236 C14 202 40 186 70 182 L74 206 C50 208 28 220 10 244 Z", { fill: "#a8acb8", stroke: "#4a4e5a", strokeWidth: 1.2 })}
        {both("M18 220 L66 196 M14 232 L68 208", { stroke: "#4a4e5a", strokeWidth: 1.2, fill: "none" })}
      </g>
    ),
  },
  "captain-cold": {
    suit: ["#3a7ab0", "#0a1e34"], skin: ["#e8c8a8", "#8a6a54"], rim: "#9ae6ff", sky: "#0a1a2a",
    eyes: { color: "#9ae6ff", shape: "none" },
    back: ({ glow }) => (
      <g filter={glow} opacity=".9">
        {/* frost crystals and snowfall */}
        {[[28, 60], [170, 80], [40, 150], [164, 160], [20, 210], [184, 220]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y! - 9} L${x} ${y! + 9} M${x! - 8} ${y! - 5} L${x! + 8} ${y! + 5} M${x! - 8} ${y! + 5} L${x! + 8} ${y! - 5}`} stroke="#d8f6ff" strokeWidth="1.6" strokeLinecap="round" />
        ))}
      </g>
    ),
    front: ({ glow }) => (
      <g>
        {/* parka hood with fur trim, snow goggles up */}
        <path d="M56 130 C50 80 74 54 100 54 C126 54 150 80 144 130 C138 100 122 84 100 84 C78 84 62 100 56 130 Z" fill="#2a5a8a" />
        <path d="M58 128 C54 90 76 66 100 66 C124 66 146 90 142 128" stroke="#e8f0f4" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="72" y="88" width="56" height="12" rx="6" fill="#1a2a3a" stroke="#9ae6ff" strokeWidth="1.4" />
        <path d="M86 146 C94 142 106 142 114 146" stroke="#4a2a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* cold gun */}
        <path d="M130 238 L184 222 L188 236 L134 252 Z" fill="#c8ccd8" stroke="#4a4e5a" strokeWidth="1.2" />
        <circle cx="188" cy="229" r="7" fill="#9ae6ff" filter={glow} />
      </g>
    ),
  },
  grodd: {
    suit: ["#4a3e34", "#120e0a"], skin: ["#5a4a3e", "#14100c"], rim: "#c86aff", sky: "#160a24", big: true,
    eyes: { color: "#e0a0ff", shape: "slit", size: 1.2 },
    head: HEAD_BIG,
    back: ({ glow }) => (
      <g filter={glow} opacity=".75" fill="none" stroke="#c86aff" strokeWidth="2">
        {/* telepathic rings */}
        <ellipse cx="100" cy="96" rx="58" ry="40" />
        <ellipse cx="100" cy="90" rx="80" ry="58" opacity=".6" />
        <ellipse cx="100" cy="84" rx="100" ry="76" opacity=".35" />
      </g>
    ),
    front: () => (
      <g>
        {/* gorilla face: brow ridge, broad muzzle, fur crest */}
        <path d="M62 104 C62 76 80 62 100 62 C120 62 138 76 138 104 C124 94 112 92 100 92 C88 92 76 94 62 104 Z" fill="#2a221c" />
        <path d="M68 102 C80 94 120 94 132 102 C126 108 74 108 68 102 Z" fill="#1a140e" />
        <path d="M76 128 C76 116 124 116 124 128 C124 156 112 164 100 164 C88 164 76 156 76 128 Z" fill="#7a6a5a" />
        <path d="M90 130 C92 126 96 126 96 130 M104 130 C104 126 108 126 110 130" stroke="#1a140e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M84 148 C94 154 106 154 116 148" stroke="#1a0a0a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {both("M110 150 L114 158 L118 150", { fill: "#f4f0e0" })}
      </g>
    ),
  },
  "mirror-master": {
    suit: ["#3a8a6a", "#0a2418"], skin: ["#e8c8a8", "#8a6a54"], rim: "#c8f0ff", sky: "#0a1a24",
    eyes: { color: "#c8f0ff", shape: "none" },
    back: ({ glow }) => (
      <g>
        {/* shattered mirror shards, each with a cold glint */}
        {["M10 40 L50 30 L44 90 Z", "M150 24 L196 46 L168 98 Z", "M4 150 L40 128 L36 196 Z", "M160 130 L198 150 L176 206 Z"].map((d) => (
          <g key={d}>
            <path d={d} fill="#a8d8f0" opacity=".35" stroke="#e8f8ff" strokeWidth="1.2" />
            <path d={d} fill="none" stroke="#fff" strokeWidth=".8" opacity=".9" filter={glow} />
          </g>
        ))}
      </g>
    ),
    front: () => (
      <g>
        {/* the mirrored visor helmet */}
        <path d="M64 114 C62 78 80 62 100 62 C120 62 138 78 136 114 L130 122 L70 122 Z" fill="#2a6a4a" stroke="#0a2418" strokeWidth="1.2" />
        <path d="M72 100 C76 92 124 92 128 100 L126 118 C112 124 88 124 74 118 Z" fill="#c8f0ff" stroke="#6a9ab0" strokeWidth="1.4" />
        <path d="M80 100 L92 116 M96 98 L108 116" stroke="#fff" strokeWidth="2.4" opacity=".8" strokeLinecap="round" />
        <path d="M86 148 C96 152 106 150 116 144" stroke="#4a2a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* the M on the chest */}
        <path d="M82 236 L82 206 L100 224 L118 206 L118 236" stroke="#c8f0ff" strokeWidth="5" fill="none" strokeLinejoin="round" />
      </g>
    ),
  },
};

/** viewBoxes per frame shape: full card, a face close-up, a wide banner (match-ups), a very tall split (round intro). */
export type VillainCrop = "card" | "head" | "wide" | "tall";
const CROPS: Record<VillainCrop, string> = { card: "18 50 164 236", head: "40 100 120 120", wide: "8 96 184 128", tall: "26 70 148 236" };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s >>> 0) / 4294967296);
}

/** A deterministic skyline, lightning path and ember field per villain, so each card is its own scene. */
function scene(id: string) {
  const r = rng(hash(id));
  const towers: { x: number; w: number; h: number; spire: boolean }[] = [];
  for (let x = -6; x < 206; ) {
    const w = 10 + r() * 18;
    towers.push({ x, w, h: 30 + r() * 70, spire: r() < 0.25 });
    x += w + r() * 3;
  }
  const windows: [number, number][] = [];
  for (const t of towers) for (let i = 0; i < 3; i++) if (r() < 0.6) windows.push([t.x + 2 + r() * (t.w - 5), 300 - t.h + 6 + r() * (t.h - 10)]);
  const side = r() < 0.5 ? -1 : 1;
  let bx = 100 + side * (40 + r() * 30);
  let bolt = `M${bx.toFixed(1)} -4`;
  for (let y = 12; y < 120; y += 12 + r() * 10) {
    bx += (r() - 0.5) * 22 + side * 3;
    bolt += ` L${bx.toFixed(1)} ${y.toFixed(1)}`;
  }
  const embers = Array.from({ length: 16 }, () => ({ x: r() * 200, y: 150 + r() * 150, r: 0.6 + r() * 1.6, o: 0.35 + r() * 0.55 }));
  const swirl = 20 + r() * 40;
  return { towers, windows, bolt, embers, swirl };
}

/**
 * The card art. `crop="head"` frames the face for small avatars; `crop="card"` is the full portrait.
 * The SVG uses `slice`, so it fills any frame shape like the painted `object-cover` art does.
 */
export const VillainArt = memo(function VillainArt({ id, color, crop = "card", className = "absolute inset-0 size-full" }: { id: string; color: string; crop?: VillainCrop; className?: string }) {
  const painted = useArt(`villain-${id}`);
  if (painted) return <PaintedVillain src={painted} crop={crop} headY={PAINTED_HEAD_Y[id]} className={className} />;
  return <VectorVillain id={id} color={color} crop={crop} className={className} />;
});

/**
 * Where each frame looks on a painted 540×960 portrait. The figures are painted full length with the head in the
 * upper third, so small avatars zoom in on the face instead of shrinking the whole body.
 */
const PAINTED: Record<VillainCrop, { pos: string; zoom: number; origin: string }> = {
  card: { pos: "50% 20%", zoom: 1, origin: "50% 20%" },
  head: { pos: "50% 0%", zoom: 2.3, origin: "52% 22%" },
  wide: { pos: "50% 24%", zoom: 1.15, origin: "50% 30%" },
  tall: { pos: "50% 28%", zoom: 1, origin: "50% 30%" },
};

/**
 * Head-crop zoom origin (percent of the frame's height) for paintings whose face sits lower than the usual upper
 * third (big-headed or hunched figures). Checked on the avatar circle at 390×844 (2026-11-09 night).
 */
const PAINTED_HEAD_Y: Partial<Record<string, number>> = {
  brainiac: 70, grodd: 70, hammer: 55, leader: 85, "mirror-master": 55, surtur: 70, vulture: 70, "silver-samurai": 55,
};

function PaintedVillain({ src, crop, headY, className }: { src: string; crop: VillainCrop; headY?: number; className: string }) {
  const base = PAINTED[crop];
  const f = crop === "head" && headY !== undefined ? { ...base, origin: `52% ${headY}%` } : base;
  return (
    <span className={`${className} block overflow-hidden`} aria-hidden>
      <img src={src} alt="" decoding="async" className="anim-fade size-full object-cover" style={{ objectPosition: f.pos, transform: f.zoom === 1 ? undefined : `scale(${f.zoom})`, transformOrigin: f.origin }} />
    </span>
  );
}

const VectorVillain = memo(function VectorVillain({ id, color, crop, className }: { id: string; color: string; crop: VillainCrop; className: string }) {
  const raw = useId().replace(/:/g, "");
  const spec = (SPECS as Record<string, Spec | undefined>)[id];
  if (!spec) return null;
  const uid = `va${raw}`;
  const rim = spec.rim ?? color;
  const kit: Kit = { uid, rim, glow: `url(#${uid}-glow)`, soft: `url(#${uid}-soft)`, gold: `url(#${uid}-gold)` };
  const s = scene(id);
  const big = !!spec.big;
  const shoulders = big ? SHOULDERS_BIG : SHOULDERS;
  const head = spec.head ?? (big ? HEAD_BIG : HEAD);
  const eye = spec.eyes;
  const k = eye?.size ?? 1;
  const viewBox = CROPS[crop];
  return (
    // Very tall frames "meet" instead of "slice", so the whole bust shows; the sky and ground run past the viewBox to fill the frame.
    <svg viewBox={viewBox} preserveAspectRatio={crop === "tall" ? "xMidYMid meet" : "xMidYMid slice"} className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={spec.sky} />
          <stop offset=".55" stopColor="#0b0c16" />
          <stop offset="1" stopColor="#05060a" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx=".5" cy=".42" r=".5">
          <stop offset="0" stopColor={rim} stopOpacity=".75" />
          <stop offset=".45" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-suit`} x1=".2" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor={spec.suit[0]} />
          <stop offset="1" stopColor={spec.suit[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-skin`} cx=".38" cy=".3" r=".85">
          <stop offset="0" stopColor={spec.skin[0]} />
          <stop offset="1" stopColor={spec.skin[1]} />
        </radialGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset=".45" stopColor="#e2b13c" />
          <stop offset="1" stopColor="#7a5414" />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05060a" stopOpacity="0" />
          <stop offset="1" stopColor="#05060a" />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx=".5" cy=".45" r=".75">
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".6" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Sky, storm swirl, lightning */}
      <rect x="-2000" y="-4000" width="4200" height="3990" fill={spec.sky} />
      <rect x="-2000" y="-20" width="4200" height="340" fill={`url(#${uid}-sky)`} />
      <rect x="-2000" y="300" width="4200" height="4000" fill="#05060a" />
      <g filter={kit.soft} opacity=".55">
        <ellipse cx="100" cy="110" rx="110" ry="54" fill="none" stroke={color} strokeWidth="10" transform={`rotate(${-s.swirl} 100 110)`} />
        <ellipse cx="100" cy="110" rx="70" ry="30" fill="none" stroke={rim} strokeWidth="6" opacity=".7" transform={`rotate(${s.swirl / 2} 100 110)`} />
      </g>
      <circle cx="100" cy="128" r="118" fill={`url(#${uid}-halo)`} />
      <g filter={kit.glow}>
        <path d={s.bolt} stroke={spec.bolt ?? rim} strokeWidth="1.8" fill="none" strokeLinejoin="round" opacity=".9" />
      </g>

      {/* Skyline */}
      <g fill="#06070d">
        {s.towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={300 - t.h} width={t.w} height={t.h} />
            {t.spire && <path d={`M${t.x + t.w / 2 - 1} ${300 - t.h} L${t.x + t.w / 2} ${300 - t.h - 14} L${t.x + t.w / 2 + 1} ${300 - t.h} Z`} />}
          </g>
        ))}
      </g>
      <g fill={rim} opacity=".55">
        {s.windows.map(([x, y], i) => <rect key={i} x={x} y={y} width="1.6" height="2.2" />)}
      </g>

      {/* The bust */}
      <g transform="translate(0 40)">
        {spec.back?.(kit)}
        <path d={shoulders} fill={`url(#${uid}-suit)`} />
        <path d={head} fill={`url(#${uid}-skin)`} />
        {spec.front?.(kit)}
        {eye && eye.shape === "slit" && (
          <g fill={eye.color} filter={kit.glow}>
            <path d={`M${100 - 20 * k} ${110 - 2 * k} L${100 - 4 * k} ${114} L${100 - 6 * k} ${119 + k} L${100 - 17 * k} ${116} Z`} />
            <path d={`M${100 + 20 * k} ${110 - 2 * k} L${100 + 4 * k} ${114} L${100 + 6 * k} ${119 + k} L${100 + 17 * k} ${116} Z`} />
          </g>
        )}
        {eye && eye.shape === "cat" && (
          <g filter={kit.glow}>
            {[-1, 1].map((d) => (
              <g key={d}>
                <path d={`M${100 + d * 22 * k} 112 C${100 + d * 16 * k} 106 ${100 + d * 8 * k} 108 ${100 + d * 5 * k} 115 C${100 + d * 10 * k} 120 ${100 + d * 18 * k} 119 ${100 + d * 22 * k} 112 Z`} fill={eye.color} />
                <ellipse cx={100 + d * 13 * k} cy="113.5" rx="1.3" ry="3.6" fill="#0a0a06" />
              </g>
            ))}
          </g>
        )}
        {/* one rim light, from behind, in the villain's colour */}
        <g fill="none" stroke={rim} strokeWidth="1.6" opacity=".85" filter={kit.glow}>
          <path d={head} />
          <path d={shoulders} />
        </g>
        <path d={shoulders} fill={`url(#${uid}-shade)`} />
      </g>
      <rect x="-2000" y="268" width="4200" height="50" fill={`url(#${uid}-floor)`} />

      {/* Embers and vignette */}
      <g fill={rim}>
        {s.embers.map((e, i) => <circle key={i} cx={e.x} cy={e.y} r={e.r} opacity={e.o} />)}
      </g>
      <rect x="-20" y="-20" width="240" height="340" fill={`url(#${uid}-vig)`} />
    </svg>
  );
});
