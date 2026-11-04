import { describe, expect, it } from 'vitest';
import { pickGame, rankGames } from './rank';

const game = (id: number, name: string, rest = {}) => ({ id, name, ...rest });

const released = (year: number) => ({ first_release_date: Date.UTC(year, 5, 1) / 1000 });

describe('pickGame', () => {
  it('tells a game from its remake by year', () => {
    const games = [game(1, 'Resident Evil', released(2002)), game(2, 'Resident Evil', released(1996))];
    expect(pickGame(games, { name: 'Resident Evil', year: 1996 })?.id).toBe(2);
    expect(pickGame(games, { name: 'Resident Evil', year: 2002 })?.id).toBe(1);
  });

  it('picks the better known game when two share a title and era', () => {
    const games = [
      game(1, 'Adventure', { ...released(1980), total_rating_count: 3 }),
      game(2, 'Adventure', { ...released(1980), total_rating_count: 90 }),
    ];
    expect(pickGame(games, { name: 'Adventure', year: 1980 })?.id).toBe(2);
  });

  it('prefers the exact title, then accepts a longer one', () => {
    const games = [game(1, 'Metroid Fusion', { ...released(1986), total_rating_count: 900 }), game(2, 'Metroid', released(1986))];
    expect(pickGame(games, { name: 'Metroid', year: 1986 })?.id).toBe(2);
    const fighter = [game(3, 'Street Fighter II: The World Warrior', released(1991))];
    expect(pickGame(fighter, { name: 'Street Fighter II', year: 1991 })?.id).toBe(3);
  });

  it('finds a game whose early access began years before', () => {
    expect(pickGame([game(1, "Baldur's Gate 3", released(2020))], { name: 'Baldur’s Gate 3', year: 2023 })?.id).toBe(1);
  });

  it('skips editions and bundles', () => {
    const games = [
      game(1, 'Halo: Combat Evolved', { ...released(2001), version_parent: 9 }),
      game(2, 'Halo: Combat Evolved', { ...released(2001), game_type: 3 }),
    ];
    expect(pickGame(games, { name: 'Halo: Combat Evolved', year: 2001 })).toBeNull();
  });

  it('returns nothing rather than a weak match or an undated game', () => {
    expect(pickGame([game(1, 'Home Pong', released(1975))], { name: 'Pong', year: 1975 })).toBeNull();
    expect(pickGame([game(1, 'Pong')], { name: 'Pong', year: 1972 })).toBeNull();
  });
});

describe('rankGames', () => {
  it('puts the exact title first, even from a long list of loose matches', () => {
    const fuzzy = [game(1, 'Sailor Moon S: Kotaete Moon Call!'), game(2, "Hunter's Moon"), game(3, 'To the Moon')];
    expect(rankGames([fuzzy], 'to the moon', 3)[0].name).toBe('To the Moon');
  });

  it('puts the better known game first when two share a title', () => {
    const games = [game(1, 'To the Moon', { total_rating_count: 2 }), game(2, 'To the Moon', { total_rating_count: 900 })];
    expect(rankGames([games], 'to the moon', 2).map((item) => item.id)).toEqual([2, 1]);
  });

  it('matches a title that is still being typed', () => {
    const games = [game(1, 'Moon Hunters', { total_rating_count: 500 }), game(2, 'To the Moon')];
    expect(rankGames([games], 'to the mo', 2)[0].name).toBe('To the Moon');
  });

  it('ignores case, accents, punctuation, and a leading article', () => {
    expect(rankGames([[game(1, 'Pokémon: Red'), game(2, 'Other')]], 'pokemon red', 2)[0].id).toBe(1);
    expect(rankGames([[game(1, 'Witcher Fan Game'), game(2, 'The Witcher')]], 'the witcher', 2)[0].id).toBe(2);
    expect(rankGames([[game(1, 'Soul Witcher'), game(2, 'The Witcher')]], 'witcher', 2)[0].id).toBe(2);
  });

  it('hides editions, bundles, and packs, but keeps other game types', () => {
    const games = [
      game(1, 'Yakuza 6', { game_type: 0 }),
      game(2, 'Yakuza 6: Launch Edition', { game_type: 0, version_parent: 1 }),
      game(3, 'Yakuza 6 Bundle', { game_type: 3 }),
      game(4, 'Yakuza 6 Pack', { game_type: 13 }),
      game(5, 'Yakuza 6 Remaster', { game_type: 9 }),
    ];
    expect(rankGames([games], 'yakuza 6', 10).map((item) => item.id)).toEqual([1, 5]);
  });

  it('removes duplicates across lists and respects the limit', () => {
    const list = [game(1, 'Doom'), game(2, 'Doom II'), game(3, 'Doom 3')];
    expect(rankGames([list, list], 'doom', 2)).toHaveLength(2);
    expect(rankGames([list, list], 'doom', 10)).toHaveLength(3);
  });
});
