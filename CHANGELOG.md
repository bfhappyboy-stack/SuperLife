# Changelog

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
