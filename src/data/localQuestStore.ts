import type { Quest } from '../domain/quests';
import type { QuestStore } from './ports';

const KEY = 'games-course-quests-v1';

// Storage can be blocked, so the app falls back to memory for that visit.
let memory: Quest[] | null = null;

function read(): Quest[] {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as Quest[]) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(quests: Quest[]) {
  memory = quests;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(quests));
  } catch {
    // The in-memory copy keeps the current visit working.
  }
}

export const localQuestStore: QuestStore = {
  async list() {
    return read();
  },
  async save(quest) {
    write([...read().filter((item) => item.id !== quest.id), quest]);
  },
  async remove(id) {
    write(read().filter((item) => item.id !== id));
  },
};
