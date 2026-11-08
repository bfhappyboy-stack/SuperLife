// Legend kits (2026-11-08 pm): Batman's Utility Belt fills his six instead of street moves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KITS, kitFor, kitMoveUnlocked } from "../kits.ts";
import { battleMoves, knownMoves, lockedLine, moveById, moveSource, placeInSlot, toDuel } from "../moves.ts";
import { ageUp, choose, createGame, resolveMini } from "../engine.ts";
import { fighterFromLife } from "../arena.lives.ts";
import { PRESETS } from "../presets.ts";
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

test("kit data: unique ids, ascending ages, every style covered by 14, only powerless legends", () => {
  const ids = new Set<string>();
  for (const kit of KITS) {
    const legend = PRESETS.find((p) => p.id === kit.legend);
    assert.ok(legend, kit.legend);
    assert.equal(legend.powers.length, 0, `${kit.legend} has powers; kits are for powerless legends`);
    let last = 0;
    for (const move of kit.moves) {
      assert.ok(!ids.has(move.id), move.id);
      ids.add(move.id);
      assert.ok(move.minAge >= last, `${move.id} out of order`);
      last = move.minAge;
      assert.equal(moveById(move.id)?.name, move.name);
      assert.equal(move.powerId, kit.id);
    }
    const early = new Set(kit.moves.filter((m) => m.minAge <= 14).map((m) => m.style));
    assert.deepEqual([...early].sort(), ["guard", "strike", "trick"]);
    assert.ok(kit.moves.length > 6, "a kit should outgrow the six so the player chooses");
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
  assert.ok(seen.some((line) => /New on the Utility Belt: .*Batarang/.test(line)), seen.filter((l) => /Belt/.test(l)).join(" | "));
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
