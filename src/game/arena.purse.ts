/**
 * Arena purses (2026-11-03 pm, owner decision): when one of your three Arena picks is your active
 * life's own character, the match pays that life. Wins pay more, harder AI pays more, a loss still
 * earns a small appearance fee. Legends and villains alone pay nothing.
 *
 * Anti-farm: each local day the purses shrink (full, full, 70%, 50%, 30%) and then stop; and a match
 * can only ever be paid once (its key is remembered), so reloads and rematch spam don't stack.
 */
import { clamp, money } from "./format";
import type { AiLevel } from "./arena";
import type { ArenaPurseLedger, Game } from "./types";

export const PURSE_BASE: Record<AiLevel, number> = { rookie: 600, pro: 1500, legend: 3500 };
/** A loss still pays this share of the win purse (you showed up, the crowd saw you). */
export const PURSE_LOSS_SHARE = 0.2;
/** A clean 2–0 sweep pays this much extra. */
export const PURSE_SWEEP_BONUS = 0.25;
/** Under-18s fight the junior card: half purses. */
export const PURSE_JUNIOR = 0.5;
/** Multiplier for the nth paid match of the day; past the end, the purse is closed for the day. */
export const PURSE_DAILY = [1, 1, 0.7, 0.5, 0.3] as const;
const KEEP_KEYS = 40;

export interface PurseInput {
  level: AiLevel;
  won: boolean;
  /** Rounds you won and lost, e.g. [2, 0]. */
  rounds: [number, number];
  /** Unique per match (seed + picks), so the same result never pays twice. */
  key: string;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  online?: boolean;
}

export interface PurseQuote {
  amount: number;
  /** 1-based count of paid matches today, including this one. */
  nth: number;
  /** Multiplier applied for the daily diminishing returns. */
  rate: number;
  capped: boolean;
  already: boolean;
}

export function freshLedger(day: string): ArenaPurseLedger {
  return { day, paidToday: 0, keys: [], total: 0, wins: 0, matches: 0 };
}

function ledgerFor(game: Pick<Game, "arenaPurse">, day: string): ArenaPurseLedger {
  const led = game.arenaPurse;
  if (!led) return freshLedger(day);
  return led.day === day ? { ...led, keys: [...led.keys] } : { ...led, day, paidToday: 0, keys: [...led.keys] };
}

/** What this match would pay this life, without paying it. */
export function purseQuote(game: Pick<Game, "arenaPurse" | "age">, input: PurseInput): PurseQuote {
  const led = ledgerFor(game, input.day);
  if (led.keys.includes(input.key)) return { amount: 0, nth: led.paidToday, rate: 0, capped: false, already: true };
  const nth = led.paidToday + 1;
  const rate = PURSE_DAILY[nth - 1] ?? 0;
  if (rate <= 0) return { amount: 0, nth, rate: 0, capped: true, already: false };
  const sweep = input.won && input.rounds[0] >= 2 && input.rounds[1] === 0 ? 1 + PURSE_SWEEP_BONUS : 1;
  const junior = game.age < 18 ? PURSE_JUNIOR : 1;
  const raw = PURSE_BASE[input.level] * (input.won ? sweep : PURSE_LOSS_SHARE) * junior * rate;
  // Round to a tidy $25 so the number on screen reads like prize money.
  const amount = Math.max(25, Math.round(raw / 25) * 25);
  return { amount, nth, rate, capped: false, already: false };
}

/**
 * Pay the purse into a life. Pure: returns a new Game (or the same one if nothing is owed).
 * Adds a major history line and a card banner so the life remembers the night.
 */
export function payPurse(game: Game, input: PurseInput & { opponent: string }): { game: Game; quote: PurseQuote } {
  const quote = purseQuote(game, input);
  if (quote.already || game.phase === "dead") return { game, quote: { ...quote, amount: 0 } };
  const led = ledgerFor(game, input.day);
  const d = structuredClone(game);
  led.keys = [...led.keys, input.key].slice(-KEEP_KEYS);
  led.matches += 1;
  if (input.won) led.wins += 1;
  if (quote.capped) {
    d.arenaPurse = led;
    d.history.push({ age: d.age, month: d.month, text: `Arena: you ${input.won ? "beat" : "lost to"} ${input.opponent}. The purse office is closed for the day.` });
    return { game: d, quote };
  }
  led.paidToday += 1;
  led.total += quote.amount;
  d.arenaPurse = led;
  d.stats.money += quote.amount;
  if (d.peak) d.peak.money = Math.max(d.peak.money ?? 0, d.stats.money);
  const score = `${input.rounds[0]}–${input.rounds[1]}`;
  const text = input.won
    ? `Arena win, ${score}, against ${input.opponent}${input.online ? " (online)" : ""}. The purse is ${money(quote.amount)}.`
    : `Arena loss, ${score}, against ${input.opponent}${input.online ? " (online)" : ""}. An appearance fee of ${money(quote.amount)}.`;
  d.history.push({ age: d.age, month: d.month, text, tag: "major" });
  if (d.history.length > 240) d.history.splice(0, d.history.length - 240);
  const banner = `ARENA PURSE · +${money(quote.amount)}`;
  d.card = { ...d.card, banner: [banner, ...(d.card?.banner ?? []).filter((line) => !line.startsWith("ARENA PURSE"))].slice(0, 4) };
  d.stats.happiness = clamp(d.stats.happiness + (input.won ? 2 : 0), 0, 100);
  return { game: d, quote };
}

export function purseKey(seed: number, picks: string[]): string {
  return `${seed >>> 0}:${picks.join(",")}`;
}

/** Today's local date as YYYY-MM-DD (the purse's daily reset). */
export function localDay(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
