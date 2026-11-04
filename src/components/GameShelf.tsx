import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CodexGame } from '../content/codex';
import { catalog } from '../data';
import { GENRE_COLORS } from '../domain/genres';
import type { Game, GameLookup } from '../domain/types';
import { useLibrary } from '../state/LibraryContext';
import { GameCard } from './GameCard';

const hasYear = (game: CodexGame): game is GameLookup => game.year !== undefined;

// A game IGDB doesn't have stays on the shelf, just without a cover or a link.
function NamedGame({ game, loading }: { game: CodexGame; loading: boolean }) {
  return (
    <div className={loading ? 'game-card game-card-loading' : 'game-card'}>
      <span className="game-card-art">
        <span className="cover cover-blank" style={{ '--genre': GENRE_COLORS.Adventure } as CSSProperties} aria-hidden="true">
          <span>{game.name.slice(0, 1)}</span>
        </span>
      </span>
      <span className="game-card-name">{game.name}</span>
      {game.year && (
        <span className="game-card-meta">
          <span>{game.year}</span>
        </span>
      )}
    </div>
  );
}

export function GameShelf({ games }: { games: CodexGame[] }) {
  const { find } = useLibrary();
  const [answers, setAnswers] = useState<Array<Game | null> | null>(null);
  const lookups = games.filter(hasYear);
  const request = JSON.stringify(lookups);

  useEffect(() => {
    let current = true;
    setAnswers(null);
    const lookup = lookups.length ? catalog.lookup(lookups) : Promise.resolve([]);
    lookup.then(
      (found) => current && setAnswers(found),
      () => current && setAnswers([]),
    );
    return () => {
      current = false;
    };
  }, [request]);

  return (
    <div className="game-grid">
      {games.map((item) => {
        const game = hasYear(item) ? answers?.[lookups.indexOf(item)] : null;
        return game ? (
          <GameCard key={item.name} game={game} entry={find(game.id)} />
        ) : (
          <NamedGame key={item.name} game={item} loading={!answers} />
        );
      })}
    </div>
  );
}
