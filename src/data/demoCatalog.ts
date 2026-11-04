import type { Game } from '../domain/types';
import type { GameCatalog } from './ports';

const PC = 'PC';
const game = (
  id: string,
  name: string,
  year: number,
  platforms: string[],
  developers: string[],
  publishers: string[],
  genres: string[],
  themes: string[],
  summary: string,
): Game => ({
  id: `demo-${id}`,
  name,
  year,
  platforms,
  developers,
  publishers,
  genres,
  themes,
  summary,
  coverUrl: null,
});

const GAMES: Game[] = [
  game('stardew', 'Stardew Valley', 2016, [PC, 'Switch', 'PS4', 'Xbox One'], ['ConcernedApe'], ['ConcernedApe'], ['Simulator', 'Indie'], [], 'Take over an old farm, grow crops, and get to know a small town.'),
  game('celeste', 'Celeste', 2018, [PC, 'Switch', 'PS4', 'Xbox One'], ['Maddy Makes Games'], ['Maddy Makes Games'], ['Platform', 'Indie'], [], 'Climb a mountain through tight, demanding platforming challenges.'),
  game('hollow', 'Hollow Knight', 2017, [PC, 'Switch', 'PS4', 'Xbox One'], ['Team Cherry'], ['Team Cherry'], ['Platform', 'Adventure', 'Indie'], [], 'Explore a vast ruined kingdom of insects and fight tough bosses.'),
  game('portal2', 'Portal 2', 2011, [PC, 'PS3', 'Xbox 360'], ['Valve'], ['Valve'], ['Puzzle', 'Platform'], [], 'Solve first-person puzzles with a device that makes linked portals.'),
  game('hades', 'Hades', 2020, [PC, 'Switch', 'PS5', 'Xbox Series X|S'], ['Supergiant Games'], ['Supergiant Games'], ['Role-playing (RPG)', "Hack and slash/Beat 'em up", 'Indie'], [], 'Fight your way out of the underworld, one attempt at a time.'),
  game('witcher3', 'The Witcher 3: Wild Hunt', 2015, [PC, 'PS4', 'Xbox One', 'Switch'], ['CD Projekt Red'], ['CD Projekt'], ['Role-playing (RPG)', 'Adventure'], [], 'Travel a huge fantasy world as a monster hunter searching for his adopted daughter.'),
  game('elden', 'Elden Ring', 2022, [PC, 'PS5', 'Xbox Series X|S'], ['FromSoftware'], ['Bandai Namco Entertainment'], ['Role-playing (RPG)', 'Adventure'], [], 'Explore a dangerous open world full of secrets and punishing battles.'),
  game('ff7', 'Final Fantasy VII Remake Intergrade', 2021, [PC, 'PS5'], ['Square Enix'], ['Square Enix'], ['Role-playing (RPG)', 'Adventure'], [], 'Join a small resistance group fighting a powerful corporation in the city of Midgar.'),
  game('re4', 'Resident Evil 4', 2023, [PC, 'PS5', 'Xbox Series X|S'], ['Capcom'], ['Capcom'], ['Shooter', 'Adventure'], ['Horror'], 'Survive a hostile village in this remake of a horror action classic.'),
  game('outerwilds', 'Outer Wilds', 2019, [PC, 'PS4', 'Xbox One'], ['Mobius Digital'], ['Annapurna Interactive'], ['Adventure', 'Indie'], [], 'Explore a tiny solar system caught in a mysterious time loop.'),
  game('unpacking', 'Unpacking', 2021, [PC, 'Switch', 'Xbox One'], ['Witch Beam'], ['Humble Games'], ['Puzzle', 'Simulator', 'Indie'], [], 'Tell the story of a life by unpacking boxes in each new home.'),
  game('shorthike', 'A Short Hike', 2019, [PC, 'Switch'], ['adamgryu'], ['adamgryu'], ['Adventure', 'Indie'], [], 'Hike, climb, and glide around a peaceful island park.'),
  game('spiritfarer', 'Spiritfarer', 2020, [PC, 'Switch', 'PS4', 'Xbox One'], ['Thunder Lotus Games'], ['Thunder Lotus Games'], ['Simulator', 'Platform', 'Indie'], [], 'Care for spirits on your boat before guiding them to the afterlife.'),
  game('cuphead', 'Cuphead', 2017, [PC, 'Switch', 'PS4', 'Xbox One'], ['Studio MDHR'], ['Studio MDHR'], ['Platform', 'Shooter', 'Indie'], [], 'Fight hand-drawn bosses in the style of 1930s cartoons.'),
  game('doometernal', 'Doom Eternal', 2020, [PC, 'PS4', 'Xbox One', 'Switch'], ['id Software'], ['Bethesda Softworks'], ['Shooter'], [], 'Move fast and fight hordes of demons in a high-speed shooter.'),
  game('forzah5', 'Forza Horizon 5', 2021, [PC, 'Xbox Series X|S', 'Xbox One'], ['Playground Games'], ['Xbox Game Studios'], ['Racing', 'Sport'], [], 'Race across an open-world version of Mexico.'),
  game('civ6', "Sid Meier's Civilization VI", 2016, [PC, 'Switch', 'PS4', 'Xbox One'], ['Firaxis Games'], ['2K'], ['Strategy', 'Turn-based strategy (TBS)'], [], 'Guide a civilization from its first city to the modern age, one turn at a time.'),
  game('ittakestwo', 'It Takes Two', 2021, [PC, 'PS5', 'PS4', 'Xbox Series X|S', 'Xbox One'], ['Hazelight Studios'], ['Electronic Arts'], ['Platform', 'Adventure'], [], 'A co-op-only adventure for two players, about a couple turned into dolls.'),
  game('disco', 'Disco Elysium', 2019, [PC, 'PS5', 'PS4', 'Xbox Series X|S', 'Switch'], ['ZA/UM'], ['ZA/UM'], ['Role-playing (RPG)', 'Adventure', 'Indie'], [], 'Solve a murder as a detective who has lost his memory, mostly through conversation.'),
  game('slay', 'Slay the Spire', 2019, [PC, 'Switch', 'PS4', 'Xbox One'], ['Mega Crit'], ['Mega Crit'], ['Card & Board Game', 'Strategy', 'Indie'], [], 'Build a deck of cards as you climb a changing tower.'),
];

// Sample numbers, so the preview can show each critic score color.
const SAMPLE_CRITICS: Record<string, [number, number]> = {
  'demo-hollow': [90, 41],
  'demo-unpacking': [72, 18],
  'demo-cuphead': [46, 9],
};

export const demoCatalog: GameCatalog = {
  async suggestions() {
    return GAMES.slice(0, 8);
  },
  async search(query) {
    const needle = query.trim().toLowerCase();
    return GAMES.filter((item) => item.name.toLowerCase().includes(needle));
  },
  async get(id) {
    const found = GAMES.find((item) => item.id === id);
    if (!found) return null;
    const [criticScore, criticReviews] = SAMPLE_CRITICS[id] ?? [null, null];
    return { ...found, criticScore, criticReviews };
  },
  async lookup(games) {
    return games.map(({ name }) => GAMES.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null);
  },
};
