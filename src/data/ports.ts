import type { CodexEntry, CodexImage } from '../content/codex';
import type { Game, GameDetails, GameLookup, LibraryEntry } from '../domain/types';
import type { CharacterProfile } from '../domain/wardrobe';

export interface GameCatalog {
  suggestions(): Promise<Game[]>;
  search(query: string): Promise<Game[]>;
  get(id: string): Promise<Game | null>;
  details(id: string): Promise<GameDetails | null>;
  // One answer per lookup, in the same order, with null for a game it can't find.
  lookup(games: GameLookup[]): Promise<Array<Game | null>>;
}

export interface LibraryStore {
  list(): Promise<LibraryEntry[]>;
  save(entry: LibraryEntry): Promise<void>;
  remove(gameId: string): Promise<void>;
  loadProfile(): Promise<CharacterProfile | null>;
  saveProfile(profile: CharacterProfile): Promise<void>;
}

export interface CodexStore {
  canEdit(): Promise<boolean>;
  list(): Promise<CodexEntry[]>;
  save(entry: CodexEntry): Promise<void>;
  remove(id: string): Promise<void>;
  saveImage(image: Blob, name: string): Promise<Pick<CodexImage, 'src' | 'path'>>;
}
