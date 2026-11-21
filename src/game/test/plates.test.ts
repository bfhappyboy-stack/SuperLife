// 2026-11-21 night pass (STAKE_PLATES): the Arena's stakes plate on "Your call" crime scenes and the Duel K.O. card.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENTS } from "../events.ts";
import { crimePlate, duelVerdict, type DuelOutcome } from "../verdicts.ts";

test("every crime moment gets a short plate of its own; everyday moments and unknown ids get none", () => {
  const crimes = EVENTS.filter((e) => e.tags?.includes("crime"));
  assert.ok(crimes.length >= 8);
  for (const e of crimes) {
    const p = crimePlate(e.id);
    assert.ok(p, e.id);
    assert.equal(p.key, e.id, `${e.id} has its own label, not the fallback`);
    assert.ok(p.label.length <= 18 && p.line.length > 0 && p.line.length <= 40, `${e.id} fits the plate at 390px`);
    assert.ok(p.tone === "red" || p.tone === "steel", "trouble is red, a dark offer is steel; never gold");
  }
  assert.equal(crimePlate("villain-roof")?.label, "Rooftop standoff");
  assert.equal(crimePlate("witness-stair")?.tone, "red");
  assert.equal(crimePlate("villain-offer")?.tone, "steel");
  for (const id of ["birthday", "crush", "bus", "canon|whatever", "", undefined, null]) assert.equal(crimePlate(id), null, String(id));
});

const base: DuelOutcome = { ratio: 1, dealt: 120, taken: 70, turns: 6, hp: 0.4, foeHp: 0 };
const v = (o: Partial<DuelOutcome>) => duelVerdict({ ...base, ...o });

test("a won duel names how: flawless, by a whisker, boss down, quick work, dominant, hard fought", () => {
  assert.equal(v({ taken: 0, hp: 1 }).key, "flawless");
  assert.equal(v({ hp: 0.08 }).key, "whisker");
  assert.equal(v({ hp: 0.08, boss: true }).key, "whisker", "a scrape beats the boss line");
  assert.equal(v({ boss: true }).key, "boss");
  assert.equal(v({ turns: 3 }).key, "quick");
  assert.match(v({ turns: 3 }).line, /3 turns/);
  assert.equal(v({ turns: 1 }).line, "Over in 1 turn.");
  assert.equal(v({ dealt: 150, taken: 60 }).key, "dominant");
  assert.equal(v({}).key, "won");
  for (const o of [{}, { taken: 0 }, { hp: 0.1 }, { boss: true }]) assert.equal(v(o).tone, "gold");
});

test("draws and losses read honestly: double K.O., standoff, outclassed, so close, boss stands, beaten", () => {
  assert.equal(v({ ratio: 0.5, hp: 0, foeHp: 0 }).key, "double-ko");
  assert.equal(v({ ratio: 0.5, hp: 0.3, foeHp: 0.2 }).key, "standoff");
  assert.equal(v({ ratio: 0.5 }).tone, "steel");
  assert.equal(v({ ratio: 0, hp: 0, dealt: 0 }).key, "outclassed");
  assert.equal(v({ ratio: 0, hp: 0, foeHp: 0.1 }).key, "so-close");
  assert.equal(v({ ratio: 0, hp: 0, foeHp: 0.5, boss: true }).key, "boss-stands");
  const beaten = v({ ratio: 0, hp: 0, foeHp: 0.5, dealt: 40, taken: 100 });
  assert.equal(beaten.key, "beaten");
  assert.equal(beaten.line, "Outhit 100 to 40.");
  assert.equal(beaten.tone, "red");
  // Same cut as the K.O. card: >= .66 win, >= .33 draw.
  assert.equal(v({ ratio: 0.66 }).tone, "gold");
  assert.equal(v({ ratio: 0.33, hp: 0.2, foeHp: 0.2 }).key, "standoff");
  assert.equal(v({ ratio: 0.32, hp: 0, foeHp: 0.5 }).tone, "red");
});
