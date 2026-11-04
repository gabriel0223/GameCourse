import { demoCatalog } from './demoCatalog';
import { localCodexStore } from './localCodexStore';
import { localStore } from './localStore';
import type { CodexStore, GameCatalog, LibraryStore } from './ports';
import { igdbCatalog, supabase, supabaseCodexStore, supabaseStore } from './supabase';

export const isDemo = !supabase;
export const catalog: GameCatalog = supabase ? igdbCatalog : demoCatalog;
export const store: LibraryStore = supabase ? supabaseStore : localStore;
export const codexStore: CodexStore = supabase ? supabaseCodexStore : localCodexStore;

// The one switch for Codex editing. With real accounts it stays off until the
// owner check is added here and write access is added in the database.
export const canEditCodex = isDemo;
