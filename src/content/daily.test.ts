import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from './codex';
import { entryExcerpt, entryOfTheDay, excerpt } from './daily';

const day = (offset: number) => new Date(2026, 10, 4 + offset, 12);

describe('entry of the day', () => {
  it('stays the same all day', () => {
    const morning = entryOfTheDay(CODEX_ENTRIES, new Date(2026, 10, 4, 0, 5));
    const night = entryOfTheDay(CODEX_ENTRIES, new Date(2026, 10, 4, 23, 55));
    expect(morning?.id).toBe(night?.id);
  });

  it('shows every entry once before repeating', () => {
    const ids = CODEX_ENTRIES.map((_, offset) => entryOfTheDay(CODEX_ENTRIES, day(offset))?.id);
    expect(new Set(ids).size).toBe(CODEX_ENTRIES.length);
  });

  it('handles an empty list', () => {
    expect(entryOfTheDay([], day(0))).toBeUndefined();
  });
});

describe('excerpt', () => {
  it('leaves short text alone', () => {
    expect(excerpt('A short paragraph.', 100)).toBe('A short paragraph.');
  });

  it('prefers to end on a full sentence', () => {
    expect(excerpt('One two three four five. Six seven eight nine ten eleven.', 35)).toBe('One two three four five.');
  });

  it('cuts at a word when no sentence fits', () => {
    expect(excerpt('One two three four five six seven eight nine ten', 20)).toBe('One two three four…');
  });

  it('keeps every entry within the limit', () => {
    for (const entry of CODEX_ENTRIES) expect(entryExcerpt(entry).length).toBeLessThanOrEqual(321);
  });
});
