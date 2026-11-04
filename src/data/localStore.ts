import type { LibraryEntry } from '../domain/types';
import type { CharacterProfile } from '../domain/wardrobe';
import type { LibraryStore } from './ports';

const KEY = 'games-course-library-v1';
const PROFILE_KEY = 'games-course-profile-v1';

// Storage can be blocked, so the app falls back to memory for that visit.
let memory: LibraryEntry[] | null = null;
let memoryProfile: CharacterProfile | null = null;

function read(): LibraryEntry[] {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as LibraryEntry[]) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(entries: LibraryEntry[]) {
  memory = entries;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // The in-memory copy keeps the current visit working.
  }
}

export const localStore: LibraryStore = {
  async list() {
    return read();
  },
  async save(entry) {
    write([entry, ...read().filter((item) => item.game.id !== entry.game.id)]);
  },
  async remove(gameId) {
    write(read().filter((item) => item.game.id !== gameId));
  },
  async loadProfile() {
    if (memoryProfile) return memoryProfile;
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      memoryProfile = raw ? (JSON.parse(raw) as CharacterProfile) : null;
    } catch {
      memoryProfile = null;
    }
    return memoryProfile;
  },
  async saveProfile(profile) {
    memoryProfile = profile;
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // The in-memory copy keeps the current visit working.
    }
  },
};
