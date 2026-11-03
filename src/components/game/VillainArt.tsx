import { memo, useId, type ReactNode } from "react";
import { type VillainArtId } from "@/components/game/villainArt.data";

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
