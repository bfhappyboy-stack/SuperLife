import { ArrowLeft, ChevronRight, Crown, Eye, Hammer, LayoutGrid, Lock, Share2, Sparkles, Swords, Wand2, X } from "lucide-react";
import { FirstMove } from "@/components/game/FirstMove";
import { RevealShareSheet, type RevealCardData } from "@/components/game/RevealCard";
import { blip, buzz } from "@/components/game/sfx";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LegendBust } from "@/components/game/LegendBust";
import { TitleArt, useArt } from "@/components/game/Scene";
import { hasArt } from "@/assets/art";
import { ElementBurst, ElementIcon } from "@/components/game/Vfx";
import { getPower } from "@/game/combo";
import { ELEMENTS, elementOfPower } from "@/game/elements";
import { PRESETS, presetById, type HeroPreset } from "@/game/presets";
import { useGame } from "@/game/store";
import type { Game } from "@/game/types";

/**
 * New-life front door and its two roads:
 * - Mystery Life (default): the power is sealed until a birthday from 7 to 15.
 * - God Mode: live a multiverse variant of a legend, or build your own with any powers.
 * Plus the big reveal overlay that plays when a sealed power wakes.
 */

export function ModeSelect() {
  const pickMode = useGame((s) => s.pickMode);
  const toTitle = useGame((s) => s.toTitle);
  const existing = useGame((s) => s.game);
  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <TitleArt className="pointer-events-none absolute inset-0 size-full object-cover opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/75 to-ink" />
      <header className="relative flex shrink-0 items-center gap-2 px-4 pt-4">
        <button type="button" onClick={toTitle} aria-label="Back to title" className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div>
          <p className="t-label text-[10px] text-muted">NEW LIFE</p>
          <h1 className="t-display !text-[2rem] leading-none text-fg">Choose your story</h1>
        </div>
      </header>
      <div className="stagger relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-5 pb-24">
        <button type="button" onClick={() => pickMode("mystery")} className="mode-card group relative shrink-0 overflow-hidden rounded-[28px] border border-gold/60 p-5 text-left" style={{ "--mode": "#e6b34d" } as CSSProperties}>
          <span className="absolute top-4 right-4 rounded-full bg-gold px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-ink uppercase shadow-[0_0_18px_-2px_var(--color-gold)]">Recommended</span>
          <SealedOrb className="size-24" />
          <p className="t-label mt-3 text-[10px] text-gold">MAIN MODE</p>
          <h2 className="t-display !text-[2.1rem] leading-none text-fg">Mystery Life</h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-fg/90">
            Your power is sealed at birth. It wakes on a birthday between <b className="text-gold">7 and 15</b>, and you won&apos;t know what it is until it does.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip icon={<Lock className="size-3" />}>Hidden power</Chip>
            <Chip icon={<Eye className="size-3" />}>Childhood omens</Chip>
            <Chip icon={<Sparkles className="size-3" />}>Big reveal</Chip>
          </div>
          <span className="mt-4 flex items-center justify-between rounded-2xl bg-gold/15 px-3 py-2.5 text-sm font-extrabold text-gold">
            Start a mystery life <ChevronRight className="size-5 transition-transform group-active:translate-x-1" aria-hidden />
          </span>
        </button>

        <button type="button" onClick={() => pickMode("god")} className="mode-card group relative shrink-0 overflow-hidden rounded-[28px] border border-violet-300/50 p-5 text-left" style={{ "--mode": "#a78bfa" } as CSSProperties}>
          <div className="flex -space-x-3">
            {PRESETS.map((p, i) => (
              <LegendThumb key={p.id} legend={p} className="size-12 rounded-xl border-2 border-ink" style={{ zIndex: 20 - i, rotate: `${(i - (PRESETS.length - 1) / 2) * 4}deg` }} />
            ))}
          </div>
          <p className="t-label mt-3 text-[10px] text-violet-300">SANDBOX</p>
          <h2 className="t-display !text-[2.1rem] leading-none text-fg">God Mode</h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-fg/90">
            Live a multiverse variant of a legend, with canon you can follow, bend, or break. Or build your own: any powers, city, upbringing, and traits.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip icon={<Crown className="size-3" />}>{PRESETS.length} legends</Chip>
            <Chip icon={<Swords className="size-3" />}>Signature villains</Chip>
            <Chip icon={<Wand2 className="size-3" />}>Pick your powers</Chip>
          </div>
          <span className="mt-4 flex items-center justify-between rounded-2xl bg-violet-400/15 px-3 py-2.5 text-sm font-extrabold text-violet-200">
            Open the multiverse <ChevronRight className="size-5 transition-transform group-active:translate-x-1" aria-hidden />
          </span>
        </button>
        {existing && <p className="text-center text-xs text-gold">Starting over replaces the life you have saved.</p>}
      </div>
    </main>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-bold text-fg/90">
      {icon}
      {children}
    </span>
  );
}

/** A glowing sealed orb with a question mark: the mystery power before it wakes. */
export function SealedOrb({ className = "size-20" }: { className?: string }) {
  return (
    <span className={`relative grid place-items-center ${className}`} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#ff6a2b,#ffe14d,#4dd8ff,#b07cff,#7fd8ff,#ff6a2b)] opacity-80 blur-md anim-glow" />
      <span className="ko-rays absolute inset-1 rounded-full bg-[conic-gradient(from_0deg,#ff6a2b,#ffe14d,#4dd8ff,#b07cff,#7fd8ff,#ff6a2b)] opacity-90" />
      <span className="absolute inset-[18%] rounded-full bg-ink/90 shadow-[inset_0_0_18px_rgba(255,255,255,.25)]" />
      <span className="t-display relative !text-[2.4rem] text-fg drop-shadow-[0_0_10px_rgba(255,255,255,.7)]">?</span>
    </span>
  );
}

function LegendThumb({ legend, className, style }: { legend: HeroPreset; className?: string; style?: CSSProperties }) {
  const art = useArt(legend.art);
  return (
    <span className={`relative block overflow-hidden bg-panel shadow-lg ${className ?? ""}`} style={{ ...style, background: legend.color }}>
      {art ? <img src={art} alt="" className="anim-fade size-full object-cover object-[50%_18%]" /> : !hasArt(legend.art) && <LegendPoster legend={legend} thumb />}
    </span>
  );
}

/**
 * Drawn poster for a legend whose painted portrait hasn't been made yet: their city at night, a halo in
 * their colour, and the hero in their suit. Swaps out automatically once art lands in src/assets/art.
 */
function LegendPoster({ legend, thumb = false }: { legend: HeroPreset; thumb?: boolean }) {
  const city = useArt(legend.cityId);
  const kit = legend.kit ?? { suit: legend.color, trim: "#f4ead6" };
  return (
    <span className="absolute inset-0 block overflow-hidden bg-ink" aria-hidden>
      {city && <img src={city} alt="" className="anim-fade absolute inset-0 size-full object-cover opacity-45 saturate-50" />}
      <span className="absolute inset-0" style={{ background: `radial-gradient(70% 46% at 50% ${thumb ? 40 : 34}%, ${legend.color}cc, ${legend.color}33 48%, transparent 72%), linear-gradient(180deg, #0c101966, #0c1019 92%)` }} />
      {!thumb && <span className="ko-rays absolute top-[34%] left-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 opacity-25" style={{ background: `conic-gradient(from 0deg, transparent, ${legend.color}, transparent 12%, transparent 25%, ${legend.color}, transparent 37%, transparent 50%, ${legend.color}, transparent 62%, transparent 75%, ${legend.color}, transparent 87%)` }} />}
      <span className={`absolute left-1/2 -translate-x-1/2 ${thumb ? "top-[8%] h-[120%] w-[130%]" : "top-[4%] h-[66%] w-[100%]"}`}>
        <LegendBust crest={kit.crest} color={legend.color} />
      </span>
      {!thumb && <span className="t-display absolute top-[8%] left-1/2 -translate-x-1/2 text-[7rem] leading-none opacity-[0.07]" style={{ color: legend.color }}>{legend.earth.replace("Earth-", "")}</span>}
    </span>
  );
}

/** God Mode: swipe through the legends, or build your own. */
export function GodScreen() {
  const toMode = useGame((s) => s.openCreate);
  const beginLegend = useGame((s) => s.beginLegend);
  const buildOwn = useGame((s) => s.buildOwn);
  const [index, setIndex] = useState(0);
  const [grid, setGrid] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const roster = useRef<HTMLDivElement>(null);
  const cards = PRESETS.length + 1;
  const legend = PRESETS[index];
  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const width = el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetWidth + 12 : el.clientWidth;
    setIndex(Math.max(0, Math.min(cards - 1, Math.round(el.scrollLeft / width))));
  };
  const jump = (i: number) => {
    const el = rail.current;
    const card = el?.children[i];
    if (card instanceof HTMLElement) el!.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
  };
  // Keep the active face centred in the roster strip as the cards swipe.
  useEffect(() => {
    const strip = roster.current;
    const face = strip?.children[index];
    if (strip && face instanceof HTMLElement) strip.scrollTo({ left: face.offsetLeft - strip.clientWidth / 2 + face.offsetWidth / 2, behavior: "smooth" });
  }, [index]);
  const pick = (i: number) => {
    setGrid(false);
    // Jump without smooth scrolling from the grid so the card lands before the sheet fades.
    const el = rail.current;
    const card = el?.children[i];
    if (card instanceof HTMLElement) el!.scrollTo({ left: card.offsetLeft - 16 });
    setIndex(i);
  };
  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 transition-colors duration-500" style={{ background: `radial-gradient(120% 70% at 50% 30%, ${legend?.color ?? "#a78bfa"}33, transparent 70%)` }} />
      <header className="relative flex shrink-0 items-center gap-2 px-4 pt-4">
        <button type="button" onClick={toMode} aria-label="Back to modes" className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="t-label text-[10px] text-violet-300">GOD MODE · THE MULTIVERSE</p>
          <h1 className="t-display !text-[2rem] leading-none text-fg">Pick a legend</h1>
        </div>
        <button type="button" onClick={() => setGrid(true)} className="btn btn-ghost !min-h-11 gap-1.5 !px-3 text-sm" aria-label={`See all ${PRESETS.length} legends`}>
          <LayoutGrid className="size-4" aria-hidden /> All {PRESETS.length}
        </button>
      </header>
      <div ref={rail} onScroll={onScroll} className="no-scrollbar relative flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-4 pb-2" aria-label="Legends">
        {PRESETS.map((p, i) => (
          <LegendCard key={p.id} legend={p} active={i === index} />
        ))}
        <button type="button" onClick={buildOwn} className="relative flex w-[84%] shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-violet-300/50 bg-violet-500/10 px-6 text-center">
          <span className="grid size-20 place-items-center rounded-3xl bg-violet-400/20 text-violet-200 shadow-[0_0_40px_-8px_#a78bfa]">
            <Hammer className="size-9" aria-hidden />
          </span>
          <h2 className="t-display !text-[2rem] text-fg">Build your own</h2>
          <p className="text-sm text-fg/85">Up to three powers (one Apex), any city and upbringing, and two earned traits from day one.</p>
          <span className="btn btn-primary mt-2 min-h-12 w-full gap-1 text-base">Open the builder <ChevronRight className="size-5" aria-hidden /></span>
        </button>
      </div>
      <div ref={roster} className="no-scrollbar relative flex shrink-0 gap-2 overflow-x-auto px-4 py-2" role="tablist" aria-label="Legend picker">
        {Array.from({ length: cards }, (_, i) => {
          const p = PRESETS[i];
          const on = i === index;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={p ? p.hero : "Build your own"}
              onClick={() => jump(i)}
              className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border-2 transition-all duration-300 ${on ? "scale-110 opacity-100" : "scale-95 border-white/10 opacity-55"}`}
              style={on ? { borderColor: p?.color ?? "#a78bfa", boxShadow: `0 0 16px -2px ${p?.color ?? "#a78bfa"}` } : undefined}
            >
              {p ? <LegendThumb legend={p} className="absolute inset-0" /> : <Hammer className="size-5 text-violet-200" aria-hidden />}
            </button>
          );
        })}
      </div>
      <footer className="relative shrink-0 px-4 pt-1 pb-24">
        {legend ? (
          <button type="button" onClick={() => beginLegend(legend.id)} className="btn btn-gold min-h-14 w-full flex-col !gap-0 text-lg">
            <span>Begin as {legend.hero}</span>
            <span className="text-[11px] font-extrabold tracking-[0.14em] opacity-75">{legend.earth.toUpperCase()} · AGE 0</span>
          </button>
        ) : (
          <button type="button" onClick={buildOwn} className="btn btn-primary min-h-14 w-full text-lg">Build your own</button>
        )}
      </footer>
      {grid && (
        <div className="anim-fade absolute inset-0 z-30 flex flex-col bg-ink/92 backdrop-blur-md" role="dialog" aria-label="All legends">
          <header className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-2">
            <div className="min-w-0 flex-1">
              <p className="t-label text-[10px] text-violet-300">THE MULTIVERSE</p>
              <h2 className="t-display !text-[1.7rem] leading-none text-fg">{PRESETS.length} legends</h2>
            </div>
            <button type="button" onClick={() => setGrid(false)} aria-label="Close" className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
              <X className="size-5" aria-hidden />
            </button>
          </header>
          <div className="stagger grid min-h-0 flex-1 grid-cols-3 content-start gap-3 overflow-y-auto px-4 pt-2 pb-24">
            {PRESETS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(i)}
                className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 text-left shadow-lg transition-transform active:scale-95 ${i === index ? "" : "border-white/10"}`}
                style={i === index ? { borderColor: p.color, boxShadow: `0 0 22px -4px ${p.color}` } : undefined}
              >
                <LegendThumb legend={p} className="absolute inset-0" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-6 pb-2">
                  <span className="block truncate text-[13px] leading-tight font-extrabold text-fg">{p.hero}</span>
                  <span className="block truncate text-[10px] font-bold tracking-[0.12em] opacity-80" style={{ color: p.color }}>{p.earth.toUpperCase()}</span>
                </span>
              </button>
            ))}
            <button type="button" onClick={() => pick(PRESETS.length)} className="relative grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-violet-300/50 bg-violet-500/10 p-2 text-center">
              <span className="grid gap-1 justify-items-center">
                <Hammer className="size-7 text-violet-200" aria-hidden />
                <span className="text-[13px] font-extrabold text-fg">Build your own</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function LegendCard({ legend, active }: { legend: HeroPreset; active: boolean }) {
  const art = useArt(legend.art);
  const powers = legend.powers.map((id) => getPower(id)).filter((p) => !!p);
  return (
    <article
      className={`relative flex w-[84%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-[28px] border-2 bg-ink shadow-2xl transition-[transform,opacity] duration-300 ${active ? "scale-100 opacity-100" : "scale-[0.94] opacity-60"}`}
      style={{ borderColor: `${legend.color}aa`, boxShadow: active ? `0 18px 50px -18px ${legend.color}` : undefined }}
      aria-label={`${legend.hero}, ${legend.earth}`}
    >
      {art ? <img src={art} alt={`${legend.hero} portrait`} className="anim-fade absolute inset-0 size-full object-cover object-top" /> : hasArt(legend.art) ? <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${legend.color}55, #0c1019)` }} /> : <LegendPoster legend={legend} />}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/30 via-55% to-ink" />
      <span className="absolute top-3 left-3 rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.16em] text-fg uppercase backdrop-blur">{legend.earth}</span>
      <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-ink uppercase" style={{ background: legend.color }}>Variant</span>
      <div className="relative px-4 pb-4">
        <p className="t-label text-[10px]" style={{ color: legend.color, textShadow: "0 1px 2px #000, 0 0 10px rgba(0,0,0,.9)" }}>{legend.name.toUpperCase()}</p>
        <h2 className="t-hero !text-[2.6rem] text-fg drop-shadow-[0_3px_14px_rgba(0,0,0,.8)]">{legend.hero}</h2>
        <p className="mt-1 line-clamp-3 text-pretty text-[13px] leading-snug text-fg/90">{legend.twist}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {powers.length ? (
            powers.map((p) => {
              const el = elementOfPower(p.id);
              return (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold text-fg" style={{ borderColor: `${ELEMENTS[el].color}88`, background: `${ELEMENTS[el].color}22` }}>
                  <ElementIcon element={el} className="size-3" />
                  {p.name}
                </span>
              );
            })
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-fg">No powers. Just preparation.</span>
          )}
        </div>
        <p className="t-label mt-2.5 text-[10px] text-muted">ROGUES</p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] font-bold text-fg/90">
          {legend.villains.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-1">
              <Swords className="size-3 text-red-300" aria-hidden />
              {v.alias}
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}

/** Full-screen reveal: the sealed power wakes. Plays once, then the manifest choice underneath. */
export function RevealOverlay({ game }: { game: Game }) {
  const close = useGame((s) => s.closeReveal);
  const reveal = game.reveal;
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<"reveal" | "mini">("reveal");
  const [sharing, setSharing] = useState(false);
  const legend = presetById(game.preset);
  const art = useArt(legend?.art ?? "");
  useEffect(() => {
    if (!reveal) return;
    setStage(0);
    setMode("reveal");
    setSharing(false);
    const timers = [window.setTimeout(() => setStage(1), 650), window.setTimeout(() => setStage(2), 1500), window.setTimeout(() => setStage(3), 2300)];
    try {
      navigator.vibrate?.([30, 60, 90]);
    } catch {
      // Vibration is optional.
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reveal?.age, reveal?.powers.join("|")]);
  if (!reveal) return null;
  const head = getPower(reveal.powers[0]);
  const element = elementOfPower(reveal.powers[0] ?? null);
  const meta = ELEMENTS[element];
  const card: RevealCardData = {
    lifeName: game.name,
    age: reveal.age,
    earth: legend?.earth ?? null,
    title: legend ? reveal.title : "Your power has awakened",
    power: head?.name ?? "Unknown",
    tier: head?.tierName ?? "Basic",
    elementLabel: meta.label,
    color: meta.color,
    glow: meta.glow,
    line: reveal.line,
    extras: reveal.powers.slice(1).map((id) => getPower(id)?.name ?? id),
    art: legend ? art : undefined,
  };
  const canMini = !!head && game.flags.firstMove === undefined;
  function embrace() {
    blip(440, 0.18, 0.06);
    buzz(20);
    if (canMini) setMode("mini");
    else close();
  }
  return (
    <div className="reveal fixed inset-0 z-[60] flex flex-col items-center overflow-clip bg-black text-center" role="dialog" aria-modal="true" aria-label="Your power has awakened" style={{ "--el": meta.color, "--glow": meta.glow } as CSSProperties}>
      {legend && art && <img src={art} alt="" className="absolute inset-0 size-full object-cover object-top opacity-40" />}
      <div className="reveal-bg absolute inset-0" />
      <div className="ko-rays reveal-rays pointer-events-none absolute top-[34%] left-1/2 size-[160vmax] -translate-x-1/2 -translate-y-1/2" />
      <div className="fx-flash pointer-events-none absolute inset-0 bg-white" />
      {mode === "mini" && head && <FirstMove element={element} powerName={head.name} onDone={(score) => close(score)} onSkip={() => close()} />}
      {mode === "reveal" && (
        <>
      <div className="relative mt-[13vh] flex flex-col items-center px-6">
        <p className={`t-label text-[11px] tracking-[0.3em] text-fg/80 transition-opacity duration-500 ${stage >= 1 ? "opacity-100" : "opacity-0"}`}>
          {legend ? `${legend.earth.toUpperCase()} · AGE ${reveal.age}` : `AGE ${reveal.age}`}
        </p>
        <div className="relative mt-5 grid size-40 place-items-center">
          <span className="reveal-core absolute inset-0 rounded-full" />
          {stage >= 1 && (
            <span className="absolute inset-0 grid place-items-center">
              <ElementBurst element={element} size={110} seed={reveal.age} big />
            </span>
          )}
          {stage >= 2 && (
            <span className="absolute inset-0 grid place-items-center">
              <ElementBurst element={element} size={140} seed={reveal.age + 7} big />
            </span>
          )}
          <span className={`relative grid size-24 place-items-center rounded-[30px] border-2 border-white/70 shadow-[0_0_60px_var(--el)] transition-transform duration-700 ${stage >= 1 ? "scale-100" : "scale-50"}`} style={{ background: `radial-gradient(circle at 35% 30%, ${meta.glow}, ${meta.color} 60%, #000 140%)` }}>
            <ElementIcon element={element} className="size-12" style={{ color: "#fff", filter: "drop-shadow(0 0 8px rgba(0,0,0,.5))" }} />
          </span>
        </div>
        <p className={`t-label mt-6 text-[12px] tracking-[0.28em] transition-all duration-500 ${stage >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ color: meta.glow }}>
          {legend ? reveal.title.toUpperCase() : "YOUR POWER HAS AWAKENED"}
        </p>
        <h2 className={`t-hero reveal-name mt-3 !text-[3rem] !leading-[0.95] text-balance text-fg ${stage >= 2 ? "ko-in" : "opacity-0"}`}>
          {head?.name ?? "Unknown"}
        </h2>
        <p className={`mt-2 text-xs font-extrabold tracking-[0.18em] uppercase transition-opacity duration-500 ${stage >= 2 ? "opacity-90" : "opacity-0"}`} style={{ color: meta.color }}>
          {meta.label} · {head?.tierName ?? "Basic"}
        </p>
        {reveal.powers.length > 1 && (
          <div className={`mt-3 flex flex-wrap justify-center gap-1.5 transition-opacity duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
            {reveal.powers.slice(1).map((id) => {
              const el = elementOfPower(id);
              return (
                <span key={id} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold text-fg" style={{ borderColor: `${ELEMENTS[el].color}aa`, background: `${ELEMENTS[el].color}33` }}>
                  <ElementIcon element={el} className="size-4" />+ {getPower(id)?.name ?? id}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className={`relative mt-auto w-full max-w-[420px] px-5 pb-24 transition-all duration-500 ${stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <p className="card-glass px-4 py-3 text-pretty text-sm leading-relaxed text-fg">{reveal.line}</p>
        {reveal.guess && (
          <p className={`mt-2 text-sm font-extrabold ${reveal.guess === "right" ? "text-gold" : "text-muted"}`}>
            {reveal.guess === "right" ? "★ You called it. Power +0.25, Joy +6." : "Not what you guessed. It never is."}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setSharing(true)} disabled={stage < 3} aria-label="Share your reveal card" className="btn btn-ghost min-h-14 shrink-0 px-4 disabled:opacity-60">
            <Share2 className="size-5" />
          </button>
          <button type="button" onClick={embrace} disabled={stage < 3} className="btn btn-gold min-h-14 flex-1 text-lg disabled:opacity-60">
            Embrace it
          </button>
        </div>
      </div>
        </>
      )}
      {sharing && <RevealShareSheet data={card} onClose={() => setSharing(false)} />}
    </div>
  );
}
