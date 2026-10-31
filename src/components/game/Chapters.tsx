import { BookOpen } from "lucide-react";
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
  return (
    <button
      type="button"
      onClick={() => showChapter(chapter.index)}
      className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-gold/60 bg-panel px-3 py-2 text-left"
    >
      <BookOpen className="size-5 shrink-0 text-gold" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold tracking-wide text-muted">
          CHAPTER {chapter.index + 1} · {phaseForAge(chapter.startAge).name.toUpperCase()} · AGES {chapter.startAge}–{chapter.endAge}
        </span>
        <span className="block truncate font-semibold text-fg">{chapter.title}</span>
      </span>
      <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-fg">
        {done}/{chapter.goals.length}
      </span>
    </button>
  );
}

function Goals({ chapter, game }: { chapter: Chapter; game: Game }) {
  const snap = snapshot(game);
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {chapter.goals.map((goal, i) => {
        const p = goalProgress(goal, snap);
        return (
          <li key={goal.id} className="rounded-xl border border-line px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-fg">{goal.label}</span>
              <span className={`text-xs font-semibold ${p.met ? "text-gold" : "text-muted"}`}>{p.met ? "Done" : `${Math.round(p.ratio * 100)}%`}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(p.ratio * 100)}%` }} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 px-4" role="dialog" aria-modal="true" aria-label={step === "recap" ? "Chapter recap" : "New chapter"}>
      <div className="max-h-[88%] w-full max-w-[380px] overflow-y-auto rounded-3xl border border-gold bg-panel px-5 py-5">
        {step === "recap" && recapOf?.recap ? (
          <>
            <p className="text-xs font-semibold tracking-widest text-muted">
              CHAPTER {recapOf.index + 1} · RECAP · AGES {recapOf.startAge}–{recapOf.endAge}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-fg">{recapOf.title}</h2>
            <p className="mt-2 text-sm font-semibold text-gold">
              {recapOf.recap.met} of {recapOf.recap.total} goals
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {recapOf.recap.lines.map((line) => (
                <li key={line} className={`text-sm ${line.startsWith("✓") ? "text-fg" : "text-muted"}`}>
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl border border-line px-3 py-2 text-sm text-fg">{recapOf.recap.consequence}</p>
            <p className="mt-2 text-xs text-muted">Legacy now {game.legacy ?? 0}.</p>
            <button type="button" onClick={() => setStep("open")} className="mt-4 min-h-14 w-full rounded-2xl bg-cape text-lg font-semibold text-fg">
              Turn the page
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest text-muted">
              CHAPTER {chapter.index + 1} · {phaseForAge(chapter.startAge).name.toUpperCase()} · AGES {chapter.startAge}–{chapter.endAge}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-fg">{chapter.title}</h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-fg">{chapter.premise}</p>
            <p className="mt-4 text-xs font-semibold tracking-widest text-muted">THIS CHAPTER</p>
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
            <button type="button" onClick={dismiss} className="mt-4 min-h-14 w-full rounded-2xl bg-cape text-lg font-semibold text-fg">
              {notice.recap !== null || game.age === chapter.startAge ? "Begin chapter" : "Back to life"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
