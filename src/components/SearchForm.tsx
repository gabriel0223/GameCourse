import { useEffect, useState } from 'react';
import type { FocusEvent, FormEvent, KeyboardEvent } from 'react';
import { catalog } from '../data';
import type { Game } from '../domain/types';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const MIN_CHARACTERS = 2;
const MAX_SUGGESTIONS = 6;
const TYPING_PAUSE_MS = 300;
const PANEL_ID = 'game-search-suggestions';

// Backspacing over a word shouldn't ask IGDB the same thing twice.
const recent = new Map<string, Game[]>();

type Status = 'idle' | 'loading' | 'failed';

function optionId(index: number): string {
  return `game-search-option-${index}`;
}

function Thumb({ game }: { game: Game }) {
  if (game.coverUrl) {
    return <img className="search-thumb" src={game.coverUrl.replace('t_cover_big', 't_cover_small')} alt="" />;
  }
  return (
    <span className="search-thumb search-thumb-blank" aria-hidden="true">
      {game.name.slice(0, 1)}
    </span>
  );
}

function details(game: Game): string {
  return [game.year, game.developers[0]].filter(Boolean).join(' · ');
}

export function SearchForm({ initial = '' }: { initial?: string }) {
  const [query, setQuery] = useState(initial);
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [active, setActive] = useState(-1);
  const text = query.trim();

  useEffect(() => {
    if (!typing) return;
    setActive(-1);
    if (text.length < MIN_CHARACTERS) {
      setGames([]);
      setStatus('idle');
      return;
    }
    const known = recent.get(text.toLowerCase());
    if (known) {
      setGames(known);
      setStatus('idle');
      return;
    }

    let current = true;
    setStatus('loading');
    const timer = window.setTimeout(() => {
      catalog
        .search(text)
        .then((results) => {
          const top = results.slice(0, MAX_SUGGESTIONS);
          recent.set(text.toLowerCase(), top);
          if (!current) return;
          setGames(top);
          setStatus('idle');
        })
        .catch(() => {
          if (!current) return;
          setGames([]);
          setStatus('failed');
        });
    }, TYPING_PAUSE_MS);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [text, typing]);

  const showPanel = open && typing && text.length >= MIN_CHARACTERS && status !== 'failed';
  const hrefList = [...games.map((game) => hrefs.game(game.id)), hrefs.search(text)];

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text) return;
    close();
    window.location.hash = showPanel && active >= 0 ? hrefList[active] : hrefs.search(text);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (!showPanel || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    // Index -1 is the search box itself, so the list wraps through it.
    setActive((index) => ((index + 1 + step + hrefList.length + 1) % (hrefList.length + 1)) - 1);
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }

  return (
    <form className="search" role="search" onSubmit={submit} onBlur={handleBlur}>
      <label className="sr-only" htmlFor="game-search">
        {strings.search.label}
      </label>
      <input
        id="game-search"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={PANEL_ID}
        aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
        value={query}
        placeholder={strings.search.placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setTyping(true);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
      />
      <button className="search-submit" type="submit">
        {strings.search.button}
      </button>
      {showPanel && (
        // Keeps focus in the box, so a click isn't lost to the panel closing first.
        <div
          className="search-panel"
          id={PANEL_ID}
          role="listbox"
          aria-label={strings.search.suggestionsLabel}
          onMouseDown={(event) => event.preventDefault()}
        >
          {games.length === 0 && (
            <p className="search-panel-note">
              {status === 'loading' ? strings.search.searching : strings.search.noSuggestions}
            </p>
          )}
          {games.map((game, index) => (
            <a
              key={game.id}
              className="search-option"
              id={optionId(index)}
              href={hrefList[index]}
              role="option"
              aria-selected={active === index}
              tabIndex={-1}
              onClick={close}
              onMouseEnter={() => setActive(index)}
            >
              <Thumb game={game} />
              <span className="search-option-text">
                <span className="search-option-name">{game.name}</span>
                <span className="search-option-meta">{details(game)}</span>
              </span>
            </a>
          ))}
          <a
            className="search-option search-see-all"
            id={optionId(games.length)}
            href={hrefList[games.length]}
            role="option"
            aria-selected={active === games.length}
            tabIndex={-1}
            onClick={close}
            onMouseEnter={() => setActive(games.length)}
          >
            <span>{strings.search.seeAll(text)}</span>
          </a>
        </div>
      )}
    </form>
  );
}
