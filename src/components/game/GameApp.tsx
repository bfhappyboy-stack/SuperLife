import { Briefcase, Heart, Menu, ScrollText, Swords, Users, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Closet } from "@/components/game/Closet";
import { Figure } from "@/components/game/Figure";
import { Portrait } from "@/components/game/Portrait";
import { HeroChat, PowerLab, CaseFile } from "@/components/game/PowerLab";
import { Minigame } from "@/components/game/Minigame";
import { CITIES, FEMALE_NAMES, JOB_TITLES, LAST_NAMES, MALE_NAMES, RANKS, UPBRINGINGS, fusionTitle, jobById, powerById, schoolById, teamById } from "@/game/data";
import { abilityList, actionsFor } from "@/game/engine";
import { firstName, karmaLabel, money, tierLabel, whenLabel, MONTHS } from "@/game/format";
import { allPowers } from "@/game/combo";
import { starterWardrobe } from "@/game/costume";
import { BUILD_NAMES, FEATURE_NAMES, HAIR_NAMES, resolveLook, SKIN_NAMES, STYLE_NAMES } from "@/game/look";
import { DRIVE_TRAITS, FACE_TRAITS } from "@/game/origin";
import { saveGame } from "@/game/save";
import { capeTheme } from "@/game/theme";
import { useGame } from "@/game/store";
import type { ActionItem, Delta, Game, Look, Person, Sex, TraitId, UpbringingId } from "@/game/types";

export function GameApp() {
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const hydrate = useGame((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    const flush = () => {
      const current = useGame.getState().game;
      if (current) saveGame(current);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [hydrate]);
  const theme = screen === "play" && game ? capeTheme(game) : { cape: null, braid: null };

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-ink">
      <div
        data-cape={theme.cape ?? undefined}
        data-braid={theme.braid ?? undefined}
        className="phone-shell relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      >
        {screen === "title" && <TitleScreen />}
        {screen === "create" && <CreateScreen />}
        {screen === "play" && <PlayScreen />}
      </div>
    </div>
  );
}

function TitleScreen() {
  const game = useGame((s) => s.game);
  const scores = useGame((s) => s.scores);
  const hydrated = useGame((s) => s.hydrated);
  const openCreate = useGame((s) => s.openCreate);
  const resume = useGame((s) => s.resume);
  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-8">
        <p className="text-xs font-semibold tracking-widest text-gold">A LIFE IN CAPES</p>
        <h1 className="mt-2 font-display text-6xl leading-none text-fg">SUPERLIFE</h1>
        <p className="mt-3 max-w-xs text-pretty text-base text-muted">
          One gift. A face you can restyle. A closet that changes how you hit.
        </p>
        <div className="mt-6 flex gap-3">
          <Portrait seed={11} age={17} powerId="flight" rank={2} sex="female" className="h-20 w-20" />
          <Portrait seed={42} age={34} powerId="fire" rank={4} mood={80} sex="male" className="h-20 w-20" />
          <Portrait seed={77} age={71} powerId="intellect" rank={6} mood={40} sex="female" className="h-20 w-20" />
        </div>
        {scores.length > 0 && (
          <section className="mt-8 pb-4">
            <h2 className="text-xs font-semibold tracking-widest text-muted">BEST LIVES</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {scores.slice(0, 5).map((row) => (
                <li key={row.at} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-fg">{row.name}</span>
                    <span className="text-xs text-muted">{row.detail}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-gold">{row.score}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-line px-5 pt-3 pb-24">
        <button type="button" onClick={openCreate} className="min-h-12 rounded-2xl bg-cape px-4 text-base font-semibold text-fg">
          New life
        </button>
        {hydrated && game && (
          <button type="button" onClick={resume} className="min-h-12 rounded-2xl border border-line bg-panel px-4 text-left text-base font-semibold text-fg">
            {game.phase === "dead" ? "Read the obituary" : `Continue ${firstName(game.name)}, age ${game.age}`}
          </button>
        )}
      </div>
    </main>
  );
}

function CreateScreen() {
  const begin = useGame((s) => s.begin);
  const toTitle = useGame((s) => s.toTitle);
  const existing = useGame((s) => s.game);
  const [boot] = useState(() => {
    const sex: Sex = Math.random() < 0.5 ? "female" : "male";
    return { sex, name: rollName(sex) };
  });
  const [name, setName] = useState(boot.name);
  const [nameEdited, setNameEdited] = useState(false);
  const [sex, setSex] = useState<Sex>(boot.sex);
  const [cityId, setCityId] = useState(CITIES[0]?.id ?? "nyc");
  const [upbringing, setUpbringing] = useState<UpbringingId>("normal");
  const [face, setFace] = useState<TraitId>("secret");
  const [drive, setDrive] = useState<TraitId>("protector");
  const [portrait, setPortrait] = useState(() => Math.floor(Math.random() * 1_000_000_000) + 1);
  const [look, setLook] = useState<Look>(() => resolveLook(portrait));
  const [tier, setTier] = useState<0 | 1 | 2 | "none">(0);
  const [giftId, setGiftId] = useState(() => {
    const basics = allPowers().filter((power) => power.generation === 0);
    return basics[Math.floor(Math.random() * basics.length)]?.id ?? "fire-control";
  });
  const city = CITIES.find((item) => item.id === cityId) ?? CITIES[0];
  const house = UPBRINGINGS.find((item) => item.id === upbringing) ?? UPBRINGINGS[0];
  const faceTrait = FACE_TRAITS.find((item) => item.id === face) ?? FACE_TRAITS[0];
  const driveTrait = DRIVE_TRAITS.find((item) => item.id === drive) ?? DRIVE_TRAITS[0];
  const chooseSex = (next: Sex) => {
    setSex(next);
    if (!nameEdited) setName(rollName(next));
  };
  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4">
      <button type="button" onClick={toTitle} className="self-start text-sm font-semibold text-muted">
        Back
      </button>
      <h1 className="mt-3 font-display text-4xl text-fg">NEW LIFE</h1>
      <p className="mt-2 text-sm text-muted">A face, a suit, and one gift. Everything after that has to be learned.</p>
      {existing && <p className="mt-3 text-sm text-gold">Starting over replaces the life you have saved.</p>}
      <div className="mt-4 overflow-hidden rounded-2xl">
        <div className="relative h-80">
          <Figure seed={portrait} age={16} sex={sex} look={look} wardrobe={starterWardrobe()} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-muted">You</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["female", "male"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={sex === option}
            onClick={() => chooseSex(option)}
            className={`min-h-12 rounded-2xl border px-4 text-left font-semibold ${sex === option ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            {option === "female" ? "Female" : "Male"}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            const next = Math.floor(Math.random() * 1_000_000_000) + 1;
            setPortrait(next);
            setLook(resolveLook(next));
          }}
          className="min-h-12 flex-1 rounded-2xl border border-line bg-panel px-4 font-semibold text-fg"
        >
          Reroll look
        </button>
      </div>
      <LookRow title="Skin" names={SKIN_NAMES} value={look.skin} swatch="skin" onPick={(index) => setLook({ ...look, skin: index })} />
      <LookRow title="Hair" names={HAIR_NAMES} value={look.hair} swatch="hair" onPick={(index) => setLook({ ...look, hair: index })} />
      <LookRow title="Cut" names={STYLE_NAMES} value={look.style} onPick={(index) => setLook({ ...look, style: index })} />
      <LookRow title="Build" names={BUILD_NAMES} value={look.build} onPick={(index) => setLook({ ...look, build: index })} />
      <LookRow title="Face" names={FEATURE_NAMES} value={look.feature} onPick={(index) => setLook({ ...look, feature: index })} />
      <label className="mt-5 text-sm font-semibold text-muted" htmlFor="hero-name">
        Name
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="hero-name"
          value={name}
          maxLength={32}
          onChange={(event) => {
            setName(event.target.value);
            setNameEdited(true);
          }}
          className="min-h-12 w-full rounded-2xl border border-line bg-panel-2 px-4 text-fg"
        />
        <button type="button" onClick={() => { setName(rollName(sex)); setNameEdited(false); }} className="min-h-12 shrink-0 rounded-2xl border border-line bg-panel px-4 font-semibold text-fg">
          Random
        </button>
      </div>
      <h2 className="mt-5 text-sm font-semibold text-muted">City</h2>
      <div className="mt-2 flex flex-col gap-2">
        {CITIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={cityId === item.id}
            onClick={() => setCityId(item.id)}
            className={`min-h-12 rounded-2xl border px-4 text-left ${cityId === item.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.name}</span>
            <span className="text-sm">{item.flavor}</span>
          </button>
        ))}
      </div>
      <h2 className="mt-5 text-sm font-semibold text-muted">Childhood</h2>
      <div className="mt-2 flex flex-col gap-2">
        {UPBRINGINGS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={upbringing === item.id}
            onClick={() => setUpbringing(item.id)}
            className={`min-h-12 rounded-2xl border px-4 py-3 text-left ${upbringing === item.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.detail}</span>
          </button>
        ))}
      </div>
      <h2 className="mt-5 text-sm font-semibold text-muted">How the city sees you</h2>
      <div className="mt-2 flex flex-col gap-2">
        {FACE_TRAITS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={face === item.id}
            onClick={() => setFace(item.id)}
            className={`min-h-12 rounded-2xl border px-4 py-3 text-left ${face === item.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.blurb}</span>
          </button>
        ))}
      </div>
      <h2 className="mt-5 text-sm font-semibold text-muted">What drives you</h2>
      <div className="mt-2 flex flex-col gap-2">
        {DRIVE_TRAITS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={drive === item.id}
            onClick={() => setDrive(item.id)}
            className={`min-h-12 rounded-2xl border px-4 py-3 text-left ${drive === item.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.blurb}</span>
          </button>
        ))}
      </div>
      <GiftPicker tier={tier} giftId={giftId} onTier={setTier} onGift={setGiftId} />
      </div>
      <div className="shrink-0 border-t border-line px-5 pt-3 pb-24">
        <p className="mb-2 text-sm text-muted">
          {house?.title} in {city?.name}. {faceTrait?.title}. {driveTrait?.title}. {giftId ? (allPowers().find((power) => power.id === giftId)?.name ?? "One gift") : "No gift"}.
        </p>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => begin({ name: name.trim(), cityId: city?.id ?? "nyc", upbringing, portrait, sex, face, drive, look, giftId: giftId || null })}
          className="min-h-12 w-full rounded-2xl bg-cape px-4 text-base font-semibold text-fg disabled:opacity-40"
        >
          Begin at age 0
        </button>
      </div>
    </main>
  );
}

function PlayScreen() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  if (game.phase === "dead" && game.death) return <Obituary game={game} />;
  return <Life game={game} />;
}

function Life({ game }: { game: Game }) {
  const age = useGame((s) => s.age);
  const pick = useGame((s) => s.pick);
  const act = useGame((s) => s.do);
  const finishMini = useGame((s) => s.finishMini);
  const toTitle = useGame((s) => s.toTitle);
  const [desk, setDesk] = useState<Desk>("life");
  const [shelf, setShelf] = useState<string | null>(null);
  const [folded, setFolded] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<null | "menu" | "log">(null);
  const [chat, setChat] = useState<string | null>(null);
  const [closet, setCloset] = useState(false);
  const [ack, setAck] = useState("");
  const power = powerById(game.powerId);
  const second = powerById(game.secondaryId);
  const fusion = power && second ? fusionTitle(power.id, second.id) : null;
  const placed = useMemo(() => actionsFor(game).map((action) => ({ action, ...place(action) })), [game]);
  const onDesk = placed.filter((row) => row.desk === desk);
  const shelves = SHELF_ORDER[desk].filter((name) => (ALWAYS_SHELF[desk] ?? []).includes(name) || onDesk.some((row) => row.shelf === name));
  const activeShelf = shelves.includes(shelf ?? "") ? (shelf ?? "") : (shelves[0] ?? "");
  const visible = onDesk.filter((row) => row.shelf === activeShelf).map((row) => row.action);
  const sections = useMemo(() => group(visible), [visible]);
  const team = teamById(game.teamId);
  const school = schoolById(game.schoolId);
  const job = jobById(game.jobId);
  const choosing = game.phase === "choice" && !!game.pending;
  const ownedTricks = abilityList(game);

  useEffect(() => {
    setFolded(true);
  }, [game.card.kicker, game.card.body]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [desk, activeShelf]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className={`shrink-0 border-b border-line px-3 ${game.phase === "mini" ? "py-3" : "py-2"}`}>
        {game.phase === "mini" ? (
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="font-display text-xl tracking-wide text-fg">SUPERLIFE</p>
            <p className="truncate text-sm text-muted">{game.name}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Open the closet" onClick={() => setCloset(true)} className="shrink-0 rounded-xl">
              <Portrait seed={game.portrait} age={game.age} powerId={game.powerId} rank={game.leagueRank} mood={game.stats.happiness} sex={game.sex} look={game.look} className="h-11 w-11" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-fg">{game.name}</h1>
              <p className="truncate text-xs text-muted">{whenLabel(game.age, game.month ?? 0)} · {game.city}</p>
              <p className="truncate text-xs text-gold">
                {fusion ? fusion : power ? power.name : game.powerless ? "Unpowered" : "No power yet"}
                {power ? ` · ${tierLabel(game.stats.powerLevel)} ${game.stats.powerLevel.toFixed(1)}` : ""}
                {" · "}
                {RANKS[game.leagueRank]}
                {" · "}
                {money(game.stats.money)}
                {" · "}
                {karmaLabel(game.stats.karma ?? 0)}
              </p>
            </div>
            <button type="button" aria-label="Menu" onClick={() => setSheet("menu")} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-fg">
              <Menu className="size-5" />
            </button>
          </div>
        )}
        {game.phase !== "mini" && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            <Bar label="HP" value={game.stats.health} />
            <Bar label="Joy" value={game.stats.happiness} />
            <Bar label="Mind" value={game.stats.smarts} />
            <Bar label="Look" value={game.stats.looks} />
          </div>
        )}
      </header>

      {game.phase === "mini" && game.minigame ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <Minigame key={`${game.minigame.title}-${game.age}-${game.missions}`} spec={game.minigame} onDone={finishMini} />
        </div>
      ) : (
        <>
          {!choosing && (
            <>
              <nav aria-label="Desks" className="flex shrink-0 gap-1 overflow-x-auto px-3 pt-2">
                {DESKS.map((item) => (
                  <DeskButton
                    key={item.id}
                    current={desk}
                    id={item.id}
                    label={item.label}
                    hot={placed.some((row) => row.desk === item.id && row.action.accent && !row.action.disabled)}
                    icon={DESK_ICON[item.id]}
                    onPick={(id) => {
                      setDesk(id);
                      setShelf(null);
                      setAck(`${item.label} — pressed.`);
                    }}
                  />
                ))}
              </nav>
              {shelves.length > 1 && (
                <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pt-2" role="tablist" aria-label={DESK_LINE[desk]}>
                  {shelves.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={name === activeShelf}
                      aria-pressed={name === activeShelf}
                      onClick={() => {
                        setShelf(name);
                        setAck(`${name} — pressed.`);
                      }}
                      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${name === activeShelf ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div ref={scroller} data-desk={desk} className="desk min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
            <article className="rounded-2xl border-l-4 border-cape bg-paper px-4 py-3 text-paper-ink">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl tracking-wide">{game.card.kicker}</p>
                {!choosing && (
                  <button type="button" onClick={() => setFolded((open) => !open)} className="min-h-11 shrink-0 rounded-2xl border border-paper-ink/20 px-3 text-sm font-semibold">
                    {folded ? "Open card" : "Fold card"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold">{game.city}</p>
              {game.card.banner.map((line) => (
                <p key={line} className="mt-2 text-sm font-semibold">
                  {line}
                </p>
              ))}
              <p className={`mt-2 text-pretty whitespace-pre-wrap text-sm leading-relaxed ${choosing || !folded ? "" : "line-clamp-2"}`}>{game.card.body}</p>
              {(choosing || !folded) && game.card.deltas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {game.card.deltas.map((delta, index) => (
                    <DeltaChip key={`${delta.stat}-${index}`} delta={delta} />
                  ))}
                </div>
              )}
            </article>
            {!choosing && <p className="desk-accent mt-3 text-sm font-semibold">{DESK_LINE[desk]}</p>}
            {!choosing && desk === "work" && (
              <p className="mt-2 text-sm text-muted">
                {school ? school.name : "No hero school"}
                {" · "}
                {job ? `${job.name} (${JOB_TITLES[game.jobRank]})` : "No job"}
                {" · "}
                {team ? team.name : "No team"}
              </p>
            )}
            {!choosing && desk === "people" && activeShelf === "Crew" && game.crew && (
              <p className="mt-2 text-sm text-muted">
                {game.crew.name}
                {game.crew.motto ? ` — ${game.crew.motto}` : ""}
                {` · heat ${game.crew.heat ?? 0} · loyalty ${game.crew.loyalty ?? 50}`}
                {game.crew.members.length ? ` · ${game.crew.members.map((member) => member.alias).join(", ")}` : " · just you, so far."}
              </p>
            )}
            {!choosing && desk === "gift" && activeShelf === "Book" && (power || fusion) && (
              <section className="mt-3 rounded-2xl border border-line bg-panel px-4 py-3">
                <p className="font-display text-2xl tracking-wide text-gold">{fusion ?? power?.name}</p>
                {power && <p className="mt-1 text-sm text-muted">{power.tagline}</p>}
                {power && <p className="mt-2 text-sm text-fg">{power.strength}</p>}
                {power && <p className="mt-1 text-sm text-muted">Weakness: {power.weakness}</p>}
                {second && <p className="mt-2 text-sm text-gold">Braided with {second.name}. {second.tagline}</p>}
                {ownedTricks.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {ownedTricks.slice(0, 4).map((trick) => (
                      <li key={trick.name} className="text-sm text-fg">
                        <span className="font-semibold text-gold">{trick.name}</span>
                        <span className="text-muted"> · {trick.blurb}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {!choosing && desk === "cases" && activeShelf === "Files" && <div className="mt-3"><CaseFile game={game} /></div>}
            {!choosing && desk === "board" && <div className="mt-3"><Roster game={game} /></div>}
            {!choosing && desk === "people" && activeShelf === "Circle" && (
              <PeopleStack game={game} actions={visible} onPress={(action) => { setAck(`${action.label} — pressed.`); act(action.id); }} />
            )}
            {!choosing && !(desk === "board") && !(desk === "people" && activeShelf === "Circle") && (
              <div className="mt-3 flex flex-col gap-4">
                {sections.map((section) => (
                  <section key={section.title}>
                    {sections.length > 1 && <h2 className="text-xs font-semibold tracking-widest text-muted">{section.title.toUpperCase()}</h2>}
                    <div className={`flex flex-col gap-2 ${sections.length > 1 ? "mt-2" : ""}`}>
                      {section.items.map((action) => (
                        <ActionRow
                          key={action.id}
                          action={action}
                          file={desk === "cases" && activeShelf === "Files"}
                          onPress={() => {
                            setAck(`${action.label} — pressed.`);
                            act(action.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
                {desk === "gift" && (activeShelf === "Book" || activeShelf === "Moves" || activeShelf === "Teachers") && (
                  <PowerLab game={game} pane={activeShelf === "Moves" ? "moves" : activeShelf === "Teachers" ? "teachers" : "book"} onAct={act} onChat={setChat} />
                )}
                {sections.length === 0 && !(desk === "gift" && (activeShelf === "Book" || activeShelf === "Teachers")) && !(desk === "cases" && activeShelf === "Files") && (
                  <p className="text-sm text-muted">{EMPTY[desk]}</p>
                )}
              </div>
            )}
          </div>
          {game.phase === "live" && (
            <div className="shrink-0 border-t border-line px-4 pt-2 pb-3">
              {ack && (
                <p role="status" className="mb-2 rounded-2xl border border-gold bg-panel px-3 py-2 text-center text-sm font-semibold text-fg">
                  {ack}
                </p>
              )}
              <p className="mb-2 text-center text-xs font-semibold tracking-wide text-muted">
                {game.majorsLeft > 0 ? `${game.majorsLeft} MOVE${game.majorsLeft === 1 ? "" : "S"} LEFT` : "OUT OF MOVES"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAck(game.month === 11 ? "New year — pressed." : "Next month — pressed.");
                  age();
                }}
                className="min-h-14 w-full rounded-2xl bg-cape text-lg font-semibold text-fg"
              >
                {game.month === 11 ? `New year · age ${game.age + 1}` : "Next month"}
              </button>
            </div>
          )}
          {game.phase === "choice" && game.pending && (
            <div className="shrink-0 flex flex-col gap-2 border-t border-line px-4 pt-2 pb-3">
              {ack && (
                <p role="status" className="rounded-2xl border border-gold bg-panel px-3 py-2 text-center text-sm font-semibold text-fg">
                  {ack}
                </p>
              )}
              {game.pending.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => {
                    setAck(`${choice.label} — pressed.`);
                    pick(choice.id);
                  }}
                  className="min-h-12 rounded-2xl bg-cape px-4 text-left text-base font-semibold text-fg"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {closet && <Closet game={game} onAct={act} onClose={() => setCloset(false)} />}
      {chat && <HeroChat game={game} heroId={chat} onClose={() => setChat(null)} onAct={act} />}
      {sheet && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 px-4 pb-24" role="dialog" aria-modal="true">
          <div className="max-h-[75%] w-full overflow-y-auto rounded-2xl border border-gold bg-panel px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-fg">{sheet === "log" ? "LIFE LOG" : "MENU"}</h2>
              <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="flex size-11 items-center justify-center rounded-2xl border border-line text-fg">
                <X className="size-5" />
              </button>
            </div>
            {sheet === "menu" ? (
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={() => { setSheet(null); setCloset(true); }} className="min-h-12 rounded-2xl border border-line px-4 text-left font-semibold text-fg">
                  Open the closet
                </button>
                <button type="button" onClick={() => setSheet("log")} className="min-h-12 rounded-2xl border border-line px-4 text-left font-semibold text-fg">
                  Read the life log
                </button>
                <button type="button" onClick={toTitle} className="min-h-12 rounded-2xl border border-line px-4 text-left font-semibold text-fg">
                  Main menu
                </button>
                <p className="text-sm text-muted">This life saves itself on this device.</p>
              </div>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {[...game.history].reverse().slice(0, 40).map((entry, index) => (
                  <li key={`${entry.age}-${index}`} className="border-b border-line pb-2">
                    <span className="text-xs font-semibold text-gold">
                      Age {entry.age}
                      {entry.month != null ? ` · ${MONTHS[entry.month] ?? ""}` : ""}
                    </span>
                    <p className="text-sm text-pretty text-fg">{entry.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Obituary({ game }: { game: Game }) {
  const death = game.death;
  const toTitle = useGame((s) => s.toTitle);
  const openCreate = useGame((s) => s.openCreate);
  const playHeir = useGame((s) => s.playHeir);
  const kid = game.relationships.filter((person) => person.role === "child" && person.alive).sort((a, b) => b.age - a.age)[0];
  if (!death) return null;
  const tone =
    game.stats.reputation >= 50
      ? "The city dims a billboard."
      : game.stats.reputation <= -30
        ? "A few people cheer, then pretend they coughed."
        : "Most people hear it from a notification and feel odd on the train.";
  const survived = game.relationships.filter((person) => person.alive && person.role !== "ex");
  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto px-5 pt-6 pb-24">
      <p className="text-xs font-semibold tracking-widest text-gold">{game.city.toUpperCase()} HERALD</p>
      <h1 className="mt-2 font-display text-5xl leading-none text-fg">{death.cause.toUpperCase()}</h1>
      <div className="mt-4 flex items-center gap-3">
        <Portrait seed={game.portrait} age={game.age} powerId={game.powerId} rank={game.leagueRank} mood={30} sex={game.sex} className="h-16 w-16 shrink-0" />
        <p className="text-sm text-muted">
          {game.name} · age {game.age} · {karmaLabel(game.stats.karma ?? 0)} · {tone}
        </p>
      </div>
      <article className="mt-4 rounded-2xl bg-paper px-4 py-4 text-paper-ink">
        <p className="text-pretty whitespace-pre-wrap leading-relaxed">{death.story}</p>
        <p className="mt-3 text-sm">
          Survived by {survived.length ? survived.map((person) => person.name).slice(0, 6).join(", ") : "the group chat"}.
        </p>
      </article>
      <p className="mt-5 font-display text-5xl tabular-nums text-gold">{death.score}</p>
      <p className="text-xs font-semibold tracking-widest text-muted">LIFE SCORE</p>
      <ul className="mt-3 flex flex-col gap-1">
        {death.rows.map((row) => (
          <li key={row.label} className="flex justify-between text-sm">
            <span className="text-muted">{row.label}</span>
            <span className="tabular-nums text-fg">{row.points}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-2">
        {kid && (
          <button type="button" onClick={playHeir} className="min-h-12 rounded-2xl bg-cape px-4 text-left font-semibold text-fg">
            Continue as {firstName(kid.name)}
          </button>
        )}
        <button type="button" onClick={openCreate} className="min-h-12 rounded-2xl border border-line bg-panel px-4 text-left font-semibold text-fg">
          New life
        </button>
        <button type="button" onClick={toTitle} className="min-h-12 rounded-2xl px-4 text-left font-semibold text-muted">
          Main menu
        </button>
      </div>
    </main>
  );
}

function Roster({ game }: { game: Game }) {
  const rows = game.roster ?? [];
  if (!rows.length) return <p className="mt-3 text-sm text-muted">The board is blank. Give it a month.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((cape) => {
        const gift = powerById(cape.powerId);
        const you = cape.id === "you";
        const tone = you ? "border-gold bg-panel-2" : cape.side === "villain" ? "border-bad bg-panel" : cape.side === "hero" ? "border-good bg-panel" : "border-line bg-panel";
        return (
          <article key={cape.id} className={`rounded-2xl border px-3 py-3 ${tone}`}>
            <Portrait seed={cape.portrait} age={you ? game.age : 28} powerId={cape.powerId} rank={you ? game.leagueRank : 0} sex={you ? game.sex : cape.sex} className="h-12 w-12" />
            <p className="mt-2 truncate font-semibold text-fg">
              {cape.alias}
              {you ? " · you" : ""}
            </p>
            <p className="truncate text-xs text-gold">{cape.side === "villain" ? "Villain" : cape.side === "hero" ? "Hero" : "Rogue"}</p>
            <p className="truncate text-xs text-muted">{gift?.name ?? "Unknown"} · heat {Math.round(cape.heat)}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{cape.note}</p>
          </article>
        );
      })}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="motion-safe h-full rounded-full bg-cape" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function DeltaChip({ delta }: { delta: Delta }) {
  const positive = delta.amount > 0;
  const digits = delta.stat === "Power" ? 1 : 0;
  const amount = digits ? Number(delta.amount.toFixed(1)) : Math.round(delta.amount);
  if (!amount) return null;
  const shown = delta.stat === "Money" ? `${amount > 0 ? "+" : "−"}${money(Math.abs(amount)).replace("-", "")}` : `${amount > 0 ? "+" : ""}${amount} ${delta.stat}`;
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold text-paper-ink ${positive ? "bg-good/30" : "bg-bad/30"}`}>{shown}</span>;
}

type Desk = "life" | "gift" | "cases" | "people" | "work" | "board";

const DESKS: { id: Desk; label: string }[] = [
  { id: "life", label: "Life" },
  { id: "gift", label: "Gift" },
  { id: "cases", label: "Cases" },
  { id: "people", label: "People" },
  { id: "work", label: "Work" },
  { id: "board", label: "Board" },
];

const ALWAYS_SHELF: Partial<Record<Desk, string[]>> = {
  gift: ["Book", "Moves", "Teachers"],
  cases: ["Files"],
  people: ["Circle"],
};

const SHELF_ORDER: Record<Desk, string[]> = {
  life: ["Today", "City", "Become", "Shadow"],
  gift: ["Book", "Moves", "Drill", "Fight", "Teachers"],
  cases: ["Files", "League", "Street"],
  people: ["Circle", "Meet", "Family", "Crew"],
  work: ["School", "Job"],
  board: [],
};

const DESK_LINE: Record<Desk, string> = {
  life: "The block, the month, and the private choices.",
  gift: "The book, the six moves, the drill, the teachers.",
  cases: "Open files, League calls, and the street.",
  people: "The names that know yours.",
  work: "A seat in class, or a paycheck.",
  board: "Who is loose in the city this month.",
};

const EMPTY: Record<Desk, string> = {
  life: "Nothing in reach on this shelf.",
  gift: "Nothing on this shelf yet.",
  cases: "This desk is between calls.",
  people: "Nobody in this room yet.",
  work: "No seat and no shift on this shelf.",
  board: "The board is blank. Give it a month.",
};

const DESK_ICON: Record<Desk, ReactNode> = {
  life: <Heart className="size-4" />,
  gift: <Zap className="size-4" />,
  cases: <ScrollText className="size-4" />,
  people: <Users className="size-4" />,
  work: <Briefcase className="size-4" />,
  board: <Swords className="size-4" />,
};

function place(action: ActionItem): { desk: Desk; shelf: string } {
  const id = action.id;
  const section = action.section;
  if (section === "Cases" || id.startsWith("arc-") || id === "cases-quiet") return { desk: "cases", shelf: "Files" };
  if (id === "mission" || id === "tryout" || id.startsWith("team:") || section === "League" || section === "Transfer") return { desk: "cases", shelf: "League" };
  if (id === "heist" || id === "crew-pay" || id === "crew-cool" || id === "disband") return { desk: "people", shelf: "Crew" };
  if (id === "patrol") return { desk: "cases", shelf: "Street" };
  if (action.group === "life") {
    if (id === "city-walk" || id === "city-trouble" || id === "relocate") return { desk: "life", shelf: "City" };
    if (section === "Become" || id.startsWith("trait|")) return { desk: "life", shelf: "Become" };
    if (section === "The other road") return { desk: "life", shelf: "Shadow" };
    return { desk: "life", shelf: "Today" };
  }
  if (action.group === "power") {
    if (id === "train" || id === "stunt" || id === "confide" || id === "reveal" || section === "Training") return { desk: "gift", shelf: "Drill" };
    if (id === "brawl" || section === "Fights") return { desk: "gift", shelf: "Fight" };
    if (id === "seek-hero" || section === "Trainers") return { desk: "gift", shelf: "Teachers" };
    return { desk: "gift", shelf: "Book" };
  }
  if (action.group === "people") {
    if (section === "New faces" || id === "befriend" || id === "date") return { desk: "people", shelf: "Meet" };
    if (section === "Family" || id === "baby") return { desk: "people", shelf: "Family" };
    return { desk: "people", shelf: "Circle" };
  }
  if (id === "class" || id === "spar" || id === "drop" || id.startsWith("school:")) return { desk: "work", shelf: "School" };
  return { desk: "work", shelf: "Job" };
}

function DeskButton({
  current,
  id,
  label,
  icon,
  hot,
  onPick,
}: {
  current: Desk;
  id: Desk;
  label: string;
  icon: ReactNode;
  hot: boolean;
  onPick: (id: Desk) => void;
}) {
  const on = current === id;
  return (
    <button type="button" aria-pressed={on} onClick={() => onPick(id)} className={`relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold ${on ? "bg-cape text-fg" : "text-muted"}`}>
      {icon}
      {label}
      {hot && !on && <span className="size-1.5 rounded-full bg-gold" />}
    </button>
  );
}

function ActionRow({ action, file, onPress }: { action: ActionItem; file?: boolean; onPress: () => void }) {
  const paper = !!file && !action.disabled;
  return (
    <button
      type="button"
      disabled={!!action.disabled}
      onClick={onPress}
      className={
        paper
          ? "min-h-12 rounded-2xl border-y border-r border-line border-l-4 border-l-cape bg-paper px-4 py-3 text-left text-paper-ink disabled:opacity-45"
          : `min-h-12 rounded-2xl border px-4 py-3 text-left disabled:opacity-45 ${action.accent ? "border-gold bg-panel" : "border-line bg-panel"}`
      }
    >
      {paper && <span className="text-xs font-semibold tracking-widest">FILE</span>}
      <span className={`block font-semibold ${paper ? "" : "text-fg"}`}>{action.label}</span>
      <span className={`text-sm ${paper ? "" : "text-muted"}`}>{action.disabled ?? action.detail}</span>
    </button>
  );
}

function PeopleStack({ game, actions, onPress }: { game: Game; actions: ActionItem[]; onPress: (action: ActionItem) => void }) {
  const buckets: { title: string; person?: Person; items: ActionItem[] }[] = [];
  for (const action of actions) {
    const last = buckets[buckets.length - 1];
    if (!last || last.title !== action.section) {
      buckets.push({ title: action.section, person: game.relationships.find((person) => person.name === action.section && person.alive), items: [action] });
    } else last.items.push(action);
  }
  if (!buckets.length) return <p className="mt-3 text-sm text-muted">Nobody in the circle yet.</p>;
  const rank = (person?: Person) => (person?.arch ? 0 : person?.role === "partner" ? 1 : person?.role === "parent" ? 2 : person?.role === "hero" ? 3 : person?.role === "villain" ? 4 : 5);
  buckets.sort((a, b) => rank(a.person) - rank(b.person));
  return (
    <div className="mt-3 flex flex-col gap-3">
      {buckets.map((bucket) => {
        const person = bucket.person;
        const tone = person?.arch || person?.role === "villain" || person?.role === "rival" ? "border-bad" : person?.role === "hero" ? "border-gold" : person?.role === "partner" || person?.role === "parent" ? "border-spark" : "border-line";
        return (
          <article key={bucket.title} className={`rounded-2xl border bg-panel px-3 py-3 ${tone}`}>
            <div className="flex items-center gap-3">
              <Portrait seed={person?.portrait ?? bucket.title.length * 17} age={person?.age ?? 30} sex={person?.sex} className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg">{bucket.title}</p>
                <p className="truncate text-xs text-muted">
                  {person?.arch ? "Arch-enemy" : person?.role ?? "Someone"}
                  {person?.note ? ` · ${person.note}` : ""}
                </p>
                {person && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-2">
                    <div className="h-full rounded-full bg-spark" style={{ width: `${Math.max(0, Math.min(100, person.closeness))}%` }} />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {bucket.items.map((action) => (
                <ActionRow key={action.id} action={action} onPress={() => onPress(action)} />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function group(items: ActionItem[]): { title: string; items: ActionItem[] }[] {
  const sections: { title: string; items: ActionItem[] }[] = [];
  for (const action of items) {
    const last = sections[sections.length - 1];
    if (!last || last.title !== action.section) sections.push({ title: action.section, items: [action] });
    else last.items.push(action);
  }
  return sections;
}

function LookRow({
  title,
  names,
  value,
  swatch,
  onPick,
}: {
  title: string;
  names: readonly string[];
  value: number;
  swatch?: "skin" | "hair";
  onPick: (index: number) => void;
}) {
  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((name, index) => (
          <button
            key={name}
            type="button"
            aria-pressed={value === index}
            aria-label={name}
            onClick={() => onPick(index)}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold ${value === index ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            {swatch && <span className="swatch size-5 rounded-full" data-swatch={`${swatch}-${index}`} />}
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function GiftPicker({
  tier,
  giftId,
  onTier,
  onGift,
}: {
  tier: 0 | 1 | 2 | "none";
  giftId: string;
  onTier: (tier: 0 | 1 | 2 | "none") => void;
  onGift: (id: string) => void;
}) {
  const powers = allPowers();
  const pool = tier === "none" ? [] : powers.filter((power) => power.generation === tier);
  const chosen = powers.find((power) => power.id === giftId);
  const tiers = [
    { id: 0 as const, label: "Basic" },
    { id: 1 as const, label: "Mixed" },
    { id: 2 as const, label: "Apex" },
    { id: "none" as const, label: "None" },
  ];
  return (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-muted">One gift</h2>
      <p className="mt-1 text-sm text-muted">You start with this and nothing else. The next power is learned, not handed to you.</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {tiers.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={tier === item.id}
            onClick={() => {
              onTier(item.id);
              if (item.id === "none") onGift("");
              else if (chosen?.generation !== item.id) {
                const next = powers.find((power) => power.generation === item.id);
                if (next) onGift(next.id);
              }
            }}
            className={`min-h-11 rounded-2xl border text-sm font-semibold ${tier === item.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tier !== "none" && (
        <button
          type="button"
          onClick={() => {
            const next = pool[Math.floor(Math.random() * pool.length)];
            if (next) onGift(next.id);
          }}
          className="mt-2 min-h-11 rounded-2xl border border-line px-4 text-sm font-semibold text-fg"
        >
          Random {tiers.find((item) => item.id === tier)?.label.toLowerCase()} gift
        </button>
      )}
      {tier !== "none" && chosen && (
        <p className="mt-3 text-sm text-fg">
          <span className="font-semibold">{chosen.name}.</span> {chosen.description} You start with this one. The next has to be taught, offered, or braided.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {tier === "none" && <p className="text-sm text-fg">Ordinary. The braid book stays shut.</p>}
        {pool.map((power) => (
          <button
            key={power.id}
            type="button"
            aria-pressed={giftId === power.id}
            onClick={() => onGift(power.id)}
            className={`min-h-11 rounded-2xl border px-3 text-left text-sm font-semibold ${giftId === power.id ? "border-gold bg-panel text-fg" : "border-line bg-panel text-muted"}`}
          >
            {power.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function rollName(sex: Sex): string {
  const pool = sex === "female" ? FEMALE_NAMES : MALE_NAMES;
  const first = pool[Math.floor(Math.random() * pool.length)] ?? "Alex";
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] ?? "Voss";
  return `${first} ${last}`;
}
