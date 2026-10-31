// Minigame variety, press conference content, and the balance soft caps.
// Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageUp, choose, createGame, gentleCap, mentorLegacy, resolveMini, vary } from "../engine.ts";
import { edgeFamily, isSkillKind, MINI_KINDS, pickMini, PRESS_QUESTIONS, pressRounds, pressScore, REPORTERS, SKILL_KIND_IDS, VERB_POOLS, type MiniVerb, type Tone } from "../minis.ts";
import { snapshot } from "../chapters.ts";
import type { Game, MinigameSpec } from "../types.ts";

const CELEB = { name: "Skye Laurent", cityId: "crown", upbringing: "celebrity", portrait: 7, sex: "female", face: "loud", drive: "glory", giftId: "teleportation", seed: 5 } as const;

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test("every verb pool is valid data", () => {
  for (const [verb, rows] of Object.entries(VERB_POOLS)) {
    assert.ok(rows.length >= 2, `${verb} has variety`);
    for (const row of rows) {
      assert.ok(isSkillKind(row.kind), `${verb}: ${row.kind} is a skill kind`);
      assert.ok(row.weight > 0);
      assert.ok(row.titles.length > 0 && row.subtitles.length > 0);
      for (const list of [row.win, row.partial, row.lose]) if (list) assert.ok(list.length > 0 && list.every((line) => line.trim().length > 8));
    }
  }
  for (const kind of SKILL_KIND_IDS) {
    assert.ok(MINI_KINDS[kind].how.length > 10);
    assert.ok(["timing", "pattern", "duel"].includes(edgeFamily(kind)));
  }
  assert.equal(edgeFamily("duel"), "duel");
});

test("pickMini is deterministic, fills vars, and down-weights the last kind", () => {
  const a = pickMini("drill", lcg(9), { vars: { power: "Light Speed", level: "2", cap: "4" } });
  const b = pickMini("drill", lcg(9), { vars: { power: "Light Speed", level: "2", cap: "4" } });
  assert.deepEqual(a, b);
  assert.ok(!/\{\w+\}/.test(a.title + a.subtitle + (a.winText ?? "")), "no unfilled placeholders");
  for (const verb of Object.keys(VERB_POOLS) as MiniVerb[]) {
    const count = (last: "timing" | null) => {
      const rand = lcg(42);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (pickMini(verb, rand, { last }).kind === "timing") n++;
      return n;
    };
    if (VERB_POOLS[verb].some((row) => row.kind === "timing")) assert.ok(count("timing") < count(null), `${verb}: repeat is rarer`);
  }
  const only = pickMini("tryout", lcg(3), { only: ["press"] });
  assert.equal(only.kind, "press");
});

test("press rounds never repeat a question and score by reporter taste", () => {
  assert.ok(PRESS_QUESTIONS.length >= 12 && REPORTERS.length >= 5);
  for (const q of PRESS_QUESTIONS) for (const tone of ["bold", "humble", "witty", "straight"] as Tone[]) assert.ok(q.lines[tone].length > 3);
  for (let seed = 1; seed < 60; seed++) {
    const rounds = pressRounds(seed, 4);
    assert.equal(new Set(rounds.map((r) => r.question.q)).size, 4);
    for (let i = 1; i < rounds.length; i++) assert.notEqual(rounds[i].reporter.id, rounds[i - 1].reporter.id);
    for (const r of rounds) assert.equal(new Set(r.order).size, 4);
  }
  assert.deepEqual(pressRounds(77, 3), pressRounds(77, 3));
  const r = REPORTERS[0];
  assert.equal(pressScore(r, r.wants[0]), 1);
  assert.equal(pressScore(r, r.wants[1]), 0.5);
  const other = (["bold", "humble", "witty", "straight"] as Tone[]).find((t) => !r.wants.includes(t))!;
  assert.equal(pressScore(r, other), 0);
});

test("vary seeds a spec, picks from the verb pool, and strips engine-only fields", () => {
  const g = createGame({ ...CELEB } as never) as Game;
  const spec = { kind: "timing", title: "x", subtitle: "y", difficulty: 2, winText: "w", partialText: "p", loseText: "l", winEffects: {}, partialEffects: {}, loseEffects: {}, verb: "dispatch" } as unknown as MinigameSpec;
  const out = vary(g, spec);
  assert.ok(typeof out.seed === "number");
  assert.ok(isSkillKind(out.kind));
  assert.equal((out as { verb?: string }).verb, undefined);
  assert.ok(out.title.startsWith("Dispatch"));
  const duel = vary(g, { ...spec, kind: "duel", verb: "dispatch" } as MinigameSpec);
  assert.equal(duel.kind, "duel");
});

test("a passive celebrity life still meets more than one kind of minigame by 30", () => {
  let g = createGame({ ...CELEB } as never) as Game;
  const kinds = new Map<string, number>();
  let guard = 0;
  while (g.phase !== "dead" && g.age < 30 && guard++ < 20000) {
    if (g.phase === "mini" && g.minigame) {
      kinds.set(g.minigame.kind, (kinds.get(g.minigame.kind) ?? 0) + 1);
      g = resolveMini(g, 0.7);
    } else if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0].id);
    else g = ageUp(g);
  }
  // The passive ageUp loop only meets the minis the year throws at you; still expect a mix.
  assert.ok(kinds.size >= 2, `kinds seen: ${[...kinds.keys()].join(",")}`);
});

test("gentleCap leaves the low range alone and squeezes the top", () => {
  assert.equal(gentleCap(10), 1);
  assert.equal(gentleCap(50), 1);
  assert.ok(gentleCap(75) < 1 && gentleCap(75) > gentleCap(95));
  assert.ok(gentleCap(100) <= 0.1 && gentleCap(100) > 0);
});

test("mentoring has diminishing returns within a year", () => {
  const g = createGame({ ...CELEB } as never) as Game;
  g.legacy = 0;
  const total = (n: number) => {
    let sum = 0;
    for (let i = 0; i < 200; i++) {
      g.flags.mentorRun = 0;
      for (let k = 0; k < n; k++) sum += mentorLegacy(g, true);
    }
    return sum / 200;
  };
  const one = total(1);
  const six = total(6);
  assert.ok(one >= 2.5 && one <= 3.5, `one session ≈3, got ${one}`);
  assert.ok(six < one * 3, `six sessions are far less than 6x (${six} vs ${one})`);
  g.legacy = 200;
  g.flags.mentorRun = 0;
  let late = 0;
  for (let i = 0; i < 200; i++) {
    g.flags.mentorRun = 0;
    late += mentorLegacy(g, true);
  }
  assert.ok(late / 200 < one / 2, "a big legacy grows slower");
});

test("chapter snapshots count property in net worth", () => {
  const g = createGame({ ...CELEB } as never) as Game;
  const snap = snapshot(g);
  assert.ok(snap.worth >= g.stats.money);
});
