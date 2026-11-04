import type { CSSProperties } from 'react';
import { GENRE_COLORS, pickGenres } from '../domain/genres';
import type { Game, LibraryEntry } from '../domain/types';
import { entryMinutes } from '../domain/xp';
import { formatDuration } from '../format';
import { strings } from '../strings';
import { Star } from './Star';
import { hrefs } from '../useHashRoute';

export function Cover({ game, genreColor }: { game: Game; genreColor: string }) {
  if (game.coverUrl) return <img className="cover" src={game.coverUrl} alt="" loading="lazy" />;
  return (
    <div className="cover cover-blank" style={{ '--genre': genreColor } as CSSProperties} aria-hidden="true">
      <span>{game.name.slice(0, 1)}</span>
    </div>
  );
}

export function GameCard({ game, entry }: { game: Game; entry?: LibraryEntry }) {
  const genres = pickGenres(game.genres, game.themes);
  const genre = genres[0];
  const minutes = entry ? entryMinutes(entry) : 0;
  const detail = minutes > 0 ? formatDuration(minutes) : (game.year ?? '');
  return (
    <a className="game-card" href={hrefs.game(game.id)} style={{ '--genre': GENRE_COLORS[genre] } as CSSProperties}>
      <span className="game-card-art">
        <Cover game={game} genreColor={GENRE_COLORS[genre]} />
        {entry?.status === 'finished' && entry.rating && (
          <span className="game-card-rating" aria-label={strings.game.ratingValue(entry.rating)}>
            <Star />
            {entry.rating}
          </span>
        )}
      </span>
      <span className="game-card-name">{game.name}</span>
      <span className="game-card-meta">
        <span className="game-card-genre">
          {genre}
          {genres.length > 1 && <span className="game-card-more"> +{genres.length - 1}</span>}
        </span>
        {detail !== '' && <span>{detail}</span>}
      </span>
    </a>
  );
}
