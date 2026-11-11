// Businesses: found, staff, upgrade, sell; legend family companies (2026-11-10). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { BIZ, bizBooks, bizById, bizNeed, bizValue, econOf, economyMonth, ensureEconomy, netWorth, quoteBiz, staffFactor, type Biz } from "../economy.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function adult(age = 30, money = 500_000, over: Record<string, unknown> = {}): Game {
  const g = createGame({ ...BASE, ...over } as never);
  g.age = age;
  g.month = 3;
  g.phase = "live";
  g.pending = null;
  g.majorsLeft = 3;
  g.stats.money = money;
  return g;
}

function month(g: Game): Game {
  const d = structuredClone(g);
  d.month = (d.month + 1) % 12;
  if (d.month === 0) d.age += 1;
  d.majorsLeft = 3;
  economyMonth(d);
  return d;
}

test("business data: unique ids, sane numbers, every upgrade costs and pays", () => {
  const ids = new Set(BIZ.map((b) => b.id));
  assert.equal(ids.size, BIZ.length);
  for (const b of BIZ) {
    assert.ok(b.upgrades.length >= 2, b.id);
    for (const u of b.upgrades) assert.ok(u.cost > 0 && u.rev > 0, `${b.id}/${u.id}`);
    if (!b.empire) assert.ok(b.cost > 0 && b.rev > 0 && b.staff > 0 && b.minAge >= 16, b.id);
  }
});

test("staff have diminishing returns: full staff is 1, each extra hire adds less", () => {
  assert.equal(staffFactor(0, 4), 0);
  assert.ok(Math.abs(staffFactor(4, 4) - 1) < 1e-9);
  const gains = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => staffFactor(s, 4) - staffFactor(s - 1, 4));
  for (let i = 1; i < gains.length; i += 1) assert.ok(gains[i]! < gains[i - 1]!, "each hire adds less");
  assert.ok(staffFactor(8, 4) < 1.3, "doubling staff is far from double output");
});

test("small businesses pay back in years, not months, and beat nothing only with work", () => {
  const g = adult(30, 5_000_000);
  for (const def of BIZ.filter((b) => !b.empire)) {
    const q = quoteBiz(g, def.id);
    assert.ok(q.ok, def.id);
    const payback = def.cost / q.profit;
    assert.ok(q.profit > 0 && payback > 18 && payback < 120, `${def.id} pays back in ${payback.toFixed(0)} months`);
  }
});

test("found, hire, upgrade, run and sell: money flows through the monthly ledger", () => {
  let g = adult(30, 200_000);
  assert.equal(quoteBiz({ ...g, age: 17 } as Game, "cafe").why, "Opens at 18.");
  g = act(g, "econ|biz|found|cafe");
  const e = econOf(g)!;
  assert.equal(e.biz!.length, 1);
  assert.equal(g.stats.money, 200_000 - bizById("cafe")!.cost);
  assert.equal(g.majorsLeft, 2, "opening day takes a move");
  const uid = e.biz![0]!.uid;
  assert.match(act(g, "econ|biz|found|cafe").card.banner[0]!, /already run one/);
  for (let i = 0; i < 8; i += 1) g = month(g);
  const b = econOf(g)!.biz![0]!;
  assert.equal(b.pl.length, 8);
  assert.ok(b.pl.at(-1)! > b.pl[0]!, "ramps up over the first months");
  assert.ok(econOf(g)!.last!.lines.some((l) => l.label.startsWith("Business ·")));
  const staff = b.staff;
  g = act(g, `econ|biz|staff|${uid}|1`);
  assert.equal(econOf(g)!.biz![0]!.staff, staff + 1);
  const cash = g.stats.money;
  g = act(g, `econ|biz|up|${uid}|roaster`);
  assert.equal(g.stats.money, cash - 28000);
  assert.ok(econOf(g)!.biz![0]!.ups.includes("roaster"));
  const value = bizValue(econOf(g)!, econOf(g)!.biz![0]!);
  assert.ok(value >= (95000 + 28000) * 0.5, "never sells below half of what went in");
  const before = g.stats.money;
  const worth = netWorth(g);
  g = act(g, `econ|biz|sell|${uid}`);
  assert.equal(econOf(g)!.biz!.length, 0);
  assert.equal(g.stats.money, before + value);
  assert.equal(netWorth(g), worth, "selling swaps the business for its value in cash");
});

test("understaffing hurts revenue and reputation; upgrades add staff needs", () => {
  const g = adult(30, 1_000_000);
  const e = ensureEconomy(g);
  const base: Biz = { uid: "t", kind: "gym", name: "Gym", cityId: "metro", staff: 5, ups: [], rep: 40, since: -999, invested: 240000, pl: [] };
  const full = bizBooks(e, base, 400, false);
  const thin = bizBooks(e, { ...base, staff: 2 }, 400, false);
  assert.ok(thin.revenue < full.revenue * 0.8);
  assert.equal(bizNeed({ ...base, ups: ["kids", "recovery"] }), 7);
  e.biz = [{ ...base, staff: 1 }];
  let d = g;
  for (let i = 0; i < 6; i += 1) d = month(d);
  assert.ok(econOf(d)!.biz![0]!.rep < 40, "short staff drags reputation");
});

test("Tony chairs Stark Industries and Bruce Wayne Enterprises: the board pays nothing until they come of age", () => {
  const bruce = createGame({ ...BASE, cityId: "crown", mode: "god", preset: "batman" } as never);
  const wayne = econOf(bruce)!.biz!.find((b) => b.kind === "wayne")!;
  assert.equal(wayne.name, "Wayne Enterprises");
  assert.equal(wayne.lockUntil, 18);
  let kid = structuredClone(bruce);
  kid.age = 12;
  kid.phase = "live";
  const cash = kid.stats.money;
  kid = month(kid);
  assert.ok(!econOf(kid)!.last!.lines.some((l) => l.label.includes("Wayne")), "no draw at 12");
  assert.ok(kid.stats.money >= cash - 1);
  let grown = structuredClone(bruce);
  grown.age = 18;
  grown.phase = "live";
  grown = month(grown);
  const draw = econOf(grown)!.last!.lines.find((l) => l.label === "Chair's draw · Wayne Enterprises");
  assert.ok(draw && draw.amount > 5000, "the chair's draw arrives at 18");
  assert.match(act(grown, `econ|biz|sell|${wayne.uid}`).card.banner[0]!, /isn't for sale/);
  const tony = createGame({ ...BASE, cityId: "neon", mode: "god", preset: "iron-man" } as never);
  assert.equal(econOf(tony)!.biz![0]!.name, "Stark Industries");
  assert.equal(econOf(tony)!.biz![0]!.lockUntil, 21);
  const peter = createGame({ ...BASE, cityId: "nyc", mode: "god", preset: "spider-man" } as never);
  assert.equal(econOf(peter)!.biz!.length, 0);
});

test("older economy saves get a business book (and a legend's company) on load", () => {
  const bruce = createGame({ ...BASE, cityId: "crown", mode: "god", preset: "batman" } as never);
  delete econOf(bruce)!.biz;
  const e = ensureEconomy(bruce);
  assert.equal(e.biz!.length, 1);
  assert.equal(e.biz![0]!.kind, "wayne");
  const g = adult();
  econOf(g)!.biz = [{ uid: "x", kind: "nope" } as never];
  assert.equal(ensureEconomy(g).biz!.length, 0);
});

test("shifts: owner shifts lift reputation with diminishing returns, and can be pinned to the Life Flow routine (2026-11-10 am)", async () => {
  const { shiftGain } = await import("../economy.ts");
  const { routineOptions, setRoutine, playStep, setPace, SHIFT_ROUTINE } = await import("../flow.ts");
  assert.equal(shiftGain(40), 6);
  assert.ok(shiftGain(70) < shiftGain(40) && shiftGain(95) === 1 && shiftGain(100) === 1, "less each time it's better known");
  let g = adult(30, 500_000);
  g = act(g, "econ|biz|found|cafe");
  const biz = econOf(g)!.biz!.find((b) => b.kind === "cafe")!;
  const opts = routineOptions(g);
  const id = `${SHIFT_ROUTINE}${biz.uid}`;
  assert.ok(opts.some((o) => o.id === id && /Shift at/.test(o.label)), opts.map((o) => o.id).join(","));
  assert.ok(opts.some((o) => o.id.startsWith("time:")), "time with someone can be pinned too");
  g = setRoutine(g, [id, "fight-everyone", "books"]);
  assert.deepEqual(g.routine, [id, "books"]);
  g = setPace(g, "month");
  g.majorsLeft = 3;
  const rep = biz.rep;
  const after = playStep(g);
  const now = econOf(after)!.biz!.find((b) => b.uid === biz.uid)!;
  assert.ok(now.rep > rep, `rep ${rep} -> ${now.rep}: the routine worked shifts`);
});

test("hero tie-ins: a well-run security firm passes leads, a start-up sends gadgets; each gives a one-fight edge (2026-11-10 am)", async () => {
  const { bizFightEdge, spendBizEdge, LEAD_EDGE, GADGET_EDGE } = await import("../economy.ts");
  let g = adult(32, 3_000_000);
  g = act(g, "econ|biz|found|security");
  g.majorsLeft = 3;
  g = act(g, "econ|biz|found|startup");
  for (const b of econOf(g)!.biz!) b.rep = 70;
  let leads = 0;
  let gadgets = 0;
  for (let i = 0; i < 36; i += 1) {
    g = month(g);
    for (const b of econOf(g)!.biz!) b.rep = 70;
    if (g.flags.lead) {
      leads += 1;
      const edge = bizFightEdge(g);
      assert.ok(edge.bonus >= LEAD_EDGE && edge.notes.length >= 1);
      spendBizEdge(g);
      assert.equal(g.flags.lead, undefined, "one fight uses the lead");
    }
    if ((g.flags.gadget ?? 0) >= 2) {
      gadgets += 1;
      assert.ok(bizFightEdge(g).bonus >= GADGET_EDGE);
      spendBizEdge(g);
      assert.equal(g.flags.gadget, 1, "one gadget per fight");
    }
  }
  assert.ok(leads >= 3 && leads <= 14, `leads ${leads} in 3 years`);
  assert.ok(gadgets >= 1, `gadgets ${gadgets}`);
  assert.ok(bizFightEdge(g).bonus <= LEAD_EDGE + GADGET_EDGE + 1e-9, "never more than a lead and a gadget");
  const low = adult(32, 3_000_000);
  const l2 = act(low, "econ|biz|found|security");
  for (const b of econOf(l2)!.biz!) b.rep = 30;
  let lowLeads = 0;
  let h = l2;
  for (let i = 0; i < 24; i += 1) {
    h = month(h);
    for (const b of econOf(h)!.biz!) b.rep = 30;
    if (h.flags.lead) lowLeads += 1;
  }
  assert.equal(lowLeads, 0, "a struggling firm hears nothing");
});
