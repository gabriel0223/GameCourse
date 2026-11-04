import { useMemo } from 'react';
import { GLOSSARY } from '../content/codex';
import { searchCodex } from '../content/search';
import type { EntryHit } from '../content/search';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs, useCodexQuery } from '../useHashRoute';
import { EntryArt, ReadMark } from './CodexView';

const t = strings.codex;

function Marked({ text, needle }: { text: string; needle: string }) {
  const index = text.toLowerCase().indexOf(needle);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

function ResultGroup({ title, hits, needle }: { title: string; hits: EntryHit[]; needle: string }) {
  const { profile } = useLibrary();
  if (!hits.length) return null;
  return (
    <section className="codex-section">
      <h2>{title}</h2>
      <ul className="search-results">
        {hits.map(({ entry, snippet }) => (
          <li key={entry.id}>
            <a href={hrefs.codexEntry(entry.id)}>
              <EntryArt entry={entry} />
              <span>
                <strong>
                  <Marked text={entry.title} needle={needle} />
                </strong>
                <span>
                  <Marked text={snippet ?? entry.summary} needle={needle} />
                </span>
              </span>
              {profile.readEntries.includes(entry.id) && <ReadMark />}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CodexSearchView() {
  const { entries } = useCodex();
  const query = useCodexQuery();
  const needle = query.trim().toLowerCase();
  const results = useMemo(() => searchCodex(entries, GLOSSARY, query), [entries, query]);
  const count = results.entries.length + results.terms.length;
  const of = (test: (hit: EntryHit) => boolean) => results.entries.filter(test);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.search.title}</h1>
      </header>
      {!needle && <p className="timeline-intro">{t.search.prompt}</p>}
      {needle && count === 0 && <p className="empty">{t.noResults}</p>}
      {count > 0 && <p className="timeline-intro">{t.search.results(count)}</p>}
      <ResultGroup
        title={t.search.guides}
        needle={needle}
        hits={of(({ entry }) => !entry.timeline && !entry.console && entry.category !== 'history')}
      />
      <ResultGroup
        title={t.search.history}
        needle={needle}
        hits={of(({ entry }) => Boolean(entry.timeline) || (entry.category === 'history' && !entry.console))}
      />
      <ResultGroup title={t.search.consoles} needle={needle} hits={of(({ entry }) => Boolean(entry.console))} />
      {results.terms.length > 0 && (
        <section className="codex-section">
          <h2>{t.search.glossary}</h2>
          <dl className="glossary">
            {results.terms.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </main>
  );
}
