/**
 * Arena online: the room rules, as pure functions over a plain JSON document.
 *
 * The server owns one `RoomDoc` per invite code. Players send commands; the server checks each one
 * against the deterministic engine (`arena.ts`) and appends it to a public event log. Hidden info
 * (each side's fight order, and the leader's move this turn) is held in `doc.hidden` and only goes
 * into the log once the other side has committed too, so neither client can peek. Both clients
 * replay the public log through the same engine, so there is no game state to keep in sync.
 *
 * Time is passed in (`now`), never read, so timeouts are testable: on every request the server
 * first calls `settle`, which plays "Catch a breath" (or an auto pick) for whoever ran out the
 * clock, and forfeits a side on its third timeout.
 *
 * Storage lives elsewhere (`arena.rooms.server.ts`); this file has no I/O.
 */
import {
  arenaRefusal, clinched, draftPick, draftTurn, fighterOf, finish, hashSeed, matchTurn, moveByKey, movesOf, newMatch, nextRound,
  registerFighter, setOrder, STYLES, taken, tellOf, TIER, type ArenaAction, type ArenaMatch, type BoutState, type Side, type Tell,
} from "./arena";
import { keyOf } from "./duel";
import { ARENA_ROSTER, arenaCooldown, arenaCost, type ArenaFighter, type PassiveKind } from "./arena.roster";
import type { CostumeSlot, DuelMove, MoveStyle } from "./types";

export const TURN_MS = 30_000;
export const ORDER_MS = 45_000;
export const READY_MS = 20_000;
export const MAX_TIMEOUTS = 3;
/** A lobby nobody joined, or a finished room, is dropped after this long without activity. */
export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
/** A player who hasn't polled for this long is shown as "connection lost". */
export const AWAY_MS = 8_000;
export const MAX_LIVES = 5;
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O: they read as 1 and 0

export type RoomCmd =
  | { t: "pick"; at: number; id: string }
  | { t: "order"; order: string[] }
  | { t: "move"; at: string; move: string; feint?: MoveStyle | null }
  | { t: "ready"; round: number }
  | { t: "leave" }
  | { t: "rematch" };

export type RoomEvent =
  | { t: "pick"; s: Side; id: string; auto?: boolean }
  | { t: "orders"; o: [string[], string[]]; auto?: [boolean, boolean] }
  | { t: "turn"; a: [ArenaAction, ArenaAction]; auto?: [boolean, boolean] }
  | { t: "next" }
  | { t: "forfeit"; s: Side; why: "quit" | "timeout" };

export interface RoomPlayer {
  token: string;
  name: string;
  lives: ArenaFighter[];
  seen: number;
  left?: boolean;
}

export interface RoomDoc {
  v: 1;
  code: string;
  /** Rematch counter: 0 for the first match. */
  game: number;
  seed: number;
  created: number;
  updated: number;
  players: [RoomPlayer, RoomPlayer | null];
  log: RoomEvent[];
  hidden: { orders: [string[] | null, string[] | null]; lead: ArenaAction | null; ready: [boolean, boolean] };
  timeouts: [number, number];
  /** When the current wait began (its deadline is since + the phase's clock). */
  since: number;
  rematch: [boolean, boolean];
  /** The leader ran out the clock and was given a breath (shown as "auto" in the log). */
  autoLead?: boolean;
  /** The host closed the lobby before anyone joined. */
  closed?: boolean;
}

export type WaitKind = "join" | "pick" | "order" | "lead" | "answer" | "ready" | "over" | "closed";
export interface Pending {
  kind: WaitKind;
  sides: Side[];
  deadline: number | null;
}

/** What one player is allowed to see. Never contains tokens or the other side's hidden commits. */
export interface RoomView {
  code: string;
  game: number;
  seed: number;
  you: Side;
  names: [string, string | null];
  lives: [ArenaFighter[], ArenaFighter[]];
  log: RoomEvent[];
  pending: Pending;
  /** The leader's tell, once the leader has committed (only sent to the follower). */
  tell: Tell | null;
  /** Your own hidden commits, so a reload shows "locked" instead of asking again. */
  myOrder: string[] | null;
  myLead: ArenaAction | null;
  committed: { orders: [boolean, boolean]; lead: boolean; ready: [boolean, boolean] };
  timeouts: [number, number];
  /** Milliseconds since each side last checked in (null = no second player yet). */
  seenAgo: [number, number | null];
  rematch: [boolean, boolean];
  left: [boolean, boolean];
  now: number;
}

export interface Replayed {
  match: ArenaMatch;
  forfeit: { s: Side; why: "quit" | "timeout" } | null;
}

// ─── Codes, seeds, pools ─────────────────────────────────────────────────────────

export function makeCode(rand: () => number): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_LETTERS[Math.floor(rand() * CODE_LETTERS.length)]!;
  return s;
}

export function normalizeCode(raw: string): string | null {
  const c = String(raw ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  return c.length === 6 && [...c].every((ch) => CODE_LETTERS.includes(ch)) ? c : null;
}

export function validToken(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(t);
}

export function gameSeed(code: string, game: number, created: number): number {
  return hashSeed("arena-online", code, game, created);
}

export function lifeId(code: string, side: Side, i: number): string {
  return `net-${code}-${side}-${i}`;
}

export function poolOf(doc: Pick<RoomDoc, "players">): string[] {
  return [...ARENA_ROSTER.map((f) => f.id), ...(doc.players[0]?.lives ?? []).map((f) => f.id), ...(doc.players[1]?.lives ?? []).map((f) => f.id)];
}

/** Saved-life fighters live in a module registry; every replay (client or server) registers the room's. */
export function registerRoomLives(lives: [ArenaFighter[], ArenaFighter[]] | RoomPlayer[]): void {
  const lists = (lives as unknown[]).map((x) => (Array.isArray(x) ? x : ((x as RoomPlayer | null)?.lives ?? []))) as ArenaFighter[][];
  for (const list of lists) for (const f of list) registerFighter(f);
}

// ─── Saved-life fighters from the wire ───────────────────────────────────────────

const LIFE_PASSIVES = new Set<PassiveKind>(["worthy", "speedster", "rage", "bulwark", "regen", "steel", "prep"]);
const KINDS = new Set(["burst", "area", "status", "guard", "dash"]);
const SLOTS: CostumeSlot[] = ["cowl", "chest", "cape", "gloves", "boots", "emblem"];
const str = (v: unknown, max: number, dflt = ""): string =>
  typeof v === "string" ? [...v].filter((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127).join("").slice(0, max) : dflt;
const int = (v: unknown, lo: number, hi: number, dflt: number): number => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : dflt);

/**
 * Rebuild a saved-life fighter sent by a client so it can't cheat: powers are clamped to the Arena's
 * 5–9 band, costs and cooldowns are re-derived, HP is fixed, the passive must be one a life can earn,
 * and every move id is reassigned. Returns null when the shape is unusable.
 */
export function sanitizeLife(raw: unknown, id: string): ArenaFighter | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<ArenaFighter>;
  if (!Array.isArray(f.moves) || f.moves.length !== 6) return null;
  const moves: DuelMove[] = [];
  for (let i = 0; i < 6; i++) {
    const m = f.moves[i] as Partial<DuelMove> | undefined;
    if (!m || typeof m !== "object") return null;
    const style = m.style as MoveStyle;
    if (!STYLES.includes(style)) return null;
    const kind = typeof m.kind === "string" && KINDS.has(m.kind) ? (m.kind as DuelMove["kind"]) : undefined;
    const power = int(m.power, 5, 9, 6);
    moves.push({
      id: `${id}-m${i}`,
      name: str(m.name, 32, `Move ${i + 1}`) || `Move ${i + 1}`,
      blurb: str(m.blurb, 90),
      power,
      style,
      kind,
      element: typeof m.element === "string" ? str(m.element, 16) : undefined,
      energy: arenaCost(power, kind),
      cooldown: arenaCooldown(power, kind),
    });
  }
  for (const s of STYLES) if (!moves.some((m) => m.style === s)) return null;
  const pk = f.passive?.kind as PassiveKind;
  const passive = LIFE_PASSIVES.has(pk) ? { kind: pk, name: str(f.passive?.name, 24, "Instinct"), text: str(f.passive?.text, 90) } : { kind: "prep" as PassiveKind, name: "Read the Room", text: "+1 energy every turn." };
  const life = f.life && typeof f.life === "object" ? f.life : null;
  const look = life?.look && typeof life.look === "object" ? life.look : null;
  const ward = life?.wardrobe && typeof life.wardrobe === "object" ? life.wardrobe : null;
  const worn: Partial<Record<CostumeSlot, string>> = {};
  if (ward?.worn && typeof ward.worn === "object") for (const s of SLOTS) { const v = (ward.worn as Record<string, unknown>)[s]; if (typeof v === "string") worn[s] = str(v, 40); }
  const age = int(life?.age, 14, 120, 30);
  const sex = f.sex === "female" ? "female" : "male";
  return {
    id,
    name: str(f.name, 24, "Rookie").trim() || "Rookie",
    title: `Their life · age ${age}`,
    side: "hero",
    world: "spider-man",
    color: "#e6b34d",
    sex,
    hp: 104,
    passive,
    moves,
    tint: { suit: "#2a3a5a", trim: "#e6b34d", mask: "domino" },
    seed: int(f.seed, 0, 2 ** 31, 7),
    life: {
      look: { skin: int(look?.skin, 0, 40, 2), hair: int(look?.hair, 0, 40, 1), style: int(look?.style, 0, 40, 0), build: int(look?.build, 0, 40, 0), feature: int(look?.feature, 0, 40, 0) },
      wardrobe: { owned: Array.isArray(ward?.owned) ? ward!.owned.filter((x): x is string => typeof x === "string").slice(0, 40).map((x) => str(x, 40)) : [], worn },
      age,
      sex: life?.sex === "female" ? "female" : life?.sex === "male" ? "male" : sex,
    },
    custom: true,
  };
}

export function cleanName(raw: unknown): string {
  return str(raw, 18).trim() || "Challenger";
}

// ─── Room lifecycle ──────────────────────────────────────────────────────────────

export function createRoom(code: string, token: string, name: string, lives: unknown[], now: number): RoomDoc {
  const doc: RoomDoc = {
    v: 1,
    code,
    game: 0,
    seed: gameSeed(code, 0, now),
    created: now,
    updated: now,
    players: [{ token, name: cleanName(name), lives: [], seen: now }, null],
    log: [],
    hidden: { orders: [null, null], lead: null, ready: [false, false] },
    timeouts: [0, 0],
    since: now,
    rematch: [false, false],
  };
  doc.players[0].lives = cleanLives(code, 0, lives);
  return doc;
}

function cleanLives(code: string, side: Side, lives: unknown[]): ArenaFighter[] {
  const out: ArenaFighter[] = [];
  for (const raw of (Array.isArray(lives) ? lives : []).slice(0, MAX_LIVES)) {
    const f = sanitizeLife(raw, lifeId(code, side, out.length));
    if (f) out.push(f);
  }
  return out;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Which side a token plays, or null. */
export function sideOf(doc: RoomDoc, token: string): Side | null {
  if (doc.players[0].token === token) return 0;
  if (doc.players[1]?.token === token) return 1;
  return null;
}

export function joinRoom(doc: RoomDoc, token: string, name: string, lives: unknown[], now: number): Result<{ doc: RoomDoc; side: Side }> {
  const mine = sideOf(doc, token);
  if (mine !== null) return { ok: true, value: { doc: touch(doc, mine, now), side: mine } };
  if (doc.closed) return fail("That room was closed by its host.");
  if (doc.players[1]) return fail("That room is already full.");
  const next = clone(doc);
  next.players[1] = { token, name: cleanName(name), lives: cleanLives(doc.code, 1, lives), seen: now };
  next.since = now;
  next.updated = now;
  return { ok: true, value: { doc: next, side: 1 } };
}

/** Rebuild the match from the public log. Throws only if the log itself is corrupt. */
export function replay(seed: number, pool: string[], log: RoomEvent[]): Replayed {
  let match = newMatch(seed, pool);
  let forfeit: Replayed["forfeit"] = null;
  for (const e of log) {
    if (e.t === "pick") match = draftPick(match, e.s, e.id);
    else if (e.t === "orders") match = setOrder(setOrder(match, 0, e.o[0]), 1, e.o[1]);
    else if (e.t === "turn") match = matchTurn(match, e.a);
    else if (e.t === "next") match = advance(match);
    else if (e.t === "forfeit") {
      forfeit = { s: e.s, why: e.why };
      match = { ...match, stage: "done", winner: (1 - e.s) as Side };
    }
  }
  return { match, forfeit };
}

/** After both sides tap on from a finished bout: next round, or the result once it's clinched. */
export function advance(m: ArenaMatch): ArenaMatch {
  const n = nextRound(m);
  return n.stage === "bout" && clinched(n) ? finish(n) : n;
}

export function replayDoc(doc: RoomDoc): Replayed {
  registerRoomLives(doc.players.map((p) => p ?? { lives: [] }) as RoomPlayer[]);
  return replay(doc.seed, poolOf(doc), doc.log);
}

export function pendingOf(doc: RoomDoc, r: Replayed = replayDoc(doc)): Pending {
  if (doc.closed) return { kind: "closed", sides: [], deadline: null };
  if (!doc.players[1]) return { kind: "join", sides: [1], deadline: null };
  const m = r.match;
  if (m.stage === "done") return { kind: "over", sides: [], deadline: null };
  if (m.stage === "draft") return { kind: "pick", sides: [draftTurn(m)!], deadline: doc.since + TURN_MS };
  if (m.stage === "order") {
    const sides = ([0, 1] as Side[]).filter((s) => !doc.hidden.orders[s]);
    return { kind: "order", sides, deadline: doc.since + ORDER_MS };
  }
  const b = m.bout!;
  if (b.done) return { kind: "ready", sides: ([0, 1] as Side[]).filter((s) => !doc.hidden.ready[s]), deadline: doc.since + READY_MS };
  if (!doc.hidden.lead) return { kind: "lead", sides: [b.leader], deadline: doc.since + TURN_MS };
  return { kind: "answer", sides: [(1 - b.leader) as Side], deadline: doc.since + TURN_MS };
}

/** The stamp a move command must carry: round and turn, so a late tap can't land on the next turn. */
export function turnStamp(m: ArenaMatch): string {
  return `${m.round}:${m.bout?.turn ?? 0}`;
}

/** The auto pick when the draft clock runs out: the best fighter left by the balance table. */
export function autoPick(m: ArenaMatch): string {
  const used = taken(m);
  const left = m.pool.filter((id) => !used.has(id));
  return left.reduce((best, id) => ((TIER[id] ?? 0.5) > (TIER[best] ?? 0.5) ? id : best), left[0]!);
}

/**
 * Apply every clock that has run out by `now`. Chains: a player who is gone for 90 s collects all
 * three timeouts even if nobody polled in between. Returns the same object when nothing expired.
 */
export function settle(doc: RoomDoc, now: number): RoomDoc {
  let d = doc;
  for (let guard = 0; guard < 64; guard++) {
    const r = replayDoc(d);
    const p = pendingOf(d, r);
    if (p.deadline === null || now < p.deadline || !p.sides.length) return d;
    if (d === doc) d = clone(doc);
    const m = r.match;
    const at = p.deadline;
    if (p.kind !== "ready") {
      for (const s of p.sides) d.timeouts[s] += 1;
      const out = p.sides.filter((s) => d.timeouts[s] >= MAX_TIMEOUTS);
      if (out.length) {
        const s = out.length > 1 ? (d.timeouts[0] >= d.timeouts[1] ? 0 : 1) : out[0]!;
        d.log.push({ t: "forfeit", s, why: "timeout" });
        d.hidden = { orders: [null, null], lead: null, ready: [false, false] };
        d.since = at;
        d.updated = at;
        continue;
      }
    }
    if (p.kind === "pick") d.log.push({ t: "pick", s: p.sides[0]!, id: autoPick(m), auto: true });
    else if (p.kind === "order") {
      const o: [string[], string[]] = [d.hidden.orders[0] ?? [...m.picks[0]], d.hidden.orders[1] ?? [...m.picks[1]]];
      d.log.push({ t: "orders", o, auto: [!d.hidden.orders[0], !d.hidden.orders[1]] });
      d.hidden.orders = [null, null];
    } else if (p.kind === "lead") {
      // The leader timed out: their lead is a breath, and the follower still gets a full clock to answer it.
      d.hidden.lead = { move: "breath" };
      d.since = at;
      d.updated = at;
      d.autoLead = true;
      continue;
    } else if (p.kind === "answer") {
      const lead = d.hidden.lead!;
      const leader = m.bout!.leader;
      const a: [ArenaAction, ArenaAction] = leader === 0 ? [lead, { move: "breath" }] : [{ move: "breath" }, lead];
      const auto: [boolean, boolean] = [false, false];
      auto[(1 - leader) as Side] = true;
      if (d.autoLead) auto[leader] = true;
      d.log.push({ t: "turn", a, auto });
      d.hidden.lead = null;
      delete d.autoLead;
      if (m.bout && matchTurn(m, a).bout?.done) d.hidden.ready = [false, false];
    } else if (p.kind === "ready") {
      d.log.push({ t: "next" });
      d.hidden.ready = [false, false];
    }
    d.since = at;
    d.updated = at;
  }
  return d;
}

function clone(doc: RoomDoc): RoomDoc {
  return JSON.parse(JSON.stringify(doc)) as RoomDoc;
}

function touch(doc: RoomDoc, side: Side, now: number): RoomDoc {
  const p = doc.players[side];
  if (!p || now - p.seen < 3000) return doc;
  const next = clone(doc);
  next.players[side]!.seen = now;
  return next;
}

/** Mark a poll: settle the clocks and record that this player is still here. */
export function pollRoom(doc: RoomDoc, side: Side, now: number): RoomDoc {
  return touch(settle(doc, now), side, now);
}

/**
 * Check one command against the rules and apply it. Every rejection is a plain sentence for the UI.
 * The caller should always `settle` first (this does it too, so a late command sees the timeout).
 */
export function applyCmd(input: RoomDoc, side: Side, cmd: RoomCmd, now: number): Result<RoomDoc> {
  const settled = settle(input, now);
  const doc = clone(settled);
  doc.players[side]!.seen = now;
  const r = replayDoc(doc);
  const m = r.match;
  const done = (d: RoomDoc): Result<RoomDoc> => {
    d.updated = now;
    return { ok: true, value: d };
  };
  if (!cmd || typeof cmd !== "object") return fail("Unknown command.");

  if (cmd.t === "leave") {
    if (!doc.players[1]) {
      if (side === 0) doc.closed = true;
      return done(doc);
    }
    if (m.stage !== "done") {
      doc.log.push({ t: "forfeit", s: side, why: "quit" });
      doc.hidden = { orders: [null, null], lead: null, ready: [false, false] };
    }
    doc.players[side]!.left = true;
    doc.rematch = [false, false];
    return done(doc);
  }
  if (!doc.players[1]) return fail("Waiting for your rival to join.");
  if (cmd.t === "rematch") {
    if (m.stage !== "done") return fail("The match isn't over yet.");
    const other = (1 - side) as Side;
    if (doc.players[other]!.left) return fail("Your rival has left the room.");
    doc.rematch[side] = true;
    if (doc.rematch[0] && doc.rematch[1]) {
      doc.game += 1;
      doc.seed = gameSeed(doc.code, doc.game, doc.created);
      doc.log = [];
      doc.hidden = { orders: [null, null], lead: null, ready: [false, false] };
      doc.timeouts = [0, 0];
      doc.rematch = [false, false];
      doc.since = now;
    }
    return done(doc);
  }
  if (m.stage === "done") return fail("The match is over.");

  if (cmd.t === "pick") {
    if (m.stage !== "draft") return fail("The draft is over.");
    const n = m.picks[0].length + m.picks[1].length;
    if (draftTurn(m) !== side) return fail("It's your rival's pick.");
    if (cmd.at !== n) return fail("That pick is stale. The draft moved on.");
    if (typeof cmd.id !== "string" || !m.pool.includes(cmd.id) || taken(m).has(cmd.id)) return fail("That fighter isn't available.");
    doc.log.push({ t: "pick", s: side, id: cmd.id });
    doc.since = now;
    return done(doc);
  }
  if (cmd.t === "order") {
    if (m.stage !== "order") return fail("It's not time to set the order.");
    if (doc.hidden.orders[side]) return fail("Your order is already locked.");
    try {
      setOrder(m, side, Array.isArray(cmd.order) ? cmd.order.map(String) : []);
    } catch {
      return fail("That order isn't your three fighters.");
    }
    doc.hidden.orders[side] = cmd.order.map(String);
    if (doc.hidden.orders[0] && doc.hidden.orders[1]) {
      doc.log.push({ t: "orders", o: [doc.hidden.orders[0], doc.hidden.orders[1]] });
      doc.hidden.orders = [null, null];
      doc.since = now;
    }
    return done(doc);
  }
  if (cmd.t === "ready") {
    if (m.stage !== "bout" || !m.bout?.done) return fail("The round isn't over.");
    if (cmd.round !== m.round) return fail("That round is already over.");
    doc.hidden.ready[side] = true;
    if (doc.hidden.ready[0] && doc.hidden.ready[1]) {
      doc.log.push({ t: "next" });
      doc.hidden.ready = [false, false];
      doc.since = now;
    }
    return done(doc);
  }
  if (cmd.t === "move") {
    if (m.stage !== "bout" || !m.bout || m.bout.done) return fail("There's no turn to play.");
    if (cmd.at !== turnStamp(m)) return fail("That turn is already over.");
    const b = m.bout;
    const fs = b.fighters[side];
    const key = String(cmd.move ?? "");
    const move = key === "breath" ? null : movesOf(fs.id).find((x) => keyOf(x) === key);
    if (key !== "breath" && !move) return fail("That isn't one of your fighter's moves.");
    const leading = b.leader === side;
    const feint = leading && cmd.feint && STYLES.includes(cmd.feint) ? cmd.feint : null;
    if (cmd.feint && !leading) return fail("Only the leader can fake a tell.");
    if (move) {
      const no = arenaRefusal(fs, move, feint);
      if (no) return fail(no);
    }
    const action: ArenaAction = feint && move && feint !== move.style ? { move: key, feint } : { move: key };
    if (leading) {
      if (doc.hidden.lead) return fail("You've already led this turn.");
      doc.hidden.lead = action;
      doc.since = now;
      return done(doc);
    }
    if (!doc.hidden.lead) return fail("Wait for your rival's lead.");
    const a: [ArenaAction, ArenaAction] = side === 0 ? [action, doc.hidden.lead] : [doc.hidden.lead, action];
    const auto: [boolean, boolean] | undefined = doc.autoLead ? (side === 0 ? [false, true] : [true, false]) : undefined;
    doc.log.push(auto ? { t: "turn", a, auto } : { t: "turn", a });
    doc.hidden.lead = null;
    delete doc.autoLead;
    if (matchTurn(m, a).bout?.done) doc.hidden.ready = [false, false];
    doc.since = now;
    return done(doc);
  }
  return fail("Unknown command.");
}

/** The leader's tell for the follower. The feint flag is stripped: that's what the follower must guess. */
export function publicTell(doc: RoomDoc, m: ArenaMatch): Tell | null {
  if (!doc.hidden.lead || m.stage !== "bout" || !m.bout || m.bout.done) return null;
  const t = tellOf(m.bout, doc.hidden.lead);
  return { style: t.style, feint: false, charged: t.charged };
}

export function viewFor(doc: RoomDoc, side: Side, now: number): RoomView {
  const r = replayDoc(doc);
  const m = r.match;
  const pending = pendingOf(doc, r);
  const follower = m.stage === "bout" && m.bout && !m.bout.done ? ((1 - m.bout.leader) as Side) : null;
  return {
    code: doc.code,
    game: doc.game,
    seed: doc.seed,
    you: side,
    names: [doc.players[0].name, doc.players[1]?.name ?? null],
    lives: [doc.players[0].lives, doc.players[1]?.lives ?? []],
    log: doc.log,
    pending,
    tell: follower === side ? publicTell(doc, m) : null,
    myOrder: doc.hidden.orders[side],
    myLead: m.stage === "bout" && m.bout?.leader === side ? (doc.autoLead ? null : doc.hidden.lead) : null,
    committed: { orders: [!!doc.hidden.orders[0], !!doc.hidden.orders[1]], lead: !!doc.hidden.lead, ready: [...doc.hidden.ready] },
    timeouts: [...doc.timeouts],
    seenAgo: [now - doc.players[0].seen, doc.players[1] ? now - doc.players[1].seen : null],
    rematch: [...doc.rematch],
    left: [!!doc.players[0].left, !!doc.players[1]?.left],
    now,
  };
}

/** Client side: rebuild the match a view describes (registers the room's saved-life fighters first). */
export function replayView(v: Pick<RoomView, "seed" | "lives" | "log">): Replayed {
  registerRoomLives(v.lives);
  const pool = [...ARENA_ROSTER.map((f) => f.id), ...v.lives[0].map((f) => f.id), ...v.lives[1].map((f) => f.id)];
  return replay(v.seed, pool, v.log);
}

/** True when a stored room has been idle long enough to drop. */
export function expired(doc: RoomDoc, now: number): boolean {
  return now - doc.updated > ROOM_TTL_MS;
}

/** Exposed for tests: is this move key legal for this side right now? */
export function legalMove(m: ArenaMatch, side: Side, key: string): boolean {
  if (!m.bout) return false;
  const fs = m.bout.fighters[side];
  if (key === "breath") return true;
  const mv = movesOf(fs.id).find((x) => keyOf(x) === key);
  return !!mv && !arenaRefusal(fs, mv) && moveByKey(fs.id, key) === mv && !!fighterOf(fs.id);
}

// ─── Display: everyone sees themselves on the left ───────────────────────────────

const sw = <T>(p: [T, T]): [T, T] => [p[1], p[0]];
const flip = (s: Side | null): Side | null => (s === null ? null : ((1 - s) as Side));

export function mirrorBout(b: BoutState): BoutState {
  return {
    ...b,
    fighters: sw(b.fighters),
    leader: flip(b.leader)!,
    winner: flip(b.winner),
    log: b.log.map((l) => ({ ...l, leader: flip(l.leader)!, moves: sw(l.moves), dealt: sw(l.dealt), chip: sw(l.chip), healed: sw(l.healed), edge: flip(l.edge), revive: flip(l.revive) })),
    feints: sw(b.feints),
    leadsSeen: sw(b.leadsSeen),
  };
}

/** The match as side 1 sees it: their picks, orders, wins and fighter on side 0. Display only. */
export function mirrorMatch(m: ArenaMatch): ArenaMatch {
  return {
    ...m,
    picks: sw(m.picks),
    orders: sw(m.orders),
    results: m.results.map(flip),
    margins: m.margins.map((x) => sw(x)),
    winner: flip(m.winner),
    bout: m.bout ? mirrorBout(m.bout) : null,
  };
}

/** The match from `you`'s seat. */
export function seatMatch(m: ArenaMatch, you: Side): ArenaMatch {
  return you === 0 ? m : mirrorMatch(m);
}
