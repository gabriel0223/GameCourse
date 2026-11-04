import type { CSSProperties } from 'react';
import { PathMeter } from '../components/PathMeter';
import type { CodexEntry } from '../content/codex';
import { ERAS } from '../content/paths';
import { TIMELINE_GROUPS } from '../content/timeline';
import { consoleOrder, timelineOrder } from '../content/timelineOrder';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs, useScrollToSection } from '../useHashRoute';
import { EntryArt, ReadMark } from './CodexView';

const t = strings.codex;

const sectionId = (generation: number) => `timeline-group-${generation}`;

// Consoles sit under their era's events, so the timeline stays one unbroken line.
function ConsoleStrip({ consoles, read }: { consoles: CodexEntry[]; read: string[] }) {
  if (!consoles.length) return null;
  return (
    <div className="console-strip">
      <h3>{t.timeline.consoles}</h3>
      <ul>
        {consoles.map((entry) => (
          <li key={entry.id}>
            <a href={hrefs.codexEntry(entry.id)}>
              <EntryArt entry={entry} />
              <span>
                <strong>{entry.title}</strong>
                <small>{[entry.console?.maker, entry.console?.year].join(' · ')}</small>
              </span>
              {read.includes(entry.id) && <ReadMark />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimelineView({ at }: { at: string | null }) {
  const { canEdit, entries } = useCodex();
  const { profile } = useLibrary();
  const ordered = timelineOrder(entries);
  const consoles = consoleOrder(entries);
  useScrollToSection(at === null ? null : sectionId(Number(at)));

  function jump(generation: number) {
    document.getElementById(sectionId(generation))?.scrollIntoView({ block: 'start' });
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.timeline.title}</h1>
        <span className="page-header-actions">
          {canEdit && (
            <a className="button button-link" href={hrefs.codexNewEvent}>
              {t.timeline.addEvent}
            </a>
          )}
          <a className="button button-link" href={hrefs.consoles}>
            {t.consoles.title}
          </a>
        </span>
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
        const era = ERAS.find((item) => item.generation === group.generation);
        return (
          <section
            className="timeline-group"
            id={sectionId(group.generation)}
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
            {era && <PathMeter path={era} />}
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
            <ConsoleStrip
              consoles={consoles.filter((entry) => entry.console?.generation === group.generation)}
              read={profile.readEntries}
            />
          </section>
        );
      })}
      <p className="timeline-note">{t.timeline.gapNote}</p>
    </main>
  );
}
