/**
 * Life difficulty: chosen at birth, persisted on the save, scales every life-sim duel.
 * Arena keeps its own Rookie / Pro / Legend ladder — this is the life-sim fight curve.
 *
 * Normal is deliberately a notch harder than the pre-2026-11-07 baseline (foe HP ×1.0,
 * AI hate-read 0.42). Story softens that; Hard and Legendary push past it.
 */
import type { LifeDifficulty } from "./types";

export type { LifeDifficulty };

export const LIFE_DIFFICULTIES: readonly LifeDifficulty[] = ["story", "normal", "hard", "legendary"];

export const DEFAULT_DIFFICULTY: LifeDifficulty = "normal";

export interface DifficultyTune {
  id: LifeDifficulty;
  /** Short label on the picker. */
  title: string;
  /** One-line promise under the picker. */
  blurb: string;
  /** Multiplier on foe max HP (and boss bump already in makeDuel). */
  foeHp: number;
  /** Multiplier on damage the foe deals to you. */
  foeDamage: number;
  /** Chance the AI answers your last style (was 0.42 on the old baseline). */
  aiHate: number;
  /** Extra foe power level baked into the board before HP math (Hard/Legendary). */
  foeLevelBump: number;
  /** Chance the AI fakes a tell to bait a habit (same style twice running). Stage 2. */
  aiRead: number;
}

export const DIFFICULTY: Record<LifeDifficulty, DifficultyTune> = {
  story: {
    id: "story",
    title: "Story",
    blurb: "Softer foes. Learn the tells.",
    foeHp: 0.88,
    foeDamage: 0.82,
    aiHate: 0.3,
    foeLevelBump: 0,
    aiRead: 0,
  },
  normal: {
    id: "normal",
    title: "Normal",
    blurb: "Harder than before. Read every tell.",
    foeHp: 1.2,
    foeDamage: 1.15,
    aiHate: 0.48,
    foeLevelBump: 0.1,
    aiRead: 0.25,
  },
  hard: {
    id: "hard",
    title: "Hard",
    blurb: "Thicker HP, sharper AI. Mistakes hurt.",
    foeHp: 1.3,
    foeDamage: 1.24,
    aiHate: 0.58,
    foeLevelBump: 0.35,
    aiRead: 0.4,
  },
  legendary: {
    id: "legendary",
    title: "Legendary",
    blurb: "Bosses that punish greed. Bring a plan.",
    foeHp: 1.45,
    foeDamage: 1.36,
    aiHate: 0.7,
    foeLevelBump: 0.65,
    aiRead: 0.55,
  },
};

export function asDifficulty(value: unknown): LifeDifficulty {
  return LIFE_DIFFICULTIES.includes(value as LifeDifficulty) ? (value as LifeDifficulty) : DEFAULT_DIFFICULTY;
}

export function difficultyOf(game: { difficulty?: LifeDifficulty | null } | null | undefined): LifeDifficulty {
  return asDifficulty(game?.difficulty);
}

export function tuneOf(game: { difficulty?: LifeDifficulty | null } | null | undefined): DifficultyTune {
  return DIFFICULTY[difficultyOf(game)];
}

/** Momentum: builds on edge wins, spends for a Burst. Cap 5 so the bar stays readable on a phone. */
export const MOMENTUM_CAP = 5;
/** Momentum needed to fire a Burst (+damage on a real move, not breath). */
export const BURST_COST = 3;
/** Damage multiplier when a Burst is spent. */
export const BURST_MULT = 1.45;
/** Extra momentum for beating a Guard with a Trick (guard break). */
export const GUARD_BREAK_BONUS = 1;


/**
 * Fight runway (Stage 2): both sides' HP are scaled so a life-sim duel lasts ~6–8 turns instead of
 * 4–5, which gives Momentum, statuses and combos time to matter. Damage is unchanged.
 */
export const DUEL_HP_SCALE = 1.35;
/** Case bosses get this much more HP than a street foe of the same level. */
export const BOSS_HP_MULT = 1.45;
