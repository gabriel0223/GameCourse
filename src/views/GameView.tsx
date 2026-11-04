import { useEffect, useId, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Cover } from '../components/GameCard';
import { Star } from '../components/Star';
import { catalog, seenGame } from '../data';
import { GENRE_COLORS, pickGenres } from '../domain/genres';
import type { Game, LibraryEntry } from '../domain/types';
import { XP_PER_HOUR, entryMinutes } from '../domain/xp';
import { formatDay, formatDuration, todayLocal } from '../format';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { getPreviousHash } from '../useHashRoute';

const t = strings.game;
const QUICK_MINUTES = [15, 30, 60, 120];
const MINUTE_STEP = 15;
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function Fact({ label, values }: { label: string; values: Array<string | number> }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{values.length > 0 ? values.join(', ') : t.unknown}</dd>
    </div>
  );
}

function Stepper({
  label,
  value,
  lessLabel,
  moreLabel,
  onChange,
  onStep,
}: {
  label: string;
  value: string;
  lessLabel: string;
  moreLabel: string;
  onChange(value: string): void;
  onStep(direction: 1 | -1): void;
}) {
  const id = useId();
  return (
    <div className="stepper">
      <label className="stepper-label" htmlFor={id}>
        {label}
      </label>
      <div className="stepper-control">
        <button type="button" aria-label={lessLabel} onClick={() => onStep(-1)}>
          &minus;
        </button>
        <input
          id={id}
          inputMode="numeric"
          type="number"
          min="0"
          placeholder="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" aria-label={moreLabel} onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  );
}

function LogForm({ game }: { game: Game }) {
  const { logTime } = useLibrary();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const total = Math.round(Math.max(Number(hours) || 0, 0) * 60 + Math.max(Number(minutes) || 0, 0));

  function setTotal(next: number) {
    const clamped = Math.max(next, 0);
    const wholeHours = Math.floor(clamped / 60);
    setHours(wholeHours > 0 ? String(wholeHours) : '');
    setMinutes(clamped % 60 > 0 ? String(clamped % 60) : '');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (total <= 0) return;
    logTime(game, total, todayLocal());
    setTotal(0);
  }

  return (
    <form className="log-form" onSubmit={submit} noValidate>
      <h2>{t.logTitle}</h2>
      <div className="log-quick">
        {QUICK_MINUTES.map((amount) => (
          <button
            key={amount}
            type="button"
            aria-label={t.addTime(formatDuration(amount))}
            onClick={() => setTotal(total + amount)}
          >
            +{formatDuration(amount)}
          </button>
        ))}
      </div>
      <div className="log-fields">
        <Stepper
          label={t.hours}
          value={hours}
          lessLabel={t.fewerHours}
          moreLabel={t.moreHours}
          onChange={setHours}
          onStep={(direction) => setTotal(total + direction * 60)}
        />
        <Stepper
          label={t.minutes}
          value={minutes}
          lessLabel={t.fewerMinutes}
          moreLabel={t.moreMinutes}
          onChange={setMinutes}
          onStep={(direction) => setTotal(total + direction * MINUTE_STEP)}
        />
      </div>
      <div className="log-foot">
        <button className="button button-primary" type="submit" disabled={total <= 0}>
          {total > 0 ? t.logAmount(formatDuration(total)) : t.logButton}
        </button>
        {total > 0 && <span className="log-xp">{t.xpPreview(Math.round((total / 60) * XP_PER_HOUR))}</span>}
      </div>
    </form>
  );
}

function RatingPicker({ entry }: { entry: LibraryEntry }) {
  const { setRating } = useLibrary();
  const [preview, setPreview] = useState<number | null>(null);
  const lit = preview ?? entry.rating ?? 0;
  return (
    <section className="rating-section">
      <div className="rating-heading">
        <h2>{t.ratingTitle}</h2>
        <span className="rating-value">
          {lit > 0 ? (
            <>
              <strong>{lit}</strong>/10
            </>
          ) : (
            t.ratingPrompt
          )}
        </span>
      </div>
      <div className="rating-scale" role="group" aria-label={t.ratingTitle} onPointerLeave={() => setPreview(null)}>
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            className={rating <= lit ? 'rating-lit' : undefined}
            aria-label={t.ratingOption(rating)}
            aria-pressed={entry.rating === rating}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setPreview(rating)}
            onClick={() => setRating(entry, rating)}
          >
            <Star />
          </button>
        ))}
      </div>
      {entry.rating !== null && (
        <button className="rating-remove" type="button" onClick={() => setRating(entry, null)}>
          {t.ratingRemove}
        </button>
      )}
    </section>
  );
}

function CriticScore({ score, reviews }: { score: number; reviews?: number | null }) {
  const band = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
  return (
    <div>
      <dt>{t.criticLabel}</dt>
      <dd className="critic">
        <span className={`critic-score critic-${band}`}>{score}</span>
        {reviews ? <span className="critic-reviews">{t.criticReviews(reviews)}</span> : null}
      </dd>
    </div>
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
  const { find, loading } = useLibrary();
  const entry = find(id);
  const [fetched, setFetched] = useState<Game | null | undefined>(() => seenGame(id));

  useEffect(() => {
    let current = true;
    setFetched(seenGame(id));
    // The page shows what's already known, and this fills in anything newer.
    // Saved games need it too, because their copy can be older than the critic score.
    catalog
      .get(id)
      .then((game) => current && setFetched((known) => game ?? known ?? null))
      .catch(() => current && setFetched((known) => known ?? null));
    return () => {
      current = false;
    };
  }, [id]);

  const game = loading ? undefined : (entry?.game ?? fetched);
  if (game === undefined) return <main className="page" aria-busy="true" />;
  if (game === null) {
    return (
      <main className="page">
        <p className="notice">{t.notFound}</p>
      </main>
    );
  }

  const genres = pickGenres(game.genres, game.themes);
  const genre = genres[0];
  const genreStyle = { '--genre': GENRE_COLORS[genre] } as CSSProperties;
  const critic = fetched ?? game;
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
            <p className="game-genre">
              {genres.map((item) => (
                <span key={item} style={{ color: GENRE_COLORS[item] }}>
                  {item}
                </span>
              ))}
            </p>
            <h1>{game.name}</h1>
            {game.summary && <p className="summary">{game.summary}</p>}
            {entry && (
              <p className="game-state">
                <span className={`status-badge status-${entry.status}`}>{strings.lists[entry.status]}</span>
                <span>
                  {t.played} <strong>{formatDuration(entryMinutes(entry))}</strong>
                </span>
                {entry.status === 'finished' && entry.rating && (
                  <span className="game-state-rating" aria-label={`${t.ratingTitle}: ${t.ratingValue(entry.rating)}`}>
                    <Star />
                    <strong>{entry.rating}</strong>
                  </span>
                )}
              </p>
            )}
            <StatusActions game={game} entry={entry} />
          </div>
        </div>
      </header>
      <div className="game-body">
        <div className="game-activity">
          {entry?.status === 'finished' && <RatingPicker entry={entry} />}
          <LogForm game={game} />
          {entry && <History entry={entry} />}
        </div>
        <aside className="game-details">
          <dl className="facts">
            {critic.criticScore ? <CriticScore score={critic.criticScore} reviews={critic.criticReviews} /> : null}
            <Fact label={t.released} values={game.year ? [game.year] : []} />
            <Fact label={t.developer} values={game.developers} />
            <Fact label={t.publisher} values={game.publishers} />
            <Fact label={t.platforms} values={game.platforms} />
            <Fact label={t.igdbGenres} values={game.genres} />
          </dl>
        </aside>
      </div>
    </main>
  );
}
