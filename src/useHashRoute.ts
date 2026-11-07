import { useEffect, useState, useSyncExternalStore } from 'react';
import type { GameStatus } from './domain/types';
import { SLOTS } from './domain/wardrobe';
import type { Slot } from './domain/wardrobe';

export type Route =
  | { view: 'library'; list: GameStatus }
  | { view: 'search'; query: string }
  | { view: 'game'; id: string }
  | { view: 'character'; tab: CharacterTab; slot: Slot | null }
  | { view: 'shop' }
  | { view: 'friends'; id: string | null; tab: FriendTab; list: GameStatus }
  | { view: 'practice'; game: string | null }
  | { view: 'codex'; id: string | null; editing: boolean; at: string | null; path: string | null; quiz: boolean };

export const CHARACTER_TABS = ['overview', 'wardrobe', 'achievements'] as const;
export type CharacterTab = (typeof CHARACTER_TABS)[number];

// The older tabs still lead somewhere, so saved links keep working.
const OLD_CHARACTER_TABS: Record<string, CharacterTab> = { profile: 'overview', inventory: 'wardrobe', appearance: 'wardrobe' };

export const FRIEND_TABS = ['overview', 'library', 'achievements'] as const;
export type FriendTab = (typeof FRIEND_TABS)[number];

export const CODEX_TABS = ['home', 'paths', 'history', 'glossary'] as const;
export type CodexTab = (typeof CODEX_TABS)[number];

// The first paths keep their old addresses, so older links still land in the right place.
export const GUIDE_CHAPTER_IDS = ['playing', 'genres', 'industry'];

const LISTS: GameStatus[] = ['playing', 'backlog', 'finished', 'dropped'];

export function parseRoute(hash: string): Route {
  const [path, params] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/');
  if (parts[0] === 'character') {
    const tab = CHARACTER_TABS.find((item) => item === parts[1]) ?? OLD_CHARACTER_TABS[parts[1]] ?? 'overview';
    const slot = SLOTS.find((item) => item === new URLSearchParams(params).get('slot')) ?? null;
    return { view: 'character', tab, slot };
  }
  if (parts[0] === 'shop') return { view: 'shop' };
  if (parts[0] === 'friends') {
    const list = LISTS.find((item) => item === new URLSearchParams(params).get('list'));
    return {
      view: 'friends',
      id: parts[1] ? decodeURIComponent(parts[1]) : null,
      tab: FRIEND_TABS.find((item) => item === parts[2]) ?? 'overview',
      list: list ?? 'playing',
    };
  }
  if (parts[0] === 'practice') return { view: 'practice', game: parts[1] ?? null };
  if (parts[0] === 'codex') {
    const query = new URLSearchParams(params);
    return {
      view: 'codex',
      id: parts[1] ? decodeURIComponent(parts[1]) : null,
      editing: parts[2] === 'edit',
      at: query.get('at'),
      path: parts[1] === 'path' && parts[2] ? decodeURIComponent(parts[2]) : query.get('path'),
      quiz: parts[1] === 'path' && parts[3] === 'quiz',
    };
  }
  if (parts[0] === 'search') {
    return { view: 'search', query: new URLSearchParams(params).get('q') ?? '' };
  }
  if (parts[0] === 'game' && parts[1]) return { view: 'game', id: decodeURIComponent(parts[1]) };
  const list = LISTS.find((item) => item === parts[1]);
  return { view: 'library', list: list ?? 'playing' };
}

export const hrefs = {
  character: '#/character',
  characterTab: (tab: CharacterTab) => (tab === 'overview' ? '#/character' : `#/character/${tab}`),
  characterSlot: (slot: Slot) => `#/character/wardrobe?slot=${slot}`,
  shop: '#/shop',
  friends: '#/friends',
  friend: (id: string, tab: FriendTab = 'overview') =>
    `#/friends/${encodeURIComponent(id)}${tab === 'overview' ? '' : `/${tab}`}`,
  friendList: (id: string, list: GameStatus) => `#/friends/${encodeURIComponent(id)}/library?list=${list}`,
  practice: '#/practice',
  runner: '#/practice/runner',
  jet: '#/practice/jet',
  codex: '#/codex',
  codexEntry: (id: string) => `#/codex/${encodeURIComponent(id)}`,
  codexEdit: (id: string) => `#/codex/${encodeURIComponent(id)}/edit`,
  codexNew: '#/codex/new/edit',
  codexNewEvent: '#/codex/new-event/edit',
  codexNewConsole: '#/codex/new-console/edit',
  paths: '#/codex/paths',
  path: (id: string) => `#/codex/path/${encodeURIComponent(id)}`,
  pathQuiz: (id: string) => `#/codex/path/${encodeURIComponent(id)}/quiz`,
  pathStop: (id: string, path: string) => `#/codex/${encodeURIComponent(id)}?path=${encodeURIComponent(path)}`,
  glossary: '#/codex/glossary',
  codexSearch: '#/codex/search',
  timeline: '#/codex/timeline',
  timelineAt: (generation: number) => `#/codex/timeline?at=${generation}`,
  consoles: '#/codex/consoles',
  codexTab: (tab: string) => `#/codex/${tab}`,
  list: (list: GameStatus) => `#/library/${list}`,
  search: (query: string) => `#/search?q=${encodeURIComponent(query)}`,
  game: (id: string) => `#/game/${encodeURIComponent(id)}`,
};

export function codexTabHref(tab: CodexTab): string {
  if (tab === 'home') return hrefs.codex;
  if (tab === 'history') return hrefs.timeline;
  return hrefs.codexTab(tab);
}

// Remembered here so Back links work even where browser history is restricted.
let previousHash = '#/';
export const getPreviousHash = () => previousHash;

// The app keeps its own page history, because browsers don't say whether there's a page to go back to.
interface Visit {
  hash: string;
  scroll: number;
  query?: string;
}

const currentHash = () => window.location.hash || '#/';

let visits: Visit[] = [{ hash: currentHash(), scroll: 0 }];
let position = 0;
let arrowTarget: number | null = null;
let pendingQuery: string | null = null;
const listeners = new Set<() => void>();

function tagBrowserEntry() {
  try {
    window.history.replaceState({ visit: position }, '');
  } catch {
    // Some embedded previews block this. The arrows still work, and only the browser's own arrows lose track.
  }
}

// Returns where the page should scroll to.
function recordVisit(): number {
  const hash = currentHash();
  visits[position].scroll = window.scrollY;
  const tagged = (window.history.state as { visit?: number } | null)?.visit;
  const target = arrowTarget ?? tagged;
  arrowTarget = null;
  let scroll = 0;
  if (target !== undefined && visits[target]?.hash === hash) {
    position = target;
    scroll = visits[position].scroll;
  } else if (hash !== visits[position].hash) {
    visits = [...visits.slice(0, position + 1), { hash, scroll: 0 }];
    position += 1;
  }
  if (pendingQuery !== null) {
    visits[position].query = pendingQuery;
    pendingQuery = null;
  }
  tagBrowserEntry();
  listeners.forEach((listener) => listener());
  return scroll;
}

function travel(target: number) {
  if (!visits[target]) return;
  arrowTarget = target;
  window.location.hash = visits[target].hash;
}

export const goBack = () => travel(position - 1);
export const goForward = () => travel(position + 1);

// Lets a page keep small details, like a search, for when you come back to it.
export const currentVisit = (): Visit => visits[position];

// The search box stays put across Codex pages, and each search keeps its words in its own visit.
const onCodexSearch = () => currentHash() === hrefs.codexSearch;

export function setCodexQuery(query: string) {
  if (onCodexSearch()) {
    visits[position].query = query;
  } else {
    pendingQuery = query;
    window.location.hash = hrefs.codexSearch;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCodexQuery() {
  return useSyncExternalStore(subscribe, () => pendingQuery ?? (onCodexSearch() ? visits[position].query ?? '' : ''));
}

// Opens a page at one of its sections, unless the visit is returning to a saved spot.
export function useScrollToSection(sectionId: string | null) {
  useEffect(() => {
    if (!sectionId || currentVisit().scroll > 0) return;
    // The second frame runs after the route change has scrolled the page to the top.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })),
    );
    return () => cancelAnimationFrame(frame);
  }, [sectionId]);
}

export function useHistoryArrows() {
  const canGoBack = useSyncExternalStore(subscribe, () => position > 0);
  const canGoForward = useSyncExternalStore(subscribe, () => position < visits.length - 1);
  return { canGoBack, canGoForward };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    try {
      window.history.scrollRestoration = 'manual';
    } catch {
      // Scrolling still works without this.
    }
    tagBrowserEntry();
    const update = (event: HashChangeEvent) => {
      previousHash = new URL(event.oldURL).hash || '#/';
      const scroll = recordVisit();
      setRoute(parseRoute(window.location.hash));
      // Waits for the new page, since a saved spot can be further down than the old page reached.
      requestAnimationFrame(() => window.scrollTo(0, scroll));
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}
