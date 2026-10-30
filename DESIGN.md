# SuperLife — Design

This is the owner's design, written down as faithfully as possible. Where the code adds things the design never asked for, they are listed separately at the end under "Existing extras". Open questions are in `BACKLOG.md` under "Design ambiguities".

**Platform:** a mobile game. It should feel clean and smooth: big touch targets, no jank, tidy layouts at about 390px wide, and quick flows. It should be fun, with plenty of well-designed minigames. Every choice (powers, upbringings, traits, cities, looks, dialogue, quests) should offer a large pool of options.

## 1. Power combination

- The player can mix **any 2 unlocked powers**.
- **Generation = max(parent generations) + 1.**
- **Generation 2 is the hard limit.** Nothing is ever Generation 3.
  - In code, a Generation 2 power is final and can never be a parent (`combo.ts` `MAX_GENERATION`, `childGeneration`).
- **Required chain:**
  - Fire Control + Super Speed → **Light Speed** (Gen 1)
  - Light Speed + Super Strength → **Lightning Strikes** (Gen 2)
- **Base powers (Gen 0), all 18 required:**
  - Fire Control, Ice Control, Lightning Control, Super Strength, Super Speed, Flight
  - Telekinesis, Telepathy, Energy Projection, Invisibility, Regeneration, Super Durability
  - Gravity Manipulation, Weather Control, Super Senses, Force Field, Teleportation, Shape Shifting
- **Recipe book is data-driven.** Named recipes live in `src/game/powers.catalog.ts`, one line each.
  - A pair with no named recipe still mixes into a generated "weave", obeying the same generation rules.
- The rules are enforced by `src/game/test/catalog.test.ts`:
  - recipe references exist and pairs are unique
  - generation math is right and the cap holds
  - the required chain works
  - every power has moves

## 2. Progression is a grind

- Leveling powers uses **diminishing returns, costs, and soft caps**.
- It should be **hard to max powers as a child**. Mastery caps depend on age, generation and story progress (`mastery.ts`).
- **AI heroes also level slowly.**
  - EXP earns a level, and the bond with the player caps it (`heroes.ts` `heroLevelCap`, `settleHeroLevel`).
  - An earned level is never taken away.

## 3. Combo powers and battle moves

- Combo powers unlock **unique battle moves**.
- **The moveset is exactly 6.**
  - The player builds the six in the Moves shelf.
  - Any empty slot is filled with an unpowered street move when a fight starts, so every battle uses exactly six moves (`moves.ts` `battleMoves`).

## 4. Story

- There are **multiple story arcs** with villains, quests, and hero reactions (`arcs.ts`, `origin.ts` dossiers).

## 5. Cities

- **New York City**
- **The Hood**
- **Cyberpunk World:** gritty and industrial, *not* neon. In the code this is "The Stacks".

## 6. Upbringings

The design asks for these: alien, tragic, normal, military, wealthy but neglected, orphanage, small town, lab experiment, street, celebrity, and isolated.

## 7. Traits (with real effects)

- **Starting traits:**
  - identity: secret, loud, reluctant
  - drive: protector, vengeful, idealistic, pragmatic
  - style: team player, lone wolf
- **Unlockable traits:** millionaire, sorcerer, tech genius, celebrity, government agent, underworld connections, alien royalty, martial artist, psychic, corporate insider.
- Traits change stats, hero bias, travel costs, events and unlocks (`origin.ts`).

## 8. AI heroes

- Each hero has a **relationship** score (0–100), a **level**, and **EXP**.
- Each hero has a **personality** and a **memory** of past talks and events.
- Heroes **react to what you say**. Replies come from an LLM when a key is set, with a local fallback.
- They offer **missions** and **joint training**, and can teach you powers or learn them from you.

---

## Existing extras (built, not in the original design)

- **Extra cities:** Metro City, Harbor Bay, Neon Spire, Dustreach, Crownbridge.
- **Extra upbringings:** supportive, skeptical, hero legacy, absent parents, and scientific family.
  - The design's eleven map to these code ids: normal, alien, tragic, military, wealthy, foster (orphanage), rural (small town), program (lab experiment), street, celebrity, isolated.
- **Extra base powers:** Elasticity and Sorcery.
- **Life sim:**
  - BitLife-style months and ages, with a monthly move budget.
  - A random event deck (about 53 events), family and people, schools, jobs, and hero teams.
  - League ranks, karma, money, crews and heists, death and heirs.
- **Minigames:** timing, pattern, and a turn-based duel.
  - The duel uses strike/guard/trick rock-paper-scissors, energy and cooldowns.
- **Power Lab:**
  - Mastery ranks D→S/X, with focus.
  - Two saved loadout sets (A/B).
  - Teachers.
- **Look and closet:** a portrait generator and costumes.
- **Legacy power layer:** the older 15-power system (`data.ts` `POWERS`, fusion titles like "Cauter"). It is still used in the header and for some flavour, and is bridged to the combo catalog.
- **Grok Build plumbing:** auth, app-data saves and multiplayer (`src/lib`). Game work leaves these alone.
