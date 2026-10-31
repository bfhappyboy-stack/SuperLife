/** Cities, childhoods, and traits. Add a row; the life sim reads the lists. */

import { getPower } from "./combo";
import { upbringingById } from "./data";
import { clamp } from "./format";
import { masteryLevel } from "./mastery";
import type { Effects, Game, TraitId, UpbringingId } from "./types";

export interface OriginBrief {
  city: string;
  upbringing: string;
  traits: string;
  local: boolean;
  note: string;
}

export interface CityDossier {
  id: string;
  scenes: string[];
  villains: string[];
  heroes: string[];
  arcs: string[];
  trouble: string;
  travel: string;
}

const FALLBACK: CityDossier = {
  id: "metro",
  scenes: ["The block is loud and none of it is about you, which is a gift."],
  villains: ["A local problem"],
  heroes: ["vesper"],
  arcs: ["kiln"],
  trouble: "Knows the shortcuts.",
  travel: "You arrive with one bag and a worse sense of the cross streets.",
};

export const DOSSIERS: CityDossier[] = [
  {
    id: "nyc",
    scenes: [
      "A subway car holds its breath between stations. Someone's radio is playing a cape's apology.",
      "From a water tower the avenues look like a circuit that never learned to sleep.",
      "A landmark has a velvet rope and, around the corner, a stairwell nobody photographs.",
    ],
    villains: ["Turnstile", "High Line"],
    heroes: ["juniper", "vesper", "wren", "nim"],
    arcs: ["mile", "choir", "understudy"],
    trouble: "Works the tunnels and the roofs.",
    travel: "New York takes your bag and does not offer a map. The noise is the map.",
  },
  {
    id: "hood",
    scenes: [
      "The corner store knows your order and your mother's. Only one of those is a compliment.",
      "A dice game stops when a car you don't know idles too long. Then it starts again.",
      "Someone's auntie is on a stoop with a hose and a verdict. Both of them work.",
    ],
    villains: ["Brick", "The Tab"],
    heroes: ["marrow", "nim", "lark", "vesper"],
    arcs: ["kiln", "lease", "heir"],
    trouble: "Collects on the block, not from a tower.",
    travel: "The Hood does not do welcomes. It does a once-over, and then it decides.",
  },
  {
    id: "stacks",
    scenes: [
      "The yard whistle blows. Half the arms that clock out were installed, not grown.",
      "A corp badge opens a door that a birth certificate never will. The fence is the point.",
      "Someone is jacked into a terminal in a boiler room. The light is a work lamp, not a sign.",
    ],
    villains: ["Yard Boss", "Badge Nine"],
    heroes: ["idris", "lark", "nim", "wren"],
    arcs: ["choir", "lease", "heir"],
    trouble: "Owns a shift, a debt, or both.",
    travel: "The Stacks smell like hot metal and rented air. Nothing glows that didn't have to.",
  },
  {
    id: "metro",
    scenes: [
      "A billboard with your city's favorite cape peels at one corner. Pigeons are doing the review.",
      "Traffic treats a rescue like weather. The honking is unanimous.",
      "A rooftop garden has a better view of the fights than the news does.",
    ],
    villains: ["Adspace", "Kiln Runner"],
    heroes: ["vesper", "juniper", "bolt"],
    arcs: ["kiln", "mile", "deadair", "lighthouse"],
    trouble: "Wants the clip more than the cash.",
    travel: "Metro City already printed a poster. It is not of you. Yet.",
  },
  {
    id: "harbor",
    scenes: [
      "Fog takes the ferry and gives it back with a new passenger who won't give a name.",
      "The pier rings like a phone. Nobody sensible answers.",
      "A kraken rumor is doing more community work than the harbor master.",
    ],
    villains: ["Pier Tax", "Fogbell"],
    heroes: ["pilar", "marrow", "nim"],
    arcs: ["mile", "winter", "reunion"],
    trouble: "Bills the docks and the fog.",
    travel: "Harbor Bay puts a wet coat on you and calls it local.",
  },
  {
    id: "neon",
    scenes: [
      "If it does not glow, someone is already writing it up.",
      "A club line is a personality test with a velvet rope and a worse bouncer.",
      "The alley behind the light is where the city actually lives.",
    ],
    villains: ["Marquee", "Cover Charge"],
    heroes: ["kade", "bolt", "nim"],
    arcs: ["choir", "deadair"],
    trouble: "Sells the night twice.",
    travel: "Neon Spire hurts your eyes and then your wallet. In that order.",
  },
  {
    id: "dust",
    scenes: [
      "The one traffic light apologizes by staying yellow.",
      "A wide sky makes secrets look small until you drive out to them.",
      "Dust gets in the costume. The costume does not win.",
    ],
    villains: ["Mile Zero", "Dry Well"],
    heroes: ["pilar", "marrow", "wren"],
    arcs: ["kiln", "winter", "lighthouse"],
    trouble: "Knows every road because there aren't many.",
    travel: "Dustreach gives you a horizon and very little cover.",
  },
  {
    id: "crown",
    scenes: [
      "A gargoyle has better posture than the League chapter under it.",
      "Old money crosses the bridge without looking at the river it charges.",
      "Someone says 'pardon' and means a threat with stationery.",
    ],
    villains: ["Old Money", "Gargoyle Fund"],
    heroes: ["kade", "idris", "lark"],
    arcs: ["lease", "understudy", "reunion"],
    trouble: "Sends invoices, then people.",
    travel: "Crownbridge asks who your people are before it asks your name.",
  },
];

const DOSSIER_BY = new Map(DOSSIERS.map((row) => [row.id, row]));

export function dossier(id: string | null | undefined): CityDossier {
  if (!id) return FALLBACK;
  return DOSSIER_BY.get(id) ?? FALLBACK;
}

export function sceneLine(game: Pick<Game, "cityId" | "age" | "month">): string {
  const scenes = dossier(game.cityId).scenes;
  const index = (game.age * 3 + (game.month ?? 0)) % scenes.length;
  return scenes[index] ?? scenes[0] ?? FALLBACK.scenes[0]!;
}

export function nextLocalVillain(game: Pick<Game, "cityId" | "relationships">): string | null {
  for (const name of dossier(game.cityId).villains) {
    const known = game.relationships.some((person) => person.alive && (person.name === name || person.note === name));
    if (!known) return name;
  }
  return null;
}

export function homeArc(cityId: string, arcId: string): boolean {
  return dossier(cityId).arcs.includes(arcId);
}

export interface TraitDef {
  id: TraitId;
  title: string;
  blurb: string;
  slot: "face" | "drive" | "earned";
  minAge: number;
  fame?: number;
  money?: number;
  karma?: number;
  smarts?: number;
  happiness?: number;
  health?: number;
  looks?: number;
  reputation?: number;
  heroBias?: Record<string, number>;
}

export const TRAITS: TraitDef[] = [
  { id: "secret", title: "Secret identity", blurb: "The mask stays on for almost everyone. Exposure is a real risk.", slot: "face", minAge: 0, happiness: -1, heroBias: { nim: 6, lark: 2 } },
  { id: "loud", title: "Loud and proud", blurb: "You are a public hero. The cameras and the villains both RSVP.", slot: "face", minAge: 0, fame: 6, reputation: 2, heroBias: { bolt: 6, kade: 4, juniper: 4 } },
  { id: "reluctant", title: "Reluctant hero", blurb: "You would rather be nobody. The city keeps handing you the problem.", slot: "drive", minAge: 0, happiness: 2, heroBias: { wren: 4, pilar: 4 } },
  { id: "protector", title: "Protector of the weak", blurb: "The small emergency comes first. You will be late to the spectacle.", slot: "drive", minAge: 0, karma: 6, heroBias: { wren: 6, vesper: 4 } },
  { id: "vengeful", title: "Vengeful", blurb: "A wrong was done. You are not finished with the person who did it.", slot: "drive", minAge: 0, karma: -6, happiness: -2, heroBias: { lark: 8, marrow: 4 } },
  { id: "idealistic", title: "Idealistic", blurb: "You still think the line matters. People will test that.", slot: "drive", minAge: 0, karma: 4, happiness: 2, heroBias: { vesper: 4, wren: 4, juniper: 2 } },
  { id: "pragmatic", title: "Pragmatic", blurb: "Results over speeches. The bar can live with a smudge.", slot: "drive", minAge: 0, smarts: 3, karma: -2, heroBias: { idris: 4, lark: 4 } },
  { id: "team", title: "Team player", blurb: "You look for the other cape before you look for the spotlight.", slot: "drive", minAge: 0, happiness: 1, heroBias: { juniper: 4, bolt: 4, vesper: 2 } },
  { id: "lone", title: "Lone wolf", blurb: "Backup is a complication. So is being known.", slot: "drive", minAge: 0, happiness: -1, heroBias: { nim: 6, marrow: 2 } },
  { id: "curious", title: "Curious", blurb: "You want to know how it works, including the parts that bite.", slot: "drive", minAge: 0, smarts: 4, happiness: 1, heroBias: { idris: 6, wren: 2 } },
  { id: "glory", title: "Glory hound", blurb: "Saving people is the job. Being seen saving them is the bonus you chase.", slot: "drive", minAge: 0, fame: 4, karma: -2, heroBias: { kade: 6, bolt: 4 } },
  { id: "amends", title: "Making amends", blurb: "Someone got hurt because of you once. Every rescue is a payment on it.", slot: "drive", minAge: 0, karma: 4, happiness: -2, heroBias: { marrow: 4, pilar: 6 } },
  { id: "duty", title: "Duty-bound", blurb: "Someone has to stand the watch. You never ask why it is always you.", slot: "drive", minAge: 0, reputation: 3, happiness: -1, heroBias: { vesper: 6, idris: 2 } },
  { id: "thrill", title: "Thrill-seeker", blurb: "The rooftop jump is the point. The rescue at the bottom is a nice extra.", slot: "drive", minAge: 0, health: 2, karma: -1, heroBias: { bolt: 6, nim: 2 } },
  { id: "family", title: "Family first", blurb: "The city is big. Your people are not. You keep that order.", slot: "drive", minAge: 0, happiness: 3, heroBias: { juniper: 6, pilar: 2 } },
  { id: "millionaire", title: "Millionaire", blurb: "The accounts start answering. Travel and toys get cheaper, not free.", slot: "earned", minAge: 18, money: 6000, fame: 3, heroBias: { kade: 4, lark: 2 } },
  { id: "sorcerer", title: "Sorcerer", blurb: "A working you learned. It sits in the braid book beside whatever you were born with.", slot: "earned", minAge: 14, smarts: 2, heroBias: { wren: 4, idris: 4 } },
  { id: "inventor", title: "Tech genius", blurb: "You build the trick if the body won't give it to you.", slot: "earned", minAge: 14, smarts: 3, heroBias: { idris: 6 } },
  { id: "celebrity", title: "Celebrity", blurb: "Your face does the introducing. That is useful and unsafe.", slot: "earned", minAge: 13, fame: 8, looks: 2, heroBias: { kade: 6, bolt: 2 } },
  { id: "liaison", title: "Government liaison", blurb: "A badge that is not yours, and a phone that picks up.", slot: "earned", minAge: 16, reputation: 6, karma: 2, heroBias: { idris: 4, vesper: 2 } },
  { id: "underworld", title: "Underworld ties", blurb: "Doors in the bad part of the ledger open when you knock.", slot: "earned", minAge: 15, karma: -4, heroBias: { lark: 8, nim: 4 } },
  { id: "royalty", title: "Alien royalty", blurb: "Offworld, your name is a title. Here it is a rumor with a budget.", slot: "earned", minAge: 14, fame: 5, money: 4000, heroBias: { idris: 4, kade: 4 } },
  { id: "martial", title: "Master martial artist", blurb: "The body is the first weapon. Fights give you a little more room.", slot: "earned", minAge: 12, health: 2, heroBias: { marrow: 6, vesper: 4 } },
  { id: "psychic", title: "Psychic specialist", blurb: "Other minds are a room you have practiced.", slot: "earned", minAge: 14, smarts: 2, heroBias: { wren: 6, idris: 4 } },
  { id: "insider", title: "Corporate insider", blurb: "You know which door the badge opens, and who paid for the fence.", slot: "earned", minAge: 16, money: 2000, smarts: 1, heroBias: { lark: 4, idris: 4 } },
];

const TRAIT_BY = new Map(TRAITS.map((row) => [row.id, row]));

export function traitById(id: string | null | undefined): TraitDef | null {
  if (!id) return null;
  return TRAIT_BY.get(id as TraitId) ?? null;
}

export function hasTrait(game: Pick<Game, "traits">, id: TraitId): boolean {
  return (game.traits ?? []).includes(id);
}

export const FACE_TRAITS = TRAITS.filter((row) => row.slot === "face");
export const DRIVE_TRAITS = TRAITS.filter((row) => row.slot === "drive");
export const EARNED_TRAITS = TRAITS.filter((row) => row.slot === "earned");

export function faceOf(game: Pick<Game, "traits">): TraitId {
  return (game.traits ?? []).find((id) => traitById(id)?.slot === "face") ?? "secret";
}

export function driveOf(game: Pick<Game, "traits">): TraitId {
  return (game.traits ?? []).find((id) => traitById(id)?.slot === "drive") ?? "protector";
}

export function asFace(id: string | null | undefined): TraitId {
  const trait = traitById(id);
  return trait?.slot === "face" ? trait.id : "secret";
}

export function asDrive(id: string | null | undefined): TraitId {
  const trait = traitById(id);
  return trait?.slot === "drive" ? trait.id : "protector";
}

const UP_BIAS: Record<UpbringingId, Record<string, number>> = {
  supportive: { juniper: 4, wren: 4, vesper: 2 },
  skeptical: { idris: 4, marrow: 4 },
  legacy: { vesper: 6, kade: 4, bolt: 2 },
  absent: { nim: 4, marrow: 4 },
  scientific: { idris: 8, wren: 2 },
  normal: { juniper: 4, wren: 4 },
  alien: { wren: 6, idris: 4, pilar: 2 },
  tragic: { vesper: 6, marrow: 4 },
  military: { marrow: 8, vesper: 4 },
  wealthy: { kade: 4, lark: 4 },
  foster: { wren: 6, pilar: 4 },
  rural: { pilar: 6, juniper: 2 },
  program: { idris: 10, lark: 2 },
  street: { nim: 8, lark: 6, marrow: 4 },
  celebrity: { kade: 8, bolt: 4 },
  isolated: { pilar: 6, nim: 4 },
};

/**
 * Trait and origin bias: a small head start, capped at bond 32. It only nudges toward that cap and never
 * pulls a bond that was earned in play back down to it (earned traits arrive years in).
 */
function bump(hero: { relationship: number }, amount: number) {
  if (!amount) return;
  if (amount < 0) {
    hero.relationship = clamp(hero.relationship + amount, 0, 100);
    return;
  }
  if (hero.relationship >= 32) return;
  hero.relationship = clamp(Math.min(32, hero.relationship + amount), 0, 100);
}

export function biasHeroes(game: Game): void {
  const city = dossier(game.cityId);
  const fromLife = UP_BIAS[game.upbringing] ?? {};
  for (const hero of game.heroes ?? []) {
    bump(hero, fromLife[hero.id] ?? 0);
    if (city.heroes.includes(hero.id)) bump(hero, 6);
  }
}

export function grantTrait(game: Game, id: TraitId, mode: "full" | "mark" = "full"): string {
  const def = traitById(id);
  if (!def) return "";
  if (!Array.isArray(game.traits)) game.traits = [];
  if (game.traits.includes(id)) return "";
  game.traits.push(id);
  if (id === "secret") game.flags.hidden = 1;
  if (mode === "full") {
    const stats = game.stats;
    if (def.fame) stats.fame = clamp(stats.fame + def.fame, 0, 100);
    if (def.money) stats.money += def.money;
    if (def.karma) stats.karma = clamp((stats.karma ?? 0) + def.karma, -100, 100);
    if (def.smarts) stats.smarts = clamp(stats.smarts + def.smarts, 0, 100);
    if (def.happiness) stats.happiness = clamp(stats.happiness + def.happiness, 0, 100);
    if (def.health) stats.health = clamp(stats.health + def.health, 0, 100);
    if (def.looks) stats.looks = clamp(stats.looks + def.looks, 0, 100);
    if (def.reputation) stats.reputation = clamp(stats.reputation + def.reputation, -100, 100);
  }
  for (const hero of game.heroes ?? []) bump(hero, def.heroBias?.[hero.id] ?? 0);
  return `${def.title}. ${def.blurb}`;
}

export function dropTrait(game: Game, id: TraitId): void {
  game.traits = (game.traits ?? []).filter((trait) => trait !== id);
  if (id === "secret") delete game.flags.hidden;
}

export function earnBlock(game: Game, id: TraitId): string | null {
  const def = traitById(id);
  if (!def || def.slot !== "earned") return "That isn't something you become.";
  if (hasTrait(game, id)) return "Already yours.";
  if (game.age < def.minAge) return `Not before ${def.minAge}.`;
  if (id === "royalty" && game.upbringing !== "alien") return "Offworld blood only.";
  if (id === "millionaire") return game.stats.money >= 60000 ? null : "Need $60,000 in the bank. The title is the accounts, not a wish.";
  if (id === "sorcerer") {
    const bond = Math.max(...(game.heroes ?? []).filter((hero) => hero.id === "wren" || hero.id === "idris").map((hero) => hero.relationship), 0);
    return bond >= 36 || game.stats.smarts >= 74 ? null : "Wren or Dr. Quill at bond 36, or smarts 74.";
  }
  if (id === "inventor") return game.stats.smarts >= 64 && game.stats.money >= 2500 ? null : "Smarts 64 and $2,500 for a real bench.";
  if (id === "celebrity") return game.stats.fame >= 45 ? null : "Fame 45. The city has to already be tired of your face.";
  if (id === "liaison") {
    return game.leagueRank >= 2 || (game.age >= 18 && (game.stats.karma ?? 0) >= 30 && game.stats.reputation >= 20) ? null : "League rank 2, or a clean bar and a real reputation.";
  }
  if (id === "underworld") return (game.stats.karma ?? 0) <= -25 || !!game.crew ? null : "The bar at Rogue, or a crew of your own.";
  if (id === "royalty") return game.stats.fame >= 12 ? null : "Fame 12. A title nobody has heard is just a story.";
  if (id === "martial") {
    const level = masteryLevelSafe(game, "super-strength");
    return level >= 3 || game.stats.powerLevel >= 5 ? null : "Strength mastery 3, or a life stat of 5.";
  }
  if (id === "psychic") {
    const hasMind = (game.unlockedPowers ?? []).some((power) => power === "telepathy" || power === "telekinesis");
    if (!hasMind) return "Learn telepathy or telekinesis first.";
    const wren = game.heroes?.find((hero) => hero.id === "wren")?.relationship ?? 0;
    return wren >= 28 || game.stats.smarts >= 62 ? null : "Wren at bond 28, or smarts 62.";
  }
  if (id === "insider") {
    const cityOk = ["stacks", "crown", "nyc", "metro"].includes(game.cityId);
    if (!cityOk) return "A corp city. New York, the Stacks, Metro, or Crownbridge.";
    return game.stats.smarts >= 55 && game.stats.money >= 4000 ? null : "Smarts 55 and $4,000, in a city with a fence.";
  }
  return null;
}

function masteryLevelSafe(game: Game, powerId: string): number {
  const power = getPower(powerId);
  return masteryLevel(game.mastery?.[powerId] ?? 0, power?.generation ?? 0);
}

export function visibleEarned(game: Game): { def: TraitDef; block: string | null }[] {
  const out: { def: TraitDef; block: string | null }[] = [];
  for (const def of EARNED_TRAITS) {
    if (hasTrait(game, def.id)) continue;
    if (game.age < def.minAge) continue;
    if (def.id === "royalty" && game.upbringing !== "alien") continue;
    out.push({ def, block: earnBlock(game, def.id) });
  }
  return out;
}

export function travelCost(game: Pick<Game, "age" | "traits">): number {
  let cost = 80 + Math.max(0, game.age) * 10;
  if (hasTrait(game, "millionaire")) cost = Math.round(cost * 0.5);
  if (hasTrait(game, "insider")) cost = Math.round(cost * 0.85);
  return Math.max(40, cost);
}

export function walkEffects(game: Game): Effects {
  if (hasTrait(game, "protector")) return { karma: 2, happiness: 1 };
  if (hasTrait(game, "vengeful")) return { karma: -1, happiness: 1 };
  if (hasTrait(game, "idealistic")) return { karma: 1, happiness: 2 };
  if (hasTrait(game, "pragmatic")) return { smarts: 1 };
  if (hasTrait(game, "reluctant")) return { happiness: 2 };
  if (hasTrait(game, "team")) return { happiness: 1, reputation: 1 };
  if (hasTrait(game, "lone")) return { happiness: 1 };
  if (hasTrait(game, "curious")) return { smarts: 1, happiness: 1 };
  if (hasTrait(game, "glory")) return { fame: 1 };
  if (hasTrait(game, "amends")) return { karma: 2 };
  if (hasTrait(game, "duty")) return { reputation: 1 };
  if (hasTrait(game, "thrill")) return { happiness: 2, health: -1 };
  if (hasTrait(game, "family")) return { happiness: 2 };
  return { happiness: 1 };
}

export function identityLine(game: Pick<Game, "traits" | "upbringing">): string {
  const names = (game.traits ?? []).map((id) => traitById(id)?.title).filter((title): title is string => !!title);
  const childhood = upbringingById(game.upbringing).title;
  const head = names.slice(0, 3).join(" · ");
  return head ? `${head} · ${childhood}` : childhood;
}

export function talkBrief(game: Game, heroId: string): OriginBrief {
  const city = dossier(game.cityId);
  const childhood = upbringingById(game.upbringing);
  const local = city.heroes.includes(heroId);
  const face = traitById(faceOf(game))?.title ?? "Secret identity";
  const drive = traitById(driveOf(game))?.title ?? "Protector";
  const earned = (game.traits ?? []).filter((id) => traitById(id)?.slot === "earned").map((id) => traitById(id)?.title).filter(Boolean);
  const villain = city.villains[0] ?? "the local problem";
  const note = local
    ? `${villain} is the name this city keeps. A ${drive.toLowerCase()} from a ${childhood.title.toLowerCase()} house reads differently than a tourist.`
    : `You are ${childhood.title.toLowerCase()} in a city that is not my usual block. ${villain} is not my homework.`;
  return {
    city: game.city,
    upbringing: childhood.title,
    traits: [face, drive, ...earned].join(", "),
    local,
    note,
  };
}

export function mentionsWorld(line: string, brief: OriginBrief): boolean {
  const text = line.toLowerCase();
  if (/grew up|childhood|my past|my family|where i'?m from|where i am from|this city|my city|secret|loud and proud|who i am|background|the block|offworld|my mother|my father|parents/.test(text)) return true;
  return brief.city
    .toLowerCase()
    .split(/\s+/)
    .some((word) => word.length > 3 && text.includes(word));
}

export function familyPlan(id: UpbringingId): { count: 0 | 1 | 2; note: string; line: string } {
  const row = upbringingById(id);
  if (row.parents === "none") return { count: 0, note: row.parentNote, line: "No parents on the certificate." };
  if (row.parents === "one") return { count: 1, note: row.parentNote, line: "One parent. The other is a date you learn to say." };
  if (row.parents === "foster") return { count: 1, note: row.parentNote, line: "A foster house, not a birth one." };
  return { count: 2, note: row.parentNote, line: "" };
}
