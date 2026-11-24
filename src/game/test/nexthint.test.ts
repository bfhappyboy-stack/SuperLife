// 2026-11-23 am pass (NEXT_HINT_PLATE): the red steel "Next time" plate under a lost boss fight reads this pure helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import { hintParts } from "../verdicts.ts";
import { VILLAIN_GIMMICKS } from "../presets.ts";
import { powerGimmick } from "../gimmicks.ts";
import type { PowerId } from "../types.ts";

test("a hint splits into the tell and the counter (its last sentence), with nothing lost", () => {
  assert.deepEqual(hintParts("Every third turn they wind up. Guard when it comes."), { tell: "Every third turn they wind up.", counter: "Guard when it comes." });
  assert.deepEqual(hintParts("Heads: guard up, he hits ×1.6. Tails: go for it."), { tell: "Heads: guard up, he hits ×1.6.", counter: "Tails: go for it." });
  assert.deepEqual(hintParts("A one-liner"), { tell: "", counter: "A one-liner" });
  assert.deepEqual(hintParts("  Spaced   out.  Twice!  "), { tell: "Spaced out.", counter: "Twice!" });
  assert.deepEqual(hintParts(""), { tell: "", counter: "" });
  assert.deepEqual(hintParts(undefined), { tell: "", counter: "" });
});

test("every boss gimmick hint in the game gives a counter, and the parts rebuild the hint", () => {
  const powers: PowerId[] = ["strength", "blasts", "lightning", "fire", "ice", "forcefield", "telekinesis", "healing", "flight", "speed", "invisibility", "mind", "shapeshift", "intellect", "elastic"];
  const hints = [...Object.values(VILLAIN_GIMMICKS).map((g) => g.hint), ...powers.map((p) => powerGimmick(p, "Foe").hint), powerGimmick(null, "Foe").hint];
  assert.ok(hints.length > 20);
  for (const hint of hints) {
    const { tell, counter } = hintParts(hint);
    assert.ok(counter.length > 0, hint);
    assert.equal([tell, counter].filter(Boolean).join(" "), hint.trim().replace(/\s+/g, " "));
  }
});
