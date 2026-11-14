/**
 * Mentors and the age-15 mixing gate (2026-11-03 pm, owner decision).
 *
 * Power mixing opens at 15, never earlier. On the 15th birthday a mentor finds you: someone who fits
 * your city and upbringing, or (God Mode) the legend's own canon teacher in this universe. Once a month
 * they run one lesson: a guided braid (they know the recipe, and the new power lands a little drilled),
 * a hard drill on your focus power, or a study night that writes a recipe into your book.
 *
 * All of it is data: add a mentor by adding a row. Presets are keyed by legend id so renaming a legend
 * never breaks its mentor.
 */
import { basePowers, getPower, possibleMixes, type CatalogPower, type PossibleMix } from "./combo";
import { legendFits } from "./kin";
import type { Game } from "./types";

/** The owner's rule: no mixing before this age, for any life or mode. */
export const MIX_AGE = 15;

export interface MentorDef {
  id: string;
  name: string;
  /** Who they are in one short line (shown under the name). */
  title: string;
  /** What they say the day they find you. */
  hello: string;
  /** Their take on mixing, shown on the braid lesson. */
  craft: string;
  /** Accent colour for the mentor card. */
  color: string;
  /** Icon on the card: a glyph from the mentor's world. */
  sigil: "shield" | "flame" | "book" | "star" | "bolt" | "fist" | "eye" | "crown" | "wrench" | "leaf";
}

const m = (id: string, name: string, title: string, hello: string, craft: string, color: string, sigil: MentorDef["sigil"]): MentorDef => ({ id, name, title, hello, craft, color, sigil });

/** God Mode legends: each one's canon teacher, bent for this universe. */
export const LEGEND_MENTORS: Record<string, MentorDef> = {
  "spider-man": m("ben-parker", "Ben Parker", "Your uncle, who fixes things", "Uncle Ben finds the web fluid in the sink and doesn't yell. He just asks what you're going to do with it.", "Two gifts in one pair of hands is a bigger promise. Make it on purpose.", "#d63b3b", "shield"),
  batman: m("alfred", "Alfred Pennyworth", "The family's butler, ex-SAS", "Alfred lays out a mat in the east wing and two cups of tea. Only one of them is for him.", "Combine nothing you cannot control at three in the morning, Master Bruce.", "#8a94a8", "eye"),
  "iron-man": m("yinsen", "Ho Yinsen", "A surgeon who builds in the dark", "A letter arrives from a doctor your father once ignored. He has read your schematics. He has notes.", "Every system is two systems arguing. Solder the argument shut.", "#e0a92e", "wrench"),
  hulk: m("samson", "Dr. Leonard Samson", "A gamma-curious psychiatrist", "A calm man with a clipboard asks how angry you are on a scale of one to ten. He believes the answer.", "Rage plus anything is still rage. Breathe first, then braid.", "#5fbf4a", "leaf"),
  superman: m("jonathan-kent", "Jonathan Kent", "Your father, a farmer", "Pa takes you out past the north field where nobody can see, and hands you a tractor tire.", "You can do more than other people. That's why you go slow.", "#3a7bd5", "star"),
  "wonder-woman": m("antiope", "General Antiope", "Your aunt, Themyscira's finest", "Antiope wakes you before dawn. The sword is real. So is the bruise.", "A gift alone is a blade. Two gifts are a formation. Train the formation.", "#d4a23a", "crown"),
  "captain-america": m("erskine", "Dr. Abraham Erskine", "The scientist who saw your heart", "A small man with a big accent watches you stand up to a bully twice your size, and takes notes.", "The serum amplifies what is inside. So does every mix. Be careful what you amplify.", "#3a6fd8", "shield"),
  thor: m("odin", "Odin Allfather", "Your father, the king", "Odin calls you to the throne room without your brother. He speaks of worthiness for an hour.", "Lightning answers the worthy. Mix nothing you would not be proud to wield.", "#e6c35a", "bolt"),
  "black-panther": m("zuri", "Zuri", "Wakanda's elder, keeper of the herb", "Zuri walks you to the city of the dead and back, and calls it a stroll.", "The heart-shaped herb gives. Your discipline decides what it becomes.", "#8a5cd8", "crown"),
  wolverine: m("ogun", "Ogun", "A swordmaster who never sleeps", "A man with a sword and no name shows up at the logging camp. He knows what you are.", "The animal wants one thing. Teach it a second thing, and it is a weapon.", "#f0c33a", "fist"),
  flash: m("jay-garrick", "Jay Garrick", "The first Flash, retired", "A man in a winged helmet waits at the end of your morning run. He was there before you.", "Speed plus anything is a shortcut. Learn the long way once, so the shortcut is safe.", "#e23b2e", "bolt"),
};

/** Ordinary lives: upbringing first (it's who raised you), city second. */
export const UPBRINGING_MENTORS: Partial<Record<string, MentorDef>> = {
  military: m("sgt-okafor", "Sgt. Maya Okafor", "Retired rapid-response, your parent's old unit", "Sgt. Okafor shows up at the base gym with a stopwatch and no small talk.", "Two powers is a two-person team. Drill the handoff until it's boring.", "#7d9a5a", "shield"),
  program: m("dr-halloway", "Dr. Ines Halloway", "The one kind scientist from the lab", "Dr. Halloway quit the program and found you. She brought your file, and a plan.", "The lab mixed things to see what broke. We mix things to see what holds.", "#5fd3e0", "book"),
  street: m("pops-delgado", "Pops Delgado", "Ex-cape who runs a boxing gym", "Pops tapes your hands and says the gym has a rule: you sweep before you swing.", "Any fool can throw two punches. Make them one combination.", "#e07a3a", "fist"),
  alien: m("vael", "Vael", "An exile from your mother world", "A stranger who glows a little in the rain says your name in a language you dream in.", "On our world, children braid gifts at fifteen. You are right on time.", "#9a7bff", "star"),
  wealthy: m("kessler", "Mr. Kessler", "The family's private trainer", "Mr. Kessler has trained three heirs. He bills by the hour and actually cares.", "Money buys equipment. It does not buy the second gift's respect.", "#d8b45a", "crown"),
  foster: m("sister-ruth", "Sister Ruth", "Ran the home; wore a cape once", "Sister Ruth closes the office door and takes an old domino mask out of the drawer.", "Every kid here learned to share. Your gifts can learn it too.", "#c88ad8", "leaf"),
  rural: m("old-wick", "Old Man Wick", "Stopped a tornado in '79", "Old Man Wick leans on the fence and says he hasn't seen weather like you in forty years.", "Two winds make a storm. A storm needs a fence, and the fence is you.", "#b0a070", "leaf"),
  celebrity: m("lux-arden", "Lux Arden", "Retired cape with a talk show", "Lux Arden books you on her show, then cancels it and books a training room instead.", "Cameras love a new power. Earn it first, then let them look.", "#ff7ab0", "star"),
  isolated: m("keeper", "The Keeper", "A voice on a shortwave radio", "The old radio clicks on by itself at midnight. The voice knows your gift's name.", "Alone is fine. Alone and careless is not. Mix with the lights on.", "#7ab0d8", "eye"),
  tragic: m("nora-vance", "Det. Nora Vance", "The cop who worked your family's case", "Detective Vance never closed your family's file. She opens a new one: yours.", "Grief makes power loud. Mixing makes it louder. We go slow.", "#d0584a", "eye"),
  legacy: m("old-guard", "The Old Guard", "Your parent's former teammate", "Your parent's old teammate shows up with a photo album and a training schedule.", "Your mother braided her first pair at fifteen. She also broke a wall doing it.", "#e6b34d", "shield"),
  scientific: m("prof-ilse", "Prof. Ilse Marr", "Your parents' rival, and friend", "Professor Marr takes you on as a lab assistant. The lab is a rooftop. The experiment is you.", "Hypothesis: you can hold two. Method: carefully. Result: we'll see.", "#5fd3e0", "book"),
};

export const CITY_MENTORS: Record<string, MentorDef> = {
  nyc: m("cap-ruiz", "Cap'n Ruiz", "League veteran, NYPD retired", "Cap'n Ruiz flashes an old League badge at the bodega and buys you a coffee you are too young for.", "This city has eight million people and two of your gifts. Respect both numbers.", "#e6b34d", "shield"),
  hood: m("miss-odette", "Miss Odette", "Corner-store owner, ex-vigilante", "Miss Odette shuts the store early and takes you to the roof. The view is the lesson.", "Keep your gifts close. Mix them where the block can't see.", "#e07a3a", "fist"),
  stacks: m("forge", "Forge", "A welder who used to be a hero", "Forge hands you a welding mask. 'Two metals,' she says. 'One seam. You next.'", "Mixing is welding. Heat, pressure, patience, and a clean seam.", "#d08a4a", "wrench"),
  metro: m("skyline", "Skyline", "A League flyer, semi-retired", "Skyline drops onto the bus shelter and asks if you want to learn to do this properly.", "Every League rookie learns to braid on a rooftop. Welcome to the rooftop.", "#5fa8ff", "star"),
  harbor: m("tide", "Tide", "Harbor patrol, part myth", "A woman steps out of the fog on the pier and calls you by your gift's name.", "Two currents meet and make a third. Don't fight it. Steer it.", "#3fbfb0", "leaf"),
  neon: m("glint", "Glint", "A burned-out light-show cape", "Glint finds you after a blackout. 'That was you,' he says. 'Let's make it pretty.'", "Any kid can glow. Two glows that don't blind each other? That's craft.", "#ff5ad8", "flame"),
  dust: m("ranger-okoye", "Ranger Okoye", "Desert patrol, out past the last light", "Ranger Okoye pulls her truck up to the trailer and leaves the passenger door open.", "Out here a mistake echoes for miles. We mix where nothing can burn.", "#d8a05a", "leaf"),
  crown: m("dame-ashby", "Dame Ashby", "The League chapter's old fencing master", "Dame Ashby sends an embossed invitation. Training is at six. Tea is at seven. Both are mandatory.", "Elegance is two gifts that never step on each other's feet.", "#c0a0e0", "crown"),
};

const FALLBACK = m("coach-sol", "Coach Sol", "A community-center coach who notices", "Coach Sol watches you lift the bleachers by accident, and hands you a clipboard instead of a lecture.", "Two gifts, one body. We teach the body to say yes to both.", "#e6b34d", "fist");

/**
 * Mentor faces (2026-11-14 pm): who each mentor looks like on their card, as data. Sex and a rough age feed the painted
 * bust (`Portrait`); the seed comes from the id, so a mentor's face never changes. Unknown ids fall back to a 55-year-old.
 */
export const MENTOR_FACE: Record<string, { sex: "male" | "female"; age: number }> = {
  "ben-parker": { sex: "male", age: 56 }, alfred: { sex: "male", age: 64 }, yinsen: { sex: "male", age: 58 }, samson: { sex: "male", age: 46 },
  "jonathan-kent": { sex: "male", age: 58 }, antiope: { sex: "female", age: 46 }, erskine: { sex: "male", age: 60 }, odin: { sex: "male", age: 82 },
  zuri: { sex: "male", age: 66 }, ogun: { sex: "male", age: 54 }, "jay-garrick": { sex: "male", age: 72 },
  "sgt-okafor": { sex: "female", age: 50 }, "dr-halloway": { sex: "female", age: 52 }, "pops-delgado": { sex: "male", age: 66 }, vael: { sex: "female", age: 40 },
  kessler: { sex: "male", age: 54 }, "sister-ruth": { sex: "female", age: 68 }, "old-wick": { sex: "male", age: 78 }, "lux-arden": { sex: "female", age: 48 },
  keeper: { sex: "male", age: 70 }, "nora-vance": { sex: "female", age: 49 }, "old-guard": { sex: "male", age: 61 }, "prof-ilse": { sex: "female", age: 57 },
  "cap-ruiz": { sex: "male", age: 63 }, "miss-odette": { sex: "female", age: 64 }, forge: { sex: "female", age: 44 }, skyline: { sex: "male", age: 52 },
  tide: { sex: "female", age: 45 }, glint: { sex: "male", age: 47 }, "ranger-okoye": { sex: "female", age: 51 }, "dame-ashby": { sex: "female", age: 69 },
  "coach-sol": { sex: "male", age: 55 },
};

/** A mentor's face: sex, age and a stable portrait seed from the id. */
export function mentorFace(id: string): { sex: "male" | "female"; age: number; seed: number } {
  const row = MENTOR_FACE[id] ?? { sex: "male" as const, age: 55 };
  let seed = 7;
  for (const ch of id) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return { ...row, seed: (seed >>> 0) % 100000 || 1 };
}

/** The mentor this life gets at 15. Legend → its canon teacher; else upbringing; else city. */
export function mentorFor(g: Pick<Game, "preset" | "upbringing" | "cityId">): MentorDef {
  return (g.preset ? LEGEND_MENTORS[g.preset] : undefined) ?? UPBRINGING_MENTORS[g.upbringing] ?? CITY_MENTORS[g.cityId] ?? FALLBACK;
}

export function mentorById(id: string | null | undefined): MentorDef | null {
  if (!id) return null;
  for (const table of [LEGEND_MENTORS, UPBRINGING_MENTORS, CITY_MENTORS]) for (const row of Object.values(table)) if (row?.id === id) return row;
  return id === FALLBACK.id ? FALLBACK : null;
}

/** Null when mixing is open; otherwise the line the UI shows on the lock. */
export function mixLock(g: Pick<Game, "age">): string | null {
  if (g.age >= MIX_AGE) return null;
  const years = MIX_AGE - g.age;
  return `Mixing unlocks at ${MIX_AGE}. ${years} year${years === 1 ? "" : "s"} to go — a mentor will find you then.`;
}

export const mixOpen = (g: Pick<Game, "age">): boolean => g.age >= MIX_AGE;

/**
 * The braid a mentor steers you toward: the owner's required chain first (Light Speed, then
 * Lightning Strikes), then powers that fit the legend's canon, then the gentlest generation.
 */
export function mentorBraid(g: Game): PossibleMix | null {
  if (!mixOpen(g)) return null;
  const options = possibleMixes(g.unlockedPowers ?? []);
  if (!options.length) return null;
  const chain = ["light-speed", "lightning-strikes"];
  const score = (o: PossibleMix) =>
    (chain.includes(o.result.id) ? 100 : 0) + (g.preset && legendFits(g.preset, o.result.id) ? 20 : 0) + (2 - o.result.generation) * 5 + ((g.discovered ?? []).includes(o.result.id) ? 2 : 0);
  return [...options].sort((a, b) => score(b) - score(a) || a.result.name.localeCompare(b.result.name))[0] ?? null;
}

/**
 * The base power a mentor tries to wake in you (2026-11-10 eve): the owner's required chain first (Super Speed
 * for a Fire Control life, Super Strength once Light Speed is yours, Fire Control for a speedster), then a base
 * that braids with what you hold into a named recipe (the legend's canon first), then any.
 */
export function mentorAwaken(g: Game): CatalogPower | null {
  const owned = new Set(g.unlockedPowers ?? []);
  const free = basePowers().filter((p) => !owned.has(p.id));
  if (!free.length || !owned.size) return null;
  const pick = (id: string) => free.find((p) => p.id === id) ?? null;
  if (owned.has("light-speed") && !owned.has("super-strength")) return pick("super-strength");
  if (owned.has("fire-control") && !owned.has("super-speed") && !owned.has("light-speed")) return pick("super-speed");
  if (owned.has("super-speed") && !owned.has("fire-control") && !owned.has("light-speed")) return pick("fire-control");
  const score = (p: CatalogPower) => {
    const opens = possibleMixes([...owned, p.id]).filter((m) => m.left.id === p.id || m.right.id === p.id).length;
    return (g.preset && legendFits(g.preset, p.id) ? 20 : 0) + Math.min(3, opens) * 3 + ((g.discovered ?? []).includes(p.id) ? 2 : 0);
  };
  return [...free].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))[0] ?? null;
}

/** A recipe the mentor can teach you about on a study night: one you could braid soon, not yet in your notes. */
export function mentorRecipe(g: Game): string | null {
  const owned = new Set(g.unlockedPowers ?? []);
  const known = new Set(g.discovered ?? []);
  const now = possibleMixes(g.unlockedPowers ?? []).find((o) => !known.has(o.result.id));
  if (now) return now.result.id;
  for (const id of owned) {
    const p = getPower(id);
    if (!p) continue;
    for (const other of ["super-strength", "super-speed", "fire-control", "flight", "telekinesis", "energy-projection"]) {
      if (owned.has(other)) continue;
      const opened = possibleMixes([...owned, other]).find((o) => (o.left.id === other || o.right.id === other) && !known.has(o.result.id));
      if (opened) return opened.result.id;
    }
  }
  return null;
}

/** Lessons get a little better as the bond grows, with diminishing returns. */
export function mentorBoost(bond: number): number {
  return 1 + Math.min(0.5, Math.max(0, bond) / 200);
}

/** Bond gain shrinks as it rises: 6 at 0, ~1 near 100. */
export function mentorBondGain(bond: number): number {
  return Math.max(1, Math.round(6 * (1 - Math.max(0, Math.min(100, bond)) / 120)));
}
