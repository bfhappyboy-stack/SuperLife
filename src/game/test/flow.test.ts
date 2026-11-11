// Life Flow: Play steps by age, routine fills free time, stops for what matters (2026-11-10 night). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageUp, choose, createGame, dismissReveal, resolveMini } from "../engine.ts";
import { playStep, routineOptions, setAutoFights, setPace, setRoutine, stepLabel, stepMonths, stepOf } from "../flow.ts";
import { fastForward, monthPlan, dismissSkip } from "../skip.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, month = 0, over: Record<string, unknown> = {}): Game {
  const g = createGame({ ...BASE, ...over } as never);
  g.age = age;
  g.month = month;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 80;
  return g;
}

/** Answer whatever the life asks the way a steady player would. */
function settle(g: Game, seen: string[] = []): Game {
  for (let i = 0; i < 40; i += 1) {
    if (g.skipReport) g = dismissSkip(g);
    else if (g.reveal) g = dismissReveal(g);
    else if (g.chapterNotice) g = { ...g, chapterNotice: null };
    else if (g.phase === "choice" && g.pending) {
      seen.push(g.pending.id);
      g = choose(g, g.pending.choices[g.pending.choices.length > 1 ? 1 : 0]!.id);
    } else if (g.phase === "mini") g = resolveMini(g, 0.65);
    else break;
  }
  return g;
}

test("pace: a year per tap as a kid, a season as a teen, a year again from 18; you can pin month, season or year", () => {
  assert.equal(stepOf({ age: 8 }), "year");
  assert.equal(stepOf({ age: 12 }), "year");
  assert.equal(stepOf({ age: 13 }), "season");
  assert.equal(stepOf({ age: 17 }), "season");
  assert.equal(stepOf({ age: 18 }), "year");
  assert.equal(stepOf({ age: 40 }), "year");
  assert.equal(stepOf({ age: 40, pace: "season" }), "season");
  assert.equal(stepOf({ age: 40, pace: "month" }), "month");
  assert.equal(stepOf({ age: 8, pace: "season" }), "season");
  assert.equal(stepMonths({ age: 9, month: 4 }), 8, "a kid's year runs to the birthday");
  assert.equal(stepMonths({ age: 16, month: 4 }), 3);
  assert.equal(stepMonths({ age: 30, month: 4 }), 8);
  const g = at(30, 10);
  assert.match(stepLabel(g).title, /age 31/, "a season that crosses a birthday stops at it");
  assert.equal(setPace(g, "month").pace, "month");
});

test("routine: up to three everyday actions, your order comes first in the month plan", () => {
  const g = at(16, 2);
  const options = routineOptions(g).map((o) => o.id);
  assert.ok(options.length >= 3, options.join(","));
  const pick = options.slice(-2).reverse();
  const r = setRoutine(g, [...pick, "fight-everyone", pick[0]!, ...options]);
  assert.equal(r.routine!.length, 3);
  assert.deepEqual(r.routine!.slice(0, 2), pick, "order kept, junk and repeats dropped");
  const plan = monthPlan(r).map((p) => p.id);
  assert.equal(plan[0], pick[0]);
  assert.ok(plan.indexOf(pick[1]!) <= 2);
});

test("month pace: free time you don't spend goes to your routine, then the month turns", () => {
  let g = setPace(at(25, 3, { jobId: "office" }), "month");
  g.jobId = "office";
  g = setRoutine(g, ["books"]);
  const before = structuredClone(g);
  const after = playStep(g);
  if (after.phase === "live") {
    assert.equal(after.month, 4);
    assert.equal(after.majorsLeft, 3, "a fresh month");
    assert.notDeepEqual(after.stats, before.stats, "the routine did something");
  } else {
    assert.ok(after.phase === "choice" || after.phase === "mini", "or it stopped for you");
  }
});

test("season pace: three months per tap with a recap card, or it stops for what needs you", () => {
  let g = at(30, 2, { jobId: "office" });
  g.jobId = "office";
  let moved = 0;
  for (let i = 0; i < 12; i += 1) {
    const before = g.age * 12 + g.month;
    const next = playStep(g);
    moved += next.age * 12 + next.month - before;
    if (next.phase === "live" && !next.skipReport && next.age * 12 + next.month - before === 3) {
      assert.match(next.card.body, /go(es)? by/);
      assert.equal(next.skipReport ?? null, null, "no modal for a plain season");
    }
    g = settle(next);
  }
  assert.ok(moved >= 12, `time keeps moving (${moved} months in 12 taps)`);
});

test("a Play season is the fast-forward season: same months, same dice (no balance change)", () => {
  const g = at(16, 2);
  const a = playStep(structuredClone(g));
  const b = fastForward(structuredClone(g), "season");
  assert.equal(a.age * 12 + a.month, b.age * 12 + b.month);
  assert.deepEqual(a.stats, b.stats);
  assert.equal(a.rng, b.rng);
});

test("childhood flies: birth to 15 in well under 40 taps, and Play still stops for the power reveal and the mentor", () => {
  let g = createGame({ ...BASE } as never);
  g = settle(g);
  let taps = 0;
  let revealed = false;
  let mentor = false;
  while (g.age < 15 && taps < 200 && g.phase !== "dead") {
    const next = playStep(g);
    taps += 1;
    if (next.reveal) revealed = true;
    if (next.mentor) mentor = true;
    g = settle(next);
  }
  assert.ok(g.age >= 15, `reached ${g.age}`);
  assert.ok(taps <= 40, `${taps} taps`);
  assert.ok(revealed || (g.unlockedPowers?.length ?? 0) > 0, "the power woke on the way");
  // One more season at 15 meets the mentor if it hasn't already.
  for (let i = 0; i < 6 && !mentor; i += 1) {
    const next = playStep(g);
    if (next.mentor) mentor = true;
    g = settle(next);
  }
  assert.ok(mentor || g.mentor, "the mentor at 15");
});

test("legend story beats still land: Spider-Man played on Play only hits his canon beats", () => {
  let g = createGame({ ...BASE, cityId: "nyc", mode: "god", preset: "spider-man" } as never);
  const seen: string[] = [];
  g = settle(g, seen);
  for (let taps = 0; taps < 120 && g.age < 22 && g.phase !== "dead"; taps += 1) {
    g.stats.health = Math.max(g.stats.health, 50);
    g = settle(playStep(g), seen);
  }
  assert.ok(seen.some((id) => id.startsWith("canon|")), `canon beats: ${seen.filter((id) => id.startsWith("canon")).join(",")}`);
});

test("old saves without routine or pace play on Auto with habits", () => {
  const g = at(20, 5);
  delete (g as { routine?: unknown }).routine;
  delete (g as { pace?: unknown }).pace;
  assert.equal(stepOf(g), "year");
  const n = playStep(g);
  assert.ok(n.age * 12 + n.month > g.age * 12 + g.month || n.phase !== "live");
  // The old Next month still works underneath.
  assert.equal(ageUp(at(20, 5)).month, 6);
});

test("money report: a Play step's card adds up the ledger, shows what moved and leads with your life, not rival chatter (2026-11-10 am)", async () => {
  const { econOf, periodReport } = await import("../economy.ts");
  const { act, isChatter } = await import("../engine.ts");
  let g = at(30, 2, { jobId: "office" });
  g.jobId = "office";
  g.stats.money = 60_000;
  g = act(g, "econ|rent|flat|uptown");
  g = act(g, "econ|trade|buy|s:OSCP|50");
  let checked = 0;
  for (let i = 0; i < 16 && checked < 4; i += 1) {
    const start = g.age * 12 + g.month;
    const next = playStep(g);
    const months = next.age * 12 + next.month - start;
    if (months > 0) {
      const rep = next.card.money;
      assert.ok(rep, "a step that passes time carries a money report");
      assert.equal(rep.months, months);
      const ledger = econOf(next)!.months!.filter((m) => m.at > start).reduce((s, m) => s + m.net, 0);
      assert.equal(rep.groups.filter((row) => row.key !== "other").reduce((s, row) => s + row.amount, 0), ledger, "the report is the ledger");
      assert.equal(rep.net, rep.groups.reduce((s, row) => s + row.amount, 0));
      assert.equal(rep.net, Math.round(next.stats.money - g.stats.money), "and it adds up to the cash you gained");
      assert.ok(rep.groups.find((row) => row.key === "pay")!.amount > 0, "pay");
      assert.ok(rep.groups.find((row) => row.key === "home")!.amount < 0, "rent");
      assert.ok(rep.groups.find((row) => row.key === "living")!.amount < 0, "living costs");
      assert.ok(rep.movers.every((m) => !m.mine || m.key === "s:OSCP" || m.key.startsWith("p:metro:uptown")), "yours means yours");
      const lines = next.card.banner;
      if (lines.some((l) => !isChatter(l))) assert.ok(!isChatter(lines[0]!), `leads with you: ${lines[0]}`);
      checked += 1;
    }
    g = settle(next);
  }
  assert.ok(checked >= 2, `checked ${checked} steps`);
  assert.equal(periodReport(g, g.age * 12 + g.month), null, "nothing since now");
  assert.ok(isChatter("Kiln: benched after a quote.") && isChatter("Kiln leaves the board. Latch takes the square.") && !isChatter("You turn 31."));
});

test("money report: a child's year carries none", () => {
  const kid = playStep(at(9, 0));
  assert.equal(kid.card.money ?? null, null);
});

// ---------------------------------------------------------------------------------------------------------
// Interrupt less (owner's call, 2026-11-10 eve)
// ---------------------------------------------------------------------------------------------------------

function pend(g: Game, id: string, choices: Record<string, import("../types.ts").Outcome>, prompt = "Something happens on the block."): Game {
  g.phase = "choice";
  g.pending = { id, prompt, choices: Object.keys(choices).map((c) => ({ id: c, label: c })), outcomes: choices };
  return g;
}

test("adult Play settles everyday moments, never canon, cases, big offers or power moments", async () => {
  const { settleAdult, BIG_EVENTS } = await import("../skip.ts");
  const easy = { a: { text: "fine", effects: { happiness: 2 } }, b: { text: "meh", effects: { happiness: -2 } } };
  const done = settleAdult(pend(at(30), "hobby", easy));
  assert.ok(done && done.g.phase === "live");
  assert.match(done!.line, /→ a$/, "picks the better answer and says so");
  for (const id of ["canon|joker", "case-docks", "arc-ock-2", "grief-p2", ...BIG_EVENTS]) assert.equal(settleAdult(pend(at(30), id, easy)), null, id);
});

test("arch-enemy: one real stop a year, the other calls are left on read", async () => {
  const { settleAdult } = await import("../skip.ts");
  const calls = { fight: { text: "go" }, talk: { text: "talk", effects: { happiness: 1 } }, skip: { text: "no" } };
  const g = at(30, 1);
  assert.equal(settleAdult(pend(g, "arch-month", calls)), null, "the first call stops");
  g.phase = "live";
  g.month = 5;
  const later = settleAdult(pend(g, "arch-month", calls));
  assert.ok(later, "five months on, settled");
  assert.match(later!.line, /left on read/);
  const year = later!.g;
  year.age = 31;
  year.month = 2;
  assert.equal(settleAdult(pend(year, "arch-month", calls)), null, "a year on, it stops again");
});

test("street fights: an outclassed foe is always a recap line; an even foe only with Auto fights on (off by default)", async () => {
  const { settleAdult, OUTCLASS_GAP } = await import("../skip.ts");
  const duel = (lvl: number, boss = false) => ({
    fight: {
      text: "go",
      minigame: {
        kind: "duel", title: "Rook", subtitle: "", difficulty: 1, tag: "duel", winText: "w", partialText: "p", loseText: "l",
        winEffects: { fame: 3 }, partialEffects: { fame: 1 }, loseEffects: { health: -9 },
        duel: { foeName: "Rook", foeTitle: "Rook", foeSide: "villain", playerHp: 40, foeHp: 30, playerMoves: [], foeMoves: [], foeLevel: lvl, boss },
      },
    },
    talk: { text: "talk" },
    run: { text: "run" },
  }) as never;
  const off = at(30);
  off.stats.powerLevel = 6;
  assert.equal(off.autoFights ?? false, false, "new lives start with Auto fights off");
  const quiet = settleAdult(pend(structuredClone(off), "villain-p1", duel(6 - OUTCLASS_GAP)));
  assert.ok(quiet?.fight && /won, an easy win/.test(quiet.line), "off: an easy win still settles quietly into the recap (2026-11-11)");
  assert.equal(settleAdult(pend(structuredClone(off), "villain-p1", duel(6 - OUTCLASS_GAP, true))), null, "off: a boss you outclass still stops");
  assert.equal(settleAdult(pend(structuredClone(off), "villain-p1", duel(6.2))), null, "off: an even fight stops");
  assert.equal(settleAdult(pend({ ...structuredClone(off), autoFights: true }, "villain-p1", duel(6.2))), null, "a stray true without the player's flip stays off");
  const g = setAutoFights(off, true);
  const easy = settleAdult(pend(structuredClone(g), "villain-p1", duel(6 - OUTCLASS_GAP)));
  assert.ok(easy?.fight && /won/.test(easy.line), easy?.line);
  assert.ok(easy!.g.stats.fame > g.stats.fame);
  assert.ok(settleAdult(pend(structuredClone(g), "villain-p1", duel(6.2))), "on: an even fight settles");
  assert.equal(settleAdult(pend(structuredClone(g), "villain-p1", duel(8))), null, "a foe stronger than you stops");
  assert.equal(settleAdult(pend(structuredClone(g), "villain-p1", duel(1, true))), null, "a boss stops");
  assert.equal(settleAdult(pend(setAutoFights(g, false), "villain-p1", duel(6.2))), null, "switched back off: an even fight stops again");
});

test("fight card: Auto-resolve settles the fight now, a little under your usual; a foe you outclass is a clean win", async () => {
  const { autoResolveFight, autoResolveOdds, autoResolveRatio, autoRatio } = await import("../skip.ts");
  const g = at(30);
  g.stats.powerLevel = 6;
  const spec = (lvl: number, boss = false) => ({
    kind: "duel", title: "Rook", subtitle: "", difficulty: 1, tag: "duel", winText: "w", partialText: "p", loseText: "l",
    winEffects: { fame: 3 }, partialEffects: { fame: 1 }, loseEffects: { health: -9 },
    duel: { foeName: "Rook", foeTitle: "Rook", foeSide: "hero", playerHp: 40, foeHp: 30, playerMoves: [], foeMoves: [], foeLevel: lvl, boss },
  }) as never;
  const even = { ...structuredClone(g), phase: "mini", minigame: spec(6) } as Game;
  assert.equal(autoResolveRatio(even), autoRatio(even));
  assert.ok(autoResolveRatio(even) < 0.66, "an even fight on auto is not a sure win for a 60% player");
  const done = autoResolveFight(even);
  assert.equal(done.phase === "mini", false, "the fight is over");
  assert.equal(done.minigame, null);
  assert.match(done.card.body, /^Auto-resolved: Rook\./);
  const easy = { ...structuredClone(g), phase: "mini", minigame: spec(4) } as Game;
  assert.equal(autoResolveOdds(easy), "win");
  const boss = { ...structuredClone(g), phase: "mini", minigame: spec(4, true) } as Game;
  assert.notEqual(autoResolveOdds(boss), "win", "a boss never auto-resolves to a sure win");
  assert.equal(autoResolveFight(g), g, "nothing to resolve outside a fight");
});

test("Auto fights migration: untouched saves go off, a hand-flipped choice is kept", async () => {
  const { migrateAutoFights } = await import("../save.ts");
  const { autoFightsOn } = await import("../skip.ts");
  const untouched = at(30);
  delete untouched.autoFights;
  delete untouched.autoFightsSet;
  assert.equal(autoFightsOn(migrateAutoFights(untouched)), false, "eve save that never touched it: off");
  const flipped = { ...at(30), autoFights: true } as Game;
  delete flipped.autoFightsSet;
  assert.equal(autoFightsOn(migrateAutoFights(flipped)), true, "eve stored true only after a hand flip: kept on");
  const chose = setAutoFights(at(30), true);
  assert.equal(autoFightsOn(migrateAutoFights(structuredClone(chose))), true);
  const offed = setAutoFights(at(30), false);
  assert.equal(autoFightsOn(migrateAutoFights(structuredClone(offed))), false);
});

test("adult Play taps: 18 to 40 in about half the taps it took with Auto fights on; off stops for fights but small moments still settle", () => {
  for (const on of [true, false]) {
  const seen: string[] = [];
  let g = createGame({ ...BASE, cityId: "nyc", mode: "god", preset: "spider-man", seed: 4 } as never);
  g = setAutoFights(settle(g, seen), on);
  while (g.age < 18 && g.phase !== "dead") g = settle(playStep(g), seen);
  let taps = 0;
  const before = seen.length;
  while (g.age < 40 && g.phase !== "dead" && taps < 600) {
    g.stats.health = Math.max(g.stats.health, 50);
    taps += 1;
    g = settle(playStep(g), seen);
  }
  const stops = seen.length - before;
  assert.ok(g.age >= 40);
  // Before eve: ~250 taps (Play + answers) for Spider-Man 18-40 in the same sim.
  console.log(`auto fights ${on ? "on" : "off"}: adult taps ${taps} + stops ${stops}`);
  assert.ok(taps + stops <= (on ? 140 : 175), `auto ${on}: adult taps ${taps} + stops ${stops}`);
  assert.ok(seen.some((id) => id.startsWith("canon|")), "canon beats still stop");
  }
});

test("a new chapter is one tap: the recap rides on the card under the chapter page", () => {
  let g = at(29, 6);
  g.chapterNotice = null;
  let found = false;
  for (let i = 0; i < 8 && !found; i += 1) {
    const n = playStep(g);
    if (n.chapterNotice && !g.chapterNotice) {
      found = true;
      assert.equal(n.skipReport ?? null, null);
    }
    g = settle(n);
  }
  assert.ok(found, "the chapter turned");
});

test("yearly growth: only powers used this year ripen on the birthday, and it never grants a power (2026-11-11)", async () => {
  const { ripenUsed, markUsed, RIPEN_EXP } = await import("../engine.ts");
  const g = at(30);
  const held = (g.unlockedPowers ?? []).slice(0, 2);
  assert.ok(held.length >= 1, "test life holds a power");
  const [a, b] = held;
  g.mastery = { ...(g.mastery ?? {}) };
  for (const id of held) g.mastery[id] = 0;
  g.usedPowers = [];
  markUsed(g, a);
  markUsed(g, "not-a-held-power");
  assert.deepEqual(g.usedPowers, [a], "only held powers are marked");
  const powers = [...(g.unlockedPowers ?? [])];
  ripenUsed(g);
  assert.equal(g.mastery[a!], RIPEN_EXP, "used power ripens");
  if (b) assert.equal(g.mastery[b], 0, "unused power stays put");
  assert.deepEqual(g.usedPowers, [], "a fresh year starts");
  assert.deepEqual(g.unlockedPowers, powers, "never grants a power");
  ripenUsed(g);
  assert.equal(g.mastery[a!], RIPEN_EXP, "nothing used since: no growth");
  const old = at(30);
  delete old.usedPowers;
  old.mastery = {};
  ripenUsed(old);
  for (const id of old.unlockedPowers ?? []) assert.ok((old.mastery[id] ?? 0) > 0, "an older save's first birthday ripens all once");
});

test("yearly growth: a fight marks the powers behind the moves you threw", async () => {
  const { resolveMini } = await import("../engine.ts");
  const { moveById } = await import("../moves.ts");
  const g = at(30);
  const move = (g.loadout ?? []).find((id) => moveById(id) && (g.unlockedPowers ?? []).includes(moveById(id)!.powerId));
  assert.ok(move, "test life has a power move equipped");
  g.usedPowers = [];
  const fight = {
    ...g, phase: "mini",
    minigame: {
      kind: "duel", title: "Rook", subtitle: "", difficulty: 1, tag: "duel", winText: "w", partialText: "p", loseText: "l",
      winEffects: {}, partialEffects: {}, loseEffects: {},
      duel: { foeName: "Rook", foeTitle: "Rook", foeSide: "hero", playerHp: 40, foeHp: 30, playerMoves: [], foeMoves: [], foeLevel: 1 },
    },
  } as unknown as Game;
  const done = resolveMini(fight, 0.9, [move!]);
  assert.ok(done.usedPowers?.includes(moveById(move!)!.powerId));
});
