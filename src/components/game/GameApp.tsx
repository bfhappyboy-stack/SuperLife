import { Banknote, ChevronRight, Heart, FastForward, Home, Lock, Menu, ScrollText, Shield, Shirt, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChapterOverlay, ChapterStrip } from "@/components/game/Chapters";
import { Closet } from "@/components/game/Closet";
import { Figure } from "@/components/game/Figure";
import { actionIcon, FamilyGlyph, FAMILY_COLOR, IconTile, STAT_COLOR, STAT_ICON, TAB_ICON } from "@/components/game/icons";
import { Market } from "@/components/game/Market";
import { CityScene, TitleArt } from "@/components/game/Scene";
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
import type { CSSProperties } from "react";

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
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <TitleArt className="anim-drift pointer-events-none absolute inset-0 size-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/10 to-ink" />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pt-10">
        <p className="anim-rise t-label text-gold drop-shadow">A LIFE IN CAPES</p>
        <h1 className="t-hero anim-pop mt-1 text-fg drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)]">SUPER<span className="text-gold">LIFE</span></h1>
        <p className="anim-rise mt-2 max-w-[17rem] text-pretty text-base font-semibold text-fg/90 drop-shadow">
          Be born. Find your gift. Live every decade — hero, villain, or something in between.
        </p>
        <div className="stagger mt-6 flex gap-3">
          {[
            { seed: 11, age: 17, powerId: "flight" as const, rank: 2, sex: "female" as const },
            { seed: 42, age: 34, powerId: "fire" as const, rank: 4, mood: 80, sex: "male" as const },
            { seed: 77, age: 71, powerId: "intellect" as const, rank: 6, mood: 40, sex: "female" as const },
          ].map((p) => (
            <span key={p.seed} className="avatar-ring">
              <Portrait {...p} className="block h-16 w-16" />
            </span>
          ))}
        </div>
        {scores.length > 0 && (
          <section className="card-glass anim-rise mt-[34vh] mb-4 px-4 py-3">
            <h2 className="t-label text-gold">Best lives</h2>
            <ol className="mt-2 flex flex-col gap-2">
              {scores.slice(0, 5).map((row, index) => (
                <li key={row.at} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                  <span className="t-num w-5 text-sm text-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-fg">{row.name}</span>
                    <span className="block truncate text-xs text-muted">{row.detail}</span>
                  </span>
                  <span className="t-num font-extrabold text-gold">{row.score}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      <div className="relative flex shrink-0 flex-col gap-3 px-5 pt-3 pb-24">
        {hydrated && game && (
          <button type="button" onClick={resume} className="btn btn-gold min-h-14 flex-col !gap-0 text-lg">
            <span>{game.phase === "dead" ? "Read the obituary" : `Continue ${firstName(game.name)}`}</span>
            {game.phase !== "dead" && <span className="text-[11px] font-extrabold tracking-[0.14em] opacity-75">AGE {game.age} · {game.city.toUpperCase()}</span>}
          </button>
        )}
        <button type="button" onClick={openCreate} className={`btn ${hydrated && game ? "btn-ghost" : "btn-primary"} min-h-14 text-lg`}>
          New life
        </button>
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
      <button type="button" onClick={toTitle} className="btn btn-ghost !min-h-10 self-start !px-3 text-sm">
        Back
      </button>
      <h1 className="t-hero anim-pop mt-2 !text-5xl text-fg">NEW <span className="text-gold">LIFE</span></h1>
      <p className="mt-2 text-sm text-muted">A face, a suit, and one gift. Everything after that has to be learned.</p>
      {existing && <p className="mt-3 text-sm text-gold">Starting over replaces the life you have saved.</p>}
      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
        <div className="relative h-80">
          <Figure seed={portrait} age={16} sex={sex} look={look} wardrobe={starterWardrobe()} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <h2 className="t-label mt-5 text-gold">You</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["female", "male"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={sex === option}
            onClick={() => chooseSex(option)}
            className={`card min-h-12 px-4 py-2.5 text-left font-semibold ${sex === option ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
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
          className="btn btn-ghost min-h-12 flex-1"
        >
          Reroll look
        </button>
      </div>
      <LookRow title="Skin" names={SKIN_NAMES} value={look.skin} swatch="skin" onPick={(index) => setLook({ ...look, skin: index })} />
      <LookRow title="Hair" names={HAIR_NAMES} value={look.hair} swatch="hair" onPick={(index) => setLook({ ...look, hair: index })} />
      <LookRow title="Cut" names={STYLE_NAMES} value={look.style} onPick={(index) => setLook({ ...look, style: index })} />
      <LookRow title="Build" names={BUILD_NAMES} value={look.build} onPick={(index) => setLook({ ...look, build: index })} />
      <LookRow title="Face" names={FEATURE_NAMES} value={look.feature} onPick={(index) => setLook({ ...look, feature: index })} />
      <label className="t-label mt-6 text-gold" htmlFor="hero-name">
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
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 font-bold text-fg shadow-[inset_0_1px_3px_rgba(0,0,0,.5)] focus:border-gold focus:outline-none"
        />
        <button type="button" onClick={() => { setName(rollName(sex)); setNameEdited(false); }} className="btn btn-ghost min-h-12 shrink-0">
          Random
        </button>
      </div>
      <h2 className="t-label mt-6 text-gold">City</h2>
      <div className="mt-2 flex flex-col gap-2">
        {CITIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={cityId === item.id}
            onClick={() => setCityId(item.id)}
            className={`card min-h-12 px-4 py-2.5 text-left ${cityId === item.id ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.name}</span>
            <span className="text-sm">{item.flavor}</span>
          </button>
        ))}
      </div>
      <h2 className="t-label mt-6 text-gold">Childhood</h2>
      <div className="mt-2 flex flex-col gap-2">
        {UPBRINGINGS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={upbringing === item.id}
            onClick={() => setUpbringing(item.id)}
            className={`card min-h-12 px-4 py-3 text-left ${upbringing === item.id ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.detail}</span>
          </button>
        ))}
      </div>
      <h2 className="t-label mt-6 text-gold">How the city sees you</h2>
      <div className="mt-2 flex flex-col gap-2">
        {FACE_TRAITS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={face === item.id}
            onClick={() => setFace(item.id)}
            className={`card min-h-12 px-4 py-3 text-left ${face === item.id ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.blurb}</span>
          </button>
        ))}
      </div>
      <h2 className="t-label mt-6 text-gold">What drives you</h2>
      <div className="mt-2 flex flex-col gap-2">
        {DRIVE_TRAITS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={drive === item.id}
            onClick={() => setDrive(item.id)}
            className={`card min-h-12 px-4 py-3 text-left ${drive === item.id ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
          >
            <span className="block font-semibold text-fg">{item.title}</span>
            <span className="text-sm">{item.blurb}</span>
          </button>
        ))}
      </div>
      <GiftPicker tier={tier} giftId={giftId} onTier={setTier} onGift={setGiftId} />
      </div>
      <div className="shrink-0 border-t border-white/10 bg-ink/85 px-5 pt-3 pb-24 backdrop-blur">
        <p className="mb-2 text-sm text-muted">
          {house?.title} in {city?.name}. {faceTrait?.title}. {driveTrait?.title}. {giftId ? (allPowers().find((power) => power.id === giftId)?.name ?? "One gift") : "No gift"}.
        </p>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => begin({ name: name.trim(), cityId: city?.id ?? "nyc", upbringing, portrait, sex, face, drive, look, giftId: giftId || null })}
          className="btn btn-primary min-h-14 w-full text-lg disabled:opacity-40"
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
  const skipYear = useGame((s) => s.skipYear);
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
  const elsewhere = game.majorsLeft > 0 ? DESKS.filter((item) => item.id !== desk && placed.some((row) => row.desk === item.id && !row.action.disabled)) : [];
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

  const chapterNo = game.chapters?.length ?? 1;
  const phase = game.chapters?.[game.chapters.length - 1]?.phase ?? null;
  const family = capeTheme(game).cape;
  const showTabs = !choosing && game.phase !== "mini";
  const pickDesk = (id: Desk) => {
    setDesk(id);
    setShelf(null);
    setAck(`${DESKS.find((item) => item.id === id)?.label ?? id} — pressed.`);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <CityScene cityId={game.cityId} phase={phase} />
      <header className="hud relative z-10 shrink-0">
        {game.phase === "mini" ? (
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <p className="font-display text-xl tracking-wide text-fg">SUPERLIFE</p>
            <p className="truncate text-sm font-semibold text-muted">{game.name} · {game.age}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Open the closet" onClick={() => setCloset(true)} className="avatar-ring shrink-0">
                <Portrait seed={game.portrait} age={game.age} powerId={game.powerId} rank={game.leagueRank} mood={game.stats.happiness} sex={game.sex} look={game.look} className="block h-12 w-12" />
                {game.leagueRank > 0 && <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-black text-paper-ink shadow">{game.leagueRank}</span>}
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] leading-tight font-extrabold text-fg">{game.name}</h1>
                <p className="truncate text-xs font-semibold text-muted">
                  Age {game.age} · {MONTHS[game.month ?? 0]} · <span className="text-gold">Ch {chapterNo}</span> · {game.city}
                </p>
              </div>
              <span className="chip shrink-0 text-fg" aria-label={`Money ${money(game.stats.money)}`}>
                <Banknote className="size-3.5" style={{ color: STAT_COLOR.money }} />
                <span className="t-num">{money(game.stats.money)}</span>
              </span>
              <button type="button" aria-label="Menu" onClick={() => setSheet("menu")} className="btn btn-ghost !min-h-11 !w-11 !p-0">
                <Menu className="size-5" />
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              <Bar label="HP" stat="health" value={game.stats.health} />
              <Bar label="Joy" stat="happiness" value={game.stats.happiness} />
              <Bar label="Mind" stat="smarts" value={game.stats.smarts} />
              <Bar label="Look" stat="looks" value={game.stats.looks} />
            </div>
            <div className="-mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
              <span className="chip shrink-0 text-fg">
                <FamilyGlyph family={family} className="size-3.5" style={{ color: family ? FAMILY_COLOR[family] : undefined }} />
                {fusion ? fusion : power ? power.name : game.powerless ? "Unpowered" : "No power yet"}
                {power ? <span className="t-num text-gold">{` ${tierLabel(game.stats.powerLevel)} ${game.stats.powerLevel.toFixed(1)}`}</span> : null}
              </span>
              <span className="chip shrink-0 text-fg"><Star className="size-3.5" style={{ color: STAT_COLOR.fame }} /><span className="t-num">{Math.round(game.stats.fame)}</span> Fame</span>
              <span className="chip shrink-0 text-fg"><Shield className="size-3.5" style={{ color: STAT_COLOR.reputation }} />{RANKS[game.leagueRank]}</span>
              <span className="chip shrink-0 text-fg">{karmaLabel(game.stats.karma ?? 0)}</span>
            </div>
          </>
        )}
      </header>

      {game.phase === "mini" && game.minigame ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <Minigame key={`${game.minigame.title}-${game.age}-${game.missions}`} spec={game.minigame} onDone={finishMini} hero={{ seed: game.portrait, age: game.age, sex: game.sex, look: game.look, wardrobe: game.wardrobe, aura: (() => { const family = capeTheme(game).cape; return family ? FAMILY_COLOR[family] : undefined; })() }} />
        </div>
      ) : (
        <>
          {!choosing && shelves.length > 1 && (
            <div className="relative z-10 flex shrink-0 gap-2 overflow-x-auto px-4 pt-2.5 pb-0.5 [scrollbar-width:none]" role="tablist" aria-label={DESK_LINE[desk]}>
              {shelves.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={name === activeShelf}
                  onClick={() => {
                    setShelf(name);
                    setAck(`${name} — pressed.`);
                  }}
                  className="seg"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div ref={scroller} data-desk={desk} className="desk relative z-10 min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
            <article key={`${game.card.kicker}-${game.card.body.length}`} className="card-paper anim-rise relative overflow-hidden px-4 py-3.5">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-gold to-cape" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-label opacity-60">{game.city}</p>
                  <p className="t-title mt-0.5">{game.card.kicker}</p>
                </div>
                {!choosing && (
                  <button type="button" onClick={() => setFolded((open) => !open)} className="min-h-11 shrink-0 rounded-xl bg-black/5 px-3 text-xs font-extrabold tracking-wide uppercase">
                    {folded ? "Read" : "Fold"}
                  </button>
                )}
              </div>
              {game.card.banner.map((line) => (
                <p key={line} className="mt-2 text-sm font-bold">
                  {line}
                </p>
              ))}
              <p className={`mt-2 text-pretty whitespace-pre-wrap text-[15px] leading-relaxed ${choosing || !folded ? "" : desk === "life" ? "line-clamp-2" : "hidden"}`}>{game.card.body}</p>
              {(choosing || !folded || desk === "life") && game.card.deltas.length > 0 && (
                <div className="stagger mt-3 flex flex-wrap gap-1.5">
                  {game.card.deltas.map((delta, index) => (
                    <DeltaChip key={`${delta.stat}-${index}`} delta={delta} />
                  ))}
                </div>
              )}
            </article>
            {!choosing && desk === "life" && <ChapterStrip game={game} />}
            {!choosing && <p className="desk-accent t-label mt-4">{DESK_LINE[desk]}</p>}
            {!choosing && desk === "work" && activeShelf !== "Market" && (
              <p className="mt-2 text-sm text-muted">
                {school ? school.name : "No hero school"}
                {" · "}
                {job ? `${job.name} (${JOB_TITLES[game.jobRank]})` : "No job"}
                {" · "}
                {team ? team.name : "No team"}
              </p>
            )}
            {!choosing && desk === "work" && activeShelf === "Market" && <Market game={game} onAct={act} />}
            {!choosing && desk === "people" && activeShelf === "Crew" && game.crew && (
              <p className="mt-2 text-sm text-muted">
                {game.crew.name}
                {game.crew.motto ? ` — ${game.crew.motto}` : ""}
                {` · heat ${game.crew.heat ?? 0} · loyalty ${game.crew.loyalty ?? 50}`}
                {game.crew.members.length ? ` · ${game.crew.members.map((member) => member.alias).join(", ")}` : " · just you, so far."}
              </p>
            )}
            {!choosing && desk === "gift" && activeShelf === "Book" && (power || fusion) && (
              <section className="card mt-3 overflow-hidden px-4 py-4">
                <div className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full opacity-50 blur-2xl" style={{ background: `radial-gradient(circle, ${family ? FAMILY_COLOR[family] : "var(--color-gold)"}, transparent 70%)` }} />
                <div className="flex items-center gap-3">
                  <IconTile color={family ? FAMILY_COLOR[family] : "#e6b34d"} size="size-12">
                    <FamilyGlyph family={family} className="size-7" />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="t-label text-muted">Your gift</p>
                    <p className="t-display text-gold">{fusion ?? power?.name}</p>
                  </div>
                </div>
                {power && <p className="mt-2 text-sm text-muted">{power.tagline}</p>}
                {power && <p className="mt-2 text-sm text-fg">{power.strength}</p>}
                {power && <p className="mt-1 text-sm text-muted">Weakness: {power.weakness}</p>}
                {second && <p className="mt-2 text-sm text-gold">Braided with {second.name}. {second.tagline}</p>}
                {ownedTricks.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {ownedTricks.slice(0, 4).map((trick) => (
                      <li key={trick.name} className="flex gap-2 text-sm text-fg">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
                        <span>
                          <span className="font-bold text-gold">{trick.name}</span>
                          <span className="text-muted"> · {trick.blurb}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {!choosing && desk === "cases" && activeShelf === "Files" && <div className="mt-3"><CaseFile game={game} /></div>}
            {!choosing && desk === "cases" && activeShelf === "Board" && <div className="mt-3"><Roster game={game} /></div>}
            {!choosing && desk === "people" && activeShelf === "Circle" && (
              <PeopleStack game={game} actions={visible} onPress={(action) => { setAck(`${action.label} — pressed.`); act(action.id); }} />
            )}
            {!choosing && !(desk === "cases" && activeShelf === "Board") && !(desk === "work" && activeShelf === "Market") && !(desk === "people" && activeShelf === "Circle") && (
              <div className="mt-3 flex flex-col gap-4">
                {sections.map((section) => (
                  <section key={section.title}>
                    {sections.length > 1 && <h2 className="t-label text-muted">{section.title}</h2>}
                    <div className={`stagger flex flex-col gap-2 ${sections.length > 1 ? "mt-2" : ""}`}>
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
                {sections.length === 0 && !(desk === "gift" && (activeShelf === "Book" || activeShelf === "Teachers" || activeShelf === "Moves")) && !(desk === "cases" && activeShelf === "Files") && (
                  <div className="card px-4 py-4">
                    <p className="text-sm text-muted">{game.majorsLeft <= 0 && game.phase === "live" ? "Out of moves this month. Tap Next month, or skip ahead to your next birthday." : EMPTY[desk]}</p>
                    {elsewhere.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <p className="t-label w-full text-fg">Things you can do right now</p>
                        {elsewhere.map((item) => (
                          <button key={item.id} type="button" onClick={() => pickDesk(item.id)} className="btn btn-ghost !min-h-11 text-sm">
                            {item.label} →
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {game.phase === "live" && (
            <div className="relative z-10 shrink-0 px-4 pt-2 pb-2">
              <p role="status" className="sr-only">
                {ack}
              </p>
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAck(game.month === 11 ? "New year — pressed." : "Next month — pressed.");
                    age();
                  }}
                  className="btn btn-primary min-h-14 flex-1 flex-col !gap-0 text-lg"
                >
                  <span>{game.month === 11 ? `New year · age ${game.age + 1}` : "Next month"}</span>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-[0.14em] opacity-85" aria-label={game.majorsLeft > 0 ? `${game.majorsLeft} moves left` : "Out of moves"}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={`inline-block size-1.5 rounded-full ${i < game.majorsLeft ? "bg-white" : "bg-white/25"}`} />
                    ))}
                    <span className="ml-1">{game.majorsLeft > 0 ? `${game.majorsLeft} MOVE${game.majorsLeft === 1 ? "" : "S"} LEFT` : "OUT OF MOVES"}</span>
                  </span>
                </button>
                {game.month !== 11 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAck(`Skip to age ${game.age + 1} — pressed.`);
                      skipYear();
                    }}
                    aria-label={`Skip ahead to age ${game.age + 1}. Stops if something needs you.`}
                    className="btn btn-ghost min-h-14 w-[5.5rem] flex-col !gap-0 !px-2 text-sm"
                  >
                    <FastForward className="size-4" />
                    <span>To {game.age + 1}</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {game.phase === "choice" && game.pending && (
            <div className="stagger relative z-10 flex shrink-0 flex-col gap-2 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <p role="status" className="sr-only">
                {ack}
              </p>
              <p className="t-label text-center text-gold">Your call</p>
              {game.pending.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => {
                    setAck(`${choice.label} — pressed.`);
                    pick(choice.id);
                  }}
                  className={`btn ${index === 0 ? "btn-primary" : "btn-ghost"} !justify-start text-left text-base`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
          {showTabs && (
            <nav aria-label="Desks" className="tabbar relative z-20 shrink-0">
              {DESKS.map((item) => {
                const Icon = TAB_ICON[item.id];
                const on = item.id === desk;
                const hot = placed.some((row) => row.desk === item.id && row.action.accent && !row.action.disabled);
                return (
                  <button key={item.id} type="button" className="tab" aria-current={on ? "page" : undefined} aria-label={item.label} onClick={() => pickDesk(item.id)}>
                    <span className="tab-ico">
                      <Icon className="size-[1.15rem]" strokeWidth={on ? 2.5 : 2} />
                    </span>
                    {item.label}
                    {hot && !on && <span className="tab-dot" />}
                  </button>
                );
              })}
            </nav>
          )}
        </>
      )}

      {closet && <Closet game={game} onAct={act} onClose={() => setCloset(false)} />}
      {chat && <HeroChat game={game} heroId={chat} onClose={() => setChat(null)} onAct={act} />}
      <ChapterOverlay game={game} />
      {sheet && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && setSheet(null)}>
          <div className="card-glass anim-rise max-h-[78%] w-full max-w-[28rem] overflow-y-auto px-4 py-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h2 className="t-display text-fg">{sheet === "log" ? "LIFE LOG" : "MENU"}</h2>
              <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="btn btn-ghost !min-h-11 !w-11 !p-0">
                <X className="size-5" />
              </button>
            </div>
            {sheet === "menu" ? (
              <div className="stagger mt-4 flex flex-col gap-2">
                <button type="button" onClick={() => { setSheet(null); setCloset(true); }} className="btn btn-ghost !justify-start">
                  <Shirt className="size-5 text-gold" /> Open the closet
                </button>
                <button type="button" onClick={() => setSheet("log")} className="btn btn-ghost !justify-start">
                  <ScrollText className="size-5 text-gold" /> Read the life log
                </button>
                <button type="button" onClick={toTitle} className="btn btn-ghost !justify-start">
                  <Home className="size-5 text-gold" /> Main menu
                </button>
                <p className="mt-1 text-center text-xs text-muted">This life saves itself on this device.</p>
              </div>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {[...game.history].reverse().slice(0, 40).map((entry, index) => (
                  <li key={`${entry.age}-${index}`} className="border-b border-white/10 pb-2">
                    <span className="t-label text-gold">
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
    <main className="relative flex h-full min-h-0 flex-col overflow-y-auto pb-24">
      <CityScene cityId={game.cityId} phase="final" />
      <div className="relative px-4 pt-6">
        <article className="card-paper anim-rise overflow-hidden px-4 pt-4 pb-5">
          <div className="flex items-center justify-between border-b-2 border-paper-ink/80 pb-1.5">
            <p className="t-label text-[10px]">{game.city} Herald</p>
            <p className="t-label text-[10px] opacity-60">Obituaries</p>
          </div>
          <h1 className="t-hero mt-3 !text-[2.6rem] !leading-[0.95]">{death.cause.toUpperCase()}</h1>
          <div className="mt-3 flex items-center gap-3 border-y border-paper-ink/20 py-3">
            <span className="shrink-0 rounded-2xl bg-paper-ink/90 p-0.5 grayscale-[35%]">
              <Portrait seed={game.portrait} age={game.age} powerId={game.powerId} rank={game.leagueRank} mood={30} sex={game.sex} className="block h-16 w-16" />
            </span>
            <p className="text-sm">
              <span className="block text-base font-extrabold">{game.name}</span>
              Age {game.age} · {karmaLabel(game.stats.karma ?? 0)}
              <span className="block opacity-70">{tone}</span>
            </p>
          </div>
          <p className="mt-3 text-pretty whitespace-pre-wrap leading-relaxed first-letter:float-left first-letter:mr-1.5 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85]">{death.story}</p>
          <p className="mt-3 text-sm italic opacity-80">
            Survived by {survived.length ? survived.map((person) => person.name).slice(0, 6).join(", ") : "the group chat"}.
          </p>
        </article>
        <section className="card-glass anim-rise mt-4 px-4 py-4" style={{ animationDelay: "160ms" }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="t-label text-muted">Life score</p>
              <p className="anim-pop t-num font-display text-6xl leading-none text-gold drop-shadow-[0_0_18px_var(--color-gold)]">{death.score}</p>
            </div>
            <Star className="mb-2 size-9 text-gold" fill="currentColor" />
          </div>
          <ul className="stagger mt-3 flex flex-col gap-1.5">
            {death.rows.map((row) => (
              <li key={row.label} className="flex justify-between border-b border-white/5 pb-1.5 text-sm last:border-0">
                <span className="text-muted">{row.label}</span>
                <span className="t-num text-fg">{row.points}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-5 flex flex-col gap-2">
          {kid && (
            <button type="button" onClick={playHeir} className="btn btn-gold min-h-14 flex-col !gap-0 text-lg">
              <span>Continue as {firstName(kid.name)}</span>
              <span className="text-[11px] font-extrabold tracking-[0.14em] opacity-75">THE LEGACY CARRIES ON</span>
            </button>
          )}
          <button type="button" onClick={openCreate} className={`btn ${kid ? "btn-ghost" : "btn-primary"} min-h-14 text-lg`}>
            New life
          </button>
          <button type="button" onClick={toTitle} className="btn btn-ghost !min-h-11 !border-transparent !bg-transparent !shadow-none text-muted">
            Main menu
          </button>
        </div>
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
        const sideColor = you ? "#e6b34d" : cape.side === "villain" ? "#ff5a4f" : cape.side === "hero" ? "#5fe08f" : "#9aa3b8";
        return (
          <article key={cape.id} className="card relative overflow-hidden px-3 py-3" style={{ borderColor: `${sideColor}aa` }}>
            <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full opacity-40 blur-xl" style={{ background: sideColor }} />
            <div className="flex items-start justify-between">
              <Portrait seed={cape.portrait} age={you ? game.age : 28} powerId={cape.powerId} rank={you ? game.leagueRank : 0} sex={you ? game.sex : cape.sex} className="h-12 w-12" />
              <span className="t-label rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: `${sideColor}33`, color: sideColor }}>{cape.side === "villain" ? "Villain" : cape.side === "hero" ? "Hero" : "Rogue"}</span>
            </div>
            <p className="mt-2 truncate font-bold text-fg">
              {cape.alias}
              {you ? " · you" : ""}
            </p>
            <p className="truncate text-xs text-muted">{gift?.name ?? "Unknown"}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="t-label text-[9px] text-muted">Heat</span>
              <div className="stat-bar flex-1"><div className="stat-fill" style={{ width: `${Math.min(100, cape.heat)}%`, "--fill": sideColor } as CSSProperties} /></div>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{cape.note}</p>
          </article>
        );
      })}
    </div>
  );
}

function Bar({ label, stat, value }: { label: string; stat: string; value: number }) {
  const Icon = STAT_ICON[stat];
  const color = STAT_COLOR[stat] ?? "var(--color-gold)";
  const prev = useRef(value);
  const [pulse, setPulse] = useState<{ key: number; delta: number } | null>(null);
  useEffect(() => {
    const delta = Math.round(value - prev.current);
    prev.current = value;
    if (delta) setPulse({ key: Date.now(), delta });
  }, [value]);
  const low = value < 25;
  return (
    <div className="relative min-w-0" aria-label={`${label} ${Math.round(value)}`}>
      <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-muted">
          {Icon && <Icon className={`size-3 ${low ? "animate-pulse" : ""}`} style={{ color }} />}
          {label}
        </span>
        <span className={`t-num ${low ? "text-bad" : "text-fg"}`}>{Math.round(value)}</span>
      </div>
      <div className="stat-bar mt-1">
        <div className="stat-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, "--fill": color } as CSSProperties} />
      </div>
      {pulse && (
        <span key={pulse.key} className={`anim-float-up pointer-events-none absolute -top-1 right-0 text-xs font-black ${pulse.delta > 0 ? "text-good" : "text-bad"}`}>
          {pulse.delta > 0 ? `+${pulse.delta}` : pulse.delta}
        </span>
      )}
    </div>
  );
}

function DeltaChip({ delta }: { delta: Delta }) {
  const positive = delta.amount > 0;
  const digits = delta.stat === "Power" ? 1 : 0;
  const amount = digits ? Number(delta.amount.toFixed(1)) : Math.round(delta.amount);
  if (!amount) return null;
  const shown = delta.stat === "Money" ? `${amount > 0 ? "+" : "−"}${money(Math.abs(amount)).replace("-", "")}` : `${amount > 0 ? "+" : ""}${amount} ${delta.stat}`;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${positive ? "bg-good/25 text-[#0d4d33]" : "bg-bad/20 text-[#7a1d17]"}`}>{shown}</span>;
}

type Desk = "life" | "gift" | "cases" | "people" | "work";

/** Five primary tabs. The old Board tab lives under Cases; the Market lives under Work. */
const DESKS: { id: Desk; label: string }[] = [
  { id: "life", label: "Life" },
  { id: "gift", label: "Powers" },
  { id: "cases", label: "Cases" },
  { id: "people", label: "People" },
  { id: "work", label: "Work" },
];

const ALWAYS_SHELF: Partial<Record<Desk, string[]>> = {
  gift: ["Book", "Moves", "Teachers"],
  cases: ["Files", "Board"],
  people: ["Circle"],
  work: ["Market"],
};

const SHELF_ORDER: Record<Desk, string[]> = {
  life: ["Today", "City", "Become", "Shadow"],
  gift: ["Book", "Moves", "Drill", "Fight", "Teachers"],
  cases: ["Files", "League", "Street", "Board"],
  people: ["Circle", "Meet", "Family", "Crew"],
  work: ["Market", "School", "Job"],
};

const DESK_LINE: Record<Desk, string> = {
  life: "The block, the month, and the private choices.",
  gift: "The book, the six moves, the drill, the teachers.",
  cases: "Open files, League calls, the street, and who is loose.",
  people: "The names that know yours.",
  work: "The market, a seat in class, or a paycheck.",
};

const EMPTY: Record<Desk, string> = {
  life: "Nothing in reach on this shelf.",
  gift: "Nothing on this shelf yet.",
  cases: "This desk is between calls.",
  people: "Nobody in this room yet.",
  work: "No seat and no shift on this shelf.",
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

const GROUP_COLOR: Record<ActionItem["group"], string> = {
  life: "#ffb35c",
  power: "#a59bff",
  career: "#5fe08f",
  people: "#3fe0c5",
};

function ActionRow({ action, file, onPress }: { action: ActionItem; file?: boolean; onPress: () => void }) {
  const paper = !!file && !action.disabled;
  const Icon = actionIcon(action.id, action.section);
  if (paper) {
    return (
      <button type="button" onClick={onPress} className="card-paper relative min-h-14 overflow-hidden px-4 py-3 pl-5 text-left">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-cape" />
        <span className="t-label opacity-60">Case file</span>
        <span className="block font-extrabold">{action.label}</span>
        <span className="text-sm opacity-80">{action.detail}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={!!action.disabled}
      onClick={onPress}
      className={`card group flex min-h-14 items-center gap-3 px-3 py-2.5 text-left disabled:opacity-50 ${action.accent && !action.disabled ? "!border-gold/70 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-gold)_30%,transparent),0_8px_24px_-12px_var(--color-gold)]" : ""}`}
    >
      <IconTile color={action.disabled ? "#4b5366" : GROUP_COLOR[action.group]} size="size-10">
        {action.disabled ? <Lock className="size-4" /> : <Icon className="size-5" />}
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-bold text-fg">
          {action.label}
          {action.accent && !action.disabled && <span className="rounded-full bg-gold px-1.5 py-px text-[9px] font-black tracking-wider text-paper-ink">NEW</span>}
        </span>
        <span className="line-clamp-2 text-[13px] leading-snug text-muted">{action.disabled ?? action.detail}</span>
      </span>
      {!action.disabled && <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-active:translate-x-0.5" />}
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
        const tone = person?.arch || person?.role === "villain" || person?.role === "rival" ? "#ff5a4f" : person?.role === "hero" ? "#e6b34d" : person?.role === "partner" || person?.role === "parent" ? "#3fe0c5" : "#7d879c";
        return (
          <article key={bucket.title} className="card-glass relative overflow-hidden px-3 py-3" style={{ borderColor: `${tone}88` }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-25" style={{ background: `linear-gradient(180deg, ${tone}, transparent)` }} />
            <div className="relative flex items-center gap-3">
              <span className="avatar-ring shrink-0" style={{ "--ring": tone } as CSSProperties}>
                <Portrait seed={person?.portrait ?? bucket.title.length * 17} age={person?.age ?? 30} sex={person?.sex} className="block h-12 w-12" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-fg">{bucket.title}</p>
                <p className="truncate text-xs text-muted">
                  {person?.arch ? "Arch-enemy" : person?.role ?? "Someone"}
                  {person?.note ? ` · ${person.note}` : ""}
                </p>
                {person && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Heart className="size-3 shrink-0" style={{ color: tone }} fill="currentColor" />
                    <div className="stat-bar flex-1">
                      <div className="stat-fill" style={{ width: `${Math.max(0, Math.min(100, person.closeness))}%`, "--fill": tone } as CSSProperties} />
                    </div>
                    <span className="t-num text-[11px] text-muted">{Math.round(person.closeness)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="relative mt-3 flex flex-col gap-2">
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
            className={`card flex min-h-11 items-center gap-2 px-3 text-sm font-bold ${value === index ? "!border-gold !bg-panel-2 text-fg" : "text-muted"}`}
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
            aria-selected={tier === item.id}
            className="seg !min-h-11 justify-center"
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
            className={`card min-h-11 px-3 py-2 text-left text-sm font-bold ${giftId === power.id ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]" : "text-muted"}`}
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
