import type { PowerId, UpbringingId } from "./types";

export interface PowerDef {
  id: PowerId;
  name: string;
  rarity: "common" | "uncommon" | "rare";
  weight: number;
  hue: "cape" | "gold" | "spark";
  tagline: string;
  strength: string;
  weakness: string;
  abilities: { at: number; name: string; blurb: string }[];
}

export const POWERS: PowerDef[] = [
  {
    id: "strength",
    name: "Super Strength",
    rarity: "common",
    weight: 10,
    hue: "cape",
    tagline: "Doors, doubts, and compact cars are all suggestions.",
    strength: "You can put a problem down. Literally.",
    weakness: "Fine control is a rumor. Jars, handshakes, and doorknobs suffer.",
    abilities: [
      { at: 2, name: "Iron Grip", blurb: "Nothing leaves your hand unless you file the paperwork." },
      { at: 5, name: "Shockwave", blurb: "A clap that rearranges furniture and arguments." },
      { at: 8, name: "Atlas Hold", blurb: "You can put the bus back. And the street under it." },
    ],
  },
  {
    id: "flight",
    name: "Flight",
    rarity: "common",
    weight: 10,
    hue: "spark",
    tagline: "Stairs file a complaint and lose.",
    strength: "The city is a map you can fold.",
    weakness: "Wind, birds, and nothing to brace against when you sneeze.",
    abilities: [
      { at: 2, name: "Hover", blurb: "Six inches off every problem." },
      { at: 5, name: "Cloud Break", blurb: "Weather becomes a hallway." },
      { at: 8, name: "Orbital Courtesy", blurb: "You wave at planes from the cheap seats above them." },
    ],
  },
  {
    id: "blasts",
    name: "Energy Blasts",
    rarity: "common",
    weight: 9,
    hue: "gold",
    tagline: "Your hands have opinions and they are loud.",
    strength: "Range. Drama. Industrial applications.",
    weakness: "Friendly fire, singed sleeves, and a utility bill that fears you.",
    abilities: [
      { at: 2, name: "Spark Shot", blurb: "A warning that leaves a scorch mark." },
      { at: 5, name: "Focused Lance", blurb: "You can write your name on a steel door." },
      { at: 8, name: "Nova Bracket", blurb: "The League makes you sign a form. In triplicate." },
    ],
  },
  {
    id: "speed",
    name: "Super Speed",
    rarity: "common",
    weight: 10,
    hue: "spark",
    tagline: "Everyone else is buffering.",
    strength: "You get there. You also get the coffee.",
    weakness: "Friction, boredom, and conversations that take years.",
    abilities: [
      { at: 2, name: "Catch the Toast", blurb: "Butter-side up, most days." },
      { at: 5, name: "Street Blur", blurb: "Crosswalks are a personal insult." },
      { at: 8, name: "Stopwatch Heresy", blurb: "A second is a room you can walk around in." },
    ],
  },
  {
    id: "telekinesis",
    name: "Telekinesis",
    rarity: "uncommon",
    weight: 6,
    hue: "spark",
    tagline: "The room works for you, resentfully.",
    strength: "Precision at a distance. Great for surgery and grudges.",
    weakness: "Headaches, and anything heavier than your concentration.",
    abilities: [
      { at: 2, name: "Float the Keys", blurb: "You never lose them. They lose you." },
      { at: 5, name: "A Dozen Hands", blurb: "Multitasking, but rude." },
      { at: 8, name: "Puppet Room", blurb: "Furniture takes direction." },
    ],
  },
  {
    id: "invisibility",
    name: "Invisibility",
    rarity: "rare",
    weight: 3,
    hue: "spark",
    tagline: "You are a rumor with shoes.",
    strength: "Doors open for people who aren't there.",
    weakness: "You still make sound, smell like lunch, and trip on cats.",
    abilities: [
      { at: 2, name: "Soft Outline", blurb: "Hard to look at. Easy to bump into." },
      { at: 5, name: "Gone", blurb: "Cameras file a missing-person report." },
      { at: 8, name: "Take the Light", blurb: "A small dark you can fold around a friend." },
    ],
  },
  {
    id: "fire",
    name: "Fire Control",
    rarity: "common",
    weight: 8,
    hue: "cape",
    tagline: "You run warm. So does the drapery.",
    strength: "Heat is a tool, a kitchen, and a closing argument.",
    weakness: "Sprinklers, smoke alarms, and your own eyebrows.",
    abilities: [
      { at: 2, name: "Palm Lighter", blurb: "Birthdays become tactical." },
      { at: 5, name: "Room Temperature", blurb: "You negotiate with winter." },
      { at: 8, name: "Controlled Inferno", blurb: "A wall of no, shaped like you." },
    ],
  },
  {
    id: "ice",
    name: "Ice Control",
    rarity: "uncommon",
    weight: 6,
    hue: "spark",
    tagline: "You arrive early and slightly frosted.",
    strength: "Barriers, bridges, and the last word.",
    weakness: "Slips, humidity, and anyone with a good heater.",
    abilities: [
      { at: 2, name: "Frost the Glass", blurb: "A signature nobody asked for." },
      { at: 5, name: "Winter Wall", blurb: "Personal space, architectural edition." },
      { at: 8, name: "Polite Whiteout", blurb: "The block takes a snow day because you said so." },
    ],
  },
  {
    id: "healing",
    name: "Healing",
    rarity: "uncommon",
    weight: 6,
    hue: "gold",
    tagline: "You are the person they call after the explosion, not before.",
    strength: "You put people back together. Sometimes yourself.",
    weakness: "You feel the hurt on the way through. You cannot fix stupid.",
    abilities: [
      { at: 2, name: "Knit a Cut", blurb: "Bandages get jealous." },
      { at: 5, name: "Stabilize", blurb: "You hold the line between bad and worse." },
      { at: 8, name: "Bad Tuesday", blurb: "You can drag someone back from a very bad Tuesday." },
    ],
  },
  {
    id: "mind",
    name: "Mind Control",
    rarity: "rare",
    weight: 3,
    hue: "spark",
    tagline: "People agree with you and then wonder why.",
    strength: "A room can change its mind.",
    weakness: "Ethics, migraines, and anyone who already knows the trick.",
    abilities: [
      { at: 2, name: "Nudge", blurb: "A mood, slightly relocated." },
      { at: 5, name: "Quiet Talk", blurb: "A conversation with the sound off." },
      { at: 8, name: "The Room Agrees", blurb: "Temporarily. Always temporarily." },
    ],
  },
  {
    id: "shapeshift",
    name: "Shape-shifting",
    rarity: "rare",
    weight: 3,
    hue: "gold",
    tagline: "Your face is a group project.",
    strength: "Doors, roles, and bad photo days cannot catch you.",
    weakness: "Mirrors, muscle memory, and forgetting which jaw is yours.",
    abilities: [
      { at: 2, name: "Face Tweak", blurb: "A better angle, structurally." },
      { at: 5, name: "Full Costume", blurb: "Including the bones. Especially the bones." },
      { at: 8, name: "Anyone", blurb: "For a little while. Long enough." },
    ],
  },
  {
    id: "forcefield",
    name: "Force Fields",
    rarity: "uncommon",
    weight: 6,
    hue: "spark",
    tagline: "You are a polite wall.",
    strength: "Nothing gets in. Sometimes that's the problem.",
    weakness: "Air, sound, and the social cost of a bubble.",
    abilities: [
      { at: 2, name: "Personal Bubble", blurb: "Finally, a boundary with physics." },
      { at: 5, name: "Dome", blurb: "The picnic is cancelled. The meteor isn't." },
      { at: 8, name: "Block Closed", blurb: "You decide when the street is finished." },
    ],
  },
  {
    id: "intellect",
    name: "Super Intelligence",
    rarity: "rare",
    weight: 3,
    hue: "gold",
    tagline: "You see the week before it happens, and it is disappointing.",
    strength: "Plans, patents, and the trap inside the trap.",
    weakness: "Your body is still a regular body. Insomnia is undefeated.",
    abilities: [
      { at: 2, name: "Pattern Sight", blurb: "The trick is obvious. You hate that." },
      { at: 5, name: "Ten Steps Ahead", blurb: "You are bored by step four." },
      { at: 8, name: "Preview of the Week", blurb: "You can spoil Thursday." },
    ],
  },
  {
    id: "elastic",
    name: "Elasticity",
    rarity: "uncommon",
    weight: 5,
    hue: "cape",
    tagline: "You are a person and also, regrettably, a rope.",
    strength: "Reach, squeeze, and entries no door intended.",
    weakness: "Knots, extreme temperatures, and dignity.",
    abilities: [
      { at: 2, name: "Long Reach", blurb: "The top shelf surrenders." },
      { at: 5, name: "Around the Corner", blurb: "You attend two rooms and regret both." },
      { at: 8, name: "Parade Balloon", blurb: "Tactically ridiculous. Extremely effective." },
    ],
  },
  {
    id: "lightning",
    name: "Lightning",
    rarity: "uncommon",
    weight: 6,
    hue: "gold",
    tagline: "You are a walking weather warning.",
    strength: "Speed of light, city-grid party tricks, dramatic entrances.",
    weakness: "Water, rubber, and every phone you have ever loved.",
    abilities: [
      { at: 2, name: "Static Kiss", blurb: "Handshakes become news." },
      { at: 5, name: "Bolt", blurb: "A straight line with opinions." },
      { at: 8, name: "Grid Dancer", blurb: "Blackouts are a negotiation." },
    ],
  },
];

export function powerById(id: PowerId | null | undefined): PowerDef | undefined {
  return POWERS.find((p) => p.id === id);
}

export function rollPower(r1: number, r2: number, bias: PowerId | null): PowerDef {
  if (bias && r1 < 0.45) return powerById(bias) ?? POWERS[0];
  const total = POWERS.reduce((s, p) => s + p.weight, 0);
  let x = r2 * total;
  for (const p of POWERS) {
    x -= p.weight;
    if (x <= 0) return p;
  }
  return POWERS[0];
}

const FUSION: Record<string, string> = {
  "fire+flight": "Comet",
  "ice+flight": "Whiteout",
  "lightning+flight": "Stormfront",
  "strength+blasts": "Cannonball",
  "strength+speed": "Freight",
  "speed+intellect": "Flash Theory",
  "healing+mind": "Saint Static",
  "invisibility+shapeshift": "Nobody",
  "fire+ice": "Thermal Joke",
  "telekinesis+forcefield": "Closed Room",
  "elastic+strength": "Wrecking Ribbon",
  "mind+invisibility": "Unthought",
  "blasts+lightning": "Gridlock",
  "healing+fire": "Cauter",
  "speed+flight": "Slipstream",
  "forcefield+blasts": "Bouncing Ruin",
  "shapeshift+mind": "Borrowed Face",
  "intellect+forcefield": "Proof",
  "telekinesis+flight": "Puppet Sky",
  "ice+strength": "Glacier Fist",
};

export function fusionTitle(a: PowerId, b: PowerId): string {
  return FUSION[`${a}+${b}`] ?? FUSION[`${b}+${a}`] ?? `${powerById(a)?.name ?? "Gift"} + ${powerById(b)?.name ?? "Gift"}`;
}

export interface SchoolDef {
  id: string;
  name: string;
  tier: number;
  minAge: number;
  maxAge: number;
  minPL: number;
  minBelief: number;
  minSmarts: number;
  powers?: PowerId[];
  tuition: number;
  blurb: string;
  yearly: { smarts?: number; powerLevel?: number; fame?: number; happiness?: number; reputation?: number };
}

export const SCHOOLS: SchoolDef[] = [
  {
    id: "rec",
    name: "Rec Center Hero Hour",
    tier: 1,
    minAge: 7,
    maxAge: 17,
    minPL: 1,
    minBelief: 0,
    minSmarts: 0,
    tuition: 0,
    blurb: "Folding chairs, one cracked mat, and a coach who used to be somebody.",
    yearly: { smarts: 2, powerLevel: 0.14, happiness: 2 },
  },
  {
    id: "metro",
    name: "Metro Youth Academy",
    tier: 2,
    minAge: 10,
    maxAge: 18,
    minPL: 3,
    minBelief: 30,
    minSmarts: 30,
    tuition: 1800,
    blurb: "A converted armory with a cafeteria that slaps, allegedly.",
    yearly: { smarts: 4, powerLevel: 0.2, fame: 2, happiness: 1 },
  },
  {
    id: "apex",
    name: "Apex Institute",
    tier: 3,
    minAge: 13,
    maxAge: 19,
    minPL: 5,
    minBelief: 45,
    minSmarts: 48,
    tuition: 6400,
    blurb: "If your folks won't sign, the admissions gargoyle will ask why.",
    yearly: { smarts: 6, powerLevel: 0.26, fame: 4, happiness: -1 },
  },
  {
    id: "helios",
    name: "Helios International",
    tier: 4,
    minAge: 18,
    maxAge: 26,
    minPL: 5.5,
    minBelief: 20,
    minSmarts: 58,
    tuition: 12000,
    blurb: "Orbital campus on Tuesdays. Missing the shuttle is a transcript note.",
    yearly: { smarts: 7, powerLevel: 0.3, fame: 6, happiness: 1 },
  },
  {
    id: "blackwell",
    name: "Blackwell Night School",
    tier: 2,
    minAge: 14,
    maxAge: 40,
    minPL: 2,
    minBelief: 0,
    minSmarts: 20,
    tuition: 900,
    blurb: "Nobody asks about the scorch marks. That is the brochure.",
    yearly: { smarts: 2, powerLevel: 0.22, reputation: -4, happiness: 1 },
  },
  {
    id: "caduceus",
    name: "Caduceus Conservatory",
    tier: 3,
    minAge: 16,
    maxAge: 30,
    minPL: 2,
    minBelief: 10,
    minSmarts: 55,
    powers: ["healing", "intellect", "telekinesis"],
    tuition: 4200,
    blurb: "For people who mop up what the other schools set on fire.",
    yearly: { smarts: 8, powerLevel: 0.16, reputation: 4 },
  },
];

export function schoolById(id: string | null | undefined): SchoolDef | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

export interface JobDef {
  id: string;
  name: string;
  blurb: string;
  minAge: number;
  minPL: number;
  minSmarts: number;
  minLooks: number;
  minFame: number;
  powers?: PowerId[];
  pay: number;
  stress: number;
  fame: number;
  rep: number;
}

export const JOBS: JobDef[] = [
  { id: "retail", name: "Shelf Life Mart", blurb: "You fold capes that are not yours and smile like it was your idea.", minAge: 16, minPL: 0, minSmarts: 0, minLooks: 0, minFame: 0, pay: 22000, stress: -1, fame: 0, rep: 0 },
  { id: "cafe", name: "Cup & Cowl", blurb: "Foam art, regulars, and one stool that is definitely cursed.", minAge: 15, minPL: 0, minSmarts: 0, minLooks: 0, minFame: 0, pay: 20000, stress: 2, fame: 0, rep: 1 },
  { id: "office", name: "Bureau of Normal", blurb: "Spreadsheets. A dress code. Nobody may levitate in the break room.", minAge: 18, minPL: 0, minSmarts: 40, minLooks: 0, minFame: 0, pay: 42000, stress: -2, fame: 0, rep: 0 },
  { id: "teacher", name: "Public School", blurb: "You teach fractions and, accidentally, courage.", minAge: 22, minPL: 0, minSmarts: 62, minLooks: 0, minFame: 0, pay: 46000, stress: -1, fame: 1, rep: 3 },
  { id: "influencer", name: "Sponsored Existence", blurb: "You narrate breakfast like it owes you rent.", minAge: 16, minPL: 0, minSmarts: 0, minLooks: 55, minFame: 0, pay: 16000, stress: 1, fame: 4, rep: 0 },
  { id: "journalist", name: "City Herald", blurb: "You write the truth. The headline writes itself, badly.", minAge: 18, minPL: 0, minSmarts: 52, minLooks: 0, minFame: 0, pay: 38000, stress: -1, fame: 3, rep: 1 },
  { id: "paramedic", name: "Siren Co.", blurb: "You arrive when the night has already made a decision.", minAge: 18, minPL: 0, minSmarts: 40, minLooks: 0, minFame: 0, pay: 44000, stress: -3, fame: 1, rep: 3 },
  { id: "construction", name: "Cape Construction", blurb: "Beams, hard hats, and a foreman named Dolly who fears nothing.", minAge: 16, minPL: 1, minSmarts: 0, minLooks: 0, minFame: 0, powers: ["strength", "telekinesis", "elastic"], pay: 48000, stress: -2, fame: 0, rep: 1 },
  { id: "demolition", name: "Soft Landing Demo", blurb: "They pay you to break things the correct amount.", minAge: 18, minPL: 3, minSmarts: 20, minLooks: 0, minFame: 0, powers: ["strength", "blasts", "fire", "lightning"], pay: 64000, stress: -3, fame: 1, rep: 0 },
  { id: "rescue", name: "Civic Rescue Contract", blurb: "Cats, cliffs, and the occasional embarrassed mayor.", minAge: 18, minPL: 2, minSmarts: 25, minLooks: 0, minFame: 0, powers: ["strength", "speed", "flight", "forcefield", "elastic"], pay: 56000, stress: -2, fame: 2, rep: 4 },
  { id: "courier", name: "Sky Courier", blurb: "Packages that cannot be late and should not be opened.", minAge: 16, minPL: 1, minSmarts: 0, minLooks: 0, minFame: 0, powers: ["flight", "speed"], pay: 34000, stress: -1, fame: 1, rep: 0 },
  { id: "welder", name: "Arc & Co. Welding", blurb: "You are the torch. Human resources is nervous.", minAge: 18, minPL: 2, minSmarts: 25, minLooks: 0, minFame: 0, powers: ["blasts", "lightning", "fire"], pay: 50000, stress: -2, fame: 0, rep: 1 },
  { id: "sfx", name: "Practical Magic SFX", blurb: "Film sets want your worst habit, on cue, before lunch.", minAge: 18, minPL: 2, minSmarts: 20, minLooks: 30, minFame: 0, powers: ["blasts", "fire", "ice", "shapeshift", "lightning"], pay: 42000, stress: 2, fame: 3, rep: 0 },
  { id: "grid", name: "Municipal Grid Tech", blurb: "The city runs because you argue with infrastructure.", minAge: 20, minPL: 2, minSmarts: 58, minLooks: 0, minFame: 0, powers: ["lightning", "intellect"], pay: 78000, stress: -2, fame: 1, rep: 2 },
  { id: "assembler", name: "Precision Assembly", blurb: "Tiny parts. No hands required. They still make you wear gloves.", minAge: 18, minPL: 2, minSmarts: 40, minLooks: 0, minFame: 0, powers: ["telekinesis", "elastic", "intellect"], pay: 52000, stress: -1, fame: 0, rep: 0 },
  { id: "security", name: "Quiet Floor Security", blurb: "You watch doors. Sometimes you are the door.", minAge: 18, minPL: 1, minSmarts: 20, minLooks: 0, minFame: 0, powers: ["invisibility", "shapeshift", "forcefield", "mind"], pay: 46000, stress: -1, fame: 0, rep: 1 },
  { id: "detective", name: "Lane & Lane Investigations", blurb: "Cheating spouses, missing uncles, one actual ghost (pending).", minAge: 20, minPL: 1, minSmarts: 50, minLooks: 0, minFame: 0, powers: ["invisibility", "mind", "intellect", "shapeshift"], pay: 54000, stress: -1, fame: 2, rep: 1 },
  { id: "firefighter", name: "Station 12", blurb: "They hired you for the thing you are trying not to do at dinner.", minAge: 18, minPL: 2, minSmarts: 25, minLooks: 0, minFame: 0, powers: ["fire", "ice", "strength", "flight"], pay: 52000, stress: -2, fame: 2, rep: 4 },
  { id: "chef", name: "Open Flame Supper", blurb: "A kitchen that finally matches your personality.", minAge: 16, minPL: 1, minSmarts: 15, minLooks: 0, minFame: 0, powers: ["fire", "ice"], pay: 34000, stress: 2, fame: 1, rep: 1 },
  { id: "nurse", name: "Ward C Clinic", blurb: "You fix what the capes break, then you chart it.", minAge: 20, minPL: 1, minSmarts: 55, minLooks: 0, minFame: 0, powers: ["healing", "intellect", "telekinesis"], pay: 62000, stress: -2, fame: 1, rep: 4 },
  { id: "negotiator", name: "Civic Mediation", blurb: "You talk people off ledges. Sometimes the ledge talks back.", minAge: 21, minPL: 2, minSmarts: 58, minLooks: 0, minFame: 0, powers: ["mind", "intellect"], pay: 70000, stress: -2, fame: 2, rep: -1 },
  { id: "bodyguard", name: "Close Cover", blurb: "Famous people. Bad decisions. You are the windshield.", minAge: 18, minPL: 3, minSmarts: 20, minLooks: 25, minFame: 0, powers: ["forcefield", "strength", "speed"], pay: 68000, stress: -2, fame: 3, rep: 1 },
  { id: "lab", name: "Helix Basement Lab", blurb: "Patents, noodles, and a whiteboard that has seen combat.", minAge: 20, minPL: 0, minSmarts: 64, minLooks: 0, minFame: 0, powers: ["intellect", "lightning", "healing"], pay: 84000, stress: -1, fame: 1, rep: 1 },
  { id: "reacher", name: "Confined-Space Specialists", blurb: "You are the only one who fits. You bring this up in therapy.", minAge: 18, minPL: 2, minSmarts: 20, minLooks: 0, minFame: 0, powers: ["elastic", "invisibility", "shapeshift"], pay: 45000, stress: -2, fame: 0, rep: 2 },
];

export const JOB_TITLES = ["New hire", "Regular", "Shift lead", "Supervisor", "Name on the door"];

export function jobById(id: string | null | undefined): JobDef | undefined {
  return JOBS.find((j) => j.id === id);
}

export interface TeamDef {
  id: string;
  name: string;
  blurb: string;
  prefers: PowerId[];
  minRank: number;
  minPL: number;
  allowUnpowered: boolean;
}

export const TEAMS: TeamDef[] = [
  { id: "street", name: "Block Watch", blurb: "Alley fights and lost cats. Mostly cats. The cats are winning.", prefers: ["strength", "speed", "elastic", "invisibility", "forcefield"], minRank: 1, minPL: 0, allowUnpowered: false },
  { id: "metro", name: "Metro Response", blurb: "Sirens, skyline, and a group chat that never sleeps.", prefers: ["flight", "blasts", "strength", "speed", "lightning"], minRank: 1, minPL: 2, allowUnpowered: false },
  { id: "wardens", name: "Element Wardens", blurb: "Fire, ice, storm. They keep a mop in the rafters.", prefers: ["fire", "ice", "lightning", "blasts"], minRank: 1, minPL: 2, allowUnpowered: false },
  { id: "veil", name: "Veil Unit", blurb: "The jobs that do not get a press release.", prefers: ["invisibility", "shapeshift", "mind", "telekinesis", "intellect"], minRank: 1, minPL: 2, allowUnpowered: false },
  { id: "white", name: "White Signal", blurb: "Medics, minds, and the people who read the manual.", prefers: ["healing", "intellect", "forcefield", "telekinesis"], minRank: 1, minPL: 0, allowUnpowered: true },
  { id: "vanguard", name: "Global Vanguard", blurb: "If it can end a coastline, it gets their number.", prefers: ["flight", "strength", "blasts", "speed", "forcefield", "intellect", "lightning"], minRank: 3, minPL: 6, allowUnpowered: false },
];

export function teamById(id: string | null | undefined): TeamDef | undefined {
  return TEAMS.find((t) => t.id === id);
}

export const RANKS = ["Civilian", "Rookie", "Associate", "Full Member", "Elite", "Legend", "Sentinel"];

export const STIPEND = [0, 8000, 15000, 24000, 36000, 52000, 75000];

export interface CityDef {
  id: string;
  name: string;
  flavor: string;
}

export const CITIES: CityDef[] = [
  { id: "nyc", name: "New York City", flavor: "Skyscrapers, subways, and a crime rate with its own press agent." },
  { id: "hood", name: "The Hood", flavor: "A neighborhood, not a postcard. Corners, loyalty, and problems that know your name." },
  { id: "stacks", name: "The Stacks", flavor: "A cyberpunk city that refused the neon. Corp yards, cheap augments, a fence you can trip on." },
  { id: "metro", name: "Metro City", flavor: "Capes on every billboard. Pigeons with tiny grudges." },
  { id: "harbor", name: "Harbor Bay", flavor: "Fog, ferries, and a kraken that files noise complaints." },
  { id: "neon", name: "Neon Spire", flavor: "If it does not glow, it is probably illegal." },
  { id: "dust", name: "Dustreach", flavor: "Wide skies. Wider secrets. One traffic light, and it is sorry." },
  { id: "crown", name: "Crownbridge", flavor: "Old money, older gargoyles, and a League chapter with manners." },
];

export interface UpbringingDef {
  id: UpbringingId;
  title: string;
  detail: string;
  belief: number;
  closeness: number;
  happiness: number;
  smarts: number;
  fame: number;
  money: number;
  parents: "pair" | "one" | "none" | "foster";
  parentNote: string;
  tell: string;
  tellBelief: number;
  tellHappy: number;
  tellFame?: number;
  tellSmarts?: number;
  health?: number;
  looks?: number;
  karma?: number;
}

export const UPBRINGINGS: UpbringingDef[] = [
  { id: "normal", title: "Normal kid", detail: "An ordinary house. The powers, when they come, will feel like a theft from a normal life.", belief: 70, closeness: 80, happiness: 66, smarts: 0, fame: 0, money: 1100, parents: "pair", parentNote: "Home", tell: "They ask if it hurts. Then they ask what you want for dinner. Both questions matter.", tellBelief: 10, tellHappy: 4 },
  { id: "alien", title: "Alien planet", detail: "Raised offworld, or as the offworlder in the room. Earth is the second language.", belief: 48, closeness: 60, happiness: 52, smarts: 6, fame: 2, money: 600, parents: "pair", parentNote: "Offworld", tell: "They already knew the word for it in another language. They still look frightened.", tellBelief: 8, tellHappy: 2, tellSmarts: 1, health: 3 },
  { id: "tragic", title: "Tragic parent loss", detail: "You learned one name as a date. Heroism and revenge both fit in the space it left.", belief: 40, closeness: 58, happiness: 42, smarts: 2, fame: 0, money: 700, parents: "one", parentNote: "The one left", tell: "You tell the one who is still here. They hold the news like a second loss.", tellBelief: 8, tellHappy: 3, health: -2 },
  { id: "military", title: "Military family", detail: "Raised on a base. Lights-out was a real time, and so was the siren.", belief: 55, closeness: 62, happiness: 54, smarts: 2, fame: 0, money: 1600, parents: "pair", parentNote: "Base", tell: "They want a report. Then they hug you like the report was the cover.", tellBelief: 8, tellHappy: 2, health: 6 },
  { id: "wealthy", title: "Wealthy, neglected", detail: "The house is large. The adults are a rumor with a credit line.", belief: 30, closeness: 28, happiness: 48, smarts: 2, fame: 4, money: 12000, parents: "pair", parentNote: "Staff", tell: "A staff member hears it first. Your parents get a version with the fear edited out.", tellBelief: 4, tellHappy: 1, tellFame: 1, looks: 4 },
  { id: "foster", title: "Foster care", detail: "A house that can end. You learned to pack, and to be useful before you were asked.", belief: 44, closeness: 55, happiness: 50, smarts: 3, fame: 0, money: 400, parents: "foster", parentNote: "Foster home", tell: "The house goes quiet in the good way. Someone puts a hand on the table and leaves it there.", tellBelief: 8, tellHappy: 4 },
  { id: "rural", title: "Small town", detail: "Raised where the streetlights stop. The city, whichever one, collected you later.", belief: 60, closeness: 74, happiness: 64, smarts: 0, fame: 0, money: 800, parents: "pair", parentNote: "Home", tell: "They take you outside and make you show the field. The field is less impressed than they are.", tellBelief: 8, tellHappy: 3, health: 2 },
  { id: "program", title: "Lab program", detail: "A government file had your name before a yearbook did. Bedtime came with a chart.", belief: 36, closeness: 40, happiness: 46, smarts: 10, fame: 0, money: 500, parents: "pair", parentNote: "Program", tell: "They log it. The kindness, if any, is in the handwriting.", tellBelief: 6, tellHappy: 1, tellSmarts: 2, health: -2 },
  { id: "street", title: "Street kid", detail: "You survived alone. Loyalty is a currency. So is knowing which stairwell is safe.", belief: 20, closeness: 20, happiness: 44, smarts: 4, fame: 0, money: 80, parents: "none", parentNote: "Nobody", tell: "There is no kitchen. You tell a payphone and feel ridiculous and lighter.", tellBelief: 4, tellHappy: 3, karma: -2, health: 2 },
  { id: "celebrity", title: "Celebrity child", detail: "Public before you consented. The cameras practiced on your childhood.", belief: 48, closeness: 40, happiness: 50, smarts: 0, fame: 14, money: 8000, parents: "pair", parentNote: "Public", tell: "They are already on the phone with someone who can position it. You wanted a parent.", tellBelief: 4, tellHappy: 1, tellFame: 2, looks: 8 },
  { id: "isolated", title: "Off-grid", detail: "Homeschooled, or just far. Other children were a story someone told you.", belief: 50, closeness: 70, happiness: 56, smarts: 8, fame: 0, money: 300, parents: "pair", parentNote: "Off-grid", tell: "You tell them at the table that doesn't face a road. They believe you. The road can wait.", tellBelief: 8, tellHappy: 3, tellSmarts: 1 },
  { id: "supportive", title: "Cheering section", detail: "They filmed your first steps like a documentary.", belief: 78, closeness: 84, happiness: 70, smarts: 0, fame: 0, money: 900, parents: "pair", parentNote: "Home", tell: "They cry, then ask if you can fly them to the store. You cannot. They are proud anyway.", tellBelief: 12, tellHappy: 6 },
  { id: "skeptical", title: "Hard to impress", detail: "They love you. They will still need to see the crater.", belief: 26, closeness: 66, happiness: 58, smarts: 4, fame: 0, money: 1400, parents: "pair", parentNote: "Home", tell: "They ask you to do it again, slower. Then they sit down. That counts as belief.", tellBelief: 6, tellHappy: 2 },
  { id: "legacy", title: "Cape in the closet", detail: "One of them has a statue. It is deeply embarrassing.", belief: 86, closeness: 72, happiness: 52, smarts: 2, fame: 12, money: 4200, parents: "pair", parentNote: "Legacy", tell: "They say they knew. They have a costume in your size. You are not ready for the costume.", tellBelief: 8, tellHappy: 1, tellFame: 2 },
  { id: "absent", title: "Latchkey", detail: "You learned the microwave before the alphabet.", belief: 34, closeness: 36, happiness: 48, smarts: 6, fame: 0, money: 250, parents: "pair", parentNote: "Latchkey", tell: "You leave a voicemail. They call back. That is the miracle.", tellBelief: 8, tellHappy: 5 },
  { id: "scientific", title: "Lab-coat household", detail: "Bedtime came with a hypothesis.", belief: 64, closeness: 68, happiness: 56, smarts: 12, fame: 0, money: 2000, parents: "pair", parentNote: "Lab", tell: "They want a sample. You negotiate for ice cream and win.", tellBelief: 10, tellHappy: 3, tellSmarts: 2 },
];

export const FEMALE_NAMES = [
  "Mina", "Nova", "Harper", "Sasha", "Maren", "Priya", "Cleo", "Willa",
  "Nia", "Esme", "Rhea", "Tessa", "Yara", "Opal", "Fern", "Imani",
  "Greta", "Lila", "Noor", "Vesper", "Holli", "Juniper", "Amira", "Selene",
  "Bridget", "Keiko", "Ines", "Sable", "Dahlia", "Ruth",
];

export const MALE_NAMES = [
  "Theo", "Nico", "Logan", "Remy", "Marcus", "Leo", "Andre", "Hugo",
  "Jonah", "Malik", "Felix", "Omar", "Declan", "Silas", "Cruz", "Idris",
  "Wes", "Arlo", "Kai", "Dante", "Rafa", "Bennett", "Cole", "Julian",
  "Haruto", "Ellis", "Mateo", "Gideon", "Soren", "Ivan",
];

export const FIRST_NAMES = [...FEMALE_NAMES, ...MALE_NAMES];

export const LAST_NAMES = [
  "Voss", "Keller", "Okoye", "Park", "Santos", "Ibarra", "Nguyen", "Adler", "Brooks", "Diallo",
  "Cho", "Marchetti", "Singh", "Okafor", "Reyes", "Berg", "Costa", "Hale", "Iqbal", "Moreau",
  "Petrov", "Silva", "Ward", "Zhou", "Abbas", "Duval", "Klein", "Navarro", "Frost", "Quill",
];

export function cityById(id: string): CityDef {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

export function upbringingById(id: UpbringingId): UpbringingDef {
  return UPBRINGINGS.find((u) => u.id === id) ?? UPBRINGINGS[0];
}
