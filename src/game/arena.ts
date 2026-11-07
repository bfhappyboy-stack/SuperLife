/**
 * Arena: a pure, seeded, deterministic 1v1 versus mode.
 *
 * Match: a snake draft of three fighters each (P1, P2, P2, P1, P1, P2), a secret batting order revealed
 * at once, then three bouts. Each fighter fights exactly once; most bouts won takes the match.
 *
 * Bout: the life-sim duel's rules, made symmetric. Each turn one side LEADS (alternating) and commits a
 * move, showing a tell (its true style, or a feint for 2 energy). The other side sees the tell and
 * ANSWERS. Both hits land at once with the duel's rock-paper-scissors maths (`baseDamage`): strike beats
 * trick, trick beats guard, guard beats strike. Energy, cooldowns, status slow, guard soak and the
 * "catch a breath" counter all work as in the story duel. Since 2026-11-07 pm Arena also shares the
 * life sim's Stage 2 rules (battle.ts): Momentum + Burst + guard break, element statuses and the
 * mix-up Finisher, for both sides.
 *
 * Everything (rng included) lives in plain JSON state, so an online match only needs to sync the two
 * players' actions: both clients replay the same pure functions and land on the same state.
 */
import { BREATH, answerOf, baseDamage, beats, keyOf } from "./duel";
import {
  addStatus,
  advanceCombo,
  burnChip,
  cleanseOne,
  FINISHER_MOMENTUM,
  finisherDamage,
  hasStatus,
  inMult,
  outMult,
  shockDrain,
  spendWard,
  statusOfMove,
  tickStatuses,
  type StatusInst,
} from "./battle";
import { BURST_COST, BURST_MULT, GUARD_BREAK_BONUS, MOMENTUM_CAP } from "./difficulty";
import { ARENA_BY_ID, ARENA_ROSTER, type ArenaFighter, type PassiveKind } from "./arena.roster";
import type { DuelMove, MoveStyle, StatusId } from "./types";

export type Side = 0 | 1;
export const STYLES: MoveStyle[] = ["strike", "trick", "guard"];

/** Arena hits are bigger than story duels so a bout lasts ~6–9 turns on a phone. */
export const ARENA_SCALE = 1.5;
export const START_ENERGY = 7;
export const ENERGY_CAP = 10;
export const ENERGY_REGEN = 3;
export const FEINT_COST = 2;
export const TURN_CAP = 24;
export const DRAFT_ORDER: Side[] = [0, 1, 1, 0, 0, 1];
export const TEAM_SIZE = 3;

// ─── RNG ──────────────────────────────────────────────────────────────────────────

/** mulberry32 step: returns [value in 0..1, next state]. */
export function rngNext(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** A stateful view over a bout's rng for one pure step; read `.state` back when done. */
class Rng {
  state: number;
  constructor(state: number) {
    this.state = state;
  }
  next = (): number => {
    const [v, s] = rngNext(this.state);
    this.state = s;
    return v;
  };
}

export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const ch of parts.join("|")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// ─── Bout ─────────────────────────────────────────────────────────────────────────

export interface FighterState {
  id: string;
  hp: number;
  maxHp: number;
  energy: number;
  cool: Record<string, number>;
  /** Damage multiplier on this fighter's next hit (status moves land 0.75). */
  slow: number;
  plates: number;
  exposed: boolean;
  revived: boolean;
  /** Swarm chip this fighter is taking each turn (0 once cleared). */
  swarmed: number;
  /** Regen blocked for this many more turns. */
  regenBlock: number;
  /** Kinetic energy stored for the next hit. */
  stored: number;
  /** The move key that last hit this fighter (for adapt). */
  lastHitBy: string | null;
  /** Turns this fighter has led (for charge). */
  leads: number;
  dealt: number;
  /** Shared battle rules (optional so a saved pre-Stage-2 bout still loads). */
  momentum?: number;
  status?: StatusInst[];
  combo?: MoveStyle[];
}

/** What one player does on a turn. `feint` only matters for the leader. */
export interface ArenaAction {
  move: string;
  feint?: MoveStyle | null;
}

export interface Tell {
  /** null = hidden by fog. */
  style: MoveStyle | null;
  feint: boolean;
  /** Shown when the leader's next strike is charged. */
  charged: boolean;
}

export interface TurnLog {
  turn: number;
  leader: Side;
  moves: [string, string];
  tell: Tell;
  /** Damage each side DEALT this turn (index = attacker). */
  dealt: [number, number];
  chip: [number, number];
  healed: [number, number];
  edge: Side | null;
  notes: string[];
  revive: Side | null;
  /** Which side spent a Burst this turn. */
  burst?: [boolean, boolean];
  /** Finisher bonus each side landed (0 if none). */
  finisher?: [number, number];
  /** Statuses that landed this turn (`on` = the side that now has it). */
  applied?: { on: Side; id: StatusId }[];
  /** Burn each side took at the end of the turn. */
  burn?: [number, number];
}

export interface BoutState {
  fighters: [FighterState, FighterState];
  turn: number;
  leader: Side;
  rng: number;
  done: boolean;
  winner: Side | null;
  /** How the bout ended. */
  end: "ko" | "time" | "double" | null;
  log: TurnLog[];
  /** Feints each side has thrown / leads, for AI suspicion. */
  feints: [number, number];
  leadsSeen: [number, number];
}

export function fighterOf(id: string): ArenaFighter {
  const f = ARENA_BY_ID[id] ?? customFighters.get(id);
  if (!f) throw new Error(`arena: unknown fighter ${id}`);
  return f;
}

/** Saved-life heroes join the roster at runtime (keyed `life-N`). */
const customFighters = new Map<string, ArenaFighter>();
export function registerFighter(f: ArenaFighter): void {
  customFighters.set(f.id, f);
}

function passiveOf(id: string): PassiveKind {
  return fighterOf(id).passive.kind;
}

function freshFighter(id: string): FighterState {
  const f = fighterOf(id);
  const kind = f.passive.kind;
  return {
    id,
    hp: f.hp,
    maxHp: f.hp,
    energy: START_ENERGY,
    cool: {},
    slow: 1,
    plates: kind === "armor" ? 2 : 0,
    exposed: false,
    revived: false,
    swarmed: 0,
    regenBlock: 0,
    stored: 0,
    lastHitBy: null,
    leads: 0,
    dealt: 0,
    momentum: 0,
    status: [],
    combo: [],
  };
}

export function energyCap(id: string): number {
  return passiveOf(id) === "arc" ? 12 : ENERGY_CAP;
}

export function startBout(a: string, b: string, seed: number, firstLeader: Side = 0): BoutState {
  const fa = freshFighter(a);
  const fb = freshFighter(b);
  // Swarmers start chipping the foe from turn one.
  if (passiveOf(a) === "swarm") fb.swarmed = 3;
  if (passiveOf(b) === "swarm") fa.swarmed = 3;
  // The Flash always gets the first lead (unless both are speedsters).
  let leader = firstLeader;
  const sa = passiveOf(a) === "speedster";
  const sb = passiveOf(b) === "speedster";
  if (sa !== sb) leader = sa ? 0 : 1;
  return { fighters: [fa, fb], turn: 0, leader, rng: seed >>> 0, done: false, winner: null, end: null, log: [], feints: [0, 0], leadsSeen: [0, 0] };
}

export function movesOf(id: string): DuelMove[] {
  return fighterOf(id).moves;
}

export function moveByKey(id: string, key: string): DuelMove {
  if (key === "breath") return BREATH;
  return movesOf(id).find((m) => keyOf(m) === key) ?? BREATH;
}

/** Why a fighter can't use a move right now, or null. */
export function arenaRefusal(fs: FighterState, move: DuelMove, feint?: MoveStyle | null): string | null {
  if (move === BREATH || move.id === "breath") return null;
  const left = fs.cool[keyOf(move)] ?? 0;
  if (left > 0) return `${move.name} is cooling for ${left} more turn${left === 1 ? "" : "s"}.`;
  const cost = (move.energy ?? 1) + feintCost(fs.id, feint, move);
  if (fs.energy < cost) return `${move.name}${feint && feint !== move.style ? " with a feint" : ""} needs ${cost} energy.`;
  return null;
}

export function feintCost(id: string, feint: MoveStyle | null | undefined, move: DuelMove): number {
  if (!feint || feint === move.style) return 0;
  return passiveOf(id) === "feint" ? 0 : FEINT_COST;
}

export function usable(bout: BoutState, side: Side): DuelMove[] {
  const fs = bout.fighters[side];
  return movesOf(fs.id).filter((m) => !arenaRefusal(fs, m));
}

/** Whether the leader's strikes are charged this turn (every third lead). */
export function isCharged(bout: BoutState, side: Side): boolean {
  const fs = bout.fighters[side];
  return passiveOf(fs.id) === "charge" && (fs.leads + 1) % 3 === 0 && bout.leader === side;
}

/**
 * The tell the follower sees for a lead action. Pure in (bout, action): fog uses a hash of the bout's
 * rng and turn, not the rng itself, so both online clients agree without consuming randomness.
 */
export function tellOf(bout: BoutState, action: ArenaAction): Tell {
  const lead = bout.leader;
  const leaderId = bout.fighters[lead].id;
  const followerId = bout.fighters[(1 - lead) as Side].id;
  const move = moveByKey(leaderId, action.move);
  const sense = passiveOf(followerId) === "sense";
  const feinting = !!action.feint && action.feint !== move.style;
  const charged = isCharged(bout, lead);
  if (sense) return { style: move.style, feint: false, charged };
  // A shocked leader can't hide or fake its tell.
  if (hasStatus(bout.fighters[lead].status, "shock")) return { style: move.style, feint: false, charged };
  if (passiveOf(leaderId) === "fog") {
    const [v] = rngNext(hashSeed(bout.rng, bout.turn, "fog"));
    if (v < 0.4) return { style: null, feint: false, charged };
  }
  return { style: feinting ? action.feint! : move.style, feint: feinting, charged };
}

function tick(cool: Record<string, number>, used?: string, setTo?: number): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(cool)) if (v - 1 > 0 && k !== used) next[k] = v - 1;
  if (used && setTo && setTo > 0) next[used] = setTo;
  return next;
}

/** Damage `atk` deals to `def` this turn, with every passive applied. Mutates the states it owns. */
function hit(
  bout: BoutState,
  atkSide: Side,
  me: FighterState,
  them: FighterState,
  move: DuelMove,
  other: DuelMove,
  rand: () => number,
  notes: string[],
  extra = 1,
): number {
  const breath = move === BREATH;
  const mine = passiveOf(me.id);
  const theirs = passiveOf(them.id);
  const fighter = fighterOf(me.id);
  let dmg: number;
  if (breath) {
    // A breath is a guard stance: read a strike and it turns into a small counter.
    dmg = beats("guard", other.style) ? Math.max(1, Math.round(Math.max(...fighter.moves.map((m) => m.power), 3) * 0.5)) : 0;
    if (dmg) notes.push(`${fighter.name} counters off the breath`);
  } else dmg = baseDamage(move, other, rand);
  if (!dmg) return 0;
  let mult = ARENA_SCALE * me.slow * (breath ? 1 : extra);
  // Attacker passives.
  if (!breath) {
    if (mine === "rage") mult *= 1 + 0.4 * (1 - me.hp / me.maxHp);
    if (mine === "enrage" && me.hp <= me.maxHp / 2) mult *= 1.25;
    if (mine === "bracers" && move.style === "guard") mult *= 1.3;
    if (mine === "worthy" && move.kind === "area") mult *= 1.25;
    if (mine === "speedster" && move.kind === "dash") mult *= 1.25;
    if (mine === "charge" && bout.leader === atkSide && move.style === "strike" && (me.leads + 1) % 3 === 0) {
      mult *= 1.5;
      notes.push(`${fighter.name}'s ${fighter.passive.name} hits charged`);
    }
  }
  // Defender passives.
  const key = breath ? "breath" : keyOf(move);
  if (theirs === "armor" && them.plates > 0 && !breath) {
    if (beats(move.style, other.style)) {
      them.plates -= 1;
      notes.push(them.plates === 0 ? `${fighterOf(them.id).passive.name} shatters` : `${fighterOf(them.id).passive.name} cracks`);
      if (them.plates === 0) them.exposed = true;
    } else mult *= 0.55;
  }
  if (them.exposed) mult *= 1.15;
  if (theirs === "adapt" && !breath && them.lastHitBy === key) {
    mult *= 0.5;
    notes.push(`${fighterOf(them.id).name} adapted to ${move.name}`);
  }
  if (theirs === "enrage" && them.hp <= them.maxHp / 2) mult *= 1.15;
  if (theirs === "steel" && move.style === "strike") mult *= 0.85;
  if (other === BREATH) mult *= 0.8;
  else if (other.kind === "guard") mult *= theirs === "bulwark" ? 0.6 : 0.8;
  let out = Math.max(1, Math.round(dmg * mult));
  if (mine === "kinetic" && me.stored > 0 && !breath) {
    out += me.stored;
    notes.push(`${fighter.name} releases ${me.stored} stored kinetic energy`);
    me.stored = 0;
  }
  if (!breath) them.lastHitBy = key;
  if (theirs === "regen" && !breath && (move.style === "trick" || move.kind === "status")) them.regenBlock = 2;
  return out;
}

/**
 * Play one turn. `actions[side]` is that side's action; the leader's `feint` sets its tell.
 * Illegal actions fall back to catching a breath, so a desynced or malicious client can't break state.
 */
export function playArenaTurn(prev: BoutState, actions: [ArenaAction, ArenaAction]): BoutState {
  if (prev.done) return prev;
  const rng = new Rng(prev.rng);
  const fighters: [FighterState, FighterState] = [
    { ...prev.fighters[0], cool: { ...prev.fighters[0].cool } },
    { ...prev.fighters[1], cool: { ...prev.fighters[1].cool } },
  ];
  const lead = prev.leader;
  const notes: string[] = [];
  const pick = (side: Side): { move: DuelMove; feint: MoveStyle | null } => {
    const fs = fighters[side];
    const a = actions[side];
    let move = moveByKey(fs.id, a.move);
    let feint = side === lead && a.feint && a.feint !== move.style && !hasStatus(fs.status, "shock") ? a.feint : null;
    if (arenaRefusal(fs, move, feint)) {
      if (feint && !arenaRefusal(fs, move)) feint = null;
      else {
        move = BREATH;
        feint = null;
      }
    }
    return { move, feint };
  };
  const p0 = pick(0);
  const p1 = pick(1);
  const moves: [DuelMove, DuelMove] = [p0.move, p1.move];
  const tell = tellOf(prev, { move: keyOf(moves[lead]) === "breath" ? "breath" : keyOf(moves[lead]), feint: lead === 0 ? p0.feint : p1.feint });

  // Shared rules: the edge decides Bursts, combos and statuses (breath stands as a guard).
  const styleOf = (m: DuelMove): MoveStyle => (m === BREATH ? "guard" : m.style);
  const edgeNow: Side | null = beats(styleOf(moves[0]), styleOf(moves[1])) ? 0 : beats(styleOf(moves[1]), styleOf(moves[0])) ? 1 : null;
  const burst: [boolean, boolean] = [false, false];
  const mult: [number, number] = [1, 1];
  for (const s of [0, 1] as Side[]) {
    const me = fighters[s];
    const them = fighters[(1 - s) as Side];
    burst[s] = moves[s] !== BREATH && edgeNow === s && (me.momentum ?? 0) >= BURST_COST;
    mult[s] = (burst[s] ? BURST_MULT : 1) * outMult(me.status) * inMult(them.status);
    if (burst[s]) notes.push(`${fighterOf(me.id).name} Bursts`);
  }
  const combos = ([0, 1] as Side[]).map((s) =>
    advanceCombo(fighters[s].combo, moves[s] === BREATH ? null : moves[s].style, moves[s] === BREATH ? "lost" : edgeNow === s ? "won" : edgeNow === null ? "even" : "lost"),
  );
  const dealt: [number, number] = [0, 0];
  dealt[0] = hit(prev, 0, fighters[0], fighters[1], moves[0], moves[1], rng.next, notes, mult[0]);
  dealt[1] = hit(prev, 1, fighters[1], fighters[0], moves[1], moves[0], rng.next, notes, mult[1]);
  const finisher: [number, number] = [0, 0];
  for (const s of [0, 1] as Side[]) {
    if (!combos[s]!.finisher) continue;
    finisher[s] = finisherDamage(fighterOf(fighters[s].id).moves, ARENA_SCALE * outMult(fighters[s].status) * inMult(fighters[(1 - s) as Side].status));
    dealt[s] += finisher[s];
    notes.push(`${fighterOf(fighters[s].id).name} lands a combo finisher`);
  }
  // Swarm is scattered by an area move.
  for (const s of [0, 1] as Side[]) {
    if (fighters[s].swarmed > 0 && moves[s].kind === "area") {
      fighters[s].swarmed = 0;
      notes.push(`${fighterOf(fighters[s].id).name} scatters the ${fighterOf(fighters[(1 - s) as Side].id).passive.name}`);
    }
  }
  const chip: [number, number] = [fighters[0].swarmed, fighters[1].swarmed];
  const healed: [number, number] = [0, 0];
  let revive: Side | null = null;
  for (const s of [0, 1] as Side[]) {
    const me = fighters[s];
    const o = (1 - s) as Side;
    const taken = dealt[o] + chip[s];
    if (passiveOf(me.id) === "kinetic") me.stored = Math.min(14, me.stored + Math.round(dealt[o] * 0.25));
    me.hp = Math.max(0, me.hp - taken);
    fighters[o].dealt += dealt[o];
    if (me.hp <= 0 && passiveOf(me.id) === "revive" && !me.revived) {
      me.revived = true;
      me.hp = Math.round(me.maxHp * 0.3);
      revive = s;
      notes.push(`${fighterOf(me.id).name} reboots in a ${fighterOf(me.id).passive.name.toLowerCase()}`);
    }
    if (me.hp > 0 && passiveOf(me.id) === "regen") {
      if (me.regenBlock > 0) me.regenBlock -= 1;
      else {
        healed[s] = Math.min(me.maxHp - me.hp, Math.round(me.maxHp * 0.05));
        me.hp += healed[s];
      }
    }
  }
  // Statuses: Ward is spent by a hit, old ones tick, breath shakes one off, then this turn's land.
  const applied: { on: Side; id: StatusId }[] = [];
  const nextStatus: [StatusInst[], StatusInst[]] = [[], []];
  for (const s of [0, 1] as Side[]) {
    let list = tickStatuses(spendWard(fighters[s].status, dealt[(1 - s) as Side]));
    if (moves[s] === BREATH) {
      const clean = cleanseOne(list);
      list = clean.list;
      if (clean.cleared) notes.push(`${fighterOf(fighters[s].id).name} shakes off ${clean.cleared}`);
    }
    nextStatus[s] = list;
  }
  for (const s of [0, 1] as Side[]) {
    const m = moves[s];
    const st = statusOfMove(m);
    if (!st || (edgeNow !== s && !(edgeNow === null && m.kind === "status"))) continue;
    const on = st === "ward" ? s : ((1 - s) as Side);
    nextStatus[on] = addStatus(nextStatus[on], st);
    applied.push({ on, id: st });
  }
  const burn: [number, number] = [0, 0];
  for (const s of [0, 1] as Side[]) {
    const me = fighters[s];
    me.status = nextStatus[s];
    if (me.hp > 0 && fighters[(1 - s) as Side].hp > 0) {
      // Burn never lands the knockout: it stops at 1 HP.
      burn[s] = Math.min(burnChip(me.status, me.maxHp), me.hp - 1);
      me.hp -= burn[s];
    }
  }
  // Momentum: edge wins bank it (+1 more for a guard break and a finisher); a Burst spends 3.
  for (const s of [0, 1] as Side[]) {
    const me = fighters[s];
    let mo = (me.momentum ?? 0) - (burst[s] ? BURST_COST : 0);
    if (edgeNow === s && moves[s] !== BREATH) {
      mo += 1;
      if (moves[s].style === "trick" && styleOf(moves[(1 - s) as Side]) === "guard") mo += GUARD_BREAK_BONUS;
    }
    if (finisher[s]) mo += FINISHER_MOMENTUM;
    me.momentum = Math.max(0, Math.min(MOMENTUM_CAP, mo));
    me.combo = combos[s]!.chain;
  }

  // Energy, cooldowns, slow.
  for (const s of [0, 1] as Side[]) {
    const me = fighters[s];
    const m = moves[s];
    const breath = m === BREATH;
    const feint = s === 0 ? p0.feint : p1.feint;
    const spent = breath ? 0 : (m.energy ?? 1) + feintCost(me.id, feint, m);
    let gain = ENERGY_REGEN - shockDrain(prev.fighters[s].status);
    const kind = passiveOf(me.id);
    if (kind === "prep") gain += 1;
    if (kind === "arc" && (breath || m.kind === "guard")) gain += 1;
    me.energy = Math.max(0, Math.min(energyCap(me.id), me.energy - spent + gain));
    me.cool = breath ? tick(me.cool) : tick(me.cool, keyOf(m), m.cooldown ?? 0);
    // A status move slows the OTHER side's next hit.
    fighters[(1 - s) as Side].slow = !breath && m.kind === "status" ? 0.75 : 1;
  }
  fighters[lead].leads += 1;
  const edge: Side | null = beats(moves[0].style, moves[1].style) ? 0 : beats(moves[1].style, moves[0].style) ? 1 : null;
  const feints: [number, number] = [...prev.feints];
  if (tell.feint) feints[lead] += 1;
  const leadsSeen: [number, number] = [...prev.leadsSeen];
  leadsSeen[lead] += 1;
  const turn = prev.turn + 1;
  const log: TurnLog = {
    turn,
    leader: lead,
    moves: [keyOf(moves[0]) || "breath", keyOf(moves[1]) || "breath"].map((k, i) => (moves[i] === BREATH ? "breath" : k)) as [string, string],
    tell,
    dealt,
    chip,
    healed,
    edge,
    notes,
    revive,
    burst,
    finisher,
    applied,
    burn,
  };
  let done = false;
  let winner: Side | null = null;
  let end: BoutState["end"] = null;
  const k0 = fighters[0].hp <= 0;
  const k1 = fighters[1].hp <= 0;
  if (k0 || k1) {
    done = true;
    end = "ko";
    if (k0 && k1) {
      end = "double";
      // Both down: the bigger hit this turn wins it; dead level goes to whoever did more all bout.
      winner = dealt[0] !== dealt[1] ? (dealt[0] > dealt[1] ? 0 : 1) : fighters[0].dealt >= fighters[1].dealt ? 0 : 1;
    } else winner = k0 ? 1 : 0;
  } else if (turn >= TURN_CAP) {
    done = true;
    end = "time";
    const r0 = fighters[0].hp / fighters[0].maxHp;
    const r1 = fighters[1].hp / fighters[1].maxHp;
    winner = r0 === r1 ? (fighters[0].dealt >= fighters[1].dealt ? 0 : 1) : r0 > r1 ? 0 : 1;
  }
  return {
    fighters,
    turn,
    leader: (1 - lead) as Side,
    rng: rng.state,
    done,
    winner,
    end,
    log: [...prev.log, log],
    feints,
    leadsSeen,
  };
}

// ─── AI ───────────────────────────────────────────────────────────────────────────

export type AiLevel = "rookie" | "pro" | "legend";
const SKILL: Record<AiLevel, number> = { rookie: 0.45, pro: 0.75, legend: 0.92 };
/**
 * How each level plays the mind game. `feintTax` makes feints less tempting (a Rookie almost
 * never bluffs); `read` is how much of a tell the AI actually uses when it answers (the rest is
 * a guess), so a Rookie can be out-read by anyone who follows the Answer hints.
 */
const PERSONA: Record<AiLevel, { feintTax: number; read: number }> = {
  rookie: { feintTax: 9, read: 0.1 },
  pro: { feintTax: 5, read: 0.25 },
  legend: { feintTax: 1.5, read: 0.7 },
};

function styleOdds(bout: BoutState, viewer: Side, tell: Tell | null): Record<MoveStyle, number> {
  const opp = (1 - viewer) as Side;
  const oppMoves = usable(bout, opp);
  const base: Record<MoveStyle, number> = { strike: 0.05, trick: 0.05, guard: 0.05 };
  for (const m of oppMoves) base[m.style] += 1;
  base.guard += 0.6; // breath is always open
  if (!tell || tell.style === null) {
    const sum = base.strike + base.trick + base.guard;
    return { strike: base.strike / sum, trick: base.trick / sum, guard: base.guard / sum };
  }
  // Suspicion: how often this opponent has feinted so far, with a prior.
  const rate = (bout.feints[opp] + 1) / (bout.leadsSeen[opp] + 5);
  const trust = passiveOf(bout.fighters[viewer].id) === "sense" ? 1 : Math.max(0.45, 1 - rate * 1.6);
  const out: Record<MoveStyle, number> = { strike: 0, trick: 0, guard: 0 };
  for (const s of STYLES) out[s] = s === tell.style ? trust : (1 - trust) / 2;
  return out;
}

function avgPower(bout: BoutState, side: Side, style: MoveStyle): number {
  const ms = usable(bout, side).filter((m) => m.style === style);
  if (!ms.length) return style === "guard" ? 2 : 0;
  return ms.reduce((a, m) => a + m.power, 0) / ms.length;
}

const STYLE_DUMMY: Record<MoveStyle, DuelMove> = {
  strike: { name: "", blurb: "", power: 1, style: "strike" },
  trick: { name: "", blurb: "", power: 1, style: "trick" },
  guard: { name: "", blurb: "", power: 1, style: "guard" },
};

function rawMod(move: DuelMove, vs: MoveStyle): number {
  let mod = beats(move.style, vs) ? 1.55 : beats(vs, move.style) ? 0.68 : 1;
  if (move.kind === "area") mod *= 1.12;
  if (move.kind === "dash" && beats(move.style, vs)) mod *= 1.15;
  return mod;
}

/** Rough value of throwing `move` against an opponent whose style odds are `odds`. */
function moveValue(bout: BoutState, side: Side, move: DuelMove, odds: Record<MoveStyle, number>): number {
  const opp = (1 - side) as Side;
  const me = bout.fighters[side];
  const them = bout.fighters[opp];
  const breath = move === BREATH;
  let v = 0;
  for (const s of STYLES) {
    const p = odds[s];
    if (!p) continue;
    let mine = breath ? (beats("guard", s) ? 4 : 0) : move.power * rawMod(move, s);
    // A banked Burst makes a winning hit worth more.
    if (!breath && beats(move.style, s) && (me.momentum ?? 0) >= BURST_COST) mine *= BURST_MULT;
    const theirsPow = avgPower(bout, opp, s);
    let theirs = theirsPow * rawMod({ ...STYLE_DUMMY[s], power: 1 }, breath ? "guard" : move.style);
    if (breath) theirs *= 0.8;
    else if (move.kind === "guard") theirs *= 0.8;
    v += p * (mine - theirs * 0.9);
  }
  if (!breath) {
    // Energy is a resource: pricey moves must earn it; keep enough for next turn.
    v -= (move.energy ?? 1) * 0.55;
    if (move.kind === "status") v += 2.2;
    const st = statusOfMove(move);
    if (st && st !== "ward" && !hasStatus(them.status, st)) v += 0.8;
    if (move.kind === "area" && me.swarmed > 0) v += 4;
    if (passiveOf(them.id) === "adapt" && them.lastHitBy === keyOf(move)) v -= move.power * 0.5;
    if (passiveOf(them.id) === "regen" && (move.style === "trick" || move.kind === "status")) v += 1.5;
  } else {
    v += me.energy <= 3 ? 3 : me.energy <= 5 ? 0.5 : -3;
  }
  return v;
}

function weighted<T>(items: T[], score: (t: T) => number, skill: number, rand: () => number): T {
  // Softmax with a temperature from skill: high skill = sharp choices.
  const temp = 0.6 + (1 - skill) * 5;
  const scores = items.map(score);
  const max = Math.max(...scores);
  const w = scores.map((s) => Math.exp((s - max) / temp));
  const sum = w.reduce((a, b) => a + b, 0);
  let r = rand() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= w[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

/** The AI's lead: a move, sometimes behind a feint that baits the wrong answer. */
export function aiLead(bout: BoutState, side: Side, level: AiLevel, rand: () => number): ArenaAction {
  const skill = SKILL[level];
  const fs = bout.fighters[side];
  const oppSense = passiveOf(bout.fighters[(1 - side) as Side].id) === "sense" || hasStatus(fs.status, "shock");
  type Opt = { move: DuelMove; feint: MoveStyle | null };
  const opts: Opt[] = [{ move: BREATH, feint: null }];
  for (const m of usable(bout, side)) {
    opts.push({ move: m, feint: null });
    if (!oppSense)
      for (const s of STYLES) if (s !== m.style && !arenaRefusal(fs, m, s)) opts.push({ move: m, feint: s });
  }
  // A follower answers the shown style ~70% of the time.
  const value = (o: Opt): number => {
    const shown = o.feint ?? o.move.style;
    const answer = answerOf(shown);
    const odds: Record<MoveStyle, number> = { strike: 0.15, trick: 0.15, guard: 0.15 };
    odds[answer] += 0.55;
    let v = moveValue(bout, side, o.move, odds);
    if (o.feint) v -= feintCost(fs.id, o.feint, o.move) * 0.6 + 0.8 + PERSONA[level].feintTax;
    if (isCharged(bout, side) && o.move.style === "strike") v += 3;
    return v;
  };
  const o = weighted(opts, value, skill, rand);
  return { move: o.move === BREATH ? "breath" : keyOf(o.move), feint: o.feint };
}

/** The AI's answer to a tell. */
export function aiFollow(bout: BoutState, side: Side, tell: Tell, level: AiLevel, rand: () => number): ArenaAction {
  const skill = SKILL[level];
  const read = PERSONA[level].read;
  const seen = styleOdds(bout, side, tell);
  const blind = styleOdds(bout, side, null);
  const odds = { strike: 0, trick: 0, guard: 0 } as Record<MoveStyle, number>;
  for (const s of STYLES) odds[s] = seen[s] * read + blind[s] * (1 - read);
  const opts: DuelMove[] = [BREATH, ...usable(bout, side)];
  const m = weighted(opts, (mv) => moveValue(bout, side, mv, odds) + (tell.charged && mv.style === "guard" ? 3 : 0), skill, rand);
  return { move: m === BREATH ? "breath" : keyOf(m) };
}

// ─── Match ────────────────────────────────────────────────────────────────────────

export type MatchStage = "draft" | "order" | "bout" | "done";

export interface ArenaMatch {
  seed: number;
  stage: MatchStage;
  /** Fighters each side has drafted, in pick order. */
  picks: [string[], string[]];
  /** Secret fight order (null until locked). */
  orders: [string[] | null, string[] | null];
  round: number;
  bout: BoutState | null;
  /** Winner of each finished bout. */
  results: (Side | null)[];
  /** HP% each side had left in each finished bout (tiebreak and results screen). */
  margins: [number, number][];
  winner: Side | null;
  /** Fighter ids allowed in this match. */
  pool: string[];
}

export function newMatch(seed: number, pool: string[] = ARENA_ROSTER.map((f) => f.id)): ArenaMatch {
  return { seed: seed >>> 0, stage: "draft", picks: [[], []], orders: [null, null], round: 0, bout: null, results: [], margins: [], winner: null, pool };
}

export function draftTurn(m: ArenaMatch): Side | null {
  const n = m.picks[0].length + m.picks[1].length;
  return m.stage === "draft" && n < DRAFT_ORDER.length ? DRAFT_ORDER[n]! : null;
}

export function taken(m: ArenaMatch): Set<string> {
  return new Set([...m.picks[0], ...m.picks[1]]);
}

export function draftPick(m: ArenaMatch, side: Side, id: string): ArenaMatch {
  if (draftTurn(m) !== side) throw new Error("arena: not your pick");
  if (!m.pool.includes(id) || taken(m).has(id)) throw new Error(`arena: ${id} is not available`);
  const picks: [string[], string[]] = [[...m.picks[0]], [...m.picks[1]]];
  picks[side].push(id);
  const full = picks[0].length + picks[1].length >= DRAFT_ORDER.length;
  return { ...m, picks, stage: full ? "order" : "draft" };
}

export function setOrder(m: ArenaMatch, side: Side, order: string[]): ArenaMatch {
  if (m.stage !== "order") throw new Error("arena: not ordering");
  const mine = m.picks[side];
  if (order.length !== TEAM_SIZE || new Set(order).size !== TEAM_SIZE || order.some((id) => !mine.includes(id))) throw new Error("arena: bad order");
  const orders: [string[] | null, string[] | null] = [m.orders[0], m.orders[1]];
  orders[side] = [...order];
  if (orders[0] && orders[1]) return startRound({ ...m, orders }, 0);
  return { ...m, orders };
}

function startRound(m: ArenaMatch, round: number): ArenaMatch {
  const a = m.orders[0]![round]!;
  const b = m.orders[1]![round]!;
  // Alternate who leads first each round; round 1 is a coin from the seed.
  const coin = (hashSeed(m.seed, "first") & 1) as Side;
  const first = ((coin + round) % 2) as Side;
  return { ...m, stage: "bout", round, bout: startBout(a, b, hashSeed(m.seed, "round", round), first) };
}

/** Advance the current bout by one turn; finishes the bout/match when it ends. */
export function matchTurn(m: ArenaMatch, actions: [ArenaAction, ArenaAction]): ArenaMatch {
  if (m.stage !== "bout" || !m.bout) return m;
  const bout = playArenaTurn(m.bout, actions);
  return { ...m, bout };
}

export function roundsWon(m: ArenaMatch): [number, number] {
  return [m.results.filter((r) => r === 0).length, m.results.filter((r) => r === 1).length];
}

/** After a bout ends, record it and either start the next round or finish. */
export function nextRound(m: ArenaMatch): ArenaMatch {
  if (m.stage !== "bout" || !m.bout?.done) return m;
  const b = m.bout;
  const results = [...m.results, b.winner];
  const margins: [number, number][] = [...m.margins, [b.fighters[0].hp / b.fighters[0].maxHp, b.fighters[1].hp / b.fighters[1].maxHp]];
  const done = { ...m, results, margins };
  if (results.length >= TEAM_SIZE) return finish(done);
  return startRound(done, m.round + 1);
}

/** Skip the dead round once the match is clinched (2–0). */
export function clinched(m: ArenaMatch): boolean {
  const [a, b] = roundsWon(m);
  return a >= 2 || b >= 2;
}

export function finish(m: ArenaMatch): ArenaMatch {
  const [a, b] = roundsWon(m);
  let winner: Side;
  if (a !== b) winner = a > b ? 0 : 1;
  else {
    const hp = m.margins.reduce((acc, [x, y]) => acc + x - y, 0);
    winner = hp >= 0 ? 0 : 1;
  }
  return { ...m, stage: "done", winner, bout: m.bout };
}

/** AI draft: best available by a matchup-aware value, with skill noise. */
export function aiDraft(m: ArenaMatch, side: Side, level: AiLevel, rand: () => number): string {
  const t = taken(m);
  const left = m.pool.filter((id) => !t.has(id));
  const theirs = m.picks[(1 - side) as Side];
  const rating = (id: string): number => {
    const f = fighterOf(id);
    let v = (TIER[id] ?? 0.5) * 10;
    // Counter-picks: armour hates strike-heavy teams' style; fog is useless vs Spider-Sense, etc.
    if (f.passive.kind === "fog" && theirs.includes("spider-man")) v -= 2;
    if (f.passive.kind === "swarm" && theirs.some((o) => fighterOf(o).moves.some((x) => x.kind === "area"))) v -= 0.5;
    return v;
  };
  return weighted(left, rating, SKILL[level], rand);
}

/** AI order: random but stable from the seed (the order is a blind guess anyway). */
export function aiOrder(m: ArenaMatch, side: Side, rand: () => number): string[] {
  const team = [...m.picks[side]];
  for (let i = team.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [team[i], team[j]] = [team[j]!, team[i]!];
  }
  return team;
}

/** Win rates from the balance sim (filled by the tuning pass; 0.5 = average). */
export const TIER: Record<string, number> = {
  // Re-run 2026-11-07 pm with the shared Stage 2 rules (Momentum, statuses, Finisher).
  thor: 0.574, ultron: 0.551, loki: 0.551, "red-skull": 0.539, "spider-man": 0.527, "captain-america": 0.527, ock: 0.521,
  zod: 0.521, batman: 0.515, joker: 0.515, stane: 0.515, "wonder-woman": 0.512, goblin: 0.512, lex: 0.506, killmonger: 0.506,
  "reverse-flash": 0.5, wolverine: 0.497, hela: 0.494, superman: 0.488, "iron-man": 0.485, "black-panther": 0.482, bane: 0.473,
  abomination: 0.47, doomsday: 0.47, sabretooth: 0.467, hulk: 0.464, flash: 0.455, venom: 0.449, cheetah: 0.414,
};

/** Run a whole bout AI vs AI (for sims and tests). */
export function simBout(a: string, b: string, seed: number, level: AiLevel = "pro", first: Side = 0): BoutState {
  let bout = startBout(a, b, seed, first);
  const ai = new Rng(hashSeed(seed, "ai"));
  while (!bout.done) {
    const lead = bout.leader;
    const la = aiLead(bout, lead, level, ai.next);
    const tell = tellOf(bout, la);
    const fa = aiFollow(bout, (1 - lead) as Side, tell, level, ai.next);
    bout = playArenaTurn(bout, lead === 0 ? [la, fa] : [fa, la]);
  }
  return bout;
}
