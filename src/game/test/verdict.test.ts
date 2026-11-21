// 2026-11-21 pm pass (MATCH_VERDICT): the Arena results name how the match went.
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchVerdict, type Side } from "../arena.ts";

const v = (results: (Side | null)[], winner: Side) => matchVerdict({ results, winner });

test("wins read as a sweep, a comeback or holding on, by the order of the rounds", () => {
  assert.equal(v([0, 0], 0).key, "sweep", "a clinched 2-0 with the dead round skipped");
  assert.equal(v([0, 0, 1], 0).key, "sweep", "losing the pride round doesn't spoil the sweep");
  assert.equal(v([0, 0, 0], 0).key, "flawless");
  assert.equal(v([1, 0, 0], 0).key, "comeback");
  assert.equal(v([0, 1, 0], 0).key, "held-on");
  assert.equal(v([0, null, null], 0).key, "won", "draws fall back to the plain line");
  for (const r of [v([0, 0], 0), v([1, 0, 0], 0), v([0, 1, 0], 0)]) assert.equal(r.tone, "gold");
});

test("losses read as swept, slipped away or a lost decider; level rounds go to points", () => {
  assert.equal(v([1, 1], 1).key, "swept");
  assert.equal(v([1, 1, 1], 1).key, "swept");
  assert.equal(v([1, 1, 0], 1).key, "swept", "a pride-round win still leaves the match swept");
  assert.equal(v([0, 1, 1], 1).key, "slipped");
  assert.equal(v([1, 0, 1], 1).key, "decider-lost");
  assert.equal(v([0, 1, null], 0).key, "won-points");
  assert.equal(v([0, 1, null], 1).key, "lost-points");
  assert.equal(v([0, 1, null], 1).tone, "steel");
  assert.match(v([1, null, null], 1).line, /0-1/);
});

test("every verdict fits the plate", () => {
  const all: [(Side | null)[], Side][] = [[[0, 0], 0], [[0, 0, 0], 0], [[1, 0, 0], 0], [[0, 1, 0], 0], [[0, 1, null], 0], [[0, null, null], 0], [[1, 1], 1], [[0, 1, 1], 1], [[1, 0, 1], 1], [[0, 1, null], 1], [[1, null, null], 1]];
  const keys = new Set<string>();
  for (const [r, w] of all) {
    const x = v(r, w);
    keys.add(x.key);
    assert.ok(x.label.length <= 12, `${x.label} fits`);
    assert.ok(x.line.length > 0 && x.line.length <= 44, `${x.line} is one short line`);
  }
  assert.equal(keys.size, 11, "every verdict is reachable");
});
