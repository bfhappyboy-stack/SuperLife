// Case files, bond curve and prompt variants.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ARCS, availableArcs } from "../arcs.ts";
import { DOSSIERS } from "../origin.ts";
import { bondStep, bondYearRoom, seedHeroes } from "../heroes.ts";
import { PROMPT_POOLS, pickPrompt, promptBand } from "../prompts.ts";

const LEGACY_POWERS = new Set(["strength", "flight", "blasts", "speed", "telekinesis", "invisibility", "fire", "ice", "healing", "mind", "shapeshift", "forcefield", "intellect", "elastic", "lightning"]);

test("every case is well formed", () => {
  const heroIds = new Set(seedHeroes().map((hero) => hero.id));
  const ids = new Set<string>();
  for (const arc of ARCS) {
    assert.ok(!ids.has(arc.id), `duplicate arc ${arc.id}`);
    ids.add(arc.id);
    assert.equal(arc.steps.length, 6, `${arc.id} should have 6 steps`);
    assert.equal(arc.steps[arc.steps.length - 1]!.kind, "boss", `${arc.id} ends on a boss`);
    for (const id of arc.heroIds) assert.ok(heroIds.has(id), `${arc.id} names unknown hero ${id}`);
    for (const step of arc.steps) {
      if (step.heroId) assert.ok(heroIds.has(step.heroId), `${arc.id}/${step.id} names unknown hero ${step.heroId}`);
      if (step.foePower) assert.ok(LEGACY_POWERS.has(step.foePower), `${arc.id}/${step.id} foe power ${step.foePower}`);
      if (step.foeLevel !== undefined) assert.ok(step.foeLevel > 0 && step.foeLevel <= 12, `${arc.id}/${step.id} foe level`);
    }
  }
});

test("city dossiers only point at real cases", () => {
  const ids = new Set(ARCS.map((arc) => arc.id));
  for (const city of DOSSIERS) for (const id of city.arcs) assert.ok(ids.has(id), `${city.id} -> ${id}`);
});

test("mid-life cases wait for age and experience", () => {
  const base = { age: 30, stats: { karma: 0 } as never, cityId: "nyc", story: { active: null, cleared: [], progress: 0 } as never };
  const fresh = availableArcs(base).map((arc) => arc.id);
  assert.ok(!fresh.includes("heir"), "heir needs age 54");
  assert.ok(!fresh.includes("understudy"), "understudy needs a closed case");
  const late = availableArcs({ ...base, age: 56, story: { active: null, cleared: ["kiln", "mile"], progress: 0 } as never }).map((arc) => arc.id);
  assert.ok(late.includes("heir"));
});

test("bond growth slows near the top and never overshoots", () => {
  assert.ok(bondYearRoom(10) > bondYearRoom(90));
  assert.ok(bondYearRoom(99) >= 1);
  for (let rel = 0; rel <= 100; rel += 5) {
    for (const r of [0, 0.5, 0.99]) {
      const step = bondStep(rel, 10, 0, r);
      assert.ok(step >= 0 && rel + step <= 100, `rel ${rel} step ${step}`);
      assert.ok(step <= bondYearRoom(rel));
    }
  }
  assert.equal(bondStep(50, 10, bondYearRoom(50), 0.5), 0, "yearly room spent");
});

test("prompt variants never repeat back to back", () => {
  for (const [key, pool] of Object.entries(PROMPT_POOLS)) {
    for (const [band, lines] of Object.entries(pool)) assert.ok(lines.length >= 2, `${key}/${band}`);
  }
  for (const age of [8, 25, 45, 65]) {
    let last: number | undefined;
    for (let i = 0; i < 50; i += 1) {
      const pick = pickPrompt("gym", age, (i * 0.37) % 1, last, { city: "Neon Spire" });
      assert.notEqual(pick.index, last);
      assert.ok(!/\{\w+\}/.test(pick.text));
      last = pick.index;
    }
  }
  assert.equal(promptBand(45), "crisis");
});
