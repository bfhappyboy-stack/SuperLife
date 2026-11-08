// Battle Stage 4 (2026-11-08 am): charge cadence, Tempo interrupt, Phase 3 on final canon bosses, regroup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canInterrupt, INTERRUPT_COST, INTERRUPT_MIN } from "../battle.ts";
import { activeGimmick, BREATH, CHARGE_EVERY, gimmickStatus, interruptReady, PHASE3_AT, playTurn, startDuel, type Rand } from "../duel.ts";
import { hashSeed, isCharged, movesOf, playArenaTurn, startBout } from "../arena.ts";
import { finalCanonBoss, PRESETS, VILLAIN_GIMMICKS, VILLAIN_PHASE3, villainPhase3 } from "../presets.ts";
import { act, actionsFor, ageUp, createGame, monthIndex, regroupFor, resolveMini } from "../engine.ts";
import type { Game } from "../types.ts";
import { ARCS } from "../arcs.ts";
import type { BossGimmick, DuelBoard, DuelMove } from "../types.ts";

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

// ─── Phase 3 on final canon bosses ─────────────────────────────────────────────────

test("every legend's final canon boss has a Phase 3, nobody else does, and it differs from Phase 2", () => {
  const finals = new Set<string>();
  for (const preset of PRESETS) {
    const final = finalCanonBoss(preset.id);
    assert.ok(final, `${preset.id} has a final fight beat`);
    finals.add(final!.villainId);
    const p3 = VILLAIN_PHASE3[final!.villainId];
    assert.ok(p3, `${preset.id}: ${final!.villainId} needs a Phase 3`);
    assert.notEqual(p3!.kind, VILLAIN_GIMMICKS[final!.villainId]?.kind, `${final!.villainId} Phase 3 should be a new twist`);
    assert.ok(p3!.name && p3!.line && p3!.hint);
  }
  assert.deepEqual(Object.keys(VILLAIN_PHASE3).sort(), [...finals].sort());
});

test("villainPhase3: only in that legend's life, only from the final beat's age, only for that rogue", () => {
  const iron = finalCanonBoss("iron-man")!;
  assert.equal(iron.villainId, "ultron");
  assert.equal(villainPhase3("iron-man", "Ultron", iron.age)?.name, VILLAIN_PHASE3.ultron!.name);
  assert.equal(villainPhase3("iron-man", "Ultron", iron.age - 1), null);
  assert.equal(villainPhase3("iron-man", "Whiplash", 80), null);
  assert.equal(villainPhase3("thor", "Ultron", 80), null);
  assert.equal(villainPhase3(null, "Ultron", 80), null);
});

const p3Board = (gimmick: BossGimmick = { ...VILLAIN_GIMMICKS.zod!, at: 1 }, phase3 = VILLAIN_PHASE3.zod!): DuelBoard => ({ ...chargeBoard({ foeName: "Zod", gimmick, phase3 }), foeHp: 200 });

test("Phase 3 takes over at 25% HP: the second gimmick replaces the first, with its own HUD line", () => {
  const board = p3Board();
  let s = startDuel(board, fixed());
  assert.equal(s.phase, 2);
  assert.equal(activeGimmick(board, s)?.kind, "charge");
  // Knock it to just above 25%, then one more hit crosses the line.
  s = { ...s, foeHp: Math.round(200 * PHASE3_AT) + 3, energy: 10 };
  let shift: string | null = null;
  for (let i = 0; i < 4 && s.phase !== 3; i++) {
    const t = playTurn(board, { ...s, intent: { ...FOE[1]!, power: 1 }, shown: "trick", energy: 10 }, KIT[0]!, fixed());
    shift = t.shift;
    s = t.state;
  }
  assert.equal(s.phase, 3);
  assert.equal(shift, "phase3");
  assert.equal(activeGimmick(board, s)?.name, "Yellow Sun");
  assert.equal(s.charge, 0);
  assert.match(gimmickStatus(board, s) ?? "", /Heals each turn/);
  // Regen is live now: a non-trick swing lets it heal.
  const t = playTurn(board, { ...s, intent: { ...FOE[2]!, power: 1 }, shown: "guard", energy: 10 }, KIT[2]!, fixed());
  assert.ok(t.healed > 0);
});

test("revive boss (Ultron): Phase 2 is the comeback, Phase 3 starts after it, and the revive never repeats", () => {
  const board = p3Board(VILLAIN_GIMMICKS.ultron!, VILLAIN_PHASE3.ultron!);
  let s = { ...startDuel(board, fixed()), foeHp: 2, energy: 10 };
  const ko = playTurn(board, { ...s, intent: { ...FOE[1]!, power: 1 }, shown: "trick" }, KIT[0]!, fixed());
  assert.equal(ko.shift, "revive");
  assert.equal(ko.state.phase, 2);
  s = { ...ko.state, foeHp: Math.round(200 * PHASE3_AT) - 1, energy: 10 };
  const p3 = playTurn(board, { ...s, intent: { ...FOE[1]!, power: 1 }, shown: "trick" }, KIT[4]!, fixed());
  assert.equal(p3.state.phase, 3);
  assert.equal(activeGimmick(board, p3.state)?.kind, "adapt");
  const end = playTurn(board, { ...p3.state, foeHp: 1, intent: { ...FOE[1]!, power: 1 }, shown: "trick", energy: 10 }, KIT[0]!, fixed());
  assert.equal(end.state.done, true);
  assert.equal(end.state.foeHp, 0);
});

test("boards without phase3 never leave phase 2", () => {
  const board = chargeBoard({ foeHp: 200 });
  let s = { ...startDuel(board, fixed()), foeHp: 20, energy: 10 };
  s = playTurn(board, { ...s, intent: { ...FOE[1]!, power: 1 }, shown: "trick" }, KIT[0]!, fixed()).state;
  assert.equal(s.phase, 2);
});

// ─── Regroup after a boss loss ─────────────────────────────────────────────────────

function lifeAt(age: number): Game {
  const g = createGame({ name: "Jo Reyes", cityId: "nyc", upbringing: "foster", portrait: 6, sex: "female", face: "secret", drive: "protector", mode: "mystery", seed: 3 });
  return { ...g, age, month: 4, phase: "live", pending: null, reveal: null, majorsLeft: 3, story: { active: "kiln", cleared: [], progress: { kiln: 99 } } } as Game;
}
function bossFight(g: Game, foeName: string): Game {
  const board = { ...chargeBoard({ foeName }), playerHp: 60, foeHp: 60 };
  return { ...g, phase: "mini", minigame: { kind: "duel", title: foeName, subtitle: "", difficulty: 2, tag: "duel", winText: "won", partialText: "split", loseText: "lost", winEffects: {}, partialEffects: {}, loseEffects: {}, duel: board } } as Game;
}

test("losing a boss fight puts that boss on a one-month regroup; winning or a new month clears it", () => {
  const g = lifeAt(30);
  const lost = resolveMini(bossFight(g, "Cinder Mallory"), 0);
  assert.deepEqual(lost.regroup, { name: "Cinder Mallory", until: monthIndex(g) + 1 });
  assert.equal(regroupFor(lost, "Cinder Mallory"), true);
  assert.equal(regroupFor(lost, "Slipstream"), false);
  assert.match(lost.card.body ?? "", /month to regroup/);
  const later = ageUp(lost);
  assert.equal(regroupFor(later, "Cinder Mallory"), false);
  // A split is not a loss.
  assert.equal(resolveMini(bossFight(g, "Cinder Mallory"), 0.5).regroup ?? null, null);
  // A street (non-boss) loss doesn't lock anything.
  const street = bossFight(g, "Cinder Mallory");
  street.minigame!.duel!.boss = undefined;
  assert.equal(resolveMini(street, 0).regroup ?? null, null);
});

test("the case boss step is locked while regrouping, with a clear line, and old saves load without it", () => {
  const g = lifeAt(30);
  const step = (x: Game) => actionsFor(x).find((a) => a.id === "arc-step");
  const bossAt = ARCS.find((a) => a.id === "kiln")!.steps.findIndex((x) => x.kind === "boss");
  const kiln: Game = { ...g, story: { active: "kiln", cleared: [], progress: { kiln: bossAt } } };
  assert.equal(step(kiln)?.label, "Face Cinder Mallory");
  assert.ok(!step(kiln)?.disabled);
  const locked: Game = { ...kiln, regroup: { name: "Cinder Mallory", until: monthIndex(kiln) + 1 } };
  assert.match(String(step(locked)?.disabled ?? ""), /Regrouping after the loss\. Cinder Mallory again next month/);
  assert.equal(act(locked, "arc-step"), locked);
  const nextMonth: Game = { ...locked, month: locked.month + 1 };
  assert.ok(!step(nextMonth)?.disabled);
  const old = { ...kiln } as Partial<Game>;
  delete old.regroup;
  assert.equal(regroupFor(old as Game, "Cinder Mallory"), false);
});

test("save round-trip keeps a regroup; a malformed one from an old build is dropped", async () => {
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
  const g = { ...lifeAt(30), regroup: { name: "Cinder Mallory", until: 365 } };
  saveSlot(1, g);
  assert.deepEqual(loadSlot(1)?.regroup, { name: "Cinder Mallory", until: 365 });
  saveSlot(2, { ...g, regroup: { name: 7, until: "soon" } as unknown as Game["regroup"] });
  assert.equal(loadSlot(2)?.regroup, null);
  const old = { ...g } as Partial<Game>;
  delete old.regroup;
  saveSlot(3, old as Game);
  assert.equal(loadSlot(3)?.regroup, undefined);
});
