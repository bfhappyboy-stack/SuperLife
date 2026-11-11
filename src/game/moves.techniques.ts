/**
 * Mastery techniques (owner's call, 2026-11-10 eve: "super powers are rare and should be trained and nurtured").
 * A life holds one or two powers for years, so a power has to grow on its own: every base power learns a third
 * move at rank C and a fourth at rank A, on top of its opener (D) and signature (B). The C move covers the style
 * the first two miss, so a single well-drilled power answers every tell. Numbers live here, in one place.
 *
 * Line format: "Name | blurb | what it does in a fight". Ids are `${powerId}::c` and `${powerId}::d`.
 */
import type { MoveKind } from "./moves.catalog";
import type { MoveStyle } from "./types";

export interface Technique {
  name: string;
  blurb: string;
  effect: string;
  style: MoveStyle;
  kind: MoveKind;
}

/** Rank needed for each technique, and its numbers (base powers only). */
export const TECH_C = { minMastery: 2, power: 5, energy: 2, cooldown: 1 } as const;
export const TECH_D = { minMastery: 4, power: 8, energy: 3, cooldown: 1 } as const;

export const TECHNIQUES: Record<string, { c: Technique; d: Technique }> = {};

function t(text: string, style: MoveStyle, kind: MoveKind): Technique {
  const [name, blurb, effect] = text.split("|").map((part) => part.trim());
  return { name: name!, blurb: blurb ?? "", effect: effect ?? "", style, kind };
}

function T(powerId: string, c: Technique, d: Technique) {
  TECHNIQUES[powerId] = { c, d };
}

T("fire-control", t("Heat Haze | The air shimmers and lies about where you are. | Their next hit lands on the shimmer.", "guard", "status"), t("Blue Flame | Hotter than anyone taught you. | A burn that doesn't stop at the skin.", "strike", "burst"));
T("ice-control", t("Rime Slick | The floor stops being on their side. | They slip into your next hit.", "trick", "status"), t("Icicle Lance | Winter, pointed. | One cold line straight through the guard.", "strike", "burst"));
T("lightning-control", t("Static Skin | A charge that bites back. | Whatever touches you gets a shock.", "guard", "guard"), t("Full Discharge | Every volt you've saved, at once. | A hit that leaves the lights flickering.", "strike", "burst"));
T("super-strength", t("Brace and Hold | You plant, and the hit runs out of road. | Takes the worst of the next blow.", "guard", "guard"), t("Mountain Breaker | Years of training in one swing. | The hit that ends arguments.", "strike", "burst"));
T("super-speed", t("Hundred Jabs | A minute of punches in one second. | A blur of small hits.", "strike", "burst"), t("Vortex Run | You circle until the air comes with you. | They lose their footing in the wind.", "trick", "area"));
T("flight", t("Barrel Roll | You're not where the hit was going. | The next blow sails past.", "guard", "dash"), t("Meteor Drop | From as high as you dare. | You come down like weather.", "strike", "burst"));
T("telekinesis", t("Hold Still | You catch the punch in the air. | Their next hit stops short.", "guard", "status"), t("Crush Grip | You close a hand you never touch them with. | Squeezes the fight out of them.", "strike", "status"));
T("telepathy", t("Psychic Lash | You say it straight into their head. | It hurts like being told off.", "strike", "burst"), t("Puppet String | Their body listens to you for a second. | They swing at the wrong thing.", "trick", "status"));
T("energy-projection", t("Deflector | You catch the hit on a sheet of light. | Soaks the next blow.", "guard", "guard"), t("Full Beam | Everything you have, in a straight line. | Long, bright and very rude.", "strike", "area"));
T("invisibility", t("Unseen Hook | The punch they never saw. | Lands before they brace.", "strike", "burst"), t("Ghost Walk | You're gone, then behind them. | They spend the turn finding you.", "trick", "dash"));
T("regeneration", t("Bleed Bait | You let them think it worked. | They overcommit; you don't.", "trick", "status"), t("Unbreakable | You stopped counting the injuries years ago. | Shrugs off a heavy hit.", "guard", "guard"));
T("super-durability", t("Rope-a-Dope | Let them punch themselves tired. | Their next swing comes weaker.", "trick", "status"), t("Living Wall | Nothing gets past you today. | Eats a big hit whole.", "guard", "guard"));
T("gravity", t("Heavy Air | The space around you gets hard to cross. | Their next move arrives slowed.", "guard", "status"), t("Collapse | You make them weigh too much. | They hit the floor and stay there.", "strike", "burst"));
T("weather", t("Mist Veil | A cloud that rolls in on cue. | Hard to hit what you can't see.", "guard", "status"), t("Squall Line | A small storm, aimed. | The sky hits them for you.", "strike", "area"));
T("super-senses", t("Weak-Point Jab | You know exactly where. | A small hit that lands big.", "strike", "burst"), t("Danger Sense | You feel it a heartbeat early. | The next hit finds air.", "guard", "status"));
T("force-field", t("Mirror Pane | A field that bends the hit away. | Their swing turns on them.", "trick", "status"), t("Fortress | A shell that has stopped worse. | Shrugs off a heavy hit.", "guard", "guard"));
T("teleportation", t("Drop In | You arrive fist first. | A hit from nowhere.", "strike", "dash"), t("Scatter Jump | Three places in one breath. | They can't keep up.", "trick", "dash"));
T("shape-shifting", t("Hard Shell | Your skin remembers being stone. | Takes the edge off the next hit.", "guard", "guard"), t("Monster Form | You become the worst thing in the alley. | A big, frightening hit.", "strike", "burst"));
T("elasticity", t("Rubber Band | Stretch, let go, arrive. | You fly in from a strange angle.", "trick", "dash"), t("Whip Lash | Your arm as a whip. | Wide, fast and loud.", "strike", "area"));
T("sorcery", t("Ember Sigil | A mark that burns when you finish it. | A spell with a fist in it.", "strike", "burst"), t("Binding Circle | They step in, and stay. | They lose their next move.", "trick", "status"));
