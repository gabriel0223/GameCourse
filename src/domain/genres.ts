export const WARDROBE_GENRES = [
  'RPG',
  'Platformer',
  'Action',
  'Adventure',
  'Shooter',
  'Strategy',
  'Horror',
  'Cozy',
  'Racing and Sports',
  'Puzzle',
] as const;

export type WardrobeGenre = (typeof WARDROBE_GENRES)[number];

export const genreEntryId = (genre: WardrobeGenre) =>
  `genre-${genre.toLowerCase().replace(/[^a-z]+/g, '-')}`;

export const GENRE_COLORS: Record<WardrobeGenre, string> = {
  RPG: '#7C9BFF',
  Platformer: '#FF9463',
  Action: '#FFC857',
  Adventure: '#5FD0B6',
  Shooter: '#AFC968',
  Strategy: '#C9A6FF',
  Horror: '#F0708A',
  Cozy: '#F6B4C8',
  'Racing and Sports': '#62C7F2',
  Puzzle: '#F2E27D',
};

// Checked in order, so a horror shooter counts as Horror. IGDB lists horror as
// a theme rather than a genre, so themes and genres are searched together.
const RULES: Array<[WardrobeGenre, string[]]> = [
  ['Horror', ['horror']],
  ['RPG', ['role-playing (rpg)']],
  ['Shooter', ['shooter']],
  ['Platformer', ['platform']],
  ['Racing and Sports', ['racing', 'sport']],
  [
    'Strategy',
    ['strategy', 'real time strategy (rts)', 'turn-based strategy (tbs)', 'tactical', 'moba', 'card & board game'],
  ],
  ['Puzzle', ['puzzle', 'quiz/trivia']],
  ['Cozy', ['simulator']],
  ['Action', ['fighting', "hack and slash/beat 'em up", 'arcade', 'pinball', 'action']],
  ['Adventure', ['adventure', 'point-and-click', 'visual novel']],
];

// A game can belong to several genres. The first one is its main genre.
export function pickGenres(genres: string[], themes: string[]): WardrobeGenre[] {
  const tags = new Set([...genres, ...themes].map((tag) => tag.toLowerCase()));
  const found = RULES.filter(([, matches]) => matches.some((match) => tags.has(match))).map(([genre]) => genre);
  return found.length > 0 ? found : ['Adventure'];
}

export function pickMainGenre(genres: string[], themes: string[]): WardrobeGenre {
  return pickGenres(genres, themes)[0];
}
