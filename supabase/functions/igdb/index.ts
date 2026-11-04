import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { rankGames } from './rank.ts';

const CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'https://gabriel0223.github.io';
const CACHE_DAYS = 7;
const SEARCH_RESULTS = 24;

const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FIELDS =
  'name,summary,first_release_date,cover.url,genres.name,themes.name,platforms.name,' +
  'involved_companies.developer,involved_companies.publisher,involved_companies.company.name';

const SEARCH_FIELDS = `${FIELDS},total_rating_count,version_parent,game_type`;

interface IgdbName {
  name: string;
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
  total_rating_count?: number;
  version_parent?: number;
  game_type?: number;
}

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

async function igdb(query: string): Promise<IgdbGame[]> {
  const response = await fetch('https://api.igdb.com/v4/games', {
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
  };
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const { data } = await db.from('igdb_cache').select('payload, fetched_at').eq('cache_key', key).maybeSingle();
  const fresh = data && Date.now() - new Date(data.fetched_at).getTime() < CACHE_DAYS * 86_400_000;
  if (fresh) return data.payload as T;
  const payload = await load();
  await db.from('igdb_cache').upsert({ cache_key: key, payload, fetched_at: new Date().toISOString() });
  return payload;
}

function quote(text: string): string {
  return `"${text.replace(/["\\]/g, ' ')}"`;
}

// IGDB's search is fuzzy and can miss an exact title, so a title lookup runs beside it.
// One lookup can fail and search still works, but a partial result is never cached.
async function searchGames(text: string) {
  const key = `search2:${text.toLowerCase()}`;
  const { data } = await db.from('igdb_cache').select('payload, fetched_at').eq('cache_key', key).maybeSingle();
  if (data && Date.now() - new Date(data.fetched_at).getTime() < CACHE_DAYS * 86_400_000) return data.payload;

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
  if (found.length === lookups.length) {
    await db.from('igdb_cache').upsert({ cache_key: key, payload, fetched_at: new Date().toISOString() });
  }
  return payload;
}

// The anon key is public, so a valid key alone doesn't prove it's a real user.
async function isSignedIn(request: Request): Promise<boolean> {
  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return false;
  const { data, error } = await db.auth.getUser(jwt);
  return !error && Boolean(data.user);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!(await isSignedIn(request))) {
      return new Response(JSON.stringify({ error: 'Sign in required' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { action, query, id } = await request.json();
    let result: unknown;

    if (action === 'search' && typeof query === 'string' && query.trim()) {
      result = await searchGames(query.trim().slice(0, 100));
    } else if (action === 'game' && /^\d+$/.test(String(id))) {
      result = await cached(`game:${id}`, async () => {
        const games = await igdb(`fields ${FIELDS}; where id = ${id}; limit 1;`);
        return games[0] ? toGame(games[0]) : null;
      });
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
