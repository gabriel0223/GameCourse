import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WARDROBE_GENRES, genreEntryId } from '../domain/genres';
import { CODEX_ENTRIES, GLOSSARY, findEntry } from './codex';
import { TIMELINE_GROUPS } from './timeline';

describe('Codex content', () => {
  it('has a guide for every wardrobe genre', () => {
    for (const genre of WARDROBE_GENRES) expect(findEntry(genreEntryId(genre))?.genre).toBe(genre);
  });
  it('has unique entry ids and terms', () => {
    expect(new Set(CODEX_ENTRIES.map((entry) => entry.id)).size).toBe(CODEX_ENTRIES.length);
    expect(new Set(GLOSSARY.map((item) => item.term)).size).toBe(GLOSSARY.length);
  });
  it('only links to entries that exist', () => {
    for (const entry of CODEX_ENTRIES) {
      for (const id of entry.related ?? []) expect(findEntry(id), `${entry.id} -> ${id}`).toBeDefined();
    }
  });
  it('has a scene for every entry', () => {
    for (const entry of CODEX_ENTRIES) {
      expect(existsSync(`src/assets/codex/${entry.id}.png`), entry.id).toBe(true);
    }
  });
  it('has all nine generations with consoles and innovations', () => {
    for (let n = 1; n <= 9; n++) {
      const entry = findEntry(`gen-${n}`);
      expect(entry?.timeline?.kind).toBe('generation');
      expect(entry?.sections.some((section) => section.heading === 'Innovations')).toBe(true);
      expect(entry?.sections.some((section) => section.consoles === n)).toBe(true);
      expect(CODEX_ENTRIES.filter((item) => item.console?.generation === n).length).toBeGreaterThanOrEqual(4);
    }
  });
  it('gives every generation games, with years so they can link to IGDB', () => {
    for (let n = 1; n <= 9; n++) {
      const games = findEntry(`gen-${n}`)?.sections.find((section) => section.games)?.games ?? [];
      expect(games.length, `gen-${n}`).toBeGreaterThanOrEqual(3);
      expect(games.length, `gen-${n}`).toBeLessThanOrEqual(12);
      expect(games.filter((game) => game.year).length, `gen-${n}`).toBeGreaterThanOrEqual(1);
    }
  });
  it('keeps timeline events in date order and in valid groups', () => {
    const events = CODEX_ENTRIES.filter((entry) => entry.timeline?.kind === 'event');
    expect(events.length).toBeGreaterThanOrEqual(30);
    const years = events.map((entry) => entry.timeline?.year ?? 0);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    for (const entry of events) {
      expect(entry.sections.every((section) => !section.heading), entry.id).toBe(true);
      const words = entry.sections.map((section) => section.text ?? '').join(' ').split(/\s+/).length;
      expect(words, entry.id).toBeGreaterThanOrEqual(120);
      expect(TIMELINE_GROUPS.some((group) => group.generation === entry.timeline?.generation)).toBe(true);
    }
  });
  it('gives every console an article and valid facts', () => {
    const consoles = CODEX_ENTRIES.filter((entry) => entry.category === 'consoles');
    expect(consoles.length).toBeGreaterThanOrEqual(46);
    for (const entry of consoles) {
      expect(entry.console?.maker, entry.id).toBeTruthy();
      expect(entry.console?.generation, entry.id).toBeGreaterThan(0);
      expect(entry.sections.every((section) => !section.heading), entry.id).toBe(true);
      const words = entry.sections.map((section) => section.text ?? '').join(' ').split(/\s+/).length;
      expect(words, entry.id).toBeGreaterThanOrEqual(120);
    }
  });
  it('gives every genre games to try', () => {
    for (const entry of CODEX_ENTRIES.filter((item) => item.category === 'genres')) {
      expect(entry.examples?.length).toBeGreaterThanOrEqual(4);
    }
  });
});
