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
