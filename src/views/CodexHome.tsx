import type { CSSProperties } from 'react';
import { PathCard } from '../components/PathCard';
import { PathMeter } from '../components/PathMeter';
import { GLOSSARY } from '../content/codex';
import { entryExcerpt, entryOfTheDay } from '../content/daily';
import { ERAS, featuredPaths, homeOf } from '../content/paths';
import { GENRE_COLORS } from '../domain/genres';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { EntryArt, ReadMark, pathHref } from './CodexView';

const t = strings.codex;

function TodaysEntry() {
  const { entries } = useCodex();
  const { profile } = useLibrary();
  const today = new Date();
  const entry = entryOfTheDay(entries, today);
  if (!entry) return null;
  const color = entry.genre ? GENRE_COLORS[entry.genre] : homeOf(entry)?.color;
  const style = (color ? { '--group': color } : undefined) as CSSProperties | undefined;
  return (
    <section className="todays-entry" style={style}>
      <EntryArt entry={entry} />
      {profile.readEntries.includes(entry.id) && <ReadMark />}
      <div className="todays-entry-copy">
        <p className="todays-entry-date">{t.home.today(today.toLocaleDateString('en', { month: 'long', day: 'numeric' }))}</p>
        <h2>{entry.title}</h2>
        <p>{entryExcerpt(entry)}</p>
        <a className="button button-primary" href={hrefs.codexEntry(entry.id)}>
          {t.home.readMore}
        </a>
      </div>
    </section>
  );
}

export function CodexHome() {
  const { canEdit } = useCodex();
  const { gamer, profile } = useLibrary();
  const finished = gamer.paths.filter((path) => path.done).map((path) => path.id);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
        {canEdit && (
          <a className="button button-link" href={hrefs.codexNew}>
            {t.newGuide}
          </a>
        )}
      </header>
      <p className="timeline-intro">{t.home.intro}</p>

      <TodaysEntry />

      <section className="codex-section">
        <header className="codex-section-head">
          <h2>{t.home.paths}</h2>
          <a href={hrefs.paths}>{t.home.pathsLink}</a>
        </header>
        <div className="genre-grid guide-grid">
          {featuredPaths(profile.readEntries, finished).map((path) => (
            <PathCard path={path} key={path.id} />
          ))}
        </div>
      </section>

      <section className="codex-section">
        <header className="codex-section-head">
          <h2>{t.home.history}</h2>
          <a href={hrefs.consoles}>{t.home.consolesLink}</a>
        </header>
        <a className="timeline-feature" href={hrefs.timeline}>
          <span className="timeline-feature-years" aria-hidden="true">
            1958
            <i />
            {new Date().getFullYear()}
          </span>
          <span className="timeline-feature-copy">
            <strong>{t.timeline.title}</strong>
            <span>{t.timeline.summary}</span>
          </span>
          <span className="timeline-feature-action">{t.timeline.open}</span>
        </a>
        <div className="era-grid">
          {ERAS.map((era) => (
            <a className="era-tile" href={pathHref(era)} key={era.id} style={{ '--group': era.color } as CSSProperties}>
              <strong>{era.title}</strong>
              <small>{era.years}</small>
              <PathMeter path={era} />
            </a>
          ))}
        </div>
      </section>

      <a className="glossary-door" href={hrefs.glossary}>
        <strong>{t.home.glossary}</strong>
        <span>{t.home.glossarySummary(GLOSSARY.length)}</span>
      </a>
    </main>
  );
}
