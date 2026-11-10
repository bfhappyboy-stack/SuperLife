// Life-sim pass 2026-11-10 pm: per-life markets, the squeeze hint, managers, morale and business events.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { AWAY_MUL, bizBooks, districtsOf, econOf, economyMonth, mateShareIfJoined, mgrCandidates, mgrWage, bizById, moraleTarget, noteFight, MANAGERS, type Biz } from "../economy.ts";
import { econRelocate, periodReport } from "../economy.ts";
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

const METRO = { cityId: "metro" };
function withCafe(money = 400_000): { g: Game; b: () => Biz } {
  let g = adult(30, money, METRO);
  g = act(g, "econ|biz|found|cafe");
  const uid = econOf(g)!.biz!.find((x) => x.kind === "cafe")!.uid;
  g.majorsLeft = 3;
  return { g, b: () => econOf(g)!.biz!.find((x) => x.uid === uid)! };
}
function run(g: Game, n: number, each?: (g: Game) => void): Game {
  for (let i = 0; i < n; i++) {
    g = month(g).g;
    g.majorsLeft = 3;
    each?.(g);
  }
  return g;
}
const bizOf = (g: Game, kind: string) => econOf(g)!.biz!.find((x) => x.kind === kind)!;

test("managers: hire one of three, their wage is on the books, and they keep a business running while you're away", () => {
  let { g } = withCafe();
  g = run(g, 8);
  const e = econOf(g)!;
  const cafe = bizOf(g, "cafe");
  const now = g.age * 12 + g.month;
  const cands = mgrCandidates(e, cafe, now);
  assert.equal(cands.length, 3);
  assert.equal(new Set(cands.map((m) => m.id)).size, 3);
  const plain = bizBooks(e, cafe, now, false);
  // Away with nobody in charge: sales drop by the away share.
  const away = bizBooks(e, cafe, now, false, true);
  assert.ok(Math.abs(away.revenue / plain.revenue - AWAY_MUL) < 0.02, "away sells less");
  const pick = cands.find((m) => m.trait !== "hustler") ?? cands[0]!;
  g = act(g, `econ|biz|mgr|${cafe.uid}|${pick.id}`);
  const hired = bizOf(g, "cafe");
  assert.equal(hired.mgr?.id, pick.id);
  const withMgr = bizBooks(econOf(g)!, hired, now, false, true);
  assert.equal(withMgr.wages - plain.wages, mgrWage(bizById("cafe")!, "metro"), "the manager's wage is on the books");
  assert.ok(withMgr.revenue >= plain.revenue * 0.97, "a manager covers for you away");
  assert.ok(MANAGERS.every((m) => m.name && m.line), "every manager is written");
  // Let go.
  g = act(g, `econ|biz|mgrout|${hired.uid}`);
  assert.equal(bizOf(g, "cafe").mgr, undefined);
});

test("moving city: an unmanaged business stays behind and slides; a managed one holds", () => {
  const a = withCafe();
  const g = run(a.g, 10);
  const repBefore = bizOf(g, "cafe").rep;
  const moved = structuredClone(g);
  moved.cityId = "nyc";
  const line = econRelocate(moved);
  assert.match(line ?? "", /stays behind with nobody in charge/);
  const slid = run(moved, 12);
  assert.ok(bizOf(slid, "cafe").rep < repBefore - 5, "reputation slides with nobody there");
  assert.ok(bizOf(slid, "cafe").morale! < 65, "and so does morale");
  // Same move with a manager.
  const managed = structuredClone(g);
  const cafe = bizOf(managed, "cafe");
  const pick = mgrCandidates(econOf(managed)!, cafe, managed.age * 12 + managed.month)[0]!;
  let m2 = act(managed, `econ|biz|mgr|${cafe.uid}|${pick.id}`);
  m2.cityId = "nyc";
  assert.equal(econRelocate(m2), null, "nothing to warn about");
  m2 = run(m2, 12);
  assert.ok(bizOf(m2, "cafe").rep >= repBefore, "a manager keeps the name up");
});

test("morale: short staff drags it down until people walk out; a full crew brings it back", () => {
  let { g } = withCafe();
  const cafe = bizOf(g, "cafe");
  const e = econOf(g)!;
  e.biz!.find((x) => x.uid === cafe.uid)!.staff = 1;
  assert.match(moraleTarget(g, bizOf(g, "cafe")).why, /short-staffed/);
  g = run(g, 30);
  const low = bizOf(g, "cafe");
  assert.ok(low.morale! < 50, `morale ${low.morale}`);
  econOf(g)!.biz!.find((x) => x.uid === cafe.uid)!.staff = 4;
  g = run(g, 12);
  assert.ok(bizOf(g, "cafe").morale! >= 60, "full crew, happy crew");
});

test("business events: something happens every year or so, from a varied pool, logged on the card, never with the engine dice", () => {
  const counts: Record<string, number> = {};
  let events = 0;
  for (const seed of [3, 4, 5, 6]) {
    let g = adult(30, 600_000, { ...METRO, seed });
    g = act(g, "econ|biz|found|cafe");
    const rng = g.rng;
    for (let i = 0; i < 120; i++) {
      const r = month(g);
      g = r.g;
      g.majorsLeft = 3;
      for (const b of r.banners) {
        const kind = /critic|viral for the wrong|walks out|Inspectors|rival|order|precinct|framed|blog|video/.exec(b)?.[0];
        if (kind) counts[kind] = (counts[kind] ?? 0) + 1;
      }
    }
    assert.equal(g.rng, rng, "events never roll the engine dice");
    const cafe = bizOf(g, "cafe");
    assert.ok((cafe.log ?? []).length <= 4);
    events += (cafe.log ?? []).length ? 1 : 0;
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  assert.ok(total >= 16 && total <= 80, `events in 40 business-years: ${total}`);
  assert.ok(Object.keys(counts).length >= 4, `kinds: ${JSON.stringify(counts)}`);
  assert.equal(events, 4);
});

test("fights reach your businesses: a win brings foot traffic, your own security firm guards the block", () => {
  let { g } = withCafe(2_000_000);
  g = run(g, 4);
  const rep = bizOf(g, "cafe").rep;
  const won = noteFight(g, true, "Moth King");
  assert.match(won ?? "", /Foot traffic is up/);
  assert.equal(bizOf(g, "cafe").rep, rep + 2);
  // Losses: find a month where the break-in roll lands, with and without a security firm.
  let looted = 0;
  let guarded = 0;
  for (let i = 0; i < 40; i++) {
    g = month(g).g;
    const plain = structuredClone(g);
    const cash = plain.stats.money;
    const line = noteFight(plain, false, "Moth King") ?? "";
    if (/Looters/.test(line)) {
      looted += 1;
      assert.ok(plain.stats.money < cash);
      const sec = structuredClone(g);
      sec.majorsLeft = 3;
      const s2 = act(sec, "econ|biz|found|security");
      bizOf(s2, "security").rep = 60;
      const l2 = noteFight(s2, false, "Moth King") ?? "";
      if (/had guards/.test(l2)) guarded += 1;
    }
  }
  assert.ok(looted >= 4, `looted ${looted}`);
  assert.ok(guarded >= 1, `guarded ${guarded}`);
});

test("old saves: a business from before managers and morale loads with a neutral crew and an empty log", () => {
  const { g } = withCafe();
  const old = structuredClone(g);
  const b = bizOf(old, "cafe") as Partial<Biz>;
  delete b.morale;
  delete b.log;
  delete b.mgr;
  (b as Biz & { mgr?: unknown }).mgr = { id: "nobody", since: 0 } as never;
  const fixed = act({ ...old, majorsLeft: 3 }, "econ|biz|staff|" + bizOf(old, "cafe").uid + "|1");
  const cafe = bizOf(fixed, "cafe");
  assert.equal(cafe.morale, 70);
  assert.deepEqual(cafe.log, []);
  assert.equal(cafe.mgr, undefined, "an unknown manager id is dropped");
});

test("the Play money report carries what happened at your businesses, even when the step stopped for something else", () => {
  let { g } = withCafe(600_000);
  let carried = 0;
  for (let i = 0; i < 120; i++) {
    const since = g.age * 12 + g.month;
    g = month(g).g;
    g.majorsLeft = 3;
    const cafe = bizOf(g, "cafe");
    const fresh = (cafe.log ?? []).filter((n) => n.at > since);
    const report = periodReport(g, since);
    if (fresh.length) {
      assert.ok(report?.biz?.some((b) => b.text === fresh.at(-1)!.text), "the newest business news is on the card");
      carried += 1;
    } else assert.equal(report?.biz?.length ?? 0, 0);
  }
  assert.ok(carried >= 4, `carried ${carried}`);
});
