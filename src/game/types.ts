import type { MarketState } from "./market";
import type { Chapter, ChapterNotice } from "./chapters";
export type PowerId =
  | "strength"
  | "flight"
  | "blasts"
  | "speed"
  | "telekinesis"
  | "invisibility"
  | "fire"
  | "ice"
  | "healing"
  | "mind"
  | "shapeshift"
  | "forcefield"
  | "intellect"
  | "elastic"
  | "lightning";

export type UpbringingId =
  | "supportive"
  | "skeptical"
  | "legacy"
  | "absent"
  | "scientific"
  | "normal"
  | "alien"
  | "tragic"
  | "military"
  | "wealthy"
  | "foster"
  | "rural"
  | "program"
  | "street"
  | "celebrity"
  | "isolated";

export type TraitId =
  | "secret"
  | "loud"
  | "reluctant"
  | "protector"
  | "vengeful"
  | "idealistic"
  | "pragmatic"
  | "team"
  | "lone"
  | "millionaire"
  | "sorcerer"
  | "inventor"
  | "celebrity"
  | "liaison"
  | "underworld"
  | "royalty"
  | "martial"
  | "psychic"
  | "insider";

export type Sex = "female" | "male";

export type Phase = "live" | "choice" | "mini" | "dead";

export type PersonRole = "parent" | "friend" | "partner" | "rival" | "teammate" | "child" | "ex" | "hero" | "villain";

export interface Stats {
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
  fame: number;
  money: number;
  reputation: number;
  parentBelief: number;
  powerLevel: number;
  karma: number;
}

export interface Effects {
  health?: number;
  happiness?: number;
  smarts?: number;
  looks?: number;
  fame?: number;
  money?: number;
  reputation?: number;
  parentBelief?: number;
  powerLevel?: number;
  closeness?: number;
  personId?: string;
  karma?: number;
}

export type Special =
  | { kind: "job"; jobId: string }
  | { kind: "school"; schoolId: string }
  | { kind: "death"; cause: string }
  | { kind: "swap" }
  | { kind: "friend" }
  | { kind: "rival" }
  | { kind: "partner" }
  | { kind: "baby" }
  | { kind: "rankup" }
  | { kind: "meet"; side: "hero" | "villain" }
  | { kind: "arch"; personId?: string }
  | { kind: "combine" }
  | { kind: "grant"; comboId?: string }
  | { kind: "meetHero"; heroId?: string }
  | { kind: "heroProgress"; heroId: string; exp: number; bond: number; teach?: string; masteryId?: string; masteryExp?: number }
  | { kind: "foundCrew"; style: "smash" | "quiet" | "fear" }
  | { kind: "heist"; style: "smash" | "quiet" | "fear" | "spark" }
  | { kind: "crewTouch"; heat: number; loyalty: number; blame?: boolean }
  | { kind: "draft"; personId: string }
  | { kind: "mastery"; powerId: string; exp: number }
  | { kind: "arcAdvance" }
  | { kind: "trait"; traitId: TraitId }
  | { kind: "dropTrait"; traitId: TraitId }
  | { kind: "retitle"; drop: TraitId; add: TraitId }
  | { kind: "move"; cityId: string };

export type MoveStyle = "strike" | "guard" | "trick";

export interface DuelMove {
  id?: string;
  name: string;
  blurb: string;
  power: number;
  style: MoveStyle;
  kind?: "burst" | "area" | "status" | "guard" | "dash";
  energy?: number;
  effect?: string;
  cooldown?: number;
  /** Element id for VFX and the card icon (see elements.ts). */
  element?: string;
  /** Move rank 1–5 for player moves. */
  rank?: number;
}

export interface Look {
  skin: number;
  hair: number;
  style: number;
  build: number;
  feature: number;
}

export type CostumeSlot = "cowl" | "chest" | "cape" | "gloves" | "boots" | "emblem";

export interface Wardrobe {
  owned: string[];
  worn: Partial<Record<CostumeSlot, string>>;
}

export interface DuelBoard {
  foeName: string;
  foeTitle: string;
  foeSide: "hero" | "villain";
  playerHp: number;
  foeHp: number;
  playerMoves: DuelMove[];
  foeMoves: DuelMove[];
  personId?: string;
  /** Percent of incoming damage shrugged off by the suit. */
  guard?: number;
  /** Legacy power id of the foe, for its look and element. */
  foePower?: string;
  /** Seed for the foe's generated look. */
  foeSeed?: number;
  foeSex?: Sex;
  /** Boss fights get a bigger entrance and a gold KO. */
  boss?: boolean;
}

export interface Cape {
  id: string;
  name: string;
  alias: string;
  side: "hero" | "villain" | "rogue";
  powerId: PowerId;
  powerLevel: number;
  heat: number;
  note: string;
  portrait: number;
  sex?: Sex;
}

export interface CrewMember {
  personId: string;
  name: string;
  alias: string;
}

export interface Crew {
  name: string;
  members: CrewMember[];
  heat: number;
  loyalty: number;
  motto: string;
}

export interface HeroMemory {
  role: "you" | "them";
  text: string;
}

export interface AiHero {
  id: string;
  name: string;
  alias: string;
  personality: string;
  relationship: number;
  level: number;
  exp: number;
  unlocked: string[];
  memory: HeroMemory[];
  met: boolean;
  sex: Sex;
  portrait: number;
}

export interface MoveSet {
  name: string;
  moves: string[];
}

export interface StoryState {
  active: string | null;
  cleared: string[];
  progress: Record<string, number>;
}

export interface Delta {
  stat: string;
  amount: number;
}

export interface MinigameSpec {
  kind: "timing" | "pattern" | "duel";
  title: string;
  subtitle: string;
  difficulty: number;
  winText: string;
  loseText: string;
  partialText: string;
  winEffects: Effects;
  loseEffects: Effects;
  partialEffects: Effects;
  specialWin?: Special;
  specialPartial?: Special;
  specialLose?: Special;
  tag?: "tryout" | "mission" | "duel" | "relic";
  duel?: DuelBoard;
}

export interface Outcome {
  text: string;
  effects?: Effects;
  minigame?: MinigameSpec;
  special?: Special;
  flags?: Record<string, number>;
}

export interface Pending {
  id: string;
  prompt: string;
  choices: { id: string; label: string }[];
  outcomes: Record<string, Outcome>;
}

export interface Card {
  kicker: string;
  banner: string[];
  body: string;
  deltas: Delta[];
}

export interface HistoryEntry {
  age: number;
  month?: number;
  text: string;
  tag?: "major";
}

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  closeness: number;
  age: number;
  alive: boolean;
  metAt: number;
  note?: string;
  portrait?: number;
  sex?: Sex;
  latentPower?: PowerId | null;
  arch?: boolean;
}

export interface DeathReport {
  cause: string;
  story: string;
  score: number;
  rows: { label: string; points: number }[];
  at: number;
}

export interface Game {
  version: 2;
  rng: number;
  nextId: number;
  phase: Phase;
  name: string;
  city: string;
  cityId: string;
  upbringing: UpbringingId;
  traits: TraitId[];
  portrait: number;
  sex: Sex;
  look: Look;
  age: number;
  month: number;
  stats: Stats;
  powerId: PowerId | null;
  secondaryId: PowerId | null;
  unlockedPowers: string[];
  /** Powers whose names and pages you have been shown. Not the same as owning them. */
  discovered: string[];
  powerless: boolean;
  /** The one gift chosen at the start. Later powers are learned, not bundled. */
  giftId: string | null;
  powerBias: PowerId | null;
  schoolId: string | null;
  schoolYears: number;
  jobId: string | null;
  jobYears: number;
  jobRank: number;
  leagueRank: number;
  teamId: string | null;
  missions: number;
  relationships: Person[];
  roster: Cape[];
  crew: Crew | null;
  heroes: AiHero[];
  mastery: Record<string, number>;
  /** Fight-move experience, keyed by move id. Separate from power mastery. */
  moveExp: Record<string, number>;
  loadout: string[];
  moveSets: MoveSet[];
  wardrobe: Wardrobe;
  focusPower: string | null;
  story: StoryState;
  majorsLeft: number;
  flags: Record<string, number>;
  card: Card;
  pending: Pending | null;
  minigame: MinigameSpec | null;
  history: HistoryEntry[];
  death: DeathReport | null;
  lastEvent: string;
  peak: { fame: number; power: number; rank: number; money: number; rep: number };
  /** Decade chapters, oldest first. The last one is running. Optional for old saves (see migrateChapters). */
  chapters?: Chapter[];
  /** Late-life purpose: mentoring, teaching, family and finished chapters. Softens aging. */
  legacy?: number;
  /** A chapter title card / recap waiting to be shown. UI-only, cleared on dismiss. */
  chapterNotice?: ChapterNotice | null;
  /** What you own and what the market remembers. Optional for old saves. */
  market?: MarketState;
}

export interface ActionItem {
  id: string;
  group: "life" | "power" | "career" | "people";
  section: string;
  label: string;
  detail?: string;
  disabled?: string;
  accent?: boolean;
}
