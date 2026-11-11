// Dating (Priority 0a, 2026-11-11): meet, flirt, ask out, stages, break up. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, actionsFor, ageUp, createGame } from "../engine.ts";
import { ASK_AT, flirtChance, livesWithPartner, oddsLabel, PLACES, splitCost, stageOf, tasteOf } from "../dating.ts";
import { livingCosts, livingOf } from "../economy.ts";
import type { Game, Person } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, seed = 7): Game {
  const g = createGame({ ...BASE, seed } as never);
  g.age = age;
  g.month = 0;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 80;
  g.stats.money = 20000;
  return g;
}

const ids = (g: Game) => actionsFor(g).map((a) => a.id);
const crushOf = (g: Game) => g.relationships.find((r) => r.role === "crush" && r.alive);
function withCrush(g: Game, closeness = 30): Person {
  const p: Person = { id: `p${g.nextId++}`, name: "Jules Park", role: "crush", closeness, age: g.age, alive: true, metAt: g.age, portrait: 5, sex: "male" };
  g.relationships.push(p);
  return p;
}

test("meet: four places on People ▸ Meet from 16; each takes a block; a spark adds a crush to your Circle", () => {
  const kid = at(14);
  assert.ok(!ids(kid).some((id) => id.startsWith("love|meet|")), "not before 16");
  const g = at(25);
  g.jobId = g.jobId ?? null;
  const meet = actionsFor(g).filter((a) => a.id.startsWith("love|meet|"));
  assert.equal(meet.length, PLACES.length);
  assert.ok(meet.every((a) => a.section === "New faces"));
  assert.ok(!ids(g).includes("date"), "the old one-roll date is replaced");
  let got: Game | null = null;
  for (let seed = 1; seed < 30 && !got; seed++) {
    const s = at(25, seed);
    const n = act(s, "love|meet|online");
    assert.equal(n.majorsLeft, 2, "a block of free time");
    if (crushOf(n)) got = n;
  }
  assert.ok(got, "someone sparks within a few tries");
  assert.match(crushOf(got!)!.note ?? "", /app/);
});

test("meet: no meeting while partnered; two crushes at most; a job for work", () => {
  const g = at(25);
  withCrush(g);
  withCrush(g);
  assert.ok(actionsFor(g).filter((a) => a.id.startsWith("love|meet|")).every((a) => a.disabled), "two crushes: all disabled");
  const w = at(25);
  w.jobId = null;
  assert.ok(actionsFor(w).find((a) => a.id === "love|meet|work")?.disabled);
  const p = at(25);
  p.relationships.push({ id: "pz", name: "Sam Cole", role: "partner", closeness: 60, age: 25, alive: true, metAt: 20 });
  assert.ok(!ids(p).some((id) => id.startsWith("love|meet|")));
});

test("flirt: odds depend on the stat and their taste; a hit raises interest, a miss lowers it; once a month", () => {
  const g = at(25);
  const p = withCrush(g);
  const taste = tasteOf(p);
  const best = flirtChance(g, p, taste);
  for (const s of ["wit", "bold", "sweet"] as const) if (s !== taste) assert.ok(flirtChance(g, p, s) < best + 0.2, "their taste helps");
  g.stats.smarts = 95;
  const smart = flirtChance(g, p, "wit");
  g.stats.smarts = 10;
  assert.ok(flirtChance(g, p, "wit") < smart, "smarts drive a joke");
  assert.match(oddsLabel(0.7), /Good/);
  let hits = 0;
  let misses = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = at(25, seed);
    const c = withCrush(s, 30);
    const n = act(s, `love|flirt|${c.id}|wit`);
    const after = n.relationships.find((r) => r.id === c.id)!;
    if (after.closeness > 30) hits++;
    else if (after.closeness < 30) misses++;
    assert.equal(act(n, `love|flirt|${c.id}|bold`), n, "once a month per person");
    assert.equal(n.majorsLeft, 3, "flirting is free time");
  }
  assert.ok(hits > 0 && misses > 0, `both outcomes happen (${hits} / ${misses})`);
});

test("flirt: a backfire at rock bottom ends it", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = at(25, seed);
    s.stats.smarts = 0;
    const c = withCrush(s, 5);
    const n = act(s, `love|flirt|${c.id}|wit`);
    const after = n.relationships.find((r) => r.id === c.id)!;
    if (after.closeness === 0) {
      assert.equal(after.alive, false);
      return;
    }
  }
  assert.fail("no backfire seen");
});

test("ask out: needs interest; yes makes a partner at Dating and clears other crushes", () => {
  const g = at(25);
  const low = withCrush(g, ASK_AT - 1);
  assert.ok(actionsFor(g).find((a) => a.id === `love|ask|${low.id}`)?.disabled);
  assert.equal(act(g, `love|ask|${low.id}`), g);
  let ok = false;
  for (let seed = 1; seed <= 20 && !ok; seed++) {
    const s = at(25, seed);
    const c = withCrush(s, 90);
    const other = withCrush(s, 20);
    const n = act(s, `love|ask|${c.id}`);
    const p = n.relationships.find((r) => r.id === c.id)!;
    if (p.role === "partner") {
      ok = true;
      assert.equal(stageOf(n, p), "dating");
      assert.equal(n.relationships.find((r) => r.id === other.id)!.alive, false);
      assert.equal(n.stats.money, s.stats.money - 50);
    }
  }
  assert.ok(ok);
});

test("stages: official → move in (own place) → propose → wedding → married; break up and divorce", () => {
  const g = at(28);
  const p: Person = { id: "pz", name: "Sam Cole", role: "partner", closeness: 80, age: 28, alive: true, metAt: 26, stage: "dating" };
  g.relationships.push(p);
  assert.ok(ids(g).includes("love|official|pz"));
  let n = act(g, "love|official|pz");
  assert.equal(stageOf(n, n.relationships.find((r) => r.id === "pz")!), "together");
  const fam = actionsFor(n).find((a) => a.id === "love|movein|pz");
  assert.ok(fam, "move in offered");
  // Move in needs your own place: at the family home it's blocked, then rent a flat.
  if (fam!.disabled) {
    assert.match(fam!.disabled, /own place/);
    assert.equal(act(n, "love|movein|pz"), n);
  }
  n = act(n, "econ|rent|flat|downtown");
  assert.equal(livingOf(n).kind, "lease", "rented a flat");
  n = { ...n, majorsLeft: 3 };
  assert.equal(actionsFor(n).find((a) => a.id === "love|movein|pz")?.disabled, undefined);
  n = act(n, "love|movein|pz");
  assert.equal(n.relationships.find((r) => r.id === "pz")!.stage, "living");
  assert.ok(livesWithPartner(n));
  n = act({ ...n, majorsLeft: 3 }, "propose");
  assert.equal(n.relationships.find((r) => r.id === "pz")!.stage, "engaged");
  assert.ok(!n.flags.married, "engaged, not married yet");
  n = act({ ...n, majorsLeft: 3 }, "love|wed|pz|small");
  assert.equal(n.relationships.find((r) => r.id === "pz")!.stage, "married");
  assert.equal(n.flags.married, 1);
  const cost = splitCost(n, n.relationships.find((r) => r.id === "pz")!);
  assert.ok(cost > 0, "a divorce costs");
  const d = act(n, "love|split|pz");
  assert.equal(d.relationships.find((r) => r.id === "pz")!.role, "ex");
  assert.equal(d.flags.married, 0);
  assert.equal(d.stats.money, n.stats.money - cost);
});

test("moving in splits living costs; older saves read married partners as Married, others as Dating", () => {
  const g = act(at(30), "econ|rent|flat|downtown");
  assert.equal(livingOf(g).kind, "lease");
  const alone = livingCosts(g);
  g.relationships.push({ id: "pz", name: "Sam Cole", role: "partner", closeness: 80, age: 30, alive: true, metAt: 26, stage: "living" });
  const shared = livingCosts(g);
  assert.ok(alone > 0 && shared < alone, `shared bills (${alone} → ${shared})`);
  const old = at(30);
  const p: Person = { id: "po", name: "Old Flame", role: "partner", closeness: 70, age: 30, alive: true, metAt: 22 };
  old.relationships.push(p);
  assert.equal(stageOf(old, p), "dating");
  old.flags.married = 1;
  assert.equal(stageOf(old, p), "married");
  assert.ok(ids(old).includes("love|split|po"), "a married old save can divorce");
  assert.ok(!ids(old).includes("propose"), "no proposing twice");
});

test("a crush left alone cools off over the years and moves on, without stopping anything", () => {
  let g = at(25);
  withCrush(g, 15);
  g.relationships[g.relationships.length - 1]!.metAt = 24;
  for (let i = 0; i < 30 && crushOf(g); i++) {
    g = ageUp({ ...g, phase: "live", pending: null, minigame: null } as Game);
  }
  assert.equal(crushOf(g), undefined);
});
