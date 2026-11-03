// 2026-11-02 Arena: the pure 1v1 versus engine, its roster and the AI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ARENA_ROSTER } from "../arena.roster.ts";
import {
  aiDraft, aiFollow, aiLead, aiOrder, arenaRefusal, clinched, DRAFT_ORDER, draftPick, draftTurn, ENERGY_CAP, hashSeed,
  matchTurn, moveByKey, newMatch, nextRound, playArenaTurn, rngNext, roundsWon, setOrder, simBout, startBout, tellOf,
  TEAM_SIZE, type ArenaMatch, type Side,
} from "../arena.ts";
import { PRESETS } from "../presets.ts";
import { keyOf } from "../duel.ts";

const rng = (seed: number) => {
  let s = seed;
  return () => {
    const [v, n] = rngNext(s);
    s = n;
    return v;
  };
};

test("every legend is in the roster with exactly six moves covering all three styles", () => {
  for (const p of PRESETS) assert.ok(ARENA_ROSTER.some((f) => f.id === p.id && f.side === "hero"), `${p.id} missing`);
  assert.ok(ARENA_ROSTER.filter((f) => f.side === "villain").length >= 16);
  for (const f of ARENA_ROSTER) {
    assert.equal(f.moves.length, 6, f.id);
    for (const s of ["strike", "trick", "guard"]) assert.ok(f.moves.some((m) => m.style === s), `${f.id} lacks ${s}`);
    assert.equal(new Set(f.moves.map(keyOf)).size, 6, `${f.id} has duplicate move keys`);
    for (const m of f.moves) {
      assert.ok(m.power >= 3 && m.power <= 10, `${f.id}/${m.name} power`);
      assert.ok((m.energy ?? 1) <= ENERGY_CAP, `${f.id}/${m.name} energy`);
      assert.ok(m.element, `${f.id}/${m.name} element`);
    }
    assert.ok(f.hp >= 70 && f.hp <= 150, `${f.id} hp ${f.hp}`);
  }
  assert.equal(new Set(ARENA_ROSTER.map((f) => f.id)).size, ARENA_ROSTER.length);
});

test("villain arena kits are built from their preset boss moves", () => {
  const joker = ARENA_ROSTER.find((f) => f.id === "joker")!;
  const preset = PRESETS.find((p) => p.id === "batman")!.villains.find((v) => v.id === "joker")!;
  for (const m of preset.moves) assert.ok(joker.moves.some((x) => x.name === m.name), m.name);
});

test("a bout is deterministic: same seed and actions, same result", () => {
  const a = simBout("hulk", "abomination", 1234);
  const b = simBout("hulk", "abomination", 1234);
  assert.deepEqual(a, b);
  const c = simBout("hulk", "abomination", 1235);
  assert.notDeepEqual(a.log, c.log);
});

test("bouts always end, within the turn cap, with one winner", () => {
  for (let i = 0; i < 60; i++) {
    const ids = ARENA_ROSTER.map((f) => f.id);
    const a = ids[i % ids.length]!;
    const b = ids[(i * 7 + 3) % ids.length]!;
    if (a === b) continue;
    const r = simBout(a, b, i);
    assert.ok(r.done && (r.winner === 0 || r.winner === 1), `${a} v ${b}`);
    assert.ok(r.turn <= 24);
    assert.ok(r.fighters.every((f) => f.energy >= 0 && f.hp >= 0 && f.hp <= f.maxHp));
  }
});

test("rock-paper-scissors: the winning style deals more than the losing one", () => {
  const b = startBout("captain-america", "red-skull", 7, 0);
  const strike = ARENA_ROSTER.find((f) => f.id === "captain-america")!.moves.find((m) => m.style === "strike")!;
  const trick = ARENA_ROSTER.find((f) => f.id === "red-skull")!.moves.find((m) => m.style === "trick" && (m.energy ?? 1) <= 2)!;
  const r = playArenaTurn(b, [{ move: keyOf(strike) }, { move: keyOf(trick) }]);
  assert.equal(r.log[0]!.edge, 0);
  assert.ok(r.log[0]!.dealt[0] > r.log[0]!.dealt[1]);
});

test("leads alternate, energy is spent and refills, cooldowns tick", () => {
  let b = startBout("thor", "loki", 99, 0);
  assert.equal(b.leader, 0);
  const storm = ARENA_ROSTER.find((f) => f.id === "thor")!.moves.find((m) => (m.cooldown ?? 0) > 0)!;
  b = playArenaTurn(b, [{ move: keyOf(storm) }, { move: "breath" }]);
  assert.equal(b.leader, 1);
  assert.equal(b.fighters[0].energy, 7 - (storm.energy ?? 1) + 3);
  assert.ok(arenaRefusal(b.fighters[0], storm), "cooling move is refused");
  b = playArenaTurn(b, [{ move: "breath" }, { move: "breath" }]);
  b = playArenaTurn(b, [{ move: "breath" }, { move: "breath" }]);
  assert.equal(arenaRefusal(b.fighters[0], storm), null);
});

test("illegal actions fall back to a breath instead of breaking the state", () => {
  let b = startBout("batman", "joker", 5, 0);
  b = playArenaTurn(b, [{ move: "no-such-move" }, { move: "breath" }]);
  assert.equal(b.log[0]!.moves[0], "breath");
  const gel = ARENA_ROSTER.find((f) => f.id === "batman")!.moves.find((m) => m.id === "bm-gadget")!;
  b = { ...b, fighters: [{ ...b.fighters[0], energy: 1 }, b.fighters[1]] };
  b = playArenaTurn(b, [{ move: "breath" }, { move: "breath" }]);
  const r = playArenaTurn({ ...b, fighters: [{ ...b.fighters[0], energy: 1 }, b.fighters[1]] }, [{ move: keyOf(gel) }, { move: "breath" }]);
  assert.equal(r.log.at(-1)!.moves[0], "breath");
});

test("feints show a false style and cost 2 energy; the Joker feints for free; Spider-Sense sees through", () => {
  const b = startBout("batman", "goblin", 3, 0);
  const strike = ARENA_ROSTER.find((f) => f.id === "batman")!.moves.find((m) => m.style === "strike")!;
  const t = tellOf(b, { move: keyOf(strike), feint: "guard" });
  assert.deepEqual([t.style, t.feint], ["guard", true]);
  const after = playArenaTurn(b, [{ move: keyOf(strike), feint: "guard" }, { move: "breath" }]);
  assert.equal(after.fighters[0].energy, 7 - (strike.energy ?? 1) - 2 + 3 + 1); // +1: Batman's Contingency Plan
  const j = startBout("joker", "goblin", 3, 0);
  const jm = ARENA_ROSTER.find((f) => f.id === "joker")!.moves[0]!;
  const ja = playArenaTurn(j, [{ move: keyOf(jm), feint: jm.style === "guard" ? "strike" : "guard" }, { move: "breath" }]);
  assert.equal(ja.fighters[0].energy, Math.min(10, 7 - (jm.energy ?? 1) + 3));
  const s = startBout("joker", "spider-man", 3, 0);
  const st = tellOf(s, { move: keyOf(jm), feint: jm.style === "guard" ? "strike" : "guard" });
  assert.equal(st.style, jm.style);
});

test("passives: Ultron revives once, armor soaks, swarm chips until an area hit", () => {
  let b = startBout("ultron", "hulk", 1, 0);
  b = { ...b, fighters: [{ ...b.fighters[0], hp: 1 }, b.fighters[1]] };
  const smash = moveByKey("hulk", "hk-smash");
  b = playArenaTurn(b, [{ move: "breath" }, { move: keyOf(smash) }]);
  assert.equal(b.done, false);
  assert.equal(b.fighters[0].revived, true);
  assert.equal(b.log[0]!.revive, 0);

  let o = startBout("ock", "thor", 2, 0);
  assert.equal(o.fighters[1].swarmed, 3);
  o = playArenaTurn(o, [{ move: "breath" }, { move: "th-storm" }]);
  assert.equal(o.fighters[1].swarmed, 0, "an area move scatters the swarm");

  const s = startBout("stane", "spider-man", 4, 1);
  assert.equal(s.fighters[0].plates, 2);
});

test("the Flash leads the first turn", () => {
  assert.equal(startBout("goblin", "flash", 1, 0).leader, 1);
  assert.equal(startBout("flash", "goblin", 1, 1).leader, 0);
});

test("a full match: snake draft, secret orders, three bouts, most rounds wins", () => {
  let m: ArenaMatch = newMatch(42);
  const r = rng(9);
  const order: Side[] = [];
  while (m.stage === "draft") {
    const side = draftTurn(m)!;
    order.push(side);
    m = draftPick(m, side, aiDraft(m, side, "pro", r));
  }
  assert.deepEqual(order, DRAFT_ORDER);
  assert.equal(new Set([...m.picks[0], ...m.picks[1]]).size, 6);
  assert.throws(() => setOrder(m, 0, [m.picks[1][0]!, m.picks[0][1]!, m.picks[0][2]!]));
  m = setOrder(m, 0, aiOrder(m, 0, r));
  assert.equal(m.stage, "order");
  m = setOrder(m, 1, aiOrder(m, 1, r));
  assert.equal(m.stage, "bout");
  const fought: [string[], string[]] = [[], []];
  while (m.stage === "bout") {
    const b = m.bout!;
    if (b.turn === 0) {
      fought[0].push(b.fighters[0].id);
      fought[1].push(b.fighters[1].id);
    }
    if (b.done) {
      m = nextRound(m);
      continue;
    }
    const lead = b.leader;
    const la = aiLead(b, lead, "pro", r);
    const fa = aiFollow(b, (1 - lead) as Side, tellOf(b, la), "pro", r);
    m = matchTurn(m, lead === 0 ? [la, fa] : [fa, la]);
  }
  assert.equal(m.stage, "done");
  assert.equal(m.results.length, TEAM_SIZE);
  assert.deepEqual(fought[0], m.orders[0]);
  assert.deepEqual(fought[1], m.orders[1]);
  const [a, b] = roundsWon(m);
  assert.equal(m.winner, a > b ? 0 : 1);
  assert.ok(clinched(m));
});

test("draft refuses taken fighters and out-of-turn picks", () => {
  let m = newMatch(1);
  m = draftPick(m, 0, "hulk");
  assert.throws(() => draftPick(m, 0, "thor"));
  assert.throws(() => draftPick(m, 1, "hulk"));
});

test("roster balance: AI-vs-AI win rates across all three levels stay within a 22-point spread (12 bouts a pair)", () => {
  const ids = ARENA_ROSTER.map((f) => f.id);
  const w: Record<string, number> = {};
  const g: Record<string, number> = {};
  for (const a of ids)
    for (const b of ids) {
      if (a >= b) continue;
      for (let i = 0; i < 12; i++) {
        // Mixed levels: the roster is tuned for the whole ladder, not one AI's habits.
        const level = (["rookie", "pro", "legend"] as const)[i % 3];
        const r = simBout(a, b, hashSeed(a, b, i, "t"), level, (Math.floor(i / 3) % 2) as Side);
        const x = r.winner === 0 ? a : b;
        w[x] = (w[x] ?? 0) + 1;
        g[a] = (g[a] ?? 0) + 1;
        g[b] = (g[b] ?? 0) + 1;
      }
    }
  const rates = ids.map((id) => (w[id] ?? 0) / g[id]!);
  const spread = Math.max(...rates) - Math.min(...rates);
  assert.ok(spread < 0.22, `spread ${(spread * 100).toFixed(1)} points`);
});

test("difficulty ladder: a player who follows the Answer hints beats Rookie most, Legend least", () => {
  // A simple human stand-in: answers tells it trusts, leads with its best affordable move, bluffs sometimes.
  const human = (b: ReturnType<typeof startBout>, side: Side, tell: ReturnType<typeof tellOf> | null, r: () => number) => {
    const fs = b.fighters[side];
    const ms = ARENA_ROSTER.find((f) => f.id === fs.id)!.moves.filter((m) => !arenaRefusal(fs, m));
    if (fs.energy < 3 || !ms.length) return { move: "breath" };
    const best = (xs: typeof ms) => [...xs].sort((x, y) => y.power - x.power + (r() - 0.5) * 3)[0]!;
    if (tell) {
      const opp = (1 - side) as Side;
      const rate = b.leadsSeen[opp] ? b.feints[opp] / b.leadsSeen[opp] : 0;
      const styles = ["strike", "trick", "guard"] as const;
      const want = tell.style && r() > rate ? ({ strike: "guard", trick: "strike", guard: "trick" } as const)[tell.style] : styles[Math.floor(r() * 3)]!;
      const a = ms.filter((m) => m.style === want);
      return { move: keyOf(best(a.length ? a : ms)) };
    }
    return { move: keyOf(best(ms)) };
  };
  const rate = (level: "rookie" | "pro" | "legend") => {
    let w = 0;
    let n = 0;
    for (const a of ARENA_ROSTER)
      for (const c of ARENA_ROSTER) {
        if (a === c) continue;
        const r = rng(hashSeed(a.id, c.id, level));
        let b = startBout(a.id, c.id, hashSeed(a.id, c.id), (n % 2) as Side);
        while (!b.done) {
          const lead = b.leader;
          const la = lead === 0 ? human(b, 0, null, r) : aiLead(b, 1, level, r);
          const fa = lead === 0 ? aiFollow(b, 1, tellOf(b, la), level, r) : human(b, 0, tellOf(b, la), r);
          b = playArenaTurn(b, lead === 0 ? [la, fa] : [fa, la]);
        }
        n++;
        if (b.winner === 0) w++;
      }
    return w / n;
  };
  const [rookie, pro, legend] = [rate("rookie"), rate("pro"), rate("legend")];
  assert.ok(rookie > 0.6, `rookie ${rookie.toFixed(2)}`);
  assert.ok(pro > 0.3 && pro < rookie, `pro ${pro.toFixed(2)}`);
  assert.ok(legend < pro, `legend ${legend.toFixed(2)}`);
});
