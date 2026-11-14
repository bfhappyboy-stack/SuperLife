# SuperLife — Design

This is the owner's design, written down as faithfully as possible. Where the code adds things the design never asked for, they are listed separately at the end under "Existing extras". Open questions are in `BACKLOG.md` under "Design ambiguities".

**Platform:** a mobile game. It should feel clean and smooth: big touch targets, no jank, tidy layouts at about 390px wide, and quick flows. It should be fun, with plenty of well-designed minigames. Every choice (powers, upbringings, traits, cities, looks, dialogue, quests) should offer a large pool of options.

## 1. Power combination

- The player can mix **any 2 unlocked powers**.
- **Mixing unlocks at 15** (owner's call, 2026-11-03). Before 15 the Braid Book shows a locked card with the years to go and a **Skip to 15** button; the engine refuses `mix|` and the Teachers' braid lesson (`mentors.ts` `MIX_AGE`, `mixLock`).
- **Mentors (15+).** On the 15th birthday a mentor arrives, picked by God Mode legend first (Ben Parker, Alfred, Ho Yinsen, Leonard Samson, Jonathan Kent, Antiope, Erskine, Odin, Zuri, Ogun, Jay Garrick), then upbringing (12), then city (8), then a fallback coach. One lesson a month: a **guided braid** (prefers the required chain), a **drill** with a mastery boost, or a **study night** (learn a recipe). Bond grows with lessons and raises the boost (up to +50%), with diminishing gains.
- **Powers are rare (owner's call, 2026-11-10 eve).** Every non-story source passes `library.ts` `pageBlock`: no new power before 15, 2 years between pages, 5 years between new bases, a base needs a held power at rank C/B/A (2nd/3rd/4th base), max 4 bases, a braid needs both halves at rank C. New powers are projects (`Game.training`): 8 lessons to wake a base, 6/10 for a Gen 1/2 braid, one power lesson a month, solo at half pace. Mentors can **Wake a power** (bond 35, required chain first); heroes need bond 50. Growth is mostly depth: two techniques per base power (rank C and A) and +7 mastery for every power each birthday. Target: ~4 powers by 60 in normal play, ~6 when chasing them.
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

## 18. Money & Life: a living economy (2026-11-10 night)

- **One hub:** Work ▸ Money, tabs Home / Markets / Business. Top card: net worth, cash, last month's net, assets, where you live. Life ▸ Today shows a live headline ticker that opens it.
- **Everything moves monthly**, deterministic from the seed (`hash(seed, month, key)`), never touching the engine RNG. Series: house prices per district (3 per city), 9 stocks, 6 goods, base rate. log-level += regime drift + noise − reversion × (level − anchor). Anchors grow slowly (homes ~1.2%/yr, stocks ~2.2%/yr) so 80-year lives stay readable.
- **Headlines are data** (`NEWS` in `economy.ts`) and **fights are news**: a villain win/loss moves the district, the local stock, Cape Capital and steel, once a month.
- **Housing is the life-sim spine:** rent or buy any tier in any district; mortgage, sell, let, upgrade, pay off; arrears → eviction / foreclosure. Homes give real perks (Comfort, Recovery, Cover, Training edge ≤8%).
- **Diminishing returns everywhere:** trading fees + slippage, rent renewals capped ±8%/yr, lending capped by income, upkeep scales with value, one fight shock a month.
- **Wages are monthly** when the hub is on. Legend starts: Wayne Manor and Stark Mansion are estates (no upkeep), their company shares sit in trust (no sale, no dividends) until 18 / 21.
- The old Market keeps engine items (tests, saves); the UI calls it Shop and its property tab Bases.
- **Roommates (increment 3):** spare rooms by tier; equal rent split on a lease, a room's rent in an owned home; they cost Cover (eyes on the double life) and bring trait perks, monthly closeness and small events; a nosy one can find the suit (kept if close, told if not). Family estates are never for sale.
- **Businesses (increment 2):** six data-driven kinds (truck → newspaper), max three. Books each month = revenue (city × staff factor × upgrades × reputation × market demand × 6-month ramp) − supplies − wages − premises − upkeep. Staff factor has diminishing returns; sale ≈ 2 years of profit (floor: half invested). Legend companies (Wayne Enterprises, Stark Industries) are board-run: no staff, a chair's draw tied to the share price, locked until 18 / 21, not for sale.

- **Cost of living (2026-11-10 am):** from 18, monthly: $700 × city price level + 25% of a monthly wage + $350 per child; half at the family home or an estate; never pushes cash below $0 by itself. A heavy shift pays 3% of the yearly wage.
- **Money report (2026-11-10 am):** every Play step that passes time carries `card.money` (ledger by group + off-ledger cash = the real cash change, net worth change, moves in what you own, top headlines). The economy keeps 12 monthly ledgers.
- **Managers, morale, events (2026-11-10 pm):** a business can have one manager (one trait: Steady / Hustler / Penny-wise / Fixer; ~7% of base sales a month) who keeps its name up and runs it while you live in another city (unmanaged and away: −20% sales, reputation and morale slide). Crew morale is one bar (70 neutral, ±0.4% sales a point) driven by staffing, the manager, a proud name and whether anyone is in charge. About once a year something happens (viral moment, big order, inspection, a rival nearby for 6 months, scandal, staff walking out when morale is low), deterministic from the seed, at most one per 4 months. Villain wins bring foot traffic; losses can bring looters unless your own security firm guards the block.
- **Chains (owner's call, 2026-11-10 eve):** any business but a family company can open one site per city (all 8). Each site keeps its own staff, upgrades, reputation, morale and manager, and sells to its own city's market (±15% from that city's house prices). The chain shares a brand: sales lift that flattens (max +12%), reputation +2 a city (max +10), and four chain-wide upgrades. Brakes: each city costs +45% of base more, branches ramp for 9 months, the newest site must be a year old before the next, and head office grows as (sites − 1)^1.35. Target: a full chain takes ~15–20 years of steady play. Three businesses max counts brands, not sites.
- **Squeeze hint (2026-11-10 pm):** three red months while paying for a home → one line naming the fix (a roommate and what they'd pay, or a cheaper place).
- **Hero tie-ins (2026-11-10 am):** security firm (rep 50+) → villain leads (+4% next villain fight); tech start-up (rep 50+) → prototypes (+3%, hold 2). Fights move markets (wins lift a district and a local stock, losses dent them). Estates take no roommates.

## 19. Life Flow: how time passes (owner's call, 2026-11-10 night)

**The problem.** "3 moves, then Next month" made every month a chore: about 720 taps of Next month for a 60-year life, with moves that felt arbitrary and were wasted if you didn't spend them. Childhood dragged; adulthood (money, homes, businesses) needed monthly attention.

**Options weighed.**
1. *Energy / stamina budget with varied action costs* — more to learn, every action needs a new cost, and it changes fight, training and economy balance everywhere. Rejected: not simpler.
2. *Weekly or seasonal planner* (a schedule of routines plus a few free actions) — clear, and it removes busywork, but on its own it's still one tap per period.
3. *Continuous flow* (Play / fast-forward auto-runs your routine and pauses on events) — the most addictive feel ("one more season"), but a real-time timer on a phone fights with reading and choices.
4. *Age-scaled time step* (a year as a kid, a season as a teen, a month as an adult, plus a jump to the next interesting thing) — fixes the slow childhood directly.

**Chosen: 2 + 3 + 4 together, turn-based.** One **Play** button. One tap moves life one step: **a year as a kid (to 13), a season from 13** (Auto pace), or Month / Season / Year if you pin one in **Time ▸ Play pace**. During the step your **Routine** (up to three everyday things you pin, in order, on Life ▸ Today; empty = your habits) fills every block of free time you didn't spend yourself, the economy ticks every month (rent, wages, roommates, businesses, markets), and Play **stops the moment the life needs you**: the power reveal, a story beat (legend canon too), a case, a fight, any choice event, a new chapter, the mentor at 15, low health or a relationship in crisis. A season that would cross a birthday stops at the birthday.
- **Why this one:** simplest to explain ("set your routine, press Play, the game stops for what matters"), the "one more season" loop is addictive, childhood flies (birth to 15 in about 13–20 taps instead of 180 months), and a decade of adult life is about 50 taps including every stop, against about 120 Next month taps before (sims: mystery, Spider-Man, Batman to 60).
- **The 3 blocks stay underneath** as "free time": three blocks a month you can spend on anything special *now* (a fight, a date, a stunt, moving house, opening a business, hanging out with a roommate). That keeps every tuned number (fight win rates, training, economy) exactly as it was, and unused time is no longer wasted.
- **Balance rule (unchanged from fast-forward):** an auto-played block is never better than playing it yourself: routine minis land a little under your own average, and fights, stunts, crime, tryouts and big choices are never auto-played. A Play season is the fast-forward season (same months, same dice; tested).
- **Money, homes and businesses** fit naturally: trading, upgrades, hiring and letting are instant and free; moving day, opening day, working a shift and hanging out take a block of free time; the ledger runs monthly inside every step and shows on the recap.
- **Recaps:** a plain season or year ends on a recap card (months passed, what your routine did, stat changes, rank-ups, money, notes). Big stops (mentor, chapter, low health, relationship crisis, death) keep the full fast-forward summary. Skip to 15 and Skip to birthday stay in the Time sheet.
- **Ship switch:** `FLOW_ON` in `src/game/flow.ts` (on). Off restores Next month + Skip exactly.
- **Pace (decided 2026-11-10 am):** adults stay on a **season** per tap by default; Month stays one tap away in Time ▸ Play pace for players who want to manage money monthly. Sims: a season keeps a decade of adult life to ~50 taps, and the money report makes a season's money legible, so monthly taps aren't needed to follow it.
- **Routine slots (2026-11-10 am):** habits, **Shift at <your business>** and **Time with <person>** can all be pinned (up to 3).

### Interrupt less (owner's call, 2026-11-10 eve)

- Auto pace: a year per tap until 13, a season from 13 to 17, a year from 18. Month and Season stay one tap away.
- Adult Play stops only for what needs you: canon and legend beats, cases and arcs, chapters, power moments, life-changing offers, grief and crises, bosses, fights you could lose, and your arch-enemy once a year. Everyday moments, friendly drop-ins and routine fights are settled (taste-scored, fights a little under your average) and listed on the recap. **Auto fights** is opt-in (off by default, owner's call 2026-11-10 late): on, Play settles street fights you're even with or better; off, Play stops for real fights. **Easy wins never stop Play** (owner's call 2026-11-11): a street foe you outclass (your power level 1.5+ above theirs, not a boss) is a clean win settled into the year recap ("Street fight: Rook (won, an easy win)") with Auto fights on or off. Every life-sim fight card offers **Fight it out** or **Auto-resolve** (a little under your usual result, odds shown).
- **Ties (People screen):** parents, partner, friends, teammates and grown kids have a fixed temper (Steady, Proud, Warm, Scattered, Slippery), a trust meter (starts 50) next to closeness, and a short history. You can lend ($200 / $1,000 / $5,000 over 3 / 6 / 12 months; three misses in a row and they stop paying) and borrow (closeness 50+, trust 40+, paid from your cash monthly). Close people sometimes ask for help; the ask waits on their card for a year and never stops Play. Deterministic, never the engine dice (`ties.ts`).
- Target: adult taps 18–40 about half of before (sims: −54% to −68%).
- **Yearly growth (owner's call 2026-11-10 eve, narrowed 2026-11-11):** on each birthday every power you **used that year** gains a little mastery (`RIPEN_EXP` 7). Used = it gained mastery from training, a lesson, a case or a drill; a braid lesson works both halves; a fight counts the powers behind the moves you threw (your whole six on an Auto-resolve). Unused powers don't grow by themselves, and yearly growth never grants a power. Saves from before this rule ripen everything once on their first birthday, then track use. **Legend exception (owner's call 2026-11-11, built 2026-11-14):** a God Mode legend's signature powers (the canon kit you hold, e.g. Superman's Super Strength, Flight and Super Durability) gain `LEGEND_DRIFT_EXP` 3 each birthday even unused; a used one gets the normal 7 instead, never both (`engine.ts` `legendSignature`). Mystery lives and kit-less legends (Batman) have no exception. An idle legend's untouched kit reaches about rank C (82) by 45.
- **Dating (Priority 0a, owner's call 2026-11-11; `dating.ts`, `DATING_ON`):** all on the one People screen.
  - *Meet* (People ▸ Meet, from 16, single, one block of free time): Someone at work (needs a job), At the gym (health 40+), A night out (18+, $60), Try a dating app. A spark (base by place + looks + mood) puts a **crush** in your Circle; at most two at a time.
  - *Flirt* (on the crush's card, free, once a month each): Make them laugh (Smarts), Be bold (Looks and fame), Be sweet (Kindness: karma and mood). Each person secretly likes one style; the card shows Good odds / Fair odds / Long shot, which is the clue. A hit raises interest (more if it's their thing), a backfire lowers it, and at 0 they stop answering. A crush's bar is their interest; left alone it cools 10 a year and they move on (a recap line, never a stop).
  - *Ask out* at interest 50+ (a block, $50 dinner, odds shown): yes makes them your partner at **Dating** and other crushes fade; no costs 15 interest.
  - *Stages* on the partner's card, one clear next step each: Dating → **Make it official** (closeness 55) → Together → **Move in together** (65, your own place, a block; splits the bills: cost of living × 0.8) → **Propose** (72, $700 ring) → Engaged → **Small wedding** ($400) or **Big wedding** ($6,000, the city hears) → Married. **Break up** at any step; a **Divorce** takes a quarter of your cash. A partner who drifts below 16 still ends it.
  - *Children* stay "Start a family" (21+, closeness 65 or married). Old saves: a partner reads as Married if wed, else Dating.
  - *The mask at home* (`mask.ts`, `MASK_ON`; 2026-11-11 pm): only for a secret-identity hero with a power (a public hero's partner always knows). A partner who doesn't know builds **suspicion** each month (Dating 0.5, Together 1.1, sharing a home 2.2, with a little jitter). At 40 they **think you're seeing someone** (once, on the Play card; jealousy then nicks closeness, about −8 a year). From 55 they may **find the suit**: their card shows "found the suit" with **Tell them the truth** (odds shown) or **Deny it** (trust −15); it waits up to a year, and silence counts as a deny. Each find is at least 30 months after the last, and a deny that leaves trust at 10 or less ends it ("one lie too many"); a player who ignores it loses the partner after about three finds (sims: jealous at ~26–27, found at 29, gone at ~36 after moving in at 25). You can also **Tell <name> you're a hero** first (a block of free time; odds from closeness, trust and temper): yes means they know and keep it (closeness +8, trust +6, no more suspicion); no means closeness −12 and a year before you can try again, and a partner left at closeness 25 or less walks out. Deterministic (hash of the person and month), so it never moves the engine's dice. Old saves: no fields means they start wondering from 0.
  - *After the truth* (`mask.ts`, `AFTER_ON`; owner's call 2026-11-11 eve, built 2026-11-14): a partner who **knows** (secret-identity hero only) with closeness 60+ and trust 40+ **patches you up** after a villain fight, at most once a month: Health +4 and Joy +2 after a win, Health +8 and Joy +3 after a loss or draw (Joy through the usual soft cap). It shows as its own line on the fight card, as "<name> patched you up after N fights" on the Play recap, and as "✚ Patches you up after fights (N times)" on their card. When a partner who knew becomes an ex (you break up, divorce, or they end it at closeness under 16) on **bad terms** (closeness under 35 or trust under 30), they **sell your story**: the secret trait becomes a public (`loud`) mark for good, Fame +12 / Reputation −6 / Joy −8 through the usual curves, a front-page line on the card and a major history entry. A good-terms ex keeps the secret ("Keeps your secret" on their history). An ex who never knew has nothing to sell. Saves: optional `Person.patchedAt`, `patches`, `soldStory`, `Game.storySold` (a malformed `storySold` is dropped on load).
  - *Next stages:* jealousy (a second crush while partnered), the secret identity as a relationship risk (a partner who finds the suit), dates as routine slots, and kids as heirs for the legacy will.

## 20. Character art (owner's call, 2026-11-11 art pass)

- **One style for the whole cast:** painted, cinematic, night city, rim light in the power's colour, full figure on a 9:16 card. Legends (11), named villains (49) and Mystery heroes (18, by power family × sex) all share it.
- **Approach:** painted cards over a rigged vector figure. A data-driven painted set (family × sex, later × villain archetype) gives every procedural character a designed look at the cost of one asset per combination; pose feedback (attack lunge, hit shake, guard ring, KO grey) is applied to the card. Assets are inlined webp data URIs in `src/assets/art/*.ts` (text-only pushes carry them) and load as lazy chunks.
- **Stage cutouts (art2):** on the duel stage, Mystery heroes and street villains are full-body transparent cutouts (rembg on the paintings, or villains painted on a plain backdrop) standing on the floor with a ground shadow and power-colour rim light; the city painting is the backdrop. Street villains pick their archetype by power (`streetCutKey`), falling back to an unpowered thug.
- **Rules:** a card appears from 16; on the duel stage and the gift card a teen (13–15) stands as their cutout, slightly shorter (86/90/94%). Under 13, the powerless and the wardrobe keep the paper doll.
- **Faces (2026-11-14 pm):** every procedural face (you in the header, family, friends, partners, mentors, rival capes, the creator) is a painted SVG bust (`PaintedFace.tsx`): night-city bokeh, key light upper left, rim light in the power colour from the right, real jaw, clothes, grain and vignette. Mentor looks are data (`MENTOR_FACE`). `PAINTED_FACES` in `Portrait.tsx` is the off switch. `src/game/heroArt.ts` picks the key; `components/game/heroArt.tsx` draws the `Standee`. `ART_HEROES` is the off switch.

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
- **Painted portraits (2026-11-09):** the 18 Arena villains now have painted 540×960 portraits in the same style as the legend heroes (`src/assets/art/villain-<id>.ts`, lazy chunks of ~40–60 kB each). `VillainArt` shows the painting when one is registered and falls back to the vector card while it loads or when a rogue has none yet, so adding a rogue's painting is one file + one loader line. Frames: `card` / `tall` show the figure, `head` zooms ×2.3 on the face for avatars. **All 49 villains are painted since 2026-11-09 night** (the 31 legend rogues joined: Mysterio to Mirror Master). Paintings whose face sits lower than the upper third (Brainiac, Grodd, Justin Hammer, the Leader, Mirror Master, Surtur, Vulture, Silver Samurai) set their own head-crop origin in `PAINTED_HEAD_Y` (`VillainArt.tsx`). The vector cards stay as the loading fallback.


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

A legend whose fighting comes from **gear, not a power**, fights with a kit instead of street or generic power moves. Data in `src/game/kits.ts` (`KITS`), one entry per legend: **Batman — Utility Belt**, **Iron Man — Armory**, **Spider-Man — Web-Shooters**, **Thor — Mjolnir**, **Captain America — The Shield**, **Flash — Speed Force**, **Superman — Kryptonian Arts**, **Wonder Woman — Amazon Arms**, **Hulk — Gamma Rage**, **Black Panther — Panther Habit**, **Wolverine — Claws & Healing Factor**. Every God Mode legend now has a kit.

- Kit moves are ordinary moves with a `kit:<legend>` source. They unlock **by age** (`minAge`), rank up by use, and only that legend's life can equip them. More final pieces than slots, so the six stays a choice.
- **Upgrades** (`upgrades: <older piece>`): when a newer piece arrives, the older one retires from the shelf and the new one takes **its slot** in the six (the Mark I Plating slot becomes the Nanotech Shell). An upgrade always keeps the slot's style. The birthday banner says "Armory upgrade: X replaces Y".
- **Replaces** (`replaces: { powers?, styles?, line }`): a kit can stand in for moves the legend's powers would give. Those power moves leave the shelf and can't be slotted (the shelf says why). Iron Man's Armory replaces Energy Projection and Flight moves (his repulsors and jets are the suit); Spider-Man's Web-Shooters replace every **guard** his powers would give, so his strikes and tricks come from his powers and every guard is a web. A legend with powers must declare what its kit replaces, so kits never just pile on.
- Strength: base power + `edge` × power level (default 0.25; Iron Man 0.40; Thor 0.55, a god's hammer trains like a power; Flash 0.55, the kit is his power; Cap 0.30; Wonder Woman 0.20, her arms are trained; Hulk 0.15, his gamma moves start strong; Black Panther 0.25; Wolverine 0.15; Spider-Man's webs 0.10, they win on statuses; powers 0.55, street 0.35) + 1 per decade of wear from 25 (max +3).
- From `ultimateAge` (Batman, Iron Man, Thor and Cap 30) the kit's strongest equipped move is the Ultimate (same rules as §17 item 6). `leadsUltimate` lets the kit's Ultimate win over the power's (Iron Man's Unibeam, Thor's God Blast, Cap's Liberty Strike). A kit that leads the Ultimate should make its Ultimate piece an upgrade of an early strike, so it is in the six on the day it arrives. `ultimateAge: null` leaves the power's Ultimate alone.
- **New pieces slot themselves into a lopsided six** (2026-11-09 night): on the birthday a non-upgrade piece arrives, if its style has at most one move in the six and another style has three or more, it replaces the weakest non-kit move of that crowded style (`slotKitArrival`). A balanced six is never touched.
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

**Spider-Man — Web-Shooters** (replace his power guards; his power keeps the Ultimate)

| Age | Web | Kind | Status | Upgrades |
|---|---|---|---|---|
| 15 | Web Shield | guard | — | |
| 16 | Web Net | guard (status) | Frost override | |
| 19 | Web Yank | guard | Expose override | |
| 23 | Web Cocoon | guard (status) | Frost override | Web Net |
| 26 | Web Wall | guard | shield · Ward | Web Shield |
| 32 | Spider-Sense Snare | guard (status) | Shock override | Web Yank |

**Thor — Mjolnir** (replaces Super Strength moves; God Blast is the Ultimate from 30)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 10 | Shieldwall | guard | force | |
| 12 | Practice Blade | strike | force | |
| 14 | Warrior's Feint | trick (dash) | speed | |
| 17 | Mjolnir Strike | strike | lightning · Shock | Practice Blade |
| 18 | Hammer Throw | trick (dash) | lightning · Shock | Warrior's Feint |
| 21 | Hammer Spin | guard | wind · Frost | Shieldwall |
| 26 | Bifrost Call | trick (status) | light · Expose | |
| 30 | God Blast | strike | lightning · Shock | Mjolnir Strike |
| 33 | Thunder Landing | strike (area) | lightning · Shock | |
| 42 | Stormbreaker Cleave | strike | lightning · Shock | |
| 44 | Hammer Catch | guard | Expose override | |
| 48 | Odinforce Ward | guard | shield · Ward | Hammer Spin |

Before his powers wake (16) the yard pieces carry him; once they wake his lightning and storm moves fill the rest of the six beside the hammer's three slots.

**Captain America — The Shield** (replaces Aegis Shell moves; Liberty Strike is the Ultimate from 30)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 10 | Trash-Can Lid | guard | force | |
| 12 | Brooklyn Jab | strike | force | |
| 14 | Duck and Weave | trick (dash) | speed | |
| 21 | Vibranium Shield | guard | shield · Ward | Trash-Can Lid |
| 22 | Shield Bash | strike | Expose override | Brooklyn Jab |
| 23 | Shield Throw | trick (dash) | force | Duck and Weave |
| 26 | Ricochet Volley | strike (area) | force | |
| 28 | Commando Feint | trick (status) | psychic · Expose | |
| 30 | Liberty Strike | strike | Expose override | Shield Bash |
| 33 | Assemble | trick (status) | Ward override | |
| 40 | Unbreakable Guard | guard | shield · Ward | Vibranium Shield |
| 45 | Worthy | strike | lightning · Shock | |

Braided powers that contain Aegis Shell (Holy Hull) still bring their own moves.

**Flash — Speed Force** (replaces Super Speed and Thunder Sprint moves from the wake at 25; Infinite Mass Punch is the Ultimate from 33)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 25 | Lightning Jab | strike | lightning · Shock | |
| 25 | Speed Mirage | guard | speed | |
| 25 | Phase Step | trick (dash) | warp · Expose | |
| 27 | Tornado Arms | guard | wind · Frost | Speed Mirage |
| 29 | Lightning Throw | strike | lightning · Shock | |
| 31 | Speed Steal | trick (status) | Frost override | |
| 33 | Infinite Mass Punch | strike | Expose override | Lightning Jab |
| 36 | Rewind | trick (status) | Ward override | |
| 38 | Time Remnant | guard | shield · Ward | Tornado Arms |
| 45 | Speed Force Storm | strike (area) | lightning · Shock | |

**Superman — Kryptonian Arts** (replaces Super Strength, Flight and Super Durability moves from the wake at 13; edge 0.55; his strongest kit strike is the Ultimate from 30)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 13 | Bulletproof | guard | force | |
| 13 | Heat Glare | strike | fire · Burn | |
| 13 | Blur | trick (dash) | speed | |
| 15 | X-Ray Read | trick (status) | Shock override | |
| 17 | Freeze Breath | guard (status) | ice · Frost | |
| 18 | Heat Vision | strike | fire · Burn | Heat Glare |
| 20 | Flying Tackle | strike (dash) | speed | |
| 24 | Super-Breath | trick (area) | wind · Frost | Blur |
| 28 | Man of Steel | guard | shield · Ward | Bulletproof |
| 30 | Solar Flare | strike | Burn override | Flying Tackle |
| 34 | Thunderclap | strike (area) | force | |
| 38 | Fortress Training | trick (status) | psychic · Expose | |

**Wonder Woman — Amazon Arms** (2026-11-09 night; replaces Super Strength, Flight and Aegis Shell moves; edge 0.20; Godkiller is the Ultimate from 30; her stretch powers still bring theirs)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 10 | Bracer Block | guard | force | |
| 12 | Training Spear | strike | force | |
| 14 | Lasso of Truth | trick (status) | Shock override | |
| 17 | Antiope's Feint | trick (dash) | speed | |
| 19 | Sword of Athena | strike | Expose override | Training Spear |
| 21 | Amazon Shield | guard | shield · Ward | Bracer Block |
| 24 | Bracer Clash | strike (area) | lightning · Shock | |
| 27 | Lasso Takedown | trick (dash) | light · Expose | Antiope's Feint |
| 30 | Godkiller | strike | Expose override | Sword of Athena |
| 33 | Bullet Deflection | guard | Expose override | |
| 38 | Golden Perfect | trick (status) | Shock override | Lasso of Truth |
| 44 | Aegis of Themyscira | guard | shield · Ward | Amazon Shield |
| 48 | Zeus's Thunder | strike (area) | lightning · Shock | |

**Hulk — Gamma Rage** (2026-11-09 night; from the wake at 28; replaces Super Strength, Super Durability and Juggernaut Mass moves; Regeneration and his stretch powers still bring theirs; edge 0.15; World Breaker is the Ultimate from 33)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 28 | Hulk Smash | strike | force | |
| 28 | Gamma Hide | guard | force | |
| 28 | Gamma Leap | trick (dash) | wind · Frost | |
| 30 | Hulk Roar | trick (status) | Expose override | |
| 31 | Gamma Clap | strike (area) | wind · Frost | |
| 33 | World Breaker | strike | Expose override | Hulk Smash |
| 34 | Madder, Stronger | guard | life · Ward | Gamma Hide |
| 40 | Ground Quake | trick (area) | Frost override | |
| 44 | Banner's Read | trick (status) | Shock override | |

**Black Panther — Panther Habit** (2026-11-09 night; Dora Milaje drills from 16, the herb wakes his powers at 18; replaces Super Strength, Kinetic Impact and Juggernaut Mass moves; his senses and stretch powers still bring theirs; edge 0.25; Kinetic Release is the Ultimate from 30). The kit starts at 16, not in childhood, so his rogues (Klaw, Man-Ape) still wait until he can fight back.

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 16 | Okoye's Stance | guard | force | |
| 16 | Challenge Strike | strike | force | |
| 16 | Panther Step | trick (dash) | speed | |
| 18 | Vibranium Claws | strike | shadow · Expose | Challenge Strike |
| 19 | Kinetic Weave | guard | force | Okoye's Stance |
| 21 | Kimoyo Beads | trick (status) | Shock override | |
| 23 | Panther Pounce | trick (dash) | shadow · Expose | Panther Step |
| 26 | Claw Flurry | strike (area) | force | |
| 30 | Kinetic Release | strike | energy · Shock | Vibranium Claws |
| 33 | Charged Habit | guard | shield · Ward | Kinetic Weave |
| 38 | Bast's Shadow | trick (status) | shadow · Expose | |
| 42 | Wakanda Forever | strike (area) | energy · Shock | |

**Wolverine — Claws & Healing Factor** (2026-11-09 night; from the wake at 12; replaces Regeneration and Pain Map moves; Super Senses and his stretch powers still bring theirs; edge 0.15; Berserker Barrage is the Ultimate from 30)

| Age | Piece | Style | Element / status | Upgrades |
|---|---|---|---|---|
| 12 | Bone Claws | strike | force | |
| 12 | Healing Factor | guard | life · Ward | |
| 13 | Feral Lunge | trick (dash) | speed | |
| 16 | Scent Track | trick (status) | Shock override | |
| 20 | Snikt Flurry | strike (area) | force | |
| 25 | Adamantium Claws | strike | Expose override | Bone Claws |
| 25 | Adamantium Skeleton | guard | force | |
| 28 | Berserker Charge | trick (dash) | shadow · Expose | Feral Lunge |
| 30 | Berserker Barrage | strike | Expose override | Adamantium Claws |
| 34 | Unkillable | guard | life · Ward | Healing Factor |
| 40 | Fastball Special | trick (area) | Expose override | |
| 46 | Weapon X Instinct | trick (status) | Shock override | Scent Track |

A kit that starts at the wake (Flash, Spider-Man, Superman, Hulk) doesn't need childhood coverage; a kit that starts in childhood (Batman, Iron Man, Thor, Cap, Wonder Woman) covers strike, guard and trick by 14.

**Rogues wait (2026-11-09 pm):** a legend's own arch-rogue never calls out the hero (the monthly "arch-month" pin) before they can fight back: the powers waking or the kit's first piece, whichever is first. Before, kid Barry was called out by Reverse-Flash (level 9) almost every month from 11 to 24; kid Bruce Banner the same until 28. Canon beats and boss fights still happen on schedule.

**Rogue edge:** a preset can set `rogueEdge` (Spider-Man +2; Captain America +2 since 2026-11-09 night): added to every signature move of that legend's rogues in life-sim fights. His gallery was written like a powerless hero's (moves 4–7) while he fights with three powers.

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
