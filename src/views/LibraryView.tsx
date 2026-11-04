import { useEffect, useState } from 'react';
import { GameCard } from '../components/GameCard';
import { SearchForm } from '../components/SearchForm';
import { catalog } from '../data';
import type { Game, GameStatus } from '../domain/types';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const LISTS: GameStatus[] = ['playing', 'backlog', 'finished', 'dropped'];

export function LibraryView({ list }: { list: GameStatus }) {
  const { entries, loading, loadFailed } = useLibrary();
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const visible = entries.filter((entry) => entry.status === list);
  const isNew = !loading && !loadFailed && entries.length === 0;

  useEffect(() => {
    if (isNew) catalog.suggestions().then(setSuggestions).catch(() => setSuggestions([]));
  }, [isNew]);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{strings.library.title}</h1>
        <SearchForm />
      </header>
      {loadFailed && <p className="notice">{strings.toast.saveError}</p>}
      <nav className="tabs" aria-label={strings.nav.library}>
        {LISTS.map((item) => (
          <a key={item} href={hrefs.list(item)} aria-current={item === list ? 'page' : undefined}>
            {strings.lists[item]}
            <span className="tab-count">{entries.filter((entry) => entry.status === item).length}</span>
          </a>
        ))}
      </nav>

      {visible.length > 0 ? (
        <div className="game-grid">
          {visible.map((entry) => (
            <GameCard key={entry.game.id} game={entry.game} entry={entry} />
          ))}
        </div>
      ) : (
        !loading && <p className="empty">{strings.emptyLists[list]}</p>
      )}

      {isNew && suggestions.length > 0 && (
        <section className="suggestions">
          <h2>{strings.search.suggestions}</h2>
          <div className="game-grid">
            {suggestions.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
