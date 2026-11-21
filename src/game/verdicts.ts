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
