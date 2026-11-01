import { useId } from "react";

export type Crest = "panther" | "wolverine" | "flash";

/**
 * A rim-lit hero bust for legends whose painted portrait hasn't been made yet: a dark silhouette with the
 * hero's iconic headgear, glowing eyes and one signature detail, lit from behind in their colour.
 */
export function LegendBust({ crest, color, className = "h-full w-full" }: { crest?: Crest; color: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const metal = "#dfe7f2";
  return (
    <svg viewBox="0 0 200 260" className={className} aria-hidden preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1e2c" />
          <stop offset="0.55" stopColor="#0b0d14" />
          <stop offset="1" stopColor="#05060a" />
        </linearGradient>
        <radialGradient id={`${uid}-sheen`} cx="0.3" cy="0.25" r="0.7">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke={color} strokeWidth="1.6" strokeLinejoin="round" filter={`url(#${uid}-glow)`}>
        {crest === "wolverine" && (
          <>
            <path d="M74 104 C62 82 52 52 42 26 C64 50 80 70 90 88 Z" fill={`url(#${uid}-body)`} />
            <path d="M126 104 C138 82 148 52 158 26 C136 50 120 70 110 88 Z" fill={`url(#${uid}-body)`} />
          </>
        )}
        {crest === "panther" && (
          <>
            <path d="M74 94 L70 64 L92 80 Z" fill={`url(#${uid}-body)`} />
            <path d="M126 94 L130 64 L108 80 Z" fill={`url(#${uid}-body)`} />
          </>
        )}
        <path d="M8 262 C12 214 40 196 72 188 C82 184 84 176 84 156 L116 156 C116 176 118 184 128 188 C160 196 188 214 192 262 Z" fill={`url(#${uid}-body)`} />
        <path d="M66 108 C66 80 82 70 100 70 C118 70 134 80 134 108 C134 132 126 150 112 160 C106 164 94 164 88 160 C74 150 66 132 66 108 Z" fill={`url(#${uid}-body)`} />
        {crest === "flash" && (
          <>
            <path d="M68 112 L40 94 L56 106 L34 86 L64 100 L60 92 Z" fill={color} />
            <path d="M132 112 L160 94 L144 106 L166 86 L136 100 L140 92 Z" fill={color} />
          </>
        )}
      </g>
      <path d="M8 262 C12 214 40 196 72 188 C82 184 84 176 84 156 L116 156 C116 176 118 184 128 188 C160 196 188 214 192 262 Z" fill={`url(#${uid}-sheen)`} />
      <path d="M66 108 C66 80 82 70 100 70 C118 70 134 80 134 108 C134 132 126 150 112 160 C106 164 94 164 88 160 C74 150 66 132 66 108 Z" fill={`url(#${uid}-sheen)`} />
      {/* Eyes: white, a little angry. */}
      <g fill="#fff" filter={`url(#${uid}-glow)`}>
        <path d="M80 110 L96 114 L94 119 L83 116 Z" />
        <path d="M120 110 L104 114 L106 119 L117 116 Z" />
      </g>
      {crest === "panther" && (
        <g fill={color} filter={`url(#${uid}-glow)`}>
          {Array.from({ length: 9 }).map((_, i) => {
            const t = (i - 4) / 4;
            const x = 100 + t * 36;
            const y = 190 + Math.abs(t) * -6 + 8;
            return <path key={i} d={`M${x - 3} ${y} L${x} ${y + 9} L${x + 3} ${y} Z`} />;
          })}
        </g>
      )}
      {crest === "wolverine" && (
        <g stroke={metal} strokeWidth="3.2" strokeLinecap="round" filter={`url(#${uid}-glow)`}>
          <path d="M34 250 L70 168" />
          <path d="M44 254 L82 174" />
          <path d="M54 258 L94 182" />
          <path d="M166 250 L130 168" />
          <path d="M156 254 L118 174" />
          <path d="M146 258 L106 182" />
        </g>
      )}
      {crest === "flash" && (
        <g filter={`url(#${uid}-glow)`}>
          <circle cx="100" cy="214" r="17" fill="#fff6d8" stroke={color} strokeWidth="2.5" />
          <path d="M106 198 L93 216 L101 216 L95 230 L109 211 L101 211 Z" fill={color} />
        </g>
      )}
    </svg>
  );
}
