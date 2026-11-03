// Age-up pass (2026-11-02): fast-forward, softer youth growth, and five save slots.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageUp, choose, createGame, dismissReveal, resolveMini } from "../engine.ts";
import { powerLevelCap, youthGain } from "../mastery.ts";
import { dismissSkip, fastForward, noteMini, playMonth, stopFor } from "../skip.ts";
import type { Game } from "../types.ts";

// A tiny in-memory localStorage, shared by every test in this file (each test file is its own process).
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

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;
const life = (seed: number, extra: Record<string, unknown> = {}): Game => createGame({ ...base, mode: "mystery", seed, ...extra } as never);

function settle(g: Game, ratio = 0.65): Game {
  for (let i = 0; i < 40; i++) {
    if (g.skipReport) g = dismissSkip(g);
    else if (g.reveal) g = dismissReveal(g);
    else if (g.chapterNotice) g = { ...g, chapterNotice: null };
    else if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = noteMini(resolveMini(g, ratio), ratio);
    else break;
  }
  return g;
}

// ---------- growth ----------

test("youth growth: gains under 18 are trimmed and ease off near the cap; adults are untouched", () => {
  assert.equal(youthGain(0.5, 3, 18), 0.5);
  assert.equal(youthGain(0.5, 7, 40), 0.5);
  assert.equal(youthGain(-0.3, 1, 10), -0.3, "losses are never softened");
  const kid = youthGain(0.5, 0.2, 9);
  const teen = youthGain(0.5, 0.2, 16);
  assert.ok(kid < teen && teen < 0.5, `kid ${kid} < teen ${teen} < 0.5`);
  assert.ok(youthGain(0.5, powerLevelCap(16) * 0.95, 16) < youthGain(0.5, 0.5, 16), "diminishing near the young cap");
  for (const age of [19, 25, 35, 49, 70]) assert.ok(powerLevelCap(age) >= 6.8, `adult cap unchanged at ${age}`);
  assert.ok(powerLevelCap(17) <= 5 && powerLevelCap(10) <= 2.3);
});

// ---------- fast-forward ----------

test("fast-forward: a season is at most 3 months, writes a summary, and never plays your fights", () => {
  let g = settle(life(4));
  for (let i = 0; i < 30; i++) g = settle(ageUp(g));
  const start = { age: g.age, month: g.month };
  const n = fastForward(g, "season");
  assert.ok(n.skipReport, "summary card");
  const r = n.skipReport!;
  assert.ok(r.months <= 3 && r.planned === 3);
  assert.deepEqual(r.from, start);
  const elapsed = (n.age - start.age) * 12 + (n.month - start.month);
  assert.equal(elapsed, r.months, "months on the card match the clock");
  if (n.phase === "mini") assert.ok(r.stop, "a mini left open must be a stop");
  assert.equal(dismissSkip(n).skipReport, null);
});

test("fast-forward to a birthday lands on the birthday when nothing interrupts", () => {
  let hits = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    let g = settle(life(seed));
    for (let i = 0; i < 26; i++) g = settle(ageUp(g));
    const n = fastForward(g, "year");
    const r = n.skipReport!;
    if (!r.stop) {
      hits++;
      assert.equal(n.month, 0);
      assert.equal(n.age, g.age + 1);
      assert.equal(r.months, r.planned);
    } else assert.ok(r.stop.text.length > 0);
  }
  assert.ok(hits >= 1, "at least one clean year in six");
});

test("fast-forward stops for the power reveal", () => {
  let stopped = 0;
  for (const seed of [3, 8, 13]) {
    let g = settle(life(seed));
    for (let i = 0; i < 400 && g.phase !== "dead"; i++) {
      if (g.reveal) break;
      g = fastForward(settle(g), "year");
      if (g.reveal) {
        assert.equal(g.skipReport?.stop?.kind, "reveal");
        stopped++;
        break;
      }
      g = settle(g);
    }
  }
  assert.equal(stopped, 3);
});

test("stop rules: low health, a family crisis, and a fresh choice all stop the skip", () => {
  const g = settle(life(9));
  const hurt = structuredClone(g);
  hurt.stats.health = 20;
  assert.equal(stopFor(g, hurt, false)?.kind, "health");
  const parent = g.relationships.find((p) => p.role === "parent")!;
  const cold = structuredClone(g);
  const p = cold.relationships.find((x) => x.id === parent.id)!;
  parent.closeness = 30;
  p.closeness = 12;
  assert.equal(stopFor(g, cold, false)?.kind, "bond");
  const asked = structuredClone(g);
  asked.phase = "choice";
  asked.pending = { id: "some-event", prompt: "A stranger asks for help.", choices: [{ id: "a", label: "A" }] } as never;
  assert.equal(stopFor(g, asked, false)?.kind, "event");
});

test("a worn-out kid is stopped before the skip runs them into the ground", () => {
  let g = settle(life(6));
  for (let i = 0; i < 40; i++) g = settle(ageUp(g));
  g = structuredClone(g);
  g.stats.health = 14;
  g.flags.rested = 1;
  const n = fastForward(g, "year");
  assert.ok(n.skipReport?.stop, "stopped");
  assert.ok(n.skipReport!.months <= 1, `ran ${n.skipReport!.months} months at low health`);
});

/** Hand play using the same everyday plan: full event rate, minis at your own skill. */
function manual(seed: number, toAge: number): Game {
  let g = settle(life(seed));
  for (let i = 0; i < 4000 && g.phase !== "dead" && g.age < toAge; i++) {
    g = settle(playMonth(g, new Map(), 0.65).g);
    if (g.phase === "live") g = settle(ageUp(g));
  }
  return g;
}
function skipped(seed: number, toAge: number): { g: Game; taps: number } {
  let g = settle(life(seed));
  let taps = 0;
  for (let i = 0; i < 4000 && g.phase !== "dead" && g.age < toAge; i++) {
    g = fastForward(g, "year");
    taps += 2;
    g = settle(g);
  }
  return { g, taps };
}

test("skipping is never better than playing the same months by hand", () => {
  const seeds = [1, 2, 3, 4, 5, 6];
  const mean = (rows: Game[], f: (g: Game) => number) => rows.reduce((a, g) => a + f(g), 0) / rows.length;
  const hand = seeds.map((s) => manual(s, 14));
  const ff = seeds.map((s) => skipped(s, 14).g);
  const power = (g: Game) => g.stats.powerLevel;
  const mastery = (g: Game) => Object.values(g.mastery ?? {}).reduce((a, b) => a + b, 0);
  assert.ok(mean(ff, power) <= mean(hand, power) + 0.05, `power ff ${mean(ff, power)} vs hand ${mean(hand, power)}`);
  assert.ok(mean(ff, mastery) <= mean(hand, mastery) * 1.05 + 1, `mastery ff ${mean(ff, mastery)} vs hand ${mean(hand, mastery)}`);
  assert.ok(mean(ff, (g) => g.stats.money) <= mean(hand, (g) => g.stats.money) * 1.1 + 200, "money");
  // ...but not punishing either: joy stays within reach of hand play.
  assert.ok(mean(ff, (g) => g.stats.happiness) >= mean(hand, (g) => g.stats.happiness) - 15, "joy");
});

// ---------- save slots ----------

test("migration: the old single save moves into slot 1 without loss, once", () => {
  mem.clear();
  const old = life(21);
  old.stats.money = 4321;
  mem.set(save.LEGACY_KEY, JSON.stringify(old));
  const index = save.migrateLegacySave();
  assert.equal(index.migrated, true);
  assert.equal(index.active, 1);
  const slot1 = save.loadSlot(1)!;
  assert.equal(slot1.name, old.name);
  assert.equal(slot1.stats.money, 4321);
  assert.equal(slot1.age, old.age);
  assert.ok(mem.has(save.LEGACY_KEY), "old key kept as a backup");
  assert.equal(save.loadGame()?.name, old.name, "loadGame resumes the migrated life");
  // Deleting slot 1 never resurrects the old save.
  save.deleteSlot(1);
  save.migrateLegacySave();
  assert.equal(save.loadSlot(1), null);
  assert.equal(save.loadGame(), null);
});

test("migration never overwrites lives that are already in slots", () => {
  mem.clear();
  const a = life(31, { name: "Ada Slot" });
  const legacy = life(32, { name: "Leo Legacy" });
  mem.set(save.slotKey(1), JSON.stringify(a));
  mem.set(save.LEGACY_KEY, JSON.stringify(legacy));
  save.migrateLegacySave();
  assert.equal(save.loadSlot(1)?.name, "Ada Slot");
});

test("slots are isolated: saving, overwriting and deleting one never touches another", () => {
  mem.clear();
  save.migrateLegacySave();
  const lives = [1, 2, 3, 4, 5].map((s) => life(40 + s, { name: `Life ${s}` }));
  lives.forEach((g, i) => save.saveSlot(i + 1, g, 1000 + i));
  const snap = () => [1, 2, 3, 4, 5].map((s) => mem.get(save.slotKey(s)));
  const before = snap();
  const changed = structuredClone(lives[1]!);
  changed.stats.money = 999999;
  save.saveSlot(2, changed, 5000);
  const after = snap();
  assert.equal(save.loadSlot(2)?.stats.money, 999999);
  for (const i of [0, 2, 3, 4]) assert.equal(after[i], before[i], `slot ${i + 1} untouched`);
  assert.equal(save.firstEmptySlot(), null, "all five full");
  // With every slot full and no active slot, a stray save goes nowhere instead of overwriting.
  save.setActiveSlot(null);
  save.saveGame(life(99, { name: "Intruder" }));
  assert.deepEqual(snap().map((raw) => (raw ? (JSON.parse(raw) as Game).name : null)), ["Life 1", "Life 2", "Life 3", "Life 4", "Life 5"]);
  save.deleteSlot(3);
  assert.equal(save.loadSlot(3), null);
  assert.equal(save.firstEmptySlot(), 3);
  for (const s of [1, 2, 4, 5]) assert.ok(save.loadSlot(s), `slot ${s} survives the delete`);
  assert.equal(save.saveSlot(0, lives[0]!), undefined);
  assert.equal(save.saveSlot(6, lives[0]!), undefined);
  assert.equal(mem.has(save.slotKey(6)), false, "no sixth slot");
});

test("the Your lives list: portrait data, mode, age and last played", () => {
  mem.clear();
  save.migrateLegacySave();
  save.saveSlot(1, life(51, { name: "Mia Mystery" }), 111);
  save.saveSlot(2, createGame({ ...base, preset: "spider-man", seed: 2 } as never), 222);
  save.saveSlot(4, createGame({ ...base, mode: "god", seed: 3 } as never), 444);
  const rows = save.listSlots();
  assert.equal(rows.length, save.SLOT_COUNT);
  assert.equal(rows[0]!.modeKind, "mystery");
  assert.equal(rows[0]!.mode, "Mystery");
  assert.equal(rows[0]!.lastPlayed, 111);
  assert.equal(rows[1]!.modeKind, "legend");
  assert.match(rows[1]!.mode!, /Spider-Man/);
  assert.equal(rows[1]!.preset, "spider-man");
  assert.equal(rows[2]!.empty, true);
  assert.equal(rows[3]!.modeKind, "own");
  assert.equal(rows[3]!.mode, "Build your own");
  assert.equal(rows[4]!.empty, true);
  for (const r of rows.filter((x) => !x.empty)) assert.ok(typeof r.age === "number" && r.name && typeof r.portrait === "number");
});

test("store: starting a life in slot 2 leaves slot 1 alone, and switching lives keeps both", async () => {
  mem.clear();
  const old = life(61, { name: "Old Save" });
  mem.set(save.LEGACY_KEY, JSON.stringify(old));
  const { useGame } = await import("../store.ts");
  const s = useGame.getState;
  s().hydrate();
  assert.equal(s().slot, 1);
  assert.equal(s().game?.name, "Old Save");
  s().age();
  const slot1 = mem.get(save.slotKey(1));
  s().newLifeIn(2);
  assert.equal(s().screen, "mode");
  s().begin({ ...base, mode: "mystery", seed: 62, name: "New Kid" } as never);
  assert.equal(s().slot, 2);
  assert.equal(save.loadSlot(2)?.name, "New Kid");
  assert.equal(mem.get(save.slotKey(1)), slot1, "slot 1 untouched by the new life");
  s().age();
  s().playSlot(1);
  assert.equal(s().game?.name, "Old Save");
  assert.equal(save.loadSlot(2)?.name, "New Kid");
  s().removeLife(2);
  assert.equal(save.loadSlot(2), null);
  assert.equal(s().game?.name, "Old Save", "deleting another slot keeps the current life");
  assert.equal(s().lives.filter((r) => !r.empty).length, 1);
});
