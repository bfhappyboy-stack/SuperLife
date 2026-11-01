import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Bug, CloudFog, Coins, Crown, Dna, Drama, EyeOff, Flame, HeartPulse, RefreshCcw, RotateCcw, Shield, ShieldHalf, Siren, Skull, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { Figure, type Pose } from "@/components/game/Figure";
import { kitFor } from "@/components/game/duelKit";
import { ElementBurst, ElementIcon, elementOf, FloatNumber, Projectile } from "@/components/game/Vfx";
import { ELEMENTS, elementOfLegacy } from "@/game/elements";
import { money } from "@/game/format";
import { answerOf, BREATH, duelRatio, gimmickStatus, keyOf, playTurn, startDuel, type DuelState, type Edge } from "@/game/duel";
import type { BossGimmick, DuelBoard, DuelMove, Effects, GimmickKind, Look, MinigameSpec, MoveStyle, Sex, Wardrobe } from "@/game/types";

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

function hashName(name: string): number {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h || 1;
}

type Side = "me" | "foe";
interface Shot { key: number; from: Side; element: string; }
interface Impact { key: number; on: Side; element: string; amount: number; big: boolean; crit: boolean }
interface Result { ratio: number; dealt: number; taken: number; turns: number; best: { name: string; dealt: number } | null }
interface PhaseBanner { key: number; title: string; name: string; line: string; hint: string; color: string }

const T = { hit1: 230, swap: 520, hit2: 760, rest: 1040 };

const GIMMICK_ICON: Record<GimmickKind, typeof Swords> = {
  armor: ShieldHalf,
  enrage: Flame,
  fog: CloudFog,
  feint: Drama,
  adapt: Dna,
  regen: HeartPulse,
  revive: RefreshCcw,
  coin: Coins,
  swarm: Bug,
  charge: Siren,
};

const GIMMICK_COLOR: Record<GimmickKind, string> = {
  armor: "#8fb4ff",
  enrage: "#ff5a4f",
  fog: "#9aa3b8",
  feint: "#d48cff",
  adapt: "#59e0a0",
  regen: "#5ef08a",
  revive: "#ffcf4d",
  coin: "#ffd76a",
  swarm: "#ff9f43",
  charge: "#ff3b30",
};

export function Duel({ spec, onDone, hero }: { spec: MinigameSpec; onDone: (ratio: number, used?: string[]) => void; hero?: DuelHero }) {
  const board = spec.duel;
  const [state, setState] = useState<DuelState | null>(() => (board ? startDuel(board) : null));
  const [shownHp, setShownHp] = useState(() => ({ me: board?.playerHp ?? 1, foe: board?.foeHp ?? 1 }));
  const [log, setLog] = useState(board?.gimmick ? `${board.gimmick.name}: ${board.gimmick.hint}` : "Read their tell, then answer it.");
  const [last, setLast] = useState<string | null>(null);
  const [edge, setEdge] = useState<{ key: number; edge: Edge } | null>(null);
  const [mePose, setMePose] = useState<Pose>("idle");
  const [foePose, setFoePose] = useState<Pose>("idle");
  const [shot, setShot] = useState<Shot | null>(null);
  const [lunge, setLunge] = useState<{ key: number; side: Side } | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [heal, setHeal] = useState<{ key: number; amount: number } | null>(null);
  const [quake, setQuake] = useState<{ key: number; color: string } | null>(null);
  const [banner, setBanner] = useState<PhaseBanner | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  // What the HUD shows (tell, coin, charge) only updates once the exchange has played out.
  const [hud, setHud] = useState<DuelState | null>(state);
  const done = useRef(false);
  const swinging = useRef(false);
  const used = useRef<string[]>([]);
  const beat = useRef(0);
  const timers = useRef<number[]>([]);
  const stats = useRef({ dealt: 0, taken: 0, turns: 0, best: null as { name: string; dealt: number } | null });

  useEffect(() => {
    const id = window.setTimeout(() => setIntro(false), board?.gimmick && (board.gimmick.at ?? 0.55) >= 1 ? 1500 : 900);
    const pending = timers.current;
    return () => {
      window.clearTimeout(id);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [board]);

  if (!board || !state || !hud) return null;
  const fight = board;
  const now = state;
  const maxP = fight.playerHp;
  const maxF = fight.foeHp;
  const gimmick = fight.gimmick ?? null;
  const live = !!gimmick && hud.phase === 2;
  const tell = hud.shown;
  const answer = tell === "hidden" ? null : answerOf(tell);
  const kit = kitFor(fight.foePower, fight.foeSide);
  const foeElement = elementOfLegacy(fight.foePower);
  const baseFoeColor = ELEMENTS[foeElement].color;
  const foeColor = live && gimmick ? GIMMICK_COLOR[gimmick.kind] : baseFoeColor;
  const heroAura = hero?.aura ?? "#ffcf4d";
  const foeSeed = fight.foeSeed ?? hashName(fight.foeName);
  const charging = live && gimmick?.kind === "charge" && hud.charge === 0;
  const status = gimmickStatus(fight, hud);

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
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

  function showPhase(kind: "phase" | "revive") {
    if (!gimmick) return;
    const key = ++beat.current;
    setBanner({ key, title: kind === "revive" ? "Back up!" : "Phase 2", name: gimmick.name, line: gimmick.line, hint: gimmick.hint, color: GIMMICK_COLOR[gimmick.kind] });
    setQuake({ key, color: GIMMICK_COLOR[gimmick.kind] });
    buzz([30, 40, 60]);
    later(2300, () => setBanner((b) => (b && b.key === key ? null : b)));
  }

  function finish(next: DuelState, ms: number) {
    if (!next.done) {
      later(ms, () => {
        setMePose("idle");
        setFoePose("idle");
        swinging.current = false;
        setBusy(false);
      });
      return;
    }
    done.current = true;
    const ratio = duelRatio(next);
    later(ms - 200, () => {
      if (next.foeHp <= 0) setFoePose("ko");
      if (next.playerHp <= 0) setMePose("ko");
      if (next.foeHp <= 0 && next.playerHp > 0) setMePose("idle");
      if (next.playerHp <= 0 && next.foeHp > 0) setFoePose("idle");
    });
    later(ms + 650, () => setResult({ ratio, ...stats.current }));
  }

  function swing(move: DuelMove) {
    if (swinging.current || done.current) return;
    const turn = playTurn(fight, now, move);
    if (turn.refused) {
      setLog(turn.refused);
      return;
    }
    const breath = move === BREATH;
    const { dealt, taken, foeMove, notes } = turn;
    const next = turn.state;
    if (move.id && !breath) used.current.push(move.id);
    swinging.current = true;
    setBusy(true);
    setState(next);
    const s = stats.current;
    s.turns += 1;
    s.dealt += dealt;
    s.taken += taken + turn.chip;
    if (!breath && (!s.best || dealt > s.best.dealt)) s.best = { name: move.name, dealt };
    setLast(breath ? "breath" : keyOf(move));
    setEdge({ key: ++beat.current, edge: turn.edge });
    const myElement = breath ? "shield" : (move.element ?? "force");
    const theirElement = foeMove.element ?? foeElement;
    const bigOut = dealt >= Math.max(10, maxF * 0.2) || next.foeHp <= 0;
    const bigIn = taken >= Math.max(10, maxP * 0.2) || next.playerHp <= 0;
    const flavor = move.effect ? ` ${move.effect}` : "";
    const extra = notes.length ? ` ${notes.join(". ")}.` : "";
    const chip = turn.chip ? ` ${gimmick?.name ?? "Chip"} −${turn.chip}.` : "";
    const line = breath
      ? `You catch a breath${dealt ? ` and counter for ${dealt}` : ""}. ${fight.foeName} lands ${foeMove.name} for ${taken}.`
      : turn.edge === "you"
        ? `${move.name} beats ${foeMove.name}.${flavor} ${dealt} out${taken ? `, ${taken} back` : ""}.`
        : turn.edge === "them"
          ? `${foeMove.name} had the angle on ${move.name}. ${taken} in, ${dealt} out.`
          : `${move.name} meets ${foeMove.name}. You trade ${dealt} for ${taken}.`;
    setLog(next.foeHp <= 0 ? `${move.name} puts ${fight.foeName} down.${flavor}` : `${line}${extra}${chip}`);
    if (foeMove.id === "charge" && taken > maxP * 0.2) buzz([60, 30, 90]);

    if (breath) setMePose("guard");
    else attack("me", myElement);
    const hitAt = breath ? 120 : T.hit1;
    later(hitAt, () => {
      if (dealt > 0 || !breath) {
        setShownHp((hp) => ({ ...hp, foe: turn.shift === "revive" ? 0 : next.foeHp }));
        land("foe", myElement, dealt, bigOut, turn.edge === "you", false);
      }
    });
    if (turn.shift === "revive") {
      later(hitAt + 260, () => setFoePose("ko"));
      later(hitAt + 900, () => {
        setFoePose("idle");
        setShownHp((hp) => ({ ...hp, foe: next.foeHp }));
        showPhase("revive");
      });
    }
    if (next.foeHp > 0) {
      const delay = turn.shift === "revive" ? 1300 : 0;
      later(delay + (breath ? 240 : T.swap), () => {
        if (!breath) setMePose(move.style === "guard" ? "guard" : "idle");
        attack("foe", theirElement);
      });
      later(delay + (breath ? 480 : T.hit2), () => {
        setShownHp((hp) => ({ ...hp, me: next.playerHp }));
        land("me", theirElement, taken + turn.chip, bigIn, turn.edge === "them", breath || move.kind === "guard" || move.style === "guard");
        if (turn.healed > 0) setHeal({ key: ++beat.current, amount: turn.healed });
        setHud(next);
        if (turn.shift === "phase") showPhase("phase");
      });
      finish(next, delay + (breath ? 800 : T.rest));
    } else {
      setHud(next);
      finish(next, T.swap + 200);
    }
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
  const TellIcon = tell === "hidden" ? EyeOff : STYLE_ICON[tell];
  const tellColor = tell === "hidden" ? "#9aa3b8" : charging ? "#ff3b30" : HEX[tell];
  const breathAnswers = answer === "guard";

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden px-4 pt-3 pb-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-label flex items-center gap-1.5" style={{ color: fight.foeSide === "villain" ? "#ff5a4f" : "#3fe0c5" }}>
            {fight.boss && <Crown className="size-3.5 text-gold" aria-hidden />}
            {fight.boss ? (live ? "Boss · Phase 2" : "Boss fight") : fight.foeSide === "villain" ? (live ? "Fight · Phase 2" : "Fight") : "Sparring"}
            <span className="text-muted">·</span>
            <ElementIcon element={foeElement} className="size-3.5" />
            <span className="text-muted">{kit.type}</span>
          </p>
          <p className="t-display truncate text-fg">{fight.foeName}</p>
        </div>
        <span
          key={`${tell}-${hud.turns}`}
          className={`chip anim-pop shrink-0 text-fg ${charging ? "duel-charge-chip" : ""}`}
          style={{ borderColor: tellColor, boxShadow: `0 0 14px -6px ${tellColor}` }}
        >
          <TellIcon className="size-3.5" style={{ color: tellColor }} />
          {tell === "hidden" ? "Tell: ???" : charging ? "Charging!" : `Tell: ${STYLE[tell]}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Bar label="You" value={shownHp.me} max={maxP} color={heroAura} hot={impact?.on === "me" && impact.amount > 0} kick={impact?.key ?? 0} />
        <Bar
          label={fight.foeName}
          value={shownHp.foe}
          max={maxF}
          color={foeColor}
          hot={impact?.on === "foe" && impact.amount > 0}
          kick={impact?.key ?? 0}
          right
          mark={gimmick && gimmick.kind !== "revive" && (gimmick.at ?? 0.55) < 1 && hud.phase === 1 ? (gimmick.at ?? 0.55) : undefined}
          lives={gimmick?.kind === "revive" ? (hud.revived ? 1 : 2) : undefined}
        />
      </div>
      {gimmick && <GimmickStrip gimmick={gimmick} live={live} status={status} state={hud} />}

      <div key={quake?.key ?? "still"} className={`scene-arena relative ${gimmick ? "h-[164px]" : "h-[188px]"} shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 ${quake ? "fx-quake" : ""}`}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(45% 55% at 22% 92%, color-mix(in srgb, ${heroAura} 32%, transparent), transparent 70%), radial-gradient(45% 55% at 78% 92%, color-mix(in srgb, ${foeColor} ${live ? 52 : 34}%, transparent), transparent 70%)` }} />
        {fight.boss && <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,59,48,0.35)]" />}
        {live && gimmick && <div className="duel-phase-aura pointer-events-none absolute inset-0" style={{ "--aura": GIMMICK_COLOR[gimmick.kind] } as React.CSSProperties} />}
        {live && gimmick?.kind === "fog" && <div className="duel-fog pointer-events-none absolute inset-0" />}
        {charging && <div className="duel-charge pointer-events-none absolute inset-0" />}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />

        <Fighter side="me" lunging={lunge?.side === "me" ? lunge.key : 0} idle={mePose === "idle"} ko={mePose === "ko"} glow={heroAura}>
          {heroFigure}
        </Fighter>
        <Fighter side="foe" lunging={lunge?.side === "foe" ? lunge.key : 0} idle={foePose === "idle"} ko={foePose === "ko"} glow={foeColor} big={live}>
          {foeFigure}
        </Fighter>
        {live && gimmick?.kind === "armor" && hud.plates > 0 && (
          <span className="pointer-events-none absolute right-[9%] bottom-[30%] flex gap-1" aria-hidden>
            {Array.from({ length: hud.plates }, (_, i) => (
              <ShieldHalf key={i} className="anim-pop size-6 drop-shadow-[0_0_6px_#8fb4ff]" style={{ color: "#8fb4ff" }} />
            ))}
          </span>
        )}
        {live && gimmick?.kind === "swarm" && hud.swarm > 0 && <Swarm color={GIMMICK_COLOR.swarm} />}
        {live && gimmick?.kind === "coin" && hud.coin && (
          <span key={`coin-${hud.turns}`} className="duel-coin pointer-events-none absolute top-3 right-3 grid size-11 place-items-center rounded-full font-display text-[11px] text-paper-ink" style={{ background: hud.coin === "heads" ? "radial-gradient(circle at 35% 30%, #fff3c4, #e0a92e)" : "radial-gradient(circle at 35% 30%, #d9dde6, #7a8294)" }} aria-label={hud.coin === "heads" ? "Heads" : "Tails"}>
            {hud.coin === "heads" ? "HEADS" : "TAILS"}
          </span>
        )}

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
        {heal && (
          <span key={heal.key} className="pointer-events-none absolute top-[22%] right-[12%]">
            <FloatNumber text={`+${heal.amount}`} color="#5ef08a" className="" />
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
          {tell === "hidden" ? (
            <>
              You can't read them. <span className="font-semibold opacity-70">Hit hard and hope.</span>
            </>
          ) : charging ? (
            <>
              {chargedName(fight)} is coming. <span className="font-semibold opacity-70">Guard, or catch a breath.</span>
            </>
          ) : (
            <>
              {TELL[tell]} <span className="font-semibold opacity-70">{BEAT[tell]}</span>
            </>
          )}
        </p>
        <p role="status" className="mt-0.5 line-clamp-2 text-xs font-semibold opacity-80">
          {log}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="t-label flex items-center gap-1 text-muted">
          <Zap className="size-3.5 text-gold" aria-hidden /> Energy <span className="t-num text-fg">{now.energy}/10</span>
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className={`h-2.5 w-2.5 rotate-45 rounded-[3px] transition-colors ${index < now.energy ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : "bg-panel-2"}`} />
          ))}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto">
        {fight.playerMoves.map((move) => (
          <MoveCard
            key={keyOf(move)}
            move={move}
            cooling={now.cool[keyOf(move)] ?? 0}
            energy={now.energy}
            picked={last === keyOf(move)}
            answers={!!answer && move.style === answer}
            tag={moveTag(fight, hud, move)}
            busy={busy}
            onPick={() => swing(move)}
          />
        ))}
      </div>
      <button type="button" aria-pressed={last === "breath"} disabled={busy} onClick={() => swing(BREATH)} className={`btn btn-ghost min-h-12 shrink-0 text-sm ${last === "breath" ? "!border-gold" : ""} ${breathAnswers ? "!border-gold/70" : ""}`}>
        <RotateCcw className="size-4" aria-hidden /> {breathAnswers ? "Breath · +3 energy · counters" : "Catch a breath · +3 energy"}
      </button>

      {banner && <PhaseOverlay banner={banner} />}
      {result && <ResultCard spec={spec} result={result} hero={heroFigure} foe={foeFigure} foeName={fight.foeName} boss={!!fight.boss} used={used.current} moves={fight.playerMoves} gimmick={gimmick} onContinue={() => onDone(result.ratio, used.current)} />}
    </div>
  );
}

function chargedName(board: DuelBoard): string {
  return board.gimmick?.name ?? "The big one";
}

/** A small tag on a move card when it is the answer to the live gimmick (cracks armor, clears a swarm…). */
function moveTag(board: DuelBoard, state: DuelState, move: DuelMove): string | null {
  const g = board.gimmick;
  if (!g || state.phase !== 2) return null;
  if (g.kind === "armor" && state.plates > 0 && move.style === (g.style ?? "trick")) return "Cracks";
  if (g.kind === "swarm" && state.swarm > 0 && move.kind === "area") return "Clears";
  if (g.kind === "regen" && (move.style === (g.style ?? "trick") || move.kind === "status")) return "Stalls";
  if (g.kind === "adapt" && state.lastKey === keyOf(move)) return "Adapted";
  return null;
}

function buzz(pattern: number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // Vibration is optional.
  }
}

function GimmickStrip({ gimmick, live, status, state }: { gimmick: BossGimmick; live: boolean; status: string | null; state: DuelState }) {
  const Icon = GIMMICK_ICON[gimmick.kind];
  const color = GIMMICK_COLOR[gimmick.kind];
  const waiting = !live && gimmick.kind !== "revive";
  return (
    <div
      className={`relative flex items-center gap-2 overflow-hidden rounded-2xl border px-2 py-1 ${live ? "duel-gimmick-live" : ""}`}
      style={{ borderColor: `color-mix(in srgb, ${color} ${live ? 70 : 30}%, transparent)`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} ${live ? 22 : 10}%, transparent), transparent 80%)`, "--aura": color } as React.CSSProperties}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 55%, transparent)` }}>
        <Icon className="size-4" style={{ color }} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] leading-tight font-extrabold text-fg">{gimmick.name}</span>
          <span className="t-label shrink-0 rounded-full px-1.5 py-px text-[8px]" style={{ background: live ? color : "rgb(255 255 255 / 0.1)", color: live ? "#14121c" : "var(--color-muted)" }}>
            {live ? "Live" : gimmick.kind === "revive" ? "Once" : `At ${Math.round((gimmick.at ?? 0.55) * 100)}%`}
          </span>
        </span>
        <span className="block truncate text-[11px] leading-snug font-semibold text-muted">{live && status ? status : gimmick.hint}</span>
      </span>
      {live && gimmick.kind === "charge" && (
        <span className="flex shrink-0 gap-1" aria-label={state.charge === 0 ? "Charging now" : `Charges in ${state.charge}`}>
          {[2, 1, 0].map((n) => (
            <span key={n} className="size-2 rounded-full" style={{ background: state.charge <= n ? color : "rgb(255 255 255 / 0.15)", boxShadow: state.charge <= n ? `0 0 6px ${color}` : undefined }} />
          ))}
        </span>
      )}
      {waiting && <span className="sr-only">Starts when they drop to {Math.round((gimmick.at ?? 0.55) * 100)}% health.</span>}
    </div>
  );
}

function PhaseOverlay({ banner }: { banner: PhaseBanner }) {
  return (
    <div key={banner.key} data-phase-banner className="phase-in pointer-events-none absolute inset-0 z-20 grid place-items-center px-4 backdrop-blur-[3px]" style={{ background: `radial-gradient(75% 65% at 50% 50%, color-mix(in srgb, ${banner.color} 30%, rgba(10,8,16,.9)), rgba(10,8,16,.96))` }}>
      <div className="text-center">
        <p className="t-label text-[11px]" style={{ color: banner.color }}>
          {banner.name}
        </p>
        <p className="font-display text-[64px] leading-none tracking-wide text-white" style={{ textShadow: `0 3px 0 rgba(0,0,0,.6), 0 0 26px ${banner.color}` }}>
          {banner.title.toUpperCase()}
        </p>
        <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] leading-snug font-semibold text-white italic">{banner.line}</p>
        <p className="mx-auto mt-1.5 max-w-[290px] text-[12px] leading-snug font-extrabold" style={{ color: banner.color }}>
          {banner.hint}
        </p>
      </div>
    </div>
  );
}

function Swarm({ color }: { color: string }) {
  const dots = [
    [62, 18],
    [80, 30],
    [70, 52],
    [88, 60],
    [58, 40],
    [92, 16],
  ];
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map(([x, y], i) => (
        <span key={i} className="duel-swarm absolute size-2 rounded-full" style={{ left: `${x}%`, top: `${y}%`, background: color, boxShadow: `0 0 8px ${color}`, animationDelay: `${i * 140}ms` }} />
      ))}
    </span>
  );
}

function Fighter({ side, lunging, idle, ko, glow, big = false, children }: { side: "me" | "foe"; lunging: number; idle: boolean; ko: boolean; glow: string; big?: boolean; children: React.ReactNode }) {
  const me = side === "me";
  return (
    <div
      key={lunging || "rest"}
      className={`absolute bottom-2 h-[88%] w-[30%] ${me ? "left-[6%]" : "right-[6%]"} ${lunging ? "fx-lunge" : ""}`}
      style={{ "--lunge": me ? "70px" : "-70px" } as React.CSSProperties}
    >
      <div className="h-full w-full origin-bottom transition-transform duration-500" style={{ transform: ko ? `translateX(${me ? 62 : -62}%)` : big ? "scale(1.08)" : undefined }}>
        <div className={`h-full w-full ${idle ? "anim-float" : ""}`} style={{ transform: me ? undefined : "scaleX(-1)", filter: `drop-shadow(0 0 1px rgb(255 255 255 / 0.35)) drop-shadow(0 0 8px color-mix(in srgb, ${glow} 55%, transparent))` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function MoveCard({ move, cooling, energy, picked, answers, tag, busy, onPick }: { move: DuelMove; cooling: number; energy: number; picked: boolean; answers: boolean; tag?: string | null; busy: boolean; onPick: () => void }) {
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
        {tag && !blocked && <span className={`t-label rounded-full px-1.5 py-px text-[8px] ${tag === "Adapted" ? "bg-cape text-white" : "bg-spark text-paper-ink"}`}>{tag}</span>}
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

function ResultCard({ spec, result, hero, foe, foeName, boss, used, moves, gimmick, onContinue }: { spec: MinigameSpec; result: Result; hero: React.ReactNode; foe: React.ReactNode; foeName: string; boss: boolean; used: string[]; moves: DuelMove[]; gimmick: BossGimmick | null; onContinue: () => void }) {
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
      {gimmick && !win && (
        <div className="card relative mt-2 flex items-start gap-2 px-3 py-2" style={{ borderColor: `color-mix(in srgb, ${GIMMICK_COLOR[gimmick.kind]} 45%, transparent)` }}>
          {(() => {
            const Icon = GIMMICK_ICON[gimmick.kind];
            return <Icon className="mt-0.5 size-4 shrink-0" style={{ color: GIMMICK_COLOR[gimmick.kind] }} aria-hidden />;
          })()}
          <p className="text-xs leading-snug text-fg/90">
            <span className="font-extrabold">Next time, {gimmick.name}:</span> {gimmick.hint}
          </p>
        </div>
      )}
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

function Bar({ label, value, max, color, hot, kick, right = false, mark, lives }: { label: string; value: number; max: number; color: string; hot?: boolean; kick: number; right?: boolean; mark?: number; lives?: number }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="min-w-0">
      <div className={`flex justify-between gap-2 text-xs font-bold text-muted ${right ? "flex-row-reverse" : ""}`}>
        <span className="truncate">{label}</span>
        <span className="t-num flex items-center gap-1 text-fg">
          {lives ? (
            <span className="flex gap-0.5" aria-label={`${lives} bodies left`}>
              {Array.from({ length: lives }, (_, i) => (
                <span key={i} className="size-1.5 rounded-full bg-gold shadow-[0_0_4px_var(--color-gold)]" />
              ))}
            </span>
          ) : null}
          {value}/{max}
        </span>
      </div>
      <div className="stat-bar mt-1 !h-3.5" style={{ transform: right ? "scaleX(-1)" : undefined }}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] delay-300 duration-700" style={{ width: `${pct}%` }} />
        <div key={hot ? kick : "still"} className={`stat-fill ${hot ? "hp-flash" : ""}`} style={{ width: `${pct}%`, "--fill": pct < 25 ? "#ff3b30" : color } as React.CSSProperties} />
        {mark !== undefined && <span className="absolute inset-y-[-3px] w-[2px] rounded-full bg-white/85 shadow-[0_0_4px_white]" style={{ left: `${mark * 100}%` }} aria-hidden />}
      </div>
    </div>
  );
}
