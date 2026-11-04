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
}

export interface PlaySession {
  id: string;
  minutes: number;
  playedOn: string;
}

export interface LibraryEntry {
  game: Game;
  status: GameStatus;
  mainGenre: WardrobeGenre;
  sessions: PlaySession[];
  finishedAt: string | null;
  // 1 to 10, set by her on a finished game.
  rating: number | null;
  updatedAt: string;
}
