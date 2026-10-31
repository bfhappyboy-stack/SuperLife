import { buyItem, ensureMarket, marketEdge, marketMonth, marketYear, sellAsset } from "./market";
import {
  CITIES,
  FEMALE_NAMES,
  JOB_TITLES,
  JOBS,
  LAST_NAMES,
  MALE_NAMES,
  RANKS,
  SCHOOLS,
  STIPEND,
  TEAMS,
  cityById,
  jobById,
  powerById,
  rollPower,
  schoolById,
  teamById,
  upbringingById,
  fusionTitle,
  type JobDef,
  type SchoolDef,
  type TeamDef,
} from "./data";
import { pickEvent, type EventDef, type MiniTemplate } from "./events";
import { clamp, firstName, money, whenLabel } from "./format";
import { getPower, legacyComboId, legacyFromCombo, mix, offerPower, possibleMixes, randomMissingBase, teachableBases } from "./combo";
import { buffLine, costumeMods, ensureWardrobe, fitBlock, fitById, starterWardrobe } from "./costume";
import { resolveLook } from "./look";
import { elementOfLegacy, elementOfPower } from "./elements";
import { isSkillKind, pickMini, SKILL_KIND_IDS } from "./minis";
import { judgeTalk, mergeHeroes, seedHeroes, settleHeroLevel } from "./heroes";
import { availableArcs, currentCase, type ArcStep } from "./arcs";
import { arcsCleared } from "./arcs";
import { bondForMastery, masteryCap, masteryLevel, masteryRoom, powerLevelCap, powerRank, trainCost, trainExp } from "./mastery";
import { migrateChapters, openChapter, turnChapter } from "./chapters";
import { battleMoves, equippedMoves, fillLoadout, grantMoveExp, moveById, MOVESET_SIZE, STREET_MOVES, toggleLoadout } from "./moves";
import {
  asDrive,
  asFace,
  biasHeroes,
  dossier,
  driveOf,
  dropTrait,
  earnBlock,
  faceOf,
  familyPlan,
  grantTrait,
  hasTrait,
  homeArc,
  nextLocalVillain,
  sceneLine,
  travelCost,
  traitById,
  visibleEarned,
  walkEffects,
} from "./origin";
import type {
  ActionItem,
  AiHero,
  Cape,
  CostumeSlot,
  Delta,
  DuelBoard,
  DuelMove,
  Effects,
  Game,
  Look,
  MinigameSpec,
  MoveStyle,
  Outcome,
  Pending,
  Person,
  PowerId,
  Sex,
  Special,
  TraitId,
  UpbringingId,
} from "./types";

export interface NewLifeOpts {
  name: string;
  cityId: string;
  upbringing: UpbringingId;
  portrait: number;
  sex: Sex;
  face?: TraitId;
  drive?: TraitId;
  look?: Look;
  /** One catalog power. Empty means an ordinary life. */
  giftId?: string | null;
  seed?: number;
  heir?: { fame: number; powerBias: PowerId | null; belief: number; trust?: number };
}

function roll(d: Game): number {
  let a = d.rng | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  d.rng = a >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rollInt(d: Game, n: number): number {
  return Math.floor(roll(d) * n);
}

function rollSex(d: Game): Sex {
  return roll(d) < 0.5 ? "female" : "male";
}

function pickName(d: Game, last?: string, sex?: Sex): string {
  const pool = sex === "male" ? MALE_NAMES : sex === "female" ? FEMALE_NAMES : [...FEMALE_NAMES, ...MALE_NAMES];
  let name = "Sam Hale";
  for (let i = 0; i < 8; i++) {
    const f = pool[rollInt(d, pool.length)] ?? "Sam";
    const l = last ?? LAST_NAMES[rollInt(d, LAST_NAMES.length)] ?? "Hale";
    name = `${f} ${l}`;
    if (name !== d.name && !d.relationships.some((r) => r.name === name)) break;
  }
  return name;
}

function addPerson(
  d: Game,
  spec: {
    role: Person["role"];
    closeness: number;
    age: number;
    note?: string;
    name?: string;
    last?: string;
    portrait?: number;
    sex?: Sex;
    latentPower?: PowerId | null;
  },
): Person {
  const sex = spec.sex ?? rollSex(d);
  const person: Person = {
    id: `p${d.nextId++}`,
    name: spec.name ?? pickName(d, spec.last, sex),
    role: spec.role,
    closeness: clamp(spec.closeness, 0, 100),
    age: spec.age,
    alive: true,
    metAt: d.age,
    note: spec.note,
    portrait: spec.portrait ?? rollInt(d, 1_000_000_000) + 1,
    sex,
    latentPower: spec.latentPower,
  };
  d.relationships.push(person);
  return person;
}

const STAT_LABEL: Record<string, string> = {
  health: "Health",
  happiness: "Happiness",
  smarts: "Smarts",
  looks: "Looks",
  fame: "Fame",
  money: "Money",
  reputation: "Reputation",
  parentBelief: "Belief",
  powerLevel: "Power",
  karma: "Karma",
};

/** Gain multiplier for joy/mind/karma: 1 up to 50, easing to 0.08 at 100. */
export function gentleCap(value: number): number {
  if (value <= 50) return 1;
  return Math.max(0.08, 1 - ((value - 50) / 50) * 0.92);
}

function softStep(d: Game, delta: number, factor: number): number {
  const scaled = delta * factor;
  const whole = Math.floor(scaled);
  return whole + (roll(d) < scaled - whole ? 1 : 0);
}

function applyEffects(d: Game, e: Effects | undefined, deltas: Delta[]) {
  if (!e) return;
  const s = d.stats;
  const touch = (stat: string, before: number, after: number) => {
    const amount = Math.round((after - before) * 100) / 100;
    if (Math.abs(amount) >= 0.05) deltas.push({ stat, amount });
  };
  const intKeys = ["health", "happiness", "smarts", "looks", "fame", "reputation", "parentBelief", "karma"] as const;
  const ranges: Record<(typeof intKeys)[number], [number, number]> = {
    health: [0, 100],
    happiness: [0, 100],
    smarts: [0, 100],
    looks: [0, 100],
    fame: [0, 100],
    reputation: [-100, 100],
    parentBelief: [0, 100],
    karma: [-100, 100],
  };
  for (const key of intKeys) {
    const delta = e[key];
    if (delta == null) continue;
    const [lo, hi] = ranges[key];
    const before = s[key];
    let step = delta;
    // Fame and reputation get harder to push toward the extremes, so they stay meaningful across decades.
    if ((key === "fame" || key === "reputation") && Math.sign(delta) === Math.sign(before || delta)) {
      // A secret identity keeps half the spotlight: the mask takes the credit.
      const masked = key === "fame" && delta > 0 && d.traits.includes("secret") ? 0.5 : 1;
      const scaled = Math.abs(delta) * masked * Math.max(0.03, 1 - Math.abs(before) / 102);
      const whole = Math.floor(scaled);
      step = Math.sign(delta) * (whole + (roll(d) < scaled - whole ? 1 : 0));
    } else if ((key === "happiness" || key === "smarts" || key === "karma") && delta > 0 && before > 0) {
      // Joy, mind and karma climb freely through the middle and slow near the top, so a life can't
      // pin them at 100 by twenty and coast. Losses are never softened.
      step = softStep(d, delta, gentleCap(before));
    }
    s[key] = clamp(Math.round(before + step), lo, hi);
    touch(STAT_LABEL[key] ?? key, before, s[key]);
  }
  if (e.money != null) {
    const before = s.money;
    s.money = clamp(Math.round(before + e.money), -20000, 100_000_000);
    touch("Money", before, s.money);
  }
  if (e.powerLevel != null) {
    const before = s.powerLevel;
    const cap = powerLevelCap(d.age);
    s.powerLevel = clamp(Math.round((before + e.powerLevel) * 100) / 100, 0, cap);
    touch("Power", before, s.powerLevel);
  }
  if (e.closeness != null && e.personId) {
    const person = d.relationships.find((r) => r.id === e.personId && r.alive);
    if (person) {
      const before = person.closeness;
      person.closeness = clamp(Math.round(before + e.closeness), 0, 100);
      touch(firstName(person.name), before, person.closeness);
    }
  }
}

export function abilityList(g: Game) {
  const powers = [powerById(g.powerId), powerById(g.secondaryId)].filter((power) => !!power);
  const owned: { at: number; name: string; blurb: string }[] = [];
  for (const power of powers) {
    for (const ability of power.abilities) {
      if (g.stats.powerLevel + 0.001 >= ability.at && !owned.some((item) => item.name === ability.name)) owned.push(ability);
    }
  }
  return owned;
}

function abilityNames(g: Game): string[] {
  return abilityList(g).map((a) => a.name);
}

function noteGrowth(before: string[], d: Game, banners: string[]) {
  for (const name of abilityNames(d)) {
    if (!before.includes(name)) {
      banners.push(`New trick: ${name}.`);
      d.history.push({ age: d.age, text: `Unlocked ${name}.`, tag: "major" });
    }
  }
}

function peaks(d: Game) {
  d.peak.fame = Math.max(d.peak.fame, d.stats.fame);
  d.peak.power = Math.max(d.peak.power, d.stats.powerLevel);
  d.peak.rank = Math.max(d.peak.rank, d.leagueRank);
  d.peak.money = Math.max(d.peak.money, d.stats.money);
  d.peak.rep = Math.max(d.peak.rep, d.stats.reputation);
}

function pushHistory(d: Game, text: string, tag?: "major") {
  d.history.push({ age: d.age, month: d.month, text, tag });
  if (d.history.length > 240) d.history.splice(0, d.history.length - 240);
}

function setStory(d: Game, body: string, deltas: Delta[], banners: string[], tag?: "major") {
  d.card = { kicker: whenLabel(d.age, d.month), banner: banners, body, deltas };
  pushHistory(d, body, tag);
  d.phase = "live";
  d.pending = null;
  d.minigame = null;
}

function scoreOf(d: Game): { score: number; rows: { label: string; points: number }[] } {
  const rows = [
    { label: "Years lived", points: d.age * 12 },
    { label: "Fame", points: Math.round(d.peak.fame * 8) },
    { label: "Power", points: Math.round(d.peak.power * 45) },
    { label: "League", points: d.peak.rank * 140 },
    { label: "Reputation", points: Math.round(Math.max(0, d.peak.rep) * 3) },
    { label: "Fortune", points: Math.round(Math.min(5_000_000, Math.max(0, d.peak.money)) / 1200) },
    { label: "Bonds", points: d.relationships.filter((r) => r.alive && r.closeness >= 60).length * 30 },
    { label: "Tricks", points: abilityNames(d).length * 35 },
    { label: "Second gift", points: d.secondaryId ? 80 : 0 },
    { label: "Braids", points: (d.unlockedPowers ?? []).filter((id) => (getPower(id)?.generation ?? 0) > 0).length * 18 },
    { label: "Mastery", points: Object.entries(d.mastery ?? {}).reduce((sum, [id, exp]) => sum + masteryLevel(exp, getPower(id)?.generation ?? 0) * 12, 0) },
    { label: "Cases", points: (d.story?.cleared?.length ?? 0) * 90 },
    { label: "Trainers", points: (d.heroes ?? []).filter((hero) => hero.met && hero.relationship >= 50).length * 25 },
    { label: "Traits", points: (d.traits ?? []).length * 12 },
    { label: "Crew", points: d.crew ? 40 + d.crew.members.length * 25 : 0 },
    { label: "Arch-enemy", points: d.relationships.some((r) => r.arch && r.alive) ? 40 : 0 },
  ];
  return { score: rows.reduce((sum, row) => sum + row.points, 0), rows };
}

function deadCause(d: Game): string {
  if (d.age >= 90) return "Old age, which does not take meetings.";
  if (d.age >= 70 && d.stats.health >= 20) return "A long life that finally asked to sit down.";
  if (d.stats.reputation <= -40) return "A grudge that stopped being theoretical.";
  if (d.powerId) return "A gift that asked for more than the body had.";
  if (d.stats.health < 20) return "A heart that punched out after a long shift.";
  return "An ending the paperwork will describe as natural.";
}

/**
 * Health hitting zero is a collapse, not automatically a funeral. The first collapse in a stretch
 * (and every collapse before 18) is a hospital stay with a real bill and a "critical" window.
 * A second collapse inside that window can kill an adult. Explicit death outcomes still kill.
 * Returns true when the hero survived.
 */
function collapse(d: Game, story: string): boolean {
  const critical = (d.flags.critical ?? 0) > 0;
  if (critical && d.age >= 18) {
    kill(d, deadCause(d), story);
    return false;
  }
  const bill = Math.min(Math.max(0, d.stats.money), 250 + d.age * 25);
  const deltas: Delta[] = [];
  d.stats.health = 30;
  applyEffects(d, { money: -bill, happiness: -6 }, deltas);
  deltas.unshift({ stat: "Health", amount: 30 });
  d.flags.critical = 18;
  d.flags.collapses = (d.flags.collapses ?? 0) + 1;
  d.phase = "live";
  d.pending = null;
  d.minigame = null;
  pushHistory(d, `Collapsed at ${d.age} and woke up in a hospital.`, "major");
  setStory(
    d,
    `${story}\n\nYou wake up in a hospital bed with a wristband and a bill${bill ? ` for ${money(bill)}` : ""}. Close call. For the next year and a half your body is on probation: drop to zero again and it may not be a hospital.`,
    deltas,
    ["Close call. Rest, see a doctor, and go easy on drills for a while."],
    "major",
  );
  return true;
}

function kill(d: Game, cause: string, story: string) {
  peaks(d);
  const scored = scoreOf(d);
  d.phase = "dead";
  d.pending = null;
  d.minigame = null;
  d.death = { cause, story, score: scored.score, rows: scored.rows, at: Date.now() };
  d.card = { kicker: whenLabel(d.age, d.month), banner: d.card?.banner ?? [], body: story, deltas: d.card?.deltas ?? [] };
  pushHistory(d, cause, "major");
}

function beliefNeed(d: Game, school: SchoolDef): number {
  return school.minBelief + (d.flags.hidden ? 18 : 0);
}

function onFile(d: Pick<Game, "powerId" | "powerless" | "unlockedPowers">): boolean {
  return !d.powerless && (!!d.powerId || (d.unlockedPowers?.length ?? 0) > 0);
}

function ownsPower(d: Game, powers: PowerId[]): boolean {
  return (!!d.powerId && powers.includes(d.powerId)) || (!!d.secondaryId && powers.includes(d.secondaryId));
}

export function schoolBlock(d: Game, school: SchoolDef): string | null {
  if (d.schoolId) return "You're already enrolled.";
  if (d.age < school.minAge) return `Opens at age ${school.minAge}.`;
  if (d.age > school.maxAge - 1) return "You'd age out before orientation.";
  if (school.powers && !ownsPower(d, school.powers) && d.powerId) return "Wrong kind of gift for this campus.";
  if (school.id === "caduceus" && !onFile(d) && d.stats.smarts < school.minSmarts) return "They want a gift or serious smarts.";
  if (!onFile(d) && school.id !== "caduceus") return "They train powers. You don't have one on file.";
  if (onFile(d) && d.stats.powerLevel + 0.001 < school.minPL) return `Needs power level ${school.minPL}.`;
  if (d.stats.smarts < school.minSmarts) return `Smarts ${school.minSmarts}+.`;
  const proved = d.stats.powerLevel >= school.minPL + 2;
  if (d.stats.parentBelief < beliefNeed(d, school) && !proved) return "Your folks won't sign. Win them over or get undeniable.";
  return null;
}

export function jobBlock(d: Game, job: JobDef): string | null {
  if (d.jobId) return "Quit the job you have first.";
  if (job.powers && !ownsPower(d, job.powers)) return "Different gift required.";
  if (d.age < job.minAge) return `Hiring at ${job.minAge}+.`;
  if (d.stats.powerLevel + 0.001 < job.minPL) return `Needs power level ${job.minPL}.`;
  if (d.stats.smarts < job.minSmarts) return `Smarts ${job.minSmarts}+.`;
  if (d.stats.looks + costumeMods(d).looks < job.minLooks) return "They want a face that photographs. Not yet.";
  if (d.stats.fame < job.minFame) return "Not famous enough for them.";
  return null;
}

function teamBlock(d: Game, team: TeamDef): string | null {
  const rank = Math.max(d.leagueRank, 1);
  if (rank < team.minRank) return `Opens at ${RANKS[team.minRank]}.`;
  if (d.stats.powerLevel + 0.001 < team.minPL) return `Needs power level ${team.minPL}.`;
  if (!onFile(d) && !team.allowUnpowered) return "They field powers.";
  if (!onFile(d) && team.allowUnpowered && d.stats.smarts < 70) return "Unpowered applicants need smarts 70+.";
  return null;
}

function bestTeam(d: Game): TeamDef {
  const options = TEAMS.filter((team) => !teamBlock(d, team));
  const pool = options.length ? options : TEAMS.filter((team) => team.id === "street" || team.id === "white");
  let best = pool[0] ?? TEAMS[0]!;
  let score = -1;
  for (const team of pool) {
    const pref = d.powerId && team.prefers.includes(d.powerId) ? 6 : 1;
    if (pref > score) {
      score = pref;
      best = team;
    }
  }
  return best;
}

function maybeRival(d: Game, tier: number) {
  if (tier < 2) return;
  if (d.relationships.some((r) => r.role === "rival" && r.alive)) return;
  const rival = addPerson(d, {
    role: "rival",
    closeness: 30,
    age: Math.max(8, d.age + rollInt(d, 3) - 1),
    note: "Same drills. Different poster.",
  });
  pushHistory(d, `Rival: ${rival.name}.`, "major");
}

function joinLeague(d: Game): string {
  if (d.leagueRank < 1) d.leagueRank = 1;
  if (!d.teamId) {
    const team = bestTeam(d);
    d.teamId = team.id;
    addPerson(d, { role: "teammate", closeness: 40, age: d.age + rollInt(d, 8), note: team.name });
    pushHistory(d, `Joined ${team.name} as ${RANKS[1]}.`, "major");
    return ` You're placed with ${team.name}. ${team.blurb}`;
  }
  return "";
}

function haveChild(d: Game): string {
  const last = d.name.split(" ").slice(1).join(" ") || LAST_NAMES[rollInt(d, LAST_NAMES.length)] || "Voss";
  const bias = d.powerId && roll(d) < 0.55 ? d.powerId : roll(d) < 0.5 ? rollPower(roll(d), roll(d), d.powerBias).id : null;
  const sex = rollSex(d);
  const kid = addPerson(d, {
    role: "child",
    closeness: 80,
    age: 0,
    last,
    sex,
    note: "Yours.",
    latentPower: bias,
  });
  const word = sex === "female" ? "daughter" : "son";
  return ` A ${word}, ${kid.name}, arrives loud and correct.`;
}

function foundCrew(d: Game, style: "smash" | "quiet" | "fear"): string {
  const table = {
    smash: { words: ["Red", "Broken", "Loud", "Hammers", "Doors", "Teeth"], motto: "If it bends, hit it." },
    quiet: { words: ["Quiet", "Unlisted", "Second", "Receipts", "Keys", "Hours"], motto: "Leave nothing with a name." },
    fear: { words: ["Hollow", "Late", "Pale", "Choir", "Lease", "Oath"], motto: "They pay so we don't visit." },
  }[style];
  const left = table.words[rollInt(d, 3)] ?? "Quiet";
  const right = table.words[3 + rollInt(d, 3)] ?? "Shift";
  d.crew = {
    name: `The ${left} ${right}`,
    members: [],
    heat: style === "smash" ? 26 : style === "fear" ? 18 : 10,
    loyalty: 62,
    motto: table.motto,
  };
  return ` The crew is ${d.crew.name}. Motto: ${d.crew.motto} It is just you, which is how every bad idea begins.`;
}

function touchCrew(d: Game, heat: number, loyalty: number, blame?: boolean): string {
  const crew = d.crew;
  if (!crew) return " There is no ledger to update.";
  crew.heat = clamp((crew.heat ?? 0) + heat, 0, 100);
  crew.loyalty = clamp((crew.loyalty ?? 50) + loyalty, 0, 100);
  let line = "";
  if (blame && crew.members.length) {
    const gone = crew.members.pop();
    if (gone) line += ` ${gone.alias} is off the jacket list.`;
  }
  if (crew.heat >= 70) line += " The city is looking for the jackets.";
  else if (heat < 0) line += " The heat dips.";
  if (crew.loyalty <= 25) line += " Someone is pricing a betrayal.";
  else if (loyalty > 0) line += " The crew stays.";
  return line;
}

function draftVillain(d: Game, personId: string): string {
  const crew = d.crew;
  const person = d.relationships.find((r) => r.id === personId && r.alive);
  if (!person) return "";
  if (!crew) return ` ${person.note || firstName(person.name)} would have taken a jacket. You don't have one to give.`;
  if (crew.members.some((member) => member.personId === person.id)) return ` ${person.note || firstName(person.name)} is already on the ledger.`;
  crew.members.push({ personId: person.id, name: person.name, alias: person.note || firstName(person.name) });
  crew.loyalty = clamp((crew.loyalty ?? 50) + 6, 0, 100);
  person.closeness = clamp(person.closeness + 8, 0, 100);
  return ` ${person.note || firstName(person.name)} takes the jacket. ${crew.name} is louder by one.`;
}

function runHeist(d: Game, style: "smash" | "quiet" | "fear" | "spark", deltas: Delta[]): string {
  const crew = d.crew;
  if (!crew || crew.members.length < 1) return " Nobody was on the clock.";
  d.flags.crewjob = 1;
  const size = crew.members.length;
  let haul = 700 + size * 380;
  let heat = 8;
  let loyalty = 3;
  let karma = -6;
  let health = 0;
  let fame = 2;
  let happiness = 1;
  let reputation = -3;
  let text = "";
  if (style === "smash") {
    haul += 600 + rollInt(d, 800);
    heat += 16;
    health = roll(d) < 0.4 ? -9 : -2;
    happiness = health < -5 ? -3 : 2;
    text = `${crew.name} goes through the front. The haul is loud and the exit is a suggestion.`;
  } else if (style === "quiet") {
    const blown = roll(d) < 0.22;
    haul += blown ? 180 : 800 + rollInt(d, 600);
    heat += blown ? 20 : 4;
    loyalty += blown ? -6 : 7;
    health = blown ? -6 : 0;
    happiness = blown ? -3 : 2;
    text = blown ? `${crew.name} is quiet until a camera is not. You leave a fingerprint in the story.` : `${crew.name} moves like a rumor. Nobody's real name makes the tape.`;
  } else if (style === "fear") {
    haul += 280 + size * 220;
    heat += 11;
    karma = -9;
    reputation = -5;
    fame = 3;
    text = `You tax a block in the name of ${crew.name}. They pay. They also remember the motto.`;
  } else {
    haul += 150;
    heat += 6;
    karma = -8;
    const gift = randomMissingBase(d.unlockedPowers ?? [], roll(d));
    const name = gift ? unlockCombo(d, gift.id) : "";
    text = name ? `You lift a spark instead of a safe. ${name} stays in the book.` : "The jar was empty. You take the petty cash and the humiliation.";
  }
  if ((crew.loyalty ?? 50) < 34 && roll(d) < 0.45 && crew.members.length) {
    const gone = crew.members.pop();
    loyalty -= 8;
    if (gone) text += ` ${gone.alias} keeps a cut and not your trust.`;
  }
  crew.heat = clamp((crew.heat ?? 0) + heat, 0, 100);
  crew.loyalty = clamp((crew.loyalty ?? 50) + loyalty, 0, 100);
  applyEffects(d, { money: haul, karma, health, fame, happiness, reputation }, deltas);
  return ` ${text}`;
}

function applySpecial(d: Game, special: Special | undefined, deltas: Delta[]): string {
  if (!special) return "";
  if (special.kind === "swap") {
    const current = d.powerId;
    let next = rollPower(roll(d), roll(d), null);
    for (let i = 0; i < 6 && next.id === current; i++) next = rollPower(roll(d), roll(d), null);
    d.powerId = next.id;
    const before = d.stats.powerLevel;
    d.stats.powerLevel = clamp(Math.round((Math.max(1, before) - 1.7) * 100) / 100, 1, powerLevelCap(d.age));
    deltas.push({ stat: "Power", amount: Math.round((d.stats.powerLevel - before) * 100) / 100 });
    return ` What wakes up instead is ${next.name}. ${next.tagline}`;
  }
  if (special.kind === "job") {
    const job = jobById(special.jobId);
    if (!job || jobBlock(d, job)) return " The offer evaporates when they read the fine print.";
    d.jobId = job.id;
    d.jobRank = 0;
    d.jobYears = 0;
    return ` You're on the schedule at ${job.name}.`;
  }
  if (special.kind === "school") {
    const school = schoolById(special.schoolId);
    if (!school || schoolBlock(d, school)) return " Admissions smiles with their teeth and says no.";
    d.schoolId = school.id;
    d.schoolYears = 0;
    maybeRival(d, school.tier);
    return ` You enroll at ${school.name}.`;
  }
  if (special.kind === "friend") {
    if (d.relationships.filter((r) => r.role === "friend" && r.alive).length >= 5) return "";
    const pal = addPerson(d, { role: "friend", closeness: 46, age: Math.max(6, d.age + rollInt(d, 7) - 3), note: "Stuck around." });
    return ` ${firstName(pal.name)} sticks.`;
  }
  if (special.kind === "partner") {
    if (d.relationships.some((r) => r.role === "partner" && r.alive)) return "";
    const pal = addPerson(d, { role: "partner", closeness: 48, age: Math.max(18, d.age + rollInt(d, 8) - 3), note: "It's new." });
    return ` ${firstName(pal.name)} stays past the awkward part.`;
  }
  if (special.kind === "rival") {
    maybeRival(d, 2);
    return "";
  }
  if (special.kind === "baby") return haveChild(d);
  if (special.kind === "rankup" && d.leagueRank < 6) {
    d.leagueRank += 1;
    d.missions = 0;
    return ` The League bumps you to ${RANKS[d.leagueRank]}.`;
  }
  if (special.kind === "meet") {
    const person = introduceCape(d, special.side);
    return ` ${person.note} — ${firstName(person.name)} — is in your life now.`;
  }
  if (special.kind === "arch") {
    const foe = markArch(d, special.personId);
    if (!foe) return " The rivalry fails to trend. Humiliating, in a quiet way.";
    return ` ${foe.note ?? firstName(foe.name)} is your arch-enemy. The city will print it that way.`;
  }
  if (special.kind === "combine") {
    return grantSecondGift(d, deltas);
  }
  if (special.kind === "grant") {
    // Stray sparks (no specific recipe offered) are rare: at most one every two years, so powers stay an event.
    if (!special.comboId && d.flags.lastGrantAge !== undefined && d.age - d.flags.lastGrantAge < 2) {
      return " Something sparks in your palm and goes out. Not yet. You are still learning the last one.";
    }
    if (!special.comboId) d.flags.lastGrantAge = d.age;
    const id = special.comboId ?? randomMissingBase(d.unlockedPowers ?? [], roll(d))?.id ?? null;
    const name = unlockCombo(d, id);
    if (!name) return " The spark fizzles. You already hold that page.";
    const legacy = id ? legacyFromCombo(id) : null;
    if (!d.powerId && legacy) {
      d.powerId = legacy;
      d.powerless = false;
      d.stats.powerLevel = Math.max(d.stats.powerLevel, 1.2);
    }
    return ` A new page in the braid book: ${name}.`;
  }
  if (special.kind === "meetHero") {
    const hero = special.heroId ? (d.heroes ?? []).find((item) => item.id === special.heroId) : (d.heroes ?? []).find((item) => !item.met);
    if (!hero) return " Every trainer you know is already tired of your number.";
    if (!hero.met) {
      hero.met = true;
      hero.relationship = Math.max(hero.relationship, 18);
    } else {
      hero.relationship = clamp(hero.relationship + 4, 0, 100);
    }
    const bases = teachableBases(hero.unlocked, d.unlockedPowers ?? []);
    for (const power of bases) discoverPower(d, power.id);
    const page = bases.length ? " What they can teach is in your book now, not on a rumor." : "";
    return ` ${hero.alias} clocks you. ${hero.personality.split(".")[0]}.${page}`;
  }
  if (special.kind === "heroProgress") {
    const hero = (d.heroes ?? []).find((item) => item.id === special.heroId);
    if (!hero) return "";
    hero.exp += special.exp;
    const before = hero.level;
    hero.relationship = clamp(hero.relationship + special.bond, 0, 100);
    settleHeroLevel(hero);
    const taught = special.teach ? unlockCombo(d, special.teach) : "";
    const drilled = special.masteryId && special.masteryExp ? grantMastery(d, special.masteryId, special.masteryExp) : "";
    const grew = hero.level > before ? ` ${hero.alias} hits level ${hero.level}. Slowly.` : "";
    return `${taught ? ` They put ${taught} in your hands.` : ""}${drilled}${grew}`;
  }
  if (special.kind === "foundCrew") {
    return foundCrew(d, special.style);
  }
  if (special.kind === "heist") {
    return runHeist(d, special.style, deltas);
  }
  if (special.kind === "crewTouch") {
    return touchCrew(d, special.heat, special.loyalty, special.blame);
  }
  if (special.kind === "draft") {
    return draftVillain(d, special.personId);
  }
  if (special.kind === "mastery") {
    return grantMastery(d, special.powerId, special.exp);
  }
  if (special.kind === "arcAdvance") {
    return advanceArc(d, deltas);
  }
  if (special.kind === "trait") {
    return grantTrait(d, special.traitId) ? ` ${traitById(special.traitId)?.title ?? "The new reputation"} sticks.` : "";
  }
  if (special.kind === "dropTrait") {
    dropTrait(d, special.traitId);
    return "";
  }
  if (special.kind === "retitle") {
    dropTrait(d, special.drop);
    const line = grantTrait(d, special.add, "mark");
    return line ? ` ${line}` : "";
  }
  if (special.kind === "move") {
    return relocate(d, special.cityId);
  }
  return "";
}

function textOf(value: string | ((g: Game) => string), g: Game): string {
  return typeof value === "function" ? value(g) : value;
}

function effectsOf(value: Effects | ((g: Game) => Effects) | undefined, g: Game): Effects | undefined {
  if (!value) return undefined;
  return typeof value === "function" ? value(g) : value;
}

function scaleEffects(e: Effects, f: number): Effects {
  const out: Effects = {};
  const keys = ["health", "happiness", "smarts", "looks", "fame", "money", "reputation", "parentBelief", "powerLevel", "closeness", "karma"] as const;
  for (const key of keys) {
    if (typeof e[key] === "number") out[key] = Math.round(e[key] * f * 100) / 100;
  }
  if (e.personId) out.personId = e.personId;
  return out;
}

function bakeMini(mini: MiniTemplate): MinigameSpec {
  return {
    kind: mini.kind,
    title: mini.title,
    subtitle: mini.subtitle,
    difficulty: mini.difficulty,
    winText: mini.winText,
    loseText: mini.loseText,
    partialText: mini.partialText ?? "You get half of it. The half that matters is arguable.",
    winEffects: mini.win,
    loseEffects: mini.lose,
    partialEffects: mini.partial ?? scaleEffects(mini.win, 0.45),
  };
}

function bakeEvent(d: Game, event: EventDef): Pending {
  d.flags[`seen:${event.id}`] = 1;
  d.lastEvent = event.id;
  const usable = event.choices.filter((choice) => !choice.requires || choice.requires(d));
  const list = usable.length ? usable : [{ label: "Continue", text: "You let the moment pass." }];
  const outcomes: Record<string, Outcome> = {};
  const choices = list.map((choice, index) => {
    const id = `c${index}`;
    const special = typeof choice.special === "function" ? choice.special(d) : choice.special;
    outcomes[id] = {
      text: textOf(choice.text, d),
      effects: effectsOf(choice.effects, d),
      special,
      flags: choice.flags,
      minigame: choice.mini ? { ...bakeMini(choice.mini), specialWin: special, tag: special?.kind === "combine" ? "relic" : undefined } : undefined,
    };
    return { id, label: choice.label };
  });
  return { id: event.id, prompt: event.text(d), choices, outcomes };
}

function showChoice(d: Game, pending: Pending, banners: string[]) {
  d.pending = pending;
  d.phase = "choice";
  d.minigame = null;
  d.card = { kicker: whenLabel(d.age, d.month), banner: banners, body: pending.prompt, deltas: [] };
  pushHistory(d, pending.prompt);
}

const QUIET = [
  "Nothing explodes. You almost feel robbed.",
  "A year of groceries, weather, and group chats. You live all of it.",
  "You keep your head down and your socks matched. A radical era.",
  "The city hums. You hum back, off-key, and nobody files a report.",
  "You measure the year in coffee and almost-decisions. Both were fine.",
  "A quiet year. Your future biographer will skip it and be wrong.",
];

function coolHeat(d: Game, banners: string[]) {
  const heat = d.flags.heat ?? 0;
  if (heat <= 0) return;
  d.flags.heat = heat - 1;
  if (d.flags.heat <= 0) {
    delete d.flags.heat;
    banners.push("Whatever was sniffing around your name gets bored.");
  }
}

function manifestChoices(d: Game): Pending {
  const power = powerById(d.powerId);
  const name = power?.name ?? "Something";
  const house = upbringingById(d.upbringing);
  const prompt = d.card.body;
  const secret = hasTrait(d, "secret");
  const loud = hasTrait(d, "loud");
  return {
    id: "manifest",
    prompt,
    choices: [
      { id: "tell", label: house.parents === "none" ? "Tell the person who counts" : "Tell your folks" },
      { id: "hide", label: secret ? "Keep the mask on" : "Keep it quiet" },
      { id: "post", label: loud ? "Let them film it" : "Post the clip" },
    ],
    outcomes: {
      tell: {
        text: `You tell them about ${name}. ${house.tell}`,
        effects: { parentBelief: house.tellBelief, happiness: house.tellHappy, fame: house.tellFame, smarts: house.tellSmarts },
        flags: { hidden: 0 },
      },
      hide: {
        text: secret ? "The mask was already the plan. Dinner learns nothing new, and training gets lonelier." : "You swallow it. Training gets lonelier. So does dinner.",
        effects: { parentBelief: -6, happiness: -2 },
        flags: { hidden: 1 },
      },
      post: {
        text: loud ? "You were already a public problem. The clip just makes it legible." : "The clip does numbers. Your reflection looks employable and doomed.",
        effects: { fame: loud ? 10 : 8, reputation: 1, parentBelief: -2, happiness: 2 },
        flags: { viral: 1, hidden: 0 },
      },
    },
  };
}

function awaken(d: Game, banners: string[], how: "age" | "push") {
  const before = abilityNames(d);
  const picked = rollPower(roll(d), roll(d), d.powerBias);
  d.powerId = picked.id;
  d.powerless = false;
  unlockCombo(d, legacyComboId(picked.id));
  const rarity = picked.rarity === "rare" ? 1 : picked.rarity === "uncommon" ? 0.4 : 0;
  let level = 1 + roll(d) * 1.7 + rarity;
  if (d.upbringing === "legacy") level += 0.55;
  if (d.powerBias && d.powerBias === picked.id) level += 0.3;
  d.stats.powerLevel = clamp(Math.round(level * 100) / 100, 1, Math.min(4, powerLevelCap(d.age)));
  noteGrowth(before, d, banners);
  const lead = how === "push" ? "You push, and this time something pushes back." : "It happens on an ordinary day, which feels rude.";
  const body = `${lead}\n\n${picked.name}. ${picked.tagline}\n\n${picked.strength} ${picked.weakness}`;
  d.card = { kicker: whenLabel(d.age, d.month), banner: banners, body, deltas: [{ stat: "Power", amount: d.stats.powerLevel }] };
  d.pending = manifestChoices(d);
  d.phase = "choice";
  d.minigame = null;
  d.lastEvent = "manifest";
  pushHistory(d, `Power manifested: ${picked.name}.`, "major");
}

function tryManifest(d: Game, banners: string[]): boolean {
  if (d.powerId || d.powerless || (d.unlockedPowers?.length ?? 0) > 0) return false;
  if (d.age > 24) {
    d.powerless = true;
    banners.push("The window closes. You are officially ordinary — which has never stopped a good story.");
    return false;
  }
  const nullGene = d.flags.nullGene === 1;
  if (!nullGene && d.age === 15) {
    awaken(d, banners, "age");
    return true;
  }
  let chance = 0;
  if (!nullGene && d.age >= 7 && d.age < 15) chance = 0.1 + (d.age - 7) * 0.07;
  if (nullGene && d.age >= 18 && d.age <= 24) chance = 0.11;
  if (chance > 0 && roll(d) < chance) {
    awaken(d, banners, "age");
    return true;
  }
  return false;
}

function grief(d: Game, person: Person, banners: string[]) {
  const name = firstName(person.name);
  const prompt = `${person.name} is gone. The room sounds wrong. Someone has to say it out loud without turning it into a brand.`;
  const inherit = 1600 + Math.round(d.stats.parentBelief * 35);
  d.pending = {
    id: `grief-${person.id}`,
    prompt,
    choices: [
      { id: "speak", label: "Give a messy eulogy" },
      { id: "quiet", label: "Shut down" },
      { id: "trunk", label: "Open the weird trunk" },
    ],
    outcomes: {
      speak: { text: `You talk about ${name} and forget to be impressive. It is the truest thing you do all year.`, effects: { happiness: 4, reputation: 2 } },
      quiet: { text: "You nod through it. The quiet follows you home and keeps a key.", effects: { happiness: -8, health: -3 } },
      trunk: { text: `${name} kept cash in a biscuit tin and a note that just says "obviously."`, effects: { money: inherit, happiness: -2 } },
    },
  };
  d.phase = "choice";
  d.minigame = null;
  d.card = { kicker: whenLabel(d.age, d.month), banner: banners, body: prompt, deltas: [] };
  pushHistory(d, `${person.name} died.`, "major");
}

/** The body recovers a little every month, less with age. Low health always says what to do about it. */
function monthlyBody(d: Game, banners: string[]) {
  if ((d.flags.critical ?? 0) > 0) d.flags.critical = Math.max(0, (d.flags.critical ?? 0) - 1);
  const ceiling = d.age < 40 ? 70 : d.age < 60 ? 55 : 40;
  if (d.stats.health < ceiling) {
    const regen = d.age < 25 ? 2 : d.age < 60 ? 1 : 0;
    d.stats.health = clamp(d.stats.health + regen, 0, 100);
  }
  if (d.stats.health < 25 && d.age >= 7) banners.push(`Health ${d.stats.health}. Rest or see a doctor before you drill or fight.`);
  // Joy settles: the higher it sits, the more likely a month takes a point back. Staying happy is a habit, not a trophy.
  if (d.stats.happiness > 70 && roll(d) < (d.stats.happiness - 70) / 24) d.stats.happiness -= 1;
}

function clearMonthFlags(d: Game) {
  for (const key of Object.keys(d.flags)) {
    if (key === "rested" || key === "mentored" || key === "shifted" || key === "patrolled" || key === "hobby" || key === "crewjob" || key === "crewpay" || key === "crewcool" || key === "moved" || key === "walked" || key.startsWith("time:") || key.startsWith("gift:") || key.startsWith("talks:")) delete d.flags[key];
  }
}

function openYear(d: Game): string[] {
  const banners: string[] = [];
  const before = abilityNames(d);
  d.age += 1;
  d.majorsLeft = 3;
  clearMonthFlags(d);
  for (const person of d.relationships) {
    if (!person.alive) continue;
    person.age += 1;
    if (person.metAt < d.age && (person.role === "friend" || person.role === "teammate")) {
      person.closeness = clamp(person.closeness - 3, 0, 100);
      if (person.closeness === 0) {
        person.alive = false;
        banners.push(`${firstName(person.name)} drifts out of your life.`);
      }
    }
    if (person.role === "partner" && person.metAt < d.age) person.closeness = clamp(person.closeness - 1, 0, 100);
  }
  const partner = d.relationships.find((r) => r.role === "partner" && r.alive);
  if (partner && partner.closeness < 16) {
    partner.role = "ex";
    d.flags.married = 0;
    banners.push(`${firstName(partner.name)} ends it. You hear it in a text that took too long to draft.`);
  }
  if (partner && partner.alive && partner.role === "partner" && partner.age > 80 && roll(d) < (partner.age - 78) * 0.03) {
    partner.alive = false;
    d.stats.happiness = clamp(d.stats.happiness - 14, 0, 100);
    banners.push(`${firstName(partner.name)} dies. The year tilts.`);
    pushHistory(d, `${partner.name} died.`, "major");
  }

  let pay = 0;
  if (d.age < 16) pay += Math.round(90 + d.stats.parentBelief * 2.4);
  if (d.jobId) {
    const job = jobById(d.jobId);
    if (job && d.stats.happiness < 16 && roll(d) < 0.45) {
      banners.push(`${job.name} lets you go and calls it restructuring.`);
      d.jobId = null;
      d.jobRank = 0;
      d.jobYears = 0;
    } else if (job) {
      const mult = [1, 1.25, 1.55, 1.95, 2.45][d.jobRank] ?? 1;
      pay += Math.round(job.pay * mult * (d.age < 18 ? 0.5 : 1));
      if (job.id === "influencer") pay += Math.round(d.stats.fame * 420);
      d.stats.happiness = clamp(d.stats.happiness + job.stress, 0, 100);
      // Through applyEffects so the soft ceiling on fame/rep applies to salaried fame too.
      applyEffects(d, { fame: job.fame || undefined, reputation: job.rep || undefined }, []);
      d.jobYears += 1;
    }
  }
  if (d.leagueRank > 0 && !d.flags.villainContract) pay += STIPEND[d.leagueRank] ?? 0;
  if (d.flags.villainContract) {
    pay += 14000;
    d.stats.reputation = clamp(d.stats.reputation - 2, -100, 100);
  }
  if (d.stats.fame > 45 && d.leagueRank >= 1) pay += Math.round(d.stats.fame * 150);

  if (d.schoolId) {
    const school = schoolById(d.schoolId);
    if (school && d.age > school.maxAge) {
      banners.push(`You graduate ${school.name}. The photo is official and unflattering.`);
      applyEffects(d, { smarts: 4, fame: school.tier }, []);
      d.stats.powerLevel = clamp(Math.round((d.stats.powerLevel + 0.08) * 100) / 100, 0, powerLevelCap(d.age));
      d.schoolId = null;
      pushHistory(d, `Graduated ${school.name}.`, "major");
    } else if (school) {
      if (school.tuition > 0 && d.stats.money + pay < school.tuition) {
        banners.push(`Tuition at ${school.name} bounces. The bursar has no myth in them.`);
        d.schoolId = null;
      } else {
        pay -= school.tuition;
        applyEffects(d, { smarts: school.yearly.smarts || undefined }, []);
        d.stats.powerLevel = clamp(Math.round((d.stats.powerLevel + (school.yearly.powerLevel ?? 0)) * 100) / 100, 0, powerLevelCap(d.age));
        applyEffects(d, { fame: school.yearly.fame || undefined, reputation: school.yearly.reputation || undefined }, []);
        applyEffects(d, { happiness: school.yearly.happiness || undefined }, []);
        d.schoolYears += 1;
      }
    }
  }

  if (d.age >= 6 && d.age <= 17) d.stats.smarts = clamp(d.stats.smarts + 1, 0, 100);
  if (d.jobId && d.leagueRank >= 3) {
    d.stats.happiness = clamp(d.stats.happiness - 3, 0, 100);
    banners.push("Day job plus hero hours. You are tired in a noble font.");
  } else if (d.jobId && d.schoolId) {
    d.stats.happiness = clamp(d.stats.happiness - 2, 0, 100);
  }

  const suit = costumeMods(d);
  if (suit.cash && pay > 0) pay = Math.round(pay * (1 + suit.cash / 100));
  if (suit.fame > 0) {
    const beforeFame = d.stats.fame;
    applyEffects(d, { fame: suit.fame }, []);
    if (d.stats.fame > beforeFame) banners.push(`The suit still gets you recognized. Fame +${d.stats.fame - beforeFame}.`);
  }

  d.stats.money = clamp(d.stats.money + pay, -20000, 100_000_000);
  if (pay >= 800) banners.push(`The year clears ${money(pay)}.`);
  else if (pay <= -400) banners.push(`The year costs ${money(-pay)}.`);
  {
    const held = marketYear(d);
    for (const e of held.effects) applyEffects(d, e, []);
    if (held.legacy) d.legacy = (d.legacy ?? 0) + held.legacy;
    d.stats.money = clamp(d.stats.money, -20000, 100_000_000);
    banners.push(...held.banners);
  }

  // The news cycle: past the top quarter, fame needs fresh feats to hold, or it slides a little each year.
  if (d.stats.fame > 75) d.stats.fame = clamp(d.stats.fame - (d.stats.fame > 90 ? 2 : 1), 0, 100);
  if (d.leagueRank === 0 && d.stats.fame > 22) {
    const fameBefore = d.stats.fame;
    d.stats.fame = clamp(d.stats.fame - 2, 0, 100);
    if (fameBefore >= 42) banners.push("The internet finds a newer comet.");
  }

  let healthDelta = 0;
  if (d.age > 58) {
    // Purpose keeps you upright: a real legacy halves the yearly toll of age.
    const toll = Math.floor((d.age - 58) / 5);
    healthDelta -= (d.legacy ?? 0) >= 20 ? Math.ceil(toll / 2) : toll;
  }
  if (d.stats.happiness < 28) healthDelta -= 2;
  if (d.stats.happiness > 80) healthDelta += 1;
  if (d.age < 18) healthDelta += 1;
  if (d.powerId === "healing") healthDelta += 2;
  if (d.powerId === "intellect") d.stats.smarts = clamp(d.stats.smarts + 1, 0, 100);
  if (roll(d) < 0.45) healthDelta -= 1;
  d.stats.health = clamp(d.stats.health + healthDelta, 0, 100);
  if (d.age >= 16 && d.age <= 28 && roll(d) < 0.35) d.stats.looks = clamp(d.stats.looks + 1, 0, 100);
  if (d.age > 64) d.stats.looks = clamp(d.stats.looks - 1, 0, 100);
  d.stats.happiness = clamp(d.stats.happiness + (roll(d) < 0.5 ? -1 : 1), 0, 100);
  // Hedonic adaptation: a great year becomes the new normal, so joy has to be renewed.
  if (d.stats.happiness > 80) d.stats.happiness -= 2;
  // Mentoring has diminishing returns inside a year.
  delete d.flags.mentorRun;
  if (d.stats.health < 28 && d.age > 45) banners.push("You feel the year in your knees and your patience.");

  const needM = [0, 2, 3, 4, 5, 6, 8];
  const needPl = [0, 2, 3.2, 4.8, 6.4, 7.6, 9];
  const needRep = [0, 0, 8, 18, 32, 48, 62];
  if (d.leagueRank >= 1 && d.leagueRank < 6) {
    if (d.flags.villainContract) banners.push("The League will not return your calls while the other contract lives.");
    else if (d.missions >= (needM[d.leagueRank] ?? 99) && d.stats.powerLevel >= (needPl[d.leagueRank] ?? 99) && d.stats.reputation >= (needRep[d.leagueRank] ?? 99)) {
      d.leagueRank += 1;
      d.missions = 0;
      applyEffects(d, { fame: 6 }, []);
      banners.push(`Promotion: ${RANKS[d.leagueRank]}. The badge gets heavier.`);
      pushHistory(d, `Rose to ${RANKS[d.leagueRank]}.`, "major");
    }
  }

  noteGrowth(before, d, banners);
  return banners;
}

function offerYearPower(d: Game, banners: string[]): boolean {
  if (d.age < 13) return false;
  const owned = (d.unlockedPowers ?? []).length;
  const chance = (d.age < 18 ? 0.34 : d.age < 30 ? 0.28 : 0.2) * (owned >= 10 ? 0.5 : 1);
  if (roll(d) >= chance) return false;
  const offer = offerPower(d.unlockedPowers ?? [], d.age, roll(d));
  if (!offer) return false;
  discoverPower(d, offer.id);
  const rank = offer.tierName.toLowerCase();
  showChoice(
    d,
    {
      id: "year-power",
      prompt: `You turn ${d.age}. A power you did not own yesterday is willing: ${offer.name}. It is ${rank}. Basics stay smaller than mixed powers. Take it, or let the year keep it.`,
      choices: [
        { id: "take", label: `Take ${offer.name}` },
        { id: "leave", label: "Let it pass" },
      ],
      outcomes: {
        take: {
          text: `${offer.name} settles in. ${offer.description} Owning it is not the same as ranking it.`,
          special: { kind: "grant", comboId: offer.id },
          effects: { happiness: 2 },
        },
        leave: {
          text: `You let ${offer.name} go. The name stays in the book. The year does not offer it twice.`,
          effects: { happiness: 1 },
        },
      },
    },
    banners,
  );
  return true;
}

function yearEvent(d: Game, banners: string[]) {
  const milestone = [13, 16, 18, 21, 30, 40, 50, 65, 80].includes(d.age);
  const quietChance = milestone ? 0.08 : 0.22;
  const eventRoll = roll(d);
  const beQuiet = roll(d) < quietChance;
  if (!beQuiet) {
    const event = pickEvent(d, eventRoll);
    coolHeat(d, banners);
    if (event) {
      showChoice(d, bakeEvent(d, event), banners);
      return;
    }
  } else coolHeat(d, banners);
  setStory(d, QUIET[rollInt(d, QUIET.length)] ?? QUIET[0]!, [], banners);
}

export function createGame(opts: NewLifeOpts): Game {
  const city = cityById(opts.cityId);
  const upbringing = upbringingById(opts.upbringing);
  const seed = (opts.seed ?? 1) >>> 0 || 1;
  const d: Game = {
    version: 2,
    rng: seed,
    nextId: 1,
    phase: "choice",
    name: opts.name.trim().slice(0, 32) || "Alex Voss",
    city: city.name,
    cityId: city.id,
    upbringing: upbringing.id,
    portrait: opts.portrait || 1,
    sex: opts.sex,
    look: resolveLook(opts.portrait || 1, opts.look),
    age: 0,
    month: 0,
    stats: { health: 80, happiness: 60, smarts: 30, looks: 40, fame: 0, money: 0, reputation: 0, parentBelief: 50, powerLevel: 0, karma: 0 },
    powerId: null,
    secondaryId: null,
    unlockedPowers: [],
    discovered: [],
    powerless: false,
    giftId: null,
    powerBias: opts.heir?.powerBias ?? null,
    schoolId: null,
    schoolYears: 0,
    jobId: null,
    jobYears: 0,
    jobRank: 0,
    leagueRank: 0,
    teamId: null,
    missions: 0,
    relationships: [],
    roster: [],
    crew: null,
    heroes: seedHeroes(),
    traits: [],
    mastery: {},
    moveExp: {},
    loadout: [],
    moveSets: [
      { name: "Set A", moves: [] },
      { name: "Set B", moves: [] },
    ],
    focusPower: null,
    wardrobe: starterWardrobe(),
    story: { active: null, cleared: [], progress: {} },
    majorsLeft: 0,
    flags: {},
    card: { kicker: "Age 0", banner: [], body: "", deltas: [] },
    pending: null,
    minigame: null,
    history: [],
    death: null,
    lastEvent: "",
    peak: { fame: 0, power: 0, rank: 0, money: 0, rep: 0 },
  };
  d.stats = {
    health: clamp(84 + rollInt(d, 12), 0, 100),
    happiness: clamp(upbringing.happiness + rollInt(d, 9) - 3, 0, 100),
    smarts: clamp(26 + upbringing.smarts + rollInt(d, 16), 0, 100),
    looks: clamp(28 + rollInt(d, 48), 0, 100),
    fame: opts.heir ? clamp(Math.round(opts.heir.fame * 0.2), 0, 28) : upbringing.fame,
    money: upbringing.money,
    reputation: 0,
    parentBelief: opts.heir ? clamp(opts.heir.belief, 0, 100) : upbringing.belief,
    powerLevel: 0,
    karma: upbringing.karma ?? 0,
  };
  if (upbringing.health) d.stats.health = clamp(d.stats.health + upbringing.health, 0, 100);
  if (upbringing.looks) d.stats.looks = clamp(d.stats.looks + upbringing.looks, 0, 100);
  d.stats.fame = clamp(d.stats.fame, 0, 28);
  if (!opts.heir && roll(d) < 0.07) d.flags.nullGene = 1;
  if (opts.heir?.trust) d.flags.trust = Math.round(opts.heir.trust);
  const last = d.name.split(" ").slice(1).join(" ") || "Voss";
  const kin = familyPlan(upbringing.id);
  if (kin.count >= 1) addPerson(d, { role: "parent", closeness: upbringing.closeness, age: 29 + rollInt(d, 12), last, sex: "female", note: kin.note });
  if (kin.count === 2) addPerson(d, { role: "parent", closeness: clamp(upbringing.closeness - 8, 12, 100), age: 27 + rollInt(d, 14), last, sex: "male", note: kin.note });
  grantTrait(d, asFace(opts.face));
  grantTrait(d, asDrive(opts.drive));
  biasHeroes(d);
  d.stats.fame = clamp(d.stats.fame, 0, 28);
  const chosen = opts.giftId && getPower(opts.giftId) ? opts.giftId : null;
  d.giftId = chosen;
  if (chosen) {
    unlockCombo(d, chosen);
    const legacy = legacyFromCombo(chosen);
    if (legacy) d.powerId = legacy;
    d.focusPower = chosen;
    d.powerless = false;
    d.stats.powerLevel = 1.2;
  } else {
    d.powerless = true;
    d.powerId = null;
    d.focusPower = null;
  }
  const born = d.sex === "female" ? "a girl" : "a boy";
  const faceLine = traitById(asFace(opts.face))?.blurb ?? "";
  const driveLine = traitById(asDrive(opts.drive))?.blurb ?? "";
  const gift = chosen ? getPower(chosen) : null;
  const giftLine = gift
    ? `\n\nYou are born with one gift: ${gift.name}. ${gift.description} The book starts there. A second power has to be taught, offered, or braided.`
    : "\n\nThe tests come back ordinary. No gift. The book stays shut.";
  const prompt = `You are born ${born} in ${city.name}. ${city.flavor}\n\n${upbringing.detail}${kin.line ? ` ${kin.line}` : ""}\n\n${faceLine} ${driveLine}${giftLine}`;
  d.pending = {
    id: "birth",
    prompt,
    choices: [
      { id: "wail", label: "Wail like it matters" },
      { id: "nap", label: "Sleep through the fuss" },
      { id: "stare", label: "Stare like you have a plan" },
    ],
    outcomes: {
      wail: { text: "You enter at full volume. Someone claps. It is unclear why, and it helps.", effects: { happiness: 5, parentBelief: 3 } },
      nap: { text: "You nap. Later biographies will call this strategy.", effects: { health: 4, happiness: 1 } },
      stare: { text: "You stare at a ceiling tile like it owes you a skyline.", effects: { smarts: 3, parentBelief: 1 } },
    },
  };
  d.card = { kicker: whenLabel(0, 0), banner: ["One choice. Then the months start. Three moves each."], body: prompt, deltas: [] };
  d.history = [{ age: 0, month: 0, text: `Born ${born} in ${city.name}.${gift ? ` Gift: ${gift.name}.` : " No gift."}${kin.line ? ` ${kin.line}` : ""}`, tag: "major" }];
  peaks(d);
  seedRoster(d);
  ensureProgress(d);
  d.legacy = 0;
  openChapter(d);
  return d;
}

const HERO_ALIASES = ["Brightline", "Kiln", "Paper Saint", "Northstar", "Latch", "Sunday", "Marrow", "Velvet Alarm", "Docklight", "Halogen", "The Polite Fist", "Blue Receipt", "Orchard", "Kid Circuit", "Lampblack"];
const VILLAIN_ALIASES = ["Glassjaw", "Moth King", "Rent", "Saltwidow", "The Auditor", "Night Errand", "Crumb", "Red Tape", "Hollowgram", "Mrs. Static", "Payday", "The Unlist", "Gutter Saint", "Afterimage", "Taxman"];
const ROSTER_BEATS = [
  "caught on a doorbell camera being polite",
  "lost a fight to a parking meter",
  "trending for the wrong rescue",
  "benched after a quote",
  "seen leaving a villain's brunch",
  "promoted and already tired",
  "retired for a week, then didn't",
  "sponsoring a cereal that hates them",
];
const MONTH_QUIET = [
  "The month stays ordinary. You almost file a complaint.",
  "Groceries, weather, a group chat. You live all of it.",
  "Nothing explodes. The board still shuffles behind your back.",
  "You keep your head down. The city hums like it might mean you.",
  "A quiet stretch. Your future biographer will skip it and be wrong.",
  "You measure the weeks in coffee and almost-decisions. Both were fine.",
];
const RELIC_SITES = ["the drowned subway", "a crater that still ticks", "the observatory closed for bird reasons", "a storage unit rented by a dead hero", "the pier that rings like a phone"];

function styleAt(index: number): MoveStyle {
  return (["strike", "trick", "guard"] as const)[index % 3] ?? "strike";
}

function movesFrom(powerId: PowerId | null, level: number): DuelMove[] {
  const power = powerById(powerId);
  const owned = power ? power.abilities.filter((ability) => level + 0.001 >= ability.at) : [];
  const source = owned.length
    ? owned
    : [
        { name: "Haymaker", blurb: "Ugly and sincere.", at: 0 },
        { name: "Slip", blurb: "Don't be where the hit lands.", at: 0 },
        { name: "Brace", blurb: "Take the ugly one on purpose.", at: 0 },
      ];
  const element = power ? elementOfLegacy(power.id) : "force";
  return source.slice(0, 4).map((ability, index) => ({
    name: ability.name,
    blurb: ability.blurb,
    power: 4 + index * 2 + Math.round(level),
    style: styleAt(index),
    element,
  }));
}

function playerMoves(d: Game): DuelMove[] {
  fillLoadout(d);
  if (equippedMoves(d).length) return battleMoves(d);
  // Unpowered life: the legacy street kit, still padded to the full six.
  const legacy = movesFrom(d.powerId, d.stats.powerLevel).slice(0, 4);
  const names = new Set(legacy.map((move) => move.name));
  const padding = STREET_MOVES.filter((move) => !names.has(move.name)).map((move) => ({ ...move }));
  return [...legacy, ...padding].slice(0, MOVESET_SIZE);
}

/** Seed and body for the foe's figure: the person's or roster cape's own portrait when we know them. */
function foeLook(d: Game, foe: { name: string; personId?: string }): { foeSeed: number; foeSex?: Sex } {
  const person = foe.personId ? d.relationships.find((r) => r.id === foe.personId) : undefined;
  const cape = d.roster.find((row) => row.alias === foe.name || (foe.personId && row.id === foe.personId));
  let h = 2166136261;
  for (let i = 0; i < foe.name.length; i += 1) h = Math.imul(h ^ foe.name.charCodeAt(i), 16777619);
  return { foeSeed: person?.portrait ?? cape?.portrait ?? ((h >>> 0) % 1_000_000_000) + 1, foeSex: person?.sex ?? cape?.sex };
}

function makeDuel(
  d: Game,
  foe: { name: string; title: string; side: "hero" | "villain"; powerId: PowerId; powerLevel: number; personId?: string; boss?: boolean },
  flavor: { title: string; subtitle: string; win: string; partial: string; lose: string; tag: "duel" | "relic"; winEffects: Effects; loseEffects: Effects; partialEffects: Effects; specialWin?: Special },
): MinigameSpec {
  const pl = foe.powerLevel;
  const suit = costumeMods(d);
  const moves = playerMoves(d).map((move) =>
    suit.strike ? { ...move, power: Math.max(1, Math.round(move.power * (1 + suit.strike / 100))) } : move,
  );
  return {
    kind: "duel",
    title: flavor.title,
    subtitle: flavor.subtitle,
    difficulty: clamp(Math.round(pl / 3), 1, 3),
    tag: flavor.tag,
    winText: flavor.win,
    partialText: flavor.partial,
    loseText: flavor.lose,
    winEffects: flavor.winEffects,
    partialEffects: flavor.partialEffects,
    loseEffects: flavor.loseEffects,
    specialWin: flavor.specialWin,
    duel: {
      foeName: foe.name,
      foeTitle: foe.title,
      foeSide: foe.side,
      playerHp: 26 + Math.round(d.stats.health / 5) + Math.round(d.stats.powerLevel * 2) + (hasTrait(d, "martial") ? 6 : 0) + suit.hp,
      foeHp: 20 + Math.round(pl * 4),
      playerMoves: moves,
      foeMoves: movesFrom(foe.powerId, pl),
      personId: foe.personId,
      guard: suit.guard,
      foePower: foe.powerId,
      ...foeLook(d, foe),
      boss: foe.boss || undefined,
    } satisfies DuelBoard,
  };
}

function aliasFor(d: Game, side: "hero" | "villain"): string {
  const list = side === "hero" ? HERO_ALIASES : VILLAIN_ALIASES;
  const used = new Set(d.roster.map((cape) => cape.alias));
  for (let i = 0; i < 8; i++) {
    const alias = list[rollInt(d, list.length)] ?? list[0]!;
    if (!used.has(alias)) return alias;
  }
  return `${list[rollInt(d, list.length)]} ${rollInt(d, 90) + 10}`;
}

function makeCape(d: Game, side?: Cape["side"]): Cape {
  const rolled = side ?? (roll(d) < 0.46 ? "villain" : roll(d) < 0.85 ? "hero" : "rogue");
  const cast = rolled === "villain" ? "villain" : "hero";
  const sex = rollSex(d);
  const power = rollPower(roll(d), roll(d), null);
  return {
    id: `c${d.nextId++}`,
    name: pickName(d, undefined, sex),
    alias: aliasFor(d, cast),
    side: rolled,
    powerId: power.id,
    powerLevel: Math.round((1 + roll(d) * 7) * 10) / 10,
    heat: 15 + rollInt(d, 70),
    note: ROSTER_BEATS[rollInt(d, ROSTER_BEATS.length)] ?? "On the board.",
    portrait: rollInt(d, 1_000_000_000) + 1,
    sex,
  };
}

function seedRoster(d: Game) {
  d.roster = [];
  const notes = [...ROSTER_BEATS];
  for (let i = 0; i < 7; i++) {
    const cape = makeCape(d);
    const note = notes.splice(rollInt(d, Math.max(1, notes.length)), 1)[0];
    if (note) cape.note = note;
    d.roster.push(cape);
  }
  d.roster.sort((a, b) => b.heat - a.heat);
}

function syncPlayerRow(d: Game): string | null {
  const self = d.roster.find((cape) => cape.id === "you");
  const known = d.stats.fame >= 12 || d.leagueRank > 0;
  if (!known) {
    if (!self) return null;
    d.roster = d.roster.filter((cape) => cape.id !== "you");
    return "Your name slides off the public board.";
  }
  const row: Cape = {
    id: "you",
    name: d.name,
    alias: "You",
    side: d.stats.reputation < -25 ? "villain" : "hero",
    powerId: d.powerId ?? d.secondaryId ?? "intellect",
    powerLevel: d.stats.powerLevel,
    heat: Math.round(d.stats.fame),
    note: d.secondaryId && d.powerId ? fusionTitle(d.powerId, d.secondaryId) : "That's your square.",
    portrait: d.portrait,
    sex: d.sex,
  };
  if (!self) d.roster.unshift(row);
  else Object.assign(self, row);
  return null;
}

function tickRoster(d: Game): string[] {
  if (!d.roster?.length) seedRoster(d);
  const lines: string[] = [];
  for (const cape of d.roster) {
    if (cape.id === "you") continue;
    cape.heat = clamp(cape.heat + rollInt(d, 9) - 4, 1, 99);
    cape.powerLevel = clamp(Math.round((cape.powerLevel + (roll(d) < 0.35 ? 0.1 : -0.05)) * 10) / 10, 0.5, 10);
  }
  if (roll(d) < 0.7) {
    const pool = d.roster.filter((cape) => cape.id !== "you");
    const cape = pool[rollInt(d, pool.length)] ?? d.roster[0];
    if (cape) {
      cape.note = ROSTER_BEATS[rollInt(d, ROSTER_BEATS.length)] ?? cape.note;
      lines.push(`${cape.alias}: ${cape.note}.`);
    }
  }
  if (roll(d) < 0.28) {
    const pool = d.roster.filter((cape) => cape.id !== "you");
    if (pool.length > 4) {
      const gone = pool[rollInt(d, pool.length)];
      if (gone) {
        d.roster = d.roster.filter((cape) => cape.id !== gone.id);
        const neu = makeCape(d);
        d.roster.push(neu);
        lines.push(`${gone.alias} leaves the board. ${neu.alias} takes the square.`);
      }
    }
  }
  const you = syncPlayerRow(d);
  if (you) lines.push(you);
  d.roster.sort((a, b) => b.heat - a.heat);
  trimRoster(d);
  return lines.slice(0, 2);
}

function introduceCape(d: Game, side: "hero" | "villain"): Person {
  const living = d.relationships.filter((r) => r.role === side && r.alive);
  if (living.length >= 4) return living[rollInt(d, living.length)] ?? living[0]!;
  const power = rollPower(roll(d), roll(d), null);
  const alias = aliasFor(d, side);
  const person = addPerson(d, {
    role: side,
    closeness: side === "hero" ? 32 : 14,
    age: Math.max(16, d.age + rollInt(d, 14) - 4),
    note: alias,
    latentPower: power.id,
  });
  if (!d.roster.some((cape) => cape.alias === alias)) {
    d.roster.push({
      id: person.id,
      name: person.name,
      alias,
      side,
      powerId: power.id,
      powerLevel: Math.round((1.4 + roll(d) * 6) * 10) / 10,
      heat: 24 + rollInt(d, 50),
      note: side === "hero" ? "New handshake on the board." : "New problem on the board.",
      portrait: person.portrait ?? 1,
      sex: person.sex,
    });
  }
  trimRoster(d);
  return person;
}

function markArch(d: Game, personId?: string): Person | null {
  let foe =
    d.relationships.find((r) => r.id === personId && r.alive) ??
    d.relationships.find((r) => r.role === "villain" && r.alive && !r.arch) ??
    d.relationships.find((r) => (r.role === "hero" || r.role === "rival") && r.alive && !r.arch);
  if (!foe) foe = introduceCape(d, "villain");
  for (const person of d.relationships) person.arch = false;
  foe.arch = true;
  foe.closeness = clamp(foe.closeness + 8, 0, 100);
  return foe;
}

function discoverPower(d: Game, id: string | null | undefined) {
  if (!id || !getPower(id)) return;
  if (!Array.isArray(d.discovered)) d.discovered = [];
  if (!d.discovered.includes(id)) d.discovered.push(id);
}

function unlockCombo(d: Game, id: string | null | undefined): string {
  if (!id) return "";
  const power = getPower(id);
  if (!power) return "";
  discoverPower(d, id);
  if (!Array.isArray(d.unlockedPowers)) d.unlockedPowers = [];
  if (d.unlockedPowers.includes(id)) return "";
  d.unlockedPowers.push(id);
  if (!d.mastery) d.mastery = {};
  if (d.mastery[id] == null) d.mastery[id] = 0;
  fillLoadout(d);
  return power.name;
}

function ensureProgress(game: Game) {
  if (!game.mastery || typeof game.mastery !== "object") game.mastery = {};
  if (!Array.isArray(game.loadout)) game.loadout = [];
  const sets = Array.isArray(game.moveSets) ? game.moveSets : [];
  game.moveSets = [
    { name: "Set A", moves: sets[0]?.moves ?? [] },
    { name: "Set B", moves: sets[1]?.moves ?? [] },
  ];
  if (!game.story || typeof game.story !== "object") game.story = { active: null, cleared: [], progress: {} };
  if (!Array.isArray(game.story.cleared)) game.story.cleared = [];
  if (!game.story.progress) game.story.progress = {};
  if (game.focusPower === undefined) game.focusPower = null;
  if (!Array.isArray(game.traits)) game.traits = [];
  if (!Array.isArray(game.discovered)) game.discovered = [...(game.unlockedPowers ?? [])];
  if (!game.moveExp || typeof game.moveExp !== "object") game.moveExp = {};
  game.look = resolveLook(game.portrait, game.look);
  game.wardrobe = ensureWardrobe(game.wardrobe);
  if (game.giftId === undefined) game.giftId = legacyComboId(game.powerId) ?? game.unlockedPowers?.[0] ?? null;
  for (const hero of game.heroes ?? []) {
    if (!hero.met) continue;
    for (const power of teachableBases(hero.unlocked, game.unlockedPowers ?? [])) discoverPower(game, power.id);
  }
  for (const id of game.unlockedPowers ?? []) {
    if (game.mastery[id] == null) game.mastery[id] = 0;
  }
  fillLoadout(game);
}

/** The hero's signature power: the chosen focus, else the legacy combo, else the first unlocked. */
export function focusId(d: Game): string {
  if (d.focusPower && (d.unlockedPowers ?? []).includes(d.focusPower)) return d.focusPower;
  return legacyComboId(d.powerId) ?? d.unlockedPowers?.[0] ?? "";
}

function grantMastery(d: Game, powerId: string, raw: number): string {
  const power = getPower(powerId);
  if (!power || !(d.unlockedPowers ?? []).includes(powerId) || raw <= 0) return "";
  if (!d.mastery) d.mastery = {};
  const beforeExp = d.mastery[powerId] ?? 0;
  const before = masteryLevel(beforeExp, power.generation);
  const cap = masteryCap(d.age, power.generation, arcsCleared(d.story));
  const gained = Math.min(raw, masteryRoom(beforeExp, power.generation, cap));
  d.mastery[powerId] = beforeExp + Math.max(0, gained);
  const after = masteryLevel(d.mastery[powerId] ?? 0, power.generation);
  fillLoadout(d);
  if (gained <= 0) return ` ${power.name} is at a soft wall, mastery ${before}/${cap}. Age or a finished case lifts it.`;
  return ` ${power.name} +${gained} drill.${after > before ? ` Mastery ${after}.` : ""}`;
}

function stepPowers(step: ArcStep): string[] {
  if (step.needAny?.length) return step.needAny;
  return step.needPower ? [step.needPower] : [];
}

function heldDrill(d: Game, step: ArcStep): string | null {
  const ids = stepPowers(step);
  if (!ids.length) return d.focusPower && (d.unlockedPowers ?? []).includes(d.focusPower) ? d.focusPower : focusId(d);
  if (d.focusPower && ids.includes(d.focusPower) && (d.unlockedPowers ?? []).includes(d.focusPower)) return d.focusPower;
  return ids.find((id) => (d.unlockedPowers ?? []).includes(id)) ?? null;
}

function drillReady(d: Game, step: ArcStep): boolean {
  const need = step.needMastery ?? 1;
  return stepPowers(step).some((id) => {
    if (!(d.unlockedPowers ?? []).includes(id)) return false;
    const gen = getPower(id)?.generation ?? 0;
    return masteryLevel(d.mastery?.[id] ?? 0, gen) >= need;
  });
}

function finishStep(d: Game): string {
  const current = currentCase(d);
  if (!current || !d.story) return "";
  const target = heldDrill(d, current.step);
  const drilled = current.step.masteryExp && target ? grantMastery(d, target, current.step.masteryExp) : "";
  const next = current.index + 1;
  if (!d.story.progress) d.story.progress = {};
  if (next >= current.arc.steps.length) {
    d.story.cleared = [...(d.story.cleared ?? []).filter((id) => id !== current.arc.id), current.arc.id];
    d.story.active = null;
    delete d.story.progress[current.arc.id];
    return `${drilled} ${current.arc.villain} is done. The case closes, and the ceiling on harder powers lifts.`;
  }
  d.story.progress[current.arc.id] = next;
  const upcoming = current.arc.steps[next];
  return `${drilled} Next: ${upcoming?.title ?? "the rest of it"}.`;
}

function advanceArc(d: Game, _deltas: Delta[]): string {
  return finishStep(d);
}

function grantSecondGift(d: Game, deltas: Delta[]): string {
  if (!d.powerId) {
    const picked = rollPower(roll(d), roll(d), d.powerBias);
    d.powerId = picked.id;
    d.powerless = false;
    unlockCombo(d, legacyComboId(picked.id));
    const before = d.stats.powerLevel;
    d.stats.powerLevel = clamp(Math.max(before, 1.3), 0, powerLevelCap(d.age));
    deltas.push({ stat: "Power", amount: Math.round((d.stats.powerLevel - before) * 100) / 100 });
    return ` A first gift takes the empty seat: ${picked.name}.`;
  }
  let next = rollPower(roll(d), roll(d), null);
  for (let i = 0; i < 6 && (next.id === d.powerId || next.id === d.secondaryId); i++) next = rollPower(roll(d), roll(d), null);
  d.secondaryId = next.id;
  unlockCombo(d, legacyComboId(next.id));
  const before = d.stats.powerLevel;
  d.stats.powerLevel = clamp(Math.round((before + 0.35) * 100) / 100, 0, powerLevelCap(d.age));
  deltas.push({ stat: "Power", amount: Math.round((d.stats.powerLevel - before) * 100) / 100 });
  return ` It braids in. ${fusionTitle(d.powerId, next.id)} — ${next.name} rides shotgun. ${next.tagline}`;
}

function trimRoster(d: Game) {
  const you = d.roster.filter((cape) => cape.id === "you");
  const rest = d.roster.filter((cape) => cape.id !== "you").sort((a, b) => b.heat - a.heat).slice(0, 7);
  d.roster = [...you, ...rest].sort((a, b) => b.heat - a.heat);
}

function personFoe(d: Game, person: Person): { name: string; title: string; side: "hero" | "villain"; powerId: PowerId; powerLevel: number; personId: string } {
  const cape = d.roster.find((row) => row.id === person.id || row.alias === person.note);
  const side = person.role === "hero" ? "hero" : "villain";
  return {
    name: person.note || firstName(person.name),
    title: `${person.name} · ${powerById(person.latentPower ?? null)?.name ?? "a mean trick"}`,
    side,
    powerId: person.latentPower ?? cape?.powerId ?? rollPower(roll(d), roll(d), null).id,
    powerLevel: cape?.powerLevel ?? clamp(2 + d.stats.powerLevel * 0.8, 1.5, 9),
    personId: person.id,
  };
}

function maybeEncounter(d: Game, banners: string[], forced = false): boolean {
  if (d.age < 8) return false;
  const arch = d.relationships.find((r) => r.arch && r.alive);
  if (arch && roll(d) < 0.34) {
    const foe = personFoe(d, arch);
    showChoice(
      d,
      {
        id: "arch-month",
        prompt: `${foe.name} sends a pin and the words "bring the good trick." The group chat is already taking bets.`,
        choices: [
          { id: "fight", label: "Show up" },
          { id: "talk", label: "Try to talk" },
          { id: "skip", label: "Leave them on read" },
        ],
        outcomes: {
          fight: {
            text: "You go. Of course you go.",
            minigame: makeDuel(d, foe, {
              title: foe.name,
              subtitle: "Your arch-enemy. Your unlocked moves. Theirs.",
              win: "You win the month. They will write a worse speech.",
              partial: "You split the block. The clip is inconclusive, which offends everyone.",
              lose: "They get the last line. You get the bruise and the lore.",
              tag: "duel",
              winEffects: { fame: 4, reputation: 2, happiness: 2, powerLevel: 0.12 },
              partialEffects: { fame: 1, health: -4 },
              loseEffects: { health: -8, happiness: -3, fame: 2, reputation: -1 },
            }),
          },
          talk: { text: `You talk ${firstName(arch.name)} down to a future problem. Closeness, unfortunately, increases.`, effects: { happiness: 2, fame: 1, closeness: 6, personId: arch.id } },
          skip: { text: "Silence is a move. They respect it and schedule you anyway.", effects: { happiness: 1, fame: -1 } },
        },
      },
      banners,
    );
    return true;
  }
  const heat = d.stats.fame;
  const knownCity = heat >= 4 || !!d.powerId || d.leagueRank > 0;
  if (d.age >= 10 && knownCity && roll(d) < (forced ? 0.64 : 0.16 + heat / 380)) {
    if (roll(d) < 0.48) {
      const known = d.relationships.filter((r) => r.role === "hero" && r.alive);
      const person = known.length && (known.length >= 4 || roll(d) < 0.7) ? known[rollInt(d, known.length)]! : introduceCape(d, "hero");
      showChoice(
        d,
        {
          id: `hero-${person.id}`,
          prompt: `${person.note} (${firstName(person.name)}) finds you on purpose. "I've seen the month you had," they say. "Want a better one?"`,
          choices: [
            { id: "train", label: "Train together" },
            { id: "coffee", label: "Just coffee" },
            { id: "lesson", label: "Ask for a power" },
            { id: "no", label: "Not today" },
          ],
          outcomes: {
            train: { text: `You and ${person.note} bruise the same hour. It helps.`, effects: { powerLevel: 0.12, happiness: 2, fame: 1, closeness: 8, personId: person.id, karma: 1 } },
            coffee: { text: `${person.note} drinks something awful and tells you who on the board is lying.`, effects: { happiness: 3, smarts: 1, closeness: 6, personId: person.id } },
            lesson: { text: `${person.note} puts a spark in your hand and tells you not to name it until it behaves.`, special: { kind: "grant" }, effects: { closeness: 5, personId: person.id, powerLevel: 0.06 } },
            no: { text: "You duck them. They put a polite question mark in your texts.", effects: { happiness: -1, closeness: -4, personId: person.id } },
          },
        },
        banners,
      );
      return true;
    }
    const known = d.relationships.filter((r) => r.role === "villain" && r.alive && !r.arch);
    const person = known.length && (known.length >= 3 || roll(d) < 0.72) ? known[rollInt(d, known.length)]! : introduceCape(d, "villain");
    const foe = personFoe(d, person);
    showChoice(
      d,
      {
        id: `villain-${person.id}`,
        prompt: `${foe.name} drops onto your week like a correction. "Posters," they say. "Let's edit them."`,
        choices: [
          { id: "fight", label: "Fight" },
          { id: "talk", label: "Hear them out" },
          { id: "arch", label: "Name your arch-enemy" },
          ...(d.crew ? [{ id: "hire", label: `Offer a jacket in ${d.crew.name}` }] : []),
          { id: "run", label: "Leave" },
        ],
        outcomes: {
          fight: {
            text: "You square up. The block picks a side by not picking one.",
            minigame: makeDuel(d, foe, {
              title: foe.name,
              subtitle: "Strike beats trick. Trick beats guard. Guard beats strike.",
              win: "You drop them. They grin like this was research.",
              partial: "You both stay standing. The comments will be unbearable.",
              lose: "You eat pavement and a little of your legend.",
              tag: "duel",
              winEffects: { fame: 3, reputation: 2, happiness: 2, powerLevel: 0.1, karma: 2 },
              partialEffects: { fame: 1, health: -4, closeness: 4, personId: person.id },
              loseEffects: { health: -9, happiness: -3, fame: 1 },
            }),
          },
          talk: { text: `${foe.name} wanted an audience more than a crater. You give them twenty minutes and a no.`, effects: { fame: 2, closeness: 7, personId: person.id, happiness: 1 } },
          arch: { text: `You say it plainly. ${foe.name} looks delighted.`, special: { kind: "arch", personId: person.id }, effects: { fame: 3 } },
          hire: { text: `You offer ${foe.name} a cut and a jacket.`, special: { kind: "draft", personId: person.id }, effects: { karma: -3, fame: 1 } },
          run: { text: "You leave. They let you. That is its own kind of score.", effects: { happiness: -2, reputation: -1, fame: 1 } },
        },
      },
      banners,
    );
    return true;
  }
  if (d.powerId && d.age >= 12 && roll(d) < (forced ? 0.28 : d.secondaryId ? 0.06 : 0.14)) {
    const site = RELIC_SITES[rollInt(d, RELIC_SITES.length)] ?? RELIC_SITES[0]!;
    const guard = makeCape(d, "rogue");
    showChoice(
      d,
      {
        id: "relic-run",
        prompt: `A tip with your name on it: under ${site}, something is handing out second gifts. It does not do refunds.`,
        choices: [
          { id: "go", label: "Go in" },
          { id: "sell", label: "Sell the tip" },
          { id: "no", label: "Leave it" },
        ],
        outcomes: {
          go: {
            text: `${guard.alias} is already there, guarding a door that hums.`,
            minigame: makeDuel(d, { name: guard.alias, title: guard.alias, side: "villain", powerId: guard.powerId, powerLevel: guard.powerLevel }, {
              title: guard.alias,
              subtitle: "Win the door. A second gift is on the other side.",
              win: "The door opens. What comes out agrees to share you.",
              partial: "You get a spark and a cough. The door keeps the rest.",
              lose: "The guardian keeps the souvenir. You keep the limp.",
              tag: "relic",
              winEffects: { fame: 2, happiness: 2 },
              partialEffects: { happiness: -1, health: -3 },
              loseEffects: { health: -8, happiness: -2 },
              specialWin: { kind: "combine" },
            }),
          },
          sell: { text: "A collector pays cash. The hum becomes someone else's commute.", effects: { money: 1400, reputation: -2 } },
          no: { text: "You let the tip expire. Some powers can wait a month.", effects: { happiness: 1 } },
        },
      },
      banners,
    );
    return true;
  }
  return false;
}

/**
 * Fast-forward: advance month by month until the next birthday, stopping early the moment the game
 * needs the player (a choice, a minigame, a chapter card, or death). Cuts the ~960 taps of a long life.
 */
export function skipToBirthday(game: Game): Game {
  let g = ageUp(game);
  let guard = 0;
  while (g.phase === "live" && g.month !== 0 && guard++ < 12) g = ageUp(g);
  return g;
}

export function ageUp(game: Game): Game {
  if (game.phase !== "live") return game;
  const d = structuredClone(game);
  d.month = ((d.month ?? 0) + 1) % 12;
  const birthday = d.month === 0;
  let banners: string[] = [];
  if (birthday) {
    banners = openYear(d);
    if (turnChapter(d)) banners.push(`Chapter ${(d.chapters?.length ?? 1)} begins: ${d.chapters?.[d.chapters.length - 1]?.title ?? "a new decade"}.`);
    if (d.stats.health <= 0) {
      collapse(d, "Your health gives out before the year can even pick a fight.");
      return d;
    }
    let deathChance = 0;
    if (d.age >= 100) deathChance = clamp(0.5 + (d.age - 100) * 0.15, 0, 0.95);
    else if (d.age >= 70) deathChance = (d.age - 68) * 0.013 * (1.4 - d.stats.health / 120);
    else if (d.stats.health < 8 && d.age > 35) deathChance = 0.3;
    if (deathChance > 0 && roll(d) < deathChance) {
      const cause = d.age >= 78 ? "Old age, which does not take meetings." : deadCause(d);
      kill(d, cause, d.age >= 90 ? "You go out between one ordinary afternoon and the next. The city keeps its noise." : "Your body files the last complaint and wins.");
      return d;
    }
    const parent = d.relationships.find((r) => r.role === "parent" && r.alive && r.age > 76 && roll(d) < (r.age - 74) * 0.04);
    if (parent) {
      banners.push(...tickRoster(d));
      parent.alive = false;
      d.stats.happiness = clamp(d.stats.happiness - 6, 0, 100);
      grief(d, parent, banners);
      peaks(d);
      return d;
    }
  } else {
    d.majorsLeft = 3;
    clearMonthFlags(d);
    marketMonth(d);
    if (d.crew) {
      if ((d.crew.heat ?? 0) > 0) d.crew.heat = Math.max(0, (d.crew.heat ?? 0) - 3);
      if (d.crew.members.length) {
        d.crew.loyalty = clamp((d.crew.loyalty ?? 50) - 2, 0, 100);
        if (d.crew.heat >= 70) banners.push(`${d.crew.name} is still too hot. The city is counting jackets.`);
        if (d.crew.loyalty <= 18 && roll(d) < 0.55) {
          const gone = d.crew.members.shift();
          d.crew.loyalty = Math.max(d.crew.loyalty, 28);
          if (gone) banners.push(`${gone.alias} leaves ${d.crew.name}. Loyalty ran out before the month did.`);
        }
      }
    }
  }
  banners.push(...tickRoster(d));
  if (d.phase === "live") monthlyBody(d, banners);
  if (d.phase === "live" && d.stats.health <= 0) {
    collapse(d, "Your legs file a complaint and the floor accepts it.");
    return d;
  }
  if (birthday && tryManifest(d, banners)) {
    peaks(d);
    return d;
  }
  if (maybeEncounter(d, banners)) {
    peaks(d);
    return d;
  }
  if (birthday && offerYearPower(d, banners)) {
    peaks(d);
    return d;
  }
  if (birthday) {
    yearEvent(d, banners);
    peaks(d);
    return d;
  }
  if (roll(d) < 0.46) {
    const event = pickEvent(d, roll(d));
    if (event) {
      coolHeat(d, banners);
      showChoice(d, bakeEvent(d, event), banners);
      peaks(d);
      return d;
    }
  }
  coolHeat(d, banners);
  setStory(d, roll(d) < 0.4 ? sceneLine(d) : (MONTH_QUIET[rollInt(d, MONTH_QUIET.length)] ?? MONTH_QUIET[0]!), [], banners);
  peaks(d);
  return d;
}

function resolveOutcome(d: Game, outcome: Outcome) {
  if (outcome.flags) {
    for (const [key, value] of Object.entries(outcome.flags)) {
      if (key === "missionCredit") d.missions += value;
      else if (key === "dropSchool") d.schoolId = null;
      else if (key === "quitJob") {
        d.jobId = null;
        d.jobRank = 0;
        d.jobYears = 0;
      } else if (key === "disbandCrew") d.crew = null;
      else d.flags[key] = value;
    }
  }
  if (outcome.minigame) {
    d.minigame = vary(d, outcome.minigame);
    d.phase = "mini";
    d.pending = null;
    d.card = { kicker: whenLabel(d.age, d.month), banner: d.card.banner, body: outcome.text, deltas: [] };
    return;
  }
  const deltas: Delta[] = [];
  const before = abilityNames(d);
  applyEffects(d, outcome.effects, deltas);
  const extra = applySpecial(d, outcome.special, deltas);
  const banners: string[] = [];
  noteGrowth(before, d, banners);
  const story = `${outcome.text}${extra}`;
  if (outcome.special?.kind === "death") {
    kill(d, outcome.special.cause, story);
    return;
  }
  if (d.stats.health <= 0) {
    collapse(d, story);
    return;
  }
  setStory(d, story, deltas, banners, outcome.special ? "major" : undefined);
  peaks(d);
}

export function choose(game: Game, choiceId: string): Game {
  if (game.phase !== "choice" || !game.pending) return game;
  const outcome = game.pending.outcomes[choiceId];
  if (!outcome) return game;
  const d = structuredClone(game);
  d.pending = null;
  resolveOutcome(d, outcome);
  return d;
}

export function resolveMini(game: Game, ratio: number, used: readonly string[] = []): Game {
  if (game.phase !== "mini" || !game.minigame) return game;
  const d = structuredClone(game);
  const spec = d.minigame;
  if (!spec) return game;
  d.minigame = null;
  const edge = marketEdge(d, spec.kind);
  const score = clamp(ratio + edge.bonus, 0, 1);
  const win = score >= 0.66;
  const partial = !win && score >= 0.33;
  const deltas: Delta[] = [];
  const before = abilityNames(d);
  applyEffects(d, win ? spec.winEffects : partial ? spec.partialEffects : spec.loseEffects, deltas);
  let archLine = "";
  if (spec.duel?.personId && score >= 0.33) {
    const person = d.relationships.find((r) => r.id === spec.duel?.personId && r.alive);
    if (person) {
      person.closeness = clamp(person.closeness + (win ? 7 : 3), 0, 100);
      if (person.role === "villain" || person.role === "hero") {
        const key = `bouts:${person.id}`;
        d.flags[key] = (d.flags[key] ?? 0) + 1;
        if (person.role === "villain" && d.flags[key] >= 3 && !d.relationships.some((r) => r.arch && r.alive)) {
          markArch(d, person.id);
          archLine = ` ${person.note || firstName(person.name)} is your arch-enemy now. The city will print it that way.`;
        }
      }
    }
  }
  const special = win ? spec.specialWin : partial ? spec.specialPartial : spec.specialLose;
  let extra = applySpecial(d, special, deltas);
  if (spec.kind === "duel") {
    const trained = grantMoveExp(d, used, win ? 8 : 5);
    if (trained.length) extra += ` ${trained.join(". ")}.`;
  }
  if (spec.tag === "tryout" && score >= 0.33) extra += joinLeague(d);
  if (spec.tag === "mission" && score >= 0.33) d.missions += 1;
  const banners: string[] = [];
  noteGrowth(before, d, banners);
  const kit = edge.bonus > 0 ? ` Kit edge +${Math.round(edge.bonus * 100)}%.${edge.notes.length ? ` ${edge.notes.join(" ")}` : ""}` : "";
  const story = `${win ? spec.winText : partial ? spec.partialText : spec.loseText}${extra}${archLine}${kit}`;
  if (special?.kind === "death") {
    kill(d, special.cause, story);
    return d;
  }
  if (d.stats.health <= 0) {
    collapse(d, story);
    return d;
  }
  setStory(d, story, deltas, banners, spec.tag ? "major" : undefined);
  peaks(d);
  return d;
}

function noTime(d: Game, major: boolean): string | undefined {
  if (major && d.majorsLeft <= 0) return "No moves left this month.";
  return undefined;
}

function spend(d: Game) {
  d.majorsLeft = Math.max(0, d.majorsLeft - 1);
}

function relocate(d: Game, cityId: string): string {
  const city = cityById(cityId);
  if (city.id !== cityId || city.id === d.cityId) return " You were already here.";
  const cost = travelCost(d);
  if (d.stats.money < cost || d.majorsLeft <= 0) return " The ticket window laughs.";
  spend(d);
  d.stats.money -= cost;
  d.city = city.name;
  d.cityId = city.id;
  d.flags.moved = 1;
  return "";
}

/**
 * Finalize a minigame as it opens: give it a seed and the hero's element skin, and if it names a verb,
 * draw its kind and title from that verb's pool (see minis.ts) so the same action plays differently.
 */
export function vary(d: Game, spec: MinigameSpec): MinigameSpec {
  const out = { ...spec };
  if (out.seed == null) out.seed = Math.floor(roll(d) * 1_000_000_000);
  const sig = getPower(focusId(d));
  if (!out.skin && sig) out.skin = elementOfPower(sig.id);
  if (out.verb && out.kind !== "duel") {
    const lastIndex = d.flags.lastMini;
    const last = lastIndex != null ? (SKILL_KIND_IDS[lastIndex] ?? null) : null;
    const pick = pickMini(out.verb, () => roll(d), { last, tags: sig?.tags, vars: out.vars, only: out.only });
    out.kind = pick.kind;
    out.title = pick.title;
    out.subtitle = pick.subtitle || out.subtitle;
    if (pick.winText) out.winText = pick.winText;
    if (pick.partialText) out.partialText = pick.partialText;
    if (pick.loseText) out.loseText = pick.loseText;
  }
  if (isSkillKind(out.kind)) d.flags.lastMini = SKILL_KIND_IDS.indexOf(out.kind);
  delete out.verb;
  delete out.vars;
  delete out.only;
  return out;
}

function openMini(d: Game, spec: MinigameSpec, blurb: string) {
  spend(d);
  d.minigame = vary(d, spec);
  d.phase = "mini";
  d.pending = null;
  d.card = { kicker: whenLabel(d.age, d.month), banner: [], body: blurb, deltas: [] };
}

/**
 * Legacy from one mentoring session: each extra rookie in the same year is worth 60% of the last,
 * and a big legacy grows slower still. Stochastic rounding keeps small values meaningful.
 */
export function mentorLegacy(d: Game, good: boolean): number {
  const run = d.flags.mentorRun ?? 0;
  d.flags.mentorRun = run + 1;
  const base = (good ? 3 : 2) * Math.pow(0.6, run) * Math.max(0.2, 1 - (d.legacy ?? 0) / 220);
  return softStep(d, base, 1);
}

function tryoutBlock(d: Game): string | null {
  if (d.leagueRank > 0) return "You're already rostered.";
  if (d.age < 16) return "Tryouts open at 16.";
  if (d.flags.villainContract) return "That other contract is on file.";
  if (d.powerId && d.stats.powerLevel >= 1.4) return null;
  if (!d.powerId && d.age >= 18 && d.stats.smarts >= 75) return null;
  if (!d.powerId) return "No power yet. A fierce mind can try at 18 with smarts 75+.";
  return "They want power level 1.5. Train.";
}

function openSpendChoice(d: Game, pending: Pending) {
  spend(d);
  showChoice(d, pending, []);
}

function powerOffer(hero: AiHero, unlocked: readonly string[], discovered: readonly string[]): string {
  const missing = teachableBases(hero.unlocked, unlocked)[0];
  if (missing) return discovered.includes(missing.id) ? missing.name : "an unshown power";
  const braid = hero.unlocked.map((id) => getPower(id)).find((power) => power && power.generation > 0 && discovered.includes(power.id));
  return braid?.name ?? "a trick you have not been shown";
}

export function freshen(game: Game): Game {
  game.heroes = mergeHeroes(game.heroes);
  migrateChapters(game);
  if (game.crew) {
    if (typeof game.crew.heat !== "number") game.crew.heat = 15;
    if (typeof game.crew.loyalty !== "number") game.crew.loyalty = 55;
    if (!game.crew.motto) game.crew.motto = "No real names.";
  }
  ensureProgress(game);
  return game;
}

function fitAct(d: Game, id: string): Game {
  d.wardrobe = ensureWardrobe(d.wardrobe);
  if (id.startsWith("clear-fit|")) {
    const slot = id.slice(10) as CostumeSlot;
    const current = fitById(d.wardrobe.worn[slot]);
    delete d.wardrobe.worn[slot];
    d.card = { ...d.card, banner: [current ? `${current.name} comes off.` : "That slot was already empty."] };
    return d;
  }
  const item = fitById(id.slice(id.indexOf("|") + 1));
  if (!item) return d;
  if (id.startsWith("buy-fit|") && !d.wardrobe.owned.includes(item.id)) {
    const block = fitBlock(d, item);
    if (block) {
      d.card = { ...d.card, banner: [block] };
      return d;
    }
    d.stats.money = clamp(d.stats.money - item.cost, -20000, 100_000_000);
    d.wardrobe.owned = [...d.wardrobe.owned, item.id];
  } else if (!d.wardrobe.owned.includes(item.id)) {
    d.card = { ...d.card, banner: ["You don't own that yet."] };
    return d;
  }
  d.wardrobe.worn = { ...d.wardrobe.worn, [item.slot]: item.id };
  d.card = { ...d.card, banner: [`${item.name} is on. ${buffLine(item)}`] };
  return d;
}

export function act(game: Game, id: string): Game {
  if (game.phase !== "live") return game;
  const d = structuredClone(game);
  ensureProgress(d);
  if (id.startsWith("equip|")) {
    const note = toggleLoadout(d, id.slice(6));
    d.card = { ...d.card, banner: [note] };
    return d;
  }
  if (id.startsWith("buy-fit|") || id.startsWith("wear-fit|") || id.startsWith("clear-fit|")) {
    return fitAct(d, id);
  }
  if (id.startsWith("focus|")) {
    const powerId = id.slice(6);
    if (!(d.unlockedPowers ?? []).includes(powerId)) return game;
    d.focusPower = powerId;
    const power = getPower(powerId);
    d.card = { ...d.card, banner: [`Drills focus on ${power?.name ?? "that power"}.`] };
    return d;
  }
  if (id.startsWith("set-save|")) {
    const slot = d.moveSets[Number(id.slice(9))];
    if (!slot) return game;
    slot.moves = [...d.loadout];
    d.card = { ...d.card, banner: [`${slot.name} remembers this six.`] };
    return d;
  }
  if (id.startsWith("set-load|")) {
    const slot = d.moveSets[Number(id.slice(9))];
    if (!slot) return game;
    d.loadout = slot.moves.filter((moveId) => {
      const def = moveById(moveId);
      return !!def && (d.unlockedPowers ?? []).includes(def.powerId);
    }).slice(0, 6);
    fillLoadout(d);
    d.card = { ...d.card, banner: [`${slot.name} is what you bring.`] };
    return d;
  }
  if (id.startsWith("buy|") || id.startsWith("sell|")) {
    ensureMarket(d);
    const res = id.startsWith("buy|") ? buyItem(d, id.slice(4)) : sellAsset(d, id.slice(5));
    if (!res.ok) {
      d.card = { ...d.card, banner: [res.line] };
      return d;
    }
    const deltas: Delta[] = [];
    applyEffects(d, res.effects, deltas);
    if (res.heat) {
      const heat = clamp((d.flags.heat ?? 0) + res.heat, 0, 40);
      if (heat > 0) d.flags.heat = heat;
      else delete d.flags.heat;
    }
    if (res.legacy) d.legacy = (d.legacy ?? 0) + res.legacy;
    d.stats.money = clamp(d.stats.money, -20000, 100_000_000);
    d.card = { kicker: whenLabel(d.age, d.month), banner: [res.line], body: d.card.body, deltas };
    if (res.legacy) pushHistory(d, res.line, "major");
    peaks(d);
    return d;
  }
  const power = powerById(d.powerId);

  if (id === "rest") {
    if (d.age < 1 || d.flags.rested) return game;
    d.flags.rested = 1;
    const deltas: Delta[] = [];
    applyEffects(d, { health: 4, happiness: 2 }, deltas);
    setStory(d, "You take the day honestly. No montage. Just sleep and a window.", deltas, []);
    peaks(d);
    return d;
  }

  if (id === "gym") {
    if (d.age < 8 || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "gym",
      prompt: "The gym, the block, or a room that does not advertise its address. How do you spend the body today?",
      choices: [
        { id: "lift", label: "Lift until it counts" },
        { id: "run", label: "Run the city" },
        { id: "bout", label: "Underground bout" },
      ],
      outcomes: {
        lift: { text: "You sweat on purpose. Your body files a thank-you and a complaint.", effects: { health: 4, happiness: 1 } },
        run: { text: "You run until the block knows your pace. A couple of phones come up.", effects: { health: 2, fame: 1, happiness: 2 } },
        bout: {
          text: "No posters. A circle of people who paid to see someone else lose.",
          minigame: {
            kind: "timing",
            verb: "bout",
            title: "Underground bout",
            subtitle: "Three beats. The crowd wants blood or a story.",
            difficulty: 2,
            winText: "You drop them clean. The cash is dirty and the cheer is real.",
            partialText: "You split the bout. The payout is a shrug.",
            loseText: "You eat the mat. The mat was expecting a hero and got a lesson.",
            winEffects: { money: 260, health: -2, karma: -2, fame: 1, happiness: 1 },
            partialEffects: { money: 80, health: -4, karma: -1 },
            loseEffects: { health: -8, happiness: -3, karma: -1 },
          },
        },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "books") {
    if (d.age < 6 || noTime(d, true)) return game;
    const stolen = roll(d) < 0.4;
    openSpendChoice(d, {
      id: "books",
      prompt: "The city is full of pages. Some of them are supposed to be in your hands.",
      choices: [
        { id: "library", label: "The library" },
        { id: "notes", label: "Someone else's notes" },
        { id: "comics", label: "Study the capes" },
      ],
      outcomes: {
        library: { text: "You study until the words get sharp. Dinner gets cold. Worth it, barely.", effects: { smarts: 3, happiness: -1, karma: 1 } },
        notes: stolen
          ? { text: "The notes are half a trick and half a confession. You keep both.", special: { kind: "grant" }, effects: { smarts: 2, karma: -4, happiness: 1 } }
          : { text: "The notes are grocery math and a grudge. You are smarter and slightly worse.", effects: { smarts: 2, karma: -3 } },
        comics: { text: "You study who the city loves and who it is willing to forget. Useful, and a little sad.", effects: { smarts: 1, fame: 1, happiness: 2 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "out") {
    if (d.age < 13 || noTime(d, true)) return game;
    const cost = 25 + d.age * 3;
    if (d.stats.money < cost) return game;
    openSpendChoice(d, {
      id: "out",
      prompt: "The night is open. So is your wallet, if you let it be.",
      choices: [
        { id: "club", label: "Somewhere loud" },
        { id: "quiet", label: "Somewhere with art" },
        { id: "block", label: "The bad block" },
      ],
      outcomes: {
        club: { text: "You go out. The night is loud, the fries are perfect, and nobody needs a rescue.", effects: { money: -cost, happiness: 6, fame: d.stats.looks > 65 ? 2 : 0, karma: 0 } },
        quiet: { text: "You stand in front of something made on purpose. It improves you without asking.", effects: { money: -Math.round(cost / 2), happiness: 3, smarts: 2, karma: 1 } },
        block: { text: "You spend the night where the bar goes to practice. You come back with a story and a stain.", effects: { money: -Math.round(cost / 3), happiness: 2, fame: 1, karma: -4 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "volunteer") {
    if (d.age < 10 || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "volunteer",
      prompt: "Helping is a pile of different jobs. The bar can tell which one you meant.",
      choices: [
        { id: "shelter", label: "Night shelter" },
        { id: "tutor", label: "Tutor a kid" },
        { id: "block", label: "Clean the block" },
        { id: "camera", label: "Do it where the cameras are" },
      ],
      outcomes: {
        shelter: { text: "You ladle, you listen, you leave later than you planned. A stranger remembers your name anyway.", effects: { karma: 7, reputation: 2, happiness: 3 } },
        tutor: { text: "You explain one hard thing until it isn't. They explain a harder thing about you back.", effects: { karma: 5, smarts: 2, happiness: 2 } },
        block: { text: "Bags, gloves, a needle you are careful with. The street looks like it had a parent.", effects: { karma: 4, reputation: 3, health: -1, happiness: 2 } },
        camera: { text: "You help, and you let it be seen. The good is real. So is the framing.", effects: { karma: 2, fame: 3, reputation: 2, happiness: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "scheme") {
    if (d.age < 14 || noTime(d, true)) return game;
    const haul = Math.round((380 + roll(d) * 1700 + d.stats.smarts * 9) / 3);
    const caught = roll(d) < 0.22;
    openSpendChoice(d, {
      id: "scheme",
      prompt: "Gray money has a menu. None of the items are called crime. All of them are.",
      choices: [
        { id: "skim", label: "Skim a sloppy account" },
        { id: "rumor", label: "Sell a rumor" },
        { id: "charity", label: "Shave a charity" },
        { id: "back", label: "Put the pen down" },
      ],
      outcomes: {
        skim: caught
          ? { text: "The account was sloppy until it wasn't. You leave pride on the floor and a little cash in the lining.", effects: { money: Math.round(haul * 0.25), reputation: -8, happiness: -4, health: -3, karma: -10 }, flags: { heat: (d.flags.heat ?? 0) + 2 } }
          : { text: "You skim a gray opportunity. The cash is real. So is the aftertaste.", effects: { money: haul, reputation: -5, happiness: 1, karma: -7 }, flags: { heat: (d.flags.heat ?? 0) + 1 } },
        rumor: { text: "You sell a story that is mostly true. The buyer is delighted. Someone else's week gets worse.", effects: { money: 240 + Math.round(haul / 4), fame: 2, reputation: -3, karma: -5 } },
        charity: caught
          ? { text: "The charity notices. You are briefly famous in the worst group chat.", effects: { money: 100, reputation: -12, happiness: -5, karma: -14, fame: 1 } }
          : { text: "You shave a kindness and call it a fee. The number in the account does not forgive you.", effects: { money: haul + 400, reputation: -8, karma: -12, happiness: -1 } },
        back: { text: "You put the pen down. The afternoon is gone. The bar, barely, is not.", effects: { karma: 1, happiness: -1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "train") {
    if (d.age < 7 || noTime(d, true)) return game;
    const powerId = focusId(d);
    const trained = getPower(powerId);
    if (!trained) return game;
    const level = masteryLevel(d.mastery?.[powerId] ?? 0, trained.generation);
    const cap = masteryCap(d.age, trained.generation, arcsCleared(d.story));
    const cost = trainCost(level, trained.generation);
    if (masteryRoom(d.mastery?.[powerId] ?? 0, trained.generation, cap) <= 0) {
      setStory(d, `${trained.name} is at a soft wall, mastery ${level}/${cap}. Grow up, or finish a case. More reps will not sneak past it.`, [], []);
      return d;
    }
    if (d.stats.health < 12) {
      setStory(d, "You are too gassed to drill. Rest, or the rep will be a nap.", [], []);
      return d;
    }
    if (d.stats.money < cost.money) {
      setStory(d, `The drill wants ${money(cost.money)} once a power gets this stubborn.`, [], []);
      return d;
    }
    d.stats.health = clamp(d.stats.health - cost.health, 0, 100);
    d.stats.money -= cost.money;
    const exp = trainExp({ level, generation: trained.generation, age: d.age, withHero: false, story: false, bond: 0 });
    openMini(
      d,
      {
        kind: "timing",
        verb: "drill",
        vars: { power: trained.name, level: String(level), cap: String(cap) },
        title: `Drill ${trained.name}`,
        subtitle: `Mastery ${level}/${cap}. Small gains. The wall is real.`,
        difficulty: clamp(level, 1, 3),
        winText: "The rep lands. It is a small landing.",
        partialText: "Sloppy form. A little of it sticks.",
        loseText: "You miss. The miss still cost you the afternoon.",
        winEffects: { powerLevel: 0.03, happiness: 1 },
        partialEffects: { powerLevel: 0.01 },
        loseEffects: { happiness: -1 },
        specialWin: { kind: "mastery", powerId, exp },
        specialPartial: { kind: "mastery", powerId, exp: Math.max(2, Math.round(exp * 0.45)) },
        specialLose: { kind: "mastery", powerId, exp: 2 },
      },
      `You drill ${trained.name}. It costs ${cost.health} health${cost.money ? ` and ${money(cost.money)}` : ""}. Generation ${trained.generation} does not skip steps.`,
    );
    return d;
  }

  if (id === "stunt") {
    if (!power || d.age < 10 || noTime(d, true)) return game;
    openMini(
      d,
      {
        kind: "timing",
        verb: "stunt",
        title: "Public stunt",
        subtitle: "Stick it. The phones are already up.",
        difficulty: d.stats.powerLevel > 6 ? 2 : 3,
        winText: "You stick it. The block applauds like it paid for tickets.",
        partialText: "You land, mostly. A awning does not.",
        loseText: "You eat pavement and a little of your legend.",
        winEffects: { fame: 3, reputation: 1, happiness: 2 },
        partialEffects: { fame: 1, happiness: -1, health: -3 },
        loseEffects: { fame: -1, happiness: -3, health: -6, reputation: -1 },
      },
      "You decide the street could use a show. This is how legends and lawsuits start.",
    );
    return d;
  }

  if (id === "confide") {
    if (!power || d.age < 7 || noTime(d, true) || d.stats.parentBelief >= 96) return game;
    const folks = d.relationships.some((person) => person.role === "parent" && person.alive);
    if (!folks) {
      setStory(d, "There is nobody in the kitchen. You say it anyway, to the room, and the room does not get kinder.", [], []);
      return d;
    }
    spend(d);
    const gain = d.upbringing === "skeptical" ? 6 : d.upbringing === "supportive" || d.upbringing === "normal" ? 10 : 8;
    const deltas: Delta[] = [];
    applyEffects(d, { parentBelief: gain, happiness: 3 }, deltas);
    if (d.flags.hidden) delete d.flags.hidden;
    const house = d.relationships.find((person) => person.role === "parent" && person.alive);
    const who = house?.note === "Foster home" ? "Your guardian stays in the kitchen anyway." : "They don't understand all of it. They stay in the kitchen anyway.";
    setStory(d, `You stop editing the story. ${who}`, deltas, []);
    peaks(d);
    return d;
  }

  if (id === "reveal") {
    if (!d.flags.hidden) return game;
    delete d.flags.hidden;
    const deltas: Delta[] = [];
    applyEffects(d, { parentBelief: 10, happiness: 3, fame: 1 }, deltas);
    setStory(d, "You come clean. The secret loses its teeth. Dinner tastes better.", deltas, []);
    peaks(d);
    return d;
  }

  if (id === "spark") {
    if (d.powerId || d.powerless || d.age < 16 || d.age > 24 || noTime(d, true)) return game;
    spend(d);
    if (roll(d) < 0.2) {
      awaken(d, ["You refuse to let the year be ordinary."], "push");
      peaks(d);
      return d;
    }
    const deltas: Delta[] = [];
    applyEffects(d, { happiness: -2 }, deltas);
    setStory(d, "You strain toward a spark. A lightbulb pops. That's the whole show.", deltas, []);
    peaks(d);
    return d;
  }

  if (id === "class") {
    const school = schoolById(d.schoolId);
    if (!school || noTime(d, true)) return game;
    spend(d);
    const deltas: Delta[] = [];
    applyEffects(d, { smarts: 3 + school.tier, happiness: -1 }, deltas);
    setStory(d, `You actually attend class at ${school.name}. Notes are taken. Ego is lightly bruised.`, deltas, []);
    peaks(d);
    return d;
  }

  if (id === "spar") {
    const school = schoolById(d.schoolId);
    if (!school || !power || noTime(d, true)) return game;
    const gain = Math.round((0.3 + school.tier * 0.06) * 100) / 100;
    openMini(
      d,
      {
        kind: "timing",
        verb: "spar",
        title: "Campus spar",
        subtitle: "Coach is watching. So is the kid who wants your spot.",
        difficulty: clamp(school.tier, 1, 3),
        winText: "You tag them clean. Coach writes something that might be praise.",
        partialText: "You split the drill. Nobody is embarrassed, which is rare.",
        loseText: "You eat mat. The mat has been expecting you.",
        winEffects: { powerLevel: gain, happiness: 2, fame: 1 },
        partialEffects: { powerLevel: Math.round(gain * 0.4 * 100) / 100 },
        loseEffects: { happiness: -3, health: -5 },
      },
      `Sparring at ${school.name}. ${school.blurb}`,
    );
    return d;
  }

  if (id === "drop") {
    if (!d.schoolId) return game;
    const school = schoolById(d.schoolId);
    showChoice(
      d,
      {
        id: "drop",
        prompt: `Leave ${school?.name ?? "school"}? The year doesn't come back.`,
        choices: [
          { id: "stay", label: "Stay" },
          { id: "leave", label: "Drop out" },
        ],
        outcomes: {
          stay: { text: "You keep the seat. The work remains." },
          leave: { text: "You walk. The quad looks smaller from the gate.", flags: { dropSchool: 1 }, effects: { happiness: 2, smarts: -1 } },
        },
      },
      [],
    );
    return d;
  }

  if (id.startsWith("school:")) {
    const school = schoolById(id.slice(7));
    if (!school || schoolBlock(d, school) || noTime(d, true)) return game;
    spend(d);
    d.schoolId = school.id;
    d.schoolYears = 0;
    maybeRival(d, school.tier);
    const proved = d.stats.parentBelief < beliefNeed(d, school);
    setStory(
      d,
      proved
        ? `You prove it on the lawn until they stop asking for a signature. Welcome to ${school.name}.`
        : `You're in at ${school.name}. ${school.blurb}`,
      [],
      [],
      "major",
    );
    peaks(d);
    return d;
  }

  if (id === "shift") {
    const job = jobById(d.jobId);
    if (!job || d.flags.shifted || noTime(d, true)) return game;
    spend(d);
    d.flags.shifted = 1;
    const bonus = Math.round(job.pay * 0.08 * ([1, 1.1, 1.2, 1.35, 1.5][d.jobRank] ?? 1));
    const deltas: Delta[] = [];
    applyEffects(d, { money: bonus, happiness: -1 }, deltas);
    setStory(d, `You work a heavy shift at ${job.name}. The money is immediate. So is the back.`, deltas, []);
    peaks(d);
    return d;
  }

  if (id === "promote") {
    const job = jobById(d.jobId);
    if (!job || noTime(d, true)) return game;
    spend(d);
    const needYears = 2 * (d.jobRank + 1);
    const good = d.stats.smarts >= 42 || d.stats.powerLevel >= 2.5 || d.stats.happiness >= 55;
    if (d.jobRank >= 4) {
      setStory(d, "There is no title left except 'legend of the break room,' and it does not pay.", [], []);
    } else if (d.jobYears < needYears || !good) {
      setStory(d, "You ask. They smile the smile that means not this year. You smile the other one.", [{ stat: "Happiness", amount: -1 }], []);
      d.stats.happiness = clamp(d.stats.happiness - 1, 0, 100);
    } else {
      d.jobRank += 1;
      const deltas: Delta[] = [];
      applyEffects(d, { happiness: 4, fame: 1 }, deltas);
      setStory(d, `Promotion. You are now ${JOB_TITLES[d.jobRank]} at ${job.name}. The mug gets a new slogan.`, deltas, [], "major");
    }
    peaks(d);
    return d;
  }

  if (id === "quit") {
    const job = jobById(d.jobId);
    if (!job) return game;
    showChoice(
      d,
      {
        id: "quit",
        prompt: `Walk out of ${job.name}? Rent will notice.`,
        choices: [
          { id: "stay", label: "Keep the job" },
          { id: "walk", label: "Quit" },
        ],
        outcomes: {
          stay: { text: "You clock back in. The dream can wait a paycheck." },
          walk: { text: "You quit. The door is heavier than your speech.", flags: { quitJob: 1 }, effects: { happiness: 3 } },
        },
      },
      [],
    );
    return d;
  }

  if (id.startsWith("job:")) {
    const job = jobById(id.slice(4));
    if (!job || jobBlock(d, job) || noTime(d, true)) return game;
    spend(d);
    d.jobId = job.id;
    d.jobRank = 0;
    d.jobYears = 0;
    setStory(d, `Hired at ${job.name}. ${job.blurb}`, [], [], "major");
    peaks(d);
    return d;
  }

  if (id === "tryout") {
    if (tryoutBlock(d) || noTime(d, true)) return game;
    openMini(
      d,
      {
        kind: d.powerId ? "timing" : "pattern",
        verb: "tryout",
        only: d.powerId ? undefined : ["pattern", "press", "rescue"],
        title: "League tryout",
        subtitle: d.powerId ? "Show them the gift, not the nerves." : "No powers. Show them the plan.",
        difficulty: 2,
        tag: "tryout",
        winText: "The evaluator's clipboard pauses. That's the sound of a yes.",
        partialText: "You scrape through. They call it 'potential' so they can stay cool.",
        loseText: "They write 'enthusiastic' and mean it as an insult.",
        winEffects: { fame: 6, reputation: 4, happiness: 4 },
        partialEffects: { fame: 2, reputation: 1, happiness: 1 },
        loseEffects: { happiness: -5, reputation: -1 },
      },
      "League tryouts. A gym that smells like rubber and ambition.",
    );
    return d;
  }

  if (id === "mission") {
    if (d.leagueRank < 1 || noTime(d, true)) return game;
    const team = teamById(d.teamId);
    const syn = !!(team && d.powerId && team.prefers.includes(d.powerId));
    if (roll(d) < 0.45) {
      openMini(
        d,
        {
          kind: "timing",
          verb: "dispatch",
          title: "Dispatch",
          subtitle: syn ? `${team?.name ?? "Your team"} moves like you practiced this.` : "You are slightly out of position. Improvise.",
          difficulty: clamp(2 + Math.floor(d.leagueRank / 2), 2, 3),
          tag: "mission",
          winText: syn ? "Clean work. The debrief is mostly snacks." : "You pull it off ugly. Ugly still counts.",
          partialText: "The threat stops. A hydrant files a dissent.",
          loseText: "You get clear. The report uses the word 'learning.'",
          winEffects: { fame: syn ? 7 : 5, reputation: 5, happiness: 3, money: 900, powerLevel: 0.18, karma: 4 },
          partialEffects: { fame: 2, reputation: 2, health: -5, money: 300, karma: 1 },
          loseEffects: { health: -12, reputation: -3, happiness: -4, fame: -1, karma: -2 },
        },
        "Dispatch drops a pin on something with too many teeth.",
      );
      return d;
    }
    spend(d);
    const clever = d.stats.smarts >= 52 || d.powerId === "intellect" || d.powerId === "invisibility" || d.powerId === "shapeshift" || d.powerId === "mind";
    showChoice(
      d,
      {
        id: "mission",
        prompt: "A call comes in. Civilians, a timer, and a captain who says 'your show' like that isn't terrifying.",
        choices: [
          { id: "loud", label: "Go loud" },
          { id: "smart", label: "Go quiet and clever" },
          { id: "backup", label: "Stall for backup" },
        ],
        outcomes: {
          loud: {
            text: "You announce yourself. Subtlety leaves the chat.",
            minigame: {
              kind: "timing",
              verb: "loud",
              title: "Go loud",
              subtitle: "Three beats. Don't miss the one that matters.",
              difficulty: 3,
              tag: "mission",
              winText: "Loud works. The clip is messy and heroic.",
              partialText: "You win and break a window that will be in the budget meeting.",
              loseText: "Loud was a choice. The rubble agrees too much.",
              winEffects: { fame: 8, reputation: 4, happiness: 2, powerLevel: 0.2 },
              partialEffects: { fame: 3, reputation: 1, health: -6 },
              loseEffects: { health: -14, reputation: -4, happiness: -4, fame: 1 },
            },
          },
          smart: clever
            ? { text: "You take the long way and the right door. Nobody gets a trailer. Everybody gets to go home.", effects: { reputation: 6, fame: 2, happiness: 3, powerLevel: 0.12 }, flags: { missionCredit: 1 } }
            : { text: "You attempt clever. Clever is out. You are slightly on fire, socially.", effects: { happiness: -2, health: -4, reputation: -1 } },
          backup: { text: "Backup arrives cranky and effective. You get a nod, not a headline.", effects: { reputation: 2, happiness: 1 }, flags: { missionCredit: 1 } },
        },
      },
      [],
    );
    return d;
  }

  if (id.startsWith("team:")) {
    const team = teamById(id.slice(5));
    if (!team || d.leagueRank < 2 || team.id === d.teamId || teamBlock(d, team) || noTime(d, true)) return game;
    if (d.flags.transferYear && d.age - d.flags.transferYear < 2) return game;
    spend(d);
    d.teamId = team.id;
    d.flags.transferYear = d.age;
    setStory(d, `Transfer approved. ${team.name} — ${team.blurb}`, [], [], "major");
    peaks(d);
    return d;
  }

  if (id.startsWith("time:")) {
    const person = d.relationships.find((r) => r.id === id.slice(5) && r.alive);
    if (!person || d.flags[`time:${person.id}`]) return game;
    d.flags[`time:${person.id}`] = 1;
    const deltas: Delta[] = [];
    const fx: Effects = { happiness: 2, closeness: person.role === "rival" ? 6 : 5, personId: person.id };
    if (person.role === "parent") fx.parentBelief = 2;
    applyEffects(d, fx, deltas);
    const line =
      person.role === "rival"
        ? `You and ${firstName(person.name)} insult each other's form and both get better. Disgusting.`
        : person.role === "child"
          ? `You spend the day with ${firstName(person.name)}. It is sticky and perfect.`
          : `You make time for ${firstName(person.name)}. The year gets a softer edge.`;
    setStory(d, line, deltas, []);
    peaks(d);
    return d;
  }

  if (id.startsWith("gift:")) {
    const person = d.relationships.find((r) => r.id === id.slice(5) && r.alive);
    const cost = 40 + d.age * 6;
    if (!person || d.flags[`gift:${person.id}`] || d.stats.money < cost) return game;
    d.flags[`gift:${person.id}`] = 1;
    const deltas: Delta[] = [];
    const fx: Effects = { money: -cost, happiness: 2, closeness: 8, personId: person.id };
    if (person.role === "parent") fx.parentBelief = 3;
    applyEffects(d, fx, deltas);
    setStory(d, `You get ${firstName(person.name)} something they didn't ask for. They pretend to be cool about it. They fail.`, deltas, []);
    peaks(d);
    return d;
  }

  if (id === "befriend") {
    if (d.age < 6 || noTime(d, true)) return game;
    if (d.relationships.filter((r) => r.role === "friend" && r.alive).length >= 5) return game;
    spend(d);
    const chance = 0.38 + d.stats.happiness / 260 + d.stats.smarts / 420;
    if (roll(d) < chance) {
      const pal = addPerson(d, { role: "friend", closeness: 42, age: Math.max(6, d.age + rollInt(d, 6) - 2), note: "New." });
      setStory(d, `You click with ${pal.name}. It is suspiciously easy, which makes you suspicious, then happy.`, [], [], "major");
    } else {
      const deltas: Delta[] = [];
      applyEffects(d, { happiness: -2 }, deltas);
      setStory(d, "The conversation dies near the snacks. You both pretend to see someone else.", deltas, []);
    }
    peaks(d);
    return d;
  }

  if (id === "date") {
    if (d.age < 16 || noTime(d, true) || d.relationships.some((r) => r.role === "partner" && r.alive)) return game;
    spend(d);
    const chance = 0.3 + d.stats.looks / 190 + d.stats.happiness / 320;
    if (roll(d) < chance) {
      const pal = addPerson(d, { role: "partner", closeness: 44, age: Math.max(16, d.age + rollInt(d, 8) - 3), note: "Dating." });
      const deltas: Delta[] = [];
      applyEffects(d, { happiness: 6 }, deltas);
      setStory(d, `The date with ${firstName(pal.name)} survives dessert. You walk slower than necessary.`, deltas, [], "major");
    } else {
      const deltas: Delta[] = [];
      applyEffects(d, { happiness: -2, money: -30 }, deltas);
      setStory(d, "The date is a hostage situation with breadsticks. You split the check and the embarrassment.", deltas, []);
    }
    peaks(d);
    return d;
  }

  if (id === "propose") {
    const person = d.relationships.find((r) => r.role === "partner" && r.alive);
    const cost = 700;
    if (!person || person.closeness < 72 || d.flags.married || d.stats.money < cost || d.age < 18 || noTime(d, true)) return game;
    spend(d);
    d.flags.married = 1;
    const deltas: Delta[] = [];
    applyEffects(d, { money: -cost, happiness: 10, fame: d.stats.fame > 25 ? 3 : 1, closeness: 12, personId: person.id }, deltas);
    setStory(d, `You ask ${firstName(person.name)}. They say yes like they practiced being surprised. You believe them anyway.`, deltas, [], "major");
    peaks(d);
    return d;
  }

  if (id === "baby") {
    const person = d.relationships.find((r) => r.role === "partner" && r.alive);
    const kids = d.relationships.filter((r) => r.role === "child").length;
    if (!person || d.age < 21 || kids >= 3 || noTime(d, true)) return game;
    if (person.closeness < 65 && !d.flags.married) return game;
    spend(d);
    const deltas: Delta[] = [];
    applyEffects(d, { happiness: 8, money: -1600, fame: d.stats.fame > 30 ? 3 : 0, closeness: 6, personId: person.id }, deltas);
    const extra = haveChild(d);
    setStory(d, `You start a family with ${firstName(person.name)}.${extra}`, deltas, [], "major");
    peaks(d);
    return d;
  }

  if (id === "patrol") {
    if (d.age < 8 || noTime(d, true) || d.flags.patrolled) return game;
    spend(d);
    d.flags.patrolled = 1;
    if (roll(d) < 0.5 && maybeEncounter(d, [], true)) {
      peaks(d);
      return d;
    }
    showChoice(d, {
      id: "patrol-street",
      prompt: "The city is behaving just enough to make you choose a block.",
      choices: [
        { id: "bright", label: "The bright streets" },
        { id: "bad", label: "The bad blocks" },
        { id: "teacher", label: "Look for a teacher" },
        { id: "home", label: "Call it quiet" },
      ],
      outcomes: {
        bright: { text: "You walk where the lights work. A lost bag finds its person. Nobody writes a song.", effects: { karma: 4, reputation: 2, happiness: 2 } },
        bad: { text: "You walk where the lights gave up. Someone pays you to be somewhere else. You take it.", effects: { karma: -5, money: 180, fame: 1, reputation: -1 } },
        teacher: (d.heroes ?? []).some((hero) => !hero.met)
          ? { text: "You follow a rumor instead of a siren.", special: { kind: "meetHero" }, effects: { happiness: 2, karma: 1 } }
          : { text: "Every teacher you know is busy. A stranger still leaves you a page.", special: { kind: "grant" }, effects: { smarts: 1 } },
        home: { text: "You patrol. The city behaves, which is suspicious, and nobody approaches with a theme song.", effects: { karma: 2, reputation: 1 } },
      },
    }, []);
    peaks(d);
    return d;
  }

  if (id === "brawl") {
    if (d.age < 10 || noTime(d, true)) return game;
    const arch = d.relationships.find((r) => r.arch && r.alive);
    const known = d.relationships.filter((r) => (r.role === "villain" || r.role === "hero") && r.alive);
    const person = arch ?? (known.length ? known[rollInt(d, known.length)] : null);
    const cape = d.roster.find((row) => row.id !== "you" && row.side !== "rogue");
    const foe = person
      ? personFoe(d, person)
      : cape
        ? { name: cape.alias, title: cape.alias, side: cape.side === "hero" ? "hero" as const : "villain" as const, powerId: cape.powerId, powerLevel: cape.powerLevel }
        : null;
    if (!foe) return game;
    openMini(
      d,
      makeDuel(d, foe, {
        title: foe.name,
        subtitle: "Your moves against theirs. Strike beats trick, trick beats guard, guard beats strike.",
        win: `You put ${foe.name} on the pavement. They will remember the order of your tricks.`,
        partial: "You trade enough hits to call it a lesson.",
        lose: `${foe.name} writes the ending. You fund the ice pack.`,
        tag: "duel",
        winEffects: { fame: 3, reputation: foe.side === "villain" ? 2 : -1, happiness: 2, powerLevel: 0.1 },
        partialEffects: { fame: 1, health: -4 },
        loseEffects: { health: -8, happiness: -3, fame: 1 },
      }),
      `You pick a fight with ${foe.name}. The block clears a circle like it has done this before.`,
    );
    return d;
  }

  if (id.startsWith("mix|")) {
    const [, left, right] = id.split("|");
    if (!left || !right || noTime(d, true)) return game;
    const attempt = mix(left, right, d.unlockedPowers ?? []);
    if (!attempt.ok) return game;
    spend(d);
    const name = unlockCombo(d, attempt.power.id);
    const deltas: Delta[] = [];
    applyEffects(d, { powerLevel: attempt.power.generation === 0 ? 0.04 : attempt.power.generation === 2 ? 0.1 : 0.06, fame: 1, happiness: 2 }, deltas);
    if (!d.powerId && d.age >= 8) {
      const legacy = legacyFromCombo(left) ?? legacyFromCombo(attempt.power.id);
      if (legacy) {
        d.powerId = legacy;
        d.powerless = false;
        d.stats.powerLevel = Math.max(d.stats.powerLevel, 1.3);
      }
    }
    setStory(
      d,
      `${name || attempt.power.name}. ${attempt.power.tierName} tier, generation ${attempt.power.generation}. ${attempt.power.description} A basic still hits softer than this.`,
      deltas,
      [`Braid: ${attempt.power.name}`],
      "major",
    );
    peaks(d);
    return d;
  }

  if (id === "seek-hero") {
    if (d.age < 10 || noTime(d, true)) return game;
    const unlocked = d.unlockedPowers ?? [];
    const home = new Set(dossier(d.cityId).heroes);
    const unmet = (d.heroes ?? [])
      .filter((item) => !item.met)
      .sort((a, b) => {
        const local = Number(home.has(b.id)) - Number(home.has(a.id));
        if (local) return local;
        return teachableBases(b.unlocked, unlocked).length - teachableBases(a.unlocked, unlocked).length;
      })
      .slice(0, 4);
    if (!unmet.length) return game;
    const choices = unmet.map((hero) => ({ id: hero.id, label: `${hero.alias} · ${powerOffer(hero, unlocked, d.discovered ?? [])}` }));
    const outcomes: Record<string, Outcome> = {};
    for (const hero of unmet) {
      outcomes[hero.id] = {
        text: `${hero.alias} lets you find them. ${hero.personality.split(".")[0]}.`,
        special: { kind: "meetHero", heroId: hero.id },
        effects: { happiness: 2 },
      };
    }
    openSpendChoice(d, {
      id: "seek-hero",
      prompt: `In ${d.city}, the trainers who know these streets come up first. Who do you look for?`,
      choices,
      outcomes,
    });
    peaks(d);
    return d;
  }

  if (id === "doctor") {
    if (d.age < 10 || noTime(d, true)) return game;
    const cost = 80 + d.age * 4;
    if (d.stats.money < cost) return game;
    spend(d);
    const deltas: Delta[] = [];
    applyEffects(d, { money: -cost, health: 12, happiness: 1 }, deltas);
    setStory(d, "A doctor pokes the parts of you that complain. You leave with a bill and fewer complaints.", deltas, []);
    peaks(d);
    return d;
  }

  if (id === "hobby") {
    if (d.age < 8 || d.flags.hobby || noTime(d, true)) return game;
    d.flags.hobby = 1;
    openSpendChoice(d, {
      id: "hobby",
      prompt: "Pick something that is not punching. It still counts as a life.",
      choices: [
        { id: "music", label: "Learn a song badly" },
        { id: "cook", label: "Cook for someone" },
        { id: "draw", label: "Draw the skyline" },
        { id: "journal", label: "Keep a cape journal" },
      ],
      outcomes: {
        music: { text: "You learn a song badly and love it. The neighbors file a mixed review.", effects: { happiness: 5, smarts: 1 } },
        cook: { text: "You feed someone who did not ask. They ask next time. That is the whole trick.", effects: { happiness: 4, karma: 2, reputation: 1 } },
        draw: { text: "A sketchbook, a bad drawing of the skyline, and a better mood.", effects: { happiness: 4, smarts: 1, looks: 1 } },
        journal: { text: "You write down who you hit and why. The page is either a conscience or a brand.", effects: { smarts: 2, karma: d.stats.karma < 0 ? -1 : 2, happiness: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "laylow") {
    if (d.age < 13 || noTime(d, true)) return game;
    spend(d);
    const deltas: Delta[] = [];
    applyEffects(d, { fame: -4, happiness: 2, karma: 1, reputation: 1 }, deltas);
    setStory(d, "You disappear on purpose. The city uses the quiet to talk about someone else.", deltas, []);
    peaks(d);
    return d;
  }

  if (id === "pocket") {
    if (d.age < 12 || noTime(d, true)) return game;
    const bench = roll(d) < 0.28;
    const shop = roll(d) < 0.3;
    openSpendChoice(d, {
      id: "pocket",
      prompt: "Something unattended is having a worse day than you. You can make that official.",
      choices: [
        { id: "bench", label: "A wallet on a bench" },
        { id: "shop", label: "A shop that trusts people" },
        { id: "bag", label: "A cape's unattended bag" },
        { id: "back", label: "Put it back" },
      ],
      outcomes: {
        bench: bench
          ? { text: "The wallet's owner turns around. The look costs more than the cash.", effects: { karma: -8, reputation: -6, happiness: -3, money: 30 } }
          : { text: "You pocket a wallet that had a person attached. The cash is light. You are not.", effects: { karma: -5, money: 160 + rollInt(d, 180), happiness: 1, reputation: -2 } },
        shop: shop
          ? { text: "A hand closes on your wrist between the gum and the moral. You drop both.", effects: { karma: -7, reputation: -5, happiness: -3, fame: 1 } }
          : { text: "Five-finger discount, no audience. You eat like a person who got away with it.", effects: { karma: -4, money: 90, happiness: 2 } },
        bag: { text: "The bag belongs to someone with a brand. Inside: cash, a note, and a spark that does not want to stay theirs.", special: { kind: "grant" }, effects: { karma: -8, fame: 2, money: 200, reputation: -3 } },
        back: { text: "You put it back. Nobody claps. The bar moves anyway.", effects: { karma: 3, happiness: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "crime") {
    if (d.age < 14 || noTime(d, true)) return game;
    const crewHelp = d.crew ? 0.12 : 0;
    const corner = roll(d) < 0.3 - crewHelp;
    const van = roll(d) < 0.34 - crewHelp;
    openSpendChoice(d, {
      id: "crime",
      prompt: d.crew ? `${d.crew.name} can make this cleaner. It will not make it kinder. Pick the job.` : "You can cross the line alone. Pick how loud.",
      choices: [
        { id: "corner", label: "Corner store" },
        { id: "van", label: "Payroll van" },
        { id: "museum", label: "Lift a spark, not cash" },
        { id: "walk", label: "Walk off" },
      ],
      outcomes: {
        corner: corner
          ? { text: "The clerk has a bat and a story they will tell forever. You get the limp.", effects: { karma: -8, reputation: -6, health: -6, happiness: -3, money: 80, fame: 1 } }
          : { text: "The register is a small, mean decision. You make it.", effects: { karma: -6, reputation: -3, money: 420 + (d.crew?.members.length ?? 0) * 80, happiness: 1 } },
        van: van
          ? { text: "The van is loud in the wrong direction. You get out with a lesson you will ignore.", effects: { karma: -12, reputation: -10, health: -8, happiness: -4, money: 200, fame: 2 } }
          : { text: "Payroll becomes yours for an afternoon. The people it belonged to will feel it on Friday.", effects: { karma: -10, reputation: -5, money: 1100 + (d.crew?.members.length ?? 0) * 250, fame: 2, happiness: 1 } },
        museum: { text: "You skip the paintings and take the thing that hums. Security takes it personally.", special: { kind: "grant" }, effects: { karma: -8, fame: 2, reputation: -4, happiness: 1, health: -2 } },
        walk: { text: "You get as far as the plan and then you don't. The bar notices the almost.", effects: { karma: 2, happiness: -1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "intimidate") {
    if (d.age < 15 || noTime(d, true)) return game;
    const rival = d.relationships.find((r) => r.role === "rival" && r.alive);
    openSpendChoice(d, {
      id: "intimidate",
      prompt: "Fear is a toll you can charge. The bar itemizes it.",
      choices: [
        { id: "shop", label: "A shop that can pay" },
        { id: "rival", label: rival ? `Lean on ${firstName(rival.name)}` : "Lean on a stranger" },
        { id: "witness", label: "A witness who saw too much" },
        { id: "stop", label: "Let them go" },
      ],
      outcomes: {
        shop: { text: "You let them see what you could do, and then you don't. They pay for the pause.", effects: { karma: -6, reputation: -3, fame: 1, money: 260, happiness: -1 } },
        rival: rival
          ? { text: `${firstName(rival.name)} pays in pride and a little cash. The rivalry gets a receipt.`, effects: { karma: -5, fame: 2, money: 180, closeness: -4, personId: rival.id, happiness: 1 } }
          : { text: "A stranger learns your face and the price of ignoring it. You learn you will do this.", effects: { karma: -6, fame: 2, money: 140, reputation: -2 } },
        witness: { text: "They agree to forget. You agree to be someone who asks for that. Neither of you sleeps well.", effects: { karma: -8, reputation: -2, happiness: -2, fame: 1 } },
        stop: { text: "You had them. You let the moment go. It costs the money and saves a sliver.", effects: { karma: 3, happiness: 1, fame: -1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "found-crew") {
    if (d.age < 15 || d.crew || d.stats.karma > -12 || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "found-crew",
      prompt: "You can stop borrowing other people's darkness. What kind of ledger are you opening?",
      choices: [
        { id: "smash", label: "A smash crew" },
        { id: "quiet", label: "A quiet crew" },
        { id: "fear", label: "A fear crew" },
        { id: "later", label: "Not tonight" },
      ],
      outcomes: {
        smash: { text: "You want doors to remember you.", special: { kind: "foundCrew", style: "smash" }, effects: { karma: -5, fame: 3, happiness: 2 } },
        quiet: { text: "You want the job done before it has a name.", special: { kind: "foundCrew", style: "quiet" }, effects: { karma: -3, smarts: 1, happiness: 1 } },
        fear: { text: "You want them to pay so you don't have to visit.", special: { kind: "foundCrew", style: "fear" }, effects: { karma: -7, fame: 2, reputation: -3 } },
        later: { text: "You close the notebook. The idea stays, which is not the same as leaving.", effects: { happiness: -1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "disband") {
    if (!d.crew || noTime(d, true)) return game;
    const name = d.crew.name;
    const payout = 900 + d.crew.members.length * 400;
    openSpendChoice(d, {
      id: "disband",
      prompt: `${name} can end as a fire, a sale, or a sentence you don't finish.`,
      choices: [
        { id: "burn", label: "Burn the ledger" },
        { id: "sell", label: "Sell the name" },
        { id: "keep", label: "Keep them" },
      ],
      outcomes: {
        burn: { text: `You burn the ledger for ${name}. Some of them will forgive you. The interesting ones won't.`, effects: { karma: 6, happiness: -2, reputation: 2 }, flags: { disbandCrew: 1 } },
        sell: { text: `You sell ${name} to people with worse stationery. The money clears. The motto doesn't.`, effects: { money: payout, karma: -4, fame: 2, happiness: -1 }, flags: { disbandCrew: 1 } },
        keep: { text: `You look at ${name} and decide the month can survive them.`, effects: { happiness: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "heist") {
    if (!d.crew || d.crew.members.length < 1 || d.flags.crewjob || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "heist",
      prompt: `${d.crew.name} is waiting on a verb. Heat is ${d.crew.heat ?? 0}. Loyalty is ${d.crew.loyalty ?? 50}. ${d.crew.motto ?? ""}`,
      choices: [
        { id: "smash", label: "Smash job" },
        { id: "quiet", label: "Quiet lift" },
        { id: "fear", label: "Fear tax" },
        { id: "spark", label: "Steal a spark" },
        { id: "off", label: "Call it off" },
      ],
      outcomes: {
        smash: { text: "You pick the loud door.", special: { kind: "heist", style: "smash" } },
        quiet: { text: "You pick the door nobody filmed.", special: { kind: "heist", style: "quiet" } },
        fear: { text: "You pick a block that can pay.", special: { kind: "heist", style: "fear" } },
        spark: { text: "You pick the thing that hums.", special: { kind: "heist", style: "spark" } },
        off: { text: "You send them home. The score can wait. The loyalty might not.", effects: { happiness: -1 }, special: { kind: "crewTouch", heat: -4, loyalty: -3 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "crew-pay") {
    const crew = d.crew;
    if (!crew || crew.members.length < 1 || d.flags.crewpay || noTime(d, true)) return game;
    const fair = 250 * crew.members.length;
    const fat = 500 * crew.members.length;
    if (d.stats.money < fair) return game;
    d.flags.crewpay = 1;
    openSpendChoice(d, {
      id: "crew-pay",
      prompt: `${crew.name} wants to feel chosen. A cut is how they count it.`,
      choices: [
        { id: "fair", label: `Fair cut (${money(fair)})` },
        { id: "fat", label: `Fat cut (${money(fat)})` },
        { id: "stiff", label: "Promise them later" },
      ],
      outcomes: {
        fair: { text: "You pay them like a person who intends to still have a crew.", effects: { money: -fair, karma: -1 }, special: { kind: "crewTouch", heat: -2, loyalty: 12 } },
        fat: d.stats.money >= fat
          ? { text: "You overpay. They grin like a problem that likes you.", effects: { money: -fat, karma: -2, happiness: 1 }, special: { kind: "crewTouch", heat: 2, loyalty: 18 } }
          : { text: "The fat cut was a fantasy. You pay what you have and call it philosophy.", effects: { money: -fair, happiness: -1 }, special: { kind: "crewTouch", heat: 0, loyalty: 4 } },
        stiff: { text: "You tell them next month like next month is a place. Someone writes it down.", effects: { karma: -3 }, special: { kind: "crewTouch", heat: 6, loyalty: -14 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "crew-cool") {
    const crew = d.crew;
    if (!crew || d.flags.crewcool || noTime(d, true)) return game;
    d.flags.crewcool = 1;
    openSpendChoice(d, {
      id: "crew-cool",
      prompt: `${crew.name} is warm in the way police enjoy. How do you take the temperature down?`,
      choices: [
        { id: "dump", label: "Dump the evidence" },
        { id: "fake", label: "Stage a rescue" },
        { id: "blame", label: "Blame one of your own" },
      ],
      outcomes: {
        dump: { text: "You throw the interesting things in a river that did not agree to this.", effects: { karma: -2, smarts: 1 }, special: { kind: "crewTouch", heat: -20, loyalty: 1 } },
        fake: { text: "You pull someone out of a problem you did not cause, on camera. The heat believes a nicer story.", effects: { karma: 5, fame: 2, reputation: 2 }, special: { kind: "crewTouch", heat: -12, loyalty: -2 } },
        blame: { text: "You pick a name and give it to the story. The story is grateful. The name is not.", effects: { karma: -8, reputation: -2 }, special: { kind: "crewTouch", heat: -22, loyalty: -16, blame: true } },
      },
    });
    peaks(d);
    return d;
  }

  if (id.startsWith("hire|")) {
    const personId = id.slice(5);
    const person = d.relationships.find((r) => r.id === personId && r.alive && r.role === "villain");
    if (!d.crew || !person || noTime(d, true) || d.stats.money < 900) return game;
    if (d.crew.members.some((member) => member.personId === person.id)) return game;
    if (person.closeness < 22 && d.stats.karma > -35) return game;
    spend(d);
    d.stats.money -= 900;
    d.crew.members.push({ personId: person.id, name: person.name, alias: person.note || firstName(person.name) });
    const deltas: Delta[] = [];
    applyEffects(d, { karma: -3, fame: 1, closeness: 8, personId: person.id }, deltas);
    deltas.push({ stat: "Money", amount: -900 });
    setStory(d, `${person.note || firstName(person.name)} takes the cut and the jacket. ${d.crew.name} is louder by one.`, deltas, [], "major");
    peaks(d);
    return d;
  }

  if (id.startsWith("heromission|")) {
    const hero = d.heroes.find((item) => item.id === id.slice(12) && item.met);
    if (!hero || hero.relationship < 22 || noTime(d, true)) return game;
    const bases = teachableBases(hero.unlocked, d.unlockedPowers ?? []);
    const signature = bases[0];
    const offbookTeach = roll(d) < 0.55 ? bases[rollInt(d, Math.max(1, bases.length))]?.id : undefined;
    const choices = [
      { id: "rescue", label: "Run a rescue" },
      { id: "bust", label: "Bust a ring" },
      { id: "offbook", label: "Take the off-book job" },
    ];
    if (signature) choices.push({ id: "learn", label: (d.discovered ?? []).includes(signature.id) ? `Ask for ${signature.name}` : "Ask for a power they won't name" });
    const outcomes: Record<string, Outcome> = {
      rescue: {
        text: `You and ${hero.alias} pull people out of a problem that fit in one night.`,
        effects: { fame: 2, karma: 6, happiness: 3, reputation: 2, powerLevel: 0.06 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 12, bond: 4 },
      },
      bust: {
        text: `You and ${hero.alias} kick in a door that had it coming. The debrief is mostly snacks and one lecture.`,
        effects: { fame: 3, karma: 3, reputation: 3, happiness: 1 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 14, bond: 3 },
      },
      offbook: {
        text: `${hero.alias} takes the job that will not be in the report. You go anyway.`,
        effects: { money: 700, karma: -7, fame: 2, happiness: 1 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 10, bond: 2, teach: offbookTeach },
      },
    };
    if (signature) {
      outcomes.learn = {
        text: `You ask ${hero.alias} for the power they have been holding back.`,
        effects: { karma: 1, smarts: 1, happiness: 2 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 8, bond: 3, teach: signature.id },
      };
    }
    openSpendChoice(d, { id: "heromission", prompt: `${hero.alias} has a night free. Bond ${hero.relationship}. They will not spend it on small talk.`, choices, outcomes });
    peaks(d);
    return d;
  }

  if (id.startsWith("herotrain|")) {
    const hero = d.heroes.find((item) => item.id === id.slice(10) && item.met);
    if (!hero || hero.relationship < 36 || noTime(d, true)) return game;
    const options = possibleMixes(d.unlockedPowers ?? []).filter((item) => hero.unlocked.includes(item.left.id) || hero.unlocked.includes(item.right.id));
    const taught = options[0];
    const bases = teachableBases(hero.unlocked, d.unlockedPowers ?? []);
    const base = bases[0];
    const focus = focusId(d);
    const focusGen = getPower(focus)?.generation ?? 0;
    const focusLevel = masteryLevel(d.mastery?.[focus] ?? 0, focusGen);
    const withHero = hero.relationship >= bondForMastery(focusGen);
    const drill = trainExp({ level: focusLevel, generation: focusGen, age: d.age, withHero, story: false, bond: hero.relationship });
    const knownBraid = taught ? (d.discovered ?? []).includes(taught.result.id) : false;
    const choices = [{ id: "braid", label: taught ? (knownBraid ? `Braid ${taught.result.name}` : "Braid a pair they know") : "Drill what you have" }];
    if (base) choices.push({ id: "learn", label: `Learn ${base.name}` });
    choices.push({ id: "spar", label: "Hard spar" });
    const outcomes: Record<string, Outcome> = {
      braid: {
        text: taught
          ? `${hero.alias} makes you hold ${taught.left.name} against ${taught.right.name}. Mastery still has to be earned.`
          : `${hero.alias} runs the ugly drills. The gains are small on purpose.`,
        effects: { powerLevel: 0.04, happiness: 1, smarts: 1 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 14, bond: 3, teach: taught?.result.id, masteryId: taught?.result.id ?? focus, masteryExp: drill },
      },
      spar: {
        text: `${hero.alias} stops being nice about the timing.`,
        minigame: {
          kind: "timing",
          title: `Spar ${hero.alias}`,
          subtitle: withHero ? "They match the power you're focused on." : "Bond isn't deep enough for this generation. The reps stay small.",
          verb: "herospar",
          vars: { hero: hero.alias, note: withHero ? "They match the power you're focused on." : "Bond isn't deep enough for this generation. The reps stay small." },
          difficulty: clamp(2 + focusGen, 1, 3),
          winText: "You tag them. They look proud and annoyed, which is their love language.",
          partialText: "You split the hour. Both of you pretend that was the plan.",
          loseText: "You eat the mat. They help you up and do not say I told you, which is worse.",
          winEffects: { powerLevel: 0.04, happiness: 1, health: -3 },
          partialEffects: { powerLevel: 0.02, health: -4 },
          loseEffects: { health: -6, happiness: -1 },
          specialWin: { kind: "heroProgress", heroId: hero.id, exp: 12, bond: 3, masteryId: focus, masteryExp: drill },
          specialPartial: { kind: "heroProgress", heroId: hero.id, exp: 6, bond: 1, masteryId: focus, masteryExp: Math.max(2, Math.round(drill * 0.4)) },
        },
      },
    };
    if (base) {
      outcomes.learn = {
        text: `${hero.alias} spends the hour installing ${base.name} instead of a speech. It arrives at mastery 1, not mastered.`,
        effects: { happiness: 1, smarts: 1 },
        special: { kind: "heroProgress", heroId: hero.id, exp: 10, bond: 3, teach: base.id, masteryId: base.id, masteryExp: 8 },
      };
    }
    openSpendChoice(d, {
      id: "herotrain",
      prompt: withHero
        ? `${hero.alias} clears a mat. Bond ${hero.relationship}. Generation ${focusGen} still takes months.`
        : `${hero.alias} will drill, but generation ${focusGen} wants bond ${bondForMastery(focusGen)}. Until then the reps are thin.`,
      choices,
      outcomes,
    });
    peaks(d);
    return d;
  }

  if (id.startsWith("learn|")) {
    const [, heroId, powerId] = id.split("|");
    const hero = d.heroes.find((item) => item.id === heroId && item.met);
    const power = getPower(powerId);
    if (!hero || !power || power.generation !== 0 || hero.relationship < 28 || noTime(d, true)) return game;
    if (!hero.unlocked.includes(power.id) || (d.unlockedPowers ?? []).includes(power.id)) return game;
    spend(d);
    const name = unlockCombo(d, power.id);
    hero.relationship = clamp(hero.relationship + 5, 0, 100);
    hero.exp += 18;
    const before = hero.level;
    settleHeroLevel(hero);
    const grew = hero.level > before ? ` They hit level ${hero.level}.` : "";
    setStory(d, `${hero.alias} teaches you ${name || power.name}. It is yours now, which means it can braid.${grew}`, [], [`Learned ${power.name}`], "major");
    peaks(d);
    return d;
  }

  if (id === "mentor") {
    if (d.age < 45 || d.flags.mentored || noTime(d, true)) return game;
    spend(d);
    d.flags.mentored = 1;
    const deltas: Delta[] = [];
    const good = roll(d) < 0.25 + Math.min(0.5, d.stats.reputation / 200 + (d.legacy ?? 0) / 200);
    const gain = mentorLegacy(d, good);
    d.legacy = (d.legacy ?? 0) + gain;
    applyEffects(d, { happiness: good ? 4 : 2, reputation: d.stats.reputation >= 0 ? 1 : 0, karma: 1 }, deltas);
    if (gain > 0) deltas.unshift({ stat: "Legacy", amount: gain });
    const tired = (d.flags.mentorRun ?? 0) >= 4;
    const line = good
      ? "The rookie gets it on the third try and looks at you like you invented gravity. You did not. You let them think it a while."
      : tired
        ? "Another rookie, another afternoon. They learn. You notice you are repeating yourself, which is its own lesson."
        : "You spend an afternoon on footwork and bad habits. The rookie is slow. So were you.";
    setStory(d, line, deltas, [], undefined);
    peaks(d);
    return d;
  }

  if (id.startsWith("teach|")) {
    const [, heroId, powerId] = id.split("|");
    const hero = d.heroes.find((item) => item.id === heroId && item.met);
    const power = getPower(powerId);
    if (!hero || !power || hero.relationship < 70 || !(d.unlockedPowers ?? []).includes(power.id) || noTime(d, true)) return game;
    if (hero.unlocked.includes(power.id)) return game;
    spend(d);
    hero.unlocked.push(power.id);
    hero.relationship = clamp(hero.relationship + 4, 0, 100);
    hero.exp += 16;
    settleHeroLevel(hero);
    d.legacy = (d.legacy ?? 0) + 3;
    setStory(d, `You walk ${hero.alias} through ${power.name}. They get it faster than you did, which you allow them to notice.`, [], [], "major");
    peaks(d);
    return d;
  }

  if (id === "lean-mask") {
    if (d.age < 16 || d.stats.karma > -18 || d.flags.villainMask || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "lean-mask",
      prompt: "You can say the quiet part where it will be quoted. The bar will stop pretending it is a mystery.",
      choices: [
        { id: "say", label: "Say it in public" },
        { id: "money", label: "Take a villain's stipend instead" },
        { id: "no", label: "Keep the mask in the drawer" },
      ],
      outcomes: {
        say: { text: "You say it where the phones are. Work gets easier. Mirrors get worse.", effects: { karma: -8, fame: 6, reputation: -6, happiness: 1 }, flags: { villainMask: 1 } },
        money: { text: "You stay deniable and cash the checks. The bar is not fooled. The account is.", effects: { money: 2400, karma: -5, reputation: -2 }, flags: { villainContract: 1 } },
        no: { text: "You leave the sentence unsaid. It stays in the room anyway.", effects: { happiness: -1, karma: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "drop-mask") {
    if (!d.flags.villainMask || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "drop-mask",
      prompt: "The name is already in print. Taking it back will look like a stunt or a conscience.",
      choices: [
        { id: "back", label: "Walk it back" },
        { id: "half", label: "Say you were misquoted" },
        { id: "keep", label: "Leave the mask on" },
      ],
      outcomes: {
        back: { text: "You name the lines you won't cross anymore. Some of the city boos. The bar moves.", effects: { karma: 10, reputation: 4, fame: -2, happiness: 2 }, flags: { villainMask: 0 } },
        half: { text: "You blame the edit. People who like you pretend to believe it.", effects: { karma: 3, fame: 1, reputation: 1 }, flags: { villainMask: 0 } },
        keep: { text: "You look at the mask and put it back on. At least the choice was conscious.", effects: { karma: -2, fame: 1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id === "swear-oath") {
    if (d.age < 16 || d.stats.karma < 18 || d.flags.heroOath || noTime(d, true)) return game;
    openSpendChoice(d, {
      id: "swear-oath",
      prompt: "A small crowd wants the lines you will not cross. The phones are up. The bar is listening harder.",
      choices: [
        { id: "full", label: "Swear the whole oath" },
        { id: "small", label: "Swear to try" },
        { id: "leave", label: "Leave before the speech" },
      ],
      outcomes: {
        full: { text: "You name the lines out loud. The city writes them down. So do you.", effects: { karma: 8, reputation: 5, fame: 2, happiness: 2 }, flags: { heroOath: 1 } },
        small: { text: "You promise to try. It is less quotable and more true.", effects: { karma: 4, reputation: 2, happiness: 2 } },
        leave: { text: "You are not ready to be a sentence. The crowd forgives you less than you hoped.", effects: { fame: -1, happiness: -1 } },
      },
    });
    peaks(d);
    return d;
  }

  if (id.startsWith("arc-start|")) {
    const arc = availableArcs(d).find((entry) => entry.id === id.slice(10));
    if (!arc || d.story.active || noTime(d, true)) return game;
    spend(d);
    d.story.active = arc.id;
    d.story.progress[arc.id] = d.story.progress[arc.id] ?? 0;
    setStory(d, `${arc.title}. ${arc.villain} is the name on it. ${arc.blurb} First step: ${arc.steps[d.story.progress[arc.id] ?? 0]?.title ?? "show up"}.`, [], [], "major");
    peaks(d);
    return d;
  }

  if (id === "arc-drop") {
    const current = currentCase(d);
    if (!current || noTime(d, true)) return game;
    spend(d);
    d.story.active = null;
    setStory(d, `You set ${current.arc.title} down. The page stays. You can pick it up again.`, [], []);
    peaks(d);
    return d;
  }

  if (id === "arc-step") {
    const current = currentCase(d);
    if (!current || noTime(d, true)) return game;
    const step = current.step;
    if (step.kind === "talk") {
      const hero = d.heroes.find((entry) => entry.id === step.heroId && entry.met);
      if (!hero) {
        setStory(d, `${step.brief} Find them first. Looking for a sparring partner is on the Power tab.`, [], []);
        return d;
      }
      if (hero.relationship < (step.minBond ?? 18)) {
        setStory(d, `${hero.alias} is not close enough. Bond ${hero.relationship}, and this page wants ${step.minBond ?? 18}. Talk is free.`, [], []);
        return d;
      }
      spend(d);
      hero.relationship = clamp(hero.relationship + 3, 0, 100);
      hero.exp += 8;
      settleHeroLevel(hero);
      const extra = finishStep(d);
      setStory(d, `${hero.alias} gives you the page about ${current.arc.villain}. ${step.brief}${extra}`, [], [], "major");
      peaks(d);
      return d;
    }
    if (step.kind === "train") {
      const target = heldDrill(d, step);
      if (!target) {
        const names = stepPowers(step).map((powerId) => getPower(powerId)?.name ?? powerId).join(" or ");
        setStory(d, `${step.brief} You need ${names} in the braid book first.`, [], []);
        return d;
      }
      if (d.stats.health < 12) {
        setStory(d, "Too gassed for a case drill. Rest, then come back. The case waits.", [], []);
        return d;
      }
      spend(d);
      d.stats.health = clamp(d.stats.health - 4, 0, 100);
      const gen = getPower(target)?.generation ?? 0;
      const level = masteryLevel(d.mastery?.[target] ?? 0, gen);
      const bonus = trainExp({ level, generation: gen, age: d.age, withHero: true, story: true, bond: 48 });
      const note = grantMastery(d, target, bonus);
      if (drillReady(d, step)) {
        const extra = finishStep(d);
        setStory(d, `The case drill lands.${note}${extra}`, [], [], "major");
      } else {
        setStory(d, `The case drill lands.${note} It still wants mastery ${step.needMastery ?? 2}. The wall does not care that the plot is impatient.`, [], []);
      }
      peaks(d);
      return d;
    }
    if (step.kind === "investigate" || step.kind === "protect") {
      const choices = step.choices ?? [{ id: "go", label: "Do it", text: step.brief, advance: true }];
      const outcomes: Record<string, Outcome> = {};
      for (const choice of choices) {
        outcomes[choice.id] = { text: choice.text, effects: choice.effects, special: choice.advance ? { kind: "arcAdvance" } : undefined };
      }
      openSpendChoice(d, {
        id: step.id,
        prompt: `${current.arc.villain} — ${current.arc.title}. ${step.brief}`,
        choices: choices.map((choice) => ({ id: choice.id, label: choice.label })),
        outcomes,
      });
      peaks(d);
      return d;
    }
    if (step.kind === "fight" || step.kind === "boss") {
      const foeName = step.foeName ?? current.arc.villain;
      openMini(
        d,
        makeDuel(
          d,
          { name: foeName, title: step.foeTitle ?? current.arc.group, side: "villain", powerId: step.foePower ?? "strength", powerLevel: step.kind === "boss" ? 6.4 : 4.2, boss: step.kind === "boss" },
          {
            title: foeName,
            subtitle: `${step.brief} Your six moves.`,
            win: `You put ${foeName} down. The case moves.`,
            partial: "You split it. The case stays on this page.",
            lose: `${foeName} writes this month's ending.`,
            tag: "duel",
            winEffects: { fame: step.kind === "boss" ? 4 : 2, karma: 2, happiness: 1, powerLevel: 0.04 },
            partialEffects: { health: -4, happiness: -1 },
            loseEffects: { health: -8, happiness: -2 },
            specialWin: { kind: "arcAdvance" },
          },
        ),
        `${current.arc.title}. ${step.brief}`,
      );
      peaks(d);
      return d;
    }
  }

  if (id === "city-walk") {
    if (d.age < 6 || noTime(d, true) || d.flags.walked) return game;
    spend(d);
    d.flags.walked = 1;
    const deltas: Delta[] = [];
    applyEffects(d, walkEffects(d), deltas);
    setStory(d, sceneLine(d), deltas, []);
    peaks(d);
    return d;
  }

  if (id === "city-trouble") {
    const villain = nextLocalVillain(d);
    if (d.age < 12 || noTime(d, true) || !villain) return game;
    spend(d);
    const city = dossier(d.cityId);
    addPerson(d, { role: "villain", closeness: 16, age: 24 + rollInt(d, 20), name: villain, note: city.trouble });
    setStory(d, `${villain} is the problem ${d.city} keeps. ${city.trouble} They know the block, and now they know your face.`, [], [], "major");
    peaks(d);
    return d;
  }

  if (id === "relocate") {
    if (d.age < 8 || noTime(d, true) || d.flags.moved) return game;
    const cost = travelCost(d);
    const options = CITIES.filter((city) => city.id !== d.cityId && d.stats.money >= cost);
    if (!options.length) return game;
    const outcomes: Record<string, Outcome> = {
      stay: { text: `You stay in ${d.city}. The ticket window can wait.` },
    };
    for (const city of options) {
      outcomes[city.id] = {
        text: dossier(city.id).travel,
        effects: { happiness: 1 },
        special: { kind: "move", cityId: city.id },
      };
    }
    showChoice(
      d,
      {
        id: "relocate",
        prompt: `A ticket out of ${d.city} is ${money(cost)}. Where are you going?`,
        choices: [{ id: "stay", label: "Stay" }, ...options.map((city) => ({ id: city.id, label: city.name }))],
        outcomes,
      },
      [],
    );
    return d;
  }

  if (id.startsWith("trait|")) {
    const traitId = id.slice(6) as TraitId;
    if (earnBlock(d, traitId) || noTime(d, true)) return game;
    spend(d);
    const blurb = grantTrait(d, traitId);
    let extra = "";
    if (traitId === "sorcerer") {
      const name = unlockCombo(d, "sorcery");
      extra = name ? ` ${name} is in the braid book. It can mix.` : " The working was already yours.";
    }
    if (traitId === "inventor") {
      const name = unlockCombo(d, "energy-projection");
      extra = name ? ` ${name} is a tool you can build with.` : "";
    }
    if (traitId === "martial") extra = grantMastery(d, "super-strength", 24);
    if (traitId === "psychic") {
      const mind = (d.unlockedPowers ?? []).includes("telepathy") ? "telepathy" : "telekinesis";
      extra = grantMastery(d, mind, 24);
    }
    setStory(d, `${blurb}${extra}`, [], [], "major");
    peaks(d);
    return d;
  }

  return game;
}

function item(partial: ActionItem): ActionItem {
  return partial;
}

export function applyHeroTalk(game: Game, heroId: string, line: string, reply: string): Game {
  if (game.phase !== "live") return game;
  const d = structuredClone(game);
  const hero = (d.heroes ?? []).find((item) => item.id === heroId && item.met);
  const said = line.trim();
  const heard = reply.trim();
  if (!hero || !said || !heard) return game;
  const judged = judgeTalk(said);
  const prior = d.flags[`talks:${hero.id}`] ?? 0;
  d.flags[`talks:${hero.id}`] = prior + 1;
  const delta = prior === 0 ? judged.delta : Math.sign(judged.delta) * Math.min(2, Math.abs(judged.delta));
  hero.relationship = clamp(hero.relationship + delta, 0, 100);
  hero.exp += 2;
  settleHeroLevel(hero);
  hero.memory.push({ role: "you", text: said.slice(0, 180) });
  hero.memory.push({ role: "them", text: heard.slice(0, 280) });
  if (hero.memory.length > 8) hero.memory.splice(0, hero.memory.length - 8);
  if (prior === 0) pushHistory(d, `${hero.alias}: ${heard.slice(0, 140)}`);
  return d;
}

export function actionsFor(g: Game): ActionItem[] {
  if (g.phase !== "live") return [];
  const items: ActionItem[] = [];
  const life = "life" as const;
  const power = "power" as const;
  const career = "career" as const;
  const people = "people" as const;

  if (g.age >= 6) {
    const city = dossier(g.cityId);
    items.push(item({ id: "city-walk", group: life, section: g.city, label: `Walk ${g.city}`, detail: city.scenes[0], disabled: noTime(g, true) ?? (g.flags.walked ? "Already walked this month." : undefined) }));
    const villain = g.age >= 12 ? nextLocalVillain(g) : null;
    if (g.age >= 12) {
      items.push(item({ id: "city-trouble", group: life, section: g.city, label: villain ? `Find ${villain}` : "Local names", detail: villain ? `${city.trouble} A villain this city keeps.` : "You already know the names on this block.", disabled: noTime(g, true) ?? (villain ? undefined : "Nobody new."), accent: !!villain }));
    }
    if (g.age >= 8) {
      const cost = travelCost(g);
      const broke = g.stats.money < cost;
      items.push(item({ id: "relocate", group: life, section: g.city, label: "Leave for another city", detail: broke ? `A ticket is ${money(cost)}.` : `Ticket ${money(cost)}. New York, the Hood, the Stacks, and the old map.`, disabled: noTime(g, true) ?? (g.flags.moved ? "Already moved this month." : broke ? "Too broke for a ticket." : undefined), accent: !broke && !g.flags.moved }));
    }
  }
  for (const offer of visibleEarned(g)) {
    items.push(item({ id: `trait|${offer.def.id}`, group: life, section: "Become", label: offer.def.title, detail: offer.block ?? offer.def.blurb, disabled: noTime(g, true) ?? offer.block ?? undefined, accent: !offer.block }));
  }

  if (g.age >= 1) {
    items.push(item({ id: "rest", group: life, section: "This month", label: "Rest", detail: "Health and a little peace. Once a month.", disabled: g.flags.rested ? "You already rested." : undefined }));
    if (g.age >= 45) items.push(item({ id: "mentor", group: life, section: "This month", label: "Mentor a rookie", detail: "Legacy and a little joy. Once a month.", disabled: g.flags.mentored ? "One rookie a month is plenty." : noTime(g, true), accent: g.age >= 60 && !g.flags.mentored }));
  }
  if (g.age >= 8) items.push(item({ id: "gym", group: life, section: "This month", label: "Hit the gym", detail: "Lift, run, or an underground bout.", disabled: noTime(g, true) }));
  if (g.age >= 6) items.push(item({ id: "books", group: life, section: "This month", label: "Hit the books", detail: "Library, stolen notes, or the cape columns.", disabled: noTime(g, true) }));
  if (g.age >= 13) items.push(item({ id: "out", group: life, section: "This month", label: "Go out", detail: `Loud, quiet, or the bad block. From ${money(25 + g.age * 3)}.`, disabled: noTime(g, true) ?? (g.stats.money < 25 + g.age * 3 ? "Too broke." : undefined) }));
  if (g.age >= 10) items.push(item({ id: "volunteer", group: life, section: "This month", label: "Volunteer", detail: "Pick a way to help. The bar moves.", disabled: noTime(g, true) }));
  if (g.age >= 14) items.push(item({ id: "scheme", group: life, section: "This month", label: "Work a gray angle", detail: "Skim, rumor, or a charity. Or put the pen down.", disabled: noTime(g, true) }));
  if (g.age >= 10 && g.stats.health < 82) items.push(item({ id: "doctor", group: life, section: "This month", label: "See a doctor", detail: `Costs ${money(80 + g.age * 4)}.`, disabled: noTime(g, true) ?? (g.stats.money < 80 + g.age * 4 ? "Too broke." : undefined) }));
  if (g.age >= 8) items.push(item({ id: "hobby", group: life, section: "This month", label: "Pick up a hobby", detail: "Music, food, drawing, or a cape journal.", disabled: noTime(g, true) ?? (g.flags.hobby ? "Already did, this month." : undefined) }));
  if (g.age >= 13) items.push(item({ id: "laylow", group: life, section: "This month", label: "Lay low", detail: "Fame cools. The bar eases toward good.", disabled: noTime(g, true) }));
  if (g.age >= 12) items.push(item({ id: "pocket", group: life, section: "The other road", label: "Pocket what isn't yours", detail: "A wallet, a shop, a cape's bag, or a conscience.", disabled: noTime(g, true) }));
  if (g.age >= 14) items.push(item({ id: "crime", group: life, section: "The other road", label: "Pull a real job", detail: "Store, payroll, or a spark. You can still walk off.", disabled: noTime(g, true), accent: g.stats.karma < -8 }));
  if (g.age >= 15) items.push(item({ id: "intimidate", group: life, section: "The other road", label: "Intimidate someone", detail: "Charge fear, or let them go.", disabled: noTime(g, true) }));
  if (!g.crew && g.age >= 15) items.push(item({ id: "found-crew", group: life, section: "The other road", label: "Found an evil crew", detail: "Smash, quiet, or fear. Needs the bar at Rogue or worse.", disabled: noTime(g, true) ?? (g.stats.karma > -12 ? "You aren't dark enough yet. The bar has to slide." : undefined), accent: g.stats.karma <= -12 }));
  if (g.age >= 16 && g.stats.karma <= -18 && !g.flags.villainMask) items.push(item({ id: "lean-mask", group: life, section: "The other road", label: "Put the villain mask on", detail: "Say it in public. Or take a stipend that locks the League out.", disabled: noTime(g, true), accent: true }));
  if (g.flags.villainMask) items.push(item({ id: "drop-mask", group: life, section: "The other road", label: "Take the mask off", detail: "Walk the name back. The bar can still move.", disabled: noTime(g, true) }));
  if (g.age >= 16 && g.stats.karma >= 18 && !g.flags.heroOath) items.push(item({ id: "swear-oath", group: life, section: "This month", label: "Swear a public oath", detail: "Name the lines you won't cross.", disabled: noTime(g, true), accent: true }));
  if (g.age >= 12) {
    const current = currentCase(g);
    if (current) {
      const step = current.step;
      let blocked: string | undefined;
      if (step.kind === "talk") {
        const hero = (g.heroes ?? []).find((entry) => entry.id === step.heroId && entry.met);
        if (!hero) blocked = "Meet them first. Power tab, look for a sparring partner.";
        else if (hero.relationship < (step.minBond ?? 18)) blocked = `Bond ${step.minBond ?? 18} with ${hero.alias}. Talk is free.`;
      }
      items.push(item({ id: "arc-step", group: life, section: "Cases", label: step.title, detail: `${current.arc.villain} · ${step.kind}. ${step.brief}`, disabled: noTime(g, true) ?? blocked, accent: true }));
      items.push(item({ id: "arc-drop", group: life, section: "Cases", label: "Set the case down", detail: `${current.arc.title} stays on the page. You can pick it up later.`, disabled: noTime(g, true) }));
    } else {
      const open = availableArcs(g);
      if (!open.length) {
        items.push(item({ id: "cases-quiet", group: life, section: "Cases", label: "No open cases", detail: (g.story?.cleared?.length ?? 0) > 0 ? "You closed the ones in reach." : "Nothing on the board for this age.", disabled: "The city is between villains." }));
      }
      for (const arc of open) {
        const local = homeArc(g.cityId, arc.id);
        items.push(item({ id: `arc-start|${arc.id}`, group: life, section: "Cases", label: arc.title, detail: `${local ? "This city. " : ""}${arc.villain}. ${arc.goal}. Favors ${arc.focus}.`, disabled: noTime(g, true), accent: local }));
      }
    }
  }
  if (g.crew) {
    items.push(item({ id: "heist", group: life, section: g.crew.name, label: "Run a crew heist", detail: g.crew.members.length ? `Heat ${g.crew.heat ?? 0} · loyalty ${g.crew.loyalty ?? 50}. Pick the job.` : "Hire someone first.", disabled: noTime(g, true) ?? (g.flags.crewjob ? "Already this month." : g.crew.members.length < 1 ? "A crew of one is just a diary." : undefined), accent: g.crew.members.length > 0 }));
    const fair = 250 * Math.max(1, g.crew.members.length);
    items.push(item({ id: "crew-pay", group: life, section: g.crew.name, label: "Pay the crew", detail: g.crew.members.length ? `Fair cut ${money(fair)}. Loyalty slips if you don't.` : "Nobody to pay yet.", disabled: noTime(g, true) ?? (g.flags.crewpay ? "Already paid this month." : g.crew.members.length < 1 ? "Hire someone first." : g.stats.money < fair ? "Too broke for a fair cut." : undefined) }));
    items.push(item({ id: "crew-cool", group: life, section: g.crew.name, label: "Cool the heat", detail: `Heat ${g.crew.heat ?? 0}. Dump evidence, stage a rescue, or blame someone.`, disabled: noTime(g, true) ?? (g.flags.crewcool ? "Already this month." : undefined) }));
    items.push(item({ id: "disband", group: life, section: g.crew.name, label: "Disband the crew", detail: "Burn the ledger, sell the name, or keep them.", disabled: noTime(g, true) }));
  }

  if (!onFile(g) && g.age >= 7 && g.age <= 15 && !g.powerless) {
    items.push(item({ id: "waiting", group: power, section: "Your gift", label: "Wait for a spark", detail: "It shows up when it shows up.", disabled: "Keep aging." }));
  }
  if (!onFile(g) && g.age >= 16 && g.age <= 24 && !g.powerless) {
    items.push(item({ id: "spark", group: power, section: "Your gift", label: "Push for a spark", detail: "Late bloomers sometimes aren't kidding.", disabled: noTime(g, true) }));
  }
  if (g.powerless) {
    items.push(item({ id: "ordinary", group: power, section: "Your gift", label: "No power on file", detail: "Ordinary can still run a city.", disabled: "The tests came back human." }));
  }
  if ((g.unlockedPowers ?? []).length && g.age >= 7) {
    const focus =
      g.focusPower && (g.unlockedPowers ?? []).includes(g.focusPower)
        ? g.focusPower
        : legacyComboId(g.powerId) ?? (g.unlockedPowers ?? [])[0] ?? null;
    const trained = focus ? getPower(focus) : null;
    if (trained) {
      const level = masteryLevel(g.mastery?.[trained.id] ?? 0, trained.generation);
      const cap = masteryCap(g.age, trained.generation, arcsCleared(g.story));
      const room = masteryRoom(g.mastery?.[trained.id] ?? 0, trained.generation, cap);
      const cost = trainCost(level, trained.generation);
      const wall = room <= 0 ? `Soft wall. Mastery ${level}/${cap}. Age or a finished case.` : undefined;
      const gassed = g.stats.health < 12 ? "Too gassed. Rest." : undefined;
      const broke = cost.money > g.stats.money ? `The drill wants ${money(cost.money)}.` : undefined;
      items.push(item({ id: "train", group: power, section: "Training", label: `Drill ${trained.name}`, detail: `${trained.tierName} · rank ${powerRank(level)} / ${powerRank(cap)}. Costs ${cost.health} health${cost.money ? ` and ${money(cost.money)}` : ""}. Gains stay small.`, disabled: noTime(g, true) ?? wall ?? gassed ?? broke }));
    }
  }
  if (g.powerId) {
    if (g.age >= 10) items.push(item({ id: "stunt", group: power, section: "Training", label: "Public stunt", detail: "Fame, or pavement.", disabled: noTime(g, true) }));
    if (g.stats.parentBelief < 96) items.push(item({ id: "confide", group: power, section: "Training", label: "Talk to your folks", detail: g.relationships.some((person) => person.role === "parent" && person.alive) ? "Belief makes training stick." : "Nobody in the kitchen.", disabled: noTime(g, true) ?? (g.relationships.some((person) => person.role === "parent" && person.alive) ? undefined : "Nobody left to tell.") }));
    if (g.flags.hidden) items.push(item({ id: "reveal", group: power, section: "Training", label: "Come clean", detail: "Secrets are heavy tuition.", disabled: undefined }));
    if (g.age >= 10) {
      const arch = g.relationships.find((r) => r.arch && r.alive);
      items.push(item({ id: "brawl", group: power, section: "Fights", label: arch ? `Fight ${arch.note || firstName(arch.name)}` : "Pick a fight", detail: "Turn-based. Your unlocked moves.", disabled: noTime(g, true), accent: !!arch }));
    }
  }
  if (g.age >= 8) {
    items.push(item({ id: "patrol", group: power, section: "City", label: "Patrol for trouble", detail: "Bright streets, bad blocks, or a teacher.", disabled: noTime(g, true) ?? (g.flags.patrolled ? "Already patrolled." : undefined) }));
  }
  if (g.age >= 10 && (g.heroes ?? []).some((hero) => !hero.met)) {
    const heroRoster = mergeHeroes(g.heroes);
    const unmet = heroRoster.filter((hero) => !hero.met).length;
    items.push(item({ id: "seek-hero", group: power, section: "Trainers", label: "Look for a sparring partner", detail: unmet ? `${unmet} still out there. Each one teaches powers you can braid.` : "You already know the circuit.", disabled: noTime(g, true) ?? (unmet ? undefined : "No one left to find."), accent: unmet > 0 }));
  }

  if (g.schoolId) {
    const school = schoolById(g.schoolId);
    items.push(item({ id: "class", group: career, section: school?.name ?? "Campus", label: "Attend class", detail: "A real bump to smarts.", disabled: noTime(g, true) }));
    if (g.powerId) items.push(item({ id: "spar", group: career, section: school?.name ?? "Campus", label: "Spar", detail: "Campus drill.", disabled: noTime(g, true) }));
    items.push(item({ id: "drop", group: career, section: school?.name ?? "Campus", label: "Drop out", detail: "The seat won't keep itself." }));
  } else if (g.age >= 7 && g.age <= 30) {
    const schools = [...SCHOOLS].sort((a, b) => Number(!!schoolBlock(g, a)) - Number(!!schoolBlock(g, b)));
    for (const school of schools) {
      if (g.age < school.minAge - 2 || g.age > school.maxAge) continue;
      const block = schoolBlock(g, school);
      items.push(item({ id: `school:${school.id}`, group: career, section: "Hero schools", label: school.name, detail: block ?? `${school.blurb} ${school.tuition ? money(school.tuition) + "/yr." : "Free."}`, disabled: noTime(g, true) ?? block ?? undefined, accent: !block }));
    }
  }

  if (g.jobId) {
    const job = jobById(g.jobId);
    const title = JOB_TITLES[g.jobRank] ?? "Staff";
    items.push(item({ id: "shift", group: career, section: job?.name ?? "Work", label: "Work a heavy shift", detail: `${title}. Extra cash, less joy.`, disabled: g.flags.shifted ? "Once a month. Your back says so." : noTime(g, true) }));
    items.push(item({ id: "promote", group: career, section: job?.name ?? "Work", label: "Ask for a promotion", detail: title, disabled: noTime(g, true) }));
    items.push(item({ id: "quit", group: career, section: job?.name ?? "Work", label: "Quit", detail: "Freedom has a receipt." }));
  } else if (g.age >= 15) {
    const jobs = JOBS.filter((job) => !job.powers || (g.powerId && job.powers.includes(g.powerId)));
    const sorted = [...jobs].sort((a, b) => Number(!!jobBlock(g, a)) - Number(!!jobBlock(g, b)));
    for (const job of sorted) {
      if (g.age + 2 < job.minAge) continue;
      const block = jobBlock(g, job);
      if (block && (g.age < job.minAge || (job.minSmarts - g.stats.smarts > 20 && job.minPL - g.stats.powerLevel > 2))) continue;
      items.push(item({ id: `job:${job.id}`, group: career, section: "Work", label: job.name, detail: block ?? `${job.blurb} ${money(job.pay)}/yr.`, disabled: noTime(g, true) ?? block ?? undefined, accent: !block }));
    }
  }

  const tryBlock = tryoutBlock(g);
  if (g.age >= 16 && g.leagueRank === 0) {
    items.push(item({ id: "tryout", group: career, section: "League", label: "League tryout", detail: "Rookie is a door, not a personality.", disabled: noTime(g, true) ?? tryBlock ?? undefined, accent: !tryBlock }));
  }
  if (g.leagueRank > 0) {
    const team = teamById(g.teamId);
    items.push(item({ id: "mission", group: career, section: team?.name ?? "League", label: "Run a mission", detail: `${RANKS[g.leagueRank]} · ${g.missions} missions this rank`, disabled: noTime(g, true), accent: true }));
    if (g.leagueRank >= 2) {
      for (const teamOption of TEAMS) {
        if (teamOption.id === g.teamId) continue;
        const block = teamBlock(g, teamOption);
        if (block && teamOption.minRank > g.leagueRank) continue;
        const cooling = g.flags.transferYear && g.age - g.flags.transferYear < 2;
        items.push(item({ id: `team:${teamOption.id}`, group: career, section: "Transfer", label: teamOption.name, detail: block ?? teamOption.blurb, disabled: noTime(g, true) ?? (cooling ? "Transfers need a year to cool off." : block ?? undefined) }));
      }
    }
  }

  for (const person of g.relationships) {
    if (!person.alive || person.role === "ex") continue;
    const section = `${person.name}`;
    items.push(item({ id: `time:${person.id}`, group: people, section, label: person.role === "rival" || person.arch ? "Trade insults and drills" : "Spend time", detail: `${person.arch ? "arch-enemy" : person.role}${person.note ? ` · ${person.note}` : ""} · closeness ${person.closeness}`, disabled: g.flags[`time:${person.id}`] ? "Already did, this month." : undefined }));
    const cost = 40 + g.age * 6;
    items.push(item({ id: `gift:${person.id}`, group: people, section, label: "Give a gift", detail: money(cost), disabled: g.flags[`gift:${person.id}`] ? "Already gifted." : g.stats.money < cost ? "Too broke." : undefined }));
    if (person.role === "partner" && !g.flags.married && g.age >= 18) {
      items.push(item({ id: "propose", group: people, section, label: "Propose", detail: "Costs $700. Needs real closeness.", disabled: noTime(g, true) ?? (person.closeness < 72 ? "Not close enough yet." : g.stats.money < 700 ? "The ring fund disagrees." : undefined), accent: person.closeness >= 72 }));
    }
    if (g.crew && person.role === "villain" && !g.crew.members.some((member) => member.personId === person.id)) {
      const shy = person.closeness < 22 && g.stats.karma > -35;
      items.push(item({ id: `hire|${person.id}`, group: people, section, label: `Hire into ${g.crew.name}`, detail: shy ? "They don't like you enough, and you aren't scary enough." : "Costs $900.", disabled: noTime(g, true) ?? (g.stats.money < 900 ? "Too broke." : shy ? "Not recruitable yet." : undefined), accent: !shy }));
    }
  }
  if (g.age >= 6 && g.relationships.filter((r) => r.role === "friend" && r.alive).length < 5) {
    items.push(item({ id: "befriend", group: people, section: "New faces", label: "Make a friend", detail: "Someone has to laugh at your jokes.", disabled: noTime(g, true) }));
  }
  if (g.age >= 16 && !g.relationships.some((r) => r.role === "partner" && r.alive)) {
    items.push(item({ id: "date", group: people, section: "New faces", label: "Go on a date", detail: "Looks and nerve help.", disabled: noTime(g, true) }));
  }
  const partner = g.relationships.find((r) => r.role === "partner" && r.alive);
  const kids = g.relationships.filter((r) => r.role === "child").length;
  if (partner && g.age >= 21 && kids < 3) {
    items.push(item({ id: "baby", group: people, section: "Family", label: kids ? "Have another kid" : "Start a family", detail: "A loud, correct decision.", disabled: noTime(g, true) ?? (partner.closeness < 65 && !g.flags.married ? "The relationship wants more time." : undefined), accent: partner.closeness >= 65 || !!g.flags.married }));
  }

  return items;
}

export function heirFrom(g: Game): NewLifeOpts | null {
  const kids = g.relationships.filter((r) => r.role === "child" && r.alive);
  if (!kids.length) return null;
  const oldest = [...kids].sort((a, b) => b.age - a.age)[0];
  if (!oldest) return null;
  return {
    name: oldest.name,
    cityId: g.cityId,
    upbringing: g.leagueRank >= 3 ? "legacy" : "supportive",
    face: faceOf(g),
    drive: driveOf(g),
    portrait: oldest.portrait ?? g.portrait + 17,
    sex: oldest.sex ?? (((oldest.portrait ?? 1) & 1) === 0 ? "female" : "male"),
    look: g.look,
    giftId: g.giftId ?? legacyComboId(g.powerId) ?? g.unlockedPowers?.[0] ?? null,
    seed: (g.rng ^ (oldest.age * 997 + 13)) >>> 0 || 1,
    heir: { fame: g.peak.fame, powerBias: oldest.latentPower ?? g.powerId, belief: 78, trust: g.flags.trust ?? 0 },
  };
}

export function canAge(g: Game): boolean {
  return g.phase === "live";
}
