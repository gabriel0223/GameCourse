import { useEffect, useRef } from 'react';
import type { CodexCategory } from '../content/codex';
import { useCodex } from '../state/CodexContext';
import { strings } from '../strings';
import { CODEX_TABS, codexTabHref, goBack, goForward, isCodexTab, useHistoryArrows } from '../useHashRoute';
import type { CodexTab, Route } from '../useHashRoute';

const CATEGORY_TABS: Record<CodexCategory, CodexTab> = {
  genres: 'genres',
  history: 'history',
  consoles: 'consoles',
  playing: 'playing',
  industry: 'industry',
};

function CodexTabs({ id }: { id: string | null }) {
  const { find } = useCodex();
  const current = useRef<HTMLAnchorElement>(null);
  const entry = id ? find(id) : undefined;
  let active: CodexTab | null = entry ? CATEGORY_TABS[entry.category] : null;
  if (!id) active = 'all';
  else if (id === 'timeline') active = 'history';
  else if (id === 'consoles') active = 'consoles';
  else if (isCodexTab(id)) active = id;

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
          {strings.codex.categories[tab]}
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
      {route.view === 'codex' && !route.editing && <CodexTabs id={route.id} />}
    </div>
  );
}
