/**
 * Arena online: the request handlers, over any room store. The server functions in `arena-net.ts`
 * plug in the Postgres store; tests plug in the in-memory one. Every write is optimistic: read the
 * room and its version, apply the rules, write only if nobody else wrote first, else retry.
 */
import {
  applyCmd, createRoom, expired, joinRoom, makeCode, normalizeCode, pollRoom, sideOf, validToken, viewFor,
  type Result, type RoomCmd, type RoomDoc, type RoomView,
} from "./arena.online";

export interface RoomStore {
  get(code: string): Promise<{ doc: RoomDoc; version: number } | null>;
  /** Insert a new room; false if the code is taken. */
  insert(code: string, doc: RoomDoc): Promise<boolean>;
  /** Write only if the stored version still matches; false on a lost race. */
  update(code: string, version: number, doc: RoomDoc): Promise<boolean>;
  remove?(code: string): Promise<void>;
}

export function memoryStore(): RoomStore & { rooms: Map<string, { doc: RoomDoc; version: number }> } {
  const rooms = new Map<string, { doc: RoomDoc; version: number }>();
  const copy = (d: RoomDoc): RoomDoc => JSON.parse(JSON.stringify(d)) as RoomDoc;
  return {
    rooms,
    async get(code) {
      const r = rooms.get(code);
      return r ? { doc: copy(r.doc), version: r.version } : null;
    },
    async insert(code, doc) {
      if (rooms.has(code)) return false;
      rooms.set(code, { doc: copy(doc), version: 0 });
      return true;
    },
    async update(code, version, doc) {
      const r = rooms.get(code);
      if (!r || r.version !== version) return false;
      rooms.set(code, { doc: copy(doc), version: version + 1 });
      return true;
    },
    async remove(code) {
      rooms.delete(code);
    },
  };
}

export type NetReply = { ok: true; view: RoomView } | { ok: false; error: string; view?: RoomView };

const NOT_FOUND = "No room with that code. Check it with your friend.";

export async function createOnline(store: RoomStore, token: unknown, name: unknown, lives: unknown, now: number, rand: () => number = Math.random): Promise<NetReply> {
  if (!validToken(token)) return { ok: false, error: "Bad player id. Reload and try again." };
  for (let i = 0; i < 8; i++) {
    const code = makeCode(rand);
    const old = await store.get(code);
    if (old && !expired(old.doc, now)) continue;
    const doc = createRoom(code, token, String(name ?? ""), Array.isArray(lives) ? lives : [], now);
    if (old) {
      if (!(await store.update(code, old.version, doc))) continue;
    } else if (!(await store.insert(code, doc))) continue;
    return { ok: true, view: viewFor(doc, 0, now) };
  }
  return { ok: false, error: "Couldn't make a room. Try again." };
}

async function mutate(
  store: RoomStore,
  rawCode: unknown,
  token: unknown,
  now: number,
  step: (doc: RoomDoc) => Result<{ doc: RoomDoc; side: 0 | 1 }>,
): Promise<NetReply> {
  const code = normalizeCode(String(rawCode ?? ""));
  if (!code) return { ok: false, error: "Room codes are 6 letters." };
  if (!validToken(token)) return { ok: false, error: "Bad player id. Reload and try again." };
  for (let attempt = 0; attempt < 6; attempt++) {
    const row = await store.get(code);
    if (!row || expired(row.doc, now)) return { ok: false, error: NOT_FOUND };
    const r = step(row.doc);
    if (!r.ok) {
      const side = sideOf(row.doc, token);
      return { ok: false, error: r.error, view: side === null ? undefined : viewFor(row.doc, side, now) };
    }
    const { doc, side } = r.value;
    if (doc === row.doc || (await store.update(code, row.version, doc))) return { ok: true, view: viewFor(doc, side, now) };
  }
  return { ok: false, error: "The room is busy. Try again." };
}

export function joinOnline(store: RoomStore, code: unknown, token: unknown, name: unknown, lives: unknown, now: number): Promise<NetReply> {
  return mutate(store, code, token, now, (doc) => joinRoom(doc, token as string, String(name ?? ""), Array.isArray(lives) ? lives : [], now));
}

export function pollOnline(store: RoomStore, code: unknown, token: unknown, now: number): Promise<NetReply> {
  return mutate(store, code, token, now, (doc) => {
    const side = sideOf(doc, token as string);
    if (side === null) return { ok: false, error: "You're not in this room." };
    return { ok: true, value: { doc: pollRoom(doc, side, now), side } };
  });
}

export function actOnline(store: RoomStore, code: unknown, token: unknown, cmd: unknown, now: number): Promise<NetReply> {
  return mutate(store, code, token, now, (doc) => {
    const side = sideOf(doc, token as string);
    if (side === null) return { ok: false, error: "You're not in this room." };
    const r = applyCmd(doc, side, cmd as RoomCmd, now);
    return r.ok ? { ok: true, value: { doc: r.value, side } } : r;
  });
}
