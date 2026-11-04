import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES, GLOSSARY } from './codex';
import { searchCodex } from './search';

describe('Codex search', () => {
  it('finds words in the body of an entry and shows where', () => {
    const results = searchCodex(CODEX_ENTRIES, GLOSSARY, 'backward compatibility');
    expect(results.entries.length).toBeGreaterThan(0);
    expect(results.entries[0].snippet?.toLowerCase()).toContain('backward compatibility');
  });

  it('puts title matches ahead of body matches', () => {
    const { entries } = searchCodex(CODEX_ENTRIES, GLOSSARY, 'mario');
    expect(entries.length).toBeGreaterThan(10);
    expect(entries[0].entry.title.toLowerCase()).toContain('mario');
  });

  it('includes glossary terms and returns nothing for an empty search', () => {
    expect(searchCodex(CODEX_ENTRIES, GLOSSARY, 'respawn').terms.length).toBeGreaterThan(0);
    expect(searchCodex(CODEX_ENTRIES, GLOSSARY, '   ')).toEqual({ entries: [], terms: [] });
  });
});
