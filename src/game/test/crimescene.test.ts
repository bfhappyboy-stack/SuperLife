// 2026-11-15 night: crime events put a painted street villain opposite you on the "Your call" scene.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENTS, eventHasTag } from "../events.ts";
import { crimeVillainKey, STREET_CUTS } from "../heroArt.ts";
import { hasArt } from "../../assets/art/index.ts";

test("crime events carry the crime tag; everyday moments don't; unknown ids are never crime", () => {
  for (const id of ["villain-roof", "villain-hire", "witness-stair", "nyc-platform", "mask-on", "maybe"]) assert.ok(eventHasTag(id, "crime"), id);
  for (const id of ["birthday", "crush", "bus", "anniversary", "lottery"]) assert.equal(eventHasTag(id, "crime"), false, id);
  assert.equal(eventHasTag("canon|whatever", "crime"), false);
  assert.equal(eventHasTag(undefined, "crime"), false);
  const tagged = EVENTS.filter((e) => e.tags?.includes("crime"));
  assert.ok(tagged.length >= 8, `${tagged.length} crime events`);
  assert.equal(new Set(tagged.map((e) => e.id)).size, tagged.length);
});

test("the crime villain is a painted street cutout, the same for the same moment, and varied across moments", () => {
  const a = crimeVillainKey("villain-roof", 24, 3);
  assert.deepEqual(crimeVillainKey("villain-roof", 24, 3), a, "deterministic");
  assert.ok(hasArt(a.key), `${a.key} is painted`);
  assert.ok(a.power === null || (STREET_CUTS as readonly string[]).includes(a.power));
  const seen = new Set<string>();
  for (const e of EVENTS.filter((ev) => ev.tags?.includes("crime"))) for (let age = 14; age < 40; age++) {
    const pick = crimeVillainKey(e.id, age, age % 12);
    assert.ok(hasArt(pick.key), pick.key);
    seen.add(pick.key);
  }
  assert.ok(seen.size >= 10, `only ${seen.size} villains used`);
  assert.equal(crimeVillainKey("", 20, 1).key, "");
});
