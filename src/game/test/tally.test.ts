// 2026-11-22 am pass (FIGHT_TALLY): metal K.O. stat tiles and Arena round HP bars read these pure helpers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { hpPercent, statLead } from "../verdicts.ts";

test("the K.O. stat tile that leads is the side that hit harder; level or empty fights light neither", () => {
  assert.equal(statLead(62, 39), "dealt");
  assert.equal(statLead(12, 40), "taken");
  assert.equal(statLead(20, 20), "even");
  assert.equal(statLead(0, 0), "even");
  assert.equal(statLead(20.4, 19.6), "even", "rounded like the digits on the tile");
  assert.equal(statLead(Number.NaN, 5), "taken");
  assert.equal(statLead(-3, 0), "even");
});

test("round HP is a whole percent clamped to 0..100, and missing margins read as empty", () => {
  assert.equal(hpPercent(0.55), 55);
  assert.equal(hpPercent(0), 0);
  assert.equal(hpPercent(1), 100);
  assert.equal(hpPercent(1.4), 100);
  assert.equal(hpPercent(-0.2), 0);
  assert.equal(hpPercent(0.004), 0);
  assert.equal(hpPercent(undefined), 0);
  assert.equal(hpPercent(null), 0);
  assert.equal(hpPercent(Number.NaN), 0);
});

// 2026-11-22 pm pass (FIGHT_CALLOUT): the best-hit callout's share and the Arena MVP pick.
import { hitShare, mvpRound } from "../verdicts.ts";

test("the best hit's share of your damage is a whole percent, capped, and empty fights read 0", () => {
  assert.equal(hitShare(11, 62), 18);
  assert.equal(hitShare(62, 62), 100);
  assert.equal(hitShare(70, 62), 100, "rounding never shows more than all of it");
  assert.equal(hitShare(0, 62), 0);
  assert.equal(hitShare(11, 0), 0);
  assert.equal(hitShare(-4, 20), 0);
  assert.equal(hitShare(Number.NaN, 20), 0);
  assert.equal(hitShare(undefined, null), 0);
});

test("the MVP is the round you won with the most HP left; none when you won none; ties keep the earlier round", () => {
  assert.deepEqual(mvpRound([1, 0, 0], [[0, 0.41], [0.62, 0], [0.18, 0]]), { round: 1, hp: 0.62 });
  assert.deepEqual(mvpRound([0, 0], [[0.3, 0], [0.3, 0]]), { round: 0, hp: 0.3 });
  assert.deepEqual(mvpRound([0, 1], [[0, 0], [0, 0.5]]), { round: 0, hp: 0 }, "a double-K.O. tiebreak win still counts");
  assert.equal(mvpRound([1, 1], [[0, 0.4], [0, 0.2]]), null);
  assert.equal(mvpRound([0, null], []), null, "a win with no margin saved is skipped");
  assert.equal(mvpRound([], []), null);
});
