import { pickMainGenre } from './genres';
import type { WardrobeGenre } from './genres';
import type { Game, GameStatus, LibraryEntry, PlaySession } from './types';

export function newEntry(game: Game, status: GameStatus, now: string): LibraryEntry {
  return {
    game,
    status,
    mainGenre: pickMainGenre(game.genres, game.themes),
    sessions: [],
    finishedAt: status === 'finished' ? now : null,
    rating: null,
    updatedAt: now,
  };
}

// Logging time starts or restarts a game. A finished game stays finished, so
// she can keep playing it without losing the finish reward.
export function logSession(entry: LibraryEntry, session: PlaySession, now: string): LibraryEntry {
  return {
    ...entry,
    status: entry.status === 'finished' ? 'finished' : 'playing',
    sessions: [session, ...entry.sessions],
    updatedAt: now,
  };
}

export function removeSession(entry: LibraryEntry, sessionId: string, now: string): LibraryEntry {
  return {
    ...entry,
    sessions: entry.sessions.filter((session) => session.id !== sessionId),
    updatedAt: now,
  };
}

export function changeStatus(entry: LibraryEntry, status: GameStatus, now: string): LibraryEntry {
  return {
    ...entry,
    status,
    finishedAt: status === 'finished' ? (entry.finishedAt ?? now) : null,
    updatedAt: now,
  };
}

// Going back to Playing keeps the rating, so finishing again doesn't lose it.
export function rateGame(entry: LibraryEntry, rating: number | null, now: string): LibraryEntry {
  return { ...entry, rating, updatedAt: now };
}

export function changeMainGenre(entry: LibraryEntry, mainGenre: WardrobeGenre, now: string): LibraryEntry {
  return { ...entry, mainGenre, updatedAt: now };
}
