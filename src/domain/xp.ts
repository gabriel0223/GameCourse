import type { LibraryEntry } from './types';

// Starting values, to be tuned once there is real play data.
export const XP_PER_HOUR = 100;
export const FINISH_BONUS = 500;
export const DROPPED_XP = 50;

export function entryMinutes(entry: LibraryEntry): number {
  return entry.sessions.reduce((sum, session) => sum + session.minutes, 0);
}

// XP comes from the current state of each game rather than a running total, so
// correcting a log or undoing a finish can never double-count anything.
export function entryXp(entry: LibraryEntry): number {
  const playXp = Math.round((entryMinutes(entry) / 60) * XP_PER_HOUR);
  if (entry.status === 'finished') return playXp + FINISH_BONUS;
  if (entry.status === 'dropped') return playXp + DROPPED_XP;
  return playXp;
}

export function totalXp(entries: LibraryEntry[]): number {
  return entries.reduce((sum, entry) => sum + entryXp(entry), 0);
}

export function xpToNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  needed: number;
  total: number;
}

export function levelFromXp(total: number): LevelProgress {
  let level = 1;
  let remaining = total;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  return { level, intoLevel: remaining, needed: xpToNextLevel(level), total };
}
