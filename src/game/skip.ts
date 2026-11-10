/**
 * Fast-forward (2026-11-01 age-up pass). Plays your usual month for you, a season or a year at a time,
 * and stops the moment the life needs you: the power reveal, a story beat, a new chapter, a case, a fight,
 * any choice event, low health or a relationship in crisis.
 *
 * Balance rule: a skipped month is never better than a played one. It only uses everyday actions, plays
 * their minis a little under your own average, skips the fights and stunts you would pick yourself, and
 * lets ordinary weeks pass quietly (fewer small events, good and bad).
 */
import { act, actionsFor, ageUp, choose, focusId, isChatter, resolveMini } from "./engine";
import { getPower } from "./combo";
import { econOf } from "./economy";
import { masteryLevel, powerRank } from "./mastery";
import { firstName } from "./format";
import { MIX_AGE } from "./mentors";
import type { Game, Habits, Person, SkipReport, SkipSpan, SkipStopKind } from "./types";

export const SKIP_LOW_HEALTH = 25;
/** Auto-play stops drilling below this much health (drills cost health). */
export const SKIP_TRAIN_FLOOR = 40;
export const SKIP_BOND_FLOOR = 20;
/** Auto-played minis land this far under your own rolling average. */
export const SKIP_MINI_TAX = 0.08;
export const SKIP_MINI_RANGE = [0.3, 0.72] as const;

/** Everyday actions fast-forward is allowed to play. Fights, stunts, crime, tryouts and moves stay yours. */
export const ROUTINE = ["train", "omen", "class", "shift", "books", "gym", "hobby", "volunteer", "confide", "befriend", "city-walk"] as const;
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
      const pinned = (g.routine ?? []).indexOf(a.id);
      const natural = a.id.startsWith("time:") ? timeWeight(g, a.id) : defaultWeight(g, a.id);
      // Your routine comes first, in your order; everything else is a quiet fallback.
      // (Training still waits when you're worn down.)
      const base = pinned >= 0 ? (a.id === "train" && g.stats.health < SKIP_TRAIN_FLOOR ? 0 : 12 - pinned * 2.5) : (g.routine?.length ? natural * 0.35 : natural);
      const label = a.id.startsWith("time:") ? `Time with ${firstName(g.relationships.find((r) => `time:${r.id}` === a.id)?.name ?? "family")}` : a.label;
      const score = base > 0 ? base + (h.acts[a.id] ?? 0) * 0.7 - (used[a.id] ?? 0) * SKIP_REPEAT_COST : 0;
      return { id: a.id, label, score: base > 0 ? Math.max(0.01, score) : 0 };
    })
    .filter((row) => row.score > 0);
  // A pinned shift at your own business (Life Flow routine slot; not an everyday action in the list).
  (g.routine ?? []).forEach((id, pinned) => {
    if (!id.startsWith("econ|biz|shift|")) return;
    const biz = econOf(g)?.biz?.find((b) => b.uid === id.split("|")[3] && b.cityId === g.cityId);
    if (!biz || g.majorsLeft <= 0) return;
    rows.push({ id, label: `Shift at ${biz.name}`, score: Math.max(0.01, 12 - pinned * 2.5 - (used[id] ?? 0) * SKIP_REPEAT_COST) });
  });
  rows.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
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
  // Money actions answer "not now" with a banner instead of refusing; only a spent block counts.
  if (id.startsWith("econ|") && n.majorsLeft >= g.majorsLeft) return null;
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
  if (after.mentor && !before.mentor) {
    return { kind: "mentor", text: `You're ${after.age}. Power mixing is open, and a mentor is waiting in the Powers tab.` };
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
  if (span === "fifteen") return Math.max(0, (MIX_AGE - g.age) * 12 - (g.month ?? 0));
  return span === "season" ? 3 : 12 - (g.month ?? 0);
}

/** "Skip to 15" is offered while mixing is still locked and at least a season away. */
export function canSkipToFifteen(g: Game): boolean {
  return g.phase === "live" && !g.reveal && g.age < MIX_AGE && skipMonths(g, "fifteen") >= 3;
}

const STAT_TASTE: Partial<Record<keyof Game["stats"], number>> = { happiness: 1, health: 1, smarts: 0.7, parentBelief: 0.5, karma: 0.4, reputation: 0.3, looks: 0.2, fame: 0.2 };

function tasteOf(before: Game, after: Game): number {
  let score = 0;
  for (const [key, w] of Object.entries(STAT_TASTE) as [keyof Game["stats"], number][]) score += ((after.stats[key] ?? 0) - (before.stats[key] ?? 0)) * w;
  score += ((after.stats.money ?? 0) - (before.stats.money ?? 0)) / 2000;
  score += ((after.stats.powerLevel ?? 0) - (before.stats.powerLevel ?? 0)) * 20;
  return score;
}

/**
 * Skip to 15 only: settle a small everyday moment (a choice event or a quick event mini) the way a
 * sensible kid would, so childhood isn't twenty taps of pigeons and birthday cake. Returns null for
 * anything that matters (fights, tagged minis, canon, cases) so the skip still stops for those.
 */
export function settleSmall(g: Game): { g: Game; line: string } | null {
  if (g.phase === "mini" && g.minigame) {
    if (g.minigame.kind === "duel" || g.minigame.tag) return null;
    const n = resolveMini(g, autoRatio(g));
    return n === g ? null : { g: n, line: `${g.minigame.title}: handled.` };
  }
  if (g.phase !== "choice" || !g.pending) return null;
  const id = g.pending.id;
  // Canon beats, villain cases and story arcs always stop. Friendly hero drop-ins and an arch's monthly
  // taunt are settled only when there is a no-fight answer (any fight still stops the skip).
  const chatter = /^hero-/.test(id) || id === "arch-month" || id === "arch-billboard";
  if (id.startsWith("canon|") || (!chatter && /case|arc|arch|enc|villain|hero/.test(id))) return null;
  let best: { g: Game; label: string; score: number } | null = null;
  for (const choice of g.pending.choices) {
    let n = choose(g, choice.id);
    if (n === g) continue;
    if (n.phase === "mini" && n.minigame) {
      if (n.minigame.kind === "duel" || n.minigame.tag) continue;
      n = resolveMini(n, autoRatio(g));
    }
    if (n.phase === "dead" || n.phase === "choice" || n.phase === "mini") continue;
    // Meeting a hero is worth more than a stat point: they teach the powers you braid at 15.
    const met = (n.heroes ?? []).filter((h) => h.met).length - (g.heroes ?? []).filter((h) => h.met).length;
    const score = tasteOf(g, n) + met * 4;
    if (!best || score > best.score) best = { g: n, label: choice.label, score };
  }
  if (!best) return null;
  const prompt = g.pending.prompt.replace(/\s+/g, " ").trim();
  const short = prompt.length > 60 ? `${prompt.slice(0, 57).trimEnd()}…` : prompt;
  return { g: best.g, line: `${short} → ${best.label}` };
}

/**
 * Adult Life Flow (owner's call, 2026-11-10 eve: "make it interrupt less"). Play keeps stopping for what truly
 * needs you (canon beats, cases and story arcs, power moments, big life offers, a boss, your arch-enemy once a
 * year, a fight you could lose) and settles the rest the way you'd likely play it, listed on the recap.
 */
/** Adult events that always stop: offers that change a life, and moments with people. */
export const BIG_EVENTS = new Set([
  "lab-offer", "villain-offer", "villain-gala", "sidekick-pitch", "shoulder-tap", "rival-school", "interview", "mentor-fight", "trainer-lesson",
  "trainer-roof", "oath-roof", "nemesis-text", "year-power", "relic-run", "relic-crater", "relic-subway", "kid-spark", "spark-menu", "meteor",
]);
/** Power gap at which a street fight is a sure thing (the recap says you handled it). */
export const OUTCLASS_GAP = 1.5;
/** Your arch-enemy's monthly call stops Play at most once a year; the other months you leave them on read. */
export const ARCH_STOP_EVERY = 12;
const ARCH_FLAG = "flow:archStop";

const at = (g: Game) => g.age * 12 + (g.month ?? 0);

/** Is Auto fights on? Only when the player switched it on themselves (opt-in, owner's call 2026-11-10 late). */
export function autoFightsOn(g: Pick<Game, "autoFights" | "autoFightsSet">): boolean {
  return g.autoFights === true && g.autoFightsSet === true;
}

/**
 * A street fight Play can settle, only with Auto fights on: an outclassed foe ("sure") or one you're about even
 * with ("auto"). Bosses and tougher foes always stop. With Auto fights off every fight stops for you.
 */
function routineFight(g: Game, mini: Game["minigame"]): "sure" | "auto" | null {
  if (!autoFightsOn(g)) return null;
  if (!mini || mini.kind !== "duel" || mini.tag !== "duel" || !mini.duel || mini.duel.boss) return null;
  const gap = g.stats.powerLevel - (mini.duel.foeLevel ?? 99);
  if (gap >= OUTCLASS_GAP) return "sure";
  return gap >= -0.5 ? "auto" : null;
}

/** The score Auto-resolve settles a fight at: a little under your usual, but a foe you outclass is a clean win. */
export function autoResolveRatio(g: Game): number {
  const d = g.minigame?.duel;
  const gap = d ? g.stats.powerLevel - (d.foeLevel ?? 99) : -99;
  return !d?.boss && gap >= OUTCLASS_GAP ? Math.max(autoRatio(g), 0.7) : autoRatio(g);
}

/** What Auto-resolve would likely give, for the fight card ("Likely a win"). Edges from gear and home can lift it. */
export function autoResolveOdds(g: Game): "win" | "scrape" | "loss" {
  const r = autoResolveRatio(g);
  return r >= 0.66 ? "win" : r >= 0.33 ? "scrape" : "loss";
}

/** Fight card ▸ Auto-resolve: settle the fight now at the auto score. Doesn't count toward your fighting habit. */
export function autoResolveFight(g: Game): Game {
  if (g.phase !== "mini" || g.minigame?.kind !== "duel") return g;
  const foe = g.minigame.duel?.foeName ?? g.minigame.title;
  const n = resolveMini(g, autoResolveRatio(g));
  if (n !== g && n.card) n.card = { ...n.card, body: `Auto-resolved: ${foe}. ${n.card.body}` };
  return n;
}

export function settleAdult(g: Game): { g: Game; line: string; fight?: boolean } | null {
  if (g.phase !== "choice" || !g.pending) return null;
  const id = g.pending.id;
  if (id.startsWith("canon|") || /case|arc(?!h)/.test(id) || BIG_EVENTS.has(id) || id.startsWith("grief-") || id.startsWith("slip-")) return null;
  // Your arch-enemy: a real fight once a year; the other calls go unanswered.
  if (id === "arch-month") {
    const last = g.flags[ARCH_FLAG];
    if (last === undefined || at(g) - last >= ARCH_STOP_EVERY) {
      g.flags[ARCH_FLAG] = at(g);
      return null;
    }
    const n = choose(g, "skip");
    return n === g || n.phase !== "live" ? null : { g: n, line: `${g.pending.prompt.split(/[.!?]/)[0]!.slice(0, 50)} → left on read` };
  }
  const prompt = g.pending.prompt.replace(/\s+/g, " ").trim();
  const short = prompt.length > 60 ? `${prompt.slice(0, 57).trimEnd()}…` : prompt;
  // Street villains: fight it out in the recap when it's routine, else stop for you.
  if (id.startsWith("villain-p")) {
    const fought = choose(g, "fight");
    const how = fought.phase === "mini" ? routineFight(g, fought.minigame) : null;
    if (!how) return null;
    const ratio = how === "sure" ? Math.max(autoRatio(g), 0.7) : autoRatio(g);
    const n = resolveMini(fought, ratio);
    if (n.phase !== "live") return null;
    const res = ratio >= 0.66 ? "won" : ratio >= 0.33 ? "a draw" : "lost";
    return { g: n, line: `Street fight: ${fought.minigame!.duel!.foeName} (${res})`, fight: true };
  }
  const chatter = /^hero-/.test(id) || id === "arch-billboard";
  if (!chatter && /arch|enc|villain|hero/.test(id)) return null;
  let best: { g: Game; label: string; score: number } | null = null;
  for (const choice of g.pending.choices) {
    let n = choose(g, choice.id);
    if (n === g) continue;
    if (n.phase === "mini" && n.minigame) {
      if (n.minigame.kind === "duel" || n.minigame.tag) continue;
      n = resolveMini(n, autoRatio(g));
    }
    if (n.phase === "dead" || n.phase === "choice" || n.phase === "mini") continue;
    const score = tasteOf(g, n);
    if (!best || score > best.score) best = { g: n, label: choice.label, score };
  }
  if (!best) return null;
  return { g: best.g, line: `${short} → ${best.label}` };
}

export function fastForward(game: Game, span: SkipSpan, opts: { settle?: boolean | "adult" } = {}): Game {
  if (game.phase !== "live" || game.reveal) return game;
  const start = structuredClone(game);
  start.skipReport = null;
  const months = skipMonths(start, span);
  const did = new Map<string, { label: string; count: number }>();
  const notes: string[] = [];
  const chatter: string[] = [];
  const seen = new Set<string>();
  const note = (line: string) => {
    const t = line.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    // Rival capes' ticker lines go last, so the summary leads with your own life.
    (isChatter(t) ? chatter : notes).push(t);
  };
  let g = start;
  let stop: SkipReport["stop"] = null;
  let passed = 0;
  // Skip to 15 (and childhood Play steps) settle small everyday moments for you.
  const fifteen = span === "fifteen" || opts.settle === true;
  const adult = opts.settle === "adult";
  let handled = 0;
  let fights = 0;
  // Skip to 15 settles small everyday moments for you; anything bigger still stops the skip.
  const settle = (cur: Game, why: SkipReport["stop"]): Game | null => {
    if ((!fifteen && !adult) || !why || (why.kind !== "event" && why.kind !== "case" && why.kind !== "story")) return null;
    if (fifteen && why.kind === "story") return null;
    const done = adult ? settleAdult(cur) : settleSmall(cur);
    if (!done) return null;
    if ("fight" in done && done.fight) fights += 1;
    else handled += 1;
    if (handled + fights <= 4) note(done.line);
    return done.g;
  };
  outer: for (let m = 0; m < months; m++) {
    for (let tries = 0; ; tries++) {
      const played = playMonth(g, did);
      g = played.g;
      if (!played.stop) break;
      const next = tries < (adult ? 8 : 4) ? settle(g, played.stop) : null;
      if (!next || !liveish(next)) {
        stop = played.stop;
        break outer;
      }
      g = next;
    }
    const before = g;
    const historyAt = before.history?.length ?? 0;
    g = ageUp(before, { quiet: true });
    passed += 1;
    for (const line of g.card?.banner ?? []) note(line);
    for (const entry of (g.history ?? []).slice(historyAt)) if (entry.tag === "major") note(entry.text);
    stop = stopFor(before, g, m === 0);
    if (stop) {
      const next = settle(g, stop);
      if (next && liveish(next)) {
        g = next;
        stop = null;
        continue;
      }
      break;
    }
  }
  if (handled) did.set("auto-moments", { label: "Small moments handled", count: handled });
  if (fights) did.set("auto-fights", { label: "Street fights settled", count: fights });
  g.skipReport = buildReport(start, g, span, passed, months, did, [...notes, ...chatter.slice(0, notes.length >= 3 ? 0 : 1)], stop);
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
