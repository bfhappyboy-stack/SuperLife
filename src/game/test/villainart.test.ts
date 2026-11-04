// 2026-11-03 am: illustrated villain cards cover every Arena villain and the legend rogues' aliases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ARENA_ROSTER } from "../arena.roster.ts";
import { PRESETS } from "../presets.ts";
import { hasVillainArt, VILLAIN_ART_IDS, villainArtFor } from "../../components/game/villainArt.data.ts";

test("every Arena villain has an illustrated card", () => {
  const villains = ARENA_ROSTER.filter((f) => f.side === "villain");
  for (const v of villains) assert.ok(hasVillainArt(v.id), `${v.id} has no VillainArt spec`);
  assert.equal(new Set(VILLAIN_ART_IDS).size, VILLAIN_ART_IDS.length);
});

test("life-sim boss aliases map back to their card", () => {
  assert.equal(villainArtFor("Green Goblin")?.id, "goblin");
  assert.equal(villainArtFor("  the joker ")?.id, "joker");
  assert.equal(villainArtFor("Some Street Thug"), null);
  let mapped = 0;
  for (const p of PRESETS) for (const v of p.villains) if (villainArtFor(v.alias)) mapped++;
  assert.ok(mapped >= VILLAIN_ART_IDS.length, `only ${mapped} preset rogues map to art`);
});

// 2026-11-03 pm: 16 legend rogues joined the illustrated set; their preset aliases must find their cards.
test("legend rogues with cards map from their story aliases", () => {
  const cases: Array<[string, string]> = [
    ["Mysterio", "mysterio"], ["The Vulture", "vulture"], ["Kraven the Hunter", "kraven"], ["Two-Face", "two-face"],
    ["The Riddler", "riddler"], ["Scarecrow", "scarecrow"], ["The Penguin", "penguin"], ["Whiplash", "whiplash"],
    ["The Mandarin", "mandarin"], ["The Leader", "leader"], ["Brainiac", "brainiac"], ["Winter Soldier", "winter"],
    ["Baron Zemo", "zemo"], ["Klaw", "klaw"], ["Circe", "circe"], ["Malekith", "malekith"],
  ];
  for (const [alias, id] of cases) assert.equal(villainArtFor(alias)?.id, id, alias);
  // Every id in the art list is a real preset rogue or Arena villain, so no card goes unused.
  const known = new Set([...ARENA_ROSTER.map((f) => f.id), ...PRESETS.flatMap((p) => p.villains.map((v) => v.id))]);
  for (const id of VILLAIN_ART_IDS) assert.ok(known.has(id), `${id} isn't a known villain`);
});

// 2026-11-03 night: the last 15 rogues got cards, so every villain in the game (Arena + every legend's rogues) has one.
test("every legend rogue has an illustrated card", () => {
  for (const p of PRESETS) for (const v of p.villains) {
    assert.ok(hasVillainArt(v.id), `${p.id}: ${v.id} has no VillainArt spec`);
    assert.equal(villainArtFor(v.alias)?.id, v.id, v.alias);
  }
});
