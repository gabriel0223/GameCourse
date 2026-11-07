import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubGlobal('window', { location: { hash: '' } });
});

import { hrefs, parseRoute } from './useHashRoute';

describe('character links', () => {
  it('opens tabs by address', () => {
    expect(parseRoute('#/character')).toEqual({ view: 'character', tab: 'overview', slot: null });
    expect(parseRoute('#/character/achievements')).toEqual({ view: 'character', tab: 'achievements', slot: null });
    expect(parseRoute('#/character/wardrobe?slot=top')).toEqual({ view: 'character', tab: 'wardrobe', slot: 'top' });
  });

  it('keeps older links working', () => {
    expect(parseRoute('#/character/profile').view === 'character').toBe(true);
    expect(parseRoute('#/character/inventory')).toEqual({ view: 'character', tab: 'wardrobe', slot: null });
    expect(parseRoute('#/character/appearance')).toEqual({ view: 'character', tab: 'wardrobe', slot: null });
  });
});

describe('friend links', () => {
  it('opens the list, a profile, and its tabs', () => {
    expect(parseRoute('#/friends')).toEqual({ view: 'friends', id: null, tab: 'overview', list: 'playing' });
    expect(parseRoute('#/friends/abc')).toEqual({ view: 'friends', id: 'abc', tab: 'overview', list: 'playing' });
    expect(parseRoute('#/friends/abc/achievements')).toMatchObject({ id: 'abc', tab: 'achievements' });
    expect(parseRoute('#/friends/abc/library?list=finished')).toMatchObject({ tab: 'library', list: 'finished' });
  });

  it('builds links that read back the same way', () => {
    expect(parseRoute(hrefs.friend('a b', 'library'))).toMatchObject({ id: 'a b', tab: 'library' });
    expect(parseRoute(hrefs.friendList('x', 'dropped'))).toMatchObject({ id: 'x', tab: 'library', list: 'dropped' });
    expect(hrefs.friend('x')).toBe('#/friends/x');
  });
});
