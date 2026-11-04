create table public.library_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  game jsonb not null,
  status text not null check (status in ('backlog', 'playing', 'finished', 'dropped')),
  main_genre text not null,
  sessions jsonb not null default '[]'::jsonb,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.library_entries enable row level security;

create policy "Users read their own library"
  on public.library_entries for select
  using (auth.uid() = user_id);

create policy "Users add to their own library"
  on public.library_entries for insert
  with check (auth.uid() = user_id);

create policy "Users update their own library"
  on public.library_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users remove from their own library"
  on public.library_entries for delete
  using (auth.uid() = user_id);

-- Only the Edge Function reads or writes this cache, using the service role.
create table public.igdb_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.igdb_cache enable row level security;
