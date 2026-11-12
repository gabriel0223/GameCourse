import type { CSSProperties } from 'react';
import { GameShelf } from '../components/GameShelf';
import { PathMeter } from '../components/PathMeter';
import { originalArt } from '../content/art';
import type { CodexEntry, CodexImage, CodexSection } from '../content/codex';
import { findPath, homeOf, nextChoices, pathEntries, pathsWith } from '../content/paths';
import type { Path } from '../content/paths';
import { QUIZZES } from '../content/quizzes';
import { TIMELINE_GROUPS } from '../content/timeline';
import { consoleOrder, timelineOrder } from '../content/timelineOrder';
import { GENRE_COLORS } from '../domain/genres';
import { formatDuration } from '../format';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { EntryQuests } from './QuestsView';
import { QuestMark } from '../components/QuestMark';

const t = strings.codex;

export function EntryArt({ entry }: { entry: CodexEntry }) {
  const { heroImage } = entry;
  const original = originalArt(entry.id);
  if (heroImage) return <img className="codex-art" src={heroImage.src} alt={heroImage.alt} />;
  if (original) return <img className="codex-art codex-art-pixel" src={original} alt="" />;
  return <span className="codex-art" aria-hidden="true" />;
}

export const pathHref = (path: Path) =>
  path.generation === undefined ? hrefs.path(path.id) : hrefs.timelineAt(path.generation);

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

export function EntryCards({ entries, read, wide = false }: { entries: CodexEntry[]; read: string[]; wide?: boolean }) {
  return (
    <div className={wide ? 'genre-grid guide-grid' : 'genre-grid'}>
      {entries.map((entry) => (
        <a
          className="genre-card"
          key={entry.id}
          href={hrefs.codexEntry(entry.id)}
          style={{ '--genre': entry.genre ? GENRE_COLORS[entry.genre] : undefined } as CSSProperties}
        >
          <EntryArt entry={entry} />
          {read.includes(entry.id) && <ReadMark />}
          <QuestMark entryId={entry.id} />
          <span className="genre-card-body">
            <strong>{entry.title}</strong>
            <span>{entry.summary}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function ConsoleCards({ entries }: { entries: CodexEntry[] }) {
  const { profile } = useLibrary();
  return (
    <div className="genre-grid console-grid">
      {entries.map((entry) => (
        <a className="genre-card console-card" key={entry.id} href={hrefs.codexEntry(entry.id)}>
          <EntryArt entry={entry} />
          {profile.readEntries.includes(entry.id) && <ReadMark />}
          <QuestMark entryId={entry.id} />
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
      {section.games && <GameShelf games={section.games} />}
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

function GenerationEvents({ generation }: { generation: number }) {
  const { entries } = useCodex();
  const { profile } = useLibrary();
  const events = timelineOrder(entries).filter(
    (entry) => entry.timeline?.kind === 'event' && entry.timeline.generation === generation,
  );
  if (!events.length) return null;
  return (
    <section>
      <h2>{t.timeline.events}</h2>
      <ol className="era-events">
        {events.map((entry) => (
          <li key={entry.id}>
            <a href={hrefs.codexEntry(entry.id)}>
              <span className="timeline-year">{entry.timeline?.label}</span>
              <strong>
                {entry.title}
                <QuestMark entryId={entry.id} inline />
              </strong>
              {profile.readEntries.includes(entry.id) && <ReadMark />}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PartOfPanel({ entry }: { entry: CodexEntry }) {
  const paths = pathsWith(entry);
  if (!paths.length) return null;
  return (
    <section className="progress-panel part-of">
      <h2>{t.paths.partOf}</h2>
      {paths.map((path) => (
        <div key={path.id}>
          <a className="path-link" href={pathHref(path)}>
            {path.title}
          </a>
          <PathMeter path={path} />
        </div>
      ))}
    </section>
  );
}

function PathPanel({ path, stops, current }: { path: Path; stops: CodexEntry[]; current: number }) {
  const { profile } = useLibrary();
  const quiz = QUIZZES[path.id];
  return (
    <section className="progress-panel">
      <a className="path-link" href={hrefs.path(path.id)}>
        {path.title}
      </a>
      <PathMeter path={path} />
      <ol className="path-mini">
        {stops.map((stop, index) => (
          <li key={stop.id}>
            <a
              href={hrefs.pathStop(stop.id, path.id)}
              aria-current={index === current ? 'step' : undefined}
              data-read={profile.readEntries.includes(stop.id)}
            >
              {stop.title}
            </a>
          </li>
        ))}
      </ol>
      {quiz && (
        <a className="path-mini-quiz" href={hrefs.pathQuiz(path.id)}>
          {t.paths.takeQuiz}
        </a>
      )}
    </section>
  );
}

function PathControls({ entry, path, stops, current }: { entry: CodexEntry; path: Path; stops: CodexEntry[]; current: number }) {
  const { profile, setRead } = useLibrary();
  const read = profile.readEntries.includes(entry.id);
  const previous = stops[current - 1];
  const next = stops[current + 1];
  // The last stop leads to the quiz, unless she has already passed it.
  const toQuiz = !next && Boolean(QUIZZES[path.id]) && !profile.quizzes[path.id]?.passed;
  const target = next ? hrefs.pathStop(next.id, path.id) : toQuiz ? hrefs.pathQuiz(path.id) : hrefs.path(path.id);
  const finishLabel = toQuiz ? t.paths.takeQuiz : t.paths.finish;
  const readLabel = toQuiz ? t.paths.readAndQuiz : t.paths.readAndFinish;
  const primary = read ? (next ? t.paths.nextStop : finishLabel) : next ? t.paths.readAndNext : readLabel;

  return (
    <div className="path-controls">
      <button
        className="button button-primary"
        type="button"
        onClick={() => {
          if (!read) setRead(entry.id, true);
          window.location.hash = target;
        }}
      >
        {primary}
      </button>
      {read && (
        <button className="button button-quiet" type="button" onClick={() => setRead(entry.id, false)}>
          {t.markUnread}
        </button>
      )}
      <span className="path-controls-links">
        {previous && <a href={hrefs.pathStop(previous.id, path.id)}>{t.paths.previousStop}</a>}
        {next && <a href={target}>{`${t.paths.nextStop}: ${next.title}`}</a>}
      </span>
    </div>
  );
}

function NextChoices({ entry }: { entry: CodexEntry }) {
  const { entries } = useCodex();
  const { profile } = useLibrary();
  const choices = nextChoices(entry, entries, profile.readEntries);
  if (!choices.length) return null;
  return (
    <section className="next-choices">
      <h2>{t.next.title}</h2>
      <div>
        {choices.map((choice) => (
          <a className="next-card" href={hrefs.codexEntry(choice.entry.id)} key={choice.entry.id}>
            <EntryArt entry={choice.entry} />
            {profile.readEntries.includes(choice.entry.id) && <ReadMark />}
            <QuestMark entryId={choice.entry.id} />
            <span>
              <em>{t.next[choice.reason]}</em>
              <strong>{choice.entry.title}</strong>
            </span>
          </a>
        ))}
      </div>
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
  const info = entry.console;
  if (!info) return null;
  return (
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
  );
}

export function Article({
  entry,
  preview = false,
  pathId = null,
}: {
  entry: CodexEntry;
  preview?: boolean;
  pathId?: string | null;
}) {
  const { canEdit, entries } = useCodex();
  const opened = findPath(pathId);
  const stops = opened ? pathEntries(opened, entries) : [];
  const current = stops.findIndex((stop) => stop.id === entry.id);
  const path = current >= 0 ? opened : undefined;
  const home = homeOf(entry);
  const hasSide = Boolean(!preview || entry.genre || entry.console);
  const groupColor = TIMELINE_GROUPS.find(
    (item) => item.generation === (entry.timeline?.generation ?? entry.console?.generation),
  )?.color;
  const color = entry.genre ? GENRE_COLORS[entry.genre] : groupColor;
  const style = (color ? { '--genre': color } : undefined) as CSSProperties | undefined;

  return (
    <div style={style}>
      <header className="article-hero">
        <div className="article-hero-inner">
          {!preview && (
            <a className="back" href={path ? hrefs.path(path.id) : home ? pathHref(home) : hrefs.codex}>
              {path?.title ?? home?.title ?? t.back}
            </a>
          )}
          <div className="article-hero-row">
            <div>
              {path ? (
                <p className="article-kicker">{t.paths.stopOf(current + 1, stops.length)}</p>
              ) : (
                (entry.timeline || entry.console) && (
                  <p className="article-kicker">{entry.timeline?.label ?? entry.console?.year}</p>
                )
              )}
              <h1>{entry.title}</h1>
              <p>{entry.summary}</p>
              {!preview && canEdit && (
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
          {entry.timeline?.kind === 'generation' && !preview && <GenerationEvents generation={entry.timeline.generation} />}
          {!preview && <EntryQuests entry={entry} />}
          {!preview &&
            (path ? (
              <PathControls entry={entry} path={path} stops={stops} current={current} />
            ) : (
              <>
                <ReadControl entry={entry} />
                <NextChoices entry={entry} />
              </>
            ))}
        </article>
        {hasSide && (
          <aside className="article-side">
            {!preview && (path ? <PathPanel path={path} stops={stops} current={current} /> : <PartOfPanel entry={entry} />)}
            {entry.genre && <GenreProgressPanel entry={entry} />}
            {entry.console && <ConsolePanel entry={entry} />}
          </aside>
        )}
      </div>
    </div>
  );
}

export function CodexEntryView({ id, pathId }: { id: string; pathId: string | null }) {
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
      <Article entry={entry} pathId={pathId} />
    </main>
  );
}
