import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { friendStore } from '../data';
import type { Friend } from '../domain/friends';

interface FriendsValue {
  friends: Friend[];
  loading: boolean;
  find(id: string): Friend | undefined;
  refresh(): void;
}

const FriendsContext = createContext<FriendsValue | null>(null);

// Friends' progress changes while she's away, so it reloads when the tab comes back.
export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);

  const refresh = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    friendStore
      .list()
      .then(setFriends)
      // Friends are extra, so a failed load keeps whatever was shown before.
      .catch(() => undefined)
      .finally(() => {
        busy.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const value = useMemo<FriendsValue>(
    () => ({ friends, loading, find: (id) => friends.find((friend) => friend.id === id), refresh }),
    [friends, loading, refresh],
  );
  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const value = useContext(FriendsContext);
  if (!value) throw new Error('useFriends must be used inside FriendsProvider');
  return value;
}
