import { describe, expect, it } from 'vitest';
import { deriveGamer } from '../domain/gamer';
import { applyQuiz } from '../domain/quiz';
import type { QuizRecords } from '../domain/quiz';
import { DEFAULT_PROFILE } from '../domain/wardrobe';
import { originalArt } from './art';
import { CODEX_ENTRIES, findEntry } from './codex';
import type { CodexEntry } from './codex';
import { ALL_PATHS, ERAS, PATHS, PATH_GOLD_PER_STOP, featuredPaths, homeOf, nextChoices, pathEntries, pathsWith } from './paths';

const entry = (id: string) => findEntry(id) as CodexEntry;

describe('paths', () => {
  it('only uses entries that exist, without repeating a stop', () => {
    for (const path of ALL_PATHS) {
      expect(path.entryIds.filter((id) => !findEntry(id))).toEqual([]);
      expect(new Set(path.entryIds).size).toBe(path.entryIds.length);
    }
  });

  it('has art for every path', () => {
    for (const path of PATHS) expect(originalArt(path.art ?? '')).toBeTruthy();
  });

  it('covers every built-in entry', () => {
    const covered = new Set(ALL_PATHS.flatMap((path) => path.entryIds));
    expect(CODEX_ENTRIES.filter((item) => !covered.has(item.id))).toEqual([]);
  });

  it('lets one entry sit on several paths', () => {
    expect(pathsWith(entry('console-genesis')).map((path) => path.id)).toEqual(['rise-and-fall-of-sega', 'era-4']);
  });

  it('keeps events and consoles of an era together', () => {
    expect(homeOf(entry('gen-3'))?.id).toBe('era-3');
    expect(homeOf(entry('console-nes'))?.id).toBe('era-3');
    expect(homeOf(entry('playing-sticks'))?.id).toBe('playing');
  });

  it('adds guides written in the editor to the end of their path', () => {
    const custom: CodexEntry = { ...entry('playing-sticks'), id: 'mine', custom: true };
    const path = PATHS[0];
    expect(pathEntries(path, [...CODEX_ENTRIES, custom]).slice(-1)[0].id).toBe('mine');
    expect(path.entryIds).not.toContain('mine');
  });

  it('finishes a path by passing its quiz, not by reading it', () => {
    const path = PATHS.find((item) => item.id === 'industry');
    if (!path) throw new Error('missing path');
    const total = path.entryIds.length;
    const read = deriveGamer([], { ...DEFAULT_PROFILE, readEntries: path.entryIds });
    expect(read.paths.find((item) => item.id === 'industry')?.done).toBe(false);
    expect(read.paths.find((item) => item.id === 'industry')?.read).toBe(total);

    const failed = deriveGamer([], { ...DEFAULT_PROFILE, quizzes: applyQuiz({}, 'industry', 3, total) });
    expect(failed.paths.find((item) => item.id === 'industry')?.done).toBe(false);

    const passed = deriveGamer([], { ...DEFAULT_PROFILE, quizzes: applyQuiz({}, 'industry', total - 1, total) });
    expect(passed.paths.find((item) => item.id === 'industry')?.done).toBe(true);
    const achievementGold = passed.achievements.reduce((sum, item) => sum + (item.unlocked ? item.gold : 0), 0);
    expect(passed.gold.earned - achievementGold).toBe(total * PATH_GOLD_PER_STOP);
  });

  it('still finishes an era by reading it', () => {
    const era = ERAS.find((item) => item.generation === 4);
    if (!era) throw new Error('missing era');
    const state = deriveGamer([], { ...DEFAULT_PROFILE, readEntries: era.entryIds });
    expect(state.paths.find((item) => item.id === era.id)?.done).toBe(true);
  });

  it('keeps a pass after a worse attempt, and keeps the best score', () => {
    const records = applyQuiz(applyQuiz({}, 'playing', 6, 6), 'playing', 1, 6);
    expect(records.playing).toEqual({ best: 6, total: 6, attempts: 2, passed: true });
  });

  it('awards quiz achievements', () => {
    const earned = (quizzes: QuizRecords) =>
      deriveGamer([], { ...DEFAULT_PROFILE, quizzes })
        .achievements.filter((item) => item.unlocked)
        .map((item) => item.id);
    expect(earned(applyQuiz({}, 'playing', 5, 6))).toEqual(['first-quiz']);
    expect(earned(applyQuiz({}, 'playing', 6, 6))).toEqual(['first-quiz', 'perfect-quiz']);
    const all = PATHS.reduce((records, path) => applyQuiz(records, path.id, path.entryIds.length - 1, path.entryIds.length), {} as QuizRecords);
    expect(earned(all)).toEqual(expect.arrayContaining(['three-paths', 'six-paths']));
  });

  it('features paths in progress first', () => {
    const last = PATHS[PATHS.length - 1];
    expect(featuredPaths(last.entryIds.slice(0, 1))[0].id).toBe(last.id);
    expect(featuredPaths(last.entryIds, [last.id])[0].id).not.toBe(last.id);
    expect(featuredPaths([])).toHaveLength(3);
  });
});

describe('next choices', () => {
  it('offers unread places first and never the entry itself', () => {
    const read = ['playing-dualsense'];
    const choices = nextChoices(entry('playing-buttons'), CODEX_ENTRIES, read);
    expect(choices).toHaveLength(3);
    expect(choices.map((item) => item.entry.id)).not.toContain('playing-buttons');
    expect(choices[0].entry.id).not.toBe('playing-dualsense');
  });

  it('moves forward through time for history entries', () => {
    const [first] = nextChoices(entry('console-nes'), CODEX_ENTRIES, []);
    expect(first.reason).toBe('later');
  });
});
