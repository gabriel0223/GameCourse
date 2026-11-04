import { GLOSSARY } from '../content/codex';
import { strings } from '../strings';

export function GlossaryView() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>{strings.codex.tabs.glossary}</h1>
      </header>
      <dl className="glossary">
        {GLOSSARY.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
