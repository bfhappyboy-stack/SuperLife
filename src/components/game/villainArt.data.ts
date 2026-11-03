import { ARENA_ROSTER } from "@/game/arena.roster";

/** Signature villains with an illustrated card in `VillainArt.tsx` (its spec table is typed on this list). */
export const VILLAIN_ART_IDS = [
  "goblin", "venom", "ock", "joker", "bane", "stane", "ultron", "abomination", "lex",
  "zod", "doomsday", "cheetah", "red-skull", "loki", "hela", "killmonger", "sabretooth", "reverse-flash",
] as const;
export type VillainArtId = (typeof VILLAIN_ART_IDS)[number];

const IDS = new Set<string>(VILLAIN_ART_IDS);
export const hasVillainArt = (id: string): id is VillainArtId => IDS.has(id);

/** Life-sim fights only know the foe's alias ("Green Goblin"); map it back to an illustrated villain. */
const BY_NAME = new Map(ARENA_ROSTER.filter((f) => f.side === "villain" && IDS.has(f.id)).map((f) => [f.name.toLowerCase(), f] as const));
export function villainArtFor(name: string): { id: VillainArtId; color: string } | null {
  const f = BY_NAME.get(name.trim().toLowerCase());
  return f ? { id: f.id as VillainArtId, color: f.color } : null;
}
