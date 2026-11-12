import { ALL_PATHS, ERAS, PATHS, pathRead } from '../content/paths';
import type { Path } from '../content/paths';
import { WARDROBE_GENRES, genreEntryId, pickGenres } from './genres';
import { bestScore } from './practice';
import { hasPerfectQuiz, passedCount } from './quiz';
import { questGold } from './quests';
import type { WardrobeGenre } from './genres';
import type { LibraryEntry } from './types';
import { PIECES } from './wardrobe';
import type { CharacterProfile, Piece, Slot } from './wardrobe';
import { entryMinutes, entryXp, levelFromXp, totalXp } from './xp';
import type { LevelProgress } from './xp';

export const ACHIEVEMENT_XP = 50;

// Starting values, to be tuned once there is real play data.
export const LEVEL_GOLD = 50;
const ACHIEVEMENT_GOLD = { easy: 25, medium: 75, hard: 200 };
type Difficulty = keyof typeof ACHIEVEMENT_GOLD;

export interface GenreProgress extends LevelProgress {
  genre: WardrobeGenre;
  minutes: number;
  nextPiece: Piece | null;
}

export interface GamerStats {
  minutesPlayed: number;
  gamesFinished: number;
  gamesPlayed: number;
  backlogCount: number;
  genresExplored: number;
  favoriteGenre: WardrobeGenre | null;
  mostPlayed: { id: string; name: string; minutes: number } | null;
}

interface Facts {
  entries: LibraryEntry[];
  profile: CharacterProfile;
  stats: GamerStats;
  genres: GenreProgress[];
  ownedCount: number;
}

export type AchievementGroup = 'Library' | 'Finishing' | 'Exploring' | 'Character' | 'Codex' | 'Quests' | 'Practice';

interface AchievementRule {
  id: string;
  group: AchievementGroup;
  title: string;
  description: string;
  difficulty: Difficulty;
  earned(facts: Facts): boolean;
  // Only for goals that can be counted, as [how far she is, how far she needs to go].
  counter?(facts: Facts): [number, number];
}

const playedGenre = (genre: WardrobeGenre) => (facts: Facts) =>
  facts.genres.some((item) => item.genre === genre && item.minutes > 0);

const pathIds = PATHS.map((path) => path.id);
const eraIds = ERAS.map((era) => era.id);

const questCount = (profile: CharacterProfile) => Object.keys(profile.quests).length;

const questCategories = (profile: CharacterProfile) =>
  new Set(Object.values(profile.quests).map((record) => record.category)).size;

const ACHIEVEMENTS: AchievementRule[] = [
  {
    id: 'first-game',
    difficulty: 'easy',
    group: 'Library',
    title: 'Added your first game',
    description: 'Put any game in your library.',
    earned: ({ entries }) => entries.length >= 1,
  },
  {
    id: 'first-hour',
    difficulty: 'easy',
    group: 'Library',
    title: 'Logged your first hour',
    description: 'Play for 1 hour in total.',
    earned: ({ stats }) => stats.minutesPlayed >= 60,
  },
  {
    id: 'ten-hours',
    difficulty: 'medium',
    group: 'Library',
    title: 'Played for 10 hours',
    description: 'Reach 10 hours across all your games.',
    earned: ({ stats }) => stats.minutesPlayed >= 600,
    counter: ({ stats }) => [Math.floor(stats.minutesPlayed / 60), 10],
  },
  {
    id: 'backlog',
    difficulty: 'medium',
    group: 'Library',
    title: 'Started a backlog',
    description: 'Keep 5 games in your Backlog.',
    earned: ({ stats }) => stats.backlogCount >= 5,
    counter: ({ stats }) => [stats.backlogCount, 5],
  },
  {
    id: 'first-finish',
    difficulty: 'medium',
    group: 'Finishing',
    title: 'Finished your first game',
    description: 'Mark a game as finished.',
    earned: ({ stats }) => stats.gamesFinished >= 1,
  },
  {
    id: 'five-finishes',
    difficulty: 'hard',
    group: 'Finishing',
    title: 'Finished 5 games',
    description: 'See 5 games through to the end.',
    earned: ({ stats }) => stats.gamesFinished >= 5,
    counter: ({ stats }) => [stats.gamesFinished, 5],
  },
  {
    id: 'long-haul',
    difficulty: 'hard',
    group: 'Finishing',
    title: 'Finished a game over 40 hours',
    description: 'Finish one game after playing it for 40 hours or more.',
    earned: ({ entries }) => entries.some((entry) => entry.status === 'finished' && entryMinutes(entry) >= 2400),
  },
  {
    id: 'first-rpg',
    difficulty: 'easy',
    group: 'Exploring',
    title: 'Played your first RPG',
    description: 'Log time on a game in the RPG genre.',
    earned: playedGenre('RPG'),
  },
  {
    id: 'three-genres',
    difficulty: 'medium',
    group: 'Exploring',
    title: 'Played 3 genres',
    description: 'Log time in 3 different genres.',
    earned: ({ stats }) => stats.genresExplored >= 3,
    counter: ({ stats }) => [stats.genresExplored, 3],
  },
  {
    id: 'every-genre',
    difficulty: 'hard',
    group: 'Exploring',
    title: 'Played every genre',
    description: 'Log time in all 10 genres.',
    earned: ({ stats }) => stats.genresExplored >= WARDROBE_GENRES.length,
    counter: ({ stats }) => [stats.genresExplored, WARDROBE_GENRES.length],
  },
  {
    id: 'moved-on',
    difficulty: 'easy',
    group: 'Exploring',
    title: 'Knew when to move on',
    description: 'Drop a game that wasn’t for you.',
    earned: ({ entries }) => entries.some((entry) => entry.status === 'dropped'),
  },
  {
    id: 'customized',
    difficulty: 'easy',
    group: 'Character',
    title: 'Customized your character',
    description: 'Change her appearance or equip a piece.',
    earned: ({ profile }) => profile.customized,
  },
  {
    id: 'hairstyle',
    difficulty: 'easy',
    group: 'Character',
    title: 'Changed your hairstyle',
    description: 'Try a new hairstyle or hair color.',
    earned: ({ profile }) => profile.changedHair,
  },
  {
    id: 'first-piece',
    difficulty: 'easy',
    group: 'Character',
    title: 'Bought your first outfit piece',
    description: 'Buy anything in the Shop.',
    earned: ({ ownedCount }) => ownedCount >= 1,
  },
  {
    id: 'full-outfit',
    difficulty: 'medium',
    group: 'Character',
    title: 'Dressed for adventure',
    description: 'Equip an accessory, a top, and a bottom at once.',
    earned: ({ profile }) => Object.values(profile.equipped).every((id) => id !== null && id in profile.owned),
  },
  {
    id: 'first-entry',
    difficulty: 'easy',
    group: 'Codex',
    title: 'Read your first entry',
    description: 'Mark any Codex entry as read.',
    earned: ({ profile }) => profile.readEntries.length >= 1,
  },
  {
    id: 'genre-scholar',
    difficulty: 'medium',
    group: 'Codex',
    title: 'Read every genre entry',
    description: 'Mark all 10 genre guides as read.',
    earned: ({ profile }) => WARDROBE_GENRES.every((genre) => profile.readEntries.includes(genreEntryId(genre))),
    counter: ({ profile }) => [WARDROBE_GENRES.filter((genre) => profile.readEntries.includes(genreEntryId(genre))).length, 10],
  },
  {
    id: 'time-traveler',
    difficulty: 'hard',
    group: 'Codex',
    title: 'Traveled through time',
    description: 'Mark all 9 console generations as read.',
    earned: ({ profile }) =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9].every((generation) => profile.readEntries.includes(`gen-${generation}`)),
    counter: ({ profile }) => [[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((generation) => profile.readEntries.includes(`gen-${generation}`)).length, 9],
  },
  {
    id: 'first-quiz',
    difficulty: 'easy',
    group: 'Codex',
    title: 'Passed your first quiz',
    description: 'Pass any path or era quiz.',
    earned: ({ profile }) => passedCount(profile.quizzes, [...pathIds, ...eraIds]) >= 1,
  },
  {
    id: 'perfect-quiz',
    difficulty: 'medium',
    group: 'Codex',
    title: 'Got a perfect score',
    description: 'Answer every question in a quiz correctly.',
    earned: ({ profile }) => hasPerfectQuiz(profile.quizzes),
  },
  {
    id: 'three-paths',
    difficulty: 'medium',
    group: 'Codex',
    title: 'Finished three paths',
    description: 'Pass the quizzes on 3 paths.',
    earned: ({ profile }) => passedCount(profile.quizzes, pathIds) >= 3,
    counter: ({ profile }) => [passedCount(profile.quizzes, pathIds), 3],
  },
  {
    id: 'six-paths',
    difficulty: 'hard',
    group: 'Codex',
    title: 'Finished six paths',
    description: 'Pass the quizzes on 6 paths.',
    earned: ({ profile }) => passedCount(profile.quizzes, pathIds) >= 6,
    counter: ({ profile }) => [passedCount(profile.quizzes, pathIds), 6],
  },
  {
    id: 'timeline-quizzes',
    difficulty: 'hard',
    group: 'Codex',
    title: 'Mastered the timeline',
    description: 'Pass the quiz for every era of the timeline.',
    earned: ({ profile }) => passedCount(profile.quizzes, eraIds) === eraIds.length,
    counter: ({ profile }) => [passedCount(profile.quizzes, eraIds), eraIds.length],
  },
  {
    id: 'first-quest',
    difficulty: 'easy',
    group: 'Quests',
    title: 'Turned in your first quest',
    description: 'Finish any quest and write your answer.',
    earned: ({ profile }) => questCount(profile) >= 1,
  },
  {
    id: 'read-reply',
    difficulty: 'easy',
    group: 'Quests',
    title: 'Got a reply',
    description: 'Open a reply to one of your quests.',
    earned: ({ profile }) => Object.values(profile.quests).some((record) => record.replySeenAt),
  },
  {
    id: 'five-quests',
    difficulty: 'medium',
    group: 'Quests',
    title: 'Turned in 5 quests',
    description: 'Finish 5 quests.',
    earned: ({ profile }) => questCount(profile) >= 5,
    counter: ({ profile }) => [questCount(profile), 5],
  },
  {
    id: 'quest-explorer',
    difficulty: 'medium',
    group: 'Quests',
    title: 'Quests all over the Codex',
    description: 'Finish quests from 4 different Codex categories.',
    earned: ({ profile }) => questCategories(profile) >= 4,
    counter: ({ profile }) => [questCategories(profile), 4],
  },
  {
    id: 'fifteen-quests',
    difficulty: 'hard',
    group: 'Quests',
    title: 'Turned in 15 quests',
    description: 'Finish 15 quests.',
    earned: ({ profile }) => questCount(profile) >= 15,
    counter: ({ profile }) => [questCount(profile), 15],
  },
  {
    id: 'first-run',
    difficulty: 'easy',
    group: 'Practice',
    title: 'Finished your first run',
    description: 'Score at least one point in any Practice game.',
    earned: ({ profile }) => profile.practice.runs >= 1,
  },
  {
    id: 'runner-25',
    difficulty: 'medium',
    group: 'Practice',
    title: 'Hit 25 prompts in a run',
    description: 'Reach a score of 25 in the Endless Runner.',
    earned: ({ profile }) => bestScore(profile.practice, 'runner') >= 25,
    counter: ({ profile }) => [bestScore(profile.practice, 'runner'), 25],
  },
  {
    id: 'runner-streak',
    difficulty: 'medium',
    group: 'Practice',
    title: 'Hit 15 prompts in a row',
    description: 'Go 15 prompts without pressing a wrong button.',
    earned: ({ profile }) => profile.practice.bestStreak >= 15,
    counter: ({ profile }) => [profile.practice.bestStreak, 15],
  },
  {
    id: 'all-controls',
    difficulty: 'medium',
    group: 'Practice',
    title: 'Trained on every controller',
    description: 'Finish an Endless Runner run with PlayStation, Xbox, and Keyboard.',
    earned: ({ profile }) => profile.practice.devices.length >= 3,
    counter: ({ profile }) => [profile.practice.devices.length, 3],
  },
  {
    id: 'runner-60',
    difficulty: 'hard',
    group: 'Practice',
    title: 'Hit 60 prompts in a run',
    description: 'Reach a score of 60 in the Endless Runner.',
    earned: ({ profile }) => bestScore(profile.practice, 'runner') >= 60,
    counter: ({ profile }) => [bestScore(profile.practice, 'runner'), 60],
  },
];

function genreProgress(entries: LibraryEntry[]): GenreProgress[] {
  return WARDROBE_GENRES.map((genre) => {
    const own = entries.filter((entry) => pickGenres(entry.game.genres, entry.game.themes).includes(genre));
    const level = levelFromXp(totalXp(own));
    const nextPiece =
      PIECES.filter((piece) => piece.genre === genre && piece.shopLevel > level.level).sort(
        (a, b) => a.shopLevel - b.shopLevel,
      )[0] ?? null;
    return { ...level, genre, nextPiece, minutes: own.reduce((sum, entry) => sum + entryMinutes(entry), 0) };
  });
}

function shopIds(genres: GenreProgress[]): Set<string> {
  const levels = new Map(genres.map((item) => [item.genre, item.level]));
  return new Set(PIECES.filter((piece) => (levels.get(piece.genre) ?? 1) >= piece.shopLevel).map((piece) => piece.id));
}

function gamerStats(entries: LibraryEntry[], genres: GenreProgress[]): GamerStats {
  const played = entries.filter((entry) => entryMinutes(entry) > 0);
  const top = [...genres].sort((a, b) => b.minutes - a.minutes)[0];
  const longest = [...played].sort((a, b) => entryMinutes(b) - entryMinutes(a))[0];
  return {
    minutesPlayed: played.reduce((sum, entry) => sum + entryMinutes(entry), 0),
    gamesFinished: entries.filter((entry) => entry.status === 'finished').length,
    gamesPlayed: played.length,
    backlogCount: entries.filter((entry) => entry.status === 'backlog').length,
    genresExplored: genres.filter((item) => item.minutes > 0).length,
    favoriteGenre: top && top.minutes > 0 ? top.genre : null,
    mostPlayed: longest ? { id: longest.game.id, name: longest.game.name, minutes: entryMinutes(longest) } : null,
  };
}

export interface GamerState {
  progress: LevelProgress;
  stats: GamerStats;
  genres: GenreProgress[];
  // Pieces in the Shop, whether or not she has bought them.
  available: Set<string>;
  owned: Set<string>;
  gold: { earned: number; spent: number; balance: number };
  achievements: Array<
    Omit<AchievementRule, 'earned' | 'difficulty' | 'counter'> & {
      unlocked: boolean;
      gold: number;
      progress?: { current: number; target: number };
    }
  >;
  earnedCount: number;
  paths: Array<Path & { read: number; done: boolean }>;
  equipped: Record<Slot, Piece | null>;
}

// Everything here comes from the library and the saved profile, so numbers
// always agree and a correction to a log can't leave stale rewards behind.
export function deriveGamer(entries: LibraryEntry[], profile: CharacterProfile): GamerState {
  const genres = genreProgress(entries);
  const owned = new Set(PIECES.filter((piece) => piece.id in profile.owned).map((piece) => piece.id));
  const stats = gamerStats(entries, genres);
  const facts: Facts = { entries, profile, stats, genres, ownedCount: owned.size };
  const achievements = ACHIEVEMENTS.map(({ earned, difficulty, counter, ...rule }) => {
    const count = counter?.(facts);
    return {
      ...rule,
      unlocked: earned(facts),
      gold: ACHIEVEMENT_GOLD[difficulty],
      ...(count ? { progress: { current: Math.min(count[0], count[1]), target: count[1] } } : {}),
    };
  });
  const earnedCount = achievements.filter((item) => item.unlocked).length;
  const paths = ALL_PATHS.map((path) => {
    const read = pathRead(path, profile.readEntries);
    // Only a quiz finishes a path or an era. Reading just tracks her place.
    return { ...path, read, done: Boolean(profile.quizzes[path.id]?.passed) };
  });
  const worn = (slot: Slot) => {
    const piece = PIECES.find((item) => item.id === profile.equipped[slot]);
    return piece && owned.has(piece.id) ? piece : null;
  };
  const progress = levelFromXp(
    entries.reduce((sum, entry) => sum + entryXp(entry), 0) + earnedCount * ACHIEVEMENT_XP + profile.practice.xp,
  );
  const earnedGold =
    achievements.reduce((sum, item) => sum + (item.unlocked ? item.gold : 0), 0) +
    paths.reduce((sum, item) => sum + (item.done ? item.gold : 0), 0) +
    questGold(profile.quests) +
    (progress.level - 1) * LEVEL_GOLD;
  const spent = Object.values(profile.owned).reduce((sum, price) => sum + price, 0);
  return {
    progress,
    stats,
    genres,
    available: shopIds(genres),
    owned,
    // Deleting a log can lower what she has earned, but purchases stay, so this never shows below zero.
    gold: { earned: earnedGold, spent, balance: Math.max(0, earnedGold - spent) },
    achievements,
    earnedCount,
    paths,
    equipped: { accessory: worn('accessory'), top: worn('top'), bottom: worn('bottom') },
  };
}

// The achievements closest to done, then simple ones she hasn't started.
export function nextGoals(gamer: GamerState, limit = 3): GamerState['achievements'] {
  const share = ({ progress }: GamerState['achievements'][number]) =>
    progress ? progress.current / progress.target : 0;
  return gamer.achievements
    .filter((item) => !item.unlocked)
    .map((item, order) => ({ item, order }))
    .sort((a, b) => share(b.item) - share(a.item) || a.item.gold - b.item.gold || a.order - b.order)
    .slice(0, limit)
    .map(({ item }) => item);
}
