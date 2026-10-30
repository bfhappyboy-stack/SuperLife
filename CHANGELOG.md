# Changelog

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
