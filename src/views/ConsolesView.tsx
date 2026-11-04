import type { CSSProperties } from 'react';
import { TIMELINE_GROUPS } from '../content/timeline';
import { consoleOrder } from '../content/timelineOrder';
import { useCodex } from '../state/CodexContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { ConsoleCards } from './CodexView';

const t = strings.codex;
const GROUPS = TIMELINE_GROUPS.filter((group) => group.generation > 0);

export function ConsolesView() {
  const { canEdit, entries } = useCodex();
  const ordered = consoleOrder(entries);

  function jump(generation: number) {
    document.getElementById(`console-group-${generation}`)?.scrollIntoView({ block: 'start' });
  }

  return (
    <main className="page">
      <a className="back" href={hrefs.timeline}>
        {t.timeline.back}
      </a>
      <header className="page-header">
        <h1>{t.consoles.title}</h1>
        {canEdit && (
          <a className="button button-link" href={hrefs.codexNewConsole}>
            {t.consoles.add}
          </a>
        )}
      </header>
      <p className="timeline-intro">{t.consoles.summary}</p>
      <nav className="timeline-jump" aria-label={t.timeline.jump}>
        {GROUPS.map((group) => (
          <button key={group.generation} type="button" onClick={() => jump(group.generation)}>
            {`Gen ${group.generation}`}
          </button>
        ))}
      </nav>

      {GROUPS.map((group) => {
        const consoles = ordered.filter((entry) => entry.console?.generation === group.generation);
        return (
          <section
            className="console-group"
            id={`console-group-${group.generation}`}
            key={group.generation}
            style={{ '--genre': group.color } as CSSProperties}
          >
            <header>
              <h2>
                <a href={hrefs.codexEntry(`gen-${group.generation}`)}>{group.title}</a>
              </h2>
              <p>{group.years}</p>
            </header>
            {consoles.length > 0 ? <ConsoleCards entries={consoles} /> : <p className="empty-small">{t.consoles.none}</p>}
          </section>
        );
      })}
    </main>
  );
}
