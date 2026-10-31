import { ArrowLeft, Check, ChevronRight, Dices, Search, Shuffle } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Figure } from "@/components/game/Figure";
import { Portrait } from "@/components/game/Portrait";
import { CityScene } from "@/components/game/Scene";
import { ElementIcon } from "@/components/game/Vfx";
import { allPowers } from "@/game/combo";
import { starterWardrobe } from "@/game/costume";
import { CITIES, FEMALE_NAMES, LAST_NAMES, MALE_NAMES, UPBRINGINGS } from "@/game/data";
import { elementOfPower, ELEMENTS } from "@/game/elements";
import { money } from "@/game/format";
import { BUILD_NAMES, FEATURE_NAMES, HAIR, HAIR_NAMES, resolveLook, SKIN, SKIN_NAMES, STYLE_NAMES } from "@/game/look";
import { DRIVE_TRAITS, EARNED_TRAITS, FACE_TRAITS } from "@/game/origin";
import { godPicks } from "@/game/engine";
import { SealedOrb } from "@/components/game/Legends";
import { useGame } from "@/game/store";
import type { Look, Sex, TraitId, UpbringingId } from "@/game/types";

/**
 * New-life stepper: Look → Origin → City → Trait → Gift. Every step has a live preview and a
 * "surprise me" roll; the footer always shows who you are so far and the next step.
 */
const STEPS = [
  { id: "look", label: "Look" },
  { id: "origin", label: "Origin" },
  { id: "city", label: "City" },
  { id: "trait", label: "Trait" },
  { id: "gift", label: "Gift" },
] as const;
type Tier = 0 | 1 | 2 | "none";

const pickOne = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)] as T;
const newSeed = () => Math.floor(Math.random() * 1_000_000_000) + 1;

function rollName(sex: Sex): string {
  return `${pickOne(sex === "female" ? FEMALE_NAMES : MALE_NAMES)} ${pickOne(LAST_NAMES)}`;
}

export function CreateScreen() {
  const begin = useGame((s) => s.begin);
  const toTitle = useGame((s) => s.toTitle);
  const existing = useGame((s) => s.game);
  const mode = useGame((s) => s.createMode);
  const stepLabel = (id: (typeof STEPS)[number]["id"], label: string) => (id === "gift" ? (mode === "god" ? "Powers" : "Destiny") : label);
  const [boot] = useState(() => {
    const sex: Sex = Math.random() < 0.5 ? "female" : "male";
    return { sex, name: rollName(sex), seed: newSeed() };
  });
  const [step, setStep] = useState(0);
  const [name, setName] = useState(boot.name);
  const [nameEdited, setNameEdited] = useState(false);
  const [sex, setSex] = useState<Sex>(boot.sex);
  const [portrait, setPortrait] = useState(boot.seed);
  const [look, setLook] = useState<Look>(() => resolveLook(boot.seed));
  const [cityId, setCityId] = useState(CITIES[0]?.id ?? "nyc");
  const [upbringing, setUpbringing] = useState<UpbringingId>("normal");
  const [face, setFace] = useState<TraitId>("secret");
  const [drive, setDrive] = useState<TraitId>("protector");
  const [tier, setTier] = useState<Tier>(0);
  const [giftId, setGiftId] = useState(() => pickOne(allPowers().filter((p) => p.generation === 0)).id);
  const [picks, setPicks] = useState<string[]>(() => [pickOne(allPowers().filter((p) => p.generation === 0)).id]);
  const [extras, setExtras] = useState<TraitId[]>([]);

  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];
  const house = UPBRINGINGS.find((u) => u.id === upbringing) ?? UPBRINGINGS[0];
  const faceT = FACE_TRAITS.find((t) => t.id === face) ?? FACE_TRAITS[0];
  const driveT = DRIVE_TRAITS.find((t) => t.id === drive) ?? DRIVE_TRAITS[0];
  const gift = allPowers().find((p) => p.id === giftId);
  const wardrobe = useMemo(() => starterWardrobe(), []);

  const chooseSex = (next: Sex) => {
    setSex(next);
    if (!nameEdited) setName(rollName(next));
  };
  const rerollLook = () => {
    const seed = newSeed();
    setPortrait(seed);
    setLook(resolveLook(seed));
  };
  /** Rolls only the current step, so a player can keep what they like. */
  const surprise = () => {
    const id = STEPS[step].id;
    if (id === "look") {
      const nextSex: Sex = Math.random() < 0.5 ? "female" : "male";
      setSex(nextSex);
      setName(rollName(nextSex));
      setNameEdited(false);
      rerollLook();
    } else if (id === "origin") setUpbringing(pickOne(UPBRINGINGS).id);
    else if (id === "city") setCityId(pickOne(CITIES).id);
    else if (id === "trait") {
      setFace(pickOne(FACE_TRAITS).id);
      setDrive(pickOne(DRIVE_TRAITS).id);
    } else if (mode === "god") {
      const bases = allPowers().filter((p) => p.generation === 0);
      setPicks(godPicks([pickOne(bases).id, pickOne(bases).id, pickOne(allPowers()).id]));
    } else if (mode === "mystery") {
      // Nothing to roll: that's the point.
    } else {
      const t = pickOne([0, 1, 2] as const);
      setTier(t);
      setGiftId(pickOne(allPowers().filter((p) => p.generation === t)).id);
    }
  };
  const last = step === STEPS.length - 1;
  const start = () => {
    const who = { name: name.trim(), cityId: city?.id ?? "nyc", upbringing, portrait, sex, face, drive, look };
    if (mode === "god") begin({ ...who, mode: "god", giftIds: godPicks(picks), giftId: godPicks(picks)[0] ?? null, extraTraits: extras });
    else begin({ ...who, mode: "mystery", giftId: null });
  };
  const giftSummary = mode === "god" ? (godPicks(picks).map((id) => allPowers().find((p) => p.id === id)?.name ?? id).join(" + ") || "No powers") : "Sealed gift";

  return (
    <main className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => (step === 0 ? toTitle() : setStep(step - 1))} aria-label={step === 0 ? "Back to title" : "Previous step"} className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="t-label text-[10px] text-muted">{mode === "god" ? "GOD MODE" : "MYSTERY LIFE"} · STEP {step + 1} OF {STEPS.length}</p>
            <h1 className="t-display !text-2xl leading-none text-fg">{STEPS[step].id === "gift" ? (mode === "god" ? "Your powers" : "Your destiny") : STEP_TITLE[STEPS[step].id]}</h1>
          </div>
          <button type="button" onClick={surprise} disabled={mode === "mystery" && STEPS[step].id === "gift"} className="btn btn-ghost !min-h-11 gap-1.5 !px-3 text-sm disabled:invisible" aria-label="Surprise me: roll this step">
            <Dices className="size-4.5 text-gold" aria-hidden />
            Roll
          </button>
        </div>
        <nav className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Creation steps">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} className="group flex min-h-9 flex-col items-stretch gap-1 text-center">
              <span className={`h-1.5 rounded-full transition-colors duration-300 ${i < step ? "bg-gold/70" : i === step ? "bg-gold shadow-[0_0_10px_var(--color-gold)]" : "bg-white/12"}`} />
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${i === step ? "text-gold" : "text-muted"}`}>{stepLabel(s.id, s.label)}</span>
            </button>
          ))}
        </nav>
        {existing && step === 0 && <p className="mt-2 text-xs text-gold">Starting over replaces the life you have saved.</p>}
      </header>

      <div key={step} className="anim-fade min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {STEPS[step].id === "look" && (
          <LookStep sex={sex} onSex={chooseSex} name={name} onName={(v) => { setName(v); setNameEdited(true); }} onRollName={() => { setName(rollName(sex)); setNameEdited(false); }} look={look} onLook={setLook} portrait={portrait} onReroll={rerollLook} wardrobe={wardrobe} />
        )}
        {STEPS[step].id === "origin" && <OriginStep value={upbringing} onPick={setUpbringing} />}
        {STEPS[step].id === "city" && <CityStep value={cityId} onPick={setCityId} />}
        {STEPS[step].id === "trait" && <TraitStep face={face} drive={drive} onFace={setFace} onDrive={setDrive} />}
        {STEPS[step].id === "gift" && mode === "mystery" && <DestinyStep upbringing={house?.title ?? ""} face={faceT?.title ?? ""} drive={driveT?.title ?? ""} />}
        {STEPS[step].id === "gift" && mode === "god" && <GodPowersStep picks={picks} onPicks={setPicks} extras={extras} onExtras={setExtras} />}
        {STEPS[step].id === "gift" && mode !== "mystery" && mode !== "god" && <GiftStep tier={tier} giftId={giftId} onTier={setTier} onGift={setGiftId} />}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-ink/90 px-4 pt-2.5 pb-24 backdrop-blur">
        <div className="mb-2 flex items-center gap-3">
          <Portrait seed={portrait} age={16} sex={sex} look={look} className="size-12 shrink-0 overflow-hidden rounded-2xl border border-gold/40" />
          <p className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug text-muted">
            <span className="font-bold text-fg">{name.trim() || "Unnamed"}</span> · {house?.title} · {city?.name} · {faceT?.title} · {driveT?.title} · {mode === "mystery" || mode === "god" ? giftSummary : gift && tier !== "none" ? gift.name : "No gift"}
          </p>
        </div>
        {last ? (
          <button type="button" disabled={!name.trim()} onClick={start} className="btn btn-primary min-h-14 w-full gap-2 text-lg disabled:opacity-40">
            <Check className="size-5" aria-hidden />
            Begin at age 0
          </button>
        ) : (
          <button type="button" disabled={step === 0 && !name.trim()} onClick={() => setStep(step + 1)} className="btn btn-primary min-h-14 w-full gap-1 text-lg disabled:opacity-40">
            Next: {stepLabel(STEPS[step + 1].id, STEPS[step + 1].label)}
            <ChevronRight className="size-5" aria-hidden />
          </button>
        )}
      </footer>
    </main>
  );
}

const STEP_TITLE: Record<(typeof STEPS)[number]["id"], string> = {
  look: "Who you are",
  origin: "Where you grew up",
  city: "Your city",
  trait: "What drives you",
  gift: "Your one gift",
};

const pickedCls = "!border-gold !bg-panel-2 text-fg shadow-[0_0_20px_-8px_var(--color-gold)]";

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-label text-gold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function LookStep(props: {
  sex: Sex;
  onSex: (s: Sex) => void;
  name: string;
  onName: (v: string) => void;
  onRollName: () => void;
  look: Look;
  onLook: (l: Look) => void;
  portrait: number;
  onReroll: () => void;
  wardrobe: ReturnType<typeof starterWardrobe>;
}) {
  const { sex, look, onLook } = props;
  return (
    <>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
        <div className="relative h-64">
          <Figure seed={props.portrait} age={16} sex={sex} look={look} wardrobe={props.wardrobe} className="absolute inset-0 h-full w-full" />
        </div>
        <button type="button" onClick={props.onReroll} className="btn btn-ghost absolute right-2 bottom-2 !min-h-10 gap-1.5 !bg-ink/70 !px-3 text-sm backdrop-blur">
          <Shuffle className="size-4" aria-hidden />
          Reroll look
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["female", "male"] as const).map((option) => (
          <button key={option} type="button" aria-pressed={sex === option} onClick={() => props.onSex(option)} className={`card min-h-12 px-4 font-semibold ${sex === option ? pickedCls : "text-muted"}`}>
            {option === "female" ? "Female" : "Male"}
          </button>
        ))}
      </div>
      <Section title="Name">
        <div className="mt-2 flex gap-2">
          <input
            aria-label="Name"
            value={props.name}
            maxLength={32}
            onChange={(e) => props.onName(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 font-bold text-fg shadow-[inset_0_1px_3px_rgba(0,0,0,.5)] focus:border-gold focus:outline-none"
          />
          <button type="button" onClick={props.onRollName} aria-label="Random name" className="btn btn-ghost min-h-12 !min-w-12 shrink-0 !px-0">
            <Dices className="size-5" aria-hidden />
          </button>
        </div>
      </Section>
      <Swatches title="Skin" names={SKIN_NAMES} colors={SKIN} value={look.skin} onPick={(i) => onLook({ ...look, skin: i })} />
      <Swatches title="Hair colour" names={HAIR_NAMES} colors={HAIR} value={look.hair} onPick={(i) => onLook({ ...look, hair: i })} />
      <Chips title="Cut" names={STYLE_NAMES} value={look.style} onPick={(i) => onLook({ ...look, style: i })} />
      <Chips title="Build" names={BUILD_NAMES} value={look.build} onPick={(i) => onLook({ ...look, build: i })} />
      <Chips title="Face" names={FEATURE_NAMES} value={look.feature} onPick={(i) => onLook({ ...look, feature: i })} />
    </>
  );
}

function Swatches({ title, names, colors, value, onPick }: { title: string; names: readonly string[]; colors: readonly string[]; value: number; onPick: (i: number) => void }) {
  return (
    <Section title={title} aside={<span className="text-xs font-semibold text-fg">{names[value]}</span>}>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-label={names[i]}
            aria-pressed={value === i}
            onClick={() => onPick(i)}
            className={`grid aspect-square min-h-10 place-items-center rounded-full border-2 transition-transform active:scale-90 ${value === i ? "scale-105 border-gold shadow-[0_0_14px_-2px_var(--color-gold)]" : "border-white/15"}`}
            style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c} 70%, white), ${c} 60%)` }}
          >
            {value === i && <Check className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,.8)]" style={{ color: "#fff" }} aria-hidden />}
          </button>
        ))}
      </div>
    </Section>
  );
}

function Chips({ title, names, value, onPick }: { title: string; names: readonly string[]; value: number; onPick: (i: number) => void }) {
  return (
    <Section title={title}>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((n, i) => (
          <button key={n} type="button" aria-pressed={value === i} onClick={() => onPick(i)} className={`card min-h-11 px-3.5 text-sm font-bold ${value === i ? pickedCls : "text-muted"}`}>
            {n}
          </button>
        ))}
      </div>
    </Section>
  );
}

type Fx = { label: string; value: string; good: boolean };
function Effects({ fx }: { fx: Fx[] }) {
  if (!fx.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {fx.map((f) => (
        <span key={f.label} className={`rounded-full px-2 py-px text-[10px] font-extrabold tracking-wide ${f.good ? "bg-emerald-400/12 text-emerald-300" : "bg-rose-400/12 text-rose-300"}`}>
          {f.label} {f.value}
        </span>
      ))}
    </span>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
function statFx(row: Partial<Record<"fame" | "karma" | "smarts" | "happiness" | "health" | "looks" | "reputation", number>>): Fx[] {
  const names = { happiness: "Joy", smarts: "Mind", health: "HP", looks: "Look", fame: "Fame", reputation: "Rep", karma: "Karma" } as const;
  return (Object.keys(names) as (keyof typeof names)[]).filter((k) => row[k]).map((k) => ({ label: names[k], value: signed(row[k] ?? 0), good: (row[k] ?? 0) > 0 }));
}

function OriginStep({ value, onPick }: { value: UpbringingId; onPick: (id: UpbringingId) => void }) {
  return (
    <>
      <p className="text-sm text-muted">{UPBRINGINGS.length} childhoods. It sets your home, your parents, your starting cash, and how they take the news.</p>
      <div className="mt-3 flex flex-col gap-2">
        {UPBRINGINGS.map((u) => {
          const fx: Fx[] = [
            { label: "Cash", value: money(u.money), good: u.money >= 1000 },
            { label: "Family", value: u.closeness >= 60 ? "close" : u.closeness >= 40 ? "distant" : "cold", good: u.closeness >= 60 },
            { label: "Belief", value: `${u.belief}%`, good: u.belief >= 50 },
            ...statFx({ smarts: u.smarts, fame: u.fame, health: u.health, looks: u.looks, karma: u.karma }),
          ];
          return (
            <button key={u.id} type="button" aria-pressed={value === u.id} onClick={() => onPick(u.id)} className={`card px-4 py-3 text-left ${value === u.id ? pickedCls : ""}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-bold text-fg">{u.title}</span>
                <span className="t-label text-[9px] text-muted">{u.parentNote}</span>
              </span>
              <span className="mt-0.5 block text-sm text-muted">{u.detail}</span>
              <Effects fx={fx} />
            </button>
          );
        })}
      </div>
    </>
  );
}

function CityStep({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  const city = CITIES.find((c) => c.id === value) ?? CITIES[0];
  return (
    <>
      <div className="relative h-48 overflow-hidden rounded-[1.5rem] border border-gold/40 shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
        <CityScene key={city?.id} cityId={city?.id ?? "nyc"} bright drift />
        <div className="absolute inset-x-0 bottom-0 z-10 p-4">
          <p className="t-display !text-3xl leading-none text-fg drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">{city?.name}</p>
          <p className="mt-1 text-sm text-fg/85">{city?.flavor}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {CITIES.map((c) => (
          <button key={c.id} type="button" aria-pressed={value === c.id} aria-label={c.name} onClick={() => onPick(c.id)} className={`card relative h-24 overflow-hidden text-left ${value === c.id ? pickedCls : ""}`}>
            <CityScene cityId={c.id} bright />
            <span className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-1.5 px-3 pb-2 text-sm font-bold text-fg drop-shadow-[0_1px_4px_rgba(0,0,0,.9)]">
              {value === c.id && <Check className="size-4 text-gold" aria-hidden />}
              {c.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function TraitStep({ face, drive, onFace, onDrive }: { face: TraitId; drive: TraitId; onFace: (id: TraitId) => void; onDrive: (id: TraitId) => void }) {
  return (
    <>
      <Section title="How the city sees you">
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FACE_TRAITS.map((t) => (
            <button key={t.id} type="button" aria-pressed={face === t.id} onClick={() => onFace(t.id)} className={`card px-3 py-3 text-left ${face === t.id ? pickedCls : ""}`}>
              <span className="block font-bold text-fg">{t.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{t.blurb}</span>
              <Effects fx={statFx(t)} />
            </button>
          ))}
        </div>
      </Section>
      <Section title="What drives you" aside={<span className="text-xs text-muted">{DRIVE_TRAITS.length} drives</span>}>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DRIVE_TRAITS.map((t) => (
            <button key={t.id} type="button" aria-pressed={drive === t.id} onClick={() => onDrive(t.id)} className={`card px-3 py-3 text-left ${drive === t.id ? pickedCls : ""}`}>
              <span className="block text-sm font-bold text-fg">{t.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{t.blurb}</span>
              <Effects fx={statFx(t)} />
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

function GiftStep({ tier, giftId, onTier, onGift }: { tier: Tier; giftId: string; onTier: (t: Tier) => void; onGift: (id: string) => void }) {
  const powers = allPowers();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const pool = tier === "none" ? [] : powers.filter((p) => p.generation === tier && (!q || p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)) || p.description.toLowerCase().includes(q)));
  const chosen = powers.find((p) => p.id === giftId);
  const tiers = [
    { id: 0 as const, label: "Basic" },
    { id: 1 as const, label: "Mixed" },
    { id: 2 as const, label: "Apex" },
    { id: "none" as const, label: "None" },
  ];
  const el = chosen ? elementOfPower(chosen.id) : null;
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {tiers.map((t) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={tier === t.id}
            onClick={() => {
              onTier(t.id);
              if (t.id === "none") onGift("");
              else if (chosen?.generation !== t.id) onGift(powers.find((p) => p.generation === t.id)?.id ?? "");
            }}
            className="seg !min-h-11 justify-center"
          >
            {t.label}
            {t.id !== "none" && <span className="ml-1 text-[10px] opacity-60">{powers.filter((p) => p.generation === t.id).length}</span>}
          </button>
        ))}
      </div>
      {tier === "none" || !chosen ? (
        <div className="card mt-3 px-4 py-4">
          <p className="font-bold text-fg">Ordinary</p>
          <p className="mt-1 text-sm text-muted">No gift. The braid book stays shut, and every win is earned the hard way.</p>
        </div>
      ) : (
        <div className="card mt-3 overflow-hidden px-4 py-3.5" style={{ borderColor: `${ELEMENTS[el!].color}99`, backgroundImage: `linear-gradient(120deg, ${ELEMENTS[el!].color}22, transparent 60%)` } as CSSProperties}>
          <div className="flex items-center gap-3">
            <span className="ico-tile size-12 shrink-0" style={{ "--tile": ELEMENTS[el!].color } as CSSProperties}>
              <ElementIcon element={el ?? undefined} className="size-6" style={{ color: "#fff" }} />
            </span>
            <div className="min-w-0">
              <p className="t-label text-[10px] text-muted">{chosen.tierName} · {ELEMENTS[el!].label}</p>
              <p className="truncate text-lg font-extrabold text-fg">{chosen.name}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-fg/90">{chosen.description}</p>
          <p className="mt-1.5 text-xs text-muted">You start with this one. The next has to be taught, offered, or braided.</p>
        </div>
      )}
      {tier !== "none" && (
        <>
          <label className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 focus-within:border-gold">
            <Search className="size-4 text-muted" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gifts or tags" aria-label="Search gifts" className="min-h-11 w-full bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none" />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {pool.map((p) => {
              const e = elementOfPower(p.id);
              return (
                <button key={p.id} type="button" aria-pressed={giftId === p.id} onClick={() => onGift(p.id)} className={`card flex min-h-12 items-center gap-2 px-2.5 py-2 text-left ${giftId === p.id ? pickedCls : ""}`}>
                  <ElementIcon element={e} className="size-4.5 shrink-0" />
                  <span className="line-clamp-2 text-[13px] leading-tight font-bold text-fg">{p.name}</span>
                </button>
              );
            })}
            {!pool.length && <p className="col-span-2 py-4 text-center text-sm text-muted">No gift matches “{query}”.</p>}
          </div>
        </>
      )}
    </>
  );
}

/** Mystery Life: no pick. The power is sealed, and the childhood you just built shapes the odds. */
function DestinyStep({ upbringing, face, drive }: { upbringing: string; face: string; drive: string }) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <SealedOrb className="size-36" />
      <h2 className="t-display mt-4 !text-[2rem] text-fg">Sealed at birth</h2>
      <p className="mt-2 max-w-[20rem] text-pretty text-sm leading-relaxed text-fg/90">
        Something is folded up inside you. It wakes on a birthday between <b className="text-gold">7 and 15</b>. Until then, live a kid&apos;s life and watch for the signs.
      </p>
      <div className="card mt-4 w-full px-4 py-3 text-left">
        <p className="t-label text-[10px] text-gold">WHAT SHAPES IT</p>
        <ul className="mt-1.5 flex flex-col gap-1 text-sm text-fg/90">
          <li>· Your upbringing ({upbringing}) tilts the odds.</li>
          <li>· So do your traits ({face}, {drive}).</li>
          <li>· About one kid in eight is born with a rare braided gift.</li>
        </ul>
      </div>
      <div className="card mt-2 w-full px-4 py-3 text-left">
        <p className="t-label text-[10px] text-gold">BEFORE IT WAKES</p>
        <ul className="mt-1.5 flex flex-col gap-1 text-sm text-fg/90">
          <li>· <b>Life ▸ Today ▸ Chase the strange feeling</b> finds omens.</li>
          <li>· After two omens, call it in <b>Powers ▸ Call it</b>. Guess right for a bonus.</li>
          <li>· Power drills, mixes and teachers open at the reveal.</li>
        </ul>
      </div>
    </div>
  );
}

/** God Mode builder: up to three powers (one Apex) and two earned traits from day one. */
function GodPowersStep({ picks, onPicks, extras, onExtras }: { picks: string[]; onPicks: (ids: string[]) => void; extras: TraitId[]; onExtras: (ids: TraitId[]) => void }) {
  const powers = allPowers();
  const [tier, setTier] = useState<0 | 1 | 2>(0);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const pool = powers.filter((p) => p.generation === tier && (!q || p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))));
  const apexTaken = picks.some((id) => powers.find((p) => p.id === id)?.generation === 2);
  const toggle = (id: string) => {
    if (picks.includes(id)) return onPicks(picks.filter((x) => x !== id));
    const next = godPicks([...picks, id]);
    if (next.includes(id)) onPicks(next);
  };
  const toggleTrait = (id: TraitId) => onExtras(extras.includes(id) ? extras.filter((x) => x !== id) : extras.length >= 2 ? extras : [...extras, id]);
  return (
    <>
      <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border border-violet-300/40 bg-violet-500/10 p-2.5">
        {picks.length ? (
          picks.map((id) => {
            const p = powers.find((row) => row.id === id);
            const el = elementOfPower(id);
            return (
              <button key={id} type="button" onClick={() => toggle(id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold text-fg" style={{ borderColor: `${ELEMENTS[el].color}aa`, background: `${ELEMENTS[el].color}2a` }} aria-label={`Remove ${p?.name}`}>
                <ElementIcon element={el} className="size-4" />
                {p?.name}
                <span className="text-muted">×</span>
              </button>
            );
          })
        ) : (
          <span className="px-1 text-sm text-muted">Pick up to three powers.</span>
        )}
        <span className="t-num ml-auto pr-1 text-xs text-muted">{picks.length}/3</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {([0, 1, 2] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tier === t} onClick={() => setTier(t)} className="seg !min-h-11 justify-center">
            {t === 0 ? "Basic" : t === 1 ? "Mixed" : "Apex"}
          </button>
        ))}
      </div>
      {tier === 2 && <p className="mt-1.5 text-xs text-muted">{apexTaken ? "One Apex per life. Remove it to swap." : "One Apex per life: the Gen 2 ceiling still holds."}</p>}
      <label className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 focus-within:border-gold">
        <Search className="size-4 text-muted" aria-hidden />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search powers or tags" aria-label="Search powers" className="min-h-11 w-full bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none" />
      </label>
      <div className="mt-2 grid max-h-[34vh] grid-cols-2 gap-2 overflow-y-auto">
        {pool.map((p) => {
          const e = elementOfPower(p.id);
          const on = picks.includes(p.id);
          const blocked = !on && (picks.length >= 3 || (p.generation === 2 && apexTaken));
          return (
            <button key={p.id} type="button" aria-pressed={on} disabled={blocked} onClick={() => toggle(p.id)} className={`card flex min-h-12 items-center gap-2 px-2.5 py-2 text-left disabled:opacity-35 ${on ? pickedCls : ""}`}>
              <ElementIcon element={e} className="size-4.5 shrink-0" />
              <span className="line-clamp-2 text-[13px] leading-tight font-bold text-fg">{p.name}</span>
            </button>
          );
        })}
      </div>
      <Section title="Earned traits from day one" aside={<span className="text-xs text-muted">{extras.length}/2</span>}>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EARNED_TRAITS.map((t) => (
            <button key={t.id} type="button" aria-pressed={extras.includes(t.id)} onClick={() => toggleTrait(t.id)} title={t.blurb} className={`min-h-10 rounded-full border px-3 text-[13px] font-bold ${extras.includes(t.id) ? "border-gold bg-gold/15 text-gold" : "border-white/15 bg-white/[0.04] text-fg/85"}`}>
              {t.title}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
