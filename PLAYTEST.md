# SuperLife — Playtest (2026-10-31)

## Morning pass (2026-11-08 am): battle Stage 4 — playtest first

**Builds (new this pass):** NYC / foster-care mystery (Jo Reyes; wakes at 15), Stacks / lab-program God Mode **elasticity + super strength** (Theo Kade), and **Captain America**. Aged to 45, seed 1, all four difficulties; 178 villain boards per difficulty (only 2 were case bosses: Slipstream for Stacks, Red Skull for Cap). Replayed with the same tell-reading policy as the night pass (`/workspace/playtest/am1108/`).

**Baseline (before this pass), street / boss:**

| Difficulty | Perfect | 60% play | 30% play | Random |
|---|---|---|---|---|
| Story | 1.00 / 1.00 | 0.98 / 1.00 | 0.93 / 0.88 | 0.79 / 0.67 |
| Normal | 0.99 / 0.96 | 0.84 / 0.75 | 0.62 / 0.33 | 0.36 / 0.00 |
| Hard | 0.98 / 1.00 | 0.74 / 0.50 | 0.46 / 0.04 | 0.23 / 0.00 |
| Legendary | 0.95 / 0.71 | 0.57 / 0.25 | 0.30 / 0.00 | 0.13 / 0.00 |

(Boss column is n=2 here, so it is noise. Night's 717-board pool stays the reference for bosses.) Normal 60% street by build: Cap 0.88, Stacks 0.86, NYC foster 0.79. Cap's fights are short (4.7 turns): his six at 34–35 is four guards, one strike, one trick, and Holy Hull hits for 19.

**Findings:**
- **Bug: a Charge boss charged every turn once it started.** After the first charged hit the countdown sat at 0, so Crossbones / Bane / Zod / Kraven / Whiplash / Ares / Surtur / Klaw (and strength, blast and lightning bosses) threw the charged hit every turn for the rest of the fight, while the hint said "every third turn". Seen on the phone: Crossbones at 34 showed "Charging!" with all three pips lit four turns running. A tell-reader just guarded every turn, so it made the fight easier, not harder (lab: Bane gimmick on 717 real Normal boards, perfect play 0.99, 60% play 0.64). **Fixed in increment 1:** charge comes on turn 2 after phase 2 starts, then every third turn (perfect 0.95, 60% 0.61, 30% 0.37; 1.0 charged hit a fight instead of 2.0).
- **Move-select still works** on the NYC, Stacks and Cap saves: cards tap, ANSWER / status / ULT tags show, no console errors, no horizontal overflow at 390×844.
- **UI nit:** on a 3-energy, cooldown-1 guard card (Holy Hull) the ANSWER tag is clipped at the right edge. Cosmetic; left for a later pass.
- **Arena (night rules):** roster spread 13.1 pts. Bottom three: Abomination 0.45, Cheetah 0.45, **Flash 0.44**. Pro AI vs the ladder stand-in 0.43 / 0.32 at perfect / 60%.
- Screens before: `/workspace/superlife-screens/1108am/before/` (NYC 24 vs The Auditor, Stacks 28, Cap 35 vs Winter Soldier, Cap 34 vs Crossbones mid-charge).

**After increments 1–4:**
- **Charge (inc 1–2):** Bane's gimmick on 717 real Normal boards: perfect 0.95, 60% 0.63, 30% 0.39 (Hard 0.97 / 0.55 / 0.25). With the interrupt taken whenever offered, a perfect player gets one in 11% of charge fights (Hard 14%); win rates don't move. Phone: Crossbones with Momentum 4/5 shows INTERRUPT READY, "Guard to brace, or Strike to interrupt (−1 momentum)", an Interrupt tag on Heavy Hands, and the INTERRUPT beat (`1108am/inc2/`).
- **Phase 3 (inc 3):** real lives hit it where they should: Iron Man's Ultron at 42 has none, at 63 has Learning Algorithm; Cap's Red Skull at 23 has none, at 63 and 71 has Cosmic Cube; Thor's Loki at 67 has Jotun Ice. Lab at Normal 60% (before → after): Goblin 0.62 → 0.58, Joker 0.48 → 0.51, Ultron 0.33 → 0.32, Maestro 0.61 → 0.61, Zod 0.63 → 0.56, Ares 0.63 → 0.59, Red Skull 0.62 → 0.59, Loki 0.48 → 0.40, Klaw 0.63 → 0.51, Deathstrike 0.11 → 0.13, Reverse-Flash 0.62 → 0.63.
- **Regen hint trap (found in that lab):** obeying "a trick move stalls it" every turn drops regen bosses (Deathstrike, Sabretooth, Vulture) to 0.15 at perfect play against 0.90 if you just answer tells. Logged in BACKLOG for the owner.
- **Regroup (inc 3):** after a boss loss the case file shows "Regrouping after the loss. Cinder Mallory again next month." and the step is locked; next month it opens (`1108am/inc3/nyc-regroup-cases.png`).
- **Arena (inc 4):** Flash 0.438 → 0.488; spread 11.9.

## Night pass (2026-11-07 night): battle Stage 3 — playtest first

**Builds (different from am/pm):** Harbor Bay / military mystery (Mara Quinn), Dustreach / celebrity mystery (Rex Vale), Neon Spire God Mode fire-control + super-speed (Sable Ortiz), Black Panther, Wonder Woman, Hulk, Flash. (Superman added to the after-boards for the coverage check.) Aged to 55, seed 1, all four difficulties. Harness: `/workspace/playtest/night1107/`.

**Baseline (before night changes), street / boss at each skill:**

| Difficulty | Perfect | 60% play | 30% play | Random |
|---|---|---|---|---|
| Story | 1.00 / 0.99 | 0.97 / 0.90 | 0.87 / 0.76 | 0.69 / 0.44 |
| Normal | 0.87 / 0.81 | 0.61 / 0.46 | 0.35 / 0.19 | 0.15 / 0.03 |
| Hard | 0.84 / 0.72 | 0.50 / 0.35 | 0.27 / 0.15 | 0.10 / 0.00 |
| Legendary | 0.71 / 0.45 | 0.34 / 0.16 | 0.16 / 0.02 | 0.02 / 0.00 |

**Findings before Increment 1:**
- Superman @19 known styles strike 3 / guard 0 / trick 2; @31 still no guard unlocked in the early kit (Stand Firm sat at mastery 3). Dustreach celebrity six was five strikes + one trick. Harbor military mystery likewise had no guard in the six.
- fillLoadout already preferred missing styles on *empty* slots, but a full six of strikes never got a street guard, and late-unlocked guards stayed on the bench.
- Phone before shots: `/workspace/superlife-screens/1107night-before/` (Harbor/Neon/BP/WW/Hulk/Flash duels + title/create). Energy still sits at 10/10 on openers — Stage 3 Ultimates still needed.

**After Increment 1 (coverage), same policy, boards now include Superman:**

| Difficulty | Perfect | 60% play | 30% play | Random | Avg turns (60%) |
|---|---|---|---|---|---|
| Story | 1.00 / 1.00 | 0.97 / 0.97 | 0.87 / 0.81 | 0.73 / 0.55 | ~4.9 |
| Normal | 0.96 / 0.88 | 0.74 / 0.54 | 0.47 / 0.31 | 0.20 / 0.10 | ~5.7 |
| Hard | 0.96 / 0.86 | 0.68 / 0.50 | 0.37 / 0.22 | 0.12 / 0.03 | ~5.8 |
| Legendary | 0.92 / 0.74 | 0.53 / 0.31 | 0.24 / 0.11 | 0.05 / 0.01 | ~5.8 |

- Per-build Normal 60%: Wonder Woman 0.93, Black Panther 0.87, Hulk 0.87, Neon fire+speed 0.87, Harbor 0.79, Superman 0.63, Flash 0.56, Dustreach 0.54. Superman is no longer the floor.
- Probe: Superman @19 loadout now includes Stand Firm (guard); Harbor/Dustreach auto-fill starts with Dome (guard).
- Screenshots after: `/workspace/superlife-screens/1107night-inc1/`.

**After Increment 2 (Ultimates + Cheetah + stage chips):**
- Normal 60%: street 0.74 / boss 0.55. Arena roster spread 13.1 pts; Cheetah 0.45 (was 0.41); Flash 0.44 is the new floor.
- Harbor Bay duel shows `pier · ice +10%` under the foe name. Wonder Woman vs Cheetah still plays clean with Aegis + Expose tags.
- Screenshots: `/workspace/superlife-screens/1107night-inc2/`.



## Afternoon pass (2026-11-07 pm): battle Stage 2 — playtest first

**Life sims (builds not used in recent passes), aged to 60, seed 1, every difficulty:**
- **Crownbridge / wealthy** mystery (reluctant + pragmatic): wakes at 8, 18 powers by 60, mentor Kessler.
- **Metro City / supportive** God Mode **lightning control + force field** (loud + team): 18 powers, mentor Skyline.
- **Spider-Man**, **Batman** (no powers, by vow) and **Superman** legends: canon wakes 15 / — / 13, mentors Ben Parker / Alfred / Jonathan Kent.
- 450 villain duel boards per difficulty were dumped from those lives and replayed with the tell-reading policy (`/workspace/playtest/pm1107/`).

**Baseline (before this pass), win rate vs street foes / case bosses:**

| Difficulty | Perfect | 60% play | 30% play | Random |
|---|---|---|---|---|
| Story | 1.00 / 0.97 | 0.94 / 0.93 | 0.86 / 0.82 | 0.71 / 0.74 |
| Normal | 0.94 / 0.89 | 0.66 / 0.64 | 0.50 / 0.49 | 0.27 / 0.25 |
| Hard | 0.81 / 0.71 | 0.49 / 0.50 | 0.35 / 0.31 | 0.16 / 0.13 |
| Legendary | 0.54 / 0.55 | 0.30 / 0.36 | 0.18 / 0.19 | 0.06 / 0.06 |

**Findings:**
- **Fights are over in 4–5 turns** (average 4.4–5.1). Momentum needs 3 edge wins to Burst, so most fights end before a Burst can happen, and there is no room for statuses or combos to matter. Stage 2 needs a little more runway (target 6–8 turns, still under a minute).
- **Bosses are no harder than street foes** (Normal 60%: 0.66 street vs 0.64 boss). DESIGN §17 wants bosses a clear step up.
- **Build spread is wider than the difficulty spread.** At Normal / 60%: Batman 0.92, Spider-Man 0.88, Metro God Mode 0.68, Crownbridge mystery 0.54 (bosses 0.29), Superman 0.39. The weak lives have lopsided sixes: Superman's default six is five strikes and one guard; the Crownbridge hero at 22 has no guard move at all, so a strike tell has no answer but a breath.
- **Phone (390×844):** on a gimmick fight the move grid squeezed its rows to fit, so the bottom line of each move card was cut off (overflow-hidden cards in a fixed-height grid shrink to 0 min-height). Fixed in increment 1.
- Duel at Legendary vs The Auditor (Crownbridge, 22) and Superman vs Lex Luthor (Warsuit armor phase) both played clean, 0 console errors.

**Screenshots (before):** `/workspace/superlife-screens/1107pm-before/` (`crown-leg-b.png`, `superman.png`).

**After increment 2 (statuses, combos, habit reading, HP runway, retune), same 450 boards per difficulty, street / boss:**

| Difficulty | Perfect | 60% play | 30% play | Random | Avg turns (60%) |
|---|---|---|---|---|---|
| Story | 1.00 / 0.98 | 0.96 / 0.88 | 0.85 / 0.79 | 0.65 / 0.51 | 5.5 |
| Normal | 0.88 / 0.70 | 0.61 / 0.53 | 0.42 / 0.33 | 0.20 / 0.15 | 6.0 |
| Hard | 0.80 / 0.61 | 0.49 / 0.39 | 0.30 / 0.22 | 0.13 / 0.06 | 6.1 |
| Legendary | 0.54 / 0.50 | 0.29 / 0.20 | 0.15 / 0.12 | 0.05 / 0.00 | 5.9 |

- "Perfect" answers every tell and, on Hard and up, breaks a habit when the bait warning shows. Boss rows are 18 bosses × 12 seeds each, so ±0.08.
- Per fight at Normal / 60%: 0.74 Bursts, 0.27 Finishers (0.42 for perfect play), 0.19 habit baits, ~1.5 statuses landed (Expose, Ward, Burn and Shock most common).
- Bosses are now a clear step above street foes (Normal 60%: 0.61 street vs 0.53 boss; it was 0.66 vs 0.64).
- Build spread is still wide (Spider-Man 0.95, Superman 0.44 at Normal / 60%) because of lopsided default sixes; see BACKLOG.
- Phone: Metro God Mode vs Glassjaw (Hard) and Crownbridge vs The Auditor (Legendary) played through the Answer hints at 390×844. Expose/Ward pills, the combo pips, the habit warning and the BURST beat all read cleanly; 0 console errors. Screenshots: `/workspace/superlife-screens/1107pm-inc2/` (`crown-t6.png` BURST, `metro-5.png` habit warning).

### Arena after increment 3 (shared rules)

Pro AI vs the ladder stand-in, all bouts, 29 fighters (`/workspace/playtest/pm1107/ladder.ts`):

| | Rookie | Pro | Legend |
|---|---|---|---|
| Perfect play, before → after | 0.81 → 0.77 | 0.46 → 0.44 | 0.03 → 0.01 |
| 60% play, before → after | 0.63 → 0.63 | 0.35 → 0.33 | 0.03 → 0.02 |

- Turns per bout 8.1 → 7.3. Per bout: ~1 Burst, ~0.4 Finishers, ~3.4 statuses.
- Roster spread 9.5 → 16.1 points (limit 22). Top Thor 0.57, Loki/Ultron 0.55; bottom Cheetah 0.41, Venom 0.45.
- Browser at 390×844 (Superman / Hulk / Thor / Wonder Woman vs Pro AI, all 3 rounds): Shock, Expose and Ward pills showed on the cards, "Shocked · no fakes" replaced the tell picker, combo pips filled, and the purse paid out at the end. No console errors. The first pass had the tell picker overflowing beside the new Momentum pips and the combo pips covering fighter names; both were fixed before the push.

## Morning pass (2026-11-07 am): battle Stage 1 — difficulty + Momentum

**Life sims (new combos, not used in recent passes):**
- Builds: **Neon Spire / alien** mystery (secret + idealistic), **Hood / tragic** God Mode ice+telepathy (loud + vengeful), plus **Iron Man**, **Wolverine** and **Thor** legends.
- Seeds 11/22/33 for the two custom builds; seed 44 for legends. Aged to 35–40.
- Mystery wakes at **8–10** (energy-projection, super-strength, flight). Mentors: Vael (alien/Neon), Nora Vance (tragic/Hood), Yinsen / Ogun / Odin for legends.
- Power counts at 35–40: Neon mystery 10–12, Hood own 10–11, Iron Man 5 (book-capped), Wolverine 9, Thor 8.
- Chapter goals mid-life still soft on mood/mastery/fame — unchanged finding, not this pass's focus.

**Battle Stage 1 balance (engine, case-boss board, 60% play, N=48):**
| Difficulty | Win rate | Smart@Normal |
|---|---|---|
| Story | 0.94 | — |
| Normal | 0.67 | 1.00 |
| Hard | 0.29 | — |
| Legendary | 0.10 | — |

Normal is now clearly harder than the old baseline. Legendary is a wall for messy play, which matches the design target band. Tune lives in `src/game/difficulty.ts`.

**UI (390×844):** difficulty picker on mystery/God create footer and legend Begin; duel shows Momentum diamonds + Burst-ready chip; HP bars use a delayed ghost trail. **0 console errors.**

**Screenshots:** `/workspace/superlife-screens/1107am-01-title.png` … `1107am-10-legend-difficulty.png` (create Hard pick, first month, duel Momentum HUD, legend picker).


## Morning pass (2026-11-03 am): moves re-check, Arena vs Pro with a saved life, villain art

**Life sims (3 seeds each, new combos):**
- Builds: a **Dust Flats / celebrity-family** loud glory-hound mystery hero, a **Harbor Bay / military** Build-your-own **fire control + super speed** hero, plus **Black Panther** and **Superman** legends.
- Lives ended at **70–86**. Mystery powers woke at **8, 10 and 13**; Superman wakes at 13 and Black Panther at 18 (canon ages).
- Power counts: Dust Flats mystery 21–25, Harbor Build-your-own 23–24, Black Panther 12 (with his canon mixes), Superman in the expected band.
- Goals nearly all complete. Low: *family@4* 2/4. Also below 100%: *holdfame* 7/8, *standing* 7/8, *quietfame* 3/4, *family* 5/9.
- **Light Speed check (from the night backlog), resolved:** the night harness passed bad gift ids (`fire`, `speed`), so its "fire + speed" Build-your-own lives actually rolled random powers. With the right ids (`fire-control`, `super-speed`), mixing them into **Light Speed** works whenever the life is live and the power room is free, as early as **age 12**. The sim policy just never chooses to mix. Mixing has no mastery gate (`library(d).block` only).

**Moves (P0), touch taps at 390×844:** mystery life before the reveal and just after it (age 9–10, one move), a celebrity-raised hero at 30, Black Panther at 25 (5 of 6 slots, with the street "Haymaker" in the auto slot as designed), Superman at 40, Build-your-own at 16. **0 fails, 0 console errors.**

**Arena vs Pro:** a saved life (Lio Marsh, 30) + Spider-Man + Wonder Woman vs Sabretooth / Green Goblin / Cheetah. Lost the match in 27 turns. A mid-battle reload resumed. 0 errors.
- **Main finding:** the villains were drawn as paper-doll figures (Goblin read as a green blob), which looked unfinished next to the painted heroes on the draft grid, sheet, reveal and duel cards. This pass fixes that.
- After the fix, two villain drafts vs Rookie (Venom / Doc Ock / Loki and Hela / Goblin / Red Skull) also had 0 console errors.

**Life-sim boss check:** Spider-Man at 23 vs Green Goblin, Iron Man at 25 vs Iron Monger (boss), Batman at 30 vs The Joker. The new boss card reveal shows, then hands off to the fight. 0 errors.
- **Still rough:** inside the life-sim fight the rogue is still a generic figure (Goblin is a blue helmet figure). The header avatar now shows the real villain.

## Night pass (2026-11-02 night): moves re-check, Arena online + vs-AI end to end, new builds

**Life sims (3 seeds each, new combos):**
- Builds: a **Stacks / scientific-family** mystery hero, a **Crown / street** mystery hero, a **Build-your-own Metro / rural fire + speed** hero, plus **Captain America** and **The Flash** legends.
- Lives ended at **70–91**. Mystery powers woke at **8–13**; Cap wakes at 21, Flash at 25 (canon ages).
- Goals mostly complete. Low: *friend@7* 1/2 and *standing@7* 2/5.
- The fire + speed Build-your-own never combined into **Light Speed** in 3 lives. The combo likely needs mastery the sim policy doesn't reach; worth a check.
- Cap and Flash picked up off-kin powers (fire control, invisibility) at the expected ~15% rate.

**Moves (P0), touch taps at 390×844:** mystery life before the reveal (age 7), just after the reveal (9, one move), a street-raised hero at 30 (full swaps), Captain America at 22 (5 moves), Flash at 40, Build-your-own at 17. Arm-slot→move, arm-move→slot, swaps both ways, a second tap disarms, a street slot with nothing to place stays put, a new power fills the 6th slot and survives reload. **0 fails.** One rough edge found and fixed: the armed slot bobbed under the finger.

**Arena vs-AI:** Rookie with a saved 30-year-old life won 2–0 in 19 turns; Pro lost 1–2; Legend (Flash at 40) lost; Rookie with a villain draft won. Mid-battle reload resumed every time. 0 console errors.

**Arena online (two phones):** create room → join by link → draft → secret orders → reveal → battle. The guest reloaded mid-battle and resumed; the guest idled 33s and got an auto breath with a timeout pip; round-over ready sync worked; results showed VICTORY / DEFEAT on opposite phones; rematch went back to the draft; host leaving showed a forfeit on the guest. 0 console errors.

**Findings:** the paper-doll battle stage looked unfinished next to the painted draft cards (replaced with duel cards). Villains still have no painted art. A saved life's move can show a different style in Arena than in the life sim (Arena re-prices kits to cover all three styles).

## Arena pass (2026-11-02 am, arena): versus mode, moves check, a new build

**Life sims (3 seeds each, new combos):**
- Policies:
  - a **Harbor Bay foster** mystery hero;
  - a **Wonder Woman** legend run with heavy drilling;
  - a **Build-your-own** life.
- Lives ended at **70–82**.
- Mystery powers manifested at **8 and 11**.
- Power counts:
  - Harbor mystery lives reached 22–23 powers.
  - Build-your-own reached 21–23.
  - Wonder Woman reached her **12-power canon cap**.
- Goals that rarely complete: *standing* 0/4, *dark karma* 1/4, *quiet fame* 0/2 and *infamy* 0/1. These are candidates for clearer hints or easier routes.
- The WW save at 30 had 10 HP because the policy drilled non-stop. That is policy, not a bug.

**Moves (P0), touch taps at 390×844:**
- Saves tested:
  - a mystery life before the reveal (shows the "hasn't woken yet" state);
  - just after the reveal (1 move, with street moves filling the rest);
  - a mystery life at 28;
  - Wonder Woman at 30;
  - Build-your-own at 15.
- Checks:
  - arm slot → pick move;
  - arm move → pick slot;
  - reorder;
  - 12 rapid swaps;
  - double-tap;
  - locked-move tap (explains the unlock rank);
  - no jump under the finger after scrolling;
  - reload persistence.
- **0 failures.** The only glitch seen was visual: slot outlines peeking above the armed sticky dock. Fixed.

**Arena: 4 full vs-AI matches through the UI with Playwright, plus engine sims:**
- My first pro match was lost **0–2** with Wren (my own life) and Spider-Man.
- Ladder sims then showed a **hint-following player won only 3% of bouts against Rookie**. The AI read my true tells and bluffed constantly. That was far too hard.
- Fixed with per-level personas: Rookie rarely bluffs and barely reads tells, Pro bluffs and reads a little, Legend feints and reads.
- After the fix, three Rookie matches gave **2–1, 2–0 and 2–1 wins**. The scripted ladder is now Rookie 74% / Pro 46% / Legend 13%.
- Reloading mid-battle resumes the exact turn. No console errors.
- **Fun:** the lead/tell/fake loop gives every turn a real decision. In one run a faked strike tell drew Hulk into a guard and a trick landed on it, which is exactly the read-and-bluff moment the mode is for. Spider-Man reading through a Legend's feints is a nice "counter-pick" moment.
- **Rough edges:**
  - Villains are Figure busts, not painted art.
  - The battle stage figures are the life-sim's paper-doll style.

## Night pass (2026-11-01 night): the fight numbers, and bosses that were just bigger bars

**What I played:**
- Engine sims, 3 seeds each:
  - a **NYC skeptical / loud / idealistic** mystery hero;
  - a **Metro legacy / secret / thrill** mystery hero;
  - Batman, Iron Man, Hulk, Spider-Man, Flash and Thor.
- Every duel board was dumped and replayed with a smart, tell-reading policy (`/workspace/playtest/duelsim.ts`) at perfect, 60% and random play.
- At 390×844: boss duels against Iron Monger (25), Two-Face (30), Bane (38), Doc Ock (28), Venom (33), Ultron (51) and Abomination (33).

**Findings (before):**
- **Combat did not scale.** Player moves sat at 4–6 power from 11 to 70, while foes reached 10–17. Perfect-play win rates: mystery hero 21%, Iron Man 40%, bosses 34%. Unpowered Batman won 100%, because his legacy kit used foe-scale numbers.
- **Missing styles.** Mastery-1 moves are mostly strike (59 strike, 45 trick, 22 guard). Thor's and Iron Man's six had **no guard**, so a strike tell had no answer.
- **Generic case bosses in legend lives:** Iron Man vs "Cinder Mallory", "Static Bishop", "Second Skin".
- **Bosses had no identity.** A boss was the same rock-paper-scissors loop with a bigger health bar.
- **Female rogues drawn as men.** Hela, Cheetah and Lady Deathstrike defaulted to male figures.
- **Boss retries repeat.** One case boss came up 4–5 times at the same age when the player keeps losing. Not changed; see BACKLOG.

**After:**
- **Win rates** (perfect / 60% / random): regular fights 0.96 / ~0.8 / ~0.4; bosses 0.82 / 0.63 / 0.29. Per gimmick at perfect play: 0.89 (feint) to 1.00.
- **Outliers:** Thor's late bosses (Hela, Surtur at level 9–10) are still the hardest. Spider-Man, Hulk and Batman sit around 0.95 at 60% play.
- **At 390×844:**
  - the Phase 2 card reads cleanly over a blurred arena;
  - the gimmick strip fits between the bars and the arena (the arena is 24px shorter on boss fights, so all 6 cards stay visible);
  - Bane's charge turn glows red with "Charging!", and Iron Monger's plates show as pips by his figure.
- Screenshots: `superlife-shots/2026-11-01-night/before/` and `.../after/`.

## Afternoon pass (2026-11-01 pm): grown-up mystery lives and legends in their 30s

**What I played:**
- Engine sims, 3 seeds each, with a goal-aware policy:
  - an isolated Dustreach mystery kid;
  - a vengeful Stacks mystery kid;
  - Hulk, Thor and Captain America;
  - all 10 powered legends, run for a kin census.
- At 390×844:
  - the Dustreach life at 9, 34 and 46 (Life tab, chapter card, a duel);
  - Thor at 31;
  - the Stacks kid at 14 in the gym;
  - the God Mode picker.

**Findings (before):**
- **Family goal:** "Keep family close" read as met for the whole decade, then the partner broke up at closeness 15. The goal counted heads, not closeness (8/11).
- **Fame goal:** a famous hero at Fame 85 got "Raise Fame by 3" and lost it to the yearly fade above 75.
- **Reputation goal:** a hero with dark karma but positive Reputation was told to keep Reputation *low*.
- **Off-kin powers:** legends picked up powers that broke canon (about 171 of 239), for example Thor with Gravity and Flash with Telepathy.
- **Gym:** Lift and Run were dead taps with flat rewards. Only the bout had a mini.
- **God Mode picker:** 12 dots, no faces, no way to see the roster at a glance.

**After:**
- Family 14/16, fame hold 8/8. The holdrep failures were all legends with negative Reputation, who no longer get it.
- Off-kin powers are down to about 60. Wolverine and Hulk now grow toward durability and strength.
- **Chase:** reads well at 390×844. Lanes are wide, the buttons are thumb-sized, the gold sparks stand out from the hazard stripes, and the result stamp lands. Screenshots are in `superlife-shots/2026-11-01-pm/after/`.
- **God Mode:** the "All 11" grid shows every painted portrait, and tapping one lands on its card with the roster face lit.

## Morning pass (2026-11-01 am): mystery childhood and the three new legends

**What I played:**
- Engine sims, 3 seeds each: an alien-upbringing mystery kid in Neon Spire, a program/lab kid in Crown, Black Panther, Wolverine, Flash and Spider-Man.
- At 390×844: the age 6, 9 and 10 mystery saves (Powers ▸ Book and the chapter card), the God Mode picker, and a 31-year-old Wolverine.

**Findings:**
- **Mystery Life:**
  - Wakes landed at 8–13. Canon beats for legends landed at canon ages (BP 18, Wolverine 12, Flash 25).
  - Deaths at 71–91. Always 6 moves.
- **Omen spam (fixed):**
  - Before: 24–96 "strange feeling" lines per life from 3 lines per element. The same line repeated within a year.
  - After: 18–34 per life, louder near the wake, with no repeats in the last 4 signs.
- **The sealed Book tab was a wall of text (fixed).** It also said "From 13, a birthday can offer one", which is wrong for mystery lives. Now it is a sealed-orb card with a feeling meter, signs and Call-it tiles. Screenshots: `superlife-shots/2026-11-01-am/b9-1.png` and `b6-1.png`.
- **Legends going off-canon (fixed):**
  - Wolverine at 31 owned 10+ powers, including Flight and Sorcery.
  - Doctor Maybe and relic guards showed up in a Wolverine life.
  - Now legends are capped (≤12 at death in every sim) and skip generic villains.
- **Loadout:** one life sat at 5 moves after a pruned id (fixed).
- **Chapter goals read clearly at 390px:** each has a tab ▸ button route and a Go button, and locked ones are greyed with "Unlocks when your power wakes" (`l10-1.png`).
- **Still weak:**
  - quietfame (ch2) 0/8.
  - End-of-chapter Health in ch4 0/9.
  - Canon goal 82/83.

## Night pass (2026-10-31 night): Mystery Life, God Mode, goal clarity

**How it was tested**
- **Engine sims:** `/workspace/playtest/night.ts` + `night-pol.ts`.
  - Two Mystery seekers (supportive/protector, rural/thrill) and the four legends, 3 seeds each, to death.
- **Browser:** Playwright at 390×844, touch.
  - Fresh mode select → God picker → Begin as Spider-Man.
  - Build your own (Fire + Speed).
  - Mystery start.
  - Injected saves: age 6 dormant, age 10 chapter, the reveal birthday, Spidey's Bite, Batman's Joker beat, Tony's 20s chapter.
  - No console errors.
  - Screenshots: `/workspace/superlife-shots/night/*.png`.

**Before (main)**
- Goals said what to do, not where. Several goals were picked that a life could not reach in its chapter.
- 6 policies × 4 seeds: `partner 3/18`, `fame 0/5`, `quietfame 1/12`, `infamy 0/8`.
- There was no hidden-power mode and no legends.

**After**
- **Mystery seekers:**
  - The power woke at 8–13, every life on a birthday, with a reveal every time.
  - The omen goal was hit 4/4. A child never got a power action before the reveal (see the tests).
- **Legends:**
  - The canon goal was hit 66/66.
  - Each life had 8–10 canon beats with a real mix: e.g. Spider-Man kept 5 / bent 4 / broke 1.
  - Batman stayed human for life (0 powers, 0 moves). Tony and Hulk wake at 24 and 28, and no power goal appears before that.
- **Still low (policy artefacts, checked by hand):**
  - `partner`: a targeted check found a partner at 16 on every seed.
  - `quietfame` and `standing`.
- **Found:**
  - God picks were silently pruned on reload by the old starter-bundle migration. Fixed, with a regression test.
  - The reveal title overlapped on multi-power legends. It now shows one name and "+ power" chips.
  - Lock chips squeezed goal titles. Moved under the title.
- **Balance (fixed later tonight):** seeker policies used to end lives owning about 130 powers. With the braid-book room, myst2/Spider-Man/Iron Man/Hulk seekers end with 21–27 (`night.ts`, 3 seeds each).
- **Reveal juice (390×844, Playwright):** the share sheet draws the card in under a second for Spider-Man and a mystery life; the extras line and story box no longer overlap. First Move: 6/6 taps gave "Clean first move" and +20 drill; the banner shows on the next card. Found and fixed: test taps scrolled the reveal overlay sideways (now `overflow-clip`).
- **Rogues sim (`rogues.ts`, every preset):** zero generic villains. Every rival, visit and arch-enemy was the hero's own rogue. 10–14 canon beats per life, an ending on every life (mostly canon, some break), deaths at 72–86.


How it was tested:
- **Engine sims:** `/workspace/playtest/*.ts` (outside the repo) drive `createGame/act/choose/resolveMini/ageUp` directly.
  - Three contrasting policies, 20 seeds each, to age 120 or death.
  - **Hero:** Stacks, street kid, secret, protector, Fire Control. Trains, patrols, missions, League.
  - **Social:** NYC, wealthy, loud, idealistic, Telepathy. School, jobs, dating, family, stunts.
  - **Crook:** Hood, tragic, lone wolf, vengeful, Super Strength. Crime, crews, heists, brawls.
  - Plus a random-action policy for money and health attribution.
- **Browser:** Playwright at 390×844, touch, DPR 2, against the dev server.
  - Fresh onboarding → birth → first months.
  - Injected saves at 9y11m and 59y11m to see decade turns, the low-HP warning and a collapse.
  - Screenshots: `/workspace/superlife-screens/playtest-*.png`.

### Four new legends (rogues sim, 3 seeds each)

- Superman, Wonder Woman, Captain America and Thor each met all 4 of their own rogues, with no generic villains (`BAD -`), and logged 11–12 canon beats.
- Lives ran 73–86 years. 11 of 12 took the canon ending; one Superman life bent it.
- The arch-enemy varies by seed (for example Doomsday, Zod or Lex for Superman), so replays feel different.
- At 390×844 the picker cards fit the hero name, twist, 3 power chips and 4 rogues without clipping (`/workspace/superlife-shots/night/28-31`).

## Playability blockers (fixed on this branch)

| # | Blocker | Evidence (before) | Fix | After |
|---|---|---|---|---|
| 1 | **Lives end at 15–27.** Health 0 = instant death, with no warning and no regen. | All 60 focused sims died at 15–27. Drills cost ~4.5 HP each, and HP 8 at 14 had no warning. | Health 0 is now a **collapse** (hospital, bill, 18-month "critical" window). A second collapse in that window can kill an adult. Passive monthly regen (age-scaled). A banner below 25 HP says "Rest or see a doctor". | Careful players: median death **78–82**, range 71–94 in all three styles. Players who ignore warnings still die young (social median 37). |
| 2 | **~960 "Next month" taps** per life. Ages 0–5 have almost nothing to do. | The age-0 Life desk said "Nothing in reach" for 72 straight months. | **"To N+1 ⏭"** next to Next month skips to the next birthday. It stops on any choice, minigame, chapter card or death. Empty shelves now point to the desks that have moves, or say "Out of moves, tap Next month". | 0→10 takes about 10 taps plus choices. |
| 3 | **Economy runaway.** | Hero path: $1M by 23 and $17M by 80. `shift` was unlimited (+$869k in random sims). | Heavy shift is once a month. League stipend lowered from 12k–200k to 8k–75k a year. Fame bonus cut from fame×380 to fame×150. | Hero ≈ $8.6M by 80 (League rank 6 for 50 years). Social ≈ $3M, crook ≈ $0.65M. Still needs sinks (see BACKLOG: markets). |
| 4 | **Too many powers too early.** | 13–23 powers by 18. "Look for a teacher" patrol and "notes" books handed out unlimited random sparks. | Random sparks are capped at one every 2 years. Free yearly offers cut from 62/48/36% to 34/28/20%, halved again at 10+ powers. | About 6–13 by 20 and 20 by 50. Growth is spread across decades. |
| 5 | **Fame and reputation pinned at ±100 by about 18.** | Every policy saturated, so later decades had nothing to chase. | Soft ceiling: gains toward an extreme scale by `max(0.12, 1 − |x|/105)`, with stochastic rounding. | Social and crook now sit around 60–90 through mid-life. A hero who grinds 500+ missions still reaches 100 by 40. More direct `clamp(+fame)` writes in jobs and schools still bypass this (backlog). |

## Life length and pacing (careful policy, after fixes)

| Decade | What happens | Notes |
|---|---|---|
| 0–9 | 3–5 meaningful actions (rest, confide, time/gift with parents). Books/walks from 6, drill from 7. | This was the biggest tap sink. Skip-year plus the origin chapter goals now give the decade a shape. |
| 10–19 | Powers, teachers, school, first League tryout. The densest decade. | Most powers used to arrive here. Now about half. |
| 20–39 | Job and League rank climb, arcs, partner, kids. | Money climbs fast on the League path. Fame plateaus. |
| 40–59 | Before: the same verbs as in the 20s. Now: the crisis and legacy chapters give goals. | Still thin on new verbs. Markets and property are the missing layer. |
| 60–90 | Before: death at 66–80 with nothing new to do. Now: mentor action, legacy goals, and a slower health toll with legacy ≥ 20. | Ends by old age at 71–94. |

## Repetition (top repeated prompts per life, hero policy)

- "The gym, the block, or a room that does not advertise…" (gym prompt): ~560× in a heavy-training life.
- "A call comes in. Civilians, a timer, and a captain…" (League mission): ~330×.
- "<Villain> sends a pin and the words 'bring the good trick'": ~150–240× per villain.
- "The city is behaving just enough to make you choose a block." (patrol): ~190×.
- Minigames: `timing` makes up 70–80% of all minis, duels most of the rest, and `pattern` almost never appears.

## What's fun

- Building powers (braid book, teachers) and the 6-move duel.
- Villain pins and arcs give the mid-game a spine.
- The chapter title card plus 3 goals gives every decade a "why", and each goal names the desk to use.

## Mobile confusion (390×844)

- Age 0: the Life desk is empty while People has the actions. **Fixed** with "things you can do right now" desk buttons.
- "Out of moves" is shown only as a small caption, and the shelf said "Nothing in reach". **Fixed**: the shelf now says what to tap.
- The desk tab row scrolls horizontally, so "Work/Board" are off-screen at 390px. **Fixed**: 5-tab bottom bar, Board inside Cases.
- The header still shows the legacy power name/fusion title, not the combo book name (open since 2026-10-30).

## Economy with the Market (scripted sims, 8 lives per policy)

Harness: `playtest/life.ts` + `econ.ts` (not in the repo). `MARKET=1` lets the policy buy what it can afford and wants; `MARKET=0` is the old game.

| Policy | Death median (range), market | End cash, no market | End cash, market | Holdings @70, market | Legacy, market vs none |
|---|---|---|---|---|---|
| hero | 85 (74–96) | $8.85M | $432k | $2.45M | 74 vs 43 |
| social | 82 (74–95) | $3.06M | $131k | $141k | 76 vs 37 |
| crook | 75 (71–86) | $524k | $73k | $4k | 41 vs 31 |

- Money is no longer a dead stat: the surplus goes into influence, property and legacy, and legacy almost doubles.
- Nobody goes broke: medians stay positive and lifespans are about the same (hero lives run slightly longer thanks to supplies and property perks).
- Hero spend per life: influence $1.27M, property $1.04M, legacy $738k, intel $463k, gear $364k.
- **Watch:** crooks die younger with the market on (median 75 vs 81 without). Likely cause: they spend on gear and influence instead of keeping a cash cushion for hospital bills. Not tuned yet; see BACKLOG item 9.

## Balance pass (scripted sims, 12 lives per policy)

Harness: `playtest/fame.ts` (not in the repo). Fame is the median at ages 30/50/70.

| Policy | Death, no market | Fame, no market | Death, market | Fame, market | Legacy, market |
|---|---|---|---|---|---|
| hero | 83 | 94/95/94 | 81 | 94/96/96 | 68 |
| social | 77 | 83/85/84 | 78 | 87/88/88 | 77 |
| crook | 80 | 66/67/65 | 78 | 69/69/68 | — |

- Before: hero fame pinned at 100 every decade, and the market gave crooks +10 fame.
- Crook lifespan with the market is within noise at N=12 (the 75-vs-81 gap from 8 lives did not reproduce).

## New-life stepper and city art (Playwright, 390×844)

- A full run (violet hair, Neon Spire, Curious drive, a Mixed gift) starts a life with those choices saved; no console errors.
- Screens: `/workspace/superlife-screens/b2/create-*.png`, `b2/city-*.png` (before: `b2-before/`).

---

# Playtest (2026-10-31, am pass)

**Builds played** (scripted, 20 seeds each, market on):

- **celeb**: Crownbridge, celebrity upbringing, loud, glory, Teleportation. Policy: stunts, League, market.
- **vet**: Dustreach, military upbringing, secret identity, duty, Gravity. Policy: patrol, missions, mentoring.

Mobile screenshots at 390×844: `/workspace/superlife-shots/2026-10-31-am/`.

## Findings (before)

- **Minigames were one game.** Celebrity lives played 928–1339 timing bars per life (stunt 802×, mission 467×). Read appeared about 30 times. Vet lives were about 900 duels. **Fixed:** 6 skill kinds plus duels (see the after section).
- **Stats saturate by the 20s.** At 26 the celeb sat at Joy 100, Mind 100, Fame 98, Rep 100, Karma 100 with HP 8. **Partly fixed:** soft caps and monthly settling. Joy now hovers around 90–98 for joy-heavy policies; Mind still reaches 100 by about 30.
- **Mentoring had no diminishing returns.** Vet legacy reached 577 from 174 sessions. **Fixed:** about 200 now. Market legacy items still add on top.
- **Unreachable chapter goals:**
  - holdmoney 0/11 (the label didn't match the rule);
  - fortune 0/15;
  - arc 2/17, because only 4 arcs exist and they are all done by about 30;
  - quiet fame 0/5 for secret heroes;
  - trust 0/29, because hero bonds stall at about 32.
  - **Fixed** after the change: holdmoney 15/15, cushion 17/17, fortune 6/12, arc 7/26. Trust is still open.
- **Repeats per life:** the night-out prompt 503×, the League call 293×, villain pins "bring the good trick" 180–190× per villain, patrol 234×.
- **UI:**
  - The mini screen had a big empty gap between the arena and the button, and a plain "Drill" header. **Fixed.**
  - The HUD power chip showed the legacy fusion name. **Fixed.**

## After

- **Celeb minis per life:** timing 415–524, press 192–294, rescue 189–239, hold 193–246, crack 118–147, read 25–51, duel 150–207.
- **Vet minis per life:** duel about 850, timing about 200, hold about 120, crack about 85, rescue about 75.
- **Celeb life by decade, seed 1:**
  - At 20: Joy 93, Mind 98, Fame 98, rank 5, HP 55.
  - At 30: HP 36 (the stunt grind still hurts).
  - At 87: $260k cash plus $1.5M in property, legacy 145, 20 powers.
- **Still open:**
  - Mind saturation.
  - Hero bonds stuck in the 30s.
  - Arcs run out by 30.
  - Prompt repetition.
  - Property upkeep of $58k a year by 87 is a slow drain, which is fine.


# 2026-10-31 (pm): scholar-hero, Neon Spire, telekinesis

Played Noor Haddad, a studious Neon Spire hero with Telekinesis, with a new "sci" policy: books, hero training, League missions, cases, and talking to heroes every 4 months. 4 seeds, lives of 73–93 years. I also looked at the Cases desk at 31 and 46 on a 390px screen.

## Before

- The harness never picked hero actions, so bonds looked frozen. Fixed in the harness. With them counted, bonds hit 100 by about 20, because talk is free.
- Every case was closed by 30. From 30 to 90 the Cases desk said "No open cases".
- Top repeat: "<cape> finds you on purpose" 50–80 times a life, then the gym, the books and the League lines.
- The case file was a plain numbered list.

## After

- Bonds by decade: 53 at 20, 72 at 30, 82 at 40, 92 at 50, and 100 from about 60. The trust goal is now reachable in the 30s.
- Cases closed: 7–8 per life, with the last one (Old Debts) in the 50s.
- The cape-visit line is gone from the top repeats. The books lines are now the top repeats (47–94 times each) even with 4–5 variants, because this policy reads about 500 times a life.
- Still open: no case for the 60s and 70s, and few mid-life verbs.