// The painted hero wears the Closet (2026-11-16 suits pass). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, createGame } from "../engine.ts";
import { anchorOf, nativeTone, OUTFIT_ON, outfitOf, PAINTED_SUIT, partKey, toneKeys, toneOf } from "../outfit.ts";
import { HERO_ANCHORS } from "../heroAnchors.ts";
import { ART_FAMILIES } from "../heroArt.ts";
import type { Game } from "../types.ts";

const BASE = { name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as const;

function adult(): Game {
  const g = createGame({ ...BASE } as never);
  g.age = 27;
  g.phase = "live";
  g.pending = null;
  g.stats.money = 50_000;
  g.stats.fame = 60;
  g.stats.karma = 0;
  return g;
}

test("the root cause: wearing a suit piece now changes what the painting shows", () => {
  assert.ok(OUTFIT_ON);
  let g = adult();
  assert.equal(outfitOf(g).tint, null, "a new life wears its suit as painted");
  g = act(g, "buy-fit|training-suit");
  assert.equal(g.wardrobe.worn.chest, "training-suit");
  const o = outfitOf(g);
  assert.equal(o.tint, "#1f3a4a", "the Training suit recolours the painted suit");
  assert.equal(o.rim, "#3cb8b0", "its trim is the rim light");
  assert.ok(o.strength > 0.5 && o.strength <= 1);
  assert.deepEqual(o.worn.map((w) => w.name), ["Training suit"]);
  g = act(g, `wear-fit|${PAINTED_SUIT}`);
  assert.equal(outfitOf(g).tint, null, "back to the painted colours");
});

test("light colourways are laid on more gently than dark ones", () => {
  const ivory = outfitOf({ wardrobe: { owned: [], worn: { chest: "ceremonial-plate" } } });
  const navy = outfitOf({ wardrobe: { owned: [], worn: { chest: "patrol-mesh" } } });
  assert.ok(ivory.strength < navy.strength);
});

test("every other slot maps to a painted part layer, named on the mirror; bare pieces add nothing", () => {
  const o = outfitOf({ wardrobe: { owned: [], worn: { cape: "long-cape", cowl: "full-cowl", gloves: "gauntlets", boots: "rocket-boots", emblem: "utility-belt" } } });
  assert.deepEqual(o.layers.map((l) => l.key).sort(), ["part-boots-rocket", "part-cape-long", "part-cowl-cowl", "part-emblem-belt", "part-gloves-gauntlet"]);
  assert.equal(o.layers.find((l) => l.slot === "cape")?.behind, true, "a cape hangs behind the figure");
  assert.equal(o.layers.find((l) => l.slot === "emblem")?.anchor, "waist", "a belt sits at the waist");
  assert.equal(outfitOf({ wardrobe: { owned: [], worn: { emblem: "cloth-badge" } } }).layers[0]?.anchor, "chest");
  assert.equal(o.worn.length, 5);
  const bare = outfitOf({ wardrobe: { owned: [], worn: { cape: "no-cape", cowl: "bare-head", gloves: "bare-hands", boots: "sneakers", emblem: "no-mark", chest: PAINTED_SUIT } } });
  assert.equal(bare.layers.length, 0);
  assert.equal(bare.worn.length, 0);
  assert.equal(partKey("cape", "no-cape"), "");
});

test("the suit line picker switches the painting (A and B), free, and the suit stays chosen", () => {
  let g = adult();
  const start = g.suit;
  const other = start === "a" ? "b" : "a";
  g = act(g, `suit-line|${other}`);
  assert.equal(g.suit, other);
  assert.equal(outfitOf(g).line, other);
  assert.match(g.card.banner?.[0] ?? "", new RegExp(`Suit line ${other.toUpperCase()} is on`));
  assert.equal(g.majorsLeft, adult().majorsLeft, "costs no time");
  assert.equal(act(g, `suit-line|${other}`), g, "already on");
  assert.equal(act(g, "suit-line|z"), g, "nonsense is ignored");
});

test("every painted hero cutout has anchors, with the neck under the head and the shoulders under the neck", () => {
  for (const fam of ART_FAMILIES) {
    for (const sex of ["f", "m"]) {
      for (const suffix of ["", "-teen"]) {
        const a = anchorOf(`cut-mystery-${fam}-${sex}${suffix}`);
        assert.ok(a, `${fam}-${sex}${suffix}`);
        assert.ok(a!.top < a!.neck && a!.neck < a!.shoulder && a!.shoulder < 0.4 && a!.sl < a!.sr);
      }
    }
  }
  // 70 original paintings plus their skin-tone repaints (`-s1..4`).
  assert.equal(Object.keys(HERO_ANCHORS).filter((k) => !/-s[1-4]$/.test(k)).length, 70);
});

test("skin tone: variants are tried closest first, and the base painting counts at the tone it was painted in", () => {
  assert.equal(toneOf({ skin: 4 }), "dark");
  assert.equal(toneOf({ skin: 0 }), "light");
  assert.equal(nativeTone("mystery-storm-m"), "dark");
  assert.equal(nativeTone("mystery-ice-f-s3"), "brown");
  const keys = toneKeys("mystery-ice-f", "dark");
  assert.equal(keys[0], "mystery-ice-f-s4", "the dark variant first");
  assert.equal(keys[1], "mystery-ice-f-s3");
  assert.ok(keys.indexOf("mystery-ice-f") > keys.indexOf("mystery-ice-f-s2") - 1, "the light base painting is a far fallback");
  assert.deepEqual(toneKeys("mystery-ice-f", "light").slice(0, 2), ["mystery-ice-f", "mystery-ice-f-s1"], "a light life keeps the painting it has");
  assert.deepEqual(toneKeys("mystery-ice-f", null), ["mystery-ice-f"]);
});

test("skin-tone variants keep their suit line, and the portrait picker honours a life's own face feature", async () => {
  const { suitOfKey } = await import("../heroArt.ts");
  assert.equal(suitOfKey("mystery-fire-m-b-s4"), "b");
  assert.equal(suitOfKey("mystery-fire-m-b-teen-s2"), "b");
  assert.equal(suitOfKey("mystery-fire-m-s3"), "a");
  const { pickPortrait, PORTRAITS, FEATURE } = await import("../portraits.ts");
  // Random NPC rolls (no feature) pick exactly as before.
  for (let seed = 1; seed < 400; seed += 7) {
    const look = { skin: seed % 12, hair: seed % 14 };
    assert.equal(pickPortrait(seed, 30, "female", look).id, pickPortrait(seed, 30, "female", look, false, undefined).id);
  }
  // A fair red-haired woman who picked freckles gets the freckled painting.
  assert.equal(pickPortrait(5, 30, "female", { skin: 0, hair: 2 }, false, FEATURE.freckles).id, "adult-6");
  // Painted glasses count against a life that didn't pick them (skin tone still matters more), and for one that did.
  const glasses = PORTRAITS.filter((p) => p.marks?.includes(FEATURE.glasses)).map((p) => p.id);
  assert.ok(glasses.includes("older-8"));
  const boy = { skin: 0, hair: 1 }; // fair, brown hair: child-7 (painted glasses) is the closest match
  const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
  const withGlasses = (feature: number | undefined) => seeds.filter((seed) => pickPortrait(seed, 9, "male", boy, false, feature).id === "child-7").length;
  assert.equal(withGlasses(undefined), 60);
  assert.equal(withGlasses(FEATURE.glasses), 60);
  assert.ok(withGlasses(FEATURE.clear) < 45);
});

test("painted skin-tone variants and parts are registered, anchored and picked by the tone lookup", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const index = readFileSync(new URL("../../assets/art/index.ts", import.meta.url), "utf8");
  const has = (key: string) => index.includes(`"${key}":`);
  const { PART_FRAMES } = await import("../partFrames.ts");
  // Every tone variant on disk has its own anchor row with its tone in the name.
  const variants = Object.keys(HERO_ANCHORS).filter((k) => /-s[1-4]$/.test(k));
  assert.ok(variants.length >= 52, `tone rows: ${variants.length}`);
  for (const k of variants) {
    assert.ok(has(`cut-${k}`), `art for ${k}`);
    assert.ok(existsSync(new URL(`../../assets/art/cut-${k}.ts`, import.meta.url)));
    assert.equal(nativeTone(k), ["light", "medium", "brown", "dark"][Number(k.slice(-1)) - 1]);
    assert.equal(anchorOf(`cut-${k}`), HERO_ANCHORS[k]);
  }
  // Fit fields are sane everywhere (fractions of the cutout box).
  for (const [k, a] of Object.entries(HERO_ANCHORS)) {
    assert.ok(a.cx > 0.15 && a.cx < 0.85 && a.sw > 0.2 && a.sw < 1 && a.sy < a.cy && a.cy < a.wy && a.wy < a.bottom && a.ar > 0.2 && a.ar < 1, k);
  }
  // The lookup takes a painted variant first, and the original painting stands for its own tone.
  const pick = (key: string, tone: Parameters<typeof toneKeys>[1]) => toneKeys(key, tone).find((k) => has(`cut-${k}`));
  assert.equal(pick("mystery-fire-m", "dark"), "mystery-fire-m-s4");
  assert.equal(pick("mystery-fire-m", "medium"), "mystery-fire-m");
  assert.equal(pick("mystery-ice-f", "light"), "mystery-ice-f");
  assert.equal(pick("mystery-arcane-f", "brown"), "mystery-arcane-f-s2"); // no s3 painted: nearest tone, lighter first
  assert.equal(pick("mystery-storm-m", "light"), "mystery-storm-m-s2"); // s1 held back (chalk-white repaint)
  // Every cape and mark in the shop has a painted, measured part.
  for (const kind of ["short", "long", "coat", "banner", "tatter"]) {
    const f = PART_FRAMES[`part-cape-${kind}`];
    assert.ok(f && has(`part-cape-${kind}`) && f.sl! < f.sr! && f.band! > f.collar!, kind);
  }
  for (const kind of ["badge", "belt", "buckle", "brand", "sash"]) assert.ok(PART_FRAMES[`part-emblem-${kind}`] && has(`part-emblem-${kind}`), kind);
  const g = adult();
  g.wardrobe = { owned: ["long-cape", "utility-belt"], worn: { cape: "long-cape", emblem: "utility-belt" } } as Game["wardrobe"];
  assert.deepEqual(outfitOf(g).layers.map((l) => [l.key, l.behind]), [["part-cape-long", true], ["part-emblem-belt", false]]);
});
