import { PACING, USES_PER_YEAR } from "@/game/pacing";

/** Year pacing: the BitLife-style "2/3 this year" pill on an option. Hidden until you've used it once. */
export function UseCount({ uses, cap = USES_PER_YEAR, className = "" }: { uses?: number; cap?: number; className?: string }) {
  if (!PACING.year || !uses) return null;
  const full = uses >= cap;
  return (
    <span
      data-uses={`${uses}/${cap}`}
      aria-label={`Used ${uses} of ${cap} times this year`}
      className={`t-num shrink-0 rounded-full px-1.5 py-px text-[9px] font-black tracking-wider ${full ? "bg-white/10 text-muted" : "bg-white/15 text-fg"} ${className}`}
    >
      {uses}/{cap} THIS YEAR
    </span>
  );
}
