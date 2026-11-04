import type { WardrobeGenre } from './genres';

export type GameStatus = 'backlog' | 'playing' | 'finished' | 'dropped';

export interface Game {
  id: string;
  name: string;
  year: number | null;
  platforms: string[];
  developers: string[];
  publishers: string[];
  genres: string[];
  themes: string[];
  summary: string | null;
  coverUrl: string | null;
  // From IGDB, out of 100. Games saved before this existed don't have them.
  criticScore?: number | null;
  criticReviews?: number | null;
}

// A game named in the Codex. The year tells it apart from remakes.
export interface GameLookup {
  name: string;
  year: number;
}

export interface PlaySession {
  id: string;
  minutes: number;
  playedOn: string;
}

export interface LibraryEntry {
  game: Game;
  status: GameStatus;
  // Saved when the game is added. Genres on screen come from the game itself.
  mainGenre: WardrobeGenre;
  sessions: PlaySession[];
  finishedAt: string | null;
  // 1 to 10, set by her on a finished game.
  rating: number | null;
  updatedAt: string;
}
