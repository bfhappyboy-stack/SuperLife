// Chains: expand any business to every city (2026-11-10 eve). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import {
  BRAND_UPS, brandLift, brandsOf, bizBooks, bizById, chainOf, chainOverhead, cityDemand, CITY_PROP, econOf, economyMonth, ensureEconomy, expandCost,
  expandOptions, EXPAND_GAP, MAX_BRANDS, mgrCandidates, quoteBiz, quoteExpand,
} from "../economy.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function owner(money = 5_000_000): Game {
  let g = createGame({ ...BASE } as never);
  g.age = 30;
  g.month = 2;
  g.phase = "live";
  g.pending = null;
  g.majorsLeft = 3;
  g.stats.money = money;
  g = act(g, "econ|biz|found|cafe");
  return g;
}

function months(g: Game, n: number): Game {
  const d = structuredClone(g);
  for (let i = 0; i < n; i += 1) {
    d.month = (d.month + 1) % 12;
    if (d.month === 0) d.age += 1;
    d.majorsLeft = 3;
    economyMonth(d);
  }
  return d;
}

const site0 = (g: Game) => econOf(g)!.biz!.find((b) => b.kind === "cafe")!;

test("expand: one site per city, every city reachable, each dearer than the last, one at a time", () => {
  let g = owner(50_000_000);
  const cities = Object.keys(CITY_PROP);
  assert.equal(expandOptions(g, site0(g)).length, cities.length - 1);
  assert.match(quoteExpand(g, site0(g), "nyc").why ?? "", /newest site needs/, "the first site needs a year");
  g = months(g, EXPAND_GAP);
  let prev = 0;
  for (const city of cities.filter((c) => c !== "metro")) {
    const q = quoteExpand(g, site0(g), city);
    assert.ok(q.ok, `${city}: ${q.why}`);
    const scaled = q.cost / Math.sqrt(CITY_PROP[city]!);
    assert.ok(scaled > prev, "each site costs more (city-adjusted)");
    prev = scaled;
    g.majorsLeft = 3;
    g = act(g, `econ|biz|expand|${site0(g).uid}|${city}`);
    assert.match(act(g, `econ|biz|expand|${site0(g).uid}|${city}`).card.banner[0]!, /Already open here|newest site/);
    g = months(g, EXPAND_GAP);
  }
  const chain = chainOf(econOf(g)!, site0(g));
  assert.equal(chain.n, cities.length, "in every city");
  assert.equal(new Set(chain.sites.map((b) => b.cityId)).size, cities.length);
  assert.equal(expandOptions(g, site0(g)).length, 0);
  assert.equal(brandsOf(econOf(g)!).length, 1, "still one brand");
});

test("diminishing returns: brand lift flattens, head office grows faster than the chain", () => {
  const lifts = [1, 2, 3, 4, 5, 6, 7, 8].map(brandLift);
  assert.equal(lifts[0], 0);
  for (let i = 2; i < lifts.length; i += 1) assert.ok(lifts[i]! - lifts[i - 1]! < lifts[i - 1]! - lifts[i - 2]! + 1e-9, "each city adds less lift");
  assert.ok(lifts[7]! < 0.12);
  const def = bizById("cafe")!;
  const per = [2, 4, 8].map((n) => chainOverhead(def, n) / (n - 1));
  assert.ok(per[0]! < per[1]! && per[1]! < per[2]!, "head office per extra city rises");
  assert.ok(expandCost(def, "metro", 7) > expandCost(def, "metro", 1) * 2.5, "the eighth city costs far more than the second");
});

test("each site sells to its own city's market", () => {
  const g = owner();
  const e = econOf(g)!;
  const values = Object.keys(CITY_PROP).map((c) => cityDemand(e, c));
  for (const v of values) assert.ok(v >= 0.85 && v <= 1.15);
  // Push one city's homes up hard: its demand rises, another city's doesn't move.
  const before = cityDemand(e, "nyc");
  const other = cityDemand(e, "dust");
  for (const k of Object.keys(e.lv).filter((k) => k.startsWith("p:nyc:"))) e.lv[k] = e.lv[k]! * 1.2;
  assert.ok(cityDemand(e, "nyc") > before);
  assert.equal(cityDemand(e, "dust"), other);
});

test("branches: own staff, manager and morale; away without a manager takes the penalty; chain upgrades reach every site", () => {
  let g = months(owner(20_000_000), EXPAND_GAP);
  g = act(g, `econ|biz|expand|${site0(g).uid}|nyc`);
  const e = econOf(g)!;
  const branch = e.biz!.find((b) => b.cityId === "nyc")!;
  assert.match(branch.name, /· New York/);
  assert.equal(branch.ramp, 9, "branches take longer to find their feet");
  const now = g.age * 12 + g.month + 24;
  const away = bizBooks(e, { ...branch, since: -999 }, now, false, true);
  const pick = mgrCandidates(e, branch, now)[0]!;
  const managed = bizBooks(e, { ...branch, since: -999, mgr: { id: pick.id, since: 0 } }, now, false, true);
  assert.ok(managed.revenue > away.revenue, "a manager lifts the away penalty");
  // Chain upgrade: one purchase, every site.
  const cash = g.stats.money;
  const before = bizBooks(e, { ...site0(g), since: -999 }, now, false).revenue;
  g = act(g, `econ|biz|brandup|${branch.uid}|identity`);
  assert.ok(g.stats.money < cash);
  const e2 = econOf(g)!;
  assert.deepEqual(chainOf(e2, site0(g)).ups, ["identity"]);
  assert.ok(bizBooks(e2, { ...site0(g), since: -999 }, now, false).revenue > before);
  assert.equal(BRAND_UPS.length, 4);
  // Head office shows in the ledger with two sites.
  g = months(g, 1);
  assert.ok(econOf(g)!.last!.lines.some((l) => l.label.startsWith("Head office ·")));
  // Selling a branch leaves the rest of the chain.
  g = act(g, `econ|biz|sell|${econOf(g)!.biz!.find((b) => b.cityId === "nyc")!.uid}`);
  assert.equal(chainOf(econOf(g)!, site0(g)).n, 1);
});

test("a chain is a decades goal: from one café to every city takes many years and stays sane", () => {
  let g = owner(200_000);
  g.jobId = null as never;
  let fullAt = 0;
  for (let m = 0; m < 12 * 35 && !fullAt; m += 1) {
    g = months(g, 1);
    const e = econOf(g)!;
    for (const b of e.biz ?? []) if (!b.mgr && b.cityId !== g.cityId) {
      const c = mgrCandidates(e, b, g.age * 12 + g.month)[0];
      if (c) g = act(g, `econ|biz|mgr|${b.uid}|${c.id}`);
    }
    const opt = expandOptions(g, site0(g)).find((o) => o.ok && o.profit > 0);
    g.majorsLeft = 3;
    if (opt && g.stats.money > opt.cost * 1.3) g = act(g, `econ|biz|expand|${site0(g).uid}|${opt.cityId}`);
    if (chainOf(econOf(g)!, site0(g)).n >= Object.keys(CITY_PROP).length) fullAt = g.age;
  }
  const years = (fullAt || g.age) - 30;
  assert.ok(years >= 12, `full chain after ${years} years`);
  const chain = brandsOf(econOf(g)!)[0]!;
  const monthly = chain.sites.reduce((s, b) => s + (b.pl.at(-1) ?? 0), 0);
  assert.ok(monthly < 120_000, `chain profit stays human-scale (${monthly}/mo)`);
});

test("three brands max still holds; a chain counts as one", () => {
  const g = months(owner(50_000_000), EXPAND_GAP);
  let d = act(g, `econ|biz|expand|${site0(g).uid}|nyc`);
  d.majorsLeft = 3;
  d = act(d, "econ|biz|found|gym");
  d.majorsLeft = 3;
  d = act(d, "econ|biz|found|truck");
  assert.equal(brandsOf(econOf(d)!).length, MAX_BRANDS);
  assert.match(quoteBiz(d, "security").why ?? "", /Three businesses/);
});

test("old saves: sites without a brand are their own brand; broken brand data is repaired", () => {
  const g = owner();
  const e = econOf(g)!;
  e.biz!.push({ ...structuredClone(site0(g)), uid: "orphan", cityId: "nyc", brand: "gone-forever" });
  e.brands = { [site0(g).uid]: { ups: ["identity", "bogus"] }, nobody: { ups: ["identity"] } };
  const fixed = ensureEconomy(g);
  assert.equal(fixed.biz!.find((b) => b.uid === "orphan")!.brand, undefined);
  assert.deepEqual(fixed.brands![site0(g).uid]!.ups, ["identity"]);
  assert.equal(fixed.brands!.nobody, undefined);
  delete (fixed as { brands?: unknown }).brands;
  assert.deepEqual(ensureEconomy(g).brands, {});
});
