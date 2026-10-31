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

## 9. Chapters (a life in decades)

A life is told in ~10-year chapters, so a long life has a shape instead of 960 identical months.

- **Phases** (data table `CHAPTER_PHASES` in `src/game/chapters.ts`):
  - 0–9 Origin
  - 10–19 Coming of age
  - 20s Early career
  - 30s Rising name
  - 40s The crisis
  - 50s Building a legacy
  - 60s Elder and mentor
  - 70+ Final years (repeats every decade)
- **Title card:** shown at birth and on every decade birthday. It has:
  - a title and a personal premise, built from the hero's city, upbringing, traits, gift, family, best teacher bond, arch-enemy and the last chapter's thread;
  - three goals with live progress bars, each with a one-line hint naming the desk to use.
- **Goals** come from a data table (`CHAPTER_GOALS`).
  - Each phase lists its goal pool, filtered by who you are. Secret heroes get "keep the mask on", loud ones get "get noticed", villains get infamy goals instead of League rank, and so on.
  - Targets are deltas from the chapter start, so they are always reachable.
- **Recap** at the decade turn scores the goals and carries consequences forward:
  - Each goal met is worth +3 legacy. All three met gives Joy +6, power +0.1 and +4 more legacy. None met gives Joy −6.
  - A **thread** is picked for the next premise: momentum, drift, nemesis, family, infamy, body, fame or quiet. It never repeats the previous thread twice in a row.
  - Drift forces a "be happy" goal next time; body forces a "come out standing" goal.
- **Legacy** is a new stat, built from chapter goals, the **Mentor a rookie** action (45+, once a month) and teaching a hero.
  - Legacy ≥ 20 halves the yearly health toll of age after 58, so late life has a purpose and more runway.
- **Longevity:**
  - Health 0 means a hospital stay, not death. A second collapse inside 18 months can kill an adult.
  - The body recovers a little each month, with a lower ceiling as you age.
  - Old-age mortality starts at 70, softer than before.
  - Typical careful lives end between 71 and 94.
- **Entry point:** one strip at the top of the Life desk ("CHAPTER n · PHASE · AGES a–b · title · k/3"). Tap it to reopen the card and see earlier chapters.
- **AI:**
  - The procedural generator is the source of truth: deterministic and seeded by the hero fingerprint, chapter index and RNG.
  - `src/game/chapter-ai.ts` is an optional server function. If `XAI_API_KEY` is set on the server, it asks Grok to rewrite **only** the title, premise and beat lines, using a strict JSON schema. The output is validated by `validChapterText` (lengths, shape, no markup) and cached in the save (`aiTried`, `source`).
  - Goals and consequences never come from the model.
- **Saves:** `chapters`, `legacy` and `chapterNotice` are optional fields. `migrateChapters` (run in `save.ts` migrate and `freshen`) gives old saves a running chapter for their current decade.

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
