/**
 * Mystery mode (the default life): the power is sealed at birth and wakes on a random birthday from 7 to 15.
 * Childhood drops hints — omens — tied to the hidden power's element, the upbringing, and the traits, so the
 * reveal pays off something the player has been squinting at for years.
 *
 * Pure data and pure functions. The engine owns the RNG and the state.
 */
import { allPowers, getPower } from "./combo";
import { ELEMENTS, elementOfPower, type ElementId } from "./elements";
import type { TraitId, UpbringingId } from "./types";

export const WAKE_MIN = 7;
export const WAKE_MAX = 15;

/** Base powers each upbringing leans toward. Not a guarantee: a nudge. */
const UPBRINGING_LEAN: Record<UpbringingId, string[]> = {
  supportive: ["flight", "elasticity", "force-field"],
  skeptical: ["super-senses", "invisibility"],
  legacy: ["energy-projection", "super-strength", "flight"],
  absent: ["teleportation", "ice-control", "invisibility"],
  scientific: ["energy-projection", "telekinesis", "force-field", "gravity"],
  normal: [],
  alien: ["flight", "super-strength", "energy-projection", "gravity"],
  tragic: ["invisibility", "regeneration", "fire-control"],
  military: ["super-durability", "super-strength", "super-senses"],
  wealthy: ["telepathy", "force-field", "teleportation"],
  foster: ["shape-shifting", "regeneration", "super-senses"],
  rural: ["weather", "super-strength", "lightning-control"],
  program: ["telekinesis", "teleportation", "telepathy"],
  street: ["super-speed", "invisibility", "elasticity"],
  celebrity: ["energy-projection", "flight", "fire-control"],
  isolated: ["telepathy", "gravity", "ice-control"],
};

const TRAIT_LEAN: Partial<Record<TraitId, string[]>> = {
  secret: ["invisibility", "shape-shifting"],
  loud: ["fire-control", "lightning-control", "energy-projection"],
  reluctant: ["force-field", "regeneration"],
  protector: ["force-field", "super-durability"],
  vengeful: ["fire-control", "lightning-control"],
  idealistic: ["flight", "energy-projection"],
  pragmatic: ["telekinesis", "super-senses"],
  team: ["telepathy", "force-field"],
  lone: ["invisibility", "teleportation"],
  curious: ["super-senses", "telepathy", "gravity"],
  glory: ["flight", "fire-control"],
  amends: ["regeneration", "ice-control"],
  duty: ["super-durability", "super-strength"],
  thrill: ["super-speed", "flight", "elasticity"],
  family: ["force-field", "regeneration"],
};

/** Born gifts: every base power except the learned ones. */
export function bornBases(): string[] {
  return allPowers()
    .filter((power) => power.generation === 0 && !power.tags.includes("mystic"))
    .map((power) => power.id);
}

/**
 * Pick the sealed gift. `r1`/`r2` are two uniform rolls from the engine. Upbringing leans count triple, traits
 * double. About one life in eight gets a rare braided (Gen 1) gift built on the chosen base.
 */
export function pickHiddenGift(upbringing: UpbringingId, traits: readonly TraitId[], r1: number, r2: number): string {
  const bases = bornBases();
  const weight = new Map<string, number>(bases.map((id) => [id, 1]));
  for (const id of UPBRINGING_LEAN[upbringing] ?? []) if (weight.has(id)) weight.set(id, (weight.get(id) ?? 0) + 3);
  for (const trait of traits) for (const id of TRAIT_LEAN[trait] ?? []) if (weight.has(id)) weight.set(id, (weight.get(id) ?? 0) + 2);
  const total = [...weight.values()].reduce((a, b) => a + b, 0);
  let at = r1 * total;
  let pick = bases[0] ?? "fire-control";
  for (const [id, w] of weight) {
    at -= w;
    if (at <= 0) {
      pick = id;
      break;
    }
  }
  if (r2 < 0.12) {
    const braids = allPowers().filter((power) => power.generation === 1 && power.ingredients.includes(pick));
    const braid = braids[Math.floor(((r2 / 0.12) * braids.length) % Math.max(1, braids.length))];
    if (braid) return braid.id;
  }
  return pick;
}

export function pickWakeAge(r: number): number {
  return WAKE_MIN + Math.min(WAKE_MAX - WAKE_MIN, Math.floor(r * (WAKE_MAX - WAKE_MIN + 1)));
}

/** Omens per element. Kid-sized, specific, and a little uncanny. */
const OMENS: Record<ElementId, string[]> = {
  fire: ["The birthday candles light themselves a second before the match.", "Your hands are always warm. Snowballs melt before you can throw them.", "The radiator clanks when you are angry. The radiator is not on."],
  ice: ["Your juice box is frozen solid again. It was in your hand.", "Frost ferns grow on your bedroom window in July.", "When you cry, the tears are cold enough to sting."],
  lightning: ["The TV fizzes when you run past it.", "Your hair stands up before every thunderstorm, hours before the forecast.", "You get a shock from the doorknob. The doorknob is wooden."],
  light: ["The night-light gets brighter when you are scared.", "In photos, you are always a little overexposed.", "Shadows lean away from you at sunset."],
  energy: ["The street lamp on your block brightens when you walk under it.", "Your fingertips leave faint blue smudges on the bathroom mirror.", "Batteries die in your pocket. All of them. Every week."],
  psychic: ["You answer a question before your mom finishes asking it.", "You dream about a phone call. It comes the next morning.", "The cat stares at the space behind your head, then at you, then leaves."],
  speed: ["The playground race ends and you don't remember the middle.", "Your sneakers wear out in a week. Mom checks the receipts.", "You catch a falling glass. You were across the kitchen."],
  wind: ["Kites fly on still days when you are holding the string.", "Doors slam when you are upset. The windows are shut.", "Rain stops for exactly as long as you stand in it."],
  gravity: ["Your crayons roll toward you. On a flat table.", "You jump off the swing and land a beat too late, softly.", "The scale at the doctor's reads something different every time you breathe."],
  force: ["You open a jar your dad gave up on. Then the jar breaks.", "You dent the car door closing it. You were trying to be gentle.", "The bully pushes you. He bounces."],
  shadow: ["Your teacher marks you absent. You were in the front row.", "The motion lights never notice you.", "In the school photo, you are blurry. Only you."],
  warp: ["You fall asleep on the couch and wake up in your bed.", "You lose your shoe in the park. It is by the front door when you get home.", "You blink in the hallway and you are at the end of it."],
  arcane: ["The old book in the attic opens to the same page every time.", "You doodle a symbol in the margin. The pencil gets hot.", "Candles flicker toward you like they are listening."],
  life: ["Your scraped knee is gone by lunch.", "The dead plant on the windowsill is alive again.", "You never catch the cold that the whole class catches."],
  shield: ["A dodgeball stops an inch from your face, then drops.", "You fall off the jungle gym. Not a scratch. The mulch is flattened in a perfect circle.", "Rain beads on the air above your head."],
  stretch: ["You reach the cookie jar on the top shelf. You didn't use the chair.", "Your arm aches like it went somewhere without you.", "You can touch your elbow with your tongue. Both elbows."],
};

const HOME_FRAME: Partial<Record<UpbringingId, string>> = {
  supportive: "Your folks film it, just in case.",
  skeptical: "Your parents decide it was a draft.",
  legacy: "Someone in the family goes very quiet and checks the old cape in the closet.",
  absent: "Nobody is home to see it. You keep it to yourself.",
  scientific: "Your parent writes it down in a lab notebook with your name on it.",
  alien: "Your family exchanges a look in a language you're still learning.",
  tragic: "You wish you could tell the one who's gone.",
  military: "It goes in a report. You don't know who reads it.",
  wealthy: "The staff pretend not to notice. One of them makes a phone call.",
  foster: "You don't mention it. You don't want to be moved again.",
  rural: "Grandpa says the land does strange things to kids out here.",
  program: "A clipboard appears the next day. So does a new nurse.",
  street: "The kids on the block saw it. Now they want you on their team.",
  celebrity: "A paparazzo almost gets the shot.",
  isolated: "There's no one around for miles to tell.",
};

export function omenFor(giftId: string | null | undefined, upbringing: UpbringingId, seen: number, r: number): string {
  const element = elementOfPower(giftId ?? null);
  const list = OMENS[element] ?? OMENS.energy;
  const line = list[(seen + Math.floor(r * list.length)) % list.length] ?? list[0]!;
  const frame = HOME_FRAME[upbringing];
  return frame && r < 0.6 ? `${line} ${frame}` : line;
}

/** Three suspects for the "call it" guess: the real element plus two decoys, in a stable shuffled order. */
export function guessOptions(giftId: string | null | undefined, salt: number): ElementId[] {
  const real = elementOfPower(giftId ?? null);
  const all = Object.keys(ELEMENTS).filter((id) => id !== "arcane" && id !== real) as ElementId[];
  const a = all[salt % all.length]!;
  const b = all[(salt * 7 + 3) % all.length] === a ? all[(salt + 5) % all.length]! : all[(salt * 7 + 3) % all.length]!;
  const three: ElementId[] = [real, a, b];
  const rot = salt % 3;
  return [...three.slice(rot), ...three.slice(0, rot)];
}

export const ELEMENT_ORDER = Object.keys(ELEMENTS) as ElementId[];

/** The headline for the reveal screen. */
export function revealLine(giftId: string, age: number): string {
  const power = getPower(giftId);
  const element = elementOfPower(giftId);
  const by: Record<ElementId, string> = {
    fire: "The kitchen goes orange. Every candle in the house answers at once.",
    ice: "The puddle under your feet freezes in a ring that keeps going down the street.",
    lightning: "Every light on the block flares, then the sky answers with a crack.",
    light: "For one second you are the brightest thing for a mile.",
    energy: "Blue light pours off your hands and punches a hole in the clouds.",
    psychic: "The whole classroom goes silent, and you can hear every one of them thinking.",
    speed: "You blink and you are three blocks away, out of breath, laughing.",
    wind: "The wind comes when you call it. It knocks you flat, then lifts you up.",
    gravity: "Everything in the room floats an inch, waits, and looks at you.",
    force: "You catch the falling scaffold with one hand. The sidewalk cracks under you.",
    shadow: "You step into the hallway shadow and the whole school loses you.",
    warp: "You fold the air and step through it into the place you were thinking of.",
    arcane: "A circle of light writes itself around your feet in a language you somehow read.",
    life: "Your broken arm knits in front of the whole ER.",
    shield: "The car hits a wall you made out of nothing. Then the wall glows.",
    stretch: "You catch your friend from the top of the bleachers. From the bottom.",
  };
  return `${by[element]} At ${age}, it is finally here: ${power?.name ?? "something"}.`;
}
