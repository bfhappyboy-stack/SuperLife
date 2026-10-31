// Character-creation pools: palettes, drives, and new lives built from every option.
import { test } from "node:test";
import assert from "node:assert/strict";
import { HAIR, HAIR_NAMES, resolveLook, SKIN, SKIN_NAMES } from "../look.ts";
import { DRIVE_TRAITS, FACE_TRAITS } from "../origin.ts";
import { CITIES, UPBRINGINGS } from "../data.ts";
import { seedHeroes } from "../heroes.ts";
import { createGame } from "../engine.ts";

test("look palettes have a name per colour", () => {
  assert.equal(SKIN.length, SKIN_NAMES.length);
  assert.equal(HAIR.length, HAIR_NAMES.length);
  assert.ok(SKIN.length >= 12 && HAIR.length >= 14);
});

test("random looks stay on the original palettes so seeded faces never change", () => {
  for (let seed = 1; seed < 2000; seed++) {
    const look = resolveLook(seed);
    assert.ok(look.skin < 6 && look.hair < 7);
  }
  assert.equal(resolveLook(5, { skin: 11, hair: 13 }).skin, 11);
});

test("every drive is unique and its hero biases point at real heroes", () => {
  const ids = new Set(DRIVE_TRAITS.map((t) => t.id));
  assert.equal(ids.size, DRIVE_TRAITS.length);
  assert.ok(DRIVE_TRAITS.length >= 13 && FACE_TRAITS.length >= 2);
  const heroes = new Set(seedHeroes().map((h) => h.id));
  for (const t of DRIVE_TRAITS) for (const id of Object.keys(t.heroBias ?? {})) assert.ok(heroes.has(id), `${t.id} → ${id}`);
});

test("a life starts from every city, childhood and drive", () => {
  let n = 0;
  for (const city of CITIES)
    for (const up of UPBRINGINGS)
      for (const drive of DRIVE_TRAITS) {
        if ((n++ % 7) !== 0) continue;
        const g = createGame({ name: "Test Kid", cityId: city.id, upbringing: up.id, portrait: n, sex: n % 2 ? "female" : "male", face: FACE_TRAITS[n % 2].id, drive: drive.id, look: resolveLook(n, { skin: n % 12, hair: n % 14 }), giftId: null, seed: n });
        assert.equal(g.cityId, city.id);
        assert.ok(g.traits.includes(drive.id));
      }
});
