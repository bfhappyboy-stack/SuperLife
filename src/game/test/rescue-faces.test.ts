// 2026-11-17 pm: rescue windows show painted people; who stands at which window is stable and follows the old glyph's age.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rescueFace } from "../minis.ts";
import { ageBand } from "../portraits.ts";

test("rescue faces are stable per game seed and spawn", () => {
  assert.deepEqual(rescueFace(7, 3, 0), rescueFace(7, 3, 0));
  assert.notDeepEqual(rescueFace(7, 3, 0), rescueFace(8, 3, 0));
});

test("rescue faces keep the glyph's age band and mix both sexes", () => {
  const sexes = new Set<string>();
  const seeds = new Set<number>();
  for (let seed = 0; seed < 20; seed++)
    for (let id = 0; id < 15; id++) {
      const grown = rescueFace(seed, id, 0);
      const older = rescueFace(seed, id, 1);
      const kid = rescueFace(seed, id, 2);
      assert.equal(ageBand(grown.age), "adult", `grown-up ${grown.age}`);
      assert.equal(ageBand(older.age), "older", `older ${older.age}`);
      assert.equal(ageBand(kid.age), "child", `kid ${kid.age}`);
      sexes.add(grown.sex);
      seeds.add(grown.seed);
    }
  assert.equal(sexes.size, 2);
  assert.ok(seeds.size > 280, `only ${seeds.size} distinct faces`);
});
