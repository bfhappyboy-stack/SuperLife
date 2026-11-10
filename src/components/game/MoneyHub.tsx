/**
 * Money & Life hub (Work ▸ Money): net worth, the monthly summary, a live news ticker, and three tabs:
 * Home (where you live, what you own, find a place), Markets (stocks, goods, district prices, rates) and
 * Business (found, staff, upgrade, sell; a legend's family company; ECON_FLAGS.business). Every number comes from src/game/economy.ts; every action is "econ|…".
 */
import {
  ArrowDownRight, ArrowUpRight, Atom, Plus, Shield, Truck, Users, Rocket, Briefcase, BedDouble, Building2, Castle, Check, ChevronDown, Coffee, Coins, Cpu, Crown, Dumbbell, EyeOff, Factory, Fuel, Gem,
  Hammer, HeartPulse, Home, KeyRound, Landmark, LineChart, Lock, Minus, Newspaper, Percent, Smile, Sofa, Store, TrendingUp, Wallet, Warehouse, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { buzz } from "@/components/game/haptics";
import { IconTile } from "@/components/game/icons";
import {
  annualWage, districtOf, districtsOf, districtViews, ECON_FLAGS, econOf, fmt, fmtPrice, goodById, goodViews, HOME_MODS, homeById, homePrice, HOMES,
  homeGate, homeUpkeep, homeValue, HOUSING_AGE, letIncome, livingOf, marketCity, marketRent, maxBuy, MIN_DEPOSIT, netWorth, portfolioValue, quoteHome,
  quoteRent, quoteTrade, SELL_FEE, stockById, stockViews, TRADE_AGE, type EconState, type News, type OwnedHome, type SeriesView,
  BIZ, bizBooks, bizById, bizNeed, bizValue, quoteBiz, BIZ_RAMP, CITY_PROP, type Biz,
  mateCandidates, matesHere, mateShare, mateShareIfJoined, roomsHere, TIE_IN_REP,
  AWAY_MUL, MGR_TRAIT, mgrById, mgrCandidates, mgrWage, moraleTarget, moraleWord, MORALE_START,
} from "@/game/economy";
import { cityById } from "@/game/data";
import type { Game } from "@/game/types";

const UP = "#5fe08f";
const DOWN = "#ff5d6c";
const pct = (x: number, digits = 1) => `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(digits)}%`;

// ---------------------------------------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------------------------------------

function path(data: number[], w: number, h: number, pad = 2) {
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || Math.abs(hi) * 0.05 || 1;
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => [pad + i * step, pad + (h - pad * 2) * (1 - (v - lo) / span)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return { line, area: `${line}L${pts.at(-1)?.[0] ?? w},${h}L${pts[0]?.[0] ?? 0},${h}Z`, last: pts.at(-1) ?? [w, h / 2], lo, hi };
}

let gradId = 0;

/** A tiny trend line. Green when the series ends above where it started. */
export function Spark({ data, w = 72, h = 28, tone }: { data: number[]; w?: number; h?: number; tone?: "up" | "down" }) {
  const id = useMemo(() => `spk${(gradId += 1)}`, []);
  if (data.length < 2) return <svg width={w} height={h} aria-hidden />;
  const p = path(data, w, h);
  const color = (tone ?? ((data.at(-1) ?? 0) >= (data[0] ?? 0) ? "up" : "down")) === "up" ? UP : DOWN;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={p.area} fill={`url(#${id})`} />
      <path d={p.line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={p.last[0]} cy={p.last[1]} r="2.4" fill={color} />
    </svg>
  );
}

/** The big chart in an expanded market row: two years, high and low marked. */
function Chart({ data, format }: { data: number[]; format: (n: number) => string }) {
  const id = useMemo(() => `chr${(gradId += 1)}`, []);
  const w = 320;
  const h = 96;
  if (data.length < 2) return null;
  const p = path(data, w, h, 4);
  const color = (data.at(-1) ?? 0) >= (data[0] ?? 0) ? UP : DOWN;
  return (
    <div className="relative mt-2 rounded-xl bg-black/30 px-2 pt-2 pb-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-24 w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((y) => (
          <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} stroke="white" strokeOpacity="0.06" />
        ))}
        <path d={p.area} fill={`url(#${id})`} />
        <path d={p.line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] font-bold text-muted">
        <span>2 yrs ago</span>
        <span>
          Low {format(p.lo)} · High {format(p.hi)}
        </span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Delta({ x, className = "" }: { x: number; className?: string }) {
  const flat = Math.abs(x) < 0.0005;
  const Icon = flat ? Minus : x > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 t-num text-xs ${flat ? "text-muted" : x > 0 ? "text-good" : "text-bad"} ${className}`}>
      <Icon className="size-3.5" aria-hidden />
      {pct(x)}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------------------
// News ticker (also shown on the Life desk)
// ---------------------------------------------------------------------------------------------------------

export function NewsTicker({ game, onOpen }: { game: Game; onOpen?: () => void }) {
  const e = econOf(game);
  const items = (e?.news ?? []).slice(-6).reverse();
  if (!e || !ECON_FLAGS.hub || !items.length) return null;
  const body = (
    <>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#1c140e]">
        <Newspaper className="size-3" aria-hidden /> LIVE
      </span>
      <span className="ticker-mask relative min-w-0 flex-1 overflow-hidden">
        <span className="ticker-run inline-flex whitespace-nowrap">
          {[...items, ...items].map((n, i) => (
            <TickerItem key={`${n.at}-${i}`} n={n} hidden={i >= items.length} />
          ))}
        </span>
      </span>
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} aria-label="Open Money and markets" className="card mt-2 flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left">
      {body}
    </button>
  ) : (
    <div className="card flex min-h-11 items-center gap-2 px-3 py-2">{body}</div>
  );
}

function TickerItem({ n, hidden }: { n: News; hidden?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 pr-8 text-xs font-semibold text-fg" aria-hidden={hidden || undefined}>
      <span style={{ color: n.tone > 0 ? UP : n.tone < 0 ? DOWN : undefined }}>{n.tone > 0 ? "▲" : n.tone < 0 ? "▼" : "•"}</span>
      {n.text}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Icons and small bits
// ---------------------------------------------------------------------------------------------------------

const HOME_ICON: Record<string, LucideIcon> = { room: BedDouble, flat: Sofa, apartment: Building2, loft: Warehouse, townhouse: Home, penthouse: Crown, lair: Castle, mansion: Landmark };
const HOME_COLOR: Record<string, string> = { room: "#8b95ad", flat: "#7fd3ff", apartment: "#5fb0ff", loft: "#ffb35c", townhouse: "#5fe08f", penthouse: "#ffd76a", lair: "#a59bff", mansion: "#e7a2ff" };
const SECTOR_ICON: Record<string, LucideIcon> = { tech: Cpu, biotech: Atom, energy: Fuel, media: Newspaper, industry: Factory };
const GOOD_ICON: Record<string, LucideIcon> = { gold: Gem, crude: Fuel, steel: Hammer, chips: Cpu, coffee: Coffee, isotope: Atom };

const PERKS: { key: "comfort" | "recover" | "cover" | "train"; label: string; icon: LucideIcon; color: string; line: string }[] = [
  { key: "comfort", label: "Comfort", icon: Smile, color: "#ffd76a", line: "Joy over time" },
  { key: "recover", label: "Recovery", icon: HeartPulse, color: "#ff7a8a", line: "Health over time" },
  { key: "cover", label: "Cover", icon: EyeOff, color: "#a59bff", line: "Secret identity: heat fades" },
  { key: "train", label: "Training", icon: Dumbbell, color: "#3fe0c5", line: "+2% a point in drills and fights" },
];

function PerkPips({ perks, compact = false }: { perks: Record<"comfort" | "recover" | "cover" | "train", number>; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-2"}`}>
      {PERKS.map((p) => {
        const v = perks[p.key];
        if (compact && v <= 0) return null;
        const Icon = p.icon;
        return (
          <span key={p.key} className={`chip !gap-1 !px-2 !py-0.5 !text-[10px] ${v < 0 ? "text-bad" : v === 0 ? "text-muted" : "text-fg"}`} title={p.line}>
            <Icon className="size-3" style={{ color: v > 0 ? p.color : undefined }} aria-hidden />
            {compact ? "" : `${p.label} `}
            <span className="t-num">{v > 0 ? "●".repeat(Math.min(4, v)) : v < 0 ? "−" : "○"}</span>
          </span>
        );
      })}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "bad" }) {
  return (
    <div className="min-w-0 rounded-xl bg-black/25 px-2.5 py-2">
      <p className="truncate text-[10px] font-bold tracking-wider text-muted uppercase">{label}</p>
      <p className={`t-num truncate text-sm ${tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-fg"}`}>{value}</p>
    </div>
  );
}

function Seg<T extends string>({ value, options, onPick, label }: { value: T; options: { id: T; label: string; icon?: LucideIcon }[]; onPick: (id: T) => void; label: string }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="tablist" aria-label={label}>
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === value} onClick={() => onPick(o.id)} className={`seg flex min-w-0 items-center justify-center gap-1.5 !px-1.5 ${options.length > 3 ? "text-[13px]" : ""}`}>
            {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------
// The hub
// ---------------------------------------------------------------------------------------------------------

type Tab = "home" | "markets" | "business";

export function MoneyHub({ game, onAct }: { game: Game; onAct: (id: string) => void }) {
  const e = econOf(game);
  const [tab, setTab] = useState<Tab>("home");
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [flash, setFlash] = useState<{ key: number; amount: number } | null>(null);
  const waiting = useRef<{ cash: number } | null>(null);
  useEffect(() => {
    const w = waiting.current;
    if (!w) return;
    waiting.current = null;
    const line = game.card.banner[0];
    if (line) setToast({ key: Date.now(), text: line });
    else setToast(null);
    const delta = Math.round(game.stats.money - w.cash);
    if (delta) {
      setFlash({ key: Date.now(), amount: delta });
      buzz(delta > 0 ? "win" : "tap");
    }
  }, [game]);
  // The action's result floats just above the Play bar, so it's seen wherever you scrolled to (2026-11-10 pm).
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);
  if (!e) return null;
  const run = (id: string) => {
    waiting.current = { cash: game.stats.money };
    onAct(id);
  };
  const worth = netWorth(game);
  const last = e.last;
  const live = livingOf(game);
  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "markets", label: "Markets", icon: LineChart },
  ];
  if (ECON_FLAGS.business) tabs.push({ id: "business", label: "Business", icon: Store });
  return (
    <section className="mt-3 flex flex-col gap-3" aria-label="Money and life">
      <div className="card overflow-hidden px-4 py-3.5">
        <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, var(--color-gold), transparent 70%)" }} />
        <div className="flex items-center gap-3">
          <IconTile color="#5fe08f" size="size-11">
            <Wallet className="size-5" />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="t-label text-muted">Net worth</p>
            <p className="t-num relative text-3xl leading-none text-fg">
              {fmt(worth)}
              {flash && (
                <span key={flash.key} className={`anim-float-up absolute left-full ml-2 text-base ${flash.amount > 0 ? "text-good" : "text-bad"}`}>
                  {flash.amount > 0 ? "+" : "−"}
                  {fmt(Math.abs(flash.amount))}
                </span>
              )}
            </p>
            {last && Math.abs(last.swing) >= 1 && (
              <p className={`mt-1 text-[11px] font-bold ${last.swing > 0 ? "text-good" : "text-bad"}`}>
                {last.swing > 0 ? "+" : "−"}
                {fmt(Math.abs(last.swing))} on paper last month
              </p>
            )}
          </div>
          <Spark data={e.worth} w={84} h={36} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Cash" value={fmt(game.stats.money)} tone={game.stats.money < 0 ? "bad" : undefined} />
          <Stat label="Last month" value={last ? `${last.net >= 0 ? "+" : "−"}${fmt(Math.abs(last.net))}` : "—"} tone={last ? (last.net > 0 ? "good" : last.net < 0 ? "bad" : undefined) : undefined} />
          <Stat label="Assets" value={fmt(worth - game.stats.money)} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2">
          {(() => {
            const Icon = live.homeId ? (HOME_ICON[live.homeId] ?? Home) : live.kind === "couch" ? Sofa : Home;
            return <Icon className="size-4 shrink-0" style={{ color: live.homeId ? HOME_COLOR[live.homeId] : "#8b95ad" }} aria-hidden />;
          })()}
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-fg">
            {live.name} <span className="font-semibold text-muted">· {live.place}</span>
          </p>
          <p className="t-num shrink-0 text-xs text-muted">{live.monthly ? `${fmt(live.monthly)}/mo` : "Free"}</p>
        </div>
        {e.arrears > 0 && <p className="mt-2 rounded-lg bg-bad/20 px-3 py-2 text-xs font-bold text-[#ffb3b9]">Behind on housing bills {e.arrears}/3. Get above $0 or downsize, or you lose the place.</p>}
      </div>

      {toast && (
        <p
          key={toast.key}
          role="status"
          onClick={() => setToast(null)}
          className="anim-rise fixed inset-x-4 z-40 mx-auto max-w-md rounded-xl border border-gold/40 bg-[#231a14]/95 px-3.5 py-2.5 text-xs font-bold text-fg shadow-[0_10px_30px_rgb(0_0_0/0.5)] backdrop-blur"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 150px)" }}
        >
          {toast.text}
        </p>
      )}

      <Seg value={tab} options={tabs} onPick={(id) => { setTab(id); setToast(null); }} label="Money tabs" />

      {tab === "markets" && <NewsTicker game={game} />}

      {tab === "home" && <HomeTab game={game} e={e} run={run} />}
      {tab === "markets" && <MarketsTab game={game} e={e} run={run} />}
      {tab === "business" && ECON_FLAGS.business && <BusinessTab game={game} e={e} run={run} />}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Home tab
// ---------------------------------------------------------------------------------------------------------

function HomeTab({ game, e, run }: { game: Game; e: EconState; run: (id: string) => void }) {
  const live = livingOf(game);
  const city = marketCity(game.cityId);
  const dists = districtsOf(city);
  const views = districtViews(e, city);
  const mine = live.kind === "lease" ? e.lease?.districtId : live.home?.districtId;
  const [dist, setDist] = useState<string>(dists.some((d) => d.id === mine) ? mine! : (dists[1]?.id ?? dists[0]!.id));
  const [open, setOpen] = useState<{ homeId: string; mode: "rent" | "buy" } | null>(null);
  const [share, setShare] = useState(20);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [mods, setMods] = useState<string | null>(null);
  const noMoves = game.majorsLeft <= 0;
  const last = e.last;
  return (
    <div className="flex flex-col gap-3">
      {/* Where you live */}
      <article className="card card-accent px-4 py-3.5">
        <p className="t-label text-muted">Where you live</p>
        <div className="mt-1.5 flex items-start gap-3">
          {(() => {
            const Icon = live.homeId ? (HOME_ICON[live.homeId] ?? Home) : live.kind === "couch" ? Sofa : Home;
            return (
              <IconTile color={live.homeId ? (HOME_COLOR[live.homeId] ?? "#8b95ad") : live.kind === "couch" ? "#ff5d6c" : "#8b95ad"} size="size-12">
                <Icon className="size-6" />
              </IconTile>
            );
          })()}
          <div className="min-w-0 flex-1">
            <p className="t-title leading-tight text-fg">{live.name}</p>
            <p className="text-xs font-semibold text-muted">
              {live.place}
              {live.kind === "lease" ? " · Renting" : live.kind === "own" ? (live.home?.estate ? " · Family estate" : live.home?.mortgage ? " · Mortgaged" : " · Owned") : ""}
            </p>
            {live.note && <p className="mt-0.5 text-xs text-muted">{live.note}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="t-num text-base text-gold">{live.monthly ? fmt(live.monthly) : "Free"}</p>
            <p className="text-[10px] font-bold text-muted">{live.monthly ? "a month" : ""}</p>
          </div>
        </div>
        <PerkPips perks={live} />
        {live.kind === "lease" && e.lease && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-muted">Renews in {Math.max(0, e.lease.renew - (game.age * 12 + game.month))} mo · deposit {fmt(e.lease.deposit)}</p>
            {confirm === "moveout" ? (
              <button type="button" className="btn btn-primary !min-h-11 !px-3 text-xs" onClick={() => { run("econ|moveout"); setConfirm(null); }}>
                Hand back keys
              </button>
            ) : (
              <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-xs" onClick={() => setConfirm("moveout")}>
                End lease
              </button>
            )}
          </div>
        )}
      </article>

      {(live.kind === "lease" || live.kind === "own") && <Roommates game={game} run={run} />}

      {/* Last month */}
      {last && (last.lines.length > 0 || last.perks.length > 0) && (
        <article className="card px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="t-label text-muted">Last month</p>
            <p className={`t-num text-sm ${last.net > 0 ? "text-good" : last.net < 0 ? "text-bad" : "text-muted"}`}>
              {last.net >= 0 ? "+" : "−"}
              {fmt(Math.abs(last.net))}
            </p>
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {last.lines.slice(0, 6).map((line) => (
              <li key={line.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-semibold text-fg">{line.label}</span>
                <span className={`t-num shrink-0 ${line.amount > 0 ? "text-good" : "text-bad"}`}>
                  {line.amount > 0 ? "+" : "−"}
                  {fmt(Math.abs(line.amount))}
                </span>
              </li>
            ))}
            {last.swing !== 0 && (
              <li className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-muted">Holdings moved (not cash)</span>
                <span className={`t-num ${last.swing > 0 ? "text-good" : "text-bad"}`}>
                  {last.swing > 0 ? "+" : "−"}
                  {fmt(Math.abs(last.swing))}
                </span>
              </li>
            )}
          </ul>
          {last.perks.length > 0 && <p className="mt-1.5 text-xs font-bold text-gold">Home: {last.perks.join(" · ")}</p>}
        </article>
      )}

      {/* What you own */}
      {e.homes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="t-label flex items-center gap-1.5 text-muted">
            <KeyRound className="size-3.5" aria-hidden /> Your homes
          </h3>
          {e.homes.map((h) => (
            <OwnedCard key={h.uid} game={game} e={e} h={h} run={run} confirm={confirm} setConfirm={setConfirm} mods={mods} setMods={setMods} />
          ))}
        </section>
      )}

      {/* Find a place */}
      <section className="flex flex-col gap-2">
        <h3 className="t-label flex items-center gap-1.5 text-muted">
          <Building2 className="size-3.5" aria-hidden /> Find a place in {cityById(city).name}
        </h3>
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Districts">
          {views.map((v) => {
            const d = districtOf(city, v.key.split(":")[2] ?? "")!;
            const on = d.id === dist;
            return (
              <button key={v.key} type="button" role="tab" aria-selected={on} onClick={() => { setDist(d.id); setOpen(null); }} className={`card flex min-h-[4.5rem] flex-col items-start justify-between px-2.5 py-2 text-left ${on ? "!border-gold/70 ring-1 ring-gold/50" : ""}`}>
                <span className="w-full truncate text-xs font-extrabold text-fg">{d.name}</span>
                <Spark data={v.hist} w={86} h={18} />
                <Delta x={v.chg12} className="!text-[10px]" />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{districtOf(city, dist)?.blurb} 12-month trend under each name. Moving day takes a block of this month's free time.</p>
        <div className="stagger flex flex-col gap-2" key={dist}>
          {HOMES.map((def) => {
            const rentGate = homeGate(game, def, "rent");
            const buyGate = homeGate(game, def, "buy");
            const price = homePrice(e, def.id, city, dist);
            const rent = def.rent ? marketRent(e, def.id, city, dist) : 0;
            const Icon = HOME_ICON[def.id] ?? Home;
            const isOpen = open?.homeId === def.id;
            const canRent = def.rent && !rentGate;
            const canBuy = def.buy && !buyGate;
            const gate = !canRent && !canBuy ? (def.rent ? rentGate : buyGate) : null;
            return (
              <article key={def.id} className={`card px-3 py-3 ${gate ? "opacity-60" : ""}`}>
                <div className="flex gap-3">
                  <IconTile color={gate ? "#5b6478" : (HOME_COLOR[def.id] ?? "#8b95ad")} size="size-12">
                    {gate ? <Lock className="size-5" /> : <Icon className="size-6" />}
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight text-fg">{def.name}</p>
                      <div className="shrink-0 text-right">
                        {def.buy && <p className="t-num text-sm text-gold">{fmt(price)}</p>}
                        {def.rent && <p className="t-num text-[11px] text-muted">{fmt(rent)}/mo</p>}
                      </div>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{def.blurb}</p>
                    <PerkPips perks={def} compact />
                  </div>
                </div>
                {gate ? (
                  <p className="mt-2 text-xs font-semibold text-muted">{gate}</p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    {def.rent && (
                      <button type="button" aria-pressed={isOpen && open?.mode === "rent"} onClick={() => setOpen(isOpen && open?.mode === "rent" ? null : { homeId: def.id, mode: "rent" })} className="btn btn-ghost !min-h-11 flex-1 !px-3 text-sm" disabled={!canRent}>
                        Rent
                      </button>
                    )}
                    {def.buy && (
                      <button type="button" aria-pressed={isOpen && open?.mode === "buy"} onClick={() => setOpen(isOpen && open?.mode === "buy" ? null : { homeId: def.id, mode: "buy" })} className="btn btn-ghost !min-h-11 flex-1 !px-3 text-sm" disabled={!canBuy}>
                        Buy
                      </button>
                    )}
                  </div>
                )}
                {isOpen && open.mode === "rent" && <RentPanel game={game} homeId={def.id} dist={dist} noMoves={noMoves} run={(id) => { run(id); setOpen(null); }} />}
                {isOpen && open.mode === "buy" && <BuyPanel game={game} homeId={def.id} dist={dist} share={share} setShare={setShare} noMoves={noMoves} run={(id) => { run(id); setOpen(null); }} />}
              </article>
            );
          })}
        </div>
        {game.age < HOUSING_AGE && <p className="text-xs text-muted">You live with family until {HOUSING_AGE}. A shared room opens at 16 if you want out early.</p>}
      </section>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "bad" | "gold" }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-muted">{label}</span>
      <span className={`t-num ${tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "gold" ? "text-gold" : "text-fg"}`}>{value}</span>
    </div>
  );
}

function RentPanel({ game, homeId, dist, noMoves, run }: { game: Game; homeId: string; dist: string; noMoves: boolean; run: (id: string) => void }) {
  const q = quoteRent(game, homeId, dist);
  const wage = annualWage(game);
  return (
    <div className="anim-rise mt-3 flex flex-col gap-1.5 rounded-xl bg-black/25 p-3">
      <Row label="Rent" value={`${fmt(q.rent)}/mo`} tone="gold" />
      <Row label="Deposit (back when you leave)" value={fmt(q.deposit)} />
      <Row label="Due today" value={fmt(q.cash)} />
      <Row label="Share of your pay" value={wage ? `${Math.round(q.burden * 100)}%` : "No pay yet"} tone={q.burden > 0.5 || !wage ? "bad" : q.burden > 0.35 ? undefined : "good"} />
      <button type="button" disabled={!q.ok || noMoves} onClick={() => run(`econ|rent|${homeId}|${dist}`)} className="btn btn-gold mt-1 !min-h-11 text-sm">
        {noMoves ? "No free time left this month" : q.ok ? "Sign the lease" : q.why}
      </button>
    </div>
  );
}

const DEPOSITS = [10, 20, 35, 50, 100];

function BuyPanel({ game, homeId, dist, share, setShare, noMoves, run }: { game: Game; homeId: string; dist: string; share: number; setShare: (n: number) => void; noMoves: boolean; run: (id: string) => void }) {
  const q = quoteHome(game, homeId, dist, share / 100);
  return (
    <div className="anim-rise mt-3 flex flex-col gap-1.5 rounded-xl bg-black/25 p-3">
      <p className="t-label text-muted">Deposit</p>
      <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Deposit">
        {DEPOSITS.map((d) => (
          <button key={d} type="button" role="tab" aria-selected={share === d} onClick={() => setShare(d)} className="seg !min-h-11 !px-0 text-xs">
            {d === 100 ? "Cash" : `${d}%`}
          </button>
        ))}
      </div>
      <Row label="Price" value={fmt(q.price)} tone="gold" />
      <Row label={`Deposit + ${Math.round((q.closing / Math.max(1, q.price)) * 100)}% closing`} value={fmt(q.cash)} />
      {q.loan > 0 ? (
        <>
          <Row label={`Mortgage ${fmt(q.loan)} · ${q.rate.toFixed(2)}% · 25 yrs`} value={`${fmt(q.monthly)}/mo`} />
          <Row label="Bank limit on your income" value={fmt(q.maxLoan)} tone={q.loan > q.maxLoan ? "bad" : "good"} />
        </>
      ) : (
        <Row label="Mortgage" value="None" tone="good" />
      )}
      <Row label="Upkeep" value={`${fmt(q.upkeep)}/mo`} />
      <p className="text-[11px] text-muted">Sell any time at market value, less {Math.round(SELL_FEE * 100)}% fees and what you still owe. A bigger deposit gets a better rate.</p>
      <button type="button" disabled={!q.ok || noMoves} onClick={() => run(`econ|buy|${homeId}|${dist}|${Math.max(MIN_DEPOSIT * 100, share)}`)} className="btn btn-gold mt-1 !min-h-11 text-sm">
        {noMoves ? "No free time left this month" : q.ok ? `Buy · ${fmt(q.cash)} today` : q.why}
      </button>
    </div>
  );
}

function OwnedCard({ game, e, h, run, confirm, setConfirm, mods, setMods }: { game: Game; e: EconState; h: OwnedHome; run: (id: string) => void; confirm: string | null; setConfirm: (id: string | null) => void; mods: string | null; setMods: (id: string | null) => void }) {
  const def = homeById(h.homeId);
  const value = homeValue(e, h);
  const owed = h.mortgage?.bal ?? 0;
  const equity = value - owed;
  const living = e.living === h.uid;
  const hist = e.h[`p:${h.cityId}:${h.districtId}`] ?? [];
  const chg12 = hist.length > 12 ? (hist.at(-1) ?? 1) / (hist.at(-13) ?? 1) - 1 : 0;
  const gain = h.paid ? value - h.paid : 0;
  const net = Math.round(value * (1 - SELL_FEE) - owed);
  const Icon = HOME_ICON[h.homeId] ?? Home;
  const here = h.cityId === game.cityId;
  const slots = def?.slots ?? 0;
  return (
    <article className={`card px-3 py-3 ${living ? "!border-gold/60" : ""}`}>
      <div className="flex gap-3">
        <IconTile color={HOME_COLOR[h.homeId] ?? "#8b95ad"} size="size-12">
          <Icon className="size-6" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight text-fg">{h.name ?? def?.name}</p>
              <p className="truncate text-[11px] font-semibold text-muted">
                {h.name ? `${def?.name} · ` : ""}
                {districtOf(h.cityId, h.districtId)?.name}, {cityById(h.cityId).name}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="t-num text-base text-gold">{fmt(value)}</p>
              <Delta x={chg12} className="!text-[10px]" />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="stat-bar !h-1.5 flex-1" aria-label={`Equity ${Math.round((equity / Math.max(1, value)) * 100)}%`}>
              <div className="stat-fill" style={{ width: `${Math.max(0, Math.min(100, (equity / Math.max(1, value)) * 100))}%`, "--fill": "#5fe08f" } as CSSProperties} />
            </div>
            <Spark data={hist} w={56} h={18} />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {living ? <span className="font-bold text-gold">You live here · </span> : h.letOut ? <span className="font-bold text-good">Let · ~{fmt(letIncome(e, h))}/mo · </span> : <span className="font-bold">Empty · </span>}
            {h.mortgage ? `Owe ${fmt(owed)} · ${fmt(h.mortgage.pay)}/mo · ${Math.ceil(h.mortgage.left / 12)} yrs left` : h.estate ? "Estate: the trust pays upkeep" : "Owned outright"}
            {` · upkeep ${fmt(homeUpkeep(e, h))}/mo`}
            {h.paid ? ` · ${gain >= 0 ? "up" : "down"} ${fmt(Math.abs(gain))} since you bought` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!living && here && (
          <button type="button" disabled={game.majorsLeft <= 0} onClick={() => run(`econ|movein|${h.uid}`)} className="btn btn-gold !min-h-11 !px-3 text-xs">
            Move in
          </button>
        )}
        {!living && (
          <button type="button" onClick={() => run(`econ|let|${h.uid}|${h.letOut ? "off" : "on"}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            {h.letOut ? "Stop letting" : "Let it out"}
          </button>
        )}
        {slots > 0 && (
          <button type="button" aria-pressed={mods === h.uid} onClick={() => setMods(mods === h.uid ? null : h.uid)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            Upgrades {h.mods.length}/{slots}
            <ChevronDown className={`size-3.5 transition-transform ${mods === h.uid ? "rotate-180" : ""}`} aria-hidden />
          </button>
        )}
        {h.mortgage && game.stats.money >= owed && (
          <button type="button" onClick={() => run(`econ|payoff|${h.uid}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            Pay off {fmt(owed)}
          </button>
        )}
        {h.estate ? (
          <span className="chip !min-h-11 !px-3 text-xs text-gold">
            <Lock className="size-3.5" aria-hidden /> Family estate · not for sale
          </span>
        ) : confirm === `sell:${h.uid}` ? (
          <button type="button" onClick={() => { run(`econ|sell|${h.uid}`); setConfirm(null); }} className="btn btn-primary !min-h-11 !px-3 text-xs">
            Sell · {net >= 0 ? `get ${fmt(net)}` : `pay ${fmt(-net)}`}
          </button>
        ) : (
          <button type="button" onClick={() => setConfirm(`sell:${h.uid}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            Sell
          </button>
        )}
      </div>
      {mods === h.uid && (
        <div className="anim-rise mt-3 flex flex-col gap-2 rounded-xl bg-black/25 p-2.5">
          {HOME_MODS.map((m) => {
            const has = h.mods.includes(m.id);
            const full = h.mods.length >= slots;
            const tags = PERKS.filter((p) => (m[p.key] ?? 0) > 0).map((p) => `+${m[p.key]} ${p.label}`);
            return (
              <div key={m.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-fg">{m.name} <span className="font-semibold text-gold">{tags.join(" · ")}</span></p>
                  <p className="truncate text-[11px] text-muted">{m.blurb}</p>
                </div>
                {has ? (
                  <span className="chip shrink-0 !text-[10px] text-good"><Check className="size-3" aria-hidden /> Built</span>
                ) : (
                  <button type="button" disabled={full || game.stats.money < m.cost} onClick={() => run(`econ|mod|${h.uid}|${m.id}`)} className="btn btn-gold !min-h-11 shrink-0 !px-3 text-xs">
                    {fmt(m.cost)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Markets tab
// ---------------------------------------------------------------------------------------------------------

type Board = "stocks" | "goods" | "homes" | "rates";
const QTY = [1, 10, 100] as const;

function MarketsTab({ game, e, run }: { game: Game; e: EconState; run: (id: string) => void }) {
  const [board, setBoard] = useState<Board>("stocks");
  const [open, setOpen] = useState<string | null>(null);
  const stocks = stockViews(e);
  const goods = goodViews(e);
  const port = portfolioValue(e);
  const basis = Object.values(e.stocks).reduce((s, l) => s + l.cost, 0) + Object.values(e.goods).reduce((s, l) => s + l.cost, 0);
  const divs = Object.entries(e.stocks).reduce((s, [id, l]) => s + l.n * (stocks.find((v) => v.key === `s:${id}`)?.price ?? 0) * (stockById(id)?.div ?? 0), 0);
  const rows: SeriesView[] = board === "stocks" ? stocks : board === "goods" ? goods : board === "homes" ? districtViews(e, game.cityId) : [];
  return (
    <div className="flex flex-col gap-3">
      <article className="card px-4 py-3">
        <div className="flex items-center gap-3">
          <IconTile color="#ffd76a" size="size-10">
            <TrendingUp className="size-5" />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="t-label text-muted">Portfolio</p>
            <p className="t-num text-xl leading-tight text-fg">{fmt(port)}</p>
          </div>
          {basis > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted uppercase">Gain</p>
              <p className={`t-num text-sm ${port - basis >= 0 ? "text-good" : "text-bad"}`}>
                {port - basis >= 0 ? "+" : "−"}
                {fmt(Math.abs(port - basis))}
              </p>
            </div>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          {game.age < TRADE_AGE ? `Watch the board now; trading opens at ${TRADE_AGE}. ` : ""}
          Prices move every month with trends, news and your fights. Stock fee 1%, goods spread 2.5%, big orders cost more.
          {divs >= 12 ? ` Dividends ~${fmt(divs / 12)}/mo.` : ""}
        </p>
      </article>
      <Seg
        value={board}
        onPick={(id) => { setBoard(id); setOpen(null); }}
        label="Market boards"
        options={[
          { id: "stocks", label: "Stocks", icon: LineChart },
          { id: "goods", label: "Goods", icon: Coins },
          { id: "homes", label: "Homes", icon: Building2 },
          { id: "rates", label: "Rates", icon: Percent },
        ]}
      />
      {board === "rates" ? (
        <RatesCard e={e} />
      ) : (
        <div className="flex flex-col gap-2" key={board}>
          {rows.map((v) => (
            <MarketRow key={v.key} game={game} e={e} v={v} open={open === v.key} onToggle={() => setOpen(open === v.key ? null : v.key)} run={run} tradable={board !== "homes"} />
          ))}
          {board === "homes" && <p className="text-xs text-muted">What a city apartment costs in each district of {cityById(marketCity(game.cityId)).name}. Rent or buy in Home.</p>}
        </div>
      )}
    </div>
  );
}

function RatesCard({ e }: { e: EconState }) {
  const hist = e.h.rate ?? [];
  const now = e.lv.rate ?? 5.5;
  const year = hist.at(-13) ?? now;
  return (
    <article className="card px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="t-label text-muted">Base rate</p>
          <p className="t-num text-2xl text-fg">{now.toFixed(2)}%</p>
        </div>
        <span className={`t-num text-sm ${now - year > 0 ? "text-bad" : "text-good"}`}>
          {now - year >= 0 ? "+" : "−"}
          {Math.abs(now - year).toFixed(2)} pts this year
        </span>
      </div>
      <Chart data={hist} format={(n) => `${n.toFixed(1)}%`} />
      <p className="mt-2 text-xs text-muted">New mortgages pay the base rate plus 0.75–1.5 points (less with a bigger deposit). Your rate is fixed when you buy. Rate hikes cool house prices; cuts heat them.</p>
    </article>
  );
}

function MarketRow({ game, e, v, open, onToggle, run, tradable }: { game: Game; e: EconState; v: SeriesView; open: boolean; onToggle: () => void; run: (id: string) => void; tradable: boolean }) {
  const kind = v.key.startsWith("g:") ? "g" : "s";
  const id = v.key.split(":").slice(-1)[0] ?? "";
  const lot = tradable ? (kind === "s" ? e.stocks[id] : e.goods[id]) : undefined;
  const stock = kind === "s" ? stockById(id) : undefined;
  const good = kind === "g" ? goodById(id) : undefined;
  const Icon = !tradable ? Building2 : stock ? (SECTOR_ICON[stock.sector] ?? LineChart) : (GOOD_ICON[id] ?? Coins);
  const format = tradable ? fmtPrice : fmt;
  return (
    <article className={`card overflow-hidden ${open ? "!border-gold/50" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left">
        <IconTile color={v.chg1 >= 0 ? UP : DOWN} size="size-10">
          <Icon className="size-5" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-fg">
            {v.name}
            {lot && <span className="ml-1.5 align-middle text-[10px] font-extrabold tracking-wider text-gold">×{lot.n.toLocaleString("en-US")}</span>}
          </p>
          <p className="truncate text-[11px] text-muted">{v.sub}</p>
        </div>
        <Spark data={v.hist.slice(-12)} w={58} h={24} />
        <div className="w-[4.6rem] shrink-0 text-right">
          <p className="t-num text-sm text-fg">{format(v.price)}</p>
          <Delta x={v.chg1} className="!text-[10px] justify-end" />
        </div>
      </button>
      {open && (
        <div className="anim-rise border-t border-white/5 px-3 pb-3">
          <Chart data={v.hist} format={format} />
          <p className="mt-2 text-xs text-muted">
            {stock?.blurb ?? good?.blurb ?? districtOf(marketCity(game.cityId), id)?.blurb} 12 months: <Delta x={v.chg12} className="!text-xs" />
            {stock && stock.div > 0 ? ` · Dividend ${(stock.div * 100).toFixed(1)}%/yr` : ""}
          </p>
          {tradable && <TradePanel game={game} kind={kind} id={id} price={v.price} run={run} />}
        </div>
      )}
    </article>
  );
}

function TradePanel({ game, kind, id, price, run }: { game: Game; kind: "s" | "g"; id: string; price: number; run: (id: string) => void }) {
  const e = econOf(game)!;
  const lot = kind === "s" ? e.stocks[id] : e.goods[id];
  const [qty, setQty] = useState<number | "max">(10);
  const most = maxBuy(game, kind, id);
  const n = qty === "max" ? Math.max(most, lot?.n ?? 0) : qty;
  const buyQ = quoteTrade(game, kind, id, "buy", qty === "max" ? most : n);
  const sellQ = quoteTrade(game, kind, id, "sell", qty === "max" ? (lot?.n ?? 0) : Math.min(n, lot?.n ?? n));
  const value = (lot?.n ?? 0) * price;
  const key = `${kind}:${id}`;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {lot && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="You hold" value={lot.n.toLocaleString("en-US")} />
          <Stat label="Worth" value={fmt(value)} />
          <Stat label="Gain" value={`${value - lot.cost >= 0 ? "+" : "−"}${fmt(Math.abs(value - lot.cost))}`} tone={value - lot.cost >= 0 ? "good" : "bad"} />
        </div>
      )}
      {lot?.lockUntil && game.age < lot.lockUntil && <p className="text-[11px] font-bold text-gold">Held in the family trust until {lot.lockUntil}. Dividends reinvest until then.</p>}
      <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Amount">
        {QTY.map((q) => (
          <button key={q} type="button" role="tab" aria-selected={qty === q} onClick={() => setQty(q)} className="seg !min-h-11 !px-0 text-xs">
            ×{q}
          </button>
        ))}
        <button type="button" role="tab" aria-selected={qty === "max"} onClick={() => setQty("max")} className="seg !min-h-11 !px-0 text-xs">
          Max
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={!buyQ.ok} onClick={() => run(`econ|trade|buy|${key}|${buyQ.qty}`)} className="btn btn-gold !min-h-12 flex-col !gap-0 !px-2 text-sm">
          <span>Buy {buyQ.qty ? buyQ.qty.toLocaleString("en-US") : ""}</span>
          <span className="text-[10px] font-bold opacity-80">{buyQ.ok ? `${fmt(buyQ.total)} · fee ${fmt(buyQ.fee)}` : buyQ.why}</span>
        </button>
        <button type="button" disabled={!sellQ.ok} onClick={() => run(`econ|trade|sell|${key}|${sellQ.qty}`)} className="btn btn-ghost !min-h-12 flex-col !gap-0 !px-2 text-sm">
          <span>Sell {sellQ.qty ? sellQ.qty.toLocaleString("en-US") : ""}</span>
          <span className="text-[10px] font-bold opacity-80">{sellQ.ok ? `${fmt(sellQ.total)} after fee` : sellQ.why}</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Business tab
// ---------------------------------------------------------------------------------------------------------

const BIZ_ICON: Record<string, LucideIcon> = { truck: Truck, cafe: Coffee, gym: Dumbbell, security: Shield, startup: Rocket, paper: Newspaper, wayne: Landmark, stark: Factory };
const BIZ_COLOR: Record<string, string> = { truck: "#ff9f5a", cafe: "#c98a5a", gym: "#ff5d6c", security: "#6aa8ff", startup: "#b98bff", paper: "#e8e2d0", wayne: "#ffd76a", stark: "#ff6a4d" };

function BusinessTab({ game, e, run }: { game: Game; e: EconState; run: (id: string) => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const owned = e.biz ?? [];
  const total = owned.reduce((s, b) => s + (b.pl.at(-1) ?? 0), 0);
  const starts = BIZ.filter((d) => !d.empire);
  return (
    <div className="flex flex-col gap-3">
      {owned.length > 0 ? (
        <>
          <p className="t-label flex items-center gap-1.5 text-muted">
            <Briefcase className="size-3.5" aria-hidden /> Your businesses
            {owned.some((b) => b.pl.length) && <span className={`ml-auto t-num ${total >= 0 ? "text-good" : "text-bad"}`}>{total >= 0 ? "+" : "−"}{fmt(Math.abs(total))}/mo</span>}
          </p>
          {owned.map((b) => (
            <BizCard key={b.uid} game={game} e={e} b={b} run={run} confirm={confirm} setConfirm={setConfirm} open={open === b.uid} setOpen={(v) => setOpen(v ? b.uid : null)} />
          ))}
        </>
      ) : (
        <article className="card px-4 py-3">
          <p className="font-bold text-fg">Be your own boss</p>
          <p className="mt-1 text-xs text-muted">Open a business, hire staff, buy upgrades. Profit (or loss) lands every month. More staff helps, but each hire adds less than the last; a happy crew sells more, and a manager runs it if you move city. Sell any time for about two years of profit.</p>
        </article>
      )}
      <p className="t-label mt-1 flex items-center gap-1.5 text-muted">
        <Store className="size-3.5" aria-hidden /> Start something in {cityById(game.cityId).name}
      </p>
      <div className="stagger flex flex-col gap-2">
        {starts.map((def) => {
          const q = quoteBiz(game, def.id);
          const Icon = BIZ_ICON[def.id] ?? Store;
          const locked = q.why?.startsWith("Opens") || q.why?.startsWith("You already") || q.why?.startsWith("Three");
          return (
            <article key={def.id} className={`card px-3 py-3 ${locked ? "opacity-60" : ""}`}>
              <div className="flex gap-3">
                <IconTile color={locked ? "#5b6478" : (BIZ_COLOR[def.id] ?? "#8b95ad")} size="size-12">
                  {locked ? <Lock className="size-5" /> : <Icon className="size-6" />}
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-tight text-fg">{def.name}</p>
                    <p className="t-num shrink-0 text-base text-gold">{fmt(def.cost)}</p>
                  </div>
                  <p className="text-xs text-muted">{def.blurb}</p>
                  {def.perk && <p className="mt-1 text-[11px] font-bold text-gold">Hero perk: {def.perk}</p>}
                  <p className="mt-1 text-[11px] font-semibold text-muted">
                    <Users className="mr-1 inline size-3" aria-hidden />
                    {def.staff} staff · aims for <span className={q.profit >= 0 ? "text-good" : "text-bad"}>{q.profit >= 0 ? "+" : "−"}{fmt(Math.abs(q.profit))}/mo</span> once it finds its feet
                  </p>
                </div>
              </div>
              <button type="button" disabled={!q.ok || game.majorsLeft <= 0} onClick={() => run(`econ|biz|found|${def.id}`)} className="btn btn-gold mt-2.5 !min-h-11 w-full text-sm">
                {q.ok ? (game.majorsLeft > 0 ? `Open it · ${fmt(def.cost)}` : "No free time left this month") : q.why}
              </button>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-muted">Opening day takes a block of free time and it needs about {BIZ_RAMP} months to ramp up. Demand follows the markets: coffee prices squeeze cafés, a nervous city hires security.</p>
    </div>
  );
}

function BizCard({ game, e, b, run, confirm, setConfirm, open, setOpen }: { game: Game; e: EconState; b: Biz; run: (id: string) => void; confirm: string | null; setConfirm: (id: string | null) => void; open: boolean; setOpen: (v: boolean) => void }) {
  const def = bizById(b.kind)!;
  const Icon = BIZ_ICON[b.kind] ?? Store;
  const books = bizBooks(e, b, game.age * 12 + game.month, false, b.cityId !== game.cityId);
  const last = b.pl.at(-1);
  // A brand-new place shows where it's heading (the found card's promise), not its first, half-empty month.
  const steady = bizBooks(e, { ...b, since: -999 }, game.age * 12 + game.month, false, b.cityId !== game.cityId).profit;
  const need = bizNeed(b);
  const value = bizValue(e, b);
  const locked = !!b.lockUntil && game.age < b.lockUntil;
  const now = game.age * 12 + game.month;
  const away = b.cityId !== game.cityId;
  const morale = b.morale ?? MORALE_START;
  const mood = moraleTarget(game, b);
  const latest = (b.log ?? []).at(-1);
  const rivalLeft = b.rival && now < b.rival ? b.rival - now : 0;
  // Upgrade fanfare: anything bought while this card is on screen pops in gold.
  const seen = useRef(new Set(b.ups));
  const fresh = b.ups.filter((id) => !seen.current.has(id));
  useEffect(() => {
    if (fresh.length) buzz("win");
  }, [fresh.length]);
  return (
    <article className={`card px-3 py-3 ${def.empire ? "!border-gold/50" : ""}`}>
      <div className="flex gap-3">
        <IconTile color={BIZ_COLOR[b.kind] ?? "#8b95ad"} size="size-12">
          <Icon className="size-6" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight text-fg">{b.name}</p>
              <p className="truncate text-[11px] font-semibold text-muted">
                {def.empire ? "Family company · you chair the board" : `${def.name} · ${cityById(b.cityId).name}`}
                {away && <span className={b.mgr ? "text-good" : "text-bad"}>{b.mgr ? " · run by your manager" : ` · away, sales −${Math.round((1 - AWAY_MUL) * 100)}%`}</span>}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`t-num text-base ${locked ? "text-muted" : (last ?? steady) >= 0 ? "text-good" : "text-bad"}`}>
                {locked ? "In trust" : `${(last ?? steady) >= 0 ? "+" : "−"}${fmt(Math.abs(last ?? steady))}`}
              </p>
              {!locked && <p className="text-[10px] font-bold text-muted">{last != null ? "last month" : "once it finds its feet"}</p>}
            </div>
          </div>
          {b.pl.length > 1 && (
            <div className="mt-1.5 flex items-center gap-2">
              <Spark data={b.pl} w={120} h={20} />
              {!def.empire && <span className="text-[11px] font-semibold text-muted">Worth ~{fmt(value)}</span>}
            </div>
          )}
          {!def.empire && (
            <div className="mt-1.5 grid grid-cols-2 gap-x-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted uppercase">Rep</span>
                <div className="stat-bar !h-1.5 flex-1" aria-label={`Reputation ${b.rep}`}>
                  <div className="stat-fill" style={{ width: `${b.rep}%`, "--fill": "#ffd76a" } as CSSProperties} />
                </div>
                <span className="t-num text-[11px] text-fg">{b.rep}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted uppercase">Crew</span>
                <div className="stat-bar !h-1.5 flex-1" aria-label={`Morale ${morale}`}>
                  <div className="stat-fill" style={{ width: `${morale}%`, "--fill": morale >= 60 ? "#5fe08f" : morale >= 40 ? "#ffb35a" : "#ff5d6c" } as CSSProperties} />
                </div>
                <span className="t-num text-[11px] text-fg">{morale}</span>
              </div>
              <p className="col-span-2 mt-0.5 text-[11px] text-muted">
                <span className={`font-bold ${morale >= 60 ? "text-good" : morale >= 40 ? "text-gold" : "text-bad"}`}>{moraleWord(morale)}</span>
                {mood.target !== morale && mood.why ? ` · ${mood.target > morale ? "rising" : "falling"}: ${mood.why}` : ""}
                {rivalLeft > 0 && <span className="font-bold text-bad"> · rival nearby, {rivalLeft} mo</span>}
              </p>
            </div>
          )}
          {locked && <p className="mt-1 text-[11px] font-bold text-gold">The board runs it until you're {b.lockUntil}. Then the chair's draw (about {fmt(books.profit)}/mo, following the share price) is yours.</p>}
          {def.empire && !locked && <p className="mt-1 text-[11px] text-muted">The chair's draw follows the share price. Fund projects to raise it.</p>}
        </div>
      </div>
      {!def.empire && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-2.5 py-2">
          <Users className="size-4 shrink-0 text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-fg">
              {b.staff} staff <span className={`font-semibold ${b.staff < need ? "text-bad" : "text-muted"}`}>· {need} to run flat out</span>
            </p>
            <p className="text-[11px] text-muted">{fmt(Math.round(def.wage * Math.sqrt(CITY_PROP[b.cityId] ?? 1)))}/mo each · each hire adds less</p>
          </div>
          <button type="button" aria-label="Let one go" disabled={b.staff <= 0} onClick={() => run(`econ|biz|staff|${b.uid}|-1`)} className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
            <Minus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Hire one" disabled={b.staff >= need * 2 + 2} onClick={() => run(`econ|biz|staff|${b.uid}|1`)} className="btn btn-gold !min-h-11 !min-w-11 !px-0">
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {!def.empire && <ManagerRow game={game} e={e} b={b} run={run} confirm={confirm} setConfirm={setConfirm} />}
      {!def.empire && latest && now - latest.at <= 12 && (
        <p className={`mt-2 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${latest.tone > 0 ? "bg-good/10 text-good" : latest.tone < 0 ? "bg-bad/10 text-bad" : "bg-white/5 text-muted"}`}>
          {latest.tone > 0 ? <ArrowUpRight className="mr-1 inline size-3" aria-hidden /> : latest.tone < 0 ? <ArrowDownRight className="mr-1 inline size-3" aria-hidden /> : null}
          {latest.text}
        </p>
      )}
      {open && !def.empire && (
        <div className="anim-rise mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-xl bg-black/25 px-3 py-2 text-[11px]">
          <span className="text-muted">Revenue</span><span className="t-num text-right text-good">+{fmt(books.revenue)}</span>
          <span className="text-muted">Stock & supplies</span><span className="t-num text-right text-bad">−{fmt(books.goods)}</span>
          <span className="text-muted">Wages</span><span className="t-num text-right text-bad">−{fmt(books.wages)}</span>
          <span className="text-muted">Premises</span><span className="t-num text-right text-bad">−{fmt(books.premises)}</span>
          <span className="text-muted">Upkeep</span><span className="t-num text-right text-bad">−{fmt(books.upkeep)}</span>
          <span className="font-bold text-fg">Steady month</span><span className={`t-num text-right font-bold ${books.profit >= 0 ? "text-good" : "text-bad"}`}>{books.profit >= 0 ? "+" : "−"}{fmt(Math.abs(books.profit))}</span>
        </div>
      )}
      <div className="mt-2.5 flex flex-col gap-2">
        {def.upgrades.map((u) => {
          const has = b.ups.includes(u.id);
          return (
            <div key={u.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-fg">
                  {u.name} <span className="font-semibold text-gold">+{Math.round(u.rev * 100)}% {def.empire ? "draw" : "sales"}{u.staff ? ` · +${u.staff} staff` : ""}{u.rep && !def.empire ? " · rep" : ""}</span>
                </p>
                <p className="truncate text-[11px] text-muted">{u.blurb}</p>
              </div>
              {has ? (
                <span className={`chip shrink-0 !text-[10px] ${fresh.includes(u.id) ? "anim-pop shine-once !border-gold/60 text-gold" : "text-good"}`}>
                  <Check className="size-3" aria-hidden /> {fresh.includes(u.id) ? "Upgraded!" : "Done"}
                </span>
              ) : (
                <button type="button" disabled={locked || game.stats.money < u.cost} onClick={() => run(`econ|biz|up|${b.uid}|${u.id}`)} className="btn btn-gold !min-h-11 shrink-0 !px-3 text-xs">
                  {fmt(u.cost)}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {def.perk && (
        <p className={`mt-2 text-[11px] font-bold ${b.rep >= TIE_IN_REP ? "text-gold" : "text-muted"}`}>
          Hero perk{b.rep >= TIE_IN_REP ? "" : ` (reputation ${b.rep}/${TIE_IN_REP})`}: {def.perk}
        </p>
      )}
      {!def.empire && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={game.majorsLeft <= 0 || b.cityId !== game.cityId} onClick={() => run(`econ|biz|shift|${b.uid}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            Work a shift
          </button>
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
            Books
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {confirm === `biz:${b.uid}` ? (
            <button type="button" onClick={() => { run(`econ|biz|sell|${b.uid}`); setConfirm(null); }} className="btn btn-primary !min-h-11 !px-3 text-xs">
              Sell · get {fmt(value)}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirm(`biz:${b.uid}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
              Sell
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function ManagerRow({ game, e, b, run, confirm, setConfirm }: { game: Game; e: EconState; b: Biz; run: (id: string) => void; confirm: string | null; setConfirm: (id: string | null) => void }) {
  const [hiring, setHiring] = useState(false);
  const def = bizById(b.kind)!;
  const wage = mgrWage(def, b.cityId);
  const mgr = mgrById(b.mgr?.id);
  const away = b.cityId !== game.cityId;
  if (mgr) {
    const t = MGR_TRAIT[mgr.trait];
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/25 px-2.5 py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/15 text-sm font-black text-gold">{mgr.name[0]}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-fg">{mgr.name} <span className="font-semibold text-muted">· manager</span></p>
          <p className="truncate text-[11px] text-muted"><span className="font-bold text-gold">{t.label}</span> · {t.short} · {fmt(wage)}/mo</p>
        </div>
        {confirm === `mgr:${b.uid}` ? (
          <button type="button" onClick={() => { run(`econ|biz|mgrout|${b.uid}`); setConfirm(null); }} className="btn btn-primary !min-h-11 !px-3 text-xs">Let go</button>
        ) : (
          <button type="button" aria-label={`Let ${mgr.name} go`} onClick={() => setConfirm(`mgr:${b.uid}`)} className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
            <Minus className="size-4" aria-hidden />
          </button>
        )}
      </div>
    );
  }
  const cands = mgrCandidates(e, b, game.age * 12 + game.month);
  return (
    <div className={`mt-2 rounded-xl px-2.5 py-2 ${away ? "bg-bad/10" : "bg-black/25"}`}>
      <div className="flex items-center gap-2">
        <Crown className={`size-4 shrink-0 ${away ? "text-bad" : "text-muted"}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-fg">No manager</p>
          <p className="text-[11px] text-muted">{away ? "Nobody's in charge while you're away." : "Hire one to keep the name up and run it if you move city."}</p>
        </div>
        <button type="button" aria-expanded={hiring} onClick={() => setHiring(!hiring)} className="btn btn-gold !min-h-11 shrink-0 !px-3 text-xs">
          Hire
          <ChevronDown className={`size-3.5 transition-transform ${hiring ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>
      {hiring && (
        <ul className="anim-rise mt-2 flex flex-col gap-2">
          {cands.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 rounded-xl bg-black/25 px-2.5 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">{m.name} <span className="text-[11px] font-bold text-gold">· {MGR_TRAIT[m.trait].label}</span></p>
                <p className="text-[11px] text-muted">{m.line}</p>
                <p className="mt-0.5 text-[10px] font-bold text-muted">{MGR_TRAIT[m.trait].short} · keeps reputation up</p>
              </div>
              <button type="button" onClick={() => { run(`econ|biz|mgr|${b.uid}|${m.id}`); setHiring(false); }} className="btn btn-gold !min-h-11 shrink-0 flex-col !gap-0 !px-3 text-xs">
                <span>Hire</span>
                <span className="text-[10px] font-bold opacity-80">{fmt(wage)}/mo</span>
              </button>
            </li>
          ))}
          <li className="text-[11px] text-muted">New candidates each season.</li>
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Roommates
// ---------------------------------------------------------------------------------------------------------

function Roommates({ game, run }: { game: Game; run: (id: string) => void }) {
  const [finding, setFinding] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const rooms = roomsHere(game);
  const here = matesHere(game);
  if (rooms === 0 && here.length === 0) return null;
  const share = mateShare(game);
  const free = rooms - here.length;
  const next = mateShareIfJoined(game);
  return (
    <article className="card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="t-label flex items-center gap-1.5 text-muted">
          <Users className="size-3.5" aria-hidden /> Roommates
        </p>
        <span className="text-[11px] font-bold text-muted">
          {here.length}/{rooms} rooms
        </span>
      </div>
      {here.length === 0 && <p className="mt-1 text-xs text-muted">Split the bills with someone. Good company lifts a home; every extra pair of eyes is less cover for the double life.</p>}
      <ul className="mt-2 flex flex-col gap-2.5">
        {here.map(({ mate, def, person }) => (
          <li key={mate.pid} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-sm font-black text-fg">{def.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-fg">
                  {person?.name ?? def.name}
                  {mate.knows && <span className="ml-1.5 align-middle text-[10px] font-extrabold tracking-wider text-good">KNOWS · KEEPS IT</span>}
                </p>
                <p className="truncate text-[11px] text-muted">{def.job} · {def.blurb}</p>
              </div>
              <span className="t-num shrink-0 text-sm text-good">+{fmt(share)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="stat-bar !h-1.5 flex-1" aria-label={`Closeness ${person?.closeness ?? 0}`}>
                <div className="stat-fill" style={{ width: `${person?.closeness ?? 0}%`, "--fill": "#ff8fd0" } as CSSProperties} />
              </div>
              <button type="button" disabled={game.majorsLeft <= 0} onClick={() => run(`econ|mate|hang|${mate.pid}`)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
                Hang out
              </button>
              {confirm === mate.pid ? (
                <button type="button" onClick={() => { run(`econ|mate|out|${mate.pid}`); setConfirm(null); }} className="btn btn-primary !min-h-11 !px-3 text-xs">
                  Ask to leave
                </button>
              ) : (
                <button type="button" aria-label={`Ask ${def.name} to move out`} onClick={() => setConfirm(mate.pid)} className="btn btn-ghost !min-h-11 !min-w-11 !px-0">
                  <Minus className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {free > 0 && (
        <>
          <button type="button" aria-expanded={finding} onClick={() => setFinding(!finding)} className="btn btn-gold mt-3 !min-h-11 w-full text-sm">
            <Plus className="size-4" aria-hidden /> Find a roommate · ~{fmt(next)}/mo
          </button>
          {finding && (
            <ul className="anim-rise mt-2 flex flex-col gap-2">
              {mateCandidates(game).map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 rounded-xl bg-black/25 px-2.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-fg">{m.name} <span className="text-[11px] font-semibold text-muted">· {m.age}</span></p>
                    <p className="text-[11px] text-muted">{m.job}. {m.blurb}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-muted">
                      {[m.comfort ? `${m.comfort > 0 ? "+" : ""}${m.comfort} Comfort` : "", m.recover ? `${m.recover > 0 ? "+" : ""}${m.recover} Recovery` : "", m.train ? "+1 Training" : "", m.nosy >= 0.4 ? "Nosy" : m.nosy <= 0.1 ? "Minds own business" : "", m.flaky >= 0.2 ? "Rent sometimes late" : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button type="button" onClick={() => { run(`econ|mate|find|${m.id}`); setFinding(false); }} className="btn btn-gold !min-h-11 shrink-0 !px-3 text-xs">
                    Move in
                  </button>
                </li>
              ))}
              <li className="text-[11px] text-muted">New faces each month.</li>
            </ul>
          )}
        </>
      )}
    </article>
  );
}
