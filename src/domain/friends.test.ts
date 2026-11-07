import { describe, expect, it } from 'vitest';
import { friendsWithGame, rivalry, scoreBoard } from './friends';
import type { Friend } from './friends';
import { newEntry } from './library';
import type { Game } from './types';
import { DEFAULT_PROFILE } from './wardrobe';

const game = (id: string): Game => ({
  id,
  name: id,
  year: 2020,
  platforms: [],
  developers: [],
  publishers: [],
  genres: ['Platform'],
  themes: [],
  summary: null,
  coverUrl: null,
});

const friend = (id: string, bests: Record<string, number>, games: string[] = []): Friend => ({
  id,
  profile: { ...DEFAULT_PROFILE, characterName: id, practice: { ...DEFAULT_PROFILE.practice, bests } },
  entries: games.map((item) => newEntry(game(item), 'finished', '2026-11-07')),
});

describe('friends', () => {
  it('finds the friends who have a game', () => {
    const friends = [friend('gabriel', {}, ['celeste', 'hades']), friend('mika', {}, ['hades'])];
    expect(friendsWithGame(friends, 'hades').map((item) => item.friend.id)).toEqual(['gabriel', 'mika']);
    expect(friendsWithGame(friends, 'celeste')[0].entry.game.id).toBe('celeste');
    expect(friendsWithGame(friends, 'doom')).toEqual([]);
  });

  it('ranks high scores and leaves out friends who never played', () => {
    const friends = [friend('gabriel', { runner: 67 }), friend('mika', { jet: 4 })];
    const board = scoreBoard(40, friends, 'runner');
    expect(board.map((row) => row.friend?.id ?? 'you')).toEqual(['gabriel', 'you']);
    expect(scoreBoard(67, friends, 'runner')[0].friend).toBeNull();
    expect(scoreBoard(0, friends, 'runner')).toHaveLength(2);
  });

  it('says who a run passed and who is next', () => {
    const friends = [friend('gabriel', { runner: 67 }), friend('mika', { runner: 30 })];
    expect(rivalry(40, 10, friends, 'runner')).toMatchObject({ passed: [friends[1]], next: { best: 67 }, leading: false });
    // Passing someone only counts once.
    expect(rivalry(45, 40, friends, 'runner').passed).toEqual([]);
    expect(rivalry(80, 40, friends, 'runner')).toMatchObject({ passed: [friends[0]], next: null, leading: true });
    // A tie is not a pass, and it isn't the lead either.
    expect(rivalry(67, 50, friends, 'runner')).toMatchObject({ passed: [], next: null, leading: false });
    expect(rivalry(5, 0, [], 'runner')).toEqual({ passed: [], next: null, leading: false });
  });
});
