/**
 * Minigame variety, data-driven.
 *
 * Every verb that opens a skill minigame (stunt, drill, dispatch…) draws its kind from a weighted
 * pool here instead of always opening the same timing bar. Power tags tilt the odds (a strength
 * build lifts, a mind build reads patterns, a control build cracks locks), the last kind played
 * is down-weighted so the same mini rarely repeats twice in a row, and each verb carries its own
 * titles so the screen reads differently each time.
 *
 * The press-conference question bank also lives here so the UI and the tests share one source.
 */

export type SkillKind = "timing" | "pattern" | "hack" | "rescue" | "press" | "hold";
export type MiniKind = SkillKind | "duel";
/** Market gear is tuned per family: hack/press read like pattern work, rescue/hold like timing. */
export type EdgeFamily = "timing" | "pattern" | "duel";

export interface MiniKindDef {
  id: SkillKind;
  name: string;
  /** One-line rule shown under the title. */
  how: string;
  family: EdgeFamily;
  color: string;
}

export const MINI_KINDS: Record<SkillKind, MiniKindDef> = {
  timing: { id: "timing", name: "Strike", how: "Tap when the spark crosses the band. Dead center is perfect.", family: "timing", color: "#ffcf4d" },
  pattern: { id: "pattern", name: "Read", how: "Watch the order, then repeat it.", family: "pattern", color: "#a59bff" },
  hack: { id: "hack", name: "Crack", how: "Lock each ring when its notch reaches the gate.", family: "pattern", color: "#3fe0c5" },
  rescue: { id: "rescue", name: "Rescue", how: "Tap people before their ring runs out. Never tap the fire.", family: "timing", color: "#ff7a59" },
  press: { id: "press", name: "Press", how: "Read the reporter, pick the line they want before time runs out.", family: "pattern", color: "#ff7ac8" },
  hold: { id: "hold", name: "Hold", how: "Press and hold to rise, let go to ease off. Stay in the zone.", family: "timing", color: "#7ce07a" },
};

export function edgeFamily(kind: MiniKind): EdgeFamily {
  return kind === "duel" ? "duel" : MINI_KINDS[kind].family;
}

export type MiniVerb = "stunt" | "drill" | "spar" | "tryout" | "dispatch" | "loud" | "bout" | "herospar" | "relic";

interface PoolRow {
  kind: SkillKind;
  weight: number;
  /** Extra weight per matching power tag on the hero's signature power. */
  tags?: Partial<Record<string, number>>;
  titles: string[];
  subtitles: string[];
  /** Outcome lines that fit this kind. When absent, the call site's own outcome text is kept. */
  win?: string[];
  partial?: string[];
  lose?: string[];
}

export const VERB_POOLS: Record<MiniVerb, PoolRow[]> = {
  stunt: [
    { kind: "timing", weight: 3, tags: { mobility: 2, offense: 1 }, titles: ["Public stunt", "Rooftop leap", "Skyline pass"], subtitles: ["Stick it. The phones are already up.", "One clean landing and it trends by lunch.", "The crowd counts down. Don't be early."] },
    { kind: "press", weight: 3, titles: ["Press scrum", "Red carpet", "Morning show"], subtitles: ["The stunt worked. Now the mics want a quote.", "Every lens in the city, and one wrong word.", "Coffee, lights, and a host who has read your file."], win: ["Every outlet runs your line. It's on mugs by Friday.", "The host laughs at the right moment. So does the city."], partial: ["One good quote, one awkward pause. They print both."], lose: ["You say the wrong thing on live TV. It loops all week."] },
    { kind: "hold", weight: 2, tags: { physical: 3, defense: 1 }, titles: ["Hold the bridge", "Lift the bus", "Catch the crane"], subtitles: ["Keep it level until the cameras get the angle.", "Strength is easy. Steady is the show.", "It wants to fall. You want it on the evening news."], win: ["You hold it dead level. The photo is iconic.", "Steady as a statue. The crowd loses it."], partial: ["You hold it, wobbling. The clip is funny, not heroic."], lose: ["It slips. Nobody is hurt, but the footage is brutal."] },
    { kind: "rescue", weight: 1, titles: ["Staged rescue", "Fire drill showcase"], subtitles: ["The charity gala wants a demo. Real smoke, fake panic.", "They lit a building on purpose. Get everyone out on camera."], win: ["Everyone out, smiling for the cameras. The gala doubles its pledges."], partial: ["Most of them out. A volunteer coughs into the mic."], lose: ["You grab the wrong window. The demo becomes a lesson."] },
  ],
  drill: [
    { kind: "timing", weight: 4, tags: { offense: 1, elemental: 1, energy: 1 }, titles: ["Drill {power}"], subtitles: ["Mastery {level}/{cap}. Small gains. The wall is real."] },
    { kind: "hold", weight: 2, tags: { physical: 3, defense: 2 }, titles: ["Hold {power}"], subtitles: ["Keep {power} steady at the edge of control. Mastery {level}/{cap}."], win: ["{power} stays steady at the edge. Something settles in you."], partial: ["Steady for a while, then it bucks. Still progress."], lose: ["It slips your grip. You'll feel that tomorrow."] },
    { kind: "pattern", weight: 1, tags: { mental: 3, mystic: 2 }, titles: ["Focus {power}"], subtitles: ["Memorize the form, then run it clean. Mastery {level}/{cap}."], win: ["The form runs clean, start to finish."], partial: ["Half the form sticks. Half needs another night."], lose: ["You lose the thread. The form falls apart."] },
    { kind: "hack", weight: 1, tags: { control: 3, energy: 1 }, titles: ["Tune {power}"], subtitles: ["Lock each frequency into place. Mastery {level}/{cap}."], win: ["Every frequency clicks into place."], partial: ["Most of it locks. One ring still hums wrong."], lose: ["The tuning jams. Static for an hour."] },
  ],
  spar: [
    { kind: "timing", weight: 3, titles: ["Campus spar", "Sparring ring"], subtitles: ["Coach is watching. So is the kid who wants your spot.", "Three exchanges. Make them count."] },
    { kind: "hold", weight: 2, tags: { physical: 2 }, titles: ["Grapple drill"], subtitles: ["Hold the pin. Coach counts slowly on purpose."], win: ["You hold the pin to ten. Coach nods once."], partial: ["You hold it to six. Coach writes something down."], lose: ["Reversed and pinned. The kid who wants your spot grins."] },
    { kind: "pattern", weight: 1, tags: { mental: 2 }, titles: ["Footwork drill"], subtitles: ["Coach calls the sequence once."], win: ["Every step on the mark. Coach makes the others watch."], partial: ["You lose the count halfway, then find it."], lose: ["You trip over your own feet. Loudly."] },
  ],
  tryout: [
    { kind: "timing", weight: 3, tags: { offense: 1 }, titles: ["League tryout"], subtitles: ["Show them the gift, not the nerves."] },
    { kind: "rescue", weight: 3, titles: ["League tryout: rescue sim"], subtitles: ["A collapsing set, nine dummies, and a stopwatch."], win: ["Nine dummies out, ahead of the clock. Someone checks the stopwatch twice."], partial: ["Most of the dummies make it. The panel looks thoughtful."], lose: ["The set collapses on three dummies. The panel stops writing."] },
    { kind: "press", weight: 1, titles: ["League tryout: panel"], subtitles: ["Five officials, one microphone, and your record on a screen."], win: ["The panel leans in. One of them is smiling."], partial: ["Solid answers. Nothing memorable."], lose: ["You talk too much. Then too little. They thank you for your time."] },
  ],
  dispatch: [
    { kind: "rescue", weight: 4, tags: { mobility: 1, defense: 1 }, titles: ["Dispatch: tower fire", "Dispatch: flooded station", "Dispatch: stalled tram"], subtitles: ["Civilians first. The fire is not a civilian.", "The water rises one floor a minute.", "Two hundred people and one emergency exit."], win: ["Everyone out. The captain shakes your hand in front of the cameras."], partial: ["Most of them out. The rest wait for the trucks."], lose: ["You move too slow. The trucks finish the job, and the news notices."] },
    { kind: "timing", weight: 2, titles: ["Dispatch"], subtitles: ["You are slightly out of position. Improvise."] },
    { kind: "hack", weight: 2, tags: { control: 2, mental: 1 }, titles: ["Dispatch: vault lockdown", "Dispatch: bomb panel"], subtitles: ["Someone sealed the hostages in. Open it before they suffocate.", "Three rings, one timer, and a captain shouting colors."], win: ["The last ring clicks. The door swings open to cheering."], partial: ["It opens, late. Everyone is fine, and very pale."], lose: ["It jams. The bomb squad finishes it while you watch."] },
    { kind: "pattern", weight: 1, tags: { mental: 2 }, titles: ["Dispatch: radio chatter"], subtitles: ["Track the call signs in order."], win: ["You track every call sign. Units arrive exactly where they should."], partial: ["You lose one call. Somebody waits longer than they should."], lose: ["The channels blur. Dispatch takes you off the call."] },
  ],
  loud: [
    { kind: "timing", weight: 3, titles: ["Go loud"], subtitles: ["Three beats. Don't miss the one that matters."] },
    { kind: "rescue", weight: 2, titles: ["Go loud: crossfire"], subtitles: ["Bystanders everywhere. Clear them while you fight."], win: ["Bystanders clear, villain down. The street exhales."], partial: ["You clear most of them. A cafe window does not survive."], lose: ["Too many people, too much noise. It goes badly."] },
    { kind: "hold", weight: 1, tags: { physical: 2 }, titles: ["Go loud: hold the line"], subtitles: ["A wall of them. You are the wall now."], win: ["You hold. They break first."], partial: ["You hold, barely. Your arms will remember this."], lose: ["The line breaks, and so do you, a little."] },
  ],
  bout: [
    { kind: "timing", weight: 3, titles: ["Underground bout"], subtitles: ["Three beats. The crowd wants blood or a story."] },
    { kind: "hold", weight: 2, titles: ["Underground bout: the clinch"], subtitles: ["They grab. You hold. Whoever lets go first loses the bet."], win: ["They let go first. The room pays out in your favour."], partial: ["A draw in the clinch. The bookies hate it."], lose: ["You let go first. The room groans and pays the other side."] },
  ],
  herospar: [
    { kind: "timing", weight: 3, titles: ["Spar {hero}"], subtitles: ["{note}"] },
    { kind: "pattern", weight: 1, tags: { mental: 2, mystic: 1 }, titles: ["Read {hero}"], subtitles: ["{hero} shows a combination once. {note}"], win: ["You mirror the combination. {hero} looks impressed."], partial: ["You catch half of it. {hero} shows you the rest."], lose: ["You miss it entirely. {hero} is patient about it."] },
    { kind: "hold", weight: 1, tags: { physical: 2, defense: 1 }, titles: ["Hold against {hero}"], subtitles: ["{hero} pushes. You keep your feet. {note}"], win: ["You keep your feet. {hero} laughs and steps back."], partial: ["You give ground, slowly. {hero} nods."], lose: ["Flat on your back. {hero} offers a hand."] },
    { kind: "hack", weight: 1, tags: { control: 2 }, titles: ["Sync with {hero}"], subtitles: ["Match {hero}'s rhythm ring by ring. {note}"], win: ["Ring by ring, you match. It feels like a duet."], partial: ["You fall out of rhythm once, then find it."], lose: ["Out of sync. {hero} calls it for the day."] },
  ],
  relic: [
    { kind: "hack", weight: 2, titles: ["The relic's lock"], subtitles: ["Old mechanisms, older wards. Line them up."], win: ["The wards line up. Something old opens."], partial: ["It opens a crack. Enough to look inside."], lose: ["The wards slam shut. It will remember you."] },
    { kind: "pattern", weight: 2, titles: ["The relic's song"], subtitles: ["It hums a sequence. Hum it back."], win: ["You hum it back perfectly. The relic warms in your hands."], partial: ["You get most of the tune. It hums, unsure."], lose: ["Wrong notes. The relic goes cold."] },
  ],
};

export interface MiniPick {
  kind: SkillKind;
  title: string;
  subtitle: string;
  winText?: string;
  partialText?: string;
  loseText?: string;
}

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/**
 * Pick a minigame for a verb. `rand` is a function returning [0,1) (the engine passes its seeded
 * roll), `last` is the last skill kind played (down-weighted to 25%), `tags` the signature power's tags.
 */
export function pickMini(verb: MiniVerb, rand: () => number, opts: { last?: SkillKind | null; tags?: readonly string[]; vars?: Record<string, string>; only?: SkillKind[] } = {}): MiniPick {
  const rows = VERB_POOLS[verb].filter((row) => !opts.only || opts.only.includes(row.kind));
  const pool = rows.length ? rows : VERB_POOLS[verb];
  const weights = pool.map((row) => {
    let w = row.weight;
    for (const tag of opts.tags ?? []) w += row.tags?.[tag] ?? 0;
    if (opts.last && row.kind === opts.last) w *= 0.25;
    return Math.max(0.01, w);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  let index = 0;
  for (; index < pool.length - 1; index++) {
    r -= weights[index]!;
    if (r < 0) break;
  }
  const row = pool[index]!;
  const vars = opts.vars ?? {};
  const title = fill(row.titles[Math.floor(rand() * row.titles.length) % row.titles.length]!, vars);
  const subtitle = fill(row.subtitles[Math.floor(rand() * row.subtitles.length) % row.subtitles.length]!, vars).trim();
  const line = (list?: string[]) => (list?.length ? fill(list[Math.floor(rand() * list.length) % list.length]!, vars) : undefined);
  return { kind: row.kind, title, subtitle, winText: line(row.win), partialText: line(row.partial), loseText: line(row.lose) };
}

export const SKILL_KIND_IDS = Object.keys(MINI_KINDS) as SkillKind[];
export function isSkillKind(value: unknown): value is SkillKind {
  return typeof value === "string" && (SKILL_KIND_IDS as string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/* Press conference                                                    */
/* ------------------------------------------------------------------ */

export type Tone = "bold" | "humble" | "witty" | "straight";

export interface Reporter {
  id: string;
  name: string;
  outlet: string;
  /** What this reporter rewards, in order: best, fine. Anything else flops. */
  wants: [Tone, Tone];
  /** The tell shown on screen. Players learn to read it. */
  tell: string;
  color: string;
}

export const REPORTERS: Reporter[] = [
  { id: "tabloid", name: "Dee Marlow", outlet: "The Daily Splash", wants: ["witty", "bold"], tell: "Grinning. Wants a quote that fits on a mug.", color: "#ff7ac8" },
  { id: "anchor", name: "Ruth Okafor", outlet: "Channel 6 Evening", wants: ["humble", "straight"], tell: "Calm. Has seen a hundred capes come and go.", color: "#7fd8ff" },
  { id: "blogger", name: "@kidcomet", outlet: "CapeWatch live", wants: ["bold", "witty"], tell: "Streaming. Chat is spamming fire emojis.", color: "#ffcf4d" },
  { id: "critic", name: "Hal Brenner", outlet: "The Ledger", wants: ["straight", "humble"], tell: "Arms folded. Has a list of property damage.", color: "#c9c2b0" },
  { id: "kid", name: "Mina, age 9", outlet: "School paper", wants: ["humble", "witty"], tell: "Holding a crayon notebook. Very serious.", color: "#7ce07a" },
  { id: "rival", name: "Vic Sterling", outlet: "Sterling Media", wants: ["witty", "straight"], tell: "Smirking. Trying to bait you into a fight.", color: "#ff6a3d" },
];

export interface PressQuestion {
  q: string;
  lines: Record<Tone, string>;
}

export const PRESS_QUESTIONS: PressQuestion[] = [
  { q: "Was that dangerous?", lines: { bold: "Only for gravity.", humble: "I practiced it a lot so nobody else had to worry.", witty: "Define dangerous. Then define lunch.", straight: "Yes. We had the block cleared first." } },
  { q: "Who pays for the cracked street?", lines: { bold: "Whoever cracked it first. That wasn't me.", humble: "I'll help fix it. I owe the neighbours that.", witty: "Send the bill to physics.", straight: "The city fund covers it. I filed the report." } },
  { q: "Are you better than the League?", lines: { bold: "Ask the League.", humble: "They taught half of what I know.", witty: "I'm better at parking.", straight: "We do different jobs. Both matter." } },
  { q: "What do you say to the people who are scared of you?", lines: { bold: "Good. Villains should be.", humble: "That's fair. I'll keep earning it.", witty: "I'm scared of me before coffee too.", straight: "Here's my number. Call it if I ever let you down." } },
  { q: "Any message for your arch-enemy?", lines: { bold: "Tick tock.", humble: "There's still a door out. I hope they take it.", witty: "Get a hobby. Pottery. Something calm.", straight: "Turn yourself in. It goes better that way." } },
  { q: "Is it true you have a secret identity?", lines: { bold: "Everyone has secrets. Mine just fly.", humble: "I have a family. I protect them too.", witty: "My secret identity is a very tired person.", straight: "No comment, and that's the honest answer." } },
  { q: "How do you stay in shape?", lines: { bold: "I fight things that are bigger than me.", humble: "Same as anyone. Sleep, food, and good friends.", witty: "Running late, mostly.", straight: "Training six days a week. Rest on the seventh." } },
  { q: "What's next for you?", lines: { bold: "Something bigger.", humble: "Whatever the city needs.", witty: "A nap, then destiny.", straight: "Patrols this week, then the hospital visit Friday." } },
  { q: "Do you get paid for this?", lines: { bold: "Saving the city is priceless. Sponsors are welcome.", humble: "Enough to make rent. That's fine by me.", witty: "In exposure, mostly. And bruises.", straight: "A League stipend. It's public record." } },
  { q: "Did you mean to destroy that billboard?", lines: { bold: "It had it coming.", humble: "No, and I'm sorry. I'll pay for it.", witty: "It was a bad ad. I did everyone a favour.", straight: "No. A deflected shot hit it. Nobody was hurt." } },
  { q: "Can you show us a trick?", lines: { bold: "Watch closely. Don't blink.", humble: "Maybe for the kids at the back.", witty: "My best trick is leaving on time.", straight: "Not here. Powers aren't party favours." } },
  { q: "Why should the city trust you?", lines: { bold: "Look what I just did.", humble: "It shouldn't have to. I'll keep showing up.", witty: "I return library books on time.", straight: "My record is public. Read it." } },
  { q: "Who's your hero?", lines: { bold: "Whoever I'm about to become.", humble: "The nurses who worked tonight.", witty: "My barber. Have you seen this hair?", straight: "The first responders. They run in without powers." } },
  { q: "Are you seeing anyone?", lines: { bold: "Only the bad guys. Usually from above.", humble: "I'd rather keep that part private.", witty: "My calendar, mostly. It's serious.", straight: "That's not what we're here to talk about." } },
  { q: "What about the people you couldn't save?", lines: { bold: "I'll be faster next time.", humble: "I think about them every day.", witty: "There's no joke here. I'm sorry.", straight: "We're reviewing every second of it." } },
  { q: "Will you run for mayor?", lines: { bold: "The city could do worse.", humble: "No. The mayor has the hard job.", witty: "Only if the debates are on rooftops.", straight: "No. I'm not qualified, and I know it." } },
  { q: "Do your powers have limits?", lines: { bold: "Haven't found them.", humble: "Plenty. I'm still learning them.", witty: "I can't fold a fitted sheet.", straight: "Yes. I won't say which ones on camera." } },
  { q: "What do you say to kids who want to be like you?", lines: { bold: "Aim higher than me.", humble: "Be kind first. Powers are the easy part.", witty: "Do your homework. Villains can't spell.", straight: "Stay in school. Then call the League." } },
];

export interface PressRound {
  reporter: Reporter;
  question: PressQuestion;
  /** Shuffled tone order for the four buttons. */
  order: Tone[];
}

const TONES: Tone[] = ["bold", "humble", "witty", "straight"];

/** Build the rounds for one press minigame from a seed. Deterministic, no repeats inside a game. */
export function pressRounds(seed: number, count: number): PressRound[] {
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const qs = [...PRESS_QUESTIONS].map((q) => ({ q, k: rand() })).sort((a, b) => a.k - b.k).map((row) => row.q);
  const rounds: PressRound[] = [];
  let lastReporter = "";
  for (let i = 0; i < count; i++) {
    let reporter = REPORTERS[Math.floor(rand() * REPORTERS.length)]!;
    if (reporter.id === lastReporter) reporter = REPORTERS[(REPORTERS.indexOf(reporter) + 1) % REPORTERS.length]!;
    lastReporter = reporter.id;
    const order = [...TONES].map((t) => ({ t, k: rand() })).sort((a, b) => a.k - b.k).map((row) => row.t);
    rounds.push({ reporter, question: qs[i % qs.length]!, order });
  }
  return rounds;
}

/** 1 for the reporter's favourite tone, 0.5 for their second, 0 otherwise. */
export function pressScore(reporter: Reporter, tone: Tone): number {
  return tone === reporter.wants[0] ? 1 : tone === reporter.wants[1] ? 0.5 : 0;
}
