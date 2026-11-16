// Skin tone picks the suit line until the player picks one (2026-11-16 pm). Run: npm run test:game
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, createGame } from "../engine.ts";
import { TONE_PICKS_LINE, toneGap, toneKeys, wornLine, SKIN_TONE } from "../outfit.ts";
import { ART_FAMILIES, mysteryKey, stageKeys } from "../heroArt.ts";
import type { Game } from "../types.ts";

const index = readFileSync(new URL("../../assets/art/index.ts", import.meta.url), "utf8");
const has = (key: string) => index.includes(`"${key}":`);
const skinFor = (tone: string) => SKIN_TONE.indexOf(tone as never);

test("a life that never picked a line wears the one painted closest to its skin tone", () => {
  assert.ok(TONE_PICKS_LINE);
  const dark = { look: { skin: skinFor("dark") } };
  // storm-m: A is painted dark, B light. A dark life rolled B is drawn in A.
  assert.equal(wornLine({ ...dark, suit: "b" }, "mystery-storm-m", has), "a");
  assert.equal(wornLine({ ...dark, suit: "a" }, "mystery-storm-m", has), "a");
  // Ties keep the rolled line: a light ice-f is painted light in both.
  const light = { look: { skin: skinFor("light") } };
  assert.equal(wornLine({ ...light, suit: "b" }, "mystery-ice-f", has), "b");
  assert.equal(wornLine({ ...light, suit: "a" }, "mystery-ice-f", has), "a");
  // A line picked in the Closet always wins, and so does the locked speedster suit.
  assert.equal(wornLine({ ...dark, suit: "b", suitPicked: true }, "mystery-storm-m", has), "b");
  assert.equal(wornLine({ ...dark, suit: "b" }, "mystery-swift-m", has), "b");
  // Teen tone repaints (image list) need no code: the teen lookup asks for them first.
  assert.equal(toneKeys("mystery-ice-f-teen", "dark")[0], "mystery-ice-f-teen-s4");
  // No look (NPC fighters, very old saves): the rolled line.
  assert.equal(wornLine({ suit: "b" }, "mystery-storm-m", has), "b");
});

test("the worn line is never further from your skin tone than the rolled one, for every hero and tone", () => {
  let better = 0;
  for (const family of ART_FAMILIES) {
    for (const sex of ["male", "female"] as const) {
      const grown = mysteryKey(family, sex, 30);
      for (const tone of ["light", "medium", "brown", "dark"] as const) {
        for (const suit of ["a", "b"] as const) {
          const look = { skin: skinFor(tone) };
          const line = wornLine({ suit, look }, grown, has);
          const best = (l: "a" | "b") => stageKeys(family, sex, 30, l).flatMap((k) => toneKeys(k, tone)).find((k) => has(`cut-${k}`)) ?? "";
          const gotGap = toneGap(best(line), tone) ?? 9;
          const rolledGap = toneGap(best(suit), tone) ?? 9;
          assert.ok(gotGap <= rolledGap, `${grown} ${tone} rolled ${suit}`);
          if (gotGap < rolledGap) better += 1;
        }
      }
    }
  }
  assert.ok(better >= 10, `lives drawn closer to their skin tone: ${better}`);
});

test("picking a line in the Closet keeps it, even the one already rolled; old saves load unpicked", () => {
  const g0 = createGame({ name: "Ava Reyes", cityId: "metro", upbringing: "normal", portrait: 11, sex: "female", face: "loud", drive: "protector", giftId: "fire-control", seed: 7 } as never) as Game;
  g0.age = 27;
  g0.phase = "live";
  g0.pending = null;
  assert.equal(g0.suitPicked, undefined, "new lives start unpicked");
  const same = act(g0, `suit-line|${g0.suit}`);
  assert.equal(same.suit, g0.suit);
  assert.equal(same.suitPicked, true, "picking the rolled line still counts");
  assert.equal(act(same, `suit-line|${g0.suit}`), same, "already picked and on");
  const other = g0.suit === "a" ? "b" : "a";
  const g2 = act(same, `suit-line|${other}`);
  assert.equal(g2.suit, other);
  assert.equal(g2.suitPicked, true);
  assert.equal(g2.majorsLeft, g0.majorsLeft, "costs no time");
});
