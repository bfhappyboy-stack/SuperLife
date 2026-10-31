import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ElementIcon } from "@/components/game/Vfx";
import { ELEMENTS, type ElementId } from "@/game/elements";
import { blip, buzz, isMuted, setMuted } from "@/components/game/sfx";

const SPARKS = 6;
const LIFE_MS = 1050;
const GAP_MS = 260;

interface Spark {
  n: number;
  x: number;
  y: number;
}

/** Tap the sparks before they fade: a 6-tap, ~8 second mini right after the reveal. Calls `onDone(score 0..1)`. */
export function FirstMove({
  element,
  powerName,
  onDone,
  onSkip,
}: {
  element: ElementId;
  powerName: string;
  onDone: (score: number) => void;
  onSkip: () => void;
}) {
  const meta = ELEMENTS[element];
  const [count, setCount] = useState(3);
  const [spark, setSpark] = useState<Spark | null>(null);
  const [hits, setHits] = useState<boolean[]>([]);
  const [pop, setPop] = useState<{ x: number; y: number; n: number } | null>(null);
  const [muted, setMute] = useState(isMuted);
  const timer = useRef<number | null>(null);
  const done = hits.length >= SPARKS;
  const score = hits.filter(Boolean).length;

  useEffect(() => {
    if (count <= 0) return;
    const t = window.setTimeout(() => setCount((c) => c - 1), 600);
    return () => window.clearTimeout(t);
  }, [count]);

  useEffect(() => {
    if (count > 0 || done || spark) return;
    const t = window.setTimeout(() => {
      const n = hits.length;
      setSpark({ n, x: 14 + ((n * 37 + 11) % 72), y: 12 + ((n * 53 + 29) % 70) });
    }, GAP_MS);
    return () => window.clearTimeout(t);
  }, [count, done, spark, hits.length]);

  useEffect(() => {
    if (!spark) return;
    timer.current = window.setTimeout(() => {
      setHits((h) => [...h, false]);
      setSpark(null);
    }, LIFE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [spark]);

  function tap() {
    if (!spark) return;
    if (timer.current) window.clearTimeout(timer.current);
    blip(520 + spark.n * 90);
    buzz(12);
    setPop({ x: spark.x, y: spark.y, n: spark.n });
    setHits((h) => [...h, true]);
    setSpark(null);
  }

  const ratio = score / SPARKS;
  const verdict =
    ratio >= 0.8 ? "Clean first move" : ratio >= 0.4 ? "It half works" : "It hits the ceiling";

  return (
    <div
      className="relative flex w-full max-w-[420px] flex-1 flex-col px-5 pt-[9vh] pb-24"
      style={{ "--el": meta.color } as CSSProperties}
    >
      <div className="flex items-center justify-between">
        <p className="t-label text-[11px] tracking-[0.3em] text-fg/80">FIRST MOVE</p>
        <button
          type="button"
          aria-label={muted ? "Sound off" : "Sound on"}
          onClick={() => {
            setMuted(!muted);
            setMute(!muted);
          }}
          className="grid size-11 place-items-center rounded-full border border-white/15 bg-black/30 text-fg/80"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>
      <h2 className="t-display mt-1 text-left text-fg">{done ? verdict : `Try ${powerName}`}</h2>
      <p className="mt-1 text-left text-sm text-fg/75">
        {done ? `${score} of ${SPARKS} sparks caught.` : "Tap each spark before it fades."}
      </p>
      <div className="mt-3 flex gap-1.5" aria-label={`${score} hits`}>
        {Array.from({ length: SPARKS }, (_, i) => (
          <span
            key={i}
            className="h-2 flex-1 rounded-full transition-colors duration-300"
            style={{
              background:
                i < hits.length
                  ? hits[i]
                    ? meta.color
                    : "rgb(255 255 255 / 0.18)"
                  : "rgb(255 255 255 / 0.08)",
              boxShadow: hits[i] ? `0 0 10px ${meta.color}` : undefined,
            }}
          />
        ))}
      </div>
      <div className="card-glass relative mt-4 min-h-[300px] flex-1 overflow-clip rounded-[28px]">
        {count > 0 && (
          <span
            key={count}
            className="t-hero ko-in absolute inset-0 grid place-items-center !text-[5rem] text-fg"
          >
            {count}
          </span>
        )}
        {spark && (
          <button
            key={spark.n}
            type="button"
            aria-label="Spark"
            onPointerDown={tap}
            className="absolute grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full anim-pop"
            style={{
              left: `${spark.x}%`,
              top: `${spark.y}%`,
              background: `radial-gradient(circle at 35% 30%, ${meta.glow}, ${meta.color} 60%, transparent 72%)`,
              boxShadow: `0 0 36px ${meta.color}`,
            }}
          >
            <ElementIcon element={element} className="size-9" style={{ color: "#fff" }} />
            <span
              className="absolute inset-0 rounded-full border-2 border-white/80"
              style={{ animation: `fm-shrink ${LIFE_MS}ms linear forwards` }}
            />
          </button>
        )}
        {pop && (
          <span
            key={`p${pop.n}`}
            className="fm-pop pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg font-extrabold"
            style={{ left: `${pop.x}%`, top: `${pop.y}%`, color: meta.glow }}
          >
            +HIT
          </span>
        )}
        {done && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <span
                className="mx-auto grid size-24 place-items-center rounded-[30px] border-2 border-white/70"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${meta.glow}, ${meta.color} 60%, #000 140%)`,
                  boxShadow: `0 0 50px ${meta.color}`,
                }}
              >
                <ElementIcon element={element} className="size-12" style={{ color: "#fff" }} />
              </span>
              <p className="t-hero mt-4 !text-[3.25rem] text-fg">
                {score}/{SPARKS}
              </p>
              <p className="mt-1 text-sm font-bold text-gold">
                {powerName} drill +{Math.round(6 + ratio * 14)}
              </p>
            </div>
          </div>
        )}
      </div>
      {done ? (
        <button
          type="button"
          onClick={() => onDone(ratio)}
          className="btn btn-gold mt-4 min-h-14 w-full text-lg"
        >
          Into the world
        </button>
      ) : (
        <button
          type="button"
          onClick={onSkip}
          className="mt-4 min-h-11 w-full text-sm font-semibold text-fg/60"
        >
          Skip the first move
        </button>
      )}
    </div>
  );
}
