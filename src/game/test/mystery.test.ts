// Mystery-power lives and God Mode legends: sealed gifts, the reveal, canon beats, and preset data rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, actionsFor, ageUp, choose, createGame, dismissReveal, giftsSealed, godPicks, resolveMini } from "../engine.ts";
import { getPower, mix } from "../combo.ts";
import { battleMoves, MOVESET_SIZE } from "../moves.ts";
import { PRESETS, canonAt, presetDecade, signatureMoves, wakeAge } from "../presets.ts";
import { guessOptions, pickHiddenGift, pickWakeAge } from "../mystery.ts";
import { CITIES, UPBRINGINGS } from "../data.ts";
import type { Game } from "../types.ts";

const base = { name: "Kai Moreno", cityId: "metro", upbringing: "supportive", portrait: 5, sex: "male", face: "secret", drive: "protector" } as const;
const POWER_ACTIONS = /^(train|stunt|mix\||learn\||fight|herotrain|tryout)/;

/** Age a life month by month, taking the first choice and a decent mini score, until `until(g)` or `maxAge`. */
function live(g: Game, maxAge: number, until?: (g: Game) => boolean, each?: (g: Game) => void): Game {
  for (let i = 0; i < 4000 && g.phase !== "dead" && g.age < maxAge; i++) {
    if (until?.(g)) return g;
    each?.(g);
    if (g.phase === "choice" && g.pending) g = choose(g, g.pending.choices[0]!.id);
    else if (g.phase === "mini") g = resolveMini(g, 0.7);
    else g = ageUp(g);
  }
  return g;
}

test("mystery lives are born sealed with a wake age from 7 to 15", () => {
  const ages = new Set<number>();
  for (let seed = 1; seed <= 60; seed++) {
    const g = createGame({ ...base, mode: "mystery", seed } as never);
    assert.equal(g.mode, "mystery");
    assert.ok(g.hiddenGift && getPower(g.hiddenGift), `seed ${seed} has a real sealed gift`);
    assert.ok((getPower(g.hiddenGift)?.generation ?? 9) <= 1);
    assert.equal(g.powerless, false);
    assert.equal(g.powerId, null);
    assert.deepEqual(g.unlockedPowers ?? [], []);
    const at = g.flags.manifestAge!;
    assert.ok(at >= 7 && at <= 15, `wake ${at}`);
    ages.add(at);
  }
  assert.ok(ages.size >= 6, "wake ages spread across the window");
  for (let r = 0; r < 1; r += 0.01) assert.ok(pickWakeAge(r) >= 7 && pickWakeAge(r) <= 15);
});

test("no power systems open before the reveal, and the reveal fires on the wake birthday", () => {
  for (const seed of [2, 5, 11]) {
    let g = createGame({ ...base, mode: "mystery", seed } as never);
    const wake = g.flags.manifestAge!;
    const sealed = g.hiddenGift!;
    g = live(g, 20, (x) => !x.hiddenGift, (x) => {
      const items = actionsFor(x).filter((a) => !a.disabled && POWER_ACTIONS.test(a.id));
      assert.deepEqual(items.map((a) => a.id), [], `age ${x.age}: power actions while sealed`);
      assert.deepEqual(x.unlockedPowers ?? [], [], `age ${x.age}: a gift landed before the reveal`);
    });
    assert.equal(g.hiddenGift, null);
    assert.equal(g.age, wake);
    assert.ok(g.reveal, "reveal waiting");
    assert.deepEqual(g.reveal!.powers, [sealed]);
    assert.ok((g.unlockedPowers ?? []).includes(sealed));
    assert.ok(g.powerId, "legacy power set for duels and jobs");
    assert.ok(g.stats.powerLevel >= 1.2);
    assert.equal(g.pending?.id, "manifest");
    assert.equal(battleMoves(g).length, MOVESET_SIZE);
    assert.equal(dismissReveal(g).reveal, null);
  }
});

test("omens build up and a right guess pays at the reveal", () => {
  let g = createGame({ ...base, mode: "mystery", seed: 4 } as never);
  g = live(g, 5, (x) => x.age >= 4 && x.phase === "live");
  assert.ok(actionsFor(g).some((a) => a.id === "omen" && !a.disabled));
  g = act(g, "omen");
  assert.equal(g.flags.omens, 1);
  assert.equal(act(g, "omen"), g, "once a month");
  g = live(g, 6, (x) => x.age >= 5 && x.phase === "live");
  g = act(g, "omen");
  const calls = actionsFor(g).filter((a) => a.id.startsWith("guess|"));
  assert.equal(calls.length, 3);
  const options = guessOptions(g.hiddenGift, 0);
  assert.equal(new Set(options).size, 3);
  const right = calls.find((a) => {
    const t = act(g, a.id);
    return t !== g;
  });
  assert.ok(right);
});

test("hidden gifts lean on upbringing and traits but stay real born powers", () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < 400; i++) {
    const id = pickHiddenGift("rural", ["thrill"], (i * 37 % 400) / 400, ((i * 13) % 100) / 100);
    assert.ok(getPower(id));
    assert.notEqual(id, "sorcery");
    counts[id] = (counts[id] ?? 0) + 1;
  }
  assert.ok((counts["weather"] ?? 0) > 400 / 25, "upbringing lean shows up");
});

test("classic lives (no mode) are unchanged", () => {
  const g = createGame({ ...base, giftId: "fire-control", seed: 1 } as never);
  assert.equal(g.mode, undefined);
  assert.equal(g.hiddenGift, undefined);
  assert.ok((g.unlockedPowers ?? []).includes("fire-control"));
});

test("God Mode picks: max three, one Apex, real ids", () => {
  const apex = ["light-speed", "lightning-strikes"].filter((id) => getPower(id)?.generation === 2);
  const picks = godPicks(["fire-control", "nope", "fire-control", ...apex, "flight", "ice-control"]);
  assert.ok(picks.length <= 3);
  assert.ok(picks.filter((id) => getPower(id)?.generation === 2).length <= 1);
  const g = createGame({ ...base, mode: "god", giftIds: ["fire-control", "super-speed", "flight"], extraTraits: ["millionaire"], seed: 3 } as never);
  for (const id of ["fire-control", "super-speed", "flight"]) assert.ok(g.unlockedPowers?.includes(id));
  assert.ok(g.traits.includes("millionaire"));
  assert.equal(battleMoves(g).length, MOVESET_SIZE);
});

test("the braid chain still holds for legends: Fire + Speed = Light Speed, + Strength = Lightning Strikes", () => {
  const one = mix("fire-control", "super-speed", ["fire-control", "super-speed"]);
  assert.ok(one.ok && one.power.id === "light-speed");
  const two = mix("light-speed", "super-strength", ["light-speed", "super-strength"]);
  assert.ok(two.ok && two.power.id === "lightning-strikes");
});

test("every legend is valid data", () => {
  const cities = new Set(CITIES.map((c) => c.id));
  const ups = new Set(UPBRINGINGS.map((u) => u.id));
  assert.equal(PRESETS.length, 4);
  for (const p of PRESETS) {
    assert.ok(cities.has(p.cityId), `${p.id} city`);
    assert.ok(ups.has(p.upbringing), `${p.id} upbringing`);
    assert.match(p.earth, /^Earth-/);
    assert.equal(p.decades.length, 8, `${p.id} has 8 decade chapters`);
    for (const id of p.powers) assert.ok((getPower(id)?.generation ?? 9) <= 2, `${p.id} power ${id}`);
    assert.ok(p.villains.length >= 2);
    for (const v of p.villains) {
      assert.equal(v.moves.length, 4, `${v.alias} moveset`);
      assert.ok(getPower(v.powerId) || v.powerId, `${v.alias} power`);
      assert.equal(signatureMoves(v.alias, 3)?.length, 4);
    }
    const villainIds = new Set(p.villains.map((v) => v.id));
    for (const beat of p.beats) {
      assert.ok(beat.choices.length >= 2 && beat.choices.length <= 3, `${beat.id} choices`);
      assert.ok(beat.choices.some((c) => c.path === "canon"), `${beat.id} has a canon road`);
      for (const c of beat.choices) {
        if (c.fight) assert.ok(villainIds.has(c.fight), `${beat.id} fight ${c.fight}`);
        if (c.meet) assert.ok(villainIds.has(c.meet), `${beat.id} meet ${c.meet}`);
        for (const id of c.grant ?? []) assert.ok(getPower(id), `${beat.id} grant ${id}`);
        for (const name of c.loss ?? []) assert.ok(p.family.some((f) => f.name === name), `${beat.id} loss ${name}`);
      }
      assert.ok(presetDecade(p.id, Math.floor(beat.age / 10)));
    }
    assert.equal(p.powers.length ? wakeAge(p.id) != null : wakeAge(p.id) == null, true, `${p.id} wake beat matches powers`);
  }
  const names = PRESETS.map((p) => p.hero).join(" ");
  for (const hero of ["Spider-Man", "Batman", "Iron Man", "Hulk"]) assert.ok(names.includes(hero));
  const tony = PRESETS.find((p) => p.id === "iron-man")!;
  assert.ok(tony.villains.some((v) => v.alias === "Ultron"));
});

test("a legend lives its canon: family, wake beat, villains with signature moves", () => {
  let g = createGame({ ...base, preset: "spider-man", seed: 7 } as never);
  assert.equal(g.preset, "spider-man");
  assert.equal(g.name, "Peter Parker");
  assert.ok(g.relationships.some((r) => r.name === "Ben Parker"));
  assert.ok(g.hiddenGift);
  const seen: string[] = [];
  let duel = false;
  g = live(g, 34, undefined, (x) => {
    if (x.pending?.id.startsWith("canon|")) seen.push(`${x.age}:${x.pending.id}`);
    if (x.minigame?.duel && /Goblin|Octopus|Venom/.test(x.minigame.title)) {
      duel = true;
      assert.equal(x.minigame.duel.foeMoves.length, 4);
    }
  });
  const bite = canonAt("spider-man", wakeAge("spider-man")!);
  assert.ok(seen.some((s) => s.endsWith(`canon|${bite!.id}`)), seen.join(","));
  assert.ok((g.unlockedPowers ?? []).includes("super-senses"));
  assert.ok((g.flags.canon ?? 0) >= 4);
  assert.ok(g.relationships.some((r) => r.role === "villain" && /Goblin/.test(r.note ?? "")));
  assert.ok(duel, "a signature villain duel happened");
  assert.equal(g.relationships.find((r) => r.name === "Ben Parker")?.alive, false, "first choice is canon: Ben dies");
});

test("Batman keeps the human vow", () => {
  let g = createGame({ ...base, preset: "batman", seed: 2 } as never);
  assert.equal(g.powerless, true);
  assert.ok(giftsSealed(g));
  assert.ok(g.traits.includes("martial"));
  g = live(g, 40);
  assert.deepEqual(g.unlockedPowers ?? [], []);
  assert.equal(g.powerId, null);
  assert.ok(g.relationships.some((r) => /Joker/.test(r.note ?? "")));
});

test("legend chapters use the decade titles and never promise powers before the wake", () => {
  let g = createGame({ ...base, preset: "hulk", seed: 3 } as never);
  g = live(g, 29, (x) => x.age >= 21 && x.phase === "live");
  const ch = g.chapters?.[g.chapters.length - 1];
  assert.equal(ch?.title, presetDecade("hulk", 2)!.title);
  assert.ok(!ch!.goals.some((goal) => goal.power), "Hulk wakes at 28: no power goals in his twenties");
});

test("God Mode picks survive a save/load round trip", async () => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  const { saveGame, loadGame } = await import("../save.ts");
  const picks = godPicks(["fire-control", "super-speed", "super-strength"]);
  const g = createGame({ ...base, seed: 5, mode: "god", giftIds: picks, giftId: picks[0] } as never);
  saveGame(g);
  const back = loadGame();
  assert.ok(back);
  for (const id of picks) assert.ok(back.unlockedPowers.includes(id), `${id} kept after load`);
});

test("legend lives only ever meet their own rogues: rivals, visits and arch-enemies", () => {
  for (const preset of PRESETS) {
    const aliases = new Set(preset.villains.map((v) => v.alias));
    for (const seed of [2, 7]) {
      let g = createGame({ ...base, preset: preset.id, seed } as never);
      for (let i = 0; i < 6000 && g.phase !== "dead" && g.age < 80; i++) {
        if (g.phase === "choice" && g.pending) {
          const pick = g.pending.choices.find((c) => c.id === "arch") ?? g.pending.choices[0]!;
          g = choose(g, pick.id);
        } else if (g.phase === "mini") g = resolveMini(g, 0.7);
        else g = ageUp(g);
      }
      const strangers = g.relationships.filter((p) => (p.role === "villain" || p.role === "rival" || p.arch) && !aliases.has(p.note ?? ""));
      assert.deepEqual(strangers.map((p) => `${p.role}:${p.note}`), [], `${preset.id} seed ${seed}`);
      assert.ok(Object.keys(g.flags).some((k) => k.startsWith("ending:")), `${preset.id} seed ${seed} reached a variant ending`);
    }
  }
});

test("every legend has late-life canon: successors, a final showdown, and variant endings", () => {
  for (const preset of PRESETS) {
    const late = preset.beats.filter((beat) => beat.age >= 58);
    assert.ok(late.length >= 4, `${preset.id} has ${late.length} late beats`);
    assert.ok(late.some((beat) => beat.choices.some((c) => c.fight)), `${preset.id} final showdown`);
    const ending = preset.beats.find((beat) => beat.endings);
    assert.ok(ending && ending.age <= 75, `${preset.id} ending beat lands before most lives end`);
    for (const path of ["canon", "bend", "break"] as const) assert.ok(ending!.endings![path].includes(preset.earth), `${preset.id} ${path} ending names its Earth`);
  }
});
