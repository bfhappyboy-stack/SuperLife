// 2026-11-01 moves fix: the six-move picker. Swaps are atomic, the six never drops to five, and picks survive reloads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, choose, createGame, dismissReveal, freshen, resolveMini } from "../engine.ts";
import { battleMoves, knownMoves, moveById, moveUnlocked, MOVESET_SIZE, placeInSlot, toggleLoadout } from "../moves.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "nyc", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;

function settle(g: Game): Game {
  for (let i = 0; i < 60 && g.phase !== "live" && g.phase !== "dead"; i++) {
    if (g.reveal) g = dismissReveal(g);
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.8);
  }
  if (g.reveal) g = dismissReveal(g);
  return { ...g, chapterNotice: null };
}

function live(g: Game, maxAge: number, until?: (g: Game) => boolean): Game {
  for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (until?.(g)) break;
    if (g.reveal) g = dismissReveal(g);
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.8);
    else {
      for (let k = 0; k < 2 && g.phase === "live"; k++) g = act(g, "train");
      if (g.phase === "live") g = ageUp(g);
    }
  }
  return settle(g);
}

const ready = (g: Game) => knownMoves(g).filter((entry) => entry.unlocked).map((entry) => entry.def.id);
const bench = (g: Game) => ready(g).filter((id) => !g.loadout.includes(id));
const reload = (g: Game) => freshen(JSON.parse(JSON.stringify(g)) as Game);

function assertSix(g: Game, label: string) {
  const want = Math.min(MOVESET_SIZE, ready(g).length);
  assert.equal(g.loadout.length, want, `${label}: loadout ${g.loadout.length}, expected ${want}`);
  assert.equal(new Set(g.loadout).size, g.loadout.length, `${label}: duplicate move in the six`);
  for (const id of g.loadout) assert.ok(moveUnlocked(g, moveById(id)!), `${label}: ${id} is locked but equipped`);
  assert.equal(battleMoves(g).length, MOVESET_SIZE, `${label}: a fight must always get exactly six`);
}

let cache: Record<string, Game> | null = null;
function lives(): Record<string, Game> {
  cache ??= {
    mysteryPre: live(createGame({ ...base, mode: "mystery", seed: 7 } as never), 6),
    mysteryPost: live(createGame({ ...base, mode: "mystery", seed: 7 } as never), 16, (g) => !!g.giftId && !g.hiddenGift && g.age >= 8),
    mysteryOld: live(createGame({ ...base, mode: "mystery", seed: 7 } as never), 30),
    spider: live(createGame({ ...base, preset: "spider-man", mode: "god", seed: 3 } as never), 18),
    buildOwn: live(createGame({ ...base, mode: "god", giftIds: ["super-speed", "fire-control", "super-strength"], seed: 5 } as never), 14),
  };
  return cache;
}

function richLife(): Game {
  const g = structuredClone(lives().mysteryOld);
  assert.ok(ready(g).length > MOVESET_SIZE, "fixture should know more than six moves");
  assert.equal(g.loadout.length, MOVESET_SIZE);
  return g;
}

test("old bug: dropping a move then tapping it again used to flip it back out and leave five", () => {
  let g = richLife();
  const dropped = g.loadout[0]!;
  g = act(g, `equip|${dropped}`);
  assertSix(g, "after drop");
  assert.ok(!g.loadout.includes(dropped), "the dropped move is out");
  assert.notEqual(g.loadout[0], dropped, "slot 1 is refilled by a different move, in place");
  // Next action runs the auto top-up; it must not quietly undo the drop.
  g = act(g, "focus|" + g.unlockedPowers[0]);
  assert.ok(!g.loadout.includes(dropped), "auto top-up does not undo the drop");
  assertSix(g, "after next action");
});

test("old bug: after a drop you could only ever re-add the first bench move", () => {
  let g = richLife();
  const pick = bench(g).at(-1)!;
  g = act(g, `slot|3|${pick}`);
  assert.equal(g.loadout[3], pick, "chosen move lands in the chosen slot");
  assertSix(g, "after swap");
  g = act(g, "focus|" + g.unlockedPowers[0]);
  assert.equal(g.loadout[3], pick, "survives the next action's top-up");
});

test("slot swap is atomic: bench move replaces, equipped move trades places", () => {
  const g = richLife();
  const before = [...g.loadout];
  const incoming = bench(g)[0]!;
  const res = placeInSlot(g, 2, incoming);
  assert.ok(res.ok, res.line);
  assert.equal(g.loadout[2], incoming);
  assert.ok(!g.loadout.includes(before[2]!), "replaced move goes back to the bench");
  assert.match(res.line, /in, .* out\. Slot 3\./);
  const trade = placeInSlot(g, 0, g.loadout[5]!);
  assert.ok(trade.ok);
  assert.equal(g.loadout[0], before[5]);
  assert.equal(g.loadout[5], before[0]);
  assertSix(g, "after trades");
});

test("locked, unknown and out-of-range picks change nothing", () => {
  const g = richLife();
  const before = [...g.loadout];
  const lockedMove = knownMoves(g).find((entry) => !entry.unlocked)!.def.id;
  assert.equal(placeInSlot(g, 1, lockedMove).ok, false);
  assert.equal(placeInSlot(g, 1, "nope::z").ok, false);
  assert.equal(placeInSlot(g, 6, bench(g)[0]!).ok, false);
  assert.equal(placeInSlot(g, -1, bench(g)[0]!).ok, false);
  assert.deepEqual(g.loadout, before);
  const after = act(g, `slot|1|${lockedMove}`);
  assert.deepEqual(after.loadout, before);
});

test("a full six refuses a plain add instead of overflowing", () => {
  const g = richLife();
  const note = toggleLoadout(g, bench(g)[0]!);
  assert.match(note, /Six moves already/);
  assert.equal(g.loadout.length, MOVESET_SIZE);
});

test("a drop is refused when every move you know is already in", () => {
  const g = structuredClone(lives().mysteryPost);
  assert.ok(ready(g).length >= 1 && ready(g).length <= MOVESET_SIZE);
  const before = [...g.loadout];
  const note = toggleLoadout(g, before[0]!);
  assert.match(note, /already in the six/);
  assert.deepEqual(g.loadout, before);
});

test("picks survive a save and reload", () => {
  let g = richLife();
  const pick = bench(g).at(-1)!;
  g = act(g, `slot|4|${pick}`);
  g = act(g, `slot|0|${g.loadout[4]!}`);
  const expected = [...g.loadout];
  const back = reload(g);
  assert.deepEqual(back.loadout, expected, "reload keeps the exact order and picks");
  assertSix(back, "after reload");
});

test("saved sets load back exactly", () => {
  let g = richLife();
  g = act(g, "set-save|0");
  const saved = [...g.loadout];
  g = act(g, `slot|0|${bench(g)[0]!}`);
  assert.notDeepEqual(g.loadout, saved);
  g = act(g, "set-load|0");
  assert.deepEqual(g.loadout, saved);
});

test("every kind of life keeps exactly six through random swaps and reloads", () => {
  for (const [name, fixture] of Object.entries(lives())) {
    let g = structuredClone(fixture);
    assertSix(g, `${name} start`);
    let rng = 12345;
    const next = (n: number) => {
      rng = (rng * 1103515245 + 12345) >>> 0;
      return rng % Math.max(1, n);
    };
    for (let i = 0; i < 120; i++) {
      const pool = ready(g);
      if (!pool.length) break;
      g = act(g, `slot|${next(MOVESET_SIZE)}|${pool[next(pool.length)]!}`);
      if (i % 30 === 0) g = reload(g);
      assertSix(g, `${name} step ${i}`);
    }
  }
});

test("before the power wakes the fight still gets six street moves", () => {
  const g = lives().mysteryPre;
  assert.ok(g.hiddenGift, "still sealed");
  assert.equal(g.loadout.length, 0);
  assert.equal(battleMoves(g).length, MOVESET_SIZE);
});

test("gaining a new power keeps the player's six and puts the new moves on the bench", () => {
  let g = richLife();
  const pick = bench(g).at(-1)!;
  g = act(g, `slot|2|${pick}`);
  const mine = [...g.loadout];
  const owned = new Set(g.unlockedPowers);
  // A newly learned power (teacher, combo or wake) lands in unlockedPowers; freshen runs the same top-up.
  const fresh = ["ice-control", "flight", "super-strength", "telekinesis", "regeneration", "super-speed", "fire-control"].find((id) => !owned.has(id));
  assert.ok(fresh, "fixture needs a power it doesn't own");
  {
    g.unlockedPowers = [...g.unlockedPowers, fresh];
    g = freshen(g);
    assert.deepEqual(g.loadout, mine, "a new power never reshuffles a full six");
    assert.ok(bench(g).some((id) => moveById(id)?.powerId === fresh), "new power's first move is on the bench");
    assertSix(g, "after new power");
  }
});
