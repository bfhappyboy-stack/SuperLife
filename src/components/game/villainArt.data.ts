import { ARENA_ROSTER } from "@/game/arena.roster";
import { PRESETS } from "@/game/presets";

/**
 * Villains with an illustrated card in `VillainArt.tsx` (its spec table is typed on this list).
 * The first 18 are the Arena's signature villains; the rest (2026-11-03 pm) are the most-seen legend
 * rogues in the life sim; the night pass drew the last 15, so every Arena villain and legend rogue has a card.
 */
export const VILLAIN_ART_IDS = [
  "goblin", "venom", "ock", "joker", "bane", "stane", "ultron", "abomination", "lex",
  "zod", "doomsday", "cheetah", "red-skull", "loki", "hela", "killmonger", "sabretooth", "reverse-flash",
  "mysterio", "vulture", "kraven", "two-face", "riddler", "scarecrow", "penguin", "whiplash",
  "mandarin", "leader", "brainiac", "winter", "zemo", "klaw", "circe", "malekith",
  "hammer", "ross-red", "maestro", "ares", "medusa", "crossbones", "surtur", "mbaku", "namor",
  "deathstrike", "omega-red", "silver-samurai", "captain-cold", "grodd", "mirror-master",
] as const;
export type VillainArtId = (typeof VILLAIN_ART_IDS)[number];

const IDS = new Set<string>(VILLAIN_ART_IDS);
export const hasVillainArt = (id: string): id is VillainArtId => IDS.has(id);

/** Card colours for legend rogues that aren't on the Arena roster (Arena villains use their roster colour). */
export const ROGUE_COLORS: Partial<Record<VillainArtId, string>> = {
  mysterio: "#3fbf6a", vulture: "#4a6a7a", kraven: "#c8862a", "two-face": "#9a8ab0", riddler: "#3aa04a",
  scarecrow: "#a07a3a", penguin: "#3a3a5a", whiplash: "#3ab8d8", mandarin: "#c8962a", leader: "#5aa83a",
  brainiac: "#7a3aa0", winter: "#5a6a8a", zemo: "#7a3aa0", klaw: "#c84a2a", circe: "#2a9a5a", malekith: "#a02a3a",
  hammer: "#4a6aa0", "ross-red": "#c83a1a", maestro: "#5a8a3a", ares: "#8a2a1a", medusa: "#3a8a4a", crossbones: "#5a1a1a",
  surtur: "#e0561a", mbaku: "#8a7a5a", namor: "#1a8a7a", deathstrike: "#b02a5a", "omega-red": "#b01a1a", "silver-samurai": "#8a90a8",
  "captain-cold": "#3a8ac8", grodd: "#7a4aa0", "mirror-master": "#3a9a7a",
};

const strip = (name: string) => name.trim().toLowerCase().replace(/^the\s+/, "");

/** Life-sim fights only know the foe's alias ("Green Goblin", "The Riddler"); map it back to an illustrated villain. */
const BY_NAME = new Map<string, { id: VillainArtId; color: string }>();
for (const f of ARENA_ROSTER) if (f.side === "villain" && IDS.has(f.id)) BY_NAME.set(strip(f.name), { id: f.id as VillainArtId, color: f.color });
for (const preset of PRESETS) {
  for (const v of preset.villains ?? []) {
    if (!IDS.has(v.id)) continue;
    const id = v.id as VillainArtId;
    const color = ROGUE_COLORS[id] ?? ARENA_ROSTER.find((f) => f.id === id)?.color ?? "#8a5cd8";
    for (const key of [v.alias, v.name]) if (key && !BY_NAME.has(strip(key))) BY_NAME.set(strip(key), { id, color });
  }
}

export function villainArtFor(name: string): { id: VillainArtId; color: string } | null {
  return BY_NAME.get(strip(name)) ?? null;
}
