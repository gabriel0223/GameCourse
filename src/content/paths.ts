import { strings } from '../strings';
import { CODEX_ENTRIES } from './codex';
import type { CodexCategory, CodexEntry } from './codex';
import { TIMELINE_GROUPS } from './timeline';
import { consoleOrder, timelineOrder } from './timelineOrder';

// A starting value, to be tuned once there is real reading data.
export const PATH_GOLD_PER_STOP = 15;

export interface Path {
  id: string;
  // Paths are short courses followed stop by stop. Eras are the same idea, spread along the timeline.
  kind: 'path' | 'era';
  title: string;
  summary: string;
  // Stops in order. An entry can be on any number of paths, and reading it once counts for all of them.
  // Only built-in entries count, so adding a new guide can't take away a reward she already earned.
  entryIds: string[];
  gold: number;
  art?: string;
  // Guides written in the editor for this category join the end of the path.
  category?: CodexCategory;
  generation?: number;
  color?: string;
  years?: string;
}

const withGold = (fields: Omit<Path, 'gold'>): Path => ({
  ...fields,
  gold: fields.entryIds.length * PATH_GOLD_PER_STOP,
});

const categoryPath = (category: CodexCategory, summary: string, art: string) =>
  withGold({
    id: category,
    kind: 'path',
    title: strings.codex.categories[category],
    summary,
    art,
    category,
    entryIds: CODEX_ENTRIES.filter((entry) => entry.category === category).map((entry) => entry.id),
  });

// To add a path, add an entry here. The stops are existing Codex entries, in reading order.
export const PATHS: Path[] = [
  categoryPath('playing', 'Get comfortable with the controller and the basics.', 'playing-buttons'),
  categoryPath('genres', 'Find out what kinds of games are out there.', 'genre-adventure'),
  categoryPath('industry', 'Learn who makes games and how they reach you.', 'industry-publisher'),
  categoryPath('roles', 'Meet the jobs behind every game, from programmers to producers.', 'path-roles'),
  categoryPath('people', 'Meet the people whose ideas changed video games.', 'path-people'),
  withGold({
    id: 'crash-and-comeback',
    kind: 'path',
    title: 'The crash and the comeback',
    summary: 'How the American console market collapsed, and how Nintendo brought it back.',
    art: 'path-crash-and-comeback',
    entryIds: ['event-atari-2600', 'event-activision', 'event-crash', 'event-famicom', 'event-nes-mario'],
  }),
  withGold({
    id: 'rise-and-fall-of-sega',
    kind: 'path',
    title: 'The rise and fall of Sega',
    summary: 'From a console launched beside the Famicom to leaving hardware for good.',
    art: 'path-rise-and-fall-of-sega',
    entryIds: [
      'console-sg-1000',
      'console-master-system',
      'console-genesis',
      'event-sonic',
      'console-saturn',
      'console-dreamcast',
      'event-sega-exits',
    ],
  }),
  withGold({
    id: 'games-in-your-pocket',
    kind: 'path',
    title: 'Games in your pocket',
    summary: 'How playing away from the TV went from an LCD toy to a full PC.',
    art: 'path-games-in-your-pocket',
    entryIds: [
      'console-game-and-watch',
      'event-game-boy',
      'console-ds',
      'console-psp',
      'event-app-store',
      'event-switch',
      'event-steam-deck',
    ],
  }),
];

// One per era, so its timeline events and its consoles are finished together.
export const ERAS: Path[] = TIMELINE_GROUPS.map(({ generation, title, years, color }) =>
  withGold({
    id: `era-${generation}`,
    kind: 'era',
    title,
    summary: years,
    years,
    color,
    generation,
    entryIds: [
      ...timelineOrder(CODEX_ENTRIES).filter((entry) => entry.timeline?.generation === generation),
      ...consoleOrder(CODEX_ENTRIES).filter((entry) => entry.console?.generation === generation),
    ].map((entry) => entry.id),
  }),
);

export const ALL_PATHS = [...PATHS, ...ERAS];

export const findPath = (id: string | null) => ALL_PATHS.find((item) => item.id === id);

export const pathRead = (path: Path, read: string[]) => path.entryIds.filter((id) => read.includes(id)).length;

export function pathEntries(path: Path, entries: CodexEntry[]): CodexEntry[] {
  const stops = path.entryIds.flatMap((id) => entries.find((entry) => entry.id === id) ?? []);
  const added = entries.filter((entry) => entry.custom && path.category && entry.category === path.category);
  return [...stops, ...added];
}

// Where an entry belongs when it wasn't opened from a path.
export function homeOf(entry: CodexEntry): Path | undefined {
  const generation = entry.timeline?.generation ?? entry.console?.generation;
  return generation === undefined
    ? PATHS.find((item) => item.category === entry.category)
    : ERAS.find((item) => item.generation === generation);
}

export const pathsWith = (entry: CodexEntry) => ALL_PATHS.filter((item) => item.entryIds.includes(entry.id));

// Paths she has started come first, so the Home page picks up where she left off.
export function featuredPaths(read: string[], finished: string[] = [], limit = 3): Path[] {
  const started = (path: Path) => pathRead(path, read) > 0 && !finished.includes(path.id);
  return [...PATHS.filter(started), ...PATHS.filter((path) => !started(path))].slice(0, limit);
}

export type NextReason = 'later' | 'earlier' | 'related' | 'nearby';

export interface NextChoice {
  entry: CodexEntry;
  reason: NextReason;
}

// A few places to go after an entry opened outside a path. Unread ones come first.
export function nextChoices(entry: CodexEntry, entries: CodexEntry[], read: string[], limit = 3): NextChoice[] {
  const ordered = entry.timeline ? timelineOrder(entries) : entry.console ? consoleOrder(entries) : [];
  const index = ordered.findIndex((item) => item.id === entry.id);
  const find = (id?: string) => entries.find((item) => item.id === id);
  const home = homeOf(entry)?.entryIds ?? [];
  const start = home.indexOf(entry.id);
  const mates = [...home.slice(start + 1), ...home.slice(0, Math.max(start, 0))];

  const candidates: Array<[CodexEntry | undefined, NextReason]> = [
    [index >= 0 ? ordered[index + 1] : undefined, 'later'],
    ...(entry.related ?? []).map((id): [CodexEntry | undefined, NextReason] => [find(id), 'related']),
    ...mates.map((id): [CodexEntry | undefined, NextReason] => [find(id), 'nearby']),
    [index > 0 ? ordered[index - 1] : undefined, 'earlier'],
  ];
  const seen = new Set([entry.id]);
  const choices = candidates.flatMap(([item, reason]) => {
    if (!item || seen.has(item.id)) return [];
    seen.add(item.id);
    return [{ entry: item, reason }];
  });
  const isRead = (choice: NextChoice) => read.includes(choice.entry.id);
  return [...choices.filter((item) => !isRead(item)), ...choices.filter(isRead)].slice(0, limit);
}
