// Living economy: markets, housing, wages and legend starts (2026-11-10). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, createGame, resolveMini } from "../engine.ts";
import {
  allSeries, annualWage, ARREARS_LIMIT, CITY_PROP, DISTRICTS, econOf, economyMonth, ensureEconomy, GOODS, HOME_MODS, homePrice, HOMES, homeEdge,
  homeValue, livingOf, marketRent, maxBuy, maxLoan, mortgagePayment, NEWS, netWorth, noteFight, quoteHome, quoteRent, quoteTrade, SELL_FEE,
  stockById, stockPrice, STOCKS, tradeFee, goodById,
} from "../economy.ts";
import { CITIES } from "../data.ts";
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

const BASE = { name: "Ava Reyes", cityId: "nyc", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function adult(age = 30, money = 200_000, over: Partial<Game> = {}): Game {
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

/** Pass a month through the economy only (no events), for clean maths. */
function month(g: Game): Game {
  const d = structuredClone(g);
  d.month = (d.month + 1) % 12;
  if (d.month === 0) d.age += 1;
  economyMonth(d);
  return d;
}

test("data: every city has three districts, ids are unique, news only moves real series", () => {
  for (const city of CITIES) {
    assert.equal(DISTRICTS[city.id]?.length, 3, city.id);
    assert.ok(CITY_PROP[city.id], city.id);
  }
  const uniq = (ids: string[]) => assert.equal(new Set(ids).size, ids.length);
  uniq(HOMES.map((h) => h.id));
  uniq(STOCKS.map((s) => s.id));
  uniq(GOODS.map((s) => s.id));
  uniq(HOME_MODS.map((s) => s.id));
  uniq(NEWS.map((s) => s.id));
  const keys = new Set(allSeries());
  for (const n of NEWS) for (const m of n.moves) {
    if (m.key.startsWith("s:") || m.key.startsWith("g:")) assert.ok(keys.has(m.key), `${n.id} → ${m.key}`);
    if (m.key.startsWith("sector:")) assert.ok(STOCKS.some((s) => s.sector === m.key.slice(7)), m.key);
  }
  for (const s of STOCKS) assert.ok(DISTRICTS[s.cityId], s.id);
});

test("new lives start with two years of market history and a few headlines", () => {
  const g = createGame(BASE as never);
  const e = econOf(g)!;
  assert.ok(e, "economy on a new life");
  for (const key of allSeries()) assert.equal(e.h[key]?.length, 24, key);
  assert.ok(e.news.length >= 1 && e.news.length <= 4);
  assert.equal(livingOf(g).kind, "family");
});

test("markets: deterministic, never touch the engine RNG, and stay in sane bounds over 80 years", () => {
  let a = adult(20);
  const rng = a.rng;
  const b = structuredClone(a);
  for (let i = 0; i < 12; i++) {
    a = month(a);
  }
  let c = b;
  for (let i = 0; i < 12; i++) c = month(c);
  assert.deepEqual(econOf(a)!.lv, econOf(c)!.lv, "same seed, same prices");
  assert.equal(a.rng, rng, "economy never rolls the engine dice");
  let moved = 0;
  let g = adult(10);
  const start = stockPrice(econOf(g)!, "STRK");
  for (let i = 0; i < 960; i++) {
    const before = stockPrice(econOf(g)!, "OSCP");
    g = month(g);
    if (stockPrice(econOf(g)!, "OSCP") !== before) moved += 1;
    const e = econOf(g)!;
    assert.ok(e.lv.rate! >= 2.5 && e.lv.rate! <= 10);
    for (const key of allSeries()) if (key !== "rate") assert.ok(e.lv[key]! >= 0.15 && e.lv[key]! <= 40, key);
  }
  assert.ok(moved > 900, "prices move almost every month");
  const e = econOf(g)!;
  assert.ok(e.news.length > 5, "headlines keep coming");
  const end = stockPrice(e, "STRK");
  assert.ok(end > start * 0.2 && end < start * 40, `STRK ${start} → ${end}`);
});

test("mortgage maths: the textbook payment, and the loan is gone exactly at term", () => {
  assert.equal(mortgagePayment(300_000, 6, 300), 1933);
  assert.equal(mortgagePayment(120_000, 0, 120), 1000);
  assert.equal(mortgagePayment(0, 6, 300), 0);
  let g = adult(30, 2_000_000, { jobId: "lab" } as Partial<Game>);
  g.jobId = "lab";
  const q = quoteHome(g, "flat", "queens", 0.5);
  assert.ok(q.ok, q.why);
  g = act(g, "econ|buy|flat|queens|50");
  const e = econOf(g)!;
  const home = e.homes.at(-1)!;
  assert.equal(home.mortgage!.bal, q.loan);
  assert.equal(home.mortgage!.pay, q.monthly);
  assert.equal(g.majorsLeft, 2, "moving day spends a move");
  assert.equal(livingOf(g).kind, "own");
  for (let i = 0; i < 299; i++) g = month(g);
  assert.ok(econOf(g)!.homes.at(-1)!.mortgage!.bal < q.monthly * 2, "about one payment left");
  g = month(g);
  assert.equal(econOf(g)!.homes.at(-1)!.mortgage, null, "paid off at month 300");
});

test("buying: deposit floor, the bank's limit on your income, and cash for deposit + closing", () => {
  const broke = adult(30, 500);
  assert.match(quoteHome(broke, "apartment", "queens", 0.2).why ?? "", /bank/i, "no income, no loan");
  const g = adult(30, 60_000);
  g.jobId = "office";
  const cap = maxLoan(g);
  assert.equal(cap, Math.round((4.5 * annualWage(g)) / 1000) * 1000);
  const q = quoteHome(g, "flat", "queens", 0.05);
  assert.equal(q.deposit, Math.round(q.price * 0.1), "10% minimum deposit");
  assert.equal(q.cash, q.deposit + q.closing);
  const big = quoteHome(g, "penthouse", "midtown", 0.1);
  assert.equal(big.ok, false);
  assert.match(big.why ?? "", /lends up to/);
  assert.ok(quoteHome(adult(17, 9e6), "flat", "queens", 1).why?.includes("18"), "no homes before 18");
});

test("selling: market value minus 5% fees minus what you still owe; can't sell underwater without the cash", () => {
  let g = adult(30, 3_000_000);
  g.jobId = "lab";
  g = act(g, "econ|buy|apartment|brooklyn|40");
  const e = econOf(g)!;
  const home = e.homes.at(-1)!;
  const value = homeValue(e, home);
  const owed = home.mortgage!.bal;
  const before = g.stats.money;
  g = act(g, `econ|sell|${home.uid}`);
  assert.equal(g.stats.money, before + Math.round(value * (1 - SELL_FEE) - owed));
  assert.equal(econOf(g)!.homes.length, 0);
  assert.notEqual(livingOf(g).kind, "own", "sold the home you lived in: you move out");
});

test("trading: a same-month round trip only ever loses the fees; you can't oversell or sell a trust", () => {
  let g = adult(25, 100_000);
  const p = stockPrice(econOf(g)!, "LEXC");
  const q = quoteTrade(g, "s", "LEXC", "buy", 100);
  assert.equal(q.total, Math.round(p * 100) + tradeFee("s", Math.round(p * 100)));
  g = act(g, "econ|trade|buy|s:LEXC|100");
  assert.equal(econOf(g)!.stocks.LEXC!.n, 100);
  assert.equal(quoteTrade(g, "s", "LEXC", "sell", 101).ok, false);
  g = act(g, "econ|trade|sell|s:LEXC|100");
  assert.ok(g.stats.money < 100_000, "round trip costs money");
  assert.equal(g.stats.money, 100_000 - q.fee - tradeFee("s", Math.round(p * 100)));
  assert.equal(econOf(g)!.stocks.LEXC, undefined);
  // Goods: spread, and a buy you can afford exactly.
  const n = maxBuy(g, "g", "gold");
  assert.ok(quoteTrade(g, "g", "gold", "buy", n).ok && !quoteTrade(g, "g", "gold", "buy", n + 5).ok);
  assert.equal(quoteTrade(adult(15, 1e6), "s", "LEXC", "buy", 1).ok, false, "trading opens at 16");
  // Slippage: big orders pay a higher rate.
  assert.ok(tradeFee("s", 2_000_000) / 2_000_000 > tradeFee("s", 10_000) / 10_000 * 3);
  assert.ok(goodById("isotope")!.minAge! > 18 && !quoteTrade(adult(19, 1e6), "g", "isotope", "buy", 1).ok);
});

test("renting: deposit + first month up front, rent every month, three months in the red and you're out", () => {
  let g = adult(22, 5_000);
  const q = quoteRent(g, "flat", "queens");
  assert.ok(q.ok, q.why);
  assert.equal(q.cash, q.rent * 2);
  g = act(g, "econ|rent|flat|queens");
  assert.equal(g.stats.money, 5_000 - q.cash);
  assert.equal(livingOf(g).kind, "lease");
  const m0 = g.stats.money;
  g = month(g);
  assert.equal(g.stats.money, m0 - q.rent, "no wage: rent comes straight out");
  g.stats.money = -100;
  for (let i = 0; i < ARREARS_LIMIT - 1; i++) {
    g = month(g);
    assert.equal(livingOf(g).kind, "lease");
  }
  g = month(g);
  assert.notEqual(livingOf(g).kind, "lease", "evicted");
  assert.equal(econOf(g)!.lease, null);
});

test("wages arrive monthly and the birthday no longer pays the job twice", () => {
  let g = adult(25, 0);
  g.jobId = "office";
  g.jobRank = 0;
  g.stats.happiness = 70;
  const wage = annualWage(g);
  assert.equal(wage, 42_000);
  g = month(g);
  assert.equal(g.stats.money, 3_500);
  // A full year through the engine: about one year's wage, not two.
  let h = adult(25, 0);
  h.jobId = "office";
  h.stats.happiness = 70;
  h.month = 0;
  for (let i = 0; i < 12; i++) {
    h = ageUp(h);
    if (h.phase === "choice") h = { ...h, phase: "live", pending: null };
    if (h.phase === "mini") h = resolveMini(h, 0.7);
  }
  assert.ok(h.stats.money < wage * 1.6 && h.stats.money > wage * 0.5, `year money ${h.stats.money}`);
});

test("letting: tenants pay most months; you can't let the home you live in", () => {
  let g = adult(35, 4_000_000);
  g = act(g, "econ|buy|flat|queens|100");
  const uid = econOf(g)!.homes.at(-1)!.uid;
  assert.equal(act(g, `econ|let|${uid}|on`).card.banner[0]?.includes("live there"), true);
  g.majorsLeft = 3;
  g = act(g, "econ|rent|room|brooklyn");
  g = act(g, `econ|let|${uid}|on`);
  assert.equal(econOf(g)!.homes[0]!.letOut, true);
  let paid = 0;
  for (let i = 0; i < 24; i++) {
    g = month(g);
    if (econOf(g)!.last!.lines.some((l) => l.label.startsWith("Tenants"))) paid += 1;
  }
  assert.ok(paid >= 18 && paid <= 24, `tenants paid ${paid}/24`);
  const e = econOf(g)!;
  assert.ok(marketRent(e, "flat", "nyc", "queens") > 0);
});

test("homes give real perks: a loft trains, upgrades fill slots, the couch drags your mood", () => {
  let g = adult(30, 3_000_000);
  assert.equal(homeEdge(g, "duel"), 0);
  g = act(g, "econ|buy|loft|brooklyn|100");
  const uid = econOf(g)!.homes.at(-1)!.uid;
  assert.ok(homeEdge(g, "duel") >= 0.04 && homeEdge(g, "pattern") === 0);
  for (const mod of ["gym", "panic", "medbay"]) g = act(g, `econ|mod|${uid}|${mod}`);
  assert.equal(econOf(g)!.homes.at(-1)!.mods.length, 3);
  assert.match(act(g, `econ|mod|${uid}|garden`).card.banner[0] ?? "", /slot/);
  assert.equal(livingOf(g).train, 3);
  assert.ok(homeValue(econOf(g)!, econOf(g)!.homes.at(-1)!) > homePrice(econOf(g)!, "loft", "nyc", "brooklyn"), "upgrades add value");
  // Couch-surfing: an orphaned adult with no place loses joy over time.
  let c = adult(30, 1_000);
  for (const r of c.relationships) if (r.role === "parent") r.alive = false;
  assert.equal(livingOf(c).kind, "couch");
  let joy = 0;
  for (let i = 0; i < 12; i++) {
    const d = structuredClone(c);
    d.month = (d.month + 1) % 12;
    joy += economyMonth(d).joy;
    c = d;
  }
  assert.ok(joy <= -3, `couch joy ${joy}`);
});

test("fights move the city: a win lifts a district and a local stock, once a month", () => {
  const g = adult(25);
  const e = econOf(g)!;
  const before = { ...e.lv };
  const line = noteFight(g, true, "Doc Ock");
  assert.ok(line && /homes \+2%/.test(line));
  const up = Object.keys(before).filter((k) => e.lv[k]! > before[k]!);
  assert.ok(up.some((k) => k.startsWith("p:nyc:")) && up.some((k) => k.startsWith("s:")));
  assert.match(e.news.at(-1)!.text, /Doc Ock/);
  assert.equal(noteFight(g, true, "Doc Ock"), null, "once a month: no farming");
  const h = adult(25);
  const lv = { ...econOf(h)!.lv };
  noteFight(h, false, "Rhino");
  assert.ok(Object.keys(lv).some((k) => k.startsWith("p:nyc:") && econOf(h)!.lv[k]! < lv[k]!), "a loss wrecks a block");
});

test("God Mode starts: Wayne Manor and Stark Mansion are family estates with trust shares; Peter rents at 18", () => {
  const bruce = createGame({ ...BASE, mode: "god", preset: "batman" } as never);
  const be = econOf(bruce)!;
  assert.equal(be.homes[0]?.name, "Wayne Manor");
  assert.equal(be.homes[0]?.estate, true);
  assert.equal(livingOf(bruce).name, "Wayne Manor");
  assert.ok(be.stocks.WAYN!.n > 0 && be.stocks.WAYN!.lockUntil === 18);
  assert.equal(quoteTrade({ ...bruce, age: 16 } as Game, "s", "WAYN", "sell", 1).why, "Held in trust until 18.");
  const tony = createGame({ ...BASE, mode: "god", preset: "iron-man" } as never);
  assert.equal(econOf(tony)!.homes[0]?.name, "Stark Mansion");
  assert.ok(econOf(tony)!.stocks.STRK!.n > 0);
  assert.ok(netWorth(tony) > 1_000_000);
  let peter = createGame({ ...BASE, mode: "god", preset: "spider-man" } as never);
  peter.age = 17;
  peter.month = 11;
  peter.phase = "live";
  peter.pending = null;
  peter = month(peter);
  assert.equal(livingOf(peter).kind, "lease");
  assert.equal(livingOf(peter).name, "Queens walk-up");
  assert.ok(econOf(peter)!.lease!.rent < marketRent(econOf(peter)!, "flat", "nyc", "queens"), "rent-controlled");
});

test("old saves without an economy load with one; a broken economy is repaired", () => {
  mem.clear();
  const old = adult(40, 12_345);
  delete (old as { economy?: unknown }).economy;
  save.saveSlot(1, old);
  const loaded = save.loadSlot(1)!;
  assert.ok(econOf(loaded), "migrated");
  assert.equal(loaded.stats.money, 12_345);
  assert.equal(econOf(loaded)!.h["s:STRK"]?.length, 24);
  const broken = adult(40);
  const e = broken.economy as unknown as Record<string, unknown>;
  e.homes = [{ uid: "x", homeId: "castle", cityId: "nyc", districtId: "nowhere" }];
  e.living = "x";
  delete e.stocks;
  (e.lv as Record<string, unknown>)["s:STRK"] = Number.NaN;
  const fixed = ensureEconomy(broken);
  assert.equal(fixed.homes.length, 0);
  assert.equal(fixed.living, null);
  assert.deepEqual(fixed.stocks, {});
  assert.equal(fixed.lv["s:STRK"], 1);
  assert.ok(stockById("STRK") && stockPrice(fixed, "STRK") > 0);
});
