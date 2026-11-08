// Hard / Legendary street twists (2026-11-08 pm): harder lives bring different fights, not only bigger numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTY, streetTwisted, twistRoll } from "../difficulty.ts";
import { ageUp, choose, createGame, resolveMini } from "../engine.ts";
import type { DuelBoard, Game, LifeDifficulty } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "harbor", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector", mode: "god", giftIds: ["fire-control", "super-speed"] } as const;

function streetBoards(difficulty: LifeDifficulty, maxAge: number): DuelBoard[] {
  let g: Game = createGame({ ...base, seed: 5, difficulty } as never);
  const out: DuelBoard[] = [];
  for (let i = 0; i < 20000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") {
      const du = g.minigame?.kind === "duel" ? g.minigame.duel : undefined;
      if (du && du.foeSide === "villain" && !du.boss) out.push(du);
      g = resolveMini(g, 0.7);
    } else g = ageUp(g);
  }
  return out;
}

test("street twist share: none on Story / Normal, half on Hard, all on Legendary", () => {
  assert.equal(DIFFICULTY.story.streetTwist, 0);
  assert.equal(DIFFICULTY.normal.streetTwist, 0);
  assert.equal(DIFFICULTY.hard.streetTwist, 0.5);
  assert.equal(DIFFICULTY.legendary.streetTwist, 1);
  let hard = 0;
  for (let i = 0; i < 2000; i++) if (streetTwisted(DIFFICULTY.hard, `Foe ${i}`, 20 + (i % 30), i % 12)) hard++;
  assert.ok(hard > 880 && hard < 1120, `hard share ${hard}/2000`);
  assert.equal(twistRoll("Payday", 22, 3), twistRoll("Payday", 22, 3), "stable for the same foe and month");
  assert.ok(!streetTwisted(DIFFICULTY.normal, "Payday", 22, 3));
  assert.ok(streetTwisted(DIFFICULTY.legendary, "Payday", 22, 3));
});

test("a real Legendary life: every street villain fights with a twist; Normal street foes stay plain unless named", () => {
  const legendary = streetBoards("legendary", 32);
  assert.ok(legendary.length >= 5, `only ${legendary.length} street fights`);
  assert.ok(legendary.every((b) => !!b.gimmick), "every Legendary street villain has a twist");
  const normal = streetBoards("normal", 32);
  const plain = normal.filter((b) => !b.gimmick).length;
  assert.ok(plain > 0, "Normal keeps plain street fights");
});

test("Hard and Legendary stay ordered above Normal on HP and damage", () => {
  const order: LifeDifficulty[] = ["story", "normal", "hard", "legendary"];
  for (let i = 1; i < order.length; i++) {
    assert.ok(DIFFICULTY[order[i]!].foeHp > DIFFICULTY[order[i - 1]!].foeHp);
    assert.ok(DIFFICULTY[order[i]!].foeDamage > DIFFICULTY[order[i - 1]!].foeDamage);
  }
});

test("regen: any won edge stops that turn's heal; a trick still stalls it two turns; hint says so", async () => {
  const { BREATH, beats, gimmickStatus, playTurn, startDuel } = await import("../duel.ts");
  const mv = (id: string, style: "strike" | "guard" | "trick", power: number) => ({ id, name: id, blurb: "", power, style, energy: 1 });
  const kit = [mv("punch", "strike", 6), mv("hook", "strike", 5), mv("dome", "guard", 6), mv("wall", "guard", 5), mv("feint", "trick", 6), mv("slip", "trick", 5)];
  const board: DuelBoard = { foeName: "Knitter", foeTitle: "", foeSide: "villain", playerHp: 999, foeHp: 400, playerMoves: kit, foeMoves: [mv("f-s", "strike", 3), mv("f-t", "trick", 3), mv("f-g", "guard", 3)], gimmick: { kind: "regen", name: "Knit", line: "", hint: "They heal each turn. Win edges to stop it.", style: "trick", at: 1 } };
  let r = 7;
  const rand = () => ((r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296);
  let s = startDuel(board, rand);
  s = playTurn(board, s, kit[0]!, rand).state; // enter phase 2
  let checkedWin = false;
  for (let i = 0; i < 60 && !checkedWin && !s.done; i++) {
    const intent = s.intent.style;
    const winner = kit.find((m) => m.style !== "trick" && beats(m.style, intent));
    if (s.phase >= 2 && s.regenBlock === 0 && winner) {
      const res = playTurn(board, s, winner, rand);
      assert.equal(res.edge, "you");
      assert.equal(res.healed, 0, "a won edge stops the heal that turn");
      assert.equal(res.state.regenBlock, 0, "and only that turn");
      checkedWin = true;
      s = res.state;
    } else s = playTurn(board, s, BREATH, rand).state;
  }
  assert.ok(checkedWin, "found a winnable non-trick turn");
  if (!s.done) {
    assert.match(gimmickStatus(board, s) ?? "", /won edge stops it/);
    const res = playTurn(board, s, kit[4]!, rand);
    assert.equal(res.state.regenBlock, 1, "a trick stalls it this turn and next");
  }
});
