// Stage 3: Ultimates, environment tags, Cheetah Expose (2026-11-07 night).
import { test } from "node:test";
import assert from "node:assert/strict";
import { canUltimate, markUltimate, stageBonus, stageForCity, statusOfMove, ULTIMATE_COST, ULTIMATE_MULT } from "../battle.ts";
import { playTurn, startDuel, BREATH } from "../duel.ts";
import { presetVillain } from "../presets.ts";
import type { DuelBoard, DuelMove } from "../types.ts";

const kit: DuelMove[] = [
  { id: "a", name: "A", blurb: "", power: 6, style: "strike", element: "force", energy: 1 },
  { id: "b", name: "B", blurb: "", power: 8, style: "guard", element: "shield", energy: 1 },
  { id: "fire-control::b", name: "Cinder Breath", blurb: "", power: 10, style: "trick", element: "fire", energy: 2 },
  { id: "d", name: "D", blurb: "", power: 5, style: "trick", element: "speed", energy: 1 },
  { id: "e", name: "E", blurb: "", power: 5, style: "strike", element: "force", energy: 1 },
  { id: "f", name: "F", blurb: "", power: 4, style: "guard", element: "shield", energy: 1 },
];

test("Cheetah Pounce applies Expose", () => {
  const v = presetVillain("wonder-woman", "cheetah");
  assert.ok(v);
  const pounce = v!.moves.find((m) => m.name === "Pounce");
  assert.ok(pounce);
  assert.equal(pounce!.applies, "expose");
  assert.equal(statusOfMove(pounce!), "expose");
});

test("markUltimate tags the focus power's strongest move at mastery 4+", () => {
  const marked = markUltimate(kit, { focusPowerId: "fire-control", masteryRank: 4, focusMoveIds: ["fire-control::b"] });
  const ult = marked.find((m) => m.ultimate);
  assert.ok(ult);
  assert.equal(ult!.id, "fire-control::b");
  assert.ok((ult!.energy ?? 0) >= 3);
  assert.equal(marked.filter((m) => m.ultimate).length, 1);
  assert.equal(markUltimate(kit, { focusPowerId: "fire-control", masteryRank: 3, focusMoveIds: ["fire-control::b"] }).some((m) => m.ultimate), false);
});

test("city stages nudge one element", () => {
  const harbor = stageForCity("harbor");
  assert.equal(harbor.element, "ice");
  const move: DuelMove = { name: "Frost", blurb: "", power: 5, style: "strike", element: "ice", energy: 1 };
  assert.equal(stageBonus(harbor, move, true), 1.1);
  assert.equal(stageBonus(harbor, move, false), 1);
  assert.equal(stageBonus(harbor, { ...move, element: "fire" }, true), 1);
});

test("Ultimate spends full Momentum for ×2 on a won edge", () => {
  const ult: DuelMove = { id: "ult", name: "Nova", blurb: "", power: 8, style: "strike", element: "fire", energy: 3, ultimate: true };
  const board: DuelBoard = {
    foeName: "Dummy",
    foeTitle: "Test",
    foeSide: "villain",
    playerHp: 80,
    foeHp: 80,
    playerMoves: [ult, ...kit.slice(1)],
    foeMoves: [{ name: "Jab", blurb: "", power: 4, style: "trick", element: "force", energy: 1 }],
    stage: stageForCity("dust"),
  };
  let s = startDuel(board, () => 0.1);
  s = { ...s, momentum: ULTIMATE_COST, intent: board.foeMoves[0]!, shown: "trick" };
  assert.ok(canUltimate(s.momentum, ult));
  const turn = playTurn(board, s, ult, () => 0.2);
  assert.ok(turn.ultimate);
  assert.ok(!turn.burst);
  assert.equal(turn.state.momentum, 1); // spent 5, then +1 for the won edge
  // Base strike vs trick wins; ×2 ultimate; dust stage is fire so +10% more.
  assert.ok(turn.dealt >= Math.round(8 * ULTIMATE_MULT * 0.9), `dealt ${turn.dealt}`);
  assert.ok(turn.notes.some((n) => /Ultimate/i.test(n)));
});

test("Ultimate does not fire without a won edge (Momentum stays banked)", () => {
  const ult: DuelMove = { id: "ult", name: "Nova", blurb: "", power: 8, style: "strike", element: "fire", energy: 3, ultimate: true };
  const board: DuelBoard = {
    foeName: "Dummy",
    foeTitle: "Test",
    foeSide: "villain",
    playerHp: 80,
    foeHp: 80,
    playerMoves: [ult],
    foeMoves: [{ name: "Block", blurb: "", power: 4, style: "guard", element: "shield", energy: 1 }],
  };
  let s = startDuel(board, () => 0.1);
  s = { ...s, momentum: ULTIMATE_COST, intent: board.foeMoves[0]!, shown: "guard" };
  const turn = playTurn(board, s, ult, () => 0.2);
  assert.ok(!turn.ultimate);
  assert.equal(turn.state.momentum, ULTIMATE_COST);
});
