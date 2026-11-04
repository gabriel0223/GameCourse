import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WARDROBE_GENRES, genreEntryId } from '../domain/genres';
import { CODEX_ENTRIES, GLOSSARY, findEntry } from './codex';
import type { CodexEntry } from './codex';
import { ENTRY_GAMES } from './entryGames';
import { mergeCodex } from './mergeCodex';
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
      expect(entry.sections.every((section) => !section.heading || section.games), entry.id).toBe(true);
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
      expect(entry.sections.every((section) => !section.heading || section.games), entry.id).toBe(true);
      const words = entry.sections.map((section) => section.text ?? '').join(' ').split(/\s+/).length;
      expect(words, entry.id).toBeGreaterThanOrEqual(120);
    }
  });
  it('gives every entry on a path at least two paragraphs, like the history entries', () => {
    for (const entry of CODEX_ENTRIES) {
      expect(entry.sections.filter((section) => section.text).length, entry.id).toBeGreaterThanOrEqual(2);
      const words = entry.sections.map((section) => section.text ?? '').join(' ').split(/\s+/).length;
      expect(words, entry.id).toBeGreaterThanOrEqual(90);
    }
  });
  it('lists only games an entry talks about, within what one lookup allows', () => {
    const plain = (text: string) => text.toLowerCase().replace(/’/g, "'");
    const missing: string[] = [];
    const nicknames: Record<string, string> = {
      "Bonk's Adventure": 'Bonk',
      "The King of Fighters '94": 'The King of Fighters',
      'The Witcher 3: Wild Hunt': 'The Witcher 3',
      'Sonic the Hedgehog': 'Sonic',
      'Phoenix Wright: Ace Attorney': 'Phoenix Wright',
      'Ghost of Yōtei': 'Ghost of Yotei',
      'PUBG: Battlegrounds': "PlayerUnknown's Battlegrounds",
      'Alex Kidd in Miracle World': 'Alex Kidd',
      'The Need for Speed': 'Need for Speed',
      'NiGHTS into Dreams': 'NiGHTS into Dreams',
      'Halo: Combat Evolved': 'Halo',
      'Geometry Wars': 'Geometry Wars',
      'Pokémon Red': 'Pokémon',
      'Pokémon Ruby': 'Pokémon Ruby',
      'Pokémon X': 'Pokémon X',
      'Fire Emblem: Awakening': 'Fire Emblem Awakening',
      'Uncharted 2': 'Uncharted 2',
      'Metal Gear Solid 2': 'Metal Gear Solid 2',
      'Sonic Adventure 2': 'Sonic Adventure 2',
      'Dragon Quest VIII': 'Dragon Quest VIII',
    };
    for (const [id, games] of Object.entries(ENTRY_GAMES)) {
      const entry = findEntry(id);
      expect(entry, id).toBeDefined();
      expect(games.length, id).toBeLessThanOrEqual(12);
      const text = plain(entry?.sections.map((section) => section.text ?? '').join(' ') ?? '');
      for (const game of games) {
        const names = [game.name, game.name.replace(/^The /, ''), game.name.split(': ').pop() ?? '', nicknames[game.name] ?? ''];
        if (!names.filter(Boolean).some((name) => text.includes(plain(name)))) missing.push(`${id}: ${game.name}`);
      }
    }
    expect(missing).toEqual([]);
  });
  it('keeps game cards on entries edited before they had any', () => {
    const original = findEntry('event-sonic') as CodexEntry;
    const edited = { ...original, sections: original.sections.filter((section) => !section.games) };
    const merged = mergeCodex(CODEX_ENTRIES, [edited]).find((entry) => entry.id === 'event-sonic');
    expect(merged?.sections.some((section) => section.games)).toBe(true);
  });
  it('gives every genre games to try', () => {
    for (const entry of CODEX_ENTRIES.filter((item) => item.category === 'genres')) {
      const games = entry.sections.find((section) => section.games)?.games ?? [];
      expect(games.length, entry.id).toBeGreaterThanOrEqual(4);
      expect(games.every((game) => game.year), entry.id).toBe(true);
    }
  });
});
