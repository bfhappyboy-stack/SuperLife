# SuperLife — Playtest (2026-10-31)

How it was tested:
- **Engine sims:** `/workspace/playtest/*.ts` (outside the repo) drive `createGame/act/choose/resolveMini/ageUp` directly.
  - Three contrasting policies, 20 seeds each, to age 120 or death.
  - **Hero:** Stacks, street kid, secret, protector, Fire Control. Trains, patrols, missions, League.
  - **Social:** NYC, wealthy, loud, idealistic, Telepathy. School, jobs, dating, family, stunts.
  - **Crook:** Hood, tragic, lone wolf, vengeful, Super Strength. Crime, crews, heists, brawls.
  - Plus a random-action policy for money and health attribution.
- **Browser:** Playwright at 390×844, touch, DPR 2, against the dev server.
  - Fresh onboarding → birth → first months.
  - Injected saves at 9y11m and 59y11m to see decade turns, the low-HP warning and a collapse.
  - Screenshots: `/workspace/superlife-screens/playtest-*.png`.

## Playability blockers (fixed on this branch)

| # | Blocker | Evidence (before) | Fix | After |
|---|---|---|---|---|
| 1 | **Lives end at 15–27.** Health 0 = instant death, with no warning and no regen. | All 60 focused sims died at 15–27. Drills cost ~4.5 HP each, and HP 8 at 14 had no warning. | Health 0 is now a **collapse** (hospital, bill, 18-month "critical" window). A second collapse in that window can kill an adult. Passive monthly regen (age-scaled). A banner below 25 HP says "Rest or see a doctor". | Careful players: median death **78–82**, range 71–94 in all three styles. Players who ignore warnings still die young (social median 37). |
| 2 | **~960 "Next month" taps** per life. Ages 0–5 have almost nothing to do. | The age-0 Life desk said "Nothing in reach" for 72 straight months. | **"To N+1 ⏭"** next to Next month skips to the next birthday. It stops on any choice, minigame, chapter card or death. Empty shelves now point to the desks that have moves, or say "Out of moves, tap Next month". | 0→10 takes about 10 taps plus choices. |
| 3 | **Economy runaway.** | Hero path: $1M by 23 and $17M by 80. `shift` was unlimited (+$869k in random sims). | Heavy shift is once a month. League stipend lowered from 12k–200k to 8k–75k a year. Fame bonus cut from fame×380 to fame×150. | Hero ≈ $8.6M by 80 (League rank 6 for 50 years). Social ≈ $3M, crook ≈ $0.65M. Still needs sinks (see BACKLOG: markets). |
| 4 | **Too many powers too early.** | 13–23 powers by 18. "Look for a teacher" patrol and "notes" books handed out unlimited random sparks. | Random sparks are capped at one every 2 years. Free yearly offers cut from 62/48/36% to 34/28/20%, halved again at 10+ powers. | About 6–13 by 20 and 20 by 50. Growth is spread across decades. |
| 5 | **Fame and reputation pinned at ±100 by about 18.** | Every policy saturated, so later decades had nothing to chase. | Soft ceiling: gains toward an extreme scale by `max(0.12, 1 − |x|/105)`, with stochastic rounding. | Social and crook now sit around 60–90 through mid-life. A hero who grinds 500+ missions still reaches 100 by 40. More direct `clamp(+fame)` writes in jobs and schools still bypass this (backlog). |

## Life length and pacing (careful policy, after fixes)

| Decade | What happens | Notes |
|---|---|---|
| 0–9 | 3–5 meaningful actions (rest, confide, time/gift with parents). Books/walks from 6, drill from 7. | This was the biggest tap sink. Skip-year plus the origin chapter goals now give the decade a shape. |
| 10–19 | Powers, teachers, school, first League tryout. The densest decade. | Most powers used to arrive here. Now about half. |
| 20–39 | Job and League rank climb, arcs, partner, kids. | Money climbs fast on the League path. Fame plateaus. |
| 40–59 | Before: the same verbs as in the 20s. Now: the crisis and legacy chapters give goals. | Still thin on new verbs. Markets and property are the missing layer. |
| 60–90 | Before: death at 66–80 with nothing new to do. Now: mentor action, legacy goals, and a slower health toll with legacy ≥ 20. | Ends by old age at 71–94. |

## Repetition (top repeated prompts per life, hero policy)

- "The gym, the block, or a room that does not advertise…" (gym prompt): ~560× in a heavy-training life.
- "A call comes in. Civilians, a timer, and a captain…" (League mission): ~330×.
- "<Villain> sends a pin and the words 'bring the good trick'": ~150–240× per villain.
- "The city is behaving just enough to make you choose a block." (patrol): ~190×.
- Minigames: `timing` makes up 70–80% of all minis, duels most of the rest, and `pattern` almost never appears.

## What's fun

- Building powers (braid book, teachers) and the 6-move duel.
- Villain pins and arcs give the mid-game a spine.
- The chapter title card plus 3 goals gives every decade a "why", and each goal names the desk to use.

## Mobile confusion (390×844)

- Age 0: the Life desk is empty while People has the actions. **Fixed** with "things you can do right now" desk buttons.
- "Out of moves" is shown only as a small caption, and the shelf said "Nothing in reach". **Fixed**: the shelf now says what to tap.
- The desk tab row scrolls horizontally, so "Work/Board" are off-screen at 390px. **Fixed**: 5-tab bottom bar, Board inside Cases.
- The header still shows the legacy power name/fusion title, not the combo book name (open since 2026-10-30).

## Economy with the Market (scripted sims, 8 lives per policy)

Harness: `playtest/life.ts` + `econ.ts` (not in the repo). `MARKET=1` lets the policy buy what it can afford and wants; `MARKET=0` is the old game.

| Policy | Death median (range), market | End cash, no market | End cash, market | Holdings @70, market | Legacy, market vs none |
|---|---|---|---|---|---|
| hero | 85 (74–96) | $8.85M | $432k | $2.45M | 74 vs 43 |
| social | 82 (74–95) | $3.06M | $131k | $141k | 76 vs 37 |
| crook | 75 (71–86) | $524k | $73k | $4k | 41 vs 31 |

- Money is no longer a dead stat: the surplus goes into influence, property and legacy, and legacy almost doubles.
- Nobody goes broke: medians stay positive and lifespans are about the same (hero lives run slightly longer thanks to supplies and property perks).
- Hero spend per life: influence $1.27M, property $1.04M, legacy $738k, intel $463k, gear $364k.
- **Watch:** crooks die younger with the market on (median 75 vs 81 without). Likely cause: they spend on gear and influence instead of keeping a cash cushion for hospital bills. Not tuned yet; see BACKLOG item 9.

## Balance pass (scripted sims, 12 lives per policy)

Harness: `playtest/fame.ts` (not in the repo). Fame is the median at ages 30/50/70.

| Policy | Death, no market | Fame, no market | Death, market | Fame, market | Legacy, market |
|---|---|---|---|---|---|
| hero | 83 | 94/95/94 | 81 | 94/96/96 | 68 |
| social | 77 | 83/85/84 | 78 | 87/88/88 | 77 |
| crook | 80 | 66/67/65 | 78 | 69/69/68 | — |

- Before: hero fame pinned at 100 every decade, and the market gave crooks +10 fame.
- Crook lifespan with the market is within noise at N=12 (the 75-vs-81 gap from 8 lives did not reproduce).

## New-life stepper and city art (Playwright, 390×844)

- A full run (violet hair, Neon Spire, Curious drive, a Mixed gift) starts a life with those choices saved; no console errors.
- Screens: `/workspace/superlife-screens/b2/create-*.png`, `b2/city-*.png` (before: `b2-before/`).

---

# Playtest (2026-10-31, am pass)

**Builds played** (scripted, 20 seeds each, market on):

- **celeb**: Crownbridge, celebrity upbringing, loud, glory, Teleportation. Policy: stunts, League, market.
- **vet**: Dustreach, military upbringing, secret identity, duty, Gravity. Policy: patrol, missions, mentoring.

Mobile screenshots at 390×844: `/workspace/superlife-shots/2026-10-31-am/`.

## Findings (before)

- **Minigames were one game.** Celebrity lives played 928–1339 timing bars per life (stunt 802×, mission 467×). Read appeared about 30 times. Vet lives were about 900 duels. **Fixed:** 6 skill kinds plus duels (see the after section).
- **Stats saturate by the 20s.** At 26 the celeb sat at Joy 100, Mind 100, Fame 98, Rep 100, Karma 100 with HP 8. **Partly fixed:** soft caps and monthly settling. Joy now hovers around 90–98 for joy-heavy policies; Mind still reaches 100 by about 30.
- **Mentoring had no diminishing returns.** Vet legacy reached 577 from 174 sessions. **Fixed:** about 200 now. Market legacy items still add on top.
- **Unreachable chapter goals:**
  - holdmoney 0/11 (the label didn't match the rule);
  - fortune 0/15;
  - arc 2/17, because only 4 arcs exist and they are all done by about 30;
  - quiet fame 0/5 for secret heroes;
  - trust 0/29, because hero bonds stall at about 32.
  - **Fixed** after the change: holdmoney 15/15, cushion 17/17, fortune 6/12, arc 7/26. Trust is still open.
- **Repeats per life:** the night-out prompt 503×, the League call 293×, villain pins "bring the good trick" 180–190× per villain, patrol 234×.
- **UI:**
  - The mini screen had a big empty gap between the arena and the button, and a plain "Drill" header. **Fixed.**
  - The HUD power chip showed the legacy fusion name. **Fixed.**

## After

- **Celeb minis per life:** timing 415–524, press 192–294, rescue 189–239, hold 193–246, crack 118–147, read 25–51, duel 150–207.
- **Vet minis per life:** duel about 850, timing about 200, hold about 120, crack about 85, rescue about 75.
- **Celeb life by decade, seed 1:**
  - At 20: Joy 93, Mind 98, Fame 98, rank 5, HP 55.
  - At 30: HP 36 (the stunt grind still hurts).
  - At 87: $260k cash plus $1.5M in property, legacy 145, 20 powers.
- **Still open:**
  - Mind saturation.
  - Hero bonds stuck in the 30s.
  - Arcs run out by 30.
  - Prompt repetition.
  - Property upkeep of $58k a year by 87 is a slow drain, which is fine.
