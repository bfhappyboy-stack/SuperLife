// Data validator for the power book, combo rules, and movesets.
// Run: node --import ./src/game/test/resolve-ts.mjs --experimental-strip-types --test src/game/test/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOG, STARTER_IDS } from "../powers.catalog.ts";
import { allPowers, childGeneration, getPower, MAX_GENERATION, mix, possibleMixes, selfCheck } from "../combo.ts";
import { allMoveDefs, battleMoves, MOVESET_SIZE, movesForPower, STREET_MOVES } from "../moves.ts";
import { MOVE_BOOK } from "../moves.catalog.ts";
import { heroLevelCap, levelFor, settleHeroLevel } from "../heroes.ts";

const REQUIRED_BASES = [
  "fire-control", "ice-control", "lightning-control", "super-strength", "super-speed", "flight",
  "telekinesis", "telepathy", "energy-projection", "invisibility", "regeneration", "super-durability",
  "gravity", "weather", "super-senses", "force-field", "teleportation", "shape-shifting",
];

test("every id is unique and every recipe references real powers", () => {
  const ids = new Set<string>();
  for (const entry of CATALOG) {
    assert.ok(!ids.has(entry.id), `duplicate id ${entry.id}`);
    ids.add(entry.id);
  }
  for (const entry of CATALOG) {
    assert.ok(entry.ingredients.length === 0 || entry.ingredients.length === 2, `${entry.id} needs 0 or 2 ingredients`);
    for (const ingredient of entry.ingredients) assert.ok(ids.has(ingredient), `${entry.id} references missing ${ingredient}`);
    if (entry.ingredients.length === 2) assert.notEqual(entry.ingredients[0], entry.ingredients[1], `${entry.id} braids a power with itself`);
  }
});

test("each unordered pair has at most one recipe", () => {
  const seen = new Map<string, string>();
  for (const entry of CATALOG) {
    if (entry.ingredients.length !== 2) continue;
    const key = [...entry.ingredients].sort().join("+");
    assert.ok(!seen.has(key), `${entry.id} and ${seen.get(key)} share the pair ${key}`);
    seen.set(key, entry.id);
  }
});

test("all 18 design base powers exist at Generation 0", () => {
  for (const id of REQUIRED_BASES) {
    const power = getPower(id);
    assert.ok(power, `missing base ${id}`);
    assert.equal(power.generation, 0, `${id} should be Generation 0`);
  }
  for (const id of STARTER_IDS) assert.ok(getPower(id), `missing starter ${id}`);
});

test("generation = max(parents) + 1 and nothing passes Generation 2", () => {
  for (const power of allPowers()) {
    assert.ok(power.generation <= MAX_GENERATION, `${power.id} is Gen ${power.generation}`);
    if (power.ingredients.length !== 2) continue;
    const [a, b] = power.ingredients.map((id) => getPower(id)!);
    assert.ok(a.generation < MAX_GENERATION && b.generation < MAX_GENERATION, `${power.id} has a Gen 2 parent (${a.id}/${b.id})`);
    assert.equal(power.generation, Math.max(a.generation, b.generation) + 1, `${power.id} generation math`);
  }
  assert.equal(childGeneration(0, 0), 1);
  assert.equal(childGeneration(1, 0), 2);
  assert.equal(childGeneration(1, 1), 2);
  assert.equal(childGeneration(2, 0), null);
});

test("required chain: Fire Control + Super Speed → Light Speed → + Super Strength → Lightning Strikes", () => {
  const owned = [...STARTER_IDS] as string[];
  const first = mix("fire-control", "super-speed", owned);
  assert.ok(first.ok, "step 1 should mix");
  assert.equal(first.power.id, "light-speed");
  assert.equal(first.power.generation, 1);
  const second = mix("light-speed", "super-strength", [...owned, "light-speed"]);
  assert.ok(second.ok, "step 2 should mix");
  assert.equal(second.power.id, "lightning-strikes");
  assert.equal(second.power.generation, 2);
  const swapped = mix("super-strength", "light-speed", [...owned, "light-speed"]);
  assert.ok(swapped.ok && swapped.power.id === "lightning-strikes", "order must not matter");
});

test("a Generation 2 power can never be a parent (cap enforced in mix and in the lab list)", () => {
  const owned = ["fire-control", "super-speed", "super-strength", "light-speed", "lightning-strikes", "weather"];
  const capped = mix("lightning-strikes", "weather", owned);
  assert.equal(capped.ok, false);
  if (!capped.ok) assert.match(capped.reason, /Generation 2/);
  for (const option of possibleMixes(owned)) {
    assert.ok(option.left.generation < MAX_GENERATION && option.right.generation < MAX_GENERATION, "lab offered a Gen 2 parent");
  }
  assert.ok(!mix("fire-control", "fire-control", owned).ok, "self-mix must fail");
  assert.ok(!mix("fire-control", "gravity", owned).ok, "unowned power must fail");
});

test("any two unlocked Gen 0/1 powers mix, even without a named recipe", () => {
  const owned = ["sorcery", "super-strength"];
  const result = mix("sorcery", "super-strength", owned);
  assert.ok(result.ok);
  assert.equal(result.power.generation, 1);
});

test("combo.selfCheck() reports nothing", () => {
  assert.deepEqual(selfCheck(), []);
});

test("every power has moves, combo powers unlock their own, and move names are unique", () => {
  const ids = new Set<string>();
  const names = new Map<string, string>();
  for (const power of allPowers()) {
    const moves = movesForPower(power);
    assert.ok(moves.length >= 2, `${power.id} has ${moves.length} moves`);
    assert.equal(moves[0]?.minMastery, 1, `${power.id} first move should unlock at rank 1`);
    for (const move of moves) {
      assert.equal(move.powerId, power.id);
      assert.ok(!ids.has(move.id), `duplicate move id ${move.id}`);
      ids.add(move.id);
      assert.ok(!names.has(move.name), `move name "${move.name}" used by ${power.id} and ${names.get(move.name)}`);
      names.set(move.name, power.id);
    }
  }
  for (const def of MOVE_BOOK) assert.ok(getPower(def.powerId), `hand move ${def.id} points at missing ${def.powerId}`);
  assert.ok(allMoveDefs().length >= allPowers().length * 2);
});

test("a battle always uses exactly six moves", () => {
  assert.equal(MOVESET_SIZE, 6);
  assert.ok(STREET_MOVES.length >= MOVESET_SIZE);
  const fresh = { loadout: [], unlockedPowers: ["fire-control"], mastery: {}, moveExp: {} };
  assert.equal(battleMoves(fresh).length, 6);
  const fire = movesForPower(getPower("fire-control")!);
  const one = { ...fresh, loadout: [fire[0]!.id] };
  const kit = battleMoves(one);
  assert.equal(kit.length, 6);
  assert.equal(kit[0]?.name, fire[0]!.name);
  assert.equal(new Set(kit.map((move) => move.name)).size, 6, "no duplicate moves in a battle");
});

test("hero levels grow slowly, are capped by bond, and never drop", () => {
  const hero = { exp: 2000, level: 1, relationship: 10 };
  settleHeroLevel(hero);
  assert.equal(hero.level, heroLevelCap(10));
  hero.relationship = 90;
  settleHeroLevel(hero);
  assert.equal(hero.level, levelFor(2000));
  hero.relationship = 5;
  settleHeroLevel(hero);
  assert.equal(hero.level, levelFor(2000), "a bond dip must not strip earned levels");
});
