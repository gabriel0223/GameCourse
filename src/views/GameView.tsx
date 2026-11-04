import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Cover } from '../components/GameCard';
import { catalog } from '../data';
import { GENRE_COLORS, WARDROBE_GENRES, pickMainGenre } from '../domain/genres';
import type { WardrobeGenre } from '../domain/genres';
import type { Game, LibraryEntry } from '../domain/types';
import { entryMinutes } from '../domain/xp';
import { formatDay, formatDuration, todayLocal } from '../format';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { getPreviousHash } from '../useHashRoute';

const t = strings.game;

function Fact({ label, values }: { label: string; values: Array<string | number> }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{values.length > 0 ? values.join(', ') : t.unknown}</dd>
    </div>
  );
}

function LogForm({ game }: { game: Game }) {
  const { logTime } = useLibrary();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [error, setError] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const total = Number(hours || 0) * 60 + Number(minutes || 0);
    if (!Number.isFinite(total) || total <= 0) {
      setError(true);
      return;
    }
    logTime(game, Math.round(total), date || todayLocal());
    setHours('');
    setMinutes('');
    setError(false);
  }

  return (
    <form className="log-form" onSubmit={submit} noValidate>
      <h2>{t.logTitle}</h2>
      <div className="log-fields">
        <label>
          {t.hours}
          <input
            inputMode="numeric"
            type="number"
            min="0"
            value={hours}
            aria-invalid={error}
            onChange={(event) => {
              setHours(event.target.value);
              setError(false);
            }}
          />
        </label>
        <label>
          {t.minutes}
          <input
            inputMode="numeric"
            type="number"
            min="0"
            value={minutes}
            aria-invalid={error}
            onChange={(event) => {
              setMinutes(event.target.value);
              setError(false);
            }}
          />
        </label>
        <label>
          {t.date}
          <input type="date" value={date} max={todayLocal()} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {t.logError}
        </p>
      )}
      <button className="button button-primary" type="submit">
        {t.logButton}
      </button>
    </form>
  );
}

function StatusActions({ game, entry }: { game: Game; entry?: LibraryEntry }) {
  const { addToBacklog, setStatus, removeGame } = useLibrary();
  const [confirming, setConfirming] = useState(false);

  if (!entry) {
    return (
      <div className="actions">
        <button className="button button-primary" type="button" onClick={() => addToBacklog(game)}>
          {t.addBacklog}
        </button>
      </div>
    );
  }

  const { status } = entry;
  return (
    <div className="actions">
      {status !== 'finished' && (
        <button className="button button-primary" type="button" onClick={() => setStatus(entry, 'finished')}>
          {t.markFinished}
        </button>
      )}
      {(status === 'finished' || status === 'dropped') && (
        <button className="button" type="button" onClick={() => setStatus(entry, 'playing')}>
          {t.resume}
        </button>
      )}
      {status === 'playing' && (
        <button className="button" type="button" onClick={() => setStatus(entry, 'backlog')}>
          {t.moveBacklog}
        </button>
      )}
      {status !== 'dropped' && status !== 'finished' && (
        <button className="button" type="button" onClick={() => setStatus(entry, 'dropped')}>
          {t.markDropped}
        </button>
      )}
      {confirming ? (
        <>
          <button className="button button-danger" type="button" onClick={() => removeGame(entry)}>
            {t.confirmRemove}
          </button>
          <button className="button" type="button" onClick={() => setConfirming(false)}>
            {t.cancel}
          </button>
        </>
      ) : (
        <button className="button button-quiet" type="button" onClick={() => setConfirming(true)}>
          {t.remove}
        </button>
      )}
    </div>
  );
}

function History({ entry }: { entry: LibraryEntry }) {
  const { deleteSession } = useLibrary();
  const sessions = [...entry.sessions].sort((a, b) => b.playedOn.localeCompare(a.playedOn));
  return (
    <section className="history-section">
      <h2>{t.history}</h2>
      {sessions.length === 0 ? (
        <p className="empty-small">{t.noHistory}</p>
      ) : (
        <ul className="history">
          {sessions.map((session) => (
            <li key={session.id}>
              <span>{formatDay(session.playedOn)}</span>
              <span className="history-time">{formatDuration(session.minutes)}</span>
              <button
                className="button button-quiet"
                type="button"
                aria-label={t.deleteSessionLabel(formatDuration(session.minutes), formatDay(session.playedOn))}
                onClick={() => deleteSession(entry, session.id)}
              >
                {t.deleteSession}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function GameView({ id }: { id: string }) {
  const { find, setMainGenre, loading } = useLibrary();
  const entry = find(id);
  const [fetched, setFetched] = useState<Game | null | undefined>(undefined);

  useEffect(() => {
    let current = true;
    setFetched(undefined);
    if (!loading && !entry) {
      catalog
        .get(id)
        .then((game) => current && setFetched(game))
        .catch(() => current && setFetched(null));
    }
    return () => {
      current = false;
    };
  }, [id, loading, entry]);

  const game = entry?.game ?? fetched;
  if (game === undefined) return <main className="page" aria-busy="true" />;
  if (game === null) {
    return (
      <main className="page">
        <p className="notice">{t.notFound}</p>
      </main>
    );
  }

  const genre: WardrobeGenre = entry?.mainGenre ?? pickMainGenre(game.genres, game.themes);
  const genreStyle = { '--genre': GENRE_COLORS[genre] } as CSSProperties;
  return (
    <main className="game-page" style={genreStyle}>
      <header className="game-hero">
        {game.coverUrl && <img className="game-backdrop" src={game.coverUrl} alt="" />}
        <a className="back" href={getPreviousHash()}>
          {t.back}
        </a>
        <div className="game-hero-row">
          <Cover game={game} genreColor={GENRE_COLORS[genre]} />
          <div className="game-title">
            <p className="game-genre">{genre}</p>
            <h1>{game.name}</h1>
            {game.summary && <p className="summary">{game.summary}</p>}
            {entry && (
              <p className="game-state">
                <span className={`status-badge status-${entry.status}`}>{strings.lists[entry.status]}</span>
                <span>
                  {t.played} <strong>{formatDuration(entryMinutes(entry))}</strong>
                </span>
              </p>
            )}
            <StatusActions game={game} entry={entry} />
          </div>
        </div>
      </header>
      <div className="game-body">
        <div className="game-activity">
          <LogForm game={game} />
          {entry && <History entry={entry} />}
        </div>
        <aside className="game-details">
          <dl className="facts">
            <Fact label={t.released} values={game.year ? [game.year] : []} />
            <Fact label={t.developer} values={game.developers} />
            <Fact label={t.publisher} values={game.publishers} />
            <Fact label={t.platforms} values={game.platforms} />
            <Fact label={t.igdbGenres} values={game.genres} />
          </dl>
          {entry && (
            <label className="genre-picker">
              {t.mainGenre}
              <select
                value={entry.mainGenre}
                onChange={(event) => setMainGenre(entry, event.target.value as WardrobeGenre)}
              >
                {WARDROBE_GENRES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}
        </aside>
      </div>
    </main>
  );
}
