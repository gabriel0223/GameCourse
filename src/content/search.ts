import type { CodexEntry, CodexSection, GlossaryTerm } from './codex';

export interface EntryHit {
  entry: CodexEntry;
  // Set when the match is only in the body, to show why the entry came up.
  snippet: string | null;
}

export interface CodexResults {
  entries: EntryHit[];
  terms: GlossaryTerm[];
}

const SNIPPET_RADIUS = 70;

const sectionText = (section: CodexSection) =>
  [
    section.heading,
    section.text,
    ...(section.list ?? []),
    ...(section.steps ?? []),
    ...(section.table?.headers ?? []),
    ...(section.table?.rows.flat() ?? []),
    ...(section.games?.map((game) => game.name) ?? []),
    section.image?.caption,
  ].filter(Boolean);

function snippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + length + SNIPPET_RADIUS);
  // Cuts at word edges, so a snippet never starts halfway through a word.
  const from = start === 0 ? 0 : text.indexOf(' ', start) + 1;
  const to = end === text.length ? end : Math.max(text.lastIndexOf(' ', end), index + length);
  return `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`;
}

function rank(entry: CodexEntry, needle: string): { score: number; snippet: string | null } | null {
  const title = entry.title.toLowerCase();
  if (title.startsWith(needle)) return { score: 0, snippet: null };
  if (title.includes(needle)) return { score: 1, snippet: null };
  const headline = [entry.summary, entry.console?.maker ?? ''];
  if (headline.some((text) => text.toLowerCase().includes(needle))) return { score: 2, snippet: null };
  for (const text of entry.sections.flatMap(sectionText) as string[]) {
    const index = text.toLowerCase().indexOf(needle);
    if (index >= 0) return { score: 3, snippet: snippet(text, index, needle.length) };
  }
  return null;
}

export function searchCodex(entries: CodexEntry[], glossary: GlossaryTerm[], query: string): CodexResults {
  const needle = query.trim().toLowerCase();
  if (!needle) return { entries: [], terms: [] };
  const hits = entries.flatMap((entry) => {
    const match = rank(entry, needle);
    return match ? [{ entry, ...match }] : [];
  });
  return {
    entries: hits.sort((a, b) => a.score - b.score).map(({ entry, snippet: text }) => ({ entry, snippet: text })),
    terms: glossary.filter(
      (item) => item.term.toLowerCase().includes(needle) || item.definition.toLowerCase().includes(needle),
    ),
  };
}
