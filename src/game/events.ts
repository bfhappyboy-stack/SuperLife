import { nextLesson } from "./combo";
import { powerById } from "./data";
import { firstName } from "./format";
import { hasTrait } from "./origin";
import type { Effects, Game, PowerId, Special } from "./types";

export interface MiniTemplate {
  kind: import("./minis").SkillKind;
  title: string;
  subtitle: string;
  difficulty: number;
  winText: string;
  loseText: string;
  partialText?: string;
  win: Effects;
  lose: Effects;
  partial?: Effects;
}

export interface EventChoice {
  label: string;
  text: string | ((g: Game) => string);
  effects?: Effects | ((g: Game) => Effects);
  special?: Special | ((g: Game) => Special | undefined);
  mini?: MiniTemplate;
  requires?: (g: Game) => boolean;
  flags?: Record<string, number>;
}

export interface EventDef {
  id: string;
  weight: number;
  once?: boolean;
  minAge?: number;
  maxAge?: number;
  needsPower?: boolean;
  needsNoPower?: boolean;
  needsSchool?: boolean;
  needsJob?: boolean;
  needsLeague?: boolean;
  needsPartner?: boolean;
  needsRival?: boolean;
  minRep?: number;
  maxRep?: number;
  minFame?: number;
  minPL?: number;
  minKarma?: number;
  maxKarma?: number;
  needsCrew?: boolean;
  power?: PowerId;
  /** If set, the moment only happens in these city ids. */
  cities?: string[];
  requires?: (g: Game) => boolean;
  /** Off-canon for God Mode legends: a generic villain, or a gift from nowhere. Legends skip it. */
  offCanon?: boolean;
  text: (g: Game) => string;
  choices: EventChoice[];
}

function parent(g: Game): string {
  const p = g.relationships.find((r) => r.role === "parent" && r.alive);
  return p ? firstName(p.name) : "your parent";
}

function rival(g: Game): string {
  const p = g.relationships.find((r) => r.role === "rival" && r.alive);
  return p ? firstName(p.name) : "your rival";
}

function partner(g: Game): string {
  const p = g.relationships.find((r) => r.role === "partner" && r.alive);
  return p ? firstName(p.name) : "your person";
}

function partnerFx(g: Game, extra: Effects, close: number): Effects {
  const p = g.relationships.find((r) => r.role === "partner" && r.alive);
  return { ...extra, closeness: close, personId: p?.id };
}

const HAND: EventDef[] = [
  {
    id: "wallet",
    weight: 4,
    once: true,
    minAge: 8,
    maxAge: 70,
    text: () => "A wallet sits on a bench like it is trying to make eye contact. It is thick. The ID is still inside.",
    choices: [
      { label: "Return it", text: "The owner cries a little and gives you a coupon for a car wash. Fame is weird.", effects: { reputation: 6, happiness: 4, money: 40, karma: 6 } },
      { label: "Keep the cash", text: "You leave the cards. You still feel the weight. It is not the money.", effects: { money: 380, reputation: -8, happiness: -3, karma: -8 } },
      { label: "Hand it to a cop", text: "They nod like you did the minimum, which you did, correctly.", effects: { reputation: 3, happiness: 1, karma: 2 } },
      { label: "Leave it and walk", text: "You are not the hero of this wallet. You are also not the villain. The bench keeps it.", effects: { happiness: -1 } },
    ],
  },
  {
    id: "bully",
    weight: 5,
    once: true,
    minAge: 7,
    maxAge: 15,
    text: () => "A kid named Brant has decided the cafeteria is a country and he is the weather. Today the weather wants your lunch.",
    choices: [
      { label: "Hand it over", text: "You eat dignity. It is not filling.", effects: { happiness: -6, health: 0, reputation: -1 } },
      { label: "Joke your way out", text: "Brant laughs, which is somehow worse and better. You keep the sandwich.", effects: { happiness: 2, smarts: 1 }, requires: (g) => g.stats.smarts >= 35 },
      { label: "Stand up", text: "It gets loud. A teacher gets louder. Brant finds a new hobby by Thursday.", effects: { happiness: 4, reputation: 3, health: -4 } },
    ],
  },
  {
    id: "play",
    weight: 4,
    once: true,
    minAge: 6,
    maxAge: 12,
    text: () => "The school play needs a tree. Then the tree calls out sick. You are handed a costume that is mostly cardboard and faith.",
    choices: [
      { label: "Commit fully", text: "You are the best tree this gym has ever seen. Someone's parent weeps.", effects: { happiness: 5, looks: 1, fame: 1 } },
      { label: "Hide in the wings", text: "The play survives. Your reputation as furniture does not begin.", effects: { happiness: -2 } },
    ],
  },
  {
    id: "fair",
    weight: 4,
    once: true,
    minAge: 8,
    maxAge: 16,
    text: (g) => `The science fair wants a project. ${parent(g)} wants it to be normal. The volcano kit is $12 and a lie.`,
    choices: [
      { label: "Build it properly", text: "Judges lean in. You leave with a ribbon and a chemical smell.", effects: { smarts: 6, happiness: 3, parentBelief: 4 } },
      { label: "Buy the volcano", text: "It erupts on schedule and on the tablecloth. Second place in 'tried.'", effects: { happiness: 1, money: -12, smarts: 1 } },
      { label: "Skip it", text: "You spend the afternoon under a tree. The tree does not grade you.", effects: { happiness: 3, smarts: -1 } },
    ],
  },
  {
    id: "crush",
    weight: 4,
    once: true,
    minAge: 12,
    maxAge: 17,
    text: () => "Someone in your class laughs at your joke like they meant it. Your internal organs file a flight plan.",
    choices: [
      { label: "Say something true", text: "It is awkward for nine seconds and then it is a walk home. You will be unbearable about this.", effects: { happiness: 8, looks: 0 } },
      { label: "Play it cool", text: "You play it so cool you become a statue. The moment walks away.", effects: { happiness: -3 } },
      { label: "Pass a note", text: "The note is intercepted by history itself, which is a teacher named Glenn.", effects: { happiness: 1, reputation: -1, smarts: 0 } },
    ],
  },
  {
    id: "party",
    weight: 4,
    minAge: 15,
    maxAge: 28,
    text: () => "A party is happening in a house that will not survive the bass. You are invited, which feels like a clerical error.",
    choices: [
      { label: "Go", text: "You dance like a person being mildly electrocuted. People like you anyway.", effects: { happiness: 6, money: -30, health: -2, fame: 1 } },
      { label: "Stay in", text: "You sleep. Tomorrow you are smug and slightly less invited.", effects: { health: 3, happiness: -1 } },
      { label: "Go and leave early", text: "You make one good conversation and steal none of the street signs.", effects: { happiness: 3, reputation: 1 } },
    ],
  },
  {
    id: "cheat",
    weight: 3,
    once: true,
    minAge: 13,
    maxAge: 22,
    needsSchool: true,
    text: () => "The exam is a brick wall. The person beside you has written the answers in handwriting so small it might be a cry for help.",
    choices: [
      { label: "Keep your eyes down", text: "You pass on your own, barely, which is the expensive kind of pride.", effects: { smarts: 2, happiness: 2, reputation: 1 } },
      { label: "Glance", text: "You ace it. The guilt sits in the next seat for a month.", effects: { smarts: -2, happiness: -4, fame: 0, parentBelief: -4 } },
    ],
  },
  {
    id: "drive",
    weight: 4,
    once: true,
    minAge: 16,
    maxAge: 19,
    text: () => "Driving lesson. Your instructor's name is Bev. Bev has survived three wars and this is still her least favorite hour.",
    choices: [
      { label: "Drive like a citizen", text: "Bev grunts, which is Bev for love. You get the license.", effects: { happiness: 4, smarts: 1 } },
      { label: "Show off", text: "The cone did not deserve that. Bev schedules you for 'reflection.'", effects: { happiness: -2, reputation: -2, fame: 1, money: -80 } },
    ],
  },
  {
    id: "peer",
    weight: 3,
    once: true,
    minAge: 14,
    maxAge: 22,
    text: () => "Friends have a plan that is technically a misdemeanor and spiritually a bad idea involving a rooftop and spray paint.",
    choices: [
      { label: "Bail", text: "You go home. The group chat is cold for a week and then it is fine.", effects: { reputation: 2, happiness: -2 } },
      { label: "Go along", text: "The mural is of a mayor who did not consent. You run. You are faster than your choices.", effects: { happiness: 2, reputation: -6, fame: 2 } },
      { label: "Suggest a legal wall", text: "Someone knows a guy. The mural is better. You are unbearable about civic process.", effects: { reputation: 3, happiness: 3, smarts: 1 } },
    ],
  },
  {
    id: "landlord",
    weight: 4,
    minAge: 18,
    maxAge: 70,
    text: () => "The landlord raises rent because the neighborhood is 'up and coming,' which means a juice bar opened and got brave.",
    choices: [
      { label: "Pay it", text: "You stay. The juice is fine. Your budget is a ghost.", effects: { money: -1800, happiness: -2 } },
      { label: "Move", text: "New place, same city, a view of a very confident pigeon.", effects: { happiness: 1, money: -400 } },
      { label: "Negotiate", text: "You bring photos of the leak and the energy of a union. Rent holds.", effects: { happiness: 4, smarts: 1 }, requires: (g) => g.stats.smarts >= 45 || g.stats.reputation >= 20 },
    ],
  },
  {
    id: "scam",
    weight: 3,
    minAge: 18,
    maxAge: 80,
    text: () => "An email says your distant uncle left you a gold mine if you wire a processing fee. You do not have a distant uncle. You check.",
    choices: [
      { label: "Delete it", text: "You delete it so hard the computer apologizes.", effects: { smarts: 1, happiness: 1 } },
      { label: "Reply for fun", text: "You waste their afternoon. It is a public service and a hobby.", effects: { happiness: 4, smarts: 1 } },
      { label: "Send a little, just in case", text: "There is no mine. There is a lesson. The lesson was expensive.", effects: { money: -900, happiness: -6, smarts: 2 } },
    ],
  },
  {
    id: "scare",
    weight: 3,
    minAge: 30,
    maxAge: 85,
    text: () => "A checkup goes quiet in the way that means the doctor is choosing words like produce.",
    choices: [
      { label: "Take it seriously", text: "Pills, walks, sleep. Your body renews the lease.", effects: { health: 8, happiness: -2, money: -300 } },
      { label: "Ignore it", text: "You feel fine until you don't, which is the whole trick.", effects: { health: -10, happiness: 1 } },
    ],
  },
  {
    id: "lottery",
    weight: 2,
    minAge: 18,
    text: () => "You buy one ticket because the clerk looks like he needs the company. The numbers are unreasonably kind.",
    choices: [
      { label: "Cash it quietly", text: "A modest pile. You buy better shoes and tell almost nobody.", effects: { money: 4500, happiness: 6 } },
      { label: "Throw a party", text: "Half the money becomes other people's stories. You keep the good half of the night.", effects: { money: 1500, happiness: 8, fame: 2 } },
    ],
  },
  {
    id: "interview",
    weight: 4,
    minAge: 16,
    minFame: 20,
    text: () => "A host with explosive hair wants you on a couch for eight minutes and a chyron that will haunt you.",
    choices: [
      { label: "Be charming", text: "You land three jokes. Clips circulate. Your name trends beside a sandwich.", effects: { fame: 8, happiness: 3, reputation: 2 } },
      { label: "Be honest", text: "You talk about fear. The internet, shockingly, behaves for an hour.", effects: { fame: 4, reputation: 6, happiness: 2 } },
      { label: "Cancel", text: "You keep your evening. The host interviews a dog. The dog kills.", effects: { fame: -4, happiness: 1 } },
    ],
  },
  {
    id: "fish",
    weight: 4,
    once: true,
    needsLeague: true,
    minAge: 16,
    text: () => "Someone microwaves fish in the Watch lounge. The alarm treats it as a chemical incident. It is not wrong.",
    choices: [
      { label: "Own up if it was you", text: "It was not you. You still help scrape the ceiling. People remember.", effects: { reputation: 3, happiness: -1 } },
      { label: "Open every window", text: "You fly or you fan or you simply suffer. The lounge survives.", effects: { happiness: -2, reputation: 1 } },
      { label: "Blame the new rookie", text: "The new rookie did not deserve that. The fish did.", effects: { reputation: -4, happiness: 1 } },
    ],
  },
  {
    id: "pets",
    weight: 3,
    once: true,
    minAge: 16,
    minFame: 8,
    text: () => "You are asked to judge a pet costume contest. One of the pets is wearing a tiny domino mask and has a record.",
    choices: [
      { label: "Judge fairly", text: "The golden retriever wins. The ex-villain parakeet files an appeal.", effects: { happiness: 5, fame: 2, reputation: 2 } },
      { label: "Give it to the parakeet", text: "Chaos. Delight. A small headline.", effects: { fame: 5, reputation: -1, happiness: 4 } },
    ],
  },
  {
    id: "key",
    weight: 3,
    once: true,
    minAge: 18,
    minFame: 35,
    minRep: 20,
    text: (g) => `The mayor of ${g.city} gives you a key to the city. You try it on three doors. It opens none of them.`,
    choices: [
      { label: "Thank them anyway", text: "The photo is good. The key becomes a paperweight with civic pride.", effects: { fame: 6, reputation: 4, happiness: 3 } },
      { label: "Ask what it opens", text: "A long pause. 'Hearts,' says the mayor, who has done this before.", effects: { fame: 3, happiness: 2, smarts: 0, reputation: 2 } },
    ],
  },
  {
    id: "podcast",
    weight: 3,
    once: true,
    needsRival: true,
    minAge: 15,
    text: (g) => `A podcast asks who would win: you or ${rival(g)}. They want a soundbite. They have already written it.`,
    choices: [
      { label: "Hype the rival", text: (g) => `${rival(g)} hears it and hates how much they don't hate you.`, effects: (g) => ({ reputation: 4, fame: 2, happiness: 2, closeness: 8, personId: g.relationships.find((r) => r.role === "rival" && r.alive)?.id }) },
      { label: "Hype yourself", text: "You are quotable. You are also going to hear this clip at a wedding.", effects: { fame: 5, reputation: -1 } },
    ],
  },
  {
    id: "hobby",
    weight: 4,
    minAge: 16,
    maxAge: 75,
    text: () => "You try a normal hobby. Pottery. The wheel spins. Your self-image gets on it.",
    choices: [
      { label: "Stick with it", text: "Week four, you make a bowl that could hold soup and a secret.", effects: { happiness: 5, smarts: 1, money: -60 } },
      { label: "Quit after one class", text: "You have a lump of clay and a story. That is most hobbies.", effects: { happiness: 1, money: -25 } },
    ],
  },
  {
    id: "taxes",
    weight: 3,
    minAge: 18,
    text: () => "The tax form has a box: 'other income — saved a city block?' You stare at it until the form stares back.",
    choices: [
      { label: "Declare everything", text: "You sleep at night. You also fund a surprising amount of road.", effects: { money: -1500, reputation: 3, happiness: -1 } },
      { label: "Get a real accountant", text: "They are thrilled and slightly afraid. You owe less and fear more, correctly.", effects: { money: -400, smarts: 1, happiness: 2 } },
      { label: "Round down", text: "It works until a letter arrives with your name spelled perfectly, which is how you know it's bad.", effects: { money: 800, reputation: -4, happiness: -4 } },
    ],
  },
  {
    id: "bus",
    weight: 6,
    once: true,
    minAge: 13,
    maxAge: 60,
    needsPower: true,
    text: () => "A city bus is rolling toward a crowded crosswalk. People scream like it is a sport. It is not a sport.",
    choices: [
      {
        label: "Intervene",
        text: "You move before your name does.",
        mini: {
          kind: "timing",
          title: "Stop the bus",
          subtitle: "Hit the window. Miss, and the hot-dog cart becomes lore.",
          difficulty: 2,
          winText: "The bus stops. A kid hands you a juice box like a medal.",
          partialText: "You slow it enough. A mirror dies bravely. Nobody else does.",
          loseText: "You turn a disaster into a smaller disaster. The news uses the word 'mixed.'",
          win: { fame: 10, reputation: 8, happiness: 6, powerLevel: 0.35 },
          partial: { fame: 4, reputation: 3, happiness: 1, health: -6 },
          lose: { fame: 1, reputation: -3, health: -14, happiness: -6 },
        },
      },
      { label: "Call it in", text: "Professionals handle it. You feel smaller, and also not under a bus.", effects: { reputation: 1, happiness: -2 } },
      { label: "Film it", text: "The clip is huge. So is the part where people notice you filmed it.", effects: { fame: 8, reputation: -8, happiness: 1 } },
    ],
  },
  {
    id: "maybe", offCanon: true,
    weight: 5,
    once: true,
    minAge: 18,
    maxAge: 65,
    needsPower: true,
    minFame: 12,
    text: () => "Doctor Maybe — who might have a doctorate and might have a coupon — picks a fight in a food court. 'Your power is derivative,' they say, through a pretzel.",
    choices: [
      {
        label: "Fight",
        text: "The pretzel hits the floor. So does everyone's afternoon.",
        mini: {
          kind: "timing",
          title: "Doctor Maybe",
          subtitle: "Three openings. They telegraph like a cartoon and hit like a filing cabinet.",
          difficulty: 3,
          winText: "Maybe yields. They offer you the rest of the pretzel. You decline, which is growth.",
          partialText: "You split the fight and a table. Security calls it a draw so they can go home.",
          loseText: "You wake up under a menu board. Maybe left a note: 'study harder.'",
          win: { fame: 8, reputation: 6, powerLevel: 0.55, happiness: 5 },
          partial: { fame: 3, reputation: 1, health: -8, happiness: -1 },
          lose: { health: -18, fame: -3, reputation: -4, happiness: -6 },
        },
      },
      {
        label: "Talk them down",
        text: "You ask what the doctorate is in. It is in grudges. You still find a thread.",
        effects: { reputation: 6, happiness: 3, fame: 2 },
        requires: (g) => g.stats.smarts >= 58 || g.powerId === "mind" || g.powerId === "intellect",
      },
      { label: "Let mall security be the plot", text: "Security does their best. You do your least. The pretzel is the only winner.", effects: { fame: -2, happiness: -2 } },
    ],
  },
  {
    id: "meteor", offCanon: true,
    weight: 2,
    once: true,
    minAge: 16,
    needsPower: true,
    minPL: 2,
    text: () => "A geode at the night market hums in the key of your molars. The vendor says it trades essences. The vendor also sells socks.",
    choices: [
      { label: "Touch it", text: "The world stutters. When it comes back, your gift does not.", effects: { health: -8, happiness: -4 }, special: { kind: "swap" } },
      { label: "Buy the socks", text: "They are excellent socks. This is not a metaphor. Your feet are simply winning.", effects: { happiness: 3, money: -40 } },
    ],
  },
  {
    id: "villain-offer",
    weight: 3,
    once: true,
    minAge: 18,
    maxRep: -15,
    text: () => "A polite monster in a good coat offers a stipend and a worse nickname. 'No capes on Tuesdays,' they say, as if that is the objection.",
    choices: [
      { label: "Take the money", text: "The deposits clear. So does a little of your reflection.", effects: { money: 18000, reputation: -14, happiness: 2, karma: -18 }, flags: { villainContract: 1 } },
      { label: "Walk", text: "You leave the coat and the offer. The night feels cleaner by half a block.", effects: { reputation: 5, happiness: 1, karma: 4 } },
      { label: "Take the money, leak the plan", text: "You cash the check and mail the map to a hero. Both sides will notice. That's the fun.", effects: { money: 9000, reputation: 2, fame: 3, karma: -4, happiness: 1 } },
    ],
  },
  {
    id: "redeem",
    weight: 4,
    once: true,
    minAge: 19,
    requires: (g) => (g.flags.villainContract ?? 0) > 0,
    text: () => "A school bus and a crane have entered a relationship neither wanted. The coat-people expect you to look away. The bus does not.",
    choices: [
      { label: "Break the contract", text: "You help. The stipend dies. Something else starts breathing again.", effects: { reputation: 16, happiness: 6, money: -2000, fame: 4, karma: 14 }, flags: { villainContract: 0 } },
      { label: "Look away", text: "Someone else gets there late. You get paid on time. The math is ugly.", effects: { money: 4000, reputation: -8, happiness: -8, karma: -10 } },
      { label: "Send your crew", text: "If you have people, this is what they're for. If you don't, you still make the call and hate the silence.", effects: { reputation: -2, karma: -6, fame: 2, happiness: -2 }, requires: (g) => !!g.crew },
    ],
  },
  {
    id: "heat",
    weight: 4,
    minAge: 16,
    requires: (g) => (g.flags.heat ?? 0) >= 2,
    text: () => "Two officers and a very tired detective would like a word about 'a pattern.' They have photos. You are in them, unfortunately in focus.",
    choices: [
      { label: "Cooperate", text: "You talk. They downgrade you from problem to paperwork.", effects: { reputation: 4, happiness: -2, money: -200 }, flags: { heat: 0 } },
      { label: "Lawyer up", text: "It costs money and works, which is the slogan of civilization.", effects: { money: -2500, reputation: 1, smarts: 1 }, flags: { heat: 0 }, requires: (g) => g.stats.money >= 2500 },
      { label: "Run your mouth", text: "You leave with a court date and a new hobby: consequences.", effects: { reputation: -6, happiness: -4, money: -800 } },
    ],
  },
  {
    id: "commercial",
    weight: 3,
    minAge: 16,
    minFame: 18,
    text: () => "A brand wants you to cry on cue next to a sports drink. The drink is called THUNDERCHUG. You wish you were kidding.",
    choices: [
      { label: "Cash the check", text: "You cry. America hydrates. Your rivals send the clip with no caption.", effects: { money: 8000, fame: 6, reputation: -2, happiness: 2 } },
      { label: "Pass", text: "You keep your tears for real emergencies. The brand hires a man who can juggle.", effects: { reputation: 3, fame: -1, happiness: 1 } },
    ],
  },
  {
    id: "reunion",
    weight: 2,
    once: true,
    minAge: 25,
    maxAge: 60,
    text: () => "A reunion name tag is waiting with your dead nickname on it. The gym smells like every year you survived.",
    choices: [
      { label: "Go", text: "People are softer. So are you. Someone apologizes who didn't have to.", effects: { happiness: 6, fame: 1 } },
      { label: "Skip and mean it", text: "You send a postcard instead. It is the cooler move and you know it.", effects: { happiness: 2 } },
    ],
  },
  {
    id: "mentor",
    weight: 2,
    once: true,
    minAge: 22,
    needsLeague: true,
    text: () => "An older mask takes you for bad coffee and good advice. They cough like the city got into their lungs years ago.",
    choices: [
      { label: "Listen", text: "You write none of it down and remember all of it. They look relieved to be a person.", effects: { smarts: 3, reputation: 2, happiness: 3, powerLevel: 0.2 } },
      { label: "Brag", text: "You talk about your highlight reel. They look at the window like it owes them money.", effects: { fame: 1, happiness: -2 } },
    ],
  },
  {
    id: "anniversary",
    weight: 3,
    needsPartner: true,
    minAge: 18,
    text: (g) => `${partner(g)} remembers a date you did not. The restaurant has candles and a waiter who can smell fear.`,
    choices: [
      { label: "Show up huge", text: "You are late by four minutes and early by every other measure.", effects: (g) => partnerFx(g, { happiness: 6, money: -150 }, 10) },
      { label: "Admit you forgot", text: "The truth lands softer than the lie you almost told.", effects: (g) => partnerFx(g, { happiness: 2 }, 4) },
      { label: "Pick a fight about nothing", text: "You spend the candles. There is no refund on candles.", effects: (g) => partnerFx(g, { happiness: -5 }, -12) },
    ],
  },
  {
    id: "proud",
    weight: 3,
    once: true,
    minAge: 12,
    maxAge: 40,
    requires: (g) => g.stats.parentBelief >= 70 && !!g.powerId,
    text: (g) => `${parent(g)} puts your awful school photo on the fridge beside a news clipping. They don't say anything. The magnets say it.`,
    choices: [
      { label: "Say thanks", text: "It is clumsy and perfect. The fridge hums like it is proud too.", effects: { happiness: 6, parentBelief: 4 } },
      { label: "Take the clipping down", text: "You want a private life. They want a witness. You compromise by sighing.", effects: { happiness: -1, parentBelief: -3, fame: -1 } },
    ],
  },
  {
    id: "doubt",
    weight: 4,
    minAge: 10,
    maxAge: 24,
    needsPower: true,
    requires: (g) => g.stats.parentBelief < 45,
    text: (g) => `${parent(g)} calls it a phase. The scorch mark on the garage calls it a lifestyle.`,
    choices: [
      { label: "Show them, carefully", text: "You do the smallest impressive thing you own. They sit down. That counts.", effects: { parentBelief: 12, happiness: 4 } },
      { label: "Stop explaining", text: "You train where they can't editorialize. It works. It is lonely.", effects: { parentBelief: -4, powerLevel: 0.15, happiness: -2 } },
    ],
  },
  {
    id: "train-night",
    weight: 3,
    minAge: 16,
    maxAge: 50,
    text: () => "The last train is empty except for a stranger crying into a paper bag of groceries. One orange has escaped and is making a run for it.",
    choices: [
      { label: "Sit with them", text: "You say almost nothing. The orange is recovered. So is a little of the night.", effects: { happiness: 4, reputation: 2 } },
      { label: "Mind your business", text: "You respect a boundary. You think about the orange for a week.", effects: { happiness: -1 } },
    ],
  },
  {
    id: "birthday",
    weight: 3,
    minAge: 6,
    maxAge: 80,
    text: (g) => `Your birthday in ${g.city}. Someone got the cake flavor wrong in a way that is honestly brave.`,
    choices: [
      { label: "Eat it anyway", text: "Cilantro chocolate. You will never be the same, and you are smiling.", effects: { happiness: 5, health: -1 } },
      { label: "Order noodles", text: "Best birthday. No notes. The noodles know what they did.", effects: { happiness: 4, money: -20 } },
    ],
  },
  {
    id: "neighbor",
    weight: 3,
    minAge: 18,
    text: () => "The neighbor's music is a personality. At 1 a.m. the personality is drum and bass and uninsured.",
    choices: [
      { label: "Knock nicely", text: "They turn it down and offer you tea like a ceasefire.", effects: { happiness: 2, reputation: 1 } },
      { label: "Call it in", text: "A officer sighs the sigh of a thousand basslines. It works.", effects: { happiness: 1, reputation: -1 } },
      { label: "Retaliate with worse music", text: "You win. Everybody loses. The hallway will remember.", effects: { happiness: 1, reputation: -3, fame: 1 } },
    ],
  },
  {
    id: "gala",
    weight: 3,
    once: true,
    needsSchool: true,
    minAge: 14,
    text: () => "An alumni gala. The punch is non-alcoholic and the donors are not. Someone asks what your 'brand' is.",
    choices: [
      { label: "Network", text: "You leave with two contacts and a sore smile muscle.", effects: { fame: 3, smarts: 1, happiness: 1, money: 200 } },
      { label: "Hide by the coats", text: "You meet a janitor who knows where the real food is. Correct choice.", effects: { happiness: 4 } },
    ],
  },
  {
    id: "envy",
    weight: 3,
    once: true,
    needsNoPower: true,
    minAge: 16,
    maxAge: 30,
    text: () => "A kid half your age hovers past the bus stop to impress a date. The date is not impressed. You are, a little, and you hate it.",
    choices: [
      { label: "Clap anyway", text: "The kid beams. You remember talent is not a pie.", effects: { happiness: 3, reputation: 2 } },
      { label: "Go home angry", text: "You reorganize a drawer with venom. The drawer did not manifest powers either.", effects: { happiness: -4 } },
    ],
  },
  {
    id: "license",
    weight: 3,
    once: true,
    minAge: 18,
    needsPower: true,
    text: () => "City Hall wants you licensed. The form asks for 'range of collateral damage' and offers checkboxes up to 'postal district.'",
    choices: [
      { label: "File it honestly", text: "You are legal. You are also in a database. Freedom is a hallway with fluorescent lights.", effects: { reputation: 4, fame: 2, happiness: -1, money: -150 } },
      { label: "Stay off the books", text: "You keep your name out of it. The work gets harder to explain.", effects: { reputation: -2, happiness: 2 } },
    ],
  },
  {
    id: "karaoke",
    weight: 3,
    needsLeague: true,
    minAge: 18,
    text: () => "Team karaoke. The rule is no powers. Someone is already breaking the rule with a key change that requires flight.",
    choices: [
      { label: "Sing badly, on purpose", text: "You clear the room and the shame. People like you more. This is the secret.", effects: { happiness: 5, fame: 1 } },
      { label: "Sing well", text: "A teammate looks at you like you grew a second brand. You might have.", effects: { fame: 3, happiness: 3, looks: 1 } },
      { label: "Hold the camera", text: "Blackmail, but affectionate. You are promoted to archivist.", effects: { happiness: 2, smarts: 0, reputation: 1 } },
    ],
  },
  {
    id: "scandal",
    weight: 2,
    once: true,
    minAge: 18,
    minFame: 40,
    text: () => "A headline pairs your name with a quote you did not say, about a bill you have not read, in a city you have not burned.",
    choices: [
      { label: "Correct the record", text: "Half the people update their take. The other half preferred the version with fire.", effects: { reputation: 5, fame: -2, happiness: 1 } },
      { label: "Go silent", text: "It blows over. It also calcifies. You feel it in your jaw.", effects: { fame: 2, happiness: -4, reputation: -3 } },
      { label: "Lean in, disastrously", text: "You joke. The joke becomes the quote. You have done this to yourself.", effects: { fame: 6, reputation: -8, happiness: -2 } },
    ],
  },
  {
    id: "bank",
    weight: 2,
    once: true,
    minAge: 18,
    text: () => "The bank app shows a number that is not yours. It is a nicer number. Customer service is 'experiencing volume.'",
    choices: [
      { label: "Report it", text: "They fix it and send a fruit basket like fruit solves banking.", effects: { reputation: 4, happiness: 2 } },
      { label: "Move it and hope", text: "Hope has an audit trail. You put it back at 3 a.m. and sweat professionally.", effects: { happiness: -5, reputation: -2, smarts: 1 } },
    ],
  },
  {
    id: "jury",
    weight: 2,
    once: true,
    minAge: 18,
    maxAge: 75,
    text: () => "Jury duty. The case is a fender bender that became a philosophy. The air conditioning is the real villain.",
    choices: [
      { label: "Serve", text: "You take it seriously. Justice is slow and someone brought mints.", effects: { reputation: 3, happiness: -1, smarts: 1, money: 40 } },
      { label: "Try to get dismissed", text: "You mention your life. They dismiss you out of mercy or fear.", effects: { happiness: 2, reputation: -1 } },
    ],
  },
  {
    id: "retire-party",
    weight: 2,
    once: true,
    minAge: 58,
    text: () => "Someone throws you a party 'just in case you ever stop.' The cake has your face and too many candles. The face is optimistic.",
    choices: [
      { label: "Give a speech", text: "You keep it short. People cry anyway, mostly from the frosting.", effects: { happiness: 6, fame: 2, reputation: 2 } },
      { label: "Leave after cake", text: "You take a corner piece and a long walk. The city is still yours.", effects: { happiness: 4, health: 2 } },
    ],
  },
  {
    id: "lost-kid",
    weight: 4,
    once: true,
    minAge: 12,
    maxAge: 70,
    text: () => "A kid is missing in a department store the size of a rumor. The loudspeaker is making it worse. The kid is six and fast.",
    choices: [
      {
        label: "Search smart",
        text: "Toy aisle, then the racks, then the place you would hide.",
        mini: {
          kind: "pattern",
          title: "Find the kid",
          subtitle: "Remember the path. The store is a maze with a sale on towels.",
          difficulty: 2,
          winText: "You find them naming a mannequin. Security pretends this was the plan.",
          partialText: "You and a clerk corner the correct aisle at the same time. Close enough to be a win.",
          loseText: "Security finds them first, in the bedding. You held a towel like it was a clue.",
          win: { reputation: 6, happiness: 5, fame: 2, smarts: 1 },
          partial: { reputation: 3, happiness: 2 },
          lose: { happiness: -3, reputation: 0 },
        },
      },
      { label: "Let staff handle it", text: "They do, eventually. You buy nothing and feel like nothing, which is honest.", effects: { happiness: -1 } },
    ],
  },
  {
    id: "endorsement",
    weight: 3,
    minAge: 18,
    needsLeague: true,
    minFame: 30,
    text: () => "An agent slides a contract across a table that costs more than your first car. Your face, their cereal, mutual hostage situation.",
    choices: [
      { label: "Sign", text: "The cereal is mid. The check is not. Children will know your jawline.", effects: { money: 22000, fame: 8, happiness: 2, reputation: 1 } },
      { label: "Negotiate a charity cut", text: "You look difficult and correct. They agree because the camera is on.", effects: { money: 12000, fame: 5, reputation: 6, happiness: 4 } },
      { label: "No thanks", text: "You keep your mornings unbranded. The agent says 'love that for you' and does not.", effects: { reputation: 2, happiness: 2, fame: -1 } },
    ],
  },
  {
    id: "rooftop",
    weight: 3,
    needsLeague: true,
    minAge: 18,
    text: () => "After a shift, the team eats on a roof like raccoons with benefits. Someone asks if you'd do it with no powers and no crowd.",
    choices: [
      { label: "Yes", text: "You mean it. The city looks smaller from up here and also like the whole point.", effects: { happiness: 4, reputation: 2 } },
      { label: "Ask for hazard pay first", text: "Everyone laughs. Finance will not.", effects: { happiness: 3, money: 0, fame: 0 } },
    ],
  },
  {
    id: "first-job",
    weight: 4,
    once: true,
    needsJob: true,
    minAge: 15,
    text: () => `First real week at work. Your boss says "be normal" with the confidence of someone who has not read your file.`,
    choices: [
      { label: "Be normal", text: "You are normal for eight hours. It is a superpower you do not list.", effects: { happiness: 2, money: 100 } },
      { label: "Be useful your way", text: "You solve a problem the manual didn't imagine. The manual takes it personally.", effects: { fame: 1, happiness: 3, reputation: 1, powerLevel: 0.1 } },
    ],
  },
  {
    id: "spar-rival",
    weight: 4,
    needsRival: true,
    needsSchool: true,
    minAge: 12,
    maxAge: 20,
    text: (g) => `${rival(g)} calls you out on the practice field. A crowd forms with the loyalty of people who want a clip.`,
    choices: [
      {
        label: "Spar",
        text: "You bow, because someone taught you manners and also trash talk.",
        mini: {
          kind: "timing",
          title: "Rival spar",
          subtitle: "They know your tell. You know theirs. The mat knows both of you.",
          difficulty: 2,
          winText: "Your rival eats mat and grins like this was the plan.",
          partialText: "You trade hits until the bell saves the gossip.",
          loseText: "Your rival bows deeper than necessary. The group chat will be unbearable.",
          win: { powerLevel: 0.35, happiness: 4, fame: 2, reputation: 1 },
          partial: { powerLevel: 0.15, happiness: 1 },
          lose: { happiness: -4, fame: 1, health: -6 },
        },
      },
      { label: "Decline", text: "You deny them the clip. They respect it and hate it, which is their hobby.", effects: { happiness: 1, reputation: 1 } },
    ],
  },
  {
    id: "will",
    weight: 2,
    once: true,
    minAge: 40,
    text: () => "A pamphlet at the clinic says ADULTS HAVE WILLS. You are an adult. This feels like an accusation.",
    choices: [
      { label: "Write one", text: "You leave people things and jokes. It is the least grim grim task.", effects: { happiness: 2, smarts: 1 } },
      { label: "Not today", text: "You put the pamphlet under a magnet. The magnet is now your estate plan.", effects: { happiness: -1 } },
    ],
  },
  {
    id: "power-sneeze",
    weight: 4,
    minAge: 8,
    maxAge: 40,
    needsPower: true,
    text: (g) => {
      const p = powerById(g.powerId);
      return `You sneeze in public. ${p ? p.strength : "Something happens."} A stranger films from the hip like a nature documentary.`;
    },
    choices: [
      { label: "Own it", text: "You bow. The clip does numbers you did not ask for.", effects: { fame: 5, reputation: 1, happiness: 2 } },
      { label: "Apologize and help", text: "Cleanup takes twenty minutes and adds a year to your soul, the good kind.", effects: { reputation: 4, happiness: 2, fame: 1 } },
      { label: "Deny physics", text: "You blame the vents. The vents request a lawyer.", effects: { fame: -1, happiness: -2, reputation: -2 } },
    ],
  },
  {
    id: "pressure",
    weight: 3,
    once: true,
    minAge: 17,
    maxAge: 30,
    needsLeague: true,
    text: () => "A captain offers a mission that will look great and help almost nobody. The cameras are already parked.",
    choices: [
      { label: "Do the real job instead", text: "You skip the shot and stop a dull, important thing. One blogger is furious.", effects: { reputation: 7, fame: -3, happiness: 3 } },
      { label: "Take the glamour", text: "The photo is perfect. The problem is still there, wearing a hat.", effects: { fame: 7, reputation: -4, happiness: 1, money: 1500 } },
    ],
  },
  {
    id: "kid-question",
    weight: 3,
    minAge: 16,
    minFame: 10,
    text: () => "A child asks if you are the real you or the mascot. They have notes. They have follow-ups.",
    choices: [
      { label: "Tell the truth", text: "You are real, you say, and sometimes scared. They nod like a peer review.", effects: { happiness: 4, reputation: 2 } },
      { label: "Sell the myth", text: "You claim you were born on a comet. Their parent mouths 'please stop.'", effects: { fame: 2, happiness: 2, reputation: -1 } },
    ],
  },
  {
    id: "blackout",
    weight: 3,
    minAge: 14,
    text: (g) => `${g.city} blinks out for nine blocks. People step into the street like it's a holiday. Somewhere, ice cream is in crisis.`,
    choices: [
      { label: "Help direct traffic", text: "You become a polite cone. The night stays gentle.", effects: { reputation: 4, happiness: 3, karma: 4 } },
      { label: "Loot nothing, watch everything", text: "You keep an eye out. A guy returns a TV that wasn't his and feels famous.", effects: { reputation: 2, fame: 1, karma: 1 } },
      { label: "Use the dark", text: "You take a little. The dark takes note.", effects: { money: 700, reputation: -7, happiness: -2, karma: -6 } },
    ],
  },
];

const FILLERS: EventDef[] = [
  { id: "pigeon", weight: 1, minAge: 5, text: () => "A pigeon steals a fry and makes eye contact. You respect it. This is your life now.", choices: [{ label: "Nod back", text: "A treaty is signed in salt.", effects: { happiness: 2 } }, { label: "Defend the fry", text: "You win. The pigeon files an appeal with its friends.", effects: { happiness: 1, health: -1 } }] },
  { id: "rain", weight: 1, minAge: 6, text: (g) => `Rain in ${g.city}. Your sock achieves sentience and it is unhappy.`, choices: [{ label: "Buy new socks", text: "Luxury. Decadence. Dry toes.", effects: { happiness: 2, money: -15 } }, { label: "Endure", text: "You squelch with principle.", effects: { happiness: -1, health: -1 } }] },
  { id: "dream", weight: 1, minAge: 8, text: () => "You dream you are late for a test in a building that is also your mouth. You wake talented at nothing and very awake.", choices: [{ label: "Write it down", text: "Future you will not thank you, but the page is full.", effects: { smarts: 1 } }, { label: "Go back to sleep", text: "The mouth-building wins.", effects: { health: 2, happiness: 1 } }] },
  { id: "soup", weight: 1, minAge: 10, text: () => "You attempt soup. The soup attempts you back. Firefighters are not required. Pride is injured.", choices: [{ label: "Order takeout", text: "A professional handles the sodium.", effects: { happiness: 2, money: -18 } }, { label: "Eat the evidence", text: "It builds character and, possibly, immunity.", effects: { health: -2, happiness: 1, smarts: 1 } }] },
  { id: "groupchat", weight: 1, minAge: 13, text: () => "The group chat is arguing about a movie none of you finished. You have the power to stop this. You do not.", choices: [{ label: "Send a peace meme", text: "Hostilities drop by one spicy take.", effects: { happiness: 2 } }, { label: "Leave the chat", text: "Silence. Growth. They add you back by dinner.", effects: { happiness: 1 } }] },
  { id: "haircut", weight: 1, minAge: 14, text: () => "You ask for 'the usual' and receive 'a surprise.' The mirror is honest to a fault.", choices: [{ label: "Tip anyway", text: "Kindness. Also fear.", effects: { looks: -1, happiness: 1, money: -30, reputation: 1 } }, { label: "Own the new silhouette", text: "By Thursday it is a choice you made.", effects: { looks: 2, happiness: 2, fame: 1 } }] },
  { id: "elevator", weight: 1, minAge: 16, text: () => "The elevator stops between floors with a stranger who wants to talk about cryptids. You are the cryptid.", choices: [{ label: "Engage", text: "You learn three facts and one phone number for a podcast.", effects: { happiness: 2, fame: 1 } }, { label: "Pretend to meditate", text: "They respect it. You fake-enlighten for four minutes.", effects: { happiness: 1, health: 1 } }] },
  { id: "plant", weight: 1, minAge: 18, text: () => "A plant you were supposed to be watering has entered a dramatic third act.", choices: [{ label: "Rescue it", text: "It forgives you, which is more than you deserve.", effects: { happiness: 3 } }, { label: "Accept the loss", text: "You buy a fake one. It thrives, emotionally.", effects: { happiness: -1, money: -20 } }] },
  { id: "headline-small", weight: 1, minAge: 15, needsPower: true, text: () => "A tiny blog calls you 'mid.' The post has nine views. One of them is you, twice.", choices: [{ label: "Ignore it", text: "The blog remains mid. So does the day. Fine.", effects: { happiness: 1 } }, { label: "Train out of spite", text: "Spite is a renewable resource.", effects: { powerLevel: 0.12, happiness: 1 } }] },
  { id: "aunt", weight: 1, minAge: 10, maxAge: 60, text: () => "A relative you barely know sends a voice note that is four minutes and zero punctuation.", choices: [{ label: "Call back", text: "They are lonely and funny. You promise a visit you might mean.", effects: { happiness: 3, reputation: 1 } }, { label: "Heart-react and flee", text: "Modern love.", effects: { happiness: 0 } }] },
];

function powerSlips(): EventDef[] {
  return (["strength", "flight", "blasts", "speed", "telekinesis", "invisibility", "fire", "ice", "healing", "mind", "shapeshift", "forcefield", "intellect", "elastic", "lightning"] as PowerId[]).map((id) => {
    const p = powerById(id)!;
    return {
      id: `slip-${id}`,
      weight: 3,
      once: true,
      minAge: 8,
      maxAge: 45,
      power: id,
      text: () => `Your ${p.name.toLowerCase()} slips at the worst polite moment. ${p.weakness}`,
      choices: [
        { label: "Own the mess", text: "People stare, then someone laughs, then it is a story instead of a wound.", effects: { fame: 3, happiness: 2, reputation: 2 } },
        { label: "Overcorrect", text: "You clamp down so hard the rest of the day feels like holding a sneeze.", effects: { happiness: -2, powerLevel: 0.08 } },
        { label: "Ask for help", text: `You say the weak part out loud. ${p.strength} Someone stays.`, effects: { happiness: 3, parentBelief: 3, reputation: 1 } },
      ],
    } satisfies EventDef;
  });
}

export const EVENTS: EventDef[] = [...HAND, ...FILLERS, ...powerSlips(), ...cityPulse(), ...deeperMoments(), ...richerMoments(), ...originMoments()];

function cityPulse(): EventDef[] {
  return [
    {
      id: "hero-coffee",
      weight: 5,
      minAge: 10,
      minFame: 6,
      text: () => "A hero you have only seen on buses sits down uninvited. They slide over a napkin with a training time and a smiley face that is trying too hard.",
      choices: [
        { label: "Take the meeting", text: "You get a number, a bruise, and someone who texts back.", special: { kind: "meet", side: "hero" }, effects: { happiness: 3, fame: 1, powerLevel: 0.08 } },
        { label: "Keep it professional", text: "You nod. They nod. The napkin goes in a book you might open.", effects: { reputation: 2, fame: 1 } },
        { label: "Ghost them", text: "The napkin dies in a pocket. Your name does not.", effects: { fame: 1, happiness: -1 } },
      ],
    },
    {
      id: "hero-backup",
      weight: 4,
      minAge: 12,
      minFame: 14,
      text: (g) => `A cape radios you mid-bite. Something loud is happening three blocks from ${g.city}'s worst sandwich. They want your Tuesday.`,
      choices: [
        { label: "Show up", text: "You arrive with sauce on your face and a useful trick. They remember both.", special: { kind: "meet", side: "hero" }, effects: { reputation: 3, fame: 2, happiness: 2 } },
        { label: "Talk them through it", text: "You stay on the line and become a calm voice. Less clip. More save.", effects: { reputation: 4, smarts: 1 } },
        { label: "Let it ring", text: "The city manages. Your fries do not judge you. Much.", effects: { happiness: 1, reputation: -1 } },
      ],
    },
    {
      id: "villain-roof",
      weight: 5,
      minAge: 12,
      minFame: 10,
      text: () => "Someone in a coat that costs more than your rent is waiting on your roof. They clap, slowly, like a review.",
      choices: [
        { label: "Hear them out", text: "They know your name, your tell, and your coffee order. This is flirting or a threat. Possibly both.", special: { kind: "meet", side: "villain" }, effects: { fame: 3, happiness: -1 } },
        { label: "Tell them to leave", text: "They bow like you won a point. Points, you learn, are how they keep score.", effects: { reputation: 2, happiness: 1, fame: 1 } },
        { label: "Make it personal", text: "You say the quiet part. They look delighted, which is the worst review.", special: { kind: "arch" }, effects: { fame: 4, happiness: -2, reputation: 1 } },
      ],
    },
    {
      id: "villain-gala",
      weight: 3,
      minAge: 16,
      minFame: 20,
      text: () => "A fundraiser invites you and, on the same card, the person the city has been warned about. The shrimp are neutral.",
      choices: [
        { label: "Work the room", text: "You leave with a contact, a smear of cocktail sauce, and a new problem who knows your laugh.", special: { kind: "meet", side: "villain" }, effects: { fame: 3, happiness: 2 } },
        { label: "Stick with the heroes", text: "You orbit the good table. Someone offers a patrol. Someone else offers a grudge.", special: { kind: "meet", side: "hero" }, effects: { reputation: 3, fame: 1 } },
        { label: "Steal the centerpiece and go", text: "The centerpiece was a metaphor. You still have it.", effects: { happiness: 2, reputation: -2, money: 200 } },
      ],
    },
    {
      id: "arch-billboard",
      weight: 4,
      minAge: 13,
      minFame: 16,
      requires: (g) => g.relationships.some((r) => (r.role === "villain" || r.role === "hero" || r.role === "rival") && r.alive && !r.arch),
      text: () => "A cheap billboard has your face and someone else's, printed like a boxing poster nobody approved. The comments have already picked a winner.",
      choices: [
        { label: "Claim the rivalry", text: "You tap the poster and say the name out loud. The city files it under canon.", special: { kind: "arch" }, effects: { fame: 5, happiness: -1 } },
        { label: "Laugh it off", text: "You post a joke. The joke does numbers. The grudge does not retire.", effects: { fame: 2, happiness: 2 } },
        { label: "Tear it down", text: "You remove one poster. Nine more commute into existence.", effects: { reputation: 1, happiness: -1 } },
      ],
    },
    {
      id: "relic-subway", offCanon: true,
      weight: 4,
      minAge: 12,
      needsPower: true,
      text: (g) => `A maintenance worker in ${g.city} swears a sealed platform is growing a second heartbeat. They will show you, if you stop laughing.`,
      choices: [
        {
          label: "Go down",
          text: "The dark has a pulse, and it knows your first gift by name.",
          special: { kind: "combine" },
          mini: {
            kind: "timing",
            title: "Sealed platform",
            subtitle: "Three beats. Match the heartbeat that isn't yours.",
            difficulty: 2,
            winText: "You catch the rhythm. Something old agrees to share a body.",
            partialText: "You scrape a spark and a cough. The platform keeps the rest.",
            loseText: "The heartbeat wins the argument. You climb out smaller.",
            win: { fame: 2, happiness: 2, powerLevel: 0.15 },
            partial: { powerLevel: 0.05, happiness: 0 },
            lose: { health: -8, happiness: -2 },
          },
        },
        { label: "Sell the tip", text: "A collector pays. The heartbeat becomes somebody else's commute.", effects: { money: 1200, reputation: -2 } },
        { label: "Leave it buried", text: "Some doors are a career. You pick the escalator.", effects: { happiness: 1 } },
      ],
    },
    {
      id: "relic-crater", offCanon: true,
      weight: 3,
      minAge: 14,
      needsPower: true,
      minFame: 8,
      text: () => "A crater outside town still ticks. Scientists put tape around it. The tape is scared. A note on the tape says your name, then a question mark.",
      choices: [
        {
          label: "Step over the tape",
          text: "The ticking lines up with your pulse and then refuses to leave.",
          special: { kind: "combine" },
          mini: {
            kind: "pattern",
            title: "Crater tick",
            subtitle: "Repeat the pattern before it repeats you.",
            difficulty: 2,
            winText: "You bring a second gift home in your teeth. It fits, rudely.",
            partialText: "You get a buzz and a sunburn from the inside.",
            loseText: "The crater keeps the souvenir. You keep the limp.",
            win: { fame: 3, powerLevel: 0.2, reputation: 1 },
            partial: { powerLevel: 0.05 },
            lose: { health: -10, happiness: -3 },
          },
        },
        { label: "Call it in", text: "Professionals arrive with better tape. You get a nod and no new tricks.", effects: { reputation: 3, fame: 1 } },
        { label: "Picnic elsewhere", text: "You respect geology from a safe sandwich.", effects: { happiness: 2 } },
      ],
    },
    {
      id: "nemesis-text",
      weight: 3,
      minAge: 12,
      requires: (g) => g.relationships.some((r) => r.arch && r.alive),
      text: (g) => {
        const arch = g.relationships.find((r) => r.arch && r.alive);
        const who = arch?.note || (arch ? firstName(arch.name) : "your arch-enemy");
        return `${who} texts a single pin and the words "bring the good trick." Your phone has never been ruder.`;
      },
      choices: [
        { label: "Answer in person", text: "You go. Of course you go. The city already wrote the caption.", effects: { fame: 2, happiness: -1, reputation: 1 } },
        { label: "Reply never", text: "Silence is a move. They respect it and hate it, which is their love language.", effects: { happiness: 2 } },
        { label: "Send a worse pin", text: "You move the fight to a parking lot with better lighting. Petty. Effective.", effects: { fame: 1, smarts: 1 } },
      ],
    },
    {
      id: "sidekick-pitch",
      weight: 3,
      minAge: 15,
      minFame: 18,
      text: () => "A teenager with a homemade mask and a binder of your mistakes asks to be your sidekick. The binder is tabbed.",
      choices: [
        { label: "Hear the pitch", text: "They are brave and underprepared. You give them homework instead of a cape.", effects: { happiness: 3, reputation: 2, fame: 1 } },
        { label: "Recruit them for real", text: "Terrible idea. Warm idea. They do not die this month, which is the bar.", special: { kind: "meet", side: "hero" }, effects: { happiness: 2, fame: 2 } },
        { label: "Shut it down", text: "You are not unkind. You are specific. They will try someone louder.", effects: { happiness: -1, reputation: 1 } },
      ],
    },
    {
      id: "roster-rumor",
      weight: 3,
      minAge: 8,
      text: (g) => `The monthly board in ${g.city} reshuffles before breakfast. Your group chat treats it like sports, which it is.`,
      choices: [
        { label: "Study the names", text: "You learn who rose, who vanished, and who is suddenly your problem.", effects: { smarts: 1, fame: 1 } },
        { label: "Ignore the board", text: "The board does not ignore you. It just waits a month.", effects: { happiness: 1 } },
        { label: "Talk trash on purpose", text: "A stranger screenshots you. Somewhere, a villain smiles with their whole budget.", effects: { fame: 3, reputation: -1, happiness: 1 } },
      ],
    },
  ];
}

function deeperMoments(): EventDef[] {
  return [
    {
      id: "easy-cash",
      weight: 4,
      minAge: 13,
      maxAge: 30,
      text: () => "Someone leaves a bag behind a diner and a note that says 'if you saw this, you didn't.' The bag is heavy in the way money is heavy.",
      choices: [
        { label: "Turn it in", text: "The diner owner cries into a towel. You get a free shake and a cleaner bar.", effects: { karma: 8, reputation: 3, happiness: 3, money: 20 } },
        { label: "Split it with the staff", text: "Everyone eats. Nobody asks the useful questions.", effects: { karma: 2, happiness: 4, money: 80 } },
        { label: "Walk off with it", text: "You are across town before the guilt finishes its sentence.", effects: { karma: -10, money: 900, reputation: -3, happiness: -1 } },
      ],
    },
    {
      id: "bus-fire",
      weight: 4,
      minAge: 12,
      text: () => "A bus kisses a hydrant and then considers becoming a headline. People are still in the seats, being polite about the smoke.",
      choices: [
        { label: "Get them out", text: "You are not smooth. You are fast enough. A kid gives you a sticker you will not throw away.", effects: { karma: 8, reputation: 4, fame: 2, health: -3, happiness: 3 } },
        { label: "Film it for the tip line", text: "The video does numbers. The bus does not thank you.", effects: { fame: 4, karma: -6, happiness: -2 } },
        { label: "Keep walking", text: "Someone else is surely qualified. The thought does not survive the block.", effects: { karma: -4, happiness: -3 } },
      ],
    },
    {
      id: "trainer-roof",
      weight: 5,
      minAge: 10,
      once: true,
      text: () => "A person in scuffed pads is on your roof, throwing a tennis ball at nothing and hitting it anyway. They have been waiting for someone who will ask why.",
      choices: [
        { label: "Ask to train", text: "They grin like a dare. Your phone learns a new name.", special: { kind: "meetHero" }, effects: { happiness: 2, karma: 1 } },
        { label: "Ask what they can teach", text: "They put a spark in your hand and tell you not to name it yet.", special: { kind: "grant" }, effects: { powerLevel: 0.1, smarts: 1 } },
        { label: "Tell them to get down", text: "They hop off the easy way. You feel older, which is rude.", effects: { happiness: -1 } },
      ],
    },
    {
      id: "press-moral",
      weight: 3,
      minAge: 16,
      minFame: 12,
      text: () => "A reporter asks, on the record, whether you hit first. The red light is on. So is the part of you that wants a clip.",
      choices: [
        { label: "Tell the decent version", text: "You leave out the fun parts. The city believes you a little more.", effects: { karma: 5, reputation: 4, fame: 1 } },
        { label: "Tell the scary version", text: "You describe the hit. The comments pick a side and it is not the nice one.", effects: { karma: -6, fame: 5, reputation: -2 } },
        { label: "No comment, with menace", text: "You smile wrong. The headline writes itself in a font you hate.", effects: { fame: 3, karma: -3, happiness: 1 } },
      ],
    },
    {
      id: "lab-offer", offCanon: true,
      weight: 4,
      minAge: 14,
      text: () => "A night class promises 'two gifts, one body, no refunds.' The chalkboard is already full of names that sound like accidents.",
      choices: [
        { label: "Stay for the braid", text: "You leave with a page you didn't have and a headache that has opinions.", special: { kind: "grant" }, effects: { smarts: 2, happiness: -1, powerLevel: 0.05 } },
        { label: "Steal the notes", text: "The notes are half a trick and half a personality test. You fail the second half.", effects: { karma: -4, smarts: 2, money: 60 } },
        { label: "Audit and leave", text: "You learn the vocabulary and none of the fire. Still useful at parties.", effects: { smarts: 2, karma: 1 } },
      ],
    },
    {
      id: "villain-hire",
      weight: 4,
      minAge: 16,
      maxKarma: -8,
      text: () => "A villain with a clean coat and a dirty calendar offers you a name to hire, a price, and the implication that you already decided.",
      choices: [
        { label: "Take the introduction", text: "A new problem learns your coffee order. That's networking, if you squint.", special: { kind: "meet", side: "villain" }, effects: { karma: -4, fame: 2 } },
        { label: "Pay them to go away", text: "Peace, purchased. It expires.", effects: { money: -400, karma: 2, happiness: 1 } },
        { label: "Laugh in their face", text: "They enjoy it. You will see them on a roof you liked.", effects: { karma: 2, reputation: 2, happiness: 2 } },
      ],
    },
    {
      id: "crew-pitch",
      weight: 3,
      minAge: 15,
      maxKarma: 10,
      once: true,
      text: (g) => `${g.city} has a vacancy where a crew should be. Someone drew your initial on a napkin and underlined it twice.`,
      choices: [
        { label: "Start the ledger", text: "You don't found it tonight. You do stop pretending you won't.", effects: { karma: -8, fame: 1, happiness: 1 } },
        { label: "Burn the napkin", text: "The idea smells like smoke. You like the night better.", effects: { karma: 4, happiness: 2 } },
        { label: "Keep the napkin", text: "A maybe is still a direction.", effects: { karma: -2 } },
      ],
    },
    {
      id: "fan-letter",
      weight: 3,
      minAge: 14,
      minFame: 8,
      text: () => "A letter arrives from a kid who drew you braver than you were that day. The drawing has too many muscles and exactly the right heart.",
      choices: [
        { label: "Write back", text: "You tell the truth in a handwriting that tries. They will keep it.", effects: { karma: 5, happiness: 4, fame: 1 } },
        { label: "Ignore it", text: "The letter lives on the counter until it becomes a guilt.", effects: { karma: -2, happiness: -2 } },
        { label: "Post the drawing", text: "It does numbers. The kid becomes a detail in your brand. You notice, late.", effects: { fame: 3, karma: -3, happiness: 1 } },
      ],
    },
    {
      id: "rival-school",
      weight: 3,
      minAge: 11,
      maxAge: 22,
      text: () => "Someone at school can do a thing you can't, and they know you noticed. They offer to show you if you stop performing about it.",
      choices: [
        { label: "Swallow the pride and learn", text: "The trick is smaller than their smirk and still worth having.", special: { kind: "grant" }, effects: { smarts: 1, happiness: 2, karma: 1 } },
        { label: "Turn it into a contest", text: "You both get worse and more famous. A teacher sighs in two languages.", effects: { fame: 2, happiness: 1, karma: -1 } },
        { label: "Spread a rumor", text: "The rumor is petty and sticky. You are worse for the telling.", effects: { karma: -5, reputation: -2, happiness: 1 } },
      ],
    },
    {
      id: "hospital-shift",
      weight: 3,
      minAge: 16,
      text: () => "A nurse who has seen your face on a screen asks if you can sit with a ward for an hour. No cameras. The vending machine is the only witness.",
      choices: [
        { label: "Stay the hour", text: "You do almost nothing and it counts more than the month's loudest rescue.", effects: { karma: 7, happiness: 3, reputation: 2 } },
        { label: "Drop off supplies and go", text: "Useful. Incomplete. The nurse clocks both.", effects: { karma: 2, money: -150, reputation: 1 } },
        { label: "Sign a poster and leave", text: "The poster will outlive the hour you didn't give.", effects: { fame: 1, karma: -3 } },
      ],
    },
    {
      id: "black-market-spark",
      weight: 3,
      minAge: 15,
      maxKarma: -5,
      text: () => "Under a butcher shop, someone sells sparks in jars. One of them hums in a key your bones already know.",
      choices: [
        { label: "Buy the jar", text: "It costs more than rent and less than a soul, which is the sales pitch.", special: { kind: "grant" }, effects: { money: -800, karma: -3, powerLevel: 0.08 } },
        { label: "Smash the shelf", text: "Glass, shouting, a chase. You are not sure you were the good guy in it.", effects: { karma: 3, reputation: -2, health: -4, fame: 1 } },
        { label: "Tell the League", text: "They nod, raid the wrong night, and thank you in a font.", effects: { karma: 4, reputation: 3, fame: 1 } },
      ],
    },
    {
      id: "mentor-fight",
      weight: 3,
      minAge: 12,
      requires: (g) => (g.heroes ?? []).some((hero) => hero.met),
      text: (g) => {
        const hero = g.heroes?.find((item) => item.met);
        const who = hero?.alias ?? "Your trainer";
        return `${who} says you are showing off. You say they are scared of what you could be. The room picks a temperature.`;
      },
      choices: [
        { label: "Apologize and mean it", text: "The drill resumes. So does the respect, which is heavier.", effects: { karma: 3, happiness: 2, smarts: 1 } },
        { label: "Double down", text: "You leave louder. They will still answer the phone. They will also sigh.", effects: { karma: -3, fame: 1, happiness: 1 } },
        { label: "Ask them to show you a mix", text: "They stop lecturing and start building. Something in you takes the shape.", special: { kind: "grant" }, effects: { powerLevel: 0.12, happiness: 2 } },
      ],
    },
  ];
}

export function eligible(e: EventDef, g: Game): boolean {
  if (e.minAge != null && g.age < e.minAge) return false;
  if (e.maxAge != null && g.age > e.maxAge) return false;
  if (e.once && g.flags[`seen:${e.id}`]) return false;
  if (e.offCanon && g.preset) return false;
  if (e.needsPower && !g.powerId) return false;
  if (e.needsNoPower && (g.powerId || g.age < 16)) return false;
  if (e.needsNoPower && g.powerId) return false;
  if (e.needsSchool && !g.schoolId) return false;
  if (e.needsJob && !g.jobId) return false;
  if (e.needsLeague && g.leagueRank < 1) return false;
  if (e.needsPartner && !g.relationships.some((r) => r.role === "partner" && r.alive)) return false;
  if (e.needsRival && !g.relationships.some((r) => r.role === "rival" && r.alive)) return false;
  if (e.minRep != null && g.stats.reputation < e.minRep) return false;
  if (e.maxRep != null && g.stats.reputation > e.maxRep) return false;
  if (e.minFame != null && g.stats.fame < e.minFame) return false;
  if (e.minPL != null && g.stats.powerLevel < e.minPL) return false;
  if (e.minKarma != null && (g.stats.karma ?? 0) < e.minKarma) return false;
  if (e.maxKarma != null && (g.stats.karma ?? 0) > e.maxKarma) return false;
  if (e.needsCrew && !g.crew) return false;
  if (e.power && g.powerId !== e.power) return false;
  if (e.cities && e.cities.length && !e.cities.includes(g.cityId)) return false;
  if (e.requires && !e.requires(g)) return false;
  return true;
}

export function pickEvent(g: Game, r: number): EventDef | null {
  const pool = EVENTS.filter((e) => eligible(e, g) && e.id !== g.lastEvent);
  if (!pool.length) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let x = r * total;
  for (const e of pool) {
    x -= e.weight;
    if (x <= 0) return e;
  }
  return pool[pool.length - 1] ?? null;
}

function unmetHero(g: Game) {
  return (g.heroes ?? []).find((hero) => !hero.met);
}

function richerMoments(): EventDef[] {
  return [
    {
      id: "circuit-night",
      weight: 5,
      minAge: 10,
      requires: (g) => !!unmetHero(g),
      text: (g) => {
        const hero = unmetHero(g);
        const offer = hero?.unlocked[0]?.split("-").join(" ") ?? "a trick";
        return `A gym door has ${hero?.alias ?? "a stranger"}'s name on a flyer, twice, and a note: bring questions, not an audience. Word is they teach ${offer}.`;
      },
      choices: [
        {
          label: "Show up alone",
          text: "You knock. They were already counting on the knock.",
          effects: { happiness: 2, karma: 1 },
          special: (g) => ({ kind: "meetHero", heroId: unmetHero(g)?.id }),
        },
        {
          label: "Show up with an attitude",
          text: "You lead with a joke that is almost an insult. They keep you anyway.",
          effects: { happiness: 1, karma: -1, fame: 1 },
          special: (g) => ({ kind: "meetHero", heroId: unmetHero(g)?.id }),
        },
        { label: "Save the flyer", text: "You fold it into a pocket. The door will still be a door next month.", effects: { smarts: 1 } },
      ],
    },
    {
      id: "trainer-lesson",
      weight: 5,
      minAge: 10,
      requires: (g) => !!nextLesson(g.unlockedPowers ?? [], g.heroes ?? []),
      text: (g) => {
        const lesson = nextLesson(g.unlockedPowers ?? [], g.heroes ?? []);
        if (!lesson) return "A trainer almost calls. The almost is the whole message.";
        return `${lesson.alias} texts a single line: you are one page from ${lesson.resultName}. They can put ${lesson.powerName} in your hands if you stop performing and start listening.`;
      },
      choices: [
        {
          label: "Take the lesson",
          text: "You shut up and learn. The braid book gets a new page on purpose.",
          effects: { happiness: 2, smarts: 1, karma: 1 },
          special: (g) => {
            const lesson = nextLesson(g.unlockedPowers ?? [], g.heroes ?? []);
            if (!lesson) return undefined;
            return { kind: "heroProgress", heroId: lesson.heroId, exp: 16, bond: 6, teach: lesson.powerId };
          },
        },
        {
          label: "Owe them a favor",
          text: "The lesson lands. So does a debt they will absolutely remember.",
          effects: { karma: -2, fame: 1 },
          special: (g) => {
            const lesson = nextLesson(g.unlockedPowers ?? [], g.heroes ?? []);
            if (!lesson) return undefined;
            return { kind: "heroProgress", heroId: lesson.heroId, exp: 10, bond: 3, teach: lesson.powerId };
          },
        },
        { label: "Say you're not ready", text: "They respect it, which is worse than being mocked. The page stays theirs.", effects: { happiness: -1, karma: 1 } },
      ],
    },
    {
      id: "pier-ice",
      weight: 3,
      once: true,
      minAge: 11,
      text: () => "On the pier, a woman is freezing the chop into stepping stones and then apologizing to the fish. She offers the trick if you stop filming with your eyes.",
      choices: [
        { label: "Learn the cold", text: "Your breath goes white on command. The fish are unimpressed. You are not.", special: { kind: "grant", comboId: "ice-control" }, effects: { happiness: 2, powerLevel: 0.08 } },
        { label: "Ask her to train for real", text: "She gives you a number and a warning about frostbite of the personality.", special: { kind: "meetHero", heroId: "pilar" }, effects: { karma: 1 } },
        { label: "Leave the pier", text: "The stones melt behind you. A maybe stays.", effects: { happiness: 1 } },
      ],
    },
    {
      id: "roof-bolt",
      weight: 3,
      once: true,
      minAge: 11,
      text: () => "A man on a water tower is having an argument with a cloud, and the cloud is losing. He says lightning is just weather that learned to aim, and you can have a pinch.",
      choices: [
        { label: "Take the pinch", text: "Your fillings file a complaint. The sky puts you on a list.", special: { kind: "grant", comboId: "lightning-control" }, effects: { fame: 1, powerLevel: 0.08 } },
        { label: "Ask who taught him", text: "He grins like a blown transformer and decides you are a student.", special: { kind: "meetHero", heroId: "bolt" }, effects: { happiness: 2 } },
        { label: "Get off the tower", text: "Stairs. Dignity. A boring heartbeat. Correct choice, maybe.", effects: { health: 1, karma: 1 } },
      ],
    },
    {
      id: "fall-up",
      weight: 3,
      once: true,
      minAge: 12,
      text: () => "Someone falls off a billboard, changes their mind halfway, and offers to show you the change-of-mind part. No capes. Shoes optional.",
      choices: [
        { label: "Learn to fall up", text: "You leave the ground for three honest seconds. The landing is a negotiation.", special: { kind: "grant", comboId: "flight" }, effects: { happiness: 3, health: -2 } },
        { label: "Ask for the speed version", text: "They laugh, hand you a number, and are already gone.", special: { kind: "meetHero", heroId: "juniper" }, effects: { happiness: 2 } },
        { label: "Keep both feet down", text: "Gravity thanks you. You feel slightly less legendary and much less nauseous.", effects: { health: 1 } },
      ],
    },
    {
      id: "library-mind",
      weight: 3,
      once: true,
      minAge: 12,
      text: () => "In a library after hours, the chairs stack themselves to prove a point. The person responsible says telekinesis is just manners with a grip.",
      choices: [
        { label: "Borrow the grip", text: "A book crosses the room because you asked. You apologize to it anyway.", special: { kind: "grant", comboId: "telekinesis" }, effects: { smarts: 2, powerLevel: 0.06 } },
        { label: "Stay for the lecture", text: "They talk like a paper cut and still walk you out with a lesson.", special: { kind: "meetHero", heroId: "idris" }, effects: { smarts: 2 } },
        { label: "Reshelve and leave", text: "You put the chairs back with your hands. The room seems disappointed.", effects: { karma: 2 } },
      ],
    },
    {
      id: "storm-chase",
      weight: 3,
      once: true,
      minAge: 13,
      text: (g) => `A front sits on ${g.city} and refuses to be a metaphor. A chaser in a dented van says they can teach you the volume knob if you don't narrate it.`,
      choices: [
        { label: "Take the knob", text: "You make the rain hesitate. The van's driver cries, professionally.", special: { kind: "grant", comboId: "weather" }, effects: { fame: 1, happiness: 2 } },
        { label: "Ride with them", text: "You learn a name, a route, and that clouds hold grudges.", special: { kind: "meetHero", heroId: "pilar" }, effects: { happiness: 2, karma: 1 } },
        { label: "Go inside", text: "Dry socks. No legend. The front leaves without you.", effects: { health: 1, happiness: 1 } },
      ],
    },
    {
      id: "shoulder-tap",
      weight: 3,
      once: true,
      minAge: 13,
      text: () => "A tap on your shoulder comes from a person who wasn't there a second ago. They offer invisibility the way other people offer gum.",
      choices: [
        { label: "Take the gum", text: "You blink out of a reflection. It feels like lying and also like a skill.", special: { kind: "grant", comboId: "invisibility" }, effects: { karma: -1, happiness: 1 } },
        { label: "Ask the price", text: "The price is attention. They introduce themselves like a locked door.", special: { kind: "meetHero", heroId: "nim" }, effects: { smarts: 1 } },
        { label: "Call it a crime", text: "They vanish offended. You keep the moral and lose the trick.", effects: { karma: 3, reputation: 1 } },
      ],
    },
    {
      id: "blink-alley",
      weight: 3,
      once: true,
      minAge: 14,
      text: () => "An alley is shorter on the way out than the way in. The person leaning on the shortcut says teleportation is just refusing the commute.",
      choices: [
        { label: "Refuse the commute", text: "You step and the block steps with you. Your stomach files a dissent.", special: { kind: "grant", comboId: "teleportation" }, effects: { happiness: 1, health: -1 } },
        { label: "Learn the quiet version", text: "They teach you how not to be witnessed doing it.", special: { kind: "meetHero", heroId: "nim" }, effects: { karma: -1 } },
        { label: "Walk the long way", text: "You take every step. It feels like a principle.", effects: { karma: 2, health: 1 } },
      ],
    },
    {
      id: "ward-field",
      weight: 3,
      once: true,
      minAge: 14,
      text: () => "A nurse with a shimmer around her coffee asks if you want the version of a wall that doesn't need bricks. She will only teach it if you sit with the ward first.",
      choices: [
        { label: "Sit, then learn", text: "The hour is quiet. The shield, when it comes, feels like that quiet.", special: { kind: "grant", comboId: "force-field" }, effects: { karma: 5, happiness: 2 } },
        { label: "Skip the sitting", text: "She puts the cup down. The lesson leaves with her.", effects: { karma: -2, happiness: -1 } },
        { label: "Just sit", text: "No new trick. A kid sleeps. You are heavier in the good way.", effects: { karma: 6, happiness: 3 } },
      ],
    },
    {
      id: "shape-note",
      weight: 3,
      once: true,
      minAge: 13,
      text: () => "Your reflection tries on a different jaw and then apologizes in your voice. From the doorway, someone slow-claps like this is a rehearsal they run.",
      choices: [
        { label: "Try the jaw on purpose", text: "Your face becomes a suggestion. You put it back, mostly.", special: { kind: "grant", comboId: "shape-shifting" }, effects: { happiness: 2, looks: 1 } },
        { label: "Ask them to coach it", text: "They bow, which is unnecessary and perfect, and give you a name.", special: { kind: "meetHero", heroId: "kade" }, effects: { happiness: 2 } },
        { label: "Look away", text: "The mirror behaves. You don't trust it for a week.", effects: { happiness: -1 } },
      ],
    },
    {
      id: "spark-menu",
      weight: 4,
      minAge: 15,
      text: () => "Under a butcher shop, a menu board lists sparks the way other places list soup. Ice. Lightning. Weather. None of them are legal. All of them hum.",
      choices: [
        { label: "Buy the ice", text: "It costs more than groceries and less than a conscience, which is the pitch.", special: { kind: "grant", comboId: "ice-control" }, effects: { money: -700, karma: -4 } },
        { label: "Buy the lightning", text: "The jar ticks. Your name gets written in a book that is not a metaphor.", special: { kind: "grant", comboId: "lightning-control" }, effects: { money: -700, karma: -4 } },
        { label: "Buy the weather", text: "You leave damper and more employable by the wrong people.", special: { kind: "grant", comboId: "weather" }, effects: { money: -900, karma: -5 } },
        { label: "Tip the League instead", text: "You walk out and make a call. The raid misses. The intention doesn't.", effects: { karma: 5, reputation: 2, fame: 1 } },
      ],
    },
    {
      id: "receipt-offer", offCanon: true,
      weight: 4,
      minAge: 15,
      maxKarma: -6,
      once: true,
      text: () => "A woman who introduces herself as The Receipt slides a card across a table that isn't hers. 'I train people the League won't. I also keep the invoice.'",
      choices: [
        { label: "Take the card", text: "The card is blank until you want it not to be. She is in your phone, unfortunately.", special: { kind: "meetHero", heroId: "lark" }, effects: { karma: -3, fame: 1 } },
        { label: "Buy one ugly trick", text: "She sells you a way to not be seen. The receipt will find you later.", special: { kind: "grant", comboId: "invisibility" }, effects: { money: -500, karma: -6 } },
        { label: "Pay for the coffee and go", text: "You leave a tip big enough to be an apology. She keeps the card.", effects: { money: -20, karma: 3 } },
      ],
    },
    {
      id: "crew-heat-night",
      weight: 4,
      minAge: 15,
      needsCrew: true,
      text: (g) => `A detective who drinks like it's research asks about ${g.crew?.name ?? "your people"} by name. The name was not supposed to have reached a person with a badge.`,
      choices: [
        { label: "Play dumb", text: "You are convincing. The detective writes 'charming' and means 'later.'", effects: { karma: -1, smarts: 1 }, special: { kind: "crewTouch", heat: -8, loyalty: 2 } },
        { label: "Feed them a rival", text: "You donate someone else's crime. It works. You are worse.", effects: { karma: -6, fame: 1 }, special: { kind: "crewTouch", heat: -18, loyalty: -4 } },
        { label: "Confess a small piece", text: "You give them a true scrap. The crew will hear you were soft. The bar hears you were not only soft.", effects: { karma: 6, reputation: 2 }, special: { kind: "crewTouch", heat: -10, loyalty: -8 } },
      ],
    },
    {
      id: "crew-cut-fight",
      weight: 4,
      minAge: 15,
      needsCrew: true,
      requires: (g) => (g.crew?.members.length ?? 0) > 0,
      text: (g) => {
        const who = g.crew?.members[0]?.alias ?? "Your hire";
        return `${who} wants a fatter cut and says it in front of the others, which is a choice about you as much as the money.`;
      },
      choices: [
        { label: "Pay them", text: "The room unclenches. Your wallet does the opposite.", effects: { money: -450, karma: -1 }, special: { kind: "crewTouch", heat: 0, loyalty: 14 } },
        { label: "Stare them down", text: "You win the stare. You spend some loyalty doing it.", effects: { fame: 1, karma: -2 }, special: { kind: "crewTouch", heat: 4, loyalty: -8 } },
        { label: "Cut them loose", text: "You end it in public. The rest take notes of two different kinds.", effects: { karma: -3, happiness: -1 }, special: { kind: "crewTouch", heat: -4, loyalty: -6, blame: true } },
      ],
    },
    {
      id: "flip-crew",
      weight: 3,
      minAge: 16,
      needsCrew: true,
      minFame: 8,
      text: (g) => `A hero you half-trust asks you to walk ${g.crew?.name ?? "the crew"} into a quiet arrest. They say the city will print you as complicated instead of guilty.`,
      choices: [
        { label: "Hand them the ledger", text: "Sirens, eventually. Your name gets a cleaner sentence and a shorter friends list.", effects: { karma: 12, reputation: 8, fame: 2, happiness: -4 }, flags: { disbandCrew: 1 } },
        { label: "Warn the crew", text: "You choose the jackets over the headline. They will remember which way you leaned.", effects: { karma: -6, happiness: 2 }, special: { kind: "crewTouch", heat: 8, loyalty: 12 } },
        { label: "Play both", text: "You give a time and a wrong door. Nobody is fully grateful.", effects: { karma: -2, money: 600, smarts: 1 }, special: { kind: "crewTouch", heat: 6, loyalty: -4 } },
      ],
    },
    {
      id: "witness-stair",
      weight: 4,
      minAge: 14,
      text: () => "You see a mugging start in a stairwell that smells like coins. Three outcomes are already writing themselves, and one of them is you walking.",
      choices: [
        { label: "Stop it", text: "You stop it ugly and fast. The victim squeezes your wrist once, which is a whole speech.", effects: { karma: 8, reputation: 3, health: -3, happiness: 3, fame: 1 } },
        { label: "Take a cut to look away", text: "The mugger is a businessman tonight. So are you. The stairwell keeps it.", effects: { karma: -9, money: 280, happiness: -2 } },
        { label: "Film it", text: "The clip does numbers. The person in it does not get their bag back.", effects: { fame: 4, karma: -5, happiness: -2 } },
        { label: "Call it in and stay", text: "You are a witness with a spine. The report is boring. You like you better.", effects: { karma: 5, reputation: 2, happiness: 1 } },
      ],
    },
    {
      id: "same-night",
      weight: 4,
      minAge: 15,
      text: (g) => `The same hour offers a burning laundromat and ${g.crew ? `a score ${g.crew.name} already cased` : "a bag of cash with nobody's name on it"}. You do not get to be in two places. You do get to pick who you are.`,
      choices: [
        { label: "The fire", text: "You pull people out of steam and bad timing. The money, wherever it was, becomes someone else's myth.", effects: { karma: 9, reputation: 4, fame: 2, health: -4, happiness: 3 } },
        { label: "The money", text: "You choose the bag. Somewhere, a shirt finishes becoming ash without you.", effects: { karma: -10, money: 1400, happiness: -2, fame: 1 } },
        { label: "Split the hour badly", text: "You do a little of both and finish neither. A person still thanks you. The cash is damp.", effects: { karma: 2, money: 200, health: -2, happiness: 1 } },
      ],
    },
    {
      id: "press-the-bar",
      weight: 3,
      minAge: 16,
      minFame: 10,
      text: (g) => `A profile asks where you sit on the city's good-and-evil bar. They have already picked a photo. Right now the photo would be captioned '${g.stats.karma >= 20 ? "saint, allegedly" : g.stats.karma <= -20 ? "villain, pending" : "undecided, on purpose"}.'`,
      choices: [
        { label: "Claim the light", text: "You say the decent version out loud until you almost believe it. The bar hears you.", effects: { karma: 6, reputation: 4, fame: 1 } },
        { label: "Claim the dark", text: "You let them print the scary sentence. It is useful. It is also true enough.", effects: { karma: -7, fame: 5, reputation: -3 }, flags: { villainMask: 1 } },
        { label: "Refuse the frame", text: "You talk about rent and bus routes until they get bored. A small victory.", effects: { karma: 1, happiness: 2, smarts: 1 } },
      ],
    },
    {
      id: "rival-tags",
      weight: 3,
      minAge: 15,
      needsCrew: true,
      text: (g) => `Another crew paints over ${g.crew?.name ?? "your"} mark with a ruder one. The block is waiting to see if you are a brand or a threat.`,
      choices: [
        { label: "Paint it back, louder", text: "You answer in color. The city enjoys the episode too much.", effects: { fame: 3, karma: -3 }, special: { kind: "crewTouch", heat: 12, loyalty: 6 } },
        { label: "Have a conversation with fists", text: "It ends with a deal nobody likes and a respect that might be fear.", effects: { health: -5, karma: -4, happiness: 1 }, special: { kind: "crewTouch", heat: 8, loyalty: 8 } },
        { label: "Let the tag fade", text: "You choose not to be bait. One of yours calls it soft. They are not entirely wrong.", effects: { karma: 3, happiness: -1 }, special: { kind: "crewTouch", heat: -6, loyalty: -6 } },
      ],
    },
    {
      id: "kid-spark",
      weight: 3,
      minAge: 16,
      text: () => "A kid behind a bodega is accidentally on fire in a way that isn't spreading. They look at you like you are the instructions.",
      choices: [
        { label: "Teach them control", text: "You spend the hour on breathing and not on glory. The fire sits down.", effects: { karma: 7, happiness: 4, reputation: 2, powerLevel: 0.05 } },
        { label: "Recruit the spark", text: "You offer a future that is mostly your future. They are too young. You know that.", effects: { karma: -8, fame: 2, happiness: -2 } },
        { label: "Call a real teacher", text: "You hand the kid to someone with a mat and a conscience.", special: { kind: "meetHero", heroId: "wren" }, effects: { karma: 4, happiness: 2 } },
      ],
    },
    {
      id: "oath-roof",
      weight: 3,
      minAge: 16,
      minKarma: 12,
      once: true,
      text: () => "A small crowd on a roof wants you to say, out loud, what you will not do. The phones are up. The bar is listening harder than the phones.",
      choices: [
        { label: "Swear it", text: "You name the lines you won't cross. The city writes them down. So do you.", effects: { karma: 8, reputation: 5, fame: 2, happiness: 2 }, flags: { heroOath: 1 } },
        { label: "Swear a smaller version", text: "You promise to try. It is less quotable and more true.", effects: { karma: 4, reputation: 2, happiness: 2 } },
        { label: "Leave before the speech", text: "You are not ready to be a sentence. The crowd forgives you less than you hoped.", effects: { fame: -1, happiness: -1 } },
      ],
    },
    {
      id: "mask-on",
      weight: 3,
      minAge: 16,
      maxKarma: -12,
      once: true,
      text: () => "A villain with better tailoring than you offers a public mask: say the quiet part, get the fear discount, stop pretending the bar is a mystery.",
      choices: [
        { label: "Put the mask on", text: "You say it where it will be quoted. Work gets easier. Mirrors get worse.", effects: { karma: -8, fame: 6, reputation: -6, happiness: 1 }, flags: { villainMask: 1 } },
        { label: "Take their money, not the name", text: "A stipend for staying deniable. You are, in fact, denied by your own story.", effects: { money: 2000, karma: -5, reputation: -2 } },
        { label: "Laugh and leave", text: "You keep the option and lose the discount. It feels like a spine.", effects: { karma: 3, happiness: 2 } },
      ],
    },
    {
      id: "wren-clinic",
      weight: 3,
      once: true,
      minAge: 12,
      text: () => "Someone is sitting with strangers in a clinic hallway, hearing the things people don't say out loud, and not using any of it. They look up like you were the appointment.",
      choices: [
        { label: "Sit with them", text: "You leave with a name and the sense that you were evaluated kindly.", special: { kind: "meetHero", heroId: "wren" }, effects: { karma: 2, happiness: 2 } },
        { label: "Ask to hear less", text: "They teach you a door for other people's thoughts. It has a lock.", special: { kind: "grant", comboId: "telepathy" }, effects: { smarts: 1, happiness: -1 } },
        { label: "Keep walking", text: "The hallway goes back to being a hallway.", effects: { happiness: 0 } },
      ],
    },
    {
      id: "marrow-alley",
      weight: 3,
      once: true,
      minAge: 14,
      text: () => "A wall has a person-shaped dent and the person is standing in front of it, unbothered, eating a sandwich. They offer the trick of not minding the dent.",
      choices: [
        { label: "Learn to take the hit", text: "You let a trash lid bounce off you. It is undignified and educational.", special: { kind: "grant", comboId: "super-durability" }, effects: { health: 2, happiness: 1 } },
        { label: "Ask them to drill it", text: "They grunt, which is a yes, and a syllabus.", special: { kind: "meetHero", heroId: "marrow" }, effects: { happiness: 1 } },
        { label: "Buy them a second sandwich", text: "They accept. No lesson. A tiny, stubborn warmth.", effects: { money: -12, karma: 2, happiness: 2 } },
      ],
    },
  ];
}

function originMoments(): EventDef[] {
  return [
    {
      id: "nyc-platform",
      weight: 6,
      minAge: 11,
      once: true,
      cities: ["nyc"],
      text: () => "The subway holds between stations. A kid is crying, a train is not, and someone in a good coat is going through bags like it's a job.",
      choices: [
        { label: "Stand in the aisle", text: "You make a wall out of yourself. The coat leaves at the next stop. The kid does not.", effects: { karma: 5, reputation: 2, happiness: 2 } },
        { label: "Follow the coat upstairs", text: "You come up into a street that already knows this trick. So does a runner who was waiting.", special: { kind: "meetHero", heroId: "juniper" }, effects: { fame: 1 } },
        { label: "Mind your own commute", text: "The doors open. You are on time and a little worse.", effects: { karma: -3, happiness: -2 } },
      ],
    },
    {
      id: "nyc-roof",
      weight: 5,
      minAge: 13,
      minFame: 8,
      cities: ["nyc"],
      text: () => "A water tower has a better view of a landmark than the postcard does. Someone is already up there, timing a jump between roofs.",
      choices: [
        { label: "Jump with them", text: "You make the gap. The city, briefly, is a board game.", effects: { fame: 2, happiness: 2, health: -2 } },
        { label: "Ask who they run from", text: "They name a problem with a train schedule. You get a person, not a poster.", special: { kind: "meet", side: "hero" }, effects: { smarts: 1 } },
        { label: "Call it trespassing", text: "You take the stairs. The stairs take longer and judge you less.", effects: { karma: 1 } },
      ],
    },
    {
      id: "hood-corner",
      weight: 6,
      minAge: 10,
      once: true,
      cities: ["hood"],
      text: () => "The corner store is short a cashier and long a problem. Somebody's auntie looks at you like you already live here, which you do.",
      choices: [
        { label: "Watch the door", text: "You stand where she points. Nothing heroic happens. The tab gets a little kinder.", effects: { karma: 4, happiness: 2, reputation: 1 } },
        { label: "Ask who is leaning on the block", text: "She gives you a name you will hear again, and a sandwich you didn't pay for.", special: { kind: "meet", side: "villain" }, effects: { karma: 1, happiness: 1 } },
        { label: "Take what's unattended", text: "You eat. The block files it under who you are.", effects: { karma: -5, happiness: 1, money: 15 } },
      ],
    },
    {
      id: "hood-jacket",
      weight: 5,
      minAge: 14,
      maxKarma: 25,
      cities: ["hood"],
      text: () => "A jacket with no logo offers you a corner, a cut, and the sentence 'we don't do capes, we do ours.' The stoop is listening.",
      choices: [
        { label: "Hear the cut", text: "You listen long enough to know the price of belonging. It is not money.", effects: { karma: -4, smarts: 1, happiness: 1 } },
        { label: "Put the sandwich people first", text: "You say no in front of the stoop. Someone nods like that was the test.", effects: { karma: 4, reputation: 2 } },
        { label: "Ask Marrow's kind of question", text: "You want to know who gets hurt. A bruiser on the block respects the question.", special: { kind: "meetHero", heroId: "marrow" }, effects: { karma: 1 } },
      ],
    },
    {
      id: "stacks-yard",
      weight: 6,
      minAge: 12,
      once: true,
      cities: ["stacks"],
      text: () => "The yard whistle blows over people clocking out on arms they don't own. A work lamp, not a sign, is the only light. Someone is jacked into a terminal in the boiler room.",
      choices: [
        { label: "Stand the picket", text: "You hold a sign until your hands complain. The fence does not move. You do, a little.", effects: { karma: 5, happiness: 1, reputation: 1 } },
        { label: "Jack the terminal", text: "You take a payroll ghost and a headache. The class line gets a crack, and so does your story.", effects: { smarts: 3, karma: -3, money: 200 } },
        { label: "Ask who services the arms", text: "A cold voice offers a diagram instead of a speech. That is Dr. Quill's idea of kindness.", special: { kind: "meetHero", heroId: "idris" }, effects: { smarts: 1 } },
      ],
    },
    {
      id: "stacks-badge",
      weight: 5,
      minAge: 15,
      cities: ["stacks"],
      text: () => "A corp badge opens a door your name never will. The person wearing it offers you a shift, a secret, or a bill.",
      choices: [
        { label: "Take the shift", text: "You learn the door. You also learn what the fence is for.", effects: { money: 350, smarts: 1, karma: -1 } },
        { label: "Steal the pattern, not the badge", text: "You leave with a map of who gets searched. Useful. Unkind.", effects: { smarts: 2, karma: -2 } },
        { label: "Tear the offer up", text: "The badge does not like being refused. You like your hands.", effects: { karma: 3, happiness: 1, reputation: -1 } },
      ],
    },
    {
      id: "secret-lens",
      weight: 5,
      minAge: 14,
      minFame: 18,
      once: true,
      requires: (g) => hasTrait(g, "secret"),
      text: () => "A lens caught the jaw under the mask. The post is drafted. Your kitchen has not seen it yet.",
      choices: [
        { label: "Kill the photo", text: "You spend the month being nobody. The photo dies. The habit doesn't.", effects: { fame: -2, happiness: -1, karma: 1 } },
        { label: "Let it run", text: "The mask comes off in public. Loud is not a mood anymore. It is the file.", effects: { fame: 6, happiness: -2 }, special: { kind: "retitle", drop: "secret", add: "loud" } },
        { label: "Blame a lookalike", text: "It works, barely. You are worse, and still hidden.", effects: { karma: -4, fame: 1 } },
      ],
    },
    {
      id: "loud-mic",
      weight: 5,
      minAge: 12,
      minFame: 10,
      once: true,
      requires: (g) => hasTrait(g, "loud"),
      text: (g) => `A mic on a corner in ${g.city} wants the hero who already said the quiet part out loud. They have your name on a card.`,
      choices: [
        { label: "Take the mic", text: "You give them a sentence the villains can quote. The crowd is fed. So is the target on you.", effects: { fame: 4, reputation: 1, happiness: 1 } },
        { label: "Talk about the block, not yourself", text: "You point the mic at a problem. Less brand. More use.", effects: { karma: 3, reputation: 2, fame: 1 } },
        { label: "Walk off", text: "The card stays. You don't. Someone calls it a tease.", effects: { fame: 1, happiness: -1 } },
      ],
    },
    {
      id: "alien-sky",
      weight: 5,
      minAge: 8,
      once: true,
      requires: (g) => g.upbringing === "alien",
      text: () => "The sky does a color this city doesn't have a word for. For a second you know the word, and you are terribly homesick.",
      choices: [
        { label: "Say the word out loud", text: "A stranger repeats it wrong and kindly. You are less alone by an inch.", effects: { happiness: 3, smarts: 1 } },
        { label: "Hide it", text: "You swallow the word. The sky goes back to being local.", effects: { happiness: -2, karma: 0 } },
        { label: "Ask if anyone else saw it", text: "One person did. They don't want a headline. They want to know if you're staying.", effects: { happiness: 2, reputation: 1 } },
      ],
    },
    {
      id: "tragic-date",
      weight: 5,
      minAge: 10,
      once: true,
      requires: (g) => g.upbringing === "tragic",
      text: () => "The date comes around. Someone left flowers where you usually only leave the sentence you don't finish.",
      choices: [
        { label: "Stay until the flowers make sense", text: "You don't fix it. You don't leave early. That is the whole heroism.", effects: { happiness: 2, karma: 2 } },
        { label: "Go looking for who did it", text: "Grief puts on boots. You find a name that is not the right one, and you know it.", effects: { karma: -3, happiness: -1, fame: 1 } },
        { label: "Work so you don't feel it", text: "The shift is clean. The date is not fooled.", effects: { money: 40, happiness: -2 } },
      ],
    },
    {
      id: "street-roof",
      weight: 5,
      minAge: 12,
      once: true,
      requires: (g) => g.upbringing === "street",
      text: () => "A stairwell you used to sleep in has a new lock and a kid using the old trick. They look at you like a warning label.",
      choices: [
        { label: "Show them the safer roof", text: "You spend the night being a map. They will remember the map.", effects: { karma: 5, happiness: 2 } },
        { label: "Charge them for the trick", text: "You were owed. They are you, smaller. The money is ugly.", effects: { money: 60, karma: -4 } },
        { label: "Leave the door wedged", text: "A small crime against a lock. A smaller kindness.", effects: { karma: 2, happiness: 1 } },
      ],
    },
    {
      id: "program-file",
      weight: 5,
      minAge: 13,
      once: true,
      requires: (g) => g.upbringing === "program",
      text: () => "A file with your childhood name surfaces in a drawer that should have been burned. The handwriting is familiar. The conclusions are not kind.",
      choices: [
        { label: "Read all of it", text: "You were a hypothesis. You finish the page anyway.", effects: { smarts: 2, happiness: -2 } },
        { label: "Burn the copy", text: "Ash is not the same as gone. You sleep slightly better.", effects: { happiness: 2, karma: 1 } },
        { label: "Send it to someone who can use it", text: "A scientist's number gets a past they didn't ask for. They answer.", special: { kind: "meetHero", heroId: "idris" }, effects: { smarts: 1 } },
      ],
    },
    {
      id: "normal-dinner",
      weight: 4,
      minAge: 8,
      once: true,
      requires: (g) => g.upbringing === "normal",
      text: () => "Dinner is ordinary on purpose. Someone asks you to be ordinary for one evening, and they mean it as love.",
      choices: [
        { label: "Pass the potatoes", text: "You do the small thing. It counts more than a rescue would have.", effects: { happiness: 3, karma: 1 } },
        { label: "Check the window anyway", text: "You love them and you still watch the street. They notice both.", effects: { happiness: 1, reputation: 1 } },
        { label: "Leave for a siren", text: "The siren is real. So is the plate you didn't finish.", effects: { karma: 2, happiness: -1, fame: 1 } },
      ],
    },
  ];
}
