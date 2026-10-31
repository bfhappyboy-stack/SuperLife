import type React from "react";
import { Sparkles } from "lucide-react";
import { ChapterArt } from "@/components/game/Scene";
import { phaseStyle } from "@/components/game/phaseStyle";
import { useEffect, useMemo, useState } from "react";
import { generateChapterText } from "@/game/chapter-ai";
import { chapterBrief, currentChapter, goalProgress, phaseForAge, snapshot, type Chapter } from "@/game/chapters";
import { useGame } from "@/game/store";
import type { Game } from "@/game/types";

/** The single entry point: a strip at the top of the Life desk. Tap to open the chapter card. */
export function ChapterStrip({ game }: { game: Game }) {
  const showChapter = useGame((s) => s.showChapter);
  const chapter = currentChapter(game);
  const snap = useMemo(() => snapshot(game), [game]);
  if (!chapter) return null;
  const done = chapter.goals.filter((goal) => goalProgress(goal, snap).met).length;
  const ps = phaseStyle(chapter.phase);
  const Icon = ps.icon;
  return (
    <button
      type="button"
      onClick={() => showChapter(chapter.index)}
      className="card relative mt-3 flex min-h-14 w-full items-center gap-3 overflow-hidden px-3 py-2.5 text-left"
      style={{ borderColor: `${ps.accent}80`, backgroundImage: `linear-gradient(100deg, ${ps.accent}26, transparent 55%)` }}
    >
      <span className="ico-tile size-10 shrink-0" style={{ "--tile": ps.accent } as React.CSSProperties}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-label block truncate text-[10px] text-muted">
          CHAPTER {chapter.index + 1} · {phaseForAge(chapter.startAge).name.toUpperCase()} · AGES {chapter.startAge}–{chapter.endAge}
        </span>
        <span className="flex items-center gap-1.5 font-bold text-fg">
          <span className="truncate">{chapter.title}</span>
          {chapter.source === "ai" && <AiChip />}
        </span>
      </span>
      <span className="relative grid size-10 shrink-0 place-items-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={ps.accent} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(done / Math.max(1, chapter.goals.length)) * 94.2} 94.2`} className="transition-[stroke-dasharray] duration-700" />
        </svg>
        <span className="t-num text-xs text-fg">{done}/{chapter.goals.length}</span>
      </span>
    </button>
  );
}

/** Tiny, quiet marker: this chapter's prose was rewritten by the AI pass. */
function AiChip() {
  return (
    <span title="Chapter text written by AI" className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-gold/40 bg-gold/10 px-1.5 py-px text-[9px] font-extrabold tracking-wider text-gold uppercase">
      <Sparkles className="size-2.5" aria-hidden />
      AI-written
    </span>
  );
}

function Goals({ chapter, game }: { chapter: Chapter; game: Game }) {
  const snap = snapshot(game);
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {chapter.goals.map((goal, i) => {
        const p = goalProgress(goal, snap);
        return (
          <li key={goal.id} className={`rounded-2xl border px-3 py-2.5 ${p.met ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-fg">{goal.label}</span>
              <span className={`t-num text-xs ${p.met ? "text-gold" : "text-muted"}`}>{p.met ? "✓ Done" : `${Math.round(p.ratio * 100)}%`}</span>
            </div>
            <div className="stat-bar mt-1.5">
              <div className="stat-fill" style={{ width: `${Math.round(p.ratio * 100)}%`, "--fill": "var(--color-gold)" } as React.CSSProperties} />
            </div>
            <p className="mt-1 text-xs text-muted">{chapter.beats[i] ?? goal.hint}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** Title card + recap overlay. Shown at birth and on each decade birthday, or from the strip. */
export function ChapterOverlay({ game }: { game: Game }) {
  const dismiss = useGame((s) => s.dismissChapter);
  const patch = useGame((s) => s.patchChapter);
  const notice = game.chapterNotice;
  const chapters = game.chapters ?? [];
  const chapter = notice ? chapters.find((c) => c.index === notice.open) : undefined;
  const recapOf = notice && notice.recap !== null ? chapters.find((c) => c.index === notice.recap) : undefined;
  const [step, setStep] = useState<"recap" | "open">(recapOf?.recap ? "recap" : "open");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    setStep(recapOf?.recap ? "recap" : "open");
  }, [notice?.open, notice?.recap, recapOf?.recap]);

  // Optional AI pass: once per chapter, cached in the save. Procedural text stays if it fails.
  useEffect(() => {
    if (!chapter || chapter.aiTried || chapter !== currentChapter(game)) return;
    let alive = true;
    generateChapterText({ data: chapterBrief(game, chapter) })
      .then((res) => alive && patch(chapter.index, res.text))
      .catch(() => alive && patch(chapter.index, null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.index, chapter?.aiTried]);

  if (!notice || !chapter || game.phase === "dead" || game.phase === "mini") return null;
  const past = chapters.filter((c) => c.recap && c.index !== recapOf?.index);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={step === "recap" ? "Chapter recap" : "New chapter"}>
      <div key={step} className="card-glass anim-pop max-h-[90%] w-full max-w-[380px] overflow-y-auto px-5 pb-5" style={{ borderColor: `${phaseStyle((step === "recap" && recapOf ? recapOf : chapter).phase).accent}99` }}>
        <div className="-mx-5 mb-4">
          <ChapterArt index={(step === "recap" && recapOf ? recapOf : chapter).index} phase={(step === "recap" && recapOf ? recapOf : chapter).phase} cityId={game.cityId} className="h-32" />
        </div>
        {step === "recap" && recapOf?.recap ? (
          <>
            <p className="t-label text-[10px] text-muted">
              CHAPTER {recapOf.index + 1} · RECAP · AGES {recapOf.startAge}–{recapOf.endAge}
            </p>
            <h2 className="mt-1 t-display !text-[2rem] text-fg">{recapOf.title}</h2>
            <div className="mt-2 flex items-center gap-1.5">
              {Array.from({ length: recapOf.recap.total }, (_, i) => (
                <span key={i} className={`anim-pop text-2xl ${i < recapOf.recap!.met ? "text-gold drop-shadow-[0_0_8px_var(--color-gold)]" : "text-white/15"}`} style={{ animationDelay: `${200 + i * 160}ms` }}>★</span>
              ))}
              <span className="ml-1 text-sm font-bold text-gold">{recapOf.recap.met} of {recapOf.recap.total} goals</span>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {recapOf.recap.lines.map((line) => (
                <li key={line} className={`text-sm ${line.startsWith("✓") ? "text-fg" : "text-muted"}`}>
                  {line}
                </li>
              ))}
            </ul>
            <p className="card-paper mt-3 px-3 py-2.5 text-sm font-semibold">{recapOf.recap.consequence}</p>
            <p className="mt-2 text-xs text-muted">Legacy now {game.legacy ?? 0}.</p>
            <button type="button" onClick={() => setStep("open")} className="btn btn-primary mt-4 min-h-14 w-full text-lg">
              Turn the page
            </button>
          </>
        ) : (
          <>
            <p className="t-label flex flex-wrap items-center gap-x-2 text-[10px] text-muted">
              CHAPTER {chapter.index + 1} · {phaseForAge(chapter.startAge).name.toUpperCase()} · AGES {chapter.startAge}–{chapter.endAge}
              {chapter.source === "ai" && <AiChip />}
            </p>
            <h2 className="mt-1 t-display !text-[2rem] text-fg">{chapter.title}</h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-fg">{chapter.premise}</p>
            <p className="t-label mt-4 text-gold">This chapter</p>
            <Goals chapter={chapter} game={game} />
            {past.length > 0 && (
              <div className="mt-3">
                <button type="button" onClick={() => setShowPast((v) => !v)} className="min-h-11 text-sm font-semibold text-muted underline">
                  {showPast ? "Hide earlier chapters" : `Earlier chapters (${past.length})`}
                </button>
                {showPast && (
                  <ul className="mt-1 flex flex-col gap-1">
                    {past.map((c) => (
                      <li key={c.index} className="text-sm text-muted">
                        {c.index + 1}. {c.title} — {c.recap?.met}/{c.recap?.total}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <button type="button" onClick={dismiss} className="btn btn-primary mt-4 min-h-14 w-full text-lg">
              {notice.recap !== null || game.age === chapter.startAge ? "Begin chapter" : "Back to life"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
