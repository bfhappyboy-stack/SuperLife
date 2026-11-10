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
import { actionsFor, ageUp } from "./engine";
import { MONTHS } from "./format";
import { MIX_AGE } from "./mentors";
import { fastForward, playMonth, ROUTINE, stopFor } from "./skip";
import type { Game, Pace, SkipReport } from "./types";

/** Ship switch: on once complete and tested. Off restores Next month + Skip. */
export const FLOW_ON = true;
export const ROUTINE_MAX = 3;
/** Kids move a year per tap, teens and adults a season. */
export const KID_UNTIL = 13;

export type Step = "month" | "season" | "year";

export function stepOf(g: Pick<Game, "age" | "pace">): Step {
  const pace = g.pace ?? "auto";
  if (pace !== "auto") return pace;
  return g.age < KID_UNTIL ? "year" : "season";
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

/** Everyday actions you can pin to your routine right now. */
export function routineOptions(g: Game): { id: string; label: string }[] {
  return actionsFor(g)
    .filter((a) => (ROUTINE as readonly string[]).includes(a.id))
    .map((a) => ({ id: a.id, label: a.label }));
}

export function setRoutine(g: Game, ids: string[]): Game {
  const allowed = new Set<string>(ROUTINE);
  const clean = [...new Set(ids)].filter((id) => allowed.has(id)).slice(0, ROUTINE_MAX);
  return { ...g, routine: clean };
}

export function setPace(g: Game, pace: Pace): Game {
  return { ...g, pace };
}

function recapCard(start: Game, end: Game, report: SkipReport): Game["card"] {
  const did = report.did.filter((r) => r.id !== "auto-moments").slice(0, 4).map((r) => `${r.label} ×${r.count}`);
  const span = report.months === 1 ? "A month" : `${report.months} months`;
  const money = end.stats.money - start.stats.money;
  const body = [
    `${span} ${report.months === 1 ? "goes" : "go"} by${report.to.age > report.from.age ? `, and you turn ${report.to.age}` : ""}.`,
    did.length ? `You kept to your routine: ${did.join(", ")}.` : "",
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
    return after;
  }
  const span = step === "season" && game.month + 3 < 12 ? "season" : "year";
  // Childhood moves fast: small everyday moments are settled for you (listed on the card), as in Skip to 15.
  // A season that would cross a birthday stops at the birthday, so every birthday card is seen.
  const ff = fastForward(game, span, { settle: game.age < KID_UNTIL });
  const report = ff.skipReport;
  if (!report) return ff;
  const out: Game = { ...ff, skipReport: null };
  if (report.stop) {
    // The life needs you: show what's waiting, with a line for the time that passed on the way.
    if (report.months > 0 && out.card) out.card = { ...out.card, banner: [`▸▸ ${report.months} month${report.months === 1 ? " passes" : "s pass"} on your routine.`, ...(out.card.banner ?? [])].slice(0, 4) };
    if (report.stop.kind === "mentor" || report.stop.kind === "chapter" || report.stop.kind === "death" || report.stop.kind === "health" || report.stop.kind === "bond") out.skipReport = report;
    return out;
  }
  out.card = recapCard(game, out, report);
  return out;
}

/** Mixing opens at 15: Play still stops there (the mentor), so legends' and mystery lives' beats stay intact. */
export const FLOW_STOPS_AT = MIX_AGE;
