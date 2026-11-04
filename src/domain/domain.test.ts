import { describe, expect, it } from 'vitest';
import { pickMainGenre } from './genres';
import { changeStatus, logSession, newEntry, removeSession } from './library';
import type { Game, PlaySession } from './types';
import { entryXp, levelFromXp, totalXp, xpToNextLevel } from './xp';

const NOW = '2026-11-03T12:00:00.000Z';
const game: Game = {
  id: '1',
  name: 'Test Game',
  year: 2020,
  platforms: ['PC (Microsoft Windows)'],
  developers: ['Dev'],
  publishers: ['Pub'],
  genres: ['Platform'],
  themes: [],
  summary: null,
  coverUrl: null,
};
const session = (id: string, minutes: number): PlaySession => ({ id, minutes, playedOn: '2026-11-03' });

describe('genre mapping', () => {
  it('uses horror themes before other genres', () => {
    expect(pickMainGenre(['Shooter'], ['Horror'])).toBe('Horror');
  });
  it('maps IGDB genres to wardrobe genres', () => {
    expect(pickMainGenre(['Role-playing (RPG)'], [])).toBe('RPG');
    expect(pickMainGenre(['Real Time Strategy (RTS)'], [])).toBe('Strategy');
    expect(pickMainGenre(['Simulator'], [])).toBe('Cozy');
  });
  it('falls back to Adventure', () => {
    expect(pickMainGenre(['Indie'], [])).toBe('Adventure');
  });
});

describe('XP', () => {
  it('has no hour cap', () => {
    const entry = logSession(newEntry(game, 'backlog', NOW), session('a', 60 * 200), NOW);
    expect(entryXp(entry)).toBe(20000);
  });
  it('rewards part of an hour', () => {
    const entry = logSession(newEntry(game, 'backlog', NOW), session('a', 30), NOW);
    expect(entryXp(entry)).toBe(50);
  });
  it('adds one finish bonus, and takes it back if undone', () => {
    const played = logSession(newEntry(game, 'backlog', NOW), session('a', 60), NOW);
    const finished = changeStatus(played, 'finished', NOW);
    expect(entryXp(finished)).toBe(600);
    expect(entryXp(changeStatus(finished, 'finished', NOW))).toBe(600);
    expect(entryXp(changeStatus(finished, 'playing', NOW))).toBe(100);
  });
  it('gives a little XP for dropping a game', () => {
    expect(entryXp(newEntry(game, 'dropped', NOW))).toBe(50);
  });
  it('adds up across games', () => {
    const a = logSession(newEntry(game, 'backlog', NOW), session('a', 60), NOW);
    const b = newEntry({ ...game, id: '2' }, 'finished', NOW);
    expect(totalXp([a, b])).toBe(600);
  });
});

describe('levels', () => {
  it('starts at level 1', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, intoLevel: 0, needed: 100, total: 0 });
  });
  it('levels up at the exact boundary', () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(249).level).toBe(2);
    expect(levelFromXp(250).level).toBe(3);
  });
  it('asks for more XP at each level', () => {
    expect(xpToNextLevel(2)).toBeGreaterThan(xpToNextLevel(1));
  });
});

describe('status rules', () => {
  it('moves backlog games to Playing when time is logged', () => {
    expect(logSession(newEntry(game, 'backlog', NOW), session('a', 10), NOW).status).toBe('playing');
  });
  it('moves dropped games back to Playing when time is logged', () => {
    expect(logSession(newEntry(game, 'dropped', NOW), session('a', 10), NOW).status).toBe('playing');
  });
  it('keeps finished games finished when time is logged', () => {
    const entry = logSession(newEntry(game, 'finished', NOW), session('a', 10), NOW);
    expect(entry.status).toBe('finished');
    expect(entry.finishedAt).toBe(NOW);
  });
  it('keeps the first finish date', () => {
    const finished = newEntry(game, 'finished', NOW);
    expect(changeStatus(finished, 'finished', '2027-01-01T00:00:00.000Z').finishedAt).toBe(NOW);
  });
  it('removes a logged session and its XP', () => {
    const played = logSession(newEntry(game, 'backlog', NOW), session('a', 60), NOW);
    expect(entryXp(removeSession(played, 'a', NOW))).toBe(0);
  });
});
