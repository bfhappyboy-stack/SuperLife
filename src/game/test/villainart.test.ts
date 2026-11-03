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
