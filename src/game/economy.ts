/**
 * The living economy: city property markets, company stocks and goods that move every in-game month,
 * plus housing (rent, buy with a mortgage, let out, upgrade) and the monthly money summary.
 *
 * Pure and deterministic. Prices move from a per-life seed and the month counter through a hash, so
 * browsing, quoting and the tick itself never consume the engine's RNG (fight and event balance is untouched).
 * The engine calls economyMonth() every month, noteFight() when a villain fight resolves, and econAct()
 * for player actions ("econ|..."). Everything the UI shows comes from the view helpers at the bottom.
 * Content is data: DISTRICTS, HOMES, HOME_MODS, STOCKS, GOODS, NEWS.
 */
import { cityById, jobById, STIPEND } from "./data";
import { clamp } from "./format";
import type { Game } from "./types";

/** Feature flags. `business` stays off until Stage (c) ships complete. */
export const ECON_FLAGS = { hub: true, business: false };

export const HIST = 24;
export const TRADE_AGE = 16;
export const HOUSING_AGE = 18;
export const MORTGAGE_YEARS = 25;
export const MIN_DEPOSIT = 0.1;
export const CLOSING_FEE = 0.02;
export const SELL_FEE = 0.05;
export const LET_FEE = 0.1;
export const ARREARS_LIMIT = 3;
const MAX_NEWS = 14;

// ---------------------------------------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------------------------------------

export interface District {
  id: string;
  name: string;
  blurb: string;
  /** Price multiplier inside the city. */
  mul: number;
  /** Gross yearly rent as a share of value. Cheaper districts rent out better. */
  yield: number;
  /** Share of the city's villain trouble that lands here (0–1). */
  risk: number;
}

export const CITY_PROP: Record<string, number> = { nyc: 1.6, hood: 0.55, stacks: 0.75, metro: 1.1, harbor: 1.0, neon: 1.25, dust: 0.45, crown: 1.45 };

export const DISTRICTS: Record<string, District[]> = {
  nyc: [
    { id: "midtown", name: "Midtown", blurb: "Glass, noise, and a view of every fight.", mul: 1.4, yield: 0.042, risk: 0.5 },
    { id: "brooklyn", name: "Brooklyn", blurb: "Stoops, bakeries, rooftops with opinions.", mul: 1.0, yield: 0.05, risk: 0.3 },
    { id: "queens", name: "Queens", blurb: "Walk-ups, aunts, and the 7 train.", mul: 0.75, yield: 0.058, risk: 0.25 },
  ],
  hood: [
    { id: "parkside", name: "Parkside", blurb: "Trees, a court, and neighbors who watch out.", mul: 1.3, yield: 0.055, risk: 0.3 },
    { id: "corners", name: "The Corners", blurb: "Everybody knows your name. And your schedule.", mul: 1.0, yield: 0.066, risk: 0.55 },
    { id: "railyards", name: "Railyards", blurb: "Cheap rent, loud trains, louder nights.", mul: 0.7, yield: 0.075, risk: 0.5 },
  ],
  stacks: [
    { id: "corpyards", name: "Corp Yards", blurb: "Company housing with company cameras.", mul: 1.35, yield: 0.05, risk: 0.45 },
    { id: "stackside", name: "Stackside", blurb: "Twenty floors of balconies and fixers.", mul: 1.0, yield: 0.06, risk: 0.4 },
    { id: "foundry", name: "Foundry Row", blurb: "Soot, sparks, and space to train.", mul: 0.7, yield: 0.07, risk: 0.5 },
  ],
  metro: [
    { id: "downtown", name: "Downtown", blurb: "Where the capes fight. Where the insurance hides.", mul: 1.4, yield: 0.045, risk: 0.6 },
    { id: "uptown", name: "Uptown", blurb: "Doormen, dogs in coats, quiet money.", mul: 1.1, yield: 0.048, risk: 0.25 },
    { id: "riverside", name: "Riverside", blurb: "Ferries, families, fair prices.", mul: 0.8, yield: 0.056, risk: 0.3 },
  ],
  harbor: [
    { id: "bluffs", name: "The Bluffs", blurb: "Cliff houses above the fog line.", mul: 1.35, yield: 0.045, risk: 0.2 },
    { id: "oldport", name: "Old Port", blurb: "Warehouses, fish markets, things in the water.", mul: 1.0, yield: 0.055, risk: 0.45 },
    { id: "ferryside", name: "Ferryside", blurb: "Commuter flats and a very loud horn.", mul: 0.75, yield: 0.062, risk: 0.35 },
  ],
  neon: [
    { id: "spire", name: "The Spire", blurb: "The tallest address. The brightest target.", mul: 1.5, yield: 0.04, risk: 0.45 },
    { id: "glow", name: "Glow District", blurb: "Clubs, billboards, sleep is optional.", mul: 1.05, yield: 0.052, risk: 0.5 },
    { id: "lowlanes", name: "Low Lanes", blurb: "Under the signs, where the rent is honest.", mul: 0.7, yield: 0.065, risk: 0.45 },
  ],
  dust: [
    { id: "mainstreet", name: "Main Street", blurb: "The one traffic light, and everything near it.", mul: 1.2, yield: 0.06, risk: 0.2 },
    { id: "mesa", name: "Mesa Heights", blurb: "Big sky, big lots, small talk.", mul: 1.0, yield: 0.055, risk: 0.15 },
    { id: "railcamp", name: "Rail Camp", blurb: "Bunkhouses for the mine shifts.", mul: 0.7, yield: 0.075, risk: 0.3 },
  ],
  crown: [
    { id: "oldtown", name: "Old Town", blurb: "Old money, older gargoyles, very old lawyers.", mul: 1.45, yield: 0.04, risk: 0.4 },
    { id: "gargoyle", name: "Gargoyle Row", blurb: "Stone faces on every ledge. Some of them move.", mul: 1.0, yield: 0.05, risk: 0.5 },
    { id: "narrows", name: "The Narrows", blurb: "Cheap, close, and nobody saw anything.", mul: 0.65, yield: 0.07, risk: 0.65 },
  ],
};

export interface HomeDef {
  id: string;
  name: string;
  blurb: string;
  /** Base price before city, district and the market. */
  base: number;
  minAge: number;
  /** Joy over time (−1..3). */
  comfort: number;
  /** Health recovery over time (0..3). */
  recover: number;
  /** Secret-identity safety: heat fades faster (0..4). */
  cover: number;
  /** Training floor: edge in drills and fights (0..3). */
  train: number;
  /** Hideout upgrade slots when owned. */
  slots: number;
  rent: boolean;
  buy: boolean;
  /** Hero lair: needs a power, a kit or a League card. */
  lair?: boolean;
}

export const HOMES: HomeDef[] = [
  { id: "room", name: "Shared room", blurb: "A door that locks and three roommates who don't.", base: 70_000, minAge: 16, comfort: 0, recover: 0, cover: 1, train: 0, slots: 0, rent: true, buy: false },
  { id: "flat", name: "Tiny flat", blurb: "One room, one window, all yours.", base: 150_000, minAge: 18, comfort: 1, recover: 1, cover: 1, train: 0, slots: 0, rent: true, buy: true },
  { id: "apartment", name: "City apartment", blurb: "Two bedrooms, a balcony, a landlord who texts back.", base: 300_000, minAge: 18, comfort: 2, recover: 1, cover: 2, train: 0, slots: 1, rent: true, buy: true },
  { id: "loft", name: "Warehouse loft", blurb: "Open floor, freight lift, nobody hears you train.", base: 450_000, minAge: 20, comfort: 1, recover: 1, cover: 3, train: 2, slots: 3, rent: true, buy: true },
  { id: "townhouse", name: "Townhouse", blurb: "Three floors, a garden, neighbors who wave.", base: 650_000, minAge: 21, comfort: 2, recover: 2, cover: 2, train: 1, slots: 2, rent: true, buy: true },
  { id: "penthouse", name: "Penthouse", blurb: "The city laid out like a map you own.", base: 2_400_000, minAge: 21, comfort: 3, recover: 2, cover: 1, train: 1, slots: 2, rent: true, buy: true },
  { id: "lair", name: "Hero lair", blurb: "Under the city: hangar, cells, a computer with a name.", base: 1_800_000, minAge: 21, comfort: 1, recover: 3, cover: 4, train: 3, slots: 4, rent: false, buy: true, lair: true },
  { id: "mansion", name: "Mansion", blurb: "Grounds, a gate, and a wing you forget about.", base: 5_000_000, minAge: 21, comfort: 3, recover: 3, cover: 3, train: 2, slots: 4, rent: true, buy: true },
];

export const homeById = (id: string | undefined | null) => HOMES.find((h) => h.id === id);

export interface HomeMod {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  comfort?: number;
  recover?: number;
  cover?: number;
  train?: number;
}

export const HOME_MODS: HomeMod[] = [
  { id: "garden", name: "Roof garden", blurb: "Tomatoes, a hammock, quiet.", cost: 12_000, comfort: 1 },
  { id: "gym", name: "Training room", blurb: "Mats, weights, reinforced floor.", cost: 25_000, train: 1 },
  { id: "panic", name: "Panic room", blurb: "Steel door, own air, nobody follows you home.", cost: 35_000, cover: 1 },
  { id: "medbay", name: "Med bay", blurb: "Stitches at 3am without a waiting room.", cost: 48_000, recover: 1 },
  { id: "comms", name: "Comms room", blurb: "Police bands, scanners, a wall of screens.", cost: 40_000, cover: 1, train: 1 },
  { id: "workshop", name: "Workshop", blurb: "Lathes, a forge, a suit on a stand.", cost: 65_000, train: 1, recover: 1 },
];

export const modById = (id: string) => HOME_MODS.find((m) => m.id === id);

export interface StockDef {
  id: string;
  name: string;
  cityId: string;
  sector: "tech" | "biotech" | "energy" | "media" | "industry";
  base: number;
  vol: number;
  /** Yearly dividend as a share of price, paid monthly. */
  div: number;
  blurb: string;
}

export const STOCKS: StockDef[] = [
  { id: "STRK", name: "Stark Industries", cityId: "neon", sector: "tech", base: 180, vol: 0.06, div: 0.01, blurb: "Arc reactors, defense, and a CEO who never reads the memo." },
  { id: "WAYN", name: "Wayne Enterprises", cityId: "crown", sector: "industry", base: 140, vol: 0.04, div: 0.025, blurb: "Old money in steel, shipping and suspiciously good armor." },
  { id: "OSCP", name: "Oscorp", cityId: "nyc", sector: "biotech", base: 64, vol: 0.08, div: 0, blurb: "Genetics, gliders, and a board that keeps going missing." },
  { id: "LEXC", name: "LexCorp", cityId: "metro", sector: "tech", base: 120, vol: 0.06, div: 0.01, blurb: "Everything from phones to space stations. Smiles a lot." },
  { id: "RXXN", name: "Roxxon Energy", cityId: "harbor", sector: "energy", base: 75, vol: 0.05, div: 0.035, blurb: "Oil, rigs, and lawyers by the boatload." },
  { id: "BUGL", name: "Daily Bugle Media", cityId: "nyc", sector: "media", base: 22, vol: 0.07, div: 0.02, blurb: "Front pages, hot takes, one very loud editor." },
  { id: "HELX", name: "Helix Labs", cityId: "stacks", sector: "biotech", base: 38, vol: 0.09, div: 0, blurb: "Augments and gene clinics in the corp yards." },
  { id: "MESA", name: "Red Mesa Mining", cityId: "dust", sector: "energy", base: 30, vol: 0.07, div: 0.03, blurb: "Ore, rails and the strange rocks under the desert." },
  { id: "CAPE", name: "Cape Construction", cityId: "hood", sector: "industry", base: 26, vol: 0.05, div: 0.025, blurb: "They rebuild what the fights knock down. Business is good." },
];

export const stockById = (id: string) => STOCKS.find((s) => s.id === id);

export interface GoodDef {
  id: string;
  name: string;
  unit: string;
  base: number;
  vol: number;
  minAge?: number;
  blurb: string;
}

export const GOODS: GoodDef[] = [
  { id: "gold", name: "Gold", unit: "oz", base: 1900, vol: 0.035, blurb: "When the city panics, gold shines." },
  { id: "crude", name: "Crude oil", unit: "barrel", base: 80, vol: 0.08, blurb: "Rigs, tankers and Roxxon's mood." },
  { id: "steel", name: "Steel", unit: "tonne", base: 700, vol: 0.05, blurb: "Every wrecked block needs more of it." },
  { id: "chips", name: "Microchips", unit: "crate", base: 1200, vol: 0.07, blurb: "Suits, phones and drones all want them." },
  { id: "coffee", name: "Coffee", unit: "sack", base: 240, vol: 0.08, blurb: "The fuel of night shifts and newsrooms." },
  { id: "isotope", name: "Rare isotopes", unit: "vial", base: 5000, vol: 0.12, minAge: 21, blurb: "Glows a little. Moves a lot." },
];

export const goodById = (id: string) => GOODS.find((s) => s.id === id);

type MoveKey = "co" | "dist" | "city" | "allStocks" | "allProp" | "rate" | `s:${string}` | `g:${string}` | `sector:${string}`;

/** Random monthly headlines. `{co}` a company, `{city}` / `{dist}` a district. Moves are one-off shocks that fade. */
interface NewsDef {
  id: string;
  w: number;
  text: string;
  /** "co" = the picked company, "dist" = the picked district, "city" = every district in that city. */
  moves: { key: MoveKey; d: number }[];
}

export const NEWS: NewsDef[] = [
  { id: "contract", w: 4, text: "{co} wins a city defense contract.", moves: [{ key: "co", d: 0.09 }] },
  { id: "beat", w: 4, text: "{co} beats earnings. Analysts pretend they saw it coming.", moves: [{ key: "co", d: 0.07 }] },
  { id: "miss", w: 4, text: "{co} misses earnings. The call goes badly.", moves: [{ key: "co", d: -0.08 }] },
  { id: "recall", w: 3, text: "{co} recalls a product line after a lab fire.", moves: [{ key: "co", d: -0.11 }] },
  { id: "scandal", w: 2, text: "{co}'s CEO photographed with a supervillain's lawyer.", moves: [{ key: "co", d: -0.14 }] },
  { id: "patent", w: 3, text: "{co} unveils a breakthrough. Shares jump.", moves: [{ key: "co", d: 0.12 }] },
  { id: "boom", w: 3, text: "{dist}, {city}: a new campus is coming. Buyers queue.", moves: [{ key: "dist", d: 0.05 }] },
  { id: "transit", w: 3, text: "{city} opens a new train line. Homes near it climb.", moves: [{ key: "city", d: 0.025 }] },
  { id: "blight", w: 3, text: "{dist}, {city}: a crime wave scares buyers off.", moves: [{ key: "dist", d: -0.045 }] },
  { id: "hike", w: 3, text: "The central bank raises rates. Mortgages get dearer.", moves: [{ key: "rate", d: 0.5 }, { key: "allProp", d: -0.012 }, { key: "allStocks", d: -0.02 }] },
  { id: "cut", w: 3, text: "Rates are cut. Buyers and stocks cheer.", moves: [{ key: "rate", d: -0.5 }, { key: "allProp", d: 0.012 }, { key: "allStocks", d: 0.025 }] },
  { id: "chips", w: 3, text: "A chip shortage hits. Suit makers scramble.", moves: [{ key: "g:chips", d: 0.16 }, { key: "sector:tech", d: -0.03 }] },
  { id: "glut", w: 3, text: "An oil glut sinks crude. Roxxon sulks.", moves: [{ key: "g:crude", d: -0.15 }, { key: "s:RXXN", d: -0.05 }] },
  { id: "spill", w: 2, text: "A tanker spill off Harbor Bay. Crude spikes.", moves: [{ key: "g:crude", d: 0.14 }, { key: "s:RXXN", d: -0.06 }] },
  { id: "nerves", w: 3, text: "Markets get nervous. Gold shines.", moves: [{ key: "g:gold", d: 0.07 }, { key: "allStocks", d: -0.03 }] },
  { id: "frost", w: 3, text: "Frost hits the coffee belt. Newsrooms panic.", moves: [{ key: "g:coffee", d: 0.18 }, { key: "s:BUGL", d: -0.02 }] },
  { id: "rebuild", w: 3, text: "Rebuilding after the latest fights. Steel orders surge.", moves: [{ key: "g:steel", d: 0.12 }, { key: "s:CAPE", d: 0.06 }] },
  { id: "isorocks", w: 2, text: "Strange rocks found under Dustreach. Isotopes tumble.", moves: [{ key: "g:isotope", d: -0.18 }, { key: "s:MESA", d: 0.08 }] },
  { id: "labfire", w: 2, text: "A lab accident creates three new villains. Isotopes soar.", moves: [{ key: "g:isotope", d: 0.2 }, { key: "sector:biotech", d: -0.05 }] },
  { id: "rally", w: 2, text: "A quiet month for villains. Markets rally.", moves: [{ key: "allStocks", d: 0.06 }] },
  { id: "crash", w: 1, text: "Flash crash! Everyone blames a speedster.", moves: [{ key: "allStocks", d: -0.12 }, { key: "g:gold", d: 0.05 }] },
  { id: "biotech", w: 2, text: "A gene therapy is approved. Biotech flies.", moves: [{ key: "sector:biotech", d: 0.1 }] },
  { id: "energy", w: 2, text: "A cold winter. Energy stocks warm up.", moves: [{ key: "sector:energy", d: 0.06 }, { key: "g:crude", d: 0.06 }] },
  { id: "media", w: 2, text: "A cape scandal sells a million papers.", moves: [{ key: "sector:media", d: 0.09 }] },
];

// ---------------------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------------------

export interface Lot {
  n: number;
  /** Total paid, fees included (cost basis). */
  cost: number;
  /** Shares from a family trust can't be sold before this age. */
  lockUntil?: number;
}

export interface Mortgage {
  bal: number;
  /** Yearly rate in percent, fixed at purchase. */
  rate: number;
  pay: number;
  /** Months left. */
  left: number;
}

export interface OwnedHome {
  uid: string;
  homeId: string;
  cityId: string;
  districtId: string;
  /** Custom name, e.g. "Wayne Manor". */
  name?: string;
  paid: number;
  mortgage: Mortgage | null;
  letOut: boolean;
  mods: string[];
  /** Month index you got the keys. */
  since: number;
  note?: string;
  /** A family estate: the trust and the staff cover its upkeep (Wayne Manor, the Stark mansion). */
  estate?: boolean;
}

export interface Lease {
  homeId: string;
  cityId: string;
  districtId: string;
  name?: string;
  rent: number;
  deposit: number;
  /** Month index the lease renews (rent re-priced toward market). */
  renew: number;
  /** Rent-controlled leases re-price at this share of market. */
  control?: number;
}

export interface News {
  at: number;
  text: string;
  tone: 1 | -1 | 0;
  tag: "stock" | "good" | "prop" | "rate" | "hero" | "villain";
  cityId?: string;
}

export interface MonthLine {
  label: string;
  amount: number;
}

export interface MonthSummary {
  at: number;
  lines: MonthLine[];
  net: number;
  /** Change in holdings value this month (not cash). */
  swing: number;
  perks: string[];
}

export interface EconState {
  v: 1;
  seed: number;
  t: number;
  lv: Record<string, number>;
  reg: Record<string, number>;
  h: Record<string, number[]>;
  news: News[];
  fightAt?: number;
  stocks: Record<string, Lot>;
  goods: Record<string, Lot>;
  homes: OwnedHome[];
  lease: Lease | null;
  /** "lease", an owned home uid, or null (family home / couch). */
  living: string | null;
  arrears: number;
  acc: { joy: number; hp: number; heat: number };
  last: MonthSummary | null;
  worth: number[];
  stats: { fees: number; realized: number; trades: number };
  /** God Mode start applied. */
  started?: boolean;
  nextUid: number;
}

// ---------------------------------------------------------------------------------------------------------
// Maths helpers
// ---------------------------------------------------------------------------------------------------------

export function hash(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 15), 2246822507);
  }
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Standard normal from two hashed uniforms (Box–Muller), clamped to ±3. */
function normal(...parts: (string | number)[]): number {
  const u = Math.max(1e-9, hash(...parts, "u"));
  const v = hash(...parts, "v");
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), -3, 3);
}

/** Fixed-rate amortised monthly payment. */
export function mortgagePayment(loan: number, ratePct: number, months: number): number {
  if (loan <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r <= 0) return Math.round(loan / months);
  return Math.round((loan * r) / (1 - Math.pow(1 + r, -months)));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

const at = (g: Pick<Game, "age" | "month">) => g.age * 12 + (g.month ?? 0);

// ---------------------------------------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------------------------------------

type SeriesClass = "prop" | "stock" | "good" | "rate";

let SERIES: string[] | null = null;
export function allSeries(): string[] {
  if (SERIES) return SERIES;
  const keys: string[] = [];
  for (const [city, list] of Object.entries(DISTRICTS)) for (const d of list) keys.push(`p:${city}:${d.id}`);
  for (const s of STOCKS) keys.push(`s:${s.id}`);
  for (const g of GOODS) keys.push(`g:${g.id}`);
  keys.push("rate");
  SERIES = keys;
  return keys;
}

function classOf(key: string): SeriesClass {
  return key === "rate" ? "rate" : key[0] === "p" ? "prop" : key[0] === "s" ? "stock" : "good";
}

function volOf(key: string): number {
  const c = classOf(key);
  if (c === "prop") return 0.009;
  if (c === "stock") return stockById(key.slice(2))?.vol ?? 0.06;
  if (c === "good") return goodById(key.slice(2))?.vol ?? 0.06;
  return 0.12;
}

/** Long-run anchor in log space after t months: property creeps up, stocks grow, goods hover. */
function anchor(key: string, t: number, seed: number): number {
  const c = classOf(key);
  const tilt = hash(seed, key, "home") - 0.5;
  if (c === "prop") return 0.001 * t + tilt * 0.08;
  if (c === "stock") return 0.0018 * t + tilt * 0.3;
  return tilt * 0.2;
}

function reversion(key: string): number {
  const c = classOf(key);
  return c === "prop" ? 0.03 : c === "stock" ? 0.04 : c === "good" ? 0.07 : 0.06;
}

/** Trend regimes: each group (a city's property, one company, one good, the rate) drifts for a while, then flips. */
function regimeGroup(key: string): string {
  if (key.startsWith("p:")) return `p:${key.split(":")[1]}`;
  return key;
}

function regimeDrift(key: string, pick: number): number {
  const c = classOf(key);
  const unit = c === "prop" ? 0.004 : c === "stock" ? 0.008 : c === "good" ? 0.01 : 0.05;
  return pick < 0.3 ? -unit : pick < 0.62 ? unit * 0.25 : unit;
}

function step(e: EconState, key: string) {
  const c = classOf(key);
  const group = regimeGroup(key);
  if (e.reg[group] === undefined || hash(e.seed, e.t, group, "flip") < 1 / 18) {
    // Same hash for every district of a city, so the whole city flips together.
    e.reg[group] = regimeDrift(key, hash(e.seed, e.t, group, "reg"));
  }
  const drift = e.reg[group] ?? 0;
  const z = normal(e.seed, e.t, key);
  if (c === "rate") {
    const r = e.lv.rate ?? 5.5;
    e.lv.rate = round4(clamp(r + drift + 0.12 * z - 0.06 * (r - 5.5), 2.5, 10));
    return;
  }
  const lv = e.lv[key] ?? 1;
  const log = Math.log(lv);
  const next = log + drift + volOf(key) * z - reversion(key) * (log - anchor(key, e.t, e.seed));
  e.lv[key] = round4(clamp(Math.exp(next), 0.15, 40));
}

function stepAll(e: EconState) {
  for (const key of allSeries()) step(e, key);
}

function push(e: EconState, key: string) {
  const list = e.h[key] ?? (e.h[key] = []);
  list.push(e.lv[key] ?? 1);
  if (list.length > HIST) list.splice(0, list.length - HIST);
}

function shock(e: EconState, key: string, d: number) {
  if (key === "rate") {
    e.lv.rate = round4(clamp((e.lv.rate ?? 5.5) + d, 2.5, 10));
    return;
  }
  e.lv[key] = round4(clamp((e.lv[key] ?? 1) * (1 + d), 0.15, 40));
}

/** Shock a key and rewrite this month's history point, so a mid-month event shows on the chart at once. */
function shockNow(e: EconState, key: string, d: number) {
  shock(e, key, d);
  const list = e.h[key];
  if (list?.length) list[list.length - 1] = e.lv[key] ?? 1;
}

// ---------------------------------------------------------------------------------------------------------
// Setup and migration
// ---------------------------------------------------------------------------------------------------------

export function econOf(g: Game): EconState | null {
  return g.economy && g.economy.v === 1 ? g.economy : null;
}

function blank(seed: number): EconState {
  return { v: 1, seed, t: 0, lv: {}, reg: {}, h: {}, news: [], stocks: {}, goods: {}, homes: [], lease: null, living: null, arrears: 0, acc: { joy: 0, hp: 0, heat: 0 }, last: null, worth: [], stats: { fees: 0, realized: 0, trades: 0 }, nextUid: 1 };
}

/** Make sure the life has an economy: seeded from the hero, with two years of history so charts move from day one. */
export function ensureEconomy(g: Game): EconState {
  const prior = g.economy as EconState | undefined;
  if (prior && prior.v === 1 && prior.lv && typeof prior.lv === "object" && prior.h && typeof prior.h === "object") {
    // Defensive repair for partial or older saves.
    if (!prior.stocks || typeof prior.stocks !== "object") prior.stocks = {};
    if (!prior.goods || typeof prior.goods !== "object") prior.goods = {};
    if (!prior.reg || typeof prior.reg !== "object") prior.reg = {};
    prior.homes = Array.isArray(prior.homes) ? prior.homes.filter((h) => h && homeById(h.homeId) && districtOf(h.cityId, h.districtId)) : [];
    for (const h of prior.homes) if (!Array.isArray(h.mods)) h.mods = [];
    prior.news = Array.isArray(prior.news) ? prior.news : [];
    if (!prior.acc) prior.acc = { joy: 0, hp: 0, heat: 0 };
    if (!prior.stats) prior.stats = { fees: 0, realized: 0, trades: 0 };
    prior.worth = Array.isArray(prior.worth) ? prior.worth : [];
    if (typeof prior.nextUid !== "number") prior.nextUid = prior.homes.length + 1;
    if (typeof prior.arrears !== "number") prior.arrears = 0;
    if (!prior.lease || !homeById(prior.lease.homeId)) prior.lease = null;
    if (prior.living === undefined || (prior.living === "lease" && !prior.lease) || (prior.living && prior.living !== "lease" && !prior.homes.some((h) => h.uid === prior.living))) prior.living = prior.lease ? "lease" : null;
    for (const key of allSeries()) {
      if (typeof prior.lv[key] !== "number" || !Number.isFinite(prior.lv[key])) prior.lv[key] = key === "rate" ? 5.5 : 1;
      if (!Array.isArray(prior.h[key])) prior.h[key] = [prior.lv[key]!];
    }
    return prior;
  }
  const seed = Math.floor(hash(g.portrait, g.name, g.cityId, g.upbringing) * 1_000_000_000);
  const e = blank(seed);
  for (const key of allSeries()) {
    e.lv[key] = key === "rate" ? round4(4.5 + hash(seed, key, "start") * 2.5) : round4(Math.exp(anchor(key, 0, seed) + (hash(seed, key, "start") - 0.5) * (key.startsWith("p:") ? 0.08 : 0.25)));
  }
  // Warm start: two years of history and a few old headlines, so the charts and ticker move from day one.
  const now = at(g);
  for (let i = 0; i < HIST; i += 1) {
    e.t += 1;
    stepAll(e);
    rollNews(e, g, now - HIST + i + 1);
    for (const key of allSeries()) push(e, key);
  }
  e.news = e.news.slice(-4);
  g.economy = e;
  applyLegendStart(g, e);
  e.worth = [netWorth(g)];
  return e;
}

// ---------------------------------------------------------------------------------------------------------
// God Mode starts
// ---------------------------------------------------------------------------------------------------------

interface LegendStart {
  own?: { homeId: string; districtId: string; name: string; note: string }[];
  stocks?: Record<string, { n: number; lockUntil: number }>;
  /** A lease that starts on this birthday. */
  lease?: { age: number; homeId: string; districtId: string; name: string; control: number };
}

export const LEGEND_START: Record<string, LegendStart> = {
  batman: {
    own: [{ homeId: "mansion", districtId: "oldtown", name: "Wayne Manor", note: "The family estate. The caves below come with it." }],
    stocks: { WAYN: { n: 4000, lockUntil: 18 } },
  },
  "iron-man": {
    own: [{ homeId: "mansion", districtId: "spire", name: "Stark Mansion", note: "Dad's house. The basement has better tools than MIT." }],
    stocks: { STRK: { n: 3000, lockUntil: 21 } },
  },
  "spider-man": {
    lease: { age: 18, homeId: "flat", districtId: "queens", name: "Queens walk-up", control: 0.7 },
  },
};

function applyLegendStart(g: Game, e: EconState) {
  if (e.started) return;
  e.started = true;
  const start = g.preset ? LEGEND_START[g.preset] : undefined;
  if (!start) return;
  for (const own of start.own ?? []) {
    if (!districtOf(g.cityId, own.districtId)) continue;
    const home: OwnedHome = { uid: `h${e.nextUid++}`, homeId: own.homeId, cityId: g.cityId, districtId: own.districtId, name: own.name, note: own.note, estate: true, paid: 0, mortgage: null, letOut: false, mods: [], since: at(g) };
    e.homes.push(home);
    e.living = home.uid;
  }
  for (const [id, lot] of Object.entries(start.stocks ?? {})) e.stocks[id] = { n: lot.n, cost: 0, lockUntil: lot.lockUntil };
}

// ---------------------------------------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------------------------------------

export function districtOf(cityId: string, districtId: string): District | undefined {
  return DISTRICTS[cityId]?.find((d) => d.id === districtId);
}

export function districtsOf(cityId: string): District[] {
  return DISTRICTS[cityId] ?? DISTRICTS.nyc!;
}

/** The city whose districts this life shops in (unknown cities fall back to New York's map). */
export function marketCity(cityId: string): string {
  return DISTRICTS[cityId] ? cityId : "nyc";
}

export function homePrice(e: EconState, homeId: string, cityId: string, districtId: string): number {
  const home = homeById(homeId);
  const dist = districtOf(cityId, districtId);
  if (!home || !dist) return 0;
  return nice(home.base * (CITY_PROP[cityId] ?? 1) * dist.mul * (e.lv[`p:${cityId}:${districtId}`] ?? 1));
}

export function marketRent(e: EconState, homeId: string, cityId: string, districtId: string): number {
  const dist = districtOf(cityId, districtId);
  const home = homeById(homeId);
  if (!dist || !home) return 0;
  // Rooms are dear per square foot; big homes rent at a lower yield.
  const size = home.base <= 70_000 ? 1.25 : home.base >= 2_000_000 ? 0.85 : 1;
  return Math.max(50, Math.round((homePrice(e, homeId, cityId, districtId) * dist.yield * size) / 12 / 10) * 10);
}

export function modsValue(home: OwnedHome): number {
  return home.mods.reduce((sum, id) => sum + (modById(id)?.cost ?? 0) * 0.5, 0);
}

export function homeValue(e: EconState, home: OwnedHome): number {
  return homePrice(e, home.homeId, home.cityId, home.districtId) + modsValue(home);
}

/** Monthly upkeep: 1.1% of value a year, plus 1% a year of what the upgrades cost. */
export function homeUpkeep(e: EconState, home: OwnedHome): number {
  if (home.estate) return 0;
  return Math.round((homeValue(e, home) * 0.011 + home.mods.reduce((s, id) => s + (modById(id)?.cost ?? 0) * 0.01, 0)) / 12);
}

export function letIncome(e: EconState, home: OwnedHome): number {
  return Math.round(marketRent(e, home.homeId, home.cityId, home.districtId) * (1 - LET_FEE));
}

export function stockPrice(e: EconState, id: string): number {
  const s = stockById(id);
  return s ? Math.max(0.5, Math.round(s.base * (e.lv[`s:${id}`] ?? 1) * 100) / 100) : 0;
}

export function goodPrice(e: EconState, id: string): number {
  const s = goodById(id);
  return s ? Math.max(1, Math.round(s.base * (e.lv[`g:${id}`] ?? 1) * 100) / 100) : 0;
}

function nice(value: number): number {
  if (value < 10_000) return Math.round(value / 50) * 50;
  if (value < 100_000) return Math.round(value / 500) * 500;
  if (value < 1_000_000) return Math.round(value / 1000) * 1000;
  return Math.round(value / 10_000) * 10_000;
}

// ---------------------------------------------------------------------------------------------------------
// Income and worth
// ---------------------------------------------------------------------------------------------------------

/** Yearly wage (job, League stipend, fame endorsements, villain retainer). The economy pays it monthly. */
export function annualWage(g: Game): number {
  let pay = 0;
  if (g.jobId) {
    const job = jobById(g.jobId);
    if (job) {
      const mult = [1, 1.25, 1.55, 1.95, 2.45][g.jobRank] ?? 1;
      pay += Math.round(job.pay * mult * (g.age < 18 ? 0.5 : 1));
      if (job.id === "influencer") pay += Math.round(g.stats.fame * 420);
    }
  }
  if (g.leagueRank > 0 && !g.flags.villainContract) pay += STIPEND[g.leagueRank] ?? 0;
  if (g.flags.villainContract) pay += 14000;
  if (g.stats.fame > 45 && g.leagueRank >= 1) pay += Math.round(g.stats.fame * 150);
  return pay;
}

export function portfolioValue(e: EconState): number {
  let v = 0;
  for (const [id, lot] of Object.entries(e.stocks)) v += lot.n * stockPrice(e, id);
  for (const [id, lot] of Object.entries(e.goods)) v += lot.n * goodPrice(e, id);
  return Math.round(v);
}

export function homesEquity(e: EconState): number {
  return Math.round(e.homes.reduce((sum, h) => sum + homeValue(e, h) - (h.mortgage?.bal ?? 0), 0));
}

/** Everything the economy adds to net worth beyond cash: home equity, portfolio, lease deposit. */
export function econHoldings(g: Game): number {
  const e = econOf(g);
  return e ? homesEquity(e) + portfolioValue(e) + (e.lease?.deposit ?? 0) : 0;
}

/** Cash + home equity + portfolio + lease deposit. */
export function netWorth(g: Game): number {
  return Math.round(g.stats.money + econHoldings(g));
}

/** What the bank will lend: 4.5× yearly income (wage + tenants) plus half your equity and portfolio. */
export function maxLoan(g: Game): number {
  const e = econOf(g);
  const wage = annualWage(g);
  const tenants = e ? e.homes.filter((h) => h.letOut && h.uid !== e.living).reduce((s, h) => s + letIncome(e, h) * 12, 0) : 0;
  const assets = e ? (portfolioValue(e) + homesEquity(e)) * 0.5 : 0;
  return Math.max(0, Math.round((4.5 * (wage + tenants) + assets) / 1000) * 1000);
}

/** Mortgage rate: the market rate plus a margin that shrinks with a bigger deposit. */
export function mortgageRate(e: EconState, depositShare: number): number {
  return Math.round(((e.lv.rate ?? 5.5) + (depositShare < 0.2 ? 1.5 : depositShare < 0.35 ? 1.0 : 0.75)) * 100) / 100;
}

// ---------------------------------------------------------------------------------------------------------
// Where you live and what it gives you
// ---------------------------------------------------------------------------------------------------------

export interface Living {
  kind: "family" | "couch" | "lease" | "own";
  name: string;
  place: string;
  homeId: string | null;
  comfort: number;
  recover: number;
  cover: number;
  train: number;
  /** Monthly housing cost (rent, or mortgage + upkeep). */
  monthly: number;
  home?: OwnedHome;
  note?: string;
}

export function hasFamily(g: Game): boolean {
  return g.relationships.some((r) => r.role === "parent" && r.alive);
}

export function livingOf(g: Game): Living {
  const e = econOf(g);
  const city = cityById(g.cityId).name;
  if (e?.living === "lease" && e.lease) {
    const def = homeById(e.lease.homeId);
    const dist = districtOf(e.lease.cityId, e.lease.districtId);
    return { kind: "lease", name: e.lease.name ?? def?.name ?? "Rented place", place: `${dist?.name ?? ""}, ${cityById(e.lease.cityId).name}`, homeId: e.lease.homeId, comfort: def?.comfort ?? 0, recover: def?.recover ?? 0, cover: def?.cover ?? 0, train: def?.train ?? 0, monthly: e.lease.rent, note: e.lease.control ? "Rent-controlled" : undefined };
  }
  const own = e?.homes.find((h) => h.uid === e.living);
  if (e && own) {
    const def = homeById(own.homeId);
    const mods = own.mods.map(modById);
    const sum = (k: "comfort" | "recover" | "cover" | "train") => (def?.[k] ?? 0) + mods.reduce((s, m) => s + (m?.[k] ?? 0), 0);
    return { kind: "own", name: own.name ?? def?.name ?? "Your place", place: `${districtOf(own.cityId, own.districtId)?.name ?? ""}, ${cityById(own.cityId).name}`, homeId: own.homeId, comfort: Math.min(4, sum("comfort")), recover: Math.min(4, sum("recover")), cover: Math.min(5, sum("cover")), train: Math.min(4, sum("train")), monthly: (own.mortgage?.pay ?? 0) + homeUpkeep(e, own), home: own, note: own.note };
  }
  if (g.age < HOUSING_AGE || hasFamily(g)) {
    const restless = g.age >= 30;
    return { kind: "family", name: g.age < HOUSING_AGE ? "Family home" : "Your old room at home", place: city, homeId: null, comfort: restless ? -1 : 0, recover: 0, cover: 1, train: 0, monthly: 0, note: restless ? "The childhood bedroom is getting small." : g.age < HOUSING_AGE ? `Your own place opens at ${HOUSING_AGE}.` : "Free, and it shows." };
  }
  return { kind: "couch", name: "Couch-surfing", place: city, homeId: null, comfort: -1, recover: 0, cover: 0, train: 0, monthly: 0, note: "A different couch most weeks. Rent a room to stop the slide." };
}

/** Training-floor edge in drills and fights from where you live (+2% a point, max +8%). */
export function homeEdge(g: Game, family: "duel" | "timing" | "pattern"): number {
  if (!econOf(g) || family === "pattern") return 0;
  return Math.min(0.08, Math.max(0, livingOf(g).train) * 0.02);
}

// ---------------------------------------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------------------------------------

function pickDistrict(e: EconState, cityId: string, salt: string | number): District {
  const list = districtsOf(cityId);
  const total = list.reduce((s, d) => s + d.risk, 0);
  let r = hash(e.seed, e.t, "pick", salt) * total;
  for (const d of list) {
    r -= d.risk;
    if (r <= 0) return d;
  }
  return list[0]!;
}

function addNews(e: EconState, n: News) {
  e.news.push(n);
  if (e.news.length > MAX_NEWS) e.news.splice(0, e.news.length - MAX_NEWS);
}

function keysFor(key: MoveKey, coId: string, cityId: string, distId: string): string[] {
  if (key === "co") return [`s:${coId}`];
  if (key === "dist") return [`p:${cityId}:${distId}`];
  if (key === "city") return districtsOf(cityId).map((d) => `p:${cityId}:${d.id}`);
  if (key === "allStocks") return STOCKS.map((s) => `s:${s.id}`);
  if (key === "allProp") return allSeries().filter((s) => s.startsWith("p:"));
  if (key.startsWith("sector:")) return STOCKS.filter((s) => s.sector === key.slice(7)).map((s) => `s:${s.id}`);
  return [key];
}

/** This month's headlines: 0–2, each a one-off shock that mean reversion slowly undoes. */
function rollNews(e: EconState, g: Game, when: number) {
  const count = (hash(e.seed, e.t, "news-n") < 0.6 ? 1 : 0) + (hash(e.seed, e.t, "news-n2") < 0.25 ? 1 : 0);
  const total = NEWS.reduce((s, n) => s + n.w, 0);
  const cities = Object.keys(DISTRICTS);
  for (let k = 0; k < count; k += 1) {
    let r = hash(e.seed, e.t, "news", k) * total;
    let def = NEWS[0]!;
    for (const n of NEWS) {
      r -= n.w;
      if (r <= 0) {
        def = n;
        break;
      }
    }
    const co = STOCKS[Math.floor(hash(e.seed, e.t, "co", k) * STOCKS.length)] ?? STOCKS[0]!;
    // City news lands in the hero's own city half the time, so home feels alive.
    const cityId = hash(e.seed, e.t, "city", k) < 0.5 ? marketCity(g.cityId) : (cities[Math.floor(hash(e.seed, e.t, "city2", k) * cities.length)] ?? "nyc");
    const dist = pickDistrict(e, cityId, `n${k}`);
    for (const move of def.moves) for (const key of keysFor(move.key, co.id, cityId, dist.id)) shock(e, key, move.d);
    const first = def.moves[0]!;
    const tone: 1 | -1 = first.key === "rate" ? (first.d > 0 ? -1 : 1) : first.d > 0 ? 1 : -1;
    const tag: News["tag"] = first.key === "rate" ? "rate" : first.key === "dist" || first.key === "city" || first.key === "allProp" ? "prop" : first.key.startsWith("g:") ? "good" : "stock";
    const text = def.text.replace("{co}", co.name).replace("{dist}", dist.name).replace("{city}", cityById(cityId).name);
    addNews(e, { at: when, text, tone, tag, cityId: tag === "prop" ? cityId : undefined });
  }
}

/**
 * A villain fight just resolved in the hero's city. Win: the district breathes out and a local company ticks up.
 * Loss: the villain wrecks the block. Once a month at most, so fights can't be farmed to pump a stock.
 * Returns a short line for the fight result, or null.
 */
export function noteFight(g: Game, won: boolean, foeName: string): string | null {
  const e = econOf(g);
  if (!e || !ECON_FLAGS.hub) return null;
  const now = at(g);
  if (e.fightAt === now) return null;
  e.fightAt = now;
  const cityId = marketCity(g.cityId);
  const dist = pickDistrict(e, cityId, `fight${now}`);
  const local = STOCKS.filter((s) => s.cityId === cityId);
  const co = local[Math.floor(hash(e.seed, now, "fightco") * local.length)] ?? null;
  const hero = g.traits.includes("secret") ? "A masked hero" : (g.name.split(" ")[0] ?? "A hero");
  const city = cityById(cityId).name;
  if (won) {
    shockNow(e, `p:${cityId}:${dist.id}`, 0.02);
    if (co) shockNow(e, `s:${co.id}`, 0.04);
    addNews(e, { at: now, text: `${hero} stops ${foeName} in ${dist.name}, ${city}.${co ? ` ${co.name} ticks up.` : ""}`, tone: 1, tag: "hero", cityId });
    return `${dist.name} homes +2%${co ? `, ${co.name} +4%` : ""}.`;
  }
  shockNow(e, `p:${cityId}:${dist.id}`, -0.04);
  if (co) shockNow(e, `s:${co.id}`, -0.05);
  shockNow(e, "s:CAPE", 0.03);
  shockNow(e, "g:steel", 0.02);
  addNews(e, { at: now, text: `${foeName} wrecks ${dist.name}, ${city}. Insurers wince${co ? `; ${co.name} slips` : ""}.`, tone: -1, tag: "villain", cityId });
  return `${dist.name} homes −4%${co ? `, ${co.name} −5%` : ""}.`;
}

// ---------------------------------------------------------------------------------------------------------
// The month
// ---------------------------------------------------------------------------------------------------------

export interface MonthOut {
  banners: string[];
  /** Whole points the engine applies through its own soft caps. */
  joy: number;
  hp: number;
  heat: number;
}

/**
 * Every month: markets move and headlines land, the paycheck arrives, rent / mortgage / upkeep go out,
 * tenants and dividends pay in, the home gives its perks, and arrears catch up with you. Mutates g.
 * Returns at most two banner lines and the perk points for the engine to apply.
 */
export function economyMonth(g: Game): MonthOut {
  const out: MonthOut = { banners: [], joy: 0, hp: 0, heat: 0 };
  if (!ECON_FLAGS.hub) return out;
  const e = ensureEconomy(g);
  const now = at(g);
  const before = portfolioValue(e) + homesEquity(e);
  e.t += 1;
  stepAll(e);
  rollNews(e, g, now);
  for (const key of allSeries()) push(e, key);

  const lines: MonthLine[] = [];
  const add = (label: string, amount: number) => {
    const n = Math.round(amount);
    if (!n) return;
    lines.push({ label, amount: n });
    g.stats.money += n;
  };

  // Scripted legend leases (Peter's Queens walk-up at 18).
  const start = g.preset ? LEGEND_START[g.preset] : undefined;
  if (start?.lease && g.age === start.lease.age && g.month === 0 && !e.lease && !e.homes.some((h) => h.uid === e.living)) {
    const l = start.lease;
    if (districtOf(g.cityId, l.districtId)) {
      const rent = Math.round((marketRent(e, l.homeId, g.cityId, l.districtId) * l.control) / 10) * 10;
      e.lease = { homeId: l.homeId, cityId: g.cityId, districtId: l.districtId, name: l.name, rent, deposit: rent, renew: now + 12, control: l.control };
      e.living = "lease";
      out.banners.push(`You move into a ${l.name} of your own. Rent-controlled: ${fmt(rent)} a month. Work ▸ Money.`);
    }
  }

  const wage = annualWage(g);
  if (wage > 0) add(g.jobId ? "Paycheck" : g.flags.villainContract ? "Retainer" : "League stipend", wage / 12);

  let housing = 0;
  if (e.living === "lease" && e.lease) {
    if (now >= e.lease.renew) {
      const market = marketRent(e, e.lease.homeId, e.lease.cityId, e.lease.districtId);
      const fresh = e.lease.control ? market * e.lease.control : market;
      // Renewals move toward market, at most ±8% a year.
      const next = Math.round(clamp(fresh, e.lease.rent * 0.92, e.lease.rent * 1.08) / 10) * 10;
      if (next !== e.lease.rent) out.banners.push(`Lease renewal: rent ${next > e.lease.rent ? "rises" : "drops"} to ${fmt(next)} a month.`);
      e.lease.rent = next;
      e.lease.renew = now + 12;
    }
    add("Rent", -e.lease.rent);
    housing += e.lease.rent;
  }
  for (const home of e.homes) {
    const label = home.name ?? homeById(home.homeId)?.name ?? "Home";
    if (home.mortgage) {
      const m = home.mortgage;
      const interest = (m.bal * m.rate) / 100 / 12;
      // The last payment clears whatever rounding left behind.
      const pay = m.left <= 1 ? Math.round(m.bal + interest) : Math.min(m.pay, Math.round(m.bal + interest));
      m.bal = Math.max(0, Math.round(m.bal + interest - pay));
      m.left = Math.max(0, m.left - 1);
      add(`Mortgage · ${label}`, -pay);
      housing += pay;
      if (m.bal <= 0 || m.left <= 0) {
        home.mortgage = null;
        out.banners.push(`${label} is paid off. The deed is yours, outright.`);
      }
    }
    const upkeep = homeUpkeep(e, home);
    add(`Upkeep · ${label}`, -upkeep);
    // (An estate's upkeep is 0: the family trust pays it.)
    housing += upkeep;
    if (home.letOut && home.uid !== e.living) {
      const vacant = hash(e.seed, e.t, home.uid, "vacant") < 0.08;
      if (!vacant) add(`Tenants · ${label}`, letIncome(e, home));
    }
  }
  let divs = 0;
  // Shares held in a family trust reinvest their dividends until they unlock.
  for (const [id, lot] of Object.entries(e.stocks)) if (!lot.lockUntil || g.age >= lot.lockUntil) divs += (lot.n * stockPrice(e, id) * (stockById(id)?.div ?? 0)) / 12;
  if (divs >= 1) add("Dividends", divs);

  // Perks from where you live accumulate gently, in fractions.
  const live = livingOf(g);
  e.acc.joy += live.comfort * 0.35;
  e.acc.hp += live.recover * 0.4;
  e.acc.heat += live.cover * 0.5;
  const take = (k: "joy" | "hp" | "heat") => {
    const whole = e.acc[k] >= 0 ? Math.floor(e.acc[k]) : Math.ceil(e.acc[k]);
    e.acc[k] -= whole;
    return whole;
  };
  const perks: string[] = [];
  const joy = take("joy");
  const hp = take("hp");
  const heat = take("heat");
  // Comfort lifts a low mood, not a great one; a bad couch always drags.
  if (joy < 0 || (joy > 0 && g.stats.happiness < 60 + live.comfort * 5)) {
    out.joy = joy;
    perks.push(`${joy > 0 ? "+" : ""}${joy} Joy`);
  }
  if (hp > 0 && g.stats.health < 92) {
    out.hp = hp;
    perks.push(`+${hp} Health`);
  }
  if (heat > 0 && (g.flags.heat ?? 0) > 0) {
    out.heat = heat;
    perks.push("Heat fades");
  }

  // Arrears: three months in the red with housing bills and the lease ends, or the bank takes a house.
  if (housing > 0 && g.stats.money < 0) {
    e.arrears += 1;
    if (e.arrears >= ARREARS_LIMIT) out.banners.unshift(evict(g, e));
    else out.banners.unshift(`Behind on housing bills (${e.arrears}/${ARREARS_LIMIT}). Get back above $0, or downsize: Work ▸ Money.`);
  } else e.arrears = 0;

  g.stats.money = clamp(g.stats.money, -20000, 100_000_000);
  const swing = portfolioValue(e) + homesEquity(e) - before;
  e.last = { at: now, lines, net: lines.reduce((s, l) => s + l.amount, 0), swing: Math.round(swing), perks };
  e.worth.push(netWorth(g));
  if (e.worth.length > HIST) e.worth.splice(0, e.worth.length - HIST);

  // One headline worth a banner: news about what you own or where you live.
  const owned = STOCKS.filter((s) => e.stocks[s.id]?.n).map((s) => s.name);
  const mine = e.news.filter((n) => n.at === now).find((n) => n.cityId === marketCity(g.cityId) || owned.some((name) => n.text.includes(name)));
  if (mine) out.banners.push(`${mine.tone > 0 ? "▲" : "▼"} ${mine.text}`);
  out.banners = out.banners.slice(0, 2);
  return out;
}

function evict(g: Game, e: EconState): string {
  e.arrears = 0;
  if (e.living === "lease" && e.lease) {
    const name = e.lease.name ?? homeById(e.lease.homeId)?.name ?? "place";
    e.lease = null;
    e.living = null;
    return `Evicted. The landlord keeps the deposit and changes the locks on the ${name.toLowerCase()}.`;
  }
  const target = [...e.homes].filter((h) => h.mortgage).sort((a, b) => (b.mortgage?.bal ?? 0) - (a.mortgage?.bal ?? 0))[0];
  if (target) {
    const value = homeValue(e, target);
    const cash = Math.round(value * 0.85 - (target.mortgage?.bal ?? 0));
    e.homes = e.homes.filter((h) => h.uid !== target.uid);
    if (e.living === target.uid) e.living = null;
    g.stats.money += cash;
    const name = target.name ?? `the ${homeById(target.homeId)?.name.toLowerCase()}`;
    return `The bank forecloses on ${name} and sells it cheap. ${cash >= 0 ? `${fmt(cash)} comes back to you.` : `You still owe ${fmt(-cash)}.`}`;
  }
  return "The bills pile up. Something has to give: Work ▸ Money.";
}

// ---------------------------------------------------------------------------------------------------------
// Quotes and actions
// ---------------------------------------------------------------------------------------------------------

export interface TradeQuote {
  ok: boolean;
  why?: string;
  price: number;
  qty: number;
  gross: number;
  fee: number;
  /** Cash out (buy) or in (sell). */
  total: number;
  held: number;
}

/** Fees: stocks 1% (min $5), goods a 2.5% spread; orders above $25k pay rising slippage (up to +4%). */
export function tradeFee(kind: "s" | "g", gross: number): number {
  const base = kind === "s" ? Math.max(5, gross * 0.01) : Math.max(5, gross * 0.025);
  const slip = gross * Math.min(0.04, Math.max(0, gross - 25_000) / 2_500_000);
  return Math.round(base + slip);
}

export function quoteTrade(g: Game, kind: "s" | "g", id: string, side: "buy" | "sell", qty: number): TradeQuote {
  const e = econOf(g);
  const price = e ? (kind === "s" ? stockPrice(e, id) : goodPrice(e, id)) : 0;
  const lot = e ? (kind === "s" ? e.stocks[id] : e.goods[id]) : undefined;
  const held = lot?.n ?? 0;
  const q = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;
  const gross = Math.round(price * q);
  const fee = q > 0 ? tradeFee(kind, gross) : 0;
  const total = side === "buy" ? gross + fee : Math.max(0, gross - fee);
  const base = { price, qty: q, gross, fee, total, held };
  const good = kind === "g" ? goodById(id) : undefined;
  if (!e || !price || (kind === "s" ? !stockById(id) : !good)) return { ...base, ok: false, why: "Not trading." };
  if (g.age < TRADE_AGE) return { ...base, ok: false, why: `Trading opens at ${TRADE_AGE}.` };
  if (good?.minAge && g.age < good.minAge && side === "buy") return { ...base, ok: false, why: `Opens at ${good.minAge}.` };
  if (q <= 0) return { ...base, ok: false, why: "Pick an amount." };
  if (side === "buy" && g.stats.money < total) return { ...base, ok: false, why: `You need ${fmt(total - Math.max(0, g.stats.money))} more.` };
  if (side === "sell") {
    if (held < q) return { ...base, ok: false, why: held ? `You hold ${held}.` : "You hold none." };
    if (lot?.lockUntil && g.age < lot.lockUntil) return { ...base, ok: false, why: `Held in trust until ${lot.lockUntil}.` };
  }
  return { ...base, ok: true };
}

/** Largest whole amount you can buy with your cash, fees included. */
export function maxBuy(g: Game, kind: "s" | "g", id: string): number {
  const e = econOf(g);
  if (!e || g.stats.money <= 0) return 0;
  const price = kind === "s" ? stockPrice(e, id) : goodPrice(e, id);
  if (!price) return 0;
  let q = Math.floor(g.stats.money / (price * (kind === "s" ? 1.01 : 1.025)));
  while (q > 0 && quoteTrade(g, kind, id, "buy", q).total > g.stats.money) q = Math.floor(q * 0.98);
  return Math.max(0, q);
}

export interface HomeQuote {
  ok: boolean;
  why?: string;
  price: number;
  deposit: number;
  loan: number;
  rate: number;
  monthly: number;
  closing: number;
  cash: number;
  maxLoan: number;
  upkeep: number;
}

export function homeGate(g: Game, home: HomeDef, mode: "rent" | "buy"): string | null {
  if (mode === "rent" && !home.rent) return "Buy only";
  if (mode === "buy" && !home.buy) return "Rent only";
  const need = Math.max(home.minAge, home.id === "room" ? 16 : HOUSING_AGE);
  if (g.age < need) return `Opens at ${need}`;
  if (home.lair && g.powerless && !g.preset && g.leagueRank < 1) return "Needs a power, a kit or a League card";
  return null;
}

export function quoteHome(g: Game, homeId: string, districtId: string, depositShare: number): HomeQuote {
  const e = econOf(g);
  const home = homeById(homeId);
  const share = clamp(Number.isFinite(depositShare) ? depositShare : MIN_DEPOSIT, MIN_DEPOSIT, 1);
  const price = e ? homePrice(e, homeId, g.cityId, districtId) : 0;
  const deposit = Math.round(price * share);
  const loan = price - deposit;
  const rate = e ? mortgageRate(e, share) : 0;
  const monthly = mortgagePayment(loan, rate, MORTGAGE_YEARS * 12);
  const closing = Math.max(1000, Math.round(price * CLOSING_FEE));
  const cash = deposit + closing;
  const cap = maxLoan(g);
  const upkeep = Math.round((price * 0.011) / 12);
  const base = { price, deposit, loan, rate, monthly, closing, cash, maxLoan: cap, upkeep };
  if (!e || !home || !price) return { ...base, ok: false, why: "Not on the market." };
  const gate = homeGate(g, home, "buy");
  if (gate) return { ...base, ok: false, why: gate };
  if (e.homes.some((h) => h.homeId === homeId && h.cityId === g.cityId && h.districtId === districtId)) return { ...base, ok: false, why: "You already own one here." };
  if (e.homes.length >= 5) return { ...base, ok: false, why: "Five homes is the limit." };
  if (loan > cap) return { ...base, ok: false, why: cap > 0 ? `The bank lends up to ${fmt(cap)} on your income.` : "No income yet: the bank wants cash." };
  if (g.stats.money < cash) return { ...base, ok: false, why: `You need ${fmt(cash - Math.max(0, g.stats.money))} more.` };
  return { ...base, ok: true };
}

export interface RentQuote {
  ok: boolean;
  why?: string;
  rent: number;
  deposit: number;
  cash: number;
  /** Rent as a share of monthly wage (0 when there is none). */
  burden: number;
}

export function quoteRent(g: Game, homeId: string, districtId: string): RentQuote {
  const e = econOf(g);
  const home = homeById(homeId);
  const rent = e ? marketRent(e, homeId, g.cityId, districtId) : 0;
  const cash = rent * 2;
  const wage = annualWage(g) / 12;
  const base = { rent, deposit: rent, cash, burden: wage > 0 ? rent / wage : 0 };
  if (!e || !home || !rent) return { ...base, ok: false, why: "Not on the market." };
  const gate = homeGate(g, home, "rent");
  if (gate) return { ...base, ok: false, why: gate };
  if (e.living === "lease" && e.lease && e.lease.homeId === homeId && e.lease.districtId === districtId && e.lease.cityId === g.cityId) return { ...base, ok: false, why: "You live here." };
  if (g.stats.money < cash) return { ...base, ok: false, why: `Deposit + first month: ${fmt(cash)}.` };
  return { ...base, ok: true };
}

export interface EconResult {
  ok: boolean;
  line: string;
  /** This action used one of the month's moves. */
  spend?: boolean;
}

function endLease(g: Game, e: EconState): number {
  if (!e.lease) return 0;
  const back = e.lease.deposit;
  g.stats.money += back;
  e.lease = null;
  if (e.living === "lease") e.living = null;
  return back;
}

const homeName = (h: OwnedHome) => h.name ?? `the ${homeById(h.homeId)?.name.toLowerCase() ?? "home"}`;

/** Player actions: "econ|<verb>|...". Mutates g (a draft). Moving home spends one of the month's moves. */
export function econAct(g: Game, id: string, movesLeft: number): EconResult {
  const e = ensureEconomy(g);
  const [, verb, a = "", b = "", c = ""] = id.split("|");
  const noMove = movesLeft <= 0 ? { ok: false, line: "Moving day takes a move, and none are left this month." } : null;
  switch (verb) {
    case "trade": {
      // econ|trade|buy|s:STRK|10
      const side = a === "sell" ? "sell" : "buy";
      const kind = b.startsWith("g:") ? "g" : "s";
      const assetId = b.slice(2);
      const q = quoteTrade(g, kind, assetId, side, Number(c));
      if (!q.ok) return { ok: false, line: q.why ?? "No trade." };
      const book = kind === "s" ? e.stocks : e.goods;
      const name = kind === "s" ? stockById(assetId)!.name : goodById(assetId)!.name;
      e.stats.fees += q.fee;
      e.stats.trades += 1;
      if (side === "buy") {
        g.stats.money -= q.total;
        const lot = book[assetId] ?? { n: 0, cost: 0 };
        lot.n += q.qty;
        lot.cost += q.total;
        book[assetId] = lot;
        return { ok: true, line: `Bought ${q.qty.toLocaleString("en-US")} ${name} at ${fmtPrice(q.price)}. Fee ${fmt(q.fee)}.` };
      }
      const lot = book[assetId]!;
      const basis = lot.n ? (lot.cost * q.qty) / lot.n : 0;
      const gain = Math.round(q.total - basis);
      e.stats.realized += gain;
      lot.n -= q.qty;
      lot.cost = Math.max(0, Math.round(lot.cost - basis));
      if (lot.n <= 0) delete book[assetId];
      g.stats.money += q.total;
      return { ok: true, line: `Sold ${q.qty.toLocaleString("en-US")} ${name} for ${fmt(q.total)}. ${gain >= 0 ? `Profit ${fmt(gain)}` : `Loss ${fmt(-gain)}`}.` };
    }
    case "rent": {
      // econ|rent|<homeId>|<district>
      if (noMove) return noMove;
      const q = quoteRent(g, a, b);
      if (!q.ok) return { ok: false, line: q.why ?? "Not available." };
      const back = endLease(g, e);
      g.stats.money -= q.cash;
      e.lease = { homeId: a, cityId: g.cityId, districtId: b, rent: q.rent, deposit: q.deposit, renew: at(g) + 12 };
      e.living = "lease";
      return { ok: true, spend: true, line: `You sign for a ${homeById(a)!.name.toLowerCase()} in ${districtOf(g.cityId, b)?.name}: ${fmt(q.rent)} a month.${back ? ` Old deposit back: ${fmt(back)}.` : ""}` };
    }
    case "buy": {
      // econ|buy|<homeId>|<district>|<depositPct>
      if (noMove) return noMove;
      const share = clamp((Number(c) || MIN_DEPOSIT * 100) / 100, MIN_DEPOSIT, 1);
      const q = quoteHome(g, a, b, share);
      if (!q.ok) return { ok: false, line: q.why ?? "Not available." };
      g.stats.money -= q.cash;
      const home: OwnedHome = { uid: `h${e.nextUid++}`, homeId: a, cityId: g.cityId, districtId: b, paid: q.price, mortgage: q.loan > 0 ? { bal: q.loan, rate: q.rate, pay: q.monthly, left: MORTGAGE_YEARS * 12 } : null, letOut: false, mods: [], since: at(g) };
      e.homes.push(home);
      const back = endLease(g, e);
      e.living = home.uid;
      return { ok: true, spend: true, line: `Keys in hand: a ${homeById(a)!.name.toLowerCase()} in ${districtOf(g.cityId, b)?.name}.${q.loan ? ` Mortgage ${fmt(q.monthly)}/mo at ${q.rate.toFixed(2)}%.` : " Bought outright."}${back ? ` Lease deposit back: ${fmt(back)}.` : ""}` };
    }
    case "sell": {
      const home = e.homes.find((h) => h.uid === a);
      if (!home) return { ok: false, line: "You don't own that." };
      const value = homeValue(e, home);
      const net = Math.round(value * (1 - SELL_FEE) - (home.mortgage?.bal ?? 0));
      if (net < 0 && g.stats.money < -net) return { ok: false, line: `Underwater: you'd need ${fmt(-net)} to clear the mortgage.` };
      g.stats.money += net;
      e.homes = e.homes.filter((h) => h.uid !== a);
      const moved = e.living === a;
      if (moved) e.living = null;
      const name = home.name ?? homeById(home.homeId)?.name ?? "Home";
      return { ok: true, line: `Sold ${name} for ${fmt(value)}. After fees${home.mortgage ? " and the mortgage" : ""}: ${fmt(net)}.${moved ? " Find a new place in Work ▸ Money." : ""}` };
    }
    case "movein": {
      const home = e.homes.find((h) => h.uid === a);
      if (!home) return { ok: false, line: "You don't own that." };
      if (home.cityId !== g.cityId) return { ok: false, line: "That home is in another city." };
      if (e.living === a) return { ok: false, line: "You already live there." };
      if (noMove) return noMove;
      const back = endLease(g, e);
      home.letOut = false;
      e.living = a;
      return { ok: true, spend: true, line: `You move into ${homeName(home)}.${back ? ` Lease deposit back: ${fmt(back)}.` : ""}` };
    }
    case "moveout": {
      if (!e.lease) return { ok: false, line: "No lease to end." };
      const back = endLease(g, e);
      return { ok: true, line: `You hand back the keys. Deposit back: ${fmt(back)}.` };
    }
    case "let": {
      const home = e.homes.find((h) => h.uid === a);
      if (!home) return { ok: false, line: "You don't own that." };
      if (e.living === a) return { ok: false, line: "You live there. Move out first to let it." };
      home.letOut = b !== "off";
      return { ok: true, line: home.letOut ? `Tenants found for ${homeName(home)}: about ${fmt(letIncome(e, home))} a month after the agent's cut.` : `You take ${homeName(home)} off the rental market.` };
    }
    case "mod": {
      const home = e.homes.find((h) => h.uid === a);
      const mod = modById(b);
      const def = home ? homeById(home.homeId) : undefined;
      if (!home || !mod || !def) return { ok: false, line: "Not possible." };
      if (home.mods.includes(mod.id)) return { ok: false, line: "Already installed." };
      if (home.mods.length >= def.slots) return { ok: false, line: def.slots ? "No free slots." : "No room for upgrades here." };
      if (g.stats.money < mod.cost) return { ok: false, line: `You need ${fmt(mod.cost - Math.max(0, g.stats.money))} more.` };
      g.stats.money -= mod.cost;
      home.mods.push(mod.id);
      return { ok: true, line: `${mod.name} installed in ${homeName(home)}.` };
    }
    case "payoff": {
      const home = e.homes.find((h) => h.uid === a);
      if (!home?.mortgage) return { ok: false, line: "No mortgage on that." };
      const bal = home.mortgage.bal;
      if (g.stats.money < bal) return { ok: false, line: `You need ${fmt(bal - Math.max(0, g.stats.money))} more.` };
      g.stats.money -= bal;
      home.mortgage = null;
      return { ok: true, line: `Mortgage cleared: ${fmt(bal)}. The deed is yours outright.` };
    }
    default:
      return { ok: false, line: "Not possible." };
  }
}

/** Moving city: the lease ends (deposit back) and owned homes stay behind (let them out from Work ▸ Money). */
export function econRelocate(g: Game): string | null {
  const e = econOf(g);
  if (!e) return null;
  const parts: string[] = [];
  if (e.lease && e.lease.cityId !== g.cityId) {
    const back = endLease(g, e);
    parts.push(`Lease ended, deposit back (${fmt(back)}).`);
  }
  const own = e.homes.find((h) => h.uid === e.living);
  if (own && own.cityId !== g.cityId) {
    e.living = null;
    parts.push(`${own.name ?? homeById(own.homeId)?.name} stays behind; let it out from Work ▸ Money.`);
  }
  return parts.length ? parts.join(" ") : null;
}

// ---------------------------------------------------------------------------------------------------------
// Views for the UI
// ---------------------------------------------------------------------------------------------------------

export interface SeriesView {
  key: string;
  name: string;
  sub: string;
  price: number;
  /** Prices over the last 24 months, oldest first. */
  hist: number[];
  chg1: number;
  chg12: number;
}

function changes(hist: number[]): { chg1: number; chg12: number } {
  const last = hist[hist.length - 1] ?? 1;
  const prev = hist[hist.length - 2] ?? last;
  const year = hist[Math.max(0, hist.length - 13)] ?? last;
  return { chg1: prev ? last / prev - 1 : 0, chg12: year ? last / year - 1 : 0 };
}

export function stockViews(e: EconState): SeriesView[] {
  return STOCKS.map((s) => {
    const hist = (e.h[`s:${s.id}`] ?? []).map((lv) => Math.round(s.base * lv * 100) / 100);
    return { key: `s:${s.id}`, name: s.name, sub: `${s.id} · ${cityById(s.cityId).name}`, price: stockPrice(e, s.id), hist, ...changes(hist) };
  });
}

export function goodViews(e: EconState): SeriesView[] {
  return GOODS.map((s) => {
    const hist = (e.h[`g:${s.id}`] ?? []).map((lv) => Math.round(s.base * lv * 100) / 100);
    return { key: `g:${s.id}`, name: s.name, sub: `per ${s.unit}`, price: goodPrice(e, s.id), hist, ...changes(hist) };
  });
}

/** Property index per district: what a city apartment costs there. */
export function districtViews(e: EconState, cityId: string): SeriesView[] {
  const city = marketCity(cityId);
  return districtsOf(city).map((d) => {
    const base = homeById("apartment")!.base * (CITY_PROP[city] ?? 1) * d.mul;
    const hist = (e.h[`p:${city}:${d.id}`] ?? []).map((lv) => Math.round(base * lv));
    return { key: `p:${city}:${d.id}`, name: d.name, sub: d.blurb, price: homePrice(e, "apartment", city, d.id), hist, ...changes(hist) };
  });
}

export function fmt(n: number): string {
  const abs = Math.abs(Math.round(n));
  const s = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M` : `$${abs.toLocaleString("en-US")}`;
  return n < 0 ? `-${s}` : s;
}

export function fmtPrice(n: number): string {
  return n >= 1000 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
}
