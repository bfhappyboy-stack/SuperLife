import { useEffect, useState } from "react";
import { Portrait } from "@/components/game/Portrait";
import { arcsCleared, availableArcs, currentCase, plotFor } from "@/game/arcs";
import { getPower, mix, teachableBases, viewPowers } from "@/game/combo";
import { mergeHeroes, replyLocally } from "@/game/heroes";
import { askHero } from "@/game/hero-talk";
import { masteryCap, masteryLevel, nextMasteryExp, powerRank } from "@/game/mastery";
import { knownMoves, moveLevel } from "@/game/moves";
import { dossier, talkBrief } from "@/game/origin";
import { hasGift } from "@/game/theme";
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
        <p role="status" className="rounded-2xl border border-gold bg-panel px-4 py-3 text-sm font-semibold text-fg">
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
    <section className="rounded-2xl border border-line bg-panel px-4 py-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted">WHO WILL TEACH</h2>
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
            <article key={hero.id} className={`rounded-2xl border px-3 py-3 ${local ? "border-gold bg-panel-2" : "border-line"}`}>
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
                  className="min-h-11 rounded-2xl border border-gold text-sm font-semibold text-fg"
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
                  className={`min-h-11 rounded-2xl border text-sm font-semibold ${moves && hero.relationship >= 22 ? "border-line text-fg" : "border-line text-muted"}`}
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
                  className={`min-h-11 rounded-2xl border text-sm font-semibold ${moves && hero.relationship >= 36 ? "border-line text-fg" : "border-line text-muted"}`}
                >
                  Train
                </button>
              </div>
              {offers.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {offers.map((power) => {
                    const ready = moves && hero.relationship >= 28;
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
                          if (hero.relationship < 28) {
                            onNote(`Bond ${hero.relationship}. ${power.name} wants 28.`);
                            return;
                          }
                          onNote(`Asked ${hero.alias} to teach ${power.name}.`);
                          onAct(`learn|${hero.id}|${power.id}`);
                        }}
                        className={`min-h-11 rounded-2xl border px-3 text-left text-sm ${ready ? "border-gold text-fg" : "border-line text-muted"}`}
                      >
                        <span className="font-semibold">Learn {power.name}</span>
                        <span className="block text-muted">{hero.relationship < 28 ? "Bond 28 to take the lesson." : "A base power. It can braid with what you hold."}</span>
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
    <section className="rounded-2xl border border-line bg-panel px-4 py-5">
      <h2 className="text-xs font-semibold tracking-widest text-muted">{human ? "NO GIFT ON FILE" : "NO POWER YET"}</h2>
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
  onPick: (id: string) => void;
  onMix: () => void;
}) {
  const ready = owned.filter((power) => power.unlocked);
  return (
    <section className="rounded-2xl border border-line bg-panel px-4 py-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted">BRAID BOOK</h2>
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
              className={`min-h-12 rounded-2xl border px-3 text-left text-sm ${slot ? "border-gold bg-panel-2 text-fg" : "border-line bg-panel text-fg"}`}
            >
              <span className="font-semibold">{power.name}</span>
              <span className="mt-0.5 block text-xs text-gold">{slot ? `In hand ${slot}` : `${power.tierName} · ${rank}`}</span>
            </button>
          );
        })}
      </div>
      <button type="button" disabled={!left || !right || !moves || !previewOk} onClick={onMix} className="mt-3 min-h-12 w-full rounded-2xl bg-cape px-4 font-semibold text-fg disabled:opacity-40">
        {!moves ? "No moves left this month" : !left || !right ? "Choose two powers" : previewOk ? "Mix these two" : "These two won't mix"}
      </button>
    </section>
  );
}

function Slot({ label, id }: { label: string; id: string | null }) {
  const power = id ? getPower(id) : null;
  return (
    <div className={`min-h-16 rounded-2xl border px-3 py-2 ${power ? "border-gold bg-panel-2" : "border-line"}`}>
      <p className="text-xs font-semibold tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-fg">{power?.name ?? "Empty"}</p>
    </div>
  );
}

export function CaseFile({ game }: { game: Game }) {
  const current = currentCase(game);
  const open = availableArcs(game);
  return (
    <section className="rounded-2xl border border-line bg-panel px-4 py-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted">CASE FILE</h2>
      {current ? (
        <>
          <p className="mt-1 font-semibold text-fg">{current.arc.title}</p>
          <p className="text-sm text-gold">
            {current.arc.villain} · {current.arc.group}
          </p>
          <p className="mt-1 text-sm text-muted">{current.arc.goal}</p>
          <ol className="mt-2 flex flex-col gap-1">
            {current.arc.steps.map((step, index) => (
              <li key={step.id} className={`text-sm ${index === current.index ? "font-semibold text-gold" : index < current.index ? "text-fg" : "text-muted"}`}>
                {index + 1}. {step.title}
                <span className="font-normal text-muted"> · {step.kind}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted">The next step is a button on this desk. The teachers know {current.arc.villain}.</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {game.age < 12 ? "Cases open at 12. Until then, drills stay small on purpose." : open.length ? `${open.length} file${open.length === 1 ? "" : "s"} on this desk. This city puts its own villains first.` : "No open files. Finished cases still lift the mastery ceiling."}
        </p>
      )}
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
    <section className="rounded-2xl border border-line bg-panel px-4 py-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted">MASTERY</h2>
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
                  className={`min-h-11 rounded-2xl border px-3 text-sm font-semibold ${focused ? "border-gold bg-panel-2 text-fg" : "border-line text-fg"}`}
                >
                  {focused ? "Focused" : "Set focus"}
                </button>
              </div>
              <p className="text-xs text-muted">
                Rank {powerRank(level)} · ceiling {powerRank(cap)}
                {next == null ? " · topped out" : ` · ${exp}/${next} to the next rank`}
                {level >= cap ? " · soft wall" : ""}
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2">
                <div className="h-full rounded-full bg-gold" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
      {pages.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-muted">HEARD OF</p>
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
    <section className="rounded-2xl border border-line bg-panel px-4 py-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted">SIX MOVES</h2>
      <p className="mt-1 text-sm text-muted">Tap a filled slot to drop it. Tap a move below to add it. Swapping is free. A locked move tells you the rank it wants.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }, (_, index) => {
          const id = equipped[index];
          const def = known.find((entry) => entry.def.id === id)?.def;
          return (
            <button
              key={`slot-${index}`}
              type="button"
              aria-pressed={!!def}
              onClick={() => drop(id)}
              className={`min-h-16 rounded-2xl border px-3 py-2 text-left ${def ? "border-gold bg-panel-2" : "border-line"}`}
            >
              <p className="text-xs font-semibold tracking-widest text-muted">Slot {index + 1}</p>
              <p className="text-sm font-semibold text-fg">{def?.name ?? "Empty"}</p>
              <p className="text-xs text-muted">{def ? `${def.kind} · tap to drop` : "Open"}</p>
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
              className="min-h-11 rounded-2xl border border-line text-sm font-semibold text-fg"
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
              className="min-h-11 rounded-2xl border border-gold text-sm font-semibold text-fg disabled:opacity-40"
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
              className={`min-h-12 rounded-2xl border px-3 py-2 text-left text-sm ${on ? "border-gold bg-panel-2 text-fg" : unlocked ? "border-line bg-panel text-fg" : "border-line bg-panel text-muted"}`}
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
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-fg">{hero.alias}</p>
          <p className="truncate text-xs text-muted">
            Bond {hero.relationship} · Lv {hero.level}
            {plot ? ` · ${plot.villain}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-2xl border border-line px-4 text-sm font-semibold text-fg">
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
            <p key={`${entry.role}-${index}`} className={`rounded-2xl px-3 py-2 text-sm ${entry.role === "you" ? "bg-panel text-fg" : "bg-paper text-paper-ink"}`}>
              {entry.text}
            </p>
          ))}
          {busy && <p className="text-sm text-gold">They're thinking...</p>}
        </div>
        {hero.relationship >= 70 && teachable.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-widest text-muted">TEACH A BRAID</p>
            {teachable.map((power) => (
              <button key={power.id} type="button" onClick={() => onAct(`teach|${hero.id}|${power.id}`)} className="min-h-11 rounded-2xl border border-line px-3 text-left text-sm font-semibold text-fg">
                Show them {power.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <form
        className="flex shrink-0 gap-2 border-t border-line px-4 pt-3 pb-24"
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
          className="min-h-12 w-full rounded-2xl border border-line bg-panel-2 px-4 text-fg"
        />
        <button type="submit" disabled={busy || !draft.trim()} className="min-h-12 shrink-0 rounded-2xl bg-cape px-4 font-semibold text-fg disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}

function useGameTalk() {
  return useGame((s) => s.noteTalk);
}
