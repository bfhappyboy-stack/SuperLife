/**
 * Legend kits: battle moves that come from gear and training instead of a power.
 * Batman has no powers, so his six used to be street moves for life. His Utility Belt
 * fills it instead, one gadget at a time as he grows into the cowl (DESIGN §17, Kits).
 *
 * Kit moves are ordinary move defs with a `kit:<legend>` power id. They unlock by age
 * (not mastery), rank up by use like any move, and only the kit's own legend can equip them.
 * Pure data + pure helpers so Arena saved-life fighters get the same six.
 */
import type { MoveDef } from "./moves.catalog";
import type { StatusId } from "./types";

export interface KitMove extends MoveDef {
  /** Age the move joins the belt. */
  minAge: number;
  /** Status override when it wins the edge (see battle.ts). */
  applies?: StatusId | null;
}

export interface KitDef {
  /** Legend preset id. */
  legend: string;
  /** Power-id stand-in used on the move defs (`kit:<legend>`). */
  id: string;
  /** Shelf label, where a power name would go. */
  name: string;
  /** One line on the Moves shelf. */
  blurb: string;
  /** From this age the kit's strongest equipped move is the Ultimate (like mastery 4 on a power). */
  ultimateAge: number;
  moves: KitMove[];
}

const k = (legend: string, m: Omit<KitMove, "powerId" | "minMastery">): KitMove => ({ ...m, powerId: `kit:${legend}`, minMastery: 1 });

export const KITS: KitDef[] = [
  {
    legend: "batman",
    id: "kit:batman",
    name: "Utility Belt",
    blurb: "No powers. Every gadget is a plan you made earlier.",
    ultimateAge: 30,
    moves: [
      k("batman", { id: "belt::keysi", name: "Keysi Guard", blurb: "Elbows high, head tucked, already moving.", minAge: 10, power: 3, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("batman", { id: "belt::batarang", name: "Batarang", blurb: "Thrown from the dark. Back before they look.", minAge: 12, power: 3, style: "strike", kind: "burst", energy: 1, effect: "Wins leave them Exposed.", cooldown: 0, element: "shadow" }),
      k("batman", { id: "belt::smoke", name: "Smoke Pellet", blurb: "Where did he go?", minAge: 14, power: 2, style: "trick", kind: "status", energy: 1, effect: "Their next swing arrives slowed.", cooldown: 1, element: "shadow" }),
      k("batman", { id: "belt::grapnel", name: "Grapnel Swing", blurb: "Up, over, and down on the wrong side of them.", minAge: 18, power: 4, style: "trick", kind: "dash", energy: 2, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "speed" }),
      k("batman", { id: "belt::cape", name: "Armored Cape", blurb: "Kevlar weave. It catches what it can.", minAge: 22, power: 4, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield" }),
      k("batman", { id: "belt::gel", name: "Explosive Gel", blurb: "Planted while you blinked.", minAge: 25, power: 6, style: "strike", kind: "burst", energy: 3, effect: "Wins leave them Burning.", cooldown: 1, element: "fire" }),
      k("batman", { id: "belt::detective", name: "Detective Mode", blurb: "You saw this coming three moves ago.", minAge: 28, power: 4, style: "trick", kind: "status", energy: 2, effect: "Shocks them: their tells can't lie.", cooldown: 1, element: "psychic", applies: "shock" }),
      k("batman", { id: "belt::vengeance", name: "I Am Vengeance", blurb: "The cape opens. The room goes quiet.", minAge: 32, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Exposed.", cooldown: 1, element: "shadow" }),
    ],
  },
];

const BY_LEGEND = new Map(KITS.map((kit) => [kit.legend, kit]));
const BY_ID = new Map(KITS.map((kit) => [kit.id, kit]));
const MOVE_INDEX = new Map<string, KitMove>();
for (const kit of KITS) for (const move of kit.moves) MOVE_INDEX.set(move.id, move);

export function kitFor(preset: string | null | undefined): KitDef | null {
  return preset ? (BY_LEGEND.get(preset) ?? null) : null;
}

export function kitById(id: string | null | undefined): KitDef | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}

export function kitMoveById(id: string): KitMove | null {
  return MOVE_INDEX.get(id) ?? null;
}

export function isKitPower(powerId: string | null | undefined): boolean {
  return !!powerId && powerId.startsWith("kit:");
}

/** A kit move is usable when it belongs to this life's legend and the hero is old enough. */
export function kitMoveUnlocked(game: { preset?: string | null; age?: number }, move: KitMove): boolean {
  return kitFor(game.preset)?.id === move.powerId && (game.age ?? 0) >= move.minAge;
}

/** Kit stand-in for mastery: rank 1 under 25, then +1 a decade (35, 45), max 4. */
export function kitRank(age: number): number {
  return 1 + Math.max(0, Math.min(3, Math.floor((age - 15) / 10)));
}

/** Share of power level a kit move gains (powers get 0.55, street moves 0.35). Tuned by engine sims. */
export const KIT_EDGE = 0.25;
