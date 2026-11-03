/** Arena online rooms in Postgres (Neon when deployed with a database, PGLite in preview). Server only. */
import { getSql } from "../lib/db";
import type { RoomDoc } from "./arena.online";
import type { RoomStore } from "./arena.service";

function parse(v: unknown): RoomDoc {
  return (typeof v === "string" ? JSON.parse(v) : v) as RoomDoc;
}

export const sqlStore: RoomStore = {
  async get(code) {
    const sql = await getSql();
    const rows = await sql<{ doc: unknown; version: number }>`select doc, version from arena_rooms where code = ${code}`;
    const row = rows[0];
    return row ? { doc: parse(row.doc), version: Number(row.version) } : null;
  },
  async insert(code, doc) {
    const sql = await getSql();
    const rows = await sql`insert into arena_rooms (code, version, doc) values (${code}, 0, ${JSON.stringify(doc)}::jsonb) on conflict (code) do nothing returning code`;
    // Housekeeping: rooms idle for two days are gone for good.
    void sql`delete from arena_rooms where updated_at < now() - interval '2 days'`.catch(() => undefined);
    return rows.length > 0;
  },
  async update(code, version, doc) {
    const sql = await getSql();
    const rows = await sql`update arena_rooms set doc = ${JSON.stringify(doc)}::jsonb, version = version + 1, updated_at = now() where code = ${code} and version = ${version} returning code`;
    return rows.length > 0;
  },
};
