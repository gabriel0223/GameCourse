// IGDB's game_type ids for bundles and packs. Editions are handled by version_parent.
const HIDDEN_GAME_TYPES = new Set([3, 13]);

export interface RankableGame {
  id: number;
  name: string;
  total_rating_count?: number;
  version_parent?: number;
  game_type?: number;
  first_release_date?: number;
}

export interface GameLookup {
  name: string;
  year: number;
}

// Early access can put a game's first date years before its full release, so
// the window reaches further back than forward. It still separates a game from
// a remake with the same name. IGDB dates start at 1970, so the range does too.
const YEARS_BEFORE = 3;
const YEARS_AFTER = 1;

export function releaseWindow(year: number): [number, number] {
  return [Math.max(0, Date.UTC(year - YEARS_BEFORE, 0, 1) / 1000), Date.UTC(year + YEARS_AFTER + 1, 0, 1) / 1000];
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

// Finds the game a Codex list means. Anything looser than the start of the title
// counts as missing, because a plain name beats a link to the wrong game.
export function pickGame<T extends RankableGame>(games: T[], lookup: GameLookup): T | null {
  const needle = normalize(lookup.name);
  const [from, to] = releaseWindow(lookup.year);
  return (
    games
      .filter((game) => !game.version_parent && !HIDDEN_GAME_TYPES.has(game.game_type ?? -1))
      .filter((game) => (game.first_release_date ?? -1) >= from && (game.first_release_date ?? -1) < to)
      .map((game) => ({ game, tier: matchTier(normalize(game.name), needle) }))
      .filter((item) => item.tier <= 1)
      .sort((a, b) => a.tier - b.tier || (b.game.total_rating_count ?? 0) - (a.game.total_rating_count ?? 0))[0]?.game ??
    null
  );
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
