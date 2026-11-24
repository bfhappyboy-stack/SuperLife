// 2026-11-23 pm pass (CONTINUE_DOCK): the docked Continue on the Duel K.O. card shows a "more below" cue from this helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import { moreBelow } from "../verdicts.ts";

test("the cue shows only while real card is left under the fold", () => {
  assert.equal(moreBelow(0, 900, 737), true);
  assert.equal(moreBelow(163, 900, 737), false);
  assert.equal(moreBelow(157, 900, 737), false, "within the 8px slack");
  assert.equal(moreBelow(150, 900, 737), true);
  assert.equal(moreBelow(0, 737, 737), false, "card fits");
  assert.equal(moreBelow(0, 600, 737), false, "card shorter than the screen");
});

test("bad or missing sizes never show the cue", () => {
  assert.equal(moreBelow(Number.NaN, 900, 737), false);
  assert.equal(moreBelow(0, 900, 0), false);
  assert.equal(moreBelow(-40, 900, 737), true, "overscroll bounce counts as the top");
  assert.equal(moreBelow(0, Number.POSITIVE_INFINITY, 737), false);
});
