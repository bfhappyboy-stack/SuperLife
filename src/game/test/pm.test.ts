// 2026-11-01 pm: legend kin weighting, decade goals that survive their own decade, and the chase run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAPTER_GOALS, FAMILY_CLOSE, snapshot } from "../chapters.ts";
import { act, ageUp, choose, createGame, resolveMini } from "../engine.ts";
import { KIN_WEIGHT, kinOrder, kinPool, legendFits, legendKin } from "../kin.ts";
import { PRESETS } from "../presets.ts";
import { chaseCourse, chaseScore, pickMini } from "../minis.ts";
import type { Game } from "../types.ts";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test("legend kin: canon kit and stretch fit, everything else is off-book", () => {
  assert.equal(legendKin(undefined), null);
  assert.ok(legendFits(undefined, "gravity"), "ordinary lives fit everything");
  for (const preset of PRESETS) {
    const kin = legendKin(preset.id);
    if (!preset.powers.length && !(preset.stretch ?? []).length) continue;
    assert.ok(kin && kin.size > 0, `${preset.id} has a kin`);
    for (const id of preset.stretch ?? []) assert.ok(legendFits(preset.id, id), `${preset.id} stretch ${id} fits`);
  }
  assert.ok(legendFits("flash", "super-speed"));
  assert.ok(!legendFits("flash", "gravity"));
  assert.ok(legendFits("thor", "weather") && !legendFits("thor", "gravity"));
  const ordered = kinOrder("flash", [{ id: "gravity" }, { id: "lightning-control" }, { id: "ice-control" }]);
  assert.equal(ordered[0]!.id, "lightning-control");
});

test("kinPool narrows to fitting powers about 85% of the time", () => {
  const rand = lcg(4);
  const pool = [{ id: "gravity" }, { id: "weather" }, { id: "ice-control" }];
  let narrowed = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const out = kinPool("thor", pool, rand());
    if (out.length === 1 && out[0]!.id === "weather") narrowed++;
  }
  assert.ok(Math.abs(narrowed / N - KIN_WEIGHT) < 0.03, `narrowed ${narrowed / N}`);
  assert.deepEqual(kinPool("thor", [{ id: "gravity" }], 0.1), [{ id: "gravity" }], "no fitting option leaves the pool alone");
  assert.equal(kinPool(undefined, pool, 0.1).length, 3);
});

test("family goal counts closeness, fame splits into raise vs hold", () => {
  const g = createGame({ name: "Ava Reyes", cityId: "stacks", upbringing: "street", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 3 } as never);
  g.relationships.push({ id: "p1", name: "Sam", role: "partner", closeness: FAMILY_CLOSE - 1, alive: true } as never);
  const s = snapshot(g);
  assert.equal(s.family, 1);
  assert.equal(s.familyClose, 0, "a drifting partner is not 'close'");
  const fame = CHAPTER_GOALS.find((d) => d.id === "fame")!;
  const hold = CHAPTER_GOALS.find((d) => d.id === "holdfame")!;
  g.stats.fame = 85;
  assert.ok(!fame.when!(g, snapshot(g)) && hold.when!(g, snapshot(g)), "famous heroes hold, not climb");
  assert.equal(hold.target(g, snapshot(g)), 79);
  g.stats.fame = 40;
  assert.ok(fame.when!(g, snapshot(g)) && !hold.when!(g, snapshot(g)));
});

test("chase courses are fair: every row leaves an open lane reachable in one step", () => {
  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 1; seed < 200; seed++) {
      const { rows, duration, sparks } = chaseCourse(seed, difficulty);
      assert.ok(rows.length >= 5, "enough rows");
      assert.ok(rows.every((row) => row.at < duration));
      let open = [0, 1, 2];
      for (const row of rows) {
        assert.ok(row.walls.length >= 1 && row.walls.length <= 2);
        const free = [0, 1, 2].filter((lane) => !row.walls.includes(lane));
        if (row.spark != null) assert.ok(free.includes(row.spark), "sparks never sit on a wreck");
        assert.ok(free.some((lane) => open.some((from) => Math.abs(from - lane) <= 1)), "reachable");
        open = free;
      }
      assert.equal(sparks, rows.filter((row) => row.spark != null).length);
    }
  }
  assert.deepEqual(chaseCourse(9, 2), chaseCourse(9, 2), "seeded");
  assert.equal(chaseScore(5, 5, 0), 1);
  assert.ok(chaseScore(0, 5, 0) < 0.66 && chaseScore(0, 5, 0) >= 0.33, "clean but empty is a scrape");
  assert.ok(chaseScore(5, 5, 3) < 0.66);
});

test("gym lift and run are played rounds with a fair payout ladder", () => {
  assert.ok(["chase", "timing"].includes(pickMini("run", lcg(2)).kind));
  assert.ok(["hold", "timing"].includes(pickMini("lift", lcg(2)).kind));
  let g: Game = createGame({ name: "Ava Reyes", cityId: "stacks", upbringing: "street", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "super-speed", seed: 8 } as never);
  for (let i = 0; i < 2000 && (g.age < 16 || g.phase !== "live"); i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
  }
  let opened = act(g, "gym");
  assert.equal(opened.phase, "choice");
  opened = choose(opened, "run");
  assert.equal(opened.phase, "mini");
  assert.ok(["chase", "timing"].includes(opened.minigame!.kind));
  const before = opened.stats.health;
  const won = resolveMini(opened, 0.95);
  const lost = resolveMini(opened, 0.1);
  assert.ok(won.stats.happiness > lost.stats.happiness);
  assert.ok(won.stats.health >= before && lost.stats.health >= before);
});
