/**
 * Legend kits: battle moves that come from gear and training instead of a power.
 * Batman has no powers, so his six used to be street moves for life. His Utility Belt
 * fills it instead, one gadget at a time as he grows into the cowl (DESIGN §17, Kits).
 * Iron Man's Armory does the same for a suit that is built, not born, and Spider-Man's
 * web-shooters take over every guard his powers would have given him.
 *
 * Kit moves are ordinary move defs with a `kit:<legend>` power id. They unlock by age
 * (not mastery), rank up by use like any move, and only the kit's own legend can equip them.
 * A piece can `upgrade` an older one (Mark I Plating → Nanotech Shell): once the new piece
 * arrives the old one retires and the new one takes its slot. A kit can also `replace` the
 * moves a legend's powers would give (by power or by style) so the gear is the only source.
 * Pure data + pure helpers so Arena saved-life fighters get the same six.
 */
import type { MoveDef } from "./moves.catalog";
import type { MoveStyle, StatusId } from "./types";

export interface KitMove extends MoveDef {
  /** Age the move joins the kit. */
  minAge: number;
  /** Status override when it wins the edge (see battle.ts). */
  applies?: StatusId | null;
  /** Kit move id this piece supersedes. The old piece retires and this one takes its slot. */
  upgrades?: string;
}

export interface KitReplaces {
  /** Power moves from these powers never reach the six for this legend. */
  powers?: string[];
  /** Power moves of these styles never reach the six for this legend. */
  styles?: MoveStyle[];
  /** Why, for the shelf. */
  line: string;
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
  /**
   * From this age the kit's strongest equipped move is the Ultimate (like mastery 4 on a power).
   * Null: the kit never arms one; the legend's power Ultimate stands.
   */
  ultimateAge: number | null;
  /** The kit's Ultimate beats the power's even when the legend has powers (Iron Man's Unibeam). */
  leadsUltimate?: boolean;
  /** Power moves this kit stands in for. */
  replaces?: KitReplaces;
  /** Share of power level the kit's moves gain (default KIT_EDGE). Tuned by engine sims. */
  edge?: number;
  /** What one piece is called in banners ("gadget", "suit piece"). */
  piece: string;
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
    piece: "gadget",
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
  {
    legend: "iron-man",
    id: "kit:iron-man",
    name: "Armory",
    blurb: "Built in a garage, then a cave, then a tower. Every Mark replaces the last.",
    ultimateAge: 30,
    leadsUltimate: true,
    replaces: { powers: ["energy-projection", "flight"], line: "The suit does this now: repulsors and jets come from the Armory." },
    edge: 0.4,
    piece: "suit piece",
    moves: [
      k("iron-man", { id: "armory::tincan", name: "Tin-Can Shield", blurb: "A welded hubcap and a lot of confidence.", minAge: 10, power: 3, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("iron-man", { id: "armory::pulse", name: "Pulse Glove", blurb: "A palm repulsor bolted to a welding glove. Mostly works.", minAge: 12, power: 4, style: "strike", kind: "burst", energy: 1, effect: "Wins leave them Shocked.", cooldown: 0, element: "energy" }),
      k("iron-man", { id: "armory::flare", name: "Flash Flare", blurb: "Bright enough to buy a second. A second is plenty.", minAge: 14, power: 3, style: "trick", kind: "status", energy: 1, effect: "Wins leave them Exposed.", cooldown: 1, element: "light" }),
      k("iron-man", { id: "armory::taser", name: "Arc Taser", blurb: "MIT dorm project. Not cleared by MIT.", minAge: 17, power: 3, style: "trick", kind: "status", energy: 1, effect: "Shocks them: their tells can't lie.", cooldown: 1, element: "lightning" }),
      k("iron-man", { id: "armory::reactor", name: "Chest Reactor", blurb: "The arc reactor, overclocked. It runs hot.", minAge: 20, power: 4, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Shocked.", cooldown: 1, element: "energy" }),
      k("iron-man", { id: "armory::mark1", name: "Mark I Plating", blurb: "Cave-built, bolted, ugly. It holds.", minAge: 22, power: 4, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "armory::tincan" }),
      k("iron-man", { id: "armory::flamer", name: "Mark I Flamethrower", blurb: "Scrap, fuel and a very bad day for the guards.", minAge: 22, power: 5, style: "strike", kind: "area", energy: 2, effect: "Hits wide. Wins leave them Burning.", cooldown: 1, element: "fire" }),
      k("iron-man", { id: "armory::repulsor", name: "Repulsor Blast", blurb: "Palm up. The hum, then the light.", minAge: 24, power: 5, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Shocked.", cooldown: 0, element: "energy", upgrades: "armory::pulse" }),
      k("iron-man", { id: "armory::jets", name: "Boot Jets", blurb: "Up, over, and down behind them before the dust lands.", minAge: 24, power: 4, style: "trick", kind: "dash", energy: 2, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "speed", upgrades: "armory::flare" }),
      k("iron-man", { id: "armory::jarvis", name: "JARVIS Targeting", blurb: "\"Weak points highlighted, sir.\"", minAge: 28, power: 4, style: "trick", kind: "status", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "psychic", upgrades: "armory::taser" }),
      k("iron-man", { id: "armory::missiles", name: "Shoulder Missiles", blurb: "The Mark III swapped the flamethrower for a better argument.", minAge: 28, power: 6, style: "strike", kind: "area", energy: 3, effect: "Hits wide. Wins leave them Burning.", cooldown: 1, element: "fire", upgrades: "armory::flamer" }),
      k("iron-man", { id: "armory::unibeam", name: "Unibeam", blurb: "Everything the reactor has, in one straight line.", minAge: 30, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Shocked.", cooldown: 1, element: "energy", upgrades: "armory::reactor" }),
      k("iron-man", { id: "armory::nanoshell", name: "Nanotech Shell", blurb: "Liquid armour. It is already where the hit lands.", minAge: 36, power: 6, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "armory::mark1" }),
      k("iron-man", { id: "armory::hulkbuster", name: "Hulkbuster Brace", blurb: "Veronica drops the big suit. For a minute, nothing gets through.", minAge: 40, power: 7, style: "guard", kind: "guard", energy: 3, effect: "Takes the edge off what comes back.", cooldown: 2, element: "force" }),
    ],
  },
  {
    legend: "spider-man",
    id: "kit:spider-man",
    name: "Web-Shooters",
    blurb: "Homemade fluid, wrist triggers, and a lot of practice. Every guard is a web now.",
    ultimateAge: null,
    replaces: { styles: ["guard"], line: "Spider-Man guards with webs: the Web-Shooters handle every guard." },
    edge: 0.1,
    piece: "web",
    moves: [
      k("spider-man", { id: "web::shield", name: "Web Shield", blurb: "A quick lattice across the gap. It gives, then holds.", minAge: 15, power: 3, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("spider-man", { id: "web::net", name: "Web Net", blurb: "Thwip. Now they are wearing it.", minAge: 16, power: 3, style: "guard", kind: "status", energy: 1, effect: "Wins leave them Frosted: tangled, hitting 15% weaker.", cooldown: 1, element: "force", applies: "frost" }),
      k("spider-man", { id: "web::yank", name: "Web Yank", blurb: "Their own swing, pulled straight past you.", minAge: 19, power: 4, style: "guard", kind: "guard", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "force", applies: "expose" }),
      k("spider-man", { id: "web::cocoon", name: "Web Cocoon", blurb: "Wrapped to the elbows. Struggling just tightens it.", minAge: 23, power: 5, style: "guard", kind: "status", energy: 2, effect: "Wins leave them Frosted: tangled, hitting 15% weaker.", cooldown: 1, element: "force", applies: "frost", upgrades: "web::net" }),
      k("spider-man", { id: "web::wall", name: "Web Wall", blurb: "A whole alley, strung shut in a heartbeat.", minAge: 26, power: 5, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "web::shield" }),
      k("spider-man", { id: "web::snare", name: "Spider-Sense Snare", blurb: "The tingle, the web, already there when they move.", minAge: 32, power: 6, style: "guard", kind: "status", energy: 2, effect: "Shocks them: their tells can't lie.", cooldown: 1, element: "lightning", applies: "shock", upgrades: "web::yank" }),
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

/** The kit piece that supersedes this one, if any. */
const UPGRADED_BY = new Map<string, KitMove>();
for (const move of MOVE_INDEX.values()) if (move.upgrades) UPGRADED_BY.set(move.upgrades, move);

/** Arrived: belongs to this life's legend and the hero is old enough (retired or not). */
function kitMoveArrived(game: { preset?: string | null; age?: number }, move: KitMove): boolean {
  return kitFor(game.preset)?.id === move.powerId && (game.age ?? 0) >= move.minAge;
}

/** A piece retires once the piece that upgrades it has arrived (Pulse Glove → Repulsor Blast). */
export function kitMoveRetired(game: { preset?: string | null; age?: number }, move: KitMove): boolean {
  const next = UPGRADED_BY.get(move.id);
  return !!next && kitMoveArrived(game, next);
}

/** A kit move is usable when it belongs to this life's legend, the hero is old enough, and it hasn't been upgraded away. */
export function kitMoveUnlocked(game: { preset?: string | null; age?: number }, move: KitMove): boolean {
  return kitMoveArrived(game, move) && !kitMoveRetired(game, move);
}

/** The newest arrived piece in this move's upgrade line (itself when nothing newer has arrived). */
export function kitUpgradeTip(game: { preset?: string | null; age?: number }, id: string): string {
  let current = MOVE_INDEX.get(id);
  if (!current) return id;
  for (let hop = 0; hop < 8; hop++) {
    const next = UPGRADED_BY.get(current.id);
    if (!next || !kitMoveArrived(game, next)) break;
    current = next;
  }
  return current.id;
}

/** True when this legend's kit stands in for a power move (Iron Man's repulsors, Spider-Man's guards). */
export function kitHidesPowerMove(preset: string | null | undefined, def: Pick<MoveDef, "powerId" | "style">): boolean {
  const rule = kitFor(preset)?.replaces;
  if (!rule || isKitPower(def.powerId)) return false;
  return !!(rule.powers?.includes(def.powerId) || rule.styles?.includes(def.style));
}

/** Kit stand-in for mastery: rank 1 under 25, then +1 a decade (35, 45), max 4. */
export function kitRank(age: number): number {
  return 1 + Math.max(0, Math.min(3, Math.floor((age - 15) / 10)));
}

/** Share of power level a kit move gains (powers get 0.55, street moves 0.35). Tuned by engine sims. */
export const KIT_EDGE = 0.25;

/** This kit's power-level share (its own `edge`, else KIT_EDGE). */
export function kitEdge(powerId: string): number {
  return kitById(powerId)?.edge ?? KIT_EDGE;
}
