// 2026-11-02 Arena: saved lives can be drafted as themselves, re-priced to Arena numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, ageUp, choose, createGame, dismissReveal, resolveMini } from "../engine.ts";
import { fighterFromLife } from "../arena.lives.ts";
import { fighterOf, registerFighter, simBout } from "../arena.ts";
import { ARENA_ROSTER } from "../arena.roster.ts";
import type { Game } from "../types.ts";

const base = { name: "Ivy Arden", cityId: "nyc", upbringing: "supportive", portrait: 3, sex: "female", face: "secret", drive: "protector" } as const;

function live(g: Game, maxAge: number): Game {
  for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (g.reveal) g = dismissReveal(g);
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.8);
    else {
      for (let k = 0; k < 2 && g.phase === "live"; k++) g = act(g, "train");
      if (g.phase === "live") g = ageUp(g);
    }
  }
  if (g.reveal) g = dismissReveal(g);
  return g;
}

test("kids and powerless lives can't enter the Arena", () => {
  const kid = createGame({ ...base, seed: 11 });
  assert.equal(fighterFromLife(1, kid), null);
});

test("a grown hero enters with six re-priced moves that cover every style", () => {
  const g = live(createGame({ ...base, seed: 12 }), 24);
  assert.ok(g.powerId, "power manifested by 24");
  const f = fighterFromLife(2, g);
  assert.ok(f);
  assert.equal(f.id, "life-2");
  assert.equal(f.moves.length, 6);
  assert.equal(new Set(f.moves.map((m) => m.id)).size, 6, "move ids unique");
  for (const m of f.moves) {
    assert.ok(m.power >= 5 && m.power <= 9, `${m.name} power ${m.power} on the Arena band`);
    assert.ok((m.energy ?? 0) >= 1);
  }
  for (const s of ["strike", "trick", "guard"]) assert.ok(f.moves.some((m) => m.style === s), `has a ${s}`);
  // A veteran's numbers don't outgrow the roster.
  const vet = fighterFromLife(3, live(g, 60));
  assert.ok(vet && Math.max(...vet.moves.map((m) => m.power)) <= 9);
  registerFighter(f);
  assert.equal(fighterOf("life-2").name, "Ivy Arden");
  let wins = 0;
  for (const [i, foe] of ARENA_ROSTER.entries()) if (simBout("life-2", foe.id, 900 + i, "pro", (i % 2) as 0 | 1).winner === 0) wins++;
  const rate = wins / ARENA_ROSTER.length;
  assert.ok(rate > 0.15 && rate < 0.85, `own hero win rate ${rate.toFixed(2)} stays playable`);
});
