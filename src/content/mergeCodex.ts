import type { CodexEntry } from './codex';

// An edit saved before an entry had game cards shouldn't hide them.
function keepGames(edited: CodexEntry, original: CodexEntry): CodexEntry {
  if (edited.sections.some((section) => section.games)) return edited;
  return { ...edited, sections: [...edited.sections, ...original.sections.filter((section) => section.games)] };
}

// Saved edits replace built-in guides by id, and custom guides are added after them.
export function mergeCodex(builtIn: CodexEntry[], saved: CodexEntry[]): CodexEntry[] {
  const byId = new Map(saved.map((entry) => [entry.id, entry]));
  const merged = builtIn.map((entry) => {
    const edited = byId.get(entry.id);
    return edited ? keepGames(edited, entry) : entry;
  });
  return [...merged, ...saved.filter((entry) => entry.custom && !builtIn.some((item) => item.id === entry.id))];
}
