import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CODEX_ENTRIES } from '../content/codex';
import type { CodexEntry } from '../content/codex';
import type { Draft } from '../content/drafts';
import { mergeCodex } from '../content/mergeCodex';
import { codexStore } from '../data';

interface CodexValue {
  entries: CodexEntry[];
  ready: boolean;
  canEdit: boolean;
  find(id: string): CodexEntry | undefined;
  isEdited(id: string): boolean;
  save(entry: CodexEntry): Promise<void>;
  restore(id: string): Promise<void>;
  drafts: Map<string, Draft>;
}

const CodexContext = createContext<CodexValue | null>(null);

export function CodexProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<CodexEntry[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [ready, setReady] = useState(false);
  // Unsaved edits survive moving around the app during a visit.
  const drafts = useRef(new Map<string, Draft>());

  useEffect(() => {
    Promise.all([
      codexStore.list().then(setSaved, () => setSaved([])),
      codexStore.canEdit().then(setCanEdit, () => setCanEdit(false)),
    ]).finally(() => setReady(true));
  }, []);

  const save = useCallback(async (entry: CodexEntry) => {
    await codexStore.save(entry);
    setSaved((current) => [...current.filter((item) => item.id !== entry.id), entry]);
  }, []);

  const restore = useCallback(async (id: string) => {
    await codexStore.remove(id);
    setSaved((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<CodexValue>(() => {
    const entries = mergeCodex(CODEX_ENTRIES, saved);
    return {
      entries,
      ready,
      canEdit,
      find: (id) => entries.find((entry) => entry.id === id),
      isEdited: (id) => saved.some((entry) => entry.id === id),
      save,
      restore,
      drafts: drafts.current,
    };
  }, [canEdit, ready, restore, save, saved]);

  return <CodexContext.Provider value={value}>{children}</CodexContext.Provider>;
}

export function useCodex() {
  const value = useContext(CodexContext);
  if (!value) throw new Error('useCodex must be used inside CodexProvider');
  return value;
}
