import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Crown, RotateCcw, Shield, Skull, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { Figure, type Pose } from "@/components/game/Figure";
import { kitFor } from "@/components/game/duelKit";
import { ElementBurst, ElementIcon, elementOf, FloatNumber, Projectile } from "@/components/game/Vfx";
import { ELEMENTS, elementOfLegacy } from "@/game/elements";
import { money } from "@/game/format";
import type { DuelMove, Effects, Look, MinigameSpec, MoveStyle, Sex, Wardrobe } from "@/game/types";

/** The player's look, so the duel draws the same hero as the closet. */
export interface DuelHero {
  seed: number;
  age: number;
  sex?: Sex;
  look?: Partial<Look> | null;
  wardrobe?: Wardrobe;
  aura?: string;
}

const HEX: Record<MoveStyle, string> = { strike: "#ff5a4f", guard: "#3fe0c5", trick: "#ffcf4d" };
const STYLE_ICON: Record<MoveStyle, typeof Swords> = { strike: Swords, guard: Shield, trick: Sparkles };
const STYLE: Record<MoveStyle, string> = { strike: "Strike", guard: "Guard", trick: "Trick" };

const TELL: Record<MoveStyle, string> = {
  strike: "They coil for a strike.",
  guard: "They plant to guard.",
  trick: "They look for a trick.",
};

const BEAT: Record<MoveStyle, string> = {
  strike: "Guard beats a strike.",
  guard: "Trick beats a guard.",
  trick: "Strike beats a trick.",
};

/** What the move does in plain numbers. The flavour line goes to the fight log instead. */
function mechanicLine(move: DuelMove): string {
  const p = `${move.power} power`;
  switch (move.kind) {
    case "burst":
      return `Single hit, ${p}.`;
    case "area":
      return `Hits wide: ${p}, +12%.`;
    case "status":
      return `${p}. Slows their next hit 25%.`;
    case "guard":
      return `${p}. Cuts damage taken 20%.`;
    case "dash":
      return `${p}. +15% if it beats their move.`;
    default:
      return `${p}.`;
  }
}

function beats(a: MoveStyle, b: MoveStyle): boolean {
  return (a === "strike" && b === "trick") || (a === "trick" && b === "guard") || (a === "guard" && b === "strike");
}

function answerOf(style: MoveStyle): MoveStyle {
  if (style === "strike") return "guard";
  if (style === "guard") return "trick";
  return "strike";
}

function damage(move: DuelMove, other: DuelMove): number {
  let mod = beats(move.style, other.style) ? 1.55 : beats(other.style, move.style) ? 0.68 : 1;
  if (move.kind === "area") mod *= 1.12;
  if (move.kind === "dash" && beats(move.style, other.style)) mod *= 1.15;
  const jitter = 0.86 + Math.random() * 0.28;
  return Math.max(1, Math.round(move.power * mod * jitter));
}

function keyOf(move: DuelMove): string {
  return move.id ?? move.name;
}

function tick(cool: Record<string, number>, except?: string, setTo?: number): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cool)) {
    const left = value - 1;
    if (left > 0 && key !== except) next[key] = left;
  }
  if (except && setTo && setTo > 0) next[except] = setTo;
  return next;
}

function pickFrom(pool: readonly DuelMove[], hated: MoveStyle | null): DuelMove {
  const fallback: DuelMove = { name: "Shove", blurb: "", power: 3, style: "strike" };
  if (!pool.length) return fallback;
  if (hated && Math.random() < 0.42) {
    const answer = pool.filter((move) => beats(move.style, hated));
    if (answer.length) return answer[Math.floor(Math.random() * answer.length)] ?? pool[0]!;
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

function hashName(name: string): number {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h || 1;
}

type Edge = "you" | "them" | "even";
type Side = "me" | "foe";
interface Shot { key: number; from: Side; element: string; }
interface Impact { key: number; on: Side; element: string; amount: number; big: boolean; crit: boolean }
interface Result { ratio: number; dealt: number; taken: number; turns: number; best: { name: string; dealt: number } | null }

const T = { hit1: 230, swap: 520, hit2: 760, rest: 1040 };

export function Duel({ spec, onDone, hero }: { spec: MinigameSpec; onDone: (ratio: number, used?: string[]) => void; hero?: DuelHero }) {
  const board = spec.duel;
  const intent = useRef<DuelMove | null>(null);
  if (board && intent.current === null) intent.current = pickFrom(board.foeMoves, null);
  const opening = intent.current?.style ?? "strike";
  const [playerHp, setPlayerHp] = useState(board?.playerHp ?? 1);
  const [foeHp, setFoeHp] = useState(board?.foeHp ?? 1);
  const [energy, setEnergy] = useState(10);
  const [cool, setCool] = useState<Record<string, number>>({});
  const [slow, setSlow] = useState(1);
  const [log, setLog] = useState("Read their tell, then answer it.");
  const [last, setLast] = useState<string | null>(null);
  const [tell, setTell] = useState<MoveStyle>(opening);
  const [edge, setEdge] = useState<{ key: number; edge: Edge } | null>(null);
  const [mePose, setMePose] = useState<Pose>("idle");
  const [foePose, setFoePose] = useState<Pose>("idle");
  const [shot, setShot] = useState<Shot | null>(null);
  const [lunge, setLunge] = useState<{ key: number; side: Side } | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [quake, setQuake] = useState<{ key: number; color: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const done = useRef(false);
  const swinging = useRef(false);
  const used = useRef<string[]>([]);
  const lastStyle = useRef<MoveStyle | null>(null);
  const beat = useRef(0);
  const timers = useRef<number[]>([]);
  const stats = useRef({ dealt: 0, taken: 0, turns: 0, best: null as { name: string; dealt: number } | null });

  useEffect(() => {
    const id = window.setTimeout(() => setIntro(false), 900);
    const pending = timers.current;
    return () => {
      window.clearTimeout(id);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (!board) return null;
  const fight = board;
  const maxP = fight.playerHp;
  const maxF = fight.foeHp;
  const answer = answerOf(tell);
  const kit = kitFor(fight.foePower, fight.foeSide);
  const foeElement = elementOfLegacy(fight.foePower);
  const foeColor = ELEMENTS[foeElement].color;
  const heroAura = hero?.aura ?? "#ffcf4d";
  const foeSeed = fight.foeSeed ?? hashName(fight.foeName);

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function commit(style: MoveStyle) {
    const next = pickFrom(fight.foeMoves, style);
    intent.current = next;
    return next.style;
  }

  function travelOf(element: string) {
    return ELEMENTS[elementOf(element)].travel;
  }

  function attack(from: Side, element: string) {
    const key = ++beat.current;
    const travel = travelOf(element);
    if (travel === "lunge" || travel === "streak") setLunge({ key, side: from });
    if (travel !== "lunge") setShot({ key, from, element });
    (from === "me" ? setMePose : setFoePose)("attack");
  }

  function land(on: Side, element: string, amount: number, big: boolean, crit: boolean, guarded: boolean) {
    const key = ++beat.current;
    setImpact({ key, on, element, amount, big, crit });
    setShot(null);
    (on === "me" ? setMePose : setFoePose)(amount > 0 ? (guarded ? "guard" : "hit") : "guard");
    if (big) setQuake({ key, color: on === "foe" ? "#ffffff" : "#ff3b30" });
  }

  function end(nextFoe: number, nextPlayer: number, ms: number) {
    if (nextFoe > 0 && nextPlayer > 0) {
      later(ms, () => {
        setMePose("idle");
        setFoePose("idle");
        swinging.current = false;
        setBusy(false);
      });
      return;
    }
    done.current = true;
    const ratio = nextFoe <= 0 && nextPlayer <= 0 ? 0.5 : nextFoe <= 0 ? 1 : 0;
    later(ms - 200, () => {
      if (nextFoe <= 0) setFoePose("ko");
      if (nextPlayer <= 0) setMePose("ko");
      if (nextFoe <= 0 && nextPlayer > 0) setMePose("idle");
      if (nextPlayer <= 0 && nextFoe > 0) setFoePose("idle");
    });
    later(ms + 650, () => setResult({ ratio, ...stats.current }));
  }

  function swing(move: DuelMove) {
    if (swinging.current || done.current) return;
    const cost = move.energy ?? 1;
    const key = keyOf(move);
    const left = cool[key] ?? 0;
    if (left > 0) {
      setLog(`${move.name} is still cooling: ${left} turn${left === 1 ? "" : "s"}.`);
      return;
    }
    if (energy < cost) {
      setLog(`${move.name} needs ${cost} energy. You have ${energy}. Catch a breath.`);
      return;
    }
    const foeMove = intent.current ?? pickFrom(fight.foeMoves, lastStyle.current);
    if (move.id) used.current.push(move.id);
    lastStyle.current = move.style;
    swinging.current = true;
    setBusy(true);
    const dealt = damage(move, foeMove);
    const nextFoe = Math.max(0, foeHp - dealt);
    let taken = Math.round(damage(foeMove, move) * slow * (1 - Math.min(0.4, (fight.guard ?? 0) / 100)));
    if (move.kind === "guard") taken = Math.round(taken * 0.8);
    // A knockout lands first: there is no counter from the floor.
    if (nextFoe <= 0) taken = 0;
    const nextPlayer = Math.max(0, playerHp - taken);
    const won: Edge = beats(move.style, foeMove.style) ? "you" : beats(foeMove.style, move.style) ? "them" : "even";
    const nextTell = commit(move.style);
    const s = stats.current;
    s.turns += 1;
    s.dealt += dealt;
    s.taken += taken;
    if (!s.best || dealt > s.best.dealt) s.best = { name: move.name, dealt };
    setEnergy(Math.min(10, energy - cost + 3));
    setCool(tick(cool, key, move.cooldown ?? 0));
    setSlow(move.kind === "status" ? 0.75 : 1);
    setLast(key);
    setEdge({ key: ++beat.current, edge: won });
    const myElement = move.element ?? "force";
    const theirElement = foeMove.element ?? foeElement;
    const bigOut = dealt >= Math.max(10, maxF * 0.2) || nextFoe <= 0;
    const bigIn = taken >= Math.max(10, maxP * 0.2) || nextPlayer <= 0;
    const flavor = move.effect ? ` ${move.effect}` : "";
    const line =
      won === "you"
        ? `${move.name} beats ${foeMove.name}.${flavor} ${dealt} out${taken ? `, ${taken} back` : ""}.`
        : won === "them"
          ? `${foeMove.name} had the angle on ${move.name}. ${taken} in, ${dealt} out.`
          : `${move.name} meets ${foeMove.name}. You trade ${dealt} for ${taken}.`;
    setLog(nextFoe <= 0 ? `${move.name} puts ${fight.foeName} down.${flavor}` : line);

    attack("me", myElement);
    later(T.hit1, () => {
      setFoeHp(nextFoe);
      land("foe", myElement, dealt, bigOut, won === "you", false);
    });
    if (nextFoe > 0) {
      later(T.swap, () => {
        setMePose(move.style === "guard" ? "guard" : "idle");
        attack("foe", theirElement);
      });
      later(T.hit2, () => {
        setPlayerHp(nextPlayer);
        land("me", theirElement, taken, bigIn, won === "them", move.kind === "guard" || move.style === "guard");
        setTell(nextTell);
      });
      end(nextFoe, nextPlayer, T.rest);
    } else {
      end(nextFoe, nextPlayer, T.swap + 200);
    }
  }

  function recover() {
    if (swinging.current || done.current) return;
    const foeMove = intent.current ?? pickFrom(fight.foeMoves, lastStyle.current);
    lastStyle.current = "guard";
    swinging.current = true;
    setBusy(true);
    const taken = Math.max(1, Math.round(damage(foeMove, { name: "Breath", blurb: "", power: 3, style: "guard", kind: "guard" }) * 0.8 * slow * (1 - Math.min(0.4, (fight.guard ?? 0) / 100))));
    const nextPlayer = Math.max(0, playerHp - taken);
    const nextTell = commit("guard");
    stats.current.turns += 1;
    stats.current.taken += taken;
    setEnergy(Math.min(10, energy + 3));
    setCool(tick(cool));
    setSlow(1);
    setLast("breath");
    setEdge({ key: ++beat.current, edge: "them" });
    setMePose("guard");
    const theirElement = foeMove.element ?? foeElement;
    setLog(`You catch a breath. ${fight.foeName} still lands ${foeMove.name} for ${taken}.`);
    later(120, () => attack("foe", theirElement));
    later(360, () => {
      setPlayerHp(nextPlayer);
      land("me", theirElement, taken, nextPlayer <= 0, false, true);
      setTell(nextTell);
    });
    end(foeHp, nextPlayer, 700);
  }

  const heroFigure = (
    <Figure
      seed={hero?.seed ?? 11}
      age={Math.max(16, hero?.age ?? 24)}
      sex={hero?.sex}
      look={hero?.look}
      wardrobe={hero?.wardrobe}
      aura={heroAura}
      bare
      pose={mePose}
      label="You"
    />
  );
  const foeFigure = (
    <Figure seed={foeSeed} age={34} sex={fight.foeSex} tint={kit} aura={foeColor} bare pose={foePose} mood={fight.foeSide === "villain" ? 30 : 70} label={fight.foeName} />
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden px-4 pt-3 pb-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-label flex items-center gap-1.5" style={{ color: fight.foeSide === "villain" ? "#ff5a4f" : "#3fe0c5" }}>
            {fight.boss && <Crown className="size-3.5 text-gold" aria-hidden />}
            {fight.boss ? "Boss fight" : fight.foeSide === "villain" ? "Fight" : "Sparring"}
            <span className="text-muted">·</span>
            <ElementIcon element={foeElement} className="size-3.5" />
            <span className="text-muted">{kit.type}</span>
          </p>
          <p className="t-display truncate text-fg">{fight.foeName}</p>
        </div>
        <span className="chip shrink-0 text-fg" style={{ borderColor: HEX[tell], boxShadow: `0 0 14px -6px ${HEX[tell]}` }}>
          {(() => {
            const Icon = STYLE_ICON[tell];
            return <Icon className="size-3.5" style={{ color: HEX[tell] }} />;
          })()}
          Tell: {STYLE[tell]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Bar label="You" value={playerHp} max={maxP} color={heroAura} hot={impact?.on === "me" && impact.amount > 0} kick={impact?.key ?? 0} />
        <Bar label={fight.foeName} value={foeHp} max={maxF} color={foeColor} hot={impact?.on === "foe" && impact.amount > 0} kick={impact?.key ?? 0} right />
      </div>

      <div key={quake?.key ?? "still"} className={`scene-arena relative h-[200px] shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 ${quake ? "fx-quake" : ""}`}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(45% 55% at 22% 92%, color-mix(in srgb, ${heroAura} 32%, transparent), transparent 70%), radial-gradient(45% 55% at 78% 92%, color-mix(in srgb, ${foeColor} 34%, transparent), transparent 70%)` }} />
        {fight.boss && <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,59,48,0.35)]" />}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />

        <Fighter side="me" lunging={lunge?.side === "me" ? lunge.key : 0} idle={mePose === "idle"} ko={mePose === "ko"} glow={heroAura}>
          {heroFigure}
        </Fighter>
        <Fighter side="foe" lunging={lunge?.side === "foe" ? lunge.key : 0} idle={foePose === "idle"} ko={foePose === "ko"} glow={foeColor}>
          {foeFigure}
        </Fighter>

        {shot && <Projectile key={shot.key} element={shot.element} reverse={shot.from === "foe"} seed={shot.key} />}

        {impact && (
          <span key={impact.key} className={`pointer-events-none absolute top-[14%] h-[62%] w-[34%] ${impact.on === "foe" ? "right-[4%]" : "left-[4%]"}`}>
            {impact.amount > 0 && <ElementBurst element={impact.element} size={impact.big ? 96 : 76} seed={impact.key} big={impact.big} />}
            <FloatNumber
              text={impact.amount > 0 ? `−${impact.amount}` : "Blocked"}
              color={impact.on === "foe" ? (impact.crit ? "#ffe08a" : "#ffffff") : "#ff8f87"}
              className={`-top-2 left-1/2 -translate-x-1/2 ${impact.amount > 0 ? "" : "!text-lg"}`}
            />
          </span>
        )}

        {edge && (
          <div key={edge.key} className={`anim-pop t-label absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 text-[10px] ${edge.edge === "you" ? "bg-gold text-paper-ink" : edge.edge === "them" ? "bg-cape text-white" : "bg-white/15 text-fg"}`}>
            {edge.edge === "you" ? "Your edge" : edge.edge === "them" ? "Their edge" : "Even trade"}
          </div>
        )}
        {intro && (
          <div className="ko-in pointer-events-none absolute inset-0 grid place-items-center">
            <span className="font-display text-5xl tracking-wide text-gold" style={{ textShadow: "0 3px 0 rgba(0,0,0,.6), 0 0 24px rgba(255,207,77,.7)" }}>
              {fight.boss ? "BOSS!" : "FIGHT!"}
            </span>
          </div>
        )}
        {quake && <span key={`f${quake.key}`} className="fx-flash pointer-events-none absolute inset-0" style={{ background: quake.color, opacity: 0 }} />}
      </div>

      <div className="card-paper px-3 py-2">
        <p className="text-sm font-bold">
          {TELL[tell]} <span className="font-semibold opacity-70">{BEAT[tell]}</span>
        </p>
        <p role="status" className="mt-0.5 line-clamp-2 text-xs font-semibold opacity-80">
          {log}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="t-label flex items-center gap-1 text-muted">
          <Zap className="size-3.5 text-gold" aria-hidden /> Energy <span className="t-num text-fg">{energy}/10</span>
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className={`h-2.5 w-2.5 rotate-45 rounded-[3px] transition-colors ${index < energy ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : "bg-panel-2"}`} />
          ))}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto">
        {fight.playerMoves.map((move) => (
          <MoveCard key={keyOf(move)} move={move} cooling={cool[keyOf(move)] ?? 0} energy={energy} picked={last === keyOf(move)} answers={move.style === answer} busy={busy} onPick={() => swing(move)} />
        ))}
      </div>
      <button type="button" aria-pressed={last === "breath"} disabled={busy} onClick={recover} className={`btn btn-ghost min-h-12 shrink-0 text-sm ${last === "breath" ? "!border-gold" : ""}`}>
        <RotateCcw className="size-4" aria-hidden /> Catch a breath · +3 energy
      </button>

      {result && <ResultCard spec={spec} result={result} hero={heroFigure} foe={foeFigure} foeName={fight.foeName} boss={!!fight.boss} used={used.current} moves={fight.playerMoves} onContinue={() => onDone(result.ratio, used.current)} />}
    </div>
  );
}

function Fighter({ side, lunging, idle, ko, glow, children }: { side: "me" | "foe"; lunging: number; idle: boolean; ko: boolean; glow: string; children: React.ReactNode }) {
  const me = side === "me";
  return (
    <div
      key={lunging || "rest"}
      className={`absolute bottom-2 h-[88%] w-[30%] ${me ? "left-[6%]" : "right-[6%]"} ${lunging ? "fx-lunge" : ""}`}
      style={{ "--lunge": me ? "70px" : "-70px" } as React.CSSProperties}
    >
      <div className="h-full w-full transition-transform duration-500" style={{ transform: ko ? `translateX(${me ? 62 : -62}%)` : undefined }}>
        <div className={`h-full w-full ${idle ? "anim-float" : ""}`} style={{ transform: me ? undefined : "scaleX(-1)", filter: `drop-shadow(0 0 1px rgb(255 255 255 / 0.35)) drop-shadow(0 0 8px color-mix(in srgb, ${glow} 55%, transparent))` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function MoveCard({ move, cooling, energy, picked, answers, busy, onPick }: { move: DuelMove; cooling: number; energy: number; picked: boolean; answers: boolean; busy: boolean; onPick: () => void }) {
  const cost = move.energy ?? 1;
  const short = energy < cost;
  const blocked = cooling > 0 || short;
  const el = elementOf(move.element);
  const meta = ELEMENTS[el];
  const StyleIcon = STYLE_ICON[move.style];
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-disabled={blocked || busy}
      onClick={onPick}
      className={`card relative flex min-h-[5.5rem] flex-col gap-1 overflow-hidden px-2.5 py-2 text-left transition-transform ${picked ? "!border-gold !bg-panel-2" : answers && !blocked ? "!border-gold/70 shadow-[0_0_16px_-6px_var(--color-gold)]" : ""} ${blocked ? "opacity-55" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: HEX[move.style] }} />
      {cooling > 0 && <span className="absolute inset-0 bg-ink/50" style={{ clipPath: `inset(${100 - Math.min(100, cooling * 33)}% 0 0 0)` }} />}
      <span className="relative flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${meta.color} 45%, transparent)` }} title={meta.label}>
          <ElementIcon element={el} className="size-[18px]" />
        </span>
        <span className="line-clamp-2 min-w-0 text-[13px] leading-tight font-extrabold text-fg">{move.name}</span>
      </span>
      <span className="relative flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold">
        <span className="flex items-center gap-0.5" style={{ color: HEX[move.style] }}>
          <StyleIcon className="size-3" aria-hidden />
          {STYLE[move.style]}
        </span>
        <span className={`flex items-center ${short ? "text-cape" : "text-gold"}`} aria-label={`${cost} energy`}>
          <Zap className="size-3" aria-hidden />
          {cost}
        </span>
        {(move.cooldown ?? 0) > 0 && <span className="text-muted">{cooling > 0 ? `${cooling}t left` : `cd ${move.cooldown}`}</span>}
        {move.rank ? <span className="rounded bg-white/10 px-1 text-[10px] text-fg">R{move.rank}</span> : null}
        {answers && !blocked && <span className="t-label rounded-full bg-gold px-1.5 py-px text-[8px] text-paper-ink">Answer</span>}
      </span>
      <span className="relative text-[11px] leading-snug text-muted">{cooling > 0 ? "Cooling down." : short ? "Not enough energy." : mechanicLine(move)}</span>
    </button>
  );
}

const EFFECT_LABEL: Record<Exclude<keyof Effects, "personId">, string> = {
  health: "Health",
  happiness: "Joy",
  smarts: "Smarts",
  looks: "Looks",
  fame: "Fame",
  money: "Cash",
  reputation: "Rep",
  parentBelief: "Family belief",
  powerLevel: "Power",
  closeness: "Bond",
  karma: "Karma",
};

function rewardChips(effects: Effects): { label: string; value: string; good: boolean }[] {
  const out: { label: string; value: string; good: boolean }[] = [];
  for (const [key, label] of Object.entries(EFFECT_LABEL) as [Exclude<keyof Effects, "personId">, string][]) {
    const value = effects[key];
    if (typeof value !== "number" || value === 0) continue;
    const sign = value > 0 ? "+" : "−";
    const text = key === "money" ? `${sign}${money(Math.abs(value))}` : `${sign}${Math.abs(Math.round(value * 10) / 10)}`;
    out.push({ label, value: text, good: value > 0 });
  }
  return out;
}

function ResultCard({ spec, result, hero, foe, foeName, boss, used, moves, onContinue }: { spec: MinigameSpec; result: Result; hero: React.ReactNode; foe: React.ReactNode; foeName: string; boss: boolean; used: string[]; moves: DuelMove[]; onContinue: () => void }) {
  const win = result.ratio >= 0.66;
  const draw = !win && result.ratio >= 0.33;
  const effects = win ? spec.winEffects : draw ? spec.partialEffects : spec.loseEffects;
  const text = win ? spec.winText : draw ? spec.partialText : spec.loseText;
  const chips = rewardChips(effects);
  const practiced = [...new Set(used)].map((id) => moves.find((m) => m.id === id)?.name).filter(Boolean) as string[];
  const tone = win ? "#ffcf4d" : draw ? "#c9ccd4" : "#ff5a4f";
  const Icon = win ? Trophy : draw ? Swords : Skull;
  return (
    <div className="anim-fade absolute inset-0 z-30 flex flex-col overflow-y-auto bg-ink/92 px-5 pt-6 pb-5 backdrop-blur-sm" role="dialog" aria-label={win ? "Victory" : draw ? "Draw" : "Defeat"}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] overflow-hidden" aria-hidden>
        <div className="ko-rays absolute top-[-140px] left-1/2 size-[520px] -translate-x-1/2 rounded-full opacity-25" style={{ background: `repeating-conic-gradient(${tone} 0deg 8deg, transparent 8deg 22deg)`, maskImage: "radial-gradient(circle, black 20%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 65%)" }} />
      </div>
      <div className="relative mt-auto flex flex-col items-center text-center">
        <span className="ko-in font-display text-6xl leading-none" style={{ color: tone, textShadow: `0 4px 0 rgba(0,0,0,.6), 0 0 30px ${tone}` }}>
          {win || !draw ? "K.O." : "DRAW"}
        </span>
        <p className="t-label mt-2 flex items-center gap-1.5" style={{ color: tone }}>
          <Icon className="size-4" aria-hidden />
          {win ? (boss ? "Boss down" : "Victory") : draw ? "Both still standing" : "Defeated"}
        </p>
        <p className="mt-1 text-sm font-semibold text-muted">{win ? `${foeName} is on the floor.` : draw ? `You and ${foeName} call it.` : `${foeName} walks away.`}</p>
      </div>
      <div className="relative mx-auto mt-3 flex h-[150px] w-full max-w-[300px] items-end justify-center gap-6">
        <div className="h-full w-[36%]" style={{ transform: win || draw ? undefined : "translateX(55%)" }}>{hero}</div>
        <div className="h-full w-[36%]" style={{ transform: win ? "translateX(-55%) scaleX(-1)" : "scaleX(-1)" }}>
          {foe}
        </div>
      </div>
      <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Dealt" value={String(result.dealt)} />
        <Stat label="Taken" value={String(result.taken)} />
        <Stat label="Turns" value={String(result.turns)} />
      </div>
      {result.best && result.best.dealt > 0 && (
        <p className="relative mt-2 text-center text-xs font-semibold text-muted">
          Best hit: <span className="text-fg">{result.best.name}</span> for <span className="t-num text-gold">{result.best.dealt}</span>
        </p>
      )}
      <div className="card relative mt-3 px-3 py-2.5">
        <p className="t-label text-muted">Rewards</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.length ? (
            chips.map((chip) => (
              <span key={chip.label} className={`chip !py-0.5 text-xs font-bold ${chip.good ? "text-spark" : "text-cape"}`}>
                {chip.label} {chip.value}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted">Nothing but the lesson.</span>
          )}
          {practiced.length > 0 && <span className="chip !py-0.5 text-xs font-bold text-gold">Move XP: {practiced.slice(0, 3).join(", ")}{practiced.length > 3 ? ` +${practiced.length - 3}` : ""}</span>}
        </div>
        {text && <p className="mt-2 text-xs leading-snug text-fg/85">{text}</p>}
      </div>
      <div className="mb-auto" />
      <button type="button" className="btn btn-primary mt-4 min-h-12 w-full shrink-0" onClick={onContinue} autoFocus>
        Continue
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-2 py-1.5">
      <p className="t-num text-lg font-extrabold text-fg">{value}</p>
      <p className="t-label text-[10px] text-muted">{label}</p>
    </div>
  );
}

function Bar({ label, value, max, color, hot, kick, right = false }: { label: string; value: number; max: number; color: string; hot?: boolean; kick: number; right?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="min-w-0">
      <div className={`flex justify-between gap-2 text-xs font-bold text-muted ${right ? "flex-row-reverse" : ""}`}>
        <span className="truncate">{label}</span>
        <span className="t-num text-fg">
          {value}/{max}
        </span>
      </div>
      <div className="stat-bar mt-1 !h-3.5" style={{ transform: right ? "scaleX(-1)" : undefined }}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] delay-300 duration-700" style={{ width: `${pct}%` }} />
        <div key={hot ? kick : "still"} className={`stat-fill ${hot ? "hp-flash" : ""}`} style={{ width: `${pct}%`, "--fill": pct < 25 ? "#ff3b30" : color } as React.CSSProperties} />
      </div>
    </div>
  );
}
