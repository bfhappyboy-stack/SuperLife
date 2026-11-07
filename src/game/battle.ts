/**
 * Shared battle rules (DESIGN §17, Stage 2): status effects, mix-up combos and habit reading.
 * Pure data + pure functions, used by the life-sim duel (`duel.ts`) and Arena (`arena.ts`), so both
 * modes play by one rulebook and online Arena stays a deterministic replay of seed + actions.
 *
 * Statuses ride on elements: a move that WINS the style edge leaves its element's status on the
 * loser (Ward is the exception: it lands on the winner). A move can override with `applies`.
 * Status-kind moves also land their status on an even trade.
 */
import type { DuelMove, MoveStyle, StatusId } from "./types";

export type { StatusId };

export interface StatusDef {
  id: StatusId;
  title: string;
  /** One readable line for the HUD and move cards. */
  blurb: string;
  /** Turns it lasts once applied. */
  turns: number;
  color: string;
  /** Ward helps whoever has it; the rest hurt. */
  good: boolean;
}

export const STATUSES: Record<StatusId, StatusDef> = {
  burn: { id: "burn", title: "Burn", blurb: "Loses 4% max HP a turn (never the knockout)", turns: 2, color: "#ff6a2b", good: false },
  frost: { id: "frost", title: "Frost", blurb: "Hits 15% weaker", turns: 2, color: "#7fd8ff", good: false },
  shock: { id: "shock", title: "Shock", blurb: "Tells can't lie · −1 energy a turn", turns: 2, color: "#ffe14d", good: false },
  expose: { id: "expose", title: "Expose", blurb: "Takes 15% more damage", turns: 2, color: "#d48cff", good: false },
  ward: { id: "ward", title: "Ward", blurb: "Next hit taken −35%", turns: 2, color: "#3fe0c5", good: true },
};

export const STATUS_IDS = Object.keys(STATUSES) as StatusId[];

/** Element → the status its winning hits leave. Force, speed and stretch are pure damage. */
export const ELEMENT_STATUS: Record<string, StatusId | undefined> = {
  fire: "burn",
  ice: "frost",
  wind: "frost",
  lightning: "shock",
  energy: "shock",
  psychic: "expose",
  shadow: "expose",
  warp: "expose",
  light: "expose",
  gravity: "expose",
  arcane: "burn",
  shield: "ward",
  life: "ward",
};

/** Max statuses on one fighter; a new one pushes out the oldest. */
export const STATUS_CAP = 2;
export const BURN_SHARE = 0.04;
export const FROST_MULT = 0.85;
export const EXPOSE_MULT = 1.15;
export const WARD_MULT = 0.65;

export interface StatusInst {
  id: StatusId;
  turns: number;
}

/** The status this move leaves when it lands (null for breath and pure-damage moves). */
export function statusOfMove(move: DuelMove | null | undefined, fallbackElement?: string): StatusId | null {
  if (!move || move.id === "breath") return null;
  if (move.applies !== undefined) return move.applies;
  const el = move.element ?? fallbackElement;
  return (el && ELEMENT_STATUS[el]) || null;
}

export function hasStatus(list: readonly StatusInst[] | undefined, id: StatusId): boolean {
  return !!list?.some((s) => s.id === id && s.turns > 0);
}

/** Apply (or refresh) a status. Refreshing keeps its slot; a third status pushes out the oldest. */
export function addStatus(list: readonly StatusInst[] | undefined, id: StatusId): StatusInst[] {
  const turns = STATUSES[id].turns;
  const cur = [...(list ?? [])];
  const at = cur.findIndex((s) => s.id === id);
  if (at >= 0) {
    cur[at] = { id, turns };
    return cur;
  }
  // Ward burns away Burn when it lands.
  const kept = id === "ward" ? cur.filter((s) => s.id !== "burn") : cur;
  kept.push({ id, turns });
  return kept.slice(-STATUS_CAP);
}

/** One turn passes: every status loses a turn. */
export function tickStatuses(list: readonly StatusInst[] | undefined): StatusInst[] {
  return (list ?? []).map((s) => ({ ...s, turns: s.turns - 1 })).filter((s) => s.turns > 0);
}

/** Breath shakes off the oldest harmful status. */
export function cleanseOne(list: readonly StatusInst[] | undefined): { list: StatusInst[]; cleared: StatusId | null } {
  const cur = [...(list ?? [])];
  const at = cur.findIndex((s) => !STATUSES[s.id].good);
  if (at < 0) return { list: cur, cleared: null };
  const [gone] = cur.splice(at, 1);
  return { list: cur, cleared: gone!.id };
}

/** Multiplier on damage this fighter deals. */
export function outMult(list: readonly StatusInst[] | undefined): number {
  return hasStatus(list, "frost") ? FROST_MULT : 1;
}

/** Multiplier on damage this fighter takes (Ward is spent separately by `spendWard`). */
export function inMult(list: readonly StatusInst[] | undefined): number {
  return (hasStatus(list, "expose") ? EXPOSE_MULT : 1) * (hasStatus(list, "ward") ? WARD_MULT : 1);
}

/** A hit landed: Ward is used up. */
export function spendWard(list: readonly StatusInst[] | undefined, taken: number): StatusInst[] {
  const cur = [...(list ?? [])];
  return taken > 0 ? cur.filter((s) => s.id !== "ward") : cur;
}

export function burnChip(list: readonly StatusInst[] | undefined, maxHp: number): number {
  return hasStatus(list, "burn") ? Math.max(1, Math.round(maxHp * BURN_SHARE)) : 0;
}

/** Energy lost per turn from Shock. */
export function shockDrain(list: readonly StatusInst[] | undefined): number {
  return hasStatus(list, "shock") ? 1 : 0;
}

// ─── Combos ─────────────────────────────────────────────────────────────────────────

/** Land the style edge three times, never the same style twice running (no lost edge or breath between), for a Finisher. */
export const COMBO_LEN = 3;
/** Finisher bonus hit, as a share of your strongest move's power. */
export const FINISHER_SHARE = 0.6;
export const FINISHER_MOMENTUM = 1;

/**
 * Advance a mix-up chain. A won edge adds its style (the same style twice running restarts the chain
 * from it); an even trade holds the chain; a lost edge or a breath drops it. Three links fire a
 * Finisher and the chain starts over.
 */
export function advanceCombo(chain: readonly MoveStyle[] | undefined, style: MoveStyle | null, outcome: "won" | "even" | "lost"): { chain: MoveStyle[]; finisher: boolean } {
  if (outcome === "even" && style) return { chain: [...(chain ?? [])], finisher: false };
  if (outcome !== "won" || !style) return { chain: [], finisher: false };
  const cur = [...(chain ?? [])];
  const next = cur[cur.length - 1] === style ? [style] : [...cur, style];
  if (next.length >= COMBO_LEN) return { chain: [], finisher: true };
  return { chain: next, finisher: false };
}

export function finisherDamage(moves: readonly DuelMove[], mult = 1): number {
  const best = Math.max(3, ...moves.map((m) => m.power));
  return Math.max(1, Math.round(best * FINISHER_SHARE * mult));
}

// ─── Habit reading ──────────────────────────────────────────────────────────────────

/** Recent real-move styles kept for habit reading. */
export const HABIT_MEMORY = 3;

export function rememberStyle(history: readonly MoveStyle[] | undefined, style: MoveStyle): MoveStyle[] {
  return [...(history ?? []), style].slice(-HABIT_MEMORY);
}

/** The style you've thrown twice running (a habit the AI can read), or null. */
export function habitOf(history: readonly MoveStyle[] | undefined): MoveStyle | null {
  const h = history ?? [];
  if (h.length < 2) return null;
  const a = h[h.length - 1]!;
  return h[h.length - 2] === a ? a : null;
}

/** The tell that would bait `habit` again: the style `habit` answers. */
export function baitFor(habit: MoveStyle): MoveStyle {
  // strike → answered by guard; guard → answered by trick; trick → answered by strike.
  if (habit === "guard") return "strike";
  if (habit === "trick") return "guard";
  return "trick";
}

// ─── Stage 3: environment + Ultimates ─────────────────────────────────────────────

/** Momentum spent to fire an Ultimate (full bar). */
export const ULTIMATE_COST = 5;
/** Damage multiplier on an Ultimate hit (does not stack with Burst). */
export const ULTIMATE_MULT = 2;
/** Stage chip: +10% when that element's move wins the edge. */
export const STAGE_EDGE_BONUS = 1.1;

export interface StageTag {
  tag: string;
  element: string;
  blurb: string;
}

/** City → stage chip. Arena uses `arena`. */
export const CITY_STAGE: Record<string, StageTag> = {
  nyc: { tag: "rooftop", element: "force", blurb: "City roof · force +10% on edge" },
  metro: { tag: "rooftop", element: "speed", blurb: "Billboard roof · speed +10% on edge" },
  harbor: { tag: "pier", element: "ice", blurb: "Pier fog · ice +10% on edge" },
  neon: { tag: "alley", element: "energy", blurb: "Neon alley · energy +10% on edge" },
  dust: { tag: "open", element: "fire", blurb: "Open flats · fire +10% on edge" },
  crown: { tag: "throne", element: "arcane", blurb: "Old stone · arcane +10% on edge" },
  hood: { tag: "alley", element: "shadow", blurb: "Corner alley · shadow +10% on edge" },
  stacks: { tag: "lab", element: "energy", blurb: "Corp yard · energy +10% on edge" },
  arena: { tag: "arena", element: "energy", blurb: "Arena lights · energy +10% on edge" },
};

export function stageForCity(cityId: string | null | undefined): StageTag {
  return CITY_STAGE[cityId ?? ""] ?? CITY_STAGE.arena!;
}

/** True when this move is the armed Ultimate and Momentum is full. */
export function canUltimate(momentum: number, move: DuelMove | null | undefined): boolean {
  return !!move?.ultimate && (move.id ?? "") !== "breath" && momentum >= ULTIMATE_COST;
}

/**
 * Mark exactly one Ultimate among a kit. Prefer moves whose id belongs to `focusPowerId`
 * once that power is mastery 4+; otherwise (Arena) mark the strongest non-breath move.
 */
export function markUltimate(
  moves: readonly DuelMove[],
  opts: { focusPowerId?: string | null; masteryRank?: number; forceStrongest?: boolean; focusMoveIds?: readonly string[] } = {},
): DuelMove[] {
  const cleared = moves.map((m) => ({ ...m, ultimate: false }));
  const ready = opts.forceStrongest || ((opts.masteryRank ?? 0) >= 4 && !!opts.focusPowerId);
  if (!ready) return cleared;
  const pool = cleared
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => (m.id ?? "") !== "breath" && !(m.id ?? "").startsWith("street::"));
  let candidates = pool;
  if (!opts.forceStrongest && opts.focusPowerId) {
    const focus = opts.focusPowerId;
    const allowed = new Set(opts.focusMoveIds ?? []);
    const focused = pool.filter(({ m }) => {
      const id = m.id ?? "";
      return allowed.has(id) || id.startsWith(`${focus}::`);
    });
    if (focused.length) candidates = focused;
  }
  if (!candidates.length) return cleared;
  candidates.sort((a, b) => b.m.power - a.m.power || (b.m.energy ?? 0) - (a.m.energy ?? 0));
  const pick = candidates[0]!;
  const out = cleared.map((m) => ({ ...m }));
  out[pick.i] = { ...out[pick.i]!, ultimate: true, energy: Math.max(out[pick.i]!.energy ?? 1, 3) };
  return out;
}

/** Stage element nudge: only on a won style edge. */
export function stageBonus(stage: StageTag | null | undefined, move: DuelMove | null | undefined, wonEdge: boolean): number {
  if (!stage || !move || !wonEdge || move.id === "breath") return 1;
  return move.element === stage.element ? STAGE_EDGE_BONUS : 1;
}
