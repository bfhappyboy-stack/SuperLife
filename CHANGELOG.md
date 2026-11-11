# Changelog

## 2026-11-11 (art): painted characters for everyone who isn't a legend (`devbot/2026-11-11-art`)

Built on `origin/devbot/2026-11-11-pm` (44df36a, the same content as main 3857fea). Each increment is typechecked, `npm run test:game`, built and loaded at 390×844 before push.

### Increment 1: the Mystery hero is a painted character, in the ring and in the Arena

- **Why (owner, 18:53):** "change all the crap characters so they all have better designs… especially if you aren't playing god mode." In a Mystery life the player fought as the paper doll while God Mode legends and named villains stood in the ring as paintings.
- **18 painted Mystery heroes** (`src/assets/art/mystery-<family>-<m|f>.ts`, 540×960 webp, ~60 KB each, lazy chunks): one original suited hero per power family (fire, ice, storm, mind, might, swift, veil, life, arcane) and sex, painted in the same night-rooftop style as the legend and villain cards, so the whole cast matches.
- **Battle stage:** from 16, your Mystery hero stands in the ring as their painted card (`Standee` in `components/game/heroArt.tsx`), picked by your main power's family and your sex, with the same pose cues as before (lunge on attack, shake on hit, guard ring, grey on KO). Hero-side NPC fighters (sparring partners, rival capes) wear the card for their power. Legends and named villains are unchanged; street villains still use the figure for now.
- **Arena:** saved Mystery lives use the painting on their poster and in the ring instead of the silhouette or paper doll.
- **Kept:** under 16, the powerless and the wardrobe/creator screens keep the paper doll (it shows the clothes you pick). `ART_HEROES` in `src/game/heroArt.ts` turns the layer off. No rules or saves change.
- **Tests:** +3 (`art.test.ts`: every family has a painting for both sexes, kids and no-family keep the doll, NPC powers map to a family).

## 2026-11-11 (pm): the mask at home (`devbot/2026-11-11-pm`)

Built on `origin/devbot/2026-11-11-am` (100f35c). Each increment is typechecked, linted, `npm run test:game`, built and loaded at 390×844 before push.

### Increment 1: partners and the secret identity (Priority 0a, dating stage 2)

- **Why:** dating stage 1 made partners real, but a secret-identity hero could live with someone for decades and never be asked about the bruises. The brief asks for jealousy and secret-identity risk with partners; this is both, as one readable thread on the partner's card.
- **Suspicion (`maskMonth`):** a partner who doesn't know you're a hero wonders more each month, fastest once you share a home. At 40 they think you're seeing someone (one Play card line; jealousy then slowly costs closeness). From 55 they may find the suit.
- **They found the suit:** a gold line on their card, and two rows: **Tell them the truth** (odds shown; finding it softens the shock a little) or **Deny it** (trust −15, the questions go quiet, not away). It waits up to a year and never stops Play; silence counts as a deny. The next find is at least 30 months off, and a deny that leaves trust at 10 or less ends the relationship.
- **Tell them first:** **Tell <name> you're a hero** (a block of free time; odds from closeness, trust and their temper). Yes: they know and keep it ("Knows you're a hero. Your secret is safe with Silas."), closeness +8, trust +6. No: closeness −12, a year before trying again, and a partner already distant may walk out.
- **Card line:** a partner's card now says where the secret stands: "Doesn't know you're a hero", "Wondering about the late nights", "Thinks you're hiding someone", or "Knows you're a hero". Rows use a mask icon (fixes crossed swords on "Tell Silas…", again from "Marchetti" matching "arc").
- **Public heroes and powerless lives:** nothing changes. Flag `MASK_ON` in `src/game/mask.ts`.
- **Saves:** new optional fields (`Person.knowsSecret`, `suspicion`, `toldAt`, `foundAt`, `Game.maskScene`); old saves start at 0 suspicion.
- **Sims (6 Mystery seeds, secret identity, moved in at 25, Play only to 45, never answering):** jealous at 26–27, found the suit at 29, then again at ~32 and ~35, gone at ~36. A player who tells a close partner early mostly gets a yes (about 7 in 10 at closeness 70, trust 50).
- **Tests (`mask.test.ts`, 6):** who keeps a mask; suspicion by stage, jealousy and a find; telling (a block, yes/no, the retry wait); truth/deny rows and the silent deny; a distant partner can walk out and Play card news shows once; three finds and they leave with the jealousy line once; old saves. 323 game tests pass.

## 2026-11-11 (am): easy wins stay quiet, growth follows use (`devbot/2026-11-11-am`)

Built on `origin/devbot/2026-11-10-late` (86be4d7). Each increment is typechecked, linted, `npm run test:game`, built and loaded at 390×844 before push.

### Increment 2: dating, first stage (Priority 0a)

- **Why:** the owner picked dating next for people. Before, dating was one dice roll ("Go on a date": a partner or a bad-date line), then Propose, with nothing in between and no way to end it yourself.
- **Meet (People ▸ Meet):** four places, one block of free time each: Someone at work, At the gym, A night out ($60, 18+), Try a dating app. A spark adds a **crush** (pink card, "Crush · Met at the gym") to your Circle; two at most; none while you have a partner.
- **Flirt:** three choices on the crush's card, free, once a month per person: Make them laugh (Smarts), Be bold (Looks and nerve), Be sweet (Kindness). Everyone secretly prefers one; the odds label (Good odds / Fair odds / Long shot) is the hint. Hits raise interest, backfires lower it, and at 0 they stop answering. A neglected crush cools 10 a year and moves on quietly.
- **Ask them out** at interest 50 ($50 dinner, a block, odds shown): yes = partner at Dating; no = −15 interest.
- **Stages on the partner card** (the role line reads "Partner · Living together"): Make it official (55) → Move in together (65, needs your own place; cost of living ×0.8 while you live together) → Propose (72, $700, now makes you Engaged) → Small wedding $400 or Big wedding $6,000 → Married. Break up any time; Divorce takes 25% of cash. New history lines for each big step.
- **Fix:** person cards picked action icons from the person's name ("Marchetti" matched "arc" and drew crossed swords on Give a gift). Icons on a person's card now come from the action only; dating rows use a heart (a cracked heart for Break up).
- **Saves:** no migration needed; partners without a stage read as Married (if `flags.married`) or Dating. `DATING_ON` in `src/game/dating.ts` turns it all off and restores the old Go on a date.
- **Tests (`dating.test.ts`, 8):** places and gates, a spark adds a crush, flirt odds follow stat and taste, both outcomes happen, a backfire at the bottom ends it, asking out needs interest and clears other crushes, the full ladder to married then divorce (with the lease gate), shared living costs, old-save stages, a neglected crush moves on. 316 game tests pass.

### Increment 1: easy wins settle quietly; yearly growth only for powers you used

- **Why:** owner's calls from 2026-11-11. With Auto fights off, Play still stopped for street fights you'd clearly win, which is exactly the busywork "interrupt less" was meant to remove. And yearly growth raised every power you held, even ones you never touched, so a power could climb ranks while you ignored it.
- **Easy wins (`routineFight` in `skip.ts`):** a street foe you outclass (power level 1.5+ above theirs, not a boss) is now a clean win settled into the recap with Auto fights on or off; the recap line reads "Street fight: Rook (won, an easy win)". Even fights still stop unless Auto fights is on; bosses, your arch-enemy and tougher foes always stop. The Time sheet's Auto fights OFF line now says "Play stops for real fights… Easy wins and small everyday moments still go in the recap."
- **Yearly growth follows use (`markUsed` / `ripenUsed` in `engine.ts`, `Game.usedPowers`):** a power counts as used this year when it gains mastery from training, a lesson, a case step or a drill, when a braid lesson works it (both halves), or when you throw one of its moves in a fight (an Auto-resolve counts your whole six). On the birthday only used powers ripen (+7 mastery), then the list clears. Still never grants a power.
- **Old saves:** no `usedPowers` yet means "not tracked": that first birthday ripens every power once (as before), then tracking starts. No migration needed.
- **Tests:** easy win settles with Auto fights off, an outclassed boss still stops, an even fight stops when switched back off; only used powers ripen, unheld ids are ignored, nothing used means no growth, old saves ripen once; a fight marks the power behind the move thrown. 308 game tests pass.
- **Sims (Play only, 0 → 40):** see PLAYTEST. Street foes in a normal life are rarely outclassed, so this mostly quiets fights for strong lives and late careers; unused second powers now stay where you left them unless you drill them.

## 2026-11-10 (late): fights are your call; money between you and your people (`devbot/2026-11-10-late`)

Built on `origin/devbot/2026-11-10-eve` (bae21f9). Each increment is typechecked, linted, `npm run test:game`, built and loaded at 390×844 before push.

### Increment 2: money between you and your people (Priority 0a, first slice)

- **Why:** the owner wants family and friends that matter, with lending and borrowing, repayment schedules, people who don't pay, family asking for help and trust effects. This is the smallest piece that does all of that on the People screen; dating, invites and events come next.
- **Personality (`temperOf`):** everyone you can talk money with (parents, partner, friends, teammates, grown kids) has one of five tempers, fixed for life and shown on their card: **Steady** (pays back on the dot), **Proud** (hates owing anyone), **Warm** (means well, sometimes late), **Scattered** (forgets, not on purpose), **Slippery** (always has a story). Parents lean Steady or Warm.
- **Trust (`Person.trust`, starts at 50):** a second meter next to closeness, shown as "Trust N" (red under 40, green from 70). Paying back raises it, missing payments lowers it. Under 40 they won't lend you money.
- **History (`Person.history`):** the card shows the last thing that happened between you ("Last: You lent $1,000, age 26.").
- **Lend money:** $200 / $1,000 / $5,000 (what you can afford), paid back monthly over 3 / 6 / 12 months, closeness +3. Each month's payment arrives or doesn't by their temper and how close you are (Steady at closeness 50 pays ~94% of months, Slippery ~34%). Three misses in a row and they **stop paying** (trust −15, closeness −6, the rest is gone). On the card: "Theo owes you $833 of $1,000 · $167/mo · 5 to go", with **Ask for it back** (once a month: they may pay the rest, closeness −3) and **Let it go** (closeness +5, trust +4).
- **Ask to borrow:** from 16, from someone at closeness 50+ who trusts you (40+): parents up to $5,000, a partner $2,000, friends $1,000. It comes out of your cash monthly; a month you can't pay costs trust −6, and three of those mean they bring it up at dinner (closeness −10). **Pay it all now** clears it (trust +8).
- **Family asking for help:** now and then (about one ask every few years with a few close people, only when you have $400+), a parent or friend asks to borrow $300–1,500 for something real (a car repair, rent, a vet bill). It waits on their card for up to a year with **Lend $600** / **Not this time** (closeness −4). It never stops Play.
- **Play cards:** an ask, a loan paid off or a friend who stopped paying shows at the top of the next Play card, once (`tieNews`).
- **Rules:** deterministic (a hash of the loan and the month), so it never moves the engine's dice and old sims are unchanged; one open loan per person; when someone dies their debt is dropped. Flag `TIES_ON` in `src/game/ties.ts`.
- **Saves:** old saves load with no loans, no ask and trust 50 for everyone.
- **Sims (4 Mystery seeds given $20k at 18, Play to 40, saying yes to every ask):** 1–3 asks each; 7 loans, 6 paid back, 1 stopped paying ($600 lost). Tie news on 14 of 149 adult Play cards.
- **Tests:** +8 (`ties.test.ts`: tempers and trust, a steady payer repays, slippery people default far more often (≥50% vs ≤15%) and it costs trust, forgive and chase, borrowing blocks / monthly payments / missed payments / pay off, asks and answers over 20 years, the engine month and the `tie|` action, Play card news shown once). 306 game tests pass.

### Increment 1: Auto fights is opt-in, and every fight card asks (owner's call, 20:23)

- **Why:** "Auto fights must be a choice." The eve pass turned Auto fights on for everyone, so Play quietly settled fights the player may have wanted to play.
- **Off by default (`autoFightsOn`, `Game.autoFightsSet`):** new lives start with Auto fights off. It only counts as on when the player flipped the switch themselves. With it off, Play stops for every street fight (even a sure win); bosses, your arch-enemy and tougher foes stop either way. Small everyday moments (a landlord, a billboard, a friendly drop-in) still settle into the recap.
- **Fight card (`FightChoice`, `autoResolveFight`):** every life-sim fight opens with two buttons above the arena: **Fight it out** (play it, the bar goes away) or **Auto-resolve**, which shows what to expect ("Likely a win / a scrape / a loss") and settles the fight now, a little under your usual result (a foe you outclass by 1.5+ power levels is a clean win). The result card starts "Auto-resolved: <foe>." Auto-resolved fights don't count toward your fighting habit, so they don't drag down later auto scores.
- **Time sheet:** the switch now has an ON / OFF badge and says what each means ("Play stops for every fight. You pick Fight it out or Auto-resolve. Small everyday moments still go in the recap.").
- **Saves (`migrateAutoFights`):** a save that never touched the switch goes off. The eve build stored the switch only when the player flipped it, so a saved `true` means they turned it on by hand: kept on. A saved `false` stays off.
- **Cost in stops (sims, 6 Mystery seeds, Play only, 18 → 40):** Auto fights off 40 fight stops in total (~7 per life), on 33; Play taps plus stops per life about 60 either way. Spider-Man (God Mode, seed 4) 75 both ways.
- **Yearly power growth kept (`RIPEN_EXP` 7, every held power on each birthday):** checked by sim that it's noticeable but not runaway and never grants a power (it only adds mastery to powers you already hold). Main power's mastery at 40: 407 on average with it, 313 without (training is ~77% of it). Power level at 40: 3.4–4.4 with, 3.5–4.8 without. Powers held at 40: 2–4 either way. What it changes: your second and third powers grow (C at 40) instead of sitting at D 0 unless you drill them by hand.
- **Tests:** +2 (`flow.test.ts`: Auto-resolve and its odds; the migration keeps a hand-flipped choice), street-fight and adult-taps tests run both ways. 298 game tests pass.

## 2026-11-10 (eve): chains in every city, fewer stops, rarer powers (`devbot/2026-11-10-eve`)

Built on `origin/devbot/2026-11-10-pm` (8cdff73). Each increment is typechecked, `npm run test:game`, built and loaded at 390×844 before push.

### Increment 3: powers are rare, trained and nurtured (owner's call, 15:26)

- **Why:** "it should be pretty rare that you get a new power… Super powers are the most rare and powerful thing in this world and should be trained and nurtured." An audit (6 Mystery seeds, Play only) found ~18 powers by 60. Most came from hero visits ("Ask for a power", 42 of them), the yearly power offer (25) and trainer-lesson / lab / alley events.
- **One gate for every source (`library.ts` `pageBlock`, `awakenBlock`, `braidBlock`):** no new power before 15 (your manifested gift is the only one). After a new page, 2 years must pass before the next one. A new *base* power also needs 5 years since the last one, a power you hold drilled to rank C (B for a third base, A for a fourth), and at most 4 bases (legends excepted). A braid needs both halves at rank C. The book cap is now 1 under 15, then 3 + 1 per 4 years (max 10). Story, canon and God Mode picks skip the gate. A life with no power can still find its first one from 10 (the old human route).
- **Long training instead of instant grants (`trainSession`, `Game.training`):** waking a base power takes 8 monthly lessons; a braid takes 6 (Gen 1) or 10 (Gen 2). A mentor's bond boosts the pace (a guided braid lands in 4–6 lessons). Braiding alone goes at half speed. Only one power lesson a month across mentor, heroes and the book. The project and its progress show in the Braid Book and on the Mentor card.
- **Mentor:** new **Wake a power** lesson (bond 35). It aims at the required chain first (Super Speed for Fire Control, Super Strength once you hold Light Speed), so Fire Control + Super Speed → Light Speed → Lightning Strikes is reachable by dedicated training (tested month by month).
- **Heroes:** waking a power with a hero needs bond 50 (was 28 for an instant grant). The hero visit's "Ask for a power" is now "Ask them to drill you" (+mastery). Capes drop in about half as often (0.08 + heat/700, was 0.16 + heat/380), and meet-a-hero events are half as likely. Looking for a sparring partner works once every 3 years.
- **Rare events:** the yearly power offer is 5% (base powers only, and only when an awakening is open). Relic runs need 15+. Power-granting events are dropped from the pool when you can't take a power, and a blocked grant sharpens your focus power instead (+10 mastery: "Powers don't come that easily").
- **Depth instead of breadth:** each of the 20 base powers gets two new techniques (`moves.techniques.ts`): a rank-C move covering the style it lacked and a rank-A finisher (power 8). Every power you hold ripens on each birthday (+7 mastery). Legend kits: Flash's Rewind and Wonder Woman's Bullet Deflection now arrive at 31 so their six fills from their own kit.
- **Before / after (sims, 6 Mystery seeds, powers owned at 15 / 20 / 30 / 40 / 60):** Play only 3.7 / 7.7 / 10.8 / 13.3 / 18.2 → **1.0 / 1.8 / 3.0 / 3.8 / 4.0**. Chasing powers every month 3.8 / 8.2 / 11.0 / 13.0 / 18.2 → **1.0 / 1.8 / 3.7 / 4.7 / 5.7** (braids 9.5 → 1.7 by 60).
- **Fights:** the six is mostly real power moves again, and deeper. Average move power in the six (Play only) 20 / 30 / 40: 6.8 / 6.9 / 6.9 → 7.7 / 8.5 / 9.0; power level about 0.2 lower. Difficulty tests unchanged, so no foe rebalance this pass.
- **Copy:** Braid Book, Mentor card, hero lessons, the seek line and the "new power" chapter goal now say powers are rare and slow ("A rare gift. About 8 monthly lessons before it answers.").
- **Tests:** `library.test.ts` rewritten (the gate, a 12-session solo braid, the stray-spark consolation), `mentors.test.ts` (chain through monthly training, a guided braid in 4–6 lessons), `legend.test.ts`, `coverage.test.ts`, `loadout.test.ts` updated. 296 game tests pass.

### Increment 2: adult Play interrupts less (owner's call, 15:24)

- **Why:** "Make it interrupt less." From 18 to 40, Play took ~190–250 taps (Play taps plus the stops you had to answer). Most stops were everyday moments, routine street fights and your arch-enemy's monthly taunt.
- **A year a tap from 18:** Auto pace is now a year per tap as a kid, a season from 13 to 17 (the busy, formative years), and a year again from 18. Every birthday still gets its card. Month and Season are one tap away in the Time sheet. Your routine fills unused free time the same way at any pace, so balance doesn't change.
- **What still stops Play:** canon and legend beats, cases and story arcs, chapter changes, power moments (a power waking, the mentor at 15, power offers and relic tips), offers that change a life (lab offer, villain offer, sidekick pitch, a trainer, a rival school, an interview), grief, low health and relationship crises, bosses, a street fight you could lose, and your arch-enemy **once a year**.
- **What goes in the recap instead (`settleAdult`):** everyday moments are answered the way you'd likely answer them, and the card says which answer was picked ("Your landlord… → Pay it"). Friendly heroes stopping by and an arch-enemy's billboard are settled the same way. The arch-enemy's other calls that year are left on read. Street fights against a foe you outclass by 1.5+ power levels are won in the recap. With **Auto fights** (new switch in the Time sheet, on by default), fights against a foe you're about even with (no more than 0.5 above you) are settled too, a little under your average result, the same rule as fast-forward. The recap says "Handled on the way: 2 street fights and 3 small moments."
- **A new chapter is one tap:** the chapter page shows, and the recap goes on the card under it (it used to be two dismissals).
- **Before / after (sims, 4 seeds, 18 → 40, Play taps plus the stops you answer):** Mystery 216 → 99 (−54%), Spider-Man 250 → 95 (−62%), Batman 193 → 62 (−68%). Story beats still stop (canon beats seen in every legend run). Fight sims and the economy are untouched; power level and fame at 40 land a little higher than in the old sim's policy, because auto fights get won instead of talked down.
- **Saves:** nothing to migrate. Old lives on Auto pace move to a year per tap at 18+, and Auto fights is on.
- **Tests:** +5 (`flow.test.ts`: what settles and what never does, the arch-enemy once a year, the street-fight rules with Auto fights on and off and bosses, adult taps 18–40 ≤ 140 with canon intact, a chapter is one tap). Pace tests updated for a year per tap from 18. 293 game tests pass.

### Increment 1: grow a business into a chain across every city (owner's call, 15:22)

- **Why:** "be able to hire a manager and be able to expand your business to every city." Managers (pm) stay as they were, including the 20% sales drop for an unmanaged site while you live elsewhere.
- **Expand to… (`econ|biz|expand|<site>|<city>`, `expandOptions`, `quoteExpand`):** any business except the family companies can open one site in each of the game's 8 cities. The picker lists every city still open with its cost and what the site should make a month with a manager. Opening one takes a block of free time.
- **Each site is its own place:** its own staff, upgrades, reputation, crew morale and manager. Sales follow the city's own housing market (`cityDemand`, ±15%: homes rising there means people spending). A site in a city you don't live in with no manager takes the −20% and its reputation slides.
- **Opening cost and ramp:** each new city costs the base price × the city's price level × (1 + 45% per site you already run). A branch takes 9 months to find its feet (the first site takes 6). The newest site must be a year old before the next one opens.
- **Brand:** more sites mean a bigger name. Sales get up to +12% (`brandLift`, flattening: +3% at 2, +7% at 4, +10% at 8), reputation drifts up +2 a city (max +10), and four **chain upgrades** cover every site at once from the second city on: Brand identity (+5% sales), Central buying (supplies −10%), Training academy (morale +8), Loyalty app (reputation +6).
- **Diminishing returns:** head office costs grow faster than the chain (2.5% of base sales × (sites − 1)^1.35 a month, shown as its own ledger line), each city costs more than the last, and the brand lift flattens. In sims a café opened at 30 and grown as fast as cash allows reaches all 8 cities at about 48 (~$30k a month at peak, ~$4.6M net worth at 50); a food truck tops out at 7 cities. A chain takes decades, not a summer.
- **Three businesses max now counts brands:** a chain in 8 cities is one of your three.
- **UI (Work ▸ Money ▸ Business):** one business shows its card with **Expand to…** under it. A chain shows one card: brand name, cities, brand lift and the chain's monthly total, then one row per city (morale dot, manager or "No manager · sales −20%" in red, last month's profit). Tap a row to open that site's full card. Then the head-office line, the four chain upgrades, and Expand to… with its city picker. If you can't open a city yet, the picker says why.
- **Saves:** sites without a brand are their own brand. A branch whose brand is gone becomes its own brand, and broken or unknown chain upgrades are dropped. 10 more managers to pick from, enough to staff a full chain.
- **Tests:** +7 (`chain.test.ts`: every city reachable, each dearer and one at a time; brand lift and head-office curves; each site follows its own city's market; branches with their own manager, the away penalty, chain upgrades across sites, head office in the ledger, selling one branch; a full chain takes 12+ years and profit stays human-scale; three brands max; old and broken saves). 288 game tests pass.

## 2026-11-10 (pm): a business you can feel, a clearer money life (`devbot/2026-11-10-pm`)

Built on `origin/devbot/2026-11-10-am` (334053c). Each increment is typechecked, linted (only the old `src/lib` no-empty error remains), `npm run test:game`, built and loaded at 390×844 before push.

### Increment 4: business news rides on every Play card

- **Why:** a Play season that stopped for a choice dropped the banners from the months before it, so 3 in 12 business events (a viral video, an inspection fine) never reached the player.
- **What:** the money report (`periodReport` → `biz`) now carries what happened at your businesses during the step, newest first (up to two), in a tinted row with a shop icon, above the city headlines; the same line isn't repeated in the card's banner. In a 60-tap sim every business event reached a Play card (12 / 12, was 9 / 12).
- **Tests:** +1 (the newest business news is always in the period's report, and nothing when nothing happened). 281 game tests pass.

### Increment 3: the Money hub fits a phone, and every result shows where you are

- **Why (playtest):** at 390×844 the hub's tab content started below the Play bar: the month card, the desk's one-line description, the net-worth card and the news ticker all sat above the tabs; and an action's result line appeared above the tabs, off screen when you'd scrolled down to a business card.
- **What:** on Work ▸ Money the month card and the desk description step aside (the hub is its own header; choices still show the card); the news ticker moves to the Markets tab, where the news is what you read (Life ▸ Today keeps its ticker); the net-worth card is a little tighter. Tabs now sit ~160 px higher, so the first business / home card is on screen without scrolling. Each action's result floats in a toast just above the Play bar for ~4 s (tap to dismiss) wherever you've scrolled.
- **Tests:** UI only; 280 game tests pass.

### Increment 2: managers, crew morale, things that happen at your business, fights that reach it

- **Why (playtest + owner's spec):** a café sat at reputation 40 for 17 years with nothing happening to it, and kept selling at full speed after you moved city. The spec asks for managers, staff morale / skills, rivals and scandals, expansion to other cities and hero tie-ins.
- **Managers (`MANAGERS`, `mgrCandidates`, `mgrWage`):** Business ▸ a card ▸ **Hire** shows three people (the list changes each season), each with one clear trait: **Steady** (crew morale +15), **Hustler** (sales +8%, morale −5), **Penny-wise** (supplies −15%), **Fixer** (bad news hits half as hard). A manager costs ~7% of the place's base sales a month (min $1,200; café $2,280 in Metro), keeps reputation up (+8 toward its target) and **runs it while you're away**. Let go any time (−5 morale).
- **Expansion to other cities:** businesses stay where you opened them. Moving city with an unmanaged one says so ("Reyes's café stays behind with nobody in charge (sales −20%). Hire a manager…"): away and unmanaged it sells 20% less and reputation and morale slide; with a manager it holds. Opening the same kind again in your new city was already allowed (three max).
- **Crew morale (one bar, "CREW"):** 70 is neutral (old tuning unchanged); it drifts toward a target set by staffing (short-staffed drags it down up to −30), the manager's trait, a proud name (rep 70+) and whether anyone is in charge, and the card says the main reason ("Grumbling · falling: short-staffed"). Sales move ±0.4% a point (Ready to walk ~−16%, Fired up ~+8%). Working a shift yourself lifts it +3.
- **Things happen (`bizEvent`, ~0.85 a year per business, deterministic, never the engine dice):** a viral moment (+6 rep and a little cash, per kind: "a latte-art video goes viral", "a kid trained at your gym wins the Golden Gloves"), a big order (precinct coffee, a gala hires every guard), an inspection (fine, or a clean pass at rep 70+), **a rival opens two blocks away** (sales −12% for 6 months, −6% if you're well known; each shift you work wins a month back), a **scandal** (−8 rep, morale dips), and **staff walking out** when morale is low. At most one every four months, never the same twice running. The latest shows on the card, coloured.
- **Fights reach your businesses (`noteFight`):** a villain win brings foot traffic (+2 rep at your businesses in the city); a loss can mean looters at one of them (~8% of a month's sales), unless **your own security firm** (rep 50+) has guards on the block.
- **Polish:** an upgrade you buy pops in gold ("Upgraded!", with a haptic buzz); a brand-new business shows where it's heading ("+$1,643 once it finds its feet") instead of a red half-empty first month.
- **Balance:** events net ~+4% of profit on average (café $2.5k/mo profit, +$100/mo from events over 60 business-years); legend companies and fight sims are untouched.
- **Saves:** old businesses load with morale 70, an empty log and no manager.
- **Tests:** +6 (`life.test.ts`: managers and their wage, moving city with and without one, morale from short staff and back, the event pool over 40 business-years, fights reaching businesses and the security-firm guard, old saves). 280 game tests pass.

### Increment 1: playtest; per-life markets; the squeeze hint

- **Playtest** (PLAYTEST.md): Play-only sims of three money lives to 30–40 and phone screens of the hub.
- **Per-life markets (bug):** the economy's seed came from the name, face, city and upbringing only, so two lives that shared them lived through identical markets (seeds 3 and 4 matched to the dollar). New lives mix in the life's dice; old saves keep their stored seed.
- **Squeeze hint:** after three months in a row of more going out than coming in while you pay for a home, the month says so once, with the fix that fits: "You're spending about $327 a month more than comes in. A roommate would pay about $420: Work ▸ Money ▸ Home ▸ Roommates." (or a cheaper place / better job if there's no spare room). Resets when you're back in the black.
- **$700 living cost (open question, decided):** kept. Low-wage lives in cheap cities stay positive; a shop job in New York is a squeeze, which is now explained with a way out.
- **Tests:** +2 (`life.test.ts`: different seeds, different markets; the squeeze hint fires once and resets). 274 game tests pass.

## 2026-11-10 (am): playtest fixes, money reports, Life Flow polish (`devbot/2026-11-10-am`)

Built on `origin/devbot/2026-11-10-night` (aae1d85). Each increment is typechecked, linted (only the old `src/lib` no-empty error remains), `npm run test:game`, built and loaded at 390×844 before push.

### Increment 4: saved lives get a hero poster in the Arena

- Mystery heroes and saved lives no longer show the paper doll in the Arena. New `LifeHeroArt` (vector SVG): a backlit silhouette with cape, rim light, glowing lenses, the hero's power-family emblem and a seeded city skyline with slow light rays (off under reduced motion). Used on the draft card, roster tile and battle slot.
- A saved legend life (e.g. your own Bruce Wayne) uses that legend's painted art, colour and world.
- The draft kicker no longer reads "YOUR LIFE · YOUR LIFE"; the title is now "Age N · Hero".
- New test `arena.art.test.ts` (saved-life fighters carry art/family data). Tests 272.

### Increment 3: routine slots for business shifts and people; hero tie-ins for your businesses

- **Why:** open follow-ups from last night (routine slots for business shifts and people) and the owner's ask for the world to tie into the hero life (security firm leads, tech-firm gadgets).
- **Routine slots (`routineOptions`, `SHIFT_ROUTINE`, flow.ts; `monthPlan`, skip.ts):** the Routine picker now offers **Shift at <your business>** (each business you run in this city; takes a block of free time, like doing it by hand) and **Time with <person>** (partner first, then closest; up to four; "Wes (parent)" / "Wes (friend)" when two share a name), beside the everyday habits. Pinned shifts run in your order; Play only counts a shift that actually used a block.
- **Shifts have diminishing returns (`shiftGain`):** +6 reputation at a new place, less the better known it is (+3 at 70, +1 from ~92). Before, three pinned shifts a month would have pinned every business at 100.
- **Hero tie-ins (`bizTieIn`, `bizFightEdge`, economy.ts):** a **security firm** at 50+ reputation passes you a lead now and then (~22% a month): "Moreno's security firm passes you a lead: Moth King was seen in Riverside", worth **+4% in your next villain fight**. A **tech start-up** at 50+ reputation sends R&D prototypes (~15% a month, hold up to 2): **+3% in a villain fight**, one per fight. Both show as notes in the fight result, and as a **Hero perk** line on the business cards (greyed with "reputation 38/50" until earned). Fights moving markets (wins lift the district and a local stock; losses dent them) were already in; the money report now surfaces those headlines first.
- **Balance:** the edges only apply to owners of a $420k / $800k business and sit under the existing 30% edge cap; the 60% legend / mystery fight sims own no businesses, so street / boss rates are unchanged.
- **Tests:** +2 (`business.test.ts`: shift gains shrink, a shift can be pinned and Play works it; leads and gadgets appear for a well-run firm, one per fight, never for a struggling one). 271 game tests pass.

### Increment 2: the money report on every Play step, a ticking cash counter, recaps lead with your life

- **Why (playtest):** a Play season's card led with rival-cape ticker lines in bold ("Afterimage: sponsoring a cereal that hates them") and buried the money in a truncated sentence; with markets, rent and businesses all moving, a player couldn't tell what the season did to them.
- **Money report (`periodReport`, economy.ts; `card.money`):** every Play step that passes time (month, season or year, including steps that stop for an event) carries a report: net cash for the period (ticks up), a bar per group (Pay, Business, Tenants & roommates, Dividends, Home, Living costs, Everything else: shifts, gigs and shopping, so it adds up to your real cash change), net worth and its change, up to two moves in what you own (shares, goods, your district's homes, marked YOURS) plus the biggest mover in your city, and the top two headlines (your fights first). A **Money ›** button opens the hub. While a choice is waiting, the card shows one slim line ("2 months: cash +$10,237 · home −$1,960"). The economy keeps its last 12 monthly ledgers for this (`EconState.months`, optional; old saves fill it as they play).
- **Cash ticks:** the header money figure counts to its new value and floats the change (+$12,229 green / −$ red); instant under reduced motion.
- **Recaps lead with you:** rival-cape ticker lines (`isChatter`) go last in fast-forward notes (at most one) and are dropped from a Play card that has a money report.
- **Tests:** +2 (`flow.test.ts`: the report equals the ledger plus off-ledger cash and the real cash change, pay / rent / living groups, "yours" is yours, leads with you; children get none). 269 game tests pass.

### Increment 1: cost of living, a fairer heavy shift, your six stays yours, estates take no lodgers

- **Why (playtest):** a Metro office worker on Play only banked **$759k by 28 and $1.8M by 40**. There was no cost of living at all, and Life Flow ran "Work a heavy shift" (8% of a year's pay, once a month) every month, nearly doubling pay. Money stopped meaning anything.
- **Cost of living (`livingCosts`, economy.ts):** a monthly **Living costs** line from 18: $700 × city price level, plus 25% of a monthly wage (lifestyle creep), plus $350 per child under 18; half at the family home or a family estate. It never pushes you below $0 by itself (you scrape by; rent and mortgages can still sink you).
- **Heavy shift:** 8% → **3%** of the yearly wage (`SHIFT_SHARE`, engine.ts). Same joy cost.
- **Result (same sim, seed 3/4):** cash at 28 $759k → **$324k**; a desk job plus a heavy shift every month in a tiny flat now saves ~$15–25k a year (tested band $5–30k).
- **Six-move bug:** dropping your only guard on purpose was undone by the next action's style top-up. A six you arranged by hand (`handSix`) is now left alone; the balancer still fixes auto-filled sixes and pruned slots. (Found because the loadout fixture life changed.)
- **Manor roommates (open question, decided):** family estates (Wayne Manor, Stark Mansion) take **no roommates**: the secret under the house and the staff who keep it. Rented and bought homes keep them.
- **Tests:** +2 (cost of living by city, income, home, children and the $0 floor; a desk job's savings band) and an estate check. 267 game tests pass.

## 2026-11-10 (night): a living economy (Money & Life hub, markets, homes, businesses, roommates) and Life Flow (`devbot/2026-11-10-night`)

Built on `origin/main` (8d5ade2). Typechecked, linted (only the old `src/lib` no-empty error remains), `npm run test:game`, built and loaded at 390×844 before push. Old saves migrate (`ensureEconomy` in `migrate`).

### Increment 4: Life Flow — one Play button, a routine, age-scaled time (owner's call C)

- **Why:** "rethink the 3 moves per month mechanic and figure out a better way to pass time." Reasoning and the options weighed are in DESIGN §19.
- **What:** the **Next month** button is now **Play**: one tap moves life **a year as a kid (to 13), a season from 13** (Auto), or a pinned Month / Season / Year (**Time ▸ Play pace**). Your **Routine** (Life ▸ Today, up to 3 pinned everyday actions in order; empty = your habits) fills all the free time you don't use; Play stops for anything that needs you (reveal, story and legend canon beats, cases, fights, choice events, chapters, the mentor at 15, low health, relationship crises) and crosses no birthday without stopping. Plain steps end on a recap card; big stops keep the full summary. The 3 blocks a month stay as "free time" for special things (fights, dates, moving, opening a business, hanging out). Skip to 15 and Skip to birthday live in the Time sheet.
- **Engine:** `src/game/flow.ts` (`playStep`, `stepOf`, `stepMonths`, `stepLabel`, `routineOptions`, `setRoutine`, `setPace`, `FLOW_ON`); `monthPlan` puts your routine first; `fastForward` takes `{ settle }` so childhood steps settle small moments like Skip to 15. No fight, training or economy numbers changed. Old saves play on Auto with their habits (`routine` / `pace` optional).
- **Taps** (engine sims to 60, auto-answering choices): ages 0–12 **13 taps**, 13–17 23–29, 18–29 61–71, 30–44 80–100, 45–59 75–90 (stops included). Before: 12 Next month taps a year plus every choice.
- **Tests:** +8 (`flow.test.ts`: pace by age and pinned; routine order and cleaning; month pace fills free time; season recap or stop; a Play season equals the fast-forward season (same stats, same RNG); birth to 15 in ≤40 taps with the reveal and the mentor; Spider-Man's canon beats on Play only; old saves). 265 game tests pass.

### Increment 3: roommates; family estates can't be sold (owner's calls, 00:40)

- **Roommates (A):** any rented or owned home with spare rooms (tiny flat 1, apartment 2, loft 2, townhouse 3, penthouse 2, mansion 3; shared rooms and lairs none) can take roommates. **Money ▸ Home ▸ Roommates ▸ Find a roommate** shows three people looking this month (10 data-driven characters: nursing student, line cook, club DJ, night-shift paramedic, cub reporter, programmer, law student, actor, tattoo artist, retired boxer).
  - **Money:** on a lease each pays an equal share of the rent (Peter's $720 Queens walk-up → $360 each); in a home you own they pay a room's rent. Flaky ones are sometimes late.
  - **Trade-offs:** each roommate costs 1 Cover (heat fades slower); two or more cost 1 Comfort; their own perks add or subtract (the cook +Comfort, the nurse +Recovery, the DJ −Recovery, the boxer +Training).
  - **Relationships:** they join People as friends (closeness grows monthly; **Hang out** takes a move: +8 closeness, +2 Joy); 12% a month they bring a small event (dinner, a party, a fight about dishes…).
  - **Secret identity:** if you have powers, a nosy roommate may see the suit (2–3% a month for the reporter). Close (60+) and they keep it ("KNOWS · KEEPS IT"); a stranger panics, moves out and talks: −4 Joy, +2 Fame, +2 Heat.
  - They don't follow you when you move; they stay in People.
- **Family estates (B):** Wayne Manor and Stark Mansion can't be sold ("Family estate · not for sale" on the card; the engine refuses too).
- **Tests:** +3 (estate lock; roommate split, People, perks, ledger, hang out, moving; the secret both ways). 257 game tests pass.

### Increment 2: businesses — open, staff, upgrade, sell; Tony and Bruce chair their family companies

- **Why:** the owner asked to "make and run businesses and make upgrades and have staff". Stage (c) of the economy plan.
- **What (`economy.ts`, data-driven `BIZ`):** six businesses to open in your city — food truck (16+, $30k), corner café (18+, $95k), boxing gym (21+, $240k), security firm (21+, $420k), tech start-up (22+, $800k), city newspaper (25+, $1.6M) — each with three upgrades (more sales, more staff needed, reputation). Monthly books: revenue (city, staff, upgrades, reputation, demand that follows a market series — coffee prices squeeze cafés, a nervous Cape Capital hires security, Bugle shares lift newspapers) minus stock & supplies, wages, premises and upkeep. New businesses ramp over 6 months (expect early losses).
- **Diminishing returns:** staff output is 1 − e^(−1.4·staff/need) (normalised), so the 5th hire adds less than the 1st and doubling staff gives only ~+27%; three businesses max; upgrades add premises cost and staff needs; sale price ≈ two years of recent profit, never below half of what you put in. Steady-state payback is 2–7 years (tested).
- **Owner play:** hire / let go (+/−), buy upgrades, **Work a shift** (a move: +6 reputation), see the books, sell (confirm shows the price). Profit and loss land in the monthly ledger; three red months in a row warns you.
- **God Mode:** **Bruce chairs Wayne Enterprises** (from 18) and **Tony chairs Stark Industries** (from 21): run by the board, they pay a chair's draw that follows the share price (~$17–42k/mo) and take two big projects each (Applied Sciences / Wayne Foundation; Clean energy / Stark Expo). Can't be sold. Peter has no company.
- **UI:** Money ▸ **Business** tab (now on: `ECON_FLAGS.business = true`).
- **Saves:** older economies get a business book on load (and a legend's family company).
- **Tests:** +7 (`business.test.ts`: data, diminishing staff returns, payback bands, found → run → upgrade → sell through the ledger, understaffing hurts revenue and reputation, legend companies and their age locks, save repair). 254 game tests pass.

### Increment 1: living markets + housing, one Money hub

- **Why:** the owner wants the world to feel like it's really moving, and a life-sim spine: rent, buy and sell homes, moving markets for different things. The old Market priced property once a birthday and nothing else moved.
- **Markets (`src/game/economy.ts`, data-driven):** 24 district house-price series (3 districts × 8 cities), 9 stocks (Stark, Wayne, Oscorp, LexCorp, Roxxon, Daily Bugle Media, Helix Bio, Mesa Freight, Cape Capital), 6 goods (gold, crude, steel, chips, coffee, isotopes) and the base rate. Each moves **monthly**: regime drift (flips ~every 18 months) + noise + pull back to a slow anchor, so trends feel real but nothing runs away (80-year bounds tested). 24 data-driven headlines (0–2 a month) shock their series, and **your fights move markets**: a villain win lifts the district and local stock, a loss dents them and lifts Cape Capital and steel (once a month, no farming). Fully deterministic from the life seed; never touches the engine RNG, so fight balance and old tests are unchanged.
- **Trading:** from 16 (isotopes 21+). 1% fee (min $5) on stocks, 2.5% spread on goods, extra slippage on huge orders (diminishing returns). Dividends paid monthly.
- **Housing:** 8 home tiers (shared room → mansion) to **rent or buy in any district**. Leases: deposit + first month, renewals drift toward market by at most ±8% a year. Mortgages: 10% minimum deposit, 2% closing, 25 years, rate = base + 0.75–1.5 by deposit, fixed at purchase; lend up to 4.5× income + half your assets. **Sell** (5% fees), **let it out** (90% of market rent, vacancies), **upgrades** (garden, home gym, panic room, med bay, comms room, workshop; slots by tier, half their cost adds to value), **pay off** early. Upkeep 1.1% a year. Moving spends one of the month's moves.
- **Real benefits:** where you live gives monthly Comfort (joy), Recovery (HP), Cover (heat fades) and **Training** (+2–8% in fights and stunts). Couch-surfing or still in the family home past 30 costs joy. Three months in the red on housing bills → eviction / foreclosure (85% sale).
- **Monthly money:** wages, League stipend, villain retainer and fame endorsements now arrive monthly in the hub's ledger (they used to land in one lump at the birthday).
- **God Mode starts:** Bruce lives in **Wayne Manor** (estate, the trust pays upkeep) with Wayne Enterprises shares in trust until 18; Tony in **Stark Mansion** with Stark Industries shares in trust until 21; Peter rents a rent-controlled **Queens walk-up** from 18.
- **UI:** Work ▸ **Money** (new first shelf): net-worth card with sparkline, cash / last month / assets, where you live, live news ticker, **Home** tab (where you live, last month's ledger, your homes, find a place with district trend cards) and **Markets** tab (Stocks / Goods / Homes / Rates boards, sparklines, 2-year charts, ×1/×10/×100/Max with fee preview). A live ticker on Life ▸ Today opens it. The old Market is now **Shop**; its property tab is **Bases** (hideouts, warehouse base, HQ, safehouses; homes you already own there still show). A **Business** tab was behind `ECON_FLAGS.business` (off) until increment 2.
- **Net worth** in chapter snapshots now counts home equity, portfolio and deposits.
- **Tests:** +14 (`economy.test.ts`: data integrity, determinism / no RNG, 80-year bounds, mortgage maths and payoff at term, lending caps, selling, trade round trip, renting and eviction, monthly wages, letting, perks, upgrades, couch, fight shocks, God Mode starts, save migration / repair). 247 game tests pass.

## 2026-11-09 (night): kits for Wonder Woman, Hulk, Black Panther and Wolverine; painted rogues (`devbot/2026-11-09-night`)

Built on `origin/devbot/2026-11-09-pm` (84a214a). `main` is unchanged since 702d68d. Each increment is typechecked, linted (only the old `src/lib` no-empty error remains), tested, built and loaded at 390×844 before push.

### Increment 8: new kit pieces take a slot in a lopsided six

- **Why:** a kit piece that doesn't upgrade an older one only landed on the shelf, so kit-led sixes stayed lopsided: Black Panther at 31 fought Killmonger with one strike (his Ultimate, cooldown 1) beside five guards and tricks while Claw Flurry sat unused; Hulk at 34 the same with Gamma Clap; Thor kept four strikes after Bifrost Call arrived (BACKLOG).
- **What:** `slotKitArrival` (`moves.ts`): on the birthday a new kit piece arrives, if its style has at most one move in the six and another style has three or more, it replaces the weakest **non-kit** move of the crowded style. The birthday card says "Claw Flurry takes Counter Tap's slot, so every tell has an answer." A balanced six is never touched, and the player can swap back on the Moves shelf.
- **How often** (11 legends × 3 seeds to 50): once or twice per life for Wonder Woman (Bullet Deflection at 33), Hulk (Gamma Clap at 31), Black Panther (Claw Flurry at 26), Wolverine (Scent Track at 16), Thor (Bifrost Call at 26, Hammer Catch at 44), Cap (Commando Feint at 28), Superman (Freeze Breath at 17 / Flying Tackle at 20), Flash (1 of 3); never for Batman, Iron Man or Spider-Man.
- **Balance** (60% play, street / boss, 3 seeds): roughly neutral. 9-build pool Normal 0.78 / 0.63 → 0.78 / 0.61, Hard 0.57 / 0.38 → 0.57 / 0.38, Legendary 0.38 / 0.23 → 0.38 / 0.23; Thor / Superman / Flash / Iron Man Normal 0.73 / 0.55 → 0.71 / 0.57, Hard 0.53 / 0.38 → 0.54 / 0.38. Hulk Normal street 0.87 → 0.81.
- **Tests:** +1 (Black Panther's six gets a second strike by 27; a balanced six is left alone). 233 game tests pass.

### Increment 7: Captain America's rogues get the rogue edge

- **Why:** with every legend on a kit, Cap was still the strongest (Normal 60% 0.86 / 0.68, Hard 0.77 / 0.56, Legendary 0.66 / 0.44). His kit's power-level share barely matters (edge 0.30 → 0.20 moved nothing), and making The Shield replace his serum strength too made it *easier* (foes scale with his power level, and a street Haymaker crept back into the six), so neither was shipped.
- **What:** `rogueEdge: 2` on the Captain America preset, the same lever as Spider-Man's: Red Skull, Winter Soldier, Zemo, Crossbones and the rest hit +2 on their signature moves in life-sim fights. Arena is unchanged.
- **Balance** (60% play, street / boss, 3 seeds, 164 villain boards, boss n = 6): Story 0.98 / 0.96 → 0.95 / 0.90; Normal 0.86 / 0.68 → **0.80 / 0.56**; Hard 0.77 / 0.56 → **0.67 / 0.47**; Legendary 0.66 / 0.44 → **0.56 / 0.26**. Now in the pack with Wonder Woman and Wolverine.
- **Tests:** +1 (Cap's rogue edge). 232 game tests pass.

### Increment 6: Wolverine's Claws & Healing Factor

- **Why:** Logan fought with Grit Knit, Counter Tap, Feel It Coming, Quick Cut, Static Snap, Heavy Hands: three guards and no claws. Normal 60% 0.87 / 0.73, above target. Last legend on generic moves.
- **What:** a **Claws & Healing Factor** kit, 12 pieces from the wake at 12: Bone Claws, Healing Factor (Ward) (12), Feral Lunge (13), Scent Track (16, Shock), Snikt Flurry (20, area), Adamantium Claws (25, Expose, upgrades the bone claws), Adamantium Skeleton (25, guard), Berserker Charge (28, Expose, upgrades the lunge), **Berserker Barrage** (30, Expose, upgrades the adamantium claws, his Ultimate), Unkillable (34, Ward, upgrades Healing Factor), Fastball Special (40, area, Expose), Weapon X Instinct (46, upgrades Scent Track). It replaces his **Regeneration and Pain Map** moves; Super Senses and his stretch powers still bring theirs. Kit edge 0.15.
- **Balance** (60% play, street / boss, 3 seeds, 210 villain boards, boss n = 15): Story 1.00 / 1.00 → 1.00 / 0.97; Normal 0.87 / 0.73 → **0.79 / 0.64**; Hard 0.79 / 0.54 → **0.65 / 0.44**; Legendary 0.59 / 0.24 → **0.40 / 0.22**. Sabretooth at 12–14 is now 0.47 (was 0.70).
- **Tests:** +1 (shelf has none of the replaced moves, the barrage retires both claws and is the Ultimate at 31, all three styles). 231 game tests pass.

### Increment 5: Black Panther's Panther Habit

- **Why:** T'Challa fought with Heavy Hands, Counter Tap, Quick Cut, Slow Second, Grit Knit and a Ground Pound Ultimate: no claws, no vibranium, no kinetic release. Normal 60% 0.88 / 0.71, above target.
- **What:** a **Panther Habit** kit, 12 pieces: Dora Milaje drills at 16 (Okoye's Stance, Challenge Strike, Panther Step), Vibranium Claws (18, Expose, upgrades the strike), Kinetic Weave (19, upgrades the stance), Kimoyo Beads (21, Shock), Panther Pounce (23, Expose, upgrades the step), Claw Flurry (26, area), **Kinetic Release** (30, Shock, upgrades the claws, his Ultimate), Charged Habit (33, Ward), Bast's Shadow (38, Expose), Wakanda Forever (42, area, Shock). It replaces his **Super Strength, Kinetic Impact and Juggernaut Mass** moves; Super Senses and his stretch powers still bring theirs. Kit edge 0.25.
- **Starts at 16, not 10:** a first try from 10 let Klaw call out a 12-year-old prince (the rogues-wait rule uses the kit's first piece): 7 fights before 15 at 0.21. From 16, nothing before 15, same as before.
- **Balance** (60% play, street / boss, 3 seeds, 195 villain boards, boss n = 6, noisy): Story 1.00 / 0.98 → 0.99 / 0.99; Normal 0.88 / 0.71 → **0.78 / 0.63**; Hard 0.73 / 0.35 → **0.58 / 0.28**; Legendary 0.47 / 0.21 → **0.41 / 0.21**.
- **Tests:** +1 (no kit before 16, shelf has none of the replaced moves, Kinetic Release retires the claws and is the Ultimate at 31, all three styles). 230 game tests pass.

### Increment 4: Hulk's Gamma Rage

- **Why:** Hulk fought with Heavy Hands, Stand Firm, Grit Knit, Freight Train, Heavy Step and a Ground Pound Ultimate (generic strength / Juggernaut moves) and sat above target (Normal 60% 0.91 / 0.72, Hard 0.79 / 0.53).
- **What:** a **Gamma Rage** kit, 9 pieces from the gamma blast at 28: Hulk Smash, Gamma Hide, Gamma Leap (28), Hulk Roar (30, Expose), Gamma Clap (31, area, Frost: a second strike so a trick tell always has an answer), **World Breaker** (33, Expose, upgrades Hulk Smash, his Ultimate), Madder, Stronger (34, Ward, upgrades Gamma Hide), Ground Quake (40, area, Frost), Banner's Read (44, Shock). It replaces his **Super Strength, Super Durability and Juggernaut Mass** moves; Regeneration (Grit Knit) and his stretch powers still bring theirs. Kit edge 0.15 (his gamma moves start strong instead of growing).
- **Balance** (60% play, street / boss, 3 seeds, 140 villain boards, boss n = 18): Story 1.00 / 1.00 → 1.00 / 0.92; Normal 0.91 / 0.72 → **0.87 / 0.54**; Hard 0.79 / 0.53 → **0.62 / 0.31**; Legendary 0.64 / 0.32 → **0.45 / 0.25**. Street stays a little high (like every legend on Normal street, 0.82–0.87); bosses are on target.
- **Tests:** +1 (shelf has none of the replaced moves, World Breaker and Madder, Stronger retire the old pieces, kit Ultimate at 35, all three styles). 229 game tests pass.

### Increment 3: painted portraits for the 31 legend rogues

- **Why:** the 18 Arena villains were painted this morning; the 31 legend rogues (Mysterio, Vulture, Kraven, Two-Face, Riddler, Scarecrow, Penguin, Whiplash, Mandarin, Leader, Brainiac, Winter Soldier, Zemo, Klaw, Circe, Malekith, Justin Hammer, Red Hulk, Maestro, Ares, Medusa, Crossbones, Surtur, M'Baku, Namor, Lady Deathstrike, Omega Red, Silver Samurai, Captain Cold, Grodd, Mirror Master) still stood as vector cards next to painted heroes (user request 4).
- **What:** 31 painted 540×960 webp modules (`src/assets/art/villain-<id>.ts`, 52–87 kB each, ~2 MB total, lazy chunks, none on first paint) plus one loader line each. Every villain in the game now has a painting; `VillainArt` picks it up everywhere (FIGHT! / BOSS! intro, ring standee, header avatar, Arena). The vector card stays the loading fallback.
- **Head crop:** eight paintings have the face lower than the usual upper third, so the avatar circle showed a forehead or a fishbowl top. New `PAINTED_HEAD_Y` per-villain head-crop origin (Brainiac, Grodd, Justin Hammer, the Leader, Mirror Master, Surtur, Vulture, Silver Samurai). Checked at 390×844 on Mysterio, Two-Face, Surtur and Man-Ape duels.
- **Tests:** +1 (every villain with a card has a painted portrait registered). 228 game tests pass.

### Increment 2: Wonder Woman's Amazon Arms

- **Why:** Diana fought with Heavy Hands, Dive Kick, Aegis, Static Snap, Quick Cut, Mind Spike: no lasso, no bracers, no sword. She was also well above target (Normal 60% 0.88 / 0.78).
- **What:** an **Amazon Arms** kit, 13 pieces: Bracer Block (10), Training Spear (12), **Lasso of Truth** (14, Shock: their tells can't lie), Antiope's Feint (17), Sword of Athena (19, Expose, upgrades the spear), Amazon Shield (21, Ward, upgrades the bracers), Bracer Clash (24, area, Shock), Lasso Takedown (27, upgrades the feint), **Godkiller** (30, Expose, upgrades the sword, her Ultimate), Bullet Deflection (33, guard, Expose), Golden Perfect (38, upgrades the lasso), Aegis of Themyscira (44, upgrades the shield), Zeus's Thunder (48, area, Shock). It replaces her **Super Strength, Flight and Aegis Shell** moves; her stretch powers (speed, telepathy, lightning…) still bring theirs. Kit edge 0.20.
- **Balance** (60% play, street / boss, 3 seeds, 156 villain boards): Story 0.99 / 0.99 → 0.99 / 0.96; Normal 0.88 / 0.78 → **0.82 / 0.59**; Hard 0.82 / 0.64 → **0.66 / 0.49**; Legendary 0.62 / 0.41 → **0.53 / 0.29**. Teens (15–24) are now 0.50 street (Cheetah is her teen rogue), 40+ is 0.94.
- **Tests:** +1 (shelf has none of the replaced moves, upgrades retire the old pieces, the lasso's Shock override at 14, Godkiller Ultimate at 31, all three styles). The every-kit tests cover her too. 227 game tests pass.

### Increment 1: playtest

- A Harbor Bay / street-kid mystery (Nell Okafor) and a Dustreach / alien **God Mode** life with Telekinesis + Lightning (Kai Moreno), beside Wonder Woman, Hulk, Black Panther, Wolverine and three reference legends; three seeds to 50, all four difficulties. Power mixing at 15 (Skip to 15, mentor), move-select and phone screens re-checked. Notes and table in PLAYTEST.md. No code changes.

## 2026-11-09 (pm): legend signature kits (`devbot/2026-11-09-pm`)

Built on `origin/devbot/2026-11-09-am` (a754682). `main` is unchanged since 702d68d. Each increment is typechecked, linted (only the old `src/lib` no-empty error remains), tested, built and loaded at 390×844 before push.

### Increment 7: Superman's Kryptonian Arts

- **Why:** with Flash fixed, Superman was the weakest legend (Normal 60% 0.57 / 0.39 on 3 seeds) and fought with Heavy Hands, Dive Kick, Stand Firm, Push, Spark Jab, Quick Cut: no heat vision, no freeze breath.
- **What:** a **Kryptonian Arts** kit, 12 pieces from his wake at 13: Bulletproof, Heat Glare, Blur (13), X-Ray Read (15, Shock), Freeze Breath (17, Frost), Heat Vision (18, upgrades Heat Glare), Flying Tackle (20), Super-Breath (24, upgrades Blur), Man of Steel (28, Ward, upgrades Bulletproof), **Solar Flare** (30, Burn, upgrades Flying Tackle), Thunderclap (34), Fortress Training (38, Expose). It replaces his **Super Strength, Flight and Super Durability** moves; braided and stretch powers still bring theirs. The kit leads the Ultimate from 30.
- **Balance** (60% play, street / boss, 3 seeds): Story 0.93 / 0.90 → 0.94 / 0.96; Normal 0.57 / 0.39 → **0.65 / 0.61**; Hard 0.45 / 0.30 → **0.49 / 0.38**; Legendary 0.26 / 0.13 → **0.37 / 0.30**. Boss n = 15. 13–15 fights against Lex are still hard (he is level 9 on a fresh teen); logged.
- **Tests:** +1 (Superman's shelf has none of the replaced moves, Heat Vision and Man of Steel retire their old pieces, kit Ultimate at 31). The every-kit test covers him too. 226 game tests pass.

### Increment 6: Flash's Speed Force, and rogues who wait

- **Why:** Flash was the weakest legend (Normal 60% 0.54 / 0.45, Legendary 0.26 / 0.23) and fought with Quick Cut / Volt Step / Afterimage. Digging in: 60 of his 206 villain fights before 25 were **Reverse-Flash (level 9, ~95 HP) calling out a powerless child** through the monthly arch-enemy pin, 11 to 24, and he lost all of the ones before 15.
- **Rogues wait:** a legend's own arch-rogue never sends the monthly "Show up" pin before the hero can fight back: the powers waking or the kit's first piece, whichever comes first (Iron Man's Armory and Thor's yard start at 10, so they are unchanged). Canon beats and boss steps are untouched. Affects Flash (until 25) and Hulk (until 28).
- **Speed Force kit**, 10 pieces from his wake at 25: Lightning Jab, Speed Mirage, Phase Step, Tornado Arms (27), Lightning Throw (29), Speed Steal (31, Frost), **Infinite Mass Punch** (33, Expose, upgrades the jab, his Ultimate), Rewind (36, Ward), Time Remnant (38), Speed Force Storm (45). It replaces his Super Speed and Thunder Sprint moves.
- **Balance** (60% play, street / boss, 3 seeds): Story 0.87 / 0.93 → 0.97 / 0.89; Normal 0.54 / 0.45 → **0.71 / 0.50**; Hard 0.42 / 0.35 → **0.57 / 0.34**; Legendary 0.26 / 0.23 → **0.43 / 0.21**. Hulk: Normal 0.91 / 0.74 → 0.91 / 0.72, Hard 0.75 / 0.53 → 0.79 / 0.53, Legendary 0.52 / 0.28 → 0.64 / 0.32. Every other build measured is identical to before (same lives).
- Kit data test: a kit that starts at the wake doesn't need childhood style coverage.
- **Tests:** +2 (Flash's shelf and Ultimate; a kid Flash with Reverse-Flash as arch-enemy gets no call-outs before 25 across three lives, where the old code sent them from 11). 225 game tests pass.

### Increment 5: Captain America's Shield

- **Why:** Cap fought with Heavy Hands, Aegis, Holy Hull, Counter Tap: no shield moves at all, and he was the strongest legend (Normal 60% 0.92 / 0.81).
- **What:** **The Shield** kit, 12 pieces: Trash-Can Lid (10), Brooklyn Jab (12), Duck and Weave (14), Vibranium Shield (21, upgrades the lid), Shield Bash (22), Shield Throw (23), Ricochet Volley (26), Commando Feint (28), **Liberty Strike** (30, upgrades Shield Bash, his Ultimate), Assemble (33), Unbreakable Guard (40), Worthy (45, he lifts the hammer). It replaces his **Aegis Shell** moves. Braids that contain Aegis Shell (Holy Hull) still bring theirs.
- **Balance** (60% play, street / boss, 3 seeds): Story 0.99 / 1.00 → 0.98 / 0.96; Normal 0.92 / 0.81 → **0.86 / 0.68**; Hard 0.78 / 0.58 → 0.77 / 0.56; Legendary 0.71 / 0.50 → 0.66 / 0.44. Still the strongest legend; logged.
- **Tests:** +1 (every kit, lived past its Ultimate age: exactly six, no street padding, nothing the kit replaces in the six, kit moves in the six, a kit strike Ultimate where the kit leads). 223 game tests pass.

### Increment 4: Thor's Mjolnir

- **Why:** Thor was the weakest legend in the playtest (Hard 60% 0.54 / 0.19, Legendary 0.30 / 0.06) and fought generically: at 20 vs Loki his six was Slip, Heavy Hands, Cloud Bolt, Squall Slap, Thunder Clap, Brace. No hammer. Same treatment as Iron Man, as its own increment.
- **What:** a **Mjolnir** kit, 12 pieces: Asgard's yard first (Shieldwall 10, Practice Blade 12, Warrior's Feint 14), then the hammer (Mjolnir Strike 17, Hammer Throw 18, Hammer Spin 21, Bifrost Call 26, **God Blast** 30, Thunder Landing 33, Stormbreaker Cleave 42, Hammer Catch 44, Odinforce Ward 48). Five upgrade in place (Practice Blade → Mjolnir Strike → God Blast, Shieldwall → Hammer Spin → Odinforce Ward, Warrior's Feint → Hammer Throw). It replaces his **Super Strength** moves (Heavy Hands, Stand Firm): his strength is the hammer. His lightning and storm powers still fill the rest of the six. God Blast is his Ultimate from 30.
- **Balance** (60% play, street / boss, 3 seeds): Story 0.98 / 0.96 → 0.98 / 0.94; Normal 0.72 / 0.50 → **0.77 / 0.46**; Hard 0.54 / 0.19 → **0.57 / 0.38**; Legendary 0.30 / 0.06 → **0.43 / 0.10**. Boss n = 8, so the boss column is noisy; his gallery (Loki, Hela, Malekith, Surtur at 8–10) is the strongest in the game.
- The kit Ultimate banner now reads "<Kit>: your strongest <piece> is now your Ultimate at full Momentum."
- **Tests:** +1 (Thor's shelf has no strength moves, the Mjolnir upgrade banner, God Blast Ultimate at 31, all three styles). 222 game tests pass.

### Increment 3: Spider-Man's web-shooters

- **Why:** Spider-Man was far too easy (Normal 60% 0.94 / 0.88 on 3 seeds, 0.96 / 0.93 on seed 1): three 13-power guards (Counter Tap, Stand Firm, Slow Second) from his senses / strength / speed mix, and no webs anywhere. User request (Nov 9): a web-shooter kit that **replaces** his generic guards rather than adding to them.
- **What:** a **Web-Shooters** kit: Web Shield (15), Web Net (16, Frost), Web Yank (19, Expose), Web Cocoon (23, upgrades Net), Web Wall (26, Ward, upgrades Shield), Spider-Sense Snare (32, Shock, upgrades Yank). It uses the new `replaces` rule by **style**: every guard his powers would give leaves his shelf, so all his guards are webs and his strikes and tricks still come from his powers. Webs gain little from power level (edge 0.10); they win on statuses. His power keeps the Ultimate.
- **His rogues:** Goblin, Doc Ock, Venom, Kraven, Mysterio and Vulture were written with 4–7 power moves, like Batman's gallery, while Peter fights with three powers. New preset field `rogueEdge` (Spider-Man +2) adds to every signature move of that legend's rogues in life-sim fights. Arena is unchanged.
- **Balance** (60% play, street / boss, 3 seeds): Story 1.00 / 0.99 → 1.00 / 0.94; Normal 0.94 / 0.88 → **0.80 / 0.69**; Hard 0.77 / 0.54 → **0.55 / 0.36**; Legendary 0.54 / 0.21 → **0.34 / 0.15**. Seed 1 (the am table's life): Normal 0.96 / 0.93 → 0.79 / 0.53. Web guards alone took Normal to 0.89 / 0.80; the rogue edge did the rest.
- **Tests:** +2 (webs replace power guards on the shelf, in the six and in old saves; the kit leaves the Ultimate alone; rogue edge applies only to his gallery). 221 game tests pass.

### Increment 2: Iron Man's Armory

- **Why:** Tony Stark fought with six street moves until his powers woke at 24, then with Pulse Shot, Dive Kick, Heavy Hands, Stand Firm, Slip and Haymaker (four strikes). No repulsors, no Unibeam, no armour. User request (Nov 9): a signature kit like Batman's belt.
- **What:** an **Armory** kit (`src/game/kits.ts`), 14 pieces from 10 to 40: Tin-Can Shield, Pulse Glove, Flash Flare, Arc Taser, Chest Reactor, Mark I Plating, Mark I Flamethrower, Repulsor Blast, Boot Jets, JARVIS Targeting, Shoulder Missiles, **Unibeam**, Nanotech Shell, Hulkbuster Brace.
- **Suit upgrades:** kit pieces can now `upgrade` an older piece. When the new Mark arrives the old piece retires and the new one takes its slot, so the six keeps its shape (Pulse Glove → Repulsor Blast at 24, Chest Reactor → Unibeam at 30, Mark I Plating → Nanotech Shell at 36…). The birthday banner says "Armory upgrade: X replaces Y"; the locked shelf shows "Upgrades X".
- **Replaces:** a kit can now stand in for power moves. Iron Man's Energy Projection and Flight moves leave his shelf (the suit is where they come from); old saves drop them and refill from the Armory on load. Powers he braids later still bring their own moves.
- **Ultimate:** Unibeam (the strongest piece) is his Ultimate from 30, ahead of his power's (`leadsUltimate`).
- **Balance** (Normal, 60% play, street / boss, 3 seeds): 0.79 / 0.64 → **0.77 / 0.59**; Story 1.00 / 0.92 → 1.00 / 0.95; Hard 0.59 / 0.42 → **0.49 / 0.41**; Legendary 0.39 / 0.20 → **0.29 / 0.18**. Seed 1 alone (the am table's life): Normal 0.59 / 0.38 → 0.75 / 0.58. His worst stretch (24–30, 0.66) is now 0.84; teens are 0.73 street (were 0.91 on street moves against teen foes).
- Kits get a per-kit `edge` (Iron Man 0.40, default 0.25) and a `piece` word for banners; the Moves shelf strings name the kit instead of "the belt".
- **Tests:** +2 (Armory unlocks, upgrades and hidden power moves; Iron Man's six at 23 and 31, Unibeam Ultimate, Arena saved life). Kit data test now checks upgrade lines. 219 game tests pass.

### Increment 1: playtest

- Story and Legendary as well as Normal and Hard; a Neon Spire legacy mystery, a Crownbridge ice + force-field God Mode life, Thor and Wolverine beside five reference legends; three seeds per build. Power mixing at 15 (mentor, Skip to 15) and move-select re-checked on the phone. Notes and table in PLAYTEST.md. No code changes.

## 2026-11-09 (am): painted villains (`devbot/2026-11-09-am`)

Built on `origin/devbot/2026-11-08-night` (3947fa9). `main` is unchanged since 702d68d. Each increment is typechecked, linted (only the old `src/lib` no-empty error remains), tested, built and loaded at 390×844 before push.

### Increment 2: painted portraits for the 18 Arena villains

- **Why:** every duel put a painted hero card next to a flat vector villain bust, and the vector cards were always the stand-in for painted art (user request 4). An image generator is now available to the dev bot.
- **What:** Green Goblin, Venom, Doctor Octopus, Joker, Bane, Iron Monger, Ultron, Abomination, Lex Luthor, Zod, Doomsday, Cheetah, Red Skull, Loki, Hela, Killmonger, Sabretooth and Reverse-Flash now have painted 540×960 portraits in the legend heroes' style (stormy sky, their home turf, one strong rim light, dark floor). Webp inlined as lazy chunks (`src/assets/art/villain-<id>.ts`, 27–59 kB each, ~0.8 MB total, none on first paint).
- **Where they show:** `VillainArt` uses the painting whenever one is registered, so it lands everywhere the vector card did: Arena draft, sheet, order, reveal, round intro and duel cards, the life-sim FIGHT! / BOSS! intro, the ring standee and the header avatar (zoomed on the face). The vector card stays as the loading and no-painting fallback.
- **Tests:** +1 (every Arena villain has a registered painting; the module is a webp data URI). 217 game tests pass.

### Increment 1: playtest

- Spider-Man, Iron Man, a Hood / foster mystery and Flash to 50 on Normal and Hard; phone screens. Notes and table in PLAYTEST.md. No code changes.

## 2026-11-08 (night): legends on the duel stage (`devbot/2026-11-08-night`)

Built on `origin/devbot/2026-11-08-pm` (5ca0283). `main` is unchanged since 702d68d. Typechecked, linted (only the old `src/lib` no-empty error remains), 216 game tests, built and loaded at 390×844 before push.

### Increment 1: God Mode legends fight as their painted card

- **Why:** the pm playtest found Batman and Hulk drawn as the generic paper doll (Hulk in glasses and a jacket) facing a painted villain card.
- **What:** `DuelHero.legend` (art key, colour, name) is passed from `GameApp` when the life's preset has painted art; `Duel` then draws the hero as a standee in the same frame as the villain (`duel-standee` hit / attack / guard / KO poses, legend-colour border, name plate), mirrored side. Mystery and custom lives keep their own figure. The result card reuses it. No rules or balance change.
- **Shots:** `/workspace/playtest/night1108/hulk30.png`, `batman24.png`.

## 2026-11-08 (pm): Batman's belt, harder Hard and Legendary (`devbot/2026-11-08-pm`)

Built on `origin/devbot/2026-11-08-am` (b2fe5d3). `main` is unchanged since 702d68d. Each increment is typechecked, linted, tested, built and loaded at 390×844 before push.

### Increment 3: harder Hard and Legendary (street twists), regen hint fix, Batman retune

- **Why:** the playtest found Hard street fights at 0.75 and Legendary at 0.56 for a 60% player (targets ~0.50 / ~0.30). The only difference from Normal was ~10% more HP and damage, so a Hard thug played exactly like a Normal one.
- **Street twists (`streetTwist` in `difficulty.ts`, data):** on **Hard half** of ordinary street villains, and on **Legendary all** of them, fight with their power's twist from the boss gimmick table (healers Knit, fliers High Ground, strength Haymaker Wind-up, minds Mind Games…), with the usual Phase 2 banner, strip and hint. Story and Normal are unchanged. Picked by a stable hash of foe + age + month, so it never shifts the life's dice (Normal / Story boards are byte-identical before and after).
- **Retune (data):** Hard foe HP ×1.30 → ×1.40, damage ×1.24 → ×1.34; Legendary HP ×1.45 → ×1.57, damage ×1.36 → ×1.47. Picker lines: Hard "Half the street brings a twist. Mistakes hurt." Legendary "Every foe has a twist. Bring a plan."
- **Regen hint trap fixed:** against a healer (regen), **any won edge now stops that turn's heal**; a trick or status move still stalls it for two turns. Hints read "He heals each turn. Win edges to stop it." and the strip "Heals each turn · a won edge stops it, a trick stalls 2". Before, obeying "a trick move stalls it" every turn threw tricks into strike tells (Hard regen lab: hint-obeyer 0.37 vs tell-answerer 0.51 at 60%); now answering tells is never wrong (0.60). Arena's Healing Factor passive is unchanged.
- **Batman retune:** with the new numbers his belt sat well above the field (Hard street 0.78). Gadget base power −1 and kit power-level share 0.30 → 0.25: Batman Normal 0.82 / 0.77, Hard 0.62 / 0.50 (street / boss), in line with Cap 0.70 and Black Panther 0.64 on Hard.
- **Move cards:** on a card that shows a pill (Answer / Stalls / Ultimate / Ult), the status shows as its icon only, so "Expose" / "Frost" no longer clip to "E" / "Fr" at 390px.
- **Sims (13 builds to 55: 7 night builds + Crownbridge, Metro, Batman, Stacks, NYC, Cap; 1,008 villain boards per difficulty; 60% play, street / boss):** Story 0.97 / 0.96, **Normal 0.76 / 0.56** (unchanged), **Hard 0.65 / 0.45 → 0.51 / 0.36**, **Legendary 0.48 / 0.28 → 0.32 / 0.20**. Perfect play: Hard 0.94 / 0.84, Legendary 0.79 / 0.70, so reading still wins.
- **Tests:** +4 (`twist.test.ts`: twist shares + stable roll, a real Legendary life where every street villain has a twist while Normal keeps plain ones, difficulty ordering, regen won-edge rule). 216 game tests pass.

### Increment 2: Batman's Utility Belt (legend kits)

- **Why:** Batman has no powers, so from 8 to 60 his six was street moves (Haymaker, Slip, Brace…). The Joker was fought with "Haymaker", no Ultimate, nothing that said Batman.
- **Kits (`src/game/kits.ts`, data):** a legend with no powers gets a gear kit. Batman's **Utility Belt** grows on birthdays: Keysi Guard (10), Batarang (12, Expose), Smoke Pellet (14), Grapnel Swing (18), Armored Cape (22, Ward), Explosive Gel (25, Burn), Detective Mode (28, `applies: shock`, so tells can't lie), I Am Vengeance (32). Eight gadgets for six slots, so from 28 you choose. Each covers strike / guard / trick by 14.
- **Rules:** kit moves are normal moves with a `kit:batman` source: they unlock by age, rank up by use, wear in by decade (+1 at 25 / 35 / 45) and take 0.30 of power level (powers 0.55, street 0.35). From **30** the belt's strongest equipped gadget is his **Ultimate**. Only Batman's own life can equip them.
- **Phone:** the Moves shelf now opens the real six-slot picker for Batman (it showed the read-only street six); locked gadgets say "Age 28" and "Detective Mode joins the Utility Belt at 28". A birthday card says "New on the Utility Belt: Batarang." and at 30 that the strongest gadget is now his Ultimate.
- **Arena:** a saved Batman life (14+) can now be drafted as himself with his belt (before, saved lives needed a power). Passive: Read the Room (+1 energy a turn).
- **Sims (Batman to 60, 70 villain boards, 60% play, street / boss):** Normal 0.79 / 0.75 → 0.90 / 0.81, Hard 0.86 / 0.64 → 0.84 / 0.78, Legendary 0.64 / 0.44 → 0.70 / 0.67. A notch above other heroes on Normal (statuses and full coverage do most of it, not raw power: his gadgets hit for less than the old padded street kit); increment 3 retunes Hard / Legendary for every build.
- **Tests:** +4 (`kits.test.ts`: data, age/legend gating, Shock override, a real Batman life to 31 + Arena fighter). 212 game tests pass.

### Increment 1: playtest

- Batman / Hulk / Crownbridge mystery / Metro mystery to 60 on all four difficulties; Hard phone screens. Notes and baseline table in PLAYTEST.md. No code changes.

## 2026-11-08 (am): battle Stage 4 (`devbot/2026-11-08-am`)

Built on `origin/devbot/2026-11-07-night` (c98aa83). `main` is unchanged since 702d68d. Each increment is typechecked, tested, built and loaded at 390×844 before push.

### Increment 5: move-card polish + doc fixes

- **Move cards:** on a card that shows an Answer / Ultimate / gimmick pill, the cooldown length ("cd 1") gives way, so the pill no longer clips at 390px (Holy Hull at 3 energy, cd 1). A cooling move still shows "1t left".
- **Villain cards:** checked: all 49 villains (18 Arena + every legend rogue, including the 15 drawn 2026-11-03 night) already have vector cards. DESIGN's "34" count was stale and is fixed.
- **Skipped on purpose:** Guard Break pierce (§17 item 4). With auto-Burst at 3, Momentum only sits at 4+ in about one fight in ten, and life-sim foes have no guard-stance damage cut to pierce, so it would be an Arena-only rule that rarely fires. Logged in BACKLOG next to the Burst owner's call.
- **Tests:** 208 pass (no new rules).

### Increment 4: Flash Arena balance

- **Why:** after Cheetah's Expose buff, Flash was the weakest Arena pick (0.44). His dash punch, area jabs and phase are all speed, which leaves no status, so his best hits never set anything up.
- **Fix (data):** Infinite Mass Punch now `applies: expose` (they reel and take +15% for 2 turns). Same pattern as Cheetah's Pounce.
- **Arena ladder:** Flash 0.438 → 0.488 (rank 29 → 19 of 29). Roster spread 13.1 → 11.9 points (Thor 0.57 … Cheetah 0.45), inside the 22-point test. Pro AI vs the ladder stand-in 0.44 / 0.33 at perfect / 60% (was 0.43 / 0.32). Other options tried: Speed Steal → Frost 0.45, Phase Through → Ward 0.47.
- **`TIER`** (AI draft weights) re-run on the current rules.
- **Tests:** +1. 208 pass.

### Increment 3: Phase 3 on final canon bosses + regroup after a boss loss

- **Phase 3 (DESIGN §17 item 8):** each legend's final canon boss (the rogue in their last canon fight beat: Goblin, Joker, Ultron, Maestro, Zod, Ares, Red Skull, Loki, Klaw, Lady Deathstrike, Reverse-Flash) gets a second gimmick that replaces the first at 25% HP. Phase 2 gimmicks are unchanged. Only in that legend's own life and from the age of that last beat, so early Goblin or Red Skull fights are the same as before. Table in DESIGN; data in `VILLAIN_PHASE3` (`presets.ts`); `activeGimmick` / `PHASE3_AT` in `duel.ts`.
- **Phone:** the header reads "Boss · Phase 3", a PHASE 3 banner plays with the new gimmick's line and hint, the strip shows a "P3 at 25%" pill and the HP bar a tick while Phase 2 runs, and the strip switches to the Phase 3 gimmick.
- **Regroup:** losing a boss fight locks a rematch with that boss for one month (`regroup` on the save; old saves migrate to none). The case file and the step card say "Regrouping after the loss. X again next month." Winning the rematch clears it.
- **Sims (each final boss's gimmicks on 717 real Normal boards, 60% play, before → after Phase 3):** Goblin 0.62 → 0.58, Joker 0.48 → 0.51, Ultron 0.33 → 0.32, Maestro 0.61 → 0.61, Zod 0.63 → 0.56, Ares 0.63 → 0.59, Red Skull 0.62 → 0.59, Loki 0.48 → 0.40, Klaw 0.63 → 0.51, Deathstrike 0.11 → 0.13, Reverse-Flash 0.62 → 0.63. The boards stop at 45–55, so real 63+ lives (stronger kits) will land higher.
- **Tests:** +8 (Phase 3 data covers exactly the final bosses with a new twist, age / life gating, phase 3 takeover + HUD line, Ultron revive then Phase 3, no-phase3 boards, regroup on loss / split / street, locked step + clear line, save round-trip). 207 pass.

### Increment 2: Tempo interrupt on Charge

- **Rule (DESIGN §17 item 9):** when a Charge boss's charged hit is coming and you hold Momentum 4+, a Strike cuts in first. The charge deals nothing, your Strike counts as a won edge (×1.55, its status, a combo link, +1 Momentum), and it costs 1 Momentum, paid before the Burst check. Guard still braces as before. Shared helper `canInterrupt` in `battle.ts`; `interruptReady` in `duel.ts`.
- **Arena:** same rule for the follower against a charged Strike lead (Bane's Venom Pump, Zod's Kryptonian Soldier). The AI follower values the interrupt when it has the Momentum. Logged as `interrupt` on the turn, so online replay stays deterministic.
- **Phone HUD:** the gimmick strip reads "Incoming! Guard, or Strike to interrupt"; during the wind-up it adds "Momentum 4 interrupts it" once you're at 3+. The tell card says "Guard to brace, or Strike to interrupt (−1 momentum)", the Momentum row shows INTERRUPT READY, strike cards get an Interrupt tag, and a cyan INTERRUPT beat plays when it lands.
- **Sims (Bane's gimmick on 717 real Normal boards):** a perfect player who takes every interrupt gets one in 11% of charge fights (14% on Hard); win rates do not move (Normal perfect 0.95, 60% 0.63). Auto-Burst at 3 means Momentum rarely sits at 4, so this is a skill reward, not a balance lever. Arena ladder unchanged (spread 13.1; Bane 0.48 → 0.46).
- **Tests:** +4 (helper, life-sim interrupt + Burst on the rest, determinism + wind-up restart, Arena interrupt + replay). 199 pass.

### Increment 1: playtest + Charge cadence fix

- **Playtest:** NYC foster mystery, Stacks lab-program God Mode (elasticity + super strength), Captain America; to 45 on all four difficulties. Notes in PLAYTEST.md.
- **Fix:** a Charge boss now throws its charged hit every third turn (`CHARGE_EVERY = 3` in `duel.ts`). Before, the countdown stuck at 0 after the first charged hit, so every turn after it was charged. Same hint, same answer (guard or breath).
- **Effect (lab, Bane's gimmick on 717 real Normal boards):** perfect play 0.99 → 0.95, 60% play 0.64 → 0.61. One charged hit a fight instead of two.
- **Tests:** +1 (`stage4.test.ts`). 195 pass.

## 2026-11-07 (night): battle Stage 3 start — loadout coverage (`devbot/2026-11-07-night`)

Built on `origin/devbot/2026-11-07-pm` (1f40f97). `main` is unchanged since 702d68d. Each increment is typechecked, tested, built and loaded at 390×844 before push.

### Increment 2: Cheetah Expose + Ultimates + environment chips

- **Cheetah:** Pounce now `applies: expose`, so her kit lands a status. Arena ladder win rate 41% → 45% (spread 13 pts; Flash is now the floor at 44%).
- **Signature Ultimates** (`battle.ts`, shared): one of the six moves, never a 7th button. Life-sim marks the strongest equipped move of your focus power once that power is mastery 4+; Arena marks each fighter's strongest move. Armed only at full Momentum (5); costs all 5 Momentum + the move's Energy; deals ×2.0 and does not stack with Burst. Cinematic ULTIMATE beat + purple card glow when ready.
- **Energy matters more:** mastery-3 moves cost at least 2 energy, mastery-4+ at least 3; Ultimates also floor at 3.
- **Environment chips:** each city maps to a stage tag that nudges one element (+10% damage on a won edge). Readable chip under the foe name (`pier · ice +10%`, etc.). Arena uses the energy tag.
- **Sims:** Normal 60% street 0.74 / boss 0.55 (design target ~55% boss). 194 tests.

### Increment 1: loadout coverage

- **Why:** pm playtest found Superman's six at five strikes and mystery lives with no guard, so a strike tell had no answer but breath. Win rates swung more with the build than with the difficulty.
- **Auto-fill:** `fillLoadout` still prefers a missing style when topping up empty slots, and once the six is full it will swap a surplus-style slot for a bench move of the missing style (so a late-unlocked Stand Firm actually lands in the six).
- **Street padding:** `battleMoves` still pads empty slots by missing style first; if a full six still lacks a style, the weakest surplus-style move is swapped for a street cover of the missing style for that fight only.
- **Moves shelf warning:** clear amber line when the equipped six has no guard / strike / trick (e.g. "No guard move: strike tells have no answer").
- **Authored / catalog defaults:** Stand Firm, Dome and Aegis unlock as the *first* move of durability / force-field / aegis-shell; Ground Pound is a trick; Black Panther's Receipt is a trick. Superman / Wonder Woman / Harbor Bay kits now ship with a guard in the six.
- **Sims (new builds: Harbor military mystery, Dustreach celebrity, Neon fire+speed God Mode, Black Panther, Wonder Woman, Hulk, Flash, Superman), Normal 60% play:** street 0.74 / boss 0.54 (was 0.61 / 0.46 on the night baseline before this fix). Superman street 0.63 (was the weak outlier). Design target for Normal boss is ~55%.
- **Tests:** +6 in `coverage.test.ts`. 189 pass.


## 2026-11-07 (pm): battle Stage 2 (`devbot/2026-11-07-pm`)

Built on `origin/devbot/2026-11-07-am` (f9179b9). `main` is unchanged since 702d68d. Each increment below was typechecked, linted, tested, built and loaded at 390×844 before it was pushed.

### Increment 3: Arena shares the battle book

- **Same rules in both modes:** Arena bouts (vs AI and online) now use the life sim's Momentum (+1 on a won edge, +1 guard break, +1 Finisher; cap 5), **Burst** (×1.45 on your next winning hit at 3+), the five **statuses** (same element table, max 2, non-lethal Burn, breath clears one) and the mix-up **Finisher**. Shock also stops a leader from faking its tell.
- **AI:** values a winning hit higher with Burst banked and likes landing a status the rival doesn't have yet. A Shocked AI leader stops planning feints.
- **HUD:** Momentum pips next to Energy, status pills on both HP cards, combo pips in the scene, the BURST / FINISHER banner, status words on the fighter they hit, status/Burn lines in the turn log, a "true" mark on a Shocked rival's tell, "Shocked · no fakes" in place of the tell picker, and status icons on move cards. The tell picker is slimmer so it fits beside the Momentum pips at 390px.
- **Balance:** bouts are ~7.3 turns (was 8.1). Pro AI vs the ladder stand-in is 0.44 / 0.33 at perfect / 60% play (was 0.46 / 0.35). Roster spread 16 points (Thor 57% … Cheetah 41%), within the 22-point test limit. The `TIER` table is re-run on the new rules.
- **Burn never lands the knockout** in either mode (it stops at 1 HP), so a revive or a last hit always decides the fight.
- **Tests:** 3 more in `battle.test.ts` (Arena status + Burst, Shock vs feint + non-lethal Burn, deterministic replay for online). 183 pass.

### Increment 2: battle Stage 2 in the life sim — statuses, combos, habit reading

- **Statuses** (`battle.ts`, shared): a move that wins the style edge leaves its element's status. Burn (fire, arcane), Frost (ice, storm), Shock (lightning, energy: tells can't lie, −1 energy), Expose (psychic, shadow, warp, light, gravity), Ward (shield, life: lands on you, next hit −35%). Two a side at most. Breath shakes off your oldest harmful status. Foes inflict them too.
- **Mix-up combo:** three won edges, never the same style twice running, fire a **Finisher** (bonus hit + Momentum). An even trade holds the chain; a lost edge or a breath drops it.
- **Habit reading:** the same style twice running lets Normal / Hard / Legendary foes fake a tell that baits it (25 / 40 / 55%). The stage shows a "Habit · tells may be bait" warning first, so it's fair; Shock cancels it.
- **Runway and bosses:** both HP pools ×1.35 and case bosses ×1.45 HP, so fights last ~6 turns and bosses are harder than street foes. Retuned difficulty so Normal lands ~58% for a 60% player (was ~66%). Win rates per difficulty and play style are in `PLAYTEST.md`.
- **Burst no longer wastes itself:** banked momentum (3+) now spends on your next **winning** hit, not on whatever move comes next (it used to fire on a guard that lost the exchange). Still automatic, so the owner's "manual arm" question stays open.
- **Feel:** a cinematic BURST / FINISHER slash and word with shake and haptics; status words pop on the fighter they hit; status pills under both HP bars; combo pips in the stage (the stage is 10–18px shorter so all six moves still fit beside a boss gimmick strip); move cards show the status they leave; the breath button says what it will clear; a "true" mark on a Shocked foe's tell.
- **Tests:** `battle.test.ts` (9): element table, status cap/refresh/expiry, Ward vs Burn, cleanse, combo rules, habit bait, Burn/Frost/Ward/Shock in real duel turns, Finisher determinism, difficulty read curve.

### Increment 1: playtest + move-card fix

- Playtest of new builds (Crownbridge wealthy mystery, Metro God Mode lightning + force field, Spider-Man / Batman / Superman) at all four difficulties. Results and the Stage 2 plan are in `PLAYTEST.md` and `BACKLOG.md`.
- **Fix:** in gimmick fights the six move cards were squeezed to fit, cutting off their bottom line. The grid now keeps each card's full height (`auto-rows-max`), and the cards are more compact (one-line effect, no rank chip in fights, the Burst hint moves to the glow and the effect line), so all six fit on a 390×844 screen even with a boss gimmick strip.

## 2026-11-07 (am): battle redesign Stage 1 — life difficulty + Momentum (`devbot/2026-11-07-am`)

Built on `origin/devbot/2026-11-04-am` (2aed31b). Full signature system written into `DESIGN.md` §17; Stage 1 ships complete and playable.

### Life difficulty (`difficulty.ts`, CreateScreen, Legends, engine, save)

- Chosen at birth: **Story / Normal / Hard / Legendary** (default Normal). Persisted on the save; old saves migrate to Normal.
- Scales every life-sim duel: foe HP, foe damage, AI hate-read, and a small foe level bump on Hard/Legendary.
- **Normal is harder than the previous baseline** (foe HP ×1.10, damage ×1.06, AI 0.48 vs old ×1.0 / 0.42).
- Picker on the new-life stepper footer and on the legend Begin button.

### Momentum (`duel.ts`, Duel.tsx)

- Second resource next to Energy. Cap 5. Builds +1 on style-edge wins, +1 extra on Trick-vs-Guard (guard break). Breath never builds.
- At 3+ Momentum the next real move **Bursts** automatically (spend 3, ×1.45 damage). UI marks Burst-ready moves.
- Pure and deterministic — safe for future Arena online replay.

### Feel

- Animated HP bars with a delayed ghost trail and a kick flash on hit.
- Momentum diamonds under the Energy row; Burst chip on move cards.

### Tests

- `difficulty.test.ts`: catalog, persistence, momentum/Burst/guard-break, foeDamage, balance sims per difficulty.

### Verification

- typecheck clean; 171 game tests (5 new in difficulty.test.ts); lint (plumbing `no-empty` left alone); production build; 390×844 screenshots in PLAYTEST.


## 2026-11-03 (pm + night, shipped Nov 4 am): mixing at 15 with mentors, Skip to 15, Arena purses, every villain carded (`devbot/2026-11-04-am`)

Built on `devbot/2026-11-03-am` (head 0de3abd, same content as main 702d68d). The 3 PM and 9 PM passes were cut off before pushing, so their work ships here. The Nov 4 am pass re-ran typecheck, lint, 166/166 game tests and the build, and reloaded it at 390x844 (Powers lock card and Skip to 15 sheet checked).

### Power mixing unlocks at 15 (owner's call) (`mentors.ts`, `engine.ts`, `PowerLab.tsx`)

- **Why:** heroes got too strong too early. Light Speed could be braided at about 12.
- **The rule:** no mixing before **15**, in every mode. The engine refuses `mix|` and the mentor's braid lesson before then (`MIX_AGE`, `mixLock`). The required chain is unchanged: **Fire Control + Super Speed = Light Speed**, then **Light Speed + Super Strength = Lightning Strikes**. Generation 2 is still the hard cap.
- **Lock card:** before 15, Powers ▸ Book shows **"Mixing unlocks at 15"**. It has the years to go, an age track, who will train you (God Mode legends name their teacher) and how many recipes you already hold. It also has a **Skip to 15** button.
- The "Learn 1 new power" goal now says "Mix (15+)".

### Mentors (15+) (`mentors.ts`)

- On the 15th birthday a mentor finds you, with a banner and a major life-log line. Old saves already past 15 get their mentor when they load.
- **Who:** God Mode legends get their canon teacher, bent for this universe:
  - Spider-Man: Ben Parker
  - Batman: Alfred
  - Iron Man: Ho Yinsen
  - Hulk: Leonard Samson
  - Superman: Jonathan Kent
  - Wonder Woman: Antiope
  - Captain America: Erskine
  - Thor: Odin
  - Black Panther: Zuri
  - Wolverine: Ogun
  - The Flash: Jay Garrick
- Other lives get a mentor matched to their upbringing (12 of them), then to their city (8), then a fallback coach. All of it is data: one row per mentor.
- **Lessons:** one a month, on the mentor card. The card is in Powers ▸ Book, and **night:** now in Powers ▸ Teachers too, since that's where players look for a teacher. The three lessons:
  - **Guided braid:** prefers the required chain, and the new power lands a little drilled.
  - **Drill:** a mastery boost on your focus power.
  - **Study night:** writes a recipe into your book.
- Bond grows with each lesson, with diminishing gains, and raises the boost by up to +50%.

### Skip to 15 (`skip.ts`, `FastForward.tsx`)

- A big **Skip to 15** card in the Skip sheet and on the lock card. It's the quick way through childhood.
- It still stops for:
  - the power reveal (random age 7–15)
  - chapters and story beats
  - villain cases and fights
  - low health
  - the mentor's arrival
- Small everyday moments (rainy days, birthdays, friendly cape drop-ins) are settled for you. The skip picks the answer that best fits your stats and lists it afterwards ("Small moments handled").
- A long skip draws one track segment per year, so it stays readable on a phone.

### Arena purses (`arena.purse.ts`, `store.ts`, `Arena.tsx`)

- If one of your 3 picks is your **active life's** character, the match pays into that life.
- **Win purse:** Rookie $600, Pro $1,500, Legend $3,500. Online counts as Pro.
- **Adjustments:** +25% for a 2–0 sweep. A loss pays a 20% appearance fee. Under-18s get half.
- **Anti-farm:** each day's purses run 100%, 100%, 70%, 50%, 30%, then close until tomorrow. Each match pays once, keyed by seed and picks, so reloads and rematches can't pay twice.
- **Where it shows:**
  - a gold **ARENA PURSE** line on the results screen
  - a major line in the life log ("Arena loss, 0–2, against … An appearance fee of $300.")
  - a card banner
  - a hint in the Arena hub ("Draft Mara Quinn and the match pays their life")
- Teams of only legends and villains earn nothing.

### Every villain has a card (`VillainArt.tsx`, `villainArt.data.ts`)

- **pm:** 16 legend rogues got cards: Mysterio, Vulture, Kraven, Two-Face, Riddler, Scarecrow, Penguin, Whiplash, Mandarin, Leader, Brainiac, Winter Soldier, Zemo, Klaw, Circe and Malekith. In life-sim fights an illustrated rogue now **stands in the ring as its card**, with hit-flash and lean-in.
- **night:** the last 15 got cards:
  - Justin Hammer (drones, tinted glasses)
  - Red Hulk
  - The Maestro (grey beard, throne)
  - Ares (fire-crested war helm, spear)
  - Medusa (snake crown)
  - Crossbones
  - Surtur (horned fire crown, Twilight Sword)
  - Man-Ape (white pelt, war club)
  - Namor (trident, jade collar)
  - Lady Deathstrike (talons)
  - Omega Red (carbonadium coils)
  - Silver Samurai (kabuto, glowing katana)
  - Captain Cold (parka, cold gun)
  - Gorilla Grodd (telepathy rings)
  - Mirror Master (mirror visor, shards)
- That makes **49 villains: all 18 Arena villains and every legend's rogues**. A new test makes sure every preset rogue maps to a card.
- **Painted (AI) portraits are still blocked:** no image-generation tool is available to the dev bot, so these are the vector cards. Hero portraits are inlined webp data URIs (`src/assets/art`), so painted villains can drop in the same way later.

### Fixes

- The foe figure no longer loses its mirror while idle: float and mirror are now on separate layers (pm).

### Verification

- typecheck clean.
- lint: 0 new errors. One pre-existing error in the Grok Build plumbing `src/lib/app-data/client.server.ts`, left alone.
- 167/167 game tests pass.
- The `scripts/` plumbing suite has the same 12 pre-existing failures as main.
- Build OK.
- Playtests are in PLAYTEST.md (night pass).

## 2026-11-03 (am): illustrated villain cards, life-sim boss reveal (`devbot/2026-11-03-am`)

This branch stacks on `devbot/2026-11-02-night` (head 6f82bef), so it also carries the Nov 1 night and all three Nov 2 passes.

### Illustrated villain cards (`VillainArt.tsx`, `villainArt.data.ts`, `Arena.tsx`)

- **Why:** in Arena the 11 legends had painted portraits, but all 18 villains were paper-doll figures, so half the draft grid looked unfinished. No image-generation tool is connected, so these are hand-drawn vector busts. They're sharp at any size and add no download weight.
- **What:** one data-driven spec per villain (suit, skin, rim light, eye shape and glow, silhouette pieces) over a shared bust. Some examples:
  - Goblin: pointed hood, yellow slit eyes and a pumpkin bomb.
  - Venom: white eye patches and fangs.
  - Doc Ock: four tentacles.
  - Loki: horns.
  - Hela: a spiked crown.
  - Ultron: a chrome face plate.
  - Doomsday: bone spurs.
  - Red Skull: a red skull.
  - Killmonger: a fanged mask.
  - Reverse-Flash: yellow with a lightning bolt.
- **Backdrops:** each villain gets its own skyline, embers and swirl, seeded from its id so it never changes.
- **Where:** the draft grid, the fighter sheet, order slots, the reveal, the round intro and the duel cards. Each view crops the bust to fit: `card`, `head`, `wide` or `tall`. Saved lives keep their figure.
- The spec table is typed on `VILLAIN_ART_IDS`, so adding an Arena villain without art fails the typecheck. A new test (`villainart.test.ts`) also checks the roster.

### Life-sim boss reveal (`Duel.tsx`, `styles.css`)

- When a fight is against a named rogue with art (Green Goblin, The Joker, Iron Monger, Abomination, and all 18 others), the fight header shows the villain's face. The intro becomes a **"FIGHT!" card**: the villain card slides in tilted, in the foe's colour, and holds for 1.5s. With reduced motion on, it skips the slide.
- Other foes keep the old intro.

### Fixes

- The Arena battle log said "a breath beats Necroswords" in lower case. It now says "Your breath…" / "Hela's breath…".

### Playtest notes

- The night backlog's "Light Speed never combines" came from bad gift ids in the playtest harness, not the game (see PLAYTEST).

## 2026-11-02 (pm + night): Arena online, duel-card battle stage, moves re-check (`devbot/2026-11-02-pm` → `devbot/2026-11-02-night`)

This branch stacks on `devbot/2026-11-02-pm` (head 2e0fac8). The pm pass pushed its online code but no docs, so this entry covers both.

### Arena online 1v1 (pm pass: `arena.online.ts`, `arena.rooms.server.ts`, `arena.service.ts`, `arena-net.ts`, `OnlineArena.tsx`, `migrations/0002_arena_rooms.sql`)

- **Rooms:** "Play a friend" creates a 6-letter room code (no I/O) and a share link. The friend joins by link (code prefilled) or by typing it. Rooms live 6 hours.
- **Fair play by commit-reveal:** the room stores a public event log that both phones replay through the same seeded engine. Draft picks are public; fight orders, moves and leads stay hidden on the server until both sides have committed, then flip at once.
- **Turn timer:** 30s a turn, 45s for the order, 20s for "ready". A missed turn auto-plays "Catch a breath" (or an auto pick/order); 3 timeouts forfeit the match. Each timeout shows a toast and a pip.
- **Reconnects:** the client polls (slower when the tab is hidden), shows Live / Reconnecting, and flags "rival connection lost" after 8s. A reload drops you straight back into the same turn.
- **Also:** rematch (back to the draft), leave = forfeit, and saved-life fighters are re-priced onto the 5–9 band server-side. Each phone sees itself on the left.

### Battle stage: duel cards (night: `Arena.tsx`, `arena.css`)

- The paper-doll stage was the weakest Arena screen. It is now two tilted **duel cards** facing each other, like a card-battler: painted legend art full-bleed, a name plate with the fighter's colour, a shine sweep, a red hurt flash on hits, a cyan shimmer when guarding, and a grey drop on a KO. Idle cards float gently.
- Villains and saved lives (no painted art yet) get their home-city skyline, a glow in their colour and the full figure. Very dark colours fall back to villain red / hero gold so the card never goes muddy.
- **Fixed:** figures on the right card rendered as solid black silhouettes. Chrome drops the SVG's volume filter under a `scaleX(-1)` parent, so figures are no longer mirrored (they face front anyway).

### Moves (night: `move-picker.css`)

- The armed slot's "breathe" animation bobbed the slot up and down, so the tap target moved under your finger (Playwright flagged it as never stable). It is now a gold glow pulse that stays put.

### Housekeeping

- Fixed 4 `prefer-const` lint errors in `arena.online.test.ts`.

## 2026-11-02 (am, arena): Arena mode, moves dock fix (`devbot/2026-11-02-am`)

This branch stacks on `devbot/2026-11-01-night` (head 903f444), which is not merged yet.

### Arena: 1v1 versus, draft 3, best of 3 (`arena.ts`, `arena.roster.ts`, `arena.lives.ts`, `Arena.tsx`, `arena.css`)

- **Way in:** a red/blue **ARENA** button on the title screen ("1V1 · DRAFT 3 · BEST OF 3").
- **Flow:** hub (pick Rookie / Pro / Legend) → snake draft → secret fight order → both orders flip → round intro → battle → round result → match result. Each screen is built for 390px touch.
  - **Draft:** 29 fighters. That is the 11 legends with their painted art plus 18 signature villains (Goblin, Venom, Doc Ock, Joker, Bane, Iron Monger, Ultron, Abomination, Lex, Zod, Doomsday, Cheetah, Red Skull, Loki, Hela, Killmonger, Sabretooth, Reverse-Flash). **Your own living heroes** (age 14+, with a power) can be drafted too, from a "Your lives" tab. The pick order is You, Rival, Rival, You, You, Rival. Tapping a card opens a sheet with HP, the passive and all six moves.
  - **Order:** tap your three into rounds 1–2–3 and lock. The rival's order stays hidden until both are locked, then both flip at once.
  - **Battle:** each fighter fights exactly once and the match is decided by the most rounds won. If a match is clinched 2–0 you can still play round 3 or skip it. Ties go to total HP margin.
- **Rules (pure, seeded engine, deterministic):**
  - Six moves each, using the game's own strike > trick > guard > strike triangle and its move kinds (burst, area, status, guard, dash).
  - Hits land simultaneously.
  - One side **leads** each turn and shows a **tell**: the style it is about to use. The lead alternates every turn and every round.
  - The follower sees the tell and answers. The UI tags the answering moves "Answer".
  - The leader may **fake the tell** for +2 energy.
  - Energy starts at 7, caps at 10 and refills 3 a turn. "Catch a breath" gives +3 energy and blocks like a weak guard.
  - Cooldowns apply to 8–10 power area and burst moves.
  - Bouts have a 24-turn cap (decided on HP %) and last about 8–9 turns on average.
- **Every fighter has one passive.** Examples:
  - Spider-Sense sees through every feint.
  - The Joker and Loki feint for free.
  - Ultron revives once.
  - Doc Ock's arms and Hela's Necrosword Rain chip you until an area hit lands.
  - Venom's symbiote fogs his tells.
  - Batman's Contingency Plan gives +1 energy a turn.
  - The Flash leads the first turn.
  - Wolverine and Sabretooth regenerate unless a trick or status move lands.
  - Black Panther's kinetic suit stores damage.
  - Hulk hits harder the more he is hurt, and Abomination, Goblin and others enrage.
  - Thor's area moves are Worthy.
  - Doomsday and Reverse-Flash adapt to repeated moves.
  - Iron Monger and Lex wear armour.
- **Villain kits** reuse their preset boss moves, so Arena and life-sim bosses always agree, plus 2 arena moves so every kit covers all three styles.
- **Saved lives** bring their equipped six, re-priced onto the Arena 5–9 band so a veteran can't one-shot the roster. Their passive comes from their first power's element. They are drawn as the hero you built.
- **Saves:** the match is saved to `superlife.arena.v1` after every action. A reload drops you straight back into the same turn, and the AI's seeded dice replay identically.
- **AI:** expected-value move choice with softmax noise, feint baiting and tell-trust that learns your feint rate. The levels differ in how much they bluff and how much they use your tells:

  | Level | Bluffing | Uses your tells |
  |---|---|---|
  | Rookie | rarely bluffs | reads 10% |
  | Pro | bluffs | reads 25% |
  | Legend | feints freely | reads 70% |

- **Balance:**
  - HP was auto-tuned on mixed-level AI-vs-AI sims.
  - Pro AI-vs-AI, 40 bouts a pair, gives a **17.4-point spread**: 38.9% for Spider-Man to 56.3% for Thor, with 0% time-outs.
  - On the mixed ladder, every fighter is within 22 points (this is a test).
  - Spider-Man is the counter-pick to bluffers: weak against Pro, strongest against Legend.
- **Difficulty ladder** (a scripted "follow the hints, bluff 30%" player, bout win rate): **Rookie 74%, Pro 46%, Legend 13%**.
- **Online play is not in yet.** A "VS a friend online · Soon" card is shown and the plan is in BACKLOG. The engine is already lockstep-ready: same seed plus same actions gives the same match.
- **Faces:** unmasked fighters get fixed faces, e.g. a green Hulk and Abomination, Doc Ock's glasses, the Joker's green hair and a bearded Thor and Zod.
- **Tests:**
  - `arena.test.ts` has 14 tests: roster integrity, preset-built villain kits, determinism, termination, RPS, energy and cooldowns, illegal-action fallback, feints, Sense, passives, the Flash leading, full match flow, draft refusals, the balance spread and the difficulty ladder.
  - `arena.lives.test.ts` has 2 tests.

### Moves: armed quick-dock fix (`move-picker.css`)

- When a slot or move was armed, the sticky quick-dock let the slot outlines underneath peek through the 1rem gap above it, which looked like a double border while scrolling. The dock now masks that gap with a panel-coloured strip and fades its bottom edge.
- Long move names in the dock wrap to two lines instead of being cut off.
- **Verification:** touch-tap Playwright runs at 390×844 covered five saves: mystery life before the reveal, just after the reveal, at 28, a Wonder Woman legend at 30 and a Build-your-own life at 15. They tested slot→move, move→slot, reorder, 12 rapid swaps, double-taps, locked-move taps, scroll stability and reload persistence. **0 failures.** No logic bug was reproduced. The 11-01 atomic swap fix holds.

## 2026-11-02 (am): Fast age-up, slower kid power, five lives (`devbot/2026-11-01-night`)

### Fast-forward a season or a year (`skip.ts`, `engine.ts`, `FastForward.tsx`, `GameApp.tsx`)

- **The gold Skip button** replaces the old "To N" button and opens a sheet with two choices: **Skip a season · 3 months** or **Skip to age N**.
- **Each month resolves itself** with sensible defaults, biased by what you have been doing lately (`Game.habits`: action weights, sub-picks and your average minigame score).
  - Only routine actions are auto-played: school, training, a job, rest, hobbies, books and friends.
  - Training is skipped when health is low.
  - Hobbies get more weight when joy is low.
  - Repeating the same action in a month costs more, so a skip never grinds one thing.
- **The skip stops by itself** for:
  - the reveal, story beats and chapter changes;
  - case files and any choice event;
  - fights;
  - health below 25;
  - a bond falling below 20;
  - death.
  Fewer random events and encounters fire while skipping, but any event that would need a choice still stops the skip.
- **A summary card** follows every skip. It shows:
  - the months covered, with a track bar;
  - why the skip stopped;
  - stat changes and rank changes;
  - a "What you did" list and a "Meanwhile" list.
  Its buttons are Again and Back to life (or Take it from here).
- **It can't be cheesed.** Auto-played minigames score your own average minus 8% (clamped to 30–72%). When both play the same plan, a skip ends slightly behind hand play on power, mastery, money and fame, with joy about equal. `ageup.test.ts` locks this in.
- **Why:** the user said childhood and the teen years drag. Reaching 18 took about 1,176 taps month by month. It now takes about 145 with year skips. The old "To N" button took about 190 taps but wasted every month.

### Kids grow slower (`mastery.ts`, `engine.ts`)

- Young mastery caps are lower:
  - under 8: 1.4 (was 1.6)
  - under 12: 2.3 (was 2.6)
  - under 16: 3.4 (was 3.8)
  - under 19: 5 (was 5.6)
- A new `youthGain` scales power gains before 18. The base multiplier is 0.6 under 12, 0.7 under 16 and 0.85 under 18. Gains also shrink as you near the age cap, down to a floor of 0.3. Losses are unchanged, and existing saves are never pushed below their current level.
- Teen training EXP is now ×0.62 (was ×0.72).
- **Power at 18:**
  - random play: 2.21 → 1.87
  - a grinder: 4.67 → 3.39
- By 30, power is back level with before (7.70 vs 7.74).
- Adult duel win rates are unchanged: about 96% with perfect play, about 75–84% at 60% play and about 40% with random play.

### Five lives (`save.ts`, `store.ts`, `Lives.tsx`)

- **Five save slots** (`superlife.life.N.v1`), with an index in `superlife.lives.v1`.
- **The "Your lives" screen** is opened from the title screen or the menu. Each card shows:
  - the portrait (or legend art), name and age;
  - the mode: Mystery, God Mode · hero, or Build your own;
  - when the life was last played.
  From a card you can Continue (or read the obituary of a dead life). Deleting a life asks for confirmation in a bottom sheet. Empty slots offer "Start a new life".
- **Migration:** the old single save moves into slot 1 once, and only when every slot is empty. The old key is kept as a backup. A deleted life never comes back.
- **Slots are isolated:** a save only ever writes its own slot. When all five slots are full, New life opens Your lives instead of overwriting one.
- Tests: `ageup.test.ts` has 12 new tests, covering youth growth, skip stops, fairness, migration, slot isolation and slot modes.

## 2026-11-01 (night): Boss phases and villain gimmicks, fights that grow with you (`devbot/2026-11-01-night`)

This branch is based on `main` at c41ff09, which already includes PR #3.

### Every legend rogue fights like themselves (`duel.ts`, `presets.ts`, `gimmicks.ts`, `Duel.tsx`)

- **Two-phase boss duels.** At 55% health (each villain can set its own point), a boss enters **Phase 2**. A full-screen card names the move, gives the villain's line, and tells you how to beat it. The arena then takes on the gimmick's colour.
- **Ten gimmicks.** Each is a data row in `presets.ts`. All 49 legend rogues have a named one (`VILLAIN_GIMMICKS`):
  - **armor:** Iron Monger's plating takes two trick hits to crack. Then he takes +20%.
  - **enrage:** the Goblin and Abomination hit harder but leave openings.
  - **fog:** Venom and Scarecrow hide some of their tells.
  - **feint:** the Joker and Mysterio sometimes show a false tell.
  - **adapt:** the Riddler soaks a repeated move.
  - **regen:** heals each turn until a trick or status move stalls it.
  - **revive:** Ultron's backup body gets up once at 40%.
  - **coin:** Two-Face flips every turn. Heads, he hits ×1.6. Tails, he is open.
  - **swarm:** Ock's arms and Penguin's goons chip damage each turn until an area move clears them.
  - **charge:** Bane's Back Breaker is telegraphed every third turn. Guard it or eat it.
- **Generic bosses** (case villains in ordinary and mystery lives) get a gimmick from their power: brute strength charges, ice armours up, healers regenerate, and so on.
- **The HUD explains each gimmick:**
  - a strip under the health bars with the gimmick icon, a `At 55%` / `Live` tag, and its live status ("1 plate left · trick cracks them", "Big hit in 2 turns" with three pips);
  - a tick on the boss health bar where Phase 2 begins;
  - a pulsing red tell when a charged hit is coming, and a `Tell: ???` chip in fog;
  - a flipping HEADS/TAILS coin, armor plate pips, swarm motes, and green +N heal floats;
  - `Cracks` / `Clears` / `Stalls` / `Adapted` tags on the move cards;
  - on a loss, a "Next time, <gimmick>" tip on the K.O. card.
- **Why:** BACKLOG #4 (villain gimmick phases), and the user's ask that signature villains be real bosses with fitting movesets. Before, every boss was a bigger health bar.

### Legend cases end at a legend rogue (`engine.ts`)

- In a legend life, the boss step of a city case is now fought against one of that hero's rogues whose debut has passed. "Cinder Mallory was the front. Whiplash was paying for it."
- The pick is stable per case, so a retry faces the same rogue.
- **Why:** Iron Man was fighting Cinder Mallory and Static Bishop as case bosses.

### Fights scale with the hero (`moves.ts`, `engine.ts`, `duel.ts`)

- **Playtest finding:** at perfect play, a mystery hero won only about 21% of fights and Iron Man about 40%, while an unpowered Batman won 100%. Player moves stayed at 4–6 power from age 11 to 70, while foes grew to 10–17.
- **Power moves** now gain an edge from power level and mastery: round(PL × 0.55) + (rank − 1).
- **Street moves** gain round(PL × 0.35).
- **Unpowered legacy kits** (Batman) are trimmed by round(PL × 0.15).
- **Boss health** is now ×1.25.
- **Catch a breath** now counters a telegraphed strike for half your best move's power. Many loadouts had no guard move, so a strike tell could not be answered.
- **Auto-filled loadouts and street padding** cover missing styles first. Hand-picked slots are never touched. Still exactly 6 moves.
- **Sims** (perfect, 60% and random play):
  - regular fights win 0.96 / 0.73–0.85 / 0.36–0.43;
  - bosses win 0.82 / 0.63 / 0.29.
- **Pure duel core:** `Duel.tsx` now runs on `duel.ts` (`startDuel`, `playTurn`), so the balance can be tested headless.

### Small fixes

- Female rogues (Hela, Cheetah, Circe, Medusa, Lady Deathstrike) were drawn as men. `villainSex` now follows the data.
- New test file `night.test.ts` (11 tests). It checks that every rogue has a gimmick, that each gimmick mechanic fires, that a smart-play win band holds against all 49 rogues, edge scaling, loadouts of 6 with more than one style, and stable arc patrons.
## 2026-11-01 (moves fix): a six-move picker that does what you tap (`devbot/2026-11-01-moves-fix`)

Branches from main `c41ff09`. The player reported move selection felt buggy. It was reproduced at 390x844 with real touch taps in a mystery life before and after the reveal, a Spider-Man legend, Build your own, after a new power, and after reloading.

### Bugs found

- **Swapping was close to impossible.** Dropping a slot left the six at five. The next tap ran the auto top-up first, which put the first bench move straight back (often the one you'd just dropped). Then the move you tapped got "Six moves already". Re-adding a dropped move actually removed it again, while the picker said "is in the six".
- **Wrong move under the thumb.** Every tap added a notice above the picker and changed the banner on the top card, so the list moved down by about one row. On iOS Safari, which doesn't anchor scrolling, the next tap landed on the wrong move.
- **Mixed messages.** The picker's own note and the engine's banner could disagree ("Push is in the six" / "Push leaves the six").
- **Reload changed your six.** A five-move loadout got silently refilled on load, so what you saw after a reload wasn't what you'd left.
- **Blank Moves tab before your power wakes.** The shelf rendered nothing at all.
- The street moves shown in empty slots didn't match the ones a fight actually used.

### Fixes (`moves.ts`, `engine.ts`, new `MovePicker.tsx` + `move-picker.css`, `PowerLab.tsx`)

- **Atomic swaps.** The new `slot|index|moveId` action uses `placeInSlot`. A bench move replaces the slot's move in one step, and an equipped move trades places, so you can reorder. The six never shrinks to five.
- `toggleLoadout` (old `equip|`) now drops a move by swapping in the next bench move in the same slot. It's never the move you just dropped. If every move you know is already equipped, it refuses.
- **New picker.**
  - Numbered 6-slot grid with element icons, kind, energy and rank, plus a "5/6" counter.
  - Swap either way: tap a slot then a move, or a move then a slot. A picked-up slot glows and the possible targets turn dashed.
  - Tapping an equipped move in the list picks up its slot.
  - When a bench move is picked, a quick-slot strip appears in the sticky status line so you never scroll back up.
  - Cancel button. Haptic tick and sound on success, buzz on refusal. The slot that changed pops.
- **No layout shift.** Feedback lives in a fixed-height sticky line inside the card. Slot swaps and Save/Load sets no longer change the card banner.
- The list is split into **Ready** and a collapsible **Locked** list. A locked move tells you the power, the rank it needs and where to train it.
- Before the reveal, or in an unpowered life, the Moves tab shows the six street moves and explains when your power's moves arrive. Padded slots use the same street moves as `battleMoves`.
- Buttons use `touch-action: manipulation` and have no tap highlight.

### Tests

- New `src/game/test/loadout.test.ts` with 11 tests.
  - Regressions for the drop/re-add flip and the first-bench-only refill.
  - Atomic swap and reorder; locked, unknown and out-of-range picks.
  - Full-six refusal; refused drop with no bench.
  - Exact order kept across a JSON save and reload; save/load sets.
  - 120 random swaps with reloads across five kinds of life, always exactly six.
  - Pre-reveal street six; a new power never reshuffles a full six.
- Game tests: 99/99. Typecheck, lint and build pass.
- Touch checks at 390x844 with scroll anchoring off to act like iOS Safari: slot then move, move then slot, reorder, the element under the finger doesn't change, cancel works, reload keeps the exact six, and there are no console errors.
- Screenshots: `superlife-shots/moves-fix/before` and `/after`.

## 2026-11-01 (pm): Legends grow in canon, goals that survive their decade, Chase run, legend grid (`devbot/2026-11-01-pm`)

This branch stacks on the unmerged `devbot/2026-11-01-am`, `devbot/2026-10-31-night` and late Oct 31 work.

### Legends learn powers that fit them (`kin.ts`, `presets.ts`, `combo.ts`, `engine.ts`, `events.ts`)

- Each legend now has a **kin**: the base powers under its canon kit, plus a short hand-picked `stretch` list in `presets.ts` (for example, Flash can stretch to lightning, phasing and regeneration; Thor to weather and flight).
- Teachers, the trainer-lesson event, yearly power offers, heist sparks and off-book mission lessons now **lean 85% toward kin powers**. Teachers list fitting powers first.
- Nothing is banned. Braiding an off-kin pair on purpose still works, which counts as bending canon.
- **Why:** BACKLOG #3. In 10-legend sims, about 171 of 239 learned powers were off-kin (Flash with Telepathy, Wolverine with Sorcery). Now it is about 60.
- Ordinary and mystery lives are unchanged.

### Chapter goals you can actually finish (`chapters.ts`, `engine.ts`)

- **Family:** "Keep family close" now counts partners and kids at **closeness 30+**. Before, it showed as met all decade, then the partner walked out at 15.
  - A new banner warns when a partner drifts to 16–23 and names the button: People ▸ Circle ▸ Spend time.
  - Sims: 8/11 → 14/16.
- **Fame:** above Fame 72, "Raise Fame by N" fought the yearly fade. It now becomes **"End the chapter with Fame N+"** (current fame minus 6).
  - Sims: 8/8.
- **Reputation:** "Keep Reputation" now follows the sign of your Reputation, not the villain check, so a dark-karma hero is no longer asked to stay disliked.
  - Legends with negative Reputation no longer get it at all.
- Sims, 15 lives across mystery, villain and legend runs: every other goal hit ≥ 8/9 with goal-aware play. The earlier low quietfame, standing and darkkarma numbers were policy artefacts.

### New minigame: Chase (`minis.ts`, `MiniGames.tsx`, `Minigame.tsx`, `miniUtil.ts`)

- A three-lane run on a tilted road. Swipe, tap a side, use the big LEFT/RIGHT buttons, or press the arrow keys.
  - Dodge hazard-striped wrecks and grab gold sparks.
  - Sparks are worth 55% of the score; staying clean is 45%, and three hits wipe out the clean half.
  - Hits shake the arena and buzz; sparks pop.
- Courses are **seeded and fair**: every row leaves an open lane you can reach in one step. Tests check 600 courses.
- **Gym:** *Run the city* now plays Chase (or sprint intervals), and *Lift* plays Hold (or the heavy bag).
  - A clean round pays slightly more than the old flat reward, and a botched one slightly less, so the gym stays a grind but a played one.
- Chase also joins the stunt, dispatch and League tryout pools, weighted toward mobility powers.

### God Mode: a legend grid (`Legends.tsx`)

- With 11 legends the dot strip had stopped working. It is now a **face roster** that follows the swipe, plus an **All 11** button that opens a 3-column poster grid. Tap a poster to jump straight to that legend.

### Tests

- New `src/game/test/pm.test.ts` covers:
  - kin sets and the 85% narrowing;
  - family closeness and the fame raise-vs-hold switch;
  - chase course fairness and scoring;
  - gym rounds opening as minis with an ordered payout.
- 88/88 game tests pass.

## 2026-11-01 (am): Sealed-gift panel, louder omens, canon-safe legends (`devbot/2026-11-01-am`)

This branch also carries the unmerged `devbot/2026-10-31-night` work and the late Oct 31 WIP (Black Panther, Wolverine and Flash, plus Go buttons on chapter goals).

### Mystery Life: the sealed gift gets a real panel (`SealedGift.tsx`, `PowerLab.tsx`, `GameApp.tsx`, `styles.css`)

- **Powers ▸ Book, before the reveal,** now shows a sealed card instead of plain text:
  - a glowing orb that quivers harder as the wake gets closer;
  - a 4-step **The feeling** meter: Faint ▸ Stirring ▸ Loud ▸ Any day now;
  - a **Signs** journal with your last 3 omens;
  - **Call it** as three big element tiles, instead of buried action rows.
- **Fixed:** the old card wrongly said a birthday "from 13" could offer a power.
- **Legends before their canon wake** get a countdown card showing their Earth, the beat and the years left.

### Omens are paced, varied and build toward the reveal (`mystery.ts`, `engine.ts`)

- *Chase the strange feeling* now has a cooldown: 4, 3, 2 or 1 months depending on how close the wake is. The row says when the feeling comes back.
  - **Why:** sims showed 24–96 omens per life, drawn from only 3 lines per element. Now it is 18–34.
- **More lines:**
  - 6 faint lines per element.
  - New **loud** lines in the last 2 years before the wake.
  - Trait frames (for example, curious or reluctant kids notice things differently).
  - The game avoids repeating anything from the last 4 signs.

### Legends stay canon (`library.ts`, `events.ts`, `engine.ts`)

- **Legend book cap:** canon kit + 2, plus 1 more every 6 years after the wake, with a hard max of 12.
  - **Why:** a sim Wolverine ended with 20+ powers, including Flight and Sorcery.
- **Off-canon events are skipped in legend lives:** Doctor Maybe, The Receipt, the night-class braid, the geode swap and the two relic sites.
  - Relic-run duels with generic guards are skipped too.
  - Legends now meet their own rogues.

### Painted portraits for the last three legends (`src/assets/art/hero-black-panther.ts`, `hero-wolverine.ts`, `hero-flash.ts`, `index.ts`)

- **Black Panther, Wolverine and The Flash** now show painted 540x960 webp portraits in the God Mode picker and reveal, instead of the drawn silhouette (`LegendBust` stays as the fallback for any legend without art).
  - The Flash art had garbled neon-sign text in the top-right; that corner is softly blurred and darkened.

### Fixes

- **Six moves, always** (`moves.ts`): `fillLoadout` now prunes stale or locked moves *before* topping up. Some lives had been left with 5 equipped moves.

### Tests

- New `legend.test.ts` (5 tests): legend cap, no off-canon events for legends, long legend lives inside the cap, omen stages and cooldown, and loadout refill. The game suite is now 83 tests, all passing.

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