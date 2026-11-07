// Battle Stage 2 (2026-11-07 pm): statuses, mix-up combos, habit reading — shared rules + life-sim duel.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addStatus,
  advanceCombo,
  baitFor,
  burnChip,
  cleanseOne,
  COMBO_LEN,
  ELEMENT_STATUS,
  habitOf,
  inMult,
  outMult,
  STATUS_CAP,
  statusOfMove,
  tickStatuses,
} from "../battle.ts";
import { beats, BREATH, playTurn, startDuel, type DuelState, type Rand } from "../duel.ts";
import { DIFFICULTY, DUEL_HP_SCALE, LIFE_DIFFICULTIES } from "../difficulty.ts";
import type { DuelBoard, DuelMove } from "../types.ts";

function seeded(seed: number): Rand {
  let r = (seed * 2654435761) % 4294967296;
  return () => (r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const mv = (id: string, style: DuelMove["style"], power: number, element?: string, kind?: DuelMove["kind"]): DuelMove => ({ id, name: id, blurb: "", power, style, kind, energy: 1, element });
const KIT = [mv("flame", "strike", 9, "fire"), mv("frostbite", "trick", 9, "ice"), mv("dome", "guard", 9, "shield", "guard"), mv("jolt", "trick", 8, "lightning"), mv("punch", "strike", 9, "force"), mv("mindspike", "trick", 8, "psychic")];
const FOE = [mv("f-strike", "strike", 8, "force"), mv("f-trick", "trick", 8, "force"), mv("f-guard", "guard", 7, "force", "guard")];
const board = (extra: Partial<DuelBoard> = {}): DuelBoard => ({ foeName: "Foe", foeTitle: "", foeSide: "villain", playerHp: 80, foeHp: 80, playerMoves: KIT, foeMoves: FOE, ...extra });
const pin = (s: DuelState, intent: DuelMove): DuelState => ({ ...s, intent, shown: intent.style, energy: 10 });

test("element table maps to statuses; breath and pure-damage moves leave nothing; `applies` overrides", () => {
  assert.equal(statusOfMove(KIT[0]), "burn");
  assert.equal(statusOfMove(KIT[1]), "frost");
  assert.equal(statusOfMove(KIT[2]), "ward");
  assert.equal(statusOfMove(KIT[3]), "shock");
  assert.equal(statusOfMove(KIT[4]), null);
  assert.equal(statusOfMove(BREATH), null);
  assert.equal(statusOfMove({ ...KIT[4]!, applies: "expose" }), "expose");
  assert.equal(statusOfMove({ ...KIT[0]!, applies: null }), null);
  assert.equal(ELEMENT_STATUS.speed, undefined);
});

test("status list: cap of 2 pushes out the oldest, refresh keeps the slot, tick expires, Ward clears Burn, breath cleanses harm", () => {
  let list = addStatus([], "burn");
  list = addStatus(list, "frost");
  list = addStatus(list, "expose");
  assert.equal(list.length, STATUS_CAP);
  assert.deepEqual(list.map((s) => s.id), ["frost", "expose"]);
  list = tickStatuses(list);
  assert.deepEqual(list.map((s) => s.turns), [1, 1]);
  list = addStatus(list, "frost");
  assert.deepEqual(list.map((s) => [s.id, s.turns]), [["frost", 2], ["expose", 1]]);
  assert.equal(tickStatuses(tickStatuses(list)).length, 0);
  assert.deepEqual(addStatus(addStatus([], "burn"), "ward").map((s) => s.id), ["ward"]);
  const clean = cleanseOne([{ id: "ward", turns: 2 }, { id: "shock", turns: 1 }]);
  assert.equal(clean.cleared, "shock");
  assert.deepEqual(clean.list.map((s) => s.id), ["ward"]);
  assert.equal(outMult([{ id: "frost", turns: 1 }]), 0.85);
  assert.ok(inMult([{ id: "expose", turns: 1 }]) > 1 && inMult([{ id: "ward", turns: 1 }]) < 1);
  assert.equal(burnChip([{ id: "burn", turns: 1 }], 100), 4);
});

test("combo: three won edges never the same style twice running fire a Finisher; even holds, lost drops", () => {
  let c = advanceCombo([], "strike", "won");
  assert.deepEqual(c.chain, ["strike"]);
  c = advanceCombo(c.chain, "guard", "even");
  assert.deepEqual(c.chain, ["strike"], "even trade holds");
  c = advanceCombo(c.chain, "strike", "won");
  assert.deepEqual(c.chain, ["strike"], "same style twice restarts");
  c = advanceCombo(c.chain, "trick", "won");
  c = advanceCombo(c.chain, "strike", "won");
  assert.ok(c.finisher && c.chain.length === 0, `finisher after ${COMBO_LEN}`);
  assert.deepEqual(advanceCombo(["strike", "trick"], "guard", "lost").chain, []);
  assert.deepEqual(advanceCombo(["strike"], null, "lost").chain, [], "breath drops the chain");
});

test("habit: same style twice is a habit, and the bait tell is the style that habit answers", () => {
  assert.equal(habitOf(["guard", "guard"]), "guard");
  assert.equal(habitOf(["guard", "strike"]), null);
  for (const h of ["strike", "trick", "guard"] as const) {
    // Answering the bait with the habit style would beat the bait.
    assert.ok(beats(h, baitFor(h)), `${h} answers ${baitFor(h)}`);
  }
});

test("duel: a winning fire move burns the foe, burn chips at the end of the turn, and Frost weakens their next hit", () => {
  const b = board();
  let s = pin(startDuel(b, seeded(1)), FOE[1]!); // foe trick, our strike wins
  const t1 = playTurn(b, s, KIT[0]!, seeded(2));
  assert.equal(t1.edge, "you");
  assert.deepEqual(t1.applied, [{ on: "foe", id: "burn" }]);
  assert.equal(t1.burn.foe, burnChip(t1.state.foeStatus, b.foeHp));
  assert.equal(t1.state.foeHp, b.foeHp - t1.dealt - t1.burn.foe);
  // Next turn the burn ticks again, then it's gone the turn after.
  s = pin(t1.state, FOE[2]!); // foe guard, our trick (ice) wins and frosts
  const t2 = playTurn(b, s, KIT[1]!, seeded(3));
  assert.ok(t2.burn.foe > 0, "burn ticks a second time");
  assert.ok(t2.state.foeStatus!.some((x) => x.id === "frost"));
  const t3 = playTurn(b, pin(t2.state, FOE[0]!), KIT[4]!, seeded(4));
  assert.equal(t3.burn.foe, 0, "burn has run out");
  // Same exchange without Frost on the foe hits harder.
  const plain = playTurn(b, pin({ ...t2.state, foeStatus: [] }, FOE[0]!), KIT[4]!, seeded(4));
  assert.ok(t3.taken < plain.taken, `frost ${t3.taken} < plain ${plain.taken}`);
});

test("duel: a winning shield guard Wards you (spent by the next hit); breath shakes off a harmful status", () => {
  const b = board();
  const s = pin(startDuel(b, seeded(5)), FOE[0]!); // foe strike, our guard wins
  const t = playTurn(b, s, KIT[2]!, seeded(6));
  assert.ok(t.state.playerStatus!.some((x) => x.id === "ward"));
  const warded = playTurn(b, pin(t.state, FOE[0]!), KIT[4]!, seeded(7));
  const bare = playTurn(b, pin({ ...t.state, playerStatus: [] }, FOE[0]!), KIT[4]!, seeded(7));
  assert.ok(warded.taken < bare.taken, `ward ${warded.taken} < bare ${bare.taken}`);
  assert.ok(!warded.state.playerStatus!.some((x) => x.id === "ward"), "ward is spent");
  const burning = { ...pin(t.state, FOE[1]!), playerStatus: [{ id: "burn" as const, turns: 2 }] };
  const br = playTurn(b, burning, BREATH, seeded(8));
  assert.equal(br.cleansed, "burn");
  assert.equal(br.burn.you, 0);
});

test("duel: a shocked foe can't fake its tell; a habit gets baited only when aiRead > 0", () => {
  const b = board({ aiRead: 1 });
  // Habit: two guards running.
  let s: DuelState = { ...pin(startDuel(b, seeded(9)), FOE[0]!), habits: ["guard"] };
  const t = playTurn(b, s, KIT[2]!, seeded(10)); // second guard → habit
  assert.equal(t.state.faked, true);
  assert.equal(t.state.shown, "strike", "bait shows the style guard answers");
  assert.equal(t.state.intent.style, "trick", "but brings the answer to guard");
  const next = playTurn(b, t.state, KIT[2]!, seeded(11));
  assert.equal(next.read, true);
  assert.ok(next.notes.includes("They read your habit"));
  // Shocked foe: no bait.
  s = { ...pin(startDuel(b, seeded(9)), FOE[0]!), habits: ["guard"], foeStatus: [{ id: "shock", turns: 2 }] };
  assert.equal(playTurn(b, s, KIT[2]!, seeded(10)).state.faked, false);
  // Story (aiRead 0) never baits.
  const story = board({ aiRead: 0 });
  s = { ...pin(startDuel(story, seeded(9)), FOE[0]!), habits: ["guard"] };
  assert.equal(playTurn(story, s, KIT[2]!, seeded(10)).state.faked, false);
});

test("duel: a mix-up combo fires a Finisher (bonus damage + momentum) and stays deterministic", () => {
  const b = board();
  let s = pin(startDuel(b, seeded(12)), FOE[1]!);
  s = playTurn(b, s, KIT[4]!, seeded(13)).state; // strike beats trick
  s = playTurn(b, pin(s, FOE[2]!), KIT[3]!, seeded(14)).state; // trick beats guard
  const fin = playTurn(b, pin(s, FOE[0]!), KIT[2]!, seeded(15)); // guard beats strike
  assert.ok(fin.finisher > 0);
  assert.ok(fin.notes.includes("Combo finisher"));
  assert.ok((fin.momentumGain ?? 0) >= 2);
  const again = playTurn(b, pin(s, FOE[0]!), KIT[2]!, seeded(15));
  assert.deepEqual(again.state, fin.state, "same seed + log → same state");
});

test("difficulty: aiRead rises with difficulty and fights get more runway", () => {
  const reads = LIFE_DIFFICULTIES.map((id) => DIFFICULTY[id].aiRead);
  assert.equal(reads[0], 0);
  for (let i = 1; i < reads.length; i++) assert.ok(reads[i]! > reads[i - 1]!);
  assert.ok(DUEL_HP_SCALE > 1);
});

// ---- Arena shares the Stage 2 rules (2026-11-07 pm, increment 3) ----
import { playArenaTurn as aTurn, registerFighter, startBout as aStart, tellOf as aTell, type BoutState as ABout } from "../arena.ts";
import { keyOf as kOf } from "../duel.ts";
import type { DuelMove as DM } from "../types.ts";

const am = (name: string, style: DM["style"], element: string, power = 6): DM =>
  ({ name, style, kind: style === "guard" ? "guard" : "attack", power, energy: 1, element } as unknown as DM);
const kit: DM[] = [
  am("Heat", "strike", "fire"), am("Zap", "trick", "lightning"), am("Wall", "guard", "shield"),
  am("Punch", "strike", "force"), am("Feint", "trick", "speed"), am("Block", "guard", "force"),
];
for (const id of ["t-a", "t-b"])
  registerFighter({
    id, name: id, title: "test", side: "hero", world: "spider-man" as never, color: "#fff", sex: "male", hp: 120,
    passive: { kind: "prep", name: "Prep", text: "" }, moves: kit, tint: { suit: "#000", trim: "#fff" },
  });
const k = (n: string) => kOf(kit.find((m) => m.name === n)!);

test("Arena: a winning Fire hit Burns, Momentum builds, Burst fires on the next winning hit", () => {
  let b: ABout = aStart("t-a", "t-b", 7, 0);
  b = aTurn(b, [{ move: k("Heat") }, { move: k("Feint") }]); // strike beats trick
  const l1 = b.log.at(-1)!;
  assert.equal(l1.edge, 0);
  assert.ok(l1.applied?.some((a) => a.on === 1 && a.id === "burn"));
  assert.ok((b.fighters[0].momentum ?? 0) >= 1);
  b = { ...b, fighters: [{ ...b.fighters[0], momentum: 3, energy: 10 }, b.fighters[1]] };
  b = aTurn(b, [{ move: k("Punch") }, { move: k("Feint") }]);
  assert.equal(b.log.at(-1)!.burst?.[0], true);
  assert.ok((b.fighters[0].momentum ?? 0) < 3);
});

test("Arena: a Shocked leader can't fake its tell, and Burn never knocks out", () => {
  let b: ABout = aStart("t-a", "t-b", 9, 0);
  b = { ...b, leader: 0, fighters: [{ ...b.fighters[0], status: [{ id: "shock", turns: 2 }] }, b.fighters[1]] };
  const t = aTell(b, { move: k("Heat"), feint: "guard" });
  assert.equal(t.style, "strike");
  assert.equal(t.feint, false);
  b = { ...b, fighters: [b.fighters[0], { ...b.fighters[1], hp: 2, status: [{ id: "burn", turns: 2 }] }] };
  b = aTurn(b, [{ move: k("Wall") }, { move: k("Block") }]);
  const l = b.log.at(-1)!;
  // Either the hit itself did the knockout (no Burn tick), or Burn left them at 1+.
  if (b.fighters[1].hp <= 0) assert.equal(l.burn?.[1] ?? 0, 0);
  else assert.ok(b.fighters[1].hp >= 1);
  let c: ABout = aStart("t-a", "t-b", 11, 0);
  c = { ...c, fighters: [c.fighters[0], { ...c.fighters[1], hp: 1, status: [{ id: "burn", turns: 2 }] }] };
  c = aTurn(c, [{ move: k("Block") }, { move: k("Wall") }]);
  assert.equal(c.log.at(-1)!.burn?.[1] ?? 0, 0, "Burn can't take the last HP");
});

test("Arena: same seed and actions replay to the same bout (online-safe)", () => {
  const run = () => {
    let b: ABout = aStart("t-a", "t-b", 42, 0);
    const seq = ["Heat", "Zap", "Wall", "Punch", "Feint", "Block", "Heat", "Zap"];
    for (let i = 0; i < seq.length && !b.done; i++) b = aTurn(b, [{ move: k(seq[i]) }, { move: k(seq[(i + 3) % 8]) }]);
    return JSON.stringify(b);
  };
  assert.equal(run(), run());
});
