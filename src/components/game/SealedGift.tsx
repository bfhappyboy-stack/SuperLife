import type React from "react";
import { Eye, Lock, Sparkles } from "lucide-react";
import { SealedOrb } from "@/components/game/Legends";
import { ElementIcon } from "@/components/game/Vfx";
import { ELEMENTS } from "@/game/elements";
import {
  callItOptions,
  ELEMENT_ORDER,
  OMEN_STAGES,
  omenStage,
  WAKE_MAX,
  WAKE_MIN,
} from "@/game/mystery";
import { presetById } from "@/game/presets";
import type { Game } from "@/game/types";

/**
 * Powers tab before the reveal. Mystery lives get the sealed orb, a pressure meter that climbs as the
 * wake birthday nears, a journal of the signs so far, and the "Call it" bet as three element tiles.
 * Legends get a canon countdown instead.
 */
export function SealedGift({ game, onAct }: { game: Game; onAct: (id: string) => void }) {
  const legend = presetById(game.preset);
  if (legend) return <CanonCountdown game={game} />;
  const stage = omenStage(game.age, game.flags.manifestAge);
  const omens = game.flags.omens ?? 0;
  const log = [...(game.omenLog ?? [])].reverse().slice(0, 3);
  const called = game.flags.guess !== undefined ? ELEMENT_ORDER[game.flags.guess] : undefined;
  const glow = ["#8f7bd6", "#b07cff", "#ffb347", "#fff1b8"][stage];
  return (
    <section
      className="card sealed-card relative overflow-hidden px-4 pt-5 pb-4"
      style={{ "--seal": glow, borderColor: `${glow}66` } as React.CSSProperties}
      aria-label="Sealed gift"
    >
      <span
        className="sealed-aura pointer-events-none absolute -top-16 left-1/2 size-72 -translate-x-1/2 rounded-full"
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <span className={`sealed-orb stage-${stage} shrink-0`}>
          <SealedOrb className="size-[5.5rem]" />
        </span>
        <div className="min-w-0">
          <p className="t-label text-[10px]" style={{ color: glow }}>
            SEALED GIFT
          </p>
          <h2 className="t-display !text-[1.75rem] leading-none text-fg">Something in you</h2>
          <p className="mt-1.5 text-pretty text-sm text-fg/85">
            {stage === 3
              ? "Your next birthday could be the one."
              : `Wakes on a birthday between ${WAKE_MIN} and ${WAKE_MAX}.`}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex items-baseline justify-between">
          <span className="t-label text-[10px] text-muted">THE FEELING</span>
          <span
            className={`text-xs font-extrabold ${stage === 3 ? "anim-glow" : ""}`}
            style={{ color: glow }}
          >
            {OMEN_STAGES[stage]}
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5" aria-hidden>
          {OMEN_STAGES.map((label, i) => (
            <span
              key={label}
              className={`h-2 rounded-full ${i <= stage ? "sealed-seg-on" : "bg-white/10"}`}
              style={
                i <= stage
                  ? {
                      background: `linear-gradient(90deg, ${["#8f7bd6", "#b07cff", "#ffb347", "#fff1b8"][i]}, ${glow})`,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        <p className="t-label flex items-center gap-1.5 text-[10px] text-muted">
          <Eye className="size-3" aria-hidden /> SIGNS · {omens}
        </p>
        {log.length ? (
          <ol className="mt-2 flex flex-col gap-1.5">
            {log.map((line, i) => (
              <li
                key={`${i}-${line.slice(0, 12)}`}
                className={`rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm leading-snug ${i === 0 ? "text-fg" : "text-fg/60"}`}
              >
                {line}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-sm text-muted">
            No signs yet.{" "}
            {game.age >= 4
              ? "Life ▸ Today ▸ Chase the strange feeling."
              : "From age 4: Life ▸ Today ▸ Chase the strange feeling."}
          </p>
        )}
      </div>

      <div className="relative mt-4">
        <p className="t-label text-[10px] text-muted">CALL IT</p>
        {called ? (
          <p
            className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold text-fg"
            style={{
              borderColor: `${ELEMENTS[called].color}88`,
              background: `${ELEMENTS[called].color}1f`,
            }}
          >
            <ElementIcon element={called} className="size-5" />
            You called {ELEMENTS[called].label}. The reveal will tell.
          </p>
        ) : omens >= 2 ? (
          <>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {callItOptions(game).map((element) => (
                <button
                  key={element}
                  type="button"
                  data-act={`guess|${ELEMENT_ORDER.indexOf(element)}`}
                  onClick={() => onAct(`guess|${ELEMENT_ORDER.indexOf(element)}`)}
                  className="call-tile flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl border bg-black/35 px-2 py-2 text-sm font-extrabold text-fg"
                  style={
                    {
                      borderColor: `${ELEMENTS[element].color}88`,
                      "--tile": ELEMENTS[element].color,
                    } as React.CSSProperties
                  }
                >
                  <ElementIcon element={element} className="size-6" />
                  {ELEMENTS[element].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              One bet, free. Right at the reveal: +0.25 power and Joy.
            </p>
          </>
        ) : (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <Lock className="size-3.5 shrink-0" aria-hidden /> Notice {2 - omens} more sign
            {2 - omens === 1 ? "" : "s"} to make your bet.
          </p>
        )}
      </div>
    </section>
  );
}

function CanonCountdown({ game }: { game: Game }) {
  const legend = presetById(game.preset)!;
  const beat = legend.beats.find((row) => row.wake);
  const at = beat?.age ?? game.flags.manifestAge ?? 0;
  const left = Math.max(0, at - game.age);
  return (
    <section
      className="card relative overflow-hidden px-4 py-5"
      style={{ borderColor: `${legend.color}77` }}
      aria-label="Canon countdown"
    >
      <span
        className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full opacity-30 blur-2xl"
        style={{ background: legend.color }}
        aria-hidden
      />
      <p className="t-label relative text-[10px]" style={{ color: legend.color }}>
        CANON · {legend.earth}
      </p>
      <h2 className="t-display relative !text-[1.75rem] leading-none text-fg">
        {beat?.title ?? "The wake"}
      </h2>
      <div className="relative mt-3 flex items-end gap-3">
        <span className="t-display !text-[3.2rem] leading-none" style={{ color: legend.color }}>
          {left}
        </span>
        <span className="pb-1.5 text-sm font-semibold text-fg/85">
          {left === 1 ? "year" : "years"} until {legend.hero}&apos;s powers wake, at {at}.
        </span>
      </div>
      <p className="relative mt-3 flex items-start gap-2 text-sm text-muted">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0"
          style={{ color: legend.color }}
          aria-hidden
        />
        Until then you&apos;re just {game.name.split(" ")[0]}. Canon beats still arrive on their
        birthdays: follow, bend, or break them.
      </p>
    </section>
  );
}
