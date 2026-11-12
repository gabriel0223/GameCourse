-- Quests made or changed in the app. Built-in quests ship with the app code,
-- and a saved row with the same id replaces one.
-- Turned-in quests and replies live in each account's profile JSON, so friends
-- already see them through friend_profiles() and no other table is needed.
create table public.quests (
  id text primary key,
  quest jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.quests enable row level security;

create policy "Signed-in users read quests"
  on public.quests for select
  to authenticated
  using (true);

create policy "Editors add quests"
  on public.quests for insert
  to authenticated
  with check (exists (select 1 from public.codex_editors where user_id = auth.uid()));

create policy "Editors change quests"
  on public.quests for update
  to authenticated
  using (exists (select 1 from public.codex_editors where user_id = auth.uid()))
  with check (exists (select 1 from public.codex_editors where user_id = auth.uid()));

create policy "Editors remove quests"
  on public.quests for delete
  to authenticated
  using (exists (select 1 from public.codex_editors where user_id = auth.uid()));
