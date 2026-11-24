/**
 * Stakes plates outside the Arena (2026-11-21 night, STAKE_PLATES): the same skewed metal plate the Arena uses for
 * round stakes and match verdicts, now on a crime event's "Your call" scene (what kind of trouble this is) and on the
 * Duel K.O. card (how the fight went). Pure reads; no rules, rewards or saves change.
 */
import { eventHasTag } from "./events";

export type PlateTone = "gold" | "red" | "steel";
export interface Plate {
  key: string;
  label: string;
  line: string;
  tone: PlateTone;
}

/** What a crime moment is, in two words and a line. Red = trouble happening now; steel = a dark offer on the table. */
const CRIME_PLATES: Record<string, Omit<Plate, "key">> = {
  maybe: { label: "Public brawl", line: "A fight picked in a full food court.", tone: "red" },
  "villain-offer": { label: "Dirty money", line: "A stipend, with strings.", tone: "steel" },
  "villain-roof": { label: "Rooftop standoff", line: "They know where you live.", tone: "red" },
  "villain-gala": { label: "Enemy at the gala", line: "Same room, same invitation.", tone: "steel" },
  "villain-hire": { label: "Hired muscle", line: "They think you already said yes.", tone: "steel" },
  "receipt-offer": { label: "Off the books", line: "Training the League won't give.", tone: "steel" },
  "witness-stair": { label: "Mugging", line: "It's happening now. Seconds to choose.", tone: "red" },
  "mask-on": { label: "The mask", line: "Fear, at a discount.", tone: "steel" },
  "nyc-platform": { label: "Thief aboard", line: "Stuck between stations.", tone: "red" },
  "hood-jacket": { label: "Corner offer", line: "The stoop is listening.", tone: "steel" },
};

/** The plate for a crime event's "Your call" scene; null for anything that isn't a crime moment. */
export function crimePlate(eventId: string | null | undefined): Plate | null {
  if (!eventId || !eventHasTag(eventId, "crime")) return null;
  const known = CRIME_PLATES[eventId];
  return known ? { key: eventId, ...known } : { key: "crime", label: "Crime in progress", line: "Your move.", tone: "red" };
}

export interface DuelOutcome {
  /** duelRatio: 1 = they're down, 0 = you're down, in between = a draw. */
  ratio: number;
  dealt: number;
  taken: number;
  turns: number;
  /** Your HP left at the end, 0..1. */
  hp: number;
  /** Their HP left at the end, 0..1. */
  foeHp: number;
  boss?: boolean;
}

/** How a duel went, for the K.O. card (same win/draw/loss cut as the card: >= .66 win, >= .33 draw). */
export function duelVerdict(o: DuelOutcome): Plate {
  const win = o.ratio >= 0.66;
  const draw = !win && o.ratio >= 0.33;
  if (win) {
    if (o.taken <= 0) return { key: "flawless", label: "Flawless", line: "Not a scratch on you.", tone: "gold" };
    if (o.hp <= 0.15) return { key: "whisker", label: "By a whisker", line: "One more hit and it was theirs.", tone: "gold" };
    if (o.boss) return { key: "boss", label: "Boss down", line: "The big one hits the floor.", tone: "gold" };
    if (o.turns <= 3) return { key: "quick", label: "Quick work", line: `Over in ${Math.max(1, o.turns)} turn${o.turns === 1 ? "" : "s"}.`, tone: "gold" };
    if (o.dealt >= o.taken * 2) return { key: "dominant", label: "Dominant", line: `Outhit them ${o.dealt} to ${o.taken}.`, tone: "gold" };
    return { key: "won", label: "Hard fought", line: "Toe to toe, and you stood last.", tone: "gold" };
  }
  if (draw) {
    if (o.hp <= 0 && o.foeHp <= 0) return { key: "double-ko", label: "Double K.O.", line: "You both hit the floor.", tone: "steel" };
    return { key: "standoff", label: "Standoff", line: "Both still standing.", tone: "steel" };
  }
  if (o.dealt <= 0) return { key: "outclassed", label: "Outclassed", line: "Not a hit landed. Train and come back.", tone: "red" };
  if (o.foeHp <= 0.15) return { key: "so-close", label: "So close", line: "They had almost nothing left.", tone: "red" };
  if (o.boss) return { key: "boss-stands", label: "Boss stands", line: "Learn the pattern and go again.", tone: "red" };
  return { key: "beaten", label: "Beaten", line: `Outhit ${o.taken} to ${o.dealt}.`, tone: "red" };
}

/**
 * Fight tally (2026-11-22 am, FIGHT_TALLY): which K.O. stat tile leads ("dealt" lit gold when you outhit them, "taken"
 * lit red when they outhit you, "even" when it was level or nobody landed anything). Pure read of the duel's numbers.
 */
export type StatLead = "dealt" | "taken" | "even";
export function statLead(dealt: number, taken: number): StatLead {
  const d = Math.max(0, Math.round(dealt || 0));
  const t = Math.max(0, Math.round(taken || 0));
  return d > t ? "dealt" : t > d ? "taken" : "even";
}

/** HP left (0..1, possibly missing or out of range) as a whole percent 0..100 for the Arena round bars. */
export function hpPercent(hp: number | null | undefined): number {
  if (typeof hp !== "number" || !Number.isFinite(hp)) return 0;
  return Math.max(0, Math.min(100, Math.round(hp * 100)));
}

/**
 * 2026-11-22 pm (FIGHT_CALLOUT): the best hit's share of everything you dealt, as a whole percent 0..100.
 * Missing, negative or non-finite numbers read as 0; a hit bigger than the total (rounding) caps at 100.
 */
export function hitShare(hit: number | null | undefined, total: number | null | undefined): number {
  const h = typeof hit === "number" && Number.isFinite(hit) ? Math.max(0, hit) : 0;
  const t = typeof total === "number" && Number.isFinite(total) ? Math.max(0, total) : 0;
  if (h <= 0 || t <= 0) return 0;
  return Math.min(100, Math.round((h / t) * 100));
}

/** The Arena MVP: the round you won with the most HP left (index), or null if you won none. Ties keep the earlier round. */
export function mvpRound(results: ReadonlyArray<0 | 1 | null | undefined>, margins: ReadonlyArray<readonly [number, number] | null | undefined>): { round: number; hp: number } | null {
  let round = -1;
  let hp = -1;
  results.forEach((r, i) => {
    const m = margins[i];
    if (r === 0 && m && typeof m[0] === "number" && m[0] > hp) {
      hp = m[0];
      round = i;
    }
  });
  return round < 0 ? null : { round, hp };
}

/**
 * 2026-11-23 am (NEXT_HINT_PLATE): the "Next time, <gimmick>" hint under a lost boss fight, split into the tell (what
 * they do) and the counter (what to do about it, the hint's last sentence), so the red steel plate can light the
 * counter. One-sentence hints are all counter. Same text as before, nothing added or dropped. Pure read.
 */
export function hintParts(hint: string | null | undefined): { tell: string; counter: string } {
  const text = typeof hint === "string" ? hint.trim().replace(/\s+/g, " ") : "";
  if (!text) return { tell: "", counter: "" };
  const sentences = text.split(/(?<=[.!?])\s+(?=\S)/);
  if (sentences.length < 2) return { tell: "", counter: text };
  const counter = sentences.pop() as string;
  return { tell: sentences.join(" "), counter };
}

/**
 * Continue dock (2026-11-23 pm, CONTINUE_DOCK): is there still card to read under the docked Continue button?
 * True when the scrolling K.O. card has more than `slack` px left below what is on screen. Pure read; no rules change.
 */
export function moreBelow(scrollTop: number, scrollHeight: number, clientHeight: number, slack = 8): boolean {
  if (![scrollTop, scrollHeight, clientHeight].every(Number.isFinite) || clientHeight <= 0) return false;
  return scrollHeight - clientHeight - Math.max(0, scrollTop) > slack;
}
