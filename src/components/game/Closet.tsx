import { useState } from "react";
import { Figure } from "@/components/game/Figure";
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
        <div className="relative mx-4 mt-3 h-56 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
          <Figure seed={game.portrait} age={Math.max(game.age, 16)} sex={game.sex} look={game.look} wardrobe={game.wardrobe} mood={game.stats.happiness} aura={aura} className="absolute inset-0 h-full w-full" />
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
      <div className="mt-3 flex flex-col gap-2 px-4">
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
                <span className="min-w-0 flex-1">{item.name}</span>
                <span className={`chip shrink-0 !min-h-7 text-xs ${on ? "!bg-gold !text-paper-ink" : "text-gold"}`}>
                  {on ? <Check className="size-3" /> : block ? <Lock className="size-3" /> : null}
                  {on ? "Wearing" : owned ? "Owned" : item.cost ? money(item.cost) : "Free"}
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted">{item.detail}</span>
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
