/**
 * Reward chips (2026-11-22 night, REWARD_CHIPS): the Duel K.O. card's Rewards row as small steel chips, each edged in
 * its stat's colour. Pure reads of the fight's effects; no rules, rewards or saves change.
 */
import { money } from "./format";
import type { Effects } from "./types";

export type RewardKey = Exclude<keyof Effects, "personId">;

/** Display order and short labels (same as the old chips). */
export const REWARD_LABEL: Record<RewardKey, string> = {
  health: "Health",
  happiness: "Joy",
  smarts: "Smarts",
  looks: "Looks",
  fame: "Fame",
  money: "Cash",
  reputation: "Rep",
  parentBelief: "Family belief",
  powerLevel: "Power",
  closeness: "Bond",
  karma: "Karma",
};

/** Each stat's edge colour on its chip (matches the stat colours used across the HUD). */
export const REWARD_TONE: Record<RewardKey, string> = {
  health: "#ff6b7a",
  happiness: "#ff9f43",
  smarts: "#6cb6ff",
  looks: "#ff8fd0",
  fame: "#ffcf4d",
  money: "#5fe39a",
  reputation: "#b48cff",
  parentBelief: "#ffb37a",
  powerLevel: "#5ee7ff",
  closeness: "#ff9eb5",
  karma: "#7ff0d0",
};

export interface RewardChip {
  key: RewardKey;
  label: string;
  /** Signed display text, e.g. "+2", "−0.1", "+$1,200". */
  value: string;
  good: boolean;
  tone: string;
}

/** Non-zero effects as chips: gains first, then losses, each in the label order above. */
export function rewardChips(effects: Effects | null | undefined): RewardChip[] {
  const gains: RewardChip[] = [];
  const losses: RewardChip[] = [];
  if (!effects) return gains;
  for (const key of Object.keys(REWARD_LABEL) as RewardKey[]) {
    const raw = effects[key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const shown = key === "money" ? Math.round(raw) : Math.round(raw * 10) / 10;
    if (shown === 0) continue;
    const sign = shown > 0 ? "+" : "−";
    const value = key === "money" ? `${sign}${money(Math.abs(shown))}` : `${sign}${Math.abs(shown)}`;
    (shown > 0 ? gains : losses).push({ key, label: REWARD_LABEL[key], value, good: shown > 0, tone: REWARD_TONE[key] });
  }
  return [...gains, ...losses];
}

/** The "Move XP" chip text: up to three distinct move names, then "+n" for the rest; empty when none were used. */
export function practicedLabel(names: readonly string[], max = 3): string {
  const unique = [...new Set(names.filter(Boolean))];
  if (!unique.length) return "";
  const extra = unique.length - max;
  return `${unique.slice(0, max).join(", ")}${extra > 0 ? ` +${extra}` : ""}`;
}
