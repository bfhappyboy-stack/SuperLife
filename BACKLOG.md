# SuperLife — Backlog

## From the 2026-11-01 am pass

1. **Painted portraits for Black Panther, Wolverine and The Flash.**
   - They use a drawn SVG silhouette (`LegendBust.tsx`) for now.
   - Needed: 540×960 webp, in the same style as `src/assets/art/hero-*.ts`.
2. **PR #1 (`devbot/2026-10-31-am`) is stale.** Main already contains its work. Owner: close it?
3. **Legend book cap** is canon + 2, then +1 every 6 years, max 12. Teachers still hand legends off-canon picks (for example, Flash learns Telepathy).
   - Next: weight teacher and spark offers toward the legend's element.
4. **Weak chapter goals (sims):**
   - "Keep Fame ≤ N" in ch2: 0/8.
   - End-of-chapter Health in ch4: 0/9.
   - Dark karma: 1/3.
   - Mostly policy artefacts, but consider moving the Health goal to "Health 40+" for chapters with a fight-heavy canon.
5. **Done this pass:**
   - Clear goals: tab ▸ button routes, Go buttons, greyed "Unlocks at N" goals.
   - Sealed-gift panel and paced omens.
   - Black Panther, Wolverine and Flash (Earth-6616, Earth-7419, Earth-1956).


## From the 2026-10-31 night pass

1. **Legends polish.**
   - Real names are placeholders until you decide: keep them, or rename them to parody variants.
   - Shipped tonight: own-rogue arch-enemies, late canon (58–73) and variant endings.
   - Shipped tonight: Superman, Wonder Woman, Captain America and Thor (8 legends).
   - Next: Black Panther, Wolverine, The Flash. The picker has 9 dots now; past ~10 legends, add a grid or filter.
2. **Batman's vow.**
   - Today the human vow forbids all powers.
   - An option to let a "bend canon" choice break the vow: decide.
3. **God Mode limits.**
   - 3 powers, 1 Apex and 2 earned traits. Revisit after feedback.
4. **Power room.** Shipped tonight: 4 + age÷4 pages (max 30), 3/2/1 new per year. Tune after feedback; consider a "retire a page" action.
5. **Reveal extras.** Shipped tonight: share card, First Move mini, blips and haptics. Next: a global sound setting in the menu, and an animated (video/GIF) card.

## NEXT (from the 2026-10-31 playtest)

1. **Minigames.** **Shipped 2026-10-31 (am):** Crack, Rescue, Press and Hold, plus verb pools and a shared frame. Timing fell from about 85% to about 30% of celeb minis. Still open:
   - a gym mini (gym is still a choice prompt);
   - villain-pin and heist verbs;
   - a "chase" kind for mobility powers;
   - a difficulty curve by mastery rank;
   - per-kind hint lines after a botch.

   Original note:
   - `timing` makes up 70–80% of all minis, and `pattern` almost never fires.
   - Ship 3 new kinds first: rescue triage, lockpick/hack and press conference (see the Minigames list below).
   - Map each one to its verbs (patrol, heist, stunt), and give the gym prompt (~560× per heavy life) its own mini.
2. **Markets across decades.** **Shipped 2026-10-31** (Work ▸ Market). Still open: chapter goals that ask for a purchase, hospital insurance, more city art.
   - Original note: Money is now the clearest dead stat ($3M–$9M by 80 with nothing to buy).
   - Add a Market desk where prices move by decade (tech gets cheaper, property gets dearer), covering:
     - **gear** (stat and move buffs, wear out);
     - **resources** (lab time and hospital insurance, which caps collapse bills);
     - **information** (villain dossiers that shorten arcs);
     - **influence** (PR that buys fame/rep moves inside the soft ceiling);
     - **property** (a safehouse, a gym or a mentor school, giving monthly legacy and income);
     - **tech** (unlock tiers by decade).
   - Chapter goals can then ask for a purchase ("own a safehouse").
3. **Combat depth.** *Presentation and hand-written moves shipped 2026-10-31 (illustrated duel, element VFX, K.O. screen, authored moves).* Still open: villain gimmick phases and fight injuries.
   - Duels are ~20% of minis and always the same shape.
   - Add villain gimmick phases, combo-power signature moves (hand-author the 106 generated movesets) and a "fight injuries" link to the new collapse system, so fights carry long-term risk.
4. **Repetition.**
   - The League mission prompt (~330×/life) and villain pins (~200× per villain) need 4–6 variants each, keyed to chapter phase.
5. **Fixed 2026-10-31.** **Fame/rep writes bypassing the soft ceiling.** Jobs, schools and openYear still `clamp(+x)` directly. Route them through `applyEffects`.
6. **Chapter depth.**
   - A mid-chapter beat at about year 5: a chapter-specific event drawn from the thread (nemesis, family, body).
   - A per-chapter "signature choice" with a lasting flag.
7. **Desk tab row overflows at 390px.** **Fixed 2026-10-31** with a 5-tab bottom bar. "Work" and "Board" are off-screen; consider icons only or merging Board into Cases.

8. **Art. Shipped 2026-10-31:** all 8 cities have backdrops, and chapter cards have per-phase accents and motifs. Open: regenerate Neon without pseudo-text signage; move art to real `.webp` files when git push is available. Original note: Backdrops exist for NYC, the Hood, the Stacks and the title. Add Metro, Harbor, Neon, Dustreach, Crownbridge and per-chapter-phase art (same pipeline, ~20–30KB each).
9. **Economy tuning. Done 2026-10-31:** influence fatigue + fame fade; the crook lifespan gap was sampling noise (N=12: 81 with market vs 78 without). Original note: With the market on, hero lives end with ~$0.4M cash but ~$2.5M in holdings at 70. Watch whether influence (the top spend) is too strong a fame lever, and why crook lives get shorter with the market on (75 vs 81 median).
10. **Haptics.** **Shipped 2026-10-31 (am)** for the skill minis. Open: the duel and a settings toggle.
12. **Shipped 2026-10-31 (pm):** four mid-life cases (28–54+), so sims now close 7–8 cases by the 50s. Next: a case for the 60s/70s (mentor and final phases), and villain gimmick phases in the bosses. Original: **Story arcs run out by 30** (2026-10-31 am playtest). Only 4 arcs exist. Add mid-life arcs (crisis and legacy phases) so the arc goal and the story carry past 30.
13. **Fixed 2026-10-31 (pm):** a diminishing bond curve with yearly room and drift (53 at 20, 72 at 30, 92 at 50). Original: **Hero bonds stall at about 32**, so the trust goal is never met (0/29). Hero talk and spar need a bond curve that can reach 60 by the 30s.
14. **Mind saturates** at 100 by about 30 for studious heroes. Consider ageing decay after 60 or a "wisdom" reframe.
15. **Shipped 2026-10-31 (pm):** `prompts.ts` pools for 8 prompts. Still open: books lines repeat about 50–90 times in a heavy-study life even across 4–5 variants, so books may need a mini or a shorter cooldown. Original: **Repeat prompt variants.** Night out (503×), the League call (293×) and villain pins (about 190× each) need 4–6 phase-keyed variants.
16. **Mid-life verbs** (2026-10-31 pm playtest). From 40 a studious life is mostly books, hero training and League missions. Add verbs for the 40s–60s: running a team, a public inquiry, raising a sidekick, a comeback fight.
17. **Fight injuries.** Boss fights in the 40s and 50s should risk a lasting injury that links to the collapse system.
11. **Creation, next.** More hair cuts and face features need new SVG in `Figure.tsx` and `Portrait.tsx`. Eye colour and a third "face" (urban legend) are candidates.

## AUDIT (2026-10-30)

This audit compares the code with `DESIGN.md`. Priority: **P0** breaks a design rule, **P1** is a visible bug or high-value gap, **P2** is polish.

### Design conformance

| Area | Status | Notes |
|---|---|---|
| 18 base powers | ✅ | All present, plus Elasticity and Sorcery. |
| Mix any 2 unlocked | ✅ | Named recipe or generated weave. |
| Gen = max+1, cap Gen 2 | ⚠️ **fixed** | 8 recipes used a Gen-2 parent and the clamp hid it. `mix()` let Gen-2 powers braid again. |
| Required chain | ✅ | Now covered by a test. |
| Data-driven recipe book | ⚠️ **fixed** | Two recipes shared one pair (`threat-map` and `crowd-read`), which made Crowd Read impossible to get. |
| Grind / soft caps / hard as child | ✅ | Mastery caps by age, generation and arcs; train costs; diminishing EXP. |
| Heroes level slowly | ⚠️ **fixed** | Learn/teach ignored the bond cap. Other paths could *lower* a level when the bond dipped. |
| Combo powers → unique moves | ⚠️ partial | Only about 14 powers have hand-authored moves; the rest are generated. Generated names collided ("Thunder Strike" ×2, "The Strike"). Names are now unique; authoring the rest is still open. |
| Moveset exactly 6 | ⚠️ **fixed** | Fights used fewer than 6 when a player had fewer unlocked moves, and 4 when unpowered. They now pad with street moves. |
| Story arcs, villains, reactions | ✅ partial | 4 arcs × 6 steps. Too few: see the option pools below. |
| NYC / Hood / Cyberpunk (gritty) | ✅ | The Stacks says "refused the neon". It has no Stacks-only arc yet. |
| 11 upbringings | ✅ | Plus 5 extras. |
| 9 starting + 10 unlockable traits | ✅ | Real stat, bias, travel and event effects. |
| Hero relationship / level / EXP / personality / memory / talk / missions / training | ✅ | Memory capped at 8; the LLM is optional with a local fallback. |

### Bugs found (P0/P1 fixed this pass)

- **P0 Gen-2 cap broken.**
  - The cause: `cataclysm-storm`, `divine-thunder`, `eclipse-brand`, `guided-star`, `eruption-line`, `city-stopper`, `sermon-from-above` and `sky-knows` all had a Gen-2 parent.
  - **Fixed:**
    - Re-rooted them on Gen-1 + base pairs, keeping the same ids and moves so saves are safe.
    - `mix()` now refuses Gen-2 parents.
- **P0 Moveset not always 6.** **Fixed:** added `battleMoves` and `STREET_MOVES`.
- **P1 Earned traits reset hero bonds.**
  - `origin.ts bump()` clamped every relationship to 32 whenever a trait was granted. Earning e.g. Psychic at 20 dropped a bond of 70 to 32.
  - **Fixed.**
- **P1 Hero levels.**
  - `learn|` and `teach|` skipped the bond cap, and other paths could reduce a level.
  - **Fixed:** added `settleHeroLevel`.
- **P1 Martial artist unlock** read the wrong mastery table (`masteryLevelSafe`). **Fixed:** it now uses `masteryLevel`.
- **P1 Duplicate recipe pair:** Crowd Read was unreachable. **Fixed:** it is now Telepathy + Teleportation.
- **P1 Hand-authored powers with one move** (kinetic-impact, plasma-blast, sonic-flight) had no signature move. **Fixed:** a generated second move is appended.
- **P2 Raw trait id in story text** ("martial sticks."). **Fixed:** it now shows the trait title.
- **P2 Lint:** `Duel.tsx` prefer-const, Minigame ref cleanup warnings, and an unused param. **Fixed.**
- **P2 `combo.selfCheck()`** asserted the old clamp behaviour. **Updated**, and it now runs in tests.

### Still open

- **P1 Two power layers.**
  - The header still shows the legacy fusion title (e.g. "Cauter · B 3.8", "Braided with Healing"), while the book says "Regeneration" and "Light Speed".
  - Unify on the combo catalog: header = focused combo power + mastery rank.
- **P1 Hand-author moves** for all 106 combo powers (Gen 1 + Gen 2). The generated "X Rush / X Verdict" names are unique but bland.
- **P1 Child pacing.**
  - A simulated street kid in the Stacks held 8 base powers by 14, learned from heroes. That is fine for breadth, but power *count* feels easy.
  - Consider gating hero teaching by age or bond more tightly.
  - Mastery stayed low (one power at 185), which is correct.
- **P2 The headless sim loop stalls around age 14** on repeated actions. Investigate whether some action can no-op without spending a move.
- **P2 `npm test` pre-existing failures.**
  - 11 failures in `scripts/**` tests need `.grok/skills/og` and nitro middleware files that aren't in the repo.
  - This is Grok Build plumbing and was left alone. Game tests now run first (`npm run test:game`).
- **P2 Lint error in plumbing:** `src/lib/app-data/client.server.ts:281` has an empty block. It was left alone on purpose.

## Mobile UX (390px)

Measured at 390×844 with touch emulation. There is no horizontal overflow, no tap target under 44px, and no console errors.

- **Done:**
  - Removed the persistent "X — pressed." banner above "Next month". It cost about 50px on every screen. It is now screen-reader-only.
  - On non-Life desks the event card collapses to its title and headline. The Power Lab now starts about 60px higher.
- **P1** The desk nav scrolls sideways, and "Board" is cut off at 390px with no hint. Add an edge fade or shrink labels to icons + short text.
- **P1** The create screen is one long scroll (look, city, upbringing, traits, gift). Make it a 4-step stepper with a sticky "Next", and add a "Randomize all".
- **P1** The Power Lab Book is long (identity, mastery list, heard-of, mixes). Add a sticky segment control (Mix · Mastery · Heard of), or collapse each section.
- **P1 Mix flow:** make it a two-tap picker (tap power A, then tap power B), with a live result card and the Gen badge, instead of scrolling a list.
- **P2** Add haptics (`navigator.vibrate`) on duel hits, minigame wins and level-ups, and respect reduced-motion.
- **P2** Duel: test one-handed reach. Move buttons should sit in the bottom third.
- **P2** Header power line truncates on small phones. Show the rank as a chip instead.
- **P2** Add skeleton/fade transitions between desks so they don't hard-cut.

## Minigames

There are only three kinds today: `timing`, `pattern` and `duel`. Add these, each with 3 difficulty tiers and power-flavoured skins:

1. **Swipe-dodge:** dodge debris or bullets. For speed and flight powers and chase scenes.
2. **Lockpick / hack:** rotate rings to align. For tech genius, insider and Stacks heists.
3. **Rescue triage:** drag civilians to safety before the timer runs out. For protector and arc "protect" steps.
4. **Memory interrogation:** recall a suspect's details. For telepathy and investigate steps.
5. **Rhythm channel:** tap on beat to charge a combo. Use it for mix attempts, so braiding is a skill check rather than a button.
6. **Aim / trajectory:** energy projection, fire and ice shots at moving targets.
7. **Stealth path:** a grid where you avoid vision cones. For invisibility and secret identity.
8. **Press conference:** pick lines on a timer. For loud and celebrity, affecting fame.
9. **Weight lift / hold:** press and hold within a zone. For strength and durability training.
10. **Boss phases:** multi-phase duels with a gimmick per villain.

Also give each training action its own mini instead of only stat rolls, and add daily or seasonal challenge minis.

## Option pools (make every choice wide)

| Pool | Today | Target | Concrete items |
|---|---|---|---|
| Base powers | 20 | 24+ | Sound, Density, Time Skip, Animal Kinship |
| Named recipes | 106 | 150+ | Fill in the free Gen-0 pairs (12 still free with Telepathy alone); every Gen-1 should have ≥2 Gen-2 children |
| Hand-authored moves | ~14 powers | all 126 | 2–3 moves per power with unique effects |
| Upbringings | 16 | 20+ | Cult escapee, Sidekick's kid, Villain's kid, Refugee |
| Traits | 19 | 30+ | Starting: Showboat, Cautious, Glory hound. Unlockable: Mayor, Ex-villain, Time-touched |
| Cities | 8 | 10+ | A Stacks-only arc, a Hood-only arc, plus an undersea or orbital city |
| Story arcs | 4 | 12+ | One per city, plus 4 cross-city arcs; each with 2 villain variants |
| Heroes | 10 | 16+ | Diverse power families; each with 40+ local lines across moods |
| Hero dialogue | small LINES/VOICE banks | 3× | Per-tone banks (thanks, insult, train, mission, neutral) × bond band |
| Looks | 6 skin, 7 hair, 6 styles, 2 builds, 4 features | 2–3× | More builds, eye colours, facial hair, tattoos, masks |
| Random events | ~53 | 150+ | Per-city and per-upbringing decks |

## Design ambiguities (need the owner's call)

1. **Can a Gen-2 power be a parent?**
   - The design says "Gen = max+1, hard limit Gen 2". The old build allowed Gen-2 + X → Gen 2 (clamped).
   - This pass treats Gen 2 as **final** and re-rooted 8 recipes.
   - If the owner wants clamped apex braids, revert `childGeneration` to clamp and restore the parents.
2. **Exactly 6 moves:** should empty slots be padded with street moves (current), or should a player be blocked from fighting with fewer than 6?
3. **"Cyberpunk World" vs "The Stacks":** should the city be renamed to "Cyberpunk World" in the UI? "Neon Spire" also exists as a separate neon city.
4. **Legacy 15-power layer:** retire it, or keep it as flavour?
5. **Should a generated weave (an unnamed pair) count as a "combo power with unique moves"?** Today it uses the generated two-move kit.
