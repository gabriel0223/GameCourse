import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BUILT_IN_QUESTS } from '../content/quests';
import { isDemo, myPlayerId, questStore } from '../data';
import { friendName } from '../components/FriendBits';
import { cleanQuest, findReply, mergeQuests, questStatus, replyIsNew, reviewQueue } from '../domain/quests';
import type { FoundReply, Player, Quest, QuestStatus, ReviewItem, Reviewer } from '../domain/quests';
import { strings } from '../strings';
import { useCodex } from './CodexContext';
import { useFriends } from './FriendsContext';
import { useLibrary } from './LibraryContext';

interface QuestsValue {
  quests: Quest[];
  ready: boolean;
  canEdit: boolean;
  find(id: string): Quest | undefined;
  forEntry(entryId: string): Quest[];
  reply(questId: string): FoundReply | null;
  status(questId: string): QuestStatus;
  hasNewReply(questId: string): boolean;
  // Turned-in quests waiting for this account's reply. Only filled for editors.
  queue: ReviewItem[];
  newReplies: number;
  save(quest: Quest): Promise<void>;
  remove(quest: Quest): Promise<void>;
}

const QuestsContext = createContext<QuestsValue | null>(null);

export function QuestsProvider({ children }: { children: ReactNode }) {
  const { canEdit } = useCodex();
  const { friends } = useFriends();
  const { profile } = useLibrary();
  const [saved, setSaved] = useState<Quest[]>([]);
  const [ready, setReady] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      questStore.list().then(setSaved, () => setSaved([])),
      myPlayerId().then(setMyId, () => setMyId(null)),
    ]).finally(() => setReady(true));
  }, []);

  const save = useCallback(async (quest: Quest) => {
    const clean = cleanQuest(quest);
    await questStore.save(clean);
    setSaved((current) => [...current.filter((item) => item.id !== clean.id), clean]);
  }, []);

  // Built-in quests can't be deleted, so they are hidden with a saved copy instead.
  const remove = useCallback(
    async (quest: Quest) => {
      if (quest.custom) {
        await questStore.remove(quest.id);
        setSaved((current) => current.filter((item) => item.id !== quest.id));
      } else {
        await save({ ...quest, hidden: true });
      }
    },
    [save],
  );

  const value = useMemo<QuestsValue>(() => {
    const quests = mergeQuests(BUILT_IN_QUESTS, saved);
    // Her own profile is included because preview mode has only one account, and it does no harm otherwise.
    const reviewers: Reviewer[] = [
      { name: profile.characterName || strings.friends.you, reviews: profile.questReviews },
      ...friends.map((friend) => ({ name: friendName(friend), reviews: friend.profile.questReviews })),
    ];
    const reply = (questId: string) => (myId ? findReply(myId, questId, reviewers) : null);
    const players: Player[] = [
      ...(isDemo && myId ? [{ id: myId, name: profile.characterName || strings.friends.you, records: profile.quests }] : []),
      ...friends.map((friend) => ({ id: friend.id, name: friendName(friend), records: friend.profile.quests })),
    ];
    const queue = canEdit ? reviewQueue(players, profile.questReviews) : [];
    const newReplies = Object.keys(profile.quests).filter((id) => replyIsNew(profile.quests[id], reply(id))).length;
    return {
      quests,
      ready,
      canEdit,
      find: (id) => quests.find((quest) => quest.id === id),
      forEntry: (entryId) => quests.filter((quest) => quest.entryId === entryId),
      reply,
      status: (questId) => questStatus(profile.quests[questId], reply(questId)),
      hasNewReply: (questId) => replyIsNew(profile.quests[questId], reply(questId)),
      queue,
      newReplies,
      save,
      remove,
    };
  }, [canEdit, friends, myId, profile, ready, remove, save, saved]);

  return <QuestsContext.Provider value={value}>{children}</QuestsContext.Provider>;
}

export function useQuests() {
  const value = useContext(QuestsContext);
  if (!value) throw new Error('useQuests must be used inside QuestsProvider');
  return value;
}
