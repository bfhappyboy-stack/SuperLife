// Boss phases and gimmicks, the pure duel core, and fight scaling (2026-11-01 night).
import { test } from "node:test";
import assert from "node:assert/strict";
import { answerOf, BREATH, duelRatio, gimmickStatus, playTurn, refusal, startDuel, type DuelState, type Rand } from "../duel.ts";
import { act, ageUp, choose, createGame, resolveMini } from "../engine.ts";
import { ARCS } from "../arcs.ts";
import { powerGimmick } from "../gimmicks.ts";
import { battleMoves, MOVESET_SIZE, moveEdge } from "../moves.ts";
import { presetById, PRESETS, signatureMoves, VILLAIN_GIMMICKS, villainGimmick, villainSex } from "../presets.ts";
import type { BossGimmick, DuelBoard, DuelMove, Game, GimmickKind } from "../types.ts";

function seeded(seed: number): Rand {
  let r = (seed * 2654435761) % 4294967296;
  return () => (r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const mv = (id: string, style: DuelMove["style"], power: number, kind?: DuelMove["kind"]): DuelMove => ({ id, name: id, blurb: "", power, style, kind, energy: 1 });
const KIT: DuelMove[] = [mv("jab", "strike", 8), mv("slip", "trick", 8), mv("block", "guard", 8, "guard"), mv("quake", "strike", 7, "area"), mv("hex", "trick", 6, "status"), mv("wall", "guard", 7, "guard")];
const FOE: DuelMove[] = [mv("f-strike", "strike", 8), mv("f-trick", "trick", 8), mv("f-guard", "guard", 7, "guard"), mv("f-big", "strike", 9)];

function board(gimmick?: BossGimmick, foeHp = 60): DuelBoard {
  return { foeName: "Test Boss", foeTitle: "", foeSide: "villain", playerHp: 60, foeHp, playerMoves: KIT, foeMoves: FOE, boss: true, gimmick };
}
const live = (kind: GimmickKind, extra: Partial<BossGimmick> = {}): BossGimmick => ({ kind, name: kind, line: "", hint: "", at: 1, ...extra });

/** The same play policy as the playtest harness: answer the tell, respect the gimmick. */
function smart(b: DuelBoard, s: DuelState): DuelMove {
  const ok = b.playerMoves.filter((m) => !refusal(s, m));
  if (!ok.length) return BREATH;
  const g = b.gimmick;
  const on = g && s.phase === 2;
  if (on && g.kind === "armor" && s.plates > 0) {
    const c = ok.filter((m) => m.style === (g.style ?? "trick"));
    if (c.length) return c[0]!;
  }
  if (on && g.kind === "swarm" && s.swarm > 0) {
    const c = ok.find((m) => m.kind === "area");
    if (c) return c;
  }
  if (s.shown === "hidden") return [...ok].sort((a, b2) => b2.power - a.power)[0]!;
  const want = answerOf(s.shown);
  let c = ok.filter((m) => m.style === want);
  if (on && g.kind === "adapt") c = c.filter((m) => (m.id ?? m.name) !== s.lastKey).concat(c);
  if (c.length) return c[0]!;
  return want === "guard" ? BREATH : ok[0]!;
}
function fight(b: DuelBoard, seed: number): number {
  const rand = seeded(seed);
  let s = startDuel(b, rand);
  for (let i = 0; i < 80 && !s.done; i++) s = playTurn(b, s, smart(b, s), rand).state;
  return s.done ? duelRatio(s) : 0.5;
}

test("every legend rogue has a signature gimmick, and every gimmick belongs to a rogue", () => {
  const rogues = PRESETS.flatMap((p) => p.villains);
  const ids = new Set(rogues.map((v) => v.id));
  for (const id of Object.keys(VILLAIN_GIMMICKS)) assert.ok(ids.has(id), `gimmick for unknown villain ${id}`);
  for (const v of rogues) {
    const g = villainGimmick(v.alias);
    assert.ok(g, `${v.alias} has no gimmick`);
    assert.ok(g.name && g.line && g.hint, `${v.alias} gimmick is missing words`);
  }
});

test("generic bosses get a gimmick from their power", () => {
  for (const power of ["strength", "fire", "ice", "healing", "speed", "invisibility", "mind", "intellect", "nonsense"]) {
    const g = powerGimmick(power as never, "Someone");
    assert.ok(g && g.name && g.hint, power);
  }
});

test("phase 2 arrives once the boss drops past the threshold, and not before", () => {
  const b = board(live("enrage", { at: 0.55 }));
  let s = startDuel(b, seeded(1));
  assert.equal(s.phase, 1);
  assert.equal(gimmickStatus(b, s), null);
  let shifted = false;
  for (let i = 0; i < 60 && !s.done; i++) {
    const turn = playTurn(b, s, smart(b, s), seeded(i + 2));
    if (turn.shift === "phase") {
      shifted = true;
      assert.ok(turn.state.foeHp <= b.foeHp * 0.55);
    }
    s = turn.state;
  }
  assert.ok(shifted, "never hit phase 2");
});

test("armor: the breaker style cracks plates, other hits barely scratch it", () => {
  const b = board(live("armor"));
  const s = startDuel(b, seeded(3));
  assert.equal(s.phase, 2);
  assert.equal(s.plates, 2);
  const strike = playTurn(b, s, KIT[0]!, seeded(4));
  assert.equal(strike.state.plates, 2);
  const trick = playTurn(b, s, KIT[1]!, seeded(4));
  assert.equal(trick.state.plates, 1);
  const plain = playTurn(board(), { ...startDuel(board(), seeded(3)) }, KIT[0]!, seeded(4));
  assert.ok(strike.dealt < plain.dealt || plain.dealt === 0, `plated ${strike.dealt} vs bare ${plain.dealt}`);
});

test("revive: the first KO gets back up at 40%, the second one sticks", () => {
  const b = board(live("revive", { at: 0.55 }), 6);
  let s = startDuel(b, seeded(5));
  const first = playTurn(b, s, KIT[0]!, seeded(6));
  assert.equal(first.shift, "revive");
  assert.equal(first.state.done, false);
  assert.ok(first.state.revived);
  assert.equal(first.state.foeHp, Math.round(6 * 0.4));
  s = first.state;
  for (let i = 0; i < 20 && !s.done; i++) s = playTurn(b, s, smart(b, s), seeded(i + 7)).state;
  assert.ok(s.done);
});

test("charge, coin, swarm, regen and fog all show up when live", () => {
  const charge = board(live("charge"));
  let s = startDuel(charge, seeded(8));
  let charged = false;
  for (let i = 0; i < 4 && !s.done; i++) {
    if (s.intent.id === "charge") charged = true;
    s = playTurn(charge, s, BREATH, seeded(i + 9)).state;
  }
  assert.ok(charged, "no charged hit within 4 turns");

  assert.ok(startDuel(board(live("coin")), seeded(10)).coin);

  const swarm = board(live("swarm"));
  const sw = startDuel(swarm, seeded(11));
  assert.ok(sw.swarm > 0);
  assert.equal(playTurn(swarm, sw, KIT[3]!, seeded(12)).state.swarm, 0, "area move should clear the swarm");

  const regen = board(live("regen"));
  const healed = [1, 2, 3, 4, 5].some((n) => playTurn(regen, { ...startDuel(regen, seeded(n)), foeHp: 30 }, BREATH, seeded(n + 20)).healed > 0);
  assert.ok(healed, "regen never healed");

  const fog = board(live("fog"));
  const hidden = Array.from({ length: 30 }, (_, n) => startDuel(fog, seeded(n + 1)).shown).filter((x) => x === "hidden").length;
  assert.ok(hidden > 3 && hidden < 27, `fog hid ${hidden}/30`);
});

test("good play beats every rogue's gimmick most of the time, but not always", () => {
  for (const preset of PRESETS) {
    for (const v of preset.villains) {
      const b: DuelBoard = { ...board(villainGimmick(v.alias) ?? undefined, 75), foeName: v.alias, foeMoves: signatureMoves(v.alias, 6)! };
      let won = 0;
      for (let i = 0; i < 24; i++) won += fight(b, i + 1) >= 0.5 ? 1 : 0;
      assert.ok(won >= 8, `${v.alias} is a wall: ${won}/24`);
    }
  }
});

test("moves grow with the hero: edge scales with power level and mastery", () => {
  const young = moveEdge({ stats: { powerLevel: 1 } }, "fire");
  const old = moveEdge({ stats: { powerLevel: 8 } }, "fire");
  assert.ok(old >= young + 3, `${young} -> ${old}`);
  assert.ok(moveEdge({ stats: { powerLevel: 8 } }) < old, "street moves scale slower than powers");
});

function grow(g: Game, maxAge: number): Game {
  for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
  }
  return g;
}
const base = { name: "Rae Okafor", cityId: "nyc", upbringing: "skeptical", portrait: 3, sex: "female", face: "loud", drive: "idealistic" } as const;

test("loadouts stay at exactly six moves and cover more than one style", () => {
  for (const preset of [null, "iron-man", "thor", "batman"]) {
    const g = grow(createGame({ ...base, preset, seed: 21 } as never), 34);
    const moves = battleMoves(g);
    assert.equal(moves.length, MOVESET_SIZE, String(preset));
    assert.ok(new Set(moves.map((m) => m.style)).size >= 2, `${preset} loadout is one style`);
  }
});

test("legend arc bosses are the legend's own rogues, picked once per arc", () => {
  const arc = ARCS.find((a) => a.steps.some((step) => step.kind === "boss"))!;
  const at = arc.steps.findIndex((step) => step.kind === "boss");
  const open = (preset: string | null): Game => {
    const g = grow(createGame({ ...base, preset, seed: 9 } as never), 32);
    g.phase = "live";
    g.pending = null as never;
    g.majorsLeft = Math.max(1, g.majorsLeft);
    g.story = { active: arc.id, cleared: [], progress: { [arc.id]: at } };
    return act(g, "arc-step");
  };
  const legend = open("iron-man");
  const rogues = new Set(presetById("iron-man")!.villains.map((v) => v.alias));
  assert.equal(legend.phase, "mini");
  assert.ok(rogues.has(legend.minigame!.duel!.foeName), `legend fought ${legend.minigame!.duel!.foeName}`);
  assert.ok(legend.minigame!.duel!.gimmick, "rogue boss has no gimmick");
  const again = open("iron-man");
  assert.equal(again.minigame!.duel!.foeName, legend.minigame!.duel!.foeName, "patron pick is not stable");
  const plain = open(null);
  assert.ok(!rogues.has(plain.minigame!.duel!.foeName), "ordinary lives keep the case's own boss");
});

test("female rogues keep their figures", () => {
  for (const alias of ["Hela", "Cheetah", "Circe", "Medusa", "Lady Deathstrike"]) assert.equal(villainSex(alias), "female", alias);
  assert.equal(villainSex("Bane"), "male");
  assert.equal(villainSex("Nobody Real"), null);
});
