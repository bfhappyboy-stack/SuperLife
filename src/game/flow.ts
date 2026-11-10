/**
 * Life Flow (2026-11-10 night, owner's call: "rethink the 3 moves per month and find a better way to pass time").
 *
 * One Play button. Each tap moves life forward one step whose length fits your age (a year as a kid, a season
 * from 13), plays your Routine in every block of free time you didn't spend yourself, ticks the economy every
 * month, and stops the moment something needs you. The three blocks a month stay underneath (that keeps fight,
 * training and economy balance exactly as tuned), but they're no longer a chore: unused time is never wasted.
 *
 * Balance rule (inherited from fast-forward): an auto-played block is never better than one you play yourself —
 * routine minis land a little under your average and fights, stunts and big choices always stop and wait for you.
 */
import { actionsFor, ageUp, isChatter } from "./engine";
import { bizById, econOf, periodReport } from "./economy";
import { firstName, MONTHS } from "./format";
import { MIX_AGE } from "./mentors";
import { fastForward, playMonth, ROUTINE, stopFor } from "./skip";
import type { Game, Pace, SkipReport } from "./types";

/** Ship switch: on once complete and tested. Off restores Next month + Skip. */
export const FLOW_ON = true;
export const ROUTINE_MAX = 3;
/** Kids move a year per tap, teens and adults a season. */
export const KID_UNTIL = 13;
/** From 18, Play settles everyday moments and routine fights into the recap (2026-11-10 eve). */
export const ADULT_FROM = 18;

export type Step = "month" | "season" | "year";

export function stepOf(g: Pick<Game, "age" | "pace">): Step {
  const pace = g.pace ?? "auto";
  if (pace !== "auto") return pace;
  // 2026-11-10 eve ("make it interrupt less"): grown-ups move a year a tap too; teens keep the season.
  return g.age < KID_UNTIL || g.age >= ADULT_FROM ? "year" : "season";
}

/** Months one Play tap covers from here (a year step runs to the next birthday). */
export function stepMonths(g: Pick<Game, "age" | "pace" | "month">): number {
  const step = stepOf(g);
  if (step === "month") return 1;
  if (step === "season") return 3;
  return 12 - (g.month ?? 0);
}

/** "Spring", "To age 9", "Next month": what the Play button says. */
export function stepLabel(g: Game): { title: string; sub: string } {
  const step = stepOf(g);
  const months = stepMonths(g);
  if (step === "month") return { title: g.month === 11 ? `New year · age ${g.age + 1}` : "Next month", sub: MONTHS[(g.month + 1) % 12] ?? "" };
  if (step === "year" || g.month + months >= 12) return { title: `Play to age ${g.age + 1}`, sub: `${months} month${months === 1 ? "" : "s"}` };
  const from = MONTHS[(g.month + 1) % 12]?.slice(0, 3) ?? "";
  const to = MONTHS[(g.month + months) % 12]?.slice(0, 3) ?? "";
  return { title: `Play ${from}–${to}`, sub: `${months} months` };
}

/** Routine id for working a shift at one of your businesses (2026-11-10 am). */
export const SHIFT_ROUTINE = "econ|biz|shift|";
const PEOPLE_ROLES = new Set(["parent", "partner", "child", "friend", "teammate"]);

/** Everyday actions you can pin to your routine right now: habits, a shift at your business, time with someone. */
export function routineOptions(g: Game): { id: string; label: string; kind?: "work" | "people" }[] {
  const acts = actionsFor(g);
  const base = acts.filter((a) => (ROUTINE as readonly string[]).includes(a.id)).map((a) => ({ id: a.id, label: a.label }));
  const shifts = (econOf(g)?.biz ?? [])
    .filter((b) => !bizById(b.kind)?.empire && b.cityId === g.cityId)
    .map((b) => ({ id: `${SHIFT_ROUTINE}${b.uid}`, label: `Shift at ${b.name}`, kind: "work" as const }));
  const people = acts
    .filter((a) => a.id.startsWith("time:"))
    .map((a) => g.relationships.find((r) => `time:${r.id}` === a.id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.alive && PEOPLE_ROLES.has(p.role))
    .sort((a, b) => (a.role === "partner" ? -1 : 0) - (b.role === "partner" ? -1 : 0) || b.closeness - a.closeness)
    .slice(0, 4);
  // Two people called Wes? Say which.
  const twice = (name: string) => people.filter((p) => firstName(p.name) === name).length > 1;
  const rows = people.map((p) => ({ id: `time:${p.id}`, label: `Time with ${firstName(p.name)}${twice(firstName(p.name)) ? ` (${p.role})` : ""}`, kind: "people" as const }));
  return [...base, ...shifts, ...rows];
}

const pinnable = (id: string) => (ROUTINE as readonly string[]).includes(id) || id.startsWith("time:") || id.startsWith(SHIFT_ROUTINE);

export function setRoutine(g: Game, ids: string[]): Game {
  const clean = [...new Set(ids)].filter(pinnable).slice(0, ROUTINE_MAX);
  return { ...g, routine: clean };
}

export function setPace(g: Game, pace: Pace): Game {
  return { ...g, pace };
}

/** Auto fights (opt-in, 2026-11-10 late): off = Play stops for every street fight and you pick Fight it out or Auto-resolve. */
export function setAutoFights(g: Game, on: boolean): Game {
  return { ...g, autoFights: on, autoFightsSet: true };
}

function recapCard(start: Game, end: Game, report: SkipReport): Game["card"] {
  const did = report.did.filter((r) => r.id !== "auto-moments" && r.id !== "auto-fights").slice(0, 4).map((r) => `${r.label} ×${r.count}`);
  const fights = report.did.find((r) => r.id === "auto-fights")?.count ?? 0;
  const moments = report.did.find((r) => r.id === "auto-moments")?.count ?? 0;
  const settled = [fights ? `${fights} street fight${fights === 1 ? "" : "s"}` : "", moments ? `${moments} small moment${moments === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");
  const span = report.months === 1 ? "A month" : `${report.months} months`;
  const money = end.stats.money - start.stats.money;
  const body = [
    `${span} ${report.months === 1 ? "goes" : "go"} by${report.to.age > report.from.age ? `, and you turn ${report.to.age}` : ""}.`,
    did.length ? `You kept to your routine: ${did.join(", ")}.` : "",
    settled && start.age >= ADULT_FROM ? `Handled on the way: ${settled}.` : "",
    Math.abs(money) >= 50 ? `Money ${money > 0 ? "up" : "down"} $${Math.abs(Math.round(money)).toLocaleString("en-US")}.` : "",
  ].filter(Boolean).join(" ");
  const ranks = report.ranks.map((r) => `${r.name}: rank ${r.from} → ${r.to}.`);
  return {
    kicker: `Age ${end.age} · ${MONTHS[end.month] ?? ""}`,
    banner: [...ranks, ...report.notes].slice(0, 4),
    body,
    deltas: report.stats.filter((s) => s.stat !== "money").map((s) => ({ stat: s.label, amount: s.stat === "powerLevel" ? Math.round(s.amount * 100) / 100 : Math.round(s.amount) })),
  };
}

/**
 * One Play tap. Month pace = your routine fills this month's free time, then the month turns (the full month
 * card). Season / year pace = the same, month after month, with a recap card; stops for anything that needs you.
 */
/** Month index (age × 12 + month), the economy's clock. */
const clock = (g: Pick<Game, "age" | "month">) => g.age * 12 + (g.month ?? 0);

/** Pin the step's money report to the card, and keep rival-cape ticker lines from leading it. */
function withMoney(start: Game, out: Game): Game {
  const money = start.age >= 16 || out.age >= 16 ? periodReport(out, clock(start)) : null;
  if (money) {
    // Shifts, gigs, shopping and event payouts move cash outside the ledger: one line, so the card adds up.
    const extra = Math.round(out.stats.money - start.stats.money - money.net);
    const other = money.groups.find((row) => row.key === "other");
    if (other) Object.assign(other, { label: "Everything else", amount: other.amount + extra });
    else if (extra !== 0) money.groups.push({ key: "other", label: "Everything else", amount: extra });
    money.groups = money.groups.filter((row) => row.amount !== 0);
    money.net += extra;
  }
  const banner = out.card.banner ?? [];
  // Business news shows once, in the money report (2026-11-10 pm).
  const inReport = new Set((money?.biz ?? []).map((b) => b.text));
  const mine = banner.filter((line) => !isChatter(line) && !inReport.has(line));
  const card = { ...out.card, banner: mine.length || money ? mine : banner.slice(0, 1), money };
  return { ...out, card };
}

export function playStep(game: Game): Game {
  if (game.phase !== "live" || game.reveal) return game;
  const step = stepOf(game);
  if (step === "month") {
    const played = playMonth(structuredClone(game));
    if (played.stop) return played.g;
    const before = played.g;
    const after = ageUp(before);
    // A month that opens on something big (a canon beat, a mentor) is already on the card; nothing to add.
    void stopFor(before, after, true);
    return withMoney(game, after);
  }
  const span = step === "season" && game.month + 3 < 12 ? "season" : "year";
  // Childhood moves fast: small everyday moments are settled for you (listed on the card), as in Skip to 15.
  // A season that would cross a birthday stops at the birthday, so every birthday card is seen.
  // Adults (2026-11-10 eve): everyday moments and routine fights land in the recap; big ones still stop.
  const ff = fastForward(game, span, { settle: game.age < KID_UNTIL ? true : game.age >= ADULT_FROM ? "adult" : false });
  const report = ff.skipReport;
  if (!report) return ff;
  const out: Game = { ...ff, skipReport: null };
  if (report.stop) {
    // The life needs you: show what's waiting, with a line for the time that passed on the way.
    if (report.months > 0 && out.card) out.card = { ...out.card, banner: [`▸▸ ${report.months} month${report.months === 1 ? " passes" : "s pass"} on your routine.`, ...(out.card.banner ?? [])].slice(0, 4) };
    // A new chapter already has its own page: the recap rides on the card under it (one tap, not two).
    if (report.stop.kind === "chapter") {
      out.card = recapCard(game, out, report);
      return withMoney(game, out);
    }
    if (report.stop.kind === "mentor" || report.stop.kind === "death" || report.stop.kind === "health" || report.stop.kind === "bond") out.skipReport = report;
    return withMoney(game, out);
  }
  out.card = recapCard(game, out, report);
  return withMoney(game, out);
}

/** Mixing opens at 15: Play still stops there (the mentor), so legends' and mystery lives' beats stay intact. */
export const FLOW_STOPS_AT = MIX_AGE;
