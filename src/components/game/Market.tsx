import { ArrowDownRight, ArrowUpRight, Lock, Minus, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { CAT_COLOR, CAT_ICON, IconTile } from "@/components/game/icons";
import { money } from "@/game/format";
import { assetYear, CAT_META, CAT_ORDER, holdings, isBlackMarketOpen, itemById, marketOf, sellValue, shelfOf, type MarketCat, type MarketItem } from "@/game/market";
import type { Effects, Game } from "@/game/types";

const EFFECT_LABEL: Partial<Record<keyof Effects, string>> = {
  health: "HP",
  happiness: "Joy",
  smarts: "Mind",
  looks: "Look",
  fame: "Fame",
  reputation: "Rep",
  karma: "Karma",
  powerLevel: "Power",
};

function effectTags(e: Effects | undefined, per = ""): string[] {
  if (!e) return [];
  const out: string[] = [];
  for (const [key, label] of Object.entries(EFFECT_LABEL)) {
    const v = e[key as keyof Effects];
    if (typeof v !== "number" || !v) continue;
    out.push(`${v > 0 ? "+" : ""}${key === "powerLevel" ? v.toFixed(2) : v} ${label}${per}`);
  }
  return out;
}

export function itemTags(item: MarketItem): string[] {
  const tags = effectTags(item.buy);
  if (item.edge) {
    const kinds = item.edge.kinds.map((k) => (k === "duel" ? "Fights" : k === "timing" ? "Stunts" : "Puzzles")).join("/");
    tags.push(`${kinds} +${Math.round(item.edge.amount * 100)}%${item.edge.uses < 100 ? ` ×${item.edge.uses}` : ""}`);
  }
  tags.push(...effectTags(item.yearly, "/yr"));
  if (item.upkeep) tags.push(item.upkeep >= 1 ? `Upkeep ${money(item.upkeep)}/yr` : `Upkeep ${(item.upkeep * 100).toFixed(1)}%/yr`);
  if (item.income) tags.push(`Rent ${(item.income * 100).toFixed(1)}%/yr`);
  if (item.appreciate) tags.push(`Grows ~${(item.appreciate * 100).toFixed(1)}%/yr`);
  if (item.heat) tags.push(item.heat < 0 ? "Cools heat" : "Draws heat");
  if (item.coolHeat) tags.push("Hideout: heat fades");
  if (item.legacy) tags.push(`+${item.legacy} Legacy`);
  if (item.trust) tags.push("Paid to heir at 18");
  return tags;
}

export function Market({ game, onAct }: { game: Game; onAct: (id: string) => void }) {
  const [cat, setCat] = useState<MarketCat>(game.age >= 45 ? "legacy" : game.stats.health < 40 ? "supplies" : "gear");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ key: number; text: string } | null>(null);
  const shelf = useMemo(() => shelfOf(game, cat), [game, cat]);
  const held = holdings(game);
  const m = marketOf(game);
  const black = isBlackMarketOpen(game);
  const buy = (item: MarketItem, price: number) => {
    onAct(`buy|${item.id}`);
    setFlash({ key: Date.now(), text: `−${money(price)}` });
  };
  return (
    <section className="mt-3 flex flex-col gap-3" aria-label="Market">
      <div className="card overflow-hidden px-4 py-4">
        <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, var(--color-gold), transparent 70%)" }} />
        <div className="flex items-center gap-3">
          <IconTile color="#5fe08f" size="size-11">
            <Wallet className="size-5" />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="t-label text-muted">Cash on hand</p>
            <p className="t-num relative text-3xl text-fg">
              {money(game.stats.money)}
              {flash && (
                <span key={flash.key} className="anim-float-up absolute left-full ml-2 text-base text-bad">
                  {flash.text}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Holdings" value={money(held.value)} />
          <Stat label="Upkeep/yr" value={money(held.upkeep)} tone={held.upkeep ? "bad" : undefined} />
          <Stat label="Net/yr" value={`${held.net >= 0 ? "+" : ""}${money(held.net)}`} tone={held.net > 0 ? "good" : held.net < 0 ? "bad" : undefined} />
        </div>
        <p className="mt-3 text-xs text-muted">
          {game.city} prices · stock turns over every birthday{black ? " · the back door is open" : ""}.
        </p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Market categories">
        {CAT_ORDER.map((id) => {
          const Icon = CAT_ICON[id];
          const on = id === cat;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setCat(id);
                setConfirm(null);
              }}
              className={`seg flex items-center gap-1.5 !px-3 ${on ? "" : ""}`}
            >
              <Icon className="size-4" style={on ? undefined : { color: CAT_COLOR[id] }} />
              {CAT_META[id].short}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted">{CAT_META[cat].line}</p>

      <div key={cat} className="stagger flex flex-col gap-2">
        {shelf.length === 0 && <p className="card px-4 py-4 text-sm text-muted">Nothing on this shelf for you yet. Come back older, richer, or better connected.</p>}
        {shelf.map(({ item, price, gate, left }) => {
          const Icon = CAT_ICON[item.cat];
          const trend = price / item.price;
          const afford = game.stats.money >= price;
          const owned = m.assets.some((a) => a.itemId === item.id);
          return (
            <article key={item.id} className={`card px-3 py-3 ${gate ? "opacity-60" : ""}`}>
              <div className="flex gap-3">
                <IconTile color={gate ? "#5b6478" : CAT_COLOR[item.cat]} size="size-12">
                  {gate ? <Lock className="size-5" /> : <Icon className="size-6" />}
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-tight text-fg">
                      {item.name}
                      {item.black && <span className="ml-1.5 align-middle text-[10px] font-extrabold tracking-wider text-bad">BACK DOOR</span>}
                    </p>
                    <div className="shrink-0 text-right">
                      <p className="t-num text-base text-gold">{money(price)}</p>
                      <p className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${trend < 0.95 ? "text-good" : trend > 1.12 ? "text-bad" : "text-muted"}`}>
                        {trend < 0.95 ? <ArrowDownRight className="size-3" /> : trend > 1.12 ? <ArrowUpRight className="size-3" /> : <Minus className="size-3" />}
                        {trend < 0.95 ? "Deal" : trend > 1.12 ? "Pricey" : "Fair"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.blurb}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {itemTags(item).slice(0, 4).map((tag) => (
                      <span key={tag} className="chip !px-2 !py-0.5 !text-[10px] text-fg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted">{gate ? gate : owned && item.unique ? "Owned" : left <= 0 ? "Sold out till your birthday" : `${left} in stock`}</p>
                {!gate && left > 0 && (
                  <button type="button" disabled={!afford} onClick={() => buy(item, price)} className="btn btn-gold !min-h-11 !px-5 text-sm">
                    {afford ? "Buy" : "Can't afford"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {m.assets.length > 0 && (
        <section className="mt-2">
          <h3 className="t-label flex items-center gap-1.5 text-muted">
            <TrendingUp className="size-3.5" /> Your holdings
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {m.assets.map((asset) => {
              const item = itemById(asset.itemId);
              if (!item) return null;
              const Icon = CAT_ICON[item.cat];
              const y = assetYear(asset);
              const worth = sellValue(asset);
              const wear = item.edge && item.edge.uses < 100 ? (asset.uses ?? 0) / item.edge.uses : null;
              return (
                <div key={asset.uid} className="card flex items-center gap-3 px-3 py-2.5">
                  <IconTile color={CAT_COLOR[item.cat]} size="size-9">
                    <Icon className="size-4" />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-fg">{item.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {item.cat === "property" ? `Worth ${money(asset.value)} · ${y.income ? `+${money(y.income)} rent · ` : ""}${money(y.upkeep)} upkeep` : wear != null ? `${asset.uses} uses left` : item.cat === "intel" ? "Spent on your next fight" : `Since age ${asset.boughtAge}`}
                    </p>
                    {wear != null && (
                      <div className="stat-bar mt-1">
                        <div className="stat-fill" style={{ width: `${wear * 100}%`, "--fill": wear > 0.34 ? "#5fe08f" : "#ff5d6c" } as React.CSSProperties} />
                      </div>
                    )}
                  </div>
                  {worth > 0 &&
                    (confirm === asset.uid ? (
                      <button type="button" onClick={() => { onAct(`sell|${asset.uid}`); setConfirm(null); setFlash({ key: Date.now(), text: `+${money(worth)}` }); }} className="btn btn-primary !min-h-11 !px-3 text-xs">
                        Sell {money(worth)}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirm(asset.uid)} className="btn btn-ghost !min-h-11 !px-3 text-xs">
                        Sell
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl bg-black/25 px-2.5 py-2">
      <p className="text-[10px] font-bold tracking-wider text-muted uppercase">{label}</p>
      <p className={`t-num text-sm ${tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-fg"}`}>{value}</p>
    </div>
  );
}
