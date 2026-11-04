// IGDB's game_type ids for bundles and packs. Editions are handled by version_parent.
const HIDDEN_GAME_TYPES = new Set([3, 13]);

export interface RankableGame {
  id: number;
  name: string;
  total_rating_count?: number;
  version_parent?: number;
  game_type?: number;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Lower is better: the whole title, the start of it, then looser matches.
function matchTier(name: string, query: string): number {
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  const withoutArticle = name.replace(/^(the|a|an) /, '');
  if (withoutArticle === query) return 0;
  if (withoutArticle.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  const words = name.split(' ');
  if (query.split(' ').every((word) => words.some((item) => item.startsWith(word)))) return 3;
  return 4;
}

export function rankGames<T extends RankableGame>(lists: T[][], query: string, limit: number): T[] {
  const needle = normalize(query);
  const unique = new Map<number, T>();
  for (const game of lists.flat()) {
    if (game.version_parent || HIDDEN_GAME_TYPES.has(game.game_type ?? -1)) continue;
    if (!unique.has(game.id)) unique.set(game.id, game);
  }
  return [...unique.values()]
    .map((game) => ({ game, tier: matchTier(normalize(game.name), needle) }))
    .sort((a, b) => a.tier - b.tier || (b.game.total_rating_count ?? 0) - (a.game.total_rating_count ?? 0))
    .slice(0, limit)
    .map((item) => item.game);
}
