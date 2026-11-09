# SuperLife — Design

This is the owner's design, written down as faithfully as possible. Where the code adds things the design never asked for, they are listed separately at the end under "Existing extras". Open questions are in `BACKLOG.md` under "Design ambiguities".

**Platform:** a mobile game. It should feel clean and smooth: big touch targets, no jank, tidy layouts at about 390px wide, and quick flows. It should be fun, with plenty of well-designed minigames. Every choice (powers, upbringings, traits, cities, looks, dialogue, quests) should offer a large pool of options.

## 1. Power combination

- The player can mix **any 2 unlocked powers**.
- **Mixing unlocks at 15** (owner's call, 2026-11-03). Before 15 the Braid Book shows a locked card with the years to go and a **Skip to 15** button; the engine refuses `mix|` and the Teachers' braid lesson (`mentors.ts` `MIX_AGE`, `mixLock`).
- **Mentors (15+).** On the 15th birthday a mentor arrives, picked by God Mode legend first (Ben Parker, Alfred, Ho Yinsen, Leonard Samson, Jonathan Kent, Antiope, Erskine, Odin, Zuri, Ogun, Jay Garrick), then upbringing (12), then city (8), then a fallback coach. One lesson a month: a **guided braid** (prefers the required chain), a **drill** with a mastery boost, or a **study night** (learn a recipe). Bond grows with lessons and raises the boost (up to +50%), with diminishing gains.
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

- 16 elements (`game/elements.ts`) each with a colour, glow and travel type (orb, beam, bolt, ripple, streak). Every power and move resolves to an element; unknown falls back to force. Since Stage 2 the element also picks the status a winning hit leaves (`battle.ts` `ELEMENT_STATUS`).
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

## Arena purses (owner's call, 2026-11-03)

- If one of your 3 Arena picks is your **active life's** character, the match pays money into that life: win base Rookie $600, Pro $1,500, Legend $3,500 (online counts as Pro), +25% for a 2–0 sweep, a 20% appearance fee for a loss, half pay under 18.
- **Diminishing returns:** purses 1–2 each day pay 100%, then 70%, 50%, 30%, then the purse is closed for the day. A match pays once (keyed by seed and picks), even after a reload.
- The payout shows on the results screen, lands in the life's money, and adds a history line ("Arena win, 2–1, against X…"). Teams of only legends and villains earn nothing. Data and rules: `src/game/arena.purse.ts`.

## Villain cards

- Every villain is meant to get an illustrated card used in the Arena draft, round intros, the life-sim FIGHT! intro and the fight itself. All 49 villains (the 18 Arena villains plus every legend rogue) have vector cards now (`VillainArt.tsx`, typed on `VILLAIN_ART_IDS`; the last 15 landed 2026-11-03 night). In life-sim fights an illustrated rogue stands in the ring as a card, with hit-flash and lean-in animations.
- **Painted portraits (2026-11-09):** the 18 Arena villains now have painted 540×960 portraits in the same style as the legend heroes (`src/assets/art/villain-<id>.ts`, lazy chunks of ~40–60 kB each). `VillainArt` shows the painting when one is registered and falls back to the vector card while it loads or when a rogue has none yet, so adding a rogue's painting is one file + one loader line. Frames: `card` / `tall` show the figure, `head` zooms ×2.3 on the face for avatars. The 31 other legend rogues still use vector cards; next in order of how often they are fought.


## 17. Battle redesign (owner's call, 2026-11-04 — Stage 1 ships 2026-11-07)

Fights are shared by the life sim and Arena (same 6 equipped moves, same strike/guard/trick core). The owner gave free rein to make them creative, unique, finely polished, harder and deeper. **Polished beats sprawling.** Exactly 6 equipped moves stay. Online Arena stays a pure engine: deterministic from seed + action log.

### Life difficulty (Stage 1 — shipped)

Chosen at life start (mystery, God Mode builder, and legend pickers). Persisted on the save as `difficulty`. Default **Normal**. Old saves without the field migrate to Normal.

| Id | Feel | Foe HP | Foe damage | AI hate-read |
|---|---|---|---|---|
| Story | Learn the tells | ×0.88 | ×0.82 | 0.30 |
| Normal | Harder than the old baseline | ×1.20 | ×1.15 | 0.48 |
| Hard | Half the street brings a twist | ×1.40 | ×1.34 | 0.58 |
| Legendary | Every foe has a twist | ×1.57 | ×1.47 | 0.70 |

(Retuned 2026-11-07 pm with statuses and combos in: Normal lands ~0.58 for a 60% player. Habit-bait chance `aiRead`: 0 / 0.25 / 0.40 / 0.55.)

Hard and Legendary also bump the foe's power level slightly before HP is rolled.

**Street twists (2026-11-08 pm):** `streetTwist` is the share of ordinary (non-boss, unnamed) street villains who fight with their power's twist from the boss gimmick table: Story 0, Normal 0, **Hard 0.5, Legendary 1**. Picked by a stable hash of foe name + age + month (no RNG drift). Harder lives are different fights, not only bigger numbers. (Retuned with this: Hard ×1.30/×1.24 → ×1.40/×1.34, Legendary ×1.45/×1.36 → ×1.57/×1.47.) Arena's Rookie / Pro / Legend ladder is separate — this curve is for life-sim fights only.

### Momentum (Stage 1 — shipped)

A second resource on the life-sim duel, next to Energy:

- Cap **5**. Starts at **0**.
- **+1** when you win the style edge (strike > trick > guard > strike).
- **+1 extra** (guard break) when a Trick beats a Guard.
- Breath never builds momentum; a successful breath-counter still does not (breath is recovery).
- At **3+** momentum, your next **winning** hit (not breath) **Bursts**: spend 3 for **×1.45** damage. Since 2026-11-07 pm a lost or even trade no longer wastes it; the momentum stays banked. The UI says "Burst on next edge" and marks the answer cards.
- Pure and deterministic: same seed + move log → same fight. Safe for future Arena online replay.

Energy stays (cost per move, +3 on every turn including breath, cap 10). Momentum is the "am I pressing or banking?" decision Energy never gave.

### Statuses, combos and habit reading (Stage 2 — life sim shipped 2026-11-07 pm)

Shared rules live in `src/game/battle.ts` (pure, deterministic), so Arena can use the same book.

- **Statuses ride on elements.** A move that **wins the style edge** leaves its element's status on the loser; a status-kind move also lands it on an even trade. Ward lands on the winner instead. A move can override with `applies` (data). Foes use their move's element, or their power's.

  | Status | Elements | Effect (2 turns) |
  |---|---|---|
  | Burn | fire, arcane | loses 4% max HP at the end of each turn |
  | Frost | ice, storm | hits 15% weaker |
  | Shock | lightning, energy | tells can't lie (beats fog, feint and habit bait); −1 energy a turn |
  | Expose | psychic, shadow, warp, light, gravity | takes 15% more damage |
  | Ward | shield, life | next hit taken −35%, then spent; landing it burns off Burn |

  Force, speed and stretch are pure damage. Max **2** statuses a side (a third pushes out the oldest). **Catch a breath** also shakes off your oldest harmful status.
- **Mix-up combo.** Win the edge three times, **never the same style twice running**, with no lost edge or breath between (an even trade holds the chain): a **Finisher** adds 60% of your strongest move's power and +1 Momentum. The stage shows three combo pips.
- **Habit reading.** Throw the same style twice running (breath doesn't count) and Normal / Hard / Legendary foes may fake a tell that baits it (25% / 40% / 55%, `aiRead`; Story never). The stage warns "Habit: Guard ×2 · tells may be bait", and the log owns up when a tell was bait. Shock cancels it.
- **Runway.** Both sides' HP ×1.35 (`DUEL_HP_SCALE`) and case bosses ×1.45 HP (`BOSS_HP_MULT`), so a fight lasts ~6 turns instead of ~4.5 and bosses are a real step up.
- **Feel.** BURST and FINISHER get a cinematic slash + word over the stage with shake and haptics; statuses pop as words on the fighter they hit and sit as pills under the HP bars; move cards show the status they leave.

**Arena (shipped 2026-11-07 pm, increment 3).** Arena bouts use the same book: Momentum (edge +1, guard break +1, Finisher +1), Burst on the next winning hit at 3+, the status table above, and the mix-up Finisher (scaled by `ARENA_SCALE`). A Shocked leader can't fake its tell. Passives still stack on top. All of it sits in the bout state, so online replay stays deterministic.

### Signature system (full vision — later stages)

Designed now so Stage 1 doesn't paint us into a corner. Each stage must ship complete and playable.

1. **Resources (Stage 1 done):** Energy + Momentum. Later: Stamina (optional third bar for long boss phases) only if phone HUD still reads clean.
2. **Status effects (Stage 2 — life sim done):** Burn, Frost, Shock, Expose, Ward (Slow stays the one-turn status-move effect). Max 2 a side. Element-driven with a per-move `applies` override, never hard-coded per villain.
3. **Combos / chains (Stage 2 — life sim done):** shipped as the mix-up Finisher (three won edges, never the same style twice running). Still to do: Gen1/Gen2 "Kin" synergy (owning both parents of a braid tags its moves and widens the chain).
4. **Counters & guard breaks (Stage 1 partial):** Breath still counters Strike. Trick-vs-Guard now pays Momentum. Stage 2: Guard Break at Momentum 4+ ignores 50% of a Guard stance once. (Not built as of 2026-11-08 am: with auto-Burst at 3, Momentum rarely reaches 4, and life-sim foes have no guard-stance cut to pierce. Revisit with the manual-Burst call.)
5. **Environment / stage (Stage 3 — shipped 2026-11-07 night):** Each city maps to one stage tag (`alley`, `rooftop`, `lab`, `throne`, `pier`, `open`) that nudges one element (+10% damage when that element's move wins the edge). Readable chip on the fight header. Arena uses a neutral `arena` tag (energy). Data in `battle.ts` (`CITY_STAGE`).
6. **Signature ultimates (Stage 3 — shipped 2026-11-07 night):** One Ultimate among the six, never a 7th button. Life-sim: the strongest equipped move of your **focus** power, once that power is mastery 4+. Arena: each fighter's strongest move. Armed only at full Momentum (5); costs all 5 Momentum + the move's Energy; deals ×2.0 (no Burst stack on the same swing). Cinematic ULTIMATE beat on the stage. Shared helpers in `battle.ts`.
7. **Enemy AI (Stage 2 — life sim done):** habit reading with a fair on-screen warning (see above). Arena's lead/fake AI is separate.
8. **Multi-phase bosses (Phase 3 + regroup shipped 2026-11-08 am):** Existing gimmicks stay as Phase 2. **Phase 3:** each legend's *final canon boss* (the rogue in that legend's last canon fight beat) gets a second gimmick that **replaces** the first when they drop to **25%** HP (`PHASE3_AT`; a revive boss reaches it after getting back up). Only in that legend's own life, from the age of that last beat on, in canon fights and case-boss fights. Data: `VILLAIN_PHASE3` in `presets.ts`; armor already shattered stays shattered.

   | Legend | Final boss (age) | Phase 2 | Phase 3 |
   |---|---|---|---|
   | Spider-Man | Green Goblin (69) | enrage | swarm · Pumpkin Bombs |
   | Batman | Joker (66) | feint | fog · Laughing Gas |
   | Iron Man | Ultron (63) | revive | adapt · Learning Algorithm |
   | Hulk | Maestro (67) | adapt | enrage · Gamma Overload |
   | Superman | Zod (63) | charge | regen · Yellow Sun |
   | Wonder Woman | Ares (67) | charge | swarm · Phobos and Deimos |
   | Captain America | Red Skull (63) | enrage | feint · Cosmic Cube |
   | Thor | Loki (67) | feint | armor · Jotun Ice |
   | Black Panther | Klaw (66) | charge | armor · Solid Sound |
   | Wolverine | Lady Deathstrike (67) | regen | enrage · Berserker Programming |
   | Flash | Reverse-Flash (66) | adapt | charge · Speed Force Strike |

   **Regroup:** losing a boss fight (score under a third; a split doesn't count) puts that boss on a **one-month** cooldown, saved on the life as `regroup` (old saves load without it; a malformed one is dropped). The case's boss step is locked with "Regrouping after the loss. X again next month." on the case file and the step card; winning the rematch clears it. Canon beats stay one-shot as before.
9. **Tempo / initiative (Stage 4 — interrupt shipped 2026-11-08 am):** Winner of the previous edge acts "fast" (their projectile travels first visually; already true). **Interrupt:** when the foe's charged hit is coming and you hold **Momentum 4+**, a **Strike** cuts in first: the charge deals nothing, your Strike counts as winning the edge (×1.55, statuses, combo link, +1 Momentum), and it costs **1 Momentum**, paid before Burst is checked (so 4 → 3 still Bursts on that swing). Guard still braces (×0.15) at any Momentum; breath still works. Same rule in Arena: the follower interrupts a charged Strike lead (Bane, Zod). The HUD says "Strike to interrupt (−1 momentum)", the Momentum row shows INTERRUPT READY, and strike cards carry an Interrupt tag. Helpers: `canInterrupt` in `battle.ts`, `interruptReady` in `duel.ts`.
   - Charge cadence (fixed 2026-11-08 am): the charged hit comes on the second turn of phase 2 and then every third turn (`CHARGE_EVERY = 3`). Before, it charged every turn after the first.
10. **Strategic loadouts (Stage 3 start — coverage shipped 2026-11-07 night):** Exactly 6 moves, two sets (A/B). Auto-fill and street padding prefer a missing strike/guard/trick so every tell has an answer; the Moves shelf warns when the equipped six still lacks a style (e.g. "No guard move: strike tells have no answer"). Authored early moves for durability / force-field / aegis / strength favour coverage. Future: a "Burst window" tag on authored finishers so the Momentum spend feels authored, not generic.

### Legend kits (shipped 2026-11-08 pm; Armory 2026-11-09 pm)

A legend whose fighting comes from **gear, not a power**, fights with a kit instead of street or generic power moves. Data in `src/game/kits.ts` (`KITS`), one entry per legend: **Batman — Utility Belt**, **Iron Man — Armory**.

- Kit moves are ordinary moves with a `kit:<legend>` source. They unlock **by age** (`minAge`), rank up by use, and only that legend's life can equip them. More final pieces than slots, so the six stays a choice.
- **Upgrades** (`upgrades: <older piece>`): when a newer piece arrives, the older one retires from the shelf and the new one takes **its slot** in the six (the Mark I Plating slot becomes the Nanotech Shell). An upgrade always keeps the slot's style. The birthday banner says "Armory upgrade: X replaces Y".
- **Replaces** (`replaces: { powers?, styles?, line }`): a kit can stand in for moves the legend's powers would give. Those power moves leave the shelf and can't be slotted (the shelf says why). Iron Man's Armory replaces Energy Projection and Flight moves (his repulsors and jets are the suit). A legend with powers must declare what its kit replaces, so kits never just pile on.
- Strength: base power + `edge` × power level (default 0.25; Iron Man 0.40; powers 0.55, street 0.35) + 1 per decade of wear from 25 (max +3).
- From `ultimateAge` (Batman 30, Iron Man 30) the kit's strongest equipped move is the Ultimate (same rules as §17 item 6). `leadsUltimate` lets the kit's Ultimate win over the power's (Iron Man). `ultimateAge: null` leaves the power's Ultimate alone.
- Saved kit lives can enter the Arena with the same six (passive by their first power, else Read the Room).

**Batman — Utility Belt**

| Age | Gadget | Style | Element / status |
|---|---|---|---|
| 10 | Keysi Guard | guard | force |
| 12 | Batarang | strike | shadow · Expose |
| 14 | Smoke Pellet | trick (status) | shadow · Expose |
| 18 | Grapnel Swing | trick (dash) | speed |
| 22 | Armored Cape | guard | shield · Ward |
| 25 | Explosive Gel | strike | fire · Burn |
| 28 | Detective Mode | trick (status) | psychic · **Shock** override |
| 32 | I Am Vengeance | strike | shadow · Expose |

**Iron Man — Armory** (replaces Energy Projection and Flight moves; Unibeam is the Ultimate from 30)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 10 | Tin-Can Shield | guard | force | |
| 12 | Pulse Glove | strike | energy · Shock | |
| 14 | Flash Flare | trick (status) | light · Expose | |
| 17 | Arc Taser | trick (status) | lightning · Shock | |
| 20 | Chest Reactor | strike | energy · Shock | |
| 22 | Mark I Plating | guard | shield · Ward | Tin-Can Shield |
| 22 | Mark I Flamethrower | strike (area) | fire · Burn | |
| 24 | Repulsor Blast | strike | energy · Shock | Pulse Glove |
| 24 | Boot Jets | trick (dash) | speed | Flash Flare |
| 28 | JARVIS Targeting | trick (status) | psychic · Expose | Arc Taser |
| 28 | Shoulder Missiles | strike (area) | fire · Burn | Mark I Flamethrower |
| 30 | Unibeam | strike | energy · Shock | Chest Reactor |
| 36 | Nanotech Shell | guard | shield · Ward | Mark I Plating |
| 40 | Hulkbuster Brace | guard | force | |

Auto six by age: 10–21 the pieces as they arrive (street padding until six); 22–29 Plating, Repulsor/Pulse, Jets/Flare, JARVIS/Taser, Reactor, Missiles/Flamethrower; from 30 Unibeam takes the Reactor slot. At 40 seven final pieces compete for six.

### Feel on phone (Stage 1 partial)

- Animated HP bars with delayed ghost trail + hit flash (refined Stage 1).
- Momentum diamonds next to Energy.
- Impact numbers and stage shake already exist; keep them.
- Console-quality direction: every new widget must work at 390×844 with ≥44px targets and no horizontal overflow.

### Regen (2026-11-08 pm)

A healer (regen gimmick) heals 7% a turn in Phase 2. **Any won edge stops that turn's heal; a trick or status move stalls it for two turns.** Hints say "Win edges to stop it." (Before, the hint said "a trick move stalls it", which baited players into throwing tricks into strike tells.) Arena's Healing Factor passive is unchanged.

### Balance targets (engine sims)

With a hint-following player (answer the tell, Burst when it wins the edge):

| Difficulty | Target win rate vs street foes | vs case bosses |
|---|---|---|
| Story | ~90% | ~80% |
| Normal | ~70% | ~55% |
| Hard | ~50% | ~35% |
| Legendary | ~30% | ~18% |

Report actuals in PLAYTEST.md each pass. Tune `DIFFICULTY` in `src/game/difficulty.ts` — data only.

### What must never break

- Exactly 6 equipped moves; street padding when empty.
- Gen 2 hard cap; required Light Speed → Lightning Strikes chain.
- Mixing locked until 15.
- Online Arena: pure engine, seed + action log.
- Fully playable without `XAI_API_KEY`.
