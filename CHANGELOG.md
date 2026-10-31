# Changelog

## 2026-10-31 — duel, moves, balance, art and new-life stepper (`devbot/2026-10-31-chapters`)

### Duel presentation (`Duel.tsx`, `Vfx.tsx`, `duelKit.ts`, `Figure.tsx`)

- Fighters are full illustrated figures: your hero in your look, wardrobe and cape colour; foes get a suit, mask and cape kit from their power (Pyro, Cryo, Storm, Mentalist, Brute… or a street kit).
- Poses (stance, attack, hit, guard, KO) on a timeline: hit, swap, counter, rest. A KO cancels the counter.
- Every move has an element with its own projectile (orb, beam, bolt, ripple, streak) and impact burst (flames, shards, lightning, rings, smoke, implode…).
- Big hits shake the arena and flash. "FIGHT!"/"BOSS!" intro stamp.
- Move cards show element, style, energy cost, cooldown, rank, and a one-line mechanic ("area +12%", "guard cuts 20%").
- K.O. result screen: stamp with rays, both fighters, Dealt/Taken/Turns/Best hit, reward chips and Move XP.
- All new motion switches off under `prefers-reduced-motion`.

### Hand-written moves (`elements.ts`, `moves.authored.ts`)

- 16 elements. Every power and every move resolves to one; street and legacy moves too.
- 115 authored movesets replace generated "Stem Noun" names for the combo powers (Light Speed is light, Lightning Strikes is lightning).
- New `moves.test.ts`: no generated names, no placeholders, valid elements.

### Balance (`engine.ts`, `market.ts`)

- Job, school, suit and promotion fame/rep now go through the soft cap. The cap is steeper near the top.
- News-cycle fade: fame over 75 slips by 1–2 a year.
- Bought fame tires: each influence buy in a year is worth 25% less ("The city has seen a lot of you lately"), recovering yearly.
- Result: hero fame settles around 94 instead of pinning at 100; crooks no longer gain +10 fame from the market. See `PLAYTEST.md`.

### Art

- Painted backdrops for Metro City, Harbor Bay, Neon Spire, Dustreach and Crownbridge (540×960 WebP, 15–43KB, lazy chunks). Every city now has art.
- Chapter cards and the chapter strip take a per-phase accent, icon and a quiet motif (sparks, rising motes, window grid, spotlights, rain, laurel, stars, moon).

### New-life stepper (`CreateScreen.tsx`)

- Five steps with a progress bar: Look → Origin → City → Trait → Gift. Tap any step to jump; "Roll" re-rolls only the current step.
- Look: large figure preview, 12 skin tones and 14 hair colours as swatches (fantasy shades included), cut, build, face, name dice.
- Origin: 16 childhoods with cash, family, belief and stat chips.
- City: big live backdrop preview plus a thumbnail grid of all 8 cities.
- Trait: face (secret/loud) and 13 drives — 6 new: Curious, Glory hound, Making amends, Duty-bound, Thrill-seeker, Family first — each with stat chips.
- Gift: tier tabs with counts, a highlighted card for the chosen gift (element icon, tier, description), and a searchable grid of all 126 gifts.
- The footer always shows your portrait and the life so far.
- Random looks still roll from the original palettes, so existing NPC faces don't change. New `create.test.ts`.

## 2026-10-31 — nav, markets, makeover and graphics (`devbot/2026-10-31-chapters`)

### Navigation

- **Bottom tab bar with 5 tabs** (icon + short label): Life, Powers, Cases, People, Work.
  - Board folded into Cases (Files · League · Street · Board); Market lives in Work (Market · School · Job).
  - 44px+ targets, active pill, a dot when a tab has an action waiting, and safe-area padding.
  - Hidden during choices and minigames so nothing can be tapped by mistake.
  - Checked at 360×780 and 390×844: no overflow.

### Markets & economy (new `src/game/market.ts`, `src/components/game/Market.tsx`)

- 46 data-driven items in 7 categories: gear, supplies, intel, influence, property, tech, legacy.
- Prices are computed, never stored: city × decade × traits × reputation × chapter phase × a yearly swing (same hero, same year, same price).
- Gear wears out and gives a minigame edge; intel is spent on your next fight; property has upkeep, appreciates and sells at 92%; debt repossesses the dearest property.
- Legacy items (foundation, scholarship, trust for the heir, memorial park) turn late-life money into legacy, with diminishing returns.
- A black market opens for underworld, low-karma, Hood and Stacks heroes.
- Buying costs no moves. 9 new tests in `src/game/test/market.test.ts`.

### Design system and makeover

- Tokens and components in `src/styles.css`: cards (paper/glass), buttons (primary/gold/ghost), segmented tabs, chips, icon tiles, avatar rings, a game HUD, press feedback and `prefers-reduced-motion` support.
- New HUD: portrait with rank badge, animated HP/Joy/Mind/Look bars with floating +/- numbers, money chip, and power/fame/rank/karma chips.
- Every screen restyled: title, create, Life shell, Power Lab, Cases/Board, People, Work/Market, menu, closet, minigames, duel, obituary.
- Subtle "AI-written" chip on chapter cards when the chapter text came from the AI pass.

### Graphics

- Painted backdrops for New York City, the Hood, the Stacks and the title screen (540×960 WebP, 15–29KB each, lazy-loaded as separate chunks).
- Portraits: gradient shading, highlights, blush, a new mask, and a medal at rank 4+.
- Figure: soft volume lighting, spotlight, floor rings and an aura in the cape colour.
- Duel: arena stage, fighters in stance, hit bursts, floating damage, mirrored HP bars with a lag bar, styled move cards.
- Minigames: glowing timing track with a perfect band, hit burst and stamp; icon-sequence pattern game.

## 2026-10-31 — chapters and playability (`devbot/2026-10-31-chapters`)

Playtest findings are in `PLAYTEST.md`. The playability fixes come first because the game wasn't comfortably playable.

### Playability fixes

- **Health 0 is a collapse, not a funeral.**
  - Before: every focused playtest life ended at 15–27.
  - Now:
    - Hospital stay with a bill and an 18-month critical window. A second collapse in that window can kill an adult.
    - Monthly regen, scaled by age.
    - A "Rest or see a doctor" banner below 25 HP.
  - Careful lives now reach 71–94.
- **Skip to next birthday** ("To N+1 ⏭").
  - Why: a life was ~960 Next-month taps, and ages 0–5 had almost nothing to do.
  - It stops on any choice, minigame, chapter card or death.
- **Empty shelves explain themselves.**
  - They show buttons to the desks that have moves, or "Out of moves, tap Next month".
  - Why: at age 0 the Life desk said "Nothing in reach" while People had the actions.
- **Economy:**
  - Heavy shift is once a month.
  - League stipend lowered from 12k–200k to 8k–75k.
  - Fame bonus cut from ×380 to ×150.
  - Why: $1M by 23 on the hero path, with nothing to spend it on.
- **Power pacing:**
  - Random "spark" grants are capped at one every 2 years.
  - Yearly free offers cut from 62/48/36% to 34/28/20%, halved at 10+ powers.
  - Why: players had 13–23 powers by 18.
- **Fame and reputation soft ceiling.** Gains shrink near ±100.
  - Why: both were pinned at 100 by 18 in every playtest.
- **Old age:**
  - Mortality now starts at 70.
  - Powered elders no longer die of "a gift that asked for more than the body had" at 66.

### Chapters

- New `src/game/chapters.ts`:
  - data-driven phases and goals;
  - a deterministic, personal generator;
  - recap with consequences and threads;
  - legacy;
  - save migration.
- New `src/components/game/Chapters.tsx`: the title card and recap overlay, plus the chapter strip on the Life desk (one entry point).
- New **Mentor a rookie** action (45+); teaching a hero now adds legacy. Legacy ≥ 20 halves the aging health toll.
- New `src/game/chapter-ai.ts`: an optional xAI rewrite of chapter text (strict JSON schema, validated, cached). It only runs when `XAI_API_KEY` is set; otherwise the procedural text stays.
- Tests: `src/game/test/chapters.test.ts` (10 tests) covers:
  - decade transitions;
  - different heroes getting different chapters;
  - old-save migration;
  - AI validation;
  - collapse;
  - the shift cap;
  - long careful lives.

## 2026-10-30 — first pass (`devbot/2026-10-30-first-pass`)

### Fixed

- **Generation cap.** Gen 2 is now final. `mix()` refuses a Gen-2 parent and explains why.
  - Eight recipes were re-rooted on Gen-1 + base pairs. Ids and moves are unchanged, so saves stay valid.
- **Exactly six moves in every fight.** Empty loadout slots are filled with unpowered street moves (Haymaker, Slip, Brace, Shove, Feint, Cover Up) when a duel starts.
  - The Moves shelf shows which street move fills each open slot.
- **Generated move names** are unique and readable (e.g. "Thunder Clap Rush" instead of a second "Thunder Strike").
  - Hand-authored powers with only one move now get a signature second move.
- **Crowd Read** was unreachable because it shared a pair with Threat Map. It is now Telepathy + Teleportation.
- **Hero bonds:** earning a trait no longer drops existing hero bonds to 32.
- **Hero levels:** they now always respect the bond cap and never go down (`settleHeroLevel`).
- **Martial artist unlock:** it now reads the real mastery table.
- **Trait text:** story text shows the trait title, not its raw id.

### Mobile polish

- The "— pressed." banner above the main button is now screen-reader only, which frees about 50px on every screen.
- The event card collapses to its headline on non-Life desks, so the Power Lab starts higher.
- Lint is clean in game and UI code: prefer-const in the duel, and the Minigame timer cleanup.

### Added

- `src/game/test/catalog.test.ts` and `npm run test:game` (node --test, which runs first in `npm test`). The test checks:
  - recipe references and unique pairs
  - generation math and the cap
  - the required chain
  - that every power has moves and move names are unique
  - that a battle always uses exactly six moves
  - hero level rules
- `src/game/test/resolve-ts.mjs`: a resolve hook so node can load the game modules directly.
- `DESIGN.md` and `BACKLOG.md` (an audit, plus mobile UX, minigame and option-pool plans).
