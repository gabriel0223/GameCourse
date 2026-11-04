create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users add their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
