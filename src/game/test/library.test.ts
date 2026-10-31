// The braid book's room: a life can't hoard every power in the multiverse.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { basePowers, mix } from "../combo.ts";
import { LIBRARY_MAX, library, libraryCap, notePage, yearlyRoom } from "../library.ts";
import type { Game } from "../types.ts";

const base = {
  name: "Kai Moreno",
  cityId: "metro",
  upbringing: "supportive",
  portrait: 5,
  sex: "male",
  face: "secret",
  drive: "protector",
} as const;

test("book room grows with age and new pages slow down as it fills", () => {
  assert.equal(libraryCap(8), 6);
  assert.equal(libraryCap(40), 14);
  assert.equal(libraryCap(80), 24);
  assert.ok(libraryCap(200) <= LIBRARY_MAX);
  assert.deepEqual([yearlyRoom(0), yearlyRoom(8), yearlyRoom(16), yearlyRoom(29)], [3, 2, 1, 1]);
});

test("yearly allowance resets on a birthday", () => {
  const g = { age: 20, flags: {} as Game["flags"], unlockedPowers: ["a", "b"] };
  for (let i = 0; i < 3; i++) notePage(g);
  assert.match(library(g).block ?? "", /this year/);
  g.age = 21;
  assert.equal(library(g).block, null);
});

test("a full book refuses a new braid without spending the month", () => {
  const g = createGame({
    ...base,
    mode: "god",
    giftIds: ["fire-control", "super-speed", "flight"],
    seed: 3,
  } as never);
  g.age = 30;
  g.phase = "live";
  g.majorsLeft = 3;
  g.hiddenGift = null;
  const bases = basePowers().map((p) => p.id);
  g.unlockedPowers = bases.slice(0, libraryCap(30));
  let pair: [string, string] | null = null;
  for (const a of g.unlockedPowers)
    for (const b of g.unlockedPowers)
      if (!pair && a < b && mix(a, b, g.unlockedPowers).ok) pair = [a, b];
  assert.ok(pair, "found a pair that would mix");
  assert.ok(library(g).block);
  const before = JSON.stringify({ p: g.unlockedPowers, m: g.majorsLeft });
  const after = act(g, `mix|${pair![0]}|${pair![1]}`);
  assert.equal(JSON.stringify({ p: after.unlockedPowers, m: after.majorsLeft }), before);
  g.age = 40;
  const room = act(g, `mix|${pair![0]}|${pair![1]}`);
  assert.equal(
    room.unlockedPowers!.length,
    g.unlockedPowers.length + 1,
    "room at 40 lets the braid land",
  );
});
