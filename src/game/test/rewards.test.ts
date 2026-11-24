// 2026-11-22 night pass (REWARD_CHIPS): the steel reward chips on the Duel K.O. card read these pure helpers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { practicedLabel, REWARD_LABEL, REWARD_TONE, rewardChips } from "../rewards.ts";

test("reward chips list non-zero effects, gains before losses, in label order, with signed text", () => {
  const chips = rewardChips({ health: -4, happiness: 2, fame: 3, reputation: -1, powerLevel: 0.1, personId: "x", karma: 0 });
  assert.deepEqual(chips.map((c) => `${c.label} ${c.value}`), ["Joy +2", "Fame +3", "Power +0.1", "Health −4", "Rep −1"]);
  assert.deepEqual(chips.map((c) => c.good), [true, true, true, false, false]);
  assert.equal(chips[0].tone, REWARD_TONE.happiness);
});

test("cash uses the money format, tiny rounding-to-zero values and bad numbers are dropped", () => {
  assert.deepEqual(rewardChips({ money: 1200 }).map((c) => c.value), ["+$1,200"]);
  assert.deepEqual(rewardChips({ money: -25000 }).map((c) => c.value), ["−$25k"]);
  assert.deepEqual(rewardChips({ fame: 0.04, smarts: Number.NaN, looks: Infinity }), []);
  assert.deepEqual(rewardChips(undefined), []);
  assert.deepEqual(rewardChips({}), []);
});

test("every reward stat has a label and a tone", () => {
  for (const key of Object.keys(REWARD_LABEL) as (keyof typeof REWARD_LABEL)[]) assert.match(REWARD_TONE[key], /^#[0-9a-f]{6}$/i);
});

test("the Move XP chip names up to three distinct moves, then counts the rest", () => {
  assert.equal(practicedLabel([]), "");
  assert.equal(practicedLabel(["Jab", "Jab", ""]), "Jab");
  assert.equal(practicedLabel(["Jab", "Kick", "Dive", "Burst", "Guard"]), "Jab, Kick, Dive +2");
});
