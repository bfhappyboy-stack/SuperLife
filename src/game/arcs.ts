import { homeArc } from "./origin";
import type { Effects, Game, PowerId, StoryState } from "./types";

export interface ArcChoice {
  id: string;
  label: string;
  text: string;
  advance: boolean;
  effects?: Effects;
}

export interface ArcStep {
  id: string;
  title: string;
  kind: "talk" | "investigate" | "fight" | "train" | "protect" | "boss";
  brief: string;
  heroId?: string;
  minBond?: number;
  needPower?: string;
  needAny?: string[];
  needMastery?: number;
  masteryExp?: number;
  foeName?: string;
  foeTitle?: string;
  foePower?: PowerId;
  choices?: ArcChoice[];
}

export interface ArcDef {
  id: string;
  title: string;
  villain: string;
  group: string;
  goal: string;
  blurb: string;
  minAge: number;
  heroIds: string[];
  focus: string;
  maxKarma?: number;
  steps: ArcStep[];
}

export const ARCS: ArcDef[] = [
  {
    id: "kiln",
    title: "The Kiln Ledger",
    villain: "Cinder Mallory",
    group: "The Kiln",
    goal: "Stop the bottled-fire crew",
    blurb: "Someone is selling flames in jars. Coach Hale already hates the receipt.",
    minAge: 12,
    heroIds: ["vesper", "kade"],
    focus: "Fire and strength",
    steps: [
      { id: "ask", title: "Ask Coach Hale", kind: "talk", brief: "She has the first page of the ledger.", heroId: "vesper", minBond: 18, masteryExp: 12 },
      {
        id: "warehouse",
        title: "The 9th Street warehouse",
        kind: "investigate",
        brief: "Jars, heat, and a night watch who is bad at both.",
        masteryExp: 16,
        choices: [
          { id: "quiet", label: "Go in quiet", text: "You read the labels. The labels read like a threat.", advance: true, effects: { smarts: 2, karma: 1 } },
          { id: "loud", label: "Kick the door", text: "The door loses. So does a little of your cover.", advance: true, effects: { fame: 2, karma: -1, health: -3 } },
          { id: "leave", label: "Leave a camera", text: "You learn the delivery window and not the name.", advance: false, effects: { smarts: 1 } },
        ],
      },
      { id: "wick", title: "Fight Wick", kind: "fight", brief: "Mallory's lieutenant keeps the good jars.", foeName: "Wick", foeTitle: "Kiln lieutenant", foePower: "fire", masteryExp: 22 },
      { id: "drill", title: "Drill for the kiln", kind: "train", brief: "Fire, or the magma you braided from it, has to sit still. Mastery 2.", needPower: "fire-control", needAny: ["fire-control", "magma-fist"], needMastery: 2, masteryExp: 28 },
      {
        id: "shelter",
        title: "The shelter on the kiln block",
        kind: "protect",
        brief: "The next delivery is a building with people in it.",
        masteryExp: 18,
        choices: [
          { id: "hold", label: "Hold the door", text: "You hold the door. The night is long and nobody burns.", advance: true, effects: { karma: 6, reputation: 3, health: -4, happiness: 2 } },
          { id: "move", label: "Move them out", text: "Slower. Kinder. The jars cook an empty room.", advance: true, effects: { karma: 8, smarts: 1, happiness: 2 } },
          { id: "film", label: "Film it", text: "The clip travels. The people do not thank you.", advance: false, effects: { fame: 3, karma: -4 } },
        ],
      },
      { id: "boss", title: "Face Cinder Mallory", kind: "boss", brief: "She kept the last jar for you.", foeName: "Cinder Mallory", foeTitle: "The Kiln", foePower: "fire", masteryExp: 48 },
    ],
  },
  {
    id: "mile",
    title: "The White Mile",
    villain: "Slipstream",
    group: "The White Mile",
    goal: "Stop the races that are actually heists",
    blurb: "Juniper says the mile markers are moving money. She is vibrating about it.",
    minAge: 14,
    heroIds: ["juniper", "bolt"],
    focus: "Speed and light",
    steps: [
      { id: "ask", title: "Catch Juniper", kind: "talk", brief: "She will not slow down unless you mean the case.", heroId: "juniper", minBond: 18, masteryExp: 14 },
      {
        id: "markers",
        title: "Read the mile markers",
        kind: "investigate",
        brief: "Three markers. One of them is a drop.",
        masteryExp: 16,
        choices: [
          { id: "run", label: "Run the mile", text: "You run it. The third marker is a locker full of other people's evenings.", advance: true, effects: { fame: 1, happiness: 1 } },
          { id: "watch", label: "Watch a race", text: "The winner never touches the prize. A van does.", advance: true, effects: { smarts: 2 } },
          { id: "bet", label: "Bet on it", text: "You win cash and lose the thread.", advance: false, effects: { money: 200, karma: -3 } },
        ],
      },
      { id: "toll", title: "Fight Toll", kind: "fight", brief: "The collector who stands where the mile ends.", foeName: "Toll", foeTitle: "White Mile collector", foePower: "speed", masteryExp: 24 },
      { id: "drill", title: "Drill the mile", kind: "train", brief: "Speed, or Light Speed if you braided it, has to hold for a full mile. Mastery 2.", needPower: "super-speed", needAny: ["super-speed", "light-speed"], needMastery: 2, masteryExp: 30 },
      {
        id: "bus",
        title: "The late bus",
        kind: "protect",
        brief: "They will rob it between stops unless someone is already there.",
        masteryExp: 18,
        choices: [
          { id: "ride", label: "Ride it", text: "You ride the route. The van peels off when it sees a person who can keep up.", advance: true, effects: { karma: 5, reputation: 2, happiness: 2 } },
          { id: "clear", label: "Clear the stop", text: "You empty the corner before the doors open. Messy. Effective.", advance: true, effects: { karma: 3, fame: 1, health: -2 } },
          { id: "ignore", label: "Let the city handle it", text: "The city handles it tomorrow. The bags are already gone.", advance: false, effects: { karma: -4, happiness: -2 } },
        ],
      },
      { id: "boss", title: "Catch Slipstream", kind: "boss", brief: "They only lose if you arrive first.", foeName: "Slipstream", foeTitle: "The White Mile", foePower: "speed", masteryExp: 50 },
    ],
  },
  {
    id: "choir",
    title: "The Quiet Choir",
    villain: "The Moth King",
    group: "The Quiet Choir",
    goal: "Break the hush over a neighborhood",
    blurb: "A few blocks have stopped being able to want things out loud. Wren has noticed. So has Quill.",
    minAge: 15,
    heroIds: ["wren", "idris"],
    focus: "Mind and sense",
    steps: [
      { id: "ask", title: "Sit with Wren", kind: "talk", brief: "The hush has a center. She will not point until she trusts you.", heroId: "wren", minBond: 22, masteryExp: 14 },
      {
        id: "names",
        title: "Gather the missing names",
        kind: "investigate",
        brief: "People who went quiet are still in their kitchens.",
        masteryExp: 18,
        choices: [
          { id: "listen", label: "Listen door to door", text: "Three kitchens. The same sentence, unfinished, in all of them.", advance: true, effects: { smarts: 2, karma: 2, happiness: -1 } },
          { id: "quill", label: "Ask Quill for the pattern", text: "He treats it like data and is gentle about it anyway.", advance: true, effects: { smarts: 3 } },
          { id: "shout", label: "Shout on the corner", text: "The hush eats the shout. You learn nothing and feel famous.", advance: false, effects: { fame: 1, happiness: -2 } },
        ],
      },
      { id: "hush", title: "Fight Hush", kind: "fight", brief: "A lieutenant who borrows voices.", foeName: "Hush", foeTitle: "Choir lieutenant", foePower: "mind", masteryExp: 24 },
      { id: "drill", title: "Drill a mental edge", kind: "train", brief: "Telepathy or telekinesis has to stay yours. Mastery 2.", needPower: "telepathy", needAny: ["telepathy", "telekinesis"], needMastery: 2, masteryExp: 30 },
      {
        id: "block",
        title: "Keep a block awake",
        kind: "protect",
        brief: "Tonight the hush tries a whole street.",
        masteryExp: 20,
        choices: [
          { id: "names", label: "Say their names", text: "You say the names until the sentence finishes. The street comes back rude and alive.", advance: true, effects: { karma: 7, reputation: 3, happiness: 2 } },
          { id: "shield", label: "Hold a quiet room", text: "You make one kitchen safe. It is not the whole block. It is a start that counts.", advance: true, effects: { karma: 5, smarts: 1 } },
          { id: "deal", label: "Ask the hush to skip you", text: "It skips you. It does not skip them.", advance: false, effects: { karma: -6, happiness: -2 } },
        ],
      },
      { id: "boss", title: "Face the Moth King", kind: "boss", brief: "He collects the last unfinished sentence.", foeName: "The Moth King", foeTitle: "The Quiet Choir", foePower: "mind", masteryExp: 52 },
    ],
  },
  {
    id: "lease",
    title: "Rent Season",
    villain: "Payday",
    group: "The Lease",
    goal: "End the protection racket, or own it",
    blurb: "Payday taxes fear. Lark knows the ledger. Marrow knows the doors.",
    minAge: 16,
    heroIds: ["lark", "marrow"],
    focus: "Fear, gravity, durability",
    maxKarma: 15,
    steps: [
      { id: "ask", title: "Talk to The Receipt", kind: "talk", brief: "Lark will price the case for you. Bond matters more than manners.", heroId: "lark", minBond: 18, masteryExp: 14 },
      {
        id: "ledger",
        title: "Find the second ledger",
        kind: "investigate",
        brief: "The public one is a lie. The real one is in a laundromat.",
        masteryExp: 16,
        choices: [
          { id: "read", label: "Read it", text: "Names, amounts, and a column for people who said no.", advance: true, effects: { smarts: 2, karma: 1 } },
          { id: "copy", label: "Copy a page for yourself", text: "You leave with leverage. The bar notices.", advance: true, effects: { smarts: 1, karma: -4, money: 150 } },
          { id: "burn", label: "Burn it early", text: "Satisfying. You lose the map.", advance: false, effects: { karma: 2, happiness: 1 } },
        ],
      },
      { id: "clause", title: "Fight Clause", kind: "fight", brief: "The enforcer who knocks like a landlord.", foeName: "Clause", foeTitle: "Lease enforcer", foePower: "strength", masteryExp: 24 },
      { id: "drill", title: "Drill a heavy trick", kind: "train", brief: "Gravity or durability. A door cannot be the threat. Mastery 2.", needPower: "gravity", needAny: ["gravity", "super-durability"], needMastery: 2, masteryExp: 28 },
      {
        id: "shop",
        title: "The shop that said no",
        kind: "protect",
        brief: "Payday is collecting tonight.",
        masteryExp: 18,
        choices: [
          { id: "stand", label: "Stand in the doorway", text: "You stand there. They pick another night, which is a win with an expiration.", advance: true, effects: { karma: 6, reputation: 2, health: -3 } },
          { id: "pay", label: "Pay their tax yourself", text: "The shop is safe. You are poorer and a little complicit.", advance: true, effects: { money: -400, karma: 2, happiness: 1 } },
          { id: "cut", label: "Take a cut to send them away", text: "They leave. You are in the ledger now.", advance: false, effects: { money: 500, karma: -8, fame: 1 } },
        ],
      },
      { id: "boss", title: "Face Payday", kind: "boss", brief: "The last collection is you.", foeName: "Payday", foeTitle: "The Lease", foePower: "strength", masteryExp: 50 },
    ],
  },
];

export function arcById(id: string | null | undefined): ArcDef | null {
  if (!id) return null;
  return ARCS.find((arc) => arc.id === id) ?? null;
}

export function arcsCleared(story: StoryState | undefined): number {
  return story?.cleared?.length ?? 0;
}

export function availableArcs(game: Pick<Game, "age" | "stats" | "story" | "cityId">): ArcDef[] {
  const cleared = new Set(game.story?.cleared ?? []);
  const karma = game.stats.karma ?? 0;
  return ARCS.filter((arc) => {
    if (cleared.has(arc.id)) return false;
    if (game.age < arc.minAge) return false;
    if (arc.maxKarma != null && karma > arc.maxKarma) return false;
    if (game.story?.active === arc.id) return false;
    return true;
  }).sort((a, b) => Number(homeArc(game.cityId, b.id)) - Number(homeArc(game.cityId, a.id)) || a.minAge - b.minAge);
}

export function currentCase(game: Pick<Game, "story">): { arc: ArcDef; step: ArcStep; index: number } | null {
  const id = game.story?.active;
  const arc = arcById(id);
  if (!arc || !game.story) return null;
  const index = game.story.progress?.[arc.id] ?? 0;
  const step = arc.steps[index];
  if (!step) return null;
  return { arc, step, index };
}

export interface PlotBrief {
  villain: string;
  arcTitle: string;
  stepTitle: string;
  stance: "close" | "wary" | "shut" | "other";
}

export function plotFor(game: Pick<Game, "story">, heroId: string, bond: number): PlotBrief | null {
  const current = currentCase(game);
  if (!current) return null;
  const onArc = current.arc.heroIds.includes(heroId);
  const stance: PlotBrief["stance"] = !onArc ? "other" : bond >= 55 ? "close" : bond >= 22 ? "wary" : "shut";
  return { villain: current.arc.villain, arcTitle: current.arc.title, stepTitle: current.step.title, stance };
}
