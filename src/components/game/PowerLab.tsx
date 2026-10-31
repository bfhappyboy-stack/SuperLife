import type React from "react";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/game/Portrait";
import { Award, Check, Dumbbell, MessageCircle, Search, Shield, Skull, Swords, type LucideIcon } from "lucide-react";
import { ElementIcon } from "@/components/game/Vfx";
import { arcsCleared, availableArcs, currentCase, plotFor, type ArcDef, type ArcStep } from "@/game/arcs";
import { ELEMENTS, elementOfLegacy } from "@/game/elements";
import { getPower, mix, teachableBases, viewPowers } from "@/game/combo";
import { mergeHeroes, replyLocally } from "@/game/heroes";
import { askHero } from "@/game/hero-talk";
import { masteryCap, masteryLevel, nextMasteryExp, powerRank } from "@/game/mastery";
import { knownMoves, moveLevel, MOVESET_SIZE, STREET_MOVES } from "@/game/moves";
import { dossier, homeArc, talkBrief } from "@/game/origin";
import { hasGift } from "@/game/theme";
import { library, type LibraryState } from "@/game/library";
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
        <Dormant game={game} />
      </div>
    );
  }

  if (!gift && pane === "moves") return null;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p role="status" className="card anim-pop !border-gold/70 px-4 py-3 text-sm font-semibold text-fg">
          {notice}
        </p>
      )}
      {pane === "book" && gift && (
        <>
          <MasteryBoard game={game} owned={owned} heard={heard} onAct={onAct} onNote={setNotice} />
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
            blocked={!!(preview?.ok && library(game).block && !unlocked.includes(preview.power.id))}
            onPick={pick}
            onMix={() => left && right && attempt(left, right)}
          />
        </>
      )}
      {pane === "moves" && gift && <Loadout game={game} onAct={onAct} onNote={setNotice} />}
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
                  className={`btn btn-ghost !min-h-11 text-sm ${moves && hero.relationship >= 36 ? "" : "opacity-60"}`}
                >
                  Train
                </button>
              </div>
              {offers.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {offers.map((power) => {
                    const block = library(game).block;
                    const ready = moves && hero.relationship >= 28 && !block;
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
                          if (hero.relationship < 28) {
                            onNote(`Bond ${hero.relationship}. ${power.name} wants 28.`);
                            return;
                          }
                          onNote(`Asked ${hero.alias} to teach ${power.name}.`);
                          onAct(`learn|${hero.id}|${power.id}`);
                        }}
                        className={`card min-h-11 px-3 py-2 text-left text-sm ${ready ? "!border-gold text-fg" : "text-muted"}`}
                      >
                        <span className="font-semibold">Learn {power.name}</span>
                        <span className="block text-muted">{hero.relationship < 28 ? "Bond 28 to take the lesson." : block ? "No room in your book yet." : "A base power. It can braid with what you hold."}</span>
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
          : "Keep aging. A gift usually arrives on its own. From 13, a birthday can offer one. Nothing here can be mixed before that."}
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
  blocked,
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
  blocked: boolean;
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
      <p className="mt-1 text-sm text-muted">Two hands, then Mix. Tap a chosen power again to drop it. The name of a new braid stays hidden until it lands.</p>
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
      <button type="button" disabled={!left || !right || !moves || !previewOk || blocked} onClick={onMix} className="btn btn-primary mt-3 min-h-12 w-full disabled:opacity-40">
        {!moves ? "No moves left this month" : !left || !right ? "Choose two powers" : !previewOk ? "These two won't mix" : blocked ? "No room in the book yet" : "Mix these two"}
      </button>
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

function Loadout({ game, onAct, onNote }: { game: Game; onAct: (id: string) => void; onNote: (text: string) => void }) {
  const known = knownMoves(game);
  const equipped = game.loadout ?? [];
  const sets = game.moveSets ?? [];
  const [saved, setSaved] = useState<number | null>(null);

  function drop(id: string | undefined) {
    if (!id) {
      onNote("That slot is empty.");
      return;
    }
    const name = known.find((entry) => entry.def.id === id)?.def.name ?? "That move";
    onAct(`equip|${id}`);
    onNote(`${name} left the six.`);
  }

  function toggle(id: string, name: string, unlocked: boolean, need: string) {
    if (!unlocked) {
      onNote(`${name} stays locked until that power ranks ${need}.`);
      return;
    }
    if (equipped.includes(id)) {
      onAct(`equip|${id}`);
      onNote(`${name} left the six.`);
      return;
    }
    if (equipped.length >= 6) {
      onNote("The six are full. Drop one first.");
      return;
    }
    onAct(`equip|${id}`);
    onNote(`${name} is in the six.`);
  }

  return (
    <section className="card px-4 py-3">
      <h2 className="t-label text-muted">SIX MOVES</h2>
      <p className="mt-1 text-sm text-muted">Tap a filled slot to drop it. Tap a move below to add it. Swapping is free. A locked move tells you the rank it wants.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Array.from({ length: MOVESET_SIZE }, (_, index) => {
          const id = equipped[index];
          const def = known.find((entry) => entry.def.id === id)?.def;
          const filledCount = equipped.filter((slot) => known.some((entry) => entry.def.id === slot)).length;
          const street = def ? null : STREET_MOVES[Math.max(0, index - filledCount)];
          return (
            <button
              key={`slot-${index}`}
              type="button"
              aria-pressed={!!def}
              disabled={!def}
              onClick={() => def && drop(id)}
              className={`card min-h-16 px-3 py-2 text-left ${def ? "!border-gold/70 !bg-panel-2" : "!border-dashed"}`}
            >
              <p className="t-label text-muted">Slot {index + 1}</p>
              <p className={`text-sm font-semibold ${def ? "text-fg" : "text-muted"}`}>{def?.name ?? street?.name ?? "Empty"}</p>
              <p className="text-xs text-muted">{def ? `${def.kind} · tap to drop` : "street move · fills in fights"}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {sets.map((set, index) => (
          <div key={set.name} className="flex flex-col gap-2">
            <button
              type="button"
              aria-pressed={saved === index}
              onClick={() => {
                onAct(`set-save|${index}`);
                setSaved(index);
                onNote(`${set.name} remembers this six.`);
              }}
              className="btn btn-ghost !min-h-11 text-sm"
            >
              Save {set.name}
            </button>
            <button
              type="button"
              aria-pressed={saved === index && set.moves.length > 0}
              disabled={set.moves.length === 0}
              onClick={() => {
                onAct(`set-load|${index}`);
                setSaved(index);
                onNote(`${set.name} is what you bring.`);
              }}
              className="btn btn-gold !min-h-11 text-sm disabled:opacity-40"
            >
              {set.moves.length === 0 ? `${set.name} is empty` : `Load ${set.name}`}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {known.map(({ def, unlocked }) => {
          const on = equipped.includes(def.id);
          const need = powerRank(def.minMastery);
          return (
            <button
              key={def.id}
              type="button"
              aria-pressed={on}
              aria-disabled={!unlocked}
              onClick={() => toggle(def.id, def.name, unlocked, need)}
              className={`card min-h-12 px-3 py-2 text-left text-sm ${on ? "!border-gold !bg-panel-2 text-fg" : unlocked ? "text-fg" : "text-muted opacity-70"}`}
            >
              <span className="font-semibold">{def.name}</span>
              <span className="ml-2 text-xs text-gold">{on ? "In the six" : unlocked ? `Move ${moveLevel(game.moveExp?.[def.id] ?? 0)}` : `Needs ${need}`}</span>
              <span className="block text-muted">
                {def.kind} · {def.style} · {def.energy}e{def.cooldown ? ` · ${def.cooldown} turn` : ""} · {def.effect}
              </span>
            </button>
          );
        })}
      </div>
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
