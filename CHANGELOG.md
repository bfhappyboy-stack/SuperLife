# Changelog

## 2026-10-31 (night): Mystery Life, God Mode legends, clearer chapter goals (`devbot/2026-10-31-night`)

### Mystery Life is now the main mode (`mystery.ts`, `engine.ts`, `Legends.tsx`)

- New lives start on a mode screen. **Mystery Life** is marked Recommended. **God Mode** is the sandbox.
- In a Mystery Life the power is sealed at birth (`hiddenGift`). It wakes on a random birthday from 7 to 15.
  - Upbringing and traits tilt which power it is. About 1 life in 8 gets a braided Gen 1 gift.
- **The reveal:** a full-screen overlay with element-coloured rays, a flash, bursts, the power name and a story line. It only closes after the animation has finished.
- **Before the reveal:**
  - Drills, mixes, teachers, year powers, sparks and grants are all locked (`giftsSealed`).
  - Powers ▸ Your gift shows a "Sealed power" card instead.
- **Childhood stays playful:**
  - From age 4, Life ▸ Today ▸ *Chase the strange feeling* finds one omen a month. Omens are element-flavoured and framed by your home (Joy +2, Mind +1).
  - Mystery lives also get birthday omen banners.
  - After two omens you can **Call it** (Powers ▸ Call it). Call it right and the reveal adds +0.25 power and says so.
- The reveal adds a bonus "drill your new power" goal to the current chapter.

### God Mode legends (`presets.ts`, `engine.ts`, `Legends.tsx`, `src/assets/art/hero-*.ts`)

- **Four legends, using real names for now:** Spider-Man (Earth-3145), Batman (Earth-3939), Iron Man / Tony Stark (Earth-6380) and Hulk (Earth-1962-G).
  - Each is a multiverse variant with its own twist, a portrait, themed decade chapters, a canon family and signature villains with authored movesets. Tony's villains include Ultron.
- **Canon beats** arrive on set birthdays as choices: follow, bend or break. Results are tracked (`canonKept`, `canonBent`, `canonBroken`) and shown on the chapter card as an Earth badge.
  - Fight choices become boss duels against the canon villain.
  - Canon losses (Uncle Ben; Thomas and Martha Wayne; Howard and Maria Stark) really happen unless you break canon.
- **Powers:**
  - Legend powers wake at their canon age: the Bite at 15, the Cave at 24, the gamma blast at 28.
  - Batman takes a human vow: no powers ever, with gadget and training goals instead.
- **Build your own:** pick up to 3 powers (at most one Apex), any city, upbringing and look, plus up to 2 earned traits from day one.
  - The Gen 2 cap, the six-move loadout and the Fire + Speed → Light Speed (+ Strength → Lightning Strikes) chain all still apply.
- **Four more legends (8 in total):** Superman (Earth-3838), Wonder Woman (Earth-1941), Captain America (Earth-4101) and Thor (Earth-8017).
  - Each has a portrait, a variant twist, 8 themed decades, 4 rogues with 4 authored moves each, a canon loss, and late canon from 58 to 72 with a variant ending.
  - Superman: Lex grows up next door; Lex, Zod, Doomsday, Brainiac. Wonder Woman: Themyscira has a UN seat; Cheetah, Circe, Ares, Medusa.
  - Captain America: Peggy takes the second dose; Red Skull, Winter Soldier, Zemo, Crossbones. Thor: Loki is the firstborn heir; Loki, Malekith, Hela, Surtur.
  - The mode screen's God Mode card fits all 8 thumbnails at 390px, and the "N legends" chip counts the presets.
- Everything is offline data; no `XAI_API_KEY` is needed.

### Legends keep their own rogues (`presets.ts`, `engine.ts`)

- In a legend life every arch-enemy, rival, villain visit, "trouble in the city" and cape introduction now comes from that hero's own rogues gallery. Generic villains (Taxman and friends) never appear.
  - Rogues debut at a sensible age (`villainDebut`: an explicit `from`, else their first canon beat).
  - If nobody new has debuted, an already-met rogue returns; there is no fallback to strangers.
- **New rogues, each with 4 authored moves:**
  - Spider-Man: Kraven, Mysterio, Vulture.
  - Batman: Riddler, Scarecrow, Penguin.
  - Iron Man: Justin Hammer.
  - Hulk: Red Hulk, The Maestro (a level-10 late-life boss).

### Life after 60 (`presets.ts`, `arcs.ts`, `engine.ts`)

- **Legends get 4 late beats each, from 58 to 73:** successors (Miles-style heir, the Bat-family, Ironheart, Skaar), final showdowns (Kraven's last hunt, the Joker's last laugh, Ultron reborn, the Maestro) and a closing beat.
- **Variant endings:** the closing beat ends the saga by your dominant path (canon, bend or break). Each ending names your Earth. If you die first, the ending is written into your death story instead.
- **Regular lives get two late cases:**
  - *The Reunion Tour* (63+): the old team, one last tour, and Encore.
  - *The Lighthouse* (71+): a quiet coast town, The Undertow, and a final Riptide fight.

### The braid book has room (`library.ts`, `engine.ts`, `PowerLab.tsx`)

- Seekers used to own ~130 powers by 80. Now the book holds **4 + age÷4 pages** (6 at 8, 14 at 40, 24 at 80) up to **30**.
- **Diminishing returns:** 3 new pages a year under 8 powers, 2 under 16, then 1. The count resets on each birthday.
- Mixes, mentor lessons, sparks and grants respect the room. Story powers (the reveal, canon grants, God Mode picks, the starting gift) never count against it. The Gen 2 ceiling is unchanged.
- Powers ▸ Book shows a pages meter ("12/12 pages · 2/2 this year") and the honest reason when it's full. Mix and Learn are disabled instead of silently failing, and no month is spent.
- **Sims:** seeker policies now end lives with 21–27 powers (was ~130).

### Reveal juice (`RevealCard.tsx`, `FirstMove.tsx`, `sfx.ts`, `Legends.tsx`, `engine.ts`)

- **Shareable reveal card:** a share button next to *Embrace it* draws a 1080×1350 card on a canvas (power name, element and tier, Earth and age, the story line, extra powers, and the legend's portrait for God Mode heroes). Phones with the Web Share API share the PNG directly; everything else gets *Save image*. Works offline with no API key.
- **First Move mini:** after *Embrace it*, a 3-2-1 countdown, then six element sparks to tap before they fade (about 8 seconds). The score gives a one-time drill bonus to the new power (+6 to +20) and a banner ("Your first move lands clean."). It can be skipped, and it never repeats (`flags.firstMove`).
- **Sound and haptics, kept cheap and safe:** soft WebAudio blips only on taps (mobile browsers need a gesture anyway), a mute toggle saved on the device, and short `navigator.vibrate` pulses. All of it is guarded and silent where unsupported (e.g. iOS vibration).

### Clearer chapter goals (`chapters.ts`, `Chapters.tsx`)

- Every goal shows its exact path (tab ▸ section ▸ button) with a tap icon, plus an x/y progress count.
- Goals you can't work on yet are greyed out with a lock tag: "Unlocks at N", or "Unlocks when your power wakes".
- **Reachability:** power goals are only picked for a chapter if the power can wake at least 2 years before it ends. Omen goals only appear in Mystery lives.

### Fixes

- Mode screen: the Mystery Life and God Mode cards no longer shrink and clip their buttons on short screens. Legend card names have a text shadow so they read over bright portraits.

- **Save loading:** the old starter-bundle cleanup no longer strips God Mode picks or Mystery/legend powers.

## 2026-10-31 (pm): mid-life case files, a real bond curve, fewer repeats (`devbot/2026-10-31-pm`)

### Story arcs (`arcs.ts`, `origin.ts`, `engine.ts`)

- Four new six-step cases carry the story through the 30s, 40s and 50s:
  - **The Understudy** (Second Skin, from 28, needs 1 closed case, Legacy +4);
  - **Dead Air** (Static Bishop, from 35, Legacy +5);
  - **The Long Winter** (The Frost Warden, from 44, Legacy +6);
  - **Old Debts** (The Heir, from 54, needs 2 closed cases, Legacy +8).
- Each city's dossier now lists one of them as a local case.
- New data fields: `foeLevel` (mid-life foes hit harder than the teen 4.2/6.4 defaults), `minCleared`, `legacy` and `era`.
- Closing a case with `legacy` grants it and says so.
- Drill steps that name no power now check your focus power's mastery.
- The Cases action list shows at most 3 open files, labelled by era.

### Hero bonds (`heroes.ts`, `engine.ts`)

- Every bond gain goes through one curve, `bondStep`: gains shrink as the bond rises, and each hero has a yearly room (5 points at bond 0, 1 near 100).
- Bonds above 40 drift down 2 a year when you don't see that hero, never below 40.
- Why: bonds stalled at about 32, so the "trust" goal never fired. Once talk counted, they shot to 100 by 20. The curve now gives about 53 at 20, 72 at 30, 82 at 40 and 92 at 50.

### Repetition (`prompts.ts`)

- New phase-keyed prompt pools (young, prime, crisis, late) for the gym, books, patrol, League call, villain pins, a villain dropping in, a night out and a cape visiting you. The same line never shows twice in a row.
- The cape-visit line ("finds you on purpose") was the top repeat at 50–80 times a life. It now rotates through 3–4 lines per phase.

### Case file UI (`PowerLab.tsx`)

- The case file is now a dossier card:
  - a header tinted by the villain's element, with the era and how many cases you've closed;
  - a six-node step track with an icon for each step kind, ticks for finished steps and a glow on the current one;
  - a "Now" panel with the step brief and what closing the case pays.
- With no case open, the card lists up to 3 open files with element tiles, era and a "this city" tag.

### Tests

- `arcs.test.ts`: checks that cases are well formed (6 steps, a boss at the end, real heroes, legacy foe powers), that dossiers name real cases, mid-life gating, the bond curve, and that prompts don't repeat.

## 2026-10-31 (am): minigame variety, reachable chapter goals, soft caps (`devbot/2026-10-31-am`)

### Minigames (`minis.ts`, `Minigame.tsx`, `MiniKit.tsx`, `MiniGames.tsx`, `miniUtil.ts`, `haptics.ts`)

- Four new skill games, each with its own rules, art and scoring:
  - **Crack**: rotating lock rings; stop each notch under the gate.
  - **Rescue**: a 3×3 burning facade; tap people before their ring runs out, never the fire.
  - **Press**: reporter card with a tell, a question, a timer and 4 tone answers (bold, humble, witty, straight). Each reporter rewards different tones.
  - **Hold**: press and hold to keep a load inside a moving gold zone, with momentum.
- Data-driven verb pools (`VERB_POOLS`): stunt, drill, spar, tryout, dispatch, go loud, bout, hero spar and relic each pick a weighted kind, title, subtitle and kind-specific outcome text.
  - Signature power tags add weight (physical favours Hold, control favours Crack, mental favours Read).
  - The kind you just played is down-weighted to 25%.
- Every mini gets a seed and an element skin from your signature power, which tints the arena.
- Shared `MiniFrame`:
  - a kind badge with difficulty pips, title and rule line;
  - an arena that fills the screen (the old layout left a big gap);
  - a READY intro and a FLAWLESS/CLEAN/SCRAPED/BOTCHED result stamp.
- Timing and Read are restyled into the same frame.
- Haptics: short `navigator.vibrate` buzzes on hits, misses and wins (guarded; silent where unsupported).
- The market's gear edge still works: new kinds map to the timing or pattern edge family.
- Result for a celebrity life (20 seeds): timing fell from about 85% of minis to about 30%. The rest is press, rescue, hold, crack, read and duels.

### HUD

- The power chip shows your signature combo power (for example Light Speed) with its element icon, colour and mastery rank letter, instead of the legacy "A + B" fusion name.

### Balance (`engine.ts`)

- `gentleCap`: positive Joy, Mind and Karma gains shrink above 50 (to about 8% at 100). Joy over 70 settles a little each month and over 80 each year.
- A secret identity halves fame gains.
- Mentoring: each extra rookie in a year is worth 60% of the last, and a large legacy grows slower.
- School smarts and joy now go through the same caps.

### Chapter goals (`chapters.ts`)

- New `worth` metric (cash plus property). Cushion, fortune and "don't go broke" use it, so buying a house no longer fails your goal.
- "Don't go broke" now asks for 60% of your starting worth, and its label says so.
- Goals that can't be met are no longer offered:
  - an arc goal when no arc is open;
  - smart when Mind is already 88+;
  - fame goals when you are near the top;
  - loud fame for secret heroes.

### Tests

- New `minis.test.ts` (8 tests): pool data, `pickMini` determinism and repeat down-weighting, press rounds and scoring, `vary`, `gentleCap`, mentor diminishing returns, and the worth snapshot. `test:game` is now 47/47.

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
