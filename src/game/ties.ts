/**
 * Ties (2026-11-10 late): the money between you and the people in your life.
 * Everyone has a personality (how good they are for a debt), a trust meter next to closeness, and a short
 * history. You can lend to them, borrow from them, and family or friends sometimes ask you for help.
 * Lent money comes back on a schedule, or doesn't. Money you owe leaves your cash each month.
 * Deterministic (hash of the loan and the month), so it never shifts the engine's dice.
 */
import { hash } from "./economy";
import { firstName, money } from "./format";
import type { Game, Loan, Person, TieAsk } from "./types";

/** Lend / borrow / ask for help. Hide by setting false. */
export const TIES_ON = true;

export interface Temper {
  id: "steady" | "warm" | "proud" | "scattered" | "slippery";
  label: string;
  line: string;
  /** 0-100: how likely a monthly payment arrives. */
  reliability: number;
}

const TEMPERS: readonly Temper[] = [
  { id: "steady", label: "Steady", line: "Pays back on the dot.", reliability: 94 },
  { id: "warm", label: "Warm", line: "Means well, sometimes late.", reliability: 78 },
  { id: "proud", label: "Proud", line: "Hates owing anyone.", reliability: 86 },
  { id: "scattered", label: "Scattered", line: "Forgets. Not on purpose.", reliability: 58 },
  { id: "slippery", label: "Slippery", line: "Always has a story.", reliability: 34 },
];

/** Roles you can lend to and borrow from. Heroes, villains and rivals keep their money talk to fights. */
const MONEY_ROLES = new Set<Person["role"]>(["parent", "partner", "friend", "teammate", "child"]);
const MAX_MISSES = 3;
/** Per close person per month, up to 3 people: about one ask every 2 years with a few people around. */
const ASK_EVERY = 1 / 72;

export function temperOf(p: Pick<Person, "id" | "name" | "role">): Temper {
  const r = hash("temper", p.id, p.name);
  // Parents lean steady or warm; friends spread across all five.
  if (p.role === "parent") return TEMPERS[r < 0.45 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3]!;
  return TEMPERS[Math.min(4, Math.floor(r * 5))]!;
}

export function trustOf(p: Pick<Person, "trust">): number {
  return typeof p.trust === "number" ? p.trust : 50;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const nowAt = (g: Pick<Game, "age" | "month">) => g.age * 12 + (g.month ?? 0);
const loansOf = (g: Game): Loan[] => (g.loans ??= []);

export function canTalkMoney(g: Game, p: Person): boolean {
  return TIES_ON && p.alive && MONEY_ROLES.has(p.role) && !p.arch && g.age >= 14 && (p.role !== "child" || p.age >= 16);
}

export function openLoan(g: Pick<Game, "loans">, personId: string): Loan | undefined {
  return (g.loans ?? []).find((l) => l.personId === personId && l.status === "open");
}

/** How many months a loan of this size runs. */
export function termFor(amount: number): number {
  return amount <= 500 ? 3 : amount <= 2000 ? 6 : 12;
}

export function lendAmounts(g: Game): number[] {
  return [200, 1000, 5000].filter((a) => g.stats.money >= a);
}

/** What they could lend you, by how they're placed in your life. */
export function borrowAmounts(p: Person): number[] {
  return p.role === "parent" ? [500, 2000, 5000] : p.role === "partner" ? [500, 2000] : [200, 1000];
}

/** Why they'd say no to lending you money, or null. */
export function borrowBlock(g: Game, p: Person): string | null {
  if (g.age < 16) return "Not until 16.";
  if (openLoan(g, p.id)) return "Settle what's open first.";
  if (trustOf(p) < 40) return `${firstName(p.name)} doesn't trust you with money right now.`;
  if (p.closeness < 50) return "Not close enough to ask.";
  if (p.role === "child") return "You don't borrow from your kids.";
  return null;
}

/** The chance a monthly payment to you arrives. */
export function payChance(p: Person): number {
  return clamp(temperOf(p).reliability / 100 + (p.closeness - 50) / 250, 0.15, 0.98);
}

function note(p: Person, line: string, at: number) {
  p.history = [...(p.history ?? []), { at, line }].slice(-6);
}

function newLoan(g: Game, p: Person, dir: Loan["dir"], amount: number): Loan {
  const months = termFor(amount);
  const loan: Loan = { id: `ln${g.nextId++}`, personId: p.id, dir, amount, left: amount, monthly: Math.ceil(amount / months), since: nowAt(g), misses: 0, status: "open" };
  loansOf(g).push(loan);
  return loan;
}

export type TieResult = { ok: boolean; line: string };

/** `tie|lend|<personId>|<amount>`, `tie|borrow|…`, `tie|forgive|<loanId>`, `tie|chase|<loanId>`, `tie|payoff|<loanId>`, `tie|help|yes|no`. */
export function tieAct(g: Game, id: string): TieResult {
  const [, verb, a, b] = id.split("|");
  const at = nowAt(g);
  const person = (pid?: string) => g.relationships.find((r) => r.id === pid && r.alive);
  if (verb === "lend" || verb === "borrow") {
    const p = person(a);
    const amount = Number(b);
    if (!p || !canTalkMoney(g, p) || !(amount > 0)) return { ok: false, line: "Not someone you can talk money with." };
    const name = firstName(p.name);
    if (verb === "lend") {
      if (openLoan(g, p.id)) return { ok: false, line: `${name} already owes you, or you owe them. One thing at a time.` };
      if (g.stats.money < amount) return { ok: false, line: "You don't have that much." };
      const loan = newLoan(g, p, "lent", amount);
      g.stats.money -= amount;
      p.closeness = clamp(p.closeness + 3, 0, 100);
      note(p, `You lent ${money(amount)}`, at);
      return { ok: true, line: `You lend ${name} ${money(amount)}. ${money(loan.monthly)} a month for ${termFor(amount)} months, ${temperOf(p).id === "slippery" ? "they say" : "they promise"}.` };
    }
    const block = borrowBlock(g, p);
    if (block) return { ok: false, line: block };
    if (!borrowAmounts(p).includes(amount)) return { ok: false, line: `${name} can't spare that.` };
    const loan = newLoan(g, p, "borrowed", amount);
    g.stats.money += amount;
    note(p, `Lent you ${money(amount)}`, at);
    return { ok: true, line: `${name} lends you ${money(amount)}. You pay back ${money(loan.monthly)} a month for ${termFor(amount)} months, straight from your cash.` };
  }
  if (verb === "help") {
    const ask = g.tieAsk;
    const p = ask ? person(ask.personId) : undefined;
    if (!ask || !p) {
      g.tieAsk = null;
      return { ok: false, line: "Nobody's asking any more." };
    }
    const name = firstName(p.name);
    if (a === "yes") {
      if (g.stats.money < ask.amount) return { ok: false, line: "You don't have that much." };
      if (openLoan(g, p.id)) return { ok: false, line: "Settle what's open first." };
      g.tieAsk = null;
      newLoan(g, p, "lent", ask.amount);
      g.stats.money -= ask.amount;
      p.closeness = clamp(p.closeness + 6, 0, 100);
      note(p, `Helped with ${ask.reason} (${money(ask.amount)})`, at);
      return { ok: true, line: `You help ${name} with ${ask.reason}. They won't forget it.` };
    }
    g.tieAsk = null;
    p.closeness = clamp(p.closeness - 4, 0, 100);
    note(p, `You couldn't help with ${ask.reason}`, at);
    return { ok: true, line: `You tell ${name} you can't this time. It stings a little, on both sides.` };
  }
  const loan = (g.loans ?? []).find((l) => l.id === a && l.status === "open");
  const p = loan ? person(loan.personId) : undefined;
  if (!loan || !p) return { ok: false, line: "That's settled already." };
  const name = firstName(p.name);
  if (verb === "forgive" && loan.dir === "lent") {
    loan.status = "forgiven";
    p.closeness = clamp(p.closeness + 5, 0, 100);
    p.trust = clamp(trustOf(p) + 4, 0, 100);
    note(p, `You let ${money(loan.left)} go`, at);
    return { ok: true, line: `You tell ${name} to forget the ${money(loan.left)}. They hug you like it was more.` };
  }
  if (verb === "chase" && loan.dir === "lent") {
    if (g.flags[`chase:${loan.id}`] === at) return { ok: false, line: "You already asked this month." };
    g.flags[`chase:${loan.id}`] = at;
    p.closeness = clamp(p.closeness - 3, 0, 100);
    if (hash("chase", loan.id, at) < payChance(p) * 0.6) {
      g.stats.money += loan.left;
      note(p, `Paid back ${money(loan.left)} when you asked`, at);
      loan.left = 0;
      loan.status = "paid";
      p.trust = clamp(trustOf(p) + 4, 0, 100);
      return { ok: true, line: `${name} pays the rest when you ask, a little embarrassed.` };
    }
    p.trust = clamp(trustOf(p) - 3, 0, 100);
    return { ok: true, line: `${name} says next month. You've heard that before.` };
  }
  if (verb === "payoff" && loan.dir === "borrowed") {
    if (g.stats.money < loan.left) return { ok: false, line: `You need ${money(loan.left)} to clear it.` };
    g.stats.money -= loan.left;
    note(p, `You paid back ${money(loan.amount)}`, at);
    loan.left = 0;
    loan.status = "paid";
    p.trust = clamp(trustOf(p) + 8, 0, 100);
    p.closeness = clamp(p.closeness + 2, 0, 100);
    return { ok: true, line: `You clear what you owe ${name}. They notice.` };
  }
  return { ok: false, line: "Not now." };
}

const REASONS = ["a car repair", "rent this month", "a dentist bill", "a course they want to take", "a vet bill", "a deposit on a flat"];

/** Each month: payments on every open loan, and now and then someone close asks for help. */
export function tieMonth(g: Game, banners: string[]): void {
  if (!TIES_ON) return;
  const at = nowAt(g);
  for (const loan of g.loans ?? []) {
    if (loan.status !== "open" || loan.since >= at) continue;
    const p = g.relationships.find((r) => r.id === loan.personId);
    if (!p) continue;
    const name = firstName(p.name);
    if (!p.alive) {
      loan.status = "forgiven";
      continue;
    }
    const due = Math.min(loan.monthly, loan.left);
    if (loan.dir === "lent") {
      if (hash("pay", loan.id, at) < payChance(p)) {
        g.stats.money += due;
        loan.left -= due;
        loan.misses = 0;
        if (loan.left <= 0) {
          loan.status = "paid";
          p.trust = clamp(trustOf(p) + 10, 0, 100);
          p.closeness = clamp(p.closeness + 3, 0, 100);
          note(p, `Paid back all ${money(loan.amount)}`, at);
          banners.push(`${name} paid back all ${money(loan.amount)}.`);
        }
      } else {
        loan.misses += 1;
        p.trust = clamp(trustOf(p) - 4, 0, 100);
        if (loan.misses >= MAX_MISSES) {
          loan.status = "unpaid";
          p.trust = clamp(trustOf(p) - 15, 0, 100);
          p.closeness = clamp(p.closeness - 6, 0, 100);
          note(p, `Stopped paying (${money(loan.left)} still owed)`, at);
          banners.push(`${name} has stopped paying you back (${money(loan.left)} owed).`);
        } else if (loan.misses === 1) banners.push(`${name}'s payment didn't come this month.`);
      }
    } else if (g.stats.money >= due) {
      g.stats.money -= due;
      loan.left -= due;
      loan.misses = 0;
      if (loan.left <= 0) {
        loan.status = "paid";
        p.trust = clamp(trustOf(p) + 8, 0, 100);
        note(p, `You paid back ${money(loan.amount)}`, at);
        banners.push(`You've paid ${name} back in full.`);
      }
    } else {
      loan.misses += 1;
      p.trust = clamp(trustOf(p) - 6, 0, 100);
      banners.push(`You couldn't pay ${name} this month (${money(due)}). Trust −6.`);
      if (loan.misses >= MAX_MISSES) {
        p.closeness = clamp(p.closeness - 10, 0, 100);
        loan.misses = 0;
        note(p, "Brought up the money you owe, at dinner", at);
        banners.push(`${name} brings up the money at dinner. Closeness −10.`);
      }
    }
  }
  // Someone close asks for help (about once every 2-3 years with a few people around). Waits up to a year, so a year-a-tap Play still shows it.
  if (g.tieAsk && g.tieAsk.until <= at) g.tieAsk = null;
  if (!g.tieAsk && g.age >= 18 && g.stats.money >= 400) {
    const close = g.relationships.filter((p) => canTalkMoney(g, p) && p.closeness >= 40 && p.role !== "child" && !openLoan(g, p.id));
    const pick = close[Math.floor(hash("askwho", g.name, at) * close.length)];
    if (pick && hash("ask", g.name, at) < ASK_EVERY * Math.min(3, close.length)) {
      const amount = [300, 600, 1500][Math.floor(hash("askamt", pick.id, at) * 3)]!;
      const reason = REASONS[Math.floor(hash("askwhy", pick.id, at) * REASONS.length)]!;
      const ask: TieAsk = { personId: pick.id, amount: Math.min(amount, Math.max(300, Math.floor(g.stats.money / 3 / 100) * 100)), reason, until: at + 12 };
      g.tieAsk = ask;
      banners.push(`${firstName(pick.name)} asks to borrow ${money(ask.amount)} for ${reason}. People ▸ ${firstName(pick.name)}.`);
    }
  }
}

/** One line for the person card: what's open between you. */
export function loanLine(g: Game, loan: Loan, p: Person): string {
  const name = firstName(p.name);
  const paid = loan.amount - loan.left;
  const monthsLeft = Math.ceil(loan.left / Math.max(1, loan.monthly));
  if (loan.dir === "lent") return `${name} owes you ${money(loan.left)} of ${money(loan.amount)} · ${money(loan.monthly)}/mo · ${monthsLeft} to go${loan.misses ? ` · ${loan.misses} missed` : ""}`;
  return `You owe ${name} ${money(loan.left)} · ${money(loan.monthly)}/mo · ${monthsLeft} to go${paid ? ` · ${money(paid)} paid` : ""}`;
}

/** A save from before ties: nothing to do but make sure the shapes are right. */
export function ensureTies(g: Game): Game {
  if (!Array.isArray(g.loans)) g.loans = [];
  g.loans = g.loans.filter((l) => l && typeof l.id === "string" && typeof l.left === "number" && (l.dir === "lent" || l.dir === "borrowed"));
  if (g.tieAsk && typeof g.tieAsk.personId !== "string") g.tieAsk = null;
  return g;
}

/** What changed between you and your people over a Play step, for the card (asks, paid off, stopped paying). */
export function tieNews(start: Game, end: Game): string[] {
  if (!TIES_ON) return [];
  const out: string[] = [];
  const ask = end.tieAsk;
  if (ask && (start.tieAsk?.personId !== ask.personId || start.tieAsk?.until !== ask.until)) {
    const p = end.relationships.find((r) => r.id === ask.personId);
    if (p) out.push(`${firstName(p.name)} asks to borrow ${money(ask.amount)} for ${ask.reason}. People ▸ ${firstName(p.name)}.`);
  }
  const was = new Map((start.loans ?? []).map((l) => [l.id, l.status]));
  for (const l of end.loans ?? []) {
    if (was.get(l.id) !== "open" || l.status === "open") continue;
    const p = end.relationships.find((r) => r.id === l.personId);
    if (!p) continue;
    const name = firstName(p.name);
    if (l.status === "paid") out.push(l.dir === "lent" ? `${name} paid back all ${money(l.amount)}.` : `You've paid ${name} back in full.`);
    else if (l.status === "unpaid") out.push(`${name} has stopped paying you back (${money(l.left)} owed).`);
  }
  return out.slice(0, 2);
}
