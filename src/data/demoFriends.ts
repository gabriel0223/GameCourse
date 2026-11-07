import type { Friend } from '../domain/friends';
import type { GameStatus, LibraryEntry } from '../domain/types';
import { pickMainGenre } from '../domain/genres';
import { DEFAULT_PROFILE } from '../domain/wardrobe';
import { DEMO_GAMES } from './demoCatalog';
import type { FriendStore } from './ports';

const day = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

function entry(id: string, status: GameStatus, hours: number, rating: number | null, daysAgo: number): LibraryEntry {
  const game = DEMO_GAMES.find((item) => item.id === `demo-${id}`)!;
  return {
    game,
    status,
    mainGenre: pickMainGenre(game.genres, game.themes),
    sessions: hours ? [{ id: `${id}-1`, minutes: hours * 60, playedOn: day(daysAgo).slice(0, 10) }] : [],
    finishedAt: status === 'finished' ? day(daysAgo) : null,
    rating,
    updatedAt: day(daysAgo),
  };
}

// One sample friend, so the preview shows every friends feature.
const SAMPLE: Friend = {
  id: 'demo-friend',
  profile: {
    ...DEFAULT_PROFILE,
    characterName: 'Gabriel',
    skin: 'tan',
    hairStyle: 'short',
    hairColor: 'black',
    equipped: { accessory: 'acc-shooter', top: 'top-adventure', bottom: 'bottom-action' },
    owned: { 'acc-shooter': 200, 'top-adventure': 60, 'bottom-action': 120 },
    customized: true,
    changedHair: true,
    readEntries: ['genre-rpg', 'genre-platformer', 'playing-dualsense'],
    quizzes: { 'crash-and-comeback': { best: 9, total: 10, attempts: 1, passed: true } },
    practice: { ...DEFAULT_PROFILE.practice, runs: 14, xp: 90, bests: { runner: 67, jet: 12, cupid: 1480 } },
  },
  entries: [
    entry('stardew', 'playing', 22, null, 1),
    entry('celeste', 'finished', 14, 8, 6),
    entry('hades', 'finished', 41, 9, 12),
    entry('portal2', 'finished', 9, 10, 30),
    entry('elden', 'backlog', 0, null, 3),
    entry('cuphead', 'dropped', 3, null, 40),
  ],
};

export const demoFriends: FriendStore = {
  async list() {
    return [SAMPLE];
  },
};
