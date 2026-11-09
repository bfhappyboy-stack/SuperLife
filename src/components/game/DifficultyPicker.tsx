import { DIFFICULTY, LIFE_DIFFICULTIES, type LifeDifficulty } from "@/game/difficulty";

/** Life-sim fight curve. Used on the new-life stepper and the legend picker. */
export function DifficultyPicker({ value, onPick }: { value: LifeDifficulty; onPick: (d: LifeDifficulty) => void }) {
  const tune = DIFFICULTY[value];
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="t-label text-[10px] text-gold">FIGHT DIFFICULTY</p>
        <p className="text-[11px] text-muted">{tune.blurb}</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Fight difficulty">
        {LIFE_DIFFICULTIES.map((id) => {
          const on = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(id)}
              className={`seg !min-h-11 flex-col !gap-0 !px-1 justify-center text-center ${on ? "!border-gold !bg-gold/15 text-gold" : ""}`}
            >
              <span className="text-[12px] font-extrabold leading-tight">{DIFFICULTY[id].title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
