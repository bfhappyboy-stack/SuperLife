// 2026-11-14 night: a second costume per power family, seeded per life, stored on the save, falling back to suit A.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../engine.ts";
import { ART_FAMILIES, ensureSuit, mysteryKey, stageKey, suitForSeed, suitKeys } from "../heroArt.ts";
import { hasArt } from "../../assets/art/index.ts";
import type { Game } from "../types.ts";

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};
const save = await import("../save.ts");

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector", mode: "mystery" } as const;
const life = (seed: number): Game => createGame({ ...base, seed } as never);

test("each new life is born with a suit line from its seed, about half and half, without touching the random stream", () => {
  const suits = Array.from({ length: 400 }, (_, i) => suitForSeed(i + 1));
  const b = suits.filter((s) => s === "b").length;
  assert.ok(b > 160 && b < 240, `B share ${b}/400`);
  for (const seed of [1, 7, 42, 9001]) {
    const g = life(seed);
    assert.equal(g.suit, suitForSeed(seed));
    assert.equal(life(seed).suit, g.suit, "same seed, same suit");
  }
  // The suit is a pure hash of the seed: the rest of the life is identical to a life created before suits existed.
  const g = life(42);
  const { suit: _suit, ...rest } = g;
  void _suit;
  assert.deepEqual({ ...life(42), suit: undefined }, { ...rest, suit: undefined });
});

test("old saves without a suit get a stable one on load and keep it", () => {
  const old = life(5) as Partial<Game>;
  delete old.suit;
  mem.set("superlife.life.1.v1", JSON.stringify(old));
  const a = save.loadSlot(1);
  const b = save.loadSlot(1);
  assert.ok(a?.suit === "a" || a?.suit === "b");
  assert.equal(a?.suit, b?.suit, "same name and face, same suit every load");
  assert.equal(ensureSuit({ suit: "b", name: "x", portrait: 1 }), "b", "a stored suit is never re-rolled");
});

test("suit B is tried first and falls back to A when unpainted; the male speedster never changes", () => {
  assert.deepEqual(suitKeys("mystery-fire-f", "b"), ["mystery-fire-f-b", "mystery-fire-f"]);
  assert.deepEqual(suitKeys("mystery-fire-f", "a"), ["mystery-fire-f"]);
  assert.deepEqual(suitKeys("mystery-fire-f", undefined), ["mystery-fire-f"]);
  assert.deepEqual(suitKeys("mystery-swift-m", "b"), ["mystery-swift-m"]);
  assert.deepEqual(suitKeys("", "b"), []);
  // Whatever is painted, a B life always resolves to a real painting (B if present, else A) for every family and sex.
  for (const f of ART_FAMILIES) for (const sex of ["male", "female"] as const) {
    const card = suitKeys(mysteryKey(f, sex), "b").find((k) => hasArt(k));
    const cut = suitKeys(stageKey(f, sex, 14), "b").find((k) => hasArt(`cut-${k}`));
    assert.ok(card, `${f} ${sex} card`);
    assert.ok(cut, `${f} ${sex} cutout`);
  }
});

test("teens look for a teen painting first, then the grown suit; adults never do", async () => {
  const { stageKeys } = await import("../heroArt.ts");
  assert.deepEqual(stageKeys("ice", "female", 14, "b"), ["mystery-ice-f-b-teen", "mystery-ice-f-teen", "mystery-ice-f-b", "mystery-ice-f"]);
  assert.deepEqual(stageKeys("ice", "female", 14, "a"), ["mystery-ice-f-teen", "mystery-ice-f"]);
  assert.deepEqual(stageKeys("swift", "male", 13, "b"), ["mystery-swift-m-teen", "mystery-swift-m"]);
  assert.deepEqual(stageKeys("ice", "female", 16, "a"), ["mystery-ice-f"]);
  assert.deepEqual(stageKeys("ice", "female", 12, "a"), []);
});
