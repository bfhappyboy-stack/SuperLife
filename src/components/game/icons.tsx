/**
 * One icon language for the whole game: 24px grid, 2px rounded strokes (lucide for UI glyphs),
 * plus hand-drawn filled glyphs for the nine power families. Tiles wrap any icon in a lit badge.
 */
import {
  Banknote, BookOpen, Brain, Briefcase, Building2, Cpu, Crown, Eye, FileSearch, Flame, Gem, GraduationCap, Heart, HeartPulse,
  Landmark, Megaphone, Shield, ShieldCheck, ShoppingBag, Smile, Sparkles, Star, Swords, Target, Users, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { CapeFamily } from "@/game/theme";
import type { MarketCat } from "@/game/market";

export const FAMILY_COLOR: Record<CapeFamily, string> = {
  fire: "#ff7a3d",
  ice: "#7fd3ff",
  storm: "#a59bff",
  mind: "#8fb0ff",
  might: "#ffb35c",
  swift: "#3fe0c5",
  veil: "#b9c2d6",
  life: "#4fe39a",
  arcane: "#e7a2ff",
};

/** Filled glyphs for power families. viewBox 0 0 24 24. */
const FAMILY_PATH: Record<CapeFamily, string> = {
  fire: "M12 2c1 3.5 5 5.6 5 10.2A5 5 0 0 1 12 17a5 5 0 0 1-5-4.8c0-2 1-3.4 2.2-4.4-.1 1.6.6 2.8 1.8 3.2C10.4 8.4 11.2 5 12 2Zm0 10.5c.8 1.2 2 1.9 2 3.3a2 2 0 0 1-4 0c0-1 .7-1.8 2-3.3ZM5 20h14v2H5z",
  ice: "M11 2h2v4.2l2.6-1.5 1 1.7L13 8.6v2.7l2.3-1.3 3.6-2.1 1 1.7-3.6 2.1L18.6 13l-1 1.7-2.3-1.3-2.3 1.3V17.4l3.6 2.1-1 1.7L13 19.6V22h-2v-2.4l-2.6 1.6-1-1.7 3.6-2.1v-2.7l-2.3 1.3-2.3 1.3-1-1.7L7.7 13l-3.6-2.1 1-1.7 3.6 2.1L11 11.3V8.6L7.4 6.4l1-1.7L11 6.2Z",
  storm: "M13.5 2 5 13.5h5.2L8.8 22 19 9.8h-5.6L15.8 2Z",
  mind: "M12 3c4.4 0 8 2.9 8 6.8 0 2.2-1.2 3.7-2.6 4.6V18l-3.2-2.3c-.7.1-1.4.2-2.2.2-4.4 0-8-2.9-8-6.4S7.6 3 12 3Zm-3 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 20.5h8V22H8z",
  might: "M7 4h3v5h4V4h3v6.5c1.7.6 3 2.2 3 4.1V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5.4c0-1.9 1.3-3.5 3-4.1Zm-.5 9.5v2h11v-2Z",
  swift: "M3 7h9l-2.5-3h3.2L18 9.5 12.7 15H9.5l2.5-3H3v-2h7.5l.9-1H3Zm1 9h7v2H4Zm-2 3h6v2H2Z",
  veil: "M12 3c4.8 0 8 3.8 8 9v9l-2.7-2-2.6 2-2.7-2-2.6 2-2.7-2L4 21v-9c0-5.2 3.2-9 8-9Zm-3 7a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 9 10Zm6 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z",
  life: "M12 21s-8-4.9-8-11a4.6 4.6 0 0 1 8-3.1A4.6 4.6 0 0 1 20 10c0 6.1-8 11-8 11Zm-1-12v2.5H8.5v2H11V16h2v-2.5h2.5v-2H13V9Z",
  arcane: "M12 2l2.4 5.2L20 8l-4 4 1 5.8-5-2.8-5 2.8 1-5.8-4-4 5.6-.8Zm0 6.2-1 2-2.2.3 1.6 1.6-.4 2.2 2-1.1 2 1.1-.4-2.2 1.6-1.6-2.2-.3Z",
};

export function FamilyGlyph({ family, className = "size-5", style }: { family: CapeFamily | null; className?: string; style?: CSSProperties }) {
  if (!family) return <Sparkles className={className} style={style} aria-hidden />;
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden fill="currentColor">
      <path d={FAMILY_PATH[family]} fillRule="evenodd" />
    </svg>
  );
}

export const STAT_ICON: Record<string, LucideIcon> = {
  health: HeartPulse,
  happiness: Smile,
  smarts: Brain,
  looks: Sparkles,
  money: Banknote,
  fame: Star,
  reputation: Shield,
  power: Zap,
};

export const STAT_COLOR: Record<string, string> = {
  health: "#ff5d6c",
  happiness: "#ffc94d",
  smarts: "#7cb4ff",
  looks: "#ff8fd0",
  money: "#5fe08f",
  fame: "#ffd166",
  reputation: "#8fd3ff",
  power: "#c59bff",
};

export const TAB_ICON = { life: Heart, gift: Zap, cases: Target, people: Users, work: Briefcase } as const;

export const CAT_ICON: Record<MarketCat, LucideIcon> = {
  gear: Wrench,
  supplies: HeartPulse,
  intel: FileSearch,
  influence: Megaphone,
  property: Building2,
  tech: Cpu,
  legacy: Landmark,
};

export const CAT_COLOR: Record<MarketCat, string> = {
  gear: "#ff9f43",
  supplies: "#ff5d6c",
  intel: "#7cb4ff",
  influence: "#ffd166",
  property: "#5fe08f",
  tech: "#3fe0c5",
  legacy: "#e7a2ff",
};

/** Section/action glyphs keyed by loose words in an action's section or id. */
export function actionIcon(id: string, section: string): LucideIcon {
  const s = `${id} ${section}`.toLowerCase();
  if (/rest|doctor|health|clinic/.test(s)) return HeartPulse;
  if (/train|drill|gym|stunt/.test(s)) return Zap;
  if (/fight|brawl|duel|patrol|mission|arc|case/.test(s)) return Swords;
  if (/school|class|study|book/.test(s)) return GraduationCap;
  if (/job|shift|work|promote/.test(s)) return Briefcase;
  if (/date|partner|baby|family|friend|befriend|mentor/.test(s)) return Users;
  if (/league|team|tryout/.test(s)) return ShieldCheck;
  if (/crime|heist|crew|shadow|other road/.test(s)) return Eye;
  if (/city|walk|relocate/.test(s)) return Building2;
  if (/become|trait/.test(s)) return Crown;
  if (/teach|hero|talk/.test(s)) return BookOpen;
  if (/buy|market|shop/.test(s)) return ShoppingBag;
  if (/gift|power|mix/.test(s)) return Gem;
  if (/flame|fire/.test(s)) return Flame;
  return Star;
}

export function IconTile({ color, size = "size-10", children, className = "" }: { color: string; size?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`ico-tile ${size} ${className}`} style={{ "--tile": color } as CSSProperties}>
      {children}
    </span>
  );
}
