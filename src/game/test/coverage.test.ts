// Loadout style coverage: auto-fill, street padding, and shelf warnings (2026-11-07 night).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../engine.ts";
import {
  battleMoves,
  fillLoadout,
  loadoutWarnings,
  missingStyles,
  MOVESET_SIZE,
  moveById,
  styleCounts,
} from "../moves.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "nyc", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;

function kit(powers: string[], loadout: string[] = [], exp = 300): Game {
  const g = createGame({ ...base, mode: "god", giftIds: powers, seed: 11 } as never);
  g.unlockedPowers = [...powers];
  g.mastery = Object.fromEntries(powers.map((id) => [id, exp]));
  g.loadout = [...loadout];
  fillLoadout(g);
  return g;
}

test("fillLoadout covers missing styles when topping up", () => {
  const g = kit(["super-strength", "super-durability", "flight"], ["str-hands"]);
  assert.ok(g.loadout.length >= 3);
  const counts = styleCounts(g.loadout.map((id) => moveById(id)?.style));
  assert.equal(missingStyles(counts).length, 0, `expected full coverage, got ${JSON.stringify(counts)} from ${g.loadout}`);
  assert.ok(counts.guard >= 1 && counts.strike >= 1 && counts.trick >= 1);
});

test("fillLoadout swaps a surplus style for a missing one once the six is full", () => {
  const g = kit(["super-strength", "super-durability", "flight", "super-speed", "energy-projection"], []);
  // Hand-build a six with no guard, leaving Stand Firm on the bench.
  g.loadout = ["str-hands", "str-pound", "flight::a", "flight::b", "speed-cut", "energy-projection::a"];
  assert.equal(styleCounts(g.loadout.map((id) => moveById(id)?.style)).guard, 0);
  assert.ok(!g.loadout.includes("super-durability::a"));
  fillLoadout(g);
  const counts = styleCounts(g.loadout.map((id) => moveById(id)?.style));
  assert.ok(counts.guard >= 1, `expected a guard after rebalance: ${JSON.stringify(counts)} ${g.loadout}`);
  assert.ok(g.loadout.some((id) => moveById(id)?.style === "guard" && !["str-hands", "str-pound", "flight::a", "flight::b", "speed-cut", "energy-projection::a"].includes(id)), "a guard came off the bench");
});

test("battleMoves street-covers a missing style even when the six is full", () => {
  const g = kit(["super-strength", "flight", "energy-projection"], [], 300);
  g.loadout = ["str-hands", "str-pound", "flight::a", "flight::b", "energy-projection::a", "energy-projection::b"];
  const before = styleCounts(g.loadout.map((id) => moveById(id)?.style));
  assert.equal(before.guard, 0, `fixture should lack guard: ${JSON.stringify(before)}`);
  const warns = loadoutWarnings(g);
  assert.ok(warns.some((w) => /No guard/.test(w)), warns.join(" | "));
  const fight = battleMoves(g);
  assert.equal(fight.length, MOVESET_SIZE);
  const after = styleCounts(fight.map((m) => m.style));
  assert.ok(after.guard >= 1, `fight must cover guard: ${JSON.stringify(after)} ${fight.map((m) => m.name + ":" + m.style)}`);
  assert.ok(fight.some((m) => (m.id ?? "").startsWith("street::") && m.style === "guard"));
});

test("super-durability unlocks a guard at mastery 1 (Stand Firm first)", () => {
  const def = moveById("super-durability::a");
  assert.ok(def);
  assert.equal(def!.style, "guard");
  assert.equal(def!.name, "Stand Firm");
});

test("force-field and aegis-shell unlock a guard at their first move", () => {
  assert.equal(moveById("force-field::a")?.style, "guard");
  assert.equal(moveById("force-field::a")?.name, "Dome");
  assert.equal(moveById("aegis-shell::a")?.style, "guard");
  assert.equal(moveById("aegis-shell::a")?.name, "Aegis");
});

test("super-strength Ground Pound is a trick so the power covers two styles", () => {
  const pound = moveById("str-pound");
  assert.ok(pound);
  assert.equal(pound!.style, "trick");
  assert.equal(moveById("str-hands")?.style, "strike");
});
