import type { CodexEntry } from './codex';

const DAY_MS = 24 * 60 * 60 * 1000;
// Close to the golden ratio of the list, which scatters neighbors, so similar entries don't land on nearby days.
const SCATTER = 0.618;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Uses her local calendar day, so the entry changes at her midnight.
const dayNumber = (date: Date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);

// Worked out from the date alone, so it can't change partway through a day,
// and every entry comes up once before any repeats.
export function entryOfTheDay(entries: CodexEntry[], date: Date): CodexEntry | undefined {
  if (!entries.length) return undefined;
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  let step = Math.max(1, Math.round(sorted.length * SCATTER));
  while (gcd(step, sorted.length) !== 1) step += 1;
  return sorted[(dayNumber(date) * step) % sorted.length];
}

export const EXCERPT_LIMIT = 320;

// Ends on a full sentence when one fits, so the excerpt doesn't stop mid-thought.
export function excerpt(text: string, limit = EXCERPT_LIMIT): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence >= limit * 0.6) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

export const entryExcerpt = (entry: CodexEntry) =>
  excerpt(entry.sections.find((section) => section.text)?.text ?? entry.summary);
