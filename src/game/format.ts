export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 10_000) return `${sign}$${Math.round(v / 1000)}k`;
  return `${sign}$${v.toLocaleString("en-US")}`;
}

export function repLabel(n: number): string {
  if (n <= -70) return "Villain";
  if (n <= -35) return "Rogue";
  if (n <= -10) return "Shady";
  if (n < 15) return "Unknown";
  if (n < 40) return "Local hero";
  if (n < 70) return "Beloved";
  return "Symbol";
}

export function fameLabel(n: number): string {
  if (n < 8) return "Nobody";
  if (n < 25) return "Local";
  if (n < 45) return "Rising";
  if (n < 70) return "Famous";
  if (n < 90) return "Superstar";
  return "Mythic";
}

export function karmaLabel(n: number): string {
  if (n >= 60) return "Saint";
  if (n >= 25) return "Hero";
  if (n >= 8) return "Decent";
  if (n > -8) return "Torn";
  if (n > -25) return "Rogue";
  if (n > -60) return "Villain";
  return "Monster";
}

export function tierLabel(pl: number): string {
  if (pl <= 0) return "—";
  if (pl < 2) return "C";
  if (pl < 4.5) return "B";
  if (pl < 7) return "A";
  if (pl < 9.2) return "S";
  return "X";
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function whenLabel(age: number, month: number): string {
  return `Age ${age} · ${MONTHS[month] ?? "January"}`;
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "You";
}

export function signed(n: number, digits = 0): string {
  const v = digits ? Number(n.toFixed(digits)) : Math.round(n);
  if (v > 0) return `+${v}`;
  return `${v}`;
}
