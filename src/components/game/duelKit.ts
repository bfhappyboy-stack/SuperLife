/**
 * Opponent looks for the duel: a costume kit per legacy power type, villains in hard, saturated palettes
 * and sparring heroes in friendlier ones. Purely presentational.
 */
import type { Fit } from "@/game/costume";

export interface FighterKit {
  suit: string;
  trim: string;
  cape?: string;
  capeKind?: Fit["cape"];
  mask?: Fit["mask"];
  maskColor?: string;
  glove?: string;
  /** Short type label, e.g. "Pyro". */
  type: string;
}

const VILLAIN: Record<string, FighterKit> = {
  fire: { type: "Pyro", suit: "#3a1410", trim: "#ff6a2b", capeKind: "tatter", cape: "#5c1a10", mask: "crown", glove: "#2a0d08" },
  ice: { type: "Cryo", suit: "#1d3550", trim: "#9fe6ff", capeKind: "short", cape: "#2a4d6e", mask: "helm", maskColor: "#cfefff" },
  lightning: { type: "Storm", suit: "#1a1a24", trim: "#ffe14d", mask: "domino", glove: "#ffe14d", capeKind: "short", cape: "#24243a" },
  speed: { type: "Blur", suit: "#2a1630", trim: "#ff3b6b", mask: "helm", maskColor: "#3a2440" },
  mind: { type: "Mentalist", suit: "#2a1640", trim: "#b07cff", mask: "hood", maskColor: "#1c0f2e", capeKind: "long", cape: "#3b1d5c" },
  strength: { type: "Brute", suit: "#2b2f38", trim: "#ff5a4f", mask: "domino", glove: "#555b66" },
  blasts: { type: "Blaster", suit: "#10283a", trim: "#4dd8ff", mask: "helm", maskColor: "#203a50", glove: "#4dd8ff" },
  telekinesis: { type: "Kinetic", suit: "#24163a", trim: "#c48bff", mask: "cowl", maskColor: "#140c22", capeKind: "long", cape: "#2a1640" },
  invisibility: { type: "Phantom", suit: "#16161c", trim: "#6e6a8f", mask: "hood", maskColor: "#0e0e14", capeKind: "coat", cape: "#1c1c26" },
  shapeshift: { type: "Skinwalker", suit: "#123024", trim: "#6be38a", mask: "domino", capeKind: "tatter", cape: "#0f2a1e" },
  forcefield: { type: "Bulwark", suit: "#103a36", trim: "#3fe0c5", mask: "helm", maskColor: "#2c6e66", glove: "#3fe0c5" },
  elastic: { type: "Snap", suit: "#3a2a10", trim: "#ffb84d", mask: "domino" },
  healing: { type: "Leech", suit: "#1e2f22", trim: "#6be38a", mask: "hood", maskColor: "#16241a", capeKind: "long", cape: "#203a2a" },
  intellect: { type: "Mastermind", suit: "#20242e", trim: "#c48bff", mask: "helm", maskColor: "#3a3f4e", capeKind: "coat", cape: "#2a2e3a" },
  flight: { type: "Raptor", suit: "#1a2744", trim: "#8fe3d2", capeKind: "banner", cape: "#20335a", mask: "cowl", maskColor: "#121c33" },
};

const HERO: Record<string, FighterKit> = {
  fire: { type: "Flame", suit: "#c8401e", trim: "#ffd27a", capeKind: "short", cape: "#ffb347", mask: "domino" },
  ice: { type: "Frost", suit: "#2e6fa8", trim: "#e6fbff", capeKind: "long", cape: "#9fe6ff", mask: "domino" },
  lightning: { type: "Volt", suit: "#2a3a9c", trim: "#ffe14d", capeKind: "short", cape: "#ffe14d", mask: "domino" },
  speed: { type: "Sprinter", suit: "#c9283e", trim: "#ffcf4d", mask: "helm", maskColor: "#c9283e" },
  mind: { type: "Psion", suit: "#5a3aa8", trim: "#e1d0ff", capeKind: "long", cape: "#8a6ad8", mask: "halo" },
  strength: { type: "Titan", suit: "#2f5bd6", trim: "#ffcf4d", capeKind: "long", cape: "#d63a3a", mask: "none" },
  blasts: { type: "Beacon", suit: "#1c7aa8", trim: "#ffffff", mask: "domino", glove: "#ffffff" },
  telekinesis: { type: "Lifter", suit: "#6a3ad6", trim: "#ffd27a", capeKind: "short", cape: "#ffd27a", mask: "domino" },
  invisibility: { type: "Ghost", suit: "#3c4a66", trim: "#c9d4ff", mask: "cowl", maskColor: "#2a3550" },
  shapeshift: { type: "Mimic", suit: "#2a8a5a", trim: "#e8ffe6", capeKind: "short", cape: "#6be38a", mask: "domino" },
  forcefield: { type: "Aegis", suit: "#1f8a7e", trim: "#ffffff", capeKind: "long", cape: "#3fe0c5", mask: "helm", maskColor: "#e8f4f2" },
  elastic: { type: "Stretch", suit: "#d66a1a", trim: "#1a2a44", mask: "domino" },
  healing: { type: "Medic", suit: "#f0ece2", trim: "#2fbf6a", capeKind: "short", cape: "#2fbf6a", mask: "none" },
  intellect: { type: "Gadgeteer", suit: "#34455e", trim: "#ffcf4d", mask: "helm", maskColor: "#ffcf4d", glove: "#ffcf4d" },
  flight: { type: "Skyborn", suit: "#2f6fd6", trim: "#ffffff", capeKind: "banner", cape: "#ffffff", mask: "domino" },
};

const STREET: FighterKit = { type: "Street", suit: "#3a3f4e", trim: "#c9ccd4", mask: "hood", maskColor: "#2a2e3a" };

export function kitFor(power: string | undefined, side: "hero" | "villain"): FighterKit {
  const table = side === "villain" ? VILLAIN : HERO;
  return (power && table[power]) || (side === "villain" ? STREET : { ...STREET, type: "Sparring", mask: "none", suit: "#3c4a66" });
}
