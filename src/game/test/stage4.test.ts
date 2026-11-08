// Battle Stage 4 (2026-11-08 am): charge cadence, Tempo interrupt, Phase 3 on final canon bosses, regroup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BREATH, CHARGE_EVERY, playTurn, startDuel, type Rand } from "../duel.ts";
import { VILLAIN_GIMMICKS } from "../presets.ts";
import type { DuelBoard, DuelMove } from "../types.ts";

const fixed = (v = 0.3): Rand => () => v;
const mv = (id: string, style: DuelMove["style"], power: number, kind?: DuelMove["kind"]): DuelMove => ({ id, name: id, blurb: "", power, style, kind, energy: 1 });
const KIT = [mv("punch", "strike", 9), mv("hook", "strike", 8), mv("dome", "guard", 8, "guard"), mv("wall", "guard", 7, "guard"), mv("feint", "trick", 8), mv("slip", "trick", 7)];
const FOE = [mv("f-strike", "strike", 8), mv("f-trick", "trick", 8), mv("f-guard", "guard", 7, "guard")];
const chargeBoard = (extra: Partial<DuelBoard> = {}): DuelBoard => ({ foeName: "Bane", foeTitle: "", foeSide: "villain", playerHp: 999, foeHp: 999, playerMoves: KIT, foeMoves: FOE, boss: true, gimmick: { ...VILLAIN_GIMMICKS.bane!, at: 1 }, ...extra });

test("charge bosses throw the charged hit every third turn, not every turn once it starts", () => {
  const board = chargeBoard();
  let s = startDuel(board, fixed());
  const seq: string[] = [];
  for (let i = 0; i < 9; i++) {
    seq.push(s.intent.id === "charge" ? "C" : "-");
    s = playTurn(board, s, BREATH, fixed()).state;
  }
  assert.equal(CHARGE_EVERY, 3);
  assert.equal(seq.join(""), "-C--C--C-");
});
