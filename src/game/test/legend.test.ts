// 2026-11-01 am pass: legend book cap, off-canon events, omen pacing, and the six-move refill.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, choose, createGame, omenWait, resolveMini } from "../engine.ts";
import { EVENTS, eligible } from "../events.ts";
import { legendCap, library } from "../library.ts";
import { fillLoadout, MOVESET_SIZE } from "../moves.ts";
import { omenCooldown, omenStage } from "../mystery.ts";
import { PRESETS, wakeAge } from "../presets.ts";
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

function live(g: Game, maxAge: number): Game {
  for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
  }
  return g;
}

test("legend book cap: canon kit plus a slow trickle, hard max 10, none for ordinary lives", () => {
  assert.equal(legendCap(null, 30), null);
  for (const p of PRESETS) {
    if (!p.powers.length) {
      assert.equal(legendCap(p.id, 40), null, p.id);
      continue;
    }
    const wake = wakeAge(p.id) ?? 0;
    assert.equal(legendCap(p.id, wake), Math.min(10, p.powers.length + 1), p.id);
    assert.ok(legendCap(p.id, 90)! <= 10, p.id);
    assert.ok(legendCap(p.id, wake + 12)! >= legendCap(p.id, wake)!, p.id);
  }
});

test("off-canon events never reach a legend life, but still reach ordinary lives", () => {
  const off = EVENTS.filter((e) => e.offCanon);
  assert.ok(off.some((e) => e.id === "maybe"));
  const legend = createGame({ ...base, preset: "wolverine", seed: 4 } as never);
  const plain = createGame({ ...base, seed: 4 } as never);
  for (const e of off) {
    assert.equal(
      eligible(e, { ...legend, age: 40, powerId: legend.powerId ?? "flight" } as Game),
      false,
      e.id,
    );
  }
  assert.ok(
    off.some((e) =>
      eligible(e, { ...plain, age: 30, powerId: "flight", flags: { ...plain.flags } } as Game),
    ),
  );
});

test("legend lives stay inside their book cap across a long life", () => {
  for (const id of ["wolverine", "black-panther", "flash"]) {
    const g = live(createGame({ ...base, preset: id, seed: 11 } as never), 50);
    const cap = legendCap(id, g.age)!;
    assert.ok(g.unlockedPowers.length <= cap + 1, `${id}: ${g.unlockedPowers.length} > ${cap}`);
    assert.ok(library(g).cap === cap);
  }
});

test("omens get louder near the wake and refill faster, with a cooldown between chases", () => {
  assert.equal(omenStage(7, 14), 0);
  assert.equal(omenStage(11, 14), 1);
  assert.equal(omenStage(12, 14), 2);
  assert.equal(omenStage(13, 14), 3);
  assert.ok(omenCooldown(0) > omenCooldown(3));
  let g = createGame({ ...base, mode: "mystery", seed: 5 } as never);
  g = live(g, 6);
  if (g.phase !== "live") return;
  const before = omenWait(g);
  assert.equal(before, 0);
  const after = act(g, "omen");
  assert.ok(omenWait(after) > 0);
});

test("the loadout refills to six after a stale id is pruned", () => {
  const g = live(createGame({ ...base, preset: "spider-man", seed: 3 } as never), 30);
  fillLoadout(g);
  if (g.loadout.length < MOVESET_SIZE) return; // not enough moves owned yet
  g.loadout[2] = "not-a-move";
  fillLoadout(g);
  assert.equal(g.loadout.length, MOVESET_SIZE);
  assert.equal(new Set(g.loadout).size, MOVESET_SIZE);
  assert.ok(!g.loadout.includes("not-a-move"));
});

test("legend signature growth: Superman's canon powers grow a little each birthday even unused; Mystery lives don't (2026-11-14)", async () => {
  const { ripenUsed, legendSignature, LEGEND_DRIFT_EXP, RIPEN_EXP, markUsed } = await import("../engine.ts");
  const clark = createGame({ ...base, mode: "god", preset: "superman" } as never);
  clark.age = 30;
  clark.unlockedPowers = ["super-strength", "flight", "super-durability", "fire-control"] as never;
  clark.mastery = { "super-strength": 0, flight: 0, "super-durability": 0, "fire-control": 0 };
  assert.deepEqual(legendSignature(clark), ["super-strength", "flight", "super-durability"]);
  clark.usedPowers = [];
  markUsed(clark, "super-strength");
  ripenUsed(clark);
  assert.equal(clark.mastery["flight"], LEGEND_DRIFT_EXP, "unused Flight still grows a little");
  assert.equal(clark.mastery["super-strength"], RIPEN_EXP, "a used signature power gets the normal ripening, not both");
  assert.equal(clark.mastery["fire-control"], 0, "an off-kit power still needs use");
  assert.ok(LEGEND_DRIFT_EXP > 0 && LEGEND_DRIFT_EXP < RIPEN_EXP, "drift is smaller than using it");
  // Mystery life: nothing grows unused.
  const mystery = createGame({ ...base, giftId: "flight", seed: 4 } as never);
  mystery.age = 30;
  mystery.unlockedPowers = ["flight"] as never;
  mystery.mastery = { flight: 0 };
  mystery.usedPowers = [];
  assert.deepEqual(legendSignature(mystery), []);
  ripenUsed(mystery);
  assert.equal(mystery.mastery["flight"], 0);
  // Batman has no kit: no drift.
  const bruce = createGame({ ...base, mode: "god", preset: "batman" } as never);
  assert.deepEqual(legendSignature(bruce), []);
});
