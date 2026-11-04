// PM pass (2026-11-03): power mixing unlocks at 15, mentors, and Skip to 15.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, createGame, dismissReveal, resolveMini, choose } from "../engine.ts";
import { possibleMixes } from "../combo.ts";
import { LEGEND_MENTORS, MIX_AGE, mentorBraid, mentorFor, mixLock, UPBRINGING_MENTORS } from "../mentors.ts";
import { PRESETS } from "../presets.ts";
import { canSkipToFifteen, dismissSkip, fastForward, settleSmall, skipMonths } from "../skip.ts";
import type { Game } from "../types.ts";

const godKid = (seed: number): Game =>
  createGame({ name: "Theo Grant", cityId: "hood", upbringing: "program", portrait: 14, sex: "male", face: "loud", drive: "pragmatic", mode: "god", giftIds: ["fire-control", "super-speed", "super-strength"], seed } as never);

/** Jump a life to an exact age by birthdays alone (no choices), settling anything that pops. */
function toAge(g: Game, age: number): Game {
  for (let i = 0; i < 400 && g.age < age; i++) {
    if (g.reveal) g = dismissReveal(g);
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[g.pending.choices.length - 1]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.6);
    else g = ageUp(g, { quiet: true });
  }
  for (let i = 0; i < 10 && g.phase !== "live"; i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[g.pending.choices.length - 1]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.6);
  }
  if (g.reveal) g = dismissReveal(g);
  return g;
}

test("mixing is locked before 15, even with the recipe in hand", () => {
  const g = godKid(3);
  assert.ok(possibleMixes(g.unlockedPowers ?? []).some((m) => m.result.id === "light-speed"), "Fire Control + Super Speed is in hand");
  assert.ok(mixLock(g)?.includes(`${MIX_AGE}`));
  const kid = toAge(g, 12);
  assert.equal(kid.age, 12);
  const tried = act({ ...kid, majorsLeft: 3 }, "mix|fire-control|super-speed");
  assert.ok(!(tried.unlockedPowers ?? []).includes("light-speed"), "no Light Speed at 12");
});

test("at 15 a mentor arrives, the lock lifts, and the required chain still works", () => {
  const teen = toAge(godKid(5), MIX_AGE);
  assert.equal(teen.age, MIX_AGE);
  assert.equal(mixLock(teen), null);
  assert.equal(teen.mentor?.id, UPBRINGING_MENTORS.program!.id);
  let g = act({ ...teen, majorsLeft: 3, phase: "live" }, "mix|fire-control|super-speed");
  assert.ok(g.unlockedPowers?.includes("light-speed"), "Fire Control + Super Speed = Light Speed");
  g = act({ ...g, majorsLeft: 3, phase: "live" }, "mix|light-speed|super-strength");
  assert.ok(g.unlockedPowers?.includes("lightning-strikes"), "Light Speed + Super Strength = Lightning Strikes");
});

test("a mentor's guided braid steers to the required chain and lands drilled; one lesson a month", () => {
  const teen = toAge(godKid(7), MIX_AGE);
  const ready = { ...teen, majorsLeft: 3, phase: "live" as const };
  assert.equal(mentorBraid(ready)?.result.id, "light-speed");
  const g = act(ready, "tutor|braid");
  assert.ok(g.unlockedPowers?.includes("light-speed"));
  assert.ok((g.mastery?.["light-speed"] ?? 0) > 0, "guided braid lands with some drill");
  assert.equal(g.mentor?.lessons, 1);
  assert.ok((g.mentor?.bond ?? 0) > (teen.mentor?.bond ?? 0));
  const again = act(g, "tutor|drill");
  assert.equal(again, g, "only one lesson a month");
  const nextMonth = ageUp(g, { quiet: true });
  const drilled = act({ ...nextMonth, phase: "live", pending: null, minigame: null, majorsLeft: 3 }, "tutor|drill");
  assert.equal(drilled.mentor?.lessons, 2);
});

test("no tutor lessons before 15", () => {
  const kid = toAge(godKid(9), 13);
  assert.equal(kid.mentor ?? null, null);
  const g = act({ ...kid, majorsLeft: 3 }, "tutor|braid");
  assert.ok(!(g.unlockedPowers ?? []).includes("light-speed"));
});

test("every God Mode legend has its own mentor, and ordinary lives get one by upbringing or city", () => {
  for (const preset of PRESETS) {
    assert.ok(LEGEND_MENTORS[preset.id], `${preset.id} has a mentor`);
    assert.equal(mentorFor({ preset: preset.id, upbringing: "street", cityId: "nyc" }).id, LEGEND_MENTORS[preset.id]!.id);
  }
  assert.ok(mentorFor({ preset: null, upbringing: "nonexistent" as never, cityId: "neon" }).name);
  assert.ok(mentorFor({ preset: null, upbringing: "nonexistent" as never, cityId: "nowhere" }).name, "fallback mentor");
});

test("Skip to 15 lands on the 15th birthday with far fewer stops than year skips, and never mixes early", () => {
  for (const seed of [11, 12]) {
    let g = godKid(seed);
    let taps = 0;
    for (let i = 0; i < 300 && g.age < MIX_AGE && g.phase !== "dead"; i++) {
      if (g.skipReport) g = dismissSkip(g);
      else if (g.reveal) g = dismissReveal(g);
      else if (g.chapterNotice) g = { ...g, chapterNotice: null };
      else if (g.phase === "choice" && g.pending) { g = choose(g, g.pending.choices[0]!.id); taps++; }
      else if (g.phase === "mini") { g = resolveMini(g, 0.6); taps++; }
      else {
        assert.ok(canSkipToFifteen(g) || skipMonths(g, "fifteen") < 3);
        g = canSkipToFifteen(g) ? fastForward(g, "fifteen") : ageUp(g, { quiet: true });
        taps++;
        assert.ok(!(g.unlockedPowers ?? []).includes("light-speed") || g.age >= MIX_AGE, "no mix before 15");
      }
    }
    assert.equal(g.age, MIX_AGE);
    assert.ok(g.mentor, "the mentor is there at 15");
    assert.ok(taps <= 40, `skip to 15 took ${taps} taps`);
  }
});

test("settleSmall leaves fights, canon and villain cases to the player", () => {
  const g = godKid(2);
  const villain: Game = { ...g, phase: "choice", pending: { id: "villain-p1", prompt: "A villain.", choices: [{ id: "talk", label: "Talk" }], outcomes: { talk: { text: "ok" } } } } as Game;
  assert.equal(settleSmall(villain), null);
  const canon: Game = { ...g, phase: "choice", pending: { id: "canon|x", prompt: "Canon.", choices: [{ id: "a", label: "A" }], outcomes: { a: { text: "ok" } } } } as Game;
  assert.equal(settleSmall(canon), null);
  const small: Game = { ...g, phase: "choice", pending: { id: "rain", prompt: "It rains.", choices: [{ id: "sulk", label: "Sulk" }, { id: "dance", label: "Dance" }], outcomes: { sulk: { text: "meh", effects: { happiness: -2 } }, dance: { text: "yay", effects: { happiness: 3 } } } } } as Game;
  const done = settleSmall(small);
  assert.ok(done && done.line.includes("Dance"), "picks the kinder option");
});
