import { useRef, useState } from "react";
import type { DuelMove, MinigameSpec, MoveStyle } from "@/game/types";

const STYLE: Record<MoveStyle, string> = {
  strike: "Strike",
  guard: "Guard",
  trick: "Trick",
};

const TONE: Record<MoveStyle, string> = {
  strike: "text-cape",
  guard: "text-spark",
  trick: "text-gold",
};

const KIND: Record<NonNullable<DuelMove["kind"]>, string> = {
  burst: "Burst",
  area: "Area",
  status: "Status",
  guard: "Guard",
  dash: "Dash",
};

const TELL: Record<MoveStyle, string> = {
  strike: "They coil for a strike.",
  guard: "They plant to guard.",
  trick: "They look for a trick.",
};

const BEAT: Record<MoveStyle, string> = {
  strike: "Guard beats a strike.",
  guard: "Trick beats a guard.",
  trick: "Strike beats a trick.",
};

function beats(a: MoveStyle, b: MoveStyle): boolean {
  return (a === "strike" && b === "trick") || (a === "trick" && b === "guard") || (a === "guard" && b === "strike");
}

function answerOf(style: MoveStyle): MoveStyle {
  if (style === "strike") return "guard";
  if (style === "guard") return "trick";
  return "strike";
}

function damage(move: DuelMove, other: DuelMove): number {
  let mod = beats(move.style, other.style) ? 1.55 : beats(other.style, move.style) ? 0.68 : 1;
  if (move.kind === "area") mod *= 1.12;
  if (move.kind === "dash" && beats(move.style, other.style)) mod *= 1.15;
  const jitter = 0.86 + Math.random() * 0.28;
  return Math.max(1, Math.round(move.power * mod * jitter));
}

function keyOf(move: DuelMove): string {
  return move.id ?? move.name;
}

function tick(cool: Record<string, number>, except?: string, setTo?: number): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cool)) {
    const left = value - 1;
    if (left > 0 && key !== except) next[key] = left;
  }
  if (except && setTo && setTo > 0) next[except] = setTo;
  return next;
}

function pickFrom(pool: readonly DuelMove[], hated: MoveStyle | null): DuelMove {
  const fallback: DuelMove = { name: "Shove", blurb: "", power: 3, style: "strike" };
  if (!pool.length) return fallback;
  if (hated && Math.random() < 0.42) {
    const answer = pool.filter((move) => beats(move.style, hated));
    if (answer.length) return answer[Math.floor(Math.random() * answer.length)] ?? pool[0]!;
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

type Edge = "you" | "them" | "even";

export function Duel({ spec, onDone }: { spec: MinigameSpec; onDone: (ratio: number, used?: string[]) => void }) {
  const board = spec.duel;
  const intent = useRef<DuelMove | null>(null);
  if (board && intent.current === null) intent.current = pickFrom(board.foeMoves, null);
  const opening = intent.current?.style ?? "strike";
  const [playerHp, setPlayerHp] = useState(board?.playerHp ?? 1);
  const [foeHp, setFoeHp] = useState(board?.foeHp ?? 1);
  const [energy, setEnergy] = useState(10);
  const [cool, setCool] = useState<Record<string, number>>({});
  const [slow, setSlow] = useState(1);
  const [log, setLog] = useState(`${TELL[opening]} ${BEAT[opening]}`);
  const [last, setLast] = useState<string | null>(null);
  const [pulse, setPulse] = useState<"you" | "foe" | "both" | null>(null);
  const [kick, setKick] = useState(0);
  const [tell, setTell] = useState<MoveStyle>(opening);
  const [clash, setClash] = useState<{ you: string; them: string; edge: Edge; dealt: number; taken: number } | null>(null);
  const done = useRef(false);
  const swinging = useRef(false);
  const used = useRef<string[]>([]);
  const lastStyle = useRef<MoveStyle | null>(null);
  if (!board) return null;
  const fight = board;
  const maxP = fight.playerHp;
  const maxF = fight.foeHp;
  const answer = answerOf(tell);

  function finish(nextFoe: number, nextPlayer: number) {
    if (nextFoe > 0 && nextPlayer > 0) {
      window.setTimeout(() => {
        swinging.current = false;
      }, 420);
      return;
    }
    done.current = true;
    const ratio = nextFoe <= 0 && nextPlayer <= 0 ? 0.5 : nextFoe <= 0 ? 1 : 0;
    window.setTimeout(() => onDone(ratio, used.current), 640);
  }

  function commit(style: MoveStyle) {
    const next = pickFrom(fight.foeMoves, style);
    intent.current = next;
    setTell(next.style);
    return `${TELL[next.style]} ${BEAT[next.style]}`;
  }

  function swing(move: DuelMove) {
    if (swinging.current || done.current) return;
    const cost = move.energy ?? 1;
    const key = keyOf(move);
    const left = cool[key] ?? 0;
    if (left > 0) {
      setLog(`${move.name} is still cooling. ${left} turn${left === 1 ? "" : "s"}.`);
      return;
    }
    if (energy < cost) {
      setLog(`${move.name} wants ${cost} energy. You have ${energy}. Catch a breath.`);
      return;
    }
    const foeMove = intent.current ?? pickFrom(fight.foeMoves, lastStyle.current);
    if (move.id) used.current.push(move.id);
    lastStyle.current = move.style;
    swinging.current = true;
    let dealt = damage(move, foeMove);
    let taken = Math.round(damage(foeMove, move) * slow * (1 - Math.min(0.4, (fight.guard ?? 0) / 100)));
    if (move.kind === "guard") taken = Math.round(taken * 0.8);
    const nextFoe = Math.max(0, foeHp - dealt);
    const nextPlayer = Math.max(0, playerHp - taken);
    const edge: Edge = beats(move.style, foeMove.style) ? "you" : beats(foeMove.style, move.style) ? "them" : "even";
    const flavor = move.effect ? ` ${move.effect}` : "";
    const ahead = commit(move.style);
    setFoeHp(nextFoe);
    setPlayerHp(nextPlayer);
    setEnergy(Math.min(10, energy - cost + 3));
    setCool(tick(cool, key, move.cooldown ?? 0));
    setSlow(move.kind === "status" ? 0.75 : 1);
    setLast(key);
    setPulse(dealt > 0 && taken > 0 ? "both" : dealt > 0 ? "foe" : "you");
    setKick((value) => value + 1);
    setClash({ you: move.name, them: foeMove.name, edge, dealt, taken });
    const line =
      edge === "you"
        ? `${move.name} catches ${foeMove.name}.${flavor} ${dealt} out, ${taken} back.`
        : edge === "them"
          ? `${foeMove.name} had the angle on ${move.name}. ${taken} in, ${dealt} out.`
          : `You trade. ${dealt} out, ${taken} back.`;
    setLog(`${line} ${ahead}`);
    finish(nextFoe, nextPlayer);
  }

  function recover() {
    if (swinging.current || done.current) return;
    const foeMove = intent.current ?? pickFrom(fight.foeMoves, lastStyle.current);
    lastStyle.current = "guard";
    swinging.current = true;
    const taken = Math.max(1, Math.round(damage(foeMove, { name: "Breath", blurb: "", power: 3, style: "guard", kind: "guard" }) * 0.8 * slow * (1 - Math.min(0.4, (fight.guard ?? 0) / 100))));
    const nextPlayer = Math.max(0, playerHp - taken);
    const ahead = commit("guard");
    setPlayerHp(nextPlayer);
    setEnergy(Math.min(10, energy + 3));
    setCool(tick(cool));
    setSlow(1);
    setLast("breath");
    setPulse("you");
    setKick((value) => value + 1);
    setClash({ you: "Breath", them: foeMove.name, edge: "them", dealt: 0, taken });
    setLog(`You catch a breath. ${fight.foeName} still lands ${foeMove.name} for ${taken}. ${ahead}`);
    finish(foeHp, nextPlayer);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-4 pt-3 pb-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-widest text-muted">{fight.foeSide === "villain" ? "FIGHT" : "SPARRING"}</p>
        <p className="truncate font-display text-2xl tracking-wide text-fg">{fight.foeName}</p>
      </div>
      <Bar label={fight.foeName} value={foeHp} max={maxF} tone="cape" hot={pulse === "foe" || pulse === "both"} kick={kick} />
      <Bar label="You" value={playerHp} max={maxP} tone="gold" hot={pulse === "you" || pulse === "both"} kick={kick} />
      <div key={kick} className={`rounded-2xl border border-line bg-paper px-3 py-2 text-paper-ink ${kick ? "fight-kick" : ""}`}>
        <p className="text-sm font-semibold">{TELL[tell]}</p>
        <p className="text-sm">{BEAT[tell]}</p>
        {clash && (
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2 border-t border-paper-ink/15 pt-2">
            <div>
              <p className="text-[10px] font-semibold tracking-widest">YOU</p>
              <p className="truncate text-sm font-semibold">{clash.you}</p>
              <p className="font-display text-lg tabular-nums">{clash.dealt > 0 ? `−${clash.dealt}` : "—"}</p>
            </div>
            <p className="pb-1 text-[10px] font-semibold tracking-widest">{clash.edge === "you" ? "EDGE" : clash.edge === "them" ? "THEIRS" : "EVEN"}</p>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-widest">THEM</p>
              <p className="truncate text-sm font-semibold">{clash.them}</p>
              <p className="font-display text-lg tabular-nums">{clash.taken > 0 ? `−${clash.taken}` : "—"}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-widest text-muted">ENERGY {energy}/10</p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className={`h-2 w-2 rounded-full ${index < energy ? "bg-gold" : "bg-panel-2"}`} />
          ))}
        </div>
      </div>
      <p role="status" className="line-clamp-2 min-h-10 text-sm text-pretty text-gold">{log}</p>
      <div className="grid min-h-0 flex-1 content-start grid-cols-2 gap-2 overflow-y-auto">
        {fight.playerMoves.map((move) => {
          const key = keyOf(move);
          const cost = move.energy ?? 1;
          const left = cool[key] ?? 0;
          const blocked = left > 0 || energy < cost;
          const answers = move.style === answer;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={last === key}
              onClick={() => swing(move)}
              className={`min-h-14 rounded-2xl border px-3 py-2 text-left ${last === key ? "border-gold bg-panel-2" : answers ? "border-gold bg-panel" : "border-line bg-panel"} ${blocked ? "text-muted" : ""}`}
            >
              <span className="block truncate font-semibold text-fg">{move.name}</span>
              <span className={`text-xs ${TONE[move.style]}`}>
                {STYLE[move.style]}
                {move.kind ? ` · ${KIND[move.kind]}` : ""}
                {` · ${cost}e`}
                {left > 0 ? ` · ${left}t` : ""}
              </span>
              <span className="block truncate text-xs text-muted">{left > 0 ? "Cooling." : energy < cost ? "Not enough energy." : answers ? "Answers their tell." : (move.effect ?? move.blurb)}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-pressed={last === "breath"} onClick={recover} className={`min-h-12 shrink-0 rounded-2xl border text-sm font-semibold text-fg ${last === "breath" ? "border-gold bg-panel-2" : "border-line"}`}>
        Catch a breath · +3 energy
      </button>
    </div>
  );
}

function Bar({ label, value, max, tone, hot, kick }: { label: string; value: number; max: number; tone: "cape" | "gold"; hot?: boolean; kick: number }) {
  const width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
  return (
    <div>
      <div className="flex justify-between gap-3 text-xs text-muted">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-fg">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-panel-2">
        <div key={hot ? kick : "still"} className={`h-full rounded-full ${tone === "cape" ? "bg-cape" : "bg-gold"} ${hot ? "hp-flash" : ""}`} style={{ width }} />
      </div>
    </div>
  );
}
