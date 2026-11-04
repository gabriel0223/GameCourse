import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubGlobal('window', { location: { hash: '' } });
});

import { parseRoute } from './useHashRoute';

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
