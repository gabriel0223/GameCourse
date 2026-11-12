import { createClient } from '@supabase/supabase-js';
import type { CodexEntry, CodexImage, CodexSection } from '../content/codex';
import type { WardrobeGenre } from '../domain/genres';
import type { Game, GameDetails, GameLookup, GameStatus, LibraryEntry, PlaySession } from '../domain/types';
import type { CharacterProfile } from '../domain/wardrobe';
import type { Friend } from '../domain/friends';
import type { Quest } from '../domain/quests';
import { restoreProfile } from '../domain/wardrobe';
import type { CodexStore, FriendStore, GameCatalog, LibraryStore, QuestStore } from './ports';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

interface EntryRow {
  game_id: string;
  game: Game;
  status: GameStatus;
  main_genre: WardrobeGenre;
  sessions: PlaySession[];
  finished_at: string | null;
  rating: number | null;
  updated_at: string;
}

function required() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function toEntry(row: EntryRow): LibraryEntry {
  return {
    game: row.game,
    status: row.status,
    mainGenre: row.main_genre,
    sessions: row.sessions,
    finishedAt: row.finished_at,
    rating: row.rating,
    updatedAt: row.updated_at,
  };
}

export const supabaseStore: LibraryStore = {
  async list() {
    const { data, error } = await required()
      .from('library_entries')
      .select('game_id, game, status, main_genre, sessions, finished_at, rating, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as EntryRow[]).map(toEntry);
  },
  async save(entry) {
    const client = required();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new Error('Not signed in');
    const { error } = await client.from('library_entries').upsert({
      user_id: auth.user.id,
      game_id: entry.game.id,
      game: entry.game,
      status: entry.status,
      main_genre: entry.mainGenre,
      sessions: entry.sessions,
      finished_at: entry.finishedAt,
      rating: entry.rating,
      updated_at: entry.updatedAt,
    });
    if (error) throw error;
  },
  async remove(gameId) {
    const { error } = await required().from('library_entries').delete().eq('game_id', gameId);
    if (error) throw error;
  },
  async loadProfile() {
    const { data, error } = await required().from('profiles').select('profile').maybeSingle();
    if (error) throw error;
    return (data?.profile as CharacterProfile | undefined) ?? null;
  },
  async saveProfile(profile) {
    const client = required();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new Error('Not signed in');
    const { error } = await client
      .from('profiles')
      .upsert({ user_id: auth.user.id, profile, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};

// Both functions skip the signed-in user, so this is everyone else.
export const supabaseFriends: FriendStore = {
  async list() {
    const client = required();
    const [people, games] = await Promise.all([client.rpc('friend_profiles'), client.rpc('friend_library')]);
    if (people.error) throw people.error;
    if (games.error) throw games.error;
    const friends = new Map<string, Friend>();
    for (const row of people.data as Array<{ user_id: string; profile: CharacterProfile | null }>) {
      friends.set(row.user_id, { id: row.user_id, profile: restoreProfile(row.profile), entries: [] });
    }
    for (const row of games.data as Array<EntryRow & { user_id: string }>) {
      friends.get(row.user_id)?.entries.push(toEntry(row));
    }
    return [...friends.values()];
  },
};

// Everyone signed in reads quests. Only Codex editors can write them, which the database enforces.
export const supabaseQuestStore: QuestStore = {
  async list() {
    const { data, error } = await required().from('quests').select('quest');
    if (error) throw error;
    return (data as Array<{ quest: Quest }>).map((row) => row.quest);
  },
  async save(quest) {
    const { error } = await required()
      .from('quests')
      .upsert({ id: quest.id, quest, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await required().from('quests').delete().eq('id', id);
    if (error) throw error;
  },
};

export async function signedInUserId(): Promise<string | null> {
  const { data } = await required().auth.getUser();
  return data.user?.id ?? null;
}

const CODEX_BUCKET = 'codex-images';

async function signedImage(image: CodexImage): Promise<CodexImage> {
  if (!image.path) return image;
  const { data, error } = await required().storage.from(CODEX_BUCKET).createSignedUrl(image.path, 60 * 60 * 12);
  if (error) throw error;
  return { ...image, src: data.signedUrl };
}

async function withSignedImages(entry: CodexEntry): Promise<CodexEntry> {
  const heroImage = entry.heroImage ? await signedImage(entry.heroImage) : undefined;
  const sections: CodexSection[] = await Promise.all(
    entry.sections.map(async (section) =>
      section.image ? { ...section, image: await signedImage(section.image) } : section,
    ),
  );
  return { ...entry, heroImage, sections };
}

export const supabaseCodexStore: CodexStore = {
  // This only decides what the app shows. The database enforces the same rule.
  async canEdit() {
    const { data, error } = await required().from('codex_editors').select('user_id').maybeSingle();
    return !error && Boolean(data);
  },
  async list() {
    const { data, error } = await required().from('codex_entries').select('entry');
    if (error) throw error;
    return Promise.all((data as Array<{ entry: CodexEntry }>).map((row) => withSignedImages(row.entry)));
  },
  async save(entry) {
    const { error } = await required()
      .from('codex_entries')
      .upsert({ id: entry.id, entry, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await required().from('codex_entries').delete().eq('id', id);
    if (error) throw error;
  },
  async saveImage(image, name) {
    const path = `${crypto.randomUUID()}-${name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()}`;
    const { error } = await required().storage.from(CODEX_BUCKET).upload(path, image, { contentType: image.type });
    if (error) throw error;
    const signed = await signedImage({ src: '', alt: '', path });
    return { src: signed.src, path };
  },
};

// These match the keys and lifetime the igdb Edge Function uses.
const CACHE_DAYS = 7;
const searchKey = (query: string) => `search3:${query.trim().slice(0, 100).toLowerCase()}`;
const lookupKey = (games: GameLookup[]) =>
  `lookup1:${games.map((item) => `${item.name.toLowerCase()}|${item.year}`).join(',')}`;

// Saved answers come straight from the database, which is much faster than
// starting the Edge Function. A miss of any kind falls through to the function.
async function savedAnswer<T>(key: string): Promise<T | null> {
  const { data, error } = await required()
    .from('igdb_cache')
    .select('payload, fetched_at')
    .eq('cache_key', key)
    .maybeSingle();
  if (error || !data) return null;
  const fresh = Date.now() - new Date(data.fetched_at).getTime() < CACHE_DAYS * 86_400_000;
  return fresh ? (data.payload as T | null) : null;
}

async function callIgdb<T>(cacheKey: string, body: Record<string, unknown>): Promise<T> {
  const saved = await savedAnswer<T>(cacheKey);
  if (saved !== null) return saved;
  const { data, error } = await required().functions.invoke('igdb', { body });
  if (error) throw error;
  return data as T;
}

export const igdbCatalog: GameCatalog = {
  suggestions: () => callIgdb<Game[]>('suggestions', { action: 'suggestions' }),
  search: (query) => callIgdb<Game[]>(searchKey(query), { action: 'search', query }),
  get: (id) => callIgdb<Game | null>(`game2:${id}`, { action: 'game', id }),
  details: (id) => callIgdb<GameDetails | null>(`details1:${id}`, { action: 'details', id }),
  lookup: (games) => callIgdb<Array<Game | null>>(lookupKey(games), { action: 'lookup', games }),
};
