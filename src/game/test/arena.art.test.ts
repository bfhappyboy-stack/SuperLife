// Saved lives in the Arena wear real art (2026-11-10 am): legends their painted portrait, mystery heroes poster art. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { fighterFromLife } from "../arena.lives.ts";
import { presetById } from "../presets.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function grown(over: Record<string, unknown>): Game {
  const g = createGame({ ...BASE, ...over } as never);
  g.age = 25;
  g.phase = "live";
  g.reveal = null;
  g.pending = null;
  return act(g, "focus|" + (g.unlockedPowers[0] ?? ""));
}

test("a saved legend fights in the legend's painted portrait and colours; a mystery life gets its power family", () => {
  const bruce = fighterFromLife(2, grown({ mode: "god", preset: "batman" }));
  assert.ok(bruce, "Bruce at 25 is draftable");
  const legend = presetById("batman")!;
  assert.equal(bruce.art, legend.art);
  assert.equal(bruce.world, "batman");
  assert.equal(bruce.color, legend.color);
  assert.match(bruce.title, /Age 25 · Batman/);
  assert.ok(!/Your life/.test(bruce.title), "the card already says Your life");
  const ava = grown({ mode: "god", giftIds: ["fire-control"] });
  ava.powerId = ava.powerId ?? ("fire-control" as never);
  const f = fighterFromLife(1, ava);
  assert.ok(f, "a powered life is draftable");
  assert.equal(f.art, undefined, "no painted art for a mystery hero");
  assert.equal(f.family, "fire");
  assert.notEqual(f.color, "#e6b34d", "coloured by the power, not the default gold");
});
