import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_XP, LEVEL_GOLD, deriveGamer } from './gamer';
import { changeStatus, logSession, newEntry } from './library';
import type { Game, LibraryEntry } from './types';
import { WARDROBE_GENRES, genreEntryId } from './genres';
import { DAILY_PRACTICE_XP, NEW_PRACTICE, RUN_XP_CAP, applyRun, bestScore, loadPractice } from './practice';
import { DEFAULT_PROFILE, HAIRSTYLES, HAIR_COLORS, PIECES } from './wardrobe';

const NOW = '2026-11-03T12:00:00.000Z';
const game = (id: string, genres: string[]): Game => ({
  id,
  name: `Game ${id}`,
  year: 2020,
  platforms: [],
  developers: [],
  publishers: [],
  genres,
  themes: [],
  summary: null,
  coverUrl: null,
});
const played = (id: string, genres: string[], minutes: number): LibraryEntry =>
  logSession(newEntry(game(id, genres), 'backlog', NOW), { id: `s${id}`, minutes, playedOn: '2026-11-03' }, NOW);
const earned = (entries: LibraryEntry[], profile = DEFAULT_PROFILE) =>
  deriveGamer(entries, profile)
    .achievements.filter((item) => item.unlocked)
    .map((item) => item.id);

describe('wardrobe', () => {
  it('has three pieces in each of the 10 genres', () => {
    expect(PIECES).toHaveLength(30);
    expect(new Set(PIECES.map((piece) => piece.id)).size).toBe(30);
  });
  it('starts with no pieces owned and one piece per genre in the Shop', () => {
    const state = deriveGamer([], DEFAULT_PROFILE);
    const start = PIECES.filter((piece) => state.available.has(piece.id));
    expect(state.owned.size).toBe(0);
    expect(start).toHaveLength(WARDROBE_GENRES.length);
    expect(new Set(start.map((piece) => piece.genre)).size).toBe(WARDROBE_GENRES.length);
  });
  it('mixes outfit types and keeps prices equal at each level', () => {
    for (const level of [1, 3, 5]) {
      const tier = PIECES.filter((piece) => piece.shopLevel === level);
      expect(tier).toHaveLength(10);
      expect(new Set(tier.map((piece) => piece.price)).size).toBe(1);
      for (const slot of ['bottom', 'top', 'accessory']) {
        expect(tier.filter((piece) => piece.slot === slot).length).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('gives each genre one of every outfit type', () => {
    for (const genre of WARDROBE_GENRES) {
      const own = PIECES.filter((piece) => piece.genre === genre);
      expect(new Set(own.map((piece) => piece.slot)).size).toBe(3);
      expect(own.map((piece) => piece.shopLevel).sort()).toEqual([1, 3, 5]);
    }
  });
  it('adds a piece at genre level 3 and another at genre level 5', () => {
    const inShop = (minutes: number) =>
      [...deriveGamer([played('1', ['Platform'], minutes)], DEFAULT_PROFILE).available].filter((id) => id.endsWith('platform'));
    expect(inShop(149)).toEqual(['top-platform']);
    expect(inShop(150).sort()).toEqual(['acc-platform', 'top-platform']);
    expect(inShop(420)).toHaveLength(3);
  });
  it('counts a game toward each of its genres', () => {
    const { genres, stats } = deriveGamer([played('1', ['Platform', 'Puzzle'], 150)], DEFAULT_PROFILE);
    const minutes = (genre: string) => genres.find((item) => item.genre === genre)?.minutes;
    expect(minutes('Platformer')).toBe(150);
    expect(minutes('Puzzle')).toBe(150);
    expect(stats.minutesPlayed).toBe(150);
    expect(stats.genresExplored).toBe(2);
  });
  it('ignores equipped pieces she does not own', () => {
    const equipped = { ...DEFAULT_PROFILE.equipped, bottom: 'bottom-rpg' };
    expect(deriveGamer([], { ...DEFAULT_PROFILE, equipped }).equipped.bottom).toBeNull();
    const owned = { 'bottom-rpg': 60 };
    expect(deriveGamer([], { ...DEFAULT_PROFILE, equipped, owned }).equipped.bottom?.id).toBe('bottom-rpg');
  });
});

describe('practice', () => {
  const run = (score: number, device = 'keyboard', bestStreak = score) => ({ game: 'runner', device, score, bestStreak, mistakes: 0 });
  it('gives nothing for a run with no hits', () => {
    const { practice, reward } = applyRun(NEW_PRACTICE, run(0), '2026-11-03');
    expect(practice).toEqual(NEW_PRACTICE);
    expect(reward.xp).toBe(0);
  });
  it('caps XP per run', () => {
    expect(applyRun(NEW_PRACTICE, run(4), '2026-11-03').reward.xp).toBe(2);
    expect(applyRun(NEW_PRACTICE, run(500), '2026-11-03').reward.xp).toBe(RUN_XP_CAP);
  });
  it('stops XP at the daily limit, while runs keep counting, and resets the next day', () => {
    let record = NEW_PRACTICE;
    for (let i = 0; i < 8; i += 1) record = applyRun(record, run(40), '2026-11-03').practice;
    expect(record.xp).toBe(DAILY_PRACTICE_XP);
    expect(record.runs).toBe(8);
    const blocked = applyRun(record, run(90), '2026-11-03');
    expect(blocked.reward).toMatchObject({ xp: 0, limitReached: true, newBest: true });
    expect(bestScore(blocked.practice, 'runner')).toBe(90);
    expect(applyRun(record, run(40), '2026-11-04').reward.xp).toBe(RUN_XP_CAP);
  });
  it('keeps a separate high score for each minigame', () => {
    const first = applyRun(NEW_PRACTICE, run(20), '2026-11-03').practice;
    const second = applyRun(first, { ...run(7), game: 'twin-stick' }, '2026-11-03');
    expect(second.reward.newBest).toBe(true);
    expect(bestScore(second.practice, 'runner')).toBe(20);
    expect(bestScore(second.practice, 'twin-stick')).toBe(7);
  });
  it('carries over a best score from an older save', () => {
    expect(bestScore(loadPractice({ best: 14 }), 'runner')).toBe(14);
    expect(loadPractice(undefined)).toEqual(NEW_PRACTICE);
  });
  it('counts only the runner toward trying every controller, and pays more per drone', () => {
    const flight = { game: 'jet', device: 'mouse', score: 2, bestStreak: 0, mistakes: 0 };
    const result = applyRun(NEW_PRACTICE, flight, '2026-11-03');
    expect(result.practice.devices).toEqual([]);
    expect(result.reward.xp).toBe(6);
  });
  it('tracks personal bests', () => {
    const first = applyRun(NEW_PRACTICE, run(20), '2026-11-03');
    expect(first.reward.newBest).toBe(true);
    const second = applyRun(first.practice, run(5), '2026-11-03');
    expect(second.reward.newBest).toBe(false);
    expect(bestScore(second.practice, 'runner')).toBe(20);
  });
  it('adds practice XP to her overall level but not to genres', () => {
    const profile = { ...DEFAULT_PROFILE, practice: { ...NEW_PRACTICE, xp: 40, runs: 2, bests: { runner: 8 } } };
    const state = deriveGamer([], profile);
    expect(state.progress.total).toBe(40 + ACHIEVEMENT_XP);
    expect(state.genres.every((item) => item.total === 0)).toBe(true);
  });
  it('earns practice achievements', () => {
    const practice = { ...NEW_PRACTICE, runs: 5, bests: { runner: 60 }, bestStreak: 15, devices: ['playstation', 'xbox', 'keyboard'] };
    expect(earned([], { ...DEFAULT_PROFILE, practice })).toEqual(
      expect.arrayContaining(['first-run', 'runner-25', 'runner-60', 'runner-streak', 'all-controls']),
    );
  });
});

describe('appearance', () => {
  it('has art for every hairstyle in every color', () => {
    for (const style of HAIRSTYLES) {
      for (const color of HAIR_COLORS) {
        expect(existsSync(`src/assets/sprites/hair-${style.id}-${color.id}.png`), `${style.id} ${color.id}`).toBe(true);
      }
    }
  });
});

describe('gold', () => {
  it('starts at zero', () => {
    expect(deriveGamer([], DEFAULT_PROFILE).gold).toEqual({ earned: 0, spent: 0, balance: 0 });
  });
  it('pays more for harder achievements', () => {
    const gold = (id: string) => deriveGamer([], DEFAULT_PROFILE).achievements.find((item) => item.id === id)?.gold ?? 0;
    expect(gold('first-game')).toBeLessThan(gold('first-finish'));
    expect(gold('first-finish')).toBeLessThan(gold('every-genre'));
  });
  it('adds achievements and level-ups together', () => {
    const entry = newEntry(game('1', ['Puzzle']), 'backlog', NOW);
    const state = deriveGamer([played('2', ['Puzzle'], 240), entry], DEFAULT_PROFILE);
    const achievements = state.achievements.reduce((sum, item) => sum + (item.unlocked ? item.gold : 0), 0);
    expect(state.gold.earned).toBe(achievements + (state.progress.level - 1) * LEVEL_GOLD);
    expect(state.progress.level).toBeGreaterThan(1);
  });
  it('subtracts what she paid, even after a price changes', () => {
    const entries = [played('1', ['Puzzle'], 600)];
    const state = deriveGamer(entries, { ...DEFAULT_PROFILE, owned: { 'bottom-rpg': 41 } });
    expect(state.gold.spent).toBe(41);
    expect(state.gold.balance).toBe(state.gold.earned - 41);
  });
  it('keeps bought pieces and never shows less than zero when progress is removed', () => {
    const state = deriveGamer([], { ...DEFAULT_PROFILE, owned: { 'bottom-rpg': 60 } });
    expect(state.owned.has('bottom-rpg')).toBe(true);
    expect(state.gold.balance).toBe(0);
  });
  it('lets her buy a first piece early on', () => {
    const entry = played('1', ['Puzzle'], 60);
    const profile = { ...DEFAULT_PROFILE, customized: true, readEntries: ['genre-rpg'] };
    expect(deriveGamer([entry], profile).gold.balance).toBeGreaterThanOrEqual(60);
  });
  it('can pay for the full wardrobe in the long run, but not quickly', () => {
    const cost = PIECES.reduce((sum, piece) => sum + piece.price, 0);
    const sample = [played('1', ['Puzzle'], 2600), played('2', ['RPG'], 2600)];
    expect(deriveGamer(sample, DEFAULT_PROFILE).gold.earned).toBeLessThan(cost);
  });
});

describe('achievements', () => {
  const entries = [
    played('1', ['Platform'], 120),
    played('2', ['Platform'], 60),
    played('3', ['Role-playing (RPG)'], 150),
    changeStatus(newEntry(game('4', ['Puzzle']), 'backlog', NOW), 'finished', NOW),
    newEntry(game('5', ['Puzzle']), 'backlog', NOW),
  ];
  const { stats } = deriveGamer(entries, DEFAULT_PROFILE);

  it('picks the favorite genre by hours played, not by game count or XP', () => {
    expect(stats.favoriteGenre).toBe('Platformer');
  });
  it('counts time, finishes, and explored genres', () => {
    expect(stats.minutesPlayed).toBe(330);
    expect(stats.gamesFinished).toBe(1);
    expect(stats.genresExplored).toBe(2);
    expect(stats.backlogCount).toBe(1);
  });
  it('finds the most played game', () => {
    expect(stats.mostPlayed).toEqual({ name: 'Game 3', minutes: 150 });
  });
  it('has no favorite until time is logged', () => {
    expect(deriveGamer([newEntry(game('1', ['Puzzle']), 'backlog', NOW)], DEFAULT_PROFILE).stats.favoriteGenre).toBeNull();
  });
});

describe('achievements', () => {
  it('earns library and finishing achievements', () => {
    const entry = changeStatus(played('1', ['Platform'], 60), 'finished', NOW);
    expect(earned([entry])).toEqual(expect.arrayContaining(['first-game', 'first-hour', 'first-finish']));
  });
  it('needs 40 hours for the long game achievement', () => {
    expect(earned([changeStatus(played('1', ['Platform'], 2399), 'finished', NOW)])).not.toContain('long-haul');
    expect(earned([changeStatus(played('1', ['Platform'], 2400), 'finished', NOW)])).toContain('long-haul');
  });
  it('tracks character changes', () => {
    expect(earned([], { ...DEFAULT_PROFILE, customized: true, changedHair: true })).toEqual(
      expect.arrayContaining(['customized', 'hairstyle']),
    );
  });
  it('counts a first purchase', () => {
    expect(earned([], { ...DEFAULT_PROFILE, owned: { 'bottom-rpg': 60 } })).toContain('first-piece');
  });
  it('needs three owned pieces worn together for a full outfit', () => {
    const equipped = { accessory: 'acc-platform', top: 'top-platform', bottom: 'bottom-platform' };
    const owned = { 'acc-platform': 200, 'top-platform': 120, 'bottom-platform': 60 };
    expect(earned([], { ...DEFAULT_PROFILE, equipped, owned })).toContain('full-outfit');
    expect(earned([], { ...DEFAULT_PROFILE, equipped })).not.toContain('full-outfit');
  });
  it('tracks Codex reading', () => {
    const ids = WARDROBE_GENRES.map(genreEntryId);
    expect(earned([], { ...DEFAULT_PROFILE, readEntries: ids.slice(0, 1) })).toEqual(['first-entry']);
    expect(earned([], { ...DEFAULT_PROFILE, readEntries: ids })).toContain('genre-scholar');
  });
  it('tracks reading every console generation', () => {
    const readEntries = ['gen-1', 'gen-2', 'gen-3', 'gen-4', 'gen-5', 'gen-6', 'gen-7', 'gen-8', 'gen-9'];
    expect(earned([], { ...DEFAULT_PROFILE, readEntries })).toContain('time-traveler');
  });
  it('adds achievement XP to her overall level', () => {
    const state = deriveGamer([newEntry(game('1', ['Puzzle']), 'backlog', NOW)], DEFAULT_PROFILE);
    expect(state.progress.total).toBe(ACHIEVEMENT_XP);
  });
});
