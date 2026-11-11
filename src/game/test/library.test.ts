// The braid book's room and the rarity rules (2026-11-10 eve: "super powers are the most rare and powerful
// thing in this world and should be trained and nurtured").
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, choose, createGame } from "../engine.ts";
import { basePowers, mix } from "../combo.ts";
import { AWAKEN_GAP, BASE_MAX, LIBRARY_MAX, PAGE_GAP, awakenBlock, awakenRank, braidBlock, library, libraryCap, notePage, notePower, pageBlock, yearlyRoom } from "../library.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;

test("book room: one power as a child, then a page every 6 years, one a year at most", () => {
  assert.equal(libraryCap(8), 1);
  assert.equal(libraryCap(14), 1);
  assert.equal(libraryCap(15), 3);
  assert.equal(libraryCap(23), 5);
  assert.equal(libraryCap(31), 7);
  assert.ok(libraryCap(200) <= LIBRARY_MAX);
  assert.deepEqual([yearlyRoom(0), yearlyRoom(8), yearlyRoom(16)], [1, 1, 1]);
});

test("yearly allowance resets on a birthday", () => {
  const g = { age: 20, flags: {} as Game["flags"], unlockedPowers: ["a"] };
  notePage(g);
  assert.match(library(g).block ?? "", /this year/);
  g.age = 21;
  assert.equal(library(g).block, null);
});

function life(over: Partial<Game> = {}): Game {
  const g = createGame({ ...base, giftId: "fire-control", seed: 3 } as never);
  g.age = 25;
  g.phase = "live";
  g.majorsLeft = 3;
  g.flags = {};
  Object.assign(g, over);
  return g;
}

test("a new base power waits: 15+, years after the last, and a well-drilled power first", () => {
  const g = life();
  g.mastery = { "fire-control": 0 };
  assert.match(awakenBlock(g, "super-speed") ?? "", /rank C/, "D-rank Fire Control can't wake a second power");
  g.mastery["fire-control"] = 60;
  assert.equal(awakenBlock(g, "super-speed"), null);
  notePower(g, 0);
  assert.match(awakenBlock(g, "super-speed") ?? "", /settling/);
  g.age += AWAKEN_GAP;
  assert.equal(awakenBlock(g, "super-speed"), null);
  assert.equal(awakenRank(2), 3, "the third base wants rank B");
  assert.match(awakenBlock({ ...g, age: 14 }, "super-speed") ?? "", /15/);
  const full = life({ unlockedPowers: basePowers().slice(0, BASE_MAX).map((p) => p.id) });
  full.mastery = Object.fromEntries(full.unlockedPowers.map((id) => [id, 999]));
  assert.match(awakenBlock(full, basePowers()[BASE_MAX]!.id) ?? "", /base powers/);
});

test("a braid needs both halves at rank C and two years since the last new power", () => {
  const g = life({ unlockedPowers: ["fire-control", "super-speed"] });
  g.mastery = { "fire-control": 60, "super-speed": 0 };
  assert.match(braidBlock(g, "fire-control", "super-speed", "light-speed") ?? "", /Super Speed to rank C/);
  g.mastery["super-speed"] = 60;
  assert.equal(braidBlock(g, "fire-control", "super-speed", "light-speed"), null);
  g.flags.lastPageAge = g.age - 1;
  assert.match(pageBlock(g, "light-speed") ?? "", /more year/);
  g.flags.lastPageAge = g.age - PAGE_GAP;
  assert.equal(pageBlock(g, "light-speed"), null);
});

test("braiding is a journey: one session a month, six for a Gen 1 with a mentor, twice that alone", () => {
  let g = life({ unlockedPowers: ["fire-control", "super-speed"] });
  g.mastery = { "fire-control": 60, "super-speed": 60 };
  assert.ok(mix("fire-control", "super-speed", g.unlockedPowers).ok);
  let sessions = 0;
  for (let month = 0; month < 30 && !g.unlockedPowers.includes("light-speed"); month++) {
    g = { ...g, majorsLeft: 3, phase: "live", flags: { ...g.flags, powerLesson: 0 } };
    const once = act(g, "mix|fire-control|super-speed");
    if (once !== g) sessions += 1;
    assert.equal(act(once, "mix|fire-control|super-speed"), once, "one power lesson a month");
    g = once;
  }
  assert.ok(g.unlockedPowers.includes("light-speed"), "Light Speed lands in the end");
  assert.equal(sessions, 12, "alone: 12 sessions at half pace");
});

test("a stray spark doesn't stick: a brush with a power sharpens the one you hold", () => {
  const g = life();
  g.mastery = { "fire-control": 0 };
  g.phase = "choice";
  g.pending = { id: "spark-test", prompt: "A spark.", choices: [{ id: "take", label: "Take it" }], outcomes: { take: { text: "It sparks.", special: { kind: "grant", comboId: "ice-control" } } } };
  const n = choose(g, "take");
  assert.ok(!(n.unlockedPowers ?? []).includes("ice-control"));
  assert.ok((n.mastery?.["fire-control"] ?? 0) > 0);
  assert.match(n.card.body, /don't come that easily/);
});
