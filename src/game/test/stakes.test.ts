// 2026-11-20 night pass (ROUND_SLAM): the round intro names what the round decides.
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundStakes, type Side } from "../arena.ts";

const at = (round: number, results: (Side | null)[]) => roundStakes({ round, results });

test("round 1 is first blood; round 2 reads match point or must win from your side", () => {
  assert.equal(at(0, []).key, "first");
  assert.equal(at(1, [0]).key, "match-point");
  assert.equal(at(1, [0]).tone, "gold");
  assert.equal(at(1, [1]).key, "must-win");
  assert.equal(at(1, [1]).tone, "red");
  assert.equal(at(1, [null]).key, "even", "a drawn opener leaves it all square");
});

test("round 3 is the decider at 1-1, and only for pride once the match is settled", () => {
  assert.equal(at(2, [0, 1]).key, "decider");
  assert.equal(at(2, [1, 0]).key, "decider");
  assert.equal(at(2, [0, 0]).key, "pride");
  assert.match(at(2, [0, 0]).line, /yours/);
  assert.equal(at(2, [1, 1]).key, "pride");
  assert.match(at(2, [1, 1]).line, /gone/);
  assert.equal(at(2, [0, null]).key, "match-point");
  assert.equal(at(2, [null, null]).key, "final");
  for (const r of [at(0, []), at(1, [0]), at(2, [0, 1])]) assert.ok(r.label.length <= 12 && r.line.length > 0, "short tag that fits the plate");
});
