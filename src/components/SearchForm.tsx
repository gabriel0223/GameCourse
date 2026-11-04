import { useState } from 'react';
import type { FormEvent } from 'react';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

export function SearchForm({ initial = '' }: { initial?: string }) {
  const [query, setQuery] = useState(initial);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) window.location.hash = hrefs.search(query.trim());
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="game-search">
        {strings.search.label}
      </label>
      <input
        id="game-search"
        type="search"
        value={query}
        placeholder={strings.search.placeholder}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="search-submit" type="submit">
        {strings.search.button}
      </button>
    </form>
  );
}
