/**
 * Chapters: the life is told in ~10-year chapters. Each chapter has a phase (origin, coming of age,
 * early career, rising name, crisis, legacy, mentor, final years), a personal title and premise built
 * from the hero's actual state, three goals with in-game hints, and a recap that pays out (or costs)
 * and carries a "thread" into the next chapter.
 *
 * Everything here is deterministic and data-driven. The optional AI pass (chapter-ai.ts) can only
 * rewrite the title/premise/beats text; goals and consequences always stay procedural so balance and
 * saves are stable.
 */
import { availableArcs } from "./arcs";
import { clamp } from "./format";
import { holdings } from "./market";
import type { Game } from "./types";

export type ChapterPhaseId = "origin" | "coming" | "early" | "rising" | "crisis" | "legacy" | "mentor" | "final";

export interface ChapterSnap {
  fame: number;
  rep: number;
  money: number;
  /** Cash plus what your property and tech would be worth: so buying a house isn't "going broke". */
  worth: number;
  smarts: number;
  power: number;
  powers: number;
  mastery: number;
  heroesMet: number;
  bond: number;
  arcs: number;
  rank: number;
  missions: number;
  legacy: number;
  friends: number;
  family: number;
  karma: number;
  happiness: number;
  health: number;
}

type Metric = keyof ChapterSnap;
type GoalMode = "gain" | "drop" | "atLeast" | "atMost";

export interface ChapterGoal {
  id: string;
  label: string;
  hint: string;
  metric: Metric;
  mode: GoalMode;
  target: number;
  start: number;
  done?: boolean;
}

export interface ChapterRecap {
  met: number;
  total: number;
  lines: string[];
  consequence: string;
  legacyGain: number;
  thread: ChapterThread;
}

export type ChapterThread = "momentum" | "drift" | "nemesis" | "family" | "infamy" | "body" | "fame" | "quiet";

export interface Chapter {
  index: number;
  phase: ChapterPhaseId;
  startAge: number;
  endAge: number;
  title: string;
  premise: string;
  beats: string[];
  goals: ChapterGoal[];
  source: "procedural" | "ai";
  aiTried?: boolean;
  recap?: ChapterRecap;
}

export interface ChapterNotice {
  open: number;
  recap: number | null;
}

interface PhaseDef {
  id: ChapterPhaseId;
  from: number;
  name: string;
  openers: string[];
  titles: string[];
  goals: string[];
}

/** One row per phase. Ages are the chapter start; the final phase repeats every decade after 70. */
export const CHAPTER_PHASES: PhaseDef[] = [
  {
    id: "origin",
    from: 0,
    name: "Origin",
    openers: ["{name} arrives in {city} with one gift and no instructions.", "{city} gets a new kid and does not notice the furniture shifting."],
    titles: ["Small Hands, Big Room", "Before Anyone Knew", "The {gift} Kid"],
    goals: ["smart", "friend", "mood", "drill"],
  },
  {
    id: "coming",
    from: 10,
    name: "Coming of age",
    openers: ["At ten, {name} learns the gift is not a secret from everyone.", "The teen years in {city} start with a power and a curfew."],
    titles: ["Learning the Edges", "Curfew and Capes", "The {gift} Problem"],
    goals: ["page", "teacher", "smart", "quietfame", "loudfame", "darkkarma"],
  },
  {
    id: "early",
    from: 20,
    name: "Early career",
    openers: ["Twenties. {name} has to decide what the gift pays for.", "{city} has rent and a League, and both want an answer."],
    titles: ["Paid in Daylight", "First Real Work", "{city} Hires"],
    goals: ["rank", "cushion", "cases", "partner", "infamy"],
  },
  {
    id: "rising",
    from: 30,
    name: "Rising name",
    openers: ["Thirties. People start to say {name}'s name without checking it.", "{city} has started keeping a file on {name}. Some of it is flattering."],
    titles: ["The Name Gets Around", "Headline Years", "{city} Learns Your Name"],
    goals: ["fame", "arc", "trust", "mastery", "rank", "infamy"],
  },
  {
    id: "crisis",
    from: 40,
    name: "The crisis",
    openers: ["Forty, and the thing {name} has been avoiding arrives on schedule.", "Mid-life in {city}: the bill for every earlier decade comes due."],
    titles: ["The Bill Comes Due", "What {threat} Wants", "Everything at Once"],
    goals: ["arc", "standing", "holdrep", "holdmoney", "family"],
  },
  {
    id: "legacy",
    from: 50,
    name: "Building a legacy",
    openers: ["Fifty. {name} starts counting what will still be standing later.", "The young capes of {city} know {name} as a story. Time to make it a useful one."],
    titles: ["What Stays Standing", "Building the House", "The Long Game"],
    goals: ["legacy", "page", "family", "fortune", "friend"],
  },
  {
    id: "mentor",
    from: 60,
    name: "Elder and mentor",
    openers: ["Sixty. The knees file complaints, and the rookies file in.", "{name} is the person {city}'s rookies call when the manual runs out."],
    titles: ["The Teacher's Chair", "Passing the Torch", "Rookies at the Door", "Old {gift}, New Tricks"],
    goals: ["legacy", "trust", "mood", "friend"],
  },
  {
    id: "final",
    from: 70,
    name: "Final years",
    openers: ["Seventy and counting. {name} spends the gift carefully now.", "Late light over {city}. {name} decides what the last pages say."],
    titles: ["Late Light", "The Last Pages", "Still Here", "One More Winter", "The Quiet Victory Lap", "What the Kids Remember", "Borrowed Time, Well Spent"],
    goals: ["legacy", "mood", "friend", "standing"],
  },
];

interface GoalDef {
  id: string;
  metric: Metric;
  mode: GoalMode;
  when?: (g: Game, s: ChapterSnap) => boolean;
  target: (g: Game, s: ChapterSnap) => number;
  label: (target: number, g: Game) => string;
  hint: string;
}

const villain = (g: Game) => g.stats.reputation < -20 || g.stats.karma < -30 || !!g.crew;
const hasArch = (g: Game) => g.relationships.some((r) => r.arch && r.alive);
/** A storyline can still be finished this chapter: one is running, or one is open to start. */
const arcOpen = (g: Game) => !!g.story?.active || availableArcs({ ...g, age: g.age + 9 }).length > 0;

export const CHAPTER_GOALS: GoalDef[] = [
  { id: "smart", metric: "smarts", mode: "gain", target: () => 6, when: (g) => g.stats.smarts <= 88, label: (t) => `Get sharper: Mind +${t}`, hint: "Life ▸ Books, or a seat at school (Work)." },
  { id: "friend", metric: "friends", mode: "gain", target: () => 1, label: () => "Find someone on your side", hint: "People ▸ Meet ▸ make a friend." },
  { id: "mood", metric: "happiness", mode: "atLeast", target: (g) => (g.age >= 60 ? 55 : 60), label: (t) => `End the chapter happy (Joy ${t}+)`, hint: "Rest, time with family, hobbies." },
  { id: "drill", metric: "mastery", mode: "gain", target: () => 2, label: () => "Make the gift obey on purpose", hint: "Gift ▸ Drill. Watch your health." },
  { id: "page", metric: "powers", mode: "gain", target: () => 1, label: () => "Learn a new power", hint: "Gift ▸ Teachers, or braid two you own." },
  { id: "teacher", metric: "heroesMet", mode: "gain", target: () => 1, when: (g) => (g.heroes ?? []).some((h) => !h.met), label: () => "Get a real hero to know your name", hint: "Gift ▸ Teachers ▸ Seek a hero, or patrol." },
  { id: "quietfame", metric: "fame", mode: "atMost", target: (_g, s) => Math.max(25, s.fame + 5), when: (g) => g.traits.includes("secret"), label: (t) => `Keep the mask on: Fame ${t} or less`, hint: "Skip stunts and loud fights." },
  { id: "loudfame", metric: "fame", mode: "gain", target: () => 10, when: (g) => !g.traits.includes("secret") && g.stats.fame <= 70, label: (t) => `Get noticed: Fame +${t}`, hint: "Gift ▸ Stunt, Cases ▸ League calls." },
  { id: "darkkarma", metric: "karma", mode: "drop", target: () => 10, when: (g) => g.traits.includes("vengeful") || g.stats.karma < -10, label: () => "Find out what the bad blocks pay", hint: "Life ▸ Shadow. It costs you." },
  { id: "rank", metric: "rank", mode: "gain", target: () => 1, when: (g) => !villain(g) && g.leagueRank < 6, label: (_t, g) => (g.leagueRank === 0 ? "Make the League roster" : "Climb one League rank"), hint: "Work ▸ League tryout, then Cases." },
  { id: "cushion", metric: "worth", mode: "gain", target: (g) => (g.age >= 40 ? 20000 : 5000), label: (t) => `Build a cushion: +$${t.toLocaleString("en-US")}`, hint: "Work ▸ a job, and promotions." },
  { id: "fortune", metric: "worth", mode: "gain", target: () => 25000, label: (t) => `Leave something behind: +$${t.toLocaleString("en-US")}`, hint: "Work, endorsements, or the other road." },
  { id: "cases", metric: "missions", mode: "gain", target: () => 5, when: (g) => !villain(g), label: (t) => `Close ${t} cases`, hint: "Cases ▸ League calls and Files." },
  { id: "partner", metric: "family", mode: "gain", target: () => 1, label: () => "Let someone in for keeps", hint: "People ▸ Meet ▸ Date, then propose." },
  { id: "family", metric: "family", mode: "atLeast", target: (_g, s) => Math.max(1, s.family), label: () => "Keep your people close", hint: "People ▸ Family ▸ spend time." },
  { id: "infamy", metric: "rep", mode: "drop", target: () => 15, when: villain, label: (t) => `Make the city whisper: Reputation −${t}`, hint: "Life ▸ Shadow, or your crew." },
  { id: "fame", metric: "fame", mode: "gain", target: (_g, s) => (s.fame > 80 ? 3 : 12), when: (g) => g.stats.fame <= 88, label: (t) => `Be the name on the feeds: Fame +${t}`, hint: "Cases, stunts, the League." },
  { id: "arc", metric: "arcs", mode: "gain", target: () => 1, when: arcOpen, label: (_t, g) => (hasArch(g) ? "End the story with your arch-enemy" : "Finish a storyline you started"), hint: "Cases ▸ Files ▸ next step." },
  { id: "trust", metric: "bond", mode: "atLeast", target: (_g, s) => Math.min(95, Math.max(60, s.bond + 10)), when: (g) => (g.heroes ?? []).some((h) => h.met), label: (t) => `Earn a hero's trust (bond ${t}+)`, hint: "Gift ▸ Teachers ▸ train or talk." },
  { id: "mastery", metric: "mastery", mode: "gain", target: () => 6, label: (t) => `Master your craft: +${t} mastery`, hint: "Gift ▸ Drill, and fight with your moves." },
  { id: "standing", metric: "health", mode: "atLeast", target: (g) => (g.age >= 70 ? 35 : 50), label: (t) => `Come out standing (Health ${t}+)`, hint: "Rest, the doctor, fewer drills." },
  { id: "holdrep", metric: "rep", mode: "atLeast", target: (_g, s) => s.rep, label: () => "Hold your reputation through the storm", hint: "Pick fights you can explain." },
  { id: "holdmoney", metric: "worth", mode: "atLeast", target: (_g, s) => Math.max(0, Math.round((s.worth * 0.6) / 1000) * 1000), label: (t) => (t > 0 ? `Don't go broke: keep $${t.toLocaleString("en-US")}+ in cash and property` : "Don't go broke"), hint: "Watch doctor bills and big buys." },
  { id: "legacy", metric: "legacy", mode: "gain", target: (g) => (g.age >= 70 ? 6 : 8), label: (t) => `Build legacy: +${t}`, hint: "Life ▸ Mentor a rookie, teach a hero, raise a family." },
];

// "holdrep" needs a per-hero mode; resolve it here so the table above can stay declarative.
function goalMode(def: GoalDef, g: Game): GoalMode {
  if (def.id === "holdrep") return villain(g) ? "atMost" : "atLeast";
  return def.mode;
}

export function snapshot(g: Game): ChapterSnap {
  const alive = g.relationships.filter((r) => r.alive);
  const met = (g.heroes ?? []).filter((h) => h.met);
  return {
    fame: g.stats.fame,
    rep: g.stats.reputation,
    money: Math.round(g.stats.money),
    worth: Math.round(g.stats.money + holdings(g).value),
    smarts: g.stats.smarts,
    power: g.stats.powerLevel,
    powers: (g.unlockedPowers ?? []).length,
    mastery: Object.values(g.mastery ?? {}).reduce((a, b) => a + b, 0),
    heroesMet: met.length,
    bond: met.reduce((a, h) => Math.max(a, h.relationship), 0),
    arcs: g.story?.cleared?.length ?? 0,
    rank: g.leagueRank,
    missions: g.missions ?? 0,
    legacy: g.legacy ?? 0,
    friends: alive.filter((r) => r.role === "friend" || r.role === "teammate").length,
    family: alive.filter((r) => r.role === "partner" || r.role === "child").length,
    karma: g.stats.karma,
    happiness: g.stats.happiness,
    health: g.stats.health,
  };
}

export function phaseForAge(age: number): PhaseDef {
  let row = CHAPTER_PHASES[0];
  for (const phase of CHAPTER_PHASES) if (age >= phase.from) row = phase;
  return row;
}

export function chapterIndexForAge(age: number): number {
  return Math.floor(Math.max(0, age) / 10);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fingerprint of who this hero is right now. Different heroes, different chapters. */
export function heroFingerprint(g: Game): string {
  const arch = g.relationships.find((r) => r.arch && r.alive);
  return [g.name, g.cityId, g.upbringing, g.traits.join(","), g.giftId ?? g.powerId ?? "none", (g.unlockedPowers ?? []).length, g.leagueRank, Math.sign(g.stats.reputation), arch?.name ?? "", g.crew ? "crew" : ""].join("|");
}

function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

function giftName(g: Game): string {
  const id = g.giftId ?? g.powerId ?? "";
  if (!id) return "Ordinary";
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function threat(g: Game): string {
  const arch = g.relationships.find((r) => r.arch && r.alive);
  if (arch) return arch.note ?? firstName(arch.name);
  if (g.stats.reputation < -20) return "the City";
  return "the Past";
}

function fill(text: string, g: Game): string {
  return text
    .replaceAll("{name}", firstName(g.name))
    .replaceAll("{city}", g.city)
    .replaceAll("{gift}", giftName(g))
    .replaceAll("{threat}", threat(g));
}

const THREAD_LINES: Record<ChapterThread, string> = {
  momentum: "Last decade went right, and momentum is a kind of power too.",
  drift: "Last decade slipped through your fingers. This one has to be on purpose.",
  nemesis: "An old enemy is still out there, and they have been patient.",
  family: "There are people at home now who count the hours you are out.",
  infamy: "Your name opens doors that should stay shut, and closes the rest.",
  body: "Your body has already sent you one warning letter.",
  fame: "Every move you make has an audience now.",
  quiet: "Nobody is watching yet. That is a resource.",
};

/** The personal line: what makes this chapter about THIS hero. */
function personalLine(g: Game, thread: ChapterThread | null): string {
  if (thread) return THREAD_LINES[thread];
  const partner = g.relationships.find((r) => r.role === "partner" && r.alive);
  const kids = g.relationships.filter((r) => r.role === "child" && r.alive).length;
  const mentor = (g.heroes ?? []).filter((h) => h.met).sort((a, b) => b.relationship - a.relationship)[0];
  if (kids) return `${kids === 1 ? "A kid" : `${kids} kids`} at home, learning what you do from how you come back.`;
  if (partner) return `${firstName(partner.name)} knows the schedule and most of the reasons.`;
  if (mentor && mentor.relationship >= 40) return `${mentor.alias} still answers when you call. That matters more than they say.`;
  return UPBRINGING_LINES[g.upbringing] ?? "You are writing this one from scratch.";
}

const UPBRINGING_LINES: Partial<Record<Game["upbringing"], string>> = {
  street: "The street taught you loyalty is a currency. You still count it.",
  wealthy: "Money was always there. Attention never was.",
  tragic: "You learned one name for loss early, and you carry it into every room.",
  military: "You were raised on lights-out and orders. Freedom still feels like a test.",
  foster: "You know a house can end. You build like it might.",
  rural: "You grew up where the streetlights quit early and everyone knew your business.",
  program: "A government file had your name before you could spell it.",
  celebrity: "You were public before you could consent to it.",
  alien: "You were raised somewhere the sky was a different color.",
  isolated: "You grew up far from everyone. People are still a puzzle.",
  legacy: "There is a cape in the family closet, and it casts a shadow.",
  scientific: "Bedtime came with a hypothesis.",
  supportive: "Someone filmed your first flight and cried. You still have the clip.",
  skeptical: "Your family loves you and does not believe the half of it.",
  absent: "You learned the microwave before you learned your parents' schedules.",
  normal: "An ordinary house. The powers still feel like a theft from a normal life.",
};

function threadFrom(g: Game, prev: Chapter | undefined): ChapterThread | null {
  if (prev?.recap) return prev.recap.thread;
  return null;
}

/** Build the chapter that starts at this age. Pure and deterministic for a given hero state. */
export function buildChapter(g: Game, prev?: Chapter): Chapter {
  const index = chapterIndexForAge(g.age);
  const phase = phaseForAge(g.age);
  const rand = seeded(hash(`${heroFingerprint(g)}#${index}#${g.rng}`));
  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length) % list.length];
  const snap = snapshot(g);
  const thread = threadFrom(g, prev);

  const pool = phase.goals
    .map((id) => CHAPTER_GOALS.find((goal) => goal.id === id))
    .filter((goal): goal is GoalDef => !!goal && (!goal.when || goal.when(g, snap)));
  // Shuffle deterministically, then keep 3 with distinct metrics.
  const shuffled = pool.map((goal) => ({ goal, k: rand() })).sort((a, b) => a.k - b.k).map((row) => row.goal);
  if (thread === "drift" && !shuffled.some((goal) => goal.id === "mood")) shuffled.unshift(CHAPTER_GOALS.find((goal) => goal.id === "mood")!);
  if (thread === "body" && !shuffled.some((goal) => goal.id === "standing")) shuffled.unshift(CHAPTER_GOALS.find((goal) => goal.id === "standing")!);
  const chosen: GoalDef[] = [];
  for (const goal of shuffled) {
    if (chosen.length >= 3) break;
    if (chosen.some((c) => c.metric === goal.metric)) continue;
    chosen.push(goal);
  }
  const goals: ChapterGoal[] = chosen.map((def) => {
    const mode = goalMode(def, g);
    const target = def.target(g, snap);
    return { id: def.id, label: def.label(target, g), hint: def.hint, metric: def.metric, mode, target, start: snap[def.metric] };
  });

  const used = new Set((g.chapters ?? []).map((c) => c.title));
  // Don't name a gift the hero has not manifested yet.
  const titles = phase.titles.filter((t) => g.powerId || !t.includes("{gift}"));
  const fresh = titles.map((t) => fill(t, g)).filter((t) => !used.has(t));
  const title = fresh.length ? pick(fresh) : `${fill(pick(titles), g)}, Again`;
  const premise = `${fill(pick(phase.openers), g)} ${personalLine(g, thread)}`;
  const beats = goals.map((goal) => goal.hint);
  return {
    index,
    phase: phase.id,
    startAge: g.age,
    endAge: index * 10 + 9,
    title,
    premise,
    beats,
    goals,
    source: "procedural",
  };
}

export function goalProgress(goal: ChapterGoal, snap: ChapterSnap): { value: number; ratio: number; met: boolean } {
  const now = snap[goal.metric];
  switch (goal.mode) {
    case "gain": {
      const value = now - goal.start;
      return { value, ratio: clamp(value / Math.max(1, goal.target), 0, 1), met: value >= goal.target };
    }
    case "drop": {
      const value = goal.start - now;
      return { value, ratio: clamp(value / Math.max(1, goal.target), 0, 1), met: value >= goal.target };
    }
    case "atLeast":
      return { value: now, ratio: clamp(now / Math.max(1, goal.target), 0, 1), met: now >= goal.target };
    case "atMost":
      return { value: now, ratio: now <= goal.target ? 1 : 0, met: now <= goal.target };
  }
}

export function currentChapter(g: Game): Chapter | null {
  const list = g.chapters ?? [];
  return list.length ? list[list.length - 1] : null;
}

/** Close the running chapter: score goals, pay out or charge, and pick the thread for the next one. */
export function closeChapter(g: Game): ChapterRecap | null {
  const chapter = currentChapter(g);
  if (!chapter || chapter.recap) return null;
  const snap = snapshot(g);
  const lines: string[] = [];
  let met = 0;
  for (const goal of chapter.goals) {
    const { met: ok } = goalProgress(goal, snap);
    goal.done = ok;
    if (ok) met++;
    lines.push(`${ok ? "✓" : "✗"} ${goal.label}`);
  }
  const total = chapter.goals.length;
  let legacyGain = met * 3;
  let consequence: string;
  if (met === total) {
    legacyGain += 4;
    g.stats.happiness = clamp(g.stats.happiness + 6, 0, 100);
    g.stats.powerLevel = Math.round((g.stats.powerLevel + 0.1) * 100) / 100;
    consequence = "A clean chapter. Joy +6, power +0.1, legacy +" + legacyGain + ".";
  } else if (met === 0) {
    g.stats.happiness = clamp(g.stats.happiness - 6, 0, 100);
    consequence = "A lost decade. Joy −6. The next chapter starts with something to prove.";
  } else {
    g.stats.happiness = clamp(g.stats.happiness + 2, 0, 100);
    consequence = `Some of it landed. Joy +2, legacy +${legacyGain}.`;
  }
  g.legacy = (g.legacy ?? 0) + legacyGain;

  // Candidate threads in priority order; skip the one the last chapter already used so decades vary.
  const lastThread = (g.chapters ?? []).filter((c) => c.recap && c !== chapter).slice(-1)[0]?.recap?.thread;
  const candidates: ChapterThread[] = [];
  if (met === 0) candidates.push("drift");
  if ((g.flags.collapses ?? 0) > 0 && (g.flags.critical ?? 0) > 0) candidates.push("body");
  if (met === total) candidates.push("momentum");
  if (g.relationships.some((r) => r.arch && r.alive)) candidates.push("nemesis");
  if (g.stats.reputation <= -30) candidates.push("infamy");
  if (g.relationships.some((r) => (r.role === "child" || r.role === "partner") && r.alive)) candidates.push("family");
  if (g.stats.fame >= 60) candidates.push("fame");
  candidates.push("quiet");
  const thread = candidates.find((t) => t !== lastThread || t === "drift") ?? "quiet";

  const recap: ChapterRecap = { met, total, lines, consequence, legacyGain, thread };
  chapter.recap = recap;
  return recap;
}

/** Start the chapter for the current age (call at birth and on each decade birthday). */
export function openChapter(g: Game): Chapter {
  const prev = currentChapter(g) ?? undefined;
  const chapter = buildChapter(g, prev);
  g.chapters = [...(g.chapters ?? []), chapter];
  g.chapterNotice = { open: chapter.index, recap: prev?.recap ? prev.index : null };
  return chapter;
}

/** Decade boundary: close the old chapter and open the next. Returns true when a turn happened. */
export function turnChapter(g: Game): boolean {
  const current = currentChapter(g);
  const index = chapterIndexForAge(g.age);
  if (current && current.index >= index) return false;
  if (current) closeChapter(g);
  openChapter(g);
  return true;
}

/** Old saves: give them a running chapter for their current decade, no notice spam. */
export function migrateChapters(g: Game): Game {
  if (typeof g.legacy !== "number") g.legacy = 0;
  if (!Array.isArray(g.chapters)) g.chapters = [];
  if (g.chapterNotice === undefined) g.chapterNotice = null;
  if (!g.chapters.length && g.phase !== "dead") {
    const chapter = buildChapter(g);
    g.chapters = [chapter];
    g.chapterNotice = { open: chapter.index, recap: null };
  }
  return g;
}

/** Text shape the AI pass is allowed to replace. */
export interface ChapterText {
  title: string;
  premise: string;
  beats: string[];
}

/** Strict validation for AI output: wrong shape, wrong lengths, or markup → rejected. */
export function validChapterText(value: unknown, beatCount: number): ChapterText | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const ok = (s: unknown, min: number, max: number) => typeof s === "string" && s.trim().length >= min && s.trim().length <= max && !/[<>{}]/.test(s);
  if (!ok(v.title, 3, 48) || !ok(v.premise, 40, 420)) return null;
  if (!Array.isArray(v.beats) || v.beats.length !== beatCount || !v.beats.every((b) => ok(b, 6, 140))) return null;
  return { title: (v.title as string).trim(), premise: (v.premise as string).trim(), beats: (v.beats as string[]).map((b) => b.trim()) };
}

export function applyChapterText(g: Game, index: number, text: ChapterText | null): Game {
  const chapter = (g.chapters ?? []).find((c) => c.index === index);
  if (!chapter) return g;
  chapter.aiTried = true;
  if (text) {
    chapter.title = text.title;
    chapter.premise = text.premise;
    chapter.beats = text.beats;
    chapter.source = "ai";
  }
  return g;
}

/** Compact, non-identifying brief for the AI pass. */
export function chapterBrief(g: Game, chapter: Chapter) {
  return {
    hero: firstName(g.name),
    age: chapter.startAge,
    city: g.city,
    phase: phaseForAge(chapter.startAge).name,
    upbringing: g.upbringing,
    traits: g.traits.slice(0, 4),
    gift: giftName(g),
    powers: (g.unlockedPowers ?? []).length,
    leagueRank: g.leagueRank,
    reputation: g.stats.reputation,
    fame: g.stats.fame,
    arch: threat(g),
    recent: g.history.slice(-5).map((h) => h.text).join(" ").slice(0, 400),
    draft: { title: chapter.title, premise: chapter.premise, beats: chapter.beats },
    goals: chapter.goals.map((goal) => goal.label),
  };
}
