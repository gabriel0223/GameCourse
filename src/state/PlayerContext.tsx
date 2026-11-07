import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { deriveGamer } from '../domain/gamer';
import type { GamerState } from '../domain/gamer';
import type { Friend } from '../domain/friends';
import type { LibraryEntry } from '../domain/types';
import type { CharacterProfile } from '../domain/wardrobe';
import { useLibrary } from './LibraryContext';
import { hrefs } from '../useHashRoute';

// The player whose Character screens are showing: her own, or a friend's to look at.
export interface Player {
  friend: Friend | null;
  profile: CharacterProfile;
  entries: LibraryEntry[];
  gamer: GamerState;
  links: { library: string; achievements: string };
}

const PlayerContext = createContext<Player | null>(null);

export function FriendPlayer({ friend, children }: { friend: Friend; children: ReactNode }) {
  const value = useMemo<Player>(
    () => ({
      friend,
      profile: friend.profile,
      entries: friend.entries,
      gamer: deriveGamer(friend.entries, friend.profile),
      links: { library: hrefs.friend(friend.id, 'library'), achievements: hrefs.friend(friend.id, 'achievements') },
    }),
    [friend],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

const OWN_LINKS = { library: '#/', achievements: hrefs.characterTab('achievements') };

export function usePlayer(): Player {
  const friend = useContext(PlayerContext);
  const { profile, entries, gamer } = useLibrary();
  return friend ?? { friend: null, profile, entries, gamer, links: OWN_LINKS };
}
