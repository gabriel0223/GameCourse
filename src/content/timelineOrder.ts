import type { CodexEntry } from './codex';

// Generations open their section, and events follow by year within it.
export function timelineOrder(entries: CodexEntry[]): CodexEntry[] {
  return entries
    .filter((entry) => entry.timeline)
    .sort((a, b) => {
      const left = a.timeline;
      const right = b.timeline;
      if (!left || !right) return 0;
      if (left.generation !== right.generation) return left.generation - right.generation;
      if (left.kind !== right.kind) return left.kind === 'generation' ? -1 : 1;
      return left.year - right.year;
    });
}
