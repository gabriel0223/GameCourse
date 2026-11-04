import { useEffect, useState } from 'react';
import { GameCard } from '../components/GameCard';
import { SearchForm } from '../components/SearchForm';
import { catalog } from '../data';
import type { Game } from '../domain/types';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';

type State = { status: 'loading' } | { status: 'error' } | { status: 'done'; games: Game[] };

export function SearchView({ query }: { query: string }) {
  const { find } = useLibrary();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    catalog
      .search(query)
      .then((games) => current && setState({ status: 'done', games }))
      .catch(() => current && setState({ status: 'error' }));
    return () => {
      current = false;
    };
  }, [query]);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{strings.search.resultsFor(query)}</h1>
        <SearchForm key={query} initial={query} />
      </header>
      {state.status === 'error' && <p className="notice">{strings.search.error}</p>}
      {state.status === 'done' && state.games.length === 0 && <p className="empty">{strings.search.empty}</p>}
      {state.status === 'done' && state.games.length > 0 && (
        <div className="game-grid">
          {state.games.map((game) => (
            <GameCard key={game.id} game={game} entry={find(game.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
