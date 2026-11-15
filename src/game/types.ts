import type { MarketState } from "./market";
import type { EconState, PeriodReport } from "./economy";
import type { MiniKind, MiniVerb, SkillKind } from "./minis";
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
  | "curious"
  | "glory"
  | "amends"
  | "duty"
  | "thrill"
  | "family"
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

export type PersonRole = "parent" | "friend" | "partner" | "rival" | "teammate" | "child" | "ex" | "hero" | "villain" | "crush";

/** Dating (2026-11-11): how far it has gone with a partner. */
export type LoveStage = "dating" | "together" | "living" | "engaged" | "married";

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
  /** Status this move leaves when it wins the edge (overrides its element's; null = none). See battle.ts. */
  applies?: StatusId | null;
  /** Stage 3 Ultimate: one of the six, armed at full Momentum. See battle.ts. */
  ultimate?: boolean;
}

/** Battle statuses (battle.ts). */
export type StatusId = "burn" | "frost" | "shock" | "expose" | "ward";

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

export type GimmickKind = "armor" | "enrage" | "fog" | "feint" | "adapt" | "regen" | "revive" | "coin" | "swarm" | "charge";

/** A boss's signature rule twist. Data only: see duel.ts for what each kind does. */
export interface BossGimmick {
  kind: GimmickKind;
  /** Name shown in the fight, e.g. "Living Armor". */
  name: string;
  /** What the boss says when the phase starts. */
  line: string;
  /** How to beat it, in one short line. */
  hint: string;
  /** Health fraction that starts phase 2 (default 0.55). 1 = live from the start. Ignored by revive. */
  at?: number;
  /** armor: the style that cracks it. regen: the style that stalls it. */
  style?: MoveStyle;
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
  /** The foe's effective power level (2026-11-10 eve: lets Play judge a routine fight). */
  foeLevel?: number;
  /** Legacy power id of the foe, for its look and element. */
  foePower?: string;
  /** Seed for the foe's generated look. */
  foeSeed?: number;
  foeSex?: Sex;
  /** Boss fights get a bigger entrance and a gold KO. */
  boss?: boolean;
  /** Signature twist; most switch on in phase 2. */
  gimmick?: BossGimmick;
  /** Final canon bosses only: a second twist that replaces the first as Phase 3 (at `at`, default 25% HP). */
  phase3?: BossGimmick;
  /** Life difficulty id, for HUD and AI. */
  difficulty?: LifeDifficulty;
  /** Multiplier on damage the foe deals (from difficulty.ts). Default 1. */
  foeDamage?: number;
  /** Chance the AI answers your last style (from difficulty.ts). Default 0.42. */
  aiHate?: number;
  /** Chance the AI fakes a tell to bait a habit (same style twice running). Default 0. */
  aiRead?: number;
  /** Stage tag from the city (or Arena). Nudges one element. */
  stage?: { tag: string; element: string; blurb: string };
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
  kind: MiniKind;
  /** Seeds per-game content (press questions, rescue layout). */
  seed?: number;
  /** Element id of the hero's signature power: tints the arena. */
  skin?: string;
  /** Engine-only hints, consumed when the mini opens: re-roll kind and title from this verb's pool. */
  verb?: MiniVerb;
  vars?: Record<string, string>;
  only?: SkillKind[];
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
  /** A Play step's money report (cash in and out, market moves, headlines). */
  money?: PeriodReport | null;
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
  /** Ties: how far they trust you with money and promises (0-100, missing = 50). */
  trust?: number;
  /** Ties: the last few things that happened between you (money, favours). */
  history?: { at: number; line: string }[];
  /** Dating: a partner's stage (missing on older saves: Married if wed, else Dating). */
  stage?: LoveStage;
  /** The mask at home (mask.ts): this partner knows you're a hero. */
  knowsSecret?: boolean;
  /** The mask at home: 0-100, how much they wonder about the late nights (missing = 0). */
  suspicion?: number;
  /** The mask at home: when you last told them and they needed space (months, age×12+month). */
  toldAt?: number;
  /** The mask at home: when they last found the suit (months). */
  foundAt?: number;
  /** After the truth (mask.ts): the month they last patched you up after a fight (months, age×12+month). */
  patchedAt?: number;
  /** After the truth: how many times they've patched you up (missing = 0). */
  patches?: number;
  /** After the truth: this ex sold your story to the press. */
  soldStory?: boolean;
}

/** Money between you and someone in your life (ties.ts). */
export interface Loan {
  id: string;
  personId: string;
  /** "lent": they owe you. "borrowed": you owe them. */
  dir: "lent" | "borrowed";
  amount: number;
  left: number;
  monthly: number;
  /** Month index it started (age * 12 + month). Payments begin the month after. */
  since: number;
  /** Missed payments in a row. */
  misses: number;
  status: "open" | "paid" | "forgiven" | "unpaid";
}

/** Someone close asking you for help with money. Waits on their People card for up to a year. */
export interface TieAsk {
  personId: string;
  amount: number;
  reason: string;
  until: number;
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
  /** The player has arranged the six by hand: the auto style-balancer leaves a full six alone. */
  handSix?: boolean;
  moveSets: MoveSet[];
  wardrobe: Wardrobe;
  focusPower: string | null;
  story: StoryState;
  majorsLeft: number;
  /** Life Flow: up to 3 everyday actions that fill the free time you don't spend yourself (in order). */
  routine?: string[];
  /** Life Flow: how far one Play tap goes. "auto" = a year as a kid, a season as a teen, a year from 18. */
  pace?: Pace;
  /** Life Flow: Play settles street fights you're about even with or better and lists them in the recap.
   *  Opt-in (owner's call, 2026-11-10 late): off unless the player turned it on themselves. */
  autoFights?: boolean;
  /** The player has flipped the Auto fights switch by hand (so a save migration never overrides their choice). */
  autoFightsSet?: boolean;
  /** Powers you used since your last birthday (fights, training, lessons). Only these ripen on the birthday
   *  (owner's call, 2026-11-11). Missing on older saves = not tracked yet: that first birthday ripens all. */
  usedPowers?: string[];
  /** Ties: money lent and borrowed with people in your life. */
  loans?: Loan[];
  /** Ties: someone asking you for help right now. */
  tieAsk?: TieAsk | null;
  /** The mask at home: a partner found the suit and waits for an answer until `until` (months). */
  maskScene?: { personId: string; until: number } | null;
  /** After the truth: an ex sold your story (who, and when in months). Missing on older saves = never. */
  storySold?: { by: string; at: number } | null;
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
  /** Living economy: moving markets, housing, portfolio (economy.ts). Optional for old saves (ensureEconomy). */
  economy?: EconState;
  /** After a boss loss: that boss can't be rematched until this month index (age × 12 + month). Optional for old saves. */
  regroup?: { name: string; until: number } | null;
  /** "mystery" (the default for new lives) or "god". Missing on classic saves. */
  mode?: GameMode;
  /** Life-sim fight difficulty. Missing on old saves → Normal. */
  difficulty?: LifeDifficulty;
  /** The sealed power that has not woken yet (mystery lives and God Mode legends). Cleared at the reveal. */
  hiddenGift?: string | null;
  /** God Mode legend id (see presets.ts). */
  preset?: string | null;
  /** Which suit line this life's Mystery hero wears (heroArt.ts `Suit`), picked once from the life seed. Old saves migrate. */
  suit?: "a" | "b";
  /** The mentor who found you at 15 (mentors.ts). Missing before 15 and on old saves until their next birthday. */
  mentor?: MentorState | null;
  /** The power you're slowly training toward (2026-11-10 eve): a base to wake, or a braid. One at a time. */
  training?: TrainingProject | null;
  /** Arena purses paid into this life (anti-farm ledger). */
  arenaPurse?: ArenaPurseLedger;
  /** The big reveal waiting to play. UI-only, cleared on dismiss. */
  reveal?: RevealNotice | null;
  /** Strange signs noticed before the power woke, oldest first. */
  omenLog?: string[];
  /** What fast-forward plays for you: recent action and sub-choice picks, and how well you play minis. */
  habits?: Habits;
  /** The montage card from the last fast-forward. UI-only, cleared on dismiss. */
  skipReport?: SkipReport | null;
}

export interface Habits {
  /** Action id -> weight. Decays a little with each new action, so recent play leads. */
  acts: Record<string, number>;
  /** Sub-choice id (pending id) -> the choice you made last time. */
  picks: Record<string, string>;
  /** Rolling average of your minigame scores (0..1). */
  mini: number;
}

export type SkipSpan = "season" | "year" | "fifteen";

export type Pace = "auto" | "month" | "season" | "year";

export type SkipStopKind = "reveal" | "story" | "chapter" | "case" | "event" | "fight" | "health" | "bond" | "death" | "mentor";

export interface SkipReport {
  span: SkipSpan;
  /** Months that actually passed, and how many the skip was going for. */
  months: number;
  planned: number;
  from: { age: number; month: number };
  to: { age: number; month: number };
  /** Stat changes over the skip, biggest first. Power is in here too. */
  stats: { stat: string; label: string; amount: number }[];
  /** Power ranks that moved, e.g. Fire Control C -> B. */
  ranks: { name: string; from: string; to: string }[];
  /** What you did, by action, e.g. "Drill Fire Control ×6". */
  did: { id: string; label: string; count: number }[];
  /** Notable lines from the months that passed, oldest first. */
  notes: string[];
  /** Why it stopped early, if it did. */
  stop: { kind: SkipStopKind; text: string } | null;
}

export type GameMode = "mystery" | "god";

/** Life-sim fight curve. Chosen at birth; see difficulty.ts. */
export type LifeDifficulty = "story" | "normal" | "hard" | "legendary";

export interface RevealNotice {
  /** Catalog ids that woke, the headline power first. */
  powers: string[];
  age: number;
  title: string;
  line: string;
  /** How the childhood guess went, when one was made. */
  guess?: "right" | "wrong" | null;
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

export interface TrainingProject {
  id: string;
  kind: "awaken" | "braid";
  progress: number;
  need: number;
  /** Who is teaching it (a mentor's or hero's name, or "you"). */
  by?: string;
  since: number;
}

export interface MentorState {
  id: string;
  /** Age they found you. */
  since: number;
  lessons: number;
  /** 0–100, grows with diminishing returns. Better lessons as it rises. */
  bond: number;
}

export interface ArenaPurseLedger {
  /** Local calendar day (YYYY-MM-DD) the count below belongs to. */
  day: string;
  /** Matches paid today (diminishing returns, daily cap). */
  paidToday: number;
  /** Recent match keys, so a reload never pays twice. */
  keys: string[];
  total: number;
  wins: number;
  matches: number;
}
