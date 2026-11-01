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
  /** Foe power level for fight/boss steps. Defaults to 4.2 (fight) and 6.4 (boss), tuned for teens. */
  foeLevel?: number;
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
  /** Cases you must already have closed before this one shows up. */
  minCleared?: number;
  /** Legacy granted when the case closes (mid-life and later cases). */
  legacy?: number;
  /** Chapter phase this case was written for, for the case board label. */
  era?: string;
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
  // Mid-life cases (2026-10-31 pm). Written for the rising, crisis and legacy chapters, with foes scaled
  // to an adult power level, talk steps that want years of bond, and legacy when the case closes.
  {
    id: "understudy",
    title: "The Understudy",
    villain: "Second Skin",
    group: "The Rehearsal",
    goal: "Stop the copycat wearing your name",
    blurb: "Someone is doing your job badly, in your colours, on camera. Kade says the walk is wrong.",
    minAge: 28,
    minCleared: 1,
    legacy: 4,
    era: "Rising",
    heroIds: ["kade", "nim"],
    focus: "Shape, stealth, reputation",
    steps: [
      { id: "ask", title: "Ask Kade about the walk", kind: "talk", brief: "Kade knows faces for a living. They will only say it to someone they trust.", heroId: "kade", minBond: 40, masteryExp: 16 },
      {
        id: "clips",
        title: "Go through the clips",
        kind: "investigate",
        brief: "Eleven videos of you doing things you did not do.",
        masteryExp: 20,
        choices: [
          { id: "frames", label: "Go frame by frame", text: "Frame 212: the copy blinks with the wrong eye first. Now you know what to look for.", advance: true, effects: { smarts: 3 } },
          { id: "deny", label: "Deny it on air", text: "You go on the morning show and say it is not you. Half the city believes you.", advance: true, effects: { fame: 2, reputation: -1 } },
          { id: "ride", label: "Let the clout ride", text: "The copy is trending, and so are you. Nobody asks who got hurt.", advance: false, effects: { fame: 3, karma: -4 } },
        ],
      },
      { id: "encore", title: "Fight the stand-in", kind: "fight", brief: "Encore wears your silhouette and none of your restraint.", foeName: "Encore", foeTitle: "Rehearsal stand-in", foePower: "shapeshift", foeLevel: 7, masteryExp: 30 },
      { id: "drill", title: "Drill your tell", kind: "train", brief: "Your focus power has to do one thing no copy can fake. Mastery 4.", needMastery: 4, masteryExp: 34 },
      {
        id: "signing",
        title: "The signing in your name",
        kind: "protect",
        brief: "Second Skin booked a fan meet as you. The line is around the block.",
        masteryExp: 24,
        choices: [
          { id: "unmask", label: "Walk in and unmask them", text: "Two of you, one table. The crowd works out which one stays to help with the crush.", advance: true, effects: { karma: 5, reputation: 3, fame: 2 } },
          { id: "clear", label: "Clear the line quietly", text: "You move four hundred people without a photo. The copy signs for an empty room.", advance: true, effects: { karma: 6, happiness: 2 } },
          { id: "sell", label: "Sell the real tickets", text: "You make money off your own forgery. The forger would be proud.", advance: false, effects: { money: 1500, karma: -6 } },
        ],
      },
      { id: "boss", title: "Face Second Skin", kind: "boss", brief: "They have your face. They do not have your years.", foeName: "Second Skin", foeTitle: "The Rehearsal", foePower: "shapeshift", foeLevel: 8.6, masteryExp: 60 },
    ],
  },
  {
    id: "deadair",
    title: "Dead Air",
    villain: "Static Bishop",
    group: "The Broadcast",
    goal: "Take the city's screens back",
    blurb: "Every screen in the city ran the same thirty seconds last night: the names of people you love. Parish thinks it was a test.",
    minAge: 35,
    legacy: 5,
    era: "Crisis",
    heroIds: ["bolt", "idris"],
    focus: "Lightning, mind, information",
    steps: [
      { id: "ask", title: "Get Parish on the roof", kind: "talk", brief: "Parish can hear a carrier wave. They will not climb up for a stranger.", heroId: "bolt", minBond: 45, masteryExp: 18 },
      {
        id: "carrier",
        title: "Trace the carrier",
        kind: "investigate",
        brief: "The signal hops towers like a kid hopping fences.",
        masteryExp: 22,
        choices: [
          { id: "ride", label: "Ride the signal", text: "You chase it up four towers and one bad decision. It lands in a church with no congregation.", advance: true, effects: { smarts: 2, health: -3 } },
          { id: "buy", label: "Buy a fixer's dossier", text: "Two thousand dollars for a floor plan and a name. Worth it.", advance: true, effects: { money: -2000, smarts: 1 } },
          { id: "blackout", label: "Cut the district's power", text: "The screens go dark. So do the hospitals. The Bishop just moves.", advance: false, effects: { karma: -5, fame: 1 } },
        ],
      },
      { id: "feedback", title: "Fight Feedback", kind: "fight", brief: "The Bishop's deacon turns every speaker into a weapon.", foeName: "Feedback", foeTitle: "Broadcast deacon", foePower: "lightning", foeLevel: 7.4, masteryExp: 32 },
      { id: "drill", title: "Drill under noise", kind: "train", brief: "Hold your focus power steady while the city screams at you. Mastery 4.", needMastery: 4, masteryExp: 36 },
      {
        id: "names",
        title: "The people on the broadcast",
        kind: "protect",
        brief: "Your people's names are public now. Tonight the Bishop sends visitors.",
        masteryExp: 26,
        choices: [
          { id: "porch", label: "Stand on their porch", text: "You stand there in full colours until sunrise. The visitors drive past twice and keep going.", advance: true, effects: { fame: 3, reputation: 3, health: -4, karma: 4 } },
          { id: "move", label: "Move them in the night", text: "Three addresses, one van, no lights. Nobody sleeps. Everybody wakes up.", advance: true, effects: { karma: 6, happiness: -2 } },
          { id: "dark", label: "Go dark and hope", text: "You turn your phone off. That is not the same as being safe.", advance: false, effects: { happiness: -4, karma: -3 } },
        ],
      },
      { id: "boss", title: "Face Static Bishop", kind: "boss", brief: "He wants one more broadcast, live, with you in it.", foeName: "Static Bishop", foeTitle: "The Broadcast", foePower: "lightning", foeLevel: 9, masteryExp: 64 },
    ],
  },
  {
    id: "winter",
    title: "The Long Winter",
    villain: "The Frost Warden",
    group: "Coldframe",
    goal: "Get the city through a winter someone is selling",
    blurb: "The grid fails on schedule. Heat is sold by the block. Pilar says the cold has a signature.",
    minAge: 44,
    legacy: 6,
    era: "Crisis",
    heroIds: ["pilar", "marrow"],
    focus: "Ice, durability, endurance",
    steps: [
      { id: "ask", title: "Walk with Pilar", kind: "talk", brief: "Pilar reads weather like handwriting. They want someone steady beside them.", heroId: "pilar", minBond: 50, masteryExp: 18 },
      {
        id: "blocks",
        title: "Walk the cold blocks",
        kind: "investigate",
        brief: "Whole streets with frost on the inside of the windows.",
        masteryExp: 22,
        choices: [
          { id: "doors", label: "Knock door to door", text: "You count the people who need heat and the ones who are already past it. You write both down.", advance: true, effects: { karma: 4, health: -3 } },
          { id: "audit", label: "Audit the utility", text: "The outages line up with a shell company's invoices. Cold is a business plan.", advance: true, effects: { smarts: 3 } },
          { id: "heaters", label: "Sell space heaters", text: "You make a winter's profit. The Warden makes a note of you.", advance: false, effects: { money: 1200, karma: -5 } },
        ],
      },
      { id: "rime", title: "Fight Rime", kind: "fight", brief: "The Warden's foreman freezes pipes for a living.", foeName: "Rime", foeTitle: "Coldframe foreman", foePower: "ice", foeLevel: 8, masteryExp: 34 },
      { id: "drill", title: "Drill for the long night", kind: "train", brief: "Your focus power has to last a whole night, not a round. Mastery 4.", needMastery: 4, masteryExp: 38 },
      {
        id: "shelter",
        title: "The shelter that lost power",
        kind: "protect",
        brief: "Two hundred people, one gym, no heat, and nine hours until morning.",
        masteryExp: 28,
        choices: [
          { id: "hold", label: "Keep it warm yourself", text: "You burn through the night so they do not. Morning finds you grey and everyone breathing.", advance: true, effects: { health: -7, karma: 8, reputation: 3 } },
          { id: "convoy", label: "Run a generator convoy", text: "It costs a fortune and three favours. Every light in the gym comes back on.", advance: true, effects: { money: -3000, karma: 6, reputation: 2 } },
          { id: "league", label: "Leave it to the League", text: "The League arrives at six. It was a long wait for the people inside.", advance: false, effects: { karma: -3, happiness: -2 } },
        ],
      },
      { id: "boss", title: "Face the Frost Warden", kind: "boss", brief: "At the reservoir, where the cold starts.", foeName: "The Frost Warden", foeTitle: "Coldframe", foePower: "ice", foeLevel: 9.6, masteryExp: 68 },
    ],
  },
  {
    id: "heir",
    title: "Old Debts",
    villain: "The Heir",
    group: "The Estate",
    goal: "Stop the heir of a villain you beat",
    blurb: "Someone you put away left a will. The beneficiary has your old case files and a grudge they were raised on.",
    minAge: 54,
    minCleared: 2,
    legacy: 8,
    era: "Legacy",
    heroIds: ["wren", "lark"],
    focus: "Everything you built",
    steps: [
      { id: "ask", title: "Sit with Wren again", kind: "talk", brief: "Wren remembers your first case. Ask what you got wrong.", heroId: "wren", minBond: 55, masteryExp: 18 },
      {
        id: "files",
        title: "Reopen your own files",
        kind: "investigate",
        brief: "The Heir has copies. You should know what is in them.",
        masteryExp: 22,
        choices: [
          { id: "honest", label: "Read them honestly", text: "Some of those nights were not your finest. The Heir knows which ones.", advance: true, effects: { smarts: 2, karma: 3, happiness: -2 } },
          { id: "visit", label: "Visit the old villain", text: "Prison has made them small and patient. They tell you their kid's favourite trick.", advance: true, effects: { reputation: 1, smarts: 1 } },
          { id: "burn", label: "Burn your copies", text: "Your copies. Not theirs.", advance: false, effects: { happiness: 1, karma: -2 } },
        ],
      },
      { id: "probate", title: "Fight Probate", kind: "fight", brief: "The executor of the estate collects debts in person.", foeName: "Probate", foeTitle: "Estate executor", foePower: "forcefield", foeLevel: 8.4, masteryExp: 34 },
      { id: "drill", title: "Show your work", kind: "train", brief: "Old hands still drill. Your focus power, mastery 4, in front of the rookies.", needMastery: 4, masteryExp: 38 },
      {
        id: "students",
        title: "The rookies on the list",
        kind: "protect",
        brief: "The Heir is going after the people you trained.",
        masteryExp: 28,
        choices: [
          { id: "stand", label: "Stand with them", text: "You fight beside your students for the first time. They are better than you were. You tell them so.", advance: true, effects: { karma: 6, reputation: 3, happiness: 4, health: -4 } },
          { id: "hide", label: "Send them out of town", text: "They hate it. They live. That is the order you wanted.", advance: true, effects: { karma: 4, happiness: -2 } },
          { id: "pay", label: "Pay off the debt", text: "You pay. The Heir takes the money and keeps the list.", advance: false, effects: { money: -5000, karma: -2 } },
        ],
      },
      { id: "boss", title: "Face the Heir", kind: "boss", brief: "They fight like their parent, and like you, because they studied both.", foeName: "The Heir", foeTitle: "The Estate", foePower: "blasts", foeLevel: 9.8, masteryExp: 72 },
    ],
  },
  {
    id: "reunion",
    title: "The Reunion Tour",
    villain: "Encore",
    group: "The Comeback",
    goal: "Stop someone stealing your old team's powers",
    blurb: "Somebody is visiting retired capes one by one. They leave with a handshake and the cape's power. Your old team is on the list.",
    minAge: 63,
    legacy: 9,
    era: "Twilight",
    heroIds: ["vesper", "idris"],
    focus: "Your old team",
    steps: [
      { id: "call", title: "Call Coach Hale", kind: "talk", brief: "Hale still answers on the second ring. Ask who has gone quiet.", heroId: "vesper", minBond: 45, masteryExp: 18 },
      {
        id: "visits",
        title: "Check on the old team",
        kind: "investigate",
        brief: "Three retired capes. Two of them can't light a candle any more.",
        masteryExp: 24,
        choices: [
          { id: "listen", label: "Sit with each of them", text: "Tea, photos and the same story three ways: a fan with very cold hands.", advance: true, effects: { happiness: 3, karma: 3, smarts: 1 } },
          { id: "quill", label: "Ask Dr. Quill to run the bloodwork", text: "Quill finds the trace in an hour: something that copies, then subtracts.", advance: true, effects: { smarts: 3, money: -800 } },
          { id: "skip", label: "Assume it's just age", text: "It isn't. A fourth cape goes quiet that week.", advance: false, effects: { karma: -3, happiness: -2 } },
        ],
      },
      { id: "roadie", title: "Fight the Roadie", kind: "fight", brief: "Encore's driver carries a borrowed power and doesn't know how to hold it.", foeName: "The Roadie", foeTitle: "Encore's driver", foePower: "strength", foeLevel: 8.8, masteryExp: 36 },
      { id: "drill", title: "Prove you've still got it", kind: "train", brief: "Encore only takes powers worth taking. Drill your focus to mastery 4 and make yourself bait.", needMastery: 4, masteryExp: 40 },
      {
        id: "bait",
        title: "The last handshake",
        kind: "protect",
        brief: "Encore comes to your door with flowers and very cold hands.",
        masteryExp: 30,
        choices: [
          { id: "refuse", label: "Don't shake", text: "You keep your hands in your pockets and your power in your chest. Encore smiles and leaves a business card.", advance: true, effects: { karma: 4, reputation: 2 } },
          { id: "trap", label: "Shake, with Quill watching", text: "It hurts like losing a name. Quill traces where it goes.", advance: true, effects: { health: -8, smarts: 2, karma: 3 } },
          { id: "sell", label: "Ask what he's paying", text: "A lot. You say no anyway, but now he knows you hesitated.", advance: false, effects: { money: 2000, karma: -4 } },
        ],
      },
      { id: "boss", title: "Face Encore", kind: "boss", brief: "On a stage downtown, wearing every power he took. Your old team is in the front row.", foeName: "Encore", foeTitle: "The Comeback", foePower: "shapeshift", foeLevel: 9.8, masteryExp: 74 },
    ],
  },
  {
    id: "lighthouse",
    title: "The Lighthouse",
    villain: "The Undertow",
    group: "The Undertow",
    goal: "Keep the harbor lights on for one last winter",
    blurb: "Someone is putting the city's lights out, one block a night. Nobody young remembers the last time. You do.",
    minAge: 71,
    legacy: 10,
    era: "Twilight",
    heroIds: ["wren", "nim"],
    focus: "The people who come after you",
    steps: [
      { id: "wren", title: "Walk the harbor with Wren", kind: "talk", brief: "You both remember the blackout of your twenties. Compare notes slowly.", heroId: "wren", minBond: 50, masteryExp: 16 },
      {
        id: "teach",
        title: "Brief the new kids",
        kind: "investigate",
        brief: "The League's rookies don't know the Undertow. You could tell them, or show them.",
        masteryExp: 20,
        choices: [
          { id: "tell", label: "Tell them the whole story", text: "They take notes. One of them asks the question you never thought to ask.", advance: true, effects: { smarts: 2, reputation: 3, happiness: 3 } },
          { id: "map", label: "Draw them the old map", text: "Old tunnels, old pumps, old mistakes. It's all still there.", advance: true, effects: { smarts: 3, karma: 2 } },
          { id: "solo", label: "Go alone, like before", text: "The tunnels have changed. Your knees haven't improved. You turn back.", advance: false, effects: { health: -5, happiness: -2 } },
        ],
      },
      { id: "riptide", title: "Fight the Riptide", kind: "fight", brief: "The Undertow's lieutenant cuts the cables at low tide. Get there first.", foeName: "Riptide", foeTitle: "Undertow lieutenant", foePower: "speed", foeLevel: 8.6, masteryExp: 32 },
      { id: "drill", title: "One more drill", kind: "train", brief: "Slow and right. Focus mastery 3, in front of people who'll remember it.", needMastery: 3, masteryExp: 30 },
      {
        id: "dark",
        title: "The night the lights go",
        kind: "protect",
        brief: "The whole east side goes dark at once. A hospital is on the east side.",
        masteryExp: 28,
        choices: [
          { id: "hospital", label: "Hold the hospital", text: "You stand in the generator room all night. The kids take the streets. Everyone breathes until morning.", advance: true, effects: { karma: 8, health: -6, reputation: 3 } },
          { id: "lead", label: "Run the rookies from a rooftop", text: "Your voice on every earpiece. They move like a team you used to be on.", advance: true, effects: { reputation: 5, happiness: 5 } },
        ],
      },
      { id: "boss", title: "Face the Undertow", kind: "boss", brief: "Under the harbor, at the old pump station. He is older than you, and he waited.", foeName: "The Undertow", foeTitle: "The tide that comes back", foePower: "ice", foeLevel: 9.4, masteryExp: 70 },
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

/** Every power-gated drill in the case can be done with something you hold. */
export function arcPlayable(arc: ArcDef, owned: readonly string[] | undefined): boolean {
  if (!owned) return true;
  return arc.steps.every((step) => {
    if (step.kind !== "train") return true;
    const need = step.needAny?.length ? step.needAny : step.needPower ? [step.needPower] : [];
    return !need.length || need.some((id) => owned.includes(id));
  });
}

export function availableArcs(game: Pick<Game, "age" | "stats" | "story" | "cityId"> & { unlockedPowers?: string[] }): ArcDef[] {
  const cleared = new Set(game.story?.cleared ?? []);
  const karma = game.stats.karma ?? 0;
  return ARCS.filter((arc) => {
    if (cleared.has(arc.id)) return false;
    // A case whose drill needs a power you don't hold would stall forever on that page.
    if (!arcPlayable(arc, game.unlockedPowers)) return false;
    if (game.age < arc.minAge) return false;
    if (arc.maxKarma != null && karma > arc.maxKarma) return false;
    if (arc.minCleared != null && cleared.size < arc.minCleared) return false;
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
