import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { GENRE_COLORS, genreEntryId } from '../domain/genres';
import type { GamerState } from '../domain/gamer';
import { bestScore } from '../domain/practice';
import { formatDuration } from '../format';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.character;

interface JourneyRow {
  label: string;
  value: string;
  href?: string;
  color?: string;
}

function JourneyCard({ icon, title, href, rows }: { icon: IconName; title: string; href: string; rows: JourneyRow[] }) {
  return (
    <article className="journey-card">
      <h3>
        <a href={href}>
          <Icon name={icon} />
          {title}
        </a>
      </h3>
      <dl>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd style={row.color ? { color: row.color } : undefined}>
              {row.href ? <a href={row.href}>{row.value}</a> : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

const finished = (gamer: GamerState, kind: 'path' | 'era') => {
  const all = gamer.paths.filter((path) => path.kind === kind);
  return `${all.filter((path) => path.done).length} / ${all.length}`;
};

function Journey() {
  const { gamer, profile } = useLibrary();
  const { entries } = useCodex();
  const { stats } = gamer;
  const favorite = stats.favoriteGenre;
  const read = entries.filter((entry) => profile.readEntries.includes(entry.id)).length;
  const score = (game: string) => String(bestScore(profile.practice, game) || t.stats.notYet);

  return (
    <section className="character-section">
      <h2>{t.journey}</h2>
      <div className="journey-grid">
        <JourneyCard
          icon="library"
          title={t.games}
          href="#/"
          rows={[
            { label: t.stats.hours, value: String(Math.floor(stats.minutesPlayed / 60)) },
            { label: t.stats.finished, value: String(stats.gamesFinished) },
            {
              label: t.stats.favoriteGenre,
              value: favorite ?? t.stats.notYet,
              href: favorite ? hrefs.codexEntry(genreEntryId(favorite)) : undefined,
              color: favorite ? GENRE_COLORS[favorite] : undefined,
            },
            {
              label: t.stats.mostPlayed,
              value: stats.mostPlayed?.name ?? t.stats.notYet,
              href: stats.mostPlayed ? hrefs.game(stats.mostPlayed.id) : undefined,
            },
          ]}
        />
        <JourneyCard
          icon="codex"
          title={strings.nav.codex}
          href={hrefs.codex}
          rows={[
            { label: t.stats.read, value: `${read} / ${entries.length}` },
            { label: t.stats.paths, value: finished(gamer, 'path') },
            { label: t.stats.eras, value: finished(gamer, 'era') },
          ]}
        />
        <JourneyCard
          icon="practice"
          title={strings.nav.practice}
          href={hrefs.practice}
          rows={[
            { label: t.stats.runs, value: String(profile.practice.runs) },
            { label: strings.practice.games.runner.title, value: score('runner') },
            { label: strings.practice.games.jet.title, value: score('jet') },
          ]}
        />
      </div>
      <a className="character-achievements" href={hrefs.characterTab('achievements')}>
        <span>
          <Icon name="trophy" />
          {t.tabs.achievements}
        </span>
        <strong>
          {gamer.earnedCount} / {gamer.achievements.length}
        </strong>
      </a>
    </section>
  );
}

function GenreLevels() {
  const { gamer } = useLibrary();
  const genres = [...gamer.genres].sort((a, b) => b.total - a.total);
  const played = genres.filter((item) => item.minutes > 0);
  const unplayed = genres.filter((item) => item.minutes === 0);
  return (
    <section className="character-section">
      <h2>{t.genreLevels}</h2>
      {played.length > 0 && (
        <ul className="genre-list">
          {played.map((item) => (
            <li key={item.genre}>
              <a href={hrefs.codexEntry(genreEntryId(item.genre))}>
                <span className="genre-row-top">
                  <span style={{ color: GENRE_COLORS[item.genre] }}>{item.genre}</span>
                  <span>
                    {strings.level} {item.level}
                  </span>
                </span>
                <span className="genre-bar">
                  <span
                    style={{
                      width: `${Math.round((item.intoLevel / item.needed) * 100)}%`,
                      background: GENRE_COLORS[item.genre],
                    }}
                  />
                </span>
                <span className="genre-row-bottom">
                  <span>{item.nextPiece ? t.nextUnlock(item.nextPiece.name, item.nextPiece.shopLevel) : t.allUnlocked}</span>
                  <span>{formatDuration(item.minutes)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {unplayed.length > 0 && (
        <>
          <h3 className="genre-chips-title">{t.notPlayed}</h3>
          <div className="genre-chips">
            {unplayed.map((item) => (
              <a key={item.genre} href={hrefs.codexEntry(genreEntryId(item.genre))} style={{ color: GENRE_COLORS[item.genre] }}>
                {item.genre}
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function OverviewTab() {
  return (
    <>
      <Journey />
      <GenreLevels />
    </>
  );
}
