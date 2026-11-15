// After the truth (2026-11-14): a partner who knows patches you up after fights; an ex who knew and left on bad
// terms sells your story; a good-terms ex keeps it. Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, createGame, resolveMini } from "../engine.ts";
import { CARE_HURT, CARE_WIN, careLine, careNews, carer, keepsMask, saleNews, SALE_FALLOUT, wouldSell } from "../mask.ts";
import type { Game, Person } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "secret", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function at(age: number, face: "secret" | "loud" = "secret"): Game {
  const g = createGame({ ...BASE, face } as never);
  g.age = age;
  g.month = 0;
  g.phase = "live";
  g.pending = null;
  g.reveal = null;
  g.majorsLeft = 3;
  g.stats.health = 50;
  g.stats.happiness = 50;
  g.stats.money = 20000;
  if (!g.powerId) g.powerId = "fire-control" as never;
  if (!(g.unlockedPowers ?? []).length) g.unlockedPowers = ["fire-control" as never];
  return g;
}
function partner(g: Game, closeness = 75, knows = true, trust = 60): Person {
  const p: Person = { id: "pz", name: "Jules Park", role: "partner", stage: "living", closeness, trust, knowsSecret: knows, age: g.age, alive: true, metAt: g.age, portrait: 5, sex: "male" };
  g.relationships.push(p);
  return p;
}
function fight(g: Game, side: "villain" | "hero" = "villain"): Game {
  return {
    ...g,
    phase: "mini",
    minigame: {
      kind: "duel", title: "Rook", subtitle: "", difficulty: 1, tag: "duel", winText: "You win.", partialText: "Even.", loseText: "You lose.",
      winEffects: {}, partialEffects: {}, loseEffects: {},
      duel: { foeName: "Rook", foeTitle: "Rook", foeSide: side, playerHp: 40, foeHp: 30, playerMoves: [], foeMoves: [], foeLevel: 1 },
    },
  } as unknown as Game;
}
const pz = (g: Game) => g.relationships.find((r) => r.id === "pz")!;

test("a close partner who knows patches you up after a villain fight, once a month, more when it went badly", () => {
  const g = at(28);
  partner(g);
  assert.equal(carer(g)?.id, "pz");
  const won = resolveMini(fight(g), 0.95);
  assert.equal(won.stats.health, 50 + CARE_WIN.health);
  assert.ok(won.stats.happiness > 50 && won.stats.happiness <= 50 + CARE_WIN.happiness, "a little Joy");
  assert.match(won.card.banner.join(" "), /Jules checks you over/);
  assert.equal(pz(won).patches, 1);
  const again = resolveMini(fight(won), 0.95);
  assert.equal(pz(again).patches, 1, "once a month");
  const next = { ...structuredClone(again), month: 1 };
  const lost = resolveMini(fight(next), 0.1);
  assert.equal(pz(lost).patches, 2);
  assert.match(lost.card.banner.join(" "), /Stitches, ice/);
  assert.ok(CARE_HURT.health > CARE_WIN.health);
  assert.equal(careLine(lost, pz(lost)), "Patches you up after fights (2 times).");
  assert.deepEqual(careNews(g, lost), ["Jules patched you up after 2 fights. Nobody else knows where the bruises came from."]);
  assert.deepEqual(careNews(lost, lost), [], "the recap line shows once");
});

test("no patch-up from a partner who doesn't know, a distant one, a sparring match or a public hero", () => {
  const unaware = at(28);
  partner(unaware, 80, false);
  assert.equal(pz(resolveMini(fight(unaware), 0.9)).patches, undefined);
  const distant = at(28);
  partner(distant, 40, true);
  assert.equal(carer(distant), undefined);
  assert.equal(careLine(distant, pz(distant)), null);
  const spar = at(28);
  partner(spar);
  assert.equal(pz(resolveMini(fight(spar, "hero"), 0.9)).patches, undefined, "only villain fights");
  const loud = at(28, "loud");
  partner(loud);
  assert.ok(!keepsMask(loud));
  assert.equal(pz(resolveMini(fight(loud), 0.9)).patches, undefined);
  const fresh = at(28);
  partner(fresh);
  assert.equal(careLine(fresh, pz(fresh)), "Will patch you up after fights.");
});

test("breaking up badly with someone who knew: they sell your story and the mask is off for good", () => {
  const g = at(30);
  partner(g, 25, true, 50);
  assert.ok(wouldSell(g, pz(g)));
  const fame = g.stats.fame;
  const rep = g.stats.reputation;
  const n = act(g, "love|split|pz");
  assert.equal(pz(n).role, "ex");
  assert.ok(pz(n).soldStory);
  assert.ok(n.traits.includes("loud") && !n.traits.includes("secret"), "secret identity exposed");
  assert.ok(!keepsMask(n));
  assert.ok(n.stats.fame > fame && n.stats.fame <= fame + SALE_FALLOUT.fame, "famous overnight");
  assert.ok(n.stats.reputation < rep, "trusted less");
  assert.match(n.card.banner.join(" "), /sold your story/);
  assert.ok(n.history.some((h) => /sold your story to the press/.test(h.text) && h.tag === "major"));
  assert.equal(saleNews(g, n).length, 1);
  assert.equal(saleNews(n, n).length, 0, "news once");
  // Low trust alone is enough.
  const t = at(30);
  partner(t, 60, true, 20);
  assert.ok(act(t, "love|split|pz").storySold);
});

test("a good-terms ex keeps the secret; an ex who never knew has nothing to sell", () => {
  const g = at(30);
  partner(g, 70, true, 60);
  const n = act(g, "love|split|pz");
  assert.ok(n.traits.includes("secret"));
  assert.ok(!n.storySold);
  assert.match(n.card.banner.join(" "), /keeps it/);
  assert.equal(pz(n).history?.at(-1)?.line, "Keeps your secret");
  const u = at(30);
  partner(u, 10, false, 10);
  const m = act(u, "love|split|pz");
  assert.ok(m.traits.includes("secret") && !m.storySold);
});

test("a partner who knew and walks out over the years (closeness under 16) sells the story too", () => {
  const g = at(30);
  g.month = 11;
  partner(g, 12, true, 50);
  const n = ageUp(g);
  assert.equal(pz(n).role, "ex");
  assert.ok(n.storySold, "sold on the way out");
  assert.ok(n.traits.includes("loud"));
});

test("old saves: no new fields needed; a malformed storySold is dropped on load", async () => {
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
  const { loadSlot, saveSlot } = await import("../save.ts");
  const g = at(30);
  partner(g);
  delete (g as Partial<Game>).storySold;
  saveSlot(1, g);
  const back = loadSlot(1)!;
  assert.ok(back);
  assert.equal(careLine(back, pz(back)), "Will patch you up after fights.");
  assert.deepEqual(saleNews(back, back), []);
  saveSlot(2, { ...g, storySold: { by: 3, at: "x" } as unknown as Game["storySold"] });
  assert.equal(loadSlot(2)?.storySold, null);
  saveSlot(3, { ...g, storySold: { by: "Jules Park", at: 360 } });
  assert.deepEqual(loadSlot(3)?.storySold, { by: "Jules Park", at: 360 });
});
