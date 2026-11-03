/**
 * Arena: 1v1 versus mode. Hub → draft → secret order → round intro → battle → round result → results.
 * All rules live in src/game/arena.ts (pure, seeded); this file only animates them.
 */
import type React from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { buzz, RivalName } from "@/components/game/arena-context";
import {
  Activity, ArrowLeft, Bot, Bug, Check, CloudFog, CloudLightning, Cpu, Crown, Dna, Drama, EyeOff, Flame, Gauge, HeartPulse,
  Info, Lightbulb, Lock, Medal, Radar, RefreshCcw, RotateCcw, Shield, ShieldCheck, ShieldHalf, Siren, Sparkles, Swords, Trophy, Users, Wifi, Zap,
} from "lucide-react";
import "./arena.css";
import { Figure, type Pose } from "@/components/game/Figure";
import { VillainArt, type VillainCrop } from "@/components/game/VillainArt";
import { hasVillainArt } from "@/components/game/villainArt.data";
import { useArt } from "@/components/game/Scene";
import { ElementBurst, ElementIcon, elementOf, FloatNumber, Projectile } from "@/components/game/Vfx";
import { ELEMENTS } from "@/game/elements";
import { answerOf, BREATH, keyOf } from "@/game/duel";
import {
  aiDraft, aiFollow, aiLead, aiOrder, arenaRefusal, DRAFT_ORDER, draftPick, draftTurn, energyCap, feintCost, fighterOf,
  finish, hashSeed, matchTurn, moveByKey, newMatch, nextRound, registerFighter, rngNext, roundsWon, setOrder, STYLES, taken, tellOf,
  type AiLevel, type ArenaAction, type ArenaMatch, type BoutState, type Side, type Tell, type TurnLog,
} from "@/game/arena";
import { ARENA_ROSTER, type ArenaFighter, type PassiveKind } from "@/game/arena.roster";
import { fighterFromLife } from "@/game/arena.lives";
import { listSlots, loadSlot } from "@/game/save";
import { PRESETS } from "@/game/presets";
import { useGame } from "@/game/store";
import type { DuelMove, MoveStyle } from "@/game/types";
import { OnlineArena } from "@/components/game/OnlineArena";

type View = "hub" | "draft" | "order" | "reveal" | "intro" | "battle" | "results";

interface Saved {
  v: 1;
  match: ArenaMatch;
  level: AiLevel;
  view: View;
}

const SAVE_KEY = "superlife.arena.v1";

const HEX: Record<MoveStyle, string> = { strike: "#ff5a4f", guard: "#3fe0c5", trick: "#ffcf4d" };
const STYLE_ICON: Record<MoveStyle, typeof Swords> = { strike: Swords, guard: Shield, trick: Sparkles };
const STYLE_NAME: Record<MoveStyle, string> = { strike: "Strike", guard: "Guard", trick: "Trick" };
const LEVELS: { id: AiLevel; label: string; line: string }[] = [
  { id: "rookie", label: "Rookie", line: "Rarely bluffs" },
  { id: "pro", label: "Pro", line: "Bluffs. Reads you." },
  { id: "legend", label: "Legend", line: "Feints. Punishes." },
];

const PASSIVE_ICON: Record<PassiveKind, typeof Swords> = {
  armor: ShieldHalf, enrage: Flame, fog: CloudFog, feint: Drama, adapt: Dna, regen: HeartPulse, revive: RefreshCcw, swarm: Bug, charge: Siren,
  sense: Radar, prep: Lightbulb, rage: Flame, steel: ShieldCheck, bracers: Shield, bulwark: ShieldHalf, worthy: CloudLightning, kinetic: Activity,
  speedster: Gauge, arc: Cpu,
};

function save(s: Saved | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage full or blocked: the match just won't survive a reload */
  }
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (s?.v !== 1 || !s.match) return null;
    // A saved match that references a life that no longer exists can't be resumed.
    for (const id of [...s.match.picks[0], ...s.match.picks[1]]) fighterOf(id);
    return s;
  } catch {
    return null;
  }
}

/** Seeded AI dice: same match, same turn, same choice — so a reload replays identically. */
function dice(...parts: (string | number)[]): () => number {
  let s = hashSeed(...parts);
  return () => {
    const [v, n] = rngNext(s);
    s = n;
    return v;
  };
}

/** Register living saved heroes (14+, with a power) as draftable fighters. */
function lifeFighters(): ArenaFighter[] {
  const out: ArenaFighter[] = [];
  for (const row of listSlots()) {
    if (row.empty || row.dead) continue;
    const g = loadSlot(row.slot);
    const f = g ? fighterFromLife(row.slot, g) : null;
    if (f) {
      registerFighter(f);
      out.push(f);
    }
  }
  return out;
}

export function ArenaScreen() {
  const toTitle = useGame((s) => s.toTitle);
  const lives = useMemo(lifeFighters, []);
  const [saved, setSaved] = useState<Saved | null>(() => loadSaved());
  const [level, setLevel] = useState<AiLevel>(saved?.level ?? "pro");
  const view: View = saved?.view ?? "hub";
  // `?arena=CODE` (an invite link) or a room you were in when the page closed opens the online lobby.
  const [online, setOnline] = useState<boolean>(() => {
    try {
      return !!new URLSearchParams(window.location.search).get("arena") || !!JSON.parse(localStorage.getItem("superlife.arena.net.v1") ?? "{}")?.code;
    } catch {
      return false;
    }
  });

  function update(next: Saved | null) {
    setSaved(next);
    save(next);
  }

  function start() {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const pool = [...ARENA_ROSTER.map((f) => f.id), ...lives.map((f) => f.id)];
    update({ v: 1, match: newMatch(seed, pool), level, view: "draft" });
  }

  if (online) return <OnlineArena lives={lives} onBack={() => setOnline(false)} onTitle={() => { setOnline(false); toTitle(); }} />;
  if (!saved || view === "hub") return <Hub level={level} setLevel={setLevel} lives={lives} onStart={start} onOnline={() => setOnline(true)} onBack={toTitle} />;
  const set = (match: ArenaMatch, v: View = view) => update({ ...saved, match, view: v });
  const quit = () => update(null);
  if (view === "draft") return <Draft match={saved.match} level={saved.level} lives={lives} onMatch={(m) => set(m, m.stage === "order" ? "order" : "draft")} onQuit={quit} />;
  if (view === "order") return <Order match={saved.match} onLock={(m) => set(m, "reveal")} onQuit={quit} />;
  if (view === "reveal") return <Reveal match={saved.match} onGo={() => set(saved.match, "intro")} />;
  if (view === "intro") return <RoundIntro match={saved.match} onGo={() => set(saved.match, "battle")} />;
  if (view === "battle") return <Battle key={`r${saved.match.round}`} match={saved.match} level={saved.level} onMatch={(m) => set(m, "battle")} onRoundDone={(m) => set(m, m.stage === "done" ? "results" : "intro")} onQuit={quit} />;
  return <Results match={saved.match} onRematch={start} onHub={() => update(null)} onTitle={() => { update(null); toTitle(); }} />;
}

// ─── Art ──────────────────────────────────────────────────────────────────────────

/** Tiny square avatars pass a high focus ("50% 10%"): frame the villain's face rather than the whole card. */
const headCrop = (focus: string) => Number(/\s(\d+)%/.exec(focus)?.[1] ?? 50) <= 12;

/** Painted art when the legend has it, an illustrated card for signature villains; otherwise a city backdrop with a figure bust. `figW` sizes the bust (wide frames want a smaller one). */
export function FighterArt({ f, className = "", focus = "50% 16%", figW = "120%", figTop = "7%", crop }: { f: ArenaFighter; className?: string; focus?: string; figW?: string; figTop?: string; crop?: VillainCrop }) {
  const art = useArt(f.art ?? "");
  const city = useArt(PRESETS.find((p) => p.id === f.world)?.cityId ?? "");
  return (
    <span className={`absolute inset-0 block overflow-hidden ${className}`} style={{ background: f.color }} aria-hidden>
      {f.art && art ? (
        <img src={art} alt="" className="anim-fade size-full object-cover" style={{ objectPosition: focus }} />
      ) : !f.custom && hasVillainArt(f.id) ? (
        <VillainArt id={f.id} color={f.color} crop={crop ?? (headCrop(focus) ? "head" : "card")} />
      ) : (
        <>
          {city && !f.custom && <img src={city} alt="" className="absolute inset-0 size-full object-cover opacity-40 saturate-50" />}
          <span className="absolute inset-0" style={{ background: `radial-gradient(70% 55% at 50% 38%, ${accentOf(f)}bb, ${accentOf(f)}22 55%, transparent 75%), linear-gradient(180deg, #0c101955, #0c1019 95%)` }} />
          <span className="absolute left-1/2 aspect-[240/490] -translate-x-1/2" style={{ width: figW, top: figTop }}>
            <FighterFigure f={f} pose="stand" />
          </span>
        </>
      )}
    </span>
  );
}

export function FighterFigure({ f, pose, label }: { f: ArenaFighter; pose: Pose; label?: string }) {
  if (f.life) return <Figure seed={f.seed ?? 7} age={Math.max(18, f.life.age)} sex={f.life.sex} look={f.life.look} wardrobe={f.life.wardrobe} aura={f.color} bare pose={pose} label={label ?? f.name} />;
  return (
    <Figure
      seed={f.seed ?? hashSeed(f.id)}
      look={f.look}
      age={f.side === "villain" ? 40 : 30}
      sex={f.sex}
      tint={{ ...f.tint, capeKind: f.tint.capeKind ?? "none" }}
      aura={f.color}
      bare
      pose={pose}
      mood={f.side === "villain" ? 25 : 70}
      label={label ?? f.name}
    />
  );
}

export function PassiveTag({ f, compact = false }: { f: ArenaFighter; compact?: boolean }) {
  const Icon = PASSIVE_ICON[f.passive.kind];
  return (
    <span className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-fg">
      <Icon className="size-3.5 shrink-0" style={{ color: f.color === "#2b2d3a" || f.color === "#1f3a2a" || f.color === "#2a2a3a" ? "#e6b34d" : f.color }} aria-hidden />
      <span className="truncate">{f.passive.name}</span>
      {!compact && <span className="truncate font-semibold text-muted">· {f.passive.text}</span>}
    </span>
  );
}

export function Header({ title, kicker, onBack, right }: { title: string; kicker: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <header className="relative flex shrink-0 items-center gap-3 px-4 pt-3 pb-2">
      <button type="button" onClick={onBack} className="btn btn-ghost !min-h-10 !w-10 !p-0" aria-label="Back">
        <ArrowLeft className="size-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p className="t-label text-gold">{kicker}</p>
        <h1 className="t-display truncate text-fg">{title}</h1>
      </div>
      {right}
    </header>
  );
}

// ─── Hub ──────────────────────────────────────────────────────────────────────────

function Hub({ level, setLevel, lives, onStart, onOnline, onBack }: { level: AiLevel; setLevel: (l: AiLevel) => void; lives: ArenaFighter[]; onStart: () => void; onOnline: () => void; onBack: () => void }) {
  const poster = ["spider-man", "batman", "wonder-woman"].map((id) => fighterOf(id));
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <Header title="Arena" kicker="1v1 versus" onBack={onBack} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <section className="relative mt-1 h-56 overflow-hidden rounded-[1.5rem] border border-white/10">
          <div className="absolute inset-0 flex">
            {poster.map((f, i) => (
              <span key={f.id} className="relative h-full flex-1 overflow-hidden" style={{ clipPath: i === 0 ? "polygon(0 0,100% 0,82% 100%,0 100%)" : i === 1 ? "polygon(18% 0,100% 0,82% 100%,0 100%)" : "polygon(18% 0,100% 0,100% 100%,0 100%)", marginLeft: i ? "-9%" : 0 }}>
                <FighterArt f={f} />
              </span>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute inset-x-4 bottom-3">
            <p className="arena-title text-[3.4rem]">ARENA</p>
            <p className="text-sm font-bold text-fg/90">Draft three. Fight three. Best of three.</p>
          </div>
        </section>

        <section className="card-glass mt-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gold/15 text-gold"><Bot className="size-6" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <h2 className="t-label text-gold">Vs computer</h2>
              <p className="text-sm font-bold text-fg">Pick a rival's skill</p>
            </div>
          </div>
          <div role="radiogroup" aria-label="Rival skill" className="mt-3 grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button key={l.id} type="button" role="radio" aria-checked={level === l.id} onClick={() => setLevel(l.id)} className={`card flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center ${level === l.id ? "!border-gold arena-lead-ring" : ""}`}>
                <span className="font-display text-lg leading-none text-fg">{l.label}</span>
                <span className="text-[10px] leading-tight font-bold text-muted">{l.line}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={onStart} className="btn btn-gold mt-3 min-h-14 w-full text-lg">
            <Swords className="size-5" aria-hidden /> Start the draft
          </button>
          
        </section>

        <button type="button" onClick={onOnline} className="arena-online-card card-glass mt-3 flex w-full items-center gap-3 px-4 py-3 text-left">
          <span className="arena-radar grid size-11 shrink-0 place-items-center rounded-xl bg-spark/15 text-spark"><Wifi className="size-6" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 className="t-label flex items-center gap-2 text-spark">Vs a friend online <span className="rounded-full bg-spark px-1.5 py-px text-[9px] text-paper-ink">New</span></h2>
            <p className="text-sm font-bold text-fg">Make a room, send the code</p>
            <p className="text-xs font-semibold text-muted">Live turns. Hidden picks. 30 s a turn.</p>
          </div>
          <ArrowLeft className="size-4 shrink-0 rotate-180 text-spark" aria-hidden />
        </button>

        <section className="mt-4 px-1">
          <h2 className="t-label flex items-center gap-1.5 text-muted"><Info className="size-3.5" aria-hidden /> How it works</h2>
          <ol className="mt-2 flex flex-col gap-2 text-sm font-semibold text-fg/90">
            {[
              ["Draft", `Take turns picking 3 of ${ARENA_ROSTER.length} legends and villains${lives.length ? `, or your own hero${lives.length > 1 ? "es" : ""}` : ""}.`],
              ["Order", "Set who fights round 1, 2 and 3. Both orders flip at once."],
              ["Read", "Each turn one side leads and shows a tell. The other answers. Strike beats trick, trick beats guard, guard beats strike."],
              ["Bluff", "Leading? Pay 2 energy to show a fake tell."],
            ].map(([k, v], i) => (
              <li key={k} className="flex gap-3">
                <span className="t-num grid size-6 shrink-0 place-items-center rounded-full bg-gold text-xs font-extrabold text-paper-ink">{i + 1}</span>
                <span><b className="text-gold">{k}.</b> {v}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

// ─── Draft ────────────────────────────────────────────────────────────────────────

type Filter = "all" | "hero" | "villain" | "yours";

export interface DraftNet {
  /** Whose pick it is from your seat (0 = you). */
  turn: Side | null;
  onPick: (id: string) => void;
  /** You're side 1 on the server: the pick pips run R-Y-Y-R-R-Y. */
  flip: boolean;
}

export function Draft({ match, level, lives, onMatch, onQuit, net }: { match: ArenaMatch; level: AiLevel; lives: ArenaFighter[]; onMatch: (m: ArenaMatch) => void; onQuit: () => void; net?: DraftNet }) {
  const rival = useContext(RivalName);
  const [filter, setFilter] = useState<Filter>("all");
  const [peek, setPeek] = useState<string | null>(null);
  const turn = net ? net.turn : draftTurn(match);
  const used = taken(match);
  const n = match.picks[0].length + match.picks[1].length;

  // The rival drafts after a beat, so you can see it happen.
  useEffect(() => {
    if (turn !== 1 || net) return;
    const id = window.setTimeout(() => onMatch(draftPick(match, 1, aiDraft(match, 1, level, dice(match.seed, "draft", n)))), 750);
    return () => window.clearTimeout(id);
  }, [turn, match, level, n, onMatch, net]);

  const pool = match.pool.map((id) => fighterOf(id)).filter((f) => (filter === "all" ? true : filter === "yours" ? f.custom : f.side === filter && !f.custom));
  const peeked = peek ? fighterOf(peek) : null;
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <Header title="The draft" kicker={turn === 0 ? "Your pick" : turn === 1 ? `${rival} is picking…` : "Draft done"} onBack={onQuit} right={<DraftPips n={n} flip={net?.flip} />} />
      <div className="grid shrink-0 grid-cols-2 gap-2 px-4">
        <TeamRow label="You" picks={match.picks[0]} active={turn === 0} />
        <TeamRow label={rival} picks={match.picks[1]} active={turn === 1} right />
      </div>
      <div role="tablist" className="flex shrink-0 gap-1.5 px-4 pt-3 pb-2">
        {(["all", "hero", "villain", ...(lives.length ? ["yours"] : [])] as Filter[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`chip !min-h-9 ${filter === k ? "!border-gold !bg-gold/15 text-gold" : "text-muted"}`}>
            {k === "all" ? "All" : k === "hero" ? "Heroes" : k === "villain" ? "Villains" : "Your lives"}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-28">
        <div className="grid grid-cols-3 gap-2">
          {pool.map((f) => {
            const gone = used.has(f.id);
            const mine = match.picks[0].includes(f.id);
            return (
              <button key={f.id} type="button" disabled={gone} data-taken={gone} aria-pressed={peek === f.id} onClick={() => setPeek(f.id)} className="arena-card aspect-[3/4] text-left" style={{ "--c": f.color } as React.CSSProperties} aria-label={`${f.name}${gone ? (mine ? ", on your team" : ", taken") : ""}`}>
                <FighterArt f={f} />
                <span className="arena-stripe" />
                <span className="arena-plate">
                  <span className="block truncate font-display text-[0.95rem] leading-none text-fg">{f.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[9.5px] font-extrabold tracking-wide text-muted uppercase">
                    {(() => {
                      const Icon = PASSIVE_ICON[f.passive.kind];
                      return <Icon className="size-3 shrink-0 text-gold" aria-hidden />;
                    })()}
                    <span className="truncate">{f.passive.name}</span>
                  </span>
                </span>
                {f.side === "villain" && !f.custom && <span className="absolute top-1.5 left-2 rounded bg-cape/90 px-1 text-[8px] font-extrabold tracking-wider text-white uppercase">Villain</span>}
                {f.custom && <span className="absolute top-1.5 left-2 rounded bg-gold px-1 text-[8px] font-extrabold tracking-wider text-paper-ink uppercase">Yours</span>}
                {gone && (
                  <span className={`absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full ${mine ? "bg-gold text-paper-ink" : "bg-cape text-white"}`}>
                    {mine ? <Check className="size-4" aria-hidden /> : <Bot className="size-3.5" aria-hidden />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {peeked && (
        <FighterSheet
          f={peeked}
          onClose={() => setPeek(null)}
          action={
            used.has(peeked.id) ? (
              <p className="text-center text-sm font-bold text-muted">{match.picks[0].includes(peeked.id) ? "On your team." : `${rival === "Rival" ? "Your rival" : rival} took them.`}</p>
            ) : (
              <button type="button" disabled={turn !== 0} onClick={() => { if (net) net.onPick(peeked.id); else onMatch(draftPick(match, 0, peeked.id)); setPeek(null); }} className="btn btn-gold min-h-14 w-full text-lg">
                {turn === 0 ? <>Draft {peeked.name}</> : "Wait for your pick…"}
              </button>
            )
          }
        />
      )}
    </main>
  );
}

export function DraftPips({ n, flip = false }: { n: number; flip?: boolean }) {
  return (
    <span className="flex gap-1" aria-label={`Pick ${Math.min(n + 1, 6)} of 6`}>
      {DRAFT_ORDER.map((raw, i) => { const s = flip ? 1 - raw : raw; return (
        <span key={i} className={`h-6 w-3 rounded-sm text-center text-[8px] leading-6 font-extrabold ${i < n ? (s === 0 ? "bg-gold text-paper-ink" : "bg-cape text-white") : i === n ? "animate-pulse bg-white/30 text-fg" : "bg-white/10 text-muted"}`}>
          {s === 0 ? "Y" : "R"}
        </span>
      ); })}
    </span>
  );
}

function TeamRow({ label, picks, active, right = false }: { label: string; picks: string[]; active: boolean; right?: boolean }) {
  return (
    <div className={`card-glass px-2 py-2 ${active ? "arena-lead-ring" : ""}`}>
      <p className={`t-label text-[10px] ${right ? "text-right text-cape" : "text-gold"}`}>{label}</p>
      <div className={`mt-1 flex gap-1.5 ${right ? "flex-row-reverse" : ""}`}>
        {[0, 1, 2].map((i) => {
          const id = picks[i];
          const f = id ? fighterOf(id) : null;
          return (
            <span key={i} className={`relative aspect-square flex-1 overflow-hidden rounded-lg border ${f ? "anim-pop border-white/20" : "border-dashed border-white/15 bg-white/5"}`}>
              {f ? <FighterArt f={f} focus="50% 12%" /> : <span className="t-num grid size-full place-items-center text-xs text-muted">{i + 1}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FighterSheet({ f, onClose, action }: { f: ArenaFighter; onClose: () => void; action: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-label={f.name}>
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close" onClick={onClose} />
      <div className="arena-sheet relative max-h-[78%] overflow-y-auto px-4 pt-3 pb-6" style={{ "--c": f.color } as React.CSSProperties}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
        <div className="flex gap-3">
          <span className="arena-card relative h-32 w-24 shrink-0" style={{ "--c": f.color } as React.CSSProperties}>
            <FighterArt f={f} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="t-label" style={{ color: f.side === "villain" ? "#ff8f87" : "#7fd8ff" }}>{f.custom ? "Your life" : f.side === "villain" ? "Villain" : "Hero"} · {f.title}</p>
            <h2 className="t-display text-fg">{f.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-fg">
              <HeartPulse className="size-4 text-good" aria-hidden /> <span className="t-num">{f.hp}</span> HP
            </p>
            <div className="mt-1.5 rounded-lg bg-white/5 px-2 py-1.5">
              <PassiveTag f={f} compact />
              <p className="mt-0.5 text-xs leading-snug font-semibold text-muted">{f.passive.text}</p>
            </div>
          </div>
        </div>
        <h3 className="t-label mt-3 text-muted">Six moves</h3>
        <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
          {f.moves.map((m) => (
            <li key={keyOf(m)} className="card relative overflow-hidden px-2 py-1.5">
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: HEX[m.style] }} />
              <span className="flex items-center gap-1.5">
                <ElementIcon element={m.element} className="size-3.5 shrink-0" />
                <span className="truncate text-[12px] font-extrabold text-fg">{m.name}</span>
              </span>
              <span className="mt-0.5 flex gap-2 text-[10.5px] font-bold">
                <span style={{ color: HEX[m.style] }}>{STYLE_NAME[m.style]}</span>
                <span className="text-muted">{m.power} pow</span>
                <span className="flex items-center text-gold"><Zap className="size-3" aria-hidden />{m.energy ?? 1}</span>
                {m.kind && <span className="text-muted capitalize">{m.kind}</span>}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}

// ─── Order + reveal ───────────────────────────────────────────────────────────────

export interface OrderNet {
  onLock: (order: string[]) => void;
  /** Your order, once the server has it. */
  locked: string[] | null;
  rivalLocked: boolean;
}

export function Order({ match, onLock, onQuit, net }: { match: ArenaMatch; onLock: (m: ArenaMatch) => void; onQuit: () => void; net?: OrderNet }) {
  const rival = useContext(RivalName);
  const [order, setOrderState] = useState<string[]>(() => net?.locked ?? []);
  const locked = !!net?.locked;
  const mine = match.picks[0];
  function tap(id: string) {
    if (locked) return;
    setOrderState((o) => (o.includes(id) ? o.filter((x) => x !== id) : o.length < 3 ? [...o, id] : o));
  }
  function lock() {
    if (net) {
      net.onLock(order);
      return;
    }
    const ai = aiOrder(match, 1, dice(match.seed, "order"));
    onLock(setOrder(setOrder(match, 0, order), 1, ai));
  }
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <Header title="Fight order" kicker="Secret · both flip at once" onBack={onQuit} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-sm font-semibold text-fg/85">Tap your fighters in the order they'll fight. Your rival is doing the same. Each fights exactly once.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {mine.map((id) => {
            const f = fighterOf(id);
            const at = order.indexOf(id);
            return (
              <button key={id} type="button" aria-pressed={at >= 0} onClick={() => tap(id)} className="arena-card aspect-[3/4]" style={{ "--c": f.color } as React.CSSProperties}>
                <FighterArt f={f} figW="78%" />
                <span className="arena-plate"><span className="block truncate font-display text-[0.95rem] leading-none text-fg">{f.name}</span></span>
                {at >= 0 && <span className="anim-pop absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-gold font-display text-lg text-paper-ink shadow-lg">{at + 1}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2].map((r) => {
            const f = order[r] ? fighterOf(order[r]!) : null;
            return (
              <div key={r} className={`card flex min-h-14 items-center gap-3 px-3 ${f ? "" : "border-dashed opacity-70"}`}>
                <span className="t-label w-16 text-gold">Round {r + 1}</span>
                <span className="min-w-0 flex-1 truncate font-extrabold text-fg">{f ? f.name : "Tap a fighter"}</span>
                {f && <span className="text-xs font-bold text-muted">{f.hp} HP</span>}
              </div>
            );
          })}
        </div>
        <h3 className="t-label mt-5 flex items-center gap-1.5 text-cape">{rival === "Rival" ? "Rival's" : `${rival}'s`} team · order hidden{net && <span className={`ml-auto rounded-full px-2 py-px text-[9px] ${net.rivalLocked ? "bg-cape text-white" : "bg-white/10 text-muted"}`}>{net.rivalLocked ? "Locked" : "Choosing…"}</span>}</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {match.picks[1].map((id) => {
            const f = fighterOf(id);
            return (
              <span key={id} className="arena-card aspect-[4/3]" style={{ "--c": f.color } as React.CSSProperties}>
                <FighterArt f={f} focus="50% 12%" />
                <span className="arena-plate !pt-3"><span className="block truncate text-[11px] font-extrabold text-fg">{f.name}</span></span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 px-4 pt-2 pb-6">
        <button type="button" disabled={order.length < 3 || locked} onClick={lock} className="btn btn-gold min-h-14 w-full text-lg">
          {locked ? <><Check className="size-5" aria-hidden /> Locked · waiting for {rival}</> : <><Lock className="size-5" aria-hidden /> {order.length < 3 ? `Pick ${3 - order.length} more` : "Lock in order"}</>}
        </button>
      </div>
    </main>
  );
}

export function Reveal({ match, onGo, auto }: { match: ArenaMatch; onGo: () => void; auto?: number }) {
  const go = useRef(onGo);
  go.current = onGo;
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => go.current(), auto);
    return () => window.clearTimeout(id);
  }, [auto]);
  const [a, b] = [match.orders[0] ?? [], match.orders[1] ?? []];
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden px-4 pt-6 pb-6">
      <p className="t-label text-center text-gold">Orders revealed</p>
      <h1 className="arena-title mt-1 text-center text-5xl">MATCH-UPS</h1>
      <div className="mt-5 flex flex-1 flex-col justify-center gap-3">
        {[0, 1, 2].map((r) => {
          const fa = fighterOf(a[r]!);
          const fb = fighterOf(b[r]!);
          return (
            <div key={r} className="arena-flip relative flex items-center gap-2" style={{ animationDelay: `${r * 220}ms` }}>
              <span className="arena-card relative h-24 flex-1" style={{ "--c": fa.color } as React.CSSProperties}>
                <FighterArt f={fa} focus="50% 14%" figW="56%" crop="wide" />
                <span className="arena-plate !pt-4"><span className="block truncate font-display text-base leading-none text-fg">{fa.name}</span></span>
              </span>
              <span className="flex w-12 shrink-0 flex-col items-center">
                <span className="t-label text-[9px] text-muted">R{r + 1}</span>
                <span className="arena-vs text-3xl">VS</span>
              </span>
              <span className="arena-card relative h-24 flex-1" style={{ "--c": fb.color } as React.CSSProperties}>
                <FighterArt f={fb} focus="50% 14%" figW="56%" crop="wide" />
                <span className="arena-plate !pt-4 text-right"><span className="block truncate font-display text-base leading-none text-fg">{fb.name}</span></span>
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onGo} className="btn btn-gold mt-4 min-h-14 w-full text-lg">
        <Swords className="size-5" aria-hidden /> To round 1
      </button>
    </main>
  );
}

// ─── Round intro ──────────────────────────────────────────────────────────────────

export function RoundTracker({ match, compact = false }: { match: ArenaMatch; compact?: boolean }) {
  const pip = (side: Side, r: number) => {
    const res = match.results[r];
    if (res === undefined) return r === match.round && match.stage === "bout" ? "now" : "open";
    return res === side ? "win" : "loss";
  };
  return (
    <div className={`flex items-center justify-center ${compact ? "gap-2" : "gap-3"}`}>
      <span className="flex gap-1.5">{[0, 1, 2].map((r) => <span key={r} className="arena-pip" data-r={pip(0, r)} />)}</span>
      <span className={`font-display ${compact ? "text-sm" : "text-lg"} text-fg`}>ROUND {Math.min(match.round + 1, 3)}</span>
      <span className="flex gap-1.5">{[0, 1, 2].map((r) => <span key={r} className="arena-pip" data-r={pip(1, r)} />)}</span>
    </div>
  );
}

export function RoundIntro({ match, onGo }: { match: ArenaMatch; onGo: () => void }) {
  const rival = useContext(RivalName);
  const bout = match.bout!;
  const fa = fighterOf(bout.fighters[0].id);
  const fb = fighterOf(bout.fighters[1].id);
  // A ref, so a parent re-render (the online clock ticks 4×/s) doesn't restart the countdown.
  const go = useRef(onGo);
  go.current = onGo;
  useEffect(() => {
    const id = window.setTimeout(() => go.current(), 2600);
    return () => window.clearTimeout(id);
  }, []);
  const [w0, w1] = roundsWon(match);
  return (
    <button type="button" onClick={onGo} className="arena-root relative flex h-full min-h-0 w-full flex-col overflow-hidden text-left" aria-label="Start the round">
      <div className="arena-split">
        <div className="l"><FighterArt f={fa} focus="50% 14%" figW="92%" figTop="15%" crop="tall" /><span className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent 40%, ${fa.color}33), linear-gradient(0deg, #0c1019 8%, transparent 50%)` }} /></div>
        <div className="r"><FighterArt f={fb} focus="50% 14%" figW="92%" figTop="15%" crop="tall" /><span className="absolute inset-0" style={{ background: `linear-gradient(270deg, transparent 40%, ${fb.color}33), linear-gradient(0deg, #0c1019 8%, transparent 50%)` }} /></div>
        <span className="arena-slash" />
      </div>
      <div className="arena-banner relative mt-8 py-2">
        <RoundTracker match={match} />
        <p className="t-label mt-0.5 text-center text-[10px] text-muted">You {w0} · {w1} {rival}</p>
      </div>
      <div className="relative mt-auto grid grid-cols-[1fr_auto_1fr] items-end gap-1 px-3 pb-10">
        <div className="min-w-0">
          <p className="t-label text-[10px] text-gold">You</p>
          <p className="t-display truncate text-[1.6rem] text-fg drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]">{fa.name}</p>
          <PassiveTag f={fa} compact />
        </div>
        <span className="arena-vs arena-stamp mb-2 text-6xl">VS</span>
        <div className="min-w-0 text-right">
          <p className="t-label truncate text-[10px] text-cape">{rival}</p>
          <p className="t-display truncate text-[1.6rem] text-fg drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]">{fb.name}</p>
          <span className="flex justify-end"><PassiveTag f={fb} compact /></span>
        </div>
      </div>
      <p className="t-label relative pb-5 text-center text-[10px] text-muted">Tap to fight</p>
    </button>
  );
}

// ─── Battle ───────────────────────────────────────────────────────────────────────

interface Shot { key: number; from: Side; element: string }
interface Impact { key: number; on: Side; element: string; amount: number; big: boolean; win: boolean }

const T = { hit1: 240, swap: 560, hit2: 800, rest: 1120 };

export interface BattleNet {
  /** The rival's tell, once they've led this turn and you're answering. */
  tell: Tell | null;
  /** The server is waiting on you this turn. */
  canAct: boolean;
  /** What you're waiting for, when it isn't you. */
  waiting: string | null;
  send: (a: ArenaAction) => void;
  /** Both tap on between rounds. */
  ready: () => void;
  readied: boolean;
}

export function Battle({ match, level, onMatch, onRoundDone, onQuit, net }: { match: ArenaMatch; level: AiLevel; onMatch: (m: ArenaMatch) => void; onRoundDone: (m: ArenaMatch) => void; onQuit: () => void; net?: BattleNet }) {
  const rival = useContext(RivalName);
  const bout = match.bout!;
  const fa = fighterOf(bout.fighters[0].id);
  const fb = fighterOf(bout.fighters[1].id);
  const [shown, setShown] = useState(() => [bout.fighters[0].hp, bout.fighters[1].hp] as [number, number]);
  const [hud, setHud] = useState<BoutState>(bout);
  const [feint, setFeint] = useState<MoveStyle | null>(null);
  const [busy, setBusy] = useState(false);
  const [poses, setPoses] = useState<[Pose, Pose]>(["idle", "idle"]);
  const [shot, setShot] = useState<Shot | null>(null);
  const [lunge, setLunge] = useState<{ key: number; side: Side } | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [quake, setQuake] = useState<number | null>(null);
  const [line, setLine] = useState<string>("");
  const [ko, setKo] = useState<null | "ko" | "time" | "double">(bout.done ? (bout.end ?? "ko") : null);
  const [intro, setIntro] = useState(bout.turn === 0);
  const [quitAsk, setQuitAsk] = useState(false);
  const timers = useRef<number[]>([]);
  const beat = useRef(0);
  const city = useArt(PRESETS.find((p) => p.id === fb.world)?.cityId ?? "");

  useEffect(() => {
    const pending = timers.current;
    const id = window.setTimeout(() => setIntro(false), 900);
    return () => {
      window.clearTimeout(id);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const iLead = hud.leader === 0 && !hud.done;
  const [sent, setSent] = useState(false);
  // Online: the server resolves turns; animate each one as it shows up in the log.
  useEffect(() => {
    if (!net || busy) return;
    const b = match.bout!;
    if (b.log.length <= hud.log.length) return;
    setBusy(true);
    setSent(false);
    animate(b, b.log.at(-1)!);
    if (!b.done) buzz([18]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, match, busy, hud.log.length]);
  useEffect(() => {
    if (net?.canAct) setSent(false);
  }, [net?.canAct, hud.turn]);
  const locked = !!net && (!net.canAct || sent);
  // The rival commits its lead first; you only ever see the tell.
  const aiLeadAction = useMemo<ArenaAction | null>(() => (net || hud.done || hud.leader !== 1 ? null : aiLead(hud, 1, level, dice(match.seed, match.round, hud.turn, "lead"))), [hud, level, match.seed, match.round, net]);
  const rivalTell: Tell | null = net ? (hud.leader === 1 && !hud.done ? net.tell : null) : aiLeadAction ? tellOf(hud, aiLeadAction) : null;
  const answer = rivalTell?.style ? answerOf(rivalTell.style) : null;
  const me = hud.fighters[0];
  const them = hud.fighters[1];

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }
  function attack(from: Side, element: string) {
    const key = ++beat.current;
    const travel = ELEMENTS[elementOf(element)].travel;
    if (travel === "lunge" || travel === "streak") setLunge({ key, side: from });
    if (travel !== "lunge") setShot({ key, from, element });
    setPoses((p) => (from === 0 ? ["attack", p[1]] : [p[0], "attack"]));
  }
  function land(on: Side, element: string, amount: number, big: boolean, win: boolean, guarded: boolean) {
    const key = ++beat.current;
    setImpact({ key, on, element, amount, big, win });
    setShot(null);
    const pose: Pose = amount > 0 ? (guarded ? "guard" : "hit") : "guard";
    setPoses((p) => (on === 0 ? [pose, p[1]] : [p[0], pose]));
    if (big) setQuake(key);
  }

  function play(move: DuelMove) {
    if (busy || hud.done) return;
    const key = move === BREATH ? "breath" : keyOf(move);
    const f = iLead ? feint : null;
    const no = arenaRefusal(me, move, f);
    if (no) {
      setLine(no);
      return;
    }
    const mine: ArenaAction = { move: key, feint: f };
    if (net) {
      if (locked) return;
      setSent(true);
      setFeint(null);
      setLine(iLead ? `Locked in: ${move === BREATH ? "a breath" : move.name}. ${rival} sees your tell.` : `Locked in: ${move === BREATH ? "a breath" : move.name}.`);
      buzz([10]);
      net.send(mine);
      return;
    }
    const theirs: ArenaAction = iLead ? aiFollow(hud, 1, tellOf(hud, mine), level, dice(match.seed, match.round, hud.turn, "follow")) : aiLeadAction!;
    const next = matchTurn(match, [mine, theirs]);
    const b = next.bout!;
    const log = b.log.at(-1)!;
    setBusy(true);
    setFeint(null);
    onMatch(next);
    animate(b, log);
  }

  function animate(b: BoutState, log: TurnLog) {
    const lead = log.leader;
    const follow = (1 - lead) as Side;
    const mv = [moveByKey(fa.id, log.moves[0]), moveByKey(fb.id, log.moves[1])] as const;
    const el = (s: Side) => (mv[s] === BREATH ? "shield" : (mv[s].element ?? "force"));
    const name = (s: Side) => (s === 0 ? fa.name : fb.name);
    const mname = (s: Side) => (mv[s] === BREATH ? (s === 0 ? "your breath" : `${name(s)}'s breath`) : mv[s].name);
    const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    const maxes = [b.fighters[0].maxHp, b.fighters[1].maxHp];
    const parts: string[] = [];
    if (log.tell.feint) parts.push(`${name(lead)} feinted a ${log.tell.style}!`);
    parts.push(cap(log.edge === null ? `${mname(0)} meets ${mname(1)}.` : `${mname(log.edge)} beats ${mname((1 - log.edge) as Side)}.`));
    parts.push(`You deal ${log.dealt[0]}, take ${log.dealt[1] + log.chip[0]}.`);
    if (log.notes.length) parts.push(log.notes.join(". ") + ".");
    setLine(parts.join(" "));
    const step = (s: Side, at: number, hitAt: number) => {
      later(at, () => (mv[s] === BREATH ? setPoses((p) => (s === 0 ? ["guard", p[1]] : [p[0], "guard"])) : attack(s, el(s))));
      later(hitAt, () => {
        const on = (1 - s) as Side;
        const amt = log.dealt[s];
        setShown((h) => {
          const n: [number, number] = [...h];
          n[on] = Math.max(0, n[on] - amt);
          return n;
        });
        land(on, el(s), amt, amt >= maxes[on]! * 0.18, log.edge === s, mv[on] === BREATH || mv[on].kind === "guard");
      });
    };
    step(lead, 0, T.hit1);
    step(follow, T.swap, T.hit2);
    later(T.rest - 120, () => {
      // Settle to the true state (chip, heals, revives).
      setShown([b.fighters[0].hp, b.fighters[1].hp]);
      setHud(b);
    });
    if (b.done) {
      later(T.rest, () => {
        setPoses([b.fighters[0].hp > 0 ? "idle" : "ko", b.fighters[1].hp > 0 ? "idle" : "ko"]);
        setKo(b.end ?? "ko");
        buzz([40, 30, 80]);
      });
      later(T.rest + 200, () => setBusy(false));
    } else
      later(T.rest, () => {
        setPoses(["idle", "idle"]);
        setBusy(false);
      });
  }

  const tellColor = rivalTell?.style ? HEX[rivalTell.style] : "#9aa3b8";
  const TellIcon = rivalTell?.style ? STYLE_ICON[rivalTell.style] : EyeOff;
  const moves = fa.moves;
  const cap = energyCap(fa.id);
  const roundOver = ko !== null;
  const won = hud.winner === 0;

  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col gap-2 overflow-hidden px-3 pt-2 pb-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button type="button" onClick={() => setQuitAsk(true)} className="btn btn-ghost !min-h-9 !w-9 !p-0" aria-label="Leave match"><ArrowLeft className="size-4" aria-hidden /></button>
        <RoundTracker match={match} compact />
        <span className="t-num w-9 text-right text-[11px] font-bold text-muted">T{hud.turn + 1}</span>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <HpCard f={fa} hp={shown[0]} max={me.maxHp} lead={hud.leader === 0 && !hud.done} hot={impact?.on === 0 ? impact.key : 0} extra={me} />
        <HpCard f={fb} hp={shown[1]} max={them.maxHp} lead={hud.leader === 1 && !hud.done} hot={impact?.on === 1 ? impact.key : 0} extra={them} right />
      </div>

      <div key={quake ?? "still"} className={`scene-arena relative min-h-[176px] max-h-[300px] flex-1 overflow-hidden rounded-[1.25rem] border border-white/10 ${quake ? "fx-quake" : ""}`}>
        {city && <img src={city} alt="" className="absolute inset-0 size-full object-cover opacity-30 saturate-[.6]" />}
        <div className="absolute inset-0" style={{ background: `radial-gradient(45% 55% at 22% 92%, color-mix(in srgb, ${fa.color} 38%, transparent), transparent 70%), radial-gradient(45% 55% at 78% 92%, color-mix(in srgb, ${fb.color} 38%, transparent), transparent 70%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        <DuelCard f={fa} side={0} lunging={lunge?.side === 0 ? lunge.key : 0} pose={poses[0]} hitKey={impact?.on === 0 && impact.amount > 0 ? impact.key : 0} />
        <DuelCard f={fb} side={1} lunging={lunge?.side === 1 ? lunge.key : 0} pose={poses[1]} hitKey={impact?.on === 1 && impact.amount > 0 ? impact.key : 0} />
        {shot && <Projectile key={shot.key} element={shot.element} reverse={shot.from === 1} seed={shot.key} />}
        {impact && (
          <span key={impact.key} className={`pointer-events-none absolute top-[12%] h-[62%] w-[34%] ${impact.on === 1 ? "right-[4%]" : "left-[4%]"}`}>
            {impact.amount > 0 && <ElementBurst element={impact.element} size={impact.big ? 96 : 76} seed={impact.key} big={impact.big} />}
            <FloatNumber text={impact.amount > 0 ? `−${impact.amount}` : "Blocked"} color={impact.on === 1 ? (impact.win ? "#ffe08a" : "#ffffff") : "#ff8f87"} className={`-top-2 left-1/2 -translate-x-1/2 ${impact.amount > 0 ? "" : "!text-lg"}`} />
          </span>
        )}
        {!roundOver && !busy && (
          <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2">
            {iLead ? (
              <span className="arena-tell anim-pop flex items-center gap-1.5 whitespace-nowrap" style={{ "--tc": "#e6b34d" } as React.CSSProperties}>
                <Crown className="size-3.5 text-gold" aria-hidden /> Your lead
              </span>
            ) : rivalTell ? (
              <span key={hud.turn} className="arena-tell anim-pop flex items-center gap-1.5 whitespace-nowrap" style={{ "--tc": rivalTell.charged ? "#ff3b30" : tellColor } as React.CSSProperties}>
                <TellIcon className="size-3.5" style={{ color: tellColor }} aria-hidden />
                {rivalTell.style ? `${fb.name} shows ${STYLE_NAME[rivalTell.style]}` : `${fb.name} hides the tell`}
                {rivalTell.charged && <Siren className="size-3.5 text-cape" aria-hidden />}
              </span>
            ) : null}
          </div>
        )}
        {intro && (
          <div className="ko-in pointer-events-none absolute inset-0 grid place-items-center">
            <span className="arena-vs text-5xl">FIGHT!</span>
          </div>
        )}
        {quake && <span key={`f${quake}`} className="fx-flash pointer-events-none absolute inset-0" style={{ background: "#fff", opacity: 0 }} />}
      </div>

      <div className="card-paper shrink-0 px-3 py-2">
        <p className="text-sm font-bold">
          {roundOver ? (won ? `${fa.name} takes the round.` : `${fb.name} takes the round.`) : net && !busy && net.waiting && !(iLead && !sent && net.canAct) ? (
            <span className="flex items-center gap-2"><span className="arena-wait-dot" aria-hidden />{net.waiting}</span>
          ) : iLead ? (
            <>You lead. <span className="font-semibold opacity-70">{fb.name} sees your tell{fb.passive.kind !== "sense" ? feint ? " — and it's a lie" : "" : ", and Spider-Sense sees through feints"}.</span></>
          ) : rivalTell?.style ? (
            <>{rivalTell.charged ? "A charged hit is coming. " : ""}They show {STYLE_NAME[rivalTell.style].toLowerCase()}. <span className="font-semibold opacity-70">{STYLE_NAME[answer!]} beats it{hud.feints[1] ? ` — they've feinted ${hud.feints[1]}×` : ""}.</span></>
          ) : (
            <>You can't read them. <span className="font-semibold opacity-70">Pick your best odds.</span></>
          )}
        </p>
        <p role="status" className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs font-semibold opacity-80">{line || `${fa.passive.name}: ${fa.passive.text}`}</p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="t-label flex items-center gap-1 text-muted"><Zap className="size-3.5 text-gold" aria-hidden /> <span className="t-num text-fg">{me.energy}/{cap}</span></p>
        {iLead && fb.passive.kind !== "sense" ? (
          <div role="radiogroup" aria-label="Your tell" className="flex items-center gap-1">
            <span className="t-label text-[9px] text-muted">Tell</span>
            {([null, ...STYLES] as (MoveStyle | null)[]).map((s) => (
              <button key={s ?? "true"} type="button" role="radio" aria-checked={feint === s} disabled={busy} onClick={() => setFeint(s)} className={`flex h-8 items-center gap-1 rounded-full border px-2 text-[11px] font-extrabold ${feint === s ? "border-gold bg-gold/20 text-gold" : "border-white/15 text-muted"}`}>
                {s === null ? "True" : (() => { const I = STYLE_ICON[s]; return <><I className="size-3" style={{ color: HEX[s] }} aria-hidden />Fake</>; })()}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: cap }, (_, i) => <span key={i} className={`h-2.5 w-2.5 rotate-45 rounded-[3px] ${i < me.energy ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : "bg-panel-2"}`} />)}
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto">
        {moves.map((m) => {
          const cool = me.cool[keyOf(m)] ?? 0;
          const extra = iLead ? feintCost(fa.id, feint, m) : 0;
          const cost = (m.energy ?? 1) + extra;
          const blocked = cool > 0 || me.energy < cost;
          const isAnswer = !iLead && !!answer && m.style === answer;
          const fakeSame = iLead && feint === m.style;
          return (
            <button key={keyOf(m)} type="button" aria-disabled={blocked || busy || roundOver || locked} onClick={() => play(m)} className={`card relative flex min-h-[4.25rem] flex-col gap-0.5 overflow-hidden px-2.5 py-1.5 text-left ${isAnswer && !blocked && !locked ? "!border-gold/80 shadow-[0_0_16px_-6px_var(--color-gold)]" : ""} ${blocked || locked ? "opacity-50" : ""}`}>
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: HEX[m.style] }} />
              {cool > 0 && <span className="absolute inset-0 bg-ink/55" style={{ clipPath: `inset(${100 - Math.min(100, cool * 50)}% 0 0 0)` }} />}
              <span className="relative flex items-center gap-1.5">
                <ElementIcon element={m.element} className="size-4 shrink-0" />
                <span className="line-clamp-1 min-w-0 text-[13px] leading-tight font-extrabold text-fg">{m.name}</span>
              </span>
              <span className="relative flex flex-wrap items-center gap-x-2 text-[11px] font-bold">
                <span className="flex items-center gap-0.5" style={{ color: HEX[m.style] }}>{(() => { const I = STYLE_ICON[m.style]; return <I className="size-3" aria-hidden />; })()}{STYLE_NAME[m.style]}</span>
                <span className="text-muted">{m.power}</span>
                <span className={`flex items-center ${me.energy < cost ? "text-cape" : "text-gold"}`}><Zap className="size-3" aria-hidden />{cost}</span>
                {m.kind && <span className="text-muted capitalize">{m.kind}</span>}
                {isAnswer && !blocked && <span className="t-label rounded-full bg-gold px-1.5 py-px text-[8px] text-paper-ink">Answer</span>}
              </span>
              <span className="relative text-[10.5px] leading-snug text-muted">{cool > 0 ? `Cooling · ${cool}t` : me.energy < cost ? "Not enough energy" : fakeSame ? "Fake = same style (no bluff)" : m.blurb}</span>
            </button>
          );
        })}
      </div>
      <button type="button" disabled={busy || roundOver || locked} onClick={() => play(BREATH)} className={`btn btn-ghost min-h-11 shrink-0 text-sm ${answer === "guard" ? "!border-gold/70" : ""}`}>
        <RotateCcw className="size-4" aria-hidden /> Catch a breath · +3 energy{answer === "guard" ? " · counters" : ""}
      </button>

      {roundOver && <RoundOver match={match} ko={ko!} net={net} onNext={() => (net ? net.ready() : onRoundDone(nextRound(match)))} onSkip={() => (net ? net.ready() : onRoundDone(finish(nextRound(match))))} />}
      {quitAsk && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 px-6" role="dialog" aria-label="Leave the match?">
          <div className="card-glass w-full px-4 py-4 text-center">
            <p className="t-display text-fg">Leave the match?</p>
            <p className="mt-1 text-sm font-semibold text-muted">It counts as a forfeit{net ? ` and ${rival} wins` : ""}.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-ghost min-h-12 flex-1" onClick={() => setQuitAsk(false)}>Keep fighting</button>
              <button type="button" className="btn btn-primary min-h-12 flex-1" onClick={onQuit}>Forfeit</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function HpCard({ f, hp, max, lead, hot, extra, right = false }: { f: ArenaFighter; hp: number; max: number; lead: boolean; hot: number; extra: BoutState["fighters"][number]; right?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  const Icon = PASSIVE_ICON[f.passive.kind];
  const badges: string[] = [];
  if (extra.plates > 0) badges.push(`${extra.plates} plate${extra.plates > 1 ? "s" : ""}`);
  if (extra.swarmed > 0) badges.push(`−${extra.swarmed}/turn`);
  if (extra.stored > 0) badges.push(`+${extra.stored} stored`);
  if (extra.slow < 1) badges.push("slowed");
  if (f.passive.kind === "revive" && !extra.revived) badges.push("backup body");
  return (
    <div className={`card-glass flex min-w-0 items-center gap-2 px-2 py-1.5 ${right ? "flex-row-reverse text-right" : ""} ${lead ? "arena-lead-ring" : ""}`}>
      <span className="arena-card relative size-11 shrink-0 !rounded-lg" style={{ "--c": f.color } as React.CSSProperties}><FighterArt f={f} focus="50% 10%" /></span>
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1 truncate text-[12px] font-extrabold text-fg ${right ? "flex-row-reverse" : ""}`}>
          {lead && <Crown className="size-3 shrink-0 text-gold" aria-label="Leading" />}
          <span className="truncate">{f.name}</span>
        </p>
        <div className="stat-bar mt-1 !h-3" style={{ transform: right ? "scaleX(-1)" : undefined }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] delay-300 duration-700" style={{ width: `${pct}%` }} />
          <div key={hot || "still"} className={`stat-fill ${hot ? "hp-flash" : ""}`} style={{ width: `${pct}%`, "--fill": pct < 25 ? "#ff3b30" : f.color === "#2b2d3a" || f.color === "#1f3a2a" || f.color === "#2a2a3a" ? "#9aa4b8" : f.color } as React.CSSProperties} />
        </div>
        <p className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold text-muted ${right ? "flex-row-reverse" : ""}`}>
          <span className="t-num text-fg">{hp}</span>
          <Icon className="size-3 shrink-0" aria-label={f.passive.name} />
          <span className="truncate">{badges[0] ?? f.passive.name}</span>
        </p>
      </div>
    </div>
  );
}

/** A backdrop glow that reads against the fighter: very dark suits (Venom, Batman) get a villain red or hero gold. */
function accentOf(f: ArenaFighter): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(f.color)?.[1];
  if (!hex) return f.side === "villain" ? "#d4382f" : "#e6b34d";
  const n = parseInt(hex, 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.28 ? (f.side === "villain" ? "#d4382f" : "#e6b34d") : f.color;
}

/**
 * A fighter on the battle stage as a living card: the legend's painted art, or (villains and saved lives)
 * their figure over their world's skyline. The card lunges on attack, shakes and flashes red on a hit,
 * raises a shield shimmer on a guard and greys out on a K.O. Painted art is never mirrored.
 */
function DuelCard({ f, side, lunging, pose, hitKey }: { f: ArenaFighter; side: Side; lunging: number; pose: Pose; hitKey: number }) {
  const me = side === 0;
  const art = useArt(f.art ?? "");
  const city = useArt(PRESETS.find((p) => p.id === f.world)?.cityId ?? "");
  const painted = !!(f.art && art);
  return (
    <div key={lunging || "rest"} className={`duel-slot absolute top-[7%] bottom-[5%] w-[36%] ${me ? "left-[5%]" : "right-[5%]"} ${lunging ? "fx-lunge" : ""}`} style={{ "--lunge": me ? "64px" : "-64px" } as React.CSSProperties}>
      <div className={`h-full w-full ${pose === "idle" || pose === "stand" ? "anim-float" : ""}`}>
      <div className="duel-card" data-pose={pose} data-side={side} style={{ "--c": f.color } as React.CSSProperties}>
        {painted ? (
          <img src={art} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 14%" }} />
        ) : !f.custom && hasVillainArt(f.id) ? (
          <VillainArt id={f.id} color={f.color} />
        ) : (
          <>
            {city && !f.custom && <img src={city} alt="" className="absolute inset-0 size-full object-cover opacity-55 saturate-[.7]" />}
            <span className="absolute inset-0" style={{ background: `radial-gradient(75% 55% at 50% 36%, ${accentOf(f)}cc, ${accentOf(f)}33 58%, transparent 82%), linear-gradient(180deg, #0c101922, #0c1019 97%)` }} />
            {/* Figures are front-facing, so they are never mirrored: Chrome blacks out the
                SVG's volume filter under a scaleX(-1) parent. */}
            <span className="absolute left-1/2 aspect-[240/490] w-[76%] top-[15%]" style={{ transform: "translateX(-50%)", filter: `drop-shadow(0 0 1px rgb(255 255 255 / .7)) drop-shadow(0 0 10px ${accentOf(f)})` }}>
              <FighterFigure f={f} pose={pose === "idle" ? "stand" : pose} />
            </span>
          </>
        )}
        <span className="duel-shine" aria-hidden />
        <span className="duel-plate">
          <span className="block truncate font-display text-[13px] leading-none tracking-wide text-white">{f.name}</span>
        </span>
        {hitKey > 0 && <span key={hitKey} className="duel-hurt" aria-hidden />}
        {pose === "guard" && <span className="duel-shield" aria-hidden />}
      </div>
      </div>
    </div>
  );
}

function RoundOver({ match, ko, onNext, onSkip, net }: { match: ArenaMatch; ko: "ko" | "time" | "double"; onNext: () => void; onSkip: () => void; net?: BattleNet }) {
  const rival = useContext(RivalName);
  const b = match.bout!;
  const won = b.winner === 0;
  const after = [...match.results, b.winner];
  const w0 = after.filter((r) => r === 0).length;
  const w1 = after.filter((r) => r === 1).length;
  const last = after.length >= 3;
  const decided = !last && (w0 >= 2 || w1 >= 2);
  const fa = fighterOf(b.fighters[0].id);
  const fb = fighterOf(b.fighters[1].id);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/65 px-5" role="dialog" aria-label="Round over">
      <span className="ko-rays pointer-events-none absolute top-1/3 left-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 opacity-30" style={{ background: `conic-gradient(from 0deg, transparent, ${won ? "#e6b34d" : "#ef5d52"}, transparent 10%, transparent 25%, ${won ? "#e6b34d" : "#ef5d52"}, transparent 35%, transparent 50%, ${won ? "#e6b34d" : "#ef5d52"}, transparent 60%, transparent 75%, ${won ? "#e6b34d" : "#ef5d52"}, transparent 85%)` }} />
      <span className="ko-in arena-vs relative text-7xl">{ko === "time" ? "TIME!" : "K.O.!"}</span>
      <div className="card-glass anim-rise relative mt-5 w-full px-4 py-4 text-center">
        <p className={`t-label ${won ? "text-gold" : "text-cape"}`}>Round {match.round + 1} · {won ? "You win it" : `${rival} wins it`}</p>
        <p className="t-display mt-1 text-fg">{won ? fa.name : fb.name}</p>
        <p className="mt-1 text-sm font-semibold text-muted">
          {ko === "time" ? "Turn limit: the healthier fighter takes it." : ko === "double" ? "Both went down. The bigger last hit wins." : `${won ? fb.name : fa.name} is down in ${b.turn} turns.`}
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="font-display text-4xl text-gold">{w0}</span>
          <span className="t-label max-w-[9rem] truncate text-muted">You · {rival}</span>
          <span className="font-display text-4xl text-cape">{w1}</span>
        </div>
        <button type="button" disabled={net?.readied} onClick={decided ? onSkip : onNext} className="btn btn-gold mt-4 min-h-14 w-full text-lg" autoFocus>
          {net?.readied ? <><span className="arena-wait-dot" aria-hidden /> Waiting for {rival}…</> : last || decided ? <><Trophy className="size-5" aria-hidden /> See the result</> : <>Round {match.round + 2} <Swords className="size-5" aria-hidden /></>}
        </button>
        {net && !net.readied && <p className="mt-2 text-[11px] font-bold text-muted">Both tap on. Auto in 20 s.</p>}
        {decided && !net && (
          <button type="button" onClick={onNext} className="btn btn-ghost mt-2 min-h-11 w-full text-sm">
            Play round 3 anyway
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────────

export function Results({ match, onRematch, onHub, onTitle, note, footer }: { match: ArenaMatch; onRematch: () => void; onHub: () => void; onTitle: () => void; note?: React.ReactNode; footer?: React.ReactNode }) {
  const won = match.winner === 0;
  const played = !!match.orders[0] && !!match.orders[1];
  const [w0, w1] = roundsWon(match);
  const color = won ? "#e6b34d" : "#ef5d52";
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <span className="ko-rays pointer-events-none absolute top-[18%] left-1/2 size-[170%] -translate-x-1/2 -translate-y-1/2 opacity-25" style={{ background: `conic-gradient(from 0deg, transparent, ${color}, transparent 8%, transparent 25%, ${color}, transparent 33%, transparent 50%, ${color}, transparent 58%, transparent 75%, ${color}, transparent 83%)` }} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-4">
        <p className="t-label text-center" style={{ color }}>{won ? "Match won" : "Match lost"}</p>
        <h1 className="arena-title ko-in mt-1 text-center text-[4.2rem]" style={won ? undefined : { background: "linear-gradient(180deg,#ffd9d6,#ef5d52 55%,#8a1f18)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>{won ? "VICTORY" : "DEFEAT"}</h1>
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="font-display text-5xl text-gold">{w0}</span>
          <span className="arena-vs text-2xl">–</span>
          <span className="font-display text-5xl text-cape">{w1}</span>
        </div>
        {note}
        <ol className="mt-5 flex flex-col gap-2">
          {(played ? [0, 1, 2] : []).map((r) => {
            const a = fighterOf(match.orders[0]![r]!);
            const b = fighterOf(match.orders[1]![r]!);
            const res = match.results[r];
            const m = match.margins[r];
            return (
              <li key={r} className="anim-rise card-glass flex items-center gap-2 px-2 py-2" style={{ animationDelay: `${r * 120}ms` }}>
                <span className="t-label w-7 text-center text-[10px] text-muted">R{r + 1}</span>
                <span className={`arena-card relative size-12 shrink-0 !rounded-lg ${res === 0 ? "" : "grayscale-[.7]"}`} style={{ "--c": a.color } as React.CSSProperties}><FighterArt f={a} focus="50% 10%" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-fg">{a.name} <span className="text-muted">vs</span> {b.name}</span>
                  <span className="block text-[11px] font-bold text-muted">{res === undefined ? (note ? "Not played" : "Not played — match decided") : m ? `${Math.round(m[0] * 100)}% HP left vs ${Math.round(m[1] * 100)}%` : ""}</span>
                </span>
                <span className={`arena-card relative size-12 shrink-0 !rounded-lg ${res === 1 ? "" : "grayscale-[.7]"}`} style={{ "--c": b.color } as React.CSSProperties}><FighterArt f={b} focus="50% 10%" /></span>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-sm ${res === 0 ? "bg-gold text-paper-ink" : res === 1 ? "bg-cape text-white" : "bg-white/10 text-muted"}`}>{res === 0 ? "W" : res === 1 ? "L" : "–"}</span>
              </li>
            );
          })}
        </ol>
        <MvpCard match={match} />
      </div>
      {footer ?? <div className="relative flex shrink-0 flex-col gap-2 px-4 pt-2 pb-6">
        <button type="button" onClick={onRematch} className="btn btn-gold min-h-14 w-full text-lg"><Swords className="size-5" aria-hidden /> New match</button>
        <div className="flex gap-2">
          <button type="button" onClick={onHub} className="btn btn-ghost min-h-12 flex-1"><Users className="size-4" aria-hidden /> Arena</button>
          <button type="button" onClick={onTitle} className="btn btn-ghost min-h-12 flex-1">Title</button>
        </div>
      </div>}
    </main>
  );
}

/** Your best fighter: the round winner who kept the most HP. */
function MvpCard({ match }: { match: ArenaMatch }) {
  let best = -1;
  let score = -1;
  match.results.forEach((r, i) => {
    const m = match.margins[i];
    if (r === 0 && m && m[0] > score) {
      score = m[0];
      best = i;
    }
  });
  if (best < 0 || !match.orders[0]) return null;
  const f = fighterOf(match.orders[0][best]!);
  return (
    <section className="anim-rise card-glass mt-3 flex items-center gap-3 overflow-hidden px-3 py-3" style={{ animationDelay: "400ms" }}>
      <span className="arena-card relative h-20 w-16 shrink-0" style={{ "--c": f.color } as React.CSSProperties}><FighterArt f={f} /></span>
      <div className="min-w-0">
        <p className="t-label flex items-center gap-1 text-gold"><Medal className="size-3.5" aria-hidden /> MVP</p>
        <p className="t-display truncate text-fg">{f.name}</p>
        <p className="text-xs font-semibold text-muted">Won round {best + 1} with {Math.round(score * 100)}% HP left.</p>
      </div>
    </section>
  );
}


