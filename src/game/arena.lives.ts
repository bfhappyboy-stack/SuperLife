/**
 * Saved lives in the Arena: any living hero with a power (age 14+) can be drafted as themselves.
 * Their equipped six come along, re-priced to Arena numbers so a level-90 veteran doesn't one-shot
 * Batman and a fresh teen isn't useless. Unranked: they never feed the roster balance numbers.
 */
import { battleMoves } from "./moves";
import { elementOfPower, type ElementId } from "./elements";
import { arenaCooldown, arenaCost, type ArenaFighter, type ArenaPassive, type PassiveKind } from "./arena.roster";
import type { DuelMove, Game, MoveStyle } from "./types";

const PASSIVE_BY_ELEMENT: Partial<Record<ElementId, [PassiveKind, string, string]>> = {
  fire: ["worthy", "Firestorm", "Area moves hit 25% harder."],
  lightning: ["worthy", "Overcharge", "Area moves hit 25% harder."],
  energy: ["worthy", "Overcharge", "Area moves hit 25% harder."],
  light: ["worthy", "Flare", "Area moves hit 25% harder."],
  speed: ["speedster", "Quick Start", "Dash moves hit 25% harder, and they lead the first turn."],
  wind: ["speedster", "Tailwind", "Dash moves hit 25% harder, and they lead the first turn."],
  force: ["rage", "Second Wind", "Hits harder the more hurt they are: up to +40%."],
  gravity: ["rage", "Heavy Hands", "Hits harder the more hurt they are: up to +40%."],
  shield: ["bulwark", "Iron Stance", "Guard moves cut damage by 40% instead of 20%."],
  ice: ["bulwark", "Frost Wall", "Guard moves cut damage by 40% instead of 20%."],
  life: ["regen", "Fast Healer", "Heals 5% each turn unless a trick or status move lands."],
  stretch: ["steel", "Rubber Frame", "Takes 15% less from strike moves."],
};
const FALLBACK: [PassiveKind, string, string] = ["prep", "Read the Room", "+1 energy every turn."];

/** Spread the kit's powers onto the Arena's 5–9 band, keeping their order. */
const BAND = [5, 6, 7, 7, 8, 9];

export function fighterFromLife(slot: number, game: Game): ArenaFighter | null {
  if (!game || game.phase === "dead" || game.age < 14 || !game.powerId) return null;
  const raw = battleMoves(game).slice(0, 6);
  if (raw.length < 6) return null;
  const order = raw.map((m, i) => [m.power, i] as const).sort((a, b) => a[0] - b[0]);
  const power: number[] = [];
  order.forEach(([, i], rank) => (power[i] = BAND[rank]!));
  const moves: DuelMove[] = raw.map((m, i) => {
    const p = power[i]!;
    return { ...m, id: `life${slot}-${m.id ?? i}`, power: p, energy: arenaCost(p, m.kind), cooldown: arenaCooldown(p, m.kind) };
  });
  // Every Arena fighter needs an answer to every tell: retune the weakest duplicate style if one is missing.
  for (const style of ["strike", "trick", "guard"] as MoveStyle[]) {
    if (moves.some((m) => m.style === style)) continue;
    const counts = new Map<MoveStyle, number>();
    moves.forEach((m) => counts.set(m.style, (counts.get(m.style) ?? 0) + 1));
    const idx = moves.reduce((best, m, i) => ((counts.get(m.style) ?? 0) > 1 && (best < 0 || m.power < moves[best]!.power) ? i : best), -1);
    if (idx >= 0) moves[idx] = { ...moves[idx]!, style, kind: style === "guard" ? "guard" : moves[idx]!.kind === "guard" ? undefined : moves[idx]!.kind };
  }
  const el = elementOfPower(game.unlockedPowers?.[0] ?? game.powerId);
  const [kind, name, text] = PASSIVE_BY_ELEMENT[el] ?? FALLBACK;
  const passive: ArenaPassive = { kind, name, text };
  return {
    id: `life-${slot}`,
    name: game.name,
    title: `Your life · age ${game.age}`,
    side: "hero",
    world: "spider-man",
    color: "#e6b34d",
    sex: game.sex === "female" ? "female" : "male",
    hp: 104,
    passive,
    moves,
    tint: { suit: "#2a3a5a", trim: "#e6b34d", mask: "domino" },
    seed: game.portrait * 7919 + slot,
    life: { look: game.look, wardrobe: game.wardrobe, age: game.age, sex: game.sex },
    custom: true,
  };
}
