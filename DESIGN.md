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

- **Legend kin (God Mode).** Teachers, yearly offers and sparks lean 85% toward the legend's canon kit plus its `stretch` list (`kin.ts`). Off-kin powers are never banned; choosing them is bending canon.

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

### Mid-life cases and bonds (2026-10-31 pm)

- Cases are written for a chapter era. Mid-life cases unlock by age and by closed cases (`minCleared`), use harder foes (`foeLevel`), and pay Legacy when closed.
- Hero bonds follow one diminishing curve: gains shrink as the bond rises, each hero has a yearly room (5 points at bond 0, 1 near 100), and a bond above 40 drifts down 2 a year without contact. A close bond takes decades of grinding.

### Legend lives stay canon (2026-11-01 am)

- **Book cap for God Mode legends:** canon kit + 2, then +1 every 6 years after the canon wake, with a hard max of 12. Ordinary lives keep the age-based room.
- **Events marked `offCanon`** (generic villains, gifts from nowhere, gift swaps) and relic-run duels never fire in legend lives.
- **Mystery omens:** one chase per cooldown (4/3/2/1 months as the wake nears), shown as a 4-step feeling meter.

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

## 10. Markets across decades

- **Where:** Work ▸ Market. Buying never spends a move.
- **Categories:** gear (wears out, minigame edge), supplies (one-use recovery), intel (spent on your next fight), influence (fame, standing or quiet), property (upkeep, perks, value over decades), tech (permanent, era-gated), legacy (late life, outlives you).
- **Price** = base × city × era × traits × reputation × chapter phase × yearly swing.
  - City: e.g. NYC property ×1.55, Dustreach property ×0.45, the Stacks tech ×0.7.
  - Era: tech −8% per decade (floor 45%), property +12% per decade, everything else +3%.
  - Traits: millionaire, insider, inventor and underworld get discounts in their areas.
  - Reputation: good standing is cheaper on the clean market; the black market charges the famous more.
  - Phase: crisis chapters make supplies and intel dearer; legacy chapters make giving cheaper.
- **Yearly tick (birthday):** upkeep, income and growth for holdings; stock turns over. Debt repossesses the dearest property.
- **Balance target:** the market should soak up most surplus without forcing it. See `PLAYTEST.md` for sims.

## 11. Design system and art

- Tokens and components live in `src/styles.css` (Tailwind 4). Use them, not one-off classes: `card-paper`, `card-glass`, `btn-primary`, `btn-gold`, `btn-ghost`, `seg`, `chip`, `ico-tile`, `avatar-ring`, `hud`, `tabbar`, `scene-arena`, `t-hero`, `t-label`.
- The cape theme recolours `--color-gold`, so accents follow the hero.
- Motion: `anim-pop`, `anim-fade`, `anim-drift`, `anim-float`; all switch off under `prefers-reduced-motion`.
- **Art pipeline:** backdrops are generated, saved as 540×960 WebP (quality ~62), and stored as data-URI modules in `src/assets/art/`. `index.ts` lazy-loads each one as its own chunk (`useArt(key)` in `Scene.tsx`), so the first load stays small. Data-URI modules are used because the repo is pushed as text. To add a city, add a module and a `LOADERS` entry; cities without art fall back to the gradient scene.
- Portraits, figures, duel fighters and VFX are SVG/CSS, so they cost no downloads.
- Every city has a backdrop (NYC, Hood, Stacks, Metro, Harbor, Neon, Dustreach, Crownbridge). Keep generated art free of readable text, logos and existing characters.
- **Chapter phases** each have an accent colour, icon and motif (`components/game/phaseStyle.ts`), used on the chapter strip and card. Keep it subtle: tint, border and one motif layer.

## 12. Duel presentation and elements

- 16 elements (`game/elements.ts`) each with a colour, glow and travel type (orb, beam, bolt, ripple, streak). Every power and move resolves to an element; unknown falls back to force.
- Moves are hand-authored in `moves.authored.ts`; the generator only fills gaps and never uses "Stem Noun" names.
- A turn reads in about a second: hit (230ms), swap (520ms), counter (760ms), rest (1040ms). Big hits (≥10 or 20% max HP) shake and flash. A KO ends the turn.
- Foe looks come from `duelKit.ts` (villain/hero kit per legacy power, street fallback).

## 13. Fame curve

- All fame/rep writes go through `applyEffects`, with a soft cap `max(0.03, 1 − |value|/102)`.
- Fame above 75 fades by 1 (2 above 90) each year: staying famous takes upkeep.
- Market influence has fatigue (`buzz`): −25% per buy in the same year, minimum 25%.

## 14. New-life stepper

- Look → Origin → City → Trait → Gift, one decision per screen, always with a preview and a footer summary.
- Pools: 12 skins, 14 hair colours, 6 cuts, 2 builds, 4 faces; 16 childhoods; 8 cities; 2 faces × 13 drives; 126 gifts (20 basic, 54 mixed, 52 apex) or none.
- To add a drive: add a `TraitDef` (slot "drive") in `origin.ts`, its id to `TraitId`, and a `walkEffects` line.

## 15. Minigame variety

- Seven skill kinds, plus the duel. Each one tests a different hand, and the market gear edge maps them to the timing or pattern family:

  | Kind | What you do |
  |---|---|
  | Strike (timing) | Hit the band |
  | Read (pattern) | Watch the order, then repeat it |
  | Crack (hack) | Stop each ring's notch under the gate |
  | Rescue | Triage the windows |
  | Press | Read the reporter, pick the tone |
  | Hold | Keep the load in a moving zone |
  | Chase | Switch lanes to dodge wrecks and grab sparks (seeded, always one reachable lane) |

- Engine call sites name a **verb** (stunt, drill, dispatch…), not a kind.
  - `minis.ts` holds the weighted pool for each verb: kind, titles, subtitles and kind-specific outcome text.
  - The signature power's tags add weight, and the last kind played is down-weighted.
  - New content is data rows only.
- Every mini carries a seed (deterministic layouts) and an element skin from the signature power.
- All of them share `MiniFrame`: badge, difficulty, full-height arena, READY intro and result stamp. Each scores 0–1, so the engine's win/partial/lose bands stay unchanged.

## 16. Soft caps on the quiet stats

- Joy, Mind and Karma gains pass through `gentleCap`: full value up to 50, easing to about 8% at 100.
- Joy above 70 drifts back down monthly, so a great mood takes upkeep.
- A secret identity halves fame gains. Mentoring has per-year diminishing returns.
- Chapter goals are only offered when they are still reachable, and money goals count cash plus property ("worth").

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
