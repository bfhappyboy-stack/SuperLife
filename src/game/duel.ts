/**
 * Pure duel rules: the rock-paper-scissors core, energy, momentum, cooldowns, and boss gimmick phases.
 * The Duel screen draws whatever this returns, and tests can play thousands of fights headless.
 *
 * Boss gimmicks are data (see `BossGimmick` on a board, set from presets.ts or `arcGimmick`).
 * Most switch on in phase 2, when the boss drops to `at` of its health. `revive` instead fires on the
 * first knockout. Every gimmick has a readable answer, shown in the fight as a hint.
 */
import {
  addStatus,
  advanceCombo,
  baitFor,
  burnChip,
  cleanseOne,
  FINISHER_MOMENTUM,
  finisherDamage,
  canInterrupt,
  canUltimate,
  INTERRUPT_COST,
  INTERRUPT_MIN,
  stageBonus,
  ULTIMATE_COST,
  ULTIMATE_MULT,
  habitOf,
  hasStatus,
  inMult,
  outMult,
  rememberStyle,
  shockDrain,
  spendWard,
  STATUSES,
  statusOfMove,
  tickStatuses,
  type StatusInst,
} from "./battle";
import { BURST_COST, BURST_MULT, GUARD_BREAK_BONUS, MOMENTUM_CAP } from "./difficulty";
import { elementOfLegacy } from "./elements";
import type { BossGimmick, DuelBoard, DuelMove, MoveStyle, StatusId } from "./types";

export type Edge = "you" | "them" | "even";
export type Rand = () => number;

export function beats(a: MoveStyle, b: MoveStyle): boolean {
  return (a === "strike" && b === "trick") || (a === "trick" && b === "guard") || (a === "guard" && b === "strike");
}

export function answerOf(style: MoveStyle): MoveStyle {
  if (style === "strike") return "guard";
  if (style === "guard") return "trick";
  return "strike";
}

export function keyOf(move: DuelMove): string {
  return move.id ?? move.name;
}

export function baseDamage(move: DuelMove, other: DuelMove, rand: Rand, forceWin = false): number {
  const won = forceWin || beats(move.style, other.style);
  let mod = won ? 1.55 : beats(other.style, move.style) ? 0.68 : 1;
  if (move.kind === "area") mod *= 1.12;
  if (move.kind === "dash" && won) mod *= 1.15;
  const jitter = 0.86 + rand() * 0.28;
  return Math.max(1, Math.round(move.power * mod * jitter));
}

export function pickFoe(pool: readonly DuelMove[], hated: MoveStyle | null, rand: Rand, hate = 0.42): DuelMove {
  const fallback: DuelMove = { name: "Shove", blurb: "", power: 3, style: "strike" };
  if (!pool.length) return fallback;
  if (hated && rand() < hate) {
    const answer = pool.filter((move) => beats(move.style, hated));
    if (answer.length) return answer[Math.floor(rand() * answer.length)] ?? pool[0]!;
  }
  return pool[Math.floor(rand() * pool.length)] ?? pool[0]!;
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

export const BREATH: DuelMove = { id: "breath", name: "Catch a breath", blurb: "", power: 3, style: "guard", kind: "guard", energy: 0 };

export interface DuelState {
  playerHp: number;
  foeHp: number;
  energy: number;
  /** 0–MOMENTUM_CAP. Builds on edge wins; spends for a Burst. */
  momentum: number;
  cool: Record<string, number>;
  slow: number;
  /** What the foe will actually throw next. */
  intent: DuelMove;
  /** What the tell shows: the true style, a lie (feint), or hidden (fog). */
  shown: MoveStyle | "hidden";
  lastStyle: MoveStyle | null;
  lastKey: string | null;
  phase: 1 | 2;
  /** Armor plates left (armor gimmick). */
  plates: number;
  /** Armor was shattered: the boss takes extra damage. */
  exposed: boolean;
  revived: boolean;
  /** Chip damage per turn from a swarm, 0 when cleared. */
  swarm: number;
  /** Turns the regen is suppressed. */
  regenBlock: number;
  coin: "heads" | "tails" | null;
  /** Turns until the charged hit; 0 means this turn's intent is the charged hit. */
  charge: number;
  turns: number;
  done: boolean;
  /** Stage 2 statuses on each side (battle.ts). Optional so older states still load. */
  playerStatus?: StatusInst[];
  foeStatus?: StatusInst[];
  /** Your mix-up chain: styles of consecutive won edges. */
  combo?: MoveStyle[];
  /** Your last few real-move styles, for habit reading. */
  habits?: MoveStyle[];
  /** This turn's tell is a habit fake (hidden from the HUD; revealed after the exchange). */
  faked?: boolean;
}

export interface TurnResult {
  state: DuelState;
  move: DuelMove;
  foeMove: DuelMove;
  dealt: number;
  taken: number;
  edge: Edge;
  /** The boss just entered phase 2 (or got back up). */
  shift: "phase" | "revive" | null;
  healed: number;
  chip: number;
  /** Short gimmick notes for the log: "Armor cracks", "Adapted", "Blocked the charge". */
  notes: string[];
  /** The move was refused (cooldown, energy) and no turn was spent. */
  refused?: string;
  /** True when this turn spent momentum on a Burst. */
  burst?: boolean;
  /** True when this turn spent full Momentum on an Ultimate. */
  ultimate?: boolean;
  /** True when your Strike cut in on a charged hit (Momentum 4+) and cancelled it. */
  interrupted?: boolean;
  /** Momentum gained this turn (0 if none). */
  momentumGain?: number;
  /** Statuses that landed this turn. */
  applied: { on: "you" | "foe"; id: StatusId }[];
  /** Burn damage at the end of the turn. */
  burn: { you: number; foe: number };
  /** Bonus damage from a combo finisher (0 if none). */
  finisher: number;
  /** A status your breath shook off. */
  cleansed: StatusId | null;
  /** The tell you just answered was a fake that baited your habit. */
  read: boolean;
}

const PHASE_AT = 0.55;
/** A charge boss throws its charged hit every this many turns once phase 2 is live. */
export const CHARGE_EVERY = 3;

export function gimmickOf(board: DuelBoard): BossGimmick | null {
  return board.gimmick ?? null;
}

/** The charged hit: the boss's hardest strike, wound up. */
export function chargedMove(board: DuelBoard): DuelMove {
  const g = board.gimmick;
  const strikes = board.foeMoves.filter((move) => move.style === "strike");
  const base = [...(strikes.length ? strikes : board.foeMoves)].sort((a, b) => b.power - a.power)[0] ?? { name: "Charge", blurb: "", power: 8, style: "strike" as const };
  return { ...base, id: "charge", name: g?.name ?? base.name, power: Math.round(base.power * 1.8), style: "strike", kind: "burst" };
}

function show(board: DuelBoard, state: Pick<DuelState, "phase">, intent: DuelMove, rand: Rand): MoveStyle | "hidden" {
  const g = board.gimmick;
  if (g && state.phase === 2) {
    if (g.kind === "fog" && rand() < 0.5) return "hidden";
    if (g.kind === "feint" && rand() < 0.35) {
      const others = (["strike", "guard", "trick"] as const).filter((style) => style !== intent.style);
      return others[Math.floor(rand() * others.length)] ?? intent.style;
    }
  }
  return intent.style;
}

/** Decide the foe's next move and what the tell shows. */
function commit(board: DuelBoard, state: DuelState, hated: MoveStyle | null, rand: Rand): void {
  const g = board.gimmick;
  if (g?.kind === "charge" && state.phase === 2) {
    // Count down to the charged hit; once it has been thrown the wind-up starts again (every third turn).
    state.charge = state.charge <= 0 ? CHARGE_EVERY - 1 : state.charge - 1;
    if (state.charge === 0) {
      state.intent = chargedMove(board);
      state.shown = "strike";
      return;
    }
  }
  if (g?.kind === "coin" && state.phase === 2) state.coin = rand() < 0.5 ? "heads" : "tails";
  state.faked = false;
  const shocked = hasStatus(state.foeStatus, "shock");
  // Habit reading: you threw the same style twice, so the foe baits it with a fake tell and brings the answer.
  const habit = habitOf(state.habits);
  const read = board.aiRead ?? 0;
  if (habit && read > 0 && !shocked && rand() < read) {
    const answer = board.foeMoves.filter((move) => beats(move.style, habit));
    if (answer.length) {
      state.intent = answer[Math.floor(rand() * answer.length)] ?? answer[0]!;
      state.shown = baitFor(habit);
      state.faked = true;
      return;
    }
  }
  state.intent = pickFoe(board.foeMoves, hated, rand, board.aiHate ?? 0.42);
  state.shown = show(board, state, state.intent, rand);
  // Shock: a jolted foe can't hide or fake its tell.
  if (shocked) state.shown = state.intent.style;
}

/** The status the foe's move leaves (its own element, or the foe's power element). */
function foeStatusOf(board: DuelBoard, move: DuelMove): StatusId | null {
  if (move.id === "charge") return null;
  return statusOfMove(move, board.foePower ? elementOfLegacy(board.foePower) : undefined);
}

export function startDuel(board: DuelBoard, rand: Rand = Math.random): DuelState {
  const state: DuelState = {
    playerHp: board.playerHp,
    foeHp: board.foeHp,
    energy: 10,
    momentum: 0,
    cool: {},
    slow: 1,
    intent: board.foeMoves[0] ?? BREATH,
    shown: "strike",
    lastStyle: null,
    lastKey: null,
    phase: 1,
    plates: 0,
    exposed: false,
    revived: false,
    swarm: 0,
    regenBlock: 0,
    coin: null,
    charge: 0,
    turns: 0,
    done: false,
    playerStatus: [],
    foeStatus: [],
    combo: [],
    habits: [],
    faked: false,
  };
  // A gimmick with at >= 1 is live from the opening bell.
  if (board.gimmick && (board.gimmick.at ?? PHASE_AT) >= 1 && board.gimmick.kind !== "revive") enterPhase(board, state);
  commit(board, state, null, rand);
  return state;
}

function enterPhase(board: DuelBoard, state: DuelState): void {
  const g = board.gimmick;
  state.phase = 2;
  if (!g) return;
  if (g.kind === "armor") state.plates = 2;
  if (g.kind === "swarm") state.swarm = Math.max(2, Math.round(board.foeHp * 0.05));
  if (g.kind === "charge") state.charge = CHARGE_EVERY - 1;
}

/** Can the player use this move right now? Returns the reason it can't, or null. */
export function refusal(state: DuelState, move: DuelMove): string | null {
  if (move === BREATH || move.id === "breath") return null;
  const left = state.cool[keyOf(move)] ?? 0;
  if (left > 0) return `${move.name} is still cooling: ${left} turn${left === 1 ? "" : "s"}.`;
  const cost = move.energy ?? 1;
  if (state.energy < cost) return `${move.name} needs ${cost} energy. You have ${state.energy}. Catch a breath.`;
  return null;
}

/** True when the foe's charged hit is coming and you hold enough Momentum to cut in with a Strike. */
export function interruptReady(board: DuelBoard, state: DuelState): boolean {
  return !state.done && state.intent.id === "charge" && state.momentum >= INTERRUPT_MIN && board.playerMoves.some((m) => m.style === "strike");
}

/** True when momentum is banked for a Burst (it fires on your next winning hit). */
export function canBurst(state: DuelState): boolean {
  return state.momentum >= BURST_COST;
}


export function playTurn(board: DuelBoard, prev: DuelState, move: DuelMove, rand: Rand = Math.random): TurnResult {
  const state: DuelState = { ...prev, cool: { ...prev.cool } };
  const foeMove = prev.intent;
  const notes: string[] = [];
  const empty = { state: prev, move, foeMove, dealt: 0, taken: 0, edge: "even" as Edge, shift: null, healed: 0, chip: 0, notes, applied: [], burn: { you: 0, foe: 0 }, finisher: 0, cleansed: null, read: false };
  if (prev.done) return { ...empty, refused: "The fight is over." };
  const no = refusal(prev, move);
  if (no) return { ...empty, refused: no };
  const g = board.gimmick;
  const breath = move === BREATH || move.id === "breath";
  const key = breath ? "breath" : keyOf(move);
  const active = !!g && state.phase === 2;
  const maxF = board.foeHp;

  // --- your hit ---
  // Catching a breath is a guard stance: read a strike and it turns into a small counter.
  const counter = breath && beats("guard", foeMove.style) ? Math.max(1, Math.round(Math.max(...board.playerMoves.map((m) => m.power), 3) * 0.5)) : 0;
  // Tempo interrupt: a Strike into a charged hit at Momentum 4+ cuts in first and wins the edge.
  const interrupted = !breath && foeMove.id === "charge" && canInterrupt(prev.momentum, true, move);
  const banked = interrupted ? prev.momentum - INTERRUPT_COST : prev.momentum;
  const wins = interrupted || beats(move.style, foeMove.style);
  let dealt = breath ? counter : baseDamage(move, foeMove, rand, interrupted);
  if (counter) notes.push("Counter off the breath");
  if (interrupted) notes.push("Interrupt");
  // Ultimate (full Momentum) beats Burst on the same swing; both need a won edge.
  const ultimate = !breath && canUltimate(banked, move) && wins;
  const burst = !ultimate && !breath && banked >= BURST_COST && wins;
  if (ultimate) {
    dealt = Math.max(1, Math.round(dealt * ULTIMATE_MULT));
    notes.push("Ultimate");
  } else if (burst) {
    dealt = Math.max(1, Math.round(dealt * BURST_MULT));
    notes.push("Burst");
  }
  if (active && g) {
    if (g.kind === "armor" && state.plates > 0) {
      if (move.style === (g.style ?? "trick")) {
        state.plates -= 1;
        notes.push(state.plates === 0 ? `${g.name} shatters` : `${g.name} cracks`);
        if (state.plates === 0) state.exposed = true;
      } else if (!breath) {
        dealt = Math.max(1, Math.round(dealt * 0.4));
        notes.push(`${g.name} soaks it`);
      }
    }
    if (g.kind === "adapt" && !breath && prev.lastKey === key) {
      dealt = Math.max(1, Math.round(dealt * 0.45));
      notes.push(`Adapted to ${move.name}`);
    }
    if (g.kind === "enrage") dealt = Math.round(dealt * 1.1);
    if (g.kind === "coin" && state.coin === "tails") dealt = Math.round(dealt * 1.2);
    if (g.kind === "swarm" && state.swarm > 0 && move.kind === "area") {
      state.swarm = 0;
      notes.push(`${g.name} scattered`);
    }
    if (g.kind === "regen" && (move.style === (g.style ?? "trick") || move.kind === "status")) {
      if (state.regenBlock === 0) notes.push(`${g.name} stalls`);
      state.regenBlock = 2;
    }
  }
  if (state.exposed && !breath) dealt = Math.round(dealt * 1.2);
  // Statuses: Frost weakens the hitter; Expose and Ward change what the target takes.
  const myMult = outMult(prev.playerStatus) * inMult(prev.foeStatus);
  if (dealt > 0) dealt = Math.max(1, Math.round(dealt * myMult));
  const edge: Edge = breath ? "them" : wins ? "you" : beats(foeMove.style, move.style) ? "them" : "even";
  if (dealt > 0 && edge === "you") {
    const sb = stageBonus(board.stage, move, true);
    if (sb > 1) {
      dealt = Math.max(1, Math.round(dealt * sb));
      notes.push(`${board.stage?.tag ?? "Stage"} boost`);
    }
  }
  // Mix-up combo: three won edges, never the same style twice running, fire a Finisher.
  const combo = advanceCombo(prev.combo, breath ? null : move.style, edge === "you" ? "won" : edge === "even" ? "even" : "lost");
  const finisher = combo.finisher ? finisherDamage(board.playerMoves, myMult) : 0;
  if (finisher) {
    dealt += finisher;
    notes.push("Combo finisher");
  }

  // --- their hit ---
  const dmgMul = board.foeDamage ?? 1;
  let taken = Math.round(baseDamage(foeMove, breath ? BREATH : move, rand) * state.slow * (1 - Math.min(0.4, (board.guard ?? 0) / 100)) * dmgMul);
  if (interrupted) taken = 0;
  else if (breath) taken = Math.max(1, Math.round(taken * 0.8));
  else if (move.kind === "guard") taken = Math.round(taken * 0.8);
  if (taken > 0) taken = Math.max(1, Math.round(taken * outMult(prev.foeStatus) * inMult(prev.playerStatus)));
  if (active && g) {
    if (g.kind === "enrage") taken = Math.round(taken * 1.35);
    if (g.kind === "coin") taken = Math.round(taken * (state.coin === "heads" ? 1.6 : 0.6));
    if (foeMove.id === "charge" && !interrupted) {
      if (move.style === "guard") {
        taken = Math.round(taken * 0.15);
        notes.push(`Braced for ${foeMove.name}`);
      } else notes.push(`${foeMove.name} lands clean`);
    }
  }

  // --- statuses on the foe: Ward is spent by a hit, old ones tick, then this turn's land ---
  const applied: TurnResult["applied"] = [];
  let foeStatus = tickStatuses(spendWard(prev.foeStatus, dealt));
  let playerStatus = prev.playerStatus ?? [];
  const mine = statusOfMove(move);
  const theirs = foeStatusOf(board, foeMove);
  const foeWins = beats(foeMove.style, breath ? "guard" : move.style);
  const myLands = !breath && mine && (edge === "you" || (edge === "even" && move.kind === "status"));
  const theirLands = theirs && (foeWins || (!breath && edge === "even" && foeMove.kind === "status"));
  if (myLands && mine !== "ward") {
    foeStatus = addStatus(foeStatus, mine);
    applied.push({ on: "foe", id: mine });
  }
  if (theirLands && theirs === "ward") {
    foeStatus = addStatus(foeStatus, "ward");
    applied.push({ on: "foe", id: "ward" });
  }
  // Burn ticks at the end of the turn and never lands the knockout: it stops at 1 HP.
  const foeBurn = prev.foeHp - dealt > 1 ? Math.min(burnChip(foeStatus, maxF), prev.foeHp - dealt - 1) : 0;

  let foeHp = Math.max(0, prev.foeHp - dealt - foeBurn);
  let shift: TurnResult["shift"] = null;
  if (foeHp <= 0 && g?.kind === "revive" && !state.revived) {
    state.revived = true;
    foeHp = Math.max(1, Math.round(maxF * 0.4));
    shift = "revive";
    state.phase = 2;
  }
  // A knockout lands first: there is no counter from the floor.
  if (foeHp <= 0) taken = 0;
  let chip = 0;
  if (foeHp > 0 && active && g?.kind === "swarm" && state.swarm > 0) chip = Math.max(1, Math.round(state.swarm * dmgMul));
  let healed = 0;
  if (foeHp > 0 && active && g?.kind === "regen") {
    if (state.regenBlock > 0) state.regenBlock -= 1;
    else {
      healed = Math.min(maxF - foeHp, Math.round(maxF * 0.07));
      foeHp += healed;
    }
  }
  if (!shift && state.phase === 1 && g && g.kind !== "revive" && foeHp > 0 && foeHp <= maxF * (g.at ?? PHASE_AT)) {
    enterPhase(board, state);
    shift = "phase";
  }

  // --- statuses on you ---
  playerStatus = tickStatuses(spendWard(playerStatus, taken));
  let cleansed: StatusId | null = null;
  if (breath) {
    const clean = cleanseOne(playerStatus);
    playerStatus = clean.list;
    cleansed = clean.cleared;
    if (cleansed) notes.push(`Shook off ${STATUSES[cleansed].title}`);
  }
  if (myLands && mine === "ward") {
    playerStatus = addStatus(playerStatus, "ward");
    applied.push({ on: "you", id: "ward" });
  }
  if (theirLands && theirs !== "ward" && foeHp > 0) {
    playerStatus = addStatus(playerStatus, theirs);
    applied.push({ on: "you", id: theirs });
  }
  const myLeft = prev.playerHp - taken - chip;
  const myBurn = foeHp > 0 && myLeft > 1 ? Math.min(burnChip(playerStatus, board.playerHp), myLeft - 1) : 0;
  const playerHp = Math.max(0, prev.playerHp - taken - chip - myBurn);
  // Momentum: edge wins bank it; Burst spends; breath never builds.
  let momentum = banked;
  let momentumGain = 0;
  if (ultimate) momentum = Math.max(0, momentum - ULTIMATE_COST);
  else if (burst) momentum = Math.max(0, momentum - BURST_COST);
  if (finisher) momentumGain += FINISHER_MOMENTUM;
  if (!breath && edge === "you") {
    momentumGain += 1;
    if (move.style === "trick" && foeMove.style === "guard" && !interrupted) {
      momentumGain += GUARD_BREAK_BONUS;
      notes.push("Guard break");
    }
  }
  momentum = Math.min(MOMENTUM_CAP, momentum + momentumGain);
  state.foeHp = foeHp;
  state.playerHp = playerHp;
  state.energy = Math.max(0, Math.min(10, prev.energy - (breath ? 0 : (move.energy ?? 1)) + 3 - shockDrain(prev.playerStatus)));
  state.playerStatus = playerStatus;
  state.foeStatus = foeStatus;
  state.combo = combo.chain;
  state.habits = breath ? (prev.habits ?? []) : rememberStyle(prev.habits, move.style);
  if (prev.faked) notes.push("They read your habit");
  state.momentum = momentum;
  state.cool = breath ? tick(prev.cool) : tick(prev.cool, key, move.cooldown ?? 0);
  state.slow = !breath && move.kind === "status" ? 0.75 : 1;
  state.lastStyle = breath ? "guard" : move.style;
  state.lastKey = key;
  state.turns = prev.turns + 1;
  state.done = foeHp <= 0 || playerHp <= 0;
  if (!state.done) commit(board, state, state.lastStyle, rand);
  const burn = { you: myBurn, foe: foeBurn };
  return { state, move, foeMove, dealt, taken, edge, shift, healed, chip, notes, burst: burst || undefined, ultimate: ultimate || undefined, interrupted: interrupted || undefined, momentumGain: momentumGain || undefined, applied, burn, finisher, cleansed, read: !!prev.faked };
}

/** 1 for a win, 0.5 for a double knockout, 0 for a loss. */
export function duelRatio(state: DuelState): number {
  if (state.foeHp <= 0 && state.playerHp <= 0) return 0.5;
  return state.foeHp <= 0 ? 1 : state.playerHp <= 0 ? 0 : 0.5;
}

/** A readable status line for the gimmick, for the fight HUD. Null when nothing is live. */
export function gimmickStatus(board: DuelBoard, state: DuelState): string | null {
  const g = board.gimmick;
  if (!g || state.phase !== 2) return null;
  const breaker = g.style ?? "trick";
  switch (g.kind) {
    case "armor":
      return state.plates > 0 ? `${state.plates} plate${state.plates === 1 ? "" : "s"} left · ${breaker} cracks them` : "Shattered · they take +20%";
    case "swarm":
      return state.swarm > 0 ? `−${state.swarm} a turn · an area move clears it` : "Scattered · no more chip damage";
    case "regen":
      return state.regenBlock > 0 ? `Stalled for ${state.regenBlock} turn${state.regenBlock === 1 ? "" : "s"}` : `Heals each turn · ${breaker} or status stalls it`;
    case "coin":
      return state.coin === "heads" ? "Heads · they hit ×1.6 this turn" : state.coin === "tails" ? "Tails · they're open, hit hard" : "Flipping…";
    case "charge":
      if (state.charge === 0) return interruptReady(board, state) ? "Incoming! Guard, or Strike to interrupt" : "Incoming! Guard or catch a breath";
      return `Big hit in ${state.charge} turn${state.charge === 1 ? "" : "s"}${state.momentum >= INTERRUPT_MIN - 1 ? ` · Momentum ${INTERRUPT_MIN} interrupts it` : ""}`;
    case "adapt":
      return "Repeat a move and it's adapted to";
    case "enrage":
      return "They hit ×1.35, but take more too";
    case "fog":
      return "Some tells are hidden";
    case "feint":
      return "Some tells are lies";
    case "revive":
      return state.revived ? "Back up for the last time" : null;
  }
}
