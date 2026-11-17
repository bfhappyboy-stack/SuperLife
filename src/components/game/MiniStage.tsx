/**
 * Painted minigame stage (2026-11-17 pm). Every skill minigame (strike, read, crack, rescue, press, hold, chase) used to
 * play on a flat dark gradient box, the crudest screen a life sees hundreds of times. Now the arena is a lit film still:
 * your city's painting graded for night, and you in it, off to one side and pushed back into the dark so the game on
 * top stays readable (your painted suit cutout from 13, a legend's painting, or your painted face before the suit).
 * Painted art only; nothing here is drawn. The layer sits under the game (z -1 inside an isolated arena), never takes
 * a tap, and when an image is missing it simply isn't there. `MINI_STAGE` off brings the flat box back.
 */
import { useContext } from "react";
import { Cutout } from "@/components/game/heroArt";
import { MINI_STAGE, MiniHeroContext, miniFigureKind } from "@/components/game/miniStageState";
import { PhotoFace } from "@/components/game/PhotoFace";
import { useArt } from "@/components/game/Scene";
import { stageScale } from "@/game/heroArt";
import { resolveLook } from "@/game/look";
import { outfitOf } from "@/game/outfit";

/**
 * The painted layer under a minigame. Put it first inside a `scene-arena` that has `isolate`, so the city and the
 * figure paint above the arena's own gradient but below every game element. `side` keeps the figure clear of where the
 * game draws most (the hold meter sits left, so the figure stands right there).
 */
export function MiniBackdrop({ accent, side = "left" }: { accent: string; side?: "left" | "right" }) {
  const hero = useContext(MiniHeroContext);
  const figure = MINI_STAGE ? miniFigureKind(hero) : "";
  const city = useArt(MINI_STAGE ? (hero?.city ?? "") : "");
  const legendArt = useArt(figure === "legend" ? (hero?.legend?.art ?? "") : "");
  const cut = useArt(figure.startsWith("cut-") ? figure : "");
  if (!MINI_STAGE || !hero) return null;
  const glow = hero.legend?.color ?? hero.aura ?? accent;
  const x = side === "left" ? "left-[-14%]" : "right-[-14%]";
  const fade = side === "left" ? "90deg" : "270deg";
  // The figure fades towards the middle of the arena and into the floor, so it reads as someone standing in the dark behind the game.
  const mask = `linear-gradient(${fade}, #000 38%, transparent 92%), linear-gradient(180deg, #000 62%, transparent 98%)`;
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" data-mini-stage={figure || "city"} aria-hidden>
      {city && <img src={city} alt="" draggable={false} className="anim-drift absolute inset-0 size-full object-cover object-[50%_35%]" style={{ filter: "brightness(.5) saturate(.75) contrast(1.08)" }} />}
      {/* Night grade: dark top and floor, the game's colour pooling low behind you. */}
      <span className="absolute inset-0" style={{ background: `radial-gradient(55% 60% at ${side === "left" ? "18%" : "82%"} 82%, color-mix(in srgb, ${glow} 30%, transparent), transparent 72%), linear-gradient(180deg, rgb(11 15 24 / .62), rgb(20 28 48 / .28) 40%, rgb(11 15 24 / .4) 70%, rgb(11 15 24 / .9))` }} />
      {figure === "legend" && legendArt && (
        // A legend painting carries its own sky, so it is feathered on every edge (as on the "Your call" scene).
        <span className={`absolute inset-y-0 ${x} block w-[70%] opacity-60`} style={{ maskImage: "radial-gradient(58% 64% at 50% 42%, #000 45%, transparent 100%)", WebkitMaskImage: "radial-gradient(58% 64% at 50% 42%, #000 45%, transparent 100%)" }}>
          <img src={legendArt} alt="" draggable={false} className="size-full object-cover object-top" />
        </span>
      )}
      {figure.startsWith("cut-") && cut && (
        <span className={`absolute top-[8%] bottom-0 ${x} block w-[74%] opacity-60`} style={{ maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}>
          <Cutout src={cut} name="You" glow={glow} pose="idle" scale={stageScale(hero.age)} outfit={outfitOf({ wardrobe: hero.wardrobe, suit: hero.suit })} artKey={figure.slice(4)} />
        </span>
      )}
      {figure === "face" && (
        <span className={`absolute top-[14%] ${side === "left" ? "left-[-16%]" : "right-[-16%]"} block aspect-square w-[66%] opacity-45`} style={{ maskImage: "radial-gradient(closest-side, #000 52%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 52%, transparent 100%)" }}>
          <PhotoFace seed={hero.seed} age={hero.age} sex={hero.sex ?? "male"} look={resolveLook(hero.seed, hero.look)} feature={typeof hero.look?.feature === "number" ? hero.look.feature : null} eyes={typeof hero.look?.eyes === "number" ? hero.look.eyes : null} className="size-full !rounded-none" fallback={<span className="block size-full" />} />
        </span>
      )}
      {/* Keep the very middle a touch darker, where the game draws its pieces. */}
      <span className="absolute inset-0" style={{ background: "radial-gradient(48% 46% at 50% 52%, rgb(11 15 24 / .35), transparent 80%)" }} />
    </div>
  );
}
