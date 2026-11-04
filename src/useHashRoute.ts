import { useEffect, useState, useSyncExternalStore } from 'react';
import type { GameStatus } from './domain/types';

export type Route =
  | { view: 'library'; list: GameStatus }
  | { view: 'search'; query: string }
  | { view: 'game'; id: string }
  | { view: 'character' }
  | { view: 'shop' }
  | { view: 'practice'; game: string | null }
  | { view: 'codex'; id: string | null; editing: boolean };

export const CODEX_TABS = ['all', 'genres', 'history', 'consoles', 'playing', 'industry', 'terms'] as const;
export type CodexTab = (typeof CODEX_TABS)[number];

export const isCodexTab = (id: string): id is CodexTab => (CODEX_TABS as readonly string[]).includes(id);

const LISTS: GameStatus[] = ['playing', 'backlog', 'finished', 'dropped'];

export function parseRoute(hash: string): Route {
  const [path, params] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/');
  if (parts[0] === 'character') return { view: 'character' };
  if (parts[0] === 'shop') return { view: 'shop' };
  if (parts[0] === 'practice') return { view: 'practice', game: parts[1] ?? null };
  if (parts[0] === 'codex') {
    return { view: 'codex', id: parts[1] ? decodeURIComponent(parts[1]) : null, editing: parts[2] === 'edit' };
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
  shop: '#/shop',
  practice: '#/practice',
  runner: '#/practice/runner',
  jet: '#/practice/jet',
  codex: '#/codex',
  codexEntry: (id: string) => `#/codex/${encodeURIComponent(id)}`,
  codexEdit: (id: string) => `#/codex/${encodeURIComponent(id)}/edit`,
  codexNew: '#/codex/new/edit',
  codexNewEvent: '#/codex/new-event/edit',
  codexNewConsole: '#/codex/new-console/edit',
  timeline: '#/codex/timeline',
  consoles: '#/codex/consoles',
  codexTab: (tab: string) => `#/codex/${tab}`,
  list: (list: GameStatus) => `#/library/${list}`,
  search: (query: string) => `#/search?q=${encodeURIComponent(query)}`,
  game: (id: string) => `#/game/${encodeURIComponent(id)}`,
};

export function codexTabHref(tab: CodexTab): string {
  if (tab === 'all') return hrefs.codex;
  if (tab === 'history') return hrefs.timeline;
  if (tab === 'consoles') return hrefs.consoles;
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
