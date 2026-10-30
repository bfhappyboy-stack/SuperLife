import { useEffect, useState } from "react";
import { Portrait } from "@/components/game/Portrait";
import { arcsCleared, availableArcs, currentCase, plotFor } from "@/game/arcs";
import { getPower, mix, teachableBases, viewPowers } from "@/game/combo";
import { mergeHeroes, replyLocally } from "@/game/heroes";
import { askHero } from "@/game/hero-talk";
import { masteryCap, masteryLevel, nextMasteryExp, powerRank } from "@/game/mastery";
import { knownMoves, moveLevel } from "@/game/moves";
import { dossier, talkBrief } from "@/game/origin";
import { hasGift } from "@/game/theme";
import { useGame } from "@/game/store";
import type { AiHero, Game } from "@/game/types";

export function PowerLab({
  game,
  onAct,
  onChat,
  pane,
}: {
  game: Game;
  onAct: (id: string) => void;
  onChat: (heroId: string) => void;
  pane: "book" | "moves" | "teachers";
}) {
  const unlocked = game.unlockedPowers ?? [];
  const knownIds = new Set(game.discovered ?? []);
  const owned = viewPowers(unlocked).filter((power) => power.unlocked);
  const heard = (game.discovered ?? []).filter((id) => !unlocked.includes(id)).map((id) => getPower(id)).filter((power) => !!power);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const preview = left && right ? mix(left, right, unlocked) : null;
  const moves = game.majorsLeft > 0;
  const heroes = mergeHeroes(game.heroes);
  const met = heroes.filter((hero) => hero.met);
  const unmet = heroes.filter((hero) => !hero.met);
  const gift = hasGift(game);
  const ownedKey = unlocked.join("|");

  useEffect(() => {
    const ids = new Set(ownedKey.split("|").filter(Boolean));
    setLeft((current) => (current && ids.has(current) ? current : null));
    setRight((current) => (current && ids.has(current) ? current : null));
  }, [ownedKey]);

  function pick(id: string) {
    const name = getPower(id)?.name ?? "That power";
    if (id === left) {
      setLeft(null);
      setNotice(`${name} left the first hand.`);
      return;
    }
    if (id === right) {
      setRight(null);
      setNotice(`${name} left the second hand.`);
      return;
    }
    if (!left) {
      setLeft(id);
      setNotice(`${name} is in the first hand.`);
      return;
    }
    if (!right) {
      setRight(id);
      setNotice(`${name} is in the second hand.`);
      return;
    }
    setRight(id);
    setNotice(`${name} replaced the second hand.`);
  }

  function attempt(a: string, b: string) {
    const result = mix(a, b, unlocked);
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    if (!moves) {
      setNotice("No moves left this month.");
      return;
    }
    setNotice("Mixing. The result lands on the card above.");
    onAct(`mix|${a}|${b}`);
    setLeft(null);
    setRight(null);
  }

  if (!gift && pane === "book") {
    return (
      <div className="flex flex-col gap-4">
        <Dormant game={game} />
      </div>
    );
  }

  if (!gift && pane === "moves") return null;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p role="status" className="rounded-2xl border border-gold bg-panel px-4 py-3 text-sm font-semibold text-fg">
          {notice}
        </p>
      )}
      {pane === "book" && gift && (
        <>
          <MasteryBoard game={game} owned={owned} heard={heard} onAct={onAct} onNote={setNotice} />
          <BraidBook
            owned={owned}
            mastery={game.mastery}
            left={left}
            right={right}
            previewOk={preview?.ok ?? false}
            previewText={
              preview
                ? preview.ok
                  ? knownIds.has(preview.power.id)
                    ? `${preview.power.name} \u00b7 ${preview.power.tierName}. Rank starts at D.`
                    : `Unrecorded ${preview.power.tierName.toLowerCase()} braid. You learn the name when it lands.`
                  : preview.reason
                : "Pick two different powers. Tap one again to take it back out."
            }
            moves={moves}
            onPick={pick}
            onMix={() => left && right && attempt(left, right)}
          />
        </>
      )}
      {pane === "moves" && gift && <Loadout game={game} onAct={onAct} onNote={setNotice} />}
      {pane === "teachers" && (
        <TrainerCircle game={game} met={met} unmet={unmet} unlocked={unlocked} knownIds={knownIds} moves={moves} onAct={onAct} onChat={onChat} onNote={setNotice} />
      )}
    </div>
  );
}
