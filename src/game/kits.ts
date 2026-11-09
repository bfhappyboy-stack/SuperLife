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
  {
    legend: "thor",
    id: "kit:thor",
    name: "Mjolnir",
    blurb: "Asgard's training yard first, then the hammer that decides if you are worthy.",
    ultimateAge: 30,
    leadsUltimate: true,
    replaces: { powers: ["super-strength"], line: "Thor's strength is in the hammer: Mjolnir does the heavy hitting." },
    edge: 0.55,
    piece: "hammer art",
    moves: [
      k("thor", { id: "mjolnir::shieldwall", name: "Shieldwall", blurb: "An Asgardian round shield, taller than you are.", minAge: 10, power: 6, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("thor", { id: "mjolnir::blade", name: "Practice Blade", blurb: "Sif hits harder. You learn anyway.", minAge: 12, power: 5, style: "strike", kind: "burst", energy: 1, effect: "Single hit.", cooldown: 0, element: "force" }),
      k("thor", { id: "mjolnir::feint", name: "Warrior's Feint", blurb: "Fandral's trick: look left, go right.", minAge: 14, power: 5, style: "trick", kind: "dash", energy: 1, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "speed" }),
      k("thor", { id: "mjolnir::strike", name: "Mjolnir Strike", blurb: "It came when you called. Now it hits.", minAge: 17, power: 5, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Shocked.", cooldown: 0, element: "lightning", upgrades: "mjolnir::blade" }),
      k("thor", { id: "mjolnir::throw", name: "Hammer Throw", blurb: "Thrown wide. Back from behind them.", minAge: 18, power: 5, style: "trick", kind: "dash", energy: 2, effect: "Hits harder when it answers their tell. Wins leave them Shocked.", cooldown: 0, element: "lightning", upgrades: "mjolnir::feint" }),
      k("thor", { id: "mjolnir::spin", name: "Hammer Spin", blurb: "Spun fast enough to stop arrows. And bullets.", minAge: 21, power: 5, style: "guard", kind: "guard", energy: 2, effect: "Wins leave them Frosted in the downdraft.", cooldown: 1, element: "wind", upgrades: "mjolnir::shieldwall" }),
      k("thor", { id: "mjolnir::bifrost", name: "Bifrost Call", blurb: "The bridge opens behind them. They turn to look.", minAge: 26, power: 5, style: "trick", kind: "status", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "light" }),
      k("thor", { id: "mjolnir::godblast", name: "God Blast", blurb: "Hammer raised. The sky answers all at once.", minAge: 30, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Shocked.", cooldown: 1, element: "lightning", upgrades: "mjolnir::strike" }),
      k("thor", { id: "mjolnir::landing", name: "Thunder Landing", blurb: "Down from the sky like a verdict.", minAge: 33, power: 7, style: "strike", kind: "area", energy: 3, effect: "Hits wide. Wins leave them Shocked.", cooldown: 1, element: "lightning" }),
      k("thor", { id: "mjolnir::stormbreaker", name: "Stormbreaker Cleave", blurb: "A new weapon for a broken hammer. It cuts the storm in half.", minAge: 42, power: 8, style: "strike", kind: "burst", energy: 3, effect: "Wins leave them Shocked.", cooldown: 1, element: "lightning" }),
      k("thor", { id: "mjolnir::catch", name: "Hammer Catch", blurb: "He takes the hit on the hammer's face and hands it back.", minAge: 44, power: 7, style: "guard", kind: "guard", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "force", applies: "expose" }),
      k("thor", { id: "mjolnir::odinforce", name: "Odinforce Ward", blurb: "Your father's light, finally yours to hold up.", minAge: 48, power: 7, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "mjolnir::spin" }),
    ],
  },
  {
    legend: "captain-america",
    id: "kit:captain-america",
    name: "The Shield",
    blurb: "A trash-can lid in a Brooklyn alley, then vibranium. He never fought without something round.",
    ultimateAge: 30,
    leadsUltimate: true,
    replaces: { powers: ["aegis-shell"], line: "Cap's shell is the shield now: guards and throws come from The Shield." },
    edge: 0.3,
    piece: "shield move",
    moves: [
      k("captain-america", { id: "shield::lid", name: "Trash-Can Lid", blurb: "He picked it up in an alley. He never put it down.", minAge: 10, power: 4, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("captain-america", { id: "shield::jab", name: "Brooklyn Jab", blurb: "Small, sick, and swinging anyway.", minAge: 12, power: 4, style: "strike", kind: "burst", energy: 1, effect: "Single hit.", cooldown: 0, element: "force" }),
      k("captain-america", { id: "shield::weave", name: "Duck and Weave", blurb: "Bucky taught him one thing: don't be there.", minAge: 14, power: 3, style: "trick", kind: "dash", energy: 1, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "speed" }),
      k("captain-america", { id: "shield::vibranium", name: "Vibranium Shield", blurb: "Star-spangled, unbreakable, and always in the way.", minAge: 21, power: 5, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "shield::lid" }),
      k("captain-america", { id: "shield::bash", name: "Shield Bash", blurb: "The rim, edge-on, at the jaw.", minAge: 22, power: 5, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Exposed.", cooldown: 0, element: "force", applies: "expose", upgrades: "shield::jab" }),
      k("captain-america", { id: "shield::throw", name: "Shield Throw", blurb: "Off the wall, off his jaw, back to the glove.", minAge: 23, power: 5, style: "trick", kind: "dash", energy: 2, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "force", upgrades: "shield::weave" }),
      k("captain-america", { id: "shield::ricochet", name: "Ricochet Volley", blurb: "Three walls, four goons, one throw.", minAge: 26, power: 6, style: "strike", kind: "area", energy: 2, effect: "Hits wide.", cooldown: 1, element: "force" }),
      k("captain-america", { id: "shield::feint", name: "Commando Feint", blurb: "A Howling Commandos trick: show the shield, hit with the other hand.", minAge: 28, power: 5, style: "trick", kind: "status", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "psychic" }),
      k("captain-america", { id: "shield::liberty", name: "Liberty Strike", blurb: "The shield comes down with everything behind it.", minAge: 30, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Exposed.", cooldown: 1, element: "force", applies: "expose", upgrades: "shield::bash" }),
      k("captain-america", { id: "shield::rally", name: "Assemble", blurb: "He says one word and the room stands up straighter.", minAge: 33, power: 5, style: "trick", kind: "status", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "life", applies: "ward" }),
      k("captain-america", { id: "shield::unbreakable", name: "Unbreakable Guard", blurb: "Kneel behind it and the world can try.", minAge: 40, power: 7, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "shield::vibranium" }),
      k("captain-america", { id: "shield::worthy", name: "Worthy", blurb: "He lifts the hammer. He always could.", minAge: 45, power: 8, style: "strike", kind: "burst", energy: 3, effect: "Wins leave them Shocked.", cooldown: 1, element: "lightning" }),
    ],
  },
  {
    legend: "flash",
    id: "kit:flash",
    name: "Speed Force",
    blurb: "Lightning, a coma, and a world that suddenly moves in slow motion. Every move is a running start.",
    ultimateAge: 33,
    leadsUltimate: true,
    replaces: { powers: ["super-speed", "thunder-sprint"], line: "Barry's speed comes through the Speed Force: these moves live there now." },
    edge: 0.55,
    piece: "speed trick",
    moves: [
      k("flash", { id: "speedforce::jab", name: "Lightning Jab", blurb: "A hundred punches. They only feel the first.", minAge: 25, power: 5, style: "strike", kind: "burst", energy: 1, effect: "Wins leave them Shocked.", cooldown: 0, element: "lightning" }),
      k("flash", { id: "speedforce::mirage", name: "Speed Mirage", blurb: "They hit the you from half a second ago.", minAge: 25, power: 5, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "speed" }),
      k("flash", { id: "speedforce::phase", name: "Phase Step", blurb: "Vibrate fast enough and their swing goes through.", minAge: 25, power: 5, style: "trick", kind: "dash", energy: 1, effect: "Hits harder when it answers their tell. Wins leave them Exposed.", cooldown: 0, element: "warp" }),
      k("flash", { id: "speedforce::tornado", name: "Tornado Arms", blurb: "Spin both arms. Make the weather personal.", minAge: 27, power: 6, style: "guard", kind: "guard", energy: 2, effect: "Wins leave them Frosted in the vortex.", cooldown: 1, element: "wind", upgrades: "speedforce::mirage" }),
      k("flash", { id: "speedforce::throw", name: "Lightning Throw", blurb: "Run a lap, catch the spark, throw it.", minAge: 29, power: 6, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Shocked.", cooldown: 1, element: "lightning" }),
      k("flash", { id: "speedforce::steal", name: "Speed Steal", blurb: "Their momentum is yours now. Say thank you.", minAge: 31, power: 5, style: "trick", kind: "status", energy: 2, effect: "Wins leave them Frosted: slow, hitting 15% weaker.", cooldown: 1, element: "speed", applies: "frost" }),
      k("flash", { id: "speedforce::imp", name: "Infinite Mass Punch", blurb: "A run-up from across the city. Physics files a complaint.", minAge: 33, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Exposed.", cooldown: 1, element: "lightning", applies: "expose", upgrades: "speedforce::jab" }),
      k("flash", { id: "speedforce::rewind", name: "Rewind", blurb: "Ten seconds back. Try that again.", minAge: 36, power: 6, style: "trick", kind: "status", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "life", applies: "ward" }),
      k("flash", { id: "speedforce::remnant", name: "Time Remnant", blurb: "Another you, from ten seconds from now, steps in the way.", minAge: 38, power: 7, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "speedforce::tornado" }),
      k("flash", { id: "speedforce::storm", name: "Speed Force Storm", blurb: "The sky over the city turns blue and starts to run.", minAge: 45, power: 8, style: "strike", kind: "area", energy: 3, effect: "Hits wide. Wins leave them Shocked.", cooldown: 1, element: "lightning" }),
    ],
  },
  {
    legend: "superman",
    id: "kit:superman",
    name: "Kryptonian Arts",
    blurb: "A yellow sun, a farm in Kansas, and a lot of practice holding back. Every move is one he learned to aim.",
    ultimateAge: 30,
    leadsUltimate: true,
    replaces: { powers: ["super-strength", "flight", "super-durability"], line: "Clark fights with what Krypton gave him: these moves come from the Kryptonian Arts." },
    edge: 0.55,
    piece: "Kryptonian art",
    moves: [
      k("superman", { id: "krypton::bulletproof", name: "Bulletproof", blurb: "Bullets bounce. The shirt doesn't.", minAge: 13, power: 5, style: "guard", kind: "guard", energy: 1, effect: "Takes the edge off what comes back.", cooldown: 0, element: "force" }),
      k("superman", { id: "krypton::glare", name: "Heat Glare", blurb: "Eyes go red. The barn gets warm.", minAge: 13, power: 5, style: "strike", kind: "burst", energy: 1, effect: "Wins leave them Burning.", cooldown: 0, element: "fire" }),
      k("superman", { id: "krypton::blur", name: "Blur", blurb: "There, then not, then behind you.", minAge: 13, power: 5, style: "trick", kind: "dash", energy: 1, effect: "Hits harder when it answers their tell.", cooldown: 0, element: "speed" }),
      k("superman", { id: "krypton::xray", name: "X-Ray Read", blurb: "He sees the hand in the pocket and the fear behind it.", minAge: 15, power: 4, style: "trick", kind: "status", energy: 1, effect: "Shocks them: their tells can't lie.", cooldown: 1, element: "psychic", applies: "shock" }),
      k("superman", { id: "krypton::freeze", name: "Freeze Breath", blurb: "One breath and the punch stops in mid-air.", minAge: 17, power: 6, style: "guard", kind: "status", energy: 2, effect: "Wins leave them Frosted.", cooldown: 1, element: "ice" }),
      k("superman", { id: "krypton::heat", name: "Heat Vision", blurb: "He finally lets it all the way out.", minAge: 18, power: 7, style: "strike", kind: "burst", energy: 2, effect: "Wins leave them Burning.", cooldown: 0, element: "fire", upgrades: "krypton::glare" }),
      k("superman", { id: "krypton::tackle", name: "Flying Tackle", blurb: "Through three walls and a parking garage.", minAge: 20, power: 6, style: "strike", kind: "dash", energy: 2, effect: "Single hit.", cooldown: 1, element: "speed" }),
      k("superman", { id: "krypton::breath", name: "Super-Breath", blurb: "One breath clears the street.", minAge: 24, power: 6, style: "trick", kind: "area", energy: 2, effect: "Hits wide. Wins leave them Frosted.", cooldown: 1, element: "wind", upgrades: "krypton::blur" }),
      k("superman", { id: "krypton::steel", name: "Man of Steel", blurb: "He stands still and lets the world find out.", minAge: 28, power: 7, style: "guard", kind: "guard", energy: 2, effect: "Wins leave you a Ward.", cooldown: 1, element: "shield", upgrades: "krypton::bulletproof" }),
      k("superman", { id: "krypton::flare", name: "Solar Flare", blurb: "Every sunrise he ever stored, at once.", minAge: 30, power: 9, style: "strike", kind: "burst", energy: 3, effect: "One target, full weight. Wins leave them Burning.", cooldown: 1, element: "light", applies: "burn", upgrades: "krypton::tackle" }),
      k("superman", { id: "krypton::clap", name: "Thunderclap", blurb: "Two hands, one sonic boom.", minAge: 34, power: 7, style: "strike", kind: "area", energy: 3, effect: "Hits wide.", cooldown: 1, element: "force" }),
      k("superman", { id: "krypton::fortress", name: "Fortress Training", blurb: "Jor-El's lessons, finally making sense.", minAge: 38, power: 6, style: "trick", kind: "status", energy: 2, effect: "Wins leave them Exposed.", cooldown: 1, element: "psychic" }),
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
