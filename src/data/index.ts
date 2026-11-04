import { demoCatalog } from './demoCatalog';
import { localCodexStore } from './localCodexStore';
import { localStore } from './localStore';
import type { Game } from '../domain/types';
import type { CodexStore, GameCatalog, LibraryStore } from './ports';
import { igdbCatalog, supabase, supabaseCodexStore, supabaseStore } from './supabase';

export const isDemo = !supabase;

// Every game seen during a visit, so its page can open without waiting.
const seen = new Map<string, Game>();
const remember = (games: Game[]) => {
  games.forEach((game) => seen.set(game.id, game));
  return games;
};
const source: GameCatalog = supabase ? igdbCatalog : demoCatalog;

export const seenGame = (id: string) => seen.get(id);
export const catalog: GameCatalog = {
  suggestions: () => source.suggestions().then(remember),
  search: (query) => source.search(query).then(remember),
  get: (id) =>
    source.get(id).then((game) => {
      if (game) seen.set(id, game);
      return game;
    }),
  details: (id) =>
    source.details(id).then((details) => {
      if (details) remember(details.similar);
      return details;
    }),
  lookup: (games) =>
    source.lookup(games).then((found) => {
      remember(found.filter((game) => game !== null));
      return found;
    }),
};

export const store: LibraryStore = supabase ? supabaseStore : localStore;
export const codexStore: CodexStore = supabase ? supabaseCodexStore : localCodexStore;
