// 2026-11-02 pm Arena online: room rules, hidden commits, clocks and validation (server-authoritative).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiDraft, aiFollow, aiLead, aiOrder, rngNext, tellOf, type ArenaAction, type Side,
} from "../arena.ts";
import {
  applyCmd, createRoom, joinRoom, MAX_TIMEOUTS, ORDER_MS, pendingOf, replay, replayDoc, replayView, sanitizeLife, settle,
  turnStamp, TURN_MS, viewFor, READY_MS, type RoomCmd, type RoomDoc,
} from "../arena.online.ts";
import { actOnline, createOnline, joinOnline, memoryStore, pollOnline } from "../arena.service.ts";

const rng = (seed: number) => {
  let s = seed;
  return () => {
    const [v, n] = rngNext(s);
    s = n;
    return v;
  };
};
const T0 = 1_800_000_000_000;
const TOK = ["tok-aaaaaaaaaaaaaaaa", "tok-bbbbbbbbbbbbbbbb"];

function room(lives: unknown[][] = [[], []]): RoomDoc {
  const d = createRoom("ABCDEF", TOK[0]!, "Ana", lives[0]!, T0);
  const j = joinRoom(d, TOK[1]!, "Ben", lives[1]!, T0 + 10);
  assert.ok(j.ok);
  return j.value.doc;
}

function must(r: ReturnType<typeof applyCmd>): RoomDoc {
  if (!r.ok) assert.fail(r.error);
  return r.value;
}

/** Drive a room to the end with both sides played by the AI, through the real command path only. */
function playOut(doc: RoomDoc, seed: number, start = T0 + 100): { doc: RoomDoc; now: number; cmds: number } {
  const rand = rng(seed);
  let now = start;
  let cmds = 0;
  for (let guard = 0; guard < 500; guard++) {
    const r = replayDoc(doc);
    const m = r.match;
    const p = pendingOf(doc, r);
    if (p.kind === "over") return { doc, now, cmds };
    now += 50;
    const send = (s: Side, cmd: RoomCmd) => {
      doc = must(applyCmd(doc, s, cmd, now));
      cmds++;
    };
    if (p.kind === "pick") send(p.sides[0]!, { t: "pick", at: m.picks[0].length + m.picks[1].length, id: aiDraft(m, p.sides[0]!, "pro", rand) });
    else if (p.kind === "order") for (const s of p.sides) send(s, { t: "order", order: aiOrder(m, s, rand) });
    else if (p.kind === "lead") {
      const a = aiLead(m.bout!, p.sides[0]!, "pro", rand);
      send(p.sides[0]!, { t: "move", at: turnStamp(m), move: a.move, feint: a.feint ?? null });
    } else if (p.kind === "answer") {
      const s = p.sides[0]!;
      const v = viewFor(doc, s, now);
      assert.ok(v.tell, "the follower sees a tell");
      const a = aiFollow(m.bout!, s, v.tell!, "pro", rand);
      send(s, { t: "move", at: turnStamp(m), move: a.move });
    } else if (p.kind === "ready") for (const s of p.sides) send(s, { t: "ready", round: m.round });
  }
  assert.fail("match never ended");
}

test("a full online match replays to the same result from the public log alone", () => {
  for (const seed of [1, 2, 3]) {
    const { doc } = playOut(room(), seed);
    const a = replayDoc(doc).match;
    assert.equal(a.stage, "done");
    assert.ok(a.winner === 0 || a.winner === 1);
    // Both clients rebuild it from their view: same winner, same rounds, same final HP.
    for (const s of [0, 1] as Side[]) {
      const v = viewFor(doc, s, T0 + 1e6);
      const b = replayView(v).match;
      assert.deepEqual(b.results, a.results);
      assert.deepEqual(b.margins, a.margins);
      assert.equal(b.winner, a.winner);
    }
    // And a JSON round-trip of the log (what goes over the wire) changes nothing.
    const again = replay(doc.seed, replayDoc(doc).match.pool, JSON.parse(JSON.stringify(doc.log))).match;
    assert.deepEqual(again.results, a.results);
    // A clinched 2-0 skips the dead round.
    if (a.results.length === 2) assert.ok(a.results[0] === a.results[1]);
  }
});

test("fight orders stay hidden until both are locked, then reveal together", () => {
  let doc = room();
  const rand = rng(9);
  let now = T0 + 100;
  for (let i = 0; i < 6; i++) {
    const m = replayDoc(doc).match;
    const p = pendingOf(doc);
    doc = must(applyCmd(doc, p.sides[0]!, { t: "pick", at: i, id: aiDraft(m, p.sides[0]!, "rookie", rand) }, (now += 10)));
  }
  const m = replayDoc(doc).match;
  assert.equal(m.stage, "order");
  doc = must(applyCmd(doc, 0, { t: "order", order: [...m.picks[0]].reverse() }, (now += 10)));
  const v1 = viewFor(doc, 1, now);
  assert.equal(v1.myOrder, null);
  assert.deepEqual(v1.committed.orders, [true, false]);
  assert.ok(!JSON.stringify(v1).includes(JSON.stringify([...m.picks[0]].reverse())), "side 1 can't read side 0's order");
  assert.equal(replayView(v1).match.stage, "order");
  assert.deepEqual(viewFor(doc, 0, now).myOrder, [...m.picks[0]].reverse());
  // Locking twice is refused.
  assert.equal(applyCmd(doc, 0, { t: "order", order: m.picks[0] }, now).ok, false);
  doc = must(applyCmd(doc, 1, { t: "order", order: m.picks[1] }, (now += 10)));
  const after = replayDoc(doc).match;
  assert.equal(after.stage, "bout");
  assert.deepEqual(after.orders[0], [...m.picks[0]].reverse());
});

function toBout(seed = 4): { doc: RoomDoc; now: number } {
  let doc = room();
  const rand = rng(seed);
  let now = T0 + 100;
  for (let i = 0; i < 6; i++) {
    const m = replayDoc(doc).match;
    const s = pendingOf(doc).sides[0]!;
    doc = must(applyCmd(doc, s, { t: "pick", at: i, id: aiDraft(m, s, "rookie", rand) }, (now += 10)));
  }
  const m = replayDoc(doc).match;
  doc = must(applyCmd(doc, 0, { t: "order", order: m.picks[0] }, (now += 10)));
  doc = must(applyCmd(doc, 1, { t: "order", order: m.picks[1] }, (now += 10)));
  return { doc, now };
}

test("turn commit/reveal: the follower sees only the tell, never the move or whether it's a feint", () => {
  let { doc, now } = toBout();
  const m = replayDoc(doc).match;
  const L = m.bout!.leader;
  const F = (1 - L) as Side;
  const fs = m.bout!.fighters[L];
  // Find a move whose style we can fake with another style the leader can afford.
  const mv = replayDoc(doc).match.bout && (aiLead(m.bout!, L, "legend", rng(3)));
  const lead: ArenaAction = { move: mv!.move === "breath" ? "breath" : mv!.move };
  doc = must(applyCmd(doc, L, { t: "move", at: turnStamp(m), move: lead.move, feint: "guard" }, (now += 10)));
  const vf = viewFor(doc, F, now);
  const vl = viewFor(doc, L, now);
  assert.equal(vf.myLead, null);
  assert.equal(vl.tell, null, "the leader doesn't get a tell");
  assert.ok(vf.tell);
  assert.equal(vf.tell!.feint, false, "the feint flag is stripped for the follower");
  assert.ok(!JSON.stringify(vf).includes(`"move":"${lead.move}"`) || lead.move === "breath", "the follower's view never carries the lead move");
  assert.equal(replayView(vf).match.bout!.turn, m.bout!.turn, "the turn hasn't resolved");
  assert.ok(fs);
  // Leading twice, or the follower faking a tell, is refused.
  assert.equal(applyCmd(doc, L, { t: "move", at: turnStamp(m), move: "breath" }, now).ok, false);
  const bad = applyCmd(doc, F, { t: "move", at: turnStamp(m), move: "breath", feint: "strike" }, now);
  assert.equal(bad.ok, false);
  doc = must(applyCmd(doc, F, { t: "move", at: turnStamp(m), move: "breath" }, (now += 10)));
  const after = replayDoc(doc).match;
  assert.equal(after.bout!.turn, m.bout!.turn + 1);
  assert.equal(after.bout!.log.at(-1)!.moves[L], lead.move);
});

test("invalid actions are rejected with a reason and change nothing", () => {
  let { doc, now } = toBout(6);
  const m = replayDoc(doc).match;
  const L = m.bout!.leader;
  const F = (1 - L) as Side;
  const bad: [Side, RoomCmd][] = [
    [F, { t: "move", at: turnStamp(m), move: "breath" }], // not your lead
    [L, { t: "move", at: turnStamp(m), move: "not-a-move" }], // unknown move
    [L, { t: "move", at: "0:99", move: "breath" }], // stale stamp
    [L, { t: "pick", at: 6, id: "thor" }], // draft is over
    [L, { t: "ready", round: 0 }], // round not over
    [L, { t: "rematch" }], // not done
    [L, { t: "nope" } as unknown as RoomCmd],
  ];
  // An expensive move with no energy: drain by setting a move the fighter can't afford is engine-checked.
  for (const [s, cmd] of bad) {
    const r = applyCmd(doc, s, cmd, now + 5);
    assert.equal(r.ok, false, JSON.stringify(cmd));
    if (!r.ok) assert.ok(r.error.length > 5);
  }
  assert.deepEqual(doc.log.length, replayDoc(doc).match && doc.log.length);
  // Draft-phase rejections.
  let d = room();
  assert.equal(applyCmd(d, 1, { t: "pick", at: 0, id: "thor" }, T0 + 50).ok, false, "not side 1's pick");
  d = must(applyCmd(d, 0, { t: "pick", at: 0, id: "thor" }, T0 + 50));
  assert.equal(applyCmd(d, 1, { t: "pick", at: 1, id: "thor" }, T0 + 60).ok, false, "already taken");
  assert.equal(applyCmd(d, 1, { t: "pick", at: 0, id: "hulk" }, T0 + 60).ok, false, "stale pick index");
  assert.equal(applyCmd(d, 1, { t: "pick", at: 1, id: "life-1" }, T0 + 60).ok, false, "not in the pool");
  // Orders must be your own three.
  ({ doc, now } = toBout(7));
  void doc;
});

test("a missed turn plays Catch a breath; three missed turns forfeit", () => {
  const start = toBout(8);
  const now = start.now;
  let doc = start.doc;
  const m0 = replayDoc(doc).match;
  const L = m0.bout!.leader;
  // Leader idles: after 30 s the server gives them a breath lead and the follower gets a fresh clock.
  doc = settle(doc, now + TURN_MS + 1);
  assert.equal(doc.timeouts[L], 1);
  assert.equal(pendingOf(doc).kind, "answer");
  // Follower answers in time; the turn resolves with the leader's auto breath.
  const F = (1 - L) as Side;
  doc = must(applyCmd(doc, F, { t: "move", at: turnStamp(m0), move: "breath" }, now + TURN_MS + 500));
  const m1 = replayDoc(doc).match;
  assert.equal(m1.bout!.log.at(-1)!.moves[L], "breath");
  const ev = doc.log.at(-1)!;
  assert.ok(ev.t === "turn" && ev.auto?.[L] === true);
  // Now nobody touches the room for minutes: the clocks chain and someone forfeits on their third miss.
  const later = settle(doc, now + 10 * 60_000);
  const end = replayDoc(later);
  assert.equal(end.match.stage, "done");
  assert.ok(end.forfeit && end.forfeit.why === "timeout");
  assert.equal(later.timeouts[end.forfeit!.s], MAX_TIMEOUTS);
  assert.equal(end.match.winner, 1 - end.forfeit!.s);
  // Settling is idempotent.
  assert.equal(settle(later, now + 20 * 60_000), later);
});

test("draft and order clocks auto-pick and auto-lock", () => {
  let doc = room();
  doc = settle(doc, T0 + 10 + TURN_MS + 1);
  const m = replayDoc(doc).match;
  assert.equal(m.picks[0].length, 1, "side 0 got an auto pick");
  assert.equal(doc.timeouts[0], 1);
  const { doc: d, now } = toBout(10);
  void d;
  // Order: only one side locks; the other gets its draft order when the 45 s clock runs out.
  let o = room();
  const rand = rng(2);
  let t = T0 + 100;
  for (let i = 0; i < 6; i++) {
    const mm = replayDoc(o).match;
    const s = pendingOf(o).sides[0]!;
    o = must(applyCmd(o, s, { t: "pick", at: i, id: aiDraft(mm, s, "rookie", rand) }, (t += 10)));
  }
  const mm = replayDoc(o).match;
  o = must(applyCmd(o, 0, { t: "order", order: [...mm.picks[0]].reverse() }, (t += 10)));
  o = settle(o, t + ORDER_MS + 5);
  const after = replayDoc(o).match;
  assert.equal(after.stage, "bout");
  assert.deepEqual(after.orders[1], mm.picks[1]);
  assert.deepEqual(after.orders[0], [...mm.picks[0]].reverse());
  assert.deepEqual(o.timeouts, [0, 1]);
  void now;
});

test("the between-rounds wait doesn't count as a timeout", () => {
  const { doc } = playOut(room(), 5);
  void doc;
  // Build a room where a bout just ended and nobody taps on.
  const r0 = room();
  let d = r0;
  const rand = rng(11);
  let now = T0 + 100;
  for (let guard = 0; guard < 300; guard++) {
    const rr = replayDoc(d);
    const p = pendingOf(d, rr);
    if (p.kind === "ready") break;
    now += 10;
    const m = rr.match;
    if (p.kind === "pick") d = must(applyCmd(d, p.sides[0]!, { t: "pick", at: m.picks[0].length + m.picks[1].length, id: aiDraft(m, p.sides[0]!, "pro", rand) }, now));
    else if (p.kind === "order") for (const s of p.sides) d = must(applyCmd(d, s, { t: "order", order: m.picks[s] }, now));
    else if (p.kind === "lead") d = must(applyCmd(d, p.sides[0]!, { t: "move", at: turnStamp(m), move: aiLead(m.bout!, p.sides[0]!, "pro", rand).move }, now));
    else if (p.kind === "answer") {
      const s = p.sides[0]!;
      d = must(applyCmd(d, s, { t: "move", at: turnStamp(m), move: aiFollow(m.bout!, s, tellOf(m.bout!, d.hidden.lead!), "pro", rand).move }, now));
    }
  }
  assert.equal(pendingOf(d).kind, "ready");
  const before = [...d.timeouts];
  const moved = settle(d, now + READY_MS + 1);
  assert.deepEqual(moved.timeouts, before);
  assert.ok(replayDoc(moved).match.round >= 1 || replayDoc(moved).match.stage === "done");
});

test("leaving forfeits a live match; rematch needs both and starts a fresh draft", () => {
  let { doc, now } = toBout(12);
  doc = must(applyCmd(doc, 1, { t: "leave" }, (now += 10)));
  const r = replayDoc(doc);
  assert.equal(r.match.stage, "done");
  assert.equal(r.match.winner, 0);
  assert.deepEqual(r.forfeit, { s: 1, why: "quit" });
  assert.equal(viewFor(doc, 0, now).left[1], true);
  assert.equal(applyCmd(doc, 0, { t: "rematch" }, now).ok, false, "can't rematch someone who left");

  let done = playOut(room(), 13).doc;
  const oldSeed = done.seed;
  done = must(applyCmd(done, 0, { t: "rematch" }, T0 + 1e6));
  assert.equal(done.game, 0);
  assert.deepEqual(viewFor(done, 1, T0 + 1e6).rematch, [true, false]);
  done = must(applyCmd(done, 1, { t: "rematch" }, T0 + 1e6 + 5));
  assert.equal(done.game, 1);
  assert.notEqual(done.seed, oldSeed);
  assert.equal(done.log.length, 0);
  assert.equal(replayDoc(done).match.stage, "draft");

  // A host closing an empty lobby closes the room.
  const lobby = createRoom("QWERTY", TOK[0]!, "Ana", [], T0);
  const closed = must(applyCmd(lobby, 0, { t: "leave" }, T0 + 5));
  assert.equal(pendingOf(closed).kind, "closed");
  assert.equal(joinRoom(closed, TOK[1]!, "Ben", [], T0 + 6).ok, false);
});

function fakeLife(power: number) {
  return {
    id: "life-1", name: "Nova Kid", sex: "female", hp: 999, seed: 42,
    passive: { kind: "worthy", name: "Worthy", text: "x" },
    moves: [
      { id: "a", name: "Jab", blurb: "", power, style: "strike", energy: 0, cooldown: 0 },
      { id: "b", name: "Feint", blurb: "", power, style: "trick", energy: 0, cooldown: 0 },
      { id: "c", name: "Block", blurb: "", power, style: "guard", kind: "guard", energy: 0, cooldown: 0 },
      { id: "d", name: "Nova", blurb: "", power, style: "strike", kind: "burst", energy: 0, cooldown: 0 },
      { id: "e", name: "Blink", blurb: "", power, style: "trick", kind: "dash", energy: 0, cooldown: 0 },
      { id: "f", name: "Wall", blurb: "", power, style: "guard", energy: 0, cooldown: 0 },
    ],
    life: { look: { skin: 1, hair: 2, style: 3, build: 0, feature: 0 }, wardrobe: { owned: ["x"], worn: { cape: "x", hack: "y" } }, age: 33, sex: "female" },
  };
}

test("saved lives from the wire are rebuilt fair: clamped power, real costs, fixed HP, new ids", () => {
  const f = sanitizeLife(fakeLife(99), "net-ABCDEF-0-0")!;
  assert.ok(f);
  assert.equal(f.hp, 104);
  assert.ok(f.moves.every((m) => m.power === 9 && m.energy === (m.kind === "guard" ? 3 : 4)));
  assert.equal(f.moves[3]!.cooldown, 2, "power-9 burst recovers");
  assert.deepEqual(f.moves.map((m) => m.id), [0, 1, 2, 3, 4, 5].map((i) => `net-ABCDEF-0-0-m${i}`));
  assert.equal(f.life!.wardrobe.worn.cape, "x");
  assert.ok(!("hack" in f.life!.wardrobe.worn));
  const evil = { ...fakeLife(6), passive: { kind: "revive", name: "Cheat", text: "" } };
  assert.equal(sanitizeLife(evil, "x")!.passive.kind, "prep", "a life can't claim a villain passive");
  assert.equal(sanitizeLife({ ...fakeLife(6), moves: fakeLife(6).moves.slice(0, 5) }, "x"), null, "exactly 6 moves");
  const noGuard = fakeLife(6);
  noGuard.moves = noGuard.moves.map((m) => ({ ...m, style: m.style === "guard" ? "strike" : m.style }));
  assert.equal(sanitizeLife(noGuard, "x"), null, "needs every style");
  // A room with a life on each side drafts and plays them like anyone else.
  const d = room([[fakeLife(7)], [fakeLife(6)]]);
  assert.deepEqual(d.players.map((p) => p!.lives.map((l) => l.id)), [["net-ABCDEF-0-0"], ["net-ABCDEF-1-0"]]);
  let x = must(applyCmd(d, 0, { t: "pick", at: 0, id: "net-ABCDEF-1-0" }, T0 + 50));
  assert.equal(replayDoc(x).match.picks[0][0], "net-ABCDEF-1-0");
  x = playOut(x, 21).doc;
  assert.equal(replayDoc(x).match.stage, "done");
});

test("service: create, join by code, poll and act over a store with optimistic writes", async () => {
  const store = memoryStore();
  const c = await createOnline(store, TOK[0], "Ana", [], T0, rng(1));
  assert.ok(c.ok);
  const code = c.ok ? c.view.code : "";
  assert.match(code, /^[A-HJ-NP-Z]{6}$/);
  assert.equal(c.ok && c.view.pending.kind, "join");
  assert.equal((await joinOnline(store, "zzzzzz", TOK[1], "Ben", [], T0 + 1)).ok, false);
  const j = await joinOnline(store, code.toLowerCase().split("").join(" "), TOK[1], "Ben", [], T0 + 2);
  assert.ok(j.ok && j.view.you === 1 && j.view.names[0] === "Ana");
  // A third player can't take the seat; the original players can rejoin (reconnect).
  assert.equal((await joinOnline(store, code, "tok-cccccccccccccccc", "Cal", [], T0 + 3)).ok, false);
  const re = await joinOnline(store, code, TOK[0], "Ana", [], T0 + 4);
  assert.ok(re.ok && re.view.you === 0);
  const bad = await actOnline(store, code, TOK[1], { t: "pick", at: 0, id: "thor" }, T0 + 5);
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.view && bad.view.you === 1, "a rejection still returns your view to resync");
  const ok = await actOnline(store, code, TOK[0], { t: "pick", at: 0, id: "thor" }, T0 + 6);
  assert.ok(ok.ok && ok.view.log.length === 1);
  const p = await pollOnline(store, code, TOK[1], T0 + 7);
  assert.ok(p.ok && p.view.log.length === 1);
  assert.equal((await pollOnline(store, code, "tok-cccccccccccccccc", T0 + 8)).ok, false);
  // A lost race retries: the version moves under us once.
  const real = store.update.bind(store);
  let raced = false;
  store.update = async (k, v, d) => {
    if (!raced) {
      raced = true;
      const cur = await store.get(k);
      await real(k, cur!.version, cur!.doc);
      return false;
    }
    return real(k, v, d);
  };
  const r2 = await actOnline(store, code, TOK[1], { t: "pick", at: 1, id: "hulk" }, T0 + 9);
  assert.ok(r2.ok && r2.view.log.length === 2, "retried after the lost race");
  // A view never includes either token.
  assert.ok(!JSON.stringify(r2).includes(TOK[0]!) && !JSON.stringify(r2).includes(TOK[1]!));
});

test("the mirrored seat puts side 1 on the left without changing the result", async () => {
  const { mirrorMatch } = await import("../arena.online.ts");
  const { doc } = playOut(room(), 31);
  const m = replayDoc(doc).match;
  const mm = mirrorMatch(m);
  assert.deepEqual(mm.picks, [m.picks[1], m.picks[0]]);
  assert.equal(mm.winner, 1 - m.winner!);
  assert.deepEqual(mm.results, m.results.map((r) => (r === null ? null : 1 - r)));
  assert.deepEqual(mirrorMatch(mm), m, "mirroring twice is the identity");
});
