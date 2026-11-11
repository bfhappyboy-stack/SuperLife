// The mask at home (dating stage 2, 2026-11-11 pm): partners wonder, get jealous, find the suit; tell them or deny it. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, actionsFor, ageUp, createGame } from "../engine.ts";
import { FIND_AT, JEALOUS_AT, keepsMask, maskMonth, maskNews, tellChance } from "../mask.ts";
import type { Game, Person } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "secret", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, seed = 7, face: "secret" | "loud" = "secret"): Game {
  const g = createGame({ ...BASE, face, seed } as never);
  g.age = age;
  g.month = 0;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 80;
  g.stats.money = 20000;
  if (!g.powerId) g.powerId = "fire-control" as never;
  if (!(g.unlockedPowers ?? []).length) g.unlockedPowers = ["fire-control" as never];
  return g;
}
function partner(g: Game, stage: Person["stage"] = "living", closeness = 70, id = "pz"): Person {
  const p: Person = { id, name: "Jules Park", role: "partner", stage, closeness, age: g.age, alive: true, metAt: g.age, portrait: 5, sex: "male" };
  g.relationships.push(p);
  return p;
}
const ids = (g: Game) => actionsFor(g).map((a) => a.id);

test("only a secret-identity hero with a power keeps a mask; a public hero's partner gets no rows", () => {
  const g = at(25);
  assert.ok(keepsMask(g));
  const p = partner(g);
  assert.ok(ids(g).includes(`mask|tell|${p.id}`));
  const loud = at(25, 7, "loud");
  partner(loud);
  assert.ok(!keepsMask(loud));
  assert.ok(!ids(loud).some((id) => id.startsWith("mask|")));
});

test("suspicion builds faster living together; jealousy past 40 nicks closeness; in the end they find the suit", () => {
  const g = at(25);
  const live = partner(g, "living", 80, "a");
  const d2 = at(25);
  const date = partner(d2, "dating", 80, "a");
  for (let m = 0; m < 12; m++) {
    g.month = m;
    d2.month = m;
    maskMonth(g, []);
    maskMonth(d2, []);
  }
  assert.ok((live.suspicion ?? 0) > (date.suspicion ?? 0) * 3, `living ${live.suspicion} vs dating ${date.suspicion}`);
  let found = -1;
  const banners: string[] = [];
  for (let m = 12; m < 12 * 12 && found < 0; m++) {
    g.age = 25 + Math.floor(m / 12);
    g.month = m % 12;
    maskMonth(g, banners);
    if (g.maskScene) found = m;
  }
  assert.ok(found > 0, "found the suit within 12 years of living together");
  assert.ok(banners.some((b) => /seeing someone/.test(b)), "jealousy banner on the way");
  assert.ok(banners.some((b) => /found the suit/.test(b)));
  assert.ok(live.closeness < 80, "jealousy cost some closeness");
  assert.ok((live.suspicion ?? 0) >= FIND_AT);
});

test("tell: takes a block; a yes means they know, suspicion gone, closeness up; a not-yet waits a year", () => {
  let yes = 0;
  let no = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const g = at(25, seed);
    const p = partner(g, "living", 70, `p${seed}`);
    p.suspicion = 30;
    const n = act(g, `mask|tell|${p.id}`);
    assert.equal(n.majorsLeft, 2, "a block of free time");
    const q = n.relationships.find((r) => r.id === p.id)!;
    if (q.knowsSecret) {
      yes++;
      assert.equal(q.suspicion, 0);
      assert.ok(q.closeness > 70);
      assert.ok(!ids(n).some((id) => id.startsWith("mask|")), "no more rows once they know");
    } else if (q.role === "partner") {
      no++;
      assert.ok(q.closeness < 70);
      assert.ok(actionsFor(n).find((a) => a.id === `mask|tell|${p.id}`)?.disabled, "wait before trying again");
    }
  }
  assert.ok(yes > no, `close partners mostly take it (${yes} yes, ${no} not yet)`);
  const p = { id: "x", name: "A B", role: "partner", closeness: 20, age: 30, alive: true, metAt: 0, trust: 30 } as Person;
  assert.ok(tellChance(p) < tellChance({ ...p, closeness: 90, trust: 80 }));
});

test("found the suit: truth or deny on their card; deny costs trust; ignoring it a year counts as a deny", () => {
  const g = at(25);
  const p = partner(g, "married", 70);
  g.flags.married = 1;
  p.suspicion = 60;
  g.maskScene = { personId: p.id, until: 25 * 12 + 12 };
  assert.ok(ids(g).includes("mask|truth") && ids(g).includes("mask|deny"));
  assert.ok(!ids(g).includes(`mask|tell|${p.id}`));
  const d = act(g, "mask|deny");
  const q = d.relationships.find((r) => r.id === p.id)!;
  assert.equal(d.maskScene, null);
  assert.ok((q.trust ?? 50) <= 35);
  assert.equal(d.majorsLeft, 3, "answering doesn't take a block");
  assert.ok((q.suspicion ?? 0) >= JEALOUS_AT, "the questions go quiet, not away");
  const late = at(25);
  const r = partner(late, "living", 70);
  late.maskScene = { personId: r.id, until: 25 * 12 + 3 };
  const banners: string[] = [];
  late.month = 3;
  maskMonth(late, banners);
  assert.equal(late.maskScene, null);
  assert.ok(banners.some((b) => /silence as a no/.test(b)));
  assert.ok((r.trust ?? 50) <= 35);
});

test("a bad truth from a distant partner can end it; Play card shows the news once", () => {
  let left = false;
  for (let seed = 1; seed <= 40 && !left; seed++) {
    const g = at(25, seed);
    const p = partner(g, "living", 30, `q${seed}`);
    p.trust = 20;
    const n = act(g, `mask|tell|${p.id}`);
    if (n.relationships.find((r) => r.id === p.id)?.role === "ex") left = true;
  }
  assert.ok(left, "someone walks out");
  const a = at(25);
  partner(a, "living", 70);
  const b = structuredClone(a);
  b.maskScene = { personId: "pz", until: 400 };
  assert.equal(maskNews(a, b).length, 1);
  assert.equal(maskNews(b, b).length, 0);
});

test("old saves: partners with no mask fields just start wondering; a whole year of play stays sane", () => {
  const g = at(25);
  partner(g, "living", 70);
  let n = g;
  for (let i = 0; i < 3; i++) n = ageUp(n);
  const p = n.relationships.find((r) => r.id === "pz");
  assert.ok(p);
  assert.ok((p!.suspicion ?? 0) >= 0 && (p!.suspicion ?? 0) <= 100);
});

test("three ignored or denied finds and they leave; the next find waits 30 months", () => {
  const g = at(25);
  const p = partner(g, "living", 90);
  p.suspicion = 90;
  const banners: string[] = [];
  let finds = 0;
  for (let m = 0; m < 12 * 20 && p.role === "partner"; m++) {
    g.age = 25 + Math.floor(m / 12);
    g.month = m % 12;
    const had = !!g.maskScene;
    maskMonth(g, banners);
    if (!had && g.maskScene) finds++;
  }
  assert.equal(p.role, "ex", "one lie too many");
  assert.equal(finds, 3);
  assert.ok(banners.filter((b) => /seeing someone/.test(b)).length <= 1, "the jealousy line shows once");
});
