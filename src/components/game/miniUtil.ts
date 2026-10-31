/** Non-component helpers shared by the skill minigames (kept apart so fast refresh stays happy). */
import { Brain, Flame, Lock, Mic, Timer, Weight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buzz } from "@/components/game/haptics";
import { ELEMENTS, isElement } from "@/game/elements";
import { MINI_KINDS, type SkillKind } from "@/game/minis";
import type { MinigameSpec } from "@/game/types";

export const KIND_ICON: Record<SkillKind, typeof Flame> = { timing: Timer, pattern: Brain, hack: Lock, rescue: Flame, press: Mic, hold: Weight };

export type Mark = "perfect" | "good" | "miss" | null;

export function gradeOf(ratio: number): { label: string; color: string; tone: "win" | "partial" | "lose" } {
  if (ratio >= 0.9) return { label: "FLAWLESS", color: "#ffcf4d", tone: "win" };
  if (ratio >= 0.66) return { label: "CLEAN", color: "#3fe0c5", tone: "win" };
  if (ratio >= 0.33) return { label: "SCRAPED", color: "#a3adbd", tone: "partial" };
  return { label: "BOTCHED", color: "#ef5d52", tone: "lose" };
}

export function skinColor(spec: MinigameSpec, kind: SkillKind): string {
  return spec.skin && isElement(spec.skin) ? ELEMENTS[spec.skin].color : MINI_KINDS[kind].color;
}

export function clampDifficulty(value: number): 1 | 2 | 3 {
  return Math.max(1, Math.min(3, Math.round(value))) as 1 | 2 | 3;
}

/** Seeded PRNG for per-game layouts. */
export function seeded(seed: number): () => number {
  let s = (seed >>> 0) || 7;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Ready → Go intro. Returns true once play should start. Skipped under reduced motion. */
export function useIntro(ms = 950): boolean {
  const [go, setGo] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (go) return;
    const id = window.setTimeout(() => setGo(true), ms);
    return () => window.clearTimeout(id);
  }, [go, ms]);
  return go;
}

/** Finish once: show the result stamp, buzz, then hand the ratio back after a beat. */
export function useFinish(onDone: (ratio: number) => void) {
  const [result, setResult] = useState<number | null>(null);
  const done = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const finish = (ratio: number) => {
    if (done.current) return;
    done.current = true;
    const r = Math.max(0, Math.min(1, ratio));
    setResult(r);
    buzz(r >= 0.66 ? "win" : r >= 0.33 ? "hit" : "miss");
    timer.current = window.setTimeout(() => onDone(r), 1150);
  };
  return { result, finish, finished: done };
}
