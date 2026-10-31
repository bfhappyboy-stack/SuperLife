/**
 * Phase-keyed prompt variants for the choices a long life sees hundreds of times
 * (gym, books, patrol, League call, villain pins). Data only: the engine picks a
 * line with its own rng and remembers the last index per key so the same line
 * never shows twice in a row.
 */
import { phaseForAge } from "./chapters";

export type PromptKey = "gym" | "books" | "patrol" | "league" | "archPin" | "villainDrop" | "nightOut" | "capeVisit";
export type PromptBand = "young" | "prime" | "crisis" | "late";

export function promptBand(age: number): PromptBand {
  const id = phaseForAge(age).id;
  if (id === "origin" || id === "coming") return "young";
  if (id === "early" || id === "rising") return "prime";
  if (id === "crisis") return "crisis";
  return "late";
}

type Pool = Record<PromptBand, string[]>;

export const PROMPT_POOLS: Record<PromptKey, Pool> = {
  gym: {
    young: [
      "The gym, the block, or a room that does not advertise its address. How do you spend the body today?",
      "Your knees are new and your coach is not. Where does the afternoon go?",
      "A rope, a curb, and a heavy bag somebody's uncle hung. Pick one.",
      "Growth spurt week. Everything aches in a way that might be progress.",
    ],
    prime: [
      "The gym, the block, or a room that does not advertise its address. How do you spend the body today?",
      "Your body is at its loudest. It wants work, not a speech.",
      "Six a.m. The bag is still swinging from whoever left before you.",
      "The mirror says peak. The calendar says do not waste it.",
      "A sparring floor in {city} opens early for people with your kind of bruises.",
    ],
    crisis: [
      "The body files a complaint before you are out of bed. Train through it, around it, or with it?",
      "Forty-something. The reps are the same. The recovery is a negotiation.",
      "Your old routine fits like an old jacket: still yours, tight in new places.",
      "The young ones warm up for ten minutes. You warm up for thirty and lie about it.",
    ],
    late: [
      "Your joints have opinions. Your gift does not care. Where do you put the hour?",
      "The gym regulars call you sir or ma'am now, and then watch you lift.",
      "Slow work today. Balance, breath, and one thing heavy enough to remember.",
      "The pool, the mat, or the long walk. Strength at this age is mostly showing up.",
    ],
  },
  books: {
    young: [
      "The city is full of pages. Some of them are supposed to be in your hands.",
      "The library smells like radiators and secrets. A kid could get lost on purpose.",
      "Comics, textbooks, or the cape manual somebody left on the bus?",
      "School gave you a reading list. {city} gave you a better one.",
    ],
    prime: [
      "The city is full of pages. Some of them are supposed to be in your hands.",
      "A night with a book instead of a fight. The fight will keep.",
      "There is a used bookshop in {city} that stocks old League manuals by accident.",
      "You keep meaning to read the case law on capes. Tonight, maybe.",
      "Podcasts, papers, or a long novel on a short train. Feed the head.",
    ],
    crisis: [
      "You reread the books that made you. They read differently now.",
      "Mid-life reading list: history, medicine, and one thing nobody would expect of you.",
      "The archive in {city} finally lets you in. Your name opened the door.",
      "Your kid, your rookie, or your doctor recommended something. Which one do you trust?",
    ],
    late: [
      "Reading glasses, good light, and the memoirs of people you fought.",
      "The library put your old clippings in a binder. You could look. You could not.",
      "Learning is slower and sweeter now. Pick a shelf.",
      "Someone wrote a book about the era you lived through. They got you a little wrong.",
    ],
  },
  patrol: {
    young: [
      "The city is behaving just enough to make you choose a block.",
      "Curfew in an hour. Enough time to walk one street like you own it.",
      "The block you grew up on is quiet. Quiet is a dare at your age.",
    ],
    prime: [
      "The city is behaving just enough to make you choose a block.",
      "{city} at night: three sirens, one argument, and a roof with a good view.",
      "The scanner is busy. Your feet are busier. Pick a direction.",
      "A slow night is still a night. Which streets need a face?",
      "Rain on the rooftops. The kind of weather that hides things.",
    ],
    crisis: [
      "The streets you patrolled at twenty have new names and the same problems.",
      "You know every alley in {city}. The alleys know you too, now.",
      "Patrol is slower at your age. You see more for it.",
      "Rookies take the loud blocks. You take the ones they skip.",
    ],
    late: [
      "A walk, not a patrol, you tell your knees. Your eyes still work the corners.",
      "The block remembers you. Kids point. Somebody's grandma waves.",
      "You do a slow loop of the old routes. Something is off on one of them.",
      "Night air, a cane you refuse to call a cane, and the city doing its thing.",
    ],
  },
  league: {
    young: [
      "A call comes in. Civilians, a timer, and a captain who says 'your show' like that isn't terrifying.",
      "Junior roster call. The captain wants you on crowd duty and says it like a promotion.",
      "Your first real dispatch. The van smells like coffee and nerves.",
    ],
    prime: [
      "A call comes in. Civilians, a timer, and a captain who says 'your show' like that isn't terrifying.",
      "Dispatch pings at 3 a.m. A bridge, a bus, and a plan that is mostly you.",
      "The League board lights up with your name next to a red tag.",
      "A captain you respect asks for you by name. The job is ugly.",
      "Joint op with another city's team. Everyone is pretending not to compete.",
    ],
    crisis: [
      "The League calls the veterans in. That means it is bad.",
      "Dispatch wants you to lead, not run point. The difference is who gets yelled at.",
      "A rookie froze on the last call. This one is yours, and they are watching.",
      "The briefing is short. The captain is younger than your scars.",
    ],
    late: [
      "The League still calls. Less often, and with more apology in it.",
      "A consult, they say. It turns out consults happen at fire scenes.",
      "They want your read on a scene before the young ones go in.",
      "One more call. The captain says it like they know it might be the last.",
    ],
  },
  archPin: {
    young: [
      '{foe} sends a pin and the words "bring the good trick." The group chat is already taking bets.',
      "{foe} leaves a note in your locker. It is a map and an insult.",
      "{foe} is waiting outside school. Of course they are.",
    ],
    prime: [
      '{foe} sends a pin and the words "bring the good trick." The group chat is already taking bets.',
      "{foe} hijacks a billboard to say hi. Specifically to you.",
      "A gift arrives: your old mask, mailed back by {foe}, with a time and a place.",
      "{foe} shows up at your favourite diner and orders your usual. Twice.",
      "The news runs a clip of {foe} doing your pose. It is an invitation.",
    ],
    crisis: [
      "{foe} is greyer too. The pin still says \"bring the good trick.\"",
      "Twenty years of this. {foe} sends an anniversary card. It is threatening.",
      "{foe} calls your landline. Nobody calls your landline.",
      "{foe} picked a fight in your old neighbourhood. Personal, then.",
    ],
    late: [
      "{foe} writes a real letter, on paper. One more round, it says. For old times.",
      "A pin from {foe}. The coordinates are the place you first fought.",
      "{foe} hears you are slowing down and wants to see for themselves.",
      "{foe} sends flowers. The card has a time on it.",
    ],
  },
  villainDrop: {
    young: [
      '{foe} drops onto your week like a correction. "Posters," they say. "Let\'s edit them."',
      "{foe} thinks a kid cape is an easy headline.",
      "{foe} tags your school's wall with your name crossed out.",
    ],
    prime: [
      '{foe} drops onto your week like a correction. "Posters," they say. "Let\'s edit them."',
      "{foe} is robbing something loudly, on purpose, two streets from you.",
      "{foe} posts a countdown. The comments are tagging you.",
      "{foe} wants a rematch with the city, and you are standing in it.",
      "{foe} interrupts your night like a fire alarm with an ego.",
    ],
    crisis: [
      "{foe} wants to make a name off a veteran. Yours is the name.",
      "{foe} is new money and old tricks, and they picked your city.",
      "{foe} has studied your fights. Every single one.",
      "{foe} hits a place you used to protect. You still do.",
    ],
    late: [
      "{foe} figures an old cape is a soft target. They have read the wrong book.",
      "{foe} is young enough to be your grandkid and loud enough to be a problem.",
      "{foe} calls you a legend in a way that means retired. You are not.",
      "{foe} wants your city. You want your afternoon. Someone loses.",
    ],
  },
  nightOut: {
    young: [
      "The night is open. So is your wallet, if you let it be.",
      "Somebody's older cousin knows a place. The place does not check IDs carefully.",
      "Friday in {city}. Your curfew is a suggestion with a parent attached.",
      "A party, a show, or a rooftop with a view of the cape lights.",
    ],
    prime: [
      "The night is open. So is your wallet, if you let it be.",
      "{city} after dark: a bar with a good jukebox, a club with a bad idea, a friend with a spare ticket.",
      "Payday. The city wants some of it back, and it is asking nicely.",
      "Your phone lights up with three invitations and one bad influence.",
      "A gallery opening, a karaoke room, or the diner where the capes eat at 2 a.m.",
    ],
    crisis: [
      "A night out at your age means dinner and getting home before the second wind fades.",
      "Old friends want a reunion. Somebody booked the same bar from twenty years ago.",
      "A charity gala wants your face. The open bar wants your judgement.",
      "The kids are asleep, the calendar is empty, and {city} is still awake.",
    ],
    late: [
      "Dinner with the people who are left. The restaurant knows your order.",
      "A jazz club, a long table, and stories everybody has heard and wants again.",
      "The young ones invite you out to be polite. You go to be dangerous.",
      "An evening off. {city} has changed. The good corners are still there.",
    ],
  },
  capeVisit: {
    young: [
      '{cape} finds you on purpose. "I\'ve seen the month you had," they say. "Want a better one?"',
      '{cape} lands on the fence outside school like it\'s normal. "Got an hour? I\'ll show you something."',
      '{cape} waves you over at the corner store. "You\'ve been busy. Walk with me."',
    ],
    prime: [
      '{cape} finds you on purpose. "I\'ve seen the month you had," they say. "Want a better one?"',
      '{cape} texts first, which they never do. "Rooftop. Ten minutes. Bring nothing."',
      '{cape} is waiting by your door with two coffees. "I owe you one, or you owe me. Let\'s find out."',
      '{cape} drops in mid-patrol. "{city} is quiet tonight. Want to make it useful?"',
    ],
    crisis: [
      '{cape} sits down next to you without asking. "Bad decade for everybody. Want to train it out?"',
      '{cape} calls from a number you don\'t know. "It\'s me. I need an hour of somebody normal."',
      '{cape} finds you on purpose. "I\'ve seen the month you had," they say. "Want a better one?"',
      '{cape} shows up grey at the temples, same grin. "We used to do this every week. Let\'s do it once."',
    ],
    late: [
      '{cape} knocks slowly these days. "Still got it? Prove it to me, or just pour the tea."',
      '{cape} brings a kid you don\'t know. "They wanted to meet you. So did I, honestly."',
      '{cape} finds a bench beside you in the park. "The old rooftops miss us. Want a better month?"',
      '{cape} sends a postcard from across {city}, then turns up an hour after it arrives.',
    ],
  },
};

/** Pick a variant that differs from the last one shown for this key. */
export function pickPrompt(key: PromptKey, age: number, r: number, last: number | undefined, vars: Record<string, string> = {}): { text: string; index: number } {
  const pool = PROMPT_POOLS[key][promptBand(age)];
  let index = Math.floor(r * pool.length) % pool.length;
  if (pool.length > 1 && index === last) index = (index + 1) % pool.length;
  const text = pool[index]!.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? name);
  return { text, index };
}
