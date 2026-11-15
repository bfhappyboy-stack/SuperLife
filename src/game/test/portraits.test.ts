// 2026-11-14 portraits pass: deterministic painted portraits for every procedural person.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageBand, pickPortrait, PORTRAITS, portraitsFor } from "../portraits.ts";

test("every band has both sexes, and capes exist", () => {
  for (const band of ["baby", "child", "teen", "adult", "older", "cape"] as const)
    for (const sex of ["male", "female"] as const) assert.ok(PORTRAITS.some((p) => p.band === band && p.sex === sex && !p.suited), `${band} ${sex}`);
});

test("same seed, same face; band and sex respected", () => {
  for (let seed = 1; seed < 200; seed++) {
    for (const [age, sex] of [[2, "female"], [8, "male"], [15, "female"], [30, "male"], [70, "female"]] as const) {
      const a = pickPortrait(seed, age, sex);
      assert.equal(a.id, pickPortrait(seed, age, sex).id);
      assert.equal(a.band, ageBand(age));
      assert.equal(a.sex, sex);
      assert.ok(!a.suited);
    }
  }
});

test("look steers skin tone and hair", () => {
  const dark = pickPortrait(7, 30, "female", { skin: 4, hair: 0 });
  assert.equal(dark.skin, "dark");
  const red = pickPortrait(7, 30, "female", { skin: 0, hair: 3 });
  assert.equal(red.hair, "red");
  assert.equal(red.skin, "light");
});

test("capes from 16 use the masked sheet; kids never do", () => {
  assert.equal(pickPortrait(3, 30, "male", null, true).band, "cape");
  assert.equal(pickPortrait(3, 12, "male", null, true).band, "child");
});

test("ageing past 55 moves to an older portrait", () => {
  assert.equal(pickPortrait(11, 54, "male").band, "adult");
  assert.equal(pickPortrait(11, 56, "male").band, "older");
  assert.ok(portraitsFor(16, "female").length >= 3);
});
