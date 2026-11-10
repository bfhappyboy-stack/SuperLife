// Life-sim pass 2026-11-10 pm: per-life markets, the squeeze hint, managers, morale and business events.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { districtsOf, econOf, economyMonth, mateShareIfJoined } from "../economy.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "nyc", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

export function adult(age = 30, money = 200_000, over: Record<string, unknown> = {}): Game {
  const g = createGame({ ...BASE, ...over } as never);
  g.age = age;
  g.month = 3;
  g.phase = "live";
  g.pending = null;
  g.majorsLeft = 3;
  g.stats.money = money;
  g.stats.health = 70;
  return g;
}

export function month(g: Game): { g: Game; banners: string[] } {
  const d = structuredClone(g);
  d.month = (d.month + 1) % 12;
  if (d.month === 0) d.age += 1;
  const out = economyMonth(d);
  return { g: d, banners: out.banners };
}

test("markets: two lives with the same name and look but different seeds see different markets", () => {
  const a = econOf(adult(20, 0, { seed: 3 }))!;
  const b = econOf(adult(20, 0, { seed: 4 }))!;
  const c = econOf(adult(20, 0, { seed: 3 }))!;
  assert.notEqual(a.seed, b.seed);
  assert.notDeepEqual(a.lv, b.lv);
  assert.deepEqual(a.lv, c.lv, "same seed, same markets");
});

test("squeeze hint: three red months while paying rent points at a roommate, once per streak", () => {
  let g = adult(20, 20000);
  g.jobId = "retail";
  g.jobRank = 0;
  g = act(g, `econ|rent|flat|${districtsOf("nyc")[0]!.id}`);
  assert.equal(econOf(g)!.living, "lease");
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) {
    const r = month(g);
    g = r.g;
    seen.push(...r.banners.filter((b) => b.includes("more than comes in")));
  }
  assert.equal(seen.length, 1, "said once");
  assert.match(seen[0]!, /roommate would pay about \$[\d,]+/);
  assert.ok(mateShareIfJoined(g) > 0);
  // Back in the black resets the streak.
  g.jobId = "office";
  g.jobRank = 4;
  g = month(g).g;
  assert.equal(econOf(g)!.short, 0);
});
