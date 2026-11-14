// 2026-11-11 art pass: every power family has a painted Mystery hero for both sexes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ART_FAMILIES, ART_MIN_AGE, familyOfPower, mysteryKey as mysteryArtKey } from "../heroArt.ts";
import { hasArt } from "../../assets/art/index.ts";

const FAMILIES = ART_FAMILIES;

test("every family has a painted hero for both sexes", () => {
  for (const f of FAMILIES) for (const sex of ["male", "female"] as const) {
    const key = mysteryArtKey(f, sex);
    assert.equal(key, `mystery-${f}-${sex === "male" ? "m" : "f"}`);
    assert.ok(hasArt(key));
  }
});

test("no family, or a child, keeps the paper doll", () => {
  assert.equal(mysteryArtKey(null, "male"), "");
  assert.equal(mysteryArtKey("fire", "female", ART_MIN_AGE - 1), "");
});

test("NPC powers map to a family", () => {
  assert.equal(familyOfPower("fire-control"), "fire");
  assert.equal(familyOfPower(null), null);
});

test("every street-villain archetype and Mystery hero has a stage cutout", async () => {
  const { STREET_CUTS, streetCutKey } = await import("../heroArt.ts");
  for (const p of STREET_CUTS) assert.ok(hasArt(streetCutKey(p)), p);
  assert.equal(streetCutKey("nonsense"), "cut-street-street");
  assert.ok(hasArt(streetCutKey(undefined)));
  for (const f of FAMILIES) for (const sex of ["male", "female"] as const) assert.ok(hasArt(`cut-${mysteryArtKey(f, sex)}`));
});
