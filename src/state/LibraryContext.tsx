import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { store } from '../data';
import { deriveGamer } from '../domain/gamer';
import type { GamerState } from '../domain/gamer';
import { changeStatus, logSession, newEntry, rateGame, removeSession } from '../domain/library';
import type { Game, GameStatus, LibraryEntry } from '../domain/types';
import { applyRun } from '../domain/practice';
import { applyQuiz } from '../domain/quiz';
import type { FinishedRun, RunReward } from '../domain/practice';
import { DEFAULT_PROFILE, PIECES, cleanName, restoreProfile } from '../domain/wardrobe';
import type { CharacterProfile, Piece, Slot } from '../domain/wardrobe';
import { strings } from '../strings';

export interface Toast {
  id: number;
  text: string;
  tone: 'reward' | 'level' | 'plain' | 'error';
}

interface LibraryValue {
  entries: LibraryEntry[];
  profile: CharacterProfile;
  gamer: GamerState;
  loading: boolean;
  loadFailed: boolean;
  toasts: Toast[];
  find(gameId: string): LibraryEntry | undefined;
  addToBacklog(game: Game): void;
  logTime(game: Game, minutes: number, playedOn: string): void;
  deleteSession(entry: LibraryEntry, sessionId: string): void;
  setStatus(entry: LibraryEntry, status: GameStatus): void;
  setRating(entry: LibraryEntry, rating: number | null): void;
  removeGame(entry: LibraryEntry): void;
  buy(piece: Piece): void;
  equip(slot: Slot, pieceId: string | null): void;
  setAppearance(change: Partial<Pick<CharacterProfile, 'skin' | 'hairStyle' | 'hairColor'>>): void;
  setRead(entryId: string, read: boolean): void;
  setCharacterName(name: string): void;
  recordQuiz(pathId: string, score: number, total: number): void;
  recordRun(run: FinishedRun): RunReward;
  notify(text: string, tone: Toast['tone']): void;
}

const LibraryContext = createContext<LibraryValue | null>(null);
const nowIso = () => new Date().toISOString();

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [profile, setProfile] = useState<CharacterProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const latestEntries = useRef(entries);
  const latestProfile = useRef(profile);
  const nextToast = useRef(1);
  latestEntries.current = entries;
  latestProfile.current = profile;

  useEffect(() => {
    Promise.all([store.list(), store.loadProfile()])
      .then(([savedEntries, savedProfile]) => {
        setEntries(savedEntries);
        if (savedProfile) setProfile(restoreProfile(savedProfile));
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const notify = useCallback((text: string, tone: Toast['tone']) => {
    const id = nextToast.current++;
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600);
  }, []);

  // Updates the screen first, then saves. A failed save restores the old state.
  const commit = useCallback(
    (
      nextEntries: LibraryEntry[],
      nextProfile: CharacterProfile,
      save: () => Promise<unknown>,
      message?: string,
      quiet = false,
    ) => {
      const previousEntries = latestEntries.current;
      const previousProfile = latestProfile.current;
      const before = deriveGamer(previousEntries, previousProfile);
      const after = deriveGamer(nextEntries, nextProfile);
      latestEntries.current = nextEntries;
      latestProfile.current = nextProfile;
      setEntries(nextEntries);
      setProfile(nextProfile);

      if (!quiet) {
        if (message) notify(message, 'plain');
        const change = after.progress.total - before.progress.total;
        if (change > 0) notify(strings.toast.xp(change), 'reward');
        if (change < 0) notify(strings.toast.lostXp(-change), 'plain');
        if (after.progress.level > before.progress.level) notify(strings.toast.level(after.progress.level), 'level');
        for (const achievement of after.achievements) {
          const wasEarned = before.achievements.find((item) => item.id === achievement.id)?.unlocked;
          if (achievement.unlocked && !wasEarned) notify(strings.toast.achievement(achievement.title), 'reward');
        }
        for (const path of after.paths) {
          const wasDone = before.paths.find((item) => item.id === path.id)?.done;
          if (path.done && !wasDone) notify(strings.toast.pathDone(path.title), 'reward');
        }
        const gold = after.gold.earned - before.gold.earned;
        if (gold > 0) notify(strings.toast.gold(gold), 'reward');
        for (const piece of PIECES) {
          if (after.available.has(piece.id) && !before.available.has(piece.id)) {
            notify(strings.toast.newItem(piece.name), 'reward');
          }
        }
      }

      save().catch(() => {
        latestEntries.current = previousEntries;
        latestProfile.current = previousProfile;
        setEntries(previousEntries);
        setProfile(previousProfile);
        notify(strings.toast.saveError, 'error');
      });
    },
    [notify],
  );

  const put = useCallback(
    (entry: LibraryEntry, message?: string) => {
      const next = [entry, ...latestEntries.current.filter((item) => item.game.id !== entry.game.id)];
      commit(next, latestProfile.current, () => store.save(entry), message);
    },
    [commit],
  );

  const putProfile = useCallback(
    (next: CharacterProfile) => {
      commit(latestEntries.current, next, () => store.saveProfile(next));
    },
    [commit],
  );

  const gamer = useMemo(() => deriveGamer(entries, profile), [entries, profile]);

  const value = useMemo<LibraryValue>(
    () => ({
      entries,
      profile,
      gamer,
      loading,
      loadFailed,
      toasts,
      find: (gameId) => entries.find((entry) => entry.game.id === gameId),
      addToBacklog: (game) => put(newEntry(game, 'backlog', nowIso()), strings.toast.added),
      logTime: (game, minutes, playedOn) => {
        const now = nowIso();
        const entry =
          latestEntries.current.find((item) => item.game.id === game.id) ?? newEntry(game, 'playing', now);
        put(logSession(entry, { id: crypto.randomUUID(), minutes, playedOn }, now));
      },
      deleteSession: (entry, sessionId) => put(removeSession(entry, sessionId, nowIso())),
      setStatus: (entry, status) =>
        put(changeStatus(entry, status, nowIso()), status === 'finished' ? strings.toast.finished : undefined),
      setRating: (entry, rating) => put(rateGame(entry, rating, nowIso())),
      removeGame: (entry) => {
        const next = latestEntries.current.filter((item) => item.game.id !== entry.game.id);
        commit(next, latestProfile.current, () => store.remove(entry.game.id));
      },
      buy: (piece) => {
        const current = latestProfile.current;
        const state = deriveGamer(latestEntries.current, current);
        if (!state.available.has(piece.id) || state.owned.has(piece.id) || state.gold.balance < piece.price) return;
        const next = { ...current, owned: { ...current.owned, [piece.id]: piece.price } };
        commit(latestEntries.current, next, () => store.saveProfile(next), strings.toast.bought(piece.name));
      },
      equip: (slot, pieceId) => {
        const current = latestProfile.current;
        putProfile({ ...current, customized: true, equipped: { ...current.equipped, [slot]: pieceId } });
      },
      setAppearance: (change) => {
        const changedHair = 'hairStyle' in change || 'hairColor' in change;
        const current = latestProfile.current;
        putProfile({
          ...current,
          ...change,
          customized: true,
          changedHair: current.changedHair || changedHair,
        });
      },
      notify,
      recordRun: (run) => {
        const current = latestProfile.current;
        const today = new Date().toLocaleDateString('en-CA');
        const { practice, reward } = applyRun(current.practice, run, today);
        putProfile({ ...current, practice });
        return reward;
      },
      setCharacterName: (name) => {
        const current = latestProfile.current;
        const characterName = cleanName(name);
        if (characterName === current.characterName) return;
        putProfile({ ...current, characterName });
        notify(strings.character.nameSaved, 'plain');
      },
      recordQuiz: (pathId, score, total) => {
        const current = latestProfile.current;
        putProfile({ ...current, quizzes: applyQuiz(current.quizzes, pathId, score, total) });
      },
      setRead: (entryId, read) => {
        const current = latestProfile.current;
        const others = current.readEntries.filter((id) => id !== entryId);
        putProfile({ ...current, readEntries: read ? [...others, entryId] : others });
      },
    }),
    [commit, entries, gamer, loadFailed, loading, notify, profile, put, putProfile, toasts],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used inside LibraryProvider');
  return value;
}
