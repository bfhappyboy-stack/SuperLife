import type React from "react";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/game/Portrait";
import { Award, BookOpen, Check, Crown, Dumbbell, Eye, FastForward, Flame, GraduationCap, Leaf, Lock, MessageCircle, Search, Shield, Skull, Star, Swords, Wrench, Zap, type LucideIcon } from "lucide-react";
import { ElementIcon } from "@/components/game/Vfx";
import { arcsCleared, availableArcs, currentCase, plotFor, type ArcDef, type ArcStep } from "@/game/arcs";
import { ELEMENTS, elementOfLegacy } from "@/game/elements";
import { getPower, mix, possibleMixes, teachableBases, viewPowers } from "@/game/combo";
import { MIX_AGE, mentorAwaken, mentorBraid, mentorById, mentorFor, mentorRecipe, mixLock, type MentorDef } from "@/game/mentors";
import { canSkipToFifteen } from "@/game/skip";
import { caseRegroup, focusId } from "@/game/engine";
import { mergeHeroes, replyLocally } from "@/game/heroes";
import { askHero } from "@/game/hero-talk";
import { masteryCap, masteryLevel, nextMasteryExp, powerRank } from "@/game/mastery";
import { dossier, homeArc, talkBrief } from "@/game/origin";
import { hasGift } from "@/game/theme";
import { AWAKEN_LESSONS, HERO_AWAKEN_BOND, MENTOR_AWAKEN_BOND, awakenBlock, braidBlock, library, type LibraryState } from "@/game/library";
import { SealedGift } from "@/components/game/SealedGift";
import { MovePicker, StreetSix } from "@/components/game/MovePicker";
import { kitFor } from "@/game/kits";
import { useGame } from "@/game/store";
import type { AiHero, Game } from "@/game/types";

export function PowerLab({
  game,
  onAct,
  onChat,
  pane,
}: {
  game: Game;
  onAct: (id: string) => void;
  onChat: (heroId: string) => void;
  pane: "book" | "moves" | "teachers";
}) {
  const unlocked = game.unlockedPowers ?? [];
  const knownIds = new Set(game.discovered ?? []);
  const owned = viewPowers(unlocked).filter((power) => power.unlocked);
  const heard = (game.discovered ?? []).filter((id) => !unlocked.includes(id)).map((id) => getPower(id)).filter((power) => !!power);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const preview = left && right ? mix(left, right, unlocked) : null;
  const moves = game.majorsLeft > 0;
  const heroes = mergeHeroes(game.heroes);
  const met = heroes.filter((hero) => hero.met);
  const unmet = heroes.filter((hero) => !hero.met);
  const gift = hasGift(game);
  const ownedKey = unlocked.join("|");

  useEffect(() => {
    const ids = new Set(ownedKey.split("|").filter(Boolean));
    setLeft((current) => (current && ids.has(current) ? current : null));
    setRight((current) => (current && ids.has(current) ? current : null));
  }, [ownedKey]);

  function pick(id: string) {
    const name = getPower(id)?.name ?? "That power";
    if (id === left) {
      setLeft(null);
      setNotice(`${name} left the first hand.`);
      return;
    }
    if (id === right) {
      setRight(null);
      setNotice(`${name} left the second hand.`);
      return;
    }
    if (!left) {
      setLeft(id);
      setNotice(`${name} is in the first hand.`);
      return;
    }
    if (!right) {
      setRight(id);
      setNotice(`${name} is in the second hand.`);
      return;
    }
    setRight(id);
    setNotice(`${name} replaced the second hand.`);
  }

  function attempt(a: string, b: string) {
    const result = mix(a, b, unlocked);
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    const room = library(game);
    if (room.block && !unlocked.includes(result.power.id)) {
      setNotice(room.block);
      return;
    }
    if (!moves) {
      setNotice("No moves left this month.");
      return;
    }
    setNotice("Mixing. The result lands on the card above.");
    onAct(`mix|${a}|${b}`);
    setLeft(null);
    setRight(null);
  }

  if (!gift && pane === "book") {
    return (
      <div className="flex flex-col gap-4">
        {game.hiddenGift ? <SealedGift game={game} onAct={onAct} /> : <Dormant game={game} />}
      </div>
    );
  }

  // A legend kit (Batman's Utility Belt) gets the real picker even without a power.
  if (!gift && pane === "moves") return kitFor(game.preset) ? <MovePicker game={game} onAct={onAct} /> : <StreetSix game={game} />;

  return (
    <div className="flex flex-col gap-4">
      {notice && pane !== "moves" && (
        <p role="status" className="card anim-pop !border-gold/70 px-4 py-3 text-sm font-semibold text-fg">
          {notice}
        </p>
      )}
      {pane === "book" && gift && (
        <>
          {game.mentor && <MentorCard game={game} moves={moves} onAct={onAct} />}
          <MasteryBoard game={game} owned={owned} heard={heard} onAct={onAct} onNote={setNotice} />
          {mixLock(game) ? (
            <MixLocked game={game} />
          ) : (
          <BraidBook
            owned={owned}
            mastery={game.mastery}
            left={left}
            right={right}
            previewOk={preview?.ok ?? false}
            previewText={
              preview
                ? preview.ok
                  ? knownIds.has(preview.power.id)
                    ? `${preview.power.name} · ${preview.power.tierName}. Rank starts at D.`
                    : `Unrecorded ${preview.power.tierName.toLowerCase()} braid. You learn the name when it lands.`
                  : preview.reason
                : "Pick two different powers. Tap one again to take it back out."
            }
            moves={moves}
            room={library(game)}
            training={game.training ?? null}
            blockText={preview?.ok && left && right && !unlocked.includes(preview.power.id) ? (braidBlock(game, left, right, preview.power.id) ?? (game.flags.powerLesson ? "One power lesson a month. Come back next month." : null)) : null}
            onPick={pick}
            onMix={() => left && right && attempt(left, right)}
          />
          )}
        </>
      )}
      {pane === "moves" && gift && <MovePicker game={game} onAct={onAct} />}
      {pane === "teachers" && gift && game.mentor && <MentorCard game={game} moves={moves} onAct={onAct} />}
      {pane === "teachers" && (
        <TrainerCircle game={game} met={met} unmet={unmet} unlocked={unlocked} knownIds={knownIds} moves={moves} onAct={onAct} onChat={onChat} onNote={setNotice} />
      )}
    </div>
  );
}

function TrainerCircle({
  game,
  met,
  unmet,
  unlocked,
  knownIds,
  moves,
  onAct,
  onChat,
  onNote,
}: {
  game: Game;
  met: AiHero[];
  unmet: AiHero[];
  unlocked: string[];
  knownIds: Set<string>;
  moves: boolean;
  onAct: (id: string) => void;
  onChat: (heroId: string) => void;
  onNote: (text: string) => void;
}) {
  return (
    <section className="card px-4 py-3">
      <h2 className="t-label text-muted">WHO WILL TEACH</h2>
      <p className="mt-1 text-sm text-muted">Talk is free. A mission wants bond 22. A lesson wants 28. Training wants 36.</p>
      {met.length === 0 && <p className="mt-2 text-sm text-muted">From age 10, look for a sparring partner. They remember what you say.</p>}
      {unmet.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {unmet
            .slice()
            .sort((a, b) => {
              const local = dossier(game.cityId);
              const here = Number(local.heroes.includes(b.id)) - Number(local.heroes.includes(a.id));
              if (here) return here;
              return teachableBases(b.unlocked, unlocked).length - teachableBases(a.unlocked, unlocked).length;
            })
            .slice(0, 4)
            .map((hero) => {
              const offer = teachableBases(hero.unlocked, unlocked)[0] ?? null;
              const here = dossier(game.cityId).heroes.includes(hero.id);
              const shown = offer && knownIds.has(offer.id) ? offer.name : null;
              return (
                <li key={hero.id} className="text-sm text-muted">
                  {here ? "In this city" : "A rumor"}: {hero.alias} {shown ? `teaches ${shown}` : "is holding a power you have not been shown"}.
                </li>
              );
            })}
        </ul>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {met.map((hero) => {
          const offers = teachableBases(hero.unlocked, unlocked).slice(0, 2);
          const local = dossier(game.cityId).heroes.includes(hero.id);
          return (
            <article key={hero.id} className={`card px-3 py-3 ${local ? "!border-gold !bg-panel-2" : ""}`}>
              <div className="flex items-center gap-3">
                <Portrait seed={hero.portrait} age={32} sex={hero.sex} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">
                    {hero.alias}
                    {local ? <span className="text-gold"> · this city</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    Level {hero.level} · bond {hero.relationship} · {hero.unlocked.length} powers
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNote(`Talking to ${hero.alias}.`);
                    onChat(hero.id);
                  }}
                  data-act="herotalk"
                  className="btn btn-gold !min-h-11 text-sm"
                >
                  Talk
                </button>
                <button
                  type="button"
                  aria-disabled={!moves || hero.relationship < 22}
                  onClick={() => {
                    if (!moves) {
                      onNote("No moves left this month.");
                      return;
                    }
                    if (hero.relationship < 22) {
                      onNote(`Bond ${hero.relationship}. A mission wants 22.`);
                      return;
                    }
                    onNote(`Mission with ${hero.alias} — sent.`);
                    onAct(`heromission|${hero.id}`);
                  }}
                  className={`btn btn-ghost !min-h-11 text-sm ${moves && hero.relationship >= 22 ? "" : "opacity-60"}`}
                >
                  Mission
                </button>
                <button
                  type="button"
                  aria-disabled={!moves || hero.relationship < 36}
                  onClick={() => {
                    if (!moves) {
                      onNote("No moves left this month.");
                      return;
                    }
                    if (hero.relationship < 36) {
                      onNote(`Bond ${hero.relationship}. Training wants 36.`);
                      return;
                    }
                    onNote(`Training with ${hero.alias} — sent.`);
                    onAct(`herotrain|${hero.id}`);
                  }}
                  data-act={`herotrain|${hero.id}`}
                  className={`btn btn-ghost !min-h-11 text-sm ${moves && hero.relationship >= 36 ? "" : "opacity-60"}`}
                >
                  Train
                </button>
              </div>
              {offers.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {offers.map((power) => {
                    const block = awakenBlock(game, power.id) ?? (game.flags.powerLesson ? "One power lesson a month." : null);
                    const ready = moves && hero.relationship >= HERO_AWAKEN_BOND && !block;
                    const going = game.training?.id === power.id ? game.training : null;
                    return (
                      <button
                        key={power.id}
                        type="button"
                        aria-disabled={!ready}
                        onClick={() => {
                          if (!moves) {
                            onNote("No moves left this month.");
                            return;
                          }
                          if (block) {
                            onNote(block);
                            return;
                          }
                          if (hero.relationship < HERO_AWAKEN_BOND) {
                            onNote(`Bond ${hero.relationship}. Waking ${power.name} wants ${HERO_AWAKEN_BOND}.`);
                            return;
                          }
                          onNote(`Lesson with ${hero.alias}: ${power.name}.`);
                          onAct(`learn|${hero.id}|${power.id}`);
                        }}
                        data-act={`learn|${hero.id}|${power.id}`}
                        className={`card min-h-11 px-3 py-2 text-left text-sm ${ready ? "!border-gold text-fg" : "text-muted"}`}
                      >
                        <span className="font-semibold">{going ? `Keep waking ${power.name} · ${Math.floor(going.progress)}/${going.need}` : `Wake ${power.name}`}</span>
                        <span className="block text-muted">{hero.relationship < HERO_AWAKEN_BOND ? `Bond ${HERO_AWAKEN_BOND} first. Heroes don't share this lightly.` : block ? block : `A rare gift. About ${AWAKEN_LESSONS} monthly lessons before it answers.`}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Dormant({ game }: { game: Game }) {
  const human = game.powerless;
  return (
    <section className="card px-4 py-5">
      <h2 className="t-label text-muted">{human ? "NO GIFT ON FILE" : "NO POWER YET"}</h2>
      <p className="mt-2 text-base text-fg">{human ? "The tests came back human. The book stays shut." : "The braid book and your moves stay shut until a power shows up."}</p>
      <p className="mt-2 text-sm text-muted">
        {human
          ? "Ordinary can still run a city. Cases, work, and people each have their own desk."
          : `Keep aging. A gift usually arrives on its own. From 13, a birthday can offer one. Power mixing unlocks at ${MIX_AGE}, when a mentor finds you.`}
      </p>
    </section>
  );
}

function BraidBook({
  owned,
  mastery,
  left,
  right,
  previewOk,
  previewText,
  moves,
  room,
  training,
  blockText,
  onPick,
  onMix,
}: {
  owned: ReturnType<typeof viewPowers>;
  mastery: Game["mastery"];
  left: string | null;
  right: string | null;
  previewOk: boolean;
  previewText: string;
  moves: boolean;
  room: LibraryState;
  training: Game["training"];
  blockText: string | null;
  onPick: (id: string) => void;
  onMix: () => void;
}) {
  const ready = owned.filter((power) => power.unlocked);
  const fill = Math.min(100, Math.round((room.owned / Math.max(1, room.cap)) * 100));
  return (
    <section className="card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-label text-muted">BRAID BOOK</h2>
        <span className="t-num text-xs text-muted" aria-label={`${room.owned} of ${room.cap} pages, ${room.thisYear} of ${room.yearRoom} new this year`}>
          <b className={room.owned >= room.cap ? "text-gold" : "text-fg"}>{room.owned}</b>/{room.cap} pages · {room.thisYear}/{room.yearRoom} this year
        </span>
      </div>
      <div className="stat-bar mt-1.5" aria-hidden>
        <div className="stat-fill" style={{ width: `${fill}%`, "--fill": "var(--color-gold)" } as React.CSSProperties} />
      </div>
      {room.block && <p className="mt-1.5 text-xs font-semibold text-gold/90">{room.block}</p>}
      <p className="mt-1 text-sm text-muted">Every page here is rare. A braid takes months: pick two powers drilled to rank C, then practise one lesson a month. Alone it goes at half a mentor's pace.</p>
      {training && (
        <div className="mt-2 rounded-xl border border-gold/40 bg-gold/[0.06] px-3 py-2" aria-label="Power in training">
          <p className="t-label text-[10px] text-gold">{training.kind === "awaken" ? "WAKING A POWER" : "BRAID IN PROGRESS"}</p>
          <p className="mt-0.5 text-sm font-semibold text-fg">{getPower(training.id)?.name ?? "Unknown"} · {Math.floor(training.progress)}/{training.need} lessons</p>
          <div className="stat-bar mt-1" aria-hidden>
            <div className="stat-fill" style={{ width: `${Math.min(100, Math.round((training.progress / Math.max(1, training.need)) * 100))}%`, "--fill": "var(--color-gold)" } as React.CSSProperties} />
          </div>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Slot label="Hand 1" id={left} />
        <Slot label="Hand 2" id={right} />
      </div>
      <p className={`mt-3 text-sm ${previewOk ? "text-gold" : "text-fg"}`}>{previewText}</p>
      <div className="mt-3 flex flex-col gap-2">
        {ready.map((power) => {
          const slot = power.id === left ? "1" : power.id === right ? "2" : "";
          const rank = powerRank(masteryLevel(mastery?.[power.id] ?? 0, power.generation));
          return (
            <button
              key={power.id}
              type="button"
              aria-pressed={!!slot}
              onClick={() => onPick(power.id)}
              className={`card min-h-12 px-3 py-2 text-left text-sm text-fg ${slot ? "!border-gold !bg-panel-2" : ""}`}
            >
              <span className="font-semibold">{power.name}</span>
              <span className="mt-0.5 block text-xs text-gold">{slot ? `In hand ${slot}` : `${power.tierName} · ${rank}`}</span>
            </button>
          );
        })}
      </div>
      <button type="button" disabled={!left || !right || !moves || !previewOk || !!blockText} onClick={onMix} data-act="mix|" className="btn btn-primary mt-3 min-h-12 w-full disabled:opacity-40">
        {!moves ? "No moves left this month" : !left || !right ? "Choose two powers" : !previewOk ? "These two won't mix" : blockText ? "Not ready to braid" : training?.id && training.kind === "braid" ? "Practise the braid" : "Start braiding these two"}
      </button>
      {blockText && <p className="mt-1.5 text-xs text-muted">{blockText}</p>}
    </section>
  );
}

function Slot({ label, id }: { label: string; id: string | null }) {
  const power = id ? getPower(id) : null;
  return (
    <div className={`card min-h-16 px-3 py-2 ${power ? "!border-gold/70 !bg-panel-2" : "!border-dashed"}`}>
      <p className="t-label text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-fg">{power?.name ?? "Empty"}</p>
    </div>
  );
}

const STEP_ICON: Record<ArcStep["kind"], LucideIcon> = {
  talk: MessageCircle,
  investigate: Search,
  fight: Swords,
  train: Dumbbell,
  protect: Shield,
  boss: Skull,
};

const STEP_VERB: Record<ArcStep["kind"], string> = {
  talk: "Talk",
  investigate: "Investigate",
  fight: "Fight",
  train: "Train",
  protect: "Protect",
  boss: "Boss",
};

/** The villain's element, read from the case's boss step, tints the whole file. */
function caseTint(arc: ArcDef): string {
  const boss = arc.steps.find((step) => step.kind === "boss") ?? arc.steps[arc.steps.length - 1];
  return ELEMENTS[elementOfLegacy(boss?.foePower)].color;
}

export function CaseFile({ game }: { game: Game }) {
  const current = currentCase(game);
  const open = availableArcs(game);
  const cleared = arcsCleared(game.story);
  if (!current) {
    return (
      <section className="card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="t-label text-muted">CASE FILES</h2>
          <span className="chip !min-h-0 px-2 py-0.5 text-[11px]">
            <Award className="size-3.5 text-gold" aria-hidden /> {cleared} closed
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {game.age < 12
            ? "Cases open at 12. Until then, drills stay small on purpose."
            : open.length
              ? "Pick a file below to open it. This city puts its own villains first."
              : "No open files right now. New cases arrive as you get older: some only find a hero in their thirties, forties and fifties."}
        </p>
        {open.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {open.slice(0, 3).map((arc) => {
              const tint = caseTint(arc);
              const local = homeArc(game.cityId, arc.id);
              return (
                <li key={arc.id} className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: `${tint}55`, backgroundImage: `linear-gradient(100deg, ${tint}1f, transparent 60%)` }}>
                  <span className="ico-tile size-9 shrink-0" style={{ "--tile": tint } as React.CSSProperties}>
                    <ElementIcon element={elementOfLegacy(arc.steps[arc.steps.length - 1]?.foePower)} className="size-4.5" style={{ color: "currentColor" }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-fg">{arc.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {arc.villain}
                      {arc.era ? ` · ${arc.era}` : ""}
                      {local ? " · this city" : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }
  const { arc, step, index } = current;
  const tint = caseTint(arc);
  const StepIcon = STEP_ICON[step.kind];
  const ceiling = cleared < 2 ? "Raises your mastery ceiling." : "";
  const reward = [ceiling, arc.legacy ? `Legacy +${arc.legacy}.` : ""].filter(Boolean).join(" ");
  const regrouping = caseRegroup(game);
  return (
    <section className="card relative overflow-hidden px-4 py-3" style={{ borderColor: `${tint}80`, backgroundImage: `radial-gradient(120% 70% at 100% 0%, ${tint}2e, transparent 60%)` }}>
      <div className="flex items-start gap-3">
        <span className="ico-tile size-12 shrink-0" style={{ "--tile": tint } as React.CSSProperties}>
          <ElementIcon element={elementOfLegacy(arc.steps[arc.steps.length - 1]?.foePower)} className="size-6" style={{ color: "currentColor" }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-label text-[10px] text-muted">
            CASE FILE{arc.era ? ` · ${arc.era.toUpperCase()}` : ""} · {cleared} CLOSED
          </p>
          <p className="t-title truncate text-fg">{arc.title}</p>
          <p className="truncate text-sm" style={{ color: tint }}>
            {arc.villain} · {arc.group}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{arc.goal}.</p>

      <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label={`Step ${index + 1} of ${arc.steps.length}`}>
        {arc.steps.map((row, i) => {
          const Icon = STEP_ICON[row.kind];
          const done = i < index;
          const now = i === index;
          return (
            <li key={row.id} className="flex flex-col items-center gap-1">
              <span
                className={`grid size-9 place-items-center rounded-full border-2 transition-transform ${now ? "scale-110" : ""}`}
                style={{
                  borderColor: done || now ? tint : "rgba(255,255,255,.14)",
                  background: done ? tint : now ? `${tint}33` : "rgba(255,255,255,.04)",
                  color: done ? "#0b0d14" : now ? tint : "rgba(255,255,255,.4)",
                  boxShadow: now ? `0 0 14px ${tint}88` : undefined,
                }}
                title={row.title}
              >
                {done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
              </span>
              <span className={`text-[9px] font-bold tracking-wide uppercase ${now ? "text-fg" : "text-muted"}`}>{STEP_VERB[row.kind]}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 rounded-xl border px-3 py-2.5" style={{ borderColor: `${tint}55`, background: "rgba(0,0,0,.22)" }}>
        <p className="t-label flex items-center gap-1.5 text-[10px]" style={{ color: tint }}>
          <StepIcon className="size-3.5" aria-hidden /> NOW · STEP {index + 1} OF {arc.steps.length}
        </p>
        <p className="mt-0.5 font-semibold text-fg">{step.title}</p>
        <p className="text-sm text-muted">{step.brief}</p>
        {regrouping && (
          <p className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-cape/15 px-2 py-1 text-xs font-bold text-[#ffb3ad]" role="status">
            <Lock className="size-3.5 shrink-0" aria-hidden /> Regrouping after the loss. {regrouping} again next month.
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Play this step from its card below. {reward ? `Closing the case: ${reward}` : `The teachers know ${arc.villain}.`}
      </p>
    </section>
  );
}

function MasteryBoard({
  game,
  owned,
  heard,
  onAct,
  onNote,
}: {
  game: Game;
  owned: ReturnType<typeof viewPowers>;
  heard: ReturnType<typeof getPower>[];
  onAct: (id: string) => void;
  onNote: (text: string) => void;
}) {
  const cleared = arcsCleared(game.story);
  const held = owned.filter((power) => power.unlocked);
  const pages = heard.filter((power) => !!power);
  return (
    <section className="card px-4 py-3">
      <h2 className="t-label text-muted">MASTERY</h2>
      <p className="mt-1 text-sm text-muted">Each power has its own rank. Basics stop at S. Mixed and apex can reach X, late, after finished cases.</p>
      <div className="mt-3 flex flex-col gap-3">
        {held.map((power) => {
          const exp = game.mastery?.[power.id] ?? 0;
          const level = masteryLevel(exp, power.generation);
          const cap = masteryCap(game.age, power.generation, cleared);
          const next = nextMasteryExp(exp, power.generation);
          const width = `${Math.round((level / 6) * 100)}%`;
          const focused = game.focusPower === power.id;
          return (
            <div key={power.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  {power.name} <span className="text-gold">{power.tierName} · {powerRank(level)}</span>
                </p>
                <button
                  type="button"
                  aria-pressed={focused}
                  onClick={() => {
                    onAct(`focus|${power.id}`);
                    onNote(`${power.name} is the focus.`);
                  }}
                  className="seg"
                >
                  {focused ? "Focused" : "Set focus"}
                </button>
              </div>
              <p className="text-xs text-muted">
                Rank {powerRank(level)} · ceiling {powerRank(cap)}
                {next == null ? " · topped out" : ` · ${exp}/${next} to the next rank`}
                {level >= cap ? " · soft wall" : ""}
              </p>
              <div className="stat-bar mt-1 !h-2">
                <div className="stat-fill" style={{ width, "--fill": "var(--color-gold)" } as React.CSSProperties} />
              </div>
            </div>
          );
        })}
      </div>
      {pages.length > 0 && (
        <div className="mt-4">
          <p className="t-label text-muted">HEARD OF</p>
          <ul className="mt-2 flex flex-col gap-1">
            {pages.slice(0, 8).map((power) => (
              <li key={power.id} className="text-sm text-muted">
                <span className="font-semibold text-fg">{power.name}</span> · {power.tierName}. Not yours yet.
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function HeroChat({
  game,
  heroId,
  onClose,
  onAct,
}: {
  game: Game;
  heroId: string;
  onClose: () => void;
  onAct: (id: string) => void;
}) {
  const hero = game.heroes.find((item) => item.id === heroId);
  const noteTalk = useGameTalk();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  if (!hero) return null;
  const plot = plotFor(game, hero.id, hero.relationship);
  const origin = talkBrief(game, hero.id);
  const teachable = (game.unlockedPowers ?? []).flatMap((id) => {
    const power = getPower(id);
    if (!power || hero.unlocked.includes(power.id)) return [];
    return [power];
  }).slice(0, 4);

  async function send() {
    const who = hero;
    const line = draft.trim();
    if (!who || !line || busy) return;
    setBusy(true);
    setDraft("");
    try {
      let text = replyLocally(who, line, plot, origin);
      try {
        const res = await askHero({
          data: {
            id: who.id,
            name: who.name,
            alias: who.alias,
            personality: who.personality,
            relationship: who.relationship,
            level: who.level,
            memory: who.memory,
            line,
            plot,
            origin,
          },
        });
        if (res.ok && res.text) text = res.text;
      } catch {
        /* local voice already set */
      }
      noteTalk(who.id, line, text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="hud flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="t-display truncate text-fg">{hero.alias}</p>
          <p className="truncate text-xs text-muted">
            Bond {hero.relationship} · Lv {hero.level}
            {plot ? ` · ${plot.villain}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost !min-h-11 text-sm">
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="text-sm text-muted">{hero.personality}</p>
        <div className="mt-3 flex flex-col gap-2">
          {hero.memory.length === 0 && (
            <p className="text-sm text-muted">
              {plot ? `Ask about ${plot.villain}, or how to stop them. They answer from the case and the bond.` : "Say something. Thanks lands warmer than an insult. Training and missions count."}
            </p>
          )}
          {hero.memory.map((entry, index) => (
            <p key={`${entry.role}-${index}`} className={`anim-rise max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow ${entry.role === "you" ? "self-end rounded-br-md bg-cape text-white" : "self-start rounded-bl-md bg-paper text-paper-ink"}`}>
              {entry.text}
            </p>
          ))}
          {busy && (
            <p className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-paper/80 px-3 py-2.5" aria-label="They're thinking">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-bounce rounded-full bg-paper-ink/70" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </p>
          )}
        </div>
        {hero.relationship >= 70 && teachable.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="t-label text-muted">TEACH A BRAID</p>
            {teachable.map((power) => (
              <button key={power.id} type="button" onClick={() => onAct(`teach|${hero.id}|${power.id}`)} className="btn btn-ghost !min-h-11 !justify-start text-sm">
                Show them {power.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <form
        className="flex shrink-0 gap-2 border-t border-white/10 bg-ink/80 px-4 pt-3 pb-24 backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          maxLength={240}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Talk to ${hero.alias}`}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-fg shadow-[inset_0_1px_3px_rgba(0,0,0,.5)] focus:border-gold focus:outline-none"
        />
        <button type="submit" disabled={busy || !draft.trim()} className="btn btn-primary min-h-12 shrink-0 disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}

function useGameTalk() {
  return useGame((s) => s.noteTalk);
}

const SIGIL: Record<MentorDef["sigil"], LucideIcon> = { shield: Shield, flame: Flame, book: BookOpen, star: Star, bolt: Zap, fist: Dumbbell, eye: Eye, crown: Crown, wrench: Wrench, leaf: Leaf };

/** Before 15 the braid book is locked: a clear countdown, what's waiting, and the quick path there. */
function MixLocked({ game }: { game: Game }) {
  const skip = useGame((s) => s.skip);
  const waiting = possibleMixes(game.unlockedPowers ?? []).length;
  const ages = Array.from({ length: Math.max(1, MIX_AGE - game.age + 1) }, (_, i) => game.age + i);
  const years = MIX_AGE - game.age;
  const teaser = game.mode === "god" && game.preset ? mentorFor(game) : null;
  return (
    <section className="card relative overflow-hidden px-4 py-4" aria-label="Braid book locked">
      <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-[#7cf0c8]/10 blur-2xl" aria-hidden />
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#7cf0c8]/50 bg-[#7cf0c8]/10 text-[#7cf0c8] shadow-[0_0_18px_rgba(124,240,200,0.25)]">
          <Lock className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="t-label text-[10px] text-[#7cf0c8]">BRAID BOOK · LOCKED</h2>
          <p className="t-display !text-[1.6rem] leading-none text-fg">Mixing unlocks at {MIX_AGE}</p>
          <p className="mt-1 text-sm text-fg/80">
            {years} year{years === 1 ? "" : "s"} to go. Until then, drill what you have. Depth comes first.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1" aria-label={`Age ${game.age} of ${MIX_AGE}`}>
        {ages.map((age) => (
          <span key={age} className="flex flex-1 flex-col items-center gap-1">
            <span className={`h-2 w-full rounded-full ${age === game.age ? "bg-gold shadow-[0_0_8px_var(--color-gold)]" : age === MIX_AGE ? "bg-[#7cf0c8]/80" : "bg-white/15"}`} />
            {(ages.length <= 9 || age === game.age || age === MIX_AGE) && <span className={`t-num text-[10px] font-black ${age === MIX_AGE ? "text-[#7cf0c8]" : age === game.age ? "text-gold" : "text-muted"}`}>{age}</span>}
          </span>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-fg/90">
        <li className="flex items-center gap-2">
          <GraduationCap className="size-4 shrink-0 text-[#7cf0c8]" aria-hidden />
          {teaser ? `${teaser.name} will start your training at ${MIX_AGE}.` : `A mentor finds you at ${MIX_AGE} and guides your first braids.`}
        </li>
        <li className="flex items-center gap-2">
          <BookOpen className="size-4 shrink-0 text-gold" aria-hidden />
          {waiting ? `${waiting} recipe${waiting === 1 ? "" : "s"} already in your hands, waiting.` : "New powers are rare. Drill the one you have until it's ready."}
        </li>
      </ul>
      {canSkipToFifteen(game) && (
        <button type="button" onClick={() => skip("fifteen")} className="btn btn-gold mt-3 min-h-12 w-full !gap-2">
          <FastForward className="size-4" aria-hidden /> Skip to {MIX_AGE}
        </button>
      )}
    </section>
  );
}

/** Your mentor (15+): bond, and this month's lesson. One lesson a month. */
function MentorCard({ game, moves, onAct }: { game: Game; moves: boolean; onAct: (id: string) => void }) {
  const state = game.mentor;
  const mentor = mentorById(state?.id);
  if (!state || !mentor) return null;
  const Sigil = SIGIL[mentor.sigil];
  const braid = mentorBraid(game);
  const room = library(game);
  const focus = getPower(focusId(game));
  const recipe = mentorRecipe(game);
  const wake = mentorAwaken(game);
  const wakeBlock = wake ? awakenBlock(game, wake.id) : "No power left to wake";
  const going = game.training ?? null;
  const lessonUsed = game.flags.powerLesson ? "Power lesson done this month" : null;
  const done = !!game.flags.tutored;
  const why = done ? "Lesson done this month" : !moves ? "No moves left this month" : null;
  const lessons: { id: string; icon: LucideIcon; title: string; detail: string; off: string | null }[] = [
    {
      id: "tutor|braid",
      icon: Zap,
      title: braid ? `Guided braid` : "Guided braid",
      detail: braid ? `${braid.left.name} + ${braid.right.name}.${going?.id === braid.result.id ? ` ${Math.floor(going.progress)}/${going.need} lessons.` : " Months of lessons."}` : "No recipe in your hands yet.",
      off: why ?? lessonUsed ?? (!braid ? "Nothing to braid" : braidBlock(game, braid.left.id, braid.right.id, braid.result.id)),
    },
    {
      id: "tutor|awaken",
      icon: Star,
      title: wake ? `Wake ${wake.name}` : "Wake a power",
      detail: wake && going?.id === wake.id ? `${Math.floor(going.progress)}/${going.need} lessons. Keep going.` : "Rare. Slow. Many months of lessons.",
      off: why ?? lessonUsed ?? (state.bond < MENTOR_AWAKEN_BOND ? `Bond ${MENTOR_AWAKEN_BOND} first` : wakeBlock),
    },
    { id: "tutor|drill", icon: Dumbbell, title: focus ? `Drill ${focus.name}` : "Drill", detail: "Better gains than drilling alone.", off: why ?? (game.stats.health < 12 ? "Too gassed" : null) },
    { id: "tutor|study", icon: BookOpen, title: "Study night", detail: recipe ? "Learn a new recipe for your book. +Mind." : "Theory and tea. +Mind.", off: why },
  ];
  return (
    <section className="card relative overflow-hidden px-4 py-3" style={{ borderColor: `${mentor.color}88` }} aria-label={`Mentor ${mentor.name}`}>
      <div className="pointer-events-none absolute -top-12 -left-8 size-40 rounded-full blur-2xl" style={{ background: `${mentor.color}22` }} aria-hidden />
      <div className="relative flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border-2" style={{ borderColor: mentor.color, background: `radial-gradient(circle at 35% 30%, ${mentor.color}55, ${mentor.color}11 70%)`, boxShadow: `0 0 18px ${mentor.color}55` }}>
          <Sigil className="size-7" style={{ color: mentor.color }} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-label text-[10px]" style={{ color: mentor.color }}>
            YOUR MENTOR · {state.lessons} lesson{state.lessons === 1 ? "" : "s"}
          </p>
          <p className="truncate text-lg leading-tight font-extrabold text-fg">{mentor.name}</p>
          <p className="truncate text-xs text-muted">{mentor.title}</p>
        </div>
        <span className="t-num shrink-0 text-right text-[11px] font-bold text-muted">
          Bond
          <b className="block text-base text-fg">{Math.round(state.bond)}</b>
        </span>
      </div>
      <div className="stat-bar relative mt-2" aria-hidden>
        <div className="stat-fill" style={{ width: `${Math.min(100, state.bond)}%`, "--fill": mentor.color } as React.CSSProperties} />
      </div>
      <p className="relative mt-2 text-[13px] text-fg/85 italic">&ldquo;{mentor.craft}&rdquo;</p>
      <div className="relative mt-2.5 grid grid-cols-2 gap-1.5">
        {lessons.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              disabled={!!row.off}
              onClick={() => onAct(row.id)}
              data-act={row.id}
              className="flex min-h-[6.5rem] flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 text-left disabled:opacity-45"
              style={!row.off ? { borderColor: `${mentor.color}77`, background: `${mentor.color}14` } : undefined}
            >
              <Icon className="size-4" style={{ color: mentor.color }} aria-hidden />
              <span className="text-[13px] leading-tight font-extrabold text-fg">{row.title}</span>
              <span className="line-clamp-4 text-[11px] leading-snug text-muted">{row.off ?? row.detail}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
