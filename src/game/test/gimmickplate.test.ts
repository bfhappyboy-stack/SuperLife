// 2026-11-23 night pass (GIMMICK_PLATE): the steel in-fight gimmick plate reads its tag from this pure helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gimmickTag } from "../verdicts.ts";
import { VILLAIN_GIMMICKS } from "../presets.ts";

test("the gimmick tag says Live, Phase 3, Once or the health it starts at, like the old pill", () => {
  assert.deepEqual(gimmickTag({ kind: "armor", at: 0.55 }, true), { label: "Live", tone: "live" });
  assert.deepEqual(gimmickTag({ kind: "armor", at: 0.55 }, true, true), { label: "Phase 3", tone: "phase3" });
  assert.deepEqual(gimmickTag({ kind: "revive" }, false), { label: "Once", tone: "once" });
  assert.deepEqual(gimmickTag({ kind: "charge", at: 0.7 }, false), { label: "At 70%", tone: "armed" });
  assert.deepEqual(gimmickTag({ kind: "fog" }, false), { label: "At 55%", tone: "armed" });
  assert.deepEqual(gimmickTag({ kind: "fog", at: Number.NaN }, false), { label: "At 55%", tone: "armed" });
  assert.deepEqual(gimmickTag({ kind: "fog", at: 1.4 }, false), { label: "At 100%", tone: "armed" });
  assert.deepEqual(gimmickTag(null, false), { label: "At 55%", tone: "armed" });
});

test("every villain gimmick gets a short tag that fits the plate", () => {
  for (const g of Object.values(VILLAIN_GIMMICKS)) {
    for (const live of [false, true]) {
      const { label } = gimmickTag(g, live);
      assert.ok(label.length > 0 && label.length <= 8, `${g.name}: ${label}`);
    }
  }
});
