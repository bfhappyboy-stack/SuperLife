/**
 * Gimmicks for ordinary bosses (story-arc bosses and other named villains outside the legends), keyed by
 * the foe's legacy power. Legend rogues use their own in presets.ts (VILLAIN_GIMMICKS).
 */
import type { BossGimmick, PowerId } from "./types";

type Template = Omit<BossGimmick, "name" | "line"> & { name: (foe: string) => string; line: (foe: string) => string };

const T = (kind: BossGimmick["kind"], name: (foe: string) => string, line: (foe: string) => string, hint: string, extra: Pick<Partial<BossGimmick>, "at" | "style"> = {}): Template => ({ ...extra, kind, name, line, hint });

const BY_POWER: Partial<Record<PowerId, Template>> = {
  strength: T("charge", () => "Haymaker Wind-up", (f) => `${f} rolls a shoulder and sets their feet.`, "Every third turn they wind up. Guard when it comes."),
  blasts: T("charge", () => "Full Discharge", (f) => `${f}'s hands go white-hot. Something big is building.`, "Every third turn they let it all go. Guard."),
  lightning: T("charge", () => "Storm Call", (f) => `The air tastes of copper. ${f} is calling it down.`, "Every third turn lightning falls. Guard when it comes."),
  fire: T("enrage", () => "Flashover", (f) => `${f} burns hotter the closer they get to losing.`, "They hit harder below half, and take more. Answer every tell.", { at: 0.5 }),
  ice: T("armor", () => "Rime Shell", (f) => `Frost knits over ${f} like plate.`, "The ice soaks hits. Two trick moves crack it.", { style: "trick" }),
  forcefield: T("armor", () => "Barrier", (f) => `${f} drops a dome of force between you.`, "The barrier soaks hits. Two trick moves slip it.", { style: "trick" }),
  telekinesis: T("armor", () => "Debris Wall", (f) => `${f} pulls the street up into a shield.`, "The wall soaks hits. Two trick moves bring it down.", { style: "trick" }),
  healing: T("regen", () => "Knit", (f) => `${f}'s wounds close as you watch.`, "They heal each turn. A trick move stalls it.", { style: "trick" }),
  flight: T("regen", () => "High Ground", (f) => `${f} lifts out of reach to breathe.`, "They recover each turn. A trick move drags them down.", { style: "trick" }),
  speed: T("adapt", () => "Read the Rhythm", (f) => `${f} has your timing now.`, "They punish repeats. Change your move every turn."),
  invisibility: T("fog", () => "Vanish", (f) => `${f} fades out of the light.`, "Some tells are hidden. Hit hard when you can't see."),
  mind: T("feint", () => "Mind Games", (f) => `${f} is in your head, telling you what they'll do.`, "Some tells lie. Trade even when unsure."),
  shapeshift: T("feint", () => "False Face", (f) => `${f} shifts mid-swing. You can't read the body any more.`, "Some tells lie. Trade even when unsure."),
  intellect: T("swarm", () => "Contingency", (f) => `${f} taps a remote. Drones wake in the rafters.`, "Drones chip you each turn. An area move clears them."),
  elastic: T("swarm", () => "Everywhere at Once", (f) => `${f} stretches around you from four sides.`, "You take chip hits each turn. An area move breaks free."),
};

const FALLBACK = T("enrage", () => "Second Wind", (f) => `${f} spits blood and grins. Round two.`, "They hit harder below half. Answer every tell.", { at: 0.5 });

/** A boss gimmick for an ordinary villain, by their legacy power. */
export function powerGimmick(powerId: PowerId | null | undefined, foe: string): BossGimmick {
  const t = (powerId && BY_POWER[powerId]) || FALLBACK;
  const { name, line, ...rest } = t;
  return { ...rest, name: name(foe), line: line(foe) };
}
