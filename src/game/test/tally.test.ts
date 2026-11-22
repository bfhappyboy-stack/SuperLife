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
