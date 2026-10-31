import type { ElementId } from "./elements";
import type { MoveStyle } from "./types";

export type MoveKind = "burst" | "area" | "status" | "guard" | "dash";

export interface MoveDef {
  id: string;
  name: string;
  powerId: string;
  blurb: string;
  minMastery: number;
  power: number;
  style: MoveStyle;
  kind: MoveKind;
  energy: number;
  effect: string;
  cooldown: number;
  /** Look of the move in a fight; defaults to the power's element. */
  element?: ElementId;
}

function move(partial: MoveDef): MoveDef {
  return partial;
}

/** Hand-authored moves. Anything not listed is generated from the power's generation. */
export const MOVE_BOOK: MoveDef[] = [
  move({ id: "fire-spark", name: "Spark Jab", powerId: "fire-control", blurb: "A knuckle of flame.", minMastery: 1, power: 5, style: "strike", kind: "burst", energy: 1, effect: "A clean burn.", cooldown: 0 }),
  move({ id: "fire-breath", name: "Cinder Breath", powerId: "fire-control", blurb: "The air agrees with you.", minMastery: 3, power: 8, style: "trick", kind: "area", energy: 3, effect: "The space in front of you cooks.", cooldown: 1 }),
  move({ id: "speed-cut", name: "Quick Cut", powerId: "super-speed", blurb: "You are already past the punch.", minMastery: 1, power: 5, style: "trick", kind: "dash", energy: 1, effect: "You leave the line.", cooldown: 0 }),
  move({ id: "speed-after", name: "Afterimage", powerId: "super-speed", blurb: "They hit the person you were.", minMastery: 3, power: 7, style: "guard", kind: "status", energy: 2, effect: "Their next swing is late.", cooldown: 1 }),
  move({ id: "str-hands", name: "Heavy Hands", powerId: "super-strength", blurb: "Mass, delivered.", minMastery: 1, power: 6, style: "strike", kind: "burst", energy: 1, effect: "A straight, rude hit.", cooldown: 0 }),
  move({ id: "str-pound", name: "Ground Pound", powerId: "super-strength", blurb: "The floor files a complaint.", minMastery: 3, power: 9, style: "strike", kind: "area", energy: 3, effect: "Everyone standing feels it.", cooldown: 1 }),
  move({ id: "ls-dash", name: "Photon Dash", powerId: "light-speed", blurb: "You arrive as a white argument.", minMastery: 2, power: 9, style: "trick", kind: "dash", energy: 2, effect: "Range collapses.", cooldown: 0 }),
  move({ id: "ls-trail", name: "Light Trail", powerId: "light-speed", blurb: "The street stays bright and unfriendly.", minMastery: 4, power: 12, style: "strike", kind: "area", energy: 4, effect: "A burning line they have to cross.", cooldown: 1 }),
  move({ id: "mf-punch", name: "Eruption Punch", powerId: "magma-fist", blurb: "A punch that remembers being a volcano.", minMastery: 2, power: 10, style: "strike", kind: "burst", energy: 3, effect: "Heat stays in the wound.", cooldown: 1 }),
  move({ id: "mf-burst", name: "Lava Burst", powerId: "magma-fist", blurb: "The floor joins the argument.", minMastery: 4, power: 12, style: "trick", kind: "area", energy: 4, effect: "A splash of ground-turned-weapon.", cooldown: 1 }),
  move({ id: "vc-redirect", name: "Kinetic Redirect", powerId: "velocity-control", blurb: "Their speed becomes a suggestion.", minMastery: 2, power: 8, style: "guard", kind: "status", energy: 2, effect: "The next hit arrives tired.", cooldown: 0 }),
  move({ id: "vc-steal", name: "Speed Steal", powerId: "velocity-control", blurb: "You take the hurry out of them.", minMastery: 4, power: 11, style: "trick", kind: "dash", energy: 3, effect: "You keep what you took.", cooldown: 1 }),
  move({ id: "lst-chain", name: "Chain Lightning", powerId: "lightning-strikes", blurb: "The bolt picks a second grudge.", minMastery: 3, power: 14, style: "trick", kind: "area", energy: 4, effect: "It jumps.", cooldown: 1 }),
  move({ id: "lst-slam", name: "Thunderclap Slam", powerId: "lightning-strikes", blurb: "The block flinches with you.", minMastery: 5, power: 17, style: "strike", kind: "burst", energy: 6, effect: "A signature. The room rings.", cooldown: 2 }),
  move({ id: "sf-brand", name: "Noon Brand", powerId: "solar-flare", blurb: "Daybreak, aimed.", minMastery: 3, power: 13, style: "strike", kind: "burst", energy: 4, effect: "Too bright to look at and still a hit.", cooldown: 1 }),
  move({ id: "sf-crown", name: "Corona Crown", powerId: "solar-flare", blurb: "You wear the sun for one second.", minMastery: 5, power: 16, style: "guard", kind: "area", energy: 5, effect: "What touches you burns.", cooldown: 2 }),
  move({ id: "cs-front", name: "Front of Teeth", powerId: "cataclysm-storm", blurb: "Weather with a grudge.", minMastery: 3, power: 14, style: "strike", kind: "area", energy: 5, effect: "The block is the weapon.", cooldown: 1 }),
  move({ id: "cs-eye", name: "Eye of the Grudge", powerId: "cataclysm-storm", blurb: "The storm looks at one person.", minMastery: 5, power: 17, style: "trick", kind: "status", energy: 6, effect: "They cannot find their feet.", cooldown: 2 }),
  move({ id: "dt-chapel", name: "Chapel Bolt", powerId: "divine-thunder", blurb: "A shot that sounds like a roof deciding.", minMastery: 3, power: 15, style: "strike", kind: "burst", energy: 5, effect: "One target. No appeal.", cooldown: 1 }),
  move({ id: "dt-sermon", name: "Sermon", powerId: "divine-thunder", blurb: "You say it from above.", minMastery: 5, power: 18, style: "trick", kind: "area", energy: 6, effect: "Everyone hears the point.", cooldown: 2 }),
  move({ id: "ki-receipt", name: "Receipt", powerId: "kinetic-impact", blurb: "Mass times rude.", minMastery: 2, power: 10, style: "strike", kind: "burst", energy: 3, effect: "The wall keeps the copy.", cooldown: 1 }),
  move({ id: "pb-sun", name: "Sun in a Fist", powerId: "plasma-blast", blurb: "Light with opinions.", minMastery: 2, power: 9, style: "trick", kind: "burst", energy: 3, effect: "A line of plasma.", cooldown: 1 }),
  move({ id: "sfly-boom", name: "Boom Pass", powerId: "sonic-flight", blurb: "You break the sound barrier on the way through.", minMastery: 2, power: 9, style: "trick", kind: "dash", energy: 3, effect: "You are gone before the crack.", cooldown: 1 }),
  move({ id: "sorc-mark", name: "Ash Mark", powerId: "sorcery", blurb: "A sign that stays after you do.", minMastery: 1, power: 6, style: "trick", kind: "status", energy: 2, effect: "Their next swing arrives tired.", cooldown: 0 }),
  move({ id: "sorc-ward", name: "Borrowed Ward", powerId: "sorcery", blurb: "A wall you asked for, not one you grew.", minMastery: 3, power: 8, style: "guard", kind: "guard", energy: 3, effect: "The hit has to ask permission.", cooldown: 1 }),
];
