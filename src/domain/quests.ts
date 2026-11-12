// Quests are small things to go and do, usually play something, then write a few lines about it.
// Each quest sits on one Codex entry. Turning one in completes it and pays its gold right away.
// An editor can then reply with a note. There is no failing or redoing a quest.

export interface Quest {
  id: string;
  // The Codex entry the quest belongs to.
  entryId: string;
  title: string;
  // What to go and do.
  task: string;
  // One question to answer afterwards. Blank means a free answer.
  question: string;
  gold: number;
  // Roughly how long it takes, from QUEST_TIMES. Quests saved before this existed have none.
  minutes?: number;
  // Built-in quests can't be deleted, so removing one saves a hidden copy.
  hidden?: boolean;
  // True for quests made in the app rather than shipped with it.
  custom?: boolean;
}

// Her turned-in quest, saved in her profile. The title, entry, and gold are copied
// so a later change to the quest can't change what she already earned.
export interface QuestRecord {
  title: string;
  entryId: string;
  // The entry's Codex category, such as genres or people.
  category: string;
  gold: number;
  answer: string;
  submittedAt: string;
  updatedAt: string;
  // When she first opened the reply.
  replySeenAt: string | null;
}

// A reply, saved in the reviewer's own profile under reviewKey().
export interface QuestReview {
  note: string;
  reviewedAt: string;
}

export const DEFAULT_QUEST_GOLD = 40;

// The time tags an editor picks from, and the stops on the time filter. The last one means four hours or more.
export const QUEST_TIMES = [15, 30, 60, 120, 240] as const;
export const DEFAULT_QUEST_MINUTES = 30;
export const MAX_QUEST_GOLD = 500;
export const ANSWER_LIMIT = 6000;

export const reviewKey = (playerId: string, questId: string) => `${playerId}:${questId}`;

export function cleanQuest(quest: Quest): Quest {
  const gold = Math.round(Number.isFinite(quest.gold) ? quest.gold : DEFAULT_QUEST_GOLD);
  return {
    ...quest,
    title: quest.title.trim().replace(/\s+/g, ' '),
    task: quest.task.trim(),
    question: quest.question.trim(),
    gold: Math.min(MAX_QUEST_GOLD, Math.max(0, gold)),
    minutes: QUEST_TIMES.find((option) => option === quest.minutes),
  };
}

export const questIsValid = (quest: Quest) => Boolean(quest.entryId && quest.title.trim() && quest.task.trim());

// Saved quests replace built-in ones with the same id. Hidden ones drop out.
export function mergeQuests(builtIn: Quest[], saved: Quest[]): Quest[] {
  const byId = new Map(builtIn.map((quest) => [quest.id, quest]));
  for (const quest of saved) byId.set(quest.id, quest);
  return [...byId.values()].filter((quest) => !quest.hidden);
}

// The random part means a deleted quest's id is never reused, so old answers can't attach to a new quest.
export function newQuestId(title: string, random: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `quest-${slug ? `${slug}-` : ''}${random}`;
}

export function turnIn(
  records: Record<string, QuestRecord>,
  quest: Quest,
  answer: string,
  now: string,
  category: string,
): Record<string, QuestRecord> {
  const text = answer.trim().slice(0, ANSWER_LIMIT);
  const existing = records[quest.id];
  const record: QuestRecord = existing
    ? { ...existing, answer: text, updatedAt: now }
    : {
        title: quest.title,
        entryId: quest.entryId,
        category,
        gold: quest.gold,
        answer: text,
        submittedAt: now,
        updatedAt: now,
        replySeenAt: null,
      };
  return { ...records, [quest.id]: record };
}

export const questGold = (records: Record<string, QuestRecord>) =>
  Object.values(records).reduce((sum, record) => sum + record.gold, 0);

// Anyone whose profile may hold a reply: her own profile in preview mode, and every friend.
export interface Reviewer {
  name: string;
  reviews: Record<string, QuestReview>;
}

export interface FoundReply extends QuestReview {
  from: string;
}

export function findReply(playerId: string, questId: string, reviewers: Reviewer[]): FoundReply | null {
  const key = reviewKey(playerId, questId);
  const replies = reviewers
    .filter((reviewer) => reviewer.reviews[key])
    .map((reviewer) => ({ ...reviewer.reviews[key], from: reviewer.name }));
  return replies.sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0] ?? null;
}

export type QuestStatus = 'open' | 'waiting' | 'replied';

export function questStatus(record: QuestRecord | undefined, reply: FoundReply | null): QuestStatus {
  if (!record) return 'open';
  return reply ? 'replied' : 'waiting';
}

export const replyIsNew = (record: QuestRecord | undefined, reply: FoundReply | null) =>
  Boolean(record && reply && !record.replySeenAt);

// Someone who turns in quests, as the reviewer sees them.
export interface Player {
  id: string;
  name: string;
  records: Record<string, QuestRecord>;
}

export interface ReviewItem {
  player: Player;
  questId: string;
  record: QuestRecord;
}

// Turned-in quests the reviewer hasn't replied to yet, oldest first.
export function reviewQueue(players: Player[], reviews: Record<string, QuestReview>): ReviewItem[] {
  return players
    .flatMap((player) =>
      Object.entries(player.records).map(([questId, record]) => ({ player, questId, record })),
    )
    .filter((item) => !reviews[reviewKey(item.player.id, item.questId)])
    .sort((a, b) => a.record.submittedAt.localeCompare(b.record.submittedAt));
}

// A small, stable number for a string, so the daily pick only changes with the date.
function seed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// One open quest for today. Quests on entries she has read come first, since they
// follow on from something she already knows. Each reroll moves to the next one.
export function dailyQuest(
  quests: Quest[],
  records: Record<string, QuestRecord>,
  readEntries: string[],
  date: string,
  reroll: number,
): Quest | null {
  const open = quests.filter((quest) => !records[quest.id]);
  if (open.length === 0) return null;
  const order = (quest: Quest) => seed(`${date}|${quest.id}`);
  const read = new Set(readEntries);
  const sorted = [...open].sort(
    (a, b) => Number(read.has(b.entryId)) - Number(read.has(a.entryId)) || order(a) - order(b) || a.id.localeCompare(b.id),
  );
  return sorted[((reroll % sorted.length) + sorted.length) % sorted.length];
}

// Whether a quest fits the time filter, from min to max minutes, both ends included.
// A quest with no time tag only shows while the filter covers every length.
export function fitsTime(quest: Quest, min: number, max: number): boolean {
  const full = min <= QUEST_TIMES[0] && max >= QUEST_TIMES[QUEST_TIMES.length - 1];
  if (quest.minutes === undefined) return full;
  return quest.minutes >= min && quest.minutes <= max;
}

// Open quests that follow on from her studies: entries she has read, and stops on
// paths she has started but not finished yet.
export function questsForYou(
  quests: Quest[],
  records: Record<string, QuestRecord>,
  readEntries: string[],
  startedPathStops: string[],
): Quest[] {
  const near = new Set([...readEntries, ...startedPathStops]);
  return quests.filter((quest) => !records[quest.id] && near.has(quest.entryId));
}
