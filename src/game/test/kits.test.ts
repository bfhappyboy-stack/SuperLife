// Legend kits (2026-11-08 pm): Batman's Utility Belt fills his six instead of street moves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KITS, kitFor, kitMoveUnlocked } from "../kits.ts";
import { allMoveDefs, battleMoves, fillLoadout, knownMoves, lockedLine, moveById, moveSource, placeInSlot, slotKitArrival, toDuel } from "../moves.ts";
import { ageUp, choose, createGame, resolveMini } from "../engine.ts";
import { fighterFromLife } from "../arena.lives.ts";
import { PRESETS, signatureMoves } from "../presets.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;

function live(g: Game, maxAge: number, seen?: string[]): Game {
  for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
    for (const line of g.card?.banner ?? []) seen?.push(line);
  }
  return g;
}

test("kit data: unique ids, ascending ages, upgrades point back, kits that fill the six cover every style by 14", () => {
  const ids = new Set<string>();
  for (const kit of KITS) {
    const legend = PRESETS.find((p) => p.id === kit.legend);
    assert.ok(legend, kit.legend);
    // A legend with powers needs the kit to stand in for some of them, or it just piles on.
    if (legend.powers.length) assert.ok(kit.replaces, `${kit.legend} has powers; its kit must say which power moves it replaces`);
    let last = 0;
    for (const move of kit.moves) {
      assert.ok(!ids.has(move.id), move.id);
      ids.add(move.id);
      assert.ok(move.minAge >= last, `${move.id} out of order`);
      last = move.minAge;
      assert.equal(moveById(move.id)?.name, move.name);
      assert.equal(move.powerId, kit.id);
      if (move.upgrades) {
        const old = kit.moves.find((m) => m.id === move.upgrades);
        assert.ok(old, `${move.id} upgrades a piece of its own kit`);
        assert.ok(old.minAge < move.minAge, `${move.id} arrives after what it upgrades`);
        assert.equal(old.style, move.style, `${move.id} keeps the slot's style`);
      }
    }
    // A kit that starts in childhood carries the fights alone until the powers wake, so it covers every style early.
    const fills = !kit.replaces?.styles && kit.moves[0]!.minAge <= 14;
    if (fills) {
      const early = new Set(kit.moves.filter((m) => m.minAge <= 14).map((m) => m.style));
      assert.deepEqual([...early].sort(), ["guard", "strike", "trick"]);
    }
    if (!kit.replaces?.styles) {
      const finalPieces = kit.moves.filter((m) => !kit.moves.some((n) => n.upgrades === m.id));
      assert.ok(finalPieces.length > 6, `${kit.legend}: a kit should outgrow the six so the player chooses`);
    }
  }
});

test("belt moves unlock by age and only for their own legend", () => {
  const kit = kitFor("batman")!;
  const batarang = kit.moves.find((m) => m.id === "belt::batarang")!;
  assert.equal(kitMoveUnlocked({ preset: "batman", age: 11 }, batarang), false);
  assert.equal(kitMoveUnlocked({ preset: "batman", age: 12 }, batarang), true);
  assert.equal(kitMoveUnlocked({ preset: "hulk", age: 40 }, batarang), false);
  assert.equal(kitMoveUnlocked({ preset: null, age: 40 }, batarang), false);
  assert.equal(moveSource(batarang), "Utility Belt");
  assert.match(lockedLine(batarang), /joins the Utility Belt at 12/);
  const hulk = createGame({ ...base, preset: "hulk", seed: 2 } as never);
  assert.ok(!knownMoves(hulk).some((e) => e.def.id.startsWith("belt::")));
  const res = placeInSlot(structuredClone(hulk), 0, "belt::batarang");
  assert.equal(res.ok, false);
});

test("Detective Mode carries its Shock override into the duel move", () => {
  const def = moveById("belt::detective")!;
  assert.equal(toDuel(def).applies, "shock");
  assert.equal(toDuel(moveById("belt::batarang")!).applies, undefined);
});

test("Batman's life: belt gadgets arrive on birthdays, fill the six, and arm an Ultimate at 30", () => {
  const seen: string[] = [];
  let g = live(createGame({ ...base, preset: "batman", seed: 7 } as never), 13, seen);
  assert.ok(seen.some((line) => /New in the Utility Belt: .*Batarang/.test(line)), seen.filter((l) => /Belt/.test(l)).join(" | "));
  assert.ok((g.loadout ?? []).includes("belt::keysi") && (g.loadout ?? []).includes("belt::batarang"));
  g = live(g, 27);
  let six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.ok(six.every((m) => (m.id ?? "").startsWith("belt::")), six.map((m) => m.id).join(","));
  assert.ok(!six.some((m) => m.ultimate), "no Ultimate before 30");
  g = live(g, 31);
  six = battleMoves(g);
  assert.equal(six.filter((m) => m.ultimate).length, 1);
  const fighter = fighterFromLife(0, g);
  assert.ok(fighter && fighter.moves.some((m) => (m.id ?? "").includes("belt::")), "Arena saved-life Batman brings the belt");
});

// Iron Man's Armory (2026-11-09 pm): suit pieces from 10, Mark upgrades take the old slot, Unibeam Ultimate at 30.
test("Armory pieces unlock by age, upgrades retire the old piece, and his power moves stay off the shelf", () => {
  const pulse = moveById("armory::pulse")! as never;
  assert.equal(kitMoveUnlocked({ preset: "iron-man", age: 12 }, pulse), true);
  assert.equal(kitMoveUnlocked({ preset: "iron-man", age: 24 }, pulse), false, "Repulsor Blast retires the Pulse Glove");
  assert.equal(kitMoveUnlocked({ preset: "batman", age: 24 }, moveById("armory::repulsor")! as never), false);
  assert.match(lockedLine(moveById("armory::unibeam")!), /joins the Armory at 30/);
  const g = live(createGame({ ...base, preset: "iron-man", seed: 3 } as never), 30);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => id.startsWith("energy-projection::") || id.startsWith("flight::")), shelf.join(","));
  assert.ok(!shelf.includes("armory::pulse") && shelf.includes("armory::repulsor"));
  const repulsorPower = allMoveDefs().find((d) => d.powerId === "energy-projection" && d.minMastery === 1)!;
  const res = placeInSlot(structuredClone(g), 0, repulsorPower.id);
  assert.equal(res.ok, false);
  assert.match(res.line, /Armory/);
});

test("Iron Man's life: no street moves once the suit is built, upgrades keep the six full, Unibeam is the Ultimate at 30", () => {
  const seen: string[] = [];
  let g = live(createGame({ ...base, preset: "iron-man", seed: 5 } as never), 23, seen);
  let six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.ok(six.every((m) => (m.id ?? "").startsWith("armory::")), `23: ${six.map((m) => m.id).join(",")}`);
  assert.ok(seen.some((line) => /Armory upgrade: Mark I Plating replaces Tin-Can Shield/.test(line)), seen.filter((l) => /Armory/.test(l)).join(" | "));
  g = live(g, 31, seen);
  six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.ok(six.every((m) => (m.id ?? "").startsWith("armory::")), `31: ${six.map((m) => m.id).join(",")}`);
  const ult = six.filter((m) => m.ultimate);
  assert.equal(ult.length, 1);
  assert.equal(ult[0]!.id, "armory::unibeam");
  const styles = new Set(six.map((m) => m.style));
  assert.equal(styles.size, 3, "every tell has an answer");
  const fighter = fighterFromLife(0, g);
  assert.ok(fighter && fighter.moves.some((m) => (m.id ?? "").includes("armory::unibeam")), "Arena saved-life Iron Man brings the Armory");
});

// Spider-Man's web-shooters (2026-11-09 pm): webs replace every guard his powers would give.
test("Spider-Man's web-shooters replace his power guards instead of adding to them", () => {
  const g = live(createGame({ ...base, preset: "spider-man", seed: 4 } as never), 27);
  const shelf = knownMoves(g);
  const guards = shelf.filter((e) => e.def.style === "guard");
  assert.ok(guards.length > 0);
  assert.ok(guards.every((e) => e.def.id.startsWith("web::")), guards.map((e) => e.def.id).join(","));
  assert.ok(shelf.some((e) => !e.def.id.startsWith("web::") && e.unlocked), "his powers still bring strikes and tricks");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  const sixGuards = six.filter((m) => m.style === "guard");
  assert.ok(sixGuards.length >= 1 && sixGuards.every((m) => (m.id ?? "").startsWith("web::")), six.map((m) => m.id).join(","));
  assert.ok(!six.some((m) => (m.id ?? "").startsWith("street::")), "no street padding once the webs are in");
  // Web Shield has become Web Wall by 26; the old piece is off the shelf.
  assert.ok(!shelf.some((e) => e.def.id === "web::shield") && shelf.some((e) => e.def.id === "web::wall"));
  // A power guard can't be slotted, and an old save holding one drops it and refills from the webs.
  const powerGuard = allMoveDefs().find((d) => ["super-senses", "super-strength", "super-speed"].includes(d.powerId) && d.style === "guard")!;
  const res = placeInSlot(structuredClone(g), 0, powerGuard.id);
  assert.equal(res.ok, false);
  assert.match(res.line, /Web-Shooters/);
  const old = structuredClone(g);
  old.loadout = [powerGuard.id, ...(old.loadout ?? []).slice(1)];
  fillLoadout(old);
  assert.equal(old.loadout.length, 6);
  assert.ok(!old.loadout.includes(powerGuard.id));
});

test("web-shooters leave the Ultimate to his powers, and his rogues hit harder than the base table", () => {
  assert.equal(kitFor("spider-man")!.ultimateAge, null);
  const goblin = PRESETS.find((p) => p.id === "spider-man")!.villains.find((v) => v.alias === "Green Goblin")!;
  const moves = signatureMoves("Green Goblin", 1)!;
  assert.equal(moves[0]!.power, goblin.moves[0]!.power + Math.round(goblin.level / 2) + 2);
  const joker = PRESETS.find((p) => p.id === "batman")!.villains.find((v) => v.alias === "The Joker")!;
  assert.equal(signatureMoves("The Joker", 1)![0]!.power, joker.moves[0]!.power + Math.round(joker.level / 2));
});

// Thor's Mjolnir (2026-11-09 pm): Asgard's yard from 10, the hammer from 17, God Blast Ultimate at 30.
test("Thor's life: Mjolnir replaces his strength moves, upgrades in place, and God Blast is the Ultimate at 30", () => {
  const seen: string[] = [];
  const g = live(createGame({ ...base, preset: "thor", seed: 6 } as never), 31, seen);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => id.startsWith("super-strength::")), shelf.join(","));
  assert.ok(shelf.includes("mjolnir::godblast") && !shelf.includes("mjolnir::strike") && !shelf.includes("mjolnir::blade"));
  assert.ok(seen.some((line) => /Mjolnir upgrade: Mjolnir Strike replaces Practice Blade/.test(line)), seen.filter((l) => /Mjolnir/.test(l)).join(" | "));
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.ok(!six.some((m) => (m.id ?? "").startsWith("street::")));
  const ult = six.filter((m) => m.ultimate);
  assert.equal(ult.length, 1);
  assert.equal(ult[0]!.id, "mjolnir::godblast");
  assert.equal(new Set(six.map((m) => m.style)).size, 3);
});

// Every kit (2026-11-09 pm): a lived legend past the kit's Ultimate age fights with exactly six,
// no street padding, nothing the kit replaces, and (when the kit leads) a kit Ultimate.
test("every legend kit: six moves, no replaced power moves, kit Ultimate where the kit leads", () => {
  for (const kit of KITS) {
    const age = (kit.ultimateAge ?? 30) + 1;
    const g = live(createGame({ ...base, preset: kit.legend, seed: 8 } as never), age);
    const six = battleMoves(g);
    assert.equal(six.length, 6, kit.legend);
    assert.ok(!six.some((m) => (m.id ?? "").startsWith("street::")), `${kit.legend}: ${six.map((m) => m.id).join(",")}`);
    for (const m of six) {
      const def = moveById(m.id ?? "");
      if (def && !def.powerId.startsWith("kit:")) {
        assert.ok(!kit.replaces?.powers?.includes(def.powerId), `${kit.legend} fights with replaced ${def.id}`);
        assert.ok(!kit.replaces?.styles?.includes(def.style), `${kit.legend} fights with replaced ${def.id}`);
      }
    }
    assert.ok(six.some((m) => (m.id ?? "").startsWith(kit.moves[0]!.id.split("::")[0]!)), `${kit.legend} has kit moves in the six`);
    if (kit.ultimateAge !== null && (kit.leadsUltimate || !PRESETS.find((p) => p.id === kit.legend)!.powers.length)) {
      const ult = six.filter((m) => m.ultimate);
      assert.equal(ult.length, 1, kit.legend);
      assert.equal(moveById(ult[0]!.id ?? "")?.powerId, kit.id, `${kit.legend} Ultimate comes from the kit`);
      assert.equal(ult[0]!.style, "strike", `${kit.legend} Ultimate is a strike`);
    }
  }
});

// Flash's Speed Force (2026-11-09 pm) and rogues who wait (a child can't be called out by his legend's rogue).
test("Flash's Speed Force replaces his generic speed moves from the wake, Infinite Mass Punch at 33", () => {
  const g = live(createGame({ ...base, preset: "flash", seed: 9 } as never), 34);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => id.startsWith("super-speed::") || id.startsWith("thunder-sprint::")), shelf.join(","));
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.equal(six.find((m) => m.ultimate)?.id, "speedforce::imp");
});

test("a legend's own arch-rogue never calls out a child who can't fight back yet", () => {
  const thawne = PRESETS.find((p) => p.id === "flash")!.villains.find((v) => v.id === "reverse-flash")!;
  const callouts: number[] = [];
  let armed = false;
  for (const seed of [11, 12, 13]) {
    let g = createGame({ ...base, preset: "flash", seed } as never);
    for (let i = 0; i < 9000 && g.phase !== "dead" && g.age < 30; i++) {
      // Make Thawne the arch-enemy as soon as he exists in this life.
      for (const r of g.relationships) if (r.note === thawne.alias && r.alive) { r.arch = true; armed = true; }
      if (g.phase === "choice" && g.pending) {
        if (g.pending.id === "arch-month") callouts.push(g.age);
        g = choose(g, g.pending.choices[0]!.id);
      } else if (g.phase === "mini") g = resolveMini(g, 0.7);
      else g = ageUp(g);
    }
  }
  assert.ok(armed, "Thawne should turn up in at least one of these lives");
  assert.deepEqual(callouts.filter((age) => age < 25), [], `called out at ${callouts.join(",")}`);
});

// Superman's Kryptonian Arts (2026-11-09 pm): heat vision, freeze breath and the rest replace his generic strength/flight/durability moves.
test("Superman's Kryptonian Arts replace his generic power moves, upgrade in place, and arm a kit Ultimate at 30", () => {
  const g = live(createGame({ ...base, preset: "superman", seed: 9 } as never), 31);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => /^(super-strength|flight|super-durability)::/.test(id)), shelf.join(","));
  assert.ok(shelf.includes("krypton::heat") && !shelf.includes("krypton::glare"), "Heat Vision retires Heat Glare");
  assert.ok(shelf.includes("krypton::steel") && !shelf.includes("krypton::bulletproof"), "Man of Steel retires Bulletproof");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  const ult = six.find((m) => m.ultimate);
  assert.ok(ult && (ult.id ?? "").startsWith("krypton::"), six.map((m) => m.id).join(","));
});

// Wonder Woman's Amazon Arms (2026-11-09 night): bracers, lasso, sword and shield replace her generic strength/flight/aegis moves.
test("Wonder Woman's Amazon Arms replace her generic power moves, the lasso arrives at 14, Godkiller is the Ultimate at 30", () => {
  const lasso = moveById("amazon::lasso")!;
  assert.equal(kitMoveUnlocked({ preset: "wonder-woman", age: 14 }, lasso as never), true);
  assert.equal(toDuel(lasso).applies, "shock");
  const g = live(createGame({ ...base, preset: "wonder-woman", seed: 9 } as never), 31);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => /^(super-strength|flight|aegis-shell)::/.test(id)), shelf.join(","));
  assert.ok(shelf.includes("amazon::godkiller") && !shelf.includes("amazon::sword") && !shelf.includes("amazon::spear"), "Godkiller retires the sword and spear");
  assert.ok(shelf.includes("amazon::shield") && !shelf.includes("amazon::bracers"), "Amazon Shield retires Bracer Block");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.equal(six.find((m) => m.ultimate)?.id, "amazon::godkiller", six.map((m) => m.id).join(","));
  assert.equal(new Set(six.map((m) => m.style)).size, 3);
});

// Hulk's Gamma Rage (2026-11-09 night): smash, hide and leap from the gamma at 28, World Breaker Ultimate at 33.
test("Hulk's Gamma Rage replaces his strength / durability / Juggernaut moves and World Breaker is the Ultimate at 33", () => {
  const g = live(createGame({ ...base, preset: "hulk", seed: 9 } as never), 35);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => /^(super-strength|super-durability|juggernaut-mass)::/.test(id)), shelf.join(","));
  assert.ok(shelf.includes("gamma::worldbreaker") && !shelf.includes("gamma::smash"), "World Breaker retires Hulk Smash");
  assert.ok(shelf.includes("gamma::madder") && !shelf.includes("gamma::hide"), "Madder, Stronger retires Gamma Hide");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.equal(six.find((m) => m.ultimate)?.id, "gamma::worldbreaker", six.map((m) => m.id).join(","));
  assert.equal(new Set(six.map((m) => m.style)).size, 3);
});

// Black Panther's Panther Habit (2026-11-09 night): Dora drills from 16, vibranium from 18, Kinetic Release Ultimate at 30.
test("Black Panther's Panther Habit replaces his strength / kinetic moves and Kinetic Release is the Ultimate at 30", () => {
  assert.equal(kitMoveUnlocked({ preset: "black-panther", age: 15 }, moveById("panther::stance")! as never), false, "no kit before 16, so rogues still wait");
  const g = live(createGame({ ...base, preset: "black-panther", seed: 9 } as never), 31);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => /^(super-strength|kinetic-impact|juggernaut-mass)::/.test(id)), shelf.join(","));
  assert.ok(shelf.includes("panther::release") && !shelf.includes("panther::claws") && !shelf.includes("panther::challenge"), "Kinetic Release retires the claws");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.equal(six.find((m) => m.ultimate)?.id, "panther::release", six.map((m) => m.id).join(","));
  assert.equal(new Set(six.map((m) => m.style)).size, 3);
});

// Wolverine's Claws & Healing Factor (2026-11-09 night): bone claws at 12, adamantium at 25, Berserker Barrage Ultimate at 30.
test("Wolverine's Claws & Healing Factor replace his regeneration / pain-map moves and Berserker Barrage is the Ultimate at 30", () => {
  const g = live(createGame({ ...base, preset: "wolverine", seed: 9 } as never), 31);
  const shelf = knownMoves(g).map((e) => e.def.id);
  assert.ok(!shelf.some((id) => /^(regeneration|pain-map)::/.test(id)), shelf.join(","));
  assert.ok(shelf.includes("claws::barrage") && !shelf.includes("claws::adamantium") && !shelf.includes("claws::bone"), "the barrage retires both claws");
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  assert.equal(six.find((m) => m.ultimate)?.id, "claws::barrage", six.map((m) => m.id).join(","));
  assert.equal(new Set(six.map((m) => m.style)).size, 3);
});

// 2026-11-09 night: Captain America was still the strongest legend (Hard 0.77 / 0.56); his gallery gets the same +2 rogue edge as Spider-Man's.
test("Captain America's rogues carry a +2 rogue edge", () => {
  const cap = PRESETS.find((p) => p.id === "captain-america")!;
  assert.equal(cap.rogueEdge, 2);
  const rogue = cap.villains[0]!;
  assert.equal(signatureMoves(rogue.alias, 1)![0]!.power, rogue.moves[0]!.power + Math.round(rogue.level / 2) + 2);
});

// 2026-11-09 night: a new kit piece takes a slot when its style is short in a lopsided six.
test("a new kit piece slots itself in when the six is lopsided, and leaves a balanced six alone", () => {
  const seen: string[] = [];
  const g = live(createGame({ ...base, preset: "black-panther", seed: 1 } as never), 27, seen);
  const six = battleMoves(g);
  assert.equal(six.length, 6);
  const counts = { strike: 0, guard: 0, trick: 0 } as Record<string, number>;
  for (const m of six) counts[m.style]!++;
  assert.ok(counts.strike! >= 2, six.map((m) => m.id).join(","));
  assert.ok(seen.some((l) => /Claw Flurry takes .*slot/.test(l)) || (g.loadout ?? []).includes("panther::flurry"), seen.join(" | "));
  // Balanced six: nothing moves.
  const bal = structuredClone(g);
  const before = [...(bal.loadout ?? [])];
  const strikes = (bal.loadout ?? []).filter((id) => moveById(id)?.style === "strike").length;
  if (strikes >= 2) assert.equal(slotKitArrival(bal, "panther::forever"), null);
  assert.deepEqual(bal.loadout, before);
});
