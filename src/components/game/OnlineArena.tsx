/**
 * Arena online: lobby, waiting room and the live match against a friend.
 *
 * The server (src/game/arena-net.ts) owns the room and checks every command; this screen polls it,
 * rebuilds the match from the public log with the same engine, and reuses the vs-computer screens
 * from Arena.tsx with an online driver. You always sit on the left: side 1 sees a mirrored match.
 */
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Crown, Link2, LogOut, RefreshCcw, Share2, Swords, UserRound, Users, Wifi, WifiOff, X } from "lucide-react";
import {
  Battle, Draft, FighterArt, Header, Order, Results, Reveal, RoundIntro, type BattleNet,
} from "@/components/game/Arena";
import { buzz, RivalName } from "@/components/game/arena-context";
import { arenaAct, arenaCreate, arenaJoin, arenaPoll } from "@/game/arena-net";
import {
  AWAY_MS, MAX_TIMEOUTS, normalizeCode, replayView, seatMatch, turnStamp, type RoomCmd, type RoomView,
} from "@/game/arena.online";
import { draftTurn, type ArenaAction, type Side } from "@/game/arena";
import type { ArenaFighter } from "@/game/arena.roster";

const NET_KEY = "superlife.arena.net.v1";
const POLL_MS = 1200;

interface NetSave {
  token: string;
  name: string;
  code?: string;
  bring?: boolean;
}

type Reply = { ok: true; view: RoomView } | { ok: false; error: string; view?: RoomView };

function newToken(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  }
}

function loadNet(): NetSave {
  try {
    const s = JSON.parse(localStorage.getItem(NET_KEY) ?? "null") as NetSave | null;
    if (s && typeof s.token === "string" && s.token.length >= 16) return s;
  } catch {
    /* fall through */
  }
  return { token: newToken(), name: "" };
}

function storeNet(s: NetSave) {
  try {
    localStorage.setItem(NET_KEY, JSON.stringify(s));
  } catch {
    /* private mode: you just won't auto-rejoin after a reload */
  }
}

function inviteFromUrl(): string | null {
  try {
    return normalizeCode(new URLSearchParams(window.location.search).get("arena") ?? "");
  } catch {
    return null;
  }
}

function clearInviteUrl() {
  try {
    const u = new URL(window.location.href);
    if (!u.searchParams.has("arena")) return;
    u.searchParams.delete("arena");
    window.history.replaceState(null, "", u.toString());
  } catch {
    /* ignore */
  }
}

function inviteLink(code: string): string {
  const u = new URL(window.location.href);
  u.search = "";
  u.hash = "";
  u.searchParams.set("arena", code);
  return u.toString();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Only what the server needs to rebuild your saved heroes fairly (it re-derives the rest). */
function wireLives(lives: ArenaFighter[]): unknown[] {
  return lives.slice(0, 5).map((f) => ({ name: f.name, sex: f.sex, seed: f.seed, passive: f.passive, moves: f.moves, life: f.life }));
}

export function OnlineArena({ lives, onBack, onTitle }: { lives: ArenaFighter[]; onBack: () => void; onTitle: () => void }) {
  const [net, setNetState] = useState<NetSave>(loadNet);
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastOk, setLastOk] = useState(() => Date.now());
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [seen, setSeen] = useState<Record<string, true>>({});
  const epoch = useRef(0);
  const viewRef = useRef<RoomView | null>(null);
  viewRef.current = view;

  const setNet = useCallback((patch: Partial<NetSave>) => {
    setNetState((s) => {
      const next = { ...s, ...patch };
      storeNet(next);
      return next;
    });
  }, []);
  useEffect(() => storeNet(net), []); // eslint-disable-line react-hooks/exhaustive-deps

  const accept = useCallback((v: RoomView, at: number) => {
    const cur = viewRef.current;
    // Ignore a stale reply: an older game, or a shorter log than we already have.
    if (cur && cur.code === v.code && (v.game < cur.game || (v.game === cur.game && v.log.length < cur.log.length))) return;
    setView(v);
    setLastOk(Date.now());
    setSkew(v.now - at);
  }, []);

  const handle = useCallback(
    (r: Reply, at: number, mine: number) => {
      if (mine !== epoch.current) return;
      if (r.ok) {
        accept(r.view, at);
        return;
      }
      if (r.view) accept(r.view, at);
      if (r.error === "offline") return;
      if (!r.view) {
        // The room is gone or we're not in it: back to the lobby.
        setView(null);
        setNet({ code: undefined });
        setError(r.error);
      } else setToast(r.error);
    },
    [accept, setNet],
  );

  // Poll the room while we're in one. Every reply is a full view; nothing to merge.
  const code = net.code;
  useEffect(() => {
    if (!code) return;
    let alive = true;
    let timer = 0;
    const tick = async () => {
      const mine = epoch.current;
      const at = Date.now();
      try {
        const r = (await arenaPoll({ data: { code, token: net.token } })) as Reply;
        if (alive) handle(r, (at + Date.now()) / 2, mine);
      } catch {
        /* network blip: the pill shows "reconnecting" */
      }
      if (alive) timer = window.setTimeout(tick, document.hidden ? POLL_MS * 3 : POLL_MS);
    };
    void tick();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [code, net.token, handle]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const act = useCallback(
    async (cmd: RoomCmd) => {
      const v = viewRef.current;
      if (!v) return;
      const mine = ++epoch.current;
      const at = Date.now();
      try {
        const r = (await arenaAct({ data: { code: v.code, token: net.token, cmd } })) as Reply;
        handle(r, (at + Date.now()) / 2, mine);
      } catch {
        setToast("Couldn't reach the Arena server. Try that again.");
      }
    },
    [net.token, handle],
  );

  async function create(name: string, bring: boolean) {
    setPending(true);
    setError(null);
    setNet({ name, bring });
    const at = Date.now();
    try {
      const r = (await arenaCreate({ data: { token: net.token, name, lives: bring ? wireLives(lives) : [] } })) as Reply;
      if (r.ok) {
        epoch.current++;
        accept(r.view, at);
        setNet({ code: r.view.code });
      } else setError(r.error);
    } catch {
      setError("The Arena server is unreachable. Check your connection.");
    }
    setPending(false);
  }

  async function join(raw: string, name: string, bring: boolean) {
    const c = normalizeCode(raw);
    if (!c) {
      setError("Room codes are 6 letters.");
      return;
    }
    setPending(true);
    setError(null);
    setNet({ name, bring });
    const at = Date.now();
    try {
      const r = (await arenaJoin({ data: { code: c, token: net.token, name, lives: bring ? wireLives(lives) : [] } })) as Reply;
      if (r.ok) {
        epoch.current++;
        accept(r.view, at);
        setNet({ code: r.view.code });
        clearInviteUrl();
        buzz([20, 40, 20]);
      } else setError(r.error);
    } catch {
      setError("The Arena server is unreachable. Check your connection.");
    }
    setPending(false);
  }

  async function leaveRoom(then: () => void = () => undefined) {
    await act({ t: "leave" });
    epoch.current++;
    setView(null);
    setNet({ code: undefined });
    then();
  }

  // ─── Derived match ──────────────────────────────────────────────────────────────
  const logLen = view?.log.length ?? -1;
  const replayed = useMemo(() => (view ? replayView(view) : null), [view?.code, view?.game, view?.seed, logLen]); // eslint-disable-line react-hooks/exhaustive-deps
  const you: Side = view?.you ?? 0;
  const them = (1 - you) as Side;
  const rival = view?.names[them] ?? "Rival";
  const match = replayed ? seatMatch(replayed.match, you) : null;
  const serverNow = now + skew;
  const offline = !!code && now - lastOk > 4500;

  // A missed clock earns a toast, so an auto move is never a mystery.
  const myOuts = view?.timeouts[you] ?? 0;
  const prevOuts = useRef(myOuts);
  useEffect(() => {
    if (myOuts > prevOuts.current) {
      setToast(myOuts >= MAX_TIMEOUTS ? "Out of time, three times: that's a forfeit." : `Out of time: auto move. Strike ${myOuts} of ${MAX_TIMEOUTS}.`);
      buzz([60, 40, 60]);
    }
    prevOuts.current = myOuts;
  }, [myOuts]);

  const lobbyInvite = useMemo(inviteFromUrl, []);
  if (!view || !match || !replayed) {
    return (
      <Lobby
        lives={lives}
        initialName={net.name || lives[0]?.name || ""}
        initialBring={net.bring ?? lives.length > 0}
        invite={lobbyInvite}
        busy={pending}
        resuming={!!code && !error}
        error={error}
        onCreate={create}
        onJoin={join}
        onBack={() => {
          if (code) setNet({ code: undefined });
          clearInviteUrl();
          onBack();
        }}
      />
    );
  }

  const p = view.pending;
  const myTurn = p.sides.includes(you);
  const deadline = p.deadline;
  const left = deadline === null ? null : Math.max(0, deadline - serverNow);
  const awayFor = view.seenAgo[them] === null ? null : view.seenAgo[them]! + Math.max(0, now - lastOk);
  const rivalAway = awayFor !== null && awayFor > AWAY_MS && p.kind !== "over";
  const key = `${view.code}:${view.game}`;
  const mark = (k: string) => setSeen((s) => ({ ...s, [k]: true }));

  let screen: React.ReactNode;
  if (p.kind === "closed") {
    screen = <Ended title="Room closed" text="The host closed this room." onLobby={() => leaveRoom()} />;
  } else if (p.kind === "join") {
    screen = <Waiting view={view} lives={view.lives[you]} onCancel={() => leaveRoom()} />;
  } else if (match.stage === "draft") {
    const n = match.picks[0].length + match.picks[1].length;
    const turn = draftTurn(replayed.match);
    screen = (
      <>
        <Draft
          match={match}
          level="pro"
          lives={[...view.lives[0], ...view.lives[1]]}
          onMatch={() => undefined}
          onQuit={() => leaveRoom()}
          net={{ turn: turn === null ? null : turn === you ? 0 : 1, flip: you === 1, onPick: (id) => void act({ t: "pick", at: n, id }) }}
        />
        {!seen[`${key}:found`] && n === 0 && <RivalFound name={rival} you={view.names[you] ?? "You"} onDone={() => mark(`${key}:found`)} />}
      </>
    );
  } else if (match.stage === "order") {
    screen = (
      <Order
        key={`${key}:order`}
        match={match}
        onLock={() => undefined}
        onQuit={() => leaveRoom()}
        net={{ locked: view.myOrder, rivalLocked: view.committed.orders[them], onLock: (order) => void act({ t: "order", order }) }}
      />
    );
  } else if (match.stage === "bout" && match.bout) {
    const b = match.bout;
    const fresh = b.turn === 0 && !b.done;
    if (fresh && match.round === 0 && !seen[`${key}:reveal`]) screen = <Reveal match={match} auto={4200} onGo={() => mark(`${key}:reveal`)} />;
    else if (fresh && !seen[`${key}:intro${match.round}`]) screen = <RoundIntro match={match} onGo={() => mark(`${key}:intro${match.round}`)} />;
    else {
      const stamp = turnStamp(replayed.match);
      const battleNet: BattleNet = {
        tell: view.tell,
        canAct: myTurn && (p.kind === "lead" || p.kind === "answer"),
        waiting:
          p.kind === "lead" && !myTurn ? `${rival} is choosing a lead…` : p.kind === "answer" && !myTurn ? `Locked in. ${rival} is reading your tell…` : null,
        send: (a: ArenaAction) => void act({ t: "move", at: stamp, move: a.move, feint: a.feint ?? null }),
        ready: () => void act({ t: "ready", round: replayed.match.round }),
        readied: view.committed.ready[you],
      };
      screen = <Battle key={`${key}:r${match.round}`} match={match} level="pro" onMatch={() => undefined} onRoundDone={() => undefined} onQuit={() => leaveRoom()} net={battleNet} />;
    }
  } else {
    const f = replayed.forfeit;
    const quitter = f ? (f.s === you ? "You" : rival) : null;
    const note = f ? (
      <p className="anim-rise mx-auto mt-3 w-fit rounded-full bg-white/10 px-3 py-1 text-center text-xs font-extrabold text-fg">
        {f.why === "timeout" ? `${quitter} ran out the clock ${MAX_TIMEOUTS} times` : `${quitter} left the match`} · forfeit
      </p>
    ) : null;
    const theyLeft = view.left[them];
    const asked = view.rematch[you];
    const offered = view.rematch[them];
    screen = (
      <Results
        match={match}
        onRematch={() => undefined}
        onHub={() => undefined}
        onTitle={() => undefined}
        note={note}
        footer={
          <div className="relative flex shrink-0 flex-col gap-2 px-4 pt-2 pb-6">
            {offered && !asked && !theyLeft && <p className="anim-pop text-center text-sm font-extrabold text-gold">{rival} wants a rematch!</p>}
            <button type="button" disabled={asked || theyLeft} onClick={() => void act({ t: "rematch" })} className={`btn btn-gold min-h-14 w-full text-lg ${offered && !asked ? "arena-lead-ring" : ""}`}>
              {theyLeft ? <>{rival} left the room</> : asked ? <><span className="arena-wait-dot" aria-hidden /> Waiting for {rival}…</> : <><RefreshCcw className="size-5" aria-hidden /> {offered ? "Accept rematch" : "Rematch"}</>}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => leaveRoom(onBack)} className="btn btn-ghost min-h-12 flex-1"><Users className="size-4" aria-hidden /> Arena</button>
              <button type="button" onClick={() => leaveRoom(onTitle)} className="btn btn-ghost min-h-12 flex-1">Title</button>
            </div>
          </div>
        }
      />
    );
  }

  const inMatch = p.kind !== "join" && p.kind !== "closed";
  return (
    <RivalName.Provider value={rival}>
      <div className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
        {inMatch && (
          <NetBar
            you={view.names[you] ?? "You"}
            rival={rival}
            offline={offline}
            rivalAway={rivalAway}
            myTurn={myTurn}
            kind={p.kind}
            left={left}
            total={p.kind === "order" ? 45_000 : p.kind === "ready" ? 20_000 : 30_000}
            outs={view.timeouts[you]}
            code={view.code}
          />
        )}
        <div className="relative min-h-0 flex-1">{screen}</div>
        {rivalAway && inMatch && (
          <div className="arena-away pointer-events-none absolute inset-x-3 top-12 z-40 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold text-fg">
            <WifiOff className="size-4 shrink-0 text-cape" aria-hidden /> {rival} lost connection. Their clock keeps running.
          </div>
        )}
        {toast && (
          <div role="status" className="anim-pop absolute inset-x-6 bottom-24 z-50 rounded-xl bg-black/85 px-3 py-2 text-center text-sm font-bold text-fg shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </RivalName.Provider>
  );
}

// ─── The bar over every online screen ────────────────────────────────────────────

function NetBar({ you, rival, offline, rivalAway, myTurn, kind, left, total, outs, code }: {
  you: string; rival: string; offline: boolean; rivalAway: boolean; myTurn: boolean; kind: string; left: number | null; total: number; outs: number; code: string;
}) {
  const secs = left === null ? null : Math.ceil(left / 1000);
  const frac = left === null ? 0 : Math.max(0, Math.min(1, left / total));
  const urgent = secs !== null && secs <= 8 && myTurn && kind !== "over";
  const label = kind === "over" ? "Match over" : kind === "ready" ? "Next round" : myTurn ? (kind === "order" ? "Set your order" : kind === "pick" ? "Your pick" : "Your move") : `${rival}'s move`;
  return (
    <div className="arena-netbar relative z-20 flex h-10 shrink-0 items-center gap-2 px-3">
      <span className={`arena-conn flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${offline ? "bg-cape/25 text-[#ff8f87]" : "bg-good/20 text-good"}`} data-off={offline}>
        {offline ? <WifiOff className="size-3" aria-hidden /> : <Wifi className="size-3" aria-hidden />}
        {offline ? "Reconnecting" : "Live"}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-fg/90">
        {you} <span className="text-muted">vs</span> <span className={rivalAway ? "text-muted line-through" : "text-cape"}>{rival}</span>
        <span className="ml-1.5 font-mono text-[9px] tracking-widest text-muted">{code}</span>
      </span>
      {outs > 0 && kind !== "over" && (
        <span className="flex gap-0.5" aria-label={`${outs} of ${MAX_TIMEOUTS} timeouts`}>
          {Array.from({ length: MAX_TIMEOUTS }, (_, i) => <span key={i} className={`h-2 w-2 rounded-full ${i < outs ? "bg-cape" : "bg-white/15"}`} />)}
        </span>
      )}
      {secs !== null && kind !== "over" && (
        <span className={`flex items-center gap-1.5 ${urgent ? "arena-urgent" : ""}`}>
          <span className={`text-[10px] font-extrabold uppercase ${myTurn ? "text-gold" : "text-muted"}`}>{label}</span>
          <span className="relative grid size-8 place-items-center" aria-label={`${secs} seconds left`}>
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={urgent ? "#ff3b30" : myTurn ? "#e6b34d" : "#7f8aa3"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${94.25 * frac} 94.25`} style={{ transition: "stroke-dasharray 250ms linear" }} />
            </svg>
            <span className="t-num relative text-[11px] font-extrabold text-fg">{secs}</span>
          </span>
        </span>
      )}
    </div>
  );
}

// ─── Lobby ───────────────────────────────────────────────────────────────────────

function Lobby({ lives, initialName, initialBring, invite, busy, resuming, error, onCreate, onJoin, onBack }: {
  lives: ArenaFighter[]; initialName: string; initialBring: boolean; invite: string | null; busy: boolean; resuming: boolean; error: string | null;
  onCreate: (name: string, bring: boolean) => void; onJoin: (code: string, name: string, bring: boolean) => void; onBack: () => void;
}) {
  const [name, setName] = useState(initialName.slice(0, 18));
  const [bring, setBring] = useState(initialBring && lives.length > 0);
  const [code, setCode] = useState(invite ?? "");
  const input = useRef<HTMLInputElement>(null);
  const clean = code.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
  const nm = name.trim() || "Challenger";
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <Header title="Online" kicker="Vs a friend" onBack={onBack} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <section className="arena-online-hero relative mt-1 overflow-hidden rounded-[1.5rem] border border-white/10 px-4 pt-4 pb-4">
          <span className="arena-radar-rings pointer-events-none absolute -top-10 -right-10 size-48" aria-hidden />
          <p className="arena-title relative text-[2.6rem]">1V1 LIVE</p>
          <p className="relative mt-1 max-w-[15rem] text-sm font-bold text-fg/90">Make a room, send your friend the code, and draft head to head.</p>
          <div className="relative mt-3 flex flex-wrap gap-1.5 text-[10px] font-extrabold tracking-wide uppercase">
            {["Hidden orders", "Hidden moves", "30 s turns", "Best of 3"].map((t) => <span key={t} className="rounded-full bg-white/10 px-2 py-1 text-fg/85">{t}</span>)}
          </div>
        </section>

        {resuming && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-bold text-fg"><span className="arena-wait-dot" aria-hidden /> Rejoining your room…</p>
        )}
        {error && <p role="alert" className="anim-pop mt-3 rounded-xl bg-cape/20 px-3 py-2 text-sm font-bold text-[#ffb3ad]">{error}</p>}

        <section className="card-glass mt-3 px-4 py-3">
          <label className="t-label text-muted" htmlFor="arena-name">Your fighter name</label>
          <div className="mt-1.5 flex items-center gap-2">
            <UserRound className="size-5 shrink-0 text-gold" aria-hidden />
            <input id="arena-name" value={name} maxLength={18} onChange={(e) => setName(e.target.value)} placeholder="Challenger" autoComplete="nickname" className="arena-input min-h-11 flex-1 px-3 text-base font-extrabold" />
          </div>
          {lives.length > 0 && (
            <button type="button" role="switch" aria-checked={bring} onClick={() => setBring((b) => !b)} className="mt-2.5 flex w-full items-center gap-2.5 text-left">
              <span className="flex -space-x-2">
                {lives.slice(0, 3).map((f) => <span key={f.id} className="arena-card relative size-8 !rounded-full border-2 !border-ink"><FighterArt f={f} focus="50% 10%" /></span>)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-fg">Bring your heroes ({lives.length})</span>
                <span className="block text-[11px] font-semibold text-muted">Both sides can draft them. Powers are evened out.</span>
              </span>
              <span className={`arena-toggle ${bring ? "on" : ""}`} aria-hidden><span /></span>
            </button>
          )}
        </section>

        {invite ? (
          <>
            <p className="t-label mt-4 flex items-center gap-1.5 text-gold"><Swords className="size-3.5" aria-hidden /> You're invited</p>
            <div className="mt-2">
        <section className="card-glass px-4 py-3">
          <label className="t-label text-muted" htmlFor="arena-code">Room code</label>
          <div className="relative mt-2" onClick={() => input.current?.focus()}>
            <div className="grid grid-cols-6 gap-1.5" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={`arena-tile ${i === clean.length ? "cur" : ""} ${clean[i] ? "on" : ""}`}>{clean[i] ?? ""}</span>
              ))}
            </div>
            <input
              id="arena-code"
              ref={input}
              value={clean}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && clean.length === 6) onJoin(clean, nm, bring);
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              aria-label="Room code, 6 letters"
              className="absolute inset-0 size-full cursor-text opacity-0"
            />
          </div>
          <button type="button" disabled={busy || clean.length !== 6} onClick={() => onJoin(clean, nm, bring)} className="btn btn-primary mt-3 min-h-12 w-full">
            <Swords className="size-4" aria-hidden /> {busy ? "Joining…" : "Join room"}
          </button>
        </section>
            </div>
            <Divider text="or start your own" />
        <button type="button" disabled={busy} onClick={() => onCreate(nm, bring)} className="btn btn-gold mt-3 min-h-14 w-full text-lg">
          <Crown className="size-5" aria-hidden /> {busy ? "Opening the Arena…" : "Create a room"}
        </button>

          </>
        ) : (
          <>
        <button type="button" disabled={busy} onClick={() => onCreate(nm, bring)} className="btn btn-gold mt-3 min-h-14 w-full text-lg">
          <Crown className="size-5" aria-hidden /> {busy ? "Opening the Arena…" : "Create a room"}
        </button>

            <Divider text="or join a friend" />
        <section className="card-glass px-4 py-3">
          <label className="t-label text-muted" htmlFor="arena-code">Room code</label>
          <div className="relative mt-2" onClick={() => input.current?.focus()}>
            <div className="grid grid-cols-6 gap-1.5" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={`arena-tile ${i === clean.length ? "cur" : ""} ${clean[i] ? "on" : ""}`}>{clean[i] ?? ""}</span>
              ))}
            </div>
            <input
              id="arena-code"
              ref={input}
              value={clean}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && clean.length === 6) onJoin(clean, nm, bring);
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              aria-label="Room code, 6 letters"
              className="absolute inset-0 size-full cursor-text opacity-0"
            />
          </div>
          <button type="button" disabled={busy || clean.length !== 6} onClick={() => onJoin(clean, nm, bring)} className="btn btn-primary mt-3 min-h-12 w-full">
            <Swords className="size-4" aria-hidden /> {busy ? "Joining…" : "Join room"}
          </button>
        </section>
          </>
        )}
        <p className="mt-3 px-1 text-[11px] leading-snug font-semibold text-muted">Turns are checked by the Arena server, so nobody can peek at your order or your move. Miss 3 clocks and it's a forfeit.</p>
      </div>
    </main>
  );
}

// ─── Waiting room ────────────────────────────────────────────────────────────────

function Waiting({ view, lives, onCancel }: { view: RoomView; lives: ArenaFighter[]; onCancel: () => void }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);
  const link = inviteLink(view.code);
  async function share() {
    const text = `Fight me in the SuperLife Arena! Room code ${view.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "SuperLife Arena", text, url: link });
        return;
      }
    } catch {
      /* cancelled: fall back to copying */
    }
    if (await copyText(link)) setCopied("link");
  }
  const me = lives[0];
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col overflow-hidden">
      <Header title="Your room" kicker="Waiting for a rival" onBack={onCancel} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <section className="card-glass relative overflow-hidden px-4 pt-4 pb-4 text-center">
          <p className="t-label text-gold">Room code</p>
          <div className="mt-2 grid grid-cols-6 gap-1.5" aria-label={`Room code ${view.code.split("").join(" ")}`}>
            {view.code.split("").map((ch, i) => (
              <span key={i} className="arena-tile on big anim-pop" style={{ animationDelay: `${i * 60}ms` }}>{ch}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={async () => { if (await copyText(view.code)) setCopied("code"); }} className="btn btn-ghost min-h-12">
              {copied === "code" ? <><Check className="size-4 text-good" aria-hidden /> Copied</> : <><Copy className="size-4" aria-hidden /> Copy code</>}
            </button>
            <button type="button" onClick={share} className="btn btn-primary min-h-12">
              {copied === "link" ? <><Check className="size-4" aria-hidden /> Link copied</> : <><Share2 className="size-4" aria-hidden /> Share link</>}
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 truncate text-[10.5px] font-semibold text-muted"><Link2 className="size-3 shrink-0" aria-hidden /> <span className="truncate">{link}</span></p>
        </section>

        <section className="relative mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="arena-card relative aspect-[3/4]" style={{ "--c": "#e6b34d" } as React.CSSProperties}>
            {me ? <FighterArt f={me} /> : <span className="grid size-full place-items-center bg-gradient-to-b from-gold/25 to-transparent"><UserRound className="size-14 text-gold" aria-hidden /></span>}
            <span className="arena-plate"><span className="t-label block text-[9px] text-gold">You</span><span className="block truncate font-display text-base leading-none text-fg">{view.names[view.you]}</span></span>
          </div>
          <span className="arena-vs text-4xl">VS</span>
          <div className="arena-card arena-searching relative aspect-[3/4]" style={{ "--c": "#ef5d52" } as React.CSSProperties}>
            <span className="arena-radar-rings absolute inset-0" aria-hidden />
            <span className="relative grid size-full place-items-center font-display text-6xl text-white/25">?</span>
            <span className="arena-plate"><span className="t-label block text-[9px] text-cape">Rival</span><span className="block truncate text-[12px] font-extrabold text-muted">Searching…</span></span>
          </div>
        </section>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-fg/90"><span className="arena-wait-dot" aria-hidden /> Waiting for your friend to join…</p>
        <p className="mt-1 text-center text-[11px] font-semibold text-muted">They open the link, or tap Arena › Vs a friend › Join and type the code.</p>
      </div>
      <div className="shrink-0 px-4 pt-2 pb-6">
        <button type="button" onClick={onCancel} className="btn btn-ghost min-h-12 w-full"><X className="size-4" aria-hidden /> Close room</button>
      </div>
    </main>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-muted">
      <span className="h-px flex-1 bg-white/10" />
      <span className="t-label text-[10px]">{text}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function RivalFound({ name, you, onDone }: { name: string; you: string; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    buzz([30, 50, 30]);
    const id = window.setTimeout(() => done.current(), 1900);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <button type="button" onClick={onDone} className="arena-found absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center" aria-label="Start the draft">
      <span className="ko-rays pointer-events-none absolute top-1/2 left-1/2 size-[160%] -translate-x-1/2 -translate-y-1/2 opacity-30" style={{ background: "conic-gradient(from 0deg, transparent, #e6b34d, transparent 10%, transparent 25%, #ef5d52, transparent 35%, transparent 50%, #e6b34d, transparent 60%, transparent 75%, #ef5d52, transparent 85%)" }} />
      <p className="t-label relative text-gold">Rival found</p>
      <p className="t-display relative mt-2 max-w-full truncate text-[2rem] text-fg">{you}</p>
      <span className="ko-in arena-vs relative my-1 text-7xl">VS</span>
      <p className="t-display relative max-w-full truncate text-[2rem] text-[#ff8f87]">{name}</p>
      <p className="t-label relative mt-6 text-[10px] text-muted">The draft begins</p>
    </button>
  );
}

function Ended({ title, text, onLobby }: { title: string; text: string; onLobby: () => void }) {
  return (
    <main className="arena-root relative flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
      <LogOut className="size-10 text-muted" aria-hidden />
      <p className="t-display mt-3 text-fg">{title}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{text}</p>
      <button type="button" onClick={onLobby} className="btn btn-gold mt-5 min-h-12 w-full"><ArrowLeft className="size-4" aria-hidden /> Back to the lobby</button>
    </main>
  );
}
