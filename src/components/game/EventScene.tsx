/**
 * "Your call" scene (2026-11-15 night). An event that waits for your choice used to leave a big empty dark gap between
 * its card and the buttons. Now that space is a lit film still: your city's painting graded for night, soft god-rays
 * and drifting dust in your power colour, and you in it (your painted suit cutout from 13, a legend's painting, or
 * your painted portrait before the suit). When the moment names someone close to you, their painted portrait stands
 * opposite you; a crime event with nobody named gets a painted street villain there instead. Painted art only; nothing here is drawn. `EVENT_SCENE` off brings the empty gap back.
 */
import { useEffect, useRef, useState } from "react";
import { hasArt } from "@/assets/art";
import { Cutout, stageArtKey } from "@/components/game/heroArt";
import { lifeLine } from "@/components/game/lifeLine";
import { outfitOf, toneOf } from "@/game/outfit";
import { FAMILY_COLOR } from "@/components/game/icons";
import { Portrait } from "@/components/game/Portrait";
import { useArt } from "@/components/game/Scene";
import { firstName } from "@/game/format";
import { crimeVillainKey, familyOfPower, namedIn, stageScale } from "@/game/heroArt";
import { eventHasTag } from "@/game/events";
import { presetById } from "@/game/presets";
import { capeTheme } from "@/game/theme";
import type { Game, PersonRole } from "@/game/types";

export const EVENT_SCENE = true;

const ROLE_LINE: Record<PersonRole, string> = { parent: "Family", friend: "Friend", partner: "Your person", rival: "Rival", teammate: "Teammate", child: "Your kid", ex: "Your ex", hero: "Hero", villain: "Villain", crush: "Crush" };

/** Thirteen dust motes with fixed positions and timings (no randomness, so the scene never jumps on re-render). */
const MOTES = Array.from({ length: 13 }, (_, i) => ({ left: (i * 37 + 11) % 96, top: 18 + ((i * 53) % 70), size: 1.5 + (i % 3), delay: -(i * 1.7), dur: 9 + (i % 5) * 2 }));

export function EventScene({ game, prompt, eventId }: { game: Game; prompt: string; eventId?: string }) {
  const legend = presetById(game.preset);
  const legendKey = legend && hasArt(legend.art) ? legend.art : "";
  const legendArt = useArt(legendKey);
  const family = capeTheme(game).cape;
  const cutKey = legend ? "" : stageArtKey(family, game.sex, game.age, lifeLine(game, family, game.sex), toneOf(game.look));
  const cut = useArt(cutKey ? `cut-${cutKey}` : "");
  const city = useArt(game.cityId);
  const glow = legend?.color ?? (family ? FAMILY_COLOR[family] : "#e6b34d");
  const other = namedIn(prompt, game.relationships ?? []);
  // Crime events with nobody you know named in them: a painted street villain stands opposite you, facing you.
  const villain = !other && eventHasTag(eventId, "crime") ? crimeVillainKey(eventId ?? "", game.age, game.month) : null;
  const villainArt = useArt(villain && hasArt(villain.key) ? villain.key : "");
  const villainFamily = villain ? familyOfPower(villain.power) : null;
  const villainGlow = villainFamily ? FAMILY_COLOR[villainFamily] : "#d24a4a";
  // The scene takes whatever room the card and the buttons leave; when that's a sliver (long text, many choices) it hides.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(true);
  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const watch = new ResizeObserver(([entry]) => setRoom(entry.contentRect.height >= 96));
    watch.observe(node);
    return () => watch.disconnect();
  }, []);
  if (!EVENT_SCENE) return null;
  const heroX = other || villainArt ? "30%" : "50%";
  return (
    <div ref={box} className={`event-scene anim-fade relative mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f18] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9)] [container-type:size] ${room ? "" : "invisible"}`} data-room={room ? "1" : "0"} data-scene={legendKey ? "legend" : cutKey ? `cut-${cutKey}` : "portrait"} aria-hidden>
      {city && <img src={city} alt="" draggable={false} className="anim-fade anim-drift absolute inset-0 size-full object-cover object-[50%_35%]" style={{ filter: "brightness(.62) saturate(.8) contrast(1.08)" }} />}
      {/* Colour grade: cool night shadows, the power colour pooling behind you, a heavy floor so the figure stands on something. */}
      <span className="absolute inset-0" style={{ background: `radial-gradient(48% 62% at ${heroX} 70%, color-mix(in srgb, ${glow} 34%, transparent), transparent 72%), linear-gradient(180deg, rgb(11 15 24 / .55), rgb(20 28 48 / .12) 38%, rgb(11 15 24 / .2) 62%, rgb(11 15 24 / .94))` }} />
      {/* Volumetric light from the top corner. */}
      <span className="event-rays absolute -top-1/3 -right-1/4 size-[150%]" style={{ background: `repeating-conic-gradient(from 200deg at 85% 0%, transparent 0deg, color-mix(in srgb, ${glow} 55%, white) 1.6deg, transparent 4deg, transparent 9deg)`, maskImage: "radial-gradient(70% 70% at 85% 0%, rgb(0 0 0 / .8), transparent 70%)", WebkitMaskImage: "radial-gradient(70% 70% at 85% 0%, rgb(0 0 0 / .8), transparent 70%)" }} />
      {MOTES.map((m, i) => (
        <span key={i} className="event-mote absolute rounded-full" style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, background: `color-mix(in srgb, ${glow} 45%, white)`, boxShadow: `0 0 6px ${glow}`, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
      ))}
      {legendKey ? (
        legendArt && (
          <span className="absolute inset-y-0 block w-[62%] -translate-x-1/2" style={{ left: heroX, maskImage: "radial-gradient(62% 72% at 50% 42%, #000 55%, transparent 100%)", WebkitMaskImage: "radial-gradient(62% 72% at 50% 42%, #000 55%, transparent 100%)" }}>
            <img src={legendArt} alt="" draggable={false} className="anim-fade size-full object-cover object-top" />
          </span>
        )
      ) : cutKey ? (
        cut && (
          <span className="absolute top-3 bottom-0 block w-[70%] -translate-x-1/2" style={{ left: heroX }}>
            <Cutout src={cut} name={game.name} glow={glow} pose="idle" scale={stageScale(game.age)} outfit={outfitOf(game)} artKey={cutKey} />
          </span>
        )
      ) : (
        <span className="absolute bottom-[14%] block -translate-x-1/2" style={{ left: heroX }}>
          <span className="block rounded-[26%] p-[3px]" style={{ background: `linear-gradient(160deg, ${glow}, transparent 70%)`, boxShadow: `0 0 0 1px rgb(255 255 255 / .08), 0 18px 40px -14px ${glow}` }}>
            <Portrait seed={game.portrait} age={game.age} sex={game.sex} look={game.look} mood={game.stats.happiness} className="block size-[min(7rem,62cqh)]" />
          </span>
        </span>
      )}
      {villainArt && (
        <span className="anim-rise absolute top-3 right-[-2%] bottom-0 block w-[62%]" data-villain={villain?.key}>
          <span className="absolute inset-0" style={{ background: `radial-gradient(42% 58% at 50% 72%, color-mix(in srgb, ${villainGlow} 28%, transparent), transparent 72%)` }} />
          <Cutout src={villainArt} name="Villain" glow={villainGlow} pose="idle" flip />
        </span>
      )}
      {other && (
        <span className="anim-rise absolute right-[7%] bottom-[12%] flex flex-col items-center gap-1.5">
          <span className="block rounded-[26%] p-[2px]" style={{ background: "linear-gradient(200deg, rgb(255 255 255 / .55), transparent 70%)", boxShadow: "0 16px 32px -14px rgb(0 0 0 / .9)" }}>
            <Portrait seed={other.portrait ?? other.name.length * 17} age={other.age} sex={other.sex} cape={(other.role === "rival" || other.role === "villain" || other.role === "hero") && other.age >= 16} className="block size-[min(6rem,52cqh)]" />
          </span>
          <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-center text-[10px] leading-tight font-extrabold tracking-[0.14em] text-fg uppercase backdrop-blur-sm">
            {firstName(other.name)}
            <span className="block text-[9px] font-bold tracking-[0.16em] text-gold">{ROLE_LINE[other.role]}</span>
          </span>
        </span>
      )}
      {/* Letterbox edge and a thin inner rim, so it reads as a framed film still rather than a hole in the page. */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .06), inset 0 0 60px rgb(0 0 0 / .55)" }} />
    </div>
  );
}
