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
  fire: ["The birthday candles light themselves a second before the match.", "Your hands are always warm. Snowballs melt before you can throw them.", "The radiator clanks when you are angry. The radiator is not on.", "Your bathwater is always too hot by the time you get out.", "Toast burns when you're impatient. You haven't touched the toaster.", "The campfire leans toward you like a dog that wants a pat."],
  ice: ["Your juice box is frozen solid again. It was in your hand.", "Frost ferns grow on your bedroom window in July.", "When you cry, the tears are cold enough to sting.", "Your popsicle never melts. Not even in August.", "Your fingertips leave little white ferns on the car window.", "The class goldfish bowl gets a skin of ice when you tap it."],
  lightning: ["The TV fizzes when you run past it.", "Your hair stands up before every thunderstorm, hours before the forecast.", "You get a shock from the doorknob. The doorknob is wooden.", "Static zaps everyone you high-five.", "Your nightlight flickers in time with your heartbeat.", "The arcade machine gives you a free game every time you lean on it."],
  light: ["The night-light gets brighter when you are scared.", "In photos, you are always a little overexposed.", "Shadows lean away from you at sunset.", "Fireflies follow you home from the park.", "Your eyes shine in the dark like a cat's. Only in photos.", "Sunbeams find you in every room, even the ones without windows."],
  energy: ["The street lamp on your block brightens when you walk under it.", "Your fingertips leave faint blue smudges on the bathroom mirror.", "Batteries die in your pocket. All of them. Every week.", "Your crayon drawings glow a little after the lights go out.", "The remote works better when you hold it upside down. No batteries.", "Your hair crackles when you're excited, like a balloon rubbed on wool."],
  psychic: ["You answer a question before your mom finishes asking it.", "You dream about a phone call. It comes the next morning.", "The cat stares at the space behind your head, then at you, then leaves.", "You know who's on the phone before it rings.", "You dream the plot of a movie before it comes out.", "Your little cousin stops crying the second you look at her."],
  speed: ["The playground race ends and you don't remember the middle.", "Your sneakers wear out in a week. Mom checks the receipts.", "You catch a falling glass. You were across the kitchen.", "You finish your dinner before anyone sits down.", "Your bike chain snaps from how fast you pedal.", "You win tag so often the other kids invent a new rule just for you."],
  wind: ["Kites fly on still days when you are holding the string.", "Doors slam when you are upset. The windows are shut.", "Rain stops for exactly as long as you stand in it.", "Dandelion seeds swirl around you like they're dancing.", "Your bubbles never pop. They follow you instead.", "The weathervane on the school roof points at you."],
  gravity: ["Your crayons roll toward you. On a flat table.", "You jump off the swing and land a beat too late, softly.", "The scale at the doctor's reads something different every time you breathe.", "Your balloon never floats away. It hovers right where you let go.", "You never spill. Not once. Not even upside down.", "Marbles roll in circles around your feet."],
  force: ["You open a jar your dad gave up on. Then the jar breaks.", "You dent the car door closing it. You were trying to be gentle.", "The bully pushes you. He bounces.", "You pick up the family dog with one hand. It's a big dog.", "Your handprint stays in the clay at school. And the desk under it.", "You tug the tablecloth and the whole table follows."],
  shadow: ["Your teacher marks you absent. You were in the front row.", "The motion lights never notice you.", "In the school photo, you are blurry. Only you.", "You win hide-and-seek every time. Usually they give up.", "Your reflection is half a second late.", "The school photographer has to take yours four times."],
  warp: ["You fall asleep on the couch and wake up in your bed.", "You lose your shoe in the park. It is by the front door when you get home.", "You blink in the hallway and you are at the end of it.", "Your toys are never where you left them. They're where you wanted them.", "You arrive at school before the bus that dropped you off.", "You lose a sock. You find it inside a sealed jar."],
  arcane: ["The old book in the attic opens to the same page every time.", "You doodle a symbol in the margin. The pencil gets hot.", "Candles flicker toward you like they are listening.", "Your nightmares stop when you draw a circle on the floor.", "The cat brings you tiny gifts: a key, a ring, a coin with no face.", "You speak a word in your sleep that nobody in the house knows."],
  life: ["Your scraped knee is gone by lunch.", "The dead plant on the windowsill is alive again.", "You never catch the cold that the whole class catches.", "The class hamster lives three years longer than it should.", "Flowers bloom early on the walk to school.", "You never get the chickenpox. Nobody can explain why."],
  shield: ["A dodgeball stops an inch from your face, then drops.", "You fall off the jungle gym. Not a scratch. The mulch is flattened in a perfect circle.", "Rain beads on the air above your head.", "Bike crashes never leave a scratch on you. The bike's another story.", "Hailstones bounce off the air above your head.", "The ball that hits you comes back faster than it arrived."],
  stretch: ["You reach the cookie jar on the top shelf. You didn't use the chair.", "Your arm aches like it went somewhere without you.", "You can touch your elbow with your tongue. Both elbows.", "You can bend your thumb all the way back to your wrist. Both ways.", "You win limbo by a mile. Then by two.", "Your shirt sleeves keep getting too short. Then too long again."],
};

/**
 * Louder signs for the last stretch before the wake. Picked once the power is 2 years or less away,
 * so the foreshadowing builds toward the reveal instead of repeating the same three kid-sized lines.
 */
const LOUD_OMENS: Record<ElementId, string[]> = {
  fire: ["You sneeze and the curtains scorch. Two little black handprints sit on the wall where you leaned.", "The smoke alarm goes off every time you have a nightmare. Every time.", "A firework fizzles out at the fair. You stare at it and it relights, mid-air."],
  ice: ["The whole bathroom mirror frosts over while you brush your teeth. In the frost: your handprint, from the inside.", "Your breath fogs in a heated classroom. Everybody else's doesn't.", "The pond freezes in a perfect circle around the rock you're sitting on."],
  lightning: ["Every phone in the classroom buzzes at once when you get angry. The teacher confiscates yours. It's still buzzing.", "A blue spark jumps from your finger to your friend's ear. You both pretend that didn't happen.", "Lightning hits the flagpole outside your window three nights in a row."],
  light: ["You wake up and the bedroom is bright as noon. The clock says 3 a.m. The lamp is off.", "Your shadow is missing in the school photo. Everyone else has one.", "When you laugh too hard, the streetlights outside get jealous."],
  energy: ["The microwave starts when you walk past. It is unplugged.", "Your hand hums against the window and the glass sings a note you can feel in your teeth.", "A blue glow seeps out of your sleeves in the dark cinema. The usher asks you to put your phone away."],
  psychic: ["You hear your teacher think the test answers. You get every one right and feel sick about it.", "Your friend's dog sits down in front of you and you know, exactly, that it misses its old house.", "Someone across the bus is about to cry. You know before they do."],
  speed: ["You run for the bus and get there before it. Before the bus stop, too.", "The world goes slow for a second when a ball flies at your face. You watch it spin. You step aside.", "Your shoelaces melt a little after gym class."],
  wind: ["Your bedroom door blows shut so hard the hinges bend. The window's shut.", "Every umbrella on the street turns inside out the moment you're upset.", "The clouds above the schoolyard start to turn, slowly, in a circle with you at the middle."],
  gravity: ["Your feet don't touch the bottom stair. They just don't. For a whole second.", "The pencil on the desk rolls uphill toward you. Then the desk does.", "You drop your backpack and it falls slowly, like the air is thick."],
  force: ["You close your fist around a stress ball and it bursts like a balloon.", "You lean on the fence and the whole post leaves the ground.", "You catch the falling shelf with one hand. Your arm doesn't even shake."],
  shadow: ["The cafeteria lady looks right through you and serves the kid behind you. Twice.", "In the mirror, for half a second, there's no one there.", "Your dog barks at the place you were standing, not the place you are."],
  warp: ["You trip on the stairs at school and land on your bed at home. Your bag is still at school.", "Your watch is always nine seconds ahead. You reset it. It goes back to nine.", "You reach into your pocket for your keys and pull out a leaf from the park across town."],
  arcane: ["The candles at the birthday party bend toward you when you make your wish. All of them.", "You read a word out of the old book and the room goes cold and quiet.", "A circle of mushrooms grows overnight around the spot where you sleep in the yard."],
  life: ["You hold a hurt bird. It flies away. It was not just hurt.", "The bruise from the fall fades while you watch it, like a cloud moving off the sun.", "Every plant in your room leans toward your bed."],
  shield: ["A car rolls into you in the parking lot. The bumper crumples. You don't.", "Rain stops a hand's width above your head and runs off the air like a glass roof.", "The fire alarm drill: you walk through a closed glass door. It doesn't break. It just isn't between you anymore."],
  stretch: ["You wake up with your feet hanging off the end of the bed. In the morning they're back.", "You catch a ball nine feet away without moving your legs.", "Your fingers wrap all the way around a basketball. Twice."],
};

/** Some traits colour how the kid takes a sign. Used instead of the home frame part of the time. */
const TRAIT_FRAME: Partial<Record<string, string>> = {
  secret: "You tell no one. Not even the diary.",
  loud: "You tell everyone. Nobody believes you, which is almost worse.",
  reluctant: "You hope it stops. Part of you knows it won't.",
  protector: "Your first thought: could it have helped someone?",
  vengeful: "Your first thought is who you'd use it on. That scares you a little.",
  idealistic: "You write a whole page about how you'd use it for good.",
  curious: "You try to make it happen again. Twelve times. On the thirteenth, something twitches.",
  thrill: "You grin for a week.",
  lone: "You go somewhere nobody can see and try it alone.",
  amends: "You wonder if it's a punishment or a second chance.",
  glory: "You practise a pose in the mirror. Just in case.",
  duty: "It feels less like a gift and more like an order.",
  family: "You want to tell your family more than anything.",
};

/** How close the sealed power is to waking, from the kid's side of the skin. 0 faint … 3 any day now. */
export type OmenStage = 0 | 1 | 2 | 3;
export const OMEN_STAGES = ["Faint", "Stirring", "Loud", "Any day now"] as const;

export function omenStage(age: number, wakeAt: number | undefined): OmenStage {
  const left = (wakeAt ?? WAKE_MAX) - age;
  if (left <= 1) return 3;
  if (left <= 2) return 2;
  if (left <= 4) return 1;
  return 0;
}

/** Months between signs: the feeling comes back faster as the wake nears. */
export function omenCooldown(stage: OmenStage): number {
  return stage >= 3 ? 1 : stage === 2 ? 2 : stage === 1 ? 3 : 4;
}

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

export function omenFor(giftId: string | null | undefined, upbringing: UpbringingId, seen: number, r: number, stage: OmenStage = 0, traits: readonly string[] = []): string {
  const element = elementOfPower(giftId ?? null);
  const pool = stage >= 2 ? (LOUD_OMENS[element] ?? LOUD_OMENS.energy) : (OMENS[element] ?? OMENS.energy);
  const line = pool[(seen + Math.floor(r * pool.length)) % pool.length] ?? pool[0]!;
  const trait = traits.map((id) => TRAIT_FRAME[id]).filter(Boolean) as string[];
  const frame = r < 0.35 && trait.length ? trait[Math.floor(r * 1000) % trait.length] : HOME_FRAME[upbringing];
  return frame && r < 0.7 ? `${line} ${frame}` : line;
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

/** The three "Call it" suspects for this life, in the order the Powers tab shows them. */
export function callItOptions(g: { hiddenGift?: string | null; name: string; flags: Record<string, number> }): ElementId[] {
  return guessOptions(g.hiddenGift, g.name.length * 31 + (g.flags.manifestAge ?? 0) * 7);
}
