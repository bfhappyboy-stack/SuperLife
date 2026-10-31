// Authored move coverage and element data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allPowers } from "../combo.ts";
import { movesForPower, STREET_MOVES, toDuel } from "../moves.ts";
import { ELEMENTS, elementOfLegacy, elementOfPower, isElement } from "../elements.ts";
import { AUTHORED } from "../moves.authored.ts";

const NOUNS = ["Strike", "Wave", "Hex", "Ward", "Rush", "Shape", "Verdict"];
const SKIP = new Set(["of", "the", "a", "an", "and", "with", "your", "you"]);
function stem(name: string): string {
  const words = name.replace(/[,.]/g, "").split(/\s+/).filter((word) => word && !SKIP.has(word.toLowerCase()));
  return (words.length ? words : [name]).slice(0, 2).join(" ");
}

test("no power in the book falls back to a generated '<Power> <Noun>' move name", () => {
  for (const power of allPowers()) {
    const generic = new Set(NOUNS.flatMap((noun) => [`${stem(power.name)} ${noun}`, `${stem(power.name)} ${noun} II`]));
    for (const move of movesForPower(power)) {
      if (!move.id.includes("::")) continue;
      assert.ok(!generic.has(move.name), `${power.id} still has a generated name: ${move.name}`);
    }
  }
});

test("every authored entry points at a real power and has real words", () => {
  const ids = new Set(allPowers().map((power) => power.id));
  for (const [id, words] of Object.entries(AUTHORED)) {
    assert.ok(ids.has(id), `authored moves for unknown power ${id}`);
    for (const move of [words.a, words.b]) {
      if (!move) continue;
      assert.ok(move.name.trim().length >= 3, `${id} name`);
      assert.ok(move.effect.trim().length >= 6, `${id} ${move.name} effect`);
      assert.ok(!move.effect.includes("..."), `${id} ${move.name} effect is truncated`);
      if (move.element) assert.ok(isElement(move.element), `${id} ${move.name} element ${move.element}`);
    }
  }
});

test("headline combos read as themselves", () => {
  const names = (id: string) => movesForPower(allPowers().find((power) => power.id === id)!).map((move) => move.name);
  assert.ok(names("light-speed").length >= 2);
  assert.ok(names("lightning-strikes").length >= 2);
  assert.equal(elementOfPower("light-speed"), "light");
  assert.equal(elementOfPower("lightning-strikes"), "lightning");
});

test("every move, street move and legacy villain power resolves to a known element", () => {
  for (const power of allPowers()) {
    assert.ok(isElement(elementOfPower(power.id)), power.id);
    for (const move of movesForPower(power)) {
      assert.ok(isElement(move.element), `${move.id} element ${move.element}`);
      const duel = toDuel(move, 3);
      assert.ok(isElement(duel.element), `${move.id} duel element`);
      assert.ok(!/· move \d/.test(duel.effect ?? ""), `${move.id} carries a placeholder effect`);
    }
  }
  for (const move of STREET_MOVES) assert.ok(isElement(move.element), move.name);
  for (const id of ["strength", "flight", "blasts", "speed", "telekinesis", "invisibility", "fire", "ice", "healing", "mind", "shapeshift", "forcefield", "intellect", "elastic", "lightning"]) {
    assert.ok(isElement(elementOfLegacy(id)), id);
  }
  for (const meta of Object.values(ELEMENTS)) assert.match(meta.color, /^#[0-9a-f]{6}$/i);
});
