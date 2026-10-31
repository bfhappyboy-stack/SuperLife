// Markets & economy. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, choose, createGame, resolveMini } from "../engine.ts";
import { CAT_ORDER, MARKET, gateOf, holdings, isBlackMarketOpen, itemById, marketEdge, marketYear, priceOf, shelfOf } from "../market.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "nyc", upbringing: "normal", portrait: 11, sex: "female", face: "secret", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function adult(over: Partial<Game> = {}, age = 30): Game {
  const g = createGame(BASE as never);
  g.age = age;
  g.month = 3;
  g.phase = "live";
  g.pending = null;
  g.majorsLeft = 3;
  g.stats.money = 5_000_000;
  g.stats.health = 60;
  return Object.assign(g, over);
}

test("every item has a valid category, a positive price and a unique id", () => {
  const ids = new Set<string>();
  for (const item of MARKET) {
    assert.ok(CAT_ORDER.includes(item.cat), item.id);
    assert.ok(item.price > 0, item.id);
    assert.ok(!ids.has(item.id), `duplicate ${item.id}`);
    ids.add(item.id);
  }
  for (const cat of CAT_ORDER) assert.ok(MARKET.filter((i) => i.cat === cat).length >= 4, `thin ${cat}`);
});

test("prices are deterministic per year and move with city, era and traits", () => {
  const nyc = adult();
  const hood = adult({ cityId: "hood" });
  const home = itemById("studio")!;
  assert.equal(priceOf(nyc, home), priceOf(structuredClone(nyc), home));
  assert.ok(priceOf(nyc, home) > priceOf(hood, home) * 1.6, "NYC property is far dearer than The Hood");
  const young = adult({}, 20);
  const old = adult({}, 70);
  const tech = itemById("smart-suit")!;
  assert.ok(priceOf(old, tech) < priceOf(young, tech), "tech gets cheaper by decade");
  assert.ok(priceOf(old, home) > priceOf(young, home), "property gets dearer by decade");
  const inventor = adult({ traits: ["inventor"] });
  assert.ok(priceOf(inventor, tech) < priceOf(nyc, tech) * 0.9, "Tech genius discount");
});

test("gates: black market, traits and age", () => {
  const clean = adult({ cityId: "crown" });
  assert.equal(isBlackMarketOpen(clean), false);
  assert.equal(gateOf(clean, itemById("fixer")!), "hidden");
  const crook = adult({ cityId: "crown", traits: ["underworld"] });
  assert.equal(gateOf(crook, itemById("fixer")!), null);
  assert.match(gateOf(clean, itemById("lab")!) ?? "", /Tech genius/);
  const kid = adult({}, 9);
  assert.equal(gateOf(kid, itemById("foundation")!), "hidden");
  assert.equal(gateOf(kid, itemById("first-aid")!), null);
});

test("buying costs money, applies effects, respects stock, and costs no moves", () => {
  let g = adult();
  const before = g.stats.money;
  const price = shelfOf(g, "supplies").find((r) => r.item.id === "clinic")!.price;
  g = act(g, "buy|clinic");
  assert.equal(g.stats.money, before - price);
  assert.ok(g.stats.health >= 85);
  assert.equal(g.majorsLeft, 3);
  const again = act(g, "buy|clinic");
  assert.equal(again.stats.money, g.stats.money, "stock of 1 per year");
  const broke = act(adult({ stats: { ...g.stats, money: 10 } }), "buy|clinic");
  assert.equal(broke.stats.money, 10);
});

test("property: upkeep and appreciation every birthday, sale at 92%", () => {
  let g = adult();
  assert.ok(shelfOf(g, "property").some((r) => r.item.id === "brownstone" && r.left > 0));
  g = act(g, "buy|brownstone");
  const asset = g.market!.assets.find((a) => a.itemId === "brownstone")!;
  assert.ok(asset);
  const h = holdings(g);
  assert.ok(h.upkeep > 0 && h.value === asset.value);
  const v0 = asset.value;
  const m0 = g.stats.money;
  const d = structuredClone(g);
  const out = marketYear(d);
  assert.ok(d.market!.assets[0].value > v0 * 1.0, "appreciates");
  assert.ok(d.stats.money < m0, "upkeep exceeds the small rent");
  assert.ok(out.banners.some((b) => /upkeep/.test(b)));
  const sold = act(d, `sell|${asset.uid}`);
  assert.equal(sold.market!.assets.length, 0);
  assert.equal(sold.stats.money, d.stats.money + Math.round(d.market!.assets[0].value * 0.92));
});

test("debt repossesses the dearest property", () => {
  let g = adult();
  const pick = shelfOf(g, "property").find((r) => !r.gate && r.left > 0 && !r.item.income)!;
  g = act(g, `buy|${pick.item.id}`);
  assert.equal(g.market!.assets.length, 1);
  g.stats.money = -19000;
  const d = structuredClone(g);
  const out = marketYear(d);
  assert.equal(d.market!.assets.filter((a) => itemById(a.itemId)?.cat === "property").length, 0);
  assert.ok(d.stats.money > 0);
  assert.ok(out.banners.some((b) => /bank/.test(b)));
});

test("gear gives a minigame edge and wears out; intel is spent", () => {
  let g = adult();
  g = act(g, "buy|wraps");
  g = act(g, "buy|tape");
  const d = structuredClone(g);
  const first = marketEdge(d, "duel");
  assert.ok(Math.abs(first.bonus - 0.19) < 1e-9);
  assert.equal(d.market!.assets.some((a) => a.itemId === "tape"), false, "intel spent");
  for (let i = 0; i < 3; i++) marketEdge(d, "duel");
  assert.equal(d.market!.assets.some((a) => a.itemId === "wraps"), false, "gear broke after its uses");
  assert.equal(marketEdge(d, "timing").bonus, 0);
});

test("edge lifts a borderline minigame into a win", () => {
  let g = adult();
  g = act(g, "buy|kevlar");
  g.phase = "mini";
  g.minigame = { kind: "duel", title: "t", subtitle: "s", difficulty: 1, winText: "WIN", partialText: "PART", loseText: "LOSE", winEffects: {}, partialEffects: {}, loseEffects: {} };
  const out = resolveMini(g, 0.6);
  assert.match(out.card.body, /^WIN/);
  assert.match(out.card.body, /Kit edge/);
});

test("legacy purchases add legacy, trust opens for the heir at 18", () => {
  let g = adult({}, 55);
  const l0 = g.legacy ?? 0;
  g = act(g, "buy|scholarship");
  assert.ok((g.legacy ?? 0) >= l0 + 7);
  g = act(g, "buy|trust");
  assert.ok((g.flags.trust ?? 0) > 100000);
  const kid = adult({}, 17);
  kid.flags.trust = 150000;
  kid.stats.money = 0;
  kid.age = 18;
  const out = marketYear(kid);
  assert.equal(kid.stats.money, 150000);
  assert.ok(out.banners.some((b) => /trust/.test(b)));
});

test("a full life with holdings still runs and stays solvent-ish", () => {
  let g = adult({}, 25);
  g = act(g, "buy|studio");
  let guard = 0;
  while (g.phase !== "dead" && g.age < 45 && guard++ < 4000) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0].id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
  }
  assert.ok(g.stats.money > -20001);
  assert.ok(g.market!.assets.length >= 0);
});
