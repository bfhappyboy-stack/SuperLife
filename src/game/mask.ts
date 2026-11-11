/**
 * The mask at home (Priority 0a, dating stage 2, 2026-11-11 pm): a partner who doesn't know you're a hero
 * starts to wonder. Late nights, bruises and cancelled dinners build their suspicion; past a point they think
 * you're seeing someone (jealousy: closeness slips), and in the end they may find the suit. You can tell them
 * first (a block of free time, odds on the row), or face it when they find out: tell the truth or deny it.
 * Only for a secret-identity hero with a power; a public hero's partner always knows.
 * Deterministic (hash of the person and the month), so it never moves the engine's dice.
 */
import { DATING_ON, stageOf } from "./dating";
import { hash } from "./economy";
import { firstName } from "./format";
import { faceOf } from "./origin";
import { temperOf, trustOf } from "./ties";
import type { Game, LoveStage, Person } from "./types";

/** Ship switch: off means partners never wonder and the rows disappear. */
export const MASK_ON = true;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const nowAt = (g: Pick<Game, "age" | "month">) => g.age * 12 + (g.month ?? 0);

/** Suspicion a month, by stage: sharing a home is where the double life shows. */
export const SUSPECT_RATE: Record<LoveStage, number> = { dating: 0.5, together: 1.1, living: 2.2, engaged: 2.2, married: 2.2 };
/** From here they think you're seeing someone. */
export const JEALOUS_AT = 40;
/** From here they may find the suit. */
export const FIND_AT = 55;
/** After a "not yet", wait this many months before trying again. */
export const RETRY_MONTHS = 12;
/** After they find the suit once, the next time is at least this far off. */
export const REFIND_MONTHS = 30;
/** A deny that leaves trust this low ends it: one lie too many. */
export const LAST_LIE = 10;

const hasPower = (g: Pick<Game, "unlockedPowers" | "powerId">) => (g.unlockedPowers?.length ?? 0) > 0 || !!g.powerId;

/** True when you have a secret to keep: a power and a secret identity. */
export function keepsMask(g: Pick<Game, "traits" | "unlockedPowers" | "powerId">): boolean {
  return DATING_ON && MASK_ON && hasPower(g) && faceOf(g) === "secret";
}

/** Your live partner who doesn't know yet, if any. */
export function hidingFrom(g: Game): Person | undefined {
  if (!keepsMask(g)) return undefined;
  return g.relationships.find((r) => r.role === "partner" && r.alive && !r.knowsSecret);
}

export function suspicionOf(p: Pick<Person, "suspicion">): number {
  return clamp(p.suspicion ?? 0, 0, 100);
}

/** A short word for the card: how much they wonder. */
export function suspicionLabel(p: Pick<Person, "suspicion">): string | null {
  const s = suspicionOf(p);
  return s >= FIND_AT ? "Asking questions" : s >= JEALOUS_AT ? "Thinks you're hiding someone" : s >= 20 ? "Wondering about the late nights" : null;
}

/** Odds they take the truth well. Closeness and trust help; already finding the suit helps a little (no shock twice). */
export function tellChance(p: Person, found = false): number {
  const t = temperOf(p).id;
  const lean = t === "steady" || t === "proud" ? 0.05 : t === "slippery" ? -0.1 : 0;
  return clamp(0.25 + p.closeness / 200 + trustOf(p) / 400 + (found ? 0.08 : 0) + lean, 0.15, 0.95);
}

/** The odds label for the row. */
export function oddsOfTell(p: Person, found = false): string {
  const c = tellChance(p, found);
  return c >= 0.65 ? "Good odds" : c >= 0.45 ? "Fair odds" : "Long shot";
}

/** Why you can't tell them now, if you can't. */
export function tellBlock(g: Game, p: Person): string | undefined {
  if (p.toldAt !== undefined && nowAt(g) - p.toldAt < RETRY_MONTHS) return "They need more time.";
  return undefined;
}

function note(p: Person, line: string, at: number) {
  p.history = [...(p.history ?? []), { at, line }].slice(-4);
}

/** They know now. */
function welcome(p: Person, at: number) {
  p.knowsSecret = true;
  p.suspicion = 0;
  p.toldAt = undefined;
  p.closeness = clamp(p.closeness + 8, 0, 100);
  p.trust = clamp(trustOf(p) + 6, 0, 100);
  note(p, "Knows who you really are", at);
}

export type MaskResult = { ok: boolean; line: string; spend?: boolean; leaves?: boolean };

/**
 * `mask|tell|<personId>` (a block of free time), `mask|truth` / `mask|deny` (answer after they found the suit).
 * The engine spends the block, rolls nothing (the hash decides) and applies a break-up if `leaves`.
 */
export function maskAct(g: Game, id: string): MaskResult {
  const [, verb, a] = id.split("|");
  const at = nowAt(g);
  if (verb === "tell") {
    const p = g.relationships.find((r) => r.id === a && r.alive && r.role === "partner");
    if (!p || p.knowsSecret || !keepsMask(g)) return { ok: false, line: "Nothing to tell." };
    const block = tellBlock(g, p);
    if (block) return { ok: false, line: block };
    const who = firstName(p.name);
    if (hash("tell", p.id, at) < tellChance(p)) {
      welcome(p, at);
      g.maskScene = g.maskScene?.personId === p.id ? null : g.maskScene;
      return { ok: true, spend: true, line: `You sit ${who} down and show them. A long silence, then: "That explains the bruises." ${who} knows now, and keeps it.` };
    }
    p.toldAt = at;
    p.closeness = clamp(p.closeness - 12, 0, 100);
    p.trust = clamp(trustOf(p) - 8, 0, 100);
    p.suspicion = 0;
    note(p, "Heard the truth and needed space", at);
    if (p.closeness <= 25) return { ok: true, spend: true, leaves: true, line: `You tell ${who} everything. They can't do it: the danger, the lies. ${who} packs a bag that night.` };
    return { ok: true, spend: true, line: `You tell ${who} everything. They don't say no. They don't say anything. Closeness −12; give it time.` };
  }
  if (verb === "truth" || verb === "deny") {
    const scene = g.maskScene;
    const p = scene ? g.relationships.find((r) => r.id === scene.personId && r.alive && r.role === "partner") : undefined;
    g.maskScene = null;
    if (!p || p.knowsSecret) return { ok: false, line: "That moment has passed." };
    const who = firstName(p.name);
    if (verb === "truth") {
      if (hash("found", p.id, at) < tellChance(p, true)) {
        welcome(p, at);
        return { ok: true, line: `"It's mine," you say, and tell ${who} all of it. They hold the torn sleeve a long time. "Next time, wake me up." ${who} knows now, and keeps it.` };
      }
      p.toldAt = at;
      p.closeness = clamp(p.closeness - 15, 0, 100);
      p.trust = clamp(trustOf(p) - 10, 0, 100);
      p.suspicion = 0;
      note(p, "Found the suit; couldn't take the truth", at);
      if (p.closeness <= 25) return { ok: true, leaves: true, line: `You tell ${who} the truth. It's too much. ${who} is gone by morning, and the suit is still on the bed.` };
      return { ok: true, line: `You tell ${who} the truth. They believe you, and it scares them. Closeness −15; give it time.` };
    }
    return deny(p, at, who);
  }
  return { ok: false, line: "" };
}

function deny(p: Person, at: number, who: string): MaskResult {
  p.trust = clamp(trustOf(p) - 15, 0, 100);
  p.closeness = clamp(p.closeness - 6, 0, 100);
  p.suspicion = JEALOUS_AT;
  note(p, "Found the suit; you denied it", at);
  if (trustOf(p) <= LAST_LIE) return { ok: true, leaves: true, line: `"A costume party," you say again. ${who} doesn't even argue this time. One lie too many: ${who} is gone by the weekend.` };
  return { ok: true, line: `"A costume party," you say. ${who} nods slowly and stops asking. Trust −15. The questions aren't gone; they've gone quiet.` };
}

/** Once a month: suspicion builds, jealousy bites, and in the end they may find the suit. */
export function maskMonth(g: Game, banners: string[]): void {
  if (!keepsMask(g)) {
    if (g.maskScene) g.maskScene = null;
    return;
  }
  const at = nowAt(g);
  const scene = g.maskScene;
  if (scene) {
    const p = g.relationships.find((r) => r.id === scene.personId && r.alive && r.role === "partner");
    if (!p || p.knowsSecret) g.maskScene = null;
    else if (scene.until <= at) {
      g.maskScene = null;
      const res = deny(p, at, firstName(p.name));
      if (res.leaves) {
        const wed = stageOf(g, p) === "married";
        p.role = "ex";
        p.stage = undefined;
        if (wed) g.flags.married = 0;
        note(p, "Left over the lies", at);
        g.stats.happiness = clamp(g.stats.happiness - (wed ? 10 : 6), 0, 100);
        banners.push(`You never talked about the suit, again. ${firstName(p.name)} has had enough of the silence and leaves.`);
      } else banners.push(`You never talked about the suit. ${firstName(p.name)} took the silence as a no. Trust −15.`);
    }
  }
  const p = hidingFrom(g);
  if (!p) return;
  const who = firstName(p.name);
  const was = suspicionOf(p);
  const rate = SUSPECT_RATE[stageOf(g, p)] * (0.6 + hash("sus", p.id, at) * 0.8);
  const now = clamp(was + rate, 0, 100);
  p.suspicion = Math.round(now * 10) / 10;
  if (was < JEALOUS_AT && now >= JEALOUS_AT && p.foundAt === undefined) {
    note(p, "Thinks you're seeing someone", at);
    banners.push(`${who} thinks you're seeing someone. The late nights don't add up. People ▸ ${who}.`);
  }
  if (now >= JEALOUS_AT && hash("jeal", p.id, at) < 0.35) p.closeness = clamp(p.closeness - 2, 0, 100);
  const cooled = p.foundAt === undefined || at - p.foundAt >= REFIND_MONTHS;
  if (!g.maskScene && cooled && now >= FIND_AT && hash("suit", p.id, at) < (now - FIND_AT + 5) / 250) {
    g.maskScene = { personId: p.id, until: at + 12 };
    p.foundAt = at;
    note(p, "Found the suit", at);
    banners.push(`${who} found the suit. They're waiting for you to explain. People ▸ ${who}.`);
  }
}

/** For the Play card: they found the suit, or now think you're seeing someone. Once each. */
export function maskNews(start: Game, end: Game): string[] {
  if (!keepsMask(end)) return [];
  const out: string[] = [];
  const s = end.maskScene;
  if (s && (start.maskScene?.personId !== s.personId || start.maskScene?.until !== s.until)) {
    const p = end.relationships.find((r) => r.id === s.personId);
    if (p) out.push(`${firstName(p.name)} found the suit. They're waiting for you to explain. People ▸ ${firstName(p.name)}.`);
  }
  for (const p of end.relationships) {
    if (p.role !== "partner" || !p.alive || p.knowsSecret) continue;
    const before = start.relationships.find((r) => r.id === p.id);
    if (before && p.foundAt === undefined && suspicionOf(before) < JEALOUS_AT && suspicionOf(p) >= JEALOUS_AT) out.push(`${firstName(p.name)} thinks you're seeing someone. The late nights don't add up. People ▸ ${firstName(p.name)}.`);
  }
  return out;
}
