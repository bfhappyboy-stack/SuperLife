// Life Flow: Play steps by age, routine fills free time, stops for what matters (2026-11-10 night). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageUp, choose, createGame, dismissReveal, resolveMini } from "../engine.ts";
import { playStep, routineOptions, setPace, setRoutine, stepLabel, stepMonths, stepOf } from "../flow.ts";
import { fastForward, monthPlan, dismissSkip } from "../skip.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, month = 0, over: Record<string, unknown> = {}): Game {
  const g = createGame({ ...BASE, ...over } as never);
  g.age = age;
  g.month = month;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 80;
  return g;
}

/** Answer whatever the life asks the way a steady player would. */
function settle(g: Game, seen: string[] = []): Game {
  for (let i = 0; i < 40; i += 1) {
    if (g.skipReport) g = dismissSkip(g);
    else if (g.reveal) g = dismissReveal(g);
    else if (g.chapterNotice) g = { ...g, chapterNotice: null };
    else if (g.phase === "choice" && g.pending) {
      seen.push(g.pending.id);
      g = choose(g, g.pending.choices[g.pending.choices.length > 1 ? 1 : 0]!.id);
    } else if (g.phase === "mini") g = resolveMini(g, 0.65);
    else break;
  }
  return g;
}

test("pace: a year per tap as a kid, a season from 13; you can pin month, season or year", () => {
  assert.equal(stepOf({ age: 8 }), "year");
  assert.equal(stepOf({ age: 12 }), "year");
  assert.equal(stepOf({ age: 13 }), "season");
  assert.equal(stepOf({ age: 40 }), "season");
  assert.equal(stepOf({ age: 40, pace: "month" }), "month");
  assert.equal(stepOf({ age: 8, pace: "season" }), "season");
  assert.equal(stepMonths({ age: 9, month: 4 }), 8, "a kid's year runs to the birthday");
  assert.equal(stepMonths({ age: 30, month: 4 }), 3);
  const g = at(30, 10);
  assert.match(stepLabel(g).title, /age 31/, "a season that crosses a birthday stops at it");
  assert.equal(setPace(g, "month").pace, "month");
});

test("routine: up to three everyday actions, your order comes first in the month plan", () => {
  const g = at(16, 2);
  const options = routineOptions(g).map((o) => o.id);
  assert.ok(options.length >= 3, options.join(","));
  const pick = options.slice(-2).reverse();
  const r = setRoutine(g, [...pick, "fight-everyone", pick[0]!, ...options]);
  assert.equal(r.routine!.length, 3);
  assert.deepEqual(r.routine!.slice(0, 2), pick, "order kept, junk and repeats dropped");
  const plan = monthPlan(r).map((p) => p.id);
  assert.equal(plan[0], pick[0]);
  assert.ok(plan.indexOf(pick[1]!) <= 2);
});

test("month pace: free time you don't spend goes to your routine, then the month turns", () => {
  let g = setPace(at(25, 3, { jobId: "office" }), "month");
  g.jobId = "office";
  g = setRoutine(g, ["books"]);
  const before = structuredClone(g);
  const after = playStep(g);
  if (after.phase === "live") {
    assert.equal(after.month, 4);
    assert.equal(after.majorsLeft, 3, "a fresh month");
    assert.notDeepEqual(after.stats, before.stats, "the routine did something");
  } else {
    assert.ok(after.phase === "choice" || after.phase === "mini", "or it stopped for you");
  }
});

test("season pace: three months per tap with a recap card, or it stops for what needs you", () => {
  let g = at(30, 2, { jobId: "office" });
  g.jobId = "office";
  let moved = 0;
  for (let i = 0; i < 12; i += 1) {
    const before = g.age * 12 + g.month;
    const next = playStep(g);
    moved += next.age * 12 + next.month - before;
    if (next.phase === "live" && !next.skipReport && next.age * 12 + next.month - before === 3) {
      assert.match(next.card.body, /go(es)? by/);
      assert.equal(next.skipReport ?? null, null, "no modal for a plain season");
    }
    g = settle(next);
  }
  assert.ok(moved >= 12, `time keeps moving (${moved} months in 12 taps)`);
});

test("a Play season is the fast-forward season: same months, same dice (no balance change)", () => {
  const g = at(30, 2, { jobId: "office" });
  g.jobId = "office";
  const a = playStep(structuredClone(g));
  const b = fastForward(structuredClone(g), "season");
  assert.equal(a.age * 12 + a.month, b.age * 12 + b.month);
  assert.deepEqual(a.stats, b.stats);
  assert.equal(a.rng, b.rng);
});

test("childhood flies: birth to 15 in well under 40 taps, and Play still stops for the power reveal and the mentor", () => {
  let g = createGame({ ...BASE } as never);
  g = settle(g);
  let taps = 0;
  let revealed = false;
  let mentor = false;
  while (g.age < 15 && taps < 200 && g.phase !== "dead") {
    const next = playStep(g);
    taps += 1;
    if (next.reveal) revealed = true;
    if (next.mentor) mentor = true;
    g = settle(next);
  }
  assert.ok(g.age >= 15, `reached ${g.age}`);
  assert.ok(taps <= 40, `${taps} taps`);
  assert.ok(revealed || (g.unlockedPowers?.length ?? 0) > 0, "the power woke on the way");
  // One more season at 15 meets the mentor if it hasn't already.
  for (let i = 0; i < 6 && !mentor; i += 1) {
    const next = playStep(g);
    if (next.mentor) mentor = true;
    g = settle(next);
  }
  assert.ok(mentor || g.mentor, "the mentor at 15");
});

test("legend story beats still land: Spider-Man played on Play only hits his canon beats", () => {
  let g = createGame({ ...BASE, cityId: "nyc", mode: "god", preset: "spider-man" } as never);
  const seen: string[] = [];
  g = settle(g, seen);
  for (let taps = 0; taps < 120 && g.age < 22 && g.phase !== "dead"; taps += 1) {
    g.stats.health = Math.max(g.stats.health, 50);
    g = settle(playStep(g), seen);
  }
  assert.ok(seen.some((id) => id.startsWith("canon|")), `canon beats: ${seen.filter((id) => id.startsWith("canon")).join(",")}`);
});

test("old saves without routine or pace play on Auto with habits", () => {
  const g = at(20, 5);
  delete (g as { routine?: unknown }).routine;
  delete (g as { pace?: unknown }).pace;
  assert.equal(stepOf(g), "season");
  const n = playStep(g);
  assert.ok(n.age * 12 + n.month > g.age * 12 + g.month || n.phase !== "live");
  // The old Next month still works underneath.
  assert.equal(ageUp(at(20, 5)).month, 6);
});
