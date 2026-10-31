import { useId } from "react";
import { fitById, type Fit } from "@/game/costume";
import { HAIR, resolveLook, SKIN } from "@/game/look";
import type { Look, Sex, Wardrobe } from "@/game/types";

export function Figure({
  seed,
  age,
  sex,
  look,
  wardrobe,
  mood = 60,
  aura,
  className = "h-full w-full",
}: {
  seed: number;
  age: number;
  sex?: Sex;
  look?: Partial<Look> | null;
  wardrobe?: Wardrobe;
  mood?: number;
  /** Power colour for the stage spotlight and rim glow. */
  aura?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const face = resolveLook(seed, look);
  const h = seed || 1;
  const body: Sex = sex ?? ((h & 1) === 0 ? "female" : "male");
  const female = body === "female";
  const skin = SKIN[face.skin] ?? SKIN[0];
  const hair = age > 68 ? "#d5d7de" : (HAIR[face.hair] ?? HAIR[0]);
  const baby = age < 4;
  const kid = age < 13;
  const broad = face.build === 1 && !baby && !kid;
  const smile = mood >= 55;
  const worn = wardrobe?.worn ?? {};
  const cowl = fitById(worn.cowl);
  const chest = fitById(worn.chest);
  const cape = fitById(worn.cape);
  const gloves = fitById(worn.gloves);
  const boots = fitById(worn.boots);
  const emblem = fitById(worn.emblem);
  const suit = chest?.cloth ?? "#3a4258";
  const trim = chest?.trim ?? "#f4ead6";
  const scale = baby ? 0.62 : kid ? 0.78 : 1;
  const frame = frameOf(broad, female);

  return (
    <svg viewBox="40 70 240 490" preserveAspectRatio="xMidYMax meet" className={className} width="100%" height="100%" role="img" aria-label="Your hero, full length" style={{ display: "block", overflow: "visible" }}>
      <defs>
        {/* Soft volume: blur the silhouette, light it from the upper left, multiply back over the flat fills. */}
        <filter id={`vol-${uid}`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur" />
          <feDiffuseLighting in="blur" surfaceScale="5" diffuseConstant="1.15" lightingColor="#ffffff" result="light">
            <feDistantLight azimuth="235" elevation="48" />
          </feDiffuseLighting>
          <feComposite in="light" in2="SourceAlpha" operator="in" result="lit" />
          <feBlend in="SourceGraphic" in2="lit" mode="multiply" result="shaded" />
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <radialGradient id={`spot-${uid}`} gradientUnits="userSpaceOnUse" cx="160" cy="300" r="260">
          <stop offset="0%" stopColor={aura ?? "#ffd27a"} stopOpacity="0.55" />
          <stop offset="60%" stopColor={aura ?? "#ffd27a"} stopOpacity="0.1" />
          <stop offset="100%" stopColor={aura ?? "#ffd27a"} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`floor-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Stage uid={uid} />
      <g className="anim-float" style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}>
      <g filter={`url(#vol-${uid})`} transform={`translate(160 600) scale(${scale}) translate(-160 -600)`}>
        <Cape item={cape} frame={frame} />
        {cowl?.mask !== "hood" && cowl?.mask !== "cowl" && cowl?.mask !== "helm" && (
          <HairBack style={face.style} hair={hair} female={female} baby={baby} frame={frame} />
        )}
        <Legs suit={suit} frame={frame} />
        <Boots item={boots} frame={frame} />
        <Arm suit={suit} glove={gloves} skin={skin} frame={frame} side="left" />
        <Arm suit={suit} glove={gloves} skin={skin} frame={frame} side="right" />
        <Torso suit={suit} trim={trim} kind={chest?.chest ?? "jacket"} frame={frame} skin={skin} />
        <Mark item={emblem} />
        <Head
          skin={skin}
          hair={hair}
          style={face.style}
          feature={face.feature}
          female={female}
          baby={baby}
          smile={smile}
          cowl={cowl}
          beard={!female && !baby && age >= 22 && (h & 4) === 0}
        />
      </g>
      </g>
    </svg>
  );
}

interface Frame {
  shoulder: number;
  waist: number;
  hip: number;
  arm: number;
}

function frameOf(broad: boolean, female: boolean): Frame {
  if (female) {
    return broad
      ? { shoulder: 62, waist: 42, hip: 56, arm: 22 }
      : { shoulder: 50, waist: 34, hip: 48, arm: 16 };
  }
  return broad
    ? { shoulder: 74, waist: 54, hip: 52, arm: 26 }
    : { shoulder: 60, waist: 42, hip: 42, arm: 18 };
}

function Stage({ uid }: { uid: string }) {
  return (
    <g>
      <rect x="-400" width="1120" height="640" className="fill-paper" />
      <rect x="-400" width="1120" height="640" fill={`url(#spot-${uid})`} />
      <g stroke="#10141c" strokeOpacity="0.07" strokeWidth="1.5">
        {[120, 160, 200, 240, 280].map((r) => (
          <ellipse key={r} cx="160" cy="550" rx={r} ry={r / 7} fill="none" />
        ))}
      </g>
      <ellipse cx="160" cy="550" rx="110" ry="16" fill={`url(#floor-${uid})`} />
    </g>
  );
}

function Cape({ item, frame }: { item: Fit | null; frame: Frame }) {
  if (!item || item.cape === "none" || !item.cape) return null;
  const cloth = item.cloth;
  const trim = item.trim;
  const left = 160 - frame.shoulder + 6;
  const right = 160 + frame.shoulder - 6;
  if (item.cape === "short") {
    return (
      <g>
        <path d={`M${left} 210 Q40 280 58 390 L262 390 Q280 280 ${right} 210 Q160 236 ${left} 210`} fill={cloth} />
        <path d={`M${left + 10} 220 Q160 250 ${right - 10} 220`} fill="none" stroke={trim} strokeWidth="4" />
      </g>
    );
  }
  if (item.cape === "coat") {
    return (
      <g>
        <path d={`M${left - 4} 196 L36 540 Q160 558 284 540 L${right + 4} 196 Q160 228 ${left - 4} 196`} fill={cloth} />
        <path d="M160 214 L148 540 H172 Z" fill={trim} opacity="0.35" />
      </g>
    );
  }
  if (item.cape === "banner") {
    return (
      <g>
        <path d={`M${left} 204 Q18 340 36 548 L284 548 Q302 340 ${right} 204 Q160 240 ${left} 204`} fill={cloth} />
        <path d="M160 230 L184 300 L160 278 L136 300 Z" fill={trim} />
        <path d="M78 470 H242" stroke={trim} strokeWidth="8" />
      </g>
    );
  }
  if (item.cape === "tatter") {
    return (
      <path
        d={`M${left} 208 Q28 300 48 470 L78 420 L96 520 L128 450 L160 540 L192 448 L224 524 L246 420 L272 480 Q292 300 ${right} 208 Z`}
        fill={cloth}
      />
    );
  }
  return (
    <g>
      <path d={`M${left} 200 Q8 330 24 552 L296 552 Q312 330 ${right} 200 Q160 246 ${left} 200`} fill={cloth} />
      <path d={`M${left + 16} 230 Q160 280 ${right - 16} 230`} fill="none" stroke={trim} strokeWidth="5" opacity="0.8" />
      <path d="M70 400 Q160 430 250 400" fill="none" stroke={trim} strokeWidth="4" opacity="0.45" />
    </g>
  );
}

function Legs({ suit, frame }: { suit: string; frame: Frame }) {
  const left = 160 - Math.round(frame.hip * 0.42);
  const right = 160 + Math.round(frame.hip * 0.42);
  const width = Math.max(22, Math.round(frame.hip * 0.55));
  return (
    <g fill="none" stroke={suit} strokeWidth={width} strokeLinecap="round">
      <path d={`M${left} 348 C${left - 10} 420 ${left - 6} 470 ${left - 4} 508`} />
      <path d={`M${right} 348 C${right + 10} 420 ${right + 6} 470 ${right + 4} 508`} />
    </g>
  );
}

function Boots({ item, frame }: { item: Fit | null; frame: Frame }) {
  const cloth = item?.cloth ?? "#2a241c";
  const trim = item?.trim ?? "#f4ead6";
  const kind = item?.boot ?? "sneaker";
  const tall = kind === "rocket" ? 78 : kind === "boot" || kind === "tread" ? 64 : 46;
  const ankleL = 160 - Math.round(frame.hip * 0.42) - 4;
  const ankleR = 160 + Math.round(frame.hip * 0.42) + 4;
  const y = 500 - (tall - 46);
  return (
    <g stroke="#10141c" strokeWidth="3">
      <rect x={ankleL - 20} y={y} width="42" height={tall} rx="14" fill={cloth} />
      <rect x={ankleR - 22} y={y} width="42" height={tall} rx="14" fill={cloth} />
      <path d={`M${ankleL - 14} ${y + 12} H${ankleL + 16} M${ankleR - 16} ${y + 12} H${ankleR + 14}`} stroke={trim} strokeWidth="4" strokeLinecap="round" />
      {kind === "rocket" && (
        <>
          <path d={`M${ankleL - 6} ${y + tall - 4} L${ankleL - 16} ${y + tall + 18} L${ankleL + 8} ${y + tall} Z`} fill={trim} />
          <path d={`M${ankleR + 6} ${y + tall - 4} L${ankleR + 16} ${y + tall + 18} L${ankleR - 8} ${y + tall} Z`} fill={trim} />
        </>
      )}
    </g>
  );
}

function Arm({
  suit,
  glove,
  skin,
  frame,
  side,
}: {
  suit: string;
  glove: Fit | null;
  skin: string;
  frame: Frame;
  side: "left" | "right";
}) {
  const dir = side === "left" ? -1 : 1;
  const sx = 160 + dir * (frame.shoulder - 4);
  const hx = 160 + dir * (frame.shoulder + 36);
  const hand = glove && glove.glove !== "none" ? glove.cloth : skin;
  return (
    <g>
      <path d={`M${sx} 220 Q${hx} 310 ${hx - dir * 4} 408`} fill="none" stroke={suit} strokeWidth={frame.arm} strokeLinecap="round" />
      <circle cx={hx - dir * 4} cy="408" r={frame.arm * 0.55} fill={hand} stroke="#10141c" strokeWidth="3" />
      {glove?.glove === "wraps" && (
        <path d={`M${hx - dir * 16} 398 H${hx + dir * 8} M${hx - dir * 16} 410 H${hx + dir * 8}`} stroke={glove.trim} strokeWidth="3" />
      )}
      {glove?.glove === "gauntlet" && (
        <rect x={hx - dir * 4 - 16} y="384" width="32" height="24" rx="6" fill={glove.trim} stroke="#10141c" strokeWidth="3" />
      )}
      {glove?.glove === "claws" && (
        <path
          d={`M${hx - dir * 14} 418 L${hx - dir * 22} 444 M${hx - dir * 4} 420 L${hx - dir * 4} 448 M${hx + dir * 6} 418 L${hx + dir * 14} 444`}
          stroke={glove.trim}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {glove?.glove === "medic" && (
        <path d={`M${hx - dir * 8} 400 H${hx + dir * 2} V416 H${hx - dir * 8} Z M${hx - dir * 14} 404 H${hx + dir * 6} V410 H${hx - dir * 14} Z`} fill={glove.trim} />
      )}
    </g>
  );
}

function Torso({
  suit,
  trim,
  kind,
  frame,
  skin,
}: {
  suit: string;
  trim: string;
  kind: Fit["chest"];
  frame: Frame;
  skin: string;
}) {
  const s = frame.shoulder;
  const w = frame.waist;
  const hip = frame.hip;
  return (
    <g>
      <path
        d={`M${160 - s} 196 Q${160 - s - 8} 250 ${160 - w} 300 Q${160 - hip} 328 ${160 - hip + 6} 348 L${160 + hip - 6} 348 Q${160 + hip} 328 ${160 + w} 300 Q${160 + s + 8} 250 ${160 + s} 196 Q160 168 ${160 - s} 196`}
        fill={suit}
        stroke="#10141c"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d={`M${160 - s + 16} 210 Q160 250 ${160 + s - 28} 214 L${160 + w - 10} 300 Q160 250 ${160 - w + 16} 290 Z`}
        fill="#f4ead6"
        opacity="0.14"
      />
      <path d={`M${160 - s + 10} 206 H${160 + s - 10}`} stroke={trim} strokeWidth={kind === "plate" ? 8 : 4} strokeLinecap="round" />
      {kind === "jacket" && (
        <>
          <path d={`M160 188 L${160 - 14} 340 H${160 + 14} Z`} fill={trim} opacity="0.92" />
          <path d={`M${160 - s + 8} 210 L${160 - 16} 250 L160 230 L${160 + 16} 250 L${160 + s - 8} 210`} fill="none" stroke={trim} strokeWidth="3" />
        </>
      )}
      {kind === "suit" && <path d="M160 200 V340" stroke={trim} strokeWidth="5" />}
      {kind === "mesh" && (
        <path d="M132 230 H188 M128 258 H192 M132 286 H188 M136 314 H184" stroke={trim} strokeWidth="2" opacity="0.85" />
      )}
      {kind === "plate" && (
        <>
          <path d="M124 240 H196 M120 272 H200 M126 304 H194" stroke={trim} strokeWidth="4" />
          <path d="M136 220 L160 248 L184 220" fill="none" stroke={trim} strokeWidth="4" />
        </>
      )}
      {kind === "leather" && (
        <>
          <path d={`M${160 - 22} 206 H${160 + 22} L${160 + 12} 246 H${160 - 12} Z`} fill={trim} />
          <path d="M160 206 V340" stroke={trim} strokeWidth="3" />
        </>
      )}
      {kind === "skin" && <path d={`M${160 - 18} 214 Q160 250 ${160 + 18} 214 L${160 + 8} 280 Q160 268 ${160 - 8} 280 Z`} fill={skin} opacity="0.9" />}
    </g>
  );
}

function Mark({ item }: { item: Fit | null }) {
  if (!item || !item.mark || item.mark === "none") return null;
  if (item.mark === "belt" || item.mark === "sash") {
    return (
      <g>
        <path d="M112 324 H208 Q214 340 204 352 H116 Q106 340 112 324" fill={item.cloth} />
        <path d="M148 328 H172 V348 H148 Z" fill={item.trim} />
      </g>
    );
  }
  if (item.mark === "buckle") {
    return <rect x="140" y="318" width="40" height="26" rx="5" fill={item.cloth} stroke={item.trim} strokeWidth="3" />;
  }
  if (item.mark === "brand") {
    return <path d="M160 236 L172 258 L160 250 L148 258 Z" fill={item.cloth} stroke={item.trim} strokeWidth="2" />;
  }
  return <circle cx="160" cy="248" r="12" fill={item.cloth} stroke={item.trim} strokeWidth="3" />;
}

function Head({
  skin,
  hair,
  style,
  feature,
  female,
  baby,
  smile,
  cowl,
  beard,
}: {
  skin: string;
  hair: string;
  style: number;
  feature: number;
  female: boolean;
  baby: boolean;
  smile: boolean;
  cowl: Fit | null;
  beard: boolean;
}) {
  const mask = cowl?.mask ?? "none";
  const hideHair = mask === "hood" || mask === "cowl" || mask === "helm";
  const lip = female ? "#8d3a42" : "#1c140e";
  const r = baby ? 40 : 48;
  return (
    <g>
      <path d={`M${160 - 16} 168 H${160 + 16} V196 Q160 206 ${160 - 16} 196 Z`} fill={skin} />
      <circle cx="160" cy="128" r={r} fill={skin} />
      <ellipse cx="148" cy="118" rx="16" ry="10" fill="#f4ead6" opacity="0.18" />
      {!hideHair && <HairFront style={style} hair={hair} female={female} baby={baby} />}
      {mask === "hood" && <path d="M104 130 C92 40 118 8 160 8 C202 8 228 40 216 130 L228 200 C200 176 120 176 92 200 Z" fill={cowl?.cloth ?? hair} />}
      {mask === "cowl" && (
        <>
          <path d="M112 110 C108 48 128 22 160 22 C192 22 212 48 208 110 L216 176 Q160 156 104 176 Z" fill={cowl?.cloth ?? "#141820"} />
          <path d="M128 118 H150 M170 118 H192" stroke={cowl?.trim ?? "#e6b34d"} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {mask === "helm" && (
        <>
          <path d="M108 118 C102 36 124 12 160 12 C196 12 218 36 212 118 L220 186 Q160 164 100 186 Z" fill={cowl?.cloth ?? "#8d97a8"} />
          <rect x="122" y="112" width="76" height="22" rx="10" fill="#10141c" />
          <path d="M132 123 H188" stroke={cowl?.trim ?? "#3cb8b0"} strokeWidth="4" />
        </>
      )}
      {mask !== "helm" && (
        <>
          {female ? (
            <>
              <path d="M126 108 Q136 100 146 108" fill="none" stroke="#1c140e" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M174 108 Q184 100 194 108" fill="none" stroke="#1c140e" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M124 110 H148" stroke="#1c140e" strokeWidth="3" strokeLinecap="round" />
              <path d="M172 110 H196" stroke="#1c140e" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          <ellipse cx="136" cy="128" rx="7" ry="8" fill="#1c140e" />
          <ellipse cx="184" cy="128" rx="7" ry="8" fill="#1c140e" />
          <circle cx="138.4" cy="125.2" r="2.2" fill="#f4ead6" />
          <circle cx="186.4" cy="125.2" r="2.2" fill="#f4ead6" />
          <path d="M156 136 Q160 142 164 136" fill="none" stroke="#1c140e" strokeWidth="2" opacity="0.45" strokeLinecap="round" />
          {smile ? (
            <path d="M140 150 Q160 168 180 150" fill="none" stroke={lip} strokeWidth="3.2" strokeLinecap="round" />
          ) : (
            <path d="M142 158 Q160 148 178 158" fill="none" stroke={lip} strokeWidth="3.2" strokeLinecap="round" />
          )}
        </>
      )}
      {mask === "domino" && (
        <path d="M118 118 H150 Q160 128 150 140 H118 Q108 130 118 118 M170 118 H202 Q212 130 202 140 H170 Q160 128 170 118" fill={cowl?.cloth ?? "#1c140e"} />
      )}
      {mask === "crown" && <path d="M116 78 L130 42 L148 74 L160 36 L172 74 L190 42 L204 78 Z" fill={cowl?.trim ?? "#e23b3b"} />}
      {mask === "halo" && <ellipse cx="160" cy="36" rx="46" ry="12" fill="none" stroke={cowl?.trim ?? "#e6b34d"} strokeWidth="6" />}
      {feature === 1 && mask !== "helm" && mask !== "cowl" && (
        <path d="M192 134 L206 154" stroke="#8d3a42" strokeWidth="3" strokeLinecap="round" />
      )}
      {feature === 2 && mask !== "helm" && mask !== "cowl" && mask !== "domino" && (
        <g>
          <rect x="118" y="116" width="36" height="26" rx="8" fill="none" stroke="#1c140e" strokeWidth="3" />
          <rect x="166" y="116" width="36" height="26" rx="8" fill="none" stroke="#1c140e" strokeWidth="3" />
          <path d="M154 128 H166" stroke="#1c140e" strokeWidth="3" />
        </g>
      )}
      {feature === 3 && mask !== "helm" && (
        <g fill="#8d3a42" opacity="0.7">
          <circle cx="124" cy="142" r="1.6" />
          <circle cx="132" cy="148" r="1.4" />
          <circle cx="122" cy="150" r="1.3" />
          <circle cx="196" cy="142" r="1.6" />
          <circle cx="188" cy="148" r="1.4" />
          <circle cx="198" cy="150" r="1.3" />
        </g>
      )}
      {beard && mask !== "cowl" && mask !== "helm" && (
        <path d="M128 150 Q134 186 160 190 Q186 186 192 150 Q176 166 160 166 Q144 166 128 150" fill={hair} />
      )}
    </g>
  );
}

function HairBack({
  style,
  hair,
  female,
  baby,
  frame,
}: {
  style: number;
  hair: string;
  female: boolean;
  baby: boolean;
  frame: Frame;
}) {
  if (baby || (style !== 3 && style !== 4 && style !== 5)) return null;
  if (style === 5) {
    return <path d="M156 108 C148 70 176 48 170 110 C210 180 168 250 162 140 Z" fill={hair} />;
  }
  const drop = style === 3 ? 340 : 280;
  const spread = frame.shoulder + (female ? 18 : 8);
  return (
    <path
      d={`M${160 - spread} 150 C${160 - spread - 16} 80 ${160 - 20} 40 160 36 C${160 + 20} 40 ${160 + spread + 16} 80 ${160 + spread} 150 L${160 + spread - 6} ${drop} C${160 + 30} ${drop + 30} ${160 - 30} ${drop + 30} ${160 - spread + 6} ${drop} Z`}
      fill={hair}
    />
  );
}

function HairFront({ style, hair, female, baby }: { style: number; hair: string; female: boolean; baby: boolean }) {
  if (baby) return <path d="M118 118 Q160 62 202 118 Q160 96 118 118" fill={hair} />;
  if (style === 1) {
    return <path d="M112 124 Q104 40 168 36 Q206 44 204 112 L176 78 Q140 52 116 100 Z" fill={hair} />;
  }
  if (style === 2) {
    return <path d="M124 96 Q160 58 196 96 Q160 84 124 96" fill={hair} />;
  }
  if (style === 3) {
    return <path d="M118 108 Q160 48 202 108 Q186 86 160 90 Q134 86 118 108" fill={hair} />;
  }
  if (style === 4) {
    return (
      <path d={`M108 130 Q100 48 ${female ? 150 : 168} 40 Q214 52 208 124 Q176 86 132 96 Q112 70 108 130`} fill={hair} />
    );
  }
  if (style === 5) {
    return (
      <g>
        <circle cx="160" cy="58" r="18" fill={hair} />
        <path d="M124 100 Q160 64 196 100 Q160 86 124 100" fill={hair} />
      </g>
    );
  }
  return <path d="M116 112 Q122 48 160 42 Q200 48 204 112 Q160 84 116 112" fill={hair} />;
}
