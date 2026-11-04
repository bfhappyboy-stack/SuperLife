// PM pass (2026-11-03): Arena purses pay your active life, with daily diminishing returns.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../engine.ts";
import { payPurse, purseKey, purseQuote, PURSE_BASE, PURSE_DAILY, localDay } from "../arena.purse.ts";
import type { Game } from "../types.ts";

const adult = (): Game => {
  const g = createGame({ name: "Rae Okafor", cityId: "crown", upbringing: "street", portrait: 3, sex: "female", face: "secret", drive: "protector", mode: "mystery", seed: 41 } as never);
  return { ...g, age: 24 };
};
const base = { level: "pro" as const, won: true, rounds: [2, 1] as [number, number], day: "2026-11-03", opponent: "Thanos" };

test("a win pays the life, more for harder AI, and a loss pays a small appearance fee", () => {
  const g = adult();
  const rookie = purseQuote(g, { ...base, level: "rookie", key: "a" }).amount;
  const pro = purseQuote(g, { ...base, key: "a" }).amount;
  const legend = purseQuote(g, { ...base, level: "legend", key: "a" }).amount;
  assert.ok(rookie < pro && pro < legend, `${rookie} < ${pro} < ${legend}`);
  assert.equal(pro, PURSE_BASE.pro);
  const loss = purseQuote(g, { ...base, won: false, rounds: [1, 2], key: "a" }).amount;
  assert.ok(loss > 0 && loss < pro / 3);
  const sweep = purseQuote(g, { ...base, rounds: [2, 0], key: "a" }).amount;
  assert.ok(sweep > pro, "a sweep pays a bonus");
  const { game, quote } = payPurse(g, { ...base, key: "a" });
  assert.equal(game.stats.money, g.stats.money + quote.amount);
  assert.ok(game.history.at(-1)?.text.includes("Arena win"));
  assert.equal(game.history.at(-1)?.tag, "major");
  assert.ok(game.card.banner[0]?.startsWith("ARENA PURSE"));
  assert.equal(g.stats.money, adult().stats.money, "pure: the input life is untouched");
});

test("teens fight the junior card for half purses", () => {
  const g = { ...adult(), age: 15 };
  assert.equal(purseQuote(g, { ...base, key: "k" }).amount, Math.round((PURSE_BASE.pro * 0.5) / 25) * 25);
});

test("the same match never pays twice", () => {
  const first = payPurse(adult(), { ...base, key: "same" });
  const again = payPurse(first.game, { ...base, key: "same" });
  assert.equal(again.quote.already, true);
  assert.equal(again.game, first.game);
});

test("daily diminishing returns, then a cap, then a reset the next day", () => {
  let g = adult();
  const paid: number[] = [];
  for (let i = 0; i < PURSE_DAILY.length + 2; i++) {
    const r = payPurse(g, { ...base, key: `m${i}` });
    g = r.game;
    paid.push(r.quote.amount);
  }
  for (let i = 1; i < PURSE_DAILY.length; i++) assert.ok(paid[i]! <= paid[i - 1]!, `purse ${i + 1} is not bigger: ${paid.join(",")}`);
  assert.equal(paid[PURSE_DAILY.length], 0);
  assert.equal(paid[PURSE_DAILY.length + 1], 0);
  const total = paid.reduce((a, b) => a + b, 0);
  assert.ok(total < PURSE_BASE.pro * PURSE_DAILY.length, "farming is capped well under 'every match full price'");
  assert.equal(g.arenaPurse?.total, total);
  const tomorrow = payPurse(g, { ...base, key: "next", day: "2026-11-04" });
  assert.equal(tomorrow.quote.amount, PURSE_BASE.pro);
});

test("purse keys and local day helpers", () => {
  assert.equal(purseKey(5, ["life-2", "thor"]), "5:life-2,thor");
  assert.equal(localDay(new Date(2026, 10, 3, 23, 59)), "2026-11-03");
});

// Store wiring: the in-memory life is paid (so leaving the Arena can't overwrite it with a stale copy).
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

test("store.payArena pays the active slot and survives a flush", async () => {
  const save = await import("../save.ts");
  const { useGame } = await import("../store.ts");
  const life = adult();
  save.saveSlot(2, life);
  useGame.getState().hydrate();
  assert.equal(useGame.getState().slot, 2);
  const result = useGame.getState().payArena({ ...base, key: "store-1" });
  assert.ok(result && result.quote.amount > 0);
  useGame.getState().flush();
  assert.equal(save.loadSlot(2)?.stats.money, life.stats.money + result!.quote.amount);
  assert.equal(useGame.getState().game?.stats.money, life.stats.money + result!.quote.amount);
});
