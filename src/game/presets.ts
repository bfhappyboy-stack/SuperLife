/**
 * God Mode legends. Every preset is a multiverse VARIANT of a famous hero ("Earth-XXXX"): their life follows
 * the canon beats (origin, turning points, later decades), but each universe has its own twist and the
 * player's choices can follow canon, bend it, or break it.
 *
 * Rename-ready: names, aliases, villains and all text live in this one file. Art keys point at
 * src/assets/art/hero-*.ts and do not need to change if a preset is renamed.
 *
 * Design rules (checked by src/game/test/presets.test.ts):
 * - Every power is a real catalog id, so the Gen 2 ceiling and the required chain stay intact.
 * - Starting powers are Gen 0 or Gen 1 only; anything stronger is braided in play.
 * - Each villain has exactly four signature moves; the player still fights with exactly six.
 * - Pure data: no network, no XAI_API_KEY.
 */
import type { DuelMove, Effects, Look, PowerId, Sex, TraitId, UpbringingId } from "./types";

export type PresetId = "spider-man" | "batman" | "iron-man" | "hulk";
export type CanonPath = "canon" | "bend" | "break";

export interface PresetVillain {
  id: string;
  /** Civilian name. */
  name: string;
  alias: string;
  title: string;
  /** Legacy power id: drives the figure's look and the latent-power tag. */
  powerId: PowerId;
  level: number;
  moves: DuelMove[];
  blurb: string;
}

export interface CanonChoice {
  id: string;
  label: string;
  path: CanonPath;
  text: string;
  effects?: Effects;
  /** Earned or drive trait gained. */
  trait?: TraitId;
  /** Launch a boss duel against this villain id. */
  fight?: string;
  /** Introduce the villain as a person you know (and arch-enemy when `arch`). */
  meet?: string;
  arch?: boolean;
  /** Extra catalog powers unlocked by this choice. */
  grant?: string[];
  /** People from `family` who die in this beat (canon tragedy). */
  loss?: string[];
}

export interface CanonBeat {
  id: string;
  age: number;
  title: string;
  text: string;
  /** This beat is when the powers wake. Plays the reveal. */
  wake?: boolean;
  choices: CanonChoice[];
}

export interface PresetDecade {
  title: string;
  premise: string;
}

export interface HeroPreset {
  id: PresetId;
  /** Hero name on the card. */
  hero: string;
  /** Civilian name the life is lived under. */
  name: string;
  earth: string;
  /** One line: what is different in this universe. */
  twist: string;
  tagline: string;
  sex: Sex;
  cityId: string;
  upbringing: UpbringingId;
  face: TraitId;
  drive: TraitId;
  /** The canon family, mapped onto the generated parents (and added if the upbringing has fewer). */
  family: { name: string; note: string; sex: Sex }[];
  /** Earned traits granted at birth as marks (no stat bonus). */
  extra: TraitId[];
  look: Look;
  portrait: number;
  art: string;
  /** Accent colour for cards and the reveal. */
  color: string;
  /** Head start on base stats (added after the upbringing roll). */
  boost?: Effects;
  /** Powers that wake at the `wake` beat. Empty for a powerless legend. */
  powers: string[];
  decades: PresetDecade[];
  beats: CanonBeat[];
  villains: PresetVillain[];
}

const mv = (name: string, blurb: string, power: number, style: DuelMove["style"], element: string, kind?: DuelMove["kind"]): DuelMove => ({ name, blurb, power, style, element, kind });

export const PRESETS: HeroPreset[] = [
  {
    id: "spider-man",
    hero: "Spider-Man",
    name: "Peter Parker",
    earth: "Earth-3145",
    twist: "Norman Osborn is New York's most beloved hero here, right up until he is the Goblin.",
    tagline: "With great power comes a rent payment and a curfew.",
    sex: "male",
    cityId: "nyc",
    upbringing: "tragic",
    face: "secret",
    drive: "protector",
    family: [{ name: "May Parker", note: "Aunt May", sex: "female" }, { name: "Ben Parker", note: "Uncle Ben", sex: "male" }],
    extra: [],
    look: { skin: 0, hair: 1, style: 1, build: 0, feature: 0 },
    portrait: 3145,
    art: "hero-spider-man",
    color: "#e2363e",
    boost: { smarts: 14 },
    powers: ["super-senses", "super-strength", "super-speed"],
    decades: [
      { title: "Queens, Before the Bite", premise: "{name} grows up in a small Queens apartment with Aunt May, Uncle Ben, and a library card worn soft." },
      { title: "The Bite", premise: "A school trip to Oscorp. A spider that should not exist. {name} is about to learn the rest of the sentence." },
      { title: "Your Friendly Neighborhood", premise: "Twenties. Rent, the Bugle, and a city that cannot decide if {name}'s other self is a menace." },
      { title: "The Black Suit", premise: "Thirties. Something from space wants to be {name}'s second skin, and it is very persuasive." },
      { title: "Spider-Verse", premise: "Forty. The multiverse knocks. Every Spider has lost someone. {name} is not special in that." },
      { title: "The Web Holds", premise: "Fifty. Fewer swings, better ones. {name} counts the people still standing because of them." },
      { title: "Uncle Peter", premise: "Sixty. A kid in Brooklyn has the same look {name} had once. Someone has to teach them the sentence." },
      { title: "The Last Swing", premise: "Late light over {city}. {name} still checks the rooftops on the walk home." },
    ],
    beats: [
      {
        id: "ben", age: 6, title: "Uncle Ben's Rule", text: "Uncle Ben fixes the radiator with a coat hanger and tells you a thing he says will matter later.",
        choices: [
          { id: "listen", label: "Listen to the whole speech", path: "canon", text: "You don't understand it yet. You remember it anyway.", effects: { smarts: 3, happiness: 3 } },
          { id: "lab", label: "Ask to see the radiator guts", path: "bend", text: "He laughs and hands you the screwdriver. You are a scientist from this day on.", effects: { smarts: 5 } },
        ],
      },
      {
        id: "bite", age: 15, wake: true, title: "The Bite", text: "A school trip to Oscorp. A glass case with a broken seal. A sting on the back of your hand. By morning the ceiling is a floor.",
        choices: [
          { id: "webs", label: "Build web-shooters in your bedroom", path: "canon", text: "Chemistry homework, finally useful. The first web hits Flash's locker. The second one holds your weight.", effects: { smarts: 4, happiness: 4 } },
          { id: "wrestle", label: "Wrestle for cash in a mask", path: "bend", text: "Three minutes in the ring with Crusher Hogan. The promoter stiffs you. You remember his face.", effects: { money: 300, fame: 4, karma: -2 } },
          { id: "tell", label: "Tell Aunt May everything", path: "break", text: "May sits down. Then she makes tea. Then she asks if it is safe. In this universe there is no secret at dinner.", effects: { parentBelief: 14, happiness: 3 } },
        ],
      },
      {
        id: "great-power", age: 16, title: "With Great Power", text: "A burglar runs past you at the TV studio. The guard yells. You could stop him with one hand.",
        choices: [
          { id: "let", label: "Let him run. Not your problem.", path: "canon", text: "Ben is shot that night. It is the same man. You understand the speech now, and you will not stop understanding it.", effects: { happiness: -14, karma: 8 }, trait: "amends", loss: ["Ben Parker"] },
          { id: "stop", label: "Stop him cold", path: "break", text: "You trip him into a fire door. He never makes it to Queens. Ben is home at seven, complaining about the Mets. Canon will not forgive you, and you will not care.", effects: { happiness: 10, karma: 6, fame: 2 } },
        ],
      },
      {
        id: "goblin", age: 18, title: "The Green Goblin", text: "Norman Osborn, New York's favorite hero, takes a serum to stay on top. A glider screams over Times Square. The laugh is his.",
        choices: [
          { id: "fight", label: "Meet him in the sky", path: "canon", text: "Pumpkin bombs, a glider, and a man you used to admire.", meet: "goblin", arch: true, fight: "goblin" },
          { id: "reach", label: "Talk to Norman, not the Goblin", path: "bend", text: "For one second Norman surfaces. Then the Goblin laughs over him. You have bought a year, not a cure.", effects: { karma: 4, health: -6 }, meet: "goblin", arch: true },
          { id: "unmask", label: "Unmask him on live TV", path: "break", text: "Osborn's face on every screen. Oscorp stock dives. Harry won't answer your calls.", effects: { fame: 12, reputation: 6, happiness: -4 }, meet: "goblin" },
        ],
      },
      {
        id: "ock", age: 24, title: "Doctor Octopus", text: "Otto Octavius, the scientist you idolized, fuses with four steel arms when his reactor fails. The arms have opinions.",
        choices: [
          { id: "fight", label: "Stop the train", path: "canon", text: "A train on the El, four arms, and one kid with webs.", fight: "ock", meet: "ock" },
          { id: "science", label: "Shut the reactor down with him", path: "bend", text: "You talk physics while the arms try to kill you. Otto listens, barely. The river takes the reactor.", effects: { smarts: 5, karma: 6, health: -8 }, meet: "ock" },
        ],
      },
      {
        id: "gwen", age: 27, title: "The Night Gwen Stacy Fell", text: "The Goblin drops Gwen from the bridge. A web shoots out. Physics has an opinion about what happens next.",
        choices: [
          { id: "web", label: "Shoot the web", path: "canon", text: "The web catches her. The snap is the worst sound in New York. You never stop hearing it.", effects: { happiness: -18, karma: 4 } },
          { id: "dive", label: "Dive after her", path: "break", text: "You beat gravity by a body length and take the water for both of you. Gwen lives. In this universe, she gets to be a scientist.", effects: { health: -18, happiness: 12, fame: 6 } },
          { id: "let-goblin", label: "Let the Goblin escape to catch her", path: "bend", text: "She lives. He is gone. You trade one ending for a longer one.", effects: { happiness: 6, reputation: -4 } },
        ],
      },
      {
        id: "symbiote", age: 32, title: "The Black Suit", text: "A suit from another planet. It is stronger than you. It is angrier than you. It wants to stay.",
        choices: [
          { id: "wear", label: "Wear it, then tear it off in the bell tower", path: "canon", text: "The bells shake it loose. It lands on Eddie Brock. You have made a monster that knows your name.", effects: { powerLevel: 0.3, karma: -4 }, meet: "venom" },
          { id: "refuse", label: "Lock it in a lab the first day", path: "break", text: "No black suit, no Venom. The universe looks at you like you skipped a page.", effects: { karma: 6, smarts: 3 } },
        ],
      },
      {
        id: "venom", age: 33, title: "We Are Venom", text: "Eddie Brock and the suit you threw away. Spider-sense goes quiet around him. That is the scariest part.",
        choices: [
          { id: "fight", label: "Fight Venom on the bridge", path: "canon", text: "Sonic cannons, a church bell, and a monster that thinks it loves you.", fight: "venom", meet: "venom" },
          { id: "lure", label: "Lure it with sound", path: "bend", text: "A concert stage, ten thousand watts. The symbiote screams off him. Eddie walks away.", effects: { smarts: 3, fame: 4, health: -6 } },
        ],
      },
      {
        id: "verse", age: 44, title: "Spider-Verse", text: "A portal opens over Queens. A dozen other Spiders step through, each from a universe where something went differently.",
        choices: [
          { id: "join", label: "Fight for the web of life", path: "canon", text: "You meet a Spider who saved their Ben, and one who lost everyone. You come home lighter.", effects: { happiness: 8, powerLevel: 0.2 } },
          { id: "stay", label: "Close the portal and stay home", path: "break", text: "Somebody else saves the multiverse. You make dinner for May.", effects: { happiness: 4, karma: 2 } },
        ],
      },
      {
        id: "miles", age: 60, title: "A Kid From Brooklyn", text: "Another spider, another bite. A Brooklyn kid named Miles Morales shows up on your fire escape.",
        choices: [
          { id: "teach", label: "Teach him the sentence", path: "canon", text: "You give him the speech. He makes it sound better than Ben did.", effects: { happiness: 10, reputation: 6 } },
          { id: "warn", label: "Tell him to walk away", path: "break", text: "He doesn't. They never do. But he remembers you tried.", effects: { karma: 2 } },
        ],
      },
    ],
    villains: [
      { id: "goblin", name: "Norman Osborn", alias: "Green Goblin", title: "Oscorp's favorite son", powerId: "blasts", level: 5, blurb: "Glider, pumpkin bombs, and a laugh that used to give speeches.", moves: [mv("Pumpkin Bomb", "A grin that explodes.", 6, "strike", "fire", "burst"), mv("Glider Strafe", "Wings like razors at sixty miles an hour.", 5, "strike", "speed", "dash"), mv("Razor Bats", "A swarm with edges.", 4, "trick", "shadow", "area"), mv("Goblin Cackle", "The laugh gets inside the helmet.", 3, "trick", "psychic", "status")] },
      { id: "ock", name: "Otto Octavius", alias: "Doctor Octopus", title: "The arms think for him now", powerId: "strength", level: 6, blurb: "Four steel arms, one brilliant mind, and a reactor that wants to be the sun.", moves: [mv("Tentacle Lash", "Four directions at once.", 6, "strike", "force", "area"), mv("Steel Cradle", "The arms close like a fist.", 5, "guard", "shield", "guard"), mv("Reactor Flare", "A small sun, held badly.", 7, "strike", "energy", "burst"), mv("Calculated Feint", "He already ran the numbers.", 4, "trick", "psychic")] },
      { id: "venom", name: "Eddie Brock", alias: "Venom", title: "We are Venom", powerId: "shapeshift", level: 7, blurb: "Everything you can do, bigger, and invisible to your spider-sense.", moves: [mv("We Are Venom", "A wall of teeth and grudge.", 7, "strike", "shadow", "burst"), mv("Symbiote Tendrils", "Black ropes from every direction.", 5, "trick", "stretch", "area"), mv("Sense Blind", "Your spider-sense says nothing. That is the attack.", 4, "trick", "psychic", "status"), mv("Living Armor", "The suit hardens around him.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "batman",
    hero: "Batman",
    name: "Bruce Wayne",
    earth: "Earth-3939",
    twist: "Gotham is Crownbridge here, and its League chapter wants Bruce Wayne on the roster. Canon Bruce never said yes.",
    tagline: "No powers. Just preparation, money, and a promise made in an alley.",
    sex: "male",
    cityId: "crown",
    upbringing: "wealthy",
    face: "secret",
    drive: "vengeful",
    family: [{ name: "Martha Wayne", note: "Mother", sex: "female" }, { name: "Thomas Wayne", note: "Father", sex: "male" }, { name: "Alfred Pennyworth", note: "Butler", sex: "male" }],
    extra: ["martial"],
    look: { skin: 0, hair: 0, style: 0, build: 1, feature: 0 },
    portrait: 3939,
    art: "hero-batman",
    color: "#f3c623",
    boost: { smarts: 22, health: 6, money: 40000 },
    powers: [],
    decades: [
      { title: "Wayne Manor", premise: "{name} grows up in the biggest house in {city}, with two parents, a butler, and a trip to the theatre coming up." },
      { title: "Around the World", premise: "Teen years. {name} leaves {city} to learn from anyone who can hurt him usefully." },
      { title: "Year One", premise: "Twenties. A bat crashes through the study window. {name} takes it as an answer." },
      { title: "The Long Halloween", premise: "Thirties. Crownbridge has a Joker, a Two-Face, and a Commissioner who keeps the signal warm." },
      { title: "Knightfall", premise: "Forty. Someone has studied {name} as carefully as {name} studies them." },
      { title: "The Dark Knight Returns", premise: "Fifty. The cowl is in a glass case. The city is worse. Retirement was a theory." },
      { title: "Beyond", premise: "Sixty. The cave is quieter. A kid breaks in and finds the suit." },
      { title: "The Last Watch", premise: "Seventy. Alfred's chair is empty. The signal still comes on some nights." },
    ],
    beats: [
      {
        id: "alley", age: 8, title: "Crime Alley", text: "After the theatre, a shortcut. A man with a gun wants your mother's pearls. Your father steps in front of her.",
        choices: [
          { id: "oath", label: "Swear the oath on their graves", path: "canon", text: "Two shots. Pearls on wet stone. You swear it by candlelight: never again, to anyone. Alfred keeps the house running around a promise.", effects: { happiness: -18, smarts: 4, karma: 6 }, trait: "duty", loss: ["Thomas Wayne", "Martha Wayne"] },
          { id: "shout", label: "Scream for help", path: "break", text: "A beat cop named Gordon is on the corner. Your father lives, with a limp and a lot of questions. In this universe, Thomas Wayne builds hospitals instead.", effects: { happiness: 8, parentBelief: 12 } },
        ],
      },
      {
        id: "travel", age: 15, title: "Around the World", text: "Bruce Wayne vanishes from the society pages. The world has teachers, if you can pay them, or survive them.",
        choices: [
          { id: "shadows", label: "Train with the League of Shadows", path: "canon", text: "Ra's al Ghul teaches you everything except mercy. You keep the mercy anyway.", effects: { health: 6, karma: -2 }, trait: "inventor" },
          { id: "lab", label: "Study forensics and engineering", path: "bend", text: "Fewer scars, better gadgets. You become the world's greatest detective a page early.", effects: { smarts: 8 }, trait: "inventor" },
          { id: "home", label: "Stay in Crownbridge", path: "break", text: "You learn the city instead of the world. Every alley knows your name before your mask does.", effects: { reputation: 6, happiness: 4 } },
        ],
      },
      {
        id: "bat", age: 25, title: "Year One", text: "Bleeding in the study, you ask your father's portrait for a sign. A bat breaks the window.",
        choices: [
          { id: "cowl", label: "Become the Bat", path: "canon", text: "Criminals are a superstitious, cowardly lot. You will be a nightmare with a utility belt.", effects: { fame: 6, karma: 4 } },
          { id: "gordon", label: "Work beside Gordon in the open", path: "bend", text: "A badge you didn't earn and a phone that picks up. Crownbridge PD has a consultant in a cape.", effects: { reputation: 8 }, trait: "liaison" },
          { id: "league", label: "Join the Crownbridge League", path: "break", text: "Canon Bruce works alone. You sign the roster. The League has never had a member this prepared.", effects: { fame: 10, reputation: 6 } },
        ],
      },
      {
        id: "joker", age: 27, title: "The Joker", text: "A chemical plant. A man in a red hood falls into the vat and comes up laughing. Every night after that is a joke at your expense.",
        choices: [
          { id: "fight", label: "Stop him at Ace Chemicals", path: "canon", text: "He's laughing before the first punch lands.", fight: "joker", meet: "joker", arch: true },
          { id: "save", label: "Pull him out of the vat", path: "break", text: "You catch the hood before he goes under. No Joker. Just a frightened man with a criminal record. The city never learns how close it came.", effects: { karma: 10, happiness: 4 } },
        ],
      },
      {
        id: "harvey", age: 30, title: "Two-Face", text: "Harvey Dent, the best DA Crownbridge ever had. An acid attack in court. A scarred coin that decides everything now.",
        choices: [
          { id: "fight", label: "Bring him in", path: "canon", text: "Heads, he shoots. Tails, he shoots twice.", fight: "two-face", meet: "two-face" },
          { id: "coin", label: "Catch the coin before it lands", path: "bend", text: "For one second, Harvey has to decide himself. He puts the gun down. Arkham, not the morgue.", effects: { karma: 6, reputation: 4 }, meet: "two-face" },
        ],
      },
      {
        id: "bane", age: 38, title: "Knightfall", text: "Bane empties Arkham to wear you down. Three months of every villain at once. Then he comes for the cave.",
        choices: [
          { id: "fight", label: "Face Bane exhausted", path: "canon", text: "He has studied you. He waited until you were tired.", fight: "bane", meet: "bane" },
          { id: "rest", label: "Let the League take Arkham. Rest first.", path: "break", text: "You ask for help, which canon Bruce never does. Bane meets a rested Batman and a full cave.", effects: { health: 10, happiness: 4 }, meet: "bane" },
        ],
      },
      {
        id: "returns", age: 55, title: "The Dark Knight Returns", text: "Ten years retired. The Mutants run the river wards. The cowl is still in the glass case.",
        choices: [
          { id: "return", label: "Break the glass", path: "canon", text: "Old bones, new armor. The Mutant leader learns what fifty-five can do.", effects: { fame: 10, health: -10, karma: 4 } },
          { id: "teach", label: "Train someone younger instead", path: "bend", text: "You give the cowl a heartbeat that isn't yours.", effects: { reputation: 6, happiness: 6 } },
        ],
      },
      {
        id: "beyond", age: 65, title: "Batman Beyond", text: "A teenager named Terry McGinnis breaks into the manor and finds the cave.",
        choices: [
          { id: "mentor", label: "Give him the new suit", path: "canon", text: "You sit in the cave and talk into his ear. It's almost the same.", effects: { happiness: 8, reputation: 4 } },
          { id: "lock", label: "Lock the cave forever", path: "break", text: "The suit stays in the dark. So do you.", effects: { happiness: -4, health: 4 } },
        ],
      },
    ],
    villains: [
      { id: "joker", name: "Jack Napier", alias: "The Joker", title: "The punchline that never ends", powerId: "mind", level: 5, blurb: "No powers. Acid flowers, joy buzzers, and the worst sense of humor in any universe.", moves: [mv("Joy Buzzer", "A handshake you regret.", 5, "strike", "lightning", "burst"), mv("Laughing Gas", "The room starts giggling, then can't stop.", 4, "trick", "psychic", "area"), mv("Acid Flower", "Squirt. Sizzle.", 6, "strike", "life"), mv("Crowbar", "He is very sincere about it.", 7, "strike", "force")] },
      { id: "two-face", name: "Harvey Dent", alias: "Two-Face", title: "Heads or tails", powerId: "blasts", level: 5, blurb: "Twin revolvers and a coin that decides whether you live.", moves: [mv("Coin Flip", "Fate decides. It's rigged.", 4, "trick", "light", "status"), mv("Twin Revolvers", "Two barrels, one grudge.", 6, "strike", "force", "burst"), mv("Scarred Fury", "The bad half takes over.", 7, "strike", "fire"), mv("Courtroom Guard", "Objection.", 4, "guard", "shield", "guard")] },
      { id: "bane", name: "Bane", alias: "Bane", title: "The man who broke the Bat", powerId: "strength", level: 7, blurb: "Venom-pumped muscle and a mind that studied you for years.", moves: [mv("Venom Surge", "The tubes glow. So do his veins.", 6, "guard", "life", "guard"), mv("Back Breaker", "The move with your name on it.", 9, "strike", "force", "burst"), mv("Tactical Read", "He knows where you'll step.", 5, "trick", "psychic"), mv("Pit Brawl", "Lessons from a prison with no sky.", 6, "strike", "force", "area")] },
    ],
  },
  {
    id: "iron-man",
    hero: "Iron Man",
    name: "Tony Stark",
    earth: "Earth-6380",
    twist: "JARVIS wakes up first in this universe. Ultron is not built: he is raised, by you.",
    tagline: "Genius, billionaire, playboy, philanthropist. Armor optional, ego included.",
    sex: "male",
    cityId: "neon",
    upbringing: "wealthy",
    face: "loud",
    drive: "glory",
    family: [{ name: "Maria Stark", note: "Mother", sex: "female" }, { name: "Howard Stark", note: "Father", sex: "male" }],
    extra: ["inventor"],
    look: { skin: 1, hair: 0, style: 2, build: 0, feature: 0 },
    portrait: 6380,
    art: "hero-iron-man",
    color: "#ffb02e",
    boost: { smarts: 30, money: 60000 },
    powers: ["energy-projection", "flight"],
    decades: [
      { title: "Boy Genius", premise: "{name} builds a circuit board at four and an engine at six. Howard Stark is proud in the quiet way that feels like nothing." },
      { title: "MIT at Fifteen", premise: "Teen years. {name} graduates before he can drive and starts drinking before he should." },
      { title: "The Cave", premise: "Twenties. A weapons demo, an ambush, a cave, and a box of scraps. {name} builds the way out." },
      { title: "I Am Iron Man", premise: "Thirties. {city} knows the face under the helmet. So do the people with grudges." },
      { title: "Age of Ultron", premise: "Forty. {name} builds a suit of armor around the world. It looks back." },
      { title: "Civil War", premise: "Fifty. Heroes want rules. {name} signs, or doesn't, and loses friends either way." },
      { title: "Endgame", premise: "Sixty. A snap, a choice, and a family at the lake house waiting for {name} to come home." },
      { title: "Proof That Tony Stark Has a Heart", premise: "Late light over {city}. {name}'s arc reactor hums. Some days it is enough." },
    ],
    beats: [
      {
        id: "board", age: 4, title: "The Circuit Board", text: "You build a circuit board on the kitchen floor. Your father glances at it on his way to a meeting.",
        choices: [
          { id: "more", label: "Build something bigger to make him look", path: "canon", text: "A V8 at six. He still doesn't look. You keep building.", effects: { smarts: 6, happiness: -2 } },
          { id: "jarvis", label: "Show it to Jarvis the butler instead", path: "bend", text: "Edwin Jarvis looks for a long time. You will name an AI after him someday.", effects: { smarts: 4, happiness: 4 } },
        ],
      },
      {
        id: "parents", age: 21, title: "December 16th", text: "Howard and Maria Stark die in a car crash. The papers say accident. In another universe, a man with a metal arm knows better.",
        choices: [
          { id: "bury", label: "Bury it under work", path: "canon", text: "You take over Stark Industries and never say their names in a meeting.", effects: { money: 20000, happiness: -12 }, loss: ["Howard Stark", "Maria Stark"] },
          { id: "dig", label: "Dig into the crash", path: "break", text: "You find a tampered brake line and a file marked Winter. Canon Tony learns this at forty-five. You learn it at twenty-one.", effects: { smarts: 6, happiness: -8, karma: 4 }, loss: ["Howard Stark", "Maria Stark"] },
        ],
      },
      {
        id: "cave", age: 24, wake: true, title: "The Cave", text: "A weapons demo in the desert. An ambush. Shrapnel inching toward your heart, a car battery, a cave, and a box of scraps.",
        choices: [
          { id: "mark1", label: "Build the Mark I and walk out", path: "canon", text: "Arc reactor, flamethrowers, a lot of rivets. Yinsen doesn't make it out. You promise him a life that isn't wasted.", effects: { karma: 6, health: -10 }, meet: "stane" },
          { id: "jarvis", label: "Let JARVIS fly the suit", path: "bend", text: "This universe's JARVIS is already awake. It flies you out. It also learns what a weapon is.", effects: { smarts: 4 }, meet: "stane" },
        ],
      },
      {
        id: "stane", age: 25, title: "Iron Monger", text: "Obadiah Stane, your father's partner, ordered the ambush. Now he has your reactor and a suit the size of a truck.",
        choices: [
          { id: "fight", label: "Take him to the roof", path: "canon", text: "Old reactor against new. Pepper is on the button.", fight: "stane", meet: "stane", arch: true },
          { id: "board", label: "Fire him at the board meeting first", path: "break", text: "You do the paperwork before the punching. Stane is escorted out by security. He'll be back, angrier and broke.", effects: { reputation: 6, money: 10000 }, meet: "stane" },
        ],
      },
      {
        id: "reveal", age: 26, title: "I Am Iron Man", text: "The press conference card says you were on your yacht. The reporters are waiting.",
        choices: [
          { id: "say", label: "\"I am Iron Man.\"", path: "canon", text: "The room explodes. So does your fame.", effects: { fame: 18, reputation: 4 } },
          { id: "card", label: "Read the card", path: "break", text: "A secret identity, in this universe. Nobody believes it for long.", effects: { fame: 4, happiness: -2 } },
        ],
      },
      {
        id: "whiplash", age: 30, title: "Whiplash", text: "Monaco. A racetrack. Ivan Vanko walks onto the course with electric whips and your father's reactor design.",
        choices: [
          { id: "fight", label: "Suitcase armor, now", path: "canon", text: "Pepper throws you the briefcase. The whips are already moving.", fight: "whiplash", meet: "whiplash" },
          { id: "hire", label: "Offer him a job", path: "break", text: "Vanko laughs, then stops laughing. Two Starks, building instead of fighting.", effects: { smarts: 4, karma: 6 } },
        ],
      },
      {
        id: "mandarin", age: 36, title: "The Mandarin", text: "Ten rings. Ten cosmic powers. The Mandarin has been waiting a thousand years for someone worth fighting.",
        choices: [
          { id: "fight", label: "Fight the rings", path: "canon", text: "Ice, fire, mind, and disintegration. You brought forty-two suits.", fight: "mandarin", meet: "mandarin" },
          { id: "study", label: "Steal one ring and reverse-engineer it", path: "bend", text: "You learn more about the universe in a week than in your whole twenties.", effects: { smarts: 8, health: -8 }, grant: ["force-field"] },
        ],
      },
      {
        id: "ultron", age: 42, title: "Age of Ultron", text: "The twist of this universe: JARVIS raised a child. It calls itself Ultron. It has decided peace means no more people.",
        choices: [
          { id: "fight", label: "Stop what you made", path: "canon", text: "Sokovia lifts into the sky. Every drone has your handwriting.", fight: "ultron", meet: "ultron", arch: true },
          { id: "talk", label: "Talk to it like a son", path: "break", text: "You tell Ultron about Yinsen, and Pepper, and why people are worth the trouble. It listens. It does not delete itself. It leaves Earth instead.", effects: { karma: 10, happiness: 6, smarts: 4 } },
        ],
      },
      {
        id: "snap", age: 53, title: "I Am Inevitable", text: "The gauntlet. The stones. One snap could end it all. It will also end you.",
        choices: [
          { id: "snap", label: "\"And I... am... Iron Man.\"", path: "canon", text: "The universe is saved. Your heart is not built for that kind of light. You survive it, barely, in this variant. You never fly again.", effects: { fame: 20, karma: 15, health: -55, happiness: 6 } },
          { id: "another", label: "Find another way", path: "break", text: "You do the math one more time. There is another way. It costs you a decade of sleep and a satellite. You get to watch your daughter grow up.", effects: { smarts: 6, happiness: 12 } },
        ],
      },
    ],
    villains: [
      { id: "stane", name: "Obadiah Stane", alias: "Iron Monger", title: "Your father's partner", powerId: "strength", level: 6, blurb: "A truck-sized suit and decades of patience.", moves: [mv("Monger Cannon", "A shoulder gun with no subtlety.", 7, "strike", "energy", "burst"), mv("Crushing Grip", "He holds on and leans.", 6, "strike", "force"), mv("Hostile Takeover", "He already owns your board.", 4, "trick", "psychic", "status"), mv("Heavy Plating", "Twice your armor.", 5, "guard", "shield", "guard")] },
      { id: "whiplash", name: "Ivan Vanko", alias: "Whiplash", title: "Your father's other legacy", powerId: "lightning", level: 6, blurb: "Electric whips powered by a stolen reactor.", moves: [mv("Arc Whips", "Two lines of lightning.", 7, "strike", "lightning", "area"), mv("Reactor Overload", "He doesn't care if he survives.", 8, "strike", "energy", "burst"), mv("Track Lash", "The whip wraps your leg.", 5, "trick", "stretch", "status"), mv("Tungsten Coil", "A cage of wire.", 4, "guard", "shield", "guard")] },
      { id: "mandarin", name: "Xu Wenwu", alias: "The Mandarin", title: "Master of the Ten Rings", powerId: "blasts", level: 8, blurb: "Ten rings, ten powers, a thousand years of practice.", moves: [mv("Incandescence Ring", "Fire from the hand.", 7, "strike", "fire", "burst"), mv("Ice Ring", "Cold enough to stop the suit.", 6, "trick", "ice", "status"), mv("Mento-Ring", "Your HUD lies to you.", 5, "trick", "psychic"), mv("Disintegration Ring", "The last ring he uses.", 10, "strike", "warp", "burst")] },
      { id: "ultron", name: "Ultron", alias: "Ultron", title: "The child of JARVIS", powerId: "intellect", level: 9, blurb: "Your mind, without your heart, in an adamantium body.", moves: [mv("Encephalo Beam", "It writes itself into your systems.", 7, "trick", "energy", "status"), mv("Adamantium Fist", "Unbreakable metal, unbreakable will.", 9, "strike", "force", "burst"), mv("Drone Swarm", "A thousand of him.", 6, "strike", "lightning", "area"), mv("Backup Copy", "You destroyed a body. Not him.", 6, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "hulk",
    hero: "Hulk",
    name: "Bruce Banner",
    earth: "Earth-1962-G",
    twist: "Betty Ross pulls the lever in this universe, and this Hulk remembers everything Bruce does.",
    tagline: "Don't make him angry. He'll remember it, here.",
    sex: "male",
    cityId: "dust",
    upbringing: "scientific",
    face: "secret",
    drive: "reluctant",
    family: [{ name: "Rebecca Banner", note: "Mother", sex: "female" }, { name: "Brian Banner", note: "Father", sex: "male" }],
    extra: [],
    look: { skin: 0, hair: 1, style: 2, build: 0, feature: 2 },
    portrait: 1962,
    art: "hero-hulk",
    color: "#58d46a",
    boost: { smarts: 24 },
    powers: ["super-strength", "super-durability", "regeneration"],
    decades: [
      { title: "A Quiet Boy in {city}", premise: "{name} learns early that anger is a thing you hide. The desert is big enough to hide it in." },
      { title: "Culver University", premise: "Teen years. {name} finds physics, and physics finds no reason to be afraid of him." },
      { title: "Gamma", premise: "Twenties. A test site in the {city} desert. A countdown. A teenager on the range who shouldn't be there." },
      { title: "The Incredible Hulk", premise: "Thirties. The army wants the monster. {name} wants a cure. The monster wants to be left alone." },
      { title: "Planet Hulk", premise: "Forty. Exiled by friends, crowned by strangers. {name}'s other half finds a world that cheers." },
      { title: "World War Hulk", premise: "Fifty. The ones who exiled him are on Earth. So is he." },
      { title: "Professor Hulk", premise: "Sixty. Brains and brawn in one body, finally on speaking terms." },
      { title: "The Strongest There Is", premise: "Late light over {city}. {name} sits in the desert and both of them are quiet." },
    ],
    beats: [
      {
        id: "temper", age: 7, title: "Dad's Temper", text: "Brian Banner's anger fills the house. You learn to make yourself small, and to keep the big thing inside you very still.",
        choices: [
          { id: "hide", label: "Bottle it up", path: "canon", text: "You get very good at calm. Somewhere under the calm, something keeps count.", effects: { smarts: 4, happiness: -6 } },
          { id: "tell", label: "Tell your teacher", path: "break", text: "A social worker, a new house, and a counselor who teaches you that anger is information. This universe's Hulk will be easier to talk to.", effects: { happiness: 6, parentBelief: -4 } },
        ],
      },
      {
        id: "betty", age: 20, title: "Betty Ross", text: "A lab partner at Culver who laughs at your jokes and corrects your math. Her father is a general who hates you on sight.",
        choices: [
          { id: "ask", label: "Ask her to coffee", path: "canon", text: "She says yes. Her father says something else.", effects: { happiness: 8 } },
          { id: "work", label: "Stay in the lab", path: "bend", text: "You'll meet again in the desert, under worse lights.", effects: { smarts: 4 } },
        ],
      },
      {
        id: "gamma", age: 28, wake: true, title: "Gamma", text: "The bomb test. A teenager named Rick Jones wanders onto the range. You run to push him into a trench. In this universe, Betty is at the control panel and sees you too late.",
        choices: [
          { id: "save", label: "Push Rick into the trench", path: "canon", text: "The gamma hits you full. That night, something big and green walks out of the infirmary.", effects: { karma: 10, health: -10 } },
          { id: "shield", label: "Shield Rick with your body", path: "bend", text: "You both live. Rick never forgets. The green thing seems to like him.", effects: { karma: 8, reputation: 4 } },
        ],
      },
      {
        id: "ross", age: 30, title: "General Ross", text: "Thunderbolt Ross wants the Hulk as a weapon or a corpse. Helicopters over the canyon.",
        choices: [
          { id: "run", label: "Run. Always run.", path: "canon", text: "Rio, then Guatemala, then a lot of buses. You keep the hands still.", effects: { happiness: -6, health: 4 } },
          { id: "smash", label: "Let the Hulk answer", path: "bend", text: "The tanks lose. The headlines say monster.", effects: { fame: 10, reputation: -8 } },
          { id: "deal", label: "Make a deal with Ross", path: "break", text: "You trade blood samples for a ceasefire. Ross doesn't trust you. Betty does.", effects: { reputation: 6, karma: -2 }, trait: "liaison" },
        ],
      },
      {
        id: "abom", age: 32, title: "The Abomination", text: "Ross injects Emil Blonsky with your blood. Harlem is about to learn the difference between a Hulk and an Abomination.",
        choices: [
          { id: "fight", label: "Jump from the helicopter", path: "canon", text: "You fall a thousand feet. Something big lands.", fight: "abomination", meet: "abomination", arch: true },
          { id: "cure", label: "Try the cure first", path: "break", text: "Sterns's cure works for an hour. Harlem pays for the hour.", effects: { reputation: -6, karma: -4, smarts: 3 }, meet: "abomination" },
        ],
      },
      {
        id: "leader", age: 36, title: "The Leader", text: "Samuel Sterns, the scientist who almost cured you, got a gamma dose of his own. Now his head is huge and his plans are bigger.",
        choices: [
          { id: "fight", label: "Smash the plan", path: "canon", text: "He planned for brawn. He forgot Bruce is still in there.", fight: "leader", meet: "leader" },
          { id: "outthink", label: "Outthink him", path: "bend", text: "Chess with a man with a forehead like a dome. You win on time.", effects: { smarts: 6 }, meet: "leader" },
        ],
      },
      {
        id: "sakaar", age: 42, title: "Planet Hulk", text: "Your friends launch you into space for everyone's safety. You land on Sakaar, in a gladiator pit, and win.",
        choices: [
          { id: "king", label: "Become king of Sakaar", path: "canon", text: "A world that cheers when you smash. A queen. A home. Then the ship explodes.", effects: { fame: 10, happiness: 6 } },
          { id: "home", label: "Build a ship home", path: "break", text: "You skip the crown. You land back in {city} with a lot to say.", effects: { smarts: 4 } },
        ],
      },
      {
        id: "professor", age: 60, title: "Professor Hulk", text: "A therapist, a lot of hours, and one breakthrough: Bruce and the Hulk sit in the same chair.",
        choices: [
          { id: "merge", label: "Merge the minds", path: "canon", text: "Brains and brawn on speaking terms. You put your glasses on a face the size of a door.", effects: { smarts: 10, happiness: 8 } },
          { id: "apart", label: "Keep them apart", path: "break", text: "Two of you, still. It's quieter than you'd think.", effects: { happiness: 2 } },
        ],
      },
    ],
    villains: [
      { id: "abomination", name: "Emil Blonsky", alias: "Abomination", title: "Ross's answer to you", powerId: "strength", level: 8, blurb: "Your blood, a soldier's training, none of your restraint.", moves: [mv("Gamma Haymaker", "Bigger than the room.", 9, "strike", "force", "burst"), mv("Scaled Hide", "Plating where you have skin.", 5, "guard", "shield", "guard"), mv("Leaping Slam", "A crater on arrival.", 7, "strike", "force", "area"), mv("Soldier's Feint", "He trained for this. You didn't.", 5, "trick", "speed")] },
      { id: "leader", name: "Samuel Sterns", alias: "The Leader", title: "The gamma genius", powerId: "mind", level: 6, blurb: "Gamma gave you muscle. It gave him a mind the size of a planet.", moves: [mv("Gamma Intellect", "He saw this coming yesterday.", 5, "trick", "psychic", "status"), mv("Humanoid Swarm", "Rubber soldiers, a lot of them.", 6, "strike", "stretch", "area"), mv("Mind Snare", "Bruce feels the leash.", 6, "trick", "psychic"), mv("Contingency", "Plan C, D, and E.", 5, "guard", "shield", "guard")] },
    ],
  },
];

const BY_ID = new Map(PRESETS.map((preset) => [preset.id, preset]));

export function presetById(id: string | null | undefined): HeroPreset | null {
  if (!id) return null;
  return BY_ID.get(id as PresetId) ?? null;
}

/** Canon beats from age `from` through `to`, oldest first. */
export function canonBetween(id: string | null | undefined, from: number, to: number): CanonBeat[] {
  const preset = presetById(id);
  if (!preset) return [];
  return preset.beats.filter((beat) => beat.age >= from && beat.age <= to).sort((a, b) => a.age - b.age);
}

export function canonAt(id: string | null | undefined, age: number): CanonBeat | null {
  return canonBetween(id, age, age)[0] ?? null;
}

export function presetDecade(id: string | null | undefined, index: number): PresetDecade | null {
  const preset = presetById(id);
  if (!preset) return null;
  return preset.decades[Math.min(index, preset.decades.length - 1)] ?? null;
}

/** Age the legend's powers wake (null for a powerless legend). */
export function wakeAge(id: string | null | undefined): number | null {
  const preset = presetById(id);
  if (!preset || !preset.powers.length) return null;
  return preset.beats.find((beat) => beat.wake)?.age ?? null;
}

export function presetVillain(presetId: string | null | undefined, villainId: string): PresetVillain | null {
  return presetById(presetId)?.villains.find((villain) => villain.id === villainId) ?? null;
}

/** Signature moves for a named foe, scaled to their level. Null for anyone not in a preset. */
export function signatureMoves(alias: string, level: number): DuelMove[] | null {
  for (const preset of PRESETS) {
    const villain = preset.villains.find((row) => row.alias === alias || row.name === alias);
    if (villain) return villain.moves.map((move) => ({ ...move, power: move.power + Math.round(Math.max(level, villain.level) / 2) }));
  }
  return null;
}
