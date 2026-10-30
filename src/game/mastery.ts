/** Slow per-power rank. D–S for basics. Mixed and apex can reach X, and they have to earn it. */

const STEPS: Record<0 | 1 | 2, readonly number[]> = {
  0: [0, 50, 140, 280, 480],
  1: [0, 110, 280, 540, 960, 1600],
  2: [0, 200, 480, 880, 1480, 2400],
};

const LETTERS = ["", "D", "C", "B", "A", "S", "X"] as const;

export function powerRank(level: number): string {
  return LETTERS[Math.max(0, Math.min(6, level))] ?? "D";
}

export function masteryLevel(exp: number, generation: 0 | 1 | 2): number {
  const steps = STEPS[generation];
  let level = 1;
  for (let i = 0; i < steps.length; i++) {
    if (exp >= (steps[i] ?? 0)) level = i + 1;
  }
  return level;
}

export function masteryCap(age: number, generation: 0 | 1 | 2, arcsCleared: number): number {
  let cap = 1;
  if (age >= 12) cap = 2;
  if (age >= 16) cap = 3;
  if (age >= 22) cap = 4;
  if (age >= 30) cap = 5;
  if (generation === 1) cap = Math.max(1, cap - 1);
  if (generation === 2) cap = Math.max(1, cap - 2);
  cap = Math.min(generation === 0 ? 5 : 6, cap + Math.min(2, Math.max(0, arcsCleared)));
  if (generation === 2 && arcsCleared < 1) cap = Math.min(cap, 2);
  if (generation === 2 && arcsCleared < 2) cap = Math.min(cap, 3);
  if (generation === 1 && arcsCleared < 1) cap = Math.min(cap, 3);
  if (generation === 0) cap = Math.min(cap, 5);
  const xReady = generation === 1 ? age >= 40 && arcsCleared >= 2 : generation === 2 && age >= 44 && arcsCleared >= 3;
  if (generation > 0 && cap >= 5 && xReady) cap = 6;
  if (generation > 0 && !xReady) cap = Math.min(cap, 5);
  return Math.max(1, Math.min(generation === 0 ? 5 : 6, cap));
}

/** How much exp can still be stored without crossing the soft cap into the next rank. */
export function masteryRoom(exp: number, generation: 0 | 1 | 2, cap: number): number {
  const steps = STEPS[generation];
  const at = steps[Math.max(0, cap - 1)] ?? 0;
  const next = steps[cap];
  const ceiling = next == null ? at : at + Math.floor((next - at) * 0.4);
  return Math.max(0, ceiling - Math.max(0, exp));
}

export function nextMasteryExp(exp: number, generation: 0 | 1 | 2): number | null {
  const steps = STEPS[generation];
  for (const step of steps) {
    if (exp < step) return step;
  }
  return null;
}

export function powerLevelCap(age: number): number {
  if (age < 8) return 1.6;
  if (age < 12) return 2.6;
  if (age < 16) return 3.8;
  if (age < 19) return 5.6;
  if (age < 26) return 6.8;
  if (age < 36) return 8;
  if (age < 50) return 8.9;
  return 9.5;
}

export function trainCost(level: number, generation: 0 | 1 | 2): { health: number; money: number } {
  return {
    health: 2 + level + generation * 2,
    money: level >= 3 ? 40 * level * (generation + 1) : 0,
  };
}

export function bondForMastery(generation: 0 | 1 | 2): number {
  if (generation === 2) return 66;
  if (generation === 1) return 44;
  return 18;
}

export function trainExp(opts: {
  level: number;
  generation: 0 | 1 | 2;
  age: number;
  withHero: boolean;
  story: boolean;
  bond: number;
}): number {
  const base = opts.story ? 34 : opts.withHero ? 15 : 8;
  const genTax = opts.generation === 0 ? 1 : opts.generation === 1 ? 0.6 : 0.38;
  const diminish = 1 / (1 + Math.max(0, opts.level - 1) * 0.85);
  const ageMod = opts.age < 12 ? 0.5 : opts.age < 18 ? 0.72 : 1;
  const bondMod = opts.withHero || opts.story ? Math.min(1.2, 0.75 + Math.max(0, opts.bond) / 180) : 1;
  return Math.max(2, Math.round(base * genTax * diminish * ageMod * bondMod));
}
