// Chapter goals: every goal names its button, opens inside its chapter, and locks honestly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAPTER_GOALS, CHAPTER_PHASES, GOAL_TABS, actMatches, buildChapter, goalCount, goalHow, goalLock, goalRoute, snapshot } from "../chapters.ts";
import { ageUp, choose, createGame, resolveMini } from "../engine.ts";
import type { Game } from "../types.ts";

const base = { name: "Ava Reyes", cityId: "stacks", upbringing: "street", portrait: 11, sex: "female", face: "secret", drive: "protector" } as const;

test("every goal names a tab ▸ path and an unlock age", () => {
  const g = createGame({ ...base, giftId: "fire-control", seed: 1 } as never);
  for (const def of CHAPTER_GOALS) {
    const how = typeof def.how === "function" ? def.how(g) : def.how;
    assert.ok(how.length > 3, `${def.id} how`);
    if (def.id !== "canon" && def.id !== "quietfame") assert.match(how, /▸/, `${def.id} how has a path`);
    assert.doesNotMatch(how, /Gift ▸/, `${def.id} uses the current tab names`);
    const opens = typeof def.opens === "function" ? def.opens(g) : def.opens;
    assert.ok(opens >= 0 && opens <= 45, `${def.id} opens`);
  }
});

test("each phase only lists goals that can open before the chapter ends", () => {
  for (const phase of CHAPTER_PHASES) {
    const end = phase.from + 9;
    for (const id of phase.goals) {
      const def = CHAPTER_GOALS.find((goal) => goal.id === id);
      assert.ok(def, `${phase.id}: ${id} exists`);
      const opens = typeof def!.opens === "number" ? def!.opens : 0;
      if (opens > end - 1) assert.fail(`${phase.id}: ${id} opens at ${opens}, chapter ends at ${end}`);
    }
  }
});

test("built chapters never hold a goal that opens after the chapter", () => {
  for (const seed of [1, 2, 3, 4]) {
    let g: Game = createGame({ ...base, mode: "mystery", seed } as never);
    for (let i = 0; i < 3000 && g.age < 60 && g.phase !== "dead"; i++) {
      if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
      else if (g.phase === "mini") g = resolveMini(g, 0.7);
      else g = ageUp(g);
    }
    for (const ch of g.chapters ?? []) for (const goal of ch.goals) assert.ok((goal.opens ?? 0) <= ch.endAge - 1, `${ch.title}: ${goal.id} opens ${goal.opens}`);
  }
});

test("locked goals say when they unlock and counts read x/y", () => {
  const g = createGame({ ...base, mode: "mystery", seed: 5 } as never);
  const ch = buildChapter(g);
  const snap = snapshot(g);
  for (const goal of ch.goals) {
    assert.ok(goalHow(goal, g).length > 0);
    assert.match(goalCount(goal, snap), /\d/);
    if ((goal.opens ?? 0) > g.age) assert.equal(goalLock(goal, g), `Unlocks at ${goal.opens}`);
  }
  assert.ok(!ch.goals.some((goal) => goal.power), "no power goal while the power is sealed in the first chapter");
  assert.ok(!/\{gift\}|undefined/.test(ch.title + ch.premise));
});

test("every goal with a button has a Go route: a real tab, a shelf, and action ids", () => {
  const g = createGame({ ...base, giftId: "fire-control", seed: 1 } as never);
  for (const def of CHAPTER_GOALS) {
    if (!def.act?.length) continue;
    const goal = { id: def.id, label: "", hint: def.hint, metric: def.metric, mode: def.mode, target: 1, start: 0, how: typeof def.how === "function" ? def.how(g) : def.how, opens: 0 } as never;
    const route = goalRoute(goal, g);
    assert.ok(route, `${def.id} has a route`);
    assert.ok((GOAL_TABS as readonly string[]).includes(route!.tab), `${def.id} tab ${route!.tab}`);
    assert.ok(route!.shelf && route!.shelf.length > 1, `${def.id} shelf`);
  }
});

test("goal action matching: exact ids, id| families, and prefixes", () => {
  assert.ok(actMatches("train", ["train"]));
  assert.ok(!actMatches("training-camp", ["train"]));
  assert.ok(actMatches("herotrain|ace", ["herotrain|"]));
  assert.ok(actMatches("job:barista", ["job:"]));
  assert.ok(actMatches("learn|ace|fire-control", ["learn|"]));
  assert.ok(actMatches("arc-start|blackout", ["arc-start|"]));
  assert.ok(!actMatches("mission", ["stunt"]));
});
