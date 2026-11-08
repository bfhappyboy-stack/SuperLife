// Battle Stage 4 (2026-11-08 am): charge cadence, Tempo interrupt, Phase 3 on final canon bosses, regroup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canInterrupt, INTERRUPT_COST, INTERRUPT_MIN } from "../battle.ts";
import { BREATH, CHARGE_EVERY, gimmickStatus, interruptReady, playTurn, startDuel, type Rand } from "../duel.ts";
import { hashSeed, isCharged, movesOf, playArenaTurn, startBout } from "../arena.ts";
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

// ─── Tempo interrupt ────────────────────────────────────────────────────────────────

/** Step a duel until the foe's charged hit is the next intent. */
function toCharge(board: DuelBoard, momentum: number) {
  let s = startDuel(board, fixed());
  for (let i = 0; i < 6 && s.intent.id !== "charge"; i++) s = playTurn(board, s, BREATH, fixed()).state;
  assert.equal(s.intent.id, "charge");
  return { ...s, momentum, energy: 10 };
}

test("interrupt helper: needs a charged hit, a Strike and Momentum 4+", () => {
  const strike = KIT[0]!;
  assert.equal(INTERRUPT_MIN, 4);
  assert.equal(INTERRUPT_COST, 1);
  assert.equal(canInterrupt(4, true, strike), true);
  assert.equal(canInterrupt(3, true, strike), false);
  assert.equal(canInterrupt(5, false, strike), false);
  assert.equal(canInterrupt(5, true, KIT[2]), false);
  assert.equal(canInterrupt(5, true, BREATH), false);
});

test("a Strike at Momentum 4 cuts off the charged hit: no damage back, won edge, Burst on the rest", () => {
  const board = chargeBoard();
  const s = toCharge(board, 4);
  assert.equal(interruptReady(board, s), true);
  assert.match(gimmickStatus(board, s) ?? "", /interrupt/i);
  const t = playTurn(board, s, KIT[0]!, fixed());
  assert.equal(t.interrupted, true);
  assert.equal(t.edge, "you");
  assert.equal(t.taken, 0);
  // 4 − 1 (interrupt) = 3 banked → Burst fires (−3), then +1 for the won edge.
  assert.equal(t.burst, true);
  assert.equal(t.state.momentum, 1);
  assert.ok(t.notes.some((n) => /Interrupt/.test(n)));
  // Same fight with Momentum 3: no interrupt, the Strike trades into the charge and eats it.
  const low = playTurn(board, { ...s, momentum: 3 }, KIT[0]!, fixed());
  assert.equal(low.interrupted, undefined);
  assert.equal(low.edge, "even");
  assert.ok(low.taken > 0);
  // Guard still braces at any Momentum and is never an interrupt.
  const brace = playTurn(board, s, KIT[2]!, fixed());
  assert.equal(brace.interrupted, undefined);
  assert.ok(brace.notes.some((n) => /Braced/.test(n)));
});

test("interrupt is deterministic and the wind-up restarts after it", () => {
  const board = chargeBoard();
  const s = toCharge(board, 5);
  const a = playTurn(board, s, KIT[0]!, fixed(0.42));
  const b = playTurn(board, s, KIT[0]!, fixed(0.42));
  assert.deepEqual(a.state, b.state);
  assert.equal(a.dealt, b.dealt);
  assert.equal(a.state.charge, 2);
  assert.notEqual(a.state.intent.id, "charge");
});

test("Arena: a follower at Momentum 4+ interrupts Bane's charged strike with a strike", () => {
  let bout = startBout("bane", "captain-america", hashSeed("t", "int"), 0);
  // Bane leads; give him two leads so his third lead is charged.
  bout = { ...bout, leader: 0, fighters: [{ ...bout.fighters[0], leads: 2 }, { ...bout.fighters[1], momentum: 4 }] };
  assert.equal(isCharged(bout, 0), true);
  const baneStrike = movesOf("bane").find((m) => m.style === "strike")!;
  const capStrike = movesOf("captain-america").find((m) => m.style === "strike")!;
  const next = playArenaTurn(bout, [{ move: baneStrike.id! }, { move: capStrike.id! }]);
  const log = next.log.at(-1)!;
  assert.equal(log.interrupt, 1);
  assert.equal(log.edge, 1);
  assert.equal(log.dealt[0], 0);
  assert.ok(log.dealt[1] > 0);
  // Replays the same from the same state + actions (online stays a pure engine).
  assert.deepEqual(playArenaTurn(bout, [{ move: baneStrike.id! }, { move: capStrike.id! }]), next);
  // Without the Momentum it is a plain charged trade.
  const plain = playArenaTurn({ ...bout, fighters: [bout.fighters[0], { ...bout.fighters[1], momentum: 3 }] }, [{ move: baneStrike.id! }, { move: capStrike.id! }]);
  assert.equal(plain.log.at(-1)!.interrupt ?? null, null);
  assert.ok(plain.log.at(-1)!.dealt[0] > 0);
});
