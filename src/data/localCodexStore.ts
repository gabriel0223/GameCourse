import type { CodexEntry } from '../content/codex';
import type { CodexStore } from './ports';

const DB_NAME = 'games-course-codex';
const STORE = 'entries';

// Images make these records too large for localStorage, so they use IndexedDB.
// If that is blocked, edits last for the current visit.
const memory = new Map<string, CodexEntry>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function toDataUrl(image: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(image);
  });
}

export const localCodexStore: CodexStore = {
  async canEdit() {
    return true;
  },
  async list() {
    try {
      return await run('readonly', (store) => store.getAll() as IDBRequest<CodexEntry[]>);
    } catch {
      return [...memory.values()];
    }
  },
  async save(entry) {
    memory.set(entry.id, entry);
    try {
      await run('readwrite', (store) => store.put(entry));
    } catch {
      // The in-memory copy keeps the current visit working.
    }
  },
  async remove(id) {
    memory.delete(id);
    try {
      await run('readwrite', (store) => store.delete(id));
    } catch {
      // Nothing was stored, so there is nothing to remove.
    }
  },
  async saveImage(image) {
    return { src: await toDataUrl(image) };
  },
};
