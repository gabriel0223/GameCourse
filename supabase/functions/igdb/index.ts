import { isUserToken } from './auth.ts';
import { pickGame, rankGames, releaseWindow } from './rank.ts';
import type { GameLookup } from './rank.ts';

const CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'https://gabriel0223.github.io';
const CACHE_DAYS = 7;
const SEARCH_RESULTS = 24;
const MAX_LOOKUPS = 12;

// Plain requests instead of the Supabase library, because this function starts
// fresh on most requests and loading that library slows every start.
const CACHE_URL = `${Deno.env.get('SUPABASE_URL') ?? ''}/rest/v1/igdb_cache`;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const cacheHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FIELDS =
  'name,summary,first_release_date,cover.url,genres.name,themes.name,platforms.name,' +
  'involved_companies.developer,involved_companies.publisher,involved_companies.company.name,' +
  'aggregated_rating,aggregated_rating_count';

const SEARCH_FIELDS = `${FIELDS},total_rating_count,version_parent,game_type`;

const IMAGE_FIELDS = ['image_id', 'width', 'height'];
const DETAIL_FIELDS = [
  ...IMAGE_FIELDS.map((field) => `screenshots.${field}`),
  ...IMAGE_FIELDS.map((field) => `artworks.${field}`),
  ...FIELDS.split(',').map((field) => `similar_games.${field}`),
].join(',');

interface IgdbName {
  name: string;
}

interface IgdbImage {
  image_id: string;
  width?: number;
  height?: number;
}

interface IgdbTimeToBeat {
  hastily?: number;
  normally?: number;
  completely?: number;
}

interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  cover?: { url: string };
  genres?: IgdbName[];
  themes?: IgdbName[];
  platforms?: IgdbName[];
  involved_companies?: Array<{ developer: boolean; publisher: boolean; company: IgdbName }>;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  total_rating_count?: number;
  version_parent?: number;
  game_type?: number;
  screenshots?: IgdbImage[];
  artworks?: IgdbImage[];
  similar_games?: IgdbGame[];
}

const isLookup = (item: unknown): item is GameLookup => {
  const { name, year } = (item ?? {}) as Partial<GameLookup>;
  return typeof name === 'string' && name.length > 0 && name.length <= 100 && Number.isInteger(year);
};

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now()) return token.value;
  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('client_secret', CLIENT_SECRET);
  url.searchParams.set('grant_type', 'client_credentials');
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) throw new Error('Twitch token request failed');
  const data = await response.json();
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return token.value;
}

async function igdb<T = IgdbGame>(query: string, endpoint = 'games'): Promise<T[]> {
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: { 'Client-ID': CLIENT_ID, Authorization: `Bearer ${await accessToken()}` },
    body: query,
  });
  if (!response.ok) throw new Error(`IGDB request failed: ${response.status}`);
  return response.json();
}

function names(list?: IgdbName[]): string[] {
  return (list ?? []).map((item) => item.name);
}

function toGame(game: IgdbGame) {
  const companies = game.involved_companies ?? [];
  return {
    id: String(game.id),
    name: game.name,
    year: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : null,
    platforms: names(game.platforms),
    developers: companies.filter((item) => item.developer).map((item) => item.company.name),
    publishers: companies.filter((item) => item.publisher).map((item) => item.company.name),
    genres: names(game.genres),
    themes: names(game.themes),
    summary: game.summary ?? null,
    coverUrl: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
    criticScore: game.aggregated_rating ? Math.round(game.aggregated_rating) : null,
    criticReviews: game.aggregated_rating_count ?? null,
  };
}

function toImages(list?: IgdbImage[]) {
  return (list ?? []).map((image) => ({
    id: image.image_id,
    width: image.width ?? null,
    height: image.height ?? null,
  }));
}

function toTimeToBeat(times?: IgdbTimeToBeat) {
  if (!times?.hastily && !times?.normally && !times?.completely) return null;
  return {
    hastily: times.hastily ?? null,
    normally: times.normally ?? null,
    completely: times.completely ?? null,
  };
}

// A broken cache only makes things slower, so neither step can fail a request.
async function readCache<T>(key: string): Promise<T | undefined> {
  try {
    const url = `${CACHE_URL}?cache_key=eq.${encodeURIComponent(key)}&select=payload,fetched_at`;
    const response = await fetch(url, { headers: cacheHeaders });
    if (!response.ok) throw new Error(`Cache read failed: ${response.status}`);
    const [row] = await response.json();
    const fresh = row && Date.now() - new Date(row.fetched_at).getTime() < CACHE_DAYS * 86_400_000;
    return fresh ? (row.payload as T) : undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function writeCache(key: string, payload: unknown): Promise<void> {
  try {
    const response = await fetch(`${CACHE_URL}?on_conflict=cache_key`, {
      method: 'POST',
      headers: { ...cacheHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ cache_key: key, payload, fetched_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Cache write failed: ${response.status}`);
  } catch (error) {
    console.error(error);
  }
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const saved = await readCache<T>(key);
  if (saved !== undefined) return saved;
  const payload = await load();
  await writeCache(key, payload);
  return payload;
}

function quote(text: string): string {
  return `"${text.replace(/["\\]/g, ' ')}"`;
}

// IGDB's search is fuzzy and can miss an exact title, so a title lookup runs beside it.
// One lookup can fail and search still works, but a partial result is never cached.
async function searchGames(text: string) {
  const key = `search3:${text.toLowerCase()}`;
  const saved = await readCache<unknown>(key);
  if (saved !== undefined) return saved;

  const lookups = await Promise.allSettled([
    igdb(
      `fields ${SEARCH_FIELDS}; where name ~ ${quote(text)}* & version_parent = null; ` +
        'sort total_rating_count desc; limit 50;',
    ),
    igdb(`search ${quote(text)}; fields ${SEARCH_FIELDS}; where version_parent = null; limit 50;`),
  ]);
  const found = lookups.flatMap((lookup) => (lookup.status === 'fulfilled' ? [lookup.value] : []));
  lookups.forEach((lookup) => lookup.status === 'rejected' && console.error(lookup.reason));
  if (found.length === 0) throw new Error('Both IGDB lookups failed');

  const payload = rankGames(found, text, SEARCH_RESULTS).map(toGame);
  if (found.length === lookups.length) await writeCache(key, payload);
  return payload;
}

// One request for a whole Codex list. Each title gets its own date range, which
// keeps long series like Final Fantasy from crowding out the rest of the list.
async function lookupGames(lookups: GameLookup[]) {
  const key = `lookup1:${lookups.map((item) => `${item.name.toLowerCase()}|${item.year}`).join(',')}`;
  return cached(key, async () => {
    const titles = lookups.map(({ name, year }) => {
      const [from, to] = releaseWindow(year);
      return `(name ~ ${quote(name)}* & first_release_date >= ${from} & first_release_date < ${to})`;
    });
    const games = await igdb(
      `fields ${SEARCH_FIELDS}; where (${titles.join(' | ')}) & version_parent = null; ` +
        'sort total_rating_count desc; limit 200;',
    );
    return lookups.map((lookup) => {
      const game = pickGame(games, lookup);
      return game ? toGame(game) : null;
    });
  });
}

// Time to beat is a separate IGDB endpoint. The page is still useful without it,
// so it can fail on its own, but a partial answer is never cached.
async function gameDetails(id: string) {
  const key = `details1:${id}`;
  const saved = await readCache<unknown>(key);
  if (saved !== undefined) return saved;

  const [game, times] = await Promise.allSettled([
    igdb(`fields ${DETAIL_FIELDS}; where id = ${id}; limit 1;`),
    igdb<IgdbTimeToBeat>(`fields hastily,normally,completely; where game_id = ${id}; limit 1;`, 'game_time_to_beats'),
  ]);
  if (game.status === 'rejected') throw game.reason;
  if (times.status === 'rejected') console.error(times.reason);

  const found = game.value[0];
  const payload = found && {
    screenshots: toImages(found.screenshots),
    artworks: toImages(found.artworks),
    similar: (found.similar_games ?? []).map(toGame),
    timeToBeat: times.status === 'fulfilled' ? toTimeToBeat(times.value[0]) : null,
  };
  if (times.status === 'fulfilled') await writeCache(key, payload ?? null);
  return payload ?? null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!isUserToken(request.headers.get('Authorization'))) {
      return new Response(JSON.stringify({ error: 'Sign in required' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { action, query, id, games } = await request.json();
    let result: unknown;

    if (action === 'search' && typeof query === 'string' && query.trim()) {
      result = await searchGames(query.trim().slice(0, 100));
    } else if (action === 'game' && /^\d+$/.test(String(id))) {
      result = await cached(`game2:${id}`, async () => {
        const games = await igdb(`fields ${FIELDS}; where id = ${id}; limit 1;`);
        return games[0] ? toGame(games[0]) : null;
      });
    } else if (action === 'details' && /^\d+$/.test(String(id))) {
      result = await gameDetails(String(id));
    } else if (
      action === 'lookup' &&
      Array.isArray(games) &&
      games.length > 0 &&
      games.length <= MAX_LOOKUPS &&
      games.every(isLookup)
    ) {
      result = await lookupGames(games);
    } else if (action === 'suggestions') {
      result = await cached('suggestions', async () =>
        (
          await igdb(
            `fields ${FIELDS}; where total_rating_count > 500 & platforms = (6) & cover != null; ` +
              'sort total_rating desc; limit 8;',
          )
        ).map(toGame),
      );
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'IGDB is unavailable' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
