import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from './codex';
import type { CodexEntry } from './codex';
import { emptyBlock, findProblem, fromDraft, newDraft, toDraft } from './drafts';
import { mergeCodex } from './mergeCodex';

const image = { src: 'data:image/png;base64,AAAA', alt: 'A boss fight' };

describe('Codex drafts', () => {
  it('keeps every built-in guide intact when opened and saved', () => {
    for (const entry of CODEX_ENTRIES) expect(fromDraft(toDraft(entry))).toEqual(entry);
  });
  it('keeps a custom timeline event in order', () => {
    const draft = newDraft('custom-1');
    draft.title = 'Test';
    draft.timeline = { kind: 'event', generation: 3, year: 1990, label: '1990' };
    expect(fromDraft(draft).timeline?.year).toBe(1990);
  });
  it('turns lines into game cards, with a year when one is given', () => {
    const draft = newDraft('custom-1');
    draft.title = 'Test';
    draft.blocks = [{ ...emptyBlock('games'), body: 'Pac-Man (1980)\nHome Pong (variations)' }];
    expect(fromDraft(draft).sections).toEqual([
      { games: [{ name: 'Pac-Man', year: 1980 }, { name: 'Home Pong (variations)' }] },
    ]);
  });
  it('turns lines into lists and tables', () => {
    const draft = newDraft('custom-1');
    draft.title = 'Test';
    draft.blocks = [
      { ...emptyBlock('list'), body: 'One\n\n Two ' },
      { ...emptyBlock('table'), body: 'A | B\n1 | 2' },
    ];
    expect(fromDraft(draft).sections).toEqual([
      { list: ['One', 'Two'] },
      { table: { headers: ['A', 'B'], rows: [['1', '2']] } },
    ]);
  });
  it('drops empty blocks', () => {
    const draft = newDraft('custom-1');
    draft.title = 'Test';
    expect(fromDraft(draft).sections).toEqual([]);
  });
  it('keeps image blocks with captions', () => {
    const draft = newDraft('custom-1');
    draft.title = 'Test';
    draft.blocks = [{ ...emptyBlock('image'), image: { ...image, caption: 'Round 2' } }];
    expect(fromDraft(draft).sections[0].image?.caption).toBe('Round 2');
  });
  it('requires a title, a chosen image, and image descriptions', () => {
    const draft = newDraft('custom-1');
    expect(findProblem(draft)).toBe('title');
    draft.title = 'Test';
    expect(findProblem(draft)).toBeNull();
    draft.blocks = [emptyBlock('image')];
    expect(findProblem(draft)).toBe('image');
    draft.blocks = [{ ...emptyBlock('image'), image: { ...image, alt: ' ' } }];
    expect(findProblem(draft)).toBe('description');
    draft.blocks = [];
    draft.heroImage = { ...image, alt: '' };
    expect(findProblem(draft)).toBe('description');
  });
});

describe('merging saved guides', () => {
  const builtIn = CODEX_ENTRIES.slice(0, 2);
  it('replaces edited guides without changing their order', () => {
    const edited: CodexEntry = { ...builtIn[1], title: 'Changed' };
    expect(mergeCodex(builtIn, [edited]).map((entry) => entry.title)).toEqual([builtIn[0].title, 'Changed']);
  });
  it('adds custom guides at the end', () => {
    const custom: CodexEntry = { id: 'custom-1', category: 'playing', title: 'Mine', summary: '', sections: [], custom: true };
    expect(mergeCodex(builtIn, [custom]).map((entry) => entry.title)).toContain('Mine');
  });
});
