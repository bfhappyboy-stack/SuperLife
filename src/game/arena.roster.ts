/**
 * Arena roster: every legend from presets.ts plus their signature villains, each with exactly six
 * fight moves, an HP pool and one passive. Villain moves are their preset boss moves (so the Arena
 * and the life-sim bosses always agree) plus two arena-only moves so every fighter covers all three
 * styles. Pure data: the balance pass only ever touches `hp` and move numbers here.
 */
import type { ElementId } from "./elements";
import { PRESETS, type PresetId } from "./presets";
import type { DuelMove, Look, MoveStyle, Sex, Wardrobe } from "./types";
import type { CapeFamily } from "./theme";

type MoveKind = NonNullable<DuelMove["kind"]>;

export type PassiveKind =
  // villain passives (the life-sim boss gimmicks, re-tuned for a fair 1v1)
  | "armor" | "enrage" | "fog" | "feint" | "adapt" | "regen" | "revive" | "swarm" | "charge"
  // hero passives
  | "sense" | "prep" | "rage" | "steel" | "bracers" | "bulwark" | "worthy" | "kinetic" | "speedster" | "arc";

export interface ArenaPassive {
  kind: PassiveKind;
  name: string;
  /** One line, shown on the draft card and in battle. */
  text: string;
}

export interface ArenaTint {
  suit: string;
  trim: string;
  cape?: string;
  capeKind?: "none" | "short" | "long" | "coat";
  mask?: "none" | "domino" | "hood" | "cowl" | "helm";
  maskColor?: string;
  glove?: string;
}

export interface ArenaFighter {
  id: string;
  name: string;
  /** Short line under the name on cards. */
  title: string;
  side: "hero" | "villain";
  /** The legend whose world this fighter comes from. */
  world: PresetId;
  color: string;
  sex: "male" | "female";
  hp: number;
  passive: ArenaPassive;
  moves: DuelMove[];
  tint: ArenaTint;
  /** Painted portrait key in src/assets/art (heroes only). */
  art?: string;
  crest?: "panther" | "wolverine" | "flash";
  /** Saved-life heroes carry the save's look seed. */
  seed?: number;
  custom?: boolean;
  /** A saved life's own look, so the Arena draws the hero you built. */
  life?: { look: Look; wardrobe: Wardrobe; age: number; sex: Sex };
  /** A saved mystery life's power family, for its poster art (emblem and rim-light colour). */
  family?: CapeFamily | null;
  /** Unmasked villains get a fixed face so Doc Ock keeps his glasses and the Joker his green hair. */
  look?: Partial<Look>;
}

/** Energy price from power: cheap jabs, pricey finishers. */
export function arenaCost(power: number, kind?: MoveKind): number {
  const base = power <= 5 ? 1 : power <= 7 ? 2 : power <= 8 ? 3 : 4;
  return kind === "guard" ? Math.max(1, base - 1) : base;
}

/** Big burst/area moves need a turn to recover. */
export function arenaCooldown(power: number, kind?: MoveKind): number {
  return power >= 9 && (kind === "burst" || kind === "area") ? 2 : power >= 8 && kind === "area" ? 1 : 0;
}

function am(id: string, name: string, blurb: string, power: number, style: MoveStyle, element: ElementId, kind?: MoveKind): DuelMove {
  return { id, name, blurb, power, style, element, kind, energy: arenaCost(power, kind), cooldown: arenaCooldown(power, kind) };
}

/** A preset boss move, re-priced for the Arena. */
function fromPreset(world: PresetId, villain: string, i: number): DuelMove {
  const v = PRESETS.find((p) => p.id === world)?.villains.find((x) => x.id === villain);
  const m = v?.moves[i];
  if (!v || !m) throw new Error(`arena roster: ${world}/${villain} move ${i} missing`);
  // Early-life bosses (Goblin, Joker…) were tuned to fight a teenager; lift their kit to Arena level.
  const avg = v.moves.reduce((a, x) => a + x.power, 0) / v.moves.length;
  const power = Math.min(10, m.power + Math.max(0, Math.round(7 - avg)));
  return { ...m, power, id: `${villain}-${i}`, energy: arenaCost(power, m.kind), cooldown: arenaCooldown(power, m.kind) };
}

function presetHero(id: PresetId) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`arena roster: preset ${id} missing`);
  return p;
}

function villainOf(world: PresetId, id: string) {
  const v = presetHero(world).villains.find((x) => x.id === id);
  if (!v) throw new Error(`arena roster: villain ${world}/${id} missing`);
  return v;
}

function hero(id: PresetId, title: string, hp: number, passive: ArenaPassive, tint: ArenaTint, moves: DuelMove[], sex: "male" | "female" = "male"): ArenaFighter {
  const p = presetHero(id);
  return { id, name: p.hero, title, side: "hero", world: id, color: p.color, sex, hp, passive, moves, tint, art: `hero-${id}`, crest: p.kit?.crest };
}

function villain(world: PresetId, id: string, color: string, hp: number, passive: ArenaPassive, tint: ArenaTint, extra: [DuelMove, DuelMove], keep: number[] = [0, 1, 2, 3]): ArenaFighter {
  const v = villainOf(world, id);
  const moves = [...keep.map((i) => fromPreset(world, id, i)), ...extra];
  return { id, name: v.alias, title: v.title, side: "villain", world, color, sex: v.sex ?? "male", hp, passive, moves, tint };
}

export const ARENA_ROSTER: ArenaFighter[] = [
  // ─── Heroes ───────────────────────────────────────────────────────────────────────
  hero("spider-man", "Friendly neighbourhood", 106,
    { kind: "sense", name: "Spider-Sense", text: "Always sees the true tell. Feints and fog never fool him." },
    { suit: "#d8242c", trim: "#1d3fa8", mask: "cowl", maskColor: "#d8242c", glove: "#d8242c" },
    [
      am("sm-web-zip", "Web-Zip Kick", "In on a line, out on a kick.", 7, "strike", "speed", "dash"),
      am("sm-haymaker", "Spider Haymaker", "He's been pulling these for years.", 8, "strike", "force", "burst"),
      am("sm-web-net", "Web Net", "Sticky, everywhere.", 6, "trick", "stretch", "status"),
      am("sm-quip", "Quip and Flip", "Over your head, mid-sentence.", 6, "trick", "speed"),
      am("sm-web-shield", "Web Shield", "A wall of web, spun in a blink.", 5, "guard", "stretch", "guard"),
      am("sm-cyclone", "Web Cyclone", "Everything in reach, wrapped.", 8, "trick", "stretch", "area"),
    ]),
  hero("batman", "The world's greatest detective", 112,
    { kind: "prep", name: "Contingency Plan", text: "+1 energy every turn. He planned for this." },
    { suit: "#3b3f4a", trim: "#f3c623", cape: "#16181f", capeKind: "long", mask: "cowl", maskColor: "#16181f", glove: "#16181f" },
    [
      am("bm-batarang", "Batarang Volley", "Three, from the dark.", 6, "strike", "shadow", "area"),
      am("bm-hook", "Grapnel Strike", "Pulled in, knocked down.", 8, "strike", "force", "dash"),
      am("bm-smoke", "Smoke Pellet", "Where did he go?", 5, "trick", "shadow", "status"),
      am("bm-counter", "Counter Throw", "Your weight, his leverage.", 7, "guard", "force"),
      am("bm-cape", "Cape Glide", "The cape takes it.", 5, "guard", "shadow", "guard"),
      am("bm-gadget", "Explosive Gel", "Planted while you blinked.", 9, "trick", "fire", "burst"),
    ]),
  hero("iron-man", "Genius in a can", 122,
    { kind: "arc", name: "Arc Reactor", text: "Energy cap 12 and +1 energy when he guards." },
    { suit: "#b8202a", trim: "#f2c23c", mask: "helm", maskColor: "#f2c23c", glove: "#b8202a" },
    [
      am("im-repulsor", "Repulsor Blast", "Palms out. Boom.", 7, "strike", "energy"),
      am("im-unibeam", "Unibeam", "Everything the reactor has.", 10, "strike", "light", "burst"),
      am("im-micro", "Micro-Missiles", "A shoulder full of them.", 8, "trick", "fire", "area"),
      am("im-jamming", "Jarvis Jam", "Your gear forgets how to work.", 5, "trick", "psychic", "status"),
      am("im-flare", "Flare Dodge", "Afterburners, sideways.", 6, "trick", "speed", "dash"),
      am("im-plating", "Nanotech Plating", "The suit grows a wall.", 5, "guard", "shield", "guard"),
    ]),
  hero("hulk", "The strongest there is", 91,
    { kind: "rage", name: "Hulk Smash", text: "The madder he gets, the harder he hits: up to +40% at low HP." },
    { suit: "#4f9a3f", trim: "#5b3a8a", mask: "none", glove: "#4f9a3f" },
    [
      am("hk-smash", "Smash", "The word says it all.", 9, "strike", "force", "burst"),
      am("hk-clap", "Thunderclap", "Hands together. Windows out.", 8, "strike", "force", "area"),
      am("hk-leap", "Gamma Leap", "Three blocks, straight down.", 7, "strike", "gravity", "dash"),
      am("hk-roar", "Roar", "Even villains flinch.", 4, "trick", "psychic", "status"),
      am("hk-grab", "Grab and Toss", "He doesn't need a plan.", 6, "trick", "force"),
      am("hk-hide", "Gamma Hide", "Bullets bounce.", 6, "guard", "life", "guard"),
    ]),
  hero("superman", "The Man of Steel", 106,
    { kind: "steel", name: "Man of Steel", text: "Takes 15% less from strike moves." },
    { suit: "#2456c8", trim: "#d8242c", cape: "#d8242c", capeKind: "long", mask: "none", glove: "#2456c8" },
    [
      am("sp-punch", "Haymaker", "Felt in the next county.", 8, "strike", "force", "burst"),
      am("sp-heat", "Heat Vision", "Red eyes, white heat.", 7, "strike", "fire", "area"),
      am("sp-breath", "Freeze Breath", "A gale of frost.", 6, "trick", "ice", "status"),
      am("sp-blur", "Faster Than a Bullet", "Behind you already.", 6, "trick", "speed", "dash"),
      am("sp-catch", "Catch and Hold", "He catches the punch.", 6, "guard", "force", "guard"),
      am("sp-orbit", "Orbit Dive", "Up, around, and down.", 9, "trick", "gravity", "burst"),
    ]),
  hero("wonder-woman", "Princess of Themyscira", 96,
    { kind: "bracers", name: "Bracers of Submission", text: "Guard-style moves hit 30% harder." },
    { suit: "#b8202a", trim: "#e2b13c", mask: "none", glove: "#e2b13c" },
    [
      am("ww-sword", "God-Killer", "A blade made for gods.", 9, "strike", "force", "burst"),
      am("ww-shield", "Shield Bash", "Bronze, to the face.", 7, "strike", "shield"),
      am("ww-lasso", "Lasso of Truth", "Tell the truth. Then fall down.", 6, "trick", "light", "status"),
      am("ww-bracers", "Bracer Deflect", "The bullet goes back where it came from.", 7, "guard", "shield"),
      am("ww-clash", "Bracer Clash", "Thunder from crossed arms.", 8, "guard", "lightning", "area"),
      am("ww-aegis", "Amazon Stance", "A thousand years of training.", 5, "guard", "shield", "guard"),
    ], "female"),
  hero("captain-america", "The first Avenger", 105,
    { kind: "bulwark", name: "Vibranium Shield", text: "Guard moves cut damage by 40% instead of 20%." },
    { suit: "#2a4aa8", trim: "#d8242c", mask: "cowl", maskColor: "#2a4aa8", glove: "#b8202a" },
    [
      am("ca-throw", "Shield Throw", "It always comes back.", 8, "strike", "shield", "area"),
      am("ca-punch", "Serum Haymaker", "Brooklyn, 1941.", 7, "strike", "force"),
      am("ca-tactics", "Battle Plan", "He saw this three moves ago.", 5, "trick", "psychic", "status"),
      am("ca-vault", "Shield Vault", "Up, over, and down.", 7, "trick", "force", "dash"),
      am("ca-block", "Shield Up", "Nothing gets past it.", 6, "guard", "shield", "guard"),
      am("ca-charge", "Shield Charge", "Through the door, and you.", 8, "guard", "force", "burst"),
    ]),
  hero("thor", "God of Thunder", 107,
    { kind: "worthy", name: "Worthy", text: "Area moves hit 25% harder." },
    { suit: "#3a3f52", trim: "#c8ccd6", cape: "#b8202a", capeKind: "long", mask: "none", glove: "#3a3f52" },
    [
      am("th-hammer", "Mjolnir Strike", "Uru, straight down.", 8, "strike", "force", "burst"),
      am("th-storm", "Thunderstorm", "The sky comes when he calls.", 9, "strike", "lightning", "area"),
      am("th-throw", "Hammer Throw", "Out, around, and back.", 7, "trick", "lightning", "dash"),
      am("th-spin", "Hammer Spin", "A wall of whirling thunder.", 6, "guard", "wind", "guard"),
      am("th-bifrost", "Bifrost Step", "Rainbow light, then he's behind you.", 6, "trick", "warp"),
      am("th-boom", "Thunderclap Ward", "The sound alone stops you.", 5, "trick", "lightning", "status"),
    ]),
  hero("black-panther", "King of Wakanda", 88,
    { kind: "kinetic", name: "Kinetic Suit", text: "Stores 25% of damage taken and adds it to his next hit." },
    { suit: "#15131d", trim: "#b48cff", mask: "cowl", maskColor: "#15131d", glove: "#1d1a28" },
    [
      am("bp-claws", "Vibranium Claws", "Through anything.", 7, "strike", "force"),
      am("bp-pulse", "Kinetic Pulse", "Every hit he took, back at you.", 9, "strike", "energy", "area"),
      am("bp-pounce", "Panther Pounce", "From the roof, silently.", 7, "trick", "shadow", "dash"),
      am("bp-dagger", "Dagger Toss", "A dart, then darkness.", 5, "trick", "shadow", "status"),
      am("bp-absorb", "Absorb", "The suit drinks the blow.", 6, "guard", "energy", "guard"),
      am("bp-rite", "Challenge Rite", "Warrior Falls rules.", 7, "guard", "force"),
    ]),
  hero("wolverine", "The best there is", 86,
    { kind: "regen", name: "Healing Factor", text: "Heals 5% each turn unless a trick or status move lands on him." },
    { suit: "#f2c230", trim: "#2a4aa8", mask: "cowl", maskColor: "#2a4aa8", glove: "#2a4aa8" },
    [
      am("wv-slash", "Adamantium Slash", "Snikt.", 8, "strike", "force", "burst"),
      am("wv-berserk", "Berserker Rage", "Claws everywhere.", 9, "strike", "force", "area"),
      am("wv-lunge", "Feral Lunge", "Low and fast.", 7, "strike", "speed", "dash"),
      am("wv-nose", "Smell the Plan", "He knew you'd go left.", 5, "trick", "life", "status"),
      am("wv-feint", "Bub", "A wink, then the claws.", 6, "trick", "shadow"),
      am("wv-tank", "Take It", "He'll heal.", 5, "guard", "life", "guard"),
    ]),
  hero("flash", "The fastest man alive", 102,
    { kind: "speedster", name: "Speed Force", text: "Dash moves hit 25% harder, and he leads the first turn." },
    { suit: "#d8241c", trim: "#ffd23a", mask: "cowl", maskColor: "#d8241c", glove: "#d8241c" },
    [
      // Speed is pure damage, so the punch carries Expose (they reel and take +15%). Arena 44% → 49%.
      { ...am("fl-punch", "Infinite Mass Punch", "Near light speed, into one fist.", 9, "strike", "speed", "dash"), applies: "expose" },
      am("fl-jab", "Thousand Jabs", "You felt all of them at once.", 6, "strike", "speed", "area"),
      am("fl-bolt", "Lightning Throw", "He threw the lightning.", 7, "strike", "lightning"),
      am("fl-tornado", "Speed Tornado", "Run in circles. Literally.", 7, "trick", "wind", "area"),
      am("fl-phase", "Phase Through", "You hit nothing.", 6, "guard", "speed", "guard"),
      am("fl-steal", "Speed Steal", "He took your momentum.", 5, "trick", "speed", "status"),
    ]),

  // ─── Villains ─────────────────────────────────────────────────────────────────────
  villain("spider-man", "goblin", "#55a630", 113,
    { kind: "enrage", name: "Goblin Formula", text: "Below half HP: deals 25% more, takes 15% more." },
    { suit: "#3f7d2a", trim: "#6b3fa0", mask: "helm", maskColor: "#55a630", glove: "#6b3fa0" },
    [am("gob-glider", "Glider Ram", "Blades first.", 7, "strike", "speed", "dash"), am("gob-cackle", "Cackle", "That laugh.", 5, "guard", "psychic", "guard")]),
  villain("spider-man", "venom", "#2b2d3a", 105,
    { kind: "fog", name: "Symbiote", text: "Hides 40% of his tells. Spider-Sense sees through it." },
    { suit: "#14151c", trim: "#f2f2f2", mask: "cowl", maskColor: "#14151c", glove: "#14151c" },
    [am("ven-tendrils", "Tendril Lash", "Everywhere at once.", 7, "strike", "stretch", "area"), am("ven-hide", "Symbiote Shell", "The goo hardens.", 5, "guard", "stretch", "guard")]),
  villain("spider-man", "ock", "#c99a2e", 98,
    { kind: "swarm", name: "Four Arms", text: "Chips 3 HP a turn until his foe lands an area move." },
    { suit: "#4a5a3a", trim: "#c9c9c9", mask: "none", glove: "#2a2a2a" },
    [am("ock-pin", "Tentacle Pin", "Four arms, one of you.", 6, "trick", "force", "status"), am("ock-wall", "Arm Wall", "Steel in the way.", 5, "guard", "shield", "guard")]),
  villain("batman", "joker", "#7b3fb0", 119,
    { kind: "feint", name: "The Joke", text: "Feints cost him nothing." },
    { suit: "#6b2fa0", trim: "#3dba5c", mask: "none", glove: "#6b2fa0" },
    [am("jok-buzzer", "Joy Buzzer", "Shake on it.", 7, "trick", "lightning", "burst"), am("jok-flower", "Squirting Flower", "Look closer.", 5, "guard", "psychic", "guard")]),
  villain("batman", "bane", "#7a6a5a", 98,
    { kind: "charge", name: "Venom Pump", text: "Every third turn his strikes hit 50% harder." },
    { suit: "#4a4038", trim: "#2a2a2a", mask: "cowl", maskColor: "#1a1a1a", glove: "#2a2a2a" },
    [am("bane-backbreak", "Backbreaker", "He's done it before.", 9, "strike", "force", "burst"), am("bane-feint", "Read the Fighter", "He studied you.", 6, "trick", "psychic")]),
  villain("iron-man", "stane", "#6a7280", 101,
    { kind: "armor", name: "Iron Monger Plating", text: "Two armor plates: takes 45% less until a winning-style hit cracks each." },
    { suit: "#6a7280", trim: "#c9c9c9", mask: "helm", maskColor: "#6a7280", glove: "#4a5260" },
    [am("stane-rocket", "Shoulder Rocket", "A bigger suit, a bigger gun.", 8, "strike", "fire", "area"), am("stane-scramble", "Board Vote", "You're out.", 5, "trick", "psychic", "status")]),
  villain("iron-man", "ultron", "#9aa4b8", 82,
    { kind: "revive", name: "Backup Body", text: "Once per round, a KO brings him back at 30% HP." },
    { suit: "#8a94a8", trim: "#d8242c", mask: "helm", maskColor: "#c0c8d8", glove: "#8a94a8" },
    [am("ult-drones", "Drone Swarm", "Hundreds of him.", 7, "trick", "energy", "area"), am("ult-shell", "Vibranium Shell", "He upgraded.", 5, "guard", "shield", "guard")]),
  villain("hulk", "abomination", "#4a7a5a", 100,
    { kind: "enrage", name: "Abomination", text: "Below half HP: deals 25% more, takes 15% more." },
    { suit: "#3f6a4a", trim: "#8a6a3a", mask: "none", glove: "#3f6a4a" },
    [am("abom-claw", "Gamma Claw", "Bigger and meaner.", 7, "trick", "force", "dash"), am("abom-hide", "Scaled Hide", "Ridges like armor.", 5, "guard", "life", "guard")]),
  villain("superman", "lex", "#3dba5c", 113,
    { kind: "armor", name: "Warsuit", text: "Two armor plates: takes 45% less until a winning-style hit cracks each." },
    { suit: "#2f6a3a", trim: "#7b3fb0", mask: "helm", maskColor: "#3dba5c", glove: "#2f6a3a" },
    [am("lex-scheme", "Contingency", "He bought your landlord.", 6, "trick", "psychic"), am("lex-dash", "Thruster Burst", "LexCorp jets.", 6, "trick", "speed", "dash")]),
  villain("superman", "zod", "#2a2a3a", 110,
    { kind: "charge", name: "Kryptonian Soldier", text: "Every third turn his strikes hit 50% harder." },
    { suit: "#1d1f2a", trim: "#c9c9c9", mask: "none", glove: "#1d1f2a" },
    [am("zod-shout", "Kneel Before Zod", "It isn't a request.", 5, "trick", "psychic", "status"), am("zod-throw", "Orbital Toss", "Up, then down hard.", 8, "trick", "gravity", "burst")]),
  villain("superman", "doomsday", "#6a6a6a", 111,
    { kind: "adapt", name: "Adaptation", text: "The same move twice in a row on him deals half." },
    { suit: "#5a5a5a", trim: "#c9c9c9", mask: "none", glove: "#5a5a5a" },
    [am("doom-gore", "Gore", "Bone through steel.", 7, "trick", "force", "dash"), am("doom-shrug", "Shrug", "It doesn't care.", 5, "guard", "life")]),
  villain("wonder-woman", "cheetah", "#d89a2a", 105,
    { kind: "enrage", name: "Bloodlust", text: "Below half HP: deals 25% more, takes 15% more." },
    { suit: "#c88a2a", trim: "#3a2a1a", mask: "none", glove: "#3a2a1a" },
    [am("chee-maul", "Maul", "Teeth, then claws.", 8, "trick", "force", "burst"), am("chee-leap", "Leap Away", "Gone up a wall.", 5, "guard", "speed")], [0, 1, 2, 3]),
  villain("captain-america", "red-skull", "#b8202a", 102,
    { kind: "enrage", name: "Corrupted Serum", text: "Below half HP: deals 25% more, takes 15% more." },
    { suit: "#3a3a3a", trim: "#1a1a1a", mask: "cowl", maskColor: "#c4242a", glove: "#1a1a1a" },
    [am("skull-guard", "Hydra Phalanx", "Heads, everywhere.", 6, "guard", "shield", "guard"), am("skull-trap", "Cube Trap", "The cube remembers.", 7, "guard", "energy")]),
  villain("thor", "loki", "#3dba5c", 108,
    { kind: "feint", name: "God of Mischief", text: "Feints cost him nothing." },
    { suit: "#1f5a2f", trim: "#e2b13c", cape: "#1f5a2f", capeKind: "long", mask: "helm", maskColor: "#e2b13c", glove: "#1f5a2f" },
    [am("loki-blade", "Twin Daggers", "Both of them are real.", 7, "strike", "shadow", "dash"), am("loki-illusion", "Illusion Wall", "You hit a picture of him.", 6, "trick", "psychic", "guard")]),
  villain("thor", "hela", "#1f3a2a", 108,
    { kind: "swarm", name: "Necrosword Rain", text: "Chips 3 HP a turn until her foe lands an area move." },
    { suit: "#1a1a1a", trim: "#3dba5c", cape: "#1a1a1a", capeKind: "long", mask: "helm", maskColor: "#1a1a1a", glove: "#1a1a1a" },
    [am("hela-throw", "Blade Throw", "From the antlers.", 7, "trick", "shadow", "dash"), am("hela-rise", "Rise Again", "Death is home turf.", 7, "guard", "life")]),
  villain("black-panther", "killmonger", "#c9a227", 105,
    { kind: "enrage", name: "Vengeance", text: "Below half HP: deals 25% more, takes 15% more." },
    { suit: "#2a2420", trim: "#c9a227", mask: "cowl", maskColor: "#c9a227", glove: "#2a2420" },
    [am("km-spear", "Ritual Spear", "He came to take the throne.", 7, "trick", "force", "dash"), am("km-stance", "Soldier's Stance", "Years of practice.", 7, "guard", "force")]),
  villain("wolverine", "sabretooth", "#a07a4a", 90,
    { kind: "regen", name: "Healing Factor", text: "Heals 5% each turn unless a trick or status move lands on him." },
    { suit: "#7a5a3a", trim: "#e8d8b0", cape: "#5a3a2a", capeKind: "coat", mask: "none", glove: "#7a5a3a" },
    [am("sab-maul", "Maul", "A hundred years of practice.", 9, "trick", "force", "burst"), am("sab-roar", "Roar", "Animal, all the way down.", 6, "guard", "psychic")]),
  villain("flash", "reverse-flash", "#e8c82a", 117,
    { kind: "adapt", name: "Future Knowledge", text: "The same move twice in a row on him deals half." },
    { suit: "#e8c82a", trim: "#d8241c", mask: "cowl", maskColor: "#e8c82a", glove: "#e8c82a" },
    [am("rf-storm", "Red Storm", "Lightning, backwards.", 7, "trick", "lightning", "area"), am("rf-strike", "Yellow Blur", "He was always faster.", 7, "strike", "speed")]),
];

/**
 * Faces for unmasked fighters (indices into look.ts palettes). Figure grows a beard when
 * `seed & 4` is 0, so the seed picks clean-shaven (5) or bearded (3).
 */
const FACES: Record<string, { look: Partial<Look>; seed: number }> = {
  hulk: { look: { skin: 11, hair: 0, style: 2, build: 1, feature: 0 }, seed: 5 },
  superman: { look: { skin: 0, hair: 0, style: 0, build: 1, feature: 0 }, seed: 5 },
  "wonder-woman": { look: { skin: 2, hair: 0, style: 3, build: 0, feature: 0 }, seed: 5 },
  thor: { look: { skin: 0, hair: 4, style: 3, build: 1, feature: 0 }, seed: 3 },
  ock: { look: { skin: 1, hair: 1, style: 0, build: 1, feature: 2 }, seed: 5 },
  joker: { look: { skin: 6, hair: 10, style: 1, build: 0, feature: 0 }, seed: 5 },
  abomination: { look: { skin: 11, hair: 0, style: 2, build: 1, feature: 1 }, seed: 5 },
  zod: { look: { skin: 0, hair: 0, style: 2, build: 1, feature: 0 }, seed: 3 },
  doomsday: { look: { skin: 10, hair: 8, style: 2, build: 1, feature: 1 }, seed: 5 },
  cheetah: { look: { skin: 2, hair: 4, style: 4, build: 0, feature: 3 }, seed: 5 },
  killmonger: { look: { skin: 4, hair: 0, style: 2, build: 1, feature: 1 }, seed: 5 },
  sabretooth: { look: { skin: 1, hair: 4, style: 3, build: 1, feature: 1 }, seed: 3 },
  lex: { look: { skin: 0, hair: 8, style: 2, build: 0, feature: 0 }, seed: 5 },
};
for (const f of ARENA_ROSTER) {
  const face = FACES[f.id];
  if (face) Object.assign(f, face);
}

export const ARENA_BY_ID: Record<string, ArenaFighter> = Object.fromEntries(ARENA_ROSTER.map((f) => [f.id, f]));

export function arenaFighter(id: string): ArenaFighter | undefined {
  return ARENA_BY_ID[id];
}
