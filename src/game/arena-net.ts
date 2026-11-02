/**
 * Arena online server functions. The client only ever sends commands; the server owns the room,
 * checks every command against the deterministic Arena engine and returns that player's view.
 */
import { createServerFn } from "@tanstack/react-start";

const LIVES_MAX = 5;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const lives = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(0, LIVES_MAX) : []);

async function store() {
  const { sqlStore } = await import("./arena.rooms.server");
  return sqlStore;
}

export const arenaCreate = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = obj(input);
    return { token: String(d.token ?? ""), name: String(d.name ?? "").slice(0, 40), lives: lives(d.lives) };
  })
  .handler(async ({ data }) => {
    const { createOnline } = await import("./arena.service");
    try {
      return await createOnline(await store(), data.token, data.name, data.lives, Date.now());
    } catch (err) {
      console.error("[arena] create failed", err);
      return { ok: false as const, error: "The Arena server is unreachable. Try again in a moment." };
    }
  });

export const arenaJoin = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = obj(input);
    return { code: String(d.code ?? "").slice(0, 12), token: String(d.token ?? ""), name: String(d.name ?? "").slice(0, 40), lives: lives(d.lives) };
  })
  .handler(async ({ data }) => {
    const { joinOnline } = await import("./arena.service");
    try {
      return await joinOnline(await store(), data.code, data.token, data.name, data.lives, Date.now());
    } catch (err) {
      console.error("[arena] join failed", err);
      return { ok: false as const, error: "The Arena server is unreachable. Try again in a moment." };
    }
  });

export const arenaPoll = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = obj(input);
    return { code: String(d.code ?? "").slice(0, 12), token: String(d.token ?? "") };
  })
  .handler(async ({ data }) => {
    const { pollOnline } = await import("./arena.service");
    try {
      return await pollOnline(await store(), data.code, data.token, Date.now());
    } catch (err) {
      console.error("[arena] poll failed", err);
      return { ok: false as const, error: "offline" };
    }
  });

export const arenaAct = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = obj(input);
    const c = obj(d.cmd);
    const cmd = {
      t: String(c.t ?? ""),
      at: typeof c.at === "number" ? c.at : typeof c.at === "string" ? c.at.slice(0, 12) : undefined,
      id: typeof c.id === "string" ? c.id.slice(0, 64) : undefined,
      order: Array.isArray(c.order) ? c.order.slice(0, 3).map((x) => String(x).slice(0, 64)) : undefined,
      move: typeof c.move === "string" ? c.move.slice(0, 80) : undefined,
      feint: typeof c.feint === "string" ? c.feint.slice(0, 12) : null,
      round: typeof c.round === "number" ? c.round : undefined,
    };
    return { code: String(d.code ?? "").slice(0, 12), token: String(d.token ?? ""), cmd };
  })
  .handler(async ({ data }) => {
    const { actOnline } = await import("./arena.service");
    try {
      return await actOnline(await store(), data.code, data.token, data.cmd, Date.now());
    } catch (err) {
      console.error("[arena] act failed", err);
      return { ok: false as const, error: "Couldn't reach the Arena server. Try that again." };
    }
  });
