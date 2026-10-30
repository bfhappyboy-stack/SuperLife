import { useState } from "react";
import { Figure } from "@/components/game/Figure";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-2xl tracking-wide text-fg">CLOSET</p>
          <p className="text-xs text-muted">Wear it. The buffs are on while it's on.</p>
        </div>
        <button type="button" aria-label="Close the closet" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-line text-fg">
          <X className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <div className="relative h-48 shrink-0 overflow-hidden bg-panel">
          <Figure seed={game.portrait} age={Math.max(game.age, 16)} sex={game.sex} look={game.look} wardrobe={game.wardrobe} mood={game.stats.happiness} className="absolute inset-0 h-full w-full" />
        </div>
        <p className="px-4 pt-3 text-sm font-semibold text-gold">{summary === "No stat change. It just looks like you." ? "Street clothes. The shop is where the suit starts earning." : summary}</p>
        <p className="px-4 pt-1 text-xs text-muted">Buy or tap to wear. Buffs last only while the piece is on. {game.age < 8 ? "The glass shows the suit, not the year." : "Tap a piece again to take it off."}</p>
        {notice && (
          <p role="status" className="mx-4 mt-2 rounded-2xl border border-gold bg-panel px-3 py-2 text-sm font-semibold text-fg">
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
              className={`min-h-12 rounded-2xl border px-2 text-left text-sm ${on ? "border-gold bg-panel-2 text-fg" : "border-line bg-panel text-muted"}`}
            >
              <span className="block font-semibold text-fg">{SLOT_LABEL[id]}</span>
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
              className={`min-h-14 rounded-2xl border px-3 py-3 text-left ${on ? "border-gold bg-panel-2" : "border-line bg-panel"}`}
            >
              <span className="flex items-center gap-2 font-semibold text-fg">
                <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden>
                  <circle cx="8" cy="8" r="7" fill={item.cloth} stroke={item.trim} strokeWidth="2" />
                </svg>
                {item.name}
              </span>
              <span className="ml-2 text-xs text-gold">{on ? "Wearing" : owned ? "Owned" : item.cost ? money(item.cost) : "Free"}</span>
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
