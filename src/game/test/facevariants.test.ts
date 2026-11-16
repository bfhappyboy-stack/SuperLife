// Painted variants of the same face for a life's creator picks (2026-11-16 am). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { FEATURE, featureShows, pickPortrait, portraitVariantKeys, PORTRAITS, variantHasFeature } from "../portraits.ts";
import { EYE_NAMES, EYE_PICK, resolveLook } from "../look.ts";

test("variant keys: feature + eyes first, then the feature, then the eyes; painted-in features and masked capes need none", () => {
  const adult = PORTRAITS.find((p) => p.id === "adult-3")!;
  assert.deepEqual(portraitVariantKeys(adult, FEATURE.glasses, 2), ["pv-adult-3-glasses-eyes-blue", "pv-adult-3-glasses", "pv-adult-3-eyes-blue"]);
  assert.deepEqual(portraitVariantKeys(adult, FEATURE.clear, 3), ["pv-adult-3-eyes-green"]);
  assert.deepEqual(portraitVariantKeys(adult, FEATURE.scar, null), ["pv-adult-3-scar"]);
  assert.deepEqual(portraitVariantKeys(adult, FEATURE.clear, 0), [], "as painted: no variant");
  const freckled = PORTRAITS.find((p) => p.marks?.includes(FEATURE.freckles))!;
  assert.deepEqual(portraitVariantKeys(freckled, FEATURE.freckles, null), [], "freckles already painted in");
  const cape = PORTRAITS.find((p) => p.band === "cape")!;
  assert.deepEqual(portraitVariantKeys(cape, FEATURE.scar, 2), []);
  assert.ok(variantHasFeature("pv-adult-3-glasses-eyes-blue", FEATURE.glasses));
  assert.ok(!variantHasFeature("pv-adult-3-eyes-blue", FEATURE.glasses));
});

test("glasses tell the truth: shown only on a face painted with them or a painted glasses variant", () => {
  const none = () => false;
  // Teens have no spectacled painting yet, so the creator (which previews at 16) must say so.
  for (let seed = 1; seed < 30; seed++) {
    const look = { skin: seed % 6, hair: seed % 7, feature: FEATURE.glasses };
    const meta = pickPortrait(seed, 16, "female", look, false, FEATURE.glasses);
    assert.equal(featureShows(seed, 16, "female", look, none), false);
    assert.ok(featureShows(seed, 16, "female", look, (k) => k === `pv-${meta.id}-glasses`), "a painted variant fixes it");
  }
  assert.ok(featureShows(3, 30, "male", { skin: 0, hair: 0, feature: FEATURE.scar }, none), "scars are always shown (soft marks)");
});

test("eye colour is optional in the look: kept when picked, never rolled, old looks unchanged; the pick is off until painted", () => {
  assert.equal(EYE_PICK, false);
  assert.equal(EYE_NAMES[0], "As painted");
  assert.equal(resolveLook(9, { skin: 1, hair: 2, style: 0, build: 0, feature: 0, eyes: 2 }).eyes, 2);
  assert.equal("eyes" in resolveLook(9), false, "random NPC looks get no eye colour");
  assert.equal("eyes" in resolveLook(9, { skin: 1, hair: 2, style: 0, build: 0, feature: 0 }), false, "old saves are unchanged");
  assert.equal("eyes" in resolveLook(9, { skin: 1, hair: 2, style: 0, build: 0, feature: 0, eyes: 0 }), false);
});
