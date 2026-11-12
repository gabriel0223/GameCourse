import { describe, expect, it } from 'vitest';
import { BUILT_IN_QUESTS } from '../content/quests';
import { CODEX_ENTRIES } from '../content/codex';
import { deriveGamer } from './gamer';
import {
  cleanQuest,
  dailyQuest,
  findReply,
  fitsTime,
  mergeQuests,
  questsForYou,
  newQuestId,
  questGold,
  questStatus,
  replyIsNew,
  reviewKey,
  reviewQueue,
  turnIn,
} from './quests';
import type { Quest, QuestRecord } from './quests';
import { DEFAULT_PROFILE, restoreProfile } from './wardrobe';

const quest = (id: string, entryId = 'genre-rpg', gold = 40): Quest => ({
  id,
  entryId,
  title: `Quest ${id}`,
  task: 'Play something.',
  question: 'How was it?',
  gold,
});

const T1 = '2026-11-12T10:00:00.000Z';
const T2 = '2026-11-13T10:00:00.000Z';

describe('built-in quests', () => {
  it('sit on real Codex entries and have unique ids', () => {
    const ids = new Set(CODEX_ENTRIES.map((entry) => entry.id));
    for (const item of BUILT_IN_QUESTS) expect(ids.has(item.entryId), item.id).toBe(true);
    expect(new Set(BUILT_IN_QUESTS.map((item) => item.id)).size).toBe(BUILT_IN_QUESTS.length);
  });

  it('each have a time tag', () => {
    for (const item of BUILT_IN_QUESTS) expect(cleanQuest(item).minutes, item.id).toBe(item.minutes);
  });

  it('each ask one question', () => {
    for (const item of BUILT_IN_QUESTS) expect(item.question.trim().length, item.id).toBeGreaterThan(0);
  });
});

describe('quest list', () => {
  it('lets saved quests replace and hide built-in ones', () => {
    const merged = mergeQuests(
      [quest('a'), quest('b')],
      [{ ...quest('a'), title: 'Changed' }, { ...quest('b'), hidden: true }, { ...quest('c'), custom: true }],
    );
    expect(merged.map((item) => item.id)).toEqual(['a', 'c']);
    expect(merged[0].title).toBe('Changed');
  });

  it('cleans what an editor typed', () => {
    const clean = cleanQuest({ ...quest('a'), title: '  Gotta   go  fast ', gold: 9999 });
    expect(clean.title).toBe('Gotta go fast');
    expect(clean.gold).toBe(500);
    expect(cleanQuest({ ...quest('a'), gold: -3 }).gold).toBe(0);
    expect(cleanQuest({ ...quest('a'), gold: Number.NaN }).gold).toBe(40);
  });

  it('makes readable ids that never repeat', () => {
    expect(newQuestId('Gotta go fast!', 'ab12cd')).toBe('quest-gotta-go-fast-ab12cd');
    expect(newQuestId('???', 'ab12cd')).toBe('quest-ab12cd');
  });
});

describe('turning in', () => {
  it('copies the reward so later changes to the quest leave it alone', () => {
    const records = turnIn({}, quest('a', 'genre-rpg', 60), '  It was fun.  ', T1, 'genres');
    expect(records.a).toMatchObject({ gold: 60, answer: 'It was fun.', submittedAt: T1, category: 'genres', replySeenAt: null });
    const edited = turnIn(records, quest('a', 'genre-rpg', 999), 'Actually, great.', T2, 'genres');
    expect(edited.a).toMatchObject({ gold: 60, answer: 'Actually, great.', submittedAt: T1, updatedAt: T2 });
  });

  it('pays gold and achievements through the profile', () => {
    const before = deriveGamer([], DEFAULT_PROFILE);
    let records: Record<string, QuestRecord> = {};
    records = turnIn(records, quest('a', 'genre-rpg', 40), 'x', T1, 'genres');
    const after = deriveGamer([], { ...DEFAULT_PROFILE, quests: records });
    const first = after.achievements.find((item) => item.id === 'first-quest')!;
    expect(first.unlocked).toBe(true);
    expect(after.gold.earned - before.gold.earned).toBe(40 + first.gold);
    expect(questGold(records)).toBe(40);
  });

  it('counts categories for the explorer achievement', () => {
    let records: Record<string, QuestRecord> = {};
    records = turnIn(records, quest('a', 'genre-rpg'), 'x', T1, 'genres');
    records = turnIn(records, quest('b', 'person-kojima'), 'x', T1, 'people');
    records = turnIn(records, quest('c', 'event-sonic'), 'x', T1, 'history');
    const three = deriveGamer([], { ...DEFAULT_PROFILE, quests: records }).achievements.find((item) => item.id === 'quest-explorer')!;
    expect(three.unlocked).toBe(false);
    expect(three.progress).toEqual({ current: 3, target: 4 });
    records = turnIn(records, quest('d', 'playing-sticks'), 'x', T1, 'playing');
    const four = deriveGamer([], { ...DEFAULT_PROFILE, quests: records }).achievements.find((item) => item.id === 'quest-explorer')!;
    expect(four.unlocked).toBe(true);
  });

  it('fills in quest fields for profiles saved before quests existed', () => {
    const old = { ...DEFAULT_PROFILE } as Partial<typeof DEFAULT_PROFILE>;
    delete old.quests;
    delete old.questReviews;
    const restored = restoreProfile(old);
    expect(restored.quests).toEqual({});
    expect(restored.questReviews).toEqual({});
  });
});

describe('replies', () => {
  const records = turnIn({}, quest('a'), 'Fun!', T1, 'genres');

  it('finds the reply meant for this player and quest', () => {
    const reviewers = [
      { name: 'Her', reviews: {} },
      { name: 'Gabriel', reviews: { [reviewKey('her', 'a')]: { note: 'Nice!', reviewedAt: T2 } } },
    ];
    expect(findReply('her', 'a', reviewers)).toEqual({ note: 'Nice!', reviewedAt: T2, from: 'Gabriel' });
    expect(findReply('someone-else', 'a', reviewers)).toBeNull();
    expect(findReply('her', 'b', reviewers)).toBeNull();
  });

  it('moves from open to waiting to replied, and the reply is new until seen', () => {
    const reply = { note: '', reviewedAt: T2, from: 'Gabriel' };
    expect(questStatus(undefined, null)).toBe('open');
    expect(questStatus(records.a, null)).toBe('waiting');
    expect(questStatus(records.a, reply)).toBe('replied');
    expect(replyIsNew(records.a, reply)).toBe(true);
    expect(replyIsNew({ ...records.a, replySeenAt: T2 }, reply)).toBe(false);
  });

  it('queues answers without a reply, oldest first', () => {
    const her = {
      id: 'her',
      name: 'Her',
      records: {
        ...turnIn({}, quest('late'), 'x', T2, 'genres'),
        ...turnIn({}, quest('early'), 'x', T1, 'genres'),
        ...turnIn({}, quest('done'), 'x', T1, 'genres'),
      },
    };
    const queue = reviewQueue([her], { [reviewKey('her', 'done')]: { note: 'ok', reviewedAt: T2 } });
    expect(queue.map((item) => item.questId)).toEqual(['early', 'late']);
  });
});

describe('daily quest', () => {
  const quests = [quest('a', 'genre-rpg'), quest('b', 'genre-puzzle'), quest('c', 'genre-cozy'), quest('d', 'genre-horror')];

  it('stays the same all day and skips turned-in quests', () => {
    const pick = dailyQuest(quests, {}, [], '2026-11-12', 0);
    expect(dailyQuest(quests, {}, [], '2026-11-12', 0)).toEqual(pick);
    const done = turnIn({}, pick!, 'x', T1, 'genres');
    expect(dailyQuest(quests, done, [], '2026-11-12', 0)?.id).not.toBe(pick!.id);
  });

  it('prefers quests on entries she has read', () => {
    expect(dailyQuest(quests, {}, ['genre-cozy'], '2026-11-12', 0)?.id).toBe('c');
  });

  it('rerolls through every open quest before repeating', () => {
    const seen = [0, 1, 2, 3].map((reroll) => dailyQuest(quests, {}, [], '2026-11-12', reroll)!.id);
    expect(new Set(seen).size).toBe(4);
    expect(dailyQuest(quests, {}, [], '2026-11-12', 4)!.id).toBe(seen[0]);
  });

  it('has nothing to suggest once everything is turned in', () => {
    let records: Record<string, QuestRecord> = {};
    for (const item of quests) records = turnIn(records, item, 'x', T1, 'genres');
    expect(dailyQuest(quests, records, [], '2026-11-12', 0)).toBeNull();
  });
});

describe('finding a quest', () => {
  it('keeps only the time tags editors can pick', () => {
    expect(cleanQuest({ ...quest('a'), minutes: 60 }).minutes).toBe(60);
    expect(cleanQuest({ ...quest('a'), minutes: 45 }).minutes).toBeUndefined();
  });

  it('fits a time range, counting untagged quests only when the range covers everything', () => {
    expect(fitsTime({ ...quest('a'), minutes: 15 }, 15, 30)).toBe(true);
    expect(fitsTime({ ...quest('a'), minutes: 60 }, 15, 30)).toBe(false);
    expect(fitsTime({ ...quest('a'), minutes: 60 }, 60, 240)).toBe(true);
    expect(fitsTime({ ...quest('a'), minutes: 30 }, 60, 240)).toBe(false);
    expect(fitsTime(quest('a'), 15, 240)).toBe(true);
    expect(fitsTime(quest('a'), 15, 120)).toBe(false);
  });

  it('suggests open quests from read entries and started paths', () => {
    const quests = [quest('read', 'genre-rpg'), quest('path', 'genre-cozy'), quest('far', 'genre-horror'), quest('done', 'genre-rpg')];
    const records = turnIn({}, quest('done', 'genre-rpg'), 'x', T1, 'genres');
    const ids = questsForYou(quests, records, ['genre-rpg'], ['genre-cozy']).map((item) => item.id);
    expect(ids).toEqual(['read', 'path']);
  });
});
