import { create } from "zustand";
import { act, ageUp, applyHeroTalk, choose, createGame, dismissReveal, freshen, heirFrom, resolveMini, type NewLifeOpts } from "./engine";
import { dismissSkip, fastForward, noteAct, noteMini, notePick } from "./skip";
import { presetById } from "./presets";
import { deleteSlot, firstEmptySlot, listSlots, loadScores, loadSlot, migrateLegacySave, pushScore, readIndex, saveScores, saveSlot, setActiveSlot, type ScoreRow, type SlotSummary } from "./save";
import { payPurse, type PurseInput, type PurseQuote } from "./arena.purse";
import { applyChapterText, type ChapterText } from "./chapters";
import type { Game, GameMode, SkipSpan } from "./types";

type Screen = "title" | "lives" | "mode" | "god" | "create" | "play" | "arena";

interface Store {
  hydrated: boolean;
  screen: Screen;
  game: Game | null;
  /** Which of the five save slots the current life lives in. */
  slot: number | null;
  /** Slot a new life will be born into (set when you start one). */
  newSlot: number | null;
  lives: SlotSummary[];
  scores: ScoreRow[];
  hydrate: () => void;
  openLives: () => void;
  /** Arena: 1v1 versus mode, separate from any life. */
  openArena: () => void;
  playSlot: (slot: number) => void;
  newLifeIn: (slot: number) => void;
  removeLife: (slot: number) => void;
  /** Save the current life to its own slot (page hide / tab switch). */
  flush: () => void;
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
  /** Fast-forward a season or to your next birthday; stops if something needs you. */
  skip: (span: SkipSpan) => void;
  closeSkip: () => void;
  dismissChapter: () => void;
  showChapter: (index: number) => void;
  patchChapter: (index: number, text: ChapterText | null) => void;
  pick: (id: string) => void;
  do: (id: string) => void;
  finishMini: (ratio: number, used?: string[]) => void;
  noteTalk: (heroId: string, line: string, reply: string) => void;
  toTitle: () => void;
  playHeir: () => void;
  /** The life whose character can earn Arena purses: the one you're playing, else the last one played. */
  activeSlot: () => number | null;
  /** Pay an Arena purse into the active life (once per match). Null if there's no active life. */
  payArena: (input: PurseInput & { opponent: string }) => { quote: PurseQuote; name: string } | null;
}

function commit(set: (partial: Partial<Store>) => void, get: () => Store, game: Game) {
  const { scores, slot } = get();
  let nextScores = scores;
  if (game.phase === "dead" && game.death) {
    nextScores = pushScore(scores, game);
    saveScores(nextScores);
  }
  if (slot) saveSlot(slot, game);
  set({ game, scores: nextScores, screen: "play" });
}

export const useGame = create<Store>((set, get) => ({
  activeSlot: () => get().slot ?? readIndex().active ?? null,
  payArena: (input) => {
    const slot = get().activeSlot();
    if (!slot) return null;
    // The in-memory life wins over the slot copy: toTitle/openArena flush it, so paying the stale copy would be overwritten.
    const live = get().slot === slot ? get().game : null;
    const base = live ?? loadSlot(slot);
    if (!base) return null;
    const { game, quote } = payPurse(freshen(base), input);
    if (game !== base) {
      saveSlot(slot, game);
      if (live) set({ game });
      set({ lives: listSlots() });
    }
    return { quote, name: game.name };
  },
  hydrated: false,
  screen: "title",
  game: null,
  scores: [],
  slot: null,
  newSlot: null,
  lives: [],
  hydrate: () => {
    if (get().hydrated) return;
    const index = migrateLegacySave();
    const loaded = index.active ? loadSlot(index.active) : null;
    const game = loaded ? freshen(loaded) : null;
    set({ hydrated: true, game, slot: game ? index.active : null, lives: listSlots(), scores: loadScores() });
  },
  openLives: () => {
    get().flush();
    set({ lives: listSlots(), screen: "lives" });
  },
  playSlot: (slot) => {
    const current = get();
    if (current.game && current.slot && current.slot !== slot) saveSlot(current.slot, current.game);
    const loaded = loadSlot(slot);
    if (!loaded) return;
    setActiveSlot(slot);
    const game = freshen(loaded);
    set({ game, slot, screen: "play" });
  },
  newLifeIn: (slot) => {
    get().flush();
    set({ newSlot: slot, screen: "mode" });
  },
  removeLife: (slot) => {
    deleteSlot(slot);
    const wasActive = get().slot === slot;
    set({ lives: listSlots(), ...(wasActive ? { game: null, slot: null } : {}) });
  },
  flush: () => {
    const { game, slot } = get();
    if (game && slot) saveSlot(slot, game);
  },
  createMode: "mystery",
  openCreate: () => {
    get().flush();
    const empty = firstEmptySlot();
    // All five lives are taken: show them so you can pick one to let go of.
    if (!empty) set({ lives: listSlots(), screen: "lives", newSlot: null });
    else set({ newSlot: empty, screen: "mode" });
  },
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
    commit(set, get, dismissReveal(game, firstMove));
  },
  begin: (opts) => {
    const slot = get().newSlot ?? firstEmptySlot();
    if (!slot) {
      set({ lives: listSlots(), screen: "lives" });
      return;
    }
    const game = createGame({ ...opts, seed: opts.seed ?? ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) });
    set({ slot, newSlot: null });
    commit(set, get, game);
  },
  resume: () => {
    const { game, slot } = get();
    if (game && slot) {
      set({ game: freshen(game), screen: "play" });
      return;
    }
    const index = migrateLegacySave();
    if (index.active) get().playSlot(index.active);
  },
  age: () => {
    const game = get().game;
    if (!game) return;
    commit(set, get, ageUp(freshen(game)));
  },
  skip: (span) => {
    const game = get().game;
    if (!game) return;
    commit(set, get, fastForward(freshen(game), span));
  },
  closeSkip: () => {
    const game = get().game;
    if (!game?.skipReport) return;
    commit(set, get, dismissSkip(game));
  },
  dismissChapter: () => {
    const game = get().game;
    if (!game) return;
    commit(set, get, { ...game, chapterNotice: null });
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
    commit(set, get, applyChapterText(next, index, text));
  },
  pick: (id) => {
    const game = get().game;
    if (!game) return;
    const fresh = freshen(game);
    commit(set, get, notePick(fresh, choose(fresh, id), id));
  },
  do: (id) => {
    const game = get().game;
    if (!game) return;
    const fresh = freshen(game);
    commit(set, get, noteAct(fresh, act(fresh, id), id));
  },
  finishMini: (ratio, used) => {
    const game = get().game;
    if (!game) return;
    commit(set, get, noteMini(resolveMini(game, ratio, used), ratio));
  },
  noteTalk: (heroId, line, reply) => {
    const game = get().game;
    if (!game) return;
    commit(set, get, applyHeroTalk(game, heroId, line, reply));
  },
  openArena: () => {
    get().flush();
    set({ screen: "arena" });
  },
  toTitle: () => {
    get().flush();
    set({ screen: "title", lives: listSlots() });
  },
  playHeir: () => {
    const game = get().game;
    if (!game) return;
    const opts = heirFrom(game);
    if (!opts) return;
    commit(set, get, createGame(opts));
  },
}));
