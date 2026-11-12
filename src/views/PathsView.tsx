import { PathCard } from '../components/PathCard';
import { PathMeter } from '../components/PathMeter';
import { originalArt } from '../content/art';
import { PATHS, findPath, pathEntries } from '../content/paths';
import { QUIZZES } from '../content/quizzes';
import { passMark } from '../domain/quiz';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { EntryArt } from './CodexView';
import { QuestMark } from '../components/QuestMark';

const t = strings.codex;

export function PathsView() {
  const { canEdit } = useCodex();
  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.tabs.paths}</h1>
        {canEdit && (
          <a className="button button-link" href={hrefs.codexNew}>
            {t.newGuide}
          </a>
        )}
      </header>
      <p className="timeline-intro">{t.paths.intro}</p>
      <div className="genre-grid guide-grid">
        {PATHS.map((path) => (
          <PathCard path={path} key={path.id} />
        ))}
      </div>
    </main>
  );
}

export function PathView({ id }: { id: string | null }) {
  const { entries, ready } = useCodex();
  const { gamer, profile } = useLibrary();
  const path = findPath(id);

  if (!ready) return <main className="page" aria-busy="true" />;
  if (!path) {
    return (
      <main className="page">
        <a className="back" href={hrefs.paths}>
          {t.paths.back}
        </a>
        <p className="notice">{t.paths.notFound}</p>
      </main>
    );
  }

  const stops = pathEntries(path, entries);
  const isRead = (stopId: string) => profile.readEntries.includes(stopId);
  const nextUp = stops.find((stop) => !isRead(stop.id)) ?? stops[0];
  const started = stops.some((stop) => isRead(stop.id));
  const allRead = stops.every((stop) => isRead(stop.id));
  const quiz = QUIZZES[path.id];
  const record = profile.quizzes[path.id];
  const finished = Boolean(gamer.paths.find((item) => item.id === path.id)?.done);
  const quizHref = hrefs.pathQuiz(path.id);
  // Once every stop is read, the next thing to do is the quiz.
  const quizFirst = Boolean(quiz) && allRead && !finished;

  return (
    <main className="page">
      <a className="back" href={hrefs.paths}>
        {t.paths.back}
      </a>
      <header className="path-hero">
        <div>
          <h1>{path.title}</h1>
          <p>{path.summary}</p>
          <PathMeter path={path} />
          {record?.passed && <p className="path-best">{t.paths.bestScore(record.best, record.total)}</p>}
          <div className="path-hero-actions">
            <a className="button button-primary" href={quizFirst ? quizHref : hrefs.pathStop(nextUp.id, path.id)}>
              {quizFirst ? t.paths.takeQuiz : allRead ? t.paths.again : started ? t.paths.continue : t.paths.start}
            </a>
            {quiz && !quizFirst && (
              <a className="button button-link" href={quizHref}>
                {record?.passed && record.best < record.total ? t.paths.beatScore : t.paths.takeQuiz}
              </a>
            )}
          </div>
        </div>
        {path.art && <img className="codex-art codex-art-pixel" src={originalArt(path.art)} alt="" />}
      </header>
      <ol className="path-stops">
        {stops.map((stop, index) => (
          <li key={stop.id}>
            <a href={hrefs.pathStop(stop.id, path.id)} data-read={isRead(stop.id)}>
              <span className="path-stop-number">{index + 1}</span>
              <EntryArt entry={stop} />
              <span className="path-stop-copy">
                <strong>
                  {stop.title}
                  <QuestMark entryId={stop.id} inline />
                </strong>
                <span>{stop.summary}</span>
              </span>
            </a>
          </li>
        ))}
        {quiz && (
          <li>
            <a href={quizHref} data-read={finished}>
              <span className="path-stop-number">?</span>
              <span className="path-stop-copy path-stop-quiz">
                <strong>{t.paths.takeQuiz}</strong>
                <span>
                  {record?.passed
                    ? t.paths.quizPassed(record.best, record.total)
                    : t.paths.quizRow(quiz.length, passMark(quiz.length))}
                </span>
              </span>
            </a>
          </li>
        )}
      </ol>
    </main>
  );
}
