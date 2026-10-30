import { getPower, legacyComboId } from "./combo";
import type { Game, PowerId } from "./types";

export type CapeFamily = "fire" | "ice" | "storm" | "mind" | "might" | "swift" | "veil" | "life" | "arcane";

const BY_GIFT: Record<PowerId, CapeFamily> = {
  fire: "fire",
  ice: "ice",
  lightning: "storm",
  blasts: "storm",
  strength: "might",
  elastic: "might",
  forcefield: "might",
  speed: "swift",
  flight: "swift",
  telekinesis: "mind",
  mind: "mind",
  intellect: "mind",
  invisibility: "veil",
  shapeshift: "veil",
  healing: "life",
};

function familyFromTags(id: string): CapeFamily | null {
  const power = getPower(id);
  if (!power) return null;
  const blob = `${power.id} ${power.name} ${power.tags.join(" ")}`.toLowerCase();
  if (blob.includes("mystic") || blob.includes("sorc") || blob.includes("hex")) return "arcane";
  if (blob.includes("ice") || blob.includes("frost") || blob.includes("zero") || blob.includes("glacier")) return "ice";
  if (blob.includes("fire") || blob.includes("magma") || blob.includes("solar") || blob.includes("cinder") || blob.includes("phoenix")) return "fire";
  if (blob.includes("heal") || blob.includes("regen") || blob.includes("knit")) return "life";
  if (blob.includes("mind") || blob.includes("mental") || blob.includes("psych")) return "mind";
  if (blob.includes("storm") || blob.includes("thunder") || blob.includes("lightning") || blob.includes("energy") || blob.includes("light")) return "storm";
  if (blob.includes("speed") || blob.includes("flight") || blob.includes("mobility") || blob.includes("dash")) return "swift";
  if (blob.includes("veil") || blob.includes("invis") || blob.includes("ghost") || blob.includes("blank")) return "veil";
  if (blob.includes("physical") || blob.includes("strength")) return "might";
  return null;
}

export function hasGift(game: Pick<Game, "powerId" | "powerless" | "unlockedPowers">): boolean {
  if (game.powerless) return false;
  if (game.powerId) return true;
  return (game.unlockedPowers?.length ?? 0) > 0;
}

export function capeTheme(game: Pick<Game, "powerId" | "secondaryId" | "powerless" | "unlockedPowers">): { cape: CapeFamily | null; braid: CapeFamily | "more" | null } {
  if (!hasGift(game)) return { cape: null, braid: null };
  const cape = (game.powerId && BY_GIFT[game.powerId]) || familyFromTags(game.unlockedPowers?.[0] ?? "") || "might";
  const owned = game.unlockedPowers ?? [];
  const primary = game.powerId ? legacyComboId(game.powerId) : null;
  const extras = owned.filter((id) => id !== primary);
  if (!extras.length && !game.secondaryId) return { cape, braid: null };
  const secondId = game.secondaryId ? legacyComboId(game.secondaryId) : extras[extras.length - 1];
  const second = (game.secondaryId && BY_GIFT[game.secondaryId]) || (secondId ? familyFromTags(secondId) : null);
  if (!second || second === cape) return { cape, braid: extras.length || game.secondaryId ? "more" : null };
  return { cape, braid: second };
}
