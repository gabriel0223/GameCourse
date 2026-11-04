import type { CSSProperties } from 'react';
import { TIMELINE_GROUPS } from '../content/timeline';
import { timelineOrder } from '../content/timelineOrder';
import { canEditCodex } from '../data';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { EntryArt, ReadMark } from './CodexView';

const t = strings.codex;

export function TimelineView() {
  const { entries } = useCodex();
  const { profile } = useLibrary();
  const ordered = timelineOrder(entries);

  function jump(generation: number) {
    document.getElementById(`timeline-group-${generation}`)?.scrollIntoView({ block: 'start' });
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.timeline.title}</h1>
        {canEditCodex && (
          <a className="button button-link" href={hrefs.codexNewEvent}>
            {t.timeline.addEvent}
          </a>
        )}
      </header>
      <p className="timeline-intro">{t.timeline.summary}</p>
      <nav className="timeline-jump" aria-label={t.timeline.jump}>
        {TIMELINE_GROUPS.map((group) => (
          <button key={group.generation} type="button" onClick={() => jump(group.generation)}>
            {group.generation === 0 ? group.title : `Gen ${group.generation}`}
          </button>
        ))}
      </nav>

      {TIMELINE_GROUPS.map((group) => {
        const generation = ordered.find(
          (entry) => entry.timeline?.kind === 'generation' && entry.timeline.generation === group.generation,
        );
        const events = ordered.filter(
          (entry) => entry.timeline?.kind === 'event' && entry.timeline.generation === group.generation,
        );
        return (
          <section
            className="timeline-group"
            id={`timeline-group-${group.generation}`}
            key={group.generation}
            style={{ '--group': group.color } as CSSProperties}
          >
            {generation ? (
              <a className="generation-card" href={hrefs.codexEntry(generation.id)}>
                <EntryArt entry={generation} />
                <span className="generation-copy">
                  <em>{group.years}</em>
                  <strong>{generation.title}</strong>
                  <span>{generation.summary}</span>
                </span>
                {profile.readEntries.includes(generation.id) && <ReadMark />}
              </a>
            ) : (
              <header className="timeline-group-title">
                <h2>{group.title}</h2>
                <p>{group.years}</p>
              </header>
            )}
            <ol className="timeline-events">
              {events.map((entry) => (
                <li className="timeline-event" key={entry.id}>
                  <a href={hrefs.codexEntry(entry.id)}>
                    <span className="timeline-year">{entry.timeline?.label}</span>
                    <strong>{entry.title}</strong>
                    <span>{entry.summary}</span>
                    {profile.readEntries.includes(entry.id) && <ReadMark />}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      <p className="timeline-note">{t.timeline.gapNote}</p>
    </main>
  );
}
