// Ties: personality, trust, lending and borrowing with the people in your life (2026-11-10 late). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, createGame } from "../engine.ts";
import { borrowBlock, openLoan, payChance, temperOf, termFor, tieAct, tieMonth, trustOf } from "../ties.ts";
import type { Game, Person } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function adult(money = 20000): Game {
  const g = createGame({ ...BASE } as never);
  g.age = 28;
  g.month = 3;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 80;
  g.stats.money = money;
  return g;
}

function friend(g: Game, id: string, over: Partial<Person> = {}): Person {
  const p: Person = { id, name: `Sam ${id}`, role: "friend", closeness: 60, age: 28, alive: true, metAt: 10, ...over };
  g.relationships = [...g.relationships.filter((r) => r.id !== id), p];
  return p;
}

function months(g: Game, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    g.month = ((g.month ?? 0) + 1) % 12;
    if (g.month === 0) g.age += 1;
    tieMonth(g, out);
  }
  return out;
}

test("everyone has a personality and a trust meter; both are stable", () => {
  const g = adult();
  const p = friend(g, "p900");
  assert.deepEqual(temperOf(p), temperOf({ ...p }));
  assert.equal(trustOf(p), 50);
  const kinds = new Set(Array.from({ length: 60 }, (_, i) => temperOf({ id: `p${i}`, name: `N ${i}`, role: "friend" }).id));
  assert.ok(kinds.size >= 4, [...kinds].join());
  assert.ok(payChance({ ...p, id: "x" }) > 0.1 && payChance(p) < 0.99);
});

test("lend: cash goes out, a schedule starts, and a good payer pays it all back", () => {
  let found: Person | null = null;
  const g = adult();
  for (let i = 0; i < 80 && !found; i += 1) {
    const p = friend(g, `q${i}`, { closeness: 80 });
    if (temperOf(p).id === "steady") found = p;
    else g.relationships = g.relationships.filter((r) => r.id !== p.id);
  }
  assert.ok(found);
  const res = tieAct(g, `tie|lend|${found!.id}|1000`);
  assert.ok(res.ok, res.line);
  assert.equal(g.stats.money, 19000);
  const loan = openLoan(g, found!.id)!;
  assert.equal(loan.monthly, Math.ceil(1000 / termFor(1000)));
  assert.equal(found!.closeness, 83);
  assert.equal(tieAct(g, `tie|lend|${found!.id}|200`).ok, false, "one open loan per person");
  months(g, 24);
  const back = g.loans!.find((l) => l.id === loan.id)!;
  assert.ok(back.status === "paid" || back.status === "open", back.status);
  assert.ok(g.stats.money >= 19000 + 500, `got some back: ${g.stats.money}`);
});

test("non-payers: across many people, slippery ones stop paying far more often, and it costs trust", () => {
  const rate = (kind: string) => {
    let bad = 0;
    let n = 0;
    for (let i = 0; i < 300 && n < 25; i += 1) {
      const g = adult();
      const p = friend(g, `r${i}`, { closeness: 50 });
      if (temperOf(p).id !== kind) continue;
      n += 1;
      tieAct(g, `tie|lend|${p.id}|5000`);
      months(g, 30);
      const l = g.loans![0]!;
      if (l.status === "unpaid") {
        bad += 1;
        assert.ok(trustOf(p) < 50, "trust falls when they stop paying");
        assert.ok(p.history!.some((h) => /Stopped paying/.test(h.line)));
      }
    }
    return bad / Math.max(1, n);
  };
  const slippery = rate("slippery");
  const steady = rate("steady");
  assert.ok(slippery >= 0.5, `slippery default rate ${slippery}`);
  assert.ok(steady <= 0.15, `steady default rate ${steady}`);
});

test("forgive or chase what's owed", () => {
  const g = adult();
  const p = friend(g, "f1");
  tieAct(g, "tie|lend|f1|1000");
  const id = g.loans![0]!.id;
  const before = p.closeness;
  assert.ok(tieAct(g, `tie|forgive|${id}`).ok);
  assert.equal(g.loans![0]!.status, "forgiven");
  assert.ok(p.closeness > before);
  tieAct(g, "tie|lend|f1|200");
  const id2 = g.loans![1]!.id;
  assert.ok(tieAct(g, `tie|chase|${id2}`).ok);
  assert.equal(tieAct(g, `tie|chase|${id2}`).ok, false, "once a month");
});

test("borrow: they have to like and trust you; it comes out of your cash monthly; missing it hurts", () => {
  const g = adult(100);
  const mom = friend(g, "m1", { role: "parent", closeness: 45 });
  assert.match(borrowBlock(g, mom)!, /close/);
  mom.closeness = 70;
  mom.trust = 30;
  assert.match(borrowBlock(g, mom)!, /trust/);
  mom.trust = 60;
  assert.equal(borrowBlock(g, mom), null);
  assert.equal(tieAct(g, "tie|borrow|m1|9999").ok, false, "only what they can spare");
  assert.ok(tieAct(g, "tie|borrow|m1|2000").ok);
  assert.equal(g.stats.money, 2100);
  const loan = g.loans![0]!;
  months(g, 1);
  assert.equal(g.stats.money, 2100 - loan.monthly);
  g.stats.money = 0;
  const lines = months(g, 1);
  assert.ok(lines.some((l) => /couldn't pay/.test(l)));
  assert.equal(trustOf(mom), 54);
  g.stats.money = 5000;
  assert.ok(tieAct(g, `tie|payoff|${loan.id}`).ok);
  assert.equal(loan.status, "paid");
  assert.ok(trustOf(mom) > 54);
});

test("someone close asks for help now and then; yes makes a loan, no costs a little closeness", () => {
  const g = adult(50000);
  friend(g, "a1", { closeness: 70 });
  friend(g, "a2", { closeness: 70 });
  friend(g, "a3", { role: "parent", closeness: 70 });
  let asks = 0;
  for (let m = 0; m < 240; m += 1) {
    months(g, 1);
    if (g.tieAsk && g.tieAsk.until === g.age * 12 + (g.month ?? 0) + 12) {
      asks += 1;
      const p = g.relationships.find((r) => r.id === g.tieAsk!.personId)!;
      const c = p.closeness;
      if (asks % 2) {
        assert.ok(tieAct(g, "tie|help|yes").ok);
        assert.ok(openLoan(g, p.id));
      } else {
        assert.ok(tieAct(g, "tie|help|no").ok);
        assert.equal(p.closeness, c - 4);
      }
    }
  }
  assert.ok(asks >= 3 && asks <= 20, `asks in 20 years: ${asks}`);
});

test("the engine runs it: a month's payment lands in cash through ageUp and the tie| action", () => {
  const g = adult();
  friend(g, "e1", { closeness: 90 });
  const lent = act(g, "tie|lend|e1|1000");
  assert.equal(lent.stats.money, g.stats.money - 1000);
  assert.ok(openLoan(lent, "e1"));
  const control = structuredClone(lent);
  control.loans = [];
  let a = lent;
  let b = control;
  for (let i = 0; i < 6; i += 1) {
    a = ageUp(a);
    b = ageUp(b);
  }
  assert.ok(a.stats.money > b.stats.money, `repaid through months: ${a.stats.money - b.stats.money}`);
  const bad = act(g, "tie|lend|nobody|1000");
  assert.equal(bad.stats.money, g.stats.money);
});

test("Play cards carry the news: an ask or a paid-off loan shows once, even on a year-a-tap step", async () => {
  const { tieNews } = await import("../ties.ts");
  const { playStep } = await import("../flow.ts");
  const g = adult();
  const p = friend(g, "n1", { closeness: 90 });
  tieAct(g, "tie|lend|n1|200");
  const start = structuredClone(g);
  months(g, 6);
  const news = tieNews(start, g);
  if (g.loans![0]!.status === "paid") assert.deepEqual(news.filter((l) => /paid back all/.test(l)).length, 1);
  g.tieAsk = { personId: p.id, amount: 300, reason: "a vet bill", until: g.age * 12 + 12 };
  assert.match(tieNews(start, g)[0]!, /asks to borrow \$300 for a vet bill/);
  // Through Play: the card never shows the same tie line twice.
  const h = adult();
  friend(h, "n2", { closeness: 95 });
  tieAct(h, "tie|lend|n2|200");
  const out = playStep(h);
  const lines = out.card.banner ?? [];
  assert.equal(new Set(lines).size, lines.length);
});
