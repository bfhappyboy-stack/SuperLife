// Year pacing (2026-11-16): every option up to 3 times per in-game year, BitLife style; Age up and the
// multi-year skips stay. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, actionsFor, ageUp, CAP_LINE, choose, createGame, resolveMini } from "../engine.ts";
import { playStep, stepLabel } from "../flow.ts";
import { canSkipToFifteen, dismissSkip, fastForward } from "../skip.ts";
import { blocksLeft, migratePacing, optionKey, PACING, USES_PER_YEAR } from "../pacing.ts";
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

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, month = 0): Game {
  const g = createGame({ ...BASE } as never);
  g.age = age;
  g.month = month;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.chapterNotice = null;
  g.majorsLeft = 3;
  g.yearUses = {};
  g.yearDebt = 0;
  g.stats.health = 90;
  g.stats.money = 5000;
  return g;
}

/** Play an everyday option all the way through (its follow-up choice and mini), like a player would. */
function tap(g: Game, id: string): Game {
  let n = act(g, id);
  for (let i = 0; i < 6 && n.phase !== "live" && n.phase !== "dead"; i++) {
    if (n.phase === "choice" && n.pending) n = choose(n, n.pending.choices[0]!.id);
    else if (n.phase === "mini") n = resolveMini(n, 0.7);
    else break;
  }
  return { ...n, pending: null, minigame: null, chapterNotice: null, phase: n.phase === "dead" ? "dead" : "live" };
}

const row = (g: Game, id: string) => actionsFor(g).find((a) => a.id === id);

test("option keys: each power, person and business is its own option; amounts and flirt lines are not", () => {
  const g = { focusPower: "fire-control", unlockedPowers: ["fire-control", "ice-control"] };
  assert.equal(optionKey(g, "train"), "train|fire-control");
  assert.equal(optionKey({ ...g, focusPower: "ice-control" }, "train"), "train|ice-control");
  assert.equal(optionKey(g, "time:p7"), "time:p7");
  assert.equal(optionKey(g, "love|flirt|p7|wit"), "love|flirt|p7");
  assert.equal(optionKey(g, "love|flirt|p7|bold"), "love|flirt|p7");
  assert.equal(optionKey(g, "econ|biz|shift|b3"), "econ|biz|shift|b3");
  assert.equal(optionKey(g, "econ|biz|staff|b3|2"), "econ|biz|staff|b3");
  assert.equal(optionKey(g, "focus|ice-control"), null, "settings never count");
  assert.equal(optionKey(g, "arc-step"), null, "a case's next step is story, not an option");
});

test("every option up to 3 times a year: gym, books and volunteering 3 each, all in the same month", () => {
  let g = at(20);
  for (const id of ["gym", "books", "volunteer"]) {
    for (let i = 1; i <= USES_PER_YEAR; i++) {
      assert.ok(!row(g, id)?.disabled, `${id} #${i} is open`);
      g = tap(g, id);
      assert.equal(g.yearUses?.[id], i);
      assert.equal(row(g, id)?.uses, i, "the counter shows n/3");
    }
    assert.equal(row(g, id)?.disabled, CAP_LINE, `${id} locks at 3/3`);
    const blocked = act(g, id);
    assert.deepEqual(blocked.card.banner, [CAP_LINE]);
    assert.equal(blocked.yearUses?.[id], USES_PER_YEAR);
  }
  assert.equal(g.age, 20, "nine things done, still the same year");
  assert.equal(g.month, 0);
  assert.equal(blocksLeft(g), 36 - 9, "a year holds 36 blocks; nine are spent");
  assert.ok(!row(g, "city-walk")?.disabled, "other options are still open");
});

test("each power trains separately: 3 drills of one power don't lock another", () => {
  let g = at(20);
  g.unlockedPowers = ["fire-control", "super-speed"];
  g.mastery = { "fire-control": 10, "super-speed": 10 };
  g.focusPower = "fire-control";
  for (let i = 0; i < 3; i++) g = tap(g, "train");
  assert.equal(g.yearUses?.["train|fire-control"], 3);
  assert.equal(row(g, "train")?.disabled, CAP_LINE);
  g = act(g, "focus|super-speed");
  assert.ok(!row(g, "train")?.disabled, "Super Speed can still be drilled");
  const before = g.mastery["super-speed"] ?? 0;
  g = tap(g, "train");
  assert.ok((g.mastery["super-speed"] ?? 0) > before, "same gain per session as before");
});

test("free time is the year's: what you spend now comes out of later months, and the routine gets the rest", () => {
  let g = at(20);
  for (const id of ["gym", "books", "volunteer"]) for (let i = 0; i < 3; i++) g = tap(g, id);
  assert.equal(g.majorsLeft, 0);
  assert.equal(g.yearDebt, 6, "six blocks borrowed from later this year");
  const m1 = ageUp(g, { quiet: true });
  assert.equal(m1.majorsLeft, 0, "next month's blocks pay the debt");
  assert.equal(m1.yearDebt, 3);
  const m2 = ageUp({ ...m1, phase: "live", pending: null, minigame: null }, { quiet: true });
  assert.equal(m2.majorsLeft, 0);
  assert.equal(m2.yearDebt, 0);
  const m3 = ageUp({ ...m2, phase: "live", pending: null, minigame: null }, { quiet: true });
  assert.equal(m3.majorsLeft, 3, "then months are whole again");
  assert.equal(blocksLeft(m3), 3 * 9, "the year never holds more than 36 blocks");
});

test("the year can run out of free time: then everything that takes time waits for the birthday", () => {
  const g = at(20, 6);
  g.majorsLeft = 0;
  g.yearDebt = 15;
  assert.equal(blocksLeft(g), 0);
  assert.match(row(g, "gym")?.disabled ?? "", /No free time left this year/);
  assert.equal(act(g, "gym"), g);
  assert.ok(!row(g, "rest")?.disabled, "rest costs no time");
});

test("Age up resets every option and plays the rest of the year on your routine", () => {
  let g = at(20);
  g.routine = ["gym", "books"];
  for (let i = 0; i < 3; i++) g = tap(g, "gym");
  assert.equal(row(g, "gym")?.disabled, CAP_LINE);
  assert.equal(stepLabel(g).title, "Age up to 21");
  let out = playStep(g);
  for (let i = 0; i < 20 && out.age < 21 && out.phase !== "dead"; i++) {
    if (out.skipReport) out = dismissSkip(out);
    else if (out.phase === "choice" && out.pending) out = choose(out, out.pending.choices[0]!.id);
    else if (out.phase === "mini") out = resolveMini(out, 0.6);
    else out = playStep({ ...out, chapterNotice: null, reveal: null });
  }
  assert.equal(out.age, 21);
  assert.equal(out.month, 0);
  assert.deepEqual(out.yearUses, {}, "a new year: every option back to 0/3");
  assert.equal(out.yearDebt, 0);
  assert.ok(!row({ ...out, phase: "live", pending: null, minigame: null }, "gym")?.disabled, "gym is open again");
});

test("the routine isn't capped: a year's fast-forward still drills more than 3 times", () => {
  const g = at(20);
  g.routine = ["train"];
  g.mastery = { "fire-control": 10 };
  g.unlockedPowers = ["fire-control"];
  g.focusPower = "fire-control";
  const out = fastForward(g, "year");
  const train = out.skipReport?.did.find((r) => r.id === "train")?.count ?? 0;
  if (out.skipReport?.stop && out.skipReport.months < 3) return; // the life needed you early at this seed
  assert.ok(train > USES_PER_YEAR, `routine drilled ${train} times`);
  assert.ok(!(out.yearUses?.["train|fire-control"] ?? 0) || out.age > g.age, "the routine never writes your yearly counts");
});

test("multi-year skips stay: Skip to 15 lands on the birthday with a fresh year, and year skips chain", () => {
  let kid = at(6);
  kid.yearUses = { gym: 3 };
  assert.ok(canSkipToFifteen(kid));
  for (let i = 0; i < 60 && kid.age < 15 && kid.phase !== "dead"; i++) {
    if (kid.skipReport) kid = dismissSkip(kid);
    else if (kid.reveal) kid = { ...kid, reveal: null };
    else if (kid.chapterNotice) kid = { ...kid, chapterNotice: null };
    else if (kid.phase === "choice" && kid.pending) kid = choose(kid, kid.pending.choices[0]!.id);
    else if (kid.phase === "mini") kid = resolveMini(kid, 0.6);
    else kid = canSkipToFifteen(kid) ? fastForward(kid, "fifteen") : fastForward(kid, "year");
  }
  assert.equal(kid.age, 15);
  assert.deepEqual(kid.yearUses, {});
  let adult = at(30);
  const start = adult.age;
  for (let i = 0; i < 80 && adult.age < start + 3 && adult.phase !== "dead"; i++) {
    if (adult.skipReport) adult = dismissSkip(adult);
    else if (adult.reveal) adult = { ...adult, reveal: null };
    else if (adult.chapterNotice) adult = { ...adult, chapterNotice: null };
    else if (adult.phase === "choice" && adult.pending) adult = choose(adult, adult.pending.choices[0]!.id);
    else if (adult.phase === "mini") adult = resolveMini(adult, 0.6);
    else adult = fastForward(adult, "year");
  }
  assert.equal(adult.age, start + 3, "three year skips, three birthdays");
});

test("free actions count too: three rests a year", () => {
  let g = at(20);
  g.stats.health = 40;
  for (let i = 0; i < 3; i++) {
    const n = act(g, "rest");
    assert.notEqual(n, g, `rest #${i + 1}`);
    g = n;
  }
  assert.equal(g.majorsLeft, 3, "rest costs no time");
  assert.equal(row(g, "rest")?.disabled, CAP_LINE);
});

test("old saves: no yearly counts yet, nothing borrowed; the load path fills them in", () => {
  const old = at(29, 5) as Game & { yearUses?: unknown; yearDebt?: unknown };
  delete old.yearUses;
  delete old.yearDebt;
  const fixed = migratePacing(structuredClone(old) as Game);
  assert.deepEqual(fixed.yearUses, {});
  assert.equal(fixed.yearDebt, 0);
  save.saveSlot(1, old as Game);
  const loaded = save.loadSlot(1);
  assert.ok(loaded);
  assert.deepEqual(loaded!.yearUses, {});
  assert.equal(loaded!.yearDebt, 0);
  assert.equal(blocksLeft(loaded!), old.majorsLeft + 3 * 6);
});

test("the old monthly pacing is one switch away", () => {
  PACING.year = false;
  try {
    const g = at(20);
    g.majorsLeft = 0;
    assert.match(row(g, "gym")?.disabled ?? "", /No moves left this month/);
    assert.equal(row(g, "gym")?.uses, undefined, "no yearly counter");
  } finally {
    PACING.year = true;
  }
});
