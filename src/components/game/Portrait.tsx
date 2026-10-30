import { powerById } from "@/game/data";
import { HAIR, resolveLook, SKIN } from "@/game/look";
import type { Look, PowerId, Sex } from "@/game/types";

export function Portrait({
  seed,
  age,
  powerId,
  rank = 0,
  mood = 60,
  sex,
  look,
  className = "h-16 w-16",
}: {
  seed: number;
  age: number;
  powerId?: PowerId | null;
  rank?: number;
  mood?: number;
  sex?: Sex;
  look?: Partial<Look> | null;
  className?: string;
}) {
  const face = resolveLook(seed, look);
  const h = seed || 1;
  const body: Sex = sex ?? ((h & 1) === 0 ? "female" : "male");
  const female = body === "female";
  const skin = SKIN[face.skin] ?? SKIN[0];
  const hair = age > 68 ? "#d5d7de" : (HAIR[face.hair] ?? HAIR[0]);
  const style = face.style;
  const hue = powerById(powerId ?? null)?.hue ?? "gold";
  const tone = hue === "cape" ? "text-cape" : hue === "spark" ? "text-spark" : "text-gold";
  const baby = age < 4;
  const kid = age < 13;
  const headR = baby ? 19 : female ? 15.4 : 16.4;
  const smile = mood >= 55;
  const lip = female ? "#8d3a42" : "#1c140e";
  const beard = !female && !baby && age >= 16 && (h >>> 12) % 3 !== 0 ? (age >= 22 && (h >>> 14) % 2 === 0 ? "full" : "stubble") : "none";

  return (
    <svg viewBox="0 0 80 96" className={`${className} ${tone}`} aria-hidden>
      <circle cx="40" cy="36" r="30" className="fill-current" opacity="0.18" />
      <path d={female ? "M16 96 L40 60 L64 96" : "M8 96 L40 54 L72 96"} className="fill-current" />
      {female && !baby && <HairBack style={kid ? style % 2 : style} hair={hair} />}
      <rect x={female ? 34 : 31} y={female ? 60 : 58} width={female ? 12 : 18} height="14" rx="6" fill={skin} />
      {!baby && <circle cx={40 - headR + 1} cy="44" r={female ? 2.6 : 3.2} fill={skin} />}
      {!baby && <circle cx={40 + headR - 1} cy="44" r={female ? 2.6 : 3.2} fill={skin} />}
      <circle cx="40" cy="42" r={headR} fill={skin} />
      <HairFront female={female} style={style} hair={hair} baby={baby} kid={kid} />
      {beard === "full" && <path d="M29 49 Q31 66 40 68 Q49 66 51 49 Q47 58 40 59 Q33 58 29 49" fill={hair} />}
      {beard === "stubble" && <path d="M32 50 Q34 60 40 61 Q46 60 48 50 Q44 55 40 55 Q36 55 32 50" fill={hair} opacity="0.4" />}
      {female && !baby ? (
        <>
          <path d="M30 37.2 Q33 35.6 36 37.2" fill="none" stroke="#1c140e" strokeWidth="0.8" />
          <path d="M44 37.2 Q47 35.6 50 37.2" fill="none" stroke="#1c140e" strokeWidth="0.8" />
        </>
      ) : (
        !baby && (
          <>
            <path d="M29 36.5 H36" stroke="#1c140e" strokeWidth="1.35" strokeLinecap="round" />
            <path d="M44 36.5 H51" stroke="#1c140e" strokeWidth="1.35" strokeLinecap="round" />
          </>
        )
      )}
      <ellipse cx="33" cy="42" rx="2.3" ry={age > 72 ? 1.2 : 2.6} fill="#1c140e" />
      <ellipse cx="47" cy="42" rx="2.3" ry={age > 72 ? 1.2 : 2.6} fill="#1c140e" />
      {female && !baby && (
        <>
          <path d="M30.2 40 Q33 38.2 35.8 40" fill="none" stroke="#1c140e" strokeWidth="0.9" />
          <path d="M44.2 40 Q47 38.2 49.8 40" fill="none" stroke="#1c140e" strokeWidth="0.9" />
        </>
      )}
      {smile ? (
        <path d="M33 50 Q40 56 47 50" fill="none" stroke={lip} strokeWidth={female ? 1.9 : 1.6} strokeLinecap="round" />
      ) : (
        <path d="M34 52 Q40 48 46 52" fill="none" stroke={lip} strokeWidth={female ? 1.9 : 1.6} strokeLinecap="round" />
      )}
      {age > 55 && <path d="M28 46 H36 M44 46 H52" stroke="#1c140e" strokeWidth="0.7" opacity="0.45" />}
      {face.feature === 1 && <path d="M48 46 L54 54" stroke="#8d3a42" strokeWidth="1.4" strokeLinecap="round" />}
      {face.feature === 2 && (
        <g>
          <rect x="28" y="38" width="12" height="8" rx="2" fill="none" stroke="#1c140e" strokeWidth="1.2" />
          <rect x="40" y="38" width="12" height="8" rx="2" fill="none" stroke="#1c140e" strokeWidth="1.2" />
          <path d="M40 42 H40" stroke="#1c140e" strokeWidth="1.2" />
        </g>
      )}
      {face.feature === 3 && (
        <g fill="#8d3a42" opacity="0.75">
          <circle cx="30" cy="48" r="0.7" />
          <circle cx="33" cy="50" r="0.6" />
          <circle cx="47" cy="48" r="0.7" />
          <circle cx="50" cy="50" r="0.6" />
        </g>
      )}
      {rank > 0 && !baby && <rect x="24" y="37" width="32" height="9" rx="4.5" className="fill-current" opacity="0.88" />}
      {rank >= 4 && <circle cx="62" cy="78" r="6" className="fill-gold" />}
    </svg>
  );
}

function HairBack({ style, hair }: { style: number; hair: string }) {
  if (style === 0) {
    return <path d="M18 46 C12 28 18 8 40 8 C62 8 68 28 62 46 L66 86 C58 98 46 92 42 78 L40 70 L38 78 C34 92 22 98 14 86 Z" fill={hair} />;
  }
  if (style === 1) {
    return (
      <>
        <circle cx="15" cy="48" r="7" fill={hair} />
        <circle cx="65" cy="48" r="7" fill={hair} />
      </>
    );
  }
  if (style === 2) {
    return (
      <>
        <path d="M22 44 C16 26 24 12 40 12 C56 12 64 26 58 44 L60 70 C52 78 28 78 20 70 Z" fill={hair} />
        <ellipse cx="68" cy="36" rx="7" ry="16" fill={hair} />
      </>
    );
  }
  if (style === 4) {
    return <path d="M16 48 C10 24 22 10 40 12 C58 10 70 24 64 48 L62 70 C52 78 28 78 18 70 Z" fill={hair} />;
  }
  if (style === 5) {
    return (
      <>
        <circle cx="40" cy="14" r="7" fill={hair} />
        <path d="M36 18 C34 8 48 4 44 22 C52 36 40 48 38 24 Z" fill={hair} />
      </>
    );
  }
  return <ellipse cx="40" cy="34" rx="22" ry="20" fill={hair} />;
}

function HairFront({
  female,
  style,
  hair,
  baby,
  kid,
}: {
  female: boolean;
  style: number;
  hair: string;
  baby: boolean;
  kid: boolean;
}) {
  if (baby) {
    return female ? (
      <>
        <circle cx="18" cy="34" r="5.5" fill={hair} />
        <circle cx="62" cy="34" r="5.5" fill={hair} />
        <path d="M26 36 Q40 18 54 36 Q40 28 26 36" fill={hair} />
      </>
    ) : (
      <>
        <path d="M37 26 L40 12 L43 26 Z" fill={hair} />
        <path d="M28 34 Q40 22 52 34 Q40 30 28 34" fill={hair} />
      </>
    );
  }
  if (female && kid) {
    return style % 2 === 0 ? (
      <path d="M24 40 Q40 16 56 40 Q46 30 40 32 Q34 30 24 40" fill={hair} />
    ) : (
      <path d="M23 42 Q22 18 40 16 Q58 18 57 42 Q48 32 40 34 Q32 32 23 42" fill={hair} />
    );
  }
  if (female) {
    if (style === 1) return <path d="M24 38 Q40 14 56 38 L54 44 Q40 34 26 44 Z" fill={hair} />;
    if (style === 2) return <path d="M25 40 Q40 12 55 40 Q48 30 40 32 Q32 30 25 40" fill={hair} />;
    if (style === 3) return null;
    if (style === 4) return <path d="M22 42 Q18 16 40 14 Q62 18 58 42 Q48 32 40 34 Q32 32 22 42" fill={hair} />;
    if (style === 5) return <path d="M26 38 Q40 16 54 38 Q46 30 40 32 Q34 30 26 38" fill={hair} />;
    return <path d="M24 40 Q40 14 56 40 Q48 32 40 34 Q32 32 24 40" fill={hair} />;
  }
  if (style === 0) return <path d="M26 38 Q28 18 40 16 Q54 18 54 38 Q40 30 26 38" fill={hair} />;
  if (style === 1) return <path d="M24 40 Q22 16 46 14 Q60 18 56 36 L50 28 Q36 22 26 34 Z" fill={hair} />;
  if (style === 2) return <ellipse cx="40" cy="30" rx="17" ry="13" fill={hair} />;
  if (style === 4) return <path d="M22 40 Q18 16 40 14 Q64 16 58 42 Q48 30 40 32 Q30 30 22 40" fill={hair} />;
  if (style === 5) return <path d="M26 36 Q40 18 54 36 Q46 28 40 30 Q34 28 26 36" fill={hair} />;
  return <path d="M26 36 Q40 8 54 36 L49 32 Q40 16 31 32 Z" fill={hair} />;
}
