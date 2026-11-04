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

export interface GameImage {
  id: string;
  width: number | null;
  height: number | null;
}

// Seconds, from players' reports. A game can have any mix of these, or none.
export interface TimeToBeat {
  hastily: number | null;
  normally: number | null;
  completely: number | null;
}

// Loaded with a game's page, not saved in her library.
export interface GameDetails {
  screenshots: GameImage[];
  artworks: GameImage[];
  similar: Game[];
  timeToBeat: TimeToBeat | null;
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
