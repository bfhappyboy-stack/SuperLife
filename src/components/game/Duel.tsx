import type React from "react";
import { useRef, useState } from "react";
import { Shield, Sparkles, Swords } from "lucide-react";
import type { DuelMove, MinigameSpec, MoveStyle } from "@/game/types";
import { FloatNumber, Fighter, HitBurst } from "@/components/game/Vfx";

const HEX: Record<MoveStyle, string> = { strike: "#ff5a4f", guard: "#3fe0c5", trick: "#ffcf4d" };
const STYLE_ICON: Record<MoveStyle, typeof Swords> = { strike: Swords, guard: Shield, trick: Sparkles };

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
  const [clash, setClash] = useState<{ you: string; them: string; edge: Edge; dealt: number; taken: number; style: MoveStyle; foeStyle: MoveStyle } | null>(null);
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
    const dealt = damage(move, foeMove);
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
    setClash({ you: move.name, them: foeMove.name, edge, dealt, taken, style: move.style, foeStyle: foeMove.style });
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
    setClash({ you: "Breath", them: foeMove.name, edge: "them", dealt: 0, taken, style: "guard", foeStyle: foeMove.style });
    setLog(`You catch a breath. ${fight.foeName} still lands ${foeMove.name} for ${taken}. ${ahead}`);
    finish(foeHp, nextPlayer);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-4 pt-3 pb-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-label text-cape">{fight.foeSide === "villain" ? "Fight" : "Sparring"}</p>
          <p className="t-display truncate text-fg">{fight.foeName}</p>
        </div>
        <span className="chip shrink-0 text-fg" style={{ borderColor: HEX[tell] }}>
          {(() => {
            const Icon = STYLE_ICON[tell];
            return <Icon className="size-3.5" style={{ color: HEX[tell] }} />;
          })()}
          Tell: {STYLE[tell]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Bar label="You" value={playerHp} max={maxP} tone="gold" hot={pulse === "you" || pulse === "both"} kick={kick} />
        <Bar label={fight.foeName} value={foeHp} max={maxF} tone="cape" hot={pulse === "foe" || pulse === "both"} kick={kick} right />
      </div>
      <div className="scene-arena relative h-36 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-6 bottom-5 flex items-end justify-between">
          <div className="relative">
            <Fighter label="you" color="#ffcf4d" hurt={!!clash && clash.taken > 0 && kick > 0} hurtKey={kick} />
            {clash && clash.taken > 0 && kick > 0 && (
              <span key={`p${kick}`} className="absolute inset-0">
                <HitBurst color={HEX[clash.foeStyle]} size={56} seed={kick} />
                <FloatNumber text={`−${clash.taken}`} color="#ff8f87" className="-top-3 left-1/2 -translate-x-1/2" />
              </span>
            )}
          </div>
          <div key={`c${kick}`} className={`t-label mb-10 rounded-full px-2.5 py-1 text-[10px] ${kick ? "anim-pop" : ""} ${clash?.edge === "you" ? "bg-gold text-paper-ink" : clash?.edge === "them" ? "bg-cape text-white" : "bg-white/10 text-fg"}`}>
            {clash ? (clash.edge === "you" ? "Your edge" : clash.edge === "them" ? "Their edge" : "Even") : "VS"}
          </div>
          <div className="relative">
            <Fighter label="foe" color="#ff5a4f" flip hurt={!!clash && clash.dealt > 0 && kick > 0} hurtKey={kick} />
            {clash && clash.dealt > 0 && kick > 0 && (
              <span key={`f${kick}`} className="absolute inset-0">
                <HitBurst color={HEX[clash.style]} size={clash.edge === "you" ? 84 : 60} count={clash.edge === "you" ? 12 : 8} seed={kick} />
                <FloatNumber text={`−${clash.dealt}`} color={clash.edge === "you" ? "#ffe08a" : "#fff"} className="-top-3 left-1/2 -translate-x-1/2" />
              </span>
            )}
          </div>
        </div>
      </div>
      <div key={kick} className={`card-paper px-3 py-2 ${kick ? "fight-kick" : ""}`}>
        <p className="text-sm font-bold">{TELL[tell]} <span className="font-semibold opacity-70">{BEAT[tell]}</span></p>
        {clash && (
          <p className="mt-0.5 truncate text-xs font-semibold opacity-80">
            {clash.you} {clash.dealt > 0 ? `−${clash.dealt}` : ""} · {clash.them} {clash.taken > 0 ? `−${clash.taken}` : ""}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="t-label text-muted">Energy <span className="t-num text-fg">{energy}/10</span></p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className={`h-2.5 w-2.5 rotate-45 rounded-[3px] transition-colors ${index < energy ? "bg-gold shadow-[0_0_6px_var(--color-gold)]" : "bg-panel-2"}`} />
          ))}
        </div>
      </div>
      <p role="status" className="line-clamp-2 min-h-10 text-sm font-semibold text-pretty text-gold">{log}</p>
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
              className={`card relative min-h-14 overflow-hidden px-3 py-2 pl-4 text-left ${last === key ? "!border-gold !bg-panel-2" : answers && !blocked ? "!border-gold/70 shadow-[0_0_16px_-6px_var(--color-gold)]" : ""} ${blocked ? "opacity-55" : ""}`}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: HEX[move.style] }} />
              {left > 0 && <span className="absolute inset-0 bg-ink/50" style={{ clipPath: `inset(${100 - Math.min(100, left * 33)}% 0 0 0)` }} />}
              <span className="relative block truncate font-bold text-fg">{move.name}</span>
              <span className={`relative text-xs font-semibold ${TONE[move.style]}`}>
                {STYLE[move.style]}
                {move.kind ? ` · ${KIND[move.kind]}` : ""}
                {` · ${cost}e`}
                {left > 0 ? ` · ${left}t` : ""}
              </span>
              <span className="relative block truncate text-xs text-muted">{left > 0 ? "Cooling." : energy < cost ? "Not enough energy." : answers ? "Answers their tell." : (move.effect ?? move.blurb)}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-pressed={last === "breath"} onClick={recover} className={`btn btn-ghost min-h-12 shrink-0 text-sm ${last === "breath" ? "!border-gold" : ""}`}>
        Catch a breath · +3 energy
      </button>
    </div>
  );
}

function Bar({ label, value, max, tone, hot, kick, right = false }: { label: string; value: number; max: number; tone: "cape" | "gold"; hot?: boolean; kick: number; right?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const color = tone === "cape" ? "#ff5a4f" : "#ffcf4d";
  return (
    <div className="min-w-0">
      <div className={`flex justify-between gap-2 text-xs font-bold text-muted ${right ? "flex-row-reverse" : ""}`}>
        <span className="truncate">{label}</span>
        <span className="t-num text-fg">
          {value}/{max}
        </span>
      </div>
      <div className="stat-bar mt-1 !h-3.5" style={{ transform: right ? "scaleX(-1)" : undefined }}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] delay-300 duration-700" style={{ width: `${pct}%` }} />
        <div key={hot ? kick : "still"} className={`stat-fill ${hot ? "hp-flash" : ""}`} style={{ width: `${pct}%`, "--fill": pct < 25 ? "#ff3b30" : color } as React.CSSProperties} />
      </div>
    </div>
  );
}
