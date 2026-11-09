// Life difficulty + Momentum (2026-11-07 battle Stage 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  asDifficulty,
  BURST_COST,
  BURST_MULT,
  DEFAULT_DIFFICULTY,
  DIFFICULTY,
  LIFE_DIFFICULTIES,
  MOMENTUM_CAP,
  tuneOf,
} from "../difficulty.ts";
import { answerOf, BREATH, canBurst, duelRatio, playTurn, refusal, startDuel, type DuelState, type Rand } from "../duel.ts";
import { createGame, freshen } from "../engine.ts";
import type { DuelBoard, DuelMove, LifeDifficulty } from "../types.ts";

function seeded(seed: number): Rand {
  let r = (seed * 2654435761) % 4294967296;
  return () => (r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const mv = (id: string, style: DuelMove["style"], power: number, kind?: DuelMove["kind"], energy = 1): DuelMove => ({
  id,
  name: id,
  blurb: "",
  power,
  style,
  kind,
  energy,
});
const KIT: DuelMove[] = [
  mv("jab", "strike", 9),
  mv("slip", "trick", 9),
  mv("block", "guard", 9, "guard"),
  mv("quake", "strike", 10, "area", 2),
  mv("hex", "trick", 8, "status"),
  mv("wall", "guard", 8, "guard"),
];
const FOE: DuelMove[] = [mv("f-strike", "strike", 8), mv("f-trick", "trick", 8), mv("f-guard", "guard", 7, "guard"), mv("f-big", "strike", 9)];

function board(extra: Partial<DuelBoard> = {}): DuelBoard {
  return {
    foeName: "Test Foe",
    foeTitle: "",
    foeSide: "villain",
    playerHp: 60,
    foeHp: 60,
    playerMoves: KIT,
    foeMoves: FOE,
    ...extra,
  };
}

function smart(b: DuelBoard, s: DuelState): DuelMove {
  const ok = b.playerMoves.filter((m) => !refusal(s, m));
  if (!ok.length) return BREATH;
  if (s.shown === "hidden") return [...ok].sort((a, c) => c.power - a.power)[0]!;
  const want = answerOf(s.shown);
  const c = ok.filter((m) => m.style === want);
  if (c.length) return c[0]!;
  return want === "guard" ? BREATH : ok[0]!;
}

test("difficulty catalog has four tunes and Normal is harder than the old 1.0 / 0.42 baseline", () => {
  assert.deepEqual([...LIFE_DIFFICULTIES], ["story", "normal", "hard", "legendary"]);
  assert.equal(DEFAULT_DIFFICULTY, "normal");
  assert.ok(DIFFICULTY.normal.foeHp > 1);
  assert.ok(DIFFICULTY.normal.foeDamage > 1);
  assert.ok(DIFFICULTY.normal.aiHate > 0.42);
  assert.ok(DIFFICULTY.story.foeHp < DIFFICULTY.normal.foeHp);
  assert.ok(DIFFICULTY.legendary.foeHp > DIFFICULTY.hard.foeHp);
  assert.equal(asDifficulty("nope"), "normal");
  assert.equal(asDifficulty("hard"), "hard");
});

test("new lives persist the chosen difficulty; old saves freshen to Normal", () => {
  const g = createGame({
    name: "Nyx Vale",
    cityId: "neon",
    upbringing: "alien",
    portrait: 3,
    sex: "female",
    face: "secret",
    drive: "idealistic",
    mode: "mystery",
    difficulty: "hard",
    seed: 7,
  });
  assert.equal(g.difficulty, "hard");
  assert.equal(tuneOf(g).id, "hard");
  const classic = createGame({
    name: "Old Save",
    cityId: "nyc",
    upbringing: "normal",
    portrait: 1,
    sex: "male",
    face: "secret",
    drive: "protector",
    seed: 2,
  });
  // createGame always writes a difficulty now; strip it to mimic a pre-field save.
  delete (classic as { difficulty?: string }).difficulty;
  assert.equal(freshen(classic).difficulty, "normal");
});

test("momentum builds on edge wins, guard-break adds extra, breath never builds, Burst spends 3 for more damage", () => {
  // Force a known tell: seed the board so intent is a Guard, then Trick it.
  const b = board();
  let s = startDuel(b, seeded(1));
  // Pin intent to guard so a trick wins + guard-breaks.
  s = { ...s, intent: FOE[2]!, shown: "guard", energy: 10, momentum: 0 };
  const trick = playTurn(b, s, KIT[1]!, seeded(2)); // slip = trick
  assert.equal(trick.edge, "you");
  assert.ok((trick.momentumGain ?? 0) >= 2, `guard break should gain ≥2, got ${trick.momentumGain}`);
  assert.ok(trick.notes.includes("Guard break"));
  assert.equal(trick.state.momentum, Math.min(MOMENTUM_CAP, trick.momentumGain ?? 0));

  const breath = playTurn(b, { ...trick.state, intent: FOE[0]!, shown: "strike" }, BREATH, seeded(3));
  assert.equal(breath.state.momentum, trick.state.momentum, "breath must not spend or build momentum");

  // Bank to Burst threshold without bursting mid-way by setting momentum.
  s = { ...breath.state, momentum: BURST_COST, intent: FOE[1]!, shown: "trick", energy: 10 }; // foe trick → strike answers
  const plainBoard = board();
  const plain = playTurn(plainBoard, { ...s, momentum: 0 }, KIT[0]!, seeded(4));
  const burst = playTurn(plainBoard, s, KIT[0]!, seeded(4));
  assert.ok(burst.burst, "should spend a Burst");
  assert.ok(burst.notes.includes("Burst"));
  assert.equal(burst.state.momentum, Math.max(0, BURST_COST - BURST_COST + (burst.momentumGain ?? 0)));
  // Same seed → Burst deals more than a plain jab.
  assert.ok(burst.dealt > plain.dealt, `burst ${burst.dealt} should beat plain ${plain.dealt} (×${BURST_MULT})`);
  assert.ok(canBurst({ ...s, momentum: BURST_COST }));
  assert.ok(!canBurst({ ...s, momentum: BURST_COST - 1 }));
});

test("foeDamage multiplier scales taken damage; aiHate is stored on the board", () => {
  const soft = board({ foeDamage: 0.5 });
  const hard = board({ foeDamage: 2 });
  let s = startDuel(soft, seeded(9));
  s = { ...s, intent: FOE[0]!, shown: "strike", energy: 10 };
  // Throw a losing trick into a strike so they hit hard.
  const a = playTurn(soft, s, KIT[1]!, seeded(10));
  const b = playTurn(hard, { ...s, intent: FOE[0]!, shown: "strike" }, KIT[1]!, seeded(10));
  assert.ok(b.taken > a.taken, `hard ${b.taken} > soft ${a.taken}`);
  assert.equal(board({ aiHate: 0.9 }).aiHate, 0.9);
});

/** 60% play: usually answers the tell, sometimes freestyles. Closer to a real phone player. */
function mixed(b: DuelBoard, s: DuelState, rand: Rand): DuelMove {
  if (rand() < 0.6) return smart(b, s);
  const ok = b.playerMoves.filter((m) => !refusal(s, m));
  return ok.length ? ok[Math.floor(rand() * ok.length)]! : BREATH;
}

function fightPolicy(b: DuelBoard, seed: number, policy: "smart" | "mixed"): number {
  const rand = seeded(seed);
  let s = startDuel(b, rand);
  for (let i = 0; i < 100 && !s.done; i++) {
    const move = policy === "smart" ? smart(b, s) : mixed(b, s, rand);
    s = playTurn(b, s, move, rand).state;
  }
  return s.done ? duelRatio(s) : 0.5;
}

/** Asymmetric "case boss" board: thicker foe, sharper kit, difficulty applied. */
function bossBoard(id: LifeDifficulty): DuelBoard {
  const tune = DIFFICULTY[id];
  const foeKit: DuelMove[] = [
    mv("crush", "strike", 11),
    mv("veil", "trick", 10),
    mv("plate", "guard", 9, "guard"),
    mv("nova", "strike", 13, "burst", 3),
    mv("hex", "trick", 9, "status", 2),
    mv("wall", "guard", 8, "guard"),
  ];
  return board({
    playerHp: 52,
    foeHp: Math.round(78 * tune.foeHp),
    foeMoves: foeKit,
    foeDamage: tune.foeDamage,
    aiHate: tune.aiHate,
    difficulty: id,
    boss: true,
  });
}

test("balance sims: harder difficulties lower win rates for a 60% player vs a case boss", () => {
  const rates: Record<LifeDifficulty, number> = { story: 0, normal: 0, hard: 0, legendary: 0 };
  const N = 48;
  for (const id of LIFE_DIFFICULTIES) {
    const b = bossBoard(id);
    let sum = 0;
    for (let i = 0; i < N; i++) sum += fightPolicy(b, 2000 + i * 31 + id.charCodeAt(0), "mixed");
    rates[id] = sum / N;
  }
  const smartNormal = (() => {
    let sum = 0;
    const b = bossBoard("normal");
    for (let i = 0; i < N; i++) sum += fightPolicy(b, 4000 + i * 13, "smart");
    return sum / N;
  })();
  console.log(
    "difficulty win rates vs case boss (60% play, N=48):",
    Object.fromEntries(LIFE_DIFFICULTIES.map((id) => [id, +rates[id].toFixed(2)])),
    "smart@Normal",
    +smartNormal.toFixed(2),
  );
  assert.ok(rates.story > rates.legendary + 0.08, `story ${rates.story} should beat legendary ${rates.legendary}`);
  assert.ok(rates.story >= rates.normal - 0.02, `story ${rates.story} vs normal ${rates.normal}`);
  assert.ok(rates.normal >= rates.hard - 0.05, `normal ${rates.normal} vs hard ${rates.hard}`);
  assert.ok(rates.legendary <= 0.55, `legendary too easy: ${rates.legendary}`);
  assert.ok(smartNormal >= rates.normal, `perfect play should beat 60% play on Normal`);
});
