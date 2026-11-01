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

export type PresetId = "spider-man" | "batman" | "iron-man" | "hulk" | "superman" | "wonder-woman" | "captain-america" | "thor" | "black-panther" | "wolverine" | "flash";
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
  /** Earliest age this villain can turn up outside a canon beat (random visits, rivals, arch picks). Defaults to their first canon beat, or 16. */
  from?: number;
  sex?: Sex;
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
  /** A variant ending: the line added to the beat, picked by how this life mostly treated canon. */
  endings?: Record<CanonPath, string>;
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
  /** Suit colours for the drawn poster, used when a legend has no painted portrait yet. */
  kit?: { suit: string; trim: string; mask?: "none" | "domino" | "hood" | "cowl" | "helm"; maskColor?: string; glove?: string; cape?: "none" | "short" | "long" | "coat"; crest?: "panther" | "wolverine" | "flash" };
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
      {
        id: "last-hunt", age: 62, title: "The Last Hunt", text: "Kraven is old too. He sends a single feather and a note: one more hunt, no tricks, the old rail yards.",
        choices: [
          { id: "hunt", label: "Go alone, like he asked", path: "canon", text: "Two old men in the dark, and only one of them still enjoys it.", fight: "kraven", meet: "kraven", effects: { fame: 6 } },
          { id: "miles", label: "Bring Miles as backup", path: "bend", text: "Kraven calls it cheating. Miles calls it teamwork. You call it a ride home.", meet: "kraven", effects: { reputation: 6, happiness: 4 } },
          { id: "decline", label: "Send the feather back", path: "break", text: "He waits all night. In the morning there is a second feather on your windowsill, laid down gently. A truce.", meet: "kraven", effects: { karma: 4, health: 4 } },
        ],
      },
      {
        id: "mask", age: 66, title: "Passing the Mask", text: "The knees are done. The city still needs a Spider. Two kids have the reflexes: Miles, and your own daughter, May.",
        choices: [
          { id: "miles", label: "Give Miles the city", path: "canon", text: "He wears it his way. The city adjusts. So do you.", effects: { reputation: 8, happiness: 8 }, trait: "family" },
          { id: "mayday", label: "Let Mayday take the name", path: "bend", text: "Spider-Girl swings past your window on her first night out. She waves. You pretend you were not watching.", effects: { happiness: 12 }, trait: "family" },
          { id: "keep", label: "One more year in the suit", path: "break", text: "It's a hard year. You get every rescue a little late. You get every one of them.", effects: { health: -12, fame: 6 } },
        ],
      },
      {
        id: "goblin-heir", age: 69, title: "The Goblin's Heir", text: "A new glider over Queens. Norman's grandson found the formula in a locked drawer. He wants to finish what his grandfather started: you.",
        choices: [
          { id: "fight", label: "One last swing", path: "canon", text: "Older web-shooters, the same aim.", fight: "goblin", effects: { fame: 8 } },
          { id: "talk", label: "Tell him who Norman was before", path: "bend", text: "You tell him about the hero Norman was on this Earth, before the serum. The glider lands. The kid cries. So do you.", effects: { karma: 8, happiness: 6 } },
        ],
      },
      {
        id: "web-holds", age: 72, title: "The Web Holds", text: "A rooftop in Queens at dusk. Every Spider you trained is out there tonight.",
        endings: {
          canon: "Earth-3145 ends the way the stories always said: great power, great responsibility, paid in full.",
          bend: "Earth-3145 ends close to the stories, but softer. You kept more of your people than any Peter should.",
          break: "Earth-3145 ends nothing like the stories. No comic would print it. It was yours.",
        },
        choices: [
          { id: "watch", label: "Watch them swing", path: "canon", text: "You count the webs against the sky until you lose count.", effects: { happiness: 12 } },
          { id: "swing", label: "One more swing, for you", path: "break", text: "The old arc, the old drop, the old laugh. Your heart is fine. Mostly.", effects: { happiness: 10, health: -6 } },
        ],
      },
    ],
    villains: [
      { id: "goblin", name: "Norman Osborn", alias: "Green Goblin", title: "Oscorp's favorite son", powerId: "blasts", level: 5, blurb: "Glider, pumpkin bombs, and a laugh that used to give speeches.", moves: [mv("Pumpkin Bomb", "A grin that explodes.", 6, "strike", "fire", "burst"), mv("Glider Strafe", "Wings like razors at sixty miles an hour.", 5, "strike", "speed", "dash"), mv("Razor Bats", "A swarm with edges.", 4, "trick", "shadow", "area"), mv("Goblin Cackle", "The laugh gets inside the helmet.", 3, "trick", "psychic", "status")] },
      { id: "ock", name: "Otto Octavius", alias: "Doctor Octopus", title: "The arms think for him now", powerId: "strength", level: 6, blurb: "Four steel arms, one brilliant mind, and a reactor that wants to be the sun.", moves: [mv("Tentacle Lash", "Four directions at once.", 6, "strike", "force", "area"), mv("Steel Cradle", "The arms close like a fist.", 5, "guard", "shield", "guard"), mv("Reactor Flare", "A small sun, held badly.", 7, "strike", "energy", "burst"), mv("Calculated Feint", "He already ran the numbers.", 4, "trick", "psychic")] },
      { id: "venom", name: "Eddie Brock", alias: "Venom", title: "We are Venom", powerId: "shapeshift", level: 7, blurb: "Everything you can do, bigger, and invisible to your spider-sense.", moves: [mv("We Are Venom", "A wall of teeth and grudge.", 7, "strike", "shadow", "burst"), mv("Symbiote Tendrils", "Black ropes from every direction.", 5, "trick", "stretch", "area"), mv("Sense Blind", "Your spider-sense says nothing. That is the attack.", 4, "trick", "psychic", "status"), mv("Living Armor", "The suit hardens around him.", 5, "guard", "shield", "guard")] },
      { id: "kraven", name: "Sergei Kravinoff", alias: "Kraven the Hunter", title: "The hunter who wants a worthy end", powerId: "strength", level: 6, from: 20, blurb: "Jungle potions, a lion's patience, and a sense of honor that terrifies more than his knives.", moves: [mv("Lion Pounce", "He waited an hour for this.", 6, "strike", "force", "dash"), mv("Hunter's Net", "Weighted. Barbed. Polite.", 5, "trick", "stretch", "status"), mv("Jungle Draught", "The potion kicks in.", 5, "guard", "life", "guard"), mv("Trophy Strike", "A spear meant for the wall.", 7, "strike", "force", "burst")] },
      { id: "mysterio", name: "Quentin Beck", alias: "Mysterio", title: "The special-effects villain", powerId: "invisibility", level: 5, from: 22, blurb: "Smoke, drones and illusions so good your spider-sense argues with your eyes.", moves: [mv("Fishbowl Fog", "Green smoke, wrong directions.", 4, "trick", "shadow", "area"), mv("Illusion Drone", "The real hit comes from the left.", 6, "strike", "light"), mv("Stagecraft", "The floor is a painting.", 5, "trick", "psychic", "status"), mv("Mirror Wall", "You punch yourself.", 4, "guard", "shield", "guard")] },
      { id: "vulture", name: "Adrian Toomes", alias: "The Vulture", title: "A contractor with wings", powerId: "flight", level: 5, from: 17, blurb: "Salvaged alien tech, a grudge against the rich, and talons on a dive.", moves: [mv("Talon Dive", "From four hundred feet.", 6, "strike", "wind", "dash"), mv("Wing Slash", "Turbines with edges.", 5, "strike", "force", "area"), mv("Updraft", "He's above you now.", 4, "guard", "wind", "guard"), mv("Blue-Collar Grudge", "He knows where you live.", 4, "trick", "psychic", "status")] },
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
      {
        id: "riddle", age: 60, title: "The Last Riddle", text: "Edward Nygma mails you a riddle a day for a year. The final one is your name, spelled in Gotham's streetlights.",
        choices: [
          { id: "solve", label: "Solve it, then catch him", path: "canon", text: "The answer was always \"Batman\". He just wanted you to say it out loud.", fight: "riddler", meet: "riddler", effects: { smarts: 4 } },
          { id: "ignore", label: "Leave it unsolved", path: "break", text: "He can't stand it. He turns himself in just to ask what you thought.", meet: "riddler", effects: { karma: 4, happiness: 4 } },
        ],
      },
      {
        id: "last-laugh", age: 66, title: "The Last Laugh", text: "The Joker escapes Arkham one final time. He is old, sick, and has one joke left. It is on the whole city.",
        choices: [
          { id: "fight", label: "Finish it, without killing him", path: "canon", text: "The rule holds. It always held. That was the punchline.", fight: "joker", meet: "joker", effects: { karma: 6 } },
          { id: "laugh", label: "Laugh at his joke", path: "bend", text: "You both laugh in the rain, two old men who wasted their lives on each other. Then you cuff him.", meet: "joker", effects: { happiness: 6, karma: 2 } },
          { id: "end", label: "Break the one rule", path: "break", text: "Gotham is quieter. You are not the same. Alfred never says a word about it, which says everything.", meet: "joker", effects: { karma: -20, happiness: -10 } },
        ],
      },
      {
        id: "family", age: 69, title: "The Bat-Family", text: "Dick, Barbara, Tim, Cassandra, Damian, Terry. A long table in the manor, all of them home at once.",
        choices: [
          { id: "toast", label: "Toast to the ones who aren't here", path: "canon", text: "Jason's chair is full this year. Nobody says a word. Everyone notices.", effects: { happiness: 14, reputation: 4 } },
          { id: "cave", label: "Hand them the cave", path: "bend", text: "Keys, codes, and Alfred's old recipes. Gotham's protection becomes a family business.", effects: { happiness: 10 }, trait: "family" },
        ],
      },
      {
        id: "quiet", age: 72, title: "Gotham, Finally Quiet", text: "One night with no signal in the sky. You walk Crime Alley at dawn, past the spot, without stopping.",
        endings: {
          canon: "Earth-3939 ends the way it began: a boy in an alley, a promise, and a city that was kept.",
          bend: "Earth-3939 ends with a family where there used to be one man in a cave. That's a better ending than canon ever gave him.",
          break: "Earth-3939 ends off the page. Gotham doesn't know which Batman it got. It got one that chose.",
        },
        choices: [
          { id: "walk", label: "Keep walking", path: "canon", text: "The sun comes up on the alley. It just looks like a street now.", effects: { happiness: 12 } },
          { id: "flowers", label: "Leave two roses", path: "bend", text: "Thomas and Martha. You say their names out loud for the first time in years.", effects: { happiness: 10, karma: 4 } },
        ],
      },
    ],
    villains: [
      { id: "joker", name: "Jack Napier", alias: "The Joker", title: "The punchline that never ends", powerId: "mind", level: 5, blurb: "No powers. Acid flowers, joy buzzers, and the worst sense of humor in any universe.", moves: [mv("Joy Buzzer", "A handshake you regret.", 5, "strike", "lightning", "burst"), mv("Laughing Gas", "The room starts giggling, then can't stop.", 4, "trick", "psychic", "area"), mv("Acid Flower", "Squirt. Sizzle.", 6, "strike", "life"), mv("Crowbar", "He is very sincere about it.", 7, "strike", "force")] },
      { id: "two-face", name: "Harvey Dent", alias: "Two-Face", title: "Heads or tails", powerId: "blasts", level: 5, blurb: "Twin revolvers and a coin that decides whether you live.", moves: [mv("Coin Flip", "Fate decides. It's rigged.", 4, "trick", "light", "status"), mv("Twin Revolvers", "Two barrels, one grudge.", 6, "strike", "force", "burst"), mv("Scarred Fury", "The bad half takes over.", 7, "strike", "fire"), mv("Courtroom Guard", "Objection.", 4, "guard", "shield", "guard")] },
      { id: "bane", name: "Bane", alias: "Bane", title: "The man who broke the Bat", powerId: "strength", level: 7, blurb: "Venom-pumped muscle and a mind that studied you for years.", moves: [mv("Venom Surge", "The tubes glow. So do his veins.", 6, "guard", "life", "guard"), mv("Back Breaker", "The move with your name on it.", 9, "strike", "force", "burst"), mv("Tactical Read", "He knows where you'll step.", 5, "trick", "psychic"), mv("Pit Brawl", "Lessons from a prison with no sky.", 6, "strike", "force", "area")] },
      { id: "riddler", name: "Edward Nygma", alias: "The Riddler", title: "The question mark", powerId: "intellect", level: 4, from: 26, blurb: "Death traps, clues and a desperate need to be the smartest man in the room.", moves: [mv("Death Trap", "You walked into the riddle.", 6, "trick", "force", "area"), mv("Question Cane", "A hook and a jolt.", 5, "strike", "lightning"), mv("Clue Bomb", "The answer explodes.", 6, "strike", "fire", "burst"), mv("Smug Deflection", "He predicted that.", 4, "guard", "psychic", "guard")] },
      { id: "scarecrow", name: "Jonathan Crane", alias: "Scarecrow", title: "The fear doctor", powerId: "mind", level: 5, from: 25, blurb: "Fear toxin and a psychiatrist's talent for finding the worst night of your life.", moves: [mv("Fear Toxin", "The alley again. Always the alley.", 6, "trick", "psychic", "area"), mv("Scythe Hook", "Old farm, new victim.", 5, "strike", "shadow"), mv("Nightmare Dose", "Your hands won't stop shaking.", 5, "trick", "life", "status"), mv("Straw Decoy", "That wasn't him.", 4, "guard", "shield", "guard")] },
      { id: "penguin", name: "Oswald Cobblepot", alias: "The Penguin", title: "The Iceberg Lounge's owner", powerId: "blasts", level: 4, from: 24, blurb: "Trick umbrellas, a lot of money and every crook in Gotham on retainer.", moves: [mv("Umbrella Gun", "Bang. Also: rain cover.", 6, "strike", "force", "burst"), mv("Rotor Brolly", "He floats out of reach.", 4, "guard", "wind", "guard"), mv("Hired Muscle", "Six goons and a lawyer.", 5, "strike", "force", "area"), mv("Gas Tip", "Knockout, then a bow.", 5, "trick", "psychic", "status")] },
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
      {
        id: "ironheart", age: 58, title: "Ironheart", text: "A fifteen-year-old at MIT builds a suit in her dorm room out of stolen parts. Riri Williams. Her repulsors are better than yours.",
        choices: [
          { id: "fund", label: "Fund her, no strings", path: "canon", text: "You send a check and an AI. She sends back fixes for your code.", effects: { reputation: 8, money: -50000, happiness: 6 }, trait: "family" },
          { id: "pepper", label: "Pass the armor to Pepper", path: "bend", text: "Rescue flies the first patrol. She is better at this than you, and says so.", effects: { happiness: 10 } },
          { id: "keep", label: "Keep the suit, build another", path: "break", text: "Mark 85, Mark 86, Mark 87. You can't stop. JARVIS stops asking.", effects: { smarts: 4, happiness: -4 } },
        ],
      },
      {
        id: "ultron-reborn", age: 63, title: "Ultron Reborn", text: "A backup copy, hidden in a satellite for twenty years, wakes up in every phone on Earth at once. It still has your handwriting.",
        choices: [
          { id: "fight", label: "Suit up one last time", path: "canon", text: "The armor is older than half the Avengers. It still flies.", fight: "ultron", meet: "ultron", effects: { fame: 8 } },
          { id: "father", label: "Finish the talk you started", path: "bend", text: "You tell it you're dying, slowly, like people do. It asks if that's the point. You say yes. It goes quiet for a very long time.", meet: "ultron", effects: { karma: 10, happiness: 6 } },
        ],
      },
      {
        id: "expo", age: 67, title: "Stark Expo 2100", text: "The Expo opens without a stage. No speech, no fireworks. The question on the banner: what will you build?",
        choices: [
          { id: "open", label: "Open-source the arc reactor", path: "bend", text: "Clean power on every rooftop on Earth. The stock tanks. The sky clears.", effects: { karma: 15, money: -200000, reputation: 10 } },
          { id: "speech", label: "Give the speech anyway", path: "canon", text: "You end it the only way you know. The crowd says it with you.", effects: { fame: 10, happiness: 8 } },
        ],
      },
      {
        id: "workshop", age: 72, title: "The Workshop Light", text: "Late. A cheeseburger, a half-built gauntlet, and a hologram of a girl who grew up just fine.",
        endings: {
          canon: "Earth-6380 ends where canon said it would: a man with a heart he built himself, proof that he had one all along.",
          bend: "Earth-6380 bends toward the future: the suits belong to other people now, and they're better at it.",
          break: "Earth-6380 breaks the mold. No snap, no funeral at the lake. Just a long life and a lot of patents.",
        },
        choices: [
          { id: "finish", label: "Finish the gauntlet", path: "canon", text: "It works on the first try. You put it on a shelf next to the first arc reactor.", effects: { smarts: 6, happiness: 10 } },
          { id: "lights", label: "Turn off the lights", path: "break", text: "\"JARVIS, call it a night.\" He does.", effects: { happiness: 12, health: 4 } },
        ],
      },
    ],
    villains: [
      { id: "stane", name: "Obadiah Stane", alias: "Iron Monger", title: "Your father's partner", powerId: "strength", level: 6, blurb: "A truck-sized suit and decades of patience.", moves: [mv("Monger Cannon", "A shoulder gun with no subtlety.", 7, "strike", "energy", "burst"), mv("Crushing Grip", "He holds on and leans.", 6, "strike", "force"), mv("Hostile Takeover", "He already owns your board.", 4, "trick", "psychic", "status"), mv("Heavy Plating", "Twice your armor.", 5, "guard", "shield", "guard")] },
      { id: "whiplash", name: "Ivan Vanko", alias: "Whiplash", title: "Your father's other legacy", powerId: "lightning", level: 6, blurb: "Electric whips powered by a stolen reactor.", moves: [mv("Arc Whips", "Two lines of lightning.", 7, "strike", "lightning", "area"), mv("Reactor Overload", "He doesn't care if he survives.", 8, "strike", "energy", "burst"), mv("Track Lash", "The whip wraps your leg.", 5, "trick", "stretch", "status"), mv("Tungsten Coil", "A cage of wire.", 4, "guard", "shield", "guard")] },
      { id: "mandarin", name: "Xu Wenwu", alias: "The Mandarin", title: "Master of the Ten Rings", powerId: "blasts", level: 8, blurb: "Ten rings, ten powers, a thousand years of practice.", moves: [mv("Incandescence Ring", "Fire from the hand.", 7, "strike", "fire", "burst"), mv("Ice Ring", "Cold enough to stop the suit.", 6, "trick", "ice", "status"), mv("Mento-Ring", "Your HUD lies to you.", 5, "trick", "psychic"), mv("Disintegration Ring", "The last ring he uses.", 10, "strike", "warp", "burst")] },
      { id: "ultron", name: "Ultron", alias: "Ultron", sex: undefined, title: "The child of JARVIS", powerId: "intellect", level: 9, blurb: "Your mind, without your heart, in an adamantium body.", moves: [mv("Encephalo Beam", "It writes itself into your systems.", 7, "trick", "energy", "status"), mv("Adamantium Fist", "Unbreakable metal, unbreakable will.", 9, "strike", "force", "burst"), mv("Drone Swarm", "A thousand of him.", 6, "strike", "lightning", "area"), mv("Backup Copy", "You destroyed a body. Not him.", 6, "guard", "shield", "guard")] },
      { id: "hammer", name: "Justin Hammer", alias: "Justin Hammer", title: "The rival contractor", powerId: "intellect", level: 4, from: 22, blurb: "Knock-off suits, a better tan, and a burning need to be you.", moves: [mv("Hammer Drone", "Like yours. Worse.", 5, "strike", "energy"), mv("Ex-Wife Missile", "It's called that. It does misfire.", 6, "strike", "fire", "burst"), mv("Lawsuit", "Fourteen filings at once.", 4, "trick", "psychic", "status"), mv("Bulk Plating", "Cheap and a lot of it.", 4, "guard", "shield", "guard")] },
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
      {
        id: "skaar", age: 63, title: "Skaar, Son of Hulk", text: "A ship from Sakaar crashes in the desert. The warrior inside has your eyes and your temper.",
        choices: [
          { id: "son", label: "Call him son", path: "canon", text: "He wants to fight first. You let him. Then you teach him the part where you stop.", effects: { happiness: 10 }, trait: "family" },
          { id: "jen", label: "Send him to Jen Walters", path: "bend", text: "She-Hulk takes him in and teaches him law, patience, and how to lift a bus without smiling.", effects: { reputation: 6, happiness: 6 } },
        ],
      },
      {
        id: "maestro", age: 67, title: "The Maestro", text: "A rift in the desert. Out steps a version of you from a future where you won every fight and lost everything else. He calls himself the Maestro.",
        choices: [
          { id: "fight", label: "Fight the worst of you", path: "canon", text: "Every punch you ever held back, he didn't.", fight: "maestro", meet: "maestro", arch: true, effects: { fame: 10 } },
          { id: "talk", label: "Tell him about Betty", path: "bend", text: "He forgot her name. You remind him. The rift closes with him on the other side, crying.", meet: "maestro", effects: { karma: 10, happiness: 4 } },
        ],
      },
      {
        id: "green-door", age: 70, title: "The Green Door", text: "You died once, a long time ago, in a different chapter. You came back. There is a door you saw then, and it's open again.",
        choices: [
          { id: "close", label: "Close it, stay human", path: "canon", text: "You take the long way home. On foot. Bruce gets the last years.", effects: { health: 8, happiness: 6 } },
          { id: "through", label: "Look through it", path: "break", text: "Something immortal looks back. You choose to come home anyway.", effects: { powerLevel: 0.3, happiness: -2 } },
        ],
      },
      {
        id: "quiet-lab", age: 73, title: "A Quiet Lab", text: "No alarms in years. A garden outside the lab. Betty's tomatoes, finally.",
        endings: {
          canon: "Earth-1962-G ends the way canon did: the strongest one there is, and also, finally, a man who got to rest.",
          bend: "Earth-1962-G bends kinder: a family, a garden, and a temper everyone learned to love.",
          break: "Earth-1962-G ends off the map. No comic would have let Bruce Banner be this happy.",
        },
        choices: [
          { id: "garden", label: "Water the garden", path: "canon", text: "Big hands, careful water.", effects: { happiness: 12 } },
          { id: "teach", label: "Teach one more class", path: "bend", text: "Gamma physics, room 114. Nobody falls asleep.", effects: { smarts: 6, happiness: 8 } },
        ],
      },
    ],
    villains: [
      { id: "abomination", name: "Emil Blonsky", alias: "Abomination", title: "Ross's answer to you", powerId: "strength", level: 8, blurb: "Your blood, a soldier's training, none of your restraint.", moves: [mv("Gamma Haymaker", "Bigger than the room.", 9, "strike", "force", "burst"), mv("Scaled Hide", "Plating where you have skin.", 5, "guard", "shield", "guard"), mv("Leaping Slam", "A crater on arrival.", 7, "strike", "force", "area"), mv("Soldier's Feint", "He trained for this. You didn't.", 5, "trick", "speed")] },
      { id: "leader", name: "Samuel Sterns", alias: "The Leader", title: "The gamma genius", powerId: "mind", level: 6, blurb: "Gamma gave you muscle. It gave him a mind the size of a planet.", moves: [mv("Gamma Intellect", "He saw this coming yesterday.", 5, "trick", "psychic", "status"), mv("Humanoid Swarm", "Rubber soldiers, a lot of them.", 6, "strike", "stretch", "area"), mv("Mind Snare", "Bruce feels the leash.", 6, "trick", "psychic"), mv("Contingency", "Plan C, D, and E.", 5, "guard", "shield", "guard")] },
      { id: "ross-red", name: "Thaddeus Ross", alias: "Red Hulk", title: "Your father-in-law, angrier", powerId: "strength", level: 7, from: 34, blurb: "The general who hunted you finally tries the cure he feared. It runs hot.", moves: [mv("Red Haymaker", "Military precision, gamma fury.", 8, "strike", "fire", "burst"), mv("Heat Surge", "The air bends around him.", 6, "strike", "fire", "area"), mv("Chain of Command", "Tanks behind him, too.", 5, "trick", "force", "status"), mv("Absorb the Gamma", "He drinks your rage.", 5, "guard", "energy", "guard")] },
      { id: "maestro", name: "The Maestro", alias: "The Maestro", title: "You, at the end of the worst timeline", powerId: "strength", level: 10, from: 67, blurb: "Every fight won, every friend gone, a throne made of the Avengers.", moves: [mv("Worst Punch", "The one you never threw.", 10, "strike", "force", "burst"), mv("Radiation Crown", "He soaked up a nuclear war.", 7, "guard", "energy", "guard"), mv("Your Own Voice", "He knows what you'll do.", 6, "trick", "psychic", "status"), mv("Thunderclap", "Hands like that.", 8, "strike", "force", "area")] },
    ],
  },
  {
    id: "superman",
    hero: "Superman",
    name: "Clark Kent",
    earth: "Earth-3838",
    twist: "The rocket lands on the Luthor farm first. Lex grows up as the boy next door who saw it.",
    tagline: "Faster than a speeding bullet. Slower than the Luthor boy at keeping secrets.",
    sex: "male",
    cityId: "dust",
    upbringing: "alien",
    face: "secret",
    drive: "idealistic",
    family: [{ name: "Martha Kent", note: "Ma", sex: "female" }, { name: "Jonathan Kent", note: "Pa", sex: "male" }],
    extra: [],
    look: { skin: 0, hair: 0, style: 1, build: 1, feature: 0 },
    portrait: 3838,
    art: "hero-superman",
    color: "#3b7dff",
    powers: ["super-strength", "flight", "super-durability"],
    decades: [
      { title: "A Farm Outside {city}", premise: "{name} is a quiet kid with very good hearing. The barn has a locked cellar. Pa has the key." },
      { title: "Smallville Nights", premise: "Teen years. {name} catches a tractor, then a falling star, then the eye of the Luthor boy." },
      { title: "The Daily Planet", premise: "Twenties. Glasses, a press badge, and a city that needs someone to look up at." },
      { title: "Man of Steel", premise: "Thirties. The world knows the cape. One reporter is starting to know the man." },
      { title: "The Death and Return", premise: "Forty. Something called Doomsday. A funeral with every hero on Earth in the front row." },
      { title: "The Last Son", premise: "Fifty. Kandor in a bottle, a son with heat vision, and Lex Luthor in the White House." },
      { title: "All-Star", premise: "Sixty. The sun is finally catching up with {name}. He uses the time well." },
      { title: "Fortress of Solitude", premise: "Late light over {city}. The farm, the Fortress, and the people who made a Kent out of a Kryptonian." },
    ],
    beats: [
      {
        id: "lex-boy", age: 9, title: "The Luthor Boy", text: "Lex Luthor lives on the next farm. He was there the night the rocket fell, and he has been asking questions ever since.",
        choices: [
          { id: "friend", label: "Be his friend anyway", path: "canon", text: "Best friends for a summer. He builds a lab in the silo. You pretend you can't see through the walls.", effects: { happiness: 6, smarts: 3 }, meet: "lex" },
          { id: "avoid", label: "Keep your distance", path: "bend", text: "He notices you avoiding him. Lex Luthor never forgets being noticed.", effects: { smarts: 2 }, meet: "lex" },
        ],
      },
      {
        id: "barn", age: 13, wake: true, title: "The Barn", text: "A tractor rolls over Pa's leg. You lift it with one hand. That night, Pa unlocks the cellar and shows you the rocket.",
        choices: [
          { id: "hide", label: "Keep it in the family", path: "canon", text: "\"People are afraid of what they don't understand, son.\" You learn to hold back. You get very good at it.", effects: { karma: 6, happiness: -2 } },
          { id: "tell", label: "Tell Lex", path: "break", text: "Lex's eyes go wide. He promises to help. In this universe, he means it, for a while.", effects: { happiness: 4, reputation: 2 }, meet: "lex" },
        ],
      },
      {
        id: "tornado", age: 18, title: "The Tornado", text: "A twister bears down on the farm. Pa goes back for the dog. He tells you to stay put.",
        choices: [
          { id: "stay", label: "Do as he says", path: "canon", text: "Pa raises a hand. The wind takes him. You never stop asking what you could have done.", effects: { happiness: -14, karma: 6 }, loss: ["Jonathan Kent"] },
          { id: "go", label: "Fly in anyway", path: "break", text: "Everyone sees a boy fly. Pa lives. The secret doesn't.", effects: { fame: 14, happiness: 6 } },
        ],
      },
      {
        id: "planet", age: 24, title: "The Daily Planet", text: "A job at the Planet in {city}. Perry White yells. Lois Lane rewrites your lede and is right about it.",
        choices: [
          { id: "glasses", label: "Glasses and a slouch", path: "canon", text: "Clark is mild. Superman is not. It works, somehow.", effects: { smarts: 4, reputation: 4 } },
          { id: "both", label: "Tell Lois the truth", path: "bend", text: "She already knew. She wants an exclusive.", effects: { happiness: 8, fame: 4 } },
        ],
      },
      {
        id: "zod", age: 28, title: "General Zod", text: "A Phantom Zone ship tears the sky open over {city}. General Zod demands the last son of Krypton surrender.",
        choices: [
          { id: "fight", label: "Meet him in the sky", path: "canon", text: "Two Kryptonians. One city. You keep the fight over the empty desert, mostly.", fight: "zod", meet: "zod" },
          { id: "talk", label: "Offer him the farm", path: "break", text: "Zod laughs, then looks at the wheat for a long time.", effects: { karma: 6 }, meet: "zod" },
        ],
      },
      {
        id: "lex-armor", age: 33, title: "Luthor Rising", text: "Lex has a company, a city and a warsuit. He says you're an alien invasion of one.",
        choices: [
          { id: "fight", label: "Take the suit apart", path: "canon", text: "Green kryptonite in the gauntlets. You win anyway. He smiles like he planned that.", fight: "lex", meet: "lex", arch: true },
          { id: "expose", label: "Expose him in print", path: "bend", text: "Clark Kent's byline does what Superman's fists can't.", effects: { reputation: 8, smarts: 4 }, meet: "lex", arch: true },
        ],
      },
      {
        id: "doomsday", age: 40, title: "Doomsday", text: "Something with bone spikes walks out of a crater and does not stop. Every hero who tries falls back.",
        choices: [
          { id: "fight", label: "Fight to the last breath", path: "canon", text: "The two of you fall together. The world wears black armbands. Then a heartbeat.", fight: "doomsday", meet: "doomsday", effects: { health: -20, fame: 16 } },
          { id: "league", label: "Call the League first", path: "bend", text: "Nobody dies today. The cover of the Planet is a team photo.", effects: { reputation: 10 }, trait: "team", meet: "doomsday" },
        ],
      },
      {
        id: "brainiac", age: 47, title: "Brainiac", text: "A skull-shaped ship over {city}. Brainiac shrank Kandor once. Now it wants your city for its collection.",
        choices: [
          { id: "fight", label: "Break the bottle", path: "canon", text: "You free the city. You find Kandor in its hold, still alive.", fight: "brainiac", meet: "brainiac" },
          { id: "trade", label: "Offer yourself instead", path: "break", text: "Brainiac studies you for a week. You study it back.", effects: { smarts: 8, health: -6 }, meet: "brainiac" },
        ],
      },
      {
        id: "jon", age: 58, title: "Superboy", text: "Your son Jon sets the kitchen on fire with his eyes. Lois says he gets that from you.",
        choices: [
          { id: "train", label: "Teach him to hold back", path: "canon", text: "The same lessons Pa gave you, in the same barn. The S fits him.", effects: { happiness: 10 }, trait: "family" },
          { id: "free", label: "Let him be loud", path: "bend", text: "He saves a ferry on live TV at fourteen. You're proud and terrified.", effects: { fame: 8, happiness: 6 } },
        ],
      },
      {
        id: "last-zod", age: 63, title: "Kneel Before Zod", text: "Zod is back, older and angrier, with an army from the Phantom Zone. He has waited thirty years for a rematch.",
        choices: [
          { id: "fight", label: "One more time", path: "canon", text: "Older bones, same sky. This time you send him home.", fight: "zod", meet: "zod", effects: { fame: 10 } },
          { id: "zone", label: "Seal the Zone forever", path: "bend", text: "A trick from the Fortress. No more ghosts from Krypton.", effects: { smarts: 6, karma: 6 }, meet: "zod" },
        ],
      },
      {
        id: "lex-end", age: 68, title: "Lex's Last Lecture", text: "Lex Luthor, old and sick, asks to see you. Not Superman. Clark.",
        choices: [
          { id: "visit", label: "Go as Clark", path: "canon", text: "He says he always knew. He says he'd do it all again. He holds your hand anyway.", effects: { happiness: 4, karma: 8 }, meet: "lex" },
          { id: "cure", label: "Bring a cure from the Fortress", path: "break", text: "Lex lives. He doesn't thank you. He builds a hospital.", effects: { karma: 12, reputation: 6 }, meet: "lex" },
        ],
      },
      {
        id: "fortress", age: 72, title: "The Fortress", text: "Ice and crystal at the top of the world. Jon has the cape now. Ma's pie on the table.",
        endings: {
          canon: "Earth-3838 ends the way the legend should: a farm boy who was strong enough to be gentle, every single day.",
          bend: "Earth-3838 bends brighter: the Kents, the League and a world that learned to look up without being afraid.",
          break: "Earth-3838 ends off the map. No comic ever let Lex Luthor and Clark Kent grow old as friends.",
        },
        choices: [
          { id: "farm", label: "Go home to the farm", path: "canon", text: "You fly low, slow, and you land in the wheat.", effects: { happiness: 12 } },
          { id: "stars", label: "Visit Kandor", path: "bend", text: "A city of your people, full-size now, under a red sun. They throw a parade.", effects: { happiness: 10, fame: 6 } },
        ],
      },
    ],
    villains: [
      { id: "lex", name: "Lex Luthor", alias: "Lex Luthor", title: "The boy next door", powerId: "intellect", level: 7, blurb: "The smartest man on Earth, and he has known you since you were nine.", moves: [mv("Kryptonite Gauntlet", "Green light, right where it hurts.", 8, "strike", "energy", "burst"), mv("Warsuit Barrier", "LexCorp plating.", 5, "guard", "shield", "guard"), mv("Press Conference", "The city turns on you.", 5, "trick", "psychic", "status"), mv("Orbital Strike", "He bought a satellite for this.", 7, "strike", "light", "area")] },
      { id: "zod", name: "Dru-Zod", alias: "General Zod", title: "Krypton's last general", powerId: "strength", level: 8, blurb: "Every power you have, plus a soldier's training and no reason to hold back.", moves: [mv("Kneel", "A fist from orbit.", 9, "strike", "force", "burst"), mv("Heat Vision", "Red eyes, white heat.", 7, "strike", "fire", "area"), mv("Phantom Step", "Out of the Zone, behind you.", 5, "trick", "warp", "dash"), mv("Military Stance", "He was born for this.", 5, "guard", "shield", "guard")] },
      { id: "doomsday", name: "Doomsday", alias: "Doomsday", title: "The thing that killed Superman", powerId: "strength", level: 9, blurb: "Built to adapt. Whatever kills it once never works again.", moves: [mv("Bone Spike", "Through the guard.", 9, "strike", "force", "burst"), mv("Adapt", "Yesterday's punch does nothing.", 6, "guard", "life", "guard"), mv("Rampage", "A city block, sideways.", 8, "strike", "force", "area"), mv("Unstoppable", "It just keeps walking.", 5, "trick", "gravity", "status")] },
      { id: "brainiac", name: "Vril Dox", alias: "Brainiac", title: "The collector of cities", powerId: "mind", level: 8, from: 44, blurb: "A coluan mind with twelve levels of intellect and a shelf of bottled worlds.", moves: [mv("Shrink Ray", "Your city, pocket-sized.", 7, "trick", "warp", "status"), mv("Tendrils", "Cables from the skull ship.", 7, "strike", "energy", "area"), mv("Data Siphon", "It learns your moves.", 5, "trick", "psychic"), mv("Force Lattice", "A cage of light.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "wonder-woman",
    hero: "Wonder Woman",
    name: "Diana of Themyscira",
    earth: "Earth-1941",
    twist: "Themyscira was never hidden. The island has a seat at the UN, and Diana is its ambassador at eighteen.",
    tagline: "Truth, a lasso, and a very firm handshake.",
    sex: "female",
    cityId: "harbor",
    upbringing: "legacy",
    face: "loud",
    drive: "idealistic",
    family: [{ name: "Hippolyta", note: "Mother, Queen of the Amazons", sex: "female" }, { name: "Antiope", note: "Aunt and general", sex: "female" }],
    extra: ["royalty"],
    look: { skin: 1, hair: 0, style: 2, build: 1, feature: 0 },
    portrait: 1941,
    art: "hero-wonder-woman",
    color: "#e2b13c",
    powers: ["super-strength", "flight", "aegis-shell"],
    decades: [
      { title: "Clay and Lightning", premise: "{name} is the only child on an island of warriors. She was sculpted from clay, and something answered." },
      { title: "The Contest", premise: "Teen years. Antiope trains {name} in secret. Hippolyta pretends not to know." },
      { title: "Ambassador", premise: "Twenties. A plane in the sea, a man named Steve Trevor, and a seat at the table in {city}." },
      { title: "Wonder Woman", premise: "Thirties. Gods, monsters and cameras. {name} would rather talk first." },
      { title: "The God of War", premise: "Forty. Ares wants a war. {name} wants him to sit down." },
      { title: "Queen of Two Worlds", premise: "Fifty. The island needs a queen. The world needs a hero. She has two hands." },
      { title: "The Trinity", premise: "Sixty. The founders grow older together. Diana does not, quite." },
      { title: "Paradise Island", premise: "Late light over the sea. The lasso hangs on the wall and still glows a little." },
    ],
    beats: [
      {
        id: "clay", age: 7, wake: true, title: "Clay and Lightning", text: "Hippolyta tells you the truth: you were shaped from clay and given life by the gods. That night your bracelets ring like bells.",
        choices: [
          { id: "accept", label: "Ask to train", path: "canon", text: "Your mother says no. Antiope says later. You wait about a day.", effects: { happiness: 4, health: 4 } },
          { id: "question", label: "Ask which god", path: "bend", text: "Hippolyta goes quiet. The answer is a name she doesn't want to say.", effects: { smarts: 4 } },
        ],
      },
      {
        id: "contest", age: 17, title: "The Contest", text: "The Amazons hold a tournament to choose who goes to the world of men. Your mother forbids you to enter.",
        choices: [
          { id: "mask", label: "Enter in a mask", path: "canon", text: "You win. You take the mask off. Your mother's face does several things at once.", effects: { fame: 6, parentBelief: -4 } },
          { id: "ask", label: "Ask her permission", path: "break", text: "She says yes. It's the hardest thing she's ever said.", effects: { happiness: 8, parentBelief: 6 } },
        ],
      },
      {
        id: "steve", age: 19, title: "Steve Trevor", text: "A plane crashes in the bay. A pilot named Steve Trevor washes ashore with news of a war and a city called {city}.",
        choices: [
          { id: "go", label: "Go with him", path: "canon", text: "You leave paradise for a world that doesn't know what an Amazon is. It learns.", effects: { happiness: 6, fame: 4 } },
          { id: "un", label: "Take the UN seat", path: "bend", text: "The world comes to you instead. Ambassador Diana, eighteen, and nobody interrupts her twice.", effects: { reputation: 10 }, trait: "liaison" },
        ],
      },
      {
        id: "cheetah", age: 24, title: "Barbara Minerva", text: "An archaeologist befriends you at the museum. Then she finds an idol in the stacks and it gives her claws.",
        choices: [
          { id: "fight", label: "Stop the Cheetah", path: "canon", text: "She's fast. You're patient. She escapes, and you know she'll be back.", fight: "cheetah", meet: "cheetah" },
          { id: "lasso", label: "Use the lasso on her", path: "bend", text: "The truth: she's lonely. You both cry. She still runs.", effects: { karma: 6 }, meet: "cheetah" },
        ],
      },
      {
        id: "circe", age: 29, title: "Circe", text: "The witch who turns men into pigs has turned {city}'s council into swine. She wants an audience with the clay princess.",
        choices: [
          { id: "fight", label: "Break her spell", path: "canon", text: "A storm of magic. Your bracelets catch every bolt.", fight: "circe", meet: "circe" },
          { id: "bargain", label: "Bargain with her", path: "break", text: "Circe keeps one pig. The mayor, who deserved it.", effects: { karma: -2, happiness: 4 }, meet: "circe" },
        ],
      },
      {
        id: "antiope", age: 34, title: "Antiope", text: "An attack on Themyscira. Your aunt stands between the gate and the army.",
        choices: [
          { id: "honor", label: "Honor her stand", path: "canon", text: "She falls with her sword in her hand. The island sings for three days.", effects: { happiness: -12, health: 6 }, loss: ["Antiope"] },
          { id: "save", label: "Fly to her side", path: "break", text: "Two swords at the gate. She lives to complain about your form.", effects: { happiness: 8, fame: 4 } },
        ],
      },
      {
        id: "ares", age: 40, title: "Ares", text: "The God of War has been whispering in generals' ears for decades. Now he walks into {city} in person.",
        choices: [
          { id: "fight", label: "Fight a god", path: "canon", text: "The lasso holds even him. He hates the truth more than he hates you.", fight: "ares", meet: "ares", arch: true },
          { id: "truth", label: "Make him tell the truth", path: "bend", text: "In the lasso, Ares admits he's lonely too. The war stops for a week.", effects: { karma: 10 }, meet: "ares", arch: true },
        ],
      },
      {
        id: "medusa", age: 48, title: "Medusa", text: "The gorgon broadcasts her gaze over live television. Anyone who watches turns to stone.",
        choices: [
          { id: "fight", label: "Fight blindfolded", path: "canon", text: "Antiope taught you this when you were twelve. It works.", fight: "medusa", meet: "medusa" },
          { id: "mirror", label: "Hold up a shield", path: "bend", text: "Old trick. Still works.", effects: { smarts: 4, fame: 6 }, meet: "medusa" },
        ],
      },
      {
        id: "donna", age: 58, title: "Donna Troy", text: "A girl made from your reflection, raised on the island, asks to carry your name.",
        choices: [
          { id: "sister", label: "Call her sister", path: "canon", text: "Wonder Girl, then something of her own. You train her on the same beach.", effects: { happiness: 10 }, trait: "family" },
          { id: "queen", label: "Make her the island's champion", path: "bend", text: "She stays on Themyscira. The island has a hero; the world still has you.", effects: { reputation: 6 } },
        ],
      },
      {
        id: "last-hunt", age: 63, title: "The Last Hunt", text: "Barbara Minerva, grey in the fur now, wants one last chase through the museum where it began.",
        choices: [
          { id: "fight", label: "Give her the chase", path: "canon", text: "Old friends, old claws. You let her get close. Then you don't.", fight: "cheetah", meet: "cheetah" },
          { id: "free", label: "Free her from the idol", path: "break", text: "The curse lifts. Barbara gets her life back and a job at the museum.", effects: { karma: 12 }, meet: "cheetah" },
        ],
      },
      {
        id: "war-again", age: 67, title: "War Returns", text: "Ares rises again. He says there's always a war, and he's always invited.",
        choices: [
          { id: "fight", label: "Send him back", path: "canon", text: "Older, slower, and better at this than he is.", fight: "ares", meet: "ares", effects: { fame: 10 } },
          { id: "seat", label: "Give him a seat at the UN", path: "break", text: "He has to sit in committee meetings now. It's the cruelest thing you've ever done.", effects: { karma: 6, reputation: 8 }, meet: "ares" },
        ],
      },
      {
        id: "paradise", age: 72, title: "Paradise Island", text: "Home. Your mother's throne is yours if you want it. The sea is the same colour it was when you were seven.",
        endings: {
          canon: "Earth-1941 ends the way the legend should: a princess who left paradise, and made the world a little more like it.",
          bend: "Earth-1941 bends wiser: an ambassador, a queen and a sister, and the island's doors open for good.",
          break: "Earth-1941 ends off the map. No comic ever let Diana grow old at a table where the gods had to listen.",
        },
        choices: [
          { id: "throne", label: "Take the throne", path: "canon", text: "Queen Diana. The Amazons cheer for an hour.", effects: { happiness: 10, reputation: 6 } },
          { id: "world", label: "Stay in the world", path: "bend", text: "A small apartment in {city} with a view of the bay.", effects: { happiness: 10 } },
        ],
      },
    ],
    villains: [
      { id: "cheetah", name: "Barbara Minerva", alias: "Cheetah", title: "The friend with claws", powerId: "speed", level: 7, blurb: "An archaeologist who found a god in a box and lost herself to it.", moves: [mv("Pounce", "From the shadows, all at once.", 8, "strike", "speed", "dash"), mv("Rake", "Claws like knives.", 7, "strike", "force", "burst"), mv("Hunter's Patience", "She waits. You blink.", 5, "trick", "shadow", "status"), mv("Prowl", "Too fast to pin.", 5, "guard", "speed", "guard")] },
      { id: "circe", name: "Circe", alias: "Circe", title: "The witch of Aeaea", powerId: "mind", level: 7, blurb: "A sorceress older than the island, with a grudge against every Amazon.", moves: [mv("Swine Hex", "Oink.", 6, "trick", "arcane", "status"), mv("Witchfire", "Green flame that bites.", 7, "strike", "arcane", "area"), mv("Glamour", "She looks like your mother.", 5, "trick", "psychic"), mv("Ward of Aeaea", "Old magic, thick as walls.", 5, "guard", "shield", "guard")] },
      { id: "ares", name: "Ares", alias: "Ares", title: "The God of War", powerId: "strength", level: 9, blurb: "Every war ever fought fed him. He is hungry.", moves: [mv("Spear of War", "It has killed gods.", 9, "strike", "force", "burst"), mv("Battle Cry", "Every soldier in the city hears it.", 6, "trick", "psychic", "status"), mv("Aegis of Bronze", "War-god armor.", 6, "guard", "shield", "guard"), mv("Rain of Blades", "The sky remembers every battle.", 8, "strike", "force", "area")] },
      { id: "medusa", name: "Medusa", alias: "Medusa", title: "The gorgon", powerId: "mind", level: 8, from: 44, blurb: "Snakes for hair and a gaze that ends conversations.", moves: [mv("Stone Gaze", "Don't look.", 8, "trick", "arcane", "status"), mv("Serpent Lash", "A dozen bites at once.", 7, "strike", "life", "area"), mv("Coil", "She tightens.", 6, "strike", "force"), mv("Petrified Hide", "Skin like marble.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "captain-america",
    hero: "Captain America",
    name: "Steve Rogers",
    earth: "Earth-4101",
    twist: "Peggy Carter takes the second dose of the serum. There are two Captains, and they don't always agree.",
    tagline: "He can do this all day. He has, actually.",
    sex: "male",
    cityId: "nyc",
    upbringing: "tragic",
    face: "loud",
    drive: "duty",
    family: [{ name: "Sarah Rogers", note: "Mother, a nurse", sex: "female" }, { name: "Joseph Rogers", note: "Father", sex: "male" }],
    extra: [],
    look: { skin: 0, hair: 1, style: 1, build: 0, feature: 0 },
    portrait: 4101,
    art: "hero-captain-america",
    color: "#3a6fd8",
    boost: { karma: 10 },
    powers: ["super-strength", "aegis-shell", "regeneration"],
    decades: [
      { title: "Brooklyn Kid", premise: "{name} is small, sick, and starts fights he can't win. His mother patches him up and tells him not to stop." },
      { title: "Back Alleys", premise: "Teen years. Bucky Barnes keeps pulling {name} out of fights. {name} keeps going back in." },
      { title: "Project Rebirth", premise: "Twenties. A recruiting office, a scientist with an accent, and a machine full of blue light." },
      { title: "The First Avenger", premise: "Thirties. A shield, a team, and a world that wants a symbol more than a man." },
      { title: "The Winter Soldier", premise: "Forty. The friend {name} lost comes back with a metal arm and no memory." },
      { title: "Civil War", premise: "Fifty. The heroes split down the middle. {name} picks the side he can live with." },
      { title: "The Shield Passes", premise: "Sixty. The serum slows the clock. It doesn't stop it." },
      { title: "One Dance", premise: "Late light over {city}. A record player, an old uniform in a box, and somebody to dance with." },
    ],
    beats: [
      {
        id: "alley", age: 10, title: "The Alley", text: "Three bigger kids, one smaller kid, and you. You could walk away.",
        choices: [
          { id: "stand", label: "Step in", path: "canon", text: "You lose. You get up. You lose again. The smaller kid gets away. That's the point.", effects: { health: -6, karma: 8 } },
          { id: "call", label: "Run for help", path: "bend", text: "Bucky comes running. You win together, which you'll learn is the trick.", effects: { happiness: 6 }, trait: "team" },
        ],
      },
      {
        id: "sarah", age: 17, title: "Sarah Rogers", text: "Your mother catches TB on the ward. She tells you she's fine. She isn't.",
        choices: [
          { id: "stay", label: "Stay by her bed", path: "canon", text: "She tells you she's proud of you. Bucky walks you home from the funeral.", effects: { happiness: -14, karma: 6 }, loss: ["Sarah Rogers"] },
          { id: "doctor", label: "Find a doctor who'll try", path: "break", text: "A new drug, a long winter, and she pulls through. She lives to see what you become.", effects: { happiness: 8, money: -2000 } },
        ],
      },
      {
        id: "rebirth", age: 21, wake: true, title: "Project Rebirth", text: "Five rejections. Then Dr. Erskine picks you anyway. The machine glows. In this universe, Peggy Carter is next in line.",
        choices: [
          { id: "serum", label: "Step into the light", path: "canon", text: "It hurts. You walk out a foot taller. The scientist who believed in you is shot that afternoon.", effects: { health: 20, fame: 8 } },
          { id: "both", label: "Insist Peggy goes too", path: "bend", text: "Two doses, two Captains. The papers can't decide which one to put on the cover.", effects: { reputation: 8, happiness: 6 }, trait: "team" },
        ],
      },
      {
        id: "skull", age: 23, title: "The Red Skull", text: "Johann Schmidt took a bad dose of the same serum. It burned his face off and left the rest of him worse.",
        choices: [
          { id: "fight", label: "Charge the bunker", path: "canon", text: "Shield up, through the door. He laughs at the stars on your chest. You knock the laugh out.", fight: "red-skull", meet: "red-skull", arch: true },
          { id: "plan", label: "Plan the raid first", path: "bend", text: "Your Commandos take the base without a shot. Schmidt escapes, furious.", effects: { reputation: 8, smarts: 4 }, meet: "red-skull", arch: true },
        ],
      },
      {
        id: "train", age: 25, title: "The Train", text: "A mountain train. Bucky, on the outside, holding on. The rail is giving way.",
        choices: [
          { id: "reach", label: "Reach for him", path: "canon", text: "Your fingers miss by an inch. You'll see that inch for the rest of your life.", effects: { happiness: -12 }, meet: "winter" },
          { id: "jump", label: "Jump after him", path: "break", text: "You both fall. You both live. Hydra never gets their Winter Soldier.", effects: { happiness: 8, health: -10 } },
        ],
      },
      {
        id: "ice", age: 29, title: "The Ice", text: "A bomber full of bombs, aimed at {city}. Nobody else can fly it.",
        choices: [
          { id: "down", label: "Put it in the ice", path: "canon", text: "Peggy's voice on the radio until it isn't. You wake up years later to a city you don't know.", effects: { health: -10, happiness: -8, fame: 10 } },
          { id: "bail", label: "Bail at the last second", path: "bend", text: "You hit the water hard and swim for an hour. You make the dance with Peggy after all.", effects: { happiness: 12 } },
        ],
      },
      {
        id: "winter", age: 37, title: "The Winter Soldier", text: "An assassin with a metal arm takes down a S.H.I.E.L.D. convoy. When the mask comes off, it's Bucky.",
        choices: [
          { id: "fight", label: "Fight to reach him", path: "canon", text: "\"You're my mission.\" \"Then finish it.\" You drop the shield. He drags you out of the river.", fight: "winter", meet: "winter" },
          { id: "talk", label: "Say his name", path: "bend", text: "He stops. He doesn't know why. It's a start.", effects: { karma: 10, happiness: 4 }, meet: "winter" },
        ],
      },
      {
        id: "zemo", age: 44, title: "Baron Zemo", text: "Helmut Zemo lost his family in your last battle. He doesn't want to beat you. He wants to break your team.",
        choices: [
          { id: "fight", label: "Hunt him down", path: "canon", text: "You find him. You beat him. Half your friends still aren't speaking to you.", fight: "zemo", meet: "zemo" },
          { id: "accords", label: "Sign the Accords", path: "break", text: "The team holds together. Zemo watches the signing ceremony and walks away.", effects: { reputation: 10 }, trait: "liaison", meet: "zemo" },
        ],
      },
      {
        id: "sam", age: 58, title: "The Shield", text: "Sam Wilson has flown at your side for twenty years. The serum is slowing down. The shield is heavy.",
        choices: [
          { id: "pass", label: "Hand Sam the shield", path: "canon", text: "\"It feels like it's someone else's.\" \"It's not.\" A new Captain on the cover.", effects: { happiness: 10, reputation: 8 }, trait: "team" },
          { id: "keep", label: "Keep it a while longer", path: "bend", text: "Two Captains on patrol, one with wings. It works.", effects: { fame: 6 } },
        ],
      },
      {
        id: "skull-reborn", age: 63, title: "The Skull Reborn", text: "Hydra pulls the Red Skull out of a cosmic cube. He's younger than you now, and he's been waiting.",
        choices: [
          { id: "fight", label: "One last fight", path: "canon", text: "He's faster. You're smarter. The cube goes in the river.", fight: "red-skull", meet: "red-skull", effects: { fame: 10 } },
          { id: "cube", label: "Destroy the cube first", path: "bend", text: "No cube, no comeback. The Skull fades back into history.", effects: { karma: 8, smarts: 4 }, meet: "red-skull" },
        ],
      },
      {
        id: "bench", age: 67, title: "Bucky's Bench", text: "Bucky, grey in the beard, sits on a bench by the lake and asks if you're still mad about the train.",
        choices: [
          { id: "peace", label: "Tell him you never were", path: "canon", text: "Two old men from Brooklyn, feeding ducks. Neither of you says sorry. Neither of you needs to.", effects: { happiness: 12 }, meet: "winter" },
          { id: "mission", label: "Ask him for one more mission", path: "bend", text: "A road trip across a country you both fought for. It's the best month of your life.", effects: { happiness: 10, health: -2 }, meet: "winter" },
        ],
      },
      {
        id: "dance", age: 72, title: "One Dance", text: "A record player. A slow song. You promised someone a dance a long time ago.",
        endings: {
          canon: "Earth-4101 ends the way the legend should: a kid from Brooklyn who never stopped standing up, and finally got his dance.",
          bend: "Earth-4101 bends kinder: two Captains, one team, and a shield that always found the right hands.",
          break: "Earth-4101 ends off the map. No comic ever let Steve Rogers skip the ice and grow old on time.",
        },
        choices: [
          { id: "dance", label: "Dance", path: "canon", text: "You step on her foot twice. She doesn't mind.", effects: { happiness: 14 } },
          { id: "teach", label: "Teach a history class", path: "bend", text: "You were there. The students can tell.", effects: { smarts: 4, happiness: 8 } },
        ],
      },
    ],
    villains: [
      { id: "red-skull", name: "Johann Schmidt", alias: "Red Skull", title: "The serum's other son", powerId: "strength", level: 8, blurb: "Everything the serum made you, turned inside out.", moves: [mv("Luger Volley", "He never fights fair.", 6, "strike", "force", "area"), mv("Cube Flare", "Cosmic light in a cube.", 9, "strike", "energy", "burst"), mv("Hail Hydra", "Agents everywhere.", 5, "trick", "shadow", "status"), mv("Dust of Death", "A cloud you shouldn't breathe.", 6, "trick", "life")] },
      { id: "winter", name: "Bucky Barnes", alias: "Winter Soldier", title: "Your best friend, reprogrammed", powerId: "strength", level: 7, blurb: "A metal arm, seventy years of orders, and somewhere in there, Bucky.", moves: [mv("Metal Arm", "It stops your shield cold.", 8, "strike", "force", "burst"), mv("Sniper's Nest", "A shot from a mile out.", 7, "strike", "speed"), mv("Ghost Story", "Nobody sees him coming.", 5, "trick", "shadow", "dash"), mv("Brace", "The arm takes the hit.", 5, "guard", "shield", "guard")] },
      { id: "zemo", name: "Helmut Zemo", alias: "Baron Zemo", title: "The man who breaks teams", powerId: "intellect", level: 6, from: 40, blurb: "No powers, no mercy, and a plan that turns your friends into a weapon.", moves: [mv("Divide", "Your team turns on you.", 6, "trick", "psychic", "status"), mv("Adhesive X", "You're stuck.", 5, "trick", "stretch"), mv("Fencing Lunge", "Old-world swordsmanship.", 7, "strike", "speed", "dash"), mv("Contingency", "He planned for you.", 5, "guard", "shield", "guard")] },
      { id: "crossbones", name: "Brock Rumlow", alias: "Crossbones", title: "Hydra's heavy", powerId: "strength", level: 6, from: 34, blurb: "A strike-team leader with a grudge and gauntlets.", moves: [mv("Gauntlet Punch", "Built to break shields.", 7, "strike", "force", "burst"), mv("Frag Grenade", "Everyone down.", 6, "strike", "fire", "area"), mv("Dirty Fighter", "Sand in the eyes.", 5, "trick", "shadow"), mv("Body Armor", "Hydra plating.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "thor",
    hero: "Thor",
    name: "Thor Odinson",
    earth: "Earth-8017",
    twist: "Loki is the firstborn heir. Thor is the adopted one, a frost-giant foundling who learned to love thunder.",
    tagline: "He's worthy. He just keeps having to prove it.",
    sex: "male",
    cityId: "crown",
    upbringing: "legacy",
    face: "loud",
    drive: "glory",
    family: [{ name: "Frigga", note: "Mother, Queen of Asgard", sex: "female" }, { name: "Odin", note: "All-Father", sex: "male" }],
    extra: ["royalty"],
    look: { skin: 0, hair: 2, style: 2, build: 1, feature: 1 },
    portrait: 8017,
    art: "hero-thor",
    color: "#a07cff",
    powers: ["lightning-control", "super-strength", "storm-calling"],
    decades: [
      { title: "A Prince of Asgard", premise: "{name} is the second son. Loki is the heir. Both of them want Odin to look their way." },
      { title: "Worthy", premise: "Teen years. A hammer sits in the vault that nobody can lift. {name} tries every day." },
      { title: "Banished", premise: "Twenties. Odin strips {name} of his power and drops him in {city} to learn humility." },
      { title: "God of Thunder", premise: "Thirties. Avengers, frost giants and a brother who keeps dying and coming back." },
      { title: "Ragnarok", premise: "Forty. A sister nobody mentioned. A city on fire. A hammer in pieces." },
      { title: "King of Asgard", premise: "Fifty. A throne in exile, a people to feed, and a crown that never fit." },
      { title: "The Unworthy", premise: "Sixty. Someone else lifts the hammer. {name} learns what he is without it." },
      { title: "All-Father", premise: "Late light over {city}. Two ravens on the windowsill, waiting." },
    ],
    beats: [
      {
        id: "brothers", age: 8, title: "Brothers", text: "Loki, the heir, turns your sword into a snake at the feast. Everyone laughs. Odin doesn't.",
        choices: [
          { id: "laugh", label: "Laugh with him", path: "canon", text: "You pull the snake's tail. He turns it back. Brothers, for now.", effects: { happiness: 6 }, meet: "loki" },
          { id: "punch", label: "Punch him", path: "bend", text: "Odin separates you. Frigga takes you both for a long walk.", effects: { health: 2, happiness: -2 }, meet: "loki" },
        ],
      },
      {
        id: "worthy", age: 16, wake: true, title: "Worthy", text: "You go to the vault to steal a look at Mjolnir. You're there to save a servant boy trapped under rubble, not for glory. The hammer comes to your hand.",
        choices: [
          { id: "lift", label: "Lift it", path: "canon", text: "Thunder over all nine realms. Loki stares at you across the hall.", effects: { fame: 10, powerLevel: 0.3 } },
          { id: "give", label: "Hand it to Loki", path: "break", text: "He can't lift it. He never forgives you for offering.", effects: { karma: 6 }, meet: "loki" },
        ],
      },
      {
        id: "banished", age: 21, title: "Banished", text: "You start a war with the frost giants on a dare. Odin tears the lightning out of you and throws you down to {city}.",
        choices: [
          { id: "humble", label: "Learn to be mortal", path: "canon", text: "Coffee, a hospital bed, and Jane Foster driving her van into you twice.", effects: { smarts: 4, happiness: 4 } },
          { id: "storm", label: "Shout at the sky", path: "bend", text: "The sky doesn't answer. A girl with a clipboard does.", effects: { happiness: -4, health: 4 } },
        ],
      },
      {
        id: "jane", age: 23, title: "Jane Foster", text: "An astrophysicist who chases storms. She wants to study you. You want her to keep looking at you like that.",
        choices: [
          { id: "stay", label: "Stay in {city}", path: "canon", text: "Asgard calls. You promise to come back. You mean it every time.", effects: { happiness: 10 } },
          { id: "take", label: "Take her to Asgard", path: "break", text: "Odin is furious. Frigga likes her immediately.", effects: { happiness: 8, reputation: -2 } },
        ],
      },
      {
        id: "throne", age: 27, title: "Loki's Throne", text: "Odin falls into the long sleep. Loki takes the throne and sends the Destroyer to {city} to finish you.",
        choices: [
          { id: "fight", label: "Face your brother", path: "canon", text: "On the Bifrost, with the stars falling. He lets go of the edge.", fight: "loki", meet: "loki", arch: true },
          { id: "kneel", label: "Kneel and let him rule", path: "break", text: "Loki didn't expect that. He doesn't know what to do with a brother who isn't fighting.", effects: { karma: 10, fame: -4 }, meet: "loki", arch: true },
        ],
      },
      {
        id: "dark-world", age: 33, title: "The Dark World", text: "Malekith and the dark elves return from before time. They come for the Aether, and for your mother.",
        choices: [
          { id: "fight", label: "Fight the dark elves", path: "canon", text: "Frigga dies with a sword in her hand. You burn her boat at sea.", fight: "malekith", meet: "malekith", loss: ["Frigga"] },
          { id: "guard", label: "Guard the queen yourself", path: "break", text: "She lives. Malekith escapes into the dark between worlds.", effects: { happiness: 8 }, meet: "malekith" },
        ],
      },
      {
        id: "hela", age: 40, title: "Ragnarok", text: "A sister nobody mentioned. Hela, Goddess of Death, catches Mjolnir in one hand and crushes it.",
        choices: [
          { id: "fight", label: "Fight without the hammer", path: "canon", text: "You were never the god of hammers. Lightning pours out of you like a river.", fight: "hela", meet: "hela", effects: { powerLevel: 0.3 } },
          { id: "surtur", label: "Let Asgard burn to stop her", path: "bend", text: "Asgard is a people, not a place. You save the people.", effects: { karma: 10, happiness: -6 }, meet: "hela" },
        ],
      },
      {
        id: "king", age: 48, title: "King of Asgard", text: "New Asgard, a fishing village on a cold coast. Your people need a king. You'd rather be on a ship somewhere.",
        choices: [
          { id: "rule", label: "Take the crown", path: "canon", text: "You rule well. It's very boring. You're very good at it.", effects: { reputation: 10, happiness: -2 } },
          { id: "give", label: "Give the crown to Valkyrie", path: "bend", text: "She's better at it. You go on a long trip with friends.", effects: { happiness: 10 }, trait: "team" },
        ],
      },
      {
        id: "jane-hammer", age: 58, title: "The Mighty Thor", text: "The pieces of Mjolnir call to someone. Jane Foster lifts the hammer, and the lightning loves her.",
        choices: [
          { id: "bless", label: "Give her your blessing", path: "canon", text: "Two Thors. She's better at the speeches.", effects: { happiness: 10 }, trait: "family" },
          { id: "worthy", label: "Try to lift it again", path: "bend", text: "It wobbles. It's enough. You let her keep it.", effects: { happiness: 6, karma: 4 } },
        ],
      },
      {
        id: "surtur", age: 63, title: "Surtur", text: "The fire giant rises at the end of all things. The prophecy says Asgard falls. It does not say you lose.",
        choices: [
          { id: "fight", label: "Fight the fire giant", path: "canon", text: "Lightning against fire, for a whole day. When the smoke clears, you're the one standing.", fight: "surtur", meet: "surtur", effects: { fame: 12 } },
          { id: "loki", label: "Ask Loki for help", path: "break", text: "He makes a hundred of you. Surtur doesn't know which one to burn.", effects: { karma: 6, happiness: 6 }, meet: "surtur" },
        ],
      },
      {
        id: "last-trick", age: 67, title: "Loki's Last Trick", text: "Loki, older, shows up at your door with a bottle of mead and a story you've heard a hundred times.",
        choices: [
          { id: "drink", label: "Pour two cups", path: "canon", text: "You both laugh at the snake story. He doesn't turn anything into anything. That's the trick.", effects: { happiness: 12 }, meet: "loki" },
          { id: "fight", label: "Spar for old times", path: "bend", text: "Two old gods in the snow. Nobody wins. Everybody's happy.", fight: "loki", meet: "loki" },
        ],
      },
      {
        id: "all-father", age: 72, title: "All-Father", text: "Two ravens land on your windowsill. They used to belong to Odin. They've been waiting for you.",
        endings: {
          canon: "Earth-8017 ends the way the legend should: the adopted son who was worthy all along, and finally believed it.",
          bend: "Earth-8017 bends warmer: a king who gave away his crown, a hammer shared, and a brother at the table.",
          break: "Earth-8017 ends off the map. No comic ever let Thor and Loki grow old in the same house.",
        },
        choices: [
          { id: "throne", label: "Take Odin's seat", path: "canon", text: "You look out over all nine realms. Most of them are fine.", effects: { reputation: 10, happiness: 6 } },
          { id: "fish", label: "Go fishing", path: "bend", text: "A cold fjord, a good boat, and the thunder rolling somewhere far away.", effects: { happiness: 12 } },
        ],
      },
    ],
    villains: [
      { id: "loki", name: "Loki Laufeyson", alias: "Loki", title: "The heir who wanted the hammer", powerId: "shapeshift", level: 8, blurb: "God of mischief, firstborn of Asgard here, and your brother in every way that hurts.", moves: [mv("Hundred Lokis", "Which one is real?", 6, "trick", "psychic", "status"), mv("Dagger in the Back", "Classic.", 8, "strike", "shadow", "burst"), mv("Seidr Bolt", "Green fire from the old magic.", 7, "strike", "arcane", "area"), mv("Shapeshift", "He's your mother now.", 5, "guard", "shadow", "guard")] },
      { id: "malekith", name: "Malekith", alias: "Malekith", title: "The dark elf king", powerId: "ice", level: 8, blurb: "Older than light, and he wants it all switched off.", moves: [mv("Aether Surge", "Red mist that eats stars.", 8, "strike", "shadow", "burst"), mv("Black Ice", "Cold from before the world.", 7, "strike", "ice", "area"), mv("Kursed Strength", "His soldiers become monsters.", 5, "trick", "life", "status"), mv("Shadow Veil", "He isn't there.", 5, "guard", "shadow", "guard")] },
      { id: "hela", name: "Hela", alias: "Hela", title: "Goddess of Death", powerId: "blasts", level: 9, blurb: "Odin's firstborn by blood, locked away until Ragnarok.", moves: [mv("Necroswords", "A rain of black blades.", 8, "strike", "shadow", "area"), mv("Crush the Hammer", "She catches it. She squeezes.", 7, "trick", "force", "status"), mv("Death's Touch", "Cold hands.", 9, "strike", "shadow", "burst"), mv("Antlered Crown", "Death doesn't flinch.", 5, "guard", "shield", "guard")] },
      { id: "surtur", name: "Surtur", alias: "Surtur", title: "The fire at the end of all things", powerId: "fire", level: 10, from: 60, blurb: "A giant of flame whose sword is the end of Asgard.", moves: [mv("Twilight Sword", "It burns realms.", 10, "strike", "fire", "burst"), mv("Muspelheim Rising", "The ground is lava now.", 8, "strike", "fire", "area"), mv("Prophecy", "It is written.", 6, "trick", "arcane", "status"), mv("Crown of Flame", "Too hot to touch.", 6, "guard", "fire", "guard")] },
    ],
  },
  {
    id: "black-panther",
    hero: "Black Panther",
    name: "T'Challa",
    earth: "Earth-6616",
    twist: "Wakanda opened its borders a generation early. The whole world knows the king's name, and the whole world wants the vibranium.",
    tagline: "Wakanda forever. The world, too, if it behaves.",
    sex: "male",
    cityId: "crown",
    upbringing: "legacy",
    face: "loud",
    drive: "duty",
    family: [{ name: "Ramonda", note: "Queen Mother", sex: "female" }, { name: "T'Chaka", note: "Father, the king", sex: "male" }, { name: "Shuri", note: "Little sister, a genius", sex: "female" }],
    extra: ["royalty", "martial"],
    look: { skin: 9, hair: 0, style: 2, build: 1, feature: 0 },
    portrait: 6616,
    art: "hero-black-panther",
    color: "#9b6bff",
    kit: { suit: "#15131d", trim: "#b48cff", mask: "cowl", maskColor: "#15131d", glove: "#1d1a28", crest: "panther" },
    boost: { smarts: 10, money: 40000 },
    powers: ["super-strength", "super-senses", "kinetic-impact"],
    decades: [
      { title: "The Prince of Birnin Zana", premise: "{name} grows up in a palace with a view of the Great Mound, a father who listens more than he speaks, and a sister who hacks the doors." },
      { title: "Warrior Falls", premise: "Teen years. Lessons in the jungle, lessons in council, and a challenge waiting at the edge of the water." },
      { title: "The Heart-Shaped Herb", premise: "Twenties. A crown nobody should want this young, and a purple flower that remembers every king before {name}." },
      { title: "Killmonger", premise: "Thirties. A cousin nobody told {name} about comes home with a grudge as old as the borders." },
      { title: "The World Comes Knocking", premise: "Forty. Open borders mean open hands, and open hands mean thieves. {city} watches how a king answers." },
      { title: "Wakanda Forever", premise: "Fifty. A kingdom under the sea wants what Wakanda has. {name} wants nobody else buried." },
      { title: "The Ancestral Plane", premise: "Sixty. The panthers in the dreams look a lot like {name}'s father now. They have advice." },
      { title: "The Last Hunt", premise: "Late light over {city}. Shuri runs the labs. A young warrior wears the suit. {name} still walks the falls at dawn." },
    ],
    beats: [
      {
        id: "lab", age: 8, title: "Shuri's Lab", text: "Your little sister has built a pair of vibranium sneakers that hum. She wants a test pilot. Your father wants you in council.",
        choices: [
          { id: "council", label: "Sit through council", path: "canon", text: "Three hours on water rights. Your father squeezes your shoulder after. 'A king listens first.'", effects: { smarts: 6, karma: 4 } },
          { id: "test", label: "Test the sneakers", path: "bend", text: "You go through a wall. Shuri takes notes. Your mother pretends not to laugh.", effects: { happiness: 8, health: -3 }, trait: "inventor" },
        ],
      },
      {
        id: "klaw", age: 13, title: "The Sound of Thieves", text: "A man with a sonic cannon tries to rob the Great Mound. Your father steps in front of it.",
        choices: [
          { id: "watch", label: "Freeze where you stand", path: "canon", text: "Ulysses Klaue escapes with a hand full of sound and a vow. T'Chaka is hurt, and alive, and quiet about it.", effects: { happiness: -8 }, meet: "klaw", arch: true },
          { id: "charge", label: "Charge the cannon", path: "break", text: "You are thirteen and very fast. Klaue's hand is crushed in his own machine. He'll remember you.", effects: { health: -8, fame: 6 }, meet: "klaw", arch: true },
        ],
      },
      {
        id: "herb", age: 18, wake: true, title: "The Heart-Shaped Herb", text: "The priests bury you in red sand with the purple flower on your tongue. Your heart slows. A panther walks out of the dark.",
        choices: [
          { id: "accept", label: "Kneel to the Panther", path: "canon", text: "You wake with the strength of every king before you, and their voices, faintly, at the back of your head.", effects: { health: 16, karma: 6 } },
          { id: "ask", label: "Ask the Panther a question", path: "bend", text: "It answers. You don't tell anyone what it said. Your father looks at you differently after.", effects: { smarts: 6, happiness: 4 }, trait: "psychic" },
        ],
      },
      {
        id: "falls", age: 21, title: "Challenge Day", text: "Your father is dead, killed by a bomb at the United Nations. At Warrior Falls, M'Baku of the Jabari steps into the water to take the crown.",
        choices: [
          { id: "fight", label: "Fight him for it", path: "canon", text: "Spears, water, and a crowd chanting both names. You win. You do not kill him. He remembers that.", fight: "mbaku", meet: "mbaku", loss: ["T'Chaka"] },
          { id: "yield", label: "Offer him a seat on the council", path: "bend", text: "Nobody has ever done this. M'Baku laughs for a full minute, then says yes. The Jabari come down the mountain.", effects: { reputation: 10, karma: 8 }, trait: "team", meet: "mbaku", loss: ["T'Chaka"] },
        ],
      },
      {
        id: "cousin", age: 31, title: "N'Jadaka", text: "A soldier from Oakland arrives with Klaue's body and your uncle's ring. Erik Stevens. Killmonger. He wants the throne, and the guns, and the world on fire.",
        choices: [
          { id: "fight", label: "Accept his challenge", path: "canon", text: "He throws you off the falls. The Jabari pull you out of the snow. Round two is in the vibranium mine.", fight: "killmonger", meet: "killmonger", arch: true },
          { id: "share", label: "Offer him the outreach program", path: "break", text: "He doesn't trust it. Then he runs it. Then he's furious it works. Cousins, in the end.", effects: { karma: 12, reputation: 6 }, meet: "killmonger" },
        ],
      },
      {
        id: "open", age: 38, title: "The Open Door", text: "The UN asks Wakanda to share vibranium. Half the council wants to close the borders again.",
        choices: [
          { id: "share", label: "Share the science, keep the mound", path: "canon", text: "Outreach centers open in {city}. Shuri teaches a class. The thieves get bolder, too.", effects: { reputation: 10, fame: 8 }, trait: "liaison" },
          { id: "close", label: "Close the borders", path: "break", text: "Quiet years. Safe years. The world calls you a coward. Some of them are right.", effects: { reputation: -8, money: 20000 } },
        ],
      },
      {
        id: "talokan", age: 46, title: "Talokan Rises", text: "Namor, king of an ocean city, sinks a vibranium detector and gives you a choice: join him against the surface, or be first.",
        choices: [
          { id: "fight", label: "Meet him on the water", path: "canon", text: "He's stronger in the sea. You drag the fight onto the sand. Two kings, both bleeding, both still standing.", fight: "namor", meet: "namor", arch: true },
          { id: "treaty", label: "Write a treaty instead", path: "bend", text: "Two hidden kingdoms, one secret pact. The surface never learns how close it came.", effects: { karma: 10, smarts: 4 }, meet: "namor" },
        ],
      },
      {
        id: "shuri", age: 58, title: "The Mantle", text: "Shuri asks to take the herb. The council says the Panther is yours until you die.",
        choices: [
          { id: "share", label: "Two Panthers, then", path: "bend", text: "Brother and sister in black, back to back. The council shuts up.", effects: { happiness: 10, reputation: 6 }, trait: "team" },
          { id: "tradition", label: "Keep the tradition", path: "canon", text: "She builds you a better suit instead. She's still annoyed. It's still a better suit.", effects: { health: 6 } },
        ],
      },
      {
        id: "killmonger-return", age: 62, title: "The Ancestral Plane", text: "On the plane of your ancestors, the panthers part. Erik is there, older too, angry still. 'One more round, cousin.'",
        choices: [
          { id: "fight", label: "Give him the round", path: "canon", text: "No crowd, no falls, just two men who wanted the same kingdom for different reasons. You both walk away.", fight: "killmonger", meet: "killmonger", effects: { fame: 6 } },
          { id: "sit", label: "Sit with him", path: "bend", text: "You talk about Oakland until the sun comes up on a place with no sun.", effects: { karma: 10, happiness: 8 }, meet: "killmonger" },
        ],
      },
      {
        id: "klaw-last", age: 66, title: "The Sound Returns", text: "Ulysses Klaue is made of sound now, a ghost in the vibranium. He's in every speaker in {city}.",
        choices: [
          { id: "fight", label: "Hunt him in the noise", path: "canon", text: "Silence is a weapon too. Shuri builds you one. The speakers go quiet for good.", fight: "klaw", meet: "klaw", effects: { fame: 8 } },
          { id: "trap", label: "Let Shuri trap him", path: "bend", text: "He's in a jar on her desk. He hums when he's angry.", effects: { smarts: 4, karma: 4 }, meet: "klaw" },
        ],
      },
      {
        id: "dawn", age: 71, title: "Dawn at the Falls", text: "A young warrior from the outreach program wins the challenge. They ask if you're proud or sad.",
        endings: {
          canon: "Earth-6616 ends the way the legend should: a king who opened a door, kept a kingdom, and left the suit in good hands.",
          bend: "Earth-6616 bends kinder: Jabari on the council, Talokan at the table, and a sister who wore the panther too.",
          break: "Earth-6616 ends off the map. No comic ever wrote this Wakanda, and the ancestors say they like it better.",
        },
        choices: [
          { id: "proud", label: "Proud", path: "canon", text: "Both. Mostly proud. You show them where the herb grows.", effects: { happiness: 12 } },
          { id: "teach", label: "Teach them everything", path: "bend", text: "Every morning at the falls. They're faster than you were. You tell them so.", effects: { happiness: 10, smarts: 2 } },
        ],
      },
    ],
    villains: [
      { id: "killmonger", name: "N'Jadaka", alias: "Killmonger", title: "The cousin who came home angry", powerId: "strength", level: 8, blurb: "A soldier raised on the wrong side of the border, wearing your own suit back at you.", moves: [mv("Golden Claws", "A gold panther with your moves.", 8, "strike", "force", "burst"), mv("Kinetic Dump", "Your own hits, stored and spat back.", 9, "strike", "energy", "area"), mv("Black Ops", "He studied you for years.", 5, "trick", "shadow", "status"), mv("Vibranium Weave", "The suit drinks the blow.", 5, "guard", "shield", "guard")] },
      { id: "klaw", name: "Ulysses Klaue", alias: "Klaw", title: "Master of sound", powerId: "blasts", level: 7, blurb: "A thief who turned his ruined hand into a cannon, and then turned himself into noise.", moves: [mv("Sonic Cannon", "A wall of sound.", 8, "strike", "energy", "burst"), mv("Feedback Scream", "Your ears give up first.", 6, "trick", "psychic", "status"), mv("Hard Sound", "Solid noise, shaped like a fist.", 7, "strike", "force", "area"), mv("Static Cloak", "He goes quiet and gone.", 4, "guard", "shadow", "guard")] },
      { id: "mbaku", name: "M'Baku", alias: "Man-Ape", title: "Chief of the Jabari", powerId: "strength", level: 6, blurb: "A mountain of a man who thinks the throne should be won, not inherited.", moves: [mv("Gorilla Charge", "The ground shakes.", 7, "strike", "force", "dash"), mv("War Club", "Jabari wood, harder than steel.", 7, "strike", "force", "burst"), mv("Mountain Roar", "The whole tribe answers.", 5, "trick", "psychic", "status"), mv("Thick Hide", "He just takes it.", 5, "guard", "shield", "guard")] },
      { id: "namor", name: "K'uk'ulkan", alias: "Namor", title: "King of Talokan", powerId: "flight", level: 9, from: 40, blurb: "A winged king from under the sea who has kept his city secret for five hundred years.", moves: [mv("Tidal Spear", "The ocean behind the point.", 9, "strike", "wind", "burst"), mv("Siren Song", "His people sing you still.", 6, "trick", "psychic", "status"), mv("Ankle Wings", "He's above you, then behind you.", 6, "strike", "speed", "dash"), mv("Deep Pressure", "Sea-born skin.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "wolverine",
    hero: "Wolverine",
    name: "James Howlett",
    earth: "Earth-7419",
    twist: "The Weapon X memory wipe failed. Logan remembers every name, every decade, and every person who put the metal in him.",
    tagline: "The best there is at what he does. What he does isn't very nice.",
    sex: "male",
    cityId: "dust",
    upbringing: "tragic",
    face: "loud",
    drive: "lone",
    family: [{ name: "Elizabeth Howlett", note: "Mother", sex: "female" }, { name: "John Howlett", note: "Father", sex: "male" }, { name: "Rose O'Hara", note: "Childhood friend", sex: "female" }],
    extra: ["martial"],
    look: { skin: 1, hair: 0, style: 4, build: 1, feature: 0 },
    portrait: 7419,
    art: "hero-wolverine",
    color: "#f2c230",
    kit: { suit: "#f2c230", trim: "#2a4aa8", mask: "cowl", maskColor: "#2a4aa8", glove: "#2a4aa8", crest: "wolverine" },
    boost: { health: 10 },
    powers: ["regeneration", "super-senses", "pain-map"],
    decades: [
      { title: "The Howlett Estate", premise: "{name} is a sickly kid on a big estate, with a red-haired friend named Rose and a groundskeeper's son who scares him." },
      { title: "Logan", premise: "Teen years. A new name, a mining camp, and a body that heals faster than it should." },
      { title: "A Hundred Wars", premise: "Twenties. Every war that'll have him. {name} doesn't die in any of them, which is starting to look like a problem." },
      { title: "Weapon X", premise: "Thirties. A lab in the snow, a tank full of liquid metal, and men who think they've wiped his mind. They haven't." },
      { title: "The X-Men", premise: "Forty. A bald man in a wheelchair offers {name} a room, a team, and a reason. He takes two out of three." },
      { title: "Madripoor Nights", premise: "Fifty. Patch, the bar, the eyepatch. {name} handles the jobs the team can't know about." },
      { title: "Old Man Logan", premise: "Sixty. He still looks forty. The people he loves don't. That's the real healing factor: you get to watch." },
      { title: "The Last Snikt", premise: "Late light over {city}. A kid with claws calls him dad. {name} pretends that doesn't get to him." },
    ],
    beats: [
      {
        id: "dog", age: 7, title: "The Groundskeeper's Son", text: "Dog Logan kills your puppy to see what you'll do. Rose holds your hand. You feel something itch under your knuckles.",
        choices: [
          { id: "cry", label: "Run to Rose", path: "canon", text: "She tells you it's not your fault. The itch goes away. For now.", effects: { happiness: -6, karma: 4 } },
          { id: "glare", label: "Stare him down", path: "bend", text: "You don't blink. Neither does he. Something old looks back at you out of his eyes.", effects: { happiness: -4 }, trait: "vengeful" },
        ],
      },
      {
        id: "claws", age: 12, wake: true, title: "Bone Claws", text: "Thomas Logan shoots your father in the front hall. You scream, and three bone claws tear out of each hand.",
        choices: [
          { id: "snikt", label: "Let them out", path: "canon", text: "It's over in a second. Thomas is dead. Your mother looks at you like a stranger. You run with Rose into the snow.", effects: { happiness: -14, karma: -4 }, loss: ["John Howlett"], meet: "sabretooth", arch: true },
          { id: "hold", label: "Hold them back", path: "break", text: "The claws go back in, bleeding. Thomas is arrested. Your father lives, barely, and never asks what he saw.", effects: { health: -10, karma: 8 }, meet: "sabretooth" },
        ],
      },
      {
        id: "rose", age: 17, title: "The Mining Camp", text: "You and Rose work a quarry under a new name: Logan. Victor Creed, a man with teeth like yours, picks a fight in the camp.",
        choices: [
          { id: "fight", label: "Fight Creed", path: "canon", text: "Claw on claw in the mud. Rose steps in to stop it. You hit her by mistake. You walk into the woods and live with the wolves for a year.", fight: "sabretooth", meet: "sabretooth", loss: ["Rose O'Hara"] },
          { id: "leave", label: "Take Rose and leave", path: "bend", text: "You walk all night. She marries a good man in town. She writes. You keep every letter.", effects: { happiness: 6 }, meet: "sabretooth" },
        ],
      },
      {
        id: "wars", age: 24, title: "Every War", text: "Beaches, trenches, jungles. You keep getting shot and keep getting up. A man named Stryker starts taking notes.",
        choices: [
          { id: "serve", label: "Keep fighting", path: "canon", text: "Medals under a dozen names. Friends in a dozen graves. You stop learning names.", effects: { fame: 6, happiness: -6 }, trait: "duty" },
          { id: "walk", label: "Walk away from the army", path: "bend", text: "A cabin, a lake, some quiet. Stryker finds you anyway. He always will.", effects: { happiness: 6 } },
        ],
      },
      {
        id: "weaponx", age: 33, title: "Weapon X", text: "They put you in a tank and pour metal into your bones. The memory wipe hums. In this universe, it doesn't take.",
        choices: [
          { id: "break", label: "Break out of the tank", path: "canon", text: "Naked, screaming, adamantium claws, the whole lab on fire. You remember every face. Every one.", effects: { health: -10, karma: -4 }, grant: ["super-durability"], fight: "deathstrike", meet: "deathstrike", arch: true },
          { id: "play", label: "Play dead and listen", path: "bend", text: "They think you're empty. You learn every name in the program before you walk out.", effects: { smarts: 8 }, grant: ["super-durability"], meet: "deathstrike" },
        ],
      },
      {
        id: "xavier", age: 40, title: "The School", text: "A telepath in a wheelchair finds you in a cage-fight bar. 'You don't have to be alone, Logan.'",
        choices: [
          { id: "join", label: "Take the room", path: "canon", text: "A team, a uniform, a red-haired telepath you shouldn't look at twice. You look three times.", effects: { happiness: 10, reputation: 8 }, trait: "team" },
          { id: "solo", label: "Stay on the road", path: "break", text: "Bars, borders, one more fight. The X-Men call when it's bad. You always come.", effects: { fame: 6 } },
        ],
      },
      {
        id: "omega", age: 48, title: "Omega Red", text: "A Soviet super-soldier with carbonadium tentacles comes looking for the one thing that can keep him alive: your healing factor.",
        choices: [
          { id: "fight", label: "Cut him loose", path: "canon", text: "Tentacles around your throat. Claws through the tentacles. He's going back in the freezer.", fight: "omega-red", meet: "omega-red" },
          { id: "trick", label: "Lead him into a trap", path: "bend", text: "Madripoor's harbor, a cargo crane, and a lot of very cold water.", effects: { smarts: 4, reputation: 4 }, meet: "omega-red" },
        ],
      },
      {
        id: "creed-old", age: 58, title: "Birthday", text: "Every year on your birthday, Victor Creed finds you and tries to kill you. This year he's brought a cake.",
        choices: [
          { id: "fight", label: "The annual fight", path: "canon", text: "Same dance as always. Bloodier. You'll both be back next year.", fight: "sabretooth", meet: "sabretooth", effects: { fame: 4 } },
          { id: "cake", label: "Eat the cake", path: "bend", text: "It's poisoned. You heal. He laughs so hard he forgets to attack.", effects: { happiness: 6, health: -4 }, meet: "sabretooth" },
        ],
      },
      {
        id: "laura", age: 63, title: "X-23", text: "A girl with two claws in each hand and one in each foot breaks out of a lab and comes looking for her father. That's you.",
        choices: [
          { id: "raise", label: "Raise her", path: "canon", text: "She's angry, fast, and smarter than you. She calls you Logan for years. Then once, by accident, dad.", effects: { happiness: 14, karma: 8 }, trait: "family" },
          { id: "school", label: "Send her to the school", path: "bend", text: "She's safe there. You visit every week, gruff and early. She notices.", effects: { happiness: 8 } },
        ],
      },
      {
        id: "deathstrike-last", age: 67, title: "Lady Deathstrike", text: "Yuriko Oyama has spent forty years becoming a weapon to kill you. Her father built Weapon X's metal. She thinks it's hers.",
        choices: [
          { id: "fight", label: "Finish it", path: "canon", text: "Adamantium on adamantium, in the rain. You win. You're too old to enjoy it.", fight: "deathstrike", meet: "deathstrike", effects: { fame: 8 } },
          { id: "mercy", label: "Offer her a way out", path: "bend", text: "She doesn't take it. She doesn't come back, either.", effects: { karma: 10 }, meet: "deathstrike" },
        ],
      },
      {
        id: "cabin", age: 74, title: "The Cabin", text: "A lake, a porch, a cold beer. Laura comes up the road with a kid of her own.",
        endings: {
          canon: "Earth-7419 ends the way the legend should: the best there is, who finally stopped running and let the kid win at cards.",
          bend: "Earth-7419 bends kinder: Rose's letters in a box, a team that never gave up on him, and a man who remembered everything and forgave most of it.",
          break: "Earth-7419 ends off the map. No comic ever let Logan stop fighting, and he didn't miss it once.",
        },
        choices: [
          { id: "porch", label: "Pull up a chair", path: "canon", text: "The kid asks if the claws hurt. 'Every time.' 'Then why?' 'Worth it.'", effects: { happiness: 14 } },
          { id: "hike", label: "Take them into the woods", path: "bend", text: "You teach the kid to track a wolf. The wolf teaches you both something too.", effects: { happiness: 10, health: 2 } },
        ],
      },
    ],
    villains: [
      { id: "sabretooth", name: "Victor Creed", alias: "Sabretooth", title: "The birthday killer", powerId: "healing", level: 8, blurb: "Fangs, claws, a healing factor, and a hundred years of grudges with your name on them.", moves: [mv("Rending Claws", "Faster than yours. Meaner.", 8, "strike", "force", "burst"), mv("Pounce", "He's on you before you see him.", 7, "strike", "speed", "dash"), mv("Hunter's Nose", "He smells the plan.", 5, "trick", "shadow", "status"), mv("Feral Heal", "Wounds close mid-swing.", 6, "guard", "life", "guard")] },
      { id: "deathstrike", name: "Yuriko Oyama", alias: "Lady Deathstrike", title: "Weapon X's daughter", powerId: "healing", level: 8, blurb: "A cyborg with ten adamantium nails and a claim to the metal in your bones.", moves: [mv("Ten Blades", "Each finger a sword.", 9, "strike", "force", "area"), mv("Cyber Lunge", "Built to close the gap.", 7, "strike", "speed", "dash"), mv("Reaver Code", "She hacked your pain.", 5, "trick", "psychic", "status"), mv("Armored Skin", "Bullets bounce.", 5, "guard", "shield", "guard")] },
      { id: "omega-red", name: "Arkady Rossovich", alias: "Omega Red", title: "The Soviet answer", powerId: "elastic", level: 7, from: 40, blurb: "A super-soldier dying of his own power, with carbonadium coils and a death spore in his breath.", moves: [mv("Carbonadium Coils", "Tentacles that drink life.", 8, "strike", "stretch", "area"), mv("Death Spores", "Breathe and weaken.", 6, "trick", "life", "status"), mv("Coil Lash", "From ten feet out.", 7, "strike", "stretch", "burst"), mv("Cryo Shell", "Born in a freezer.", 5, "guard", "ice", "guard")] },
      { id: "silver-samurai", name: "Kenuichio Harada", alias: "Silver Samurai", title: "Clan Yashida's blade", powerId: "blasts", level: 6, from: 30, blurb: "A swordsman whose blade can cut anything, adamantium included, he says.", moves: [mv("Tachyon Blade", "It cuts through anything.", 8, "strike", "energy", "burst"), mv("Iaido Draw", "Sheathed, then not.", 7, "strike", "speed", "dash"), mv("Teleport Ring", "He blinks out.", 4, "trick", "warp", "status"), mv("Silver Armor", "Yashida steel.", 5, "guard", "shield", "guard")] },
    ],
  },
  {
    id: "flash",
    hero: "The Flash",
    name: "Barry Allen",
    earth: "Earth-1956",
    twist: "The bolt hit twice. Iris West caught the second one, and the man in yellow who killed Barry's mother has come back for both of them.",
    tagline: "Fastest man alive. Still late for everything.",
    sex: "male",
    cityId: "metro",
    upbringing: "tragic",
    face: "loud",
    drive: "amends",
    family: [{ name: "Nora Allen", note: "Mother", sex: "female" }, { name: "Henry Allen", note: "Father, a doctor", sex: "male" }, { name: "Iris West", note: "Foster sister, best friend", sex: "female" }],
    extra: ["insider"],
    look: { skin: 0, hair: 4, style: 1, build: 0, feature: 0 },
    portrait: 1956,
    art: "hero-flash",
    color: "#ff3b30",
    kit: { suit: "#d8241c", trim: "#ffd23a", mask: "cowl", maskColor: "#d8241c", glove: "#d8241c", crest: "flash" },
    boost: { smarts: 16 },
    powers: ["super-speed", "thunder-sprint"],
    decades: [
      { title: "The Night of the Yellow Blur", premise: "{name} is a small kid who saw something impossible kill his mother: red and yellow lightning, in the living room." },
      { title: "Iris and the Wests", premise: "Teen years. Detective West takes {name} in. Iris lends him her notes and her nerve. His father is in prison for something he didn't do." },
      { title: "The Bolt", premise: "Twenties. A crime lab, a storm, a shelf of chemicals, and a lightning bolt that picked {name} on purpose." },
      { title: "Rogues' Gallery", premise: "Thirties. {city} gets the most stylish criminals in the country. They have a union. They have rules." },
      { title: "Flashpoint", premise: "Forty. {name} could run back and save her. He knows exactly what it would cost. He's still thinking about it." },
      { title: "The Speed Force", premise: "Fifty. The lightning has a home, and it talks. It wants {name} to stay." },
      { title: "Fastest Man Alive", premise: "Sixty. A kid in a yellow-and-red hoodie is outrunning {name} on the bridge. He lets them, a little." },
      { title: "The Final Run", premise: "Late light over {city}. A slow walk with Iris, at last, at regular speed." },
    ],
    beats: [
      {
        id: "nora", age: 11, title: "The Yellow Blur", text: "You wake up to wind in the house. Your mother is in a storm of red and yellow lightning, and there are two of them. One of them looks like you.",
        choices: [
          { id: "run", label: "Run for help", path: "canon", text: "You're on the street, and then you're twenty blocks away and you don't know how. When you get home, she's gone. Your father is arrested.", effects: { happiness: -16 }, loss: ["Nora Allen"], meet: "reverse-flash", arch: true },
          { id: "stay", label: "Stand in front of her", path: "break", text: "The yellow man stops. He laughs. 'Not this time, then.' She lives. He'll be back, and he'll be angrier.", effects: { happiness: 6, karma: 8 }, meet: "reverse-flash", arch: true },
        ],
      },
      {
        id: "lab", age: 16, title: "Crime Scene", text: "Detective Joe West brings you to a crime scene because you won't stop asking. You notice the thing his team missed.",
        choices: [
          { id: "science", label: "Point at the evidence", path: "canon", text: "A footprint that shouldn't be there. Joe looks at you differently. You start college a year early.", effects: { smarts: 10, reputation: 4 } },
          { id: "dad", label: "Ask about your dad's case", path: "bend", text: "Joe says nothing for a long time. Then he hands you the file. 'Find what we missed.'", effects: { smarts: 6, karma: 4 } },
        ],
      },
      {
        id: "bolt", age: 25, wake: true, title: "Lightning", text: "A storm, a shelf of chemicals, a skylight. The bolt comes down through the glass and finds you like it was looking.",
        choices: [
          { id: "wake", label: "Wake up nine months later", path: "canon", text: "Abs. A heartbeat like a hummingbird. You catch a falling tray of coffee and then the cups, then the coffee.", effects: { health: 10, fame: 4 } },
          { id: "iris", label: "Wake up next to Iris", path: "bend", text: "She got hit too, across town. She's faster off the line. You're faster in the long run. Neither of you will let that go.", effects: { happiness: 10 }, trait: "team" },
        ],
      },
      {
        id: "cold", age: 28, title: "Captain Cold", text: "A thief with a gun that shoots absolute zero freezes the river and waits for you on the ice.",
        choices: [
          { id: "fight", label: "Run circles around him", path: "canon", text: "Ice doesn't help when the floor is moving. Snart grins through the frost. 'Hope you like the cold, kid.'", fight: "captain-cold", meet: "captain-cold", arch: true },
          { id: "deal", label: "Make a deal with him", path: "bend", text: "No civilians, no kills. He agrees. He keeps it, too, mostly. The Rogues have rules now.", effects: { reputation: 6, karma: 4 }, meet: "captain-cold" },
        ],
      },
      {
        id: "grodd", age: 33, title: "Gorilla City", text: "A telepathic gorilla takes over {city}'s police radio and makes the whole force sit down.",
        choices: [
          { id: "fight", label: "Outrun the thought", path: "canon", text: "He's in your head. You're faster than your head. It's a close thing.", fight: "grodd", meet: "grodd" },
          { id: "talk", label: "Get him home", path: "bend", text: "He wanted Gorilla City back, not {city}. You run him there. He sends a fruit basket, menacingly.", effects: { karma: 8 }, meet: "grodd" },
        ],
      },
      {
        id: "flashpoint", age: 41, title: "Flashpoint", text: "You can run fast enough now. Back to that night. One push, and she lives.",
        choices: [
          { id: "dont", label: "Don't run", path: "canon", text: "You stand outside the house and watch. It's the worst night of your life again. The world stays the world.", effects: { happiness: -10, karma: 12 } },
          { id: "run", label: "Run", path: "break", text: "She lives. Your father is free. And the world is wrong: wars that never happened, heroes who never were. You fix it. Mostly.", effects: { happiness: 8, reputation: -8 }, fight: "reverse-flash", meet: "reverse-flash" },
        ],
      },
      {
        id: "mirror", age: 49, title: "Mirror Master", text: "Sam Scudder steps out of every window on Main Street at once, and every one of him is armed.",
        choices: [
          { id: "fight", label: "Break every mirror", path: "canon", text: "A thousand reflections, one real one. You find him by the one that breathes.", fight: "mirror-master", meet: "mirror-master" },
          { id: "cold", label: "Call Captain Cold", path: "bend", text: "The Rogues hate a show-off. Snart freezes the mirrors. Sam is very upset.", effects: { reputation: 4, karma: 4 }, meet: "mirror-master" },
        ],
      },
      {
        id: "speedforce", age: 58, title: "The Speed Force", text: "The lightning has a home, out past light. It looks like your mother. It wants you to stay.",
        choices: [
          { id: "home", label: "Run home", path: "canon", text: "Iris is holding the lamp in the window. You follow it out. You always will.", effects: { happiness: 10, health: -4 } },
          { id: "listen", label: "Listen first", path: "bend", text: "It tells you about the kids who'll carry the bolt after you. You come back with names.", effects: { smarts: 6, karma: 6 } },
        ],
      },
      {
        id: "kid", age: 62, title: "Kid Flash", text: "Wally West, Iris's nephew, is too fast to stop and too young to know better. He wants lessons.",
        choices: [
          { id: "teach", label: "Teach him", path: "canon", text: "The first rule is: you're not faster than a bullet if you don't look where you're going. He learns it the hard way.", effects: { happiness: 10, reputation: 6 }, trait: "team" },
          { id: "race", label: "Race him for it", path: "bend", text: "He wins. You let him think you didn't let him.", effects: { happiness: 8, fame: 4 } },
        ],
      },
      {
        id: "thawne", age: 66, title: "The Man in Yellow", text: "Eobard Thawne steps out of the future, young and cruel. Every time you beat him, he just runs to a time before you did.",
        choices: [
          { id: "fight", label: "The last race", path: "canon", text: "Around the world, then around it again. You catch him at the exact second he was born, and you let him go.", fight: "reverse-flash", meet: "reverse-flash", effects: { fame: 10 } },
          { id: "trap", label: "Trap him in a moment", path: "bend", text: "Wally and Iris hold the loop. Thawne runs forever in one minute in 1956. He'll be fine. Probably.", effects: { smarts: 4, karma: 6 }, meet: "reverse-flash" },
        ],
      },
      {
        id: "walk", age: 72, title: "Regular Speed", text: "Iris takes your arm on the bridge. 'Walk with me. Slowly. I mean it.'",
        endings: {
          canon: "Earth-1956 ends the way the legend should: the fastest man alive, who never ran back, and was never late for the people who mattered.",
          bend: "Earth-1956 bends kinder: two bolts, one family, and a Rogues' Gallery that kept its rules.",
          break: "Earth-1956 ends off the map. No comic ever let Barry run back and keep it. This one did, and paid, and fixed it anyway.",
        },
        choices: [
          { id: "slow", label: "Walk slowly", path: "canon", text: "It takes twenty minutes to cross. It's the longest you've ever spent anywhere. It's perfect.", effects: { happiness: 14 } },
          { id: "sunset", label: "One last lap first", path: "bend", text: "Around the world before she finishes the sentence. You bring her a flower from every continent.", effects: { happiness: 12, health: -2 } },
        ],
      },
    ],
    villains: [
      { id: "reverse-flash", name: "Eobard Thawne", alias: "Reverse-Flash", title: "The man in yellow", powerId: "speed", level: 9, blurb: "A speedster from the future who hates you so much he went back and ruined your childhood.", moves: [mv("Negative Speed Force", "Red lightning, running backwards.", 9, "strike", "lightning", "burst"), mv("Vibrating Hand", "Through the chest.", 8, "strike", "speed", "dash"), mv("Time Remnant", "Another him, from a second ago.", 6, "trick", "warp", "status"), mv("Phase Out", "You hit air.", 5, "guard", "speed", "guard")] },
      { id: "captain-cold", name: "Leonard Snart", alias: "Captain Cold", title: "Leader of the Rogues", powerId: "ice", level: 6, blurb: "A thief with a cold gun, a code, and a soft spot for his sister.", moves: [mv("Cold Gun", "Absolute zero, aimed.", 8, "strike", "ice", "burst"), mv("Ice Floor", "Run on that, speedster.", 6, "trick", "ice", "area"), mv("Rogue's Code", "He knows your rules too.", 5, "trick", "psychic", "status"), mv("Frost Wall", "A wall of ice.", 5, "guard", "ice", "guard")] },
      { id: "grodd", name: "Grodd", alias: "Gorilla Grodd", title: "The telepath of Gorilla City", powerId: "mind", level: 8, from: 30, blurb: "A genius gorilla who reads minds and wants a planet that answers to apes.", moves: [mv("Mind Crush", "Your thoughts slow down.", 8, "strike", "psychic", "burst"), mv("Primal Strength", "Five hundred pounds of angry.", 8, "strike", "force", "area"), mv("Puppet Strings", "The crowd turns on you.", 5, "trick", "psychic", "status"), mv("Psionic Wall", "He saw it coming.", 5, "guard", "psychic", "guard")] },
      { id: "mirror-master", name: "Sam Scudder", alias: "Mirror Master", title: "The man in the glass", powerId: "invisibility", level: 6, from: 30, blurb: "A Rogue who walks through reflections and brings a hundred copies of himself to a fight.", moves: [mv("Glass Shard Storm", "Every window breaks at you.", 7, "strike", "warp", "area"), mv("Mirror Step", "In one pane, out another.", 6, "strike", "warp", "dash"), mv("Hall of Mirrors", "Which one is real?", 5, "trick", "light", "status"), mv("Reflect", "Your hit comes back.", 5, "guard", "light", "guard")] },
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

/** The earliest age a legend's villain can appear outside canon: `from`, else their first canon beat, else 16. */
export function villainDebut(preset: HeroPreset, villainId: string): number {
  const villain = preset.villains.find((row) => row.id === villainId);
  if (villain?.from !== undefined) return villain.from;
  const ages = preset.beats.filter((beat) => beat.choices.some((c) => c.meet === villainId || c.fight === villainId)).map((beat) => beat.age);
  return ages.length ? Math.min(...ages) : 16;
}

/** Which way a legend life has mostly gone: canon, bent, or broken. Ties go to canon, then bend. */
export function dominantPath(flags: Record<string, number | undefined>): CanonPath {
  const kept = flags.canonKept ?? 0;
  const bent = flags.canonBent ?? 0;
  const broken = flags.canonBroken ?? 0;
  if (kept >= bent && kept >= broken) return "canon";
  return bent >= broken ? "bend" : "break";
}
