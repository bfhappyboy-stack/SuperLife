-- Arena online: one row per room, keyed by its 6-letter invite code.
-- `doc` is the whole room (players, the public event log and the hidden commits); see
-- src/game/arena.online.ts. `version` is bumped on every write for optimistic locking.
create table if not exists arena_rooms (
  code text primary key,
  version integer not null default 0,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists arena_rooms_updated_at on arena_rooms (updated_at);
