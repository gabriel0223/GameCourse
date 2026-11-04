import { useEffect, useRef } from 'react';
import type { CodexCategory } from '../content/codex';
import { useCodex } from '../state/CodexContext';
import { strings } from '../strings';
import {
  CODEX_TABS,
  GUIDE_CHAPTER_IDS,
  codexTabHref,
  goBack,
  goForward,
  setCodexQuery,
  useCodexQuery,
  useHistoryArrows,
} from '../useHashRoute';
import type { CodexTab, Route } from '../useHashRoute';

const CATEGORY_TABS: Record<CodexCategory, CodexTab> = {
  genres: 'paths',
  history: 'history',
  consoles: 'history',
  playing: 'paths',
  industry: 'paths',
};

function activeTab(id: string | null, path: string | null, category: CodexCategory | undefined): CodexTab | null {
  if (!id || id === 'home' || id === 'all') return 'home';
  if (path) return 'paths';
  if (category) return CATEGORY_TABS[category];
  if (id === 'paths' || id === 'guides' || GUIDE_CHAPTER_IDS.includes(id)) return 'paths';
  if (id === 'timeline' || id === 'consoles' || id === 'history') return 'history';
  if (id === 'glossary' || id === 'terms') return 'glossary';
  return null;
}

function CodexSearch() {
  const query = useCodexQuery();
  return (
    <div className="codex-search" role="search">
      <label className="sr-only" htmlFor="codex-search">
        {strings.codex.searchLabel}
      </label>
      <input
        id="codex-search"
        type="search"
        value={query}
        placeholder={strings.codex.searchPlaceholder}
        onChange={(event) => setCodexQuery(event.target.value)}
      />
    </div>
  );
}

function CodexTabs({ id, path }: { id: string | null; path: string | null }) {
  const { find } = useCodex();
  const current = useRef<HTMLAnchorElement>(null);
  const entry = id ? find(id) : undefined;
  const active = activeTab(id, path, entry?.category);

  // On phones the row scrolls sideways, so the current section stays in view.
  useEffect(() => {
    current.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <nav className="tabs codex-tabs" aria-label={strings.codex.sections}>
      {CODEX_TABS.map((tab) => (
        <a
          key={tab}
          ref={tab === active ? current : undefined}
          href={codexTabHref(tab)}
          aria-current={tab === active ? 'page' : undefined}
        >
          {strings.codex.tabs[tab]}
        </a>
      ))}
    </nav>
  );
}

function Arrow({ forward = false }: { forward?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={forward ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} />
    </svg>
  );
}

export function TopBar({ route }: { route: Route }) {
  const { canGoBack, canGoForward } = useHistoryArrows();
  return (
    <div className="top-bar">
      <div className="history-arrows">
        <button type="button" disabled={!canGoBack} aria-label={strings.history.back} title={strings.history.back} onClick={goBack}>
          <Arrow />
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          aria-label={strings.history.forward}
          title={strings.history.forward}
          onClick={goForward}
        >
          <Arrow forward />
        </button>
      </div>
      {route.view === 'codex' && !route.editing && (
        <>
          <CodexTabs id={route.id} path={route.path} />
          <CodexSearch />
        </>
      )}
    </div>
  );
}
