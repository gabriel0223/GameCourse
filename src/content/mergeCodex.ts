import type { CodexEntry } from './codex';

// Saved edits replace built-in guides by id, and custom guides are added after them.
export function mergeCodex(builtIn: CodexEntry[], saved: CodexEntry[]): CodexEntry[] {
  const byId = new Map(saved.map((entry) => [entry.id, entry]));
  const merged = builtIn.map((entry) => byId.get(entry.id) ?? entry);
  return [...merged, ...saved.filter((entry) => entry.custom && !builtIn.some((item) => item.id === entry.id))];
}
