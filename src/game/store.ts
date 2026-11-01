import { create } from "zustand";
import { act, ageUp, applyHeroTalk, choose, createGame, dismissReveal, freshen, heirFrom, resolveMini, skipToBirthday, type NewLifeOpts } from "./engine";
import { presetById } from "./presets";
import { loadGame, loadScores, pushScore, saveGame, saveScores, type ScoreRow } from "./save";
import { applyChapterText, type ChapterText } from "./chapters";
import type { Game, GameMode } from "./types";

type Screen = "title" | "mode" | "god" | "create" | "play";

interface Store {
  hydrated: boolean;
  screen: Screen;
  game: Game | null;
  scores: ScoreRow[];
  hydrate: () => void;
  /** Which life the create screen is building: a sealed mystery power, or God Mode picks. */
  createMode: GameMode;
  openCreate: () => void;
  pickMode: (mode: GameMode) => void;
  buildOwn: () => void;
  beginLegend: (presetId: string) => void;
  closeReveal: (firstMove?: number) => void;
  begin: (opts: NewLifeOpts) => void;
  resume: () => void;
  age: () => void;
  skipYear: () => void;
  dismissChapter: () => void;
  showChapter: (index: number) => void;
  patchChapter: (index: number, text: ChapterText | null) => void;
  pick: (id: string) => void;
  do: (id: string) => void;
  finishMini: (ratio: number, used?: string[]) => void;
  noteTalk: (heroId: string, line: string, reply: string) => void;
  toTitle: () => void;
  playHeir: () => void;
}

function commit(set: (partial: Partial<Store>) => void, scores: ScoreRow[], game: Game) {
  let nextScores = scores;
  if (game.phase === "dead" && game.death) {
    nextScores = pushScore(scores, game);
    saveScores(nextScores);
  }
  saveGame(game);
  set({ game, scores: nextScores, screen: "play" });
}

export const useGame = create<Store>((set, get) => ({
  hydrated: false,
  screen: "title",
  game: null,
  scores: [],
  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadGame();
    const game = loaded ? freshen(loaded) : null;
    if (game) saveGame(game);
    set({ hydrated: true, game, scores: loadScores() });
  },
  createMode: "mystery",
  openCreate: () => set({ screen: "mode" }),
  pickMode: (mode) => set({ createMode: mode, screen: mode === "god" ? "god" : "create" }),
  buildOwn: () => set({ createMode: "god", screen: "create" }),
  beginLegend: (presetId) => {
    const legend = presetById(presetId);
    if (!legend) return;
    // createGame fills name, city, upbringing, traits and look from the legend.
    get().begin({ name: legend.name, cityId: legend.cityId, upbringing: legend.upbringing, portrait: legend.portrait, sex: legend.sex, face: legend.face, drive: legend.drive, preset: legend.id, mode: "god" });
  },
  closeReveal: (firstMove) => {
    const game = get().game;
    if (!game?.reveal) return;
    commit(set, get().scores, dismissReveal(game, firstMove));
  },
  begin: (opts) => {
    const game = createGame({ ...opts, seed: opts.seed ?? ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) });
    commit(set, get().scores, game);
  },
  resume: () => {
    const game = get().game ?? loadGame();
    if (!game) return;
    set({ game: freshen(game), screen: "play" });
  },
  age: () => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, ageUp(freshen(game)));
  },
  skipYear: () => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, skipToBirthday(freshen(game)));
  },
  dismissChapter: () => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, { ...game, chapterNotice: null });
  },
  showChapter: (index) => {
    const game = get().game;
    if (!game) return;
    set({ game: { ...game, chapterNotice: { open: index, recap: null } } });
  },
  patchChapter: (index, text) => {
    const game = get().game;
    if (!game) return;
    const next = structuredClone(game);
    commit(set, get().scores, applyChapterText(next, index, text));
  },
  pick: (id) => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, choose(freshen(game), id));
  },
  do: (id) => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, act(freshen(game), id));
  },
  finishMini: (ratio, used) => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, resolveMini(game, ratio, used));
  },
  noteTalk: (heroId, line, reply) => {
    const game = get().game;
    if (!game) return;
    commit(set, get().scores, applyHeroTalk(game, heroId, line, reply));
  },
  toTitle: () => set({ screen: "title" }),
  playHeir: () => {
    const game = get().game;
    if (!game) return;
    const opts = heirFrom(game);
    if (!opts) return;
    commit(set, get().scores, createGame(opts));
  },
}));
