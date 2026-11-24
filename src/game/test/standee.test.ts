// 2026-11-16 night: lives with no suit painting stand in as their painted portrait (kids, powerless, online lives).
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIFE_SEED_MUL, lifePortraitSeed, stageScale, standeeScale, TEEN_STAGE_AGE } from "../heroArt.ts";

test("a saved Arena life's snapshot seed gives back the face it was saved with", () => {
  for (const portrait of [1, 3, 17, 512, 90_001, 2_000_000]) {
    for (let slot = 0; slot < 5; slot++) assert.equal(lifePortraitSeed(portrait * LIFE_SEED_MUL + slot), portrait);
  }
  // Odd seeds (online lives, hand-made fighters) still give a stable, positive face seed.
  for (const seed of [0, 7, -5, 7918, undefined, null]) {
    const face = lifePortraitSeed(seed);
    assert.ok(Number.isInteger(face) && face >= 1, `seed ${seed} -> ${face}`);
    assert.equal(lifePortraitSeed(seed), face);
  }
});

test("a kid's portrait card stands shorter than a grown fighter, growing each year, and meets the suit at 13", () => {
  let last = 0;
  for (let age = 5; age < TEEN_STAGE_AGE; age++) {
    const s = standeeScale(age);
    assert.ok(s >= 0.74 && s <= 0.84, `age ${age}: ${s}`);
    assert.ok(s >= last, `age ${age} shrank`);
    last = s;
  }
  assert.ok(standeeScale(12) <= stageScale(13));
  for (const age of [13, 14, 15, 16, 30]) assert.equal(standeeScale(age), stageScale(age));
});
