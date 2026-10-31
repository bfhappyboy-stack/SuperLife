// The First Move mini after the reveal: a one-time drill bonus that scales with the score.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageUp, choose, createGame, dismissReveal, resolveMini } from "../engine.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;

function toReveal(seed: number): Game {
  let g = createGame({ ...base, mode: "mystery", seed } as never);
  for (let i = 0; i < 3000 && !g.reveal && g.phase !== "dead"; i++) {
    g = g.phase === "choice" && g.pending ? choose(g, g.pending.choices[0]!.id) : g.phase === "mini" ? resolveMini(g, 0.7) : ageUp(g);
  }
  assert.ok(g.reveal, "reached a reveal");
  return g;
}

test("first move: a better score drills the new power harder, once", () => {
  const g = toReveal(11);
  const head = g.reveal!.powers[0]!;
  const before = g.mastery?.[head] ?? 0;
  const low = dismissReveal(g, 0);
  const high = dismissReveal(g, 1);
  assert.equal(low.reveal, null);
  assert.equal(high.reveal, null);
  assert.ok((high.mastery?.[head] ?? 0) > (low.mastery?.[head] ?? 0));
  assert.ok((low.mastery?.[head] ?? 0) > before);
  assert.equal(high.flags.firstMove, 100);
  assert.match(high.card.banner.join(" "), /first move/i);
  // Skipping (no score) changes nothing but the overlay.
  const skip = dismissReveal(g);
  assert.equal(skip.mastery?.[head] ?? 0, before);
  assert.equal(skip.flags.firstMove, undefined);
  // A stray click event never counts as a score.
  assert.equal(dismissReveal(g, Number.NaN).flags.firstMove, undefined);
});
