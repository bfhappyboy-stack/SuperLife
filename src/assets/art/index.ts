/** Lazy key art. Each image is its own chunk, so the first paint never waits on it. */
const LOADERS: Record<string, () => Promise<{ default: string }>> = {
  nyc: () => import("./city-nyc"),
  hood: () => import("./city-hood"),
  stacks: () => import("./city-stacks"),
  metro: () => import("./city-metro"),
  harbor: () => import("./city-harbor"),
  neon: () => import("./city-neon"),
  dust: () => import("./city-dust"),
  crown: () => import("./city-crown"),
  title: () => import("./title-keyart"),
  // God Mode legends (see src/game/presets.ts). Rename the presets there; the art keys stay.
  "hero-spider-man": () => import("./hero-spider-man"),
  "hero-batman": () => import("./hero-batman"),
  "hero-iron-man": () => import("./hero-iron-man"),
  "hero-hulk": () => import("./hero-hulk"),
  "hero-superman": () => import("./hero-superman"),
  "hero-wonder-woman": () => import("./hero-wonder-woman"),
  "hero-captain-america": () => import("./hero-captain-america"),
  "hero-thor": () => import("./hero-thor"),
  "hero-black-panther": () => import("./hero-black-panther"),
  "hero-wolverine": () => import("./hero-wolverine"),
  "hero-flash": () => import("./hero-flash"),
  // Painted villain portraits (2026-11-09): the 18 Arena villains. `VillainArt` uses them over its vector card.
  "villain-goblin": () => import("./villain-goblin"),
  "villain-venom": () => import("./villain-venom"),
  "villain-ock": () => import("./villain-ock"),
  "villain-joker": () => import("./villain-joker"),
  "villain-bane": () => import("./villain-bane"),
  "villain-stane": () => import("./villain-stane"),
  "villain-ultron": () => import("./villain-ultron"),
  "villain-abomination": () => import("./villain-abomination"),
  "villain-lex": () => import("./villain-lex"),
  "villain-zod": () => import("./villain-zod"),
  "villain-doomsday": () => import("./villain-doomsday"),
  "villain-cheetah": () => import("./villain-cheetah"),
  "villain-red-skull": () => import("./villain-red-skull"),
  "villain-loki": () => import("./villain-loki"),
  "villain-hela": () => import("./villain-hela"),
  "villain-killmonger": () => import("./villain-killmonger"),
  "villain-sabretooth": () => import("./villain-sabretooth"),
  "villain-reverse-flash": () => import("./villain-reverse-flash"),
  // 2026-11-09 night: the 31 legend rogues (every villain in the game now has a painting).
  "villain-mysterio": () => import("./villain-mysterio"),
  "villain-vulture": () => import("./villain-vulture"),
  "villain-kraven": () => import("./villain-kraven"),
  "villain-two-face": () => import("./villain-two-face"),
  "villain-riddler": () => import("./villain-riddler"),
  "villain-scarecrow": () => import("./villain-scarecrow"),
  "villain-penguin": () => import("./villain-penguin"),
  "villain-whiplash": () => import("./villain-whiplash"),
  "villain-mandarin": () => import("./villain-mandarin"),
  "villain-leader": () => import("./villain-leader"),
  "villain-brainiac": () => import("./villain-brainiac"),
  "villain-winter": () => import("./villain-winter"),
  "villain-zemo": () => import("./villain-zemo"),
  "villain-klaw": () => import("./villain-klaw"),
  "villain-circe": () => import("./villain-circe"),
  "villain-malekith": () => import("./villain-malekith"),
  "villain-hammer": () => import("./villain-hammer"),
  "villain-ross-red": () => import("./villain-ross-red"),
  "villain-maestro": () => import("./villain-maestro"),
  "villain-ares": () => import("./villain-ares"),
  "villain-medusa": () => import("./villain-medusa"),
  "villain-crossbones": () => import("./villain-crossbones"),
  "villain-surtur": () => import("./villain-surtur"),
  "villain-mbaku": () => import("./villain-mbaku"),
  "villain-namor": () => import("./villain-namor"),
  "villain-deathstrike": () => import("./villain-deathstrike"),
  "villain-omega-red": () => import("./villain-omega-red"),
  "villain-silver-samurai": () => import("./villain-silver-samurai"),
  "villain-captain-cold": () => import("./villain-captain-cold"),
  "villain-grodd": () => import("./villain-grodd"),
  "villain-mirror-master": () => import("./villain-mirror-master"),
};

const cache = new Map<string, string>();

export function hasArt(key: string): boolean {
  return key in LOADERS;
}

export function cachedArt(key: string): string | undefined {
  return cache.get(key);
}

export async function loadArt(key: string): Promise<string | undefined> {
  const hit = cache.get(key);
  if (hit) return hit;
  const loader = LOADERS[key];
  if (!loader) return undefined;
  const mod = await loader();
  cache.set(key, mod.default);
  return mod.default;
}
