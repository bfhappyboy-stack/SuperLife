import { useState } from "react";
import { Figure } from "@/components/game/Figure";
import { Cutout, stageArtKey } from "@/components/game/heroArt";
import { Portrait } from "@/components/game/Portrait";
import { useArt } from "@/components/game/Scene";
import { hasArt } from "@/assets/art";
import { ART_HEROES, SUIT_LOCKED, stageScale, suitOfKey } from "@/game/heroArt";
import { outfitOf, PAINTED_SUIT, partKey } from "@/game/outfit";
import { presetById } from "@/game/presets";
import { Check, Lock, X } from "lucide-react";
import { FAMILY_COLOR } from "@/components/game/icons";
import { capeTheme } from "@/game/theme";
import { buffLine, costumeMods, fitBlock, fitById, fitsIn, modsLine, SLOT_LABEL, SLOTS } from "@/game/costume";
import { money } from "@/game/format";
import type { CostumeSlot, Game } from "@/game/types";

export function Closet({ game, onAct, onClose }: { game: Game; onAct: (id: string) => void; onClose: () => void }) {
  const [slot, setSlot] = useState<CostumeSlot>("chest");
  const [notice, setNotice] = useState("");
  const mods = costumeMods(game);
  const summary = modsLine(mods);
  const wornId = game.wardrobe?.worn?.[slot];
  const rows = fitsIn(slot);
  const family = capeTheme(game).cape;
  const aura = family ? FAMILY_COLOR[family] : undefined;

  function buy(id: string) {
    const item = fitById(id);
    if (!item) return;
    if (game.wardrobe?.owned?.includes(id)) {
      onAct(`wear-fit|${id}`);
      setNotice(`${item.name} is on.`);
      return;
    }
    const block = fitBlock(game, item);
    if (block) {
      setNotice(block);
      return;
    }
    onAct(`buy-fit|${id}`);
    setNotice(`${item.name} is yours, and it's on. ${buffLine(item)}`);
  }

  function wear(id: string) {
    const item = fitById(id);
    if (!item) return;
    if (wornId === id) {
      onAct(`clear-fit|${slot}`);
      setNotice(`${item.name} comes off.`);
      return;
    }
    onAct(`wear-fit|${id}`);
    setNotice(`${item.name} is on. ${buffLine(item)}`);
  }

  return (
    <div className="anim-rise fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="hud flex shrink-0 items-center justify-between gap-3">
        <div>
          <p className="t-display text-fg">CLOSET</p>
          <p className="text-xs text-muted">Wear it. The buffs are on while it's on.</p>
        </div>
        <button type="button" aria-label="Close the closet" onClick={onClose} className="btn btn-ghost !min-h-11 !w-11 !p-0">
          <X className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <div className="relative mx-4 mt-3 h-72 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
          {ART_HEROES ? <Mirror game={game} aura={aura} /> : <Figure seed={game.portrait} age={Math.max(game.age, 16)} sex={game.sex} look={game.look} wardrobe={game.wardrobe} mood={game.stats.happiness} aura={aura} className="absolute inset-0 h-full w-full" />}
        </div>
        <p className="px-4 pt-3 text-sm font-bold text-gold">{summary === "No stat change. It just looks like you." ? "Street clothes. The shop is where the suit starts earning." : summary}</p>
        <p className="px-4 pt-1 text-xs text-muted">Buy or tap to wear. Buffs last only while the piece is on. {game.age < 8 ? "The glass shows the suit, not the year." : "Tap a piece again to take it off."}</p>
        {notice && (
          <p role="status" key={notice} className="card anim-pop mx-4 mt-2 !border-gold/60 px-3 py-2 text-sm font-semibold text-fg">
            {notice}
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 px-4">
        {SLOTS.map((id) => {
          const on = slot === id;
          const piece = fitById(game.wardrobe?.worn?.[id] ?? "");
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setSlot(id)}
              className={`card min-h-12 px-2.5 py-1.5 text-left text-sm ${on ? "!border-gold !bg-panel-2 text-fg shadow-[0_0_18px_-6px_var(--color-gold)]" : "text-muted"}`}
            >
              <span className="t-label block text-[10px] text-fg">{SLOT_LABEL[id]}</span>
              <span className="block truncate text-xs">{piece?.name ?? "Empty"}</span>
            </button>
          );
        })}
      </div>
      {slot === "chest" && <SuitLines game={game} onAct={(id, line) => { if (id) onAct(id); setNotice(line); }} />}
      {slot !== "chest" && ART_HEROES && <PartNote game={game} slot={slot} />}
      <div className="mt-3 flex flex-col gap-2 px-4">
        {slot === "chest" && ART_HEROES && <p className="t-label text-[10px] text-muted">Colourway · recolours your painted suit</p>}
        {rows.map((item) => {
          const owned = game.wardrobe?.owned?.includes(item.id) ?? false;
          const on = wornId === item.id;
          const block = owned ? null : fitBlock(game, item);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => (owned ? wear(item.id) : buy(item.id))}
              className={`card min-h-14 px-3 py-3 text-left ${on ? "!border-gold !bg-panel-2" : ""} ${block ? "opacity-70" : ""}`}
            >
              <span className="flex items-center gap-2.5 font-bold text-fg">
                <svg viewBox="0 0 32 32" className="size-9 shrink-0 drop-shadow" aria-hidden>
                  <defs>
                    <linearGradient id={`sw-${item.id}`} x1="0" y1="0" x2="0.4" y2="1">
                      <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                      <stop offset="1" stopColor="#000" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="28" height="28" rx="9" fill={item.cloth} />
                  <path d="M2 20 L30 12 V16 L2 24 Z" fill={item.trim} />
                  <rect x="2" y="2" width="28" height="28" rx="9" fill={`url(#sw-${item.id})`} stroke="rgba(255,255,255,.25)" />
                </svg>
                <span className="min-w-0 flex-1">{ART_HEROES && item.id === PAINTED_SUIT ? "As painted" : item.name}</span>
                <span className={`chip shrink-0 !min-h-7 text-xs ${on ? "!bg-gold !text-paper-ink" : "text-gold"}`}>
                  {on ? <Check className="size-3" /> : block ? <Lock className="size-3" /> : null}
                  {on ? "Wearing" : owned ? "Owned" : item.cost ? money(item.cost) : "Free"}
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted">{ART_HEROES && item.id === PAINTED_SUIT ? "Your suit in its own colours, exactly as painted." : item.detail}</span>
              <span className="mt-1 block text-xs text-gold">{buffLine(item)}</span>
              {block && <span className="mt-1 block text-xs text-muted">{block}</span>}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/**
 * The closet mirror (2026-11-14 night): painted, like the rest of the cast. A God Mode legend sees their painting, a
 * Mystery hero from 13 their full-body suit cutout (suit line A or B) on their city at night, and anyone without a
 * suit yet (kids, the powerless, a power with no family) their painted portrait. The paper doll is gone from here;
 * `ART_HEROES` off brings it back.
 */
function Mirror({ game, aura }: { game: Game; aura?: string }) {
  const legend = presetById(game.preset);
  const legendArt = useArt(legend && hasArt(legend.art) ? legend.art : "");
  const family = capeTheme(game).cape;
  const key = legend ? "" : stageArtKey(family, game.sex, game.age, game.suit);
  const cut = useArt(key ? `cut-${key}` : "");
  const city = useArt(game.cityId);
  const glow = legend?.color ?? aura ?? "#e6b34d";
  const outfit = outfitOf(game);
  const line = key ? (suitOfKey(key) === "b" ? "Suit line B" : "Suit line A") : "";
  const wornLine = outfit.worn.map((w) => w.name).join(" · ");
  const caption = legend ? legend.hero : key ? (wornLine ? `${line} · ${wornLine}` : line) : game.age < 13 ? "The suit waits for the power" : "No suit fits a power you don't have yet";
  return (
    <div className="absolute inset-0 bg-[#0b0f18]" data-mirror={legend ? "legend" : key ? `cut-${key}` : "portrait"} data-tint={outfit.tint ?? ""}>
      {city && <img src={city} alt="" draggable={false} className="anim-fade absolute inset-0 size-full object-cover opacity-45 saturate-[.7]" />}
      <span className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 70% at 50% 62%, color-mix(in srgb, ${glow} 30%, transparent), transparent 70%), linear-gradient(180deg, rgb(11 15 24 / .35), rgb(11 15 24 / .2) 55%, rgb(11 15 24 / .92))` }} aria-hidden />
      {legend && legendArt ? (
        <img src={legendArt} alt="" draggable={false} className="anim-fade absolute inset-0 size-full object-cover object-top" />
      ) : key && cut ? (
        <span className="absolute inset-x-0 top-2 bottom-0 block">
          <Cutout key={`${key}|${outfit.tint ?? ""}`} src={cut} name={game.name} glow={glow} pose="idle" scale={stageScale(game.age)} outfit={outfit} artKey={key} />
        </span>
      ) : !key && !legend ? (
        <span className="absolute inset-0 grid place-items-center pb-5">
          <span className="block rounded-[26%] p-[3px]" style={{ background: `linear-gradient(160deg, ${glow}, transparent 70%)`, boxShadow: `0 16px 40px -16px ${glow}` }}>
            <Portrait seed={game.portrait} age={game.age} sex={game.sex} look={game.look} mood={game.stats.happiness} className="block size-36" />
          </span>
        </span>
      ) : null}
      <span className="t-label absolute inset-x-2 bottom-2 truncate text-center text-[10px] tracking-[0.2em] text-fg/80 uppercase" data-caption>{caption}</span>
    </div>
  );
}

/**
 * Suit line picker (2026-11-16, owner: "when you buy and try to select the other suit options it ... doesn't actually
 * change"): your two painted costumes side by side, the one you wear ringed in gold. Tapping the other one switches the
 * painting everywhere you're drawn. Hidden when there's no second painting for this hero, or the suit is locked.
 */
function SuitLines({ game, onAct }: { game: Game; onAct: (id: string, notice: string) => void }) {
  const family = capeTheme(game).cape;
  const legend = presetById(game.preset);
  const keyA = legend ? "" : stageArtKey(family, game.sex, game.age, "a");
  const keyB = legend ? "" : stageArtKey(family, game.sex, game.age, "b");
  const artA = useArt(keyA ? `cut-${keyA}` : "");
  const artB = useArt(keyB ? `cut-${keyB}` : "");
  const base = keyA.replace(/-teen$/, "");
  if (!keyA || !keyB || suitOfKey(keyB) !== "b" || SUIT_LOCKED.includes(base)) return null;
  const wearing = game.suit === "b" ? "b" : "a";
  const glow = family ? FAMILY_COLOR[family] : "#e6b34d";
  return (
    <div className="mt-3 px-4" data-suit-lines>
      <p className="t-label mb-1.5 text-[10px] text-muted">Suit line · your two painted costumes</p>
      <div className="grid grid-cols-2 gap-2">
        {(["a", "b"] as const).map((line) => {
          const on = wearing === line;
          const art = line === "a" ? artA : artB;
          return (
            <button
              key={line}
              type="button"
              aria-pressed={on}
              data-line={line}
              onClick={() => (on ? onAct("", `Suit line ${line.toUpperCase()} is already on.`) : onAct(`suit-line|${line}`, `Suit line ${line.toUpperCase()} is on.`))}
              className={`card relative flex h-36 items-end justify-center overflow-hidden px-2 pb-2 ${on ? "!border-gold !bg-panel-2 shadow-[0_0_22px_-6px_var(--color-gold)]" : ""}`}
            >
              <span className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 70% at 50% 70%, color-mix(in srgb, ${glow} ${on ? 30 : 14}%, transparent), transparent 72%)` }} aria-hidden />
              {art && <img src={art} alt="" draggable={false} className={`pointer-events-none absolute inset-x-0 top-1 mx-auto h-[82%] w-auto ${on ? "" : "opacity-70 saturate-[.8]"}`} />}
              <span className={`chip relative !min-h-7 text-xs ${on ? "!bg-gold !text-paper-ink" : "text-gold"}`}>
                {on ? <Check className="size-3" /> : null}
                {on ? `Wearing ${line.toUpperCase()}` : `Suit ${line.toUpperCase()}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Until a part's painting is in, say so plainly: the piece is on (buffs and all) and named on the mirror. */
function PartNote({ game, slot }: { game: Game; slot: CostumeSlot }) {
  const id = game.wardrobe?.worn?.[slot];
  const key = id ? partKey(slot, id) : "";
  if (!key || hasArt(key)) return null;
  return <p className="px-4 pt-2 text-xs text-muted" data-part-note={key}>{fitById(id)?.name} is on and named on the mirror. Its painting on your hero is on the way.</p>;
}
