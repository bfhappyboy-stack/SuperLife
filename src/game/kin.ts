// Legend kinship: which powers fit a God Mode legend's canon. Teachers, year offers and stray sparks
// lean toward these so a Flash grows into lightning and phasing rather than telepathy and sorcery.
// Nothing is forbidden: braiding an off-canon pair on purpose is still allowed (that is bending canon).
import { getPower } from "./combo";
import { presetById } from "./presets";

/** How often an offer that could go either way picks a fitting power for a legend. */
export const KIN_WEIGHT = 0.85;

/** Base powers that fit this legend: the bases under the canon kit plus its stretch list. Null for ordinary lives. */
export function legendKin(presetId: string | null | undefined): Set<string> | null {
  const legend = presetById(presetId);
  if (!legend || !legend.powers.length) return null;
  const out = new Set<string>();
  const addBases = (id: string, depth = 0) => {
    const power = getPower(id);
    if (!power || depth > 3) return;
    if (!power.ingredients.length) out.add(power.id);
    for (const part of power.ingredients) addBases(part, depth + 1);
  };
  for (const id of legend.powers) addBases(id);
  for (const id of legend.stretch ?? []) addBases(id);
  return out;
}

/** True when every base under this power fits the legend (always true for ordinary lives). */
export function legendFits(presetId: string | null | undefined, powerId: string): boolean {
  const kin = legendKin(presetId);
  if (!kin) return true;
  const power = getPower(powerId);
  if (!power) return false;
  if (!power.ingredients.length) return kin.has(power.id);
  return power.ingredients.every((part) => legendFits(presetId, part));
}

/** Fitting powers first, original order kept inside each group. */
export function kinOrder<T extends { id: string }>(presetId: string | null | undefined, list: T[]): T[] {
  if (!legendKin(presetId)) return list;
  return [...list.filter((p) => legendFits(presetId, p.id)), ...list.filter((p) => !legendFits(presetId, p.id))];
}

/**
 * Narrow a random pool for a legend: with KIN_WEIGHT odds keep only fitting powers (when any exist).
 * `roll` is a 0–1 draw from the game RNG so saves stay deterministic.
 */
export function kinPool<T extends { id: string }>(presetId: string | null | undefined, list: T[], roll: number): T[] {
  if (!legendKin(presetId) || roll >= KIN_WEIGHT) return list;
  const fit = list.filter((p) => legendFits(presetId, p.id));
  return fit.length ? fit : list;
}
