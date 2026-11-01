import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Lock, X } from "lucide-react";
import { ElementIcon } from "@/components/game/Vfx";
import { buzz } from "@/components/game/haptics";
import { blip } from "@/components/game/sfx";
import { getPower } from "@/game/combo";
import { powerRank } from "@/game/mastery";
import { battleMoves, knownMoves, moveLevel, MOVESET_SIZE, placeInSlot, scaledPower, STREET_MOVES } from "@/game/moves";
import type { MoveDef } from "@/game/moves.catalog";
import type { Game } from "@/game/types";
import "./move-picker.css";

/**
 * The six-move loadout. Every change is one atomic `slot|index|moveId` action, so a swap can never leave
 * the six at five. Pick a slot then a move, or a move then a slot. Feedback lives in a fixed-height,
 * sticky line inside this card, so nothing above the list grows and shoves a move under your thumb.
 */
type Armed = { kind: "slot"; index: number } | { kind: "move"; id: string } | null;

export function MovePicker({ game, onAct }: { game: Game; onAct: (id: string) => void }) {
  const known = knownMoves(game);
  const byId = new Map(known.map((entry) => [entry.def.id, entry]));
  const equipped = (game.loadout ?? []).filter((id) => byId.get(id)?.unlocked).slice(0, MOVESET_SIZE);
  const ready = known.filter((entry) => entry.unlocked);
  const locked = known.filter((entry) => !entry.unlocked);
  const padding = battleMoves(game).slice(equipped.length);
  const sets = game.moveSets ?? [];
  const [armed, setArmed] = useState<Armed>(null);
  const [line, setLine] = useState("");
  const [flash, setFlash] = useState<{ slots: number[]; key: number }>({ slots: [], key: 0 });
  const [showLocked, setShowLocked] = useState(false);
  const slotsRef = useRef<HTMLDivElement>(null);
  const loadKey = equipped.join("|");

  // A move that is no longer equippable (or a slot past the end) can't stay armed.
  useEffect(() => {
    setArmed((current) => {
      if (!current) return current;
      if (current.kind === "slot") return current.index < equipped.length ? current : null;
      return byId.get(current.id)?.unlocked ? current : null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, known.length]);

  function feedback(text: string, good: boolean) {
    setLine(text);
    buzz(good ? "tap" : "miss");
    if (good) blip(740, 0.06, 0.035);
  }

  function place(slot: number, id: string) {
    if (game.phase !== "live") {
      feedback("Finish what's on the card first, then swap.", false);
      setArmed(null);
      return;
    }
    // Dry-run on a copy for the exact words, then send the one real action.
    const res = placeInSlot(structuredClone(game), slot, id);
    if (!res.ok) {
      feedback(res.line, false);
      setArmed(null);
      return;
    }
    const from = equipped.indexOf(id);
    const target = Math.min(slot, from >= 0 ? equipped.length - 1 : equipped.length);
    onAct(`slot|${target}|${id}`);
    setFlash((prev) => ({ slots: from >= 0 && from !== target ? [target, from] : [target], key: prev.key + 1 }));
    setArmed(null);
    feedback(res.line, true);
  }

  function tapSlot(index: number) {
    const id = equipped[index];
    if (!id) return;
    if (armed?.kind === "move") return place(index, armed.id);
    if (armed?.kind === "slot") {
      if (armed.index === index) {
        setArmed(null);
        setLine("");
        return;
      }
      const moving = equipped[armed.index];
      if (moving) place(index, moving);
      return;
    }
    if (ready.length <= equipped.length && equipped.length < 2) {
      feedback("This is the only move you know. Drill your power to unlock another.", false);
      return;
    }
    setArmed({ kind: "slot", index });
    setLine("");
    buzz("tap");
  }

  function tapMove(def: MoveDef, unlocked: boolean) {
    if (!unlocked) {
      const power = getPower(def.powerId);
      feedback(`${def.name} unlocks at ${power?.name ?? "that power"} rank ${powerRank(def.minMastery)}. Train it in Powers › Drill.`, false);
      return;
    }
    if (armed?.kind === "slot") return place(armed.index, def.id);
    const at = equipped.indexOf(def.id);
    if (at >= 0) {
      if (armed?.kind === "move" && armed.id === def.id) {
        setArmed(null);
        setLine("");
        return;
      }
      // Tapping an equipped move picks up its slot, ready to swap or reorder.
      setArmed({ kind: "slot", index: at });
      setLine("");
      buzz("tap");
      return;
    }
    if (equipped.length < MOVESET_SIZE) return place(equipped.length, def.id);
    if (armed?.kind === "move" && armed.id === def.id) {
      setArmed(null);
      setLine("");
      return;
    }
    setArmed({ kind: "move", id: def.id });
    setLine("");
    buzz("tap");
  }

  const armedSlotName = armed?.kind === "slot" ? byId.get(equipped[armed.index] ?? "")?.def.name : null;
  const armedMoveName = armed?.kind === "move" ? byId.get(armed.id)?.def.name : null;
  const prompt = armed?.kind === "slot"
    ? `Slot ${armed.index + 1} · ${armedSlotName ?? "move"}: tap a move to swap it in, or another slot to trade places.`
    : armed?.kind === "move"
      ? `Tap the slot ${armedMoveName ?? "this move"} should replace.`
      : line || (ready.length > equipped.length ? "Tap a slot, then the move you want there. Or tap a move, then a slot." : ready.length >= MOVESET_SIZE ? "All six set. Unlock more moves to swap." : `You know ${ready.length} move${ready.length === 1 ? "" : "s"}. Street moves fill the rest until you unlock more.`);

  return (
    <section className="card move-picker px-4 pt-3 pb-4" data-armed={armed ? armed.kind : undefined}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-label text-muted">YOUR SIX</h2>
        <span className="mp-count t-num" aria-label={`${equipped.length} of ${MOVESET_SIZE} slots use your own moves`}>
          {equipped.length}/{MOVESET_SIZE}
        </span>
      </div>

      <div className={`mp-status ${armed ? "is-armed" : line ? "is-note" : ""}`} role="status" aria-live="polite">
        {armed?.kind === "move" ? (
          // Quick slots: swap without scrolling back up, and without the list moving under the thumb.
          <div className="mp-quick" role="group" aria-label={prompt}>
            {equipped.map((id, index) => (
              <button key={id} type="button" className="mp-quick-slot" aria-label={`Swap into slot ${index + 1}: replaces ${byId.get(id)?.def.name ?? "move"}`} onClick={() => place(index, armed.id)}>
                <span className="mp-num">{index + 1}</span>
                <span className="mp-quick-name">{byId.get(id)?.def.name ?? ""}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="min-w-0 flex-1">{prompt}</p>
        )}
        {armed && (
          <button type="button" className="mp-cancel" aria-label="Cancel swap" onClick={() => { setArmed(null); setLine(""); }}>
            <X className="size-4" />
          </button>
        )}
      </div>

      <div ref={slotsRef} className="mp-slots mt-2 grid grid-cols-2 gap-2" role="list" aria-label="Equipped moves">
        {Array.from({ length: MOVESET_SIZE }, (_, index) => {
          const id = equipped[index];
          const entry = id ? byId.get(id) : undefined;
          if (!entry) {
            const street = padding[index - equipped.length] ?? STREET_MOVES[index % STREET_MOVES.length]!;
            return (
              <div key={`slot-${index}`} role="listitem" className="mp-slot is-street" aria-label={`Slot ${index + 1}: street move ${street.name}`}>
                <span className="mp-num">{index + 1}</span>
                <span className="mp-name">{street.name}</span>
                <span className="mp-meta">Street · auto</span>
              </div>
            );
          }
          const def = entry.def;
          const rank = moveLevel(game.moveExp?.[def.id] ?? 0);
          const isArmed = armed?.kind === "slot" && armed.index === index;
          const target = armed?.kind === "move" || (armed?.kind === "slot" && !isArmed);
          const flashed = flash.slots.includes(index);
          return (
            <div key={`slot-${index}`} role="listitem">
              <button
                key={flashed ? `f-${flash.key}` : "still"}
                type="button"
                data-slot={index}
                aria-pressed={isArmed}
                aria-label={`Slot ${index + 1}: ${def.name}${isArmed ? ", picked up" : ""}`}
                onClick={() => tapSlot(index)}
                className={`mp-slot ${isArmed ? "is-armed" : ""} ${target ? "is-target" : ""} ${flashed ? "is-flash" : ""}`}
              >
                <span className="mp-num">{index + 1}</span>
                <span className="mp-name">
                  <ElementIcon element={def.element} className="size-3.5 shrink-0" />
                  <span className="truncate">{def.name}</span>
                </span>
                <span className="mp-meta">
                  {def.kind} · {def.energy}e · Rank {rank}
                </span>
                {target && <ArrowLeftRight className="mp-swap size-3.5" aria-hidden />}
              </button>
            </div>
          );
        })}
      </div>

      {sets.length > 0 && ready.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {sets.map((set, index) => (
            <div key={set.name} className="mp-set">
              <span className="t-label text-muted">{set.name}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="btn btn-ghost !min-h-10 flex-1 !px-2 text-xs"
                  onClick={() => {
                    onAct(`set-save|${index}`);
                    feedback(`${set.name} remembers this six.`, true);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={set.moves.length === 0}
                  className="btn btn-gold !min-h-10 flex-1 !px-2 text-xs disabled:opacity-40"
                  onClick={() => {
                    setArmed(null);
                    onAct(`set-load|${index}`);
                    setFlash((prev) => ({ slots: [0, 1, 2, 3, 4, 5], key: prev.key + 1 }));
                    feedback(`${set.name} loaded.`, true);
                  }}
                >
                  Load
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="t-label mt-4 text-muted">READY · {ready.length}</h3>
      <ul className="mt-2 flex flex-col gap-2" aria-label="Moves you can equip">
        {ready.map(({ def }) => {
          const at = equipped.indexOf(def.id);
          const on = at >= 0;
          const picked = armed?.kind === "move" && armed.id === def.id;
          const level = moveLevel(game.moveExp?.[def.id] ?? 0);
          return (
            <li key={def.id}>
              <button
                type="button"
                data-move={def.id}
                aria-pressed={on || picked}
                onClick={() => tapMove(def, true)}
                className={`mp-move ${on ? "is-on" : ""} ${picked ? "is-picked" : ""} ${armed?.kind === "slot" && !on ? "is-target" : ""}`}
              >
                <span className="mp-move-head">
                  <ElementIcon element={def.element} className="size-4 shrink-0" />
                  <span className="truncate font-semibold">{def.name}</span>
                  <span className={`mp-tag ${on ? "is-on" : ""}`}>{on ? `Slot ${at + 1}` : picked ? "Picked" : armed?.kind === "slot" ? "Swap in" : equipped.length < MOVESET_SIZE ? "Add" : "Swap"}</span>
                </span>
                <span className="mp-move-body">
                  {getPower(def.powerId)?.name ?? ""} · {def.kind} · {def.style} · Pow {scaledPower(def, level)} · {def.energy}e{def.cooldown ? ` · ${def.cooldown}t cd` : ""} · Rank {level}
                </span>
                <span className="mp-move-effect">{def.effect}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {locked.length > 0 && (
        <div className="mt-4">
          <button type="button" className="mp-locked-toggle" aria-expanded={showLocked} onClick={() => setShowLocked((open) => !open)}>
            <Lock className="size-3.5" /> Locked · {locked.length}
            <span className="ml-auto text-xs font-semibold text-muted">{showLocked ? "Hide" : "Show"}</span>
          </button>
          {showLocked && (
            <ul className="mt-2 flex flex-col gap-2" aria-label="Locked moves">
              {locked.map(({ def }) => (
                <li key={def.id}>
                  <button type="button" data-move={def.id} aria-disabled onClick={() => tapMove(def, false)} className="mp-move is-locked">
                    <span className="mp-move-head">
                      <ElementIcon element={def.element} className="size-4 shrink-0 opacity-60" />
                      <span className="truncate font-semibold">{def.name}</span>
                      <span className="mp-tag">Rank {powerRank(def.minMastery)}</span>
                    </span>
                    <span className="mp-move-body">
                      {getPower(def.powerId)?.name ?? ""} · {def.kind} · {def.effect}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** Before a power wakes (or in an unpowered life) the Moves shelf still shows the six you fight with. */
export function StreetSix({ game }: { game: Game }) {
  const sealed = !!game.hiddenGift;
  return (
    <section className="card move-picker px-4 pt-3 pb-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-label text-muted">YOUR SIX</h2>
        <span className="mp-count t-num">0/{MOVESET_SIZE}</span>
      </div>
      <div className="mp-status is-note is-tall" role="status">
        <p>
          {sealed
            ? "Your power hasn't woken yet. It shows up on a birthday between 7 and 15 and its moves land here. Until then you fight with these street moves."
            : "No power in this life. You fight with street moves, and that's enough."}
        </p>
      </div>
      <div className="mp-slots mt-2 grid grid-cols-2 gap-2">
        {STREET_MOVES.slice(0, MOVESET_SIZE).map((move, index) => (
          <div key={move.id} className="mp-slot is-street">
            <span className="mp-num">{index + 1}</span>
            <span className="mp-name">{move.name}</span>
            <span className="mp-meta">{move.kind} · {move.energy}e</span>
          </div>
        ))}
      </div>
    </section>
  );
}
