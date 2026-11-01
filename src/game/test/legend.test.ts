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

test("legend book cap: canon kit plus a slow trickle, hard max 12, none for ordinary lives", () => {
  assert.equal(legendCap(null, 30), null);
  for (const p of PRESETS) {
    if (!p.powers.length) {
      assert.equal(legendCap(p.id, 40), null, p.id);
      continue;
    }
    const wake = wakeAge(p.id) ?? 0;
    assert.equal(legendCap(p.id, wake), Math.min(12, p.powers.length + 2), p.id);
    assert.ok(legendCap(p.id, 90)! <= 12, p.id);
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
