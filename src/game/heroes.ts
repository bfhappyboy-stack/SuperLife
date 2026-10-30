import type { OriginBrief } from "./origin";
import type { AiHero, Sex } from "./types";
import { mentionsWorld } from "./origin";

export interface TalkJudgement {
  delta: number;
  tone: "insult" | "thanks" | "train" | "mission" | "neutral";
}

const INSULT = ["hate", "stupid", "idiot", "shut up", "loser", "worthless", "pathetic", "dumb", "kill you", "useless", "annoying", "screw you", "get lost", "traitor", "coward", "weak"];
const THANKS = ["thank", "grateful", "appreciate", "sorry", "respect", "you're great", "you are great", "love this", "nice work", "proud"];
const TRAIN = ["train", "mix", "braid", "power", "teach", "spar", "drill", "combine", "learn"];
const MISSION = ["mission", "patrol", "help me", "team up", "let's go", "lets go", "job", "save", "heist", "rescue", "crew"];

export function judgeTalk(line: string): TalkJudgement {
  const text = line.toLowerCase();
  if (INSULT.some((word) => text.includes(word))) return { delta: -8, tone: "insult" };
  if (THANKS.some((word) => text.includes(word))) return { delta: 6, tone: "thanks" };
  if (TRAIN.some((word) => text.includes(word))) return { delta: 4, tone: "train" };
  if (MISSION.some((word) => text.includes(word))) return { delta: 4, tone: "mission" };
  return { delta: 1, tone: "neutral" };
}

export function levelFor(exp: number): number {
  const steps = [0, 100, 240, 420, 680, 1000, 1400, 1900];
  let level = 1;
  for (let i = 0; i < steps.length; i++) {
    if (exp >= (steps[i] ?? 0)) level = i + 1;
  }
  return Math.max(1, Math.min(8, level));
}

export function heroLevelCap(relationship: number): number {
  return Math.max(1, Math.min(8, 1 + Math.floor(Math.max(0, relationship) / 12)));
}

export interface PlotBrief {
  villain: string;
  arcTitle: string;
  stepTitle: string;
  stance: "close" | "wary" | "shut" | "other";
}

export function heroPrompt(
  hero: Pick<AiHero, "name" | "alias" | "personality" | "relationship" | "level" | "memory">,
  line: string,
  plot?: PlotBrief | null,
  origin?: OriginBrief | null,
): string {
  const band = hero.relationship >= 70 ? "close ally" : hero.relationship >= 40 ? "warming up" : hero.relationship >= 20 ? "wary acquaintance" : "stranger with a grudge";
  const memory = hero.memory
    .slice(-6)
    .map((entry) => `${entry.role === "you" ? "Player" : hero.alias}: ${entry.text}`)
    .join("\n");
  const stance =
    plot?.stance === "close"
      ? `You trust the player. Plan how to stop ${plot.villain} in plain words.`
      : plot?.stance === "wary"
        ? `You are on the case "${plot.arcTitle}" but still wary. Share one useful detail about ${plot.villain}, not the whole plan.`
        : plot?.stance === "shut"
          ? `You care about stopping ${plot.villain} and do not trust the player yet.`
          : plot
            ? `${plot.villain} is not your case. Say so.`
            : "";
  return [
    `You are ${hero.alias} (${hero.name}) in a superhero life sim.`,
    `Personality: ${hero.personality}`,
    `Level ${hero.level}. Relationship with the player is ${hero.relationship}/100 (${band}).`,
    plot ? `Current case: ${plot.arcTitle}. Villain: ${plot.villain}. Step: ${plot.stepTitle}.` : "No active villain case.",
    stance,
    origin
      ? `Player lives in ${origin.city}. Childhood: ${origin.upbringing}. Traits: ${origin.traits}. ${origin.local ? "You know this city." : "This is not your usual city."} ${origin.note}`
      : "",
    memory ? `Recent conversation:\n${memory}` : "No prior conversation.",
    `The player says: "${line.replace(/"/g, "'")}"`,
    "Reply in character, 1 to 3 sentences. React to their actual words. If they mention the villain or a plan, use the stance above. No quotes around the whole reply. Do not mention being an AI, a model, or a simulation.",
  ].join("\n");
}

const LINES: Record<string, Record<TalkJudgement["tone"], [string, string]>> = {
  vesper: {
    insult: ["Say it again when you can back it up. I'll wait. I charge for waiting.", "I've coached worse mouths. They learned, or they left limping."],
    thanks: ["Don't get soft on me. ...Fine. You're welcome.", "Keep that tone. It makes the drills hurt less, which is not the point."],
    train: ["Hands up. Fire is a tool, not a mood. We braid it when your feet agree.", "Strength under heat. Again. The mix doesn't care that you're tired."],
    mission: ["If we go, we finish. No speeches in the stairwell.", "I'll take point. You take the part where you don't show off."],
    neutral: ["I'm listening. Use fewer words or better ones.", "Talk is cheap. The mat is not. What do you actually want?"],
  },
  juniper: {
    insult: ["Wow. Okay. I'm going to lap the block until that sentence gets less embarrassing.", "Rude AND slow. Pick a struggle."],
    thanks: ["Aww, you like me. Don't make it weird. Make it fast.", "You're welcome. I accept payment in snacks and not dying."],
    train: ["Yes. Speed, then the pretty fire thing, then we see who throws up first.", "Braids are just tricks that learned to hold hands. Come on."],
    mission: ["I already left. Catch up and I'll pretend you were heroic.", "Mission mission mission. I heard you. I'm vibrating. Let's go."],
    neutral: ["Say more. Or say it faster. Ideally both.", "I'm here, I'm bored, I'm charming. Your move, slowpoke."],
  },
  idris: {
    insult: ["Noted. Hostility is data. It is not interesting data.", "Your pulse spiked. The insult was for you, not me."],
    thanks: ["Gratitude logged. I will not pretend it doesn't matter.", "You're welcome. Precision is a kindness. Remember that."],
    train: ["Two powers, one outcome, no romance about it. Show me the pair.", "We can force a braid if your focus survives the first minute."],
    mission: ["Acceptable risk if you follow the sequence. Improvise and I will say I told you.", "A mission is a hypothesis with civilians in it. Let's be careful."],
    neutral: ["Continue. I am separating signal from whatever that was.", "I heard you. I am deciding whether it deserved an answer."],
  },
  marrow: {
    insult: ["Heh. You kiss your arch-enemy with that mouth?", "Say it to my face when I'm not letting you."],
    thanks: ["Don't spread it around. I have a reputation for gravel.", "Yeah, yeah. You'd do it for me. That's the whole job."],
    train: ["Plant your feet. Gravity's a suggestion until I say it isn't.", "We hit things until a new trick falls out. Scientific."],
    mission: ["I brought a crowbar and low expectations. Both are optimistic.", "Point me at the problem. I will introduce myself."],
    neutral: ["Uh-huh. You want advice or an audience?", "I'm here. Talk. I've got time and nowhere better."],
  },
};

const VOICE: Record<string, Record<TalkJudgement["tone"], [string, string]>> = {
  calm: {
    insult: ["I heard the anger. I'm not picking it up.", "Say the useful part again, without the knife."],
    thanks: ["You're welcome. Don't make it a performance.", "Good. Now we can work."],
    train: ["Slow. The mix is already there. You are the one rushing it.", "Hands quiet. Power second. Again."],
    mission: ["We go if nobody has to be a headline.", "I'll take the part with the people in it."],
    neutral: ["I'm here. Take the long sentence.", "That landed. Tell me what you want from it."],
  },
  bright: {
    insult: ["Okay, stormcloud. Say it to the sky and see who answers.", "Rude. I'm still going to show you the cool part."],
    thanks: ["Ha. Keep that. The lightning likes a little gratitude.", "You're welcome. Try not to fry the good shoes."],
    train: ["Yes. We throw one spark at the other until a third thing exists.", "Speed, then the bolt, then we name it."],
    mission: ["I already smell ozone. That's a yes.", "Point. I'll bring the weather."],
    neutral: ["Talk. I'm buzzing anyway.", "I heard you. My hair heard you too."],
  },
  sly: {
    insult: ["Cute. I was gone before the last word.", "You can keep the insult. I'll keep your wallet's opinion of you."],
    thanks: ["Don't advertise that I helped. Ruins the brand.", "Anytime. Preferably when no one is counting."],
    train: ["The trick is the part nobody sees. Watch my hands, then don't.", "We braid it quiet. Loud is how you get a file."],
    mission: ["In and out. If you narrate, I leave you there.", "I know a door. You know how to be heavy. We'll compromise."],
    neutral: ["Mm. Continue. I'm deciding if you're worth the shortcut.", "Say it again like you don't want an audience."],
  },
  show: {
    insult: ["Darling, project. The cheap seats can't hear your contempt.", "Mean. I can work with mean. I cannot work with dull."],
    thanks: ["A review. I'll take it. I'll also take a bow.", "You're welcome. Tell your friends I was brilliant."],
    train: ["Shape, then heat, then we see what the mirror does.", "Hold still. Now don't. That was the lesson."],
    mission: ["I will be whoever the door needs. You be the distraction or the point.", "Costumes optional. Commitment is not."],
    neutral: ["I'm listening, which is a limited engagement.", "Give me a better line and I'll give you a better face."],
  },
  mean: {
    insult: ["Say it with your chest. I bill for the rest.", "I've been called worse by people who paid on time."],
    thanks: ["Gratitude. Write it down. I collect.", "Don't get fond. Get useful."],
    train: ["You want a mix. I want to see if you flinch. Both can happen.", "Power is a debt. I'll show you the interest."],
    mission: ["Off-book or it isn't worth the drive.", "I don't rescue. I remove. Pick a verb."],
    neutral: ["Talk. The meter is running.", "I kept the sentence. I haven't decided it was worth it."],
  },
};

const VOICE_OF: Record<string, string> = {
  pilar: "calm",
  bolt: "bright",
  nim: "sly",
  wren: "calm",
  kade: "show",
  lark: "mean",
};

export function replyLocally(
  hero: Pick<AiHero, "id" | "alias" | "relationship">,
  line: string,
  plot?: PlotBrief | null,
  origin?: OriginBrief | null,
): string {
  const text = line.toLowerCase();
  const token = (plot?.villain ?? "").toLowerCase().replace(/^the /, "").split(" ")[0] ?? "";
  const mentionsPlot = !!plot && token.length > 2 && (text.includes(token) || /plan|villain|the case|stop (them|her|him)|how do we|what do we/.test(text));
  if (plot && mentionsPlot) {
    if (plot.stance === "close") return `${plot.villain} breaks if we do the step in front of us: ${plot.stepTitle}. I'm with you. Don't improvise the ending.`;
    if (plot.stance === "wary") return `I know ${plot.villain}. One piece: finish "${plot.stepTitle}" before you get clever. The rest waits until I trust your hands.`;
    if (plot.stance === "shut") return `${plot.villain} is my problem. You are not on the inside of ${plot.arcTitle} yet.`;
    return `${plot.villain} isn't my mess. Ask the person whose name is on ${plot.arcTitle}.`;
  }
  if (origin && mentionsWorld(line, origin)) {
    return origin.local
      ? `I know ${origin.city}. ${origin.note}`
      : `${origin.upbringing} explains the way you stand. ${origin.note}`;
  }
  const judged = judgeTalk(line);
  const voice = VOICE_OF[hero.id] ?? "gravel";
  const bank = LINES[hero.id]?.[judged.tone] ?? VOICE[voice]?.[judged.tone] ?? LINES.marrow?.[judged.tone] ?? ["I heard you.", "Say that again."];
  const close = hero.relationship >= 50 ? 1 : 0;
  const lineBit = line.trim().replace(/\s+/g, " ").slice(0, 72);
  const picked = bank[close] ?? bank[0] ?? "I'm listening.";
  if (judged.tone === "neutral" && lineBit.length > 8) {
    return `${picked} You said "${lineBit}." I kept it.`;
  }
  return picked;
}

interface Template {
  id: string;
  name: string;
  alias: string;
  personality: string;
  sex: Sex;
  portrait: number;
  unlocked: string[];
  relationship?: number;
}

const TEMPLATES: Template[] = [
  {
    id: "vesper",
    name: "Vesper Hale",
    alias: "Coach Hale",
    personality: "Stern mentor. Short sentences, proud when disappointed, allergic to excuses. Believes fire and strength should be drilled until they braid.",
    sex: "female",
    portrait: 41021,
    unlocked: ["fire-control", "super-strength", "magma-fist"],
  },
  {
    id: "juniper",
    name: "Juniper Quick",
    alias: "Juniper",
    personality: "Chaotic speedster. Jokes, nicknames, impatient affection. Treats every power mix like a race she already won.",
    sex: "female",
    portrait: 88211,
    unlocked: ["super-speed", "flight", "light-speed", "sonic-flight"],
  },
  {
    id: "idris",
    name: "Idris Quill",
    alias: "Dr. Quill",
    personality: "Cold, curious scientist. Precise, a little cruel when bored, genuinely kind if you earn the data. Loves mental powers and clean mixes.",
    sex: "male",
    portrait: 19004,
    unlocked: ["telekinesis", "telepathy", "energy-projection", "psychic-crush"],
  },
  {
    id: "marrow",
    name: "Marrow Dane",
    alias: "Marrow",
    personality: "Cynical bruiser with a soft center he will deny. Dry humor, loyal once respected, thinks gravity and durability are personality traits.",
    sex: "male",
    portrait: 77330,
    unlocked: ["super-strength", "super-durability", "gravity", "juggernaut-mass"],
  },
  {
    id: "pilar",
    name: "Pilar Frost",
    alias: "Pilar",
    personality: "Calm winter. Dry humor, patient, a little mournful about the things she freezes. Believes ice and weather should be asked, not yanked.",
    sex: "female",
    portrait: 55102,
    unlocked: ["ice-control", "weather", "super-speed", "absolute-zero-dash", "whiteout-front"],
  },
  {
    id: "bolt",
    name: "Parish Bolt",
    alias: "Parish",
    personality: "Bright storm-chaser. Loud laugh, generous with danger, talks to clouds like coworkers. Wants every mix to end in lightning you can aim.",
    sex: "male",
    portrait: 22018,
    unlocked: ["lightning-control", "energy-projection", "flight", "storm-calling", "thunder-sprint", "bolt-rider"],
  },
  {
    id: "nim",
    name: "Nim Calder",
    alias: "Nim",
    personality: "Sly and light-fingered. Speaks softly, vanishes mid-sentence, fond of people who don't narrate. Teaches the powers that let you leave a room you never entered.",
    sex: "female",
    portrait: 90441,
    unlocked: ["invisibility", "super-speed", "teleportation", "flight", "ghost-step"],
  },
  {
    id: "wren",
    name: "Wren Vale",
    alias: "Wren",
    personality: "Gentle and exact. Hears more than they say, hates cruelty, will still tell you the hard thing. Offers mental powers and the shield that keeps them kind.",
    sex: "female",
    portrait: 33067,
    unlocked: ["telepathy", "telekinesis", "super-senses", "force-field", "threat-map"],
  },
  {
    id: "kade",
    name: "Kade Rill",
    alias: "Kade",
    personality: "Theatrical shapeshifter. Bows too much, means half of it, loves a reveal. Treats elasticity, faces, and regeneration as costume changes with consequences.",
    sex: "male",
    portrait: 61880,
    unlocked: ["shape-shifting", "elasticity", "regeneration", "super-strength", "living-putty"],
  },
  {
    id: "lark",
    name: "Lark Voss",
    alias: "The Receipt",
    personality: "Mean, precise, and weirdly fair. A villain who teaches. She remembers every favor as a line item and every insult as interest. Offers the quiet ugly powers.",
    sex: "female",
    portrait: 14773,
    relationship: 4,
    unlocked: ["invisibility", "telepathy", "energy-projection", "gravity", "psychic-crush"],
  },
];

export function seedHeroes(): AiHero[] {
  return TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    alias: template.alias,
    personality: template.personality,
    relationship: template.relationship ?? 8,
    level: 1,
    exp: 0,
    unlocked: [...template.unlocked],
    memory: [],
    met: false,
    sex: template.sex,
    portrait: template.portrait,
  }));
}

export function mergeHeroes(existing: AiHero[] | undefined): AiHero[] {
  const seeded = seedHeroes();
  if (!existing?.length) return seeded;
  const have = new Set(existing.map((hero) => hero.id));
  return [...existing, ...seeded.filter((hero) => !have.has(hero.id))];
}
