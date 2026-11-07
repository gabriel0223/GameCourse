import { bestScore } from './practice';
import type { LibraryEntry } from './types';
import type { CharacterProfile } from './wardrobe';

// Every other account is a friend. Their data is read-only here.
export interface Friend {
  id: string;
  profile: CharacterProfile;
  entries: LibraryEntry[];
}

export interface FriendGame {
  friend: Friend;
  entry: LibraryEntry;
}

export function friendsWithGame(friends: Friend[], gameId: string): FriendGame[] {
  return friends.flatMap((friend) => {
    const entry = friend.entries.find((item) => item.game.id === gameId);
    return entry ? [{ friend, entry }] : [];
  });
}

export interface ScoreRow {
  // Null is her own row.
  friend: Friend | null;
  best: number;
}

// Her row and every friend with a score, highest first. On a tie her row comes first.
export function scoreBoard(ownBest: number, friends: Friend[], game: string): ScoreRow[] {
  const rows: ScoreRow[] = [
    { friend: null, best: ownBest },
    ...friends.map((friend) => ({ friend, best: bestScore(friend.profile.practice, game) })).filter((row) => row.best > 0),
  ];
  return rows.sort((a, b) => b.best - a.best || Number(a.friend !== null) - Number(b.friend !== null));
}

export interface Rivalry {
  // Friends whose best she passed for the first time with this run.
  passed: Friend[];
  // The closest friend still ahead of her best, if any.
  next: { friend: Friend; best: number } | null;
  // True when at least one friend has a score and hers is above all of them.
  leading: boolean;
}

export function rivalry(score: number, previousBest: number, friends: Friend[], game: string): Rivalry {
  const bests = friends
    .map((friend) => ({ friend, best: bestScore(friend.profile.practice, game) }))
    .filter((item) => item.best > 0);
  const best = Math.max(score, previousBest);
  const passed = bests.filter((item) => score > item.best && previousBest <= item.best).map((item) => item.friend);
  const ahead = bests.filter((item) => item.best > best).sort((a, b) => a.best - b.best);
  const leading = bests.length > 0 && bests.every((item) => item.best < best);
  return { passed, next: ahead[0] ?? null, leading };
}
