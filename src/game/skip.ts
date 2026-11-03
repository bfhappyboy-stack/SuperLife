/**
 * Fast-forward (2026-11-01 age-up pass). Plays your usual month for you, a season or a year at a time,
 * and stops the moment the life needs you: the power reveal, a story beat, a new chapter, a case, a fight,
 * any choice event, low health or a relationship in crisis.
 *
 * Balance rule: a skipped month is never better than a played one. It only uses everyday actions, plays
 * their minis a little under your own average, skips the fights and stunts you would pick yourself, and
 * lets ordinary weeks pass quietly (fewer small events, good and bad).
 */
import { act, actionsFor, ageUp, choose, focusId, resolveMini } from "./engine";
import { getPower } from "./combo";
import { masteryLevel, powerRank } from "./mastery";
import { firstName } from "./format";
import type { Game, Habits, Person, SkipReport, SkipSpan, SkipStopKind } from "./types";

export const SKIP_LOW_HEALTH = 25;
/** Auto-play stops drilling below this much health (drills cost health). */
export const SKIP_TRAIN_FLOOR = 40;
export const SKIP_BOND_FLOOR = 20;
/** Auto-played minis land this far under your own rolling average. */
export const SKIP_MINI_TAX = 0.08;
export const SKIP_MINI_RANGE = [0.3, 0.72] as const;

/** Everyday actions fast-forward is allowed to play. Fights, stunts, crime, tryouts and moves stay yours. */
const ROUTINE = ["train", "omen", "class", "shift", "books", "gym", "hobby", "volunteer", "confide", "befriend", "city-walk"] as const;
const SUBCHOICE_DEFAULT: Record<string, string> = { gym: "lift", books: "library", hobby: "music", volunteer: "tutor", out: "quiet" };
const SAFE_ROLES = new Set<Person["role"]>(["parent", "partner", "child", "friend", "teammate"]);
const CRISIS_ROLES = new Set<Person["role"]>(["parent", "partner", "child"]);

export function habitsOf(g: Game): Habits {
  const h = g.habits;
  return { acts: { ...(h?.acts ?? {}) }, picks: { ...(h?.picks ?? {}) }, mini: typeof h?.mini === "number" ? h.mini : 0.55 };
}

/** Record a manual action (only when it actually did something). Recent actions weigh more. */
export function noteAct(before: Game, after: Game, id: string): Game {
  if (after === before || after.phase === "dead") return after;
  const moved = after.majorsLeft !== before.majorsLeft || after.phase !== before.phase;
  if (!moved) return after;
  const key = id.startsWith("time:") ? id : id.split("|")[0]!;
  if (!(ROUTINE as readonly string[]).includes(key) && !key.startsWith("time:")) return after;
  const h = habitsOf(after);
  for (const k of Object.keys(h.acts)) {
    h.acts[k] = Math.round(h.acts[k]! * 0.94 * 1000) / 1000;
    if (h.acts[k]! < 0.05) delete h.acts[k];
  }
  h.acts[key] = Math.min(12, (h.acts[key] ?? 0) + 1);
  after.habits = h;
  return after;
}

/** Remember which way you took an everyday action's follow-up (Gym: lift, run or bout). */
export function notePick(before: Game, after: Game, choiceId: string): Game {
  const pid = before.pending?.id;
  if (!pid || after === before || !(pid in SUBCHOICE_DEFAULT)) return after;
  const h = habitsOf(after);
  h.picks[pid] = choiceId;
  after.habits = h;
  return after;
}

export function noteMini(after: Game, ratio: number): Game {
  const h = habitsOf(after);
  h.mini = Math.round((h.mini * 0.8 + Math.max(0, Math.min(1, ratio)) * 0.2) * 1000) / 1000;
  after.habits = h;
  return after;
}

export function autoRatio(g: Game): number {
  const [lo, hi] = SKIP_MINI_RANGE;
  return Math.max(lo, Math.min(hi, habitsOf(g).mini - SKIP_MINI_TAX));
}

function defaultWeight(g: Game, id: string): number {
  const job = !!g.jobId;
  switch (id) {
    case "train": return g.stats.health < SKIP_TRAIN_FLOOR ? 0 : 3;
    case "omen": return 3.2;
    case "class": return 2.6;
    case "shift": return job ? 2.2 : 0;
    case "books": return (g.age < 18 ? 2.2 : 1.4) * (g.stats.smarts >= 90 ? 0.4 : 1);
    case "gym": return 1.6;
    case "confide": return g.stats.parentBelief < 70 ? 1.4 : 0.3;
    // A sensible player keeps their joy up: the lower it sits, the sooner the hobby comes out.
    case "hobby": return g.stats.happiness < 45 ? 4 : g.stats.happiness < 65 ? 2.8 : 1;
    case "volunteer": return 0.9;
    case "befriend": return 0.8;
    case "city-walk": return 0.5;
    default: return 0;
  }
}

function timeWeight(g: Game, id: string): number {
  const person = g.relationships.find((r) => `time:${r.id}` === id);
  if (!person || !person.alive || !SAFE_ROLES.has(person.role)) return 0;
  const low = person.closeness < 45 ? 1 : 0;
  return (person.role === "partner" ? 1.6 : person.role === "parent" && g.age < 18 ? 1.2 : 0.8) + low;
}

/** Each repeat inside the same month costs this much plan score, so a month mixes things up like a person would. */
export const SKIP_REPEAT_COST = 1.6;

/** The plan for this month: everyday actions you can do now, your recent habits first. */
export function monthPlan(g: Game, used: Record<string, number> = {}): { id: string; label: string }[] {
  const h = habitsOf(g);
  const rows = actionsFor(g)
    .filter((a) => !a.disabled && ((ROUTINE as readonly string[]).includes(a.id) || a.id.startsWith("time:")))
    .map((a) => {
      const base = a.id.startsWith("time:") ? timeWeight(g, a.id) : defaultWeight(g, a.id);
      const label = a.id.startsWith("time:") ? `Time with ${firstName(g.relationships.find((r) => `time:${r.id}` === a.id)?.name ?? "family")}` : a.label;
      const score = base > 0 ? base + (h.acts[a.id] ?? 0) * 0.7 - (used[a.id] ?? 0) * SKIP_REPEAT_COST : 0;
      return { id: a.id, label, score: base > 0 ? Math.max(0.01, score) : 0 };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return rows.map(({ id, label }) => ({ id, label }));
}

function liveish(g: Game): boolean {
  return g.phase === "live" && !g.reveal;
}

/** The sensible default for an everyday follow-up when you have no habit yet. Low joy picks the gentler option. */
function subDefault(g: Game, pid: string): string {
  if (pid === "books" && g.stats.happiness < 55) return "comics";
  return SUBCHOICE_DEFAULT[pid]!;
}

/** Try one everyday action and play its follow-up the way you usually do. Null if it would need you. */
function tryAction(g: Game, id: string, ratio?: number): Game | null {
  let n = act(g, id);
  if (n === g) return null;
  for (let i = 0; i < 3 && n.phase === "choice" && n.pending && n.pending.id in SUBCHOICE_DEFAULT; i++) {
    const pid = n.pending.id;
    const want = habitsOf(g).picks[pid];
    const choices = n.pending.choices.map((c) => c.id);
    const fallback = subDefault(n, pid);
    const pick = want && choices.includes(want) ? want : choices.includes(fallback) ? fallback : choices[0]!;
    n = choose(n, pick);
  }
  if (n.phase === "mini" && n.minigame) {
    // Fights, tryouts, missions and relic runs are yours to play. Everything else gets your usual effort.
    if (n.minigame.kind === "duel" || n.minigame.tag) return null;
    n = resolveMini(n, ratio ?? autoRatio(g));
  }
  return n;
}

const STAT_ROWS: { key: keyof Game["stats"]; label: string }[] = [
  { key: "powerLevel", label: "Power" },
  { key: "health", label: "Health" },
  { key: "happiness", label: "Joy" },
  { key: "smarts", label: "Mind" },
  { key: "looks", label: "Looks" },
  { key: "fame", label: "Fame" },
  { key: "reputation", label: "Rep" },
  { key: "karma", label: "Karma" },
  { key: "parentBelief", label: "Belief" },
  { key: "money", label: "Money" },
];

export function stopFor(before: Game, after: Game, first: boolean): { kind: SkipStopKind; text: string } | null {
  if (after.phase === "dead") return { kind: "death", text: after.death?.cause ?? "The life ends here." };
  if (after.reveal && !before.reveal) return { kind: "reveal", text: "Your power is waking up." };
  if (after.chapterNotice && JSON.stringify(after.chapterNotice) !== JSON.stringify(before.chapterNotice ?? null)) {
    const ch = after.chapters?.find((c) => c.index === after.chapterNotice?.open);
    return { kind: "chapter", text: ch ? `Chapter ${ch.index + 1} begins: ${ch.title}.` : "A new chapter begins." };
  }
  if (after.phase === "choice" && after.pending) {
    const id = after.pending.id;
    const kind: SkipStopKind = id.startsWith("canon|") ? "story" : /case|arc|arch|enc|villain|hero/.test(id) ? "case" : "event";
    return { kind, text: after.pending.prompt };
  }
  if (after.phase === "mini" && after.minigame) return { kind: after.minigame.kind === "duel" ? "fight" : "event", text: after.minigame.title };
  for (const person of before.relationships) {
    if (!person.alive || !SAFE_ROLES.has(person.role)) continue;
    const now = after.relationships.find((r) => r.id === person.id);
    if (now && !now.alive) return { kind: "bond", text: `${person.name} is gone.` };
    if (now && CRISIS_ROLES.has(person.role) && person.closeness >= SKIP_BOND_FLOOR && now.closeness < SKIP_BOND_FLOOR) {
      return { kind: "bond", text: `Things with ${firstName(person.name)} are close to breaking (${now.closeness}).` };
    }
  }
  const h = after.stats.health;
  if (h < SKIP_LOW_HEALTH && (first || before.stats.health >= SKIP_LOW_HEALTH)) return { kind: "health", text: `Health is down to ${h}. Rest or see a doctor.` };
  return null;
}

/** Spend this month's moves on your everyday plan. Stops (returns a stop) if something needs you. */
export function playMonth(g: Game, did: Map<string, { label: string; count: number }> = new Map(), ratio?: number): { g: Game; stop: ReturnType<typeof stopFor> } {
  let cur = g;
  // Rest is free once a month; take it when worn down, like a careful player would.
  if (cur.stats.health < 70 && !cur.flags.rested) {
    const n = act(cur, "rest");
    if (n !== cur && liveish(n)) cur = n;
  }
  const tried = new Set<string>();
  const used: Record<string, number> = {};
  for (let guard = 0; guard < 8 && cur.majorsLeft > 0 && liveish(cur); guard++) {
    const plan = monthPlan(cur, used).filter((row) => !tried.has(row.id));
    const next = plan[0];
    if (!next) break;
    const n = tryAction(cur, next.id, ratio);
    // Keep doing what works (players repeat their best action); drop it once it stops taking a move.
    if (!n || n.majorsLeft >= cur.majorsLeft) tried.add(next.id);
    if (!n) continue;
    used[next.id] = (used[next.id] ?? 0) + 1;
    const stop = stopFor(cur, n, false);
    const row = did.get(next.id) ?? { label: next.label, count: 0 };
    row.count += 1;
    did.set(next.id, row);
    cur = n;
    if (stop) return { g: cur, stop };
  }
  return { g: cur, stop: null };
}

export function skipMonths(g: Game, span: SkipSpan): number {
  return span === "season" ? 3 : 12 - (g.month ?? 0);
}

export function fastForward(game: Game, span: SkipSpan): Game {
  if (game.phase !== "live" || game.reveal) return game;
  const start = structuredClone(game);
  start.skipReport = null;
  const months = skipMonths(start, span);
  const did = new Map<string, { label: string; count: number }>();
  const notes: string[] = [];
  const seen = new Set<string>();
  const note = (line: string) => {
    const t = line.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    notes.push(t);
  };
  let g = start;
  let stop: SkipReport["stop"] = null;
  let passed = 0;
  for (let m = 0; m < months; m++) {
    const played = playMonth(g, did);
    g = played.g;
    if (played.stop) {
      stop = played.stop;
      break;
    }
    const before = g;
    const historyAt = before.history?.length ?? 0;
    g = ageUp(before, { quiet: true });
    passed += 1;
    for (const line of g.card?.banner ?? []) note(line);
    for (const entry of (g.history ?? []).slice(historyAt)) if (entry.tag === "major") note(entry.text);
    stop = stopFor(before, g, m === 0);
    if (stop) break;
  }
  g.skipReport = buildReport(start, g, span, passed, months, did, notes, stop);
  return g;
}

function buildReport(start: Game, end: Game, span: SkipSpan, months: number, planned: number, did: Map<string, { label: string; count: number }>, notes: string[], stop: SkipReport["stop"]): SkipReport {
  const stats = STAT_ROWS.map(({ key, label }) => ({ stat: key, label, amount: Math.round(((end.stats[key] ?? 0) - (start.stats[key] ?? 0)) * 100) / 100 })).filter((row) => Math.abs(row.amount) >= (row.stat === "powerLevel" ? 0.01 : 1));
  const ranks: SkipReport["ranks"] = [];
  for (const id of end.unlockedPowers ?? []) {
    const power = getPower(id);
    if (!power) continue;
    const had = (start.unlockedPowers ?? []).includes(id);
    const from = had ? masteryLevel(start.mastery?.[id] ?? 0, power.generation) : 0;
    const to = masteryLevel(end.mastery?.[id] ?? 0, power.generation);
    if (!had) notes.unshift(`New power: ${power.name}.`);
    else if (to > from) ranks.push({ name: power.name, from: powerRank(from), to: powerRank(to) });
  }
  const focus = getPower(focusId(end));
  if (focus && !ranks.some((r) => r.name === focus.name) && ranks.length === 0) {
    const lvl = masteryLevel(end.mastery?.[focus.id] ?? 0, focus.generation);
    const was = masteryLevel(start.mastery?.[focus.id] ?? 0, focus.generation);
    if (lvl !== was) ranks.push({ name: focus.name, from: powerRank(was), to: powerRank(lvl) });
  }
  return {
    span,
    months,
    planned,
    from: { age: start.age, month: start.month },
    to: { age: end.age, month: end.month },
    stats,
    ranks,
    did: [...did.entries()].map(([id, row]) => ({ id, label: row.label, count: row.count })).sort((a, b) => b.count - a.count),
    notes: notes.slice(0, 6),
    stop,
  };
}

export function dismissSkip(game: Game): Game {
  if (!game.skipReport) return game;
  return { ...game, skipReport: null };
}
