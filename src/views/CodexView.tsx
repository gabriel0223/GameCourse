import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { originalArt } from '../content/art';
import { GLOSSARY } from '../content/codex';
import { TIMELINE_GROUPS } from '../content/timeline';
import { timelineOrder } from '../content/timelineOrder';
import type { CodexCategory, CodexEntry, CodexImage, CodexSection } from '../content/codex';
import { canEditCodex } from '../data';
import { GENRE_COLORS } from '../domain/genres';
import { formatDuration } from '../format';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { codexTabHref, currentVisit, hrefs } from '../useHashRoute';
import type { CodexTab } from '../useHashRoute';

const t = strings.codex;

export function EntryArt({ entry }: { entry: CodexEntry }) {
  const { heroImage } = entry;
  const original = originalArt(entry.id);
  if (heroImage) return <img className="codex-art" src={heroImage.src} alt={heroImage.alt} />;
  if (original) return <img className="codex-art codex-art-pixel" src={original} alt="" />;
  return <span className="codex-art" aria-hidden="true" />;
}

const GUIDE_CATEGORIES: CodexCategory[] = ['history', 'consoles', 'playing', 'industry'];
// These have their own pages, and only join this list during a search.
const SEARCH_ONLY: CodexCategory[] = ['history', 'consoles'];

export function ReadMark() {
  return (
    <span className="read-mark" title={t.read}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
      <span className="sr-only">{t.read}</span>
    </span>
  );
}

function GenreCards({ entries, read }: { entries: CodexEntry[]; read: string[] }) {
  return (
    <div className="genre-grid">
      {entries.map((entry) => (
        <a
          className="genre-card"
          key={entry.id}
          href={hrefs.codexEntry(entry.id)}
          style={{ '--genre': entry.genre ? GENRE_COLORS[entry.genre] : undefined } as CSSProperties}
        >
          <EntryArt entry={entry} />
          {read.includes(entry.id) && <ReadMark />}
          <span className="genre-card-body">
            <strong>{entry.title}</strong>
            <span>{entry.summary}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export const consoleOrder = (entries: CodexEntry[]) =>
  entries
    .filter((entry) => entry.console)
    .sort(
      (a, b) =>
        (a.console?.generation ?? 0) - (b.console?.generation ?? 0) || (a.console?.year ?? 0) - (b.console?.year ?? 0),
    );

export function ConsoleCards({ entries }: { entries: CodexEntry[] }) {
  const { profile } = useLibrary();
  return (
    <div className="genre-grid console-grid">
      {entries.map((entry) => (
        <a className="genre-card console-card" key={entry.id} href={hrefs.codexEntry(entry.id)}>
          <EntryArt entry={entry} />
          {profile.readEntries.includes(entry.id) && <ReadMark />}
          <span className="genre-card-body">
            <strong>{entry.title}</strong>
            <span>
              {[entry.console?.maker, entry.console?.year].join(' · ')}
              {entry.console?.sales && <small>{t.consoles.sold(entry.console.sales)}</small>}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

function GuideList({ entries, read }: { entries: CodexEntry[]; read: string[] }) {
  return (
    <ul className="guide-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <a className="guide-link" href={hrefs.codexEntry(entry.id)}>
            <EntryArt entry={entry} />
            <span className="guide-copy">
              <strong>{entry.title}</strong>
              <span>{entry.summary}</span>
            </span>
            {read.includes(entry.id) && <ReadMark />}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CodexView({ tab }: { tab: CodexTab }) {
  const { profile } = useLibrary();
  const { entries: allEntries } = useCodex();
  const [query, setQuery] = useState(() => currentVisit().query ?? '');
  const needle = query.trim().toLowerCase();

  const entries = useMemo(
    () =>
      allEntries.filter(
        (entry) =>
          !needle ||
          entry.title.toLowerCase().includes(needle) ||
          entry.summary.toLowerCase().includes(needle) ||
          entry.console?.maker.toLowerCase().includes(needle) ||
          entry.examples?.some((name) => name.toLowerCase().includes(needle)),
      ),
    [allEntries, needle],
  );
  const terms = useMemo(
    () =>
      GLOSSARY.filter(
        (item) =>
          !needle || item.term.toLowerCase().includes(needle) || item.definition.toLowerCase().includes(needle),
      ),
    [needle],
  );

  const shows = (category: CodexTab) => tab === 'all' || tab === category;
  const byCategory = (category: CodexCategory) => entries.filter((entry) => entry.category === category);
  const showGenres = shows('genres') && byCategory('genres').length > 0;
  const showTerms = shows('terms') && terms.length > 0;
  const guides = GUIDE_CATEGORIES.filter(
    (category) => shows(category) && byCategory(category).length > 0 && (!SEARCH_ONLY.includes(category) || needle),
  );
  const readCount = allEntries.filter((entry) => profile.readEntries.includes(entry.id)).length;

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
        {canEditCodex && (
          <a className="button button-link" href={hrefs.codexNew}>
            {t.newGuide}
          </a>
        )}
        <div className="codex-search">
          <label className="sr-only" htmlFor="codex-search">
            {t.searchLabel}
          </label>
          <input
            id="codex-search"
            type="search"
            value={query}
            placeholder={t.searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
              currentVisit().query = event.target.value;
            }}
          />
        </div>
      </header>

      <p className="count codex-count">{t.readCount(readCount, allEntries.length)}</p>

      {tab === 'all' && !needle && (
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
      )}
      {tab === 'all' && !needle && (
        <a className="timeline-feature" href={hrefs.consoles}>
          <span className="timeline-feature-years" aria-hidden="true">
            Gen 1
            <i />
            Gen 9
          </span>
          <span className="timeline-feature-copy">
            <strong>{t.consoles.title}</strong>
            <span>{t.consoles.summary}</span>
          </span>
          <span className="timeline-feature-action">{t.consoles.open}</span>
        </a>
      )}
      {showGenres && (
        <section className="codex-section">
          <h2>{t.categories.genres}</h2>
          <GenreCards entries={byCategory('genres')} read={profile.readEntries} />
        </section>
      )}
      {guides.map((category) => (
        <section className="codex-section" key={category}>
          <h2>{t.categories[category]}</h2>
          <GuideList entries={byCategory(category)} read={profile.readEntries} />
        </section>
      ))}
      {showTerms && (
        <section className="codex-section">
          <h2>{t.categories.terms}</h2>
          <dl className="glossary">
            {terms.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!showGenres && guides.length === 0 && !showTerms && <p className="empty">{t.noResults}</p>}
    </main>
  );
}

function FaceButtons() {
  const buttons = [
    { x: 160, y: 56, symbol: 'triangle', letter: 'Y' },
    { x: 240, y: 126, symbol: 'circle', letter: 'B' },
    { x: 160, y: 196, symbol: 'cross', letter: 'A' },
    { x: 80, y: 126, symbol: 'square', letter: 'X' },
  ];
  return (
    <svg className="face-buttons" viewBox="0 0 320 252" role="img" aria-label={t.figureAlt}>
      {buttons.map((button) => (
        <g key={button.symbol} transform={`translate(${button.x} ${button.y})`}>
          <circle r="42" fill="#1c1929" stroke="#2c2839" strokeWidth="2" />
          <g fill="none" stroke="#f6f3fb" strokeWidth="3" strokeLinejoin="round" transform="translate(-13 0)">
            {button.symbol === 'triangle' && <path d="M0 -11 11 8H-11Z" />}
            {button.symbol === 'circle' && <circle r="10" />}
            {button.symbol === 'cross' && <path d="M-9 -9 9 9M9 -9-9 9" />}
            {button.symbol === 'square' && <rect x="-9" y="-9" width="18" height="18" />}
          </g>
          <text x="16" y="7" fill="#ffc857" fontSize="21" fontWeight="700" textAnchor="middle">
            {button.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ArticleImage({ image }: { image: CodexImage }) {
  return (
    <figure className="article-image">
      <img src={image.src} alt={image.alt} />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

function GenerationConsoles({ generation }: { generation: number }) {
  const { entries } = useCodex();
  const consoles = consoleOrder(entries).filter((entry) => entry.console?.generation === generation);
  if (!consoles.length) return <p>{t.consoles.none}</p>;
  return <ConsoleCards entries={consoles} />;
}

function Section({ section }: { section: CodexSection }) {
  return (
    <section>
      {section.heading && <h2>{section.heading}</h2>}
      {section.text && <p>{section.text}</p>}
      {section.list && (
        <ul>
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.steps && (
        <ol>
          {section.steps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {section.figure === 'face-buttons' && <FaceButtons />}
      {section.consoles !== undefined && <GenerationConsoles generation={section.consoles} />}
      {section.image && <ArticleImage image={section.image} />}
      {section.table && (
        <div className="article-table">
          <table>
            <thead>
              <tr>
                {section.table.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GenreProgressPanel({ entry }: { entry: CodexEntry }) {
  const { gamer } = useLibrary();
  const progress = gamer.genres.find((item) => item.genre === entry.genre);
  if (!progress) return null;
  return (
    <section className="progress-panel">
      <h2>{t.yourProgress}</h2>
      <div className="progress-level">
        <span>
          {strings.level} {progress.level}
        </span>
        <span>{progress.minutes > 0 ? t.played(formatDuration(progress.minutes)) : t.notPlayed}</span>
      </div>
      <div className="genre-bar">
        <span
          style={{
            width: `${Math.round((progress.intoLevel / progress.needed) * 100)}%`,
            background: GENRE_COLORS[progress.genre],
          }}
        />
      </div>
      <p className="progress-next">
        {progress.nextPiece
          ? strings.character.nextUnlock(progress.nextPiece.name, progress.nextPiece.shopLevel)
          : strings.character.allUnlocked}
      </p>
    </section>
  );
}

function TimelineNavigation({ entry }: { entry: CodexEntry }) {
  const { entries } = useCodex();
  const ordered = timelineOrder(entries);
  const index = ordered.findIndex((item) => item.id === entry.id);
  const stops = [
    [t.timeline.earlier, ordered[index - 1]],
    [t.timeline.later, ordered[index + 1]],
  ] as const;
  const group = TIMELINE_GROUPS.find((item) => item.generation === entry.timeline?.generation);
  const parent = entry.timeline?.kind === 'event' && group && group.generation > 0 ? `gen-${group.generation}` : null;
  return (
    <section>
      <h2>{t.timeline.onTimeline}</h2>
      <ul className="example-list">
        {parent && group && (
          <li>
            <a href={hrefs.codexEntry(parent)}>
              {t.timeline.partOf} {group.title}
            </a>
          </li>
        )}
        {stops.map(
          ([label, item]) =>
            item && (
              <li key={label}>
                <a href={hrefs.codexEntry(item.id)}>
                  {label}: {item.title}
                </a>
              </li>
            ),
        )}
      </ul>
    </section>
  );
}

function ReadControl({ entry }: { entry: CodexEntry }) {
  const { profile, setRead } = useLibrary();
  const read = profile.readEntries.includes(entry.id);
  return (
    <div className="read-control">
      <button
        className={read ? 'button button-quiet' : 'button button-primary'}
        type="button"
        onClick={() => setRead(entry.id, !read)}
      >
        {read ? t.markUnread : t.markRead}
      </button>
      {read && (
        <span className="read-status">
          <span aria-hidden="true">
            <ReadMark />
          </span>
          {t.read}
        </span>
      )}
    </div>
  );
}

function ConsolePanel({ entry }: { entry: CodexEntry }) {
  const { entries } = useCodex();
  const info = entry.console;
  if (!info) return null;
  const ordered = consoleOrder(entries);
  const index = ordered.findIndex((item) => item.id === entry.id);
  const stops = [
    [t.timeline.earlier, ordered[index - 1]],
    [t.timeline.later, ordered[index + 1]],
  ] as const;
  const group = TIMELINE_GROUPS.find((item) => item.generation === info.generation);
  return (
    <>
      <section>
        <h2>{t.consoles.card}</h2>
        <dl className="console-facts">
          <div>
            <dt>{t.consoles.maker}</dt>
            <dd>{info.maker}</dd>
          </div>
          <div>
            <dt>{t.consoles.released}</dt>
            <dd>{info.year}</dd>
          </div>
          <div>
            <dt>{t.consoles.type}</dt>
            <dd>{info.handheld ? t.consoles.handheld : t.consoles.homeConsole}</dd>
          </div>
          {info.sales && (
            <div>
              <dt>{t.consoles.sales}</dt>
              <dd>{info.sales}</dd>
            </div>
          )}
        </dl>
      </section>
      <section>
        <h2>{t.consoles.back}</h2>
        <ul className="example-list">
          {group && (
            <li>
              <a href={hrefs.codexEntry(`gen-${group.generation}`)}>
                {t.timeline.partOf} {group.title}
              </a>
            </li>
          )}
          {index >= 0 &&
            stops.map(
              ([label, item]) =>
                item && (
                  <li key={label}>
                    <a href={hrefs.codexEntry(item.id)}>
                      {label}: {item.title}
                    </a>
                  </li>
                ),
            )}
        </ul>
      </section>
    </>
  );
}

export function Article({ entry, preview = false }: { entry: CodexEntry; preview?: boolean }) {
  const { find } = useCodex();
  const related = (entry.related ?? []).flatMap((relatedId) => find(relatedId) ?? []);
  const onTimeline = Boolean(entry.timeline);
  const hasSide = Boolean(entry.genre || entry.console || entry.examples?.length || related.length || onTimeline);
  const groupColor = TIMELINE_GROUPS.find(
    (item) => item.generation === (entry.timeline?.generation ?? entry.console?.generation),
  )?.color;
  const color = entry.genre ? GENRE_COLORS[entry.genre] : groupColor;
  const style = (color ? { '--genre': color } : undefined) as CSSProperties | undefined;
  const section: CodexTab = entry.category;
  const backHref = codexTabHref(section);

  return (
    <div style={style}>
      <header className="article-hero">
        <div className="article-hero-inner">
          {!preview && (
            <a className="back" href={backHref}>
              {onTimeline ? t.timeline.back : t.categories[section]}
            </a>
          )}
          <div className="article-hero-row">
            <div>
              {(entry.timeline || entry.console) && (
                <p className="article-kicker">{entry.timeline?.label ?? entry.console?.year}</p>
              )}
              <h1>{entry.title}</h1>
              <p>{entry.summary}</p>
              {!preview && canEditCodex && (
                <a className="button button-link article-hero-actions" href={hrefs.codexEdit(entry.id)}>
                  {t.edit}
                </a>
              )}
            </div>
            <EntryArt entry={entry} />
          </div>
        </div>
      </header>
      <div className="article-layout">
        <article className="article">
          {entry.sections.map((section, index) => (
            <Section key={index} section={section} />
          ))}
          {!preview && <ReadControl entry={entry} />}
        </article>
        {hasSide && (
          <aside className="article-side">
            {entry.genre && <GenreProgressPanel entry={entry} />}
            {onTimeline && !preview && <TimelineNavigation entry={entry} />}
            {entry.console && <ConsolePanel entry={entry} />}
            {entry.examples && (
              <section>
                <h2>{t.examples}</h2>
                <ul className="example-list">
                  {entry.examples.map((name) => (
                    <li key={name}>
                      <a href={hrefs.search(name)} aria-label={t.findGame(name)}>
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {related.length > 0 && (
              <section>
                <h2>{t.related}</h2>
                <ul className="example-list">
                  {related.map((item) => (
                    <li key={item.id}>
                      <a href={hrefs.codexEntry(item.id)}>{item.title}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export function CodexEntryView({ id }: { id: string }) {
  const { find, ready } = useCodex();
  const entry = find(id);

  if (!ready) return <main className="page" aria-busy="true" />;
  if (!entry) {
    return (
      <main className="page">
        <a className="back" href={hrefs.codex}>
          {t.back}
        </a>
        <p className="notice">{t.notFound}</p>
      </main>
    );
  }

  return (
    <main>
      <Article entry={entry} />
    </main>
  );
}
