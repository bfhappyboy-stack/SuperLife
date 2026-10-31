/**
 * Markets & economy. Data-driven: every item is a row in MARKET, every price is computed, nothing is stored
 * except what you own. Money finally has somewhere to go: gear wears out, homes cost upkeep, influence buys
 * fame or quiet, and late in life money can turn into legacy.
 *
 * Pure functions only. The engine calls buyItem / sellAsset from act(), marketYear() on birthdays,
 * marketMonth() every month and marketEdge() when a minigame resolves.
 */
import type { ChapterPhaseId } from "./chapters";
import type { Effects, Game, TraitId } from "./types";

export type MarketCat = "gear" | "supplies" | "intel" | "influence" | "property" | "tech" | "legacy";
export type MiniKind = "timing" | "pattern" | "duel";

export interface MarketItem {
  id: string;
  cat: MarketCat;
  name: string;
  blurb: string;
  /** Base price in today's money, before city, era, traits, reputation and the yearly swing. */
  price: number;
  minAge?: number;
  maxAge?: number;
  /** Any one of these traits unlocks it. */
  traits?: TraitId[];
  cities?: string[];
  minRep?: number;
  minFame?: number;
  minRank?: number;
  minSmarts?: number;
  phases?: ChapterPhaseId[];
  /** Black-market goods: underworld ties, low karma, or a rough city. */
  black?: boolean;
  /** Applied once on purchase. */
  buy?: Effects;
  /** Gear and intel: a minigame bonus with limited uses. */
  edge?: { kinds: MiniKind[]; amount: number; uses: number };
  /** Changes flags.heat (police / press attention). Negative cools it. */
  heat?: number;
  /** Passive effects every birthday while owned. */
  yearly?: Effects;
  /** Yearly upkeep as a fraction of current value (property) or a flat amount if >= 1. */
  upkeep?: number;
  /** Yearly change in value (property). */
  appreciate?: number;
  /** Yearly cash income (rent, royalties) as a fraction of value. */
  income?: number;
  /** Legacy points on purchase. */
  legacy?: number;
  /** Money placed in the family trust (paid to an heir at 18). Fraction of price. */
  trust?: number;
  /** Owned items that persist (property, tech, gear). Consumables vanish on use. */
  keep?: boolean;
  /** Only one can be owned at a time. */
  unique?: boolean;
  /** Monthly heat cooling while owned (hideouts). */
  coolHeat?: number;
  /** Stock per year. */
  stock?: number;
}

export interface Asset {
  uid: string;
  itemId: string;
  paid: number;
  value: number;
  boughtAge: number;
  uses?: number;
}

export interface MarketState {
  assets: Asset[];
  /** Purchases this year by item id; resets every birthday. */
  bought: Record<string, number>;
  /** Lifetime spend and income, for the ledger. */
  spent: number;
  earned: number;
  /** Last year's net from holdings (income minus upkeep). */
  lastNet: number;
  /** Legacy purchases made, for diminishing returns. */
  gifts?: number;
}

export const CAT_META: Record<MarketCat, { label: string; short: string; line: string }> = {
  gear: { label: "Gear", short: "Gear", line: "Kit that helps in a fight or a stunt. It wears out." },
  supplies: { label: "Supplies", short: "Meds", line: "Medical, recovery and training boosts. Used once." },
  intel: { label: "Intel", short: "Intel", line: "Files, tips and patterns. Spent on your next fight." },
  influence: { label: "Influence", short: "Sway", line: "Favors, PR and lobbying. Fame, standing, or quiet." },
  property: { label: "Property", short: "Homes", line: "Homes, bases and hideouts. Upkeep, perks, and value over decades." },
  tech: { label: "Tech", short: "Tech", line: "Permanent upgrades. Era, age and know-how decide what exists." },
  legacy: { label: "Legacy", short: "Legacy", line: "Turn money into something that outlives you." },
};

export const CAT_ORDER: MarketCat[] = ["gear", "supplies", "intel", "influence", "property", "tech", "legacy"];

export const MARKET: MarketItem[] = [
  // GEAR: minigame edge, wears out.
  { id: "wraps", cat: "gear", name: "Hand wraps & mouthguard", blurb: "Cheap, honest, and better than your knuckles.", price: 120, minAge: 10, edge: { kinds: ["duel"], amount: 0.05, uses: 4 }, keep: true },
  { id: "runners", cat: "gear", name: "Grip runners", blurb: "Soles that argue with gravity and usually win.", price: 260, minAge: 10, edge: { kinds: ["timing"], amount: 0.06, uses: 5 }, keep: true },
  { id: "earpiece", cat: "gear", name: "Comms earpiece", blurb: "Someone in your ear who has read the map.", price: 900, minAge: 14, edge: { kinds: ["pattern", "timing"], amount: 0.06, uses: 6 }, keep: true },
  { id: "kevlar", cat: "gear", name: "Kevlar weave vest", blurb: "Stops what it can. Bruises you for the rest.", price: 2400, minAge: 16, edge: { kinds: ["duel"], amount: 0.1, uses: 6 }, keep: true },
  { id: "gauntlets", cat: "gear", name: "Shock gauntlets", blurb: "A second opinion in each fist.", price: 6800, minAge: 18, edge: { kinds: ["duel", "timing"], amount: 0.12, uses: 8 }, keep: true, cities: ["stacks", "neon", "metro", "nyc"] },
  { id: "drone", cat: "gear", name: "Scout drone", blurb: "A camera with opinions. Sees the pattern before you do.", price: 4200, minAge: 16, edge: { kinds: ["pattern"], amount: 0.14, uses: 6 }, keep: true },
  { id: "street-blade", cat: "gear", name: "Unmarked street kit", blurb: "Bought off a trunk. No receipt, no questions, no warranty.", price: 1500, minAge: 15, black: true, edge: { kinds: ["duel", "timing"], amount: 0.1, uses: 3 }, keep: true, heat: 3 },
  { id: "exo-frame", cat: "gear", name: "Exo-frame harness", blurb: "Industrial lifter, de-industrialized. Your back sends thanks.", price: 22000, minAge: 20, edge: { kinds: ["duel", "timing", "pattern"], amount: 0.15, uses: 12 }, keep: true, traits: ["inventor", "insider"] },

  // SUPPLIES: instant, consumed.
  { id: "first-aid", cat: "supplies", name: "Field first-aid kit", blurb: "Gauze, glue, and the confidence to use both.", price: 60, minAge: 8, buy: { health: 6 }, stock: 3 },
  { id: "physio", cat: "supplies", name: "Private physio block", blurb: "Ten sessions with someone who knows where it hurts.", price: 900, minAge: 16, buy: { health: 14, happiness: 2 }, stock: 2 },
  { id: "clinic", cat: "supplies", name: "Specialist clinic stay", blurb: "Clean sheets, quiet machines, a bill with a view.", price: 6500, minAge: 18, buy: { health: 30, happiness: -2 }, stock: 1 },
  { id: "stim", cat: "supplies", name: "Training stim", blurb: "Legal in most places. The drill feels shorter.", price: 450, minAge: 16, buy: { powerLevel: 0.04, health: -3 }, stock: 2 },
  { id: "retreat", cat: "supplies", name: "Mountain retreat", blurb: "A week with no signal and no villains. Allegedly.", price: 3200, minAge: 18, buy: { happiness: 12, health: 4 }, stock: 1 },
  { id: "grey-meds", cat: "supplies", name: "Grey-market regen", blurb: "Works fast. The label is in a language that might not exist.", price: 2200, minAge: 18, black: true, buy: { health: 26, karma: -2 }, stock: 1, heat: 2 },
  { id: "tutor", cat: "supplies", name: "Private tutor", blurb: "Someone patient, paid to be patient.", price: 700, minAge: 8, maxAge: 30, buy: { smarts: 4 }, stock: 1 },
  { id: "makeover", cat: "supplies", name: "Stylist & shoot", blurb: "Good light, better angles, a new you that photographs.", price: 1600, minAge: 16, buy: { looks: 5, fame: 1 }, stock: 1 },

  // INTEL: one-shot fight edge or tips.
  { id: "tape", cat: "intel", name: "Fight tape", blurb: "Hours of footage on whoever you face next.", price: 400, minAge: 12, edge: { kinds: ["duel"], amount: 0.14, uses: 1 } },
  { id: "blueprints", cat: "intel", name: "Building blueprints", blurb: "Every vent, stairwell and bad decision in the plans.", price: 1200, minAge: 14, edge: { kinds: ["pattern", "timing"], amount: 0.16, uses: 2 } },
  { id: "villain-file", cat: "intel", name: "Villain dossier", blurb: "Habits, tells, and who they still call on birthdays.", price: 5200, minAge: 18, minRank: 1, edge: { kinds: ["duel"], amount: 0.22, uses: 2 } },
  { id: "fence-tip", cat: "intel", name: "Fence's tip", blurb: "A loading dock, a schedule, and a guard who naps.", price: 1800, minAge: 16, black: true, edge: { kinds: ["timing", "pattern", "duel"], amount: 0.18, uses: 2 }, heat: 2 },
  { id: "arc-leak", cat: "intel", name: "Insider leak", blurb: "A memo that was never supposed to be printed.", price: 3800, minAge: 20, traits: ["insider", "underworld"], edge: { kinds: ["timing", "pattern", "duel"], amount: 0.2, uses: 3 } },

  // INFLUENCE: fame / rep / heat.
  { id: "pr-push", cat: "influence", name: "PR push", blurb: "A week of interviews where you look thoughtful.", price: 2500, minAge: 16, buy: { fame: 5, reputation: 2 }, stock: 1 },
  { id: "charity-gala", cat: "influence", name: "Charity gala table", blurb: "Expensive soup. Excellent photos. Real money to real people.", price: 9000, minAge: 21, buy: { reputation: 6, fame: 3, karma: 3 }, stock: 1 },
  { id: "favor", cat: "influence", name: "Call in a favor", blurb: "Someone at the League owes someone who owes you.", price: 4000, minAge: 18, minRep: 10, buy: { reputation: 5 }, heat: -4, stock: 1 },
  { id: "fixer", cat: "influence", name: "Fixer on retainer", blurb: "Stories go away. So does some of your soul.", price: 7000, minAge: 18, black: true, buy: { karma: -4 }, heat: -12, stock: 1 },
  { id: "lobby", cat: "influence", name: "City hall lobbying", blurb: "Permits, patrol routes, and a council that returns calls.", price: 30000, minAge: 25, traits: ["millionaire", "insider"], buy: { reputation: 8, fame: 2, karma: -1 }, heat: -6, stock: 1 },
  { id: "media-buy", cat: "influence", name: "Prime-time spot", blurb: "Thirty seconds of you, slow-motion, wind machine.", price: 45000, minAge: 21, minFame: 20, buy: { fame: 9, reputation: 1 }, stock: 1 },

  // PROPERTY: upkeep, appreciation, passives.
  { id: "studio", cat: "property", name: "Studio apartment", blurb: "One room, one window, all yours.", price: 140000, minAge: 18, keep: true, unique: true, upkeep: 0.035, appreciate: 0.03, yearly: { happiness: 2 } },
  { id: "hideout", cat: "property", name: "Hideout", blurb: "A basement with three exits and one rule.", price: 55000, minAge: 16, keep: true, unique: true, upkeep: 0.05, appreciate: 0.01, coolHeat: 2, yearly: { health: 1 } },
  { id: "brownstone", cat: "property", name: "Brownstone", blurb: "Stoop, garden, neighbors who wave.", price: 850000, minAge: 22, keep: true, unique: true, upkeep: 0.03, appreciate: 0.045, income: 0.012, yearly: { happiness: 3, health: 1 }, cities: ["nyc", "crown", "harbor", "metro"] },
  { id: "loft-base", cat: "property", name: "Warehouse base", blurb: "Training floor, garage, a coffee machine the size of a car.", price: 420000, minAge: 21, keep: true, unique: true, upkeep: 0.045, appreciate: 0.025, yearly: { powerLevel: 0.03, happiness: 1 } },
  { id: "rental", cat: "property", name: "Rental building", blurb: "Six units, one boiler, endless texts.", price: 1200000, minAge: 25, keep: true, unique: true, upkeep: 0.03, appreciate: 0.035, income: 0.06, yearly: { happiness: -1 } },
  { id: "penthouse", cat: "property", name: "Penthouse", blurb: "The city laid out like a map you own.", price: 3600000, minAge: 25, keep: true, unique: true, upkeep: 0.035, appreciate: 0.05, yearly: { happiness: 4, fame: 1 }, traits: ["millionaire", "insider"] },
  { id: "hq", cat: "property", name: "Hero headquarters", blurb: "A tower with your mark on it. Hangar optional.", price: 9000000, minAge: 30, minRank: 3, keep: true, unique: true, upkeep: 0.04, appreciate: 0.04, yearly: { fame: 2, reputation: 2, powerLevel: 0.04 } },
  { id: "safehouses", cat: "property", name: "Safehouse network", blurb: "Four doors in four boroughs. Keys on one ring.", price: 380000, minAge: 21, black: true, keep: true, unique: true, upkeep: 0.06, appreciate: 0.02, coolHeat: 4 },

  // TECH: permanent; era + know-how gate.
  { id: "smart-suit", cat: "tech", name: "Smart-fabric lining", blurb: "Your suit reads your pulse and stiffens where it counts.", price: 18000, minAge: 18, keep: true, unique: true, yearly: { health: 1 }, edge: { kinds: ["duel"], amount: 0.05, uses: 999 } },
  { id: "neural", cat: "tech", name: "Neural focus band", blurb: "Quiet in your head on command. Mostly on command.", price: 26000, minAge: 20, minSmarts: 55, keep: true, unique: true, yearly: { smarts: 1 }, edge: { kinds: ["pattern"], amount: 0.08, uses: 999 } },
  { id: "augment", cat: "tech", name: "Street augment", blurb: "Reflex wire, installed in a room you will not describe.", price: 15000, minAge: 18, cities: ["stacks", "neon", "hood"], keep: true, unique: true, buy: { health: -6 }, edge: { kinds: ["timing", "duel"], amount: 0.08, uses: 999 } },
  { id: "lab", cat: "tech", name: "Home lab", blurb: "Bench, printer, and a fire extinguisher on a first-name basis.", price: 60000, minAge: 18, traits: ["inventor"], keep: true, unique: true, yearly: { smarts: 1, powerLevel: 0.05 }, upkeep: 3000 },
  { id: "longevity", cat: "tech", name: "Longevity program", blurb: "Bloodwork, scans and a doctor who says 'optimize'.", price: 120000, minAge: 50, keep: true, unique: true, yearly: { health: 4 }, upkeep: 15000 },
  { id: "ai-assist", cat: "tech", name: "Personal AI ops", blurb: "Schedules, scanners, and someone who remembers names.", price: 40000, minAge: 25, minSmarts: 40, keep: true, unique: true, yearly: { reputation: 1, fame: 1 }, edge: { kinds: ["pattern", "timing"], amount: 0.05, uses: 999 }, upkeep: 2400 },

  // LEGACY: late-life uses.
  { id: "fund-rookie", cat: "legacy", name: "Fund a rookie", blurb: "A kid with a spark and no rent money. Now they have one.", price: 30000, minAge: 40, legacy: 3, buy: { reputation: 3, happiness: 3, karma: 2 }, stock: 2 },
  { id: "scholarship", cat: "legacy", name: "Endow a scholarship", blurb: "Your name on a form that changes someone's decade.", price: 250000, minAge: 45, legacy: 7, buy: { reputation: 4, happiness: 4, karma: 3 }, stock: 1 },
  { id: "trust", cat: "legacy", name: "Family trust", blurb: "Money for whoever wears the cape next. Opens at eighteen.", price: 200000, minAge: 35, legacy: 2, trust: 0.9, stock: 1 },
  { id: "foundation", cat: "legacy", name: "Start a foundation", blurb: "A board, a mission, and a yearly check to the city.", price: 2000000, minAge: 50, keep: true, unique: true, legacy: 10, buy: { reputation: 8, karma: 4 }, upkeep: 60000, yearly: { reputation: 1, happiness: 2 } },
  { id: "memorial", cat: "legacy", name: "Memorial park", blurb: "Trees, benches, and a plaque with the right dates.", price: 600000, minAge: 60, legacy: 6, buy: { happiness: 5, fame: 2 }, stock: 1, phases: ["legacy", "mentor", "final"] },
];

export const itemById = (id: string) => MARKET.find((item) => item.id === id);

/** City price multipliers per category. 1 = baseline. */
const CITY_MUL: Record<string, Partial<Record<MarketCat, number>> & { all?: number }> = {
  nyc: { all: 1.15, property: 1.55, influence: 1.2 },
  hood: { all: 0.85, property: 0.6, gear: 0.9, intel: 0.8, influence: 0.8 },
  stacks: { all: 0.95, tech: 0.7, gear: 0.85, property: 0.75, supplies: 1.1 },
  metro: { all: 1.0, property: 1.1 },
  harbor: { all: 0.95, property: 1.0, intel: 0.9 },
  neon: { all: 1.05, tech: 0.8, influence: 1.25, property: 1.2 },
  dust: { all: 0.8, property: 0.45, tech: 1.3, gear: 0.9 },
  crown: { all: 1.2, property: 1.4, legacy: 0.9, influence: 1.1 },
};

/** Decade drift: tech gets cheaper and better, property gets dearer, everything else inflates a little. */
export function eraMul(cat: MarketCat, age: number): number {
  const decades = Math.max(0, age / 10);
  if (cat === "tech") return Math.max(0.45, 1 - 0.08 * decades);
  if (cat === "property") return Math.pow(1.12, decades);
  return Math.pow(1.03, decades);
}

export function isBlackMarketOpen(g: Pick<Game, "traits" | "stats" | "cityId">): boolean {
  return g.traits.includes("underworld") || (g.stats.karma ?? 0) <= -20 || g.cityId === "hood" || g.cityId === "stacks";
}

function phaseOf(g: Game): ChapterPhaseId | null {
  return g.chapters?.[g.chapters.length - 1]?.phase ?? null;
}

/** Deterministic hash: same hero, same year, same prices. No RNG is consumed by browsing. */
function hash(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
  }
  return (h >>> 0) / 4294967296;
}

export function priceFactors(g: Game, item: MarketItem) {
  const city = CITY_MUL[g.cityId] ?? { all: 1 };
  const cityMul = (city.all ?? 1) * (city[item.cat] ?? 1);
  const era = eraMul(item.cat, g.age);
  let trait = 1;
  const has = (id: TraitId) => g.traits.includes(id);
  if (has("millionaire") && (item.cat === "property" || item.cat === "influence" || item.cat === "supplies")) trait *= 0.85;
  if (has("insider") && (item.cat === "tech" || item.cat === "influence" || item.cat === "intel")) trait *= 0.85;
  if (has("inventor") && (item.cat === "tech" || item.cat === "gear")) trait *= 0.75;
  if (has("underworld") && item.black) trait *= 0.7;
  // Reputation: the respectable pay less for respectable things; infamy pays a premium on the clean market.
  const rep = g.stats.reputation ?? 0;
  const repMul = item.black ? 1 + Math.max(0, rep) / 250 : 1 - Math.max(-0.12, Math.min(0.1, rep / 500));
  // Crisis chapters make medicine and intel dear; legacy chapters make legacy giving cheaper (matching funds).
  const phase = phaseOf(g);
  let phaseMul = 1;
  if (phase === "crisis" && (item.cat === "supplies" || item.cat === "intel")) phaseMul = 1.2;
  if ((phase === "legacy" || phase === "mentor" || phase === "final") && item.cat === "legacy") phaseMul = 0.85;
  const swing = 0.85 + hash(g.portrait, g.age, item.id, "price") * 0.3;
  return { cityMul, era, trait, repMul, phaseMul, swing };
}

export function priceOf(g: Game, item: MarketItem): number {
  const f = priceFactors(g, item);
  return nice(item.price * f.cityMul * f.era * f.trait * f.repMul * f.phaseMul * f.swing);
}

/** How this price compares to the base in today's money: < 1 is a deal. */
export function priceTrend(g: Game, item: MarketItem): number {
  return priceOf(g, item) / item.price;
}

function nice(value: number): number {
  if (value < 100) return Math.max(5, Math.round(value / 5) * 5);
  if (value < 1000) return Math.round(value / 10) * 10;
  if (value < 10000) return Math.round(value / 50) * 50;
  if (value < 100000) return Math.round(value / 500) * 500;
  return Math.round(value / 5000) * 5000;
}

export function marketOf(g: Game): MarketState {
  const m = (g as Game & { market?: MarketState }).market;
  return m ?? { assets: [], bought: {}, spent: 0, earned: 0, lastNet: 0 };
}

export function ensureMarket(g: Game): MarketState {
  if (!g.market || !Array.isArray(g.market.assets)) g.market = { assets: [], bought: {}, spent: 0, earned: 0, lastNet: 0 };
  if (!g.market.bought) g.market.bought = {};
  return g.market;
}

/** Why an item is not for you (yet), or null if it is. Hidden items return "hidden". */
export function gateOf(g: Game, item: MarketItem): string | null {
  if (item.minAge != null && g.age < item.minAge) return item.minAge - g.age > 12 ? "hidden" : `Opens at ${item.minAge}`;
  if (item.maxAge != null && g.age > item.maxAge) return "hidden";
  if (item.black && !isBlackMarketOpen(g)) return "hidden";
  if (item.cities && !item.cities.includes(g.cityId)) return "hidden";
  if (item.phases) {
    const phase = phaseOf(g);
    if (!phase || !item.phases.includes(phase)) return "Later chapters";
  }
  if (item.traits && !item.traits.some((id) => g.traits.includes(id))) return `Needs ${item.traits.map(traitName).join(" or ")}`;
  if (item.minRank != null && g.leagueRank < item.minRank) return "League members only";
  if (item.minRep != null && g.stats.reputation < item.minRep) return `Rep ${item.minRep}+`;
  if (item.minFame != null && g.stats.fame < item.minFame) return `Fame ${item.minFame}+`;
  if (item.minSmarts != null && g.stats.smarts < item.minSmarts) return `Mind ${item.minSmarts}+`;
  return null;
}

function traitName(id: TraitId): string {
  return id === "inventor" ? "Tech genius" : id === "insider" ? "Corporate insider" : id === "underworld" ? "Underworld ties" : id === "millionaire" ? "Millionaire" : id;
}

/** This year's stock in a category: a seeded rotation of what is open, plus a couple of locked teasers. */
export function shelfOf(g: Game, cat: MarketCat): { item: MarketItem; price: number; gate: string | null; left: number }[] {
  const m = marketOf(g);
  const rows = MARKET.filter((item) => item.cat === cat)
    .map((item) => ({ item, gate: gateOf(g, item) }))
    .filter((row) => row.gate !== "hidden");
  const open = rows.filter((row) => !row.gate);
  const locked = rows.filter((row) => row.gate);
  const keepCount = cat === "supplies" || cat === "gear" ? 5 : 4;
  // Rotation: drop one random open item per year when the shelf is long, so stock feels alive.
  const rotated = open
    .map((row) => ({ row, k: hash(g.portrait, g.age, row.item.id, "stock") }))
    .sort((a, b) => a.k - b.k)
    .slice(0, Math.max(keepCount, open.length - 1))
    .map((x) => x.row);
  const ordered = [...rotated.sort((a, b) => a.item.price - b.item.price), ...locked.slice(0, 2)];
  return ordered.map(({ item, gate }) => {
    const owned = item.unique && m.assets.some((asset) => asset.itemId === item.id);
    const left = owned ? 0 : Math.max(0, (item.stock ?? (item.keep ? 1 : 2)) - (m.bought[item.id] ?? 0));
    return { item, price: priceOf(g, item), gate, left };
  });
}

/** Yearly holdings cost/income preview for one asset. */
export function assetYear(asset: Asset): { upkeep: number; income: number; growth: number } {
  const item = itemById(asset.itemId);
  if (!item) return { upkeep: 0, income: 0, growth: 0 };
  const upkeep = item.upkeep == null ? 0 : item.upkeep >= 1 ? item.upkeep : asset.value * item.upkeep;
  const income = item.income ? asset.value * item.income : 0;
  const growth = item.appreciate ? asset.value * item.appreciate : 0;
  return { upkeep: Math.round(upkeep), income: Math.round(income), growth: Math.round(growth) };
}

export function holdings(g: Game) {
  const m = marketOf(g);
  let value = 0;
  let upkeep = 0;
  let income = 0;
  for (const asset of m.assets) {
    const item = itemById(asset.itemId);
    if (item?.cat === "property" || item?.cat === "tech") value += asset.value;
    const y = assetYear(asset);
    upkeep += y.upkeep;
    income += y.income;
  }
  return { value: Math.round(value), upkeep, income, net: income - upkeep, count: m.assets.length };
}

export function sellValue(asset: Asset): number {
  const item = itemById(asset.itemId);
  if (!item) return 0;
  if (item.cat === "property") return Math.round(asset.value * 0.92);
  if (item.cat === "tech") return Math.round(asset.value * 0.4);
  if (item.cat === "gear") return Math.round(asset.paid * 0.3 * ((asset.uses ?? 1) / (item.edge?.uses ?? 1)));
  return 0;
}

export interface MarketResult {
  ok: boolean;
  line: string;
  effects?: Effects;
  heat?: number;
  legacy?: number;
}

/** Buy one item. Mutates g (a draft). Returns what the engine must still apply (effects, heat, legacy). */
export function buyItem(g: Game, itemId: string): MarketResult {
  const item = itemById(itemId);
  if (!item) return { ok: false, line: "Not on the shelf." };
  const gate = gateOf(g, item);
  if (gate) return { ok: false, line: gate === "hidden" ? "Not for sale to you." : gate };
  const m = ensureMarket(g);
  const row = shelfOf(g, item.cat).find((r) => r.item.id === itemId);
  if (!row || row.left <= 0) return { ok: false, line: "Sold out until your next birthday." };
  const price = row.price;
  if (g.stats.money < price) return { ok: false, line: `You need ${price - g.stats.money} more.` };
  g.stats.money -= price;
  m.spent += price;
  m.bought[itemId] = (m.bought[itemId] ?? 0) + 1;
  const keep = item.keep || (!!item.edge && item.cat === "intel");
  if (keep) {
    const uid = `a${g.nextId++}`;
    m.assets.push({ uid, itemId, paid: price, value: price, boughtAge: g.age, uses: item.edge ? item.edge.uses : undefined });
  }
  let legacy = item.legacy;
  if (legacy) {
    // Giving keeps meaning something, but the tenth plaque moves you less than the first.
    m.gifts = (m.gifts ?? 0) + 1;
    legacy = Math.max(1, Math.round(legacy * Math.max(0.25, 1 - (m.gifts - 1) / 8)));
  }
  if (item.trust) g.flags.trust = (g.flags.trust ?? 0) + Math.round(price * item.trust);
  return { ok: true, line: buyLine(item), effects: item.buy, heat: item.heat, legacy };
}

function buyLine(item: MarketItem): string {
  switch (item.cat) {
    case "property":
      return `${item.name}: keys in hand. Upkeep comes every birthday.`;
    case "gear":
      return `${item.name} added to the kit. It helps until it breaks.`;
    case "intel":
      return `${item.name} in the file. It pays off in your next fight.`;
    case "tech":
      return `${item.name} installed. Permanent, until the next model.`;
    case "legacy":
      return `${item.name}. Your name goes somewhere it will stay.`;
    case "influence":
      return `${item.name}. The city adjusts its opinion.`;
    default:
      return `${item.name}. Used, and worth it.`;
  }
}

export function sellAsset(g: Game, uid: string): MarketResult {
  const m = ensureMarket(g);
  const index = m.assets.findIndex((asset) => asset.uid === uid);
  const asset = m.assets[index];
  if (!asset) return { ok: false, line: "You do not own that." };
  const item = itemById(asset.itemId);
  const cash = sellValue(asset);
  m.assets.splice(index, 1);
  g.stats.money += cash;
  m.earned += cash;
  return { ok: true, line: `Sold ${item?.name ?? "it"} for ${cash.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.` };
}

/**
 * Minigame edge from gear, tech and intel. Uses the best applicable gear, the best tech and one intel file.
 * Wears gear down and consumes intel. Mutates g.
 */
export function marketEdge(g: Game, kind: MiniKind): { bonus: number; notes: string[] } {
  const m = g.market;
  if (!m?.assets?.length) return { bonus: 0, notes: [] };
  let bonus = 0;
  const notes: string[] = [];
  const pick = (cat: MarketCat) =>
    m.assets
      .filter((asset) => {
        const item = itemById(asset.itemId);
        return item?.cat === cat && item.edge?.kinds.includes(kind) && (asset.uses ?? 0) > 0;
      })
      .sort((a, b) => (itemById(b.itemId)?.edge?.amount ?? 0) - (itemById(a.itemId)?.edge?.amount ?? 0))[0];
  for (const cat of ["gear", "tech", "intel"] as const) {
    const asset = pick(cat);
    if (!asset) continue;
    const item = itemById(asset.itemId);
    if (!item?.edge) continue;
    bonus += item.edge.amount;
    if (cat !== "tech") asset.uses = (asset.uses ?? 1) - 1;
    if ((asset.uses ?? 0) <= 0 && cat !== "tech") {
      m.assets = m.assets.filter((a) => a.uid !== asset.uid);
      notes.push(cat === "gear" ? `${item.name} finally gives out.` : `${item.name} paid off.`);
    }
  }
  return { bonus: Math.min(0.3, bonus), notes };
}

/** Birthday: values move, upkeep is paid, passives tick, and debt takes the house. Mutates g. */
export function marketYear(g: Game): { effects: Effects[]; banners: string[]; legacy: number } {
  const m = g.market;
  const out = { effects: [] as Effects[], banners: [] as string[], legacy: 0 };
  if (m) m.bought = {};
  if (g.age === 18 && (g.flags.trust ?? 0) > 0) {
    const sum = g.flags.trust ?? 0;
    g.stats.money += sum;
    delete g.flags.trust;
    out.banners.push(`The family trust opens: ${fmt(sum)}. Someone planned for you.`);
  }
  if (!m?.assets?.length) return out;
  let upkeep = 0;
  let income = 0;
  for (const asset of m.assets) {
    const item = itemById(asset.itemId);
    if (!item) continue;
    const y = assetYear(asset);
    upkeep += y.upkeep;
    income += y.income;
    if (item.appreciate) {
      const drift = (hash(g.portrait, g.age, asset.uid, "drift") - 0.5) * 0.06;
      asset.value = Math.round(asset.value * (1 + item.appreciate + drift));
    } else if (item.cat === "tech") {
      asset.value = Math.round(asset.value * 0.88);
    }
    if (item.yearly) out.effects.push(item.yearly);
    if (item.id === "foundation") out.legacy += 1;
  }
  const net = income - upkeep;
  g.stats.money += net;
  m.lastNet = net;
  m.earned += income;
  m.spent += upkeep;
  if (upkeep > 0 || income > 0) out.banners.push(`Holdings: ${income ? `${fmt(income)} in, ` : ""}${fmt(upkeep)} upkeep.`);
  // Debt: the bank takes the dearest property at 60% of value.
  if (g.stats.money < -15000) {
    const props = m.assets.filter((asset) => itemById(asset.itemId)?.cat === "property").sort((a, b) => b.value - a.value);
    const lost = props[0];
    if (lost) {
      const cash = Math.round(lost.value * 0.6);
      m.assets = m.assets.filter((a) => a.uid !== lost.uid);
      g.stats.money += cash;
      out.banners.push(`The bank takes the ${itemById(lost.itemId)?.name.toLowerCase()} and sends ${fmt(cash)} back with a form letter.`);
      out.effects.push({ happiness: -8, reputation: -2 });
    }
  }
  return out;
}

/** Monthly: hideouts cool heat. Mutates g. */
export function marketMonth(g: Game) {
  const m = g.market;
  if (!m?.assets?.length) return;
  let cool = 0;
  for (const asset of m.assets) cool = Math.max(cool, itemById(asset.itemId)?.coolHeat ?? 0);
  if (!cool) return;
  if ((g.flags.heat ?? 0) > 0) g.flags.heat = Math.max(0, (g.flags.heat ?? 0) - Math.ceil(cool / 2));
  if (g.crew && (g.crew.heat ?? 0) > 0) g.crew.heat = Math.max(0, g.crew.heat - cool);
}

function fmt(n: number): string {
  const abs = Math.abs(Math.round(n));
  const s = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M` : abs >= 10_000 ? `$${Math.round(abs / 1000)}k` : `$${abs.toLocaleString("en-US")}`;
  return n < 0 ? `-${s}` : s;
}
