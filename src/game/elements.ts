/**
 * Elements: how a power or a move looks and sounds in a fight. Purely presentational data; the duel maths
 * never reads it. Every catalog power resolves to one element (explicit, or inherited from its parents by
 * priority), every move can override it, and legacy villain powers map onto the same set.
 */
import { getPower } from "./combo";

export type ElementId =
  | "fire"
  | "ice"
  | "lightning"
  | "light"
  | "energy"
  | "psychic"
  | "speed"
  | "wind"
  | "gravity"
  | "force"
  | "shadow"
  | "warp"
  | "arcane"
  | "life"
  | "shield"
  | "stretch";

export interface ElementMeta {
  label: string;
  /** Main colour, glow colour. */
  color: string;
  glow: string;
  /** How the attack travels across the arena. */
  travel: "orb" | "beam" | "bolt" | "streak" | "ripple" | "lunge";
}

export const ELEMENTS: Record<ElementId, ElementMeta> = {
  fire: { label: "Fire", color: "#ff6a2b", glow: "#ffb347", travel: "orb" },
  ice: { label: "Ice", color: "#7fd8ff", glow: "#e6fbff", travel: "beam" },
  lightning: { label: "Lightning", color: "#ffe14d", glow: "#fff7c2", travel: "bolt" },
  light: { label: "Light", color: "#fff1b8", glow: "#ffffff", travel: "beam" },
  energy: { label: "Energy", color: "#4dd8ff", glow: "#b8f1ff", travel: "beam" },
  psychic: { label: "Psychic", color: "#b07cff", glow: "#e2ccff", travel: "ripple" },
  speed: { label: "Speed", color: "#e8eefc", glow: "#9fd3ff", travel: "streak" },
  wind: { label: "Storm", color: "#8fe3d2", glow: "#e4fff8", travel: "streak" },
  gravity: { label: "Gravity", color: "#8a5cff", glow: "#3b1d8f", travel: "ripple" },
  force: { label: "Force", color: "#ff8f5a", glow: "#ffd2b0", travel: "lunge" },
  shadow: { label: "Shadow", color: "#6e6a8f", glow: "#1c1a2e", travel: "lunge" },
  warp: { label: "Warp", color: "#ff5ad8", glow: "#ffc2f0", travel: "lunge" },
  arcane: { label: "Arcane", color: "#c48bff", glow: "#ffd98a", travel: "orb" },
  life: { label: "Life", color: "#6be38a", glow: "#d6ffe0", travel: "ripple" },
  shield: { label: "Shield", color: "#3fe0c5", glow: "#c8fff5", travel: "ripple" },
  stretch: { label: "Stretch", color: "#ffb84d", glow: "#ffe3b0", travel: "lunge" },
};

const BASE: Record<string, ElementId> = {
  "fire-control": "fire",
  "ice-control": "ice",
  "lightning-control": "lightning",
  "super-strength": "force",
  "super-speed": "speed",
  flight: "wind",
  telekinesis: "psychic",
  telepathy: "psychic",
  "energy-projection": "energy",
  invisibility: "shadow",
  regeneration: "life",
  "super-durability": "shield",
  gravity: "gravity",
  weather: "wind",
  "super-senses": "psychic",
  "force-field": "shield",
  teleportation: "warp",
  "shape-shifting": "shadow",
  elasticity: "stretch",
  sorcery: "arcane",
};

/** Combos whose look is not simply their strongest parent's. */
const COMBO: Record<string, ElementId> = {
  "light-speed": "light",
  "lightning-strikes": "lightning",
  "solar-flare": "light",
  "photon-bolt": "light",
  "magma-fist": "fire",
  "absolute-zero-dash": "ice",
  "thunder-sprint": "lightning",
  "kinetic-impact": "force",
  "velocity-control": "speed",
  "psychic-crush": "psychic",
  "plasma-blast": "energy",
  "sonic-flight": "speed",
  "storm-calling": "lightning",
  "thermal-break": "fire",
  "whiteout-front": "ice",
  "unkillable-frame": "life",
  "singularity-grip": "gravity",
  "orbit-break": "gravity",
  "blink-rush": "warp",
  "arc-lance": "lightning",
  "frost-beam": "ice",
  "bullet-time": "speed",
  "threat-map": "psychic",
  "aegis-shell": "shield",
  "reflected-sun": "light",
  "phoenix-habit": "fire",
  "mood-front": "wind",
  "gale-runner": "wind",
  "cinder-hex": "arcane",
  "bound-word": "arcane",
  "corona-dive": "light",
  "divine-thunder": "lightning",
  "cataclysm-storm": "lightning",
  "everywhere-at-once": "light",
  "event-horizon": "gravity",
  "steam-lance": "ice",
};

/** When a combo is not listed, the parent with the loudest element wins. */
const PRIORITY: ElementId[] = ["lightning", "fire", "ice", "light", "energy", "gravity", "arcane", "psychic", "warp", "wind", "shadow", "life", "shield", "stretch", "speed", "force"];

export function elementOfPower(id: string | null | undefined, depth = 0): ElementId {
  if (!id) return "force";
  if (BASE[id]) return BASE[id]!;
  if (COMBO[id]) return COMBO[id]!;
  const power = getPower(id);
  if (!power || power.ingredients.length < 2 || depth > 3) return "force";
  const options = power.ingredients.map((part) => elementOfPower(part, depth + 1));
  return [...options].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0] ?? "force";
}

/** Legacy 15-power ids (villains, the header power). */
const LEGACY: Record<string, ElementId> = {
  strength: "force",
  flight: "wind",
  blasts: "energy",
  speed: "speed",
  telekinesis: "psychic",
  invisibility: "shadow",
  fire: "fire",
  ice: "ice",
  healing: "life",
  mind: "psychic",
  shapeshift: "shadow",
  forcefield: "shield",
  intellect: "arcane",
  elastic: "stretch",
  lightning: "lightning",
};

export function elementOfLegacy(id: string | null | undefined): ElementId {
  return (id && LEGACY[id]) || "force";
}

export function isElement(value: unknown): value is ElementId {
  return typeof value === "string" && value in ELEMENTS;
}
