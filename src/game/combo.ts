import type { PowerId } from "./types";
import { CATALOG, type CatalogEntry } from "./powers.catalog";

export interface CatalogPower extends CatalogEntry {
  generation: 0 | 1 | 2;
  tier: 1 | 2 | 3;
  tierName: "Basic" | "Mixed" | "Apex";
  /** True when this save has unlocked it. Filled by `viewPowers`, not stored on the book. */
  unlocked: boolean;
}

export interface MixOk {
  ok: true;
  power: CatalogPower;
}

export interface MixFail {
  ok: false;
  reason: string;
}

export type MixResult = MixOk | MixFail;

export interface PossibleMix {
  left: CatalogPower;
  right: CatalogPower;
  result: CatalogPower;
}

const LEGACY_TO_COMBO: Record<PowerId, string> = {
  strength: "super-strength",
  flight: "flight",
  blasts: "energy-projection",
  speed: "super-speed",
  telekinesis: "telekinesis",
  invisibility: "invisibility",
  fire: "fire-control",
  ice: "ice-control",
  healing: "regeneration",
  mind: "telepathy",
  shapeshift: "shape-shifting",
  forcefield: "force-field",
  intellect: "super-senses",
  elastic: "elasticity",
  lightning: "lightning-control",
};

const COMBO_TO_LEGACY: Partial<Record<string, PowerId>> = Object.fromEntries(
  Object.entries(LEGACY_TO_COMBO).map(([legacy, combo]) => [combo, legacy as PowerId]),
);

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function ceilingGeneration(parentA: 0 | 1 | 2, parentB: 0 | 1 | 2): 1 | 2 {
  if (parentA === 2 && parentB === 2) return 2;
  const raw = Math.max(parentA, parentB) + 1;
  return raw >= 2 ? 2 : 1;
}

function stampTier(power: CatalogPower) {
  if (power.generation <= 0) {
    power.tier = 1;
    power.tierName = "Basic";
  } else if (power.generation === 1) {
    power.tier = 2;
    power.tierName = "Mixed";
  } else {
    power.tier = 3;
    power.tierName = "Apex";
  }
}

function buildBook(): Map<string, CatalogPower> {
  const book = new Map<string, CatalogPower>();
  for (const entry of CATALOG) {
    book.set(entry.id, {
      ...entry,
      ingredients: [...entry.ingredients].sort(),
      generation: 0,
      tier: 1,
      tierName: "Basic",
      unlocked: false,
    });
  }
  const pending = CATALOG.filter((entry) => entry.ingredients.length === 2).map((entry) => entry.id);
  let guard = 0;
  while (pending.length && guard < 8) {
    guard += 1;
    for (let i = pending.length - 1; i >= 0; i--) {
      const id = pending[i]!;
      const power = book.get(id);
      if (!power) continue;
      const [a, b] = power.ingredients;
      const left = a ? book.get(a) : undefined;
      const right = b ? book.get(b) : undefined;
      if (!left || !right) continue;
      if (left.ingredients.length && left.generation === 0 && left.ingredients.length === 2) continue;
      if (right.ingredients.length && right.generation === 0 && right.ingredients.length === 2) continue;
      const generation = ceilingGeneration(left.generation, right.generation);
      power.generation = generation;
      pending.splice(i, 1);
    }
  }
  for (const power of book.values()) stampTier(power);
  return book;
}

const BOOK = buildBook();
const BY_PAIR = new Map<string, CatalogPower>();
for (const power of BOOK.values()) {
  if (power.ingredients.length === 2) {
    const [a, b] = power.ingredients;
    if (a && b) BY_PAIR.set(pairKey(a, b), power);
  }
}

const WEAVE_NOUNS = ["Covenant", "Lattice", "Brand", "Veil", "Knot", "Pulse", "Mark", "Crown", "Edge", "Choir", "Rite", "Spine", "Halo", "Fault", "Oath"];
const WOVEN = new Map<string, CatalogPower>();

function hashPair(a: string, b: string): number {
  const text = pairKey(a, b);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function weaveId(a: string, b: string): string {
  const [left, right] = [a, b].sort();
  return `w:${left.length}:${left}${right}`;
}

function parseWeave(id: string): [string, string] | null {
  if (!id.startsWith("w:")) return null;
  const rest = id.slice(2);
  const colon = rest.indexOf(":");
  if (colon < 1) return null;
  const length = Number(rest.slice(0, colon));
  if (!Number.isInteger(length) || length < 1) return null;
  const body = rest.slice(colon + 1);
  if (body.length <= length) return null;
  return [body.slice(0, length), body.slice(length)];
}

function weaveName(left: CatalogPower, right: CatalogPower, salt: number): string {
  const skip = new Set(["of", "the", "a", "and"]);
  const take = (name: string) => {
    const parts = name.split(" ").filter((word) => !skip.has(word.toLowerCase()));
    return parts[parts.length - 1] ?? name;
  };
  return `${take(left.name)} ${WEAVE_NOUNS[salt % WEAVE_NOUNS.length]}`;
}

function resolvePower(id: string, depth = 0): CatalogPower | null {
  const listed = BOOK.get(id);
  if (listed) return listed;
  if (depth > 6) return null;
  const cached = WOVEN.get(id);
  if (cached) return cached;
  const pair = parseWeave(id);
  if (!pair) return null;
  const left = resolvePower(pair[0], depth + 1);
  const right = resolvePower(pair[1], depth + 1);
  if (!left || !right) return null;
  const generation = ceilingGeneration(left.generation, right.generation);
  const salt = hashPair(left.id, right.id);
  const power: CatalogPower = {
    id,
    name: weaveName(left, right, salt),
    description: `Forced from ${left.name} and ${right.name}. Nobody wrote this page. It hits harder than a basic, and it is worse to master.`,
    tags: [...new Set([...left.tags, ...right.tags])].slice(0, 4),
    ingredients: [left.id, right.id].sort(),
    generation,
    tier: 1,
    tierName: "Basic",
    unlocked: false,
  };
  stampTier(power);
  WOVEN.set(id, power);
  return power;
}

function copyPower(power: CatalogPower): CatalogPower {
  return { ...power, ingredients: [...power.ingredients] };
}

export function getPower(id: string | null | undefined): CatalogPower | null {
  if (!id) return null;
  const power = resolvePower(id);
  return power ? copyPower(power) : null;
}

export function allPowers(): CatalogPower[] {
  return [...BOOK.values()].map((power) => ({ ...power, ingredients: [...power.ingredients] }));
}

export function viewPowers(unlocked: readonly string[]): CatalogPower[] {
  const owned = new Set(unlocked);
  return allPowers().map((power) => ({ ...power, unlocked: owned.has(power.id) }));
}

export function legacyComboId(powerId: PowerId | null | undefined): string | null {
  if (!powerId) return null;
  return LEGACY_TO_COMBO[powerId] ?? null;
}

export function legacyFromCombo(comboId: string): PowerId | null {
  return COMBO_TO_LEGACY[comboId] ?? null;
}

export function basePowers(): CatalogPower[] {
  return allPowers().filter((power) => power.generation === 0 && power.ingredients.length === 0);
}

/**
 * Mix two unlocked powers. Named braids win when the book has them.
 * Any other pair still mixes. The result stays at generation 2. There is no generation 3.
 * Order does not matter. A power cannot pair with itself.
 */
export function mix(idA: string, idB: string, unlocked: readonly string[]): MixResult {
  if (!idA || !idB) return { ok: false, reason: "Pick two powers." };
  if (idA === idB) return { ok: false, reason: "A power can't braid with itself." };
  const left = resolvePower(idA);
  const right = resolvePower(idB);
  if (!left || !right) return { ok: false, reason: "One of those isn't a power you hold." };
  const owned = new Set(unlocked);
  if (!owned.has(idA) || !owned.has(idB)) return { ok: false, reason: "You don't hold both of those yet." };
  const named = BY_PAIR.get(pairKey(idA, idB));
  const result = named ?? resolvePower(weaveId(idA, idB));
  if (!result) return { ok: false, reason: "Those two refuse to sit in the same hand." };
  if (owned.has(result.id)) return { ok: false, reason: `${result.name} is already yours.` };
  return { ok: true, power: copyPower(result) };
}

export function possibleMixes(unlocked: readonly string[]): PossibleMix[] {
  const owned = new Set(unlocked);
  const out: PossibleMix[] = [];
  for (const result of BOOK.values()) {
    if (result.ingredients.length !== 2 || owned.has(result.id)) continue;
    const [a, b] = result.ingredients;
    if (!a || !b || !owned.has(a) || !owned.has(b)) continue;
    const attempt = mix(a, b, unlocked);
    if (!attempt.ok) continue;
    const left = getPower(a);
    const right = getPower(b);
    if (!left || !right) continue;
    out.push({ left, right, result: attempt.power });
  }
  return out.sort((a, b) => a.result.generation - b.result.generation || a.result.name.localeCompare(b.result.name));
}

export function teachableBases(heroUnlocked: readonly string[], playerUnlocked: readonly string[]): CatalogPower[] {
  const owned = new Set(playerUnlocked);
  const seen = new Set<string>();
  const out: CatalogPower[] = [];
  for (const id of heroUnlocked) {
    const power = getPower(id);
    if (!power || power.generation !== 0 || owned.has(power.id) || seen.has(power.id)) continue;
    seen.add(power.id);
    out.push(power);
  }
  return out;
}

export interface Lesson {
  heroId: string;
  alias: string;
  powerId: string;
  powerName: string;
  resultName: string;
}

export function nextLesson(
  unlocked: readonly string[],
  heroes: readonly { id: string; alias: string; met: boolean; unlocked: readonly string[] }[],
): Lesson | null {
  for (const hero of heroes) {
    if (!hero.met) continue;
    for (const power of teachableBases(hero.unlocked, unlocked)) {
      const opened = possibleMixes([...unlocked, power.id]).find((item) => item.left.id === power.id || item.right.id === power.id);
      if (!opened) continue;
      return { heroId: hero.id, alias: hero.alias, powerId: power.id, powerName: power.name, resultName: opened.result.name };
    }
  }
  return null;
}

export function randomMissingBase(unlocked: readonly string[], roll: number): CatalogPower | null {
  const owned = new Set(unlocked);
  const missing = basePowers().filter((power) => !owned.has(power.id));
  if (!missing.length) return null;
  return missing[Math.floor(roll * missing.length) % missing.length] ?? null;
}

export function offerPower(unlocked: readonly string[], age: number, roll: number): CatalogPower | null {
  const owned = new Set(unlocked);
  const bases = basePowers().filter((power) => !owned.has(power.id));
  const mixed = allPowers().filter((power) => power.generation === 1 && !owned.has(power.id));
  const apex = allPowers().filter((power) => power.generation >= 2 && !owned.has(power.id));
  const want = age < 16 ? 0 : age < 21 ? (roll < 0.62 ? 0 : 1) : roll < 0.4 ? 0 : roll < 0.78 ? 1 : 2;
  const pool = want === 0 ? bases : want === 1 ? mixed : apex;
  const fallback = bases.length ? bases : mixed.length ? mixed : apex;
  const list = pool.length ? pool : fallback;
  if (!list.length) return null;
  const index = Math.floor(((roll * 17.13) % 1) * list.length) % list.length;
  const power = list[index];
  return power ? copyPower(power) : null;
}

export function selfCheck(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const entry of CATALOG) {
    if (ids.has(entry.id)) errors.push(`duplicate ${entry.id}`);
    ids.add(entry.id);
    for (const ingredient of entry.ingredients) {
      if (!ids.has(ingredient) && !CATALOG.some((item) => item.id === ingredient)) errors.push(`${entry.id} missing ${ingredient}`);
    }
  }
  const starters = ["fire-control", "super-speed", "super-strength"];
  const first = mix("fire-control", "super-speed", starters);
  if (!first.ok || first.power.id !== "light-speed" || first.power.generation !== 1) errors.push("chain step 1 failed");
  const mid = first.ok ? [...starters, first.power.id] : starters;
  const second = mix("light-speed", "super-strength", mid);
  if (!second.ok || second.power.id !== "lightning-strikes" || second.power.generation !== 2) errors.push("chain step 2 failed");
  const withWeather = second.ok ? [...mid, second.power.id, "weather"] : mid;
  const third = mix("lightning-strikes", "weather", withWeather);
  if (!third.ok || third.power.id !== "cataclysm-storm" || third.power.generation !== 2) errors.push("lightning strikes mix failed");
  const blocked = mix("lightning-strikes", "cataclysm-storm", third.ok ? [...withWeather, third.power.id] : withWeather);
  if (!blocked.ok || blocked.power.generation !== 2 || !blocked.power.id.startsWith("w:")) errors.push("apex pair should mix under the ceiling");
  const gapOwned = [...starters, "sorcery"];
  const gap = mix("sorcery", "super-strength", gapOwned);
  if (!gap.ok || !gap.power.id.startsWith("w:") || gap.power.tier !== 2) errors.push("gap pair failed");
  const gapSwap = mix("super-strength", "sorcery", gapOwned);
  if (!gapSwap.ok || !gap.ok || gapSwap.power.id !== gap.power.id) errors.push("weave order mattered");
  const hidden = offerPower(starters, 18, 0.2);
  if (hidden && starters.includes(hidden.id)) errors.push("offer handed back a starter");
  const swapped = mix("super-speed", "fire-control", starters);
  if (!swapped.ok || swapped.power.id !== "light-speed") errors.push("order mattered");
  if (possibleMixes(starters).length < 3) errors.push("starters should offer several mixes");
  for (const power of BOOK.values()) {
    if (power.generation > 2) errors.push(`gen overflow ${power.id}`);
    if (power.ingredients.length === 2 && power.generation === 0) errors.push(`unresolved ${power.id}`);
  }
  return errors;
}
