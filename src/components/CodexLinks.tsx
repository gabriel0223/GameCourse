import { useCodex } from '../state/CodexContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

export function CodexLinks({ ids }: { ids: string[] }) {
  const { find } = useCodex();
  const entries = ids.flatMap((id) => find(id) ?? []);
  if (!entries.length) return null;
  return (
    <section className="codex-links">
      <h2>{strings.codex.learnMore}</h2>
      <ul className="example-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a href={hrefs.codexEntry(entry.id)}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
