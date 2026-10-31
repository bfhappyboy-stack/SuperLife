// Chapters, longevity and playability guards.
// Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, actionsFor, ageUp, choose, createGame, freshen, resolveMini } from "../engine.ts";
import { buildChapter, CHAPTER_PHASES, chapterIndexForAge, migrateChapters, phaseForAge, validChapterText } from "../chapters.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "stacks", upbringing: "street", portrait: 11, sex: "female", face: "secret", drive: "protector", giftId: "fire-control", seed: 7 } as const;
const OTHER = { name: "Marcus Hale", cityId: "nyc", upbringing: "wealthy", portrait: 22, sex: "male", face: "loud", drive: "idealistic", giftId: "telepathy", seed: 7 } as const;

function step(g: Game): Game {
  if (g.phase === "choice" && g.pending) return choose(g, g.pending.choices[0].id);
  if (g.phase === "mini" && g.minigame) return resolveMini(g, 0.7);
  return ageUp(g);
}

function liveTo(g: Game, age: number): Game {
  let guard = 0;
  while (g.phase !== "dead" && g.age < age && guard++ < 20000) g = step(g);
  return g;
}

test("phase table covers every age in order", () => {
  for (let i = 1; i < CHAPTER_PHASES.length; i++) assert.ok(CHAPTER_PHASES[i].from > CHAPTER_PHASES[i - 1].from);
  assert.equal(phaseForAge(0).id, "origin");
  assert.equal(phaseForAge(19).id, "coming");
  assert.equal(phaseForAge(45).id, "crisis");
  assert.equal(phaseForAge(95).id, "final");
  assert.equal(chapterIndexForAge(39), 3);
});

test("a new life opens chapter 1 with a title card and three goals", () => {
  const g = createGame({ ...BASE } as never);
  assert.equal(g.chapters?.length, 1);
  const ch = g.chapters![0];
  assert.equal(ch.phase, "origin");
  assert.equal(ch.goals.length, 3);
  assert.ok(ch.title.length > 2 && ch.premise.length > 20);
  assert.deepEqual(g.chapterNotice, { open: 0, recap: null });
  assert.equal(new Set(ch.goals.map((goal) => goal.metric)).size, 3, "goals use distinct metrics");
});

test("chapters turn exactly at decade birthdays, with a recap carried forward", () => {
  let g = createGame({ ...BASE } as never);
  g = liveTo(g, 9);
  assert.equal(g.chapters?.length, 1, "no turn before 10");
  g = liveTo(g, 10);
  assert.equal(g.age, 10);
  assert.equal(g.chapters?.length, 2);
  const [first, second] = g.chapters!;
  assert.ok(first.recap, "old chapter has a recap");
  assert.equal(first.recap!.total, 3);
  assert.equal(second.phase, "coming");
  assert.deepEqual(g.chapterNotice, { open: 1, recap: 0 });
  g = liveTo(g, 19);
  assert.equal(g.chapters?.length, 2);
  g = liveTo(g, 20);
  assert.equal(g.chapters?.length, 3);
  assert.equal(g.chapters![2].phase, "early");
  assert.ok(typeof g.legacy === "number");
});

test("different heroes get different chapters", () => {
  const a = createGame({ ...BASE } as never);
  const b = createGame({ ...OTHER } as never);
  const ca = a.chapters![0];
  const cb = b.chapters![0];
  assert.notEqual(ca.premise, cb.premise);
  // Same hero shape at 20 but different traits/path → different goals or text.
  a.age = 20;
  b.age = 20;
  const xa = buildChapter(a);
  const xb = buildChapter(b);
  assert.ok(xa.premise !== xb.premise || xa.goals.map((g) => g.id).join() !== xb.goals.map((g) => g.id).join());
  // Determinism: same state → same chapter.
  assert.deepEqual(buildChapter(a), xa);
});

test("a secret hero and a loud hero get different fame goals as teens", () => {
  const a = createGame({ ...BASE } as never);
  const b = createGame({ ...OTHER } as never);
  a.age = 10;
  b.age = 10;
  for (let seed = 0; seed < 30; seed++) {
    a.rng = seed;
    b.rng = seed;
    assert.ok(!buildChapter(a).goals.some((g) => g.id === "loudfame"), "secret heroes never get loud-fame goals");
    assert.ok(!buildChapter(b).goals.some((g) => g.id === "quietfame"), "loud heroes never get keep-the-mask goals");
  }
});

test("old saves without chapters migrate cleanly and keep turning", () => {
  let g = createGame({ ...BASE } as never);
  g = liveTo(g, 34);
  const old = structuredClone(g) as Game;
  delete old.chapters;
  delete old.legacy;
  delete old.chapterNotice;
  const migrated = freshen(old);
  assert.equal(migrated.chapters?.length, 1);
  assert.equal(migrated.chapters![0].index, 3);
  assert.equal(migrated.chapters![0].phase, "rising");
  assert.equal(migrated.legacy, 0);
  // Idempotent.
  migrateChapters(migrated);
  assert.equal(migrated.chapters?.length, 1);
  const next = liveTo(migrated, 40);
  if (next.phase !== "dead") {
    assert.equal(next.chapters?.length, 2);
    assert.equal(next.chapters![1].phase, "crisis");
  }
});

test("AI chapter text is strictly validated", () => {
  const good = { title: "Late Light", premise: "You are seventy and the city still calls. You answer slower, and better, than you used to.", beats: ["Mentor a rookie on Sundays.", "Keep your health above the line.", "Call the people who still pick up."] };
  assert.ok(validChapterText(good, 3));
  assert.equal(validChapterText({ ...good, beats: good.beats.slice(0, 2) }, 3), null);
  assert.equal(validChapterText({ ...good, title: "<b>x</b>" }, 3), null);
  assert.equal(validChapterText({ ...good, premise: "short" }, 3), null);
  assert.equal(validChapterText("nope", 3), null);
});

test("health hitting zero is a hospital stay first, not a funeral", () => {
  let g = createGame({ ...BASE } as never);
  g = liveTo(g, 25);
  while (g.phase === "choice" || g.phase === "mini") g = step(g);
  g.stats.health = -5;
  g.stats.happiness = 50;
  g.month = 11;
  g.flags.critical = 0;
  const after = ageUp(g);
  assert.notEqual(after.phase, "dead");
  assert.ok(after.stats.health >= 25);
  assert.ok((after.flags.critical ?? 0) > 0);
  // A second collapse inside the critical window can kill an adult.
  after.stats.health = -5;
  after.month = 11;
  after.phase = "live";
  const again = ageUp(after);
  assert.equal(again.phase, "dead");
});

test("heavy shift is once a month", () => {
  let g = createGame({ ...BASE } as never);
  g = liveTo(g, 20);
  while (g.phase === "choice" || g.phase === "mini") g = step(g);
  g = act(g, "job:cafe");
  while (g.phase !== "live") g = step(g);
  g.majorsLeft = 3;
  delete g.flags.shifted;
  const once = act(g, "shift");
  if (once === g) return; // no job at this seed; nothing to check
  const shift = actionsFor(once).find((a) => a.id === "shift");
  assert.ok(shift?.disabled, "second shift in the same month is disabled");
  assert.equal(act(once, "shift"), once);
});

test("a careful life lasts many decades", () => {
  for (const opts of [BASE, OTHER]) {
    let g = createGame({ ...opts } as never);
    let guard = 0;
    while (g.phase !== "dead" && g.age < 70 && guard++ < 40000) {
      if (g.phase === "live" && g.majorsLeft > 0) {
        const a = actionsFor(g).find((x) => !x.disabled && (x.id === (g.stats.health < 40 ? "rest" : "train") || x.id === "rest"));
        if (a) {
          const n = act(g, a.id);
          if (n !== g) {
            g = n;
            continue;
          }
        }
      }
      g = step(g);
    }
    assert.ok(g.age >= 60, `${opts.name} reached ${g.age}`);
  }
});
