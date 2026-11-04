-- Edited and custom Codex guides. Signed-in users can read them.
-- Write access is added with the owner check, so editing stays closed until then.
create table public.codex_entries (
  id text primary key,
  entry jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.codex_entries enable row level security;

create policy "Signed-in users read Codex guides"
  on public.codex_entries for select
  to authenticated
  using (true);

-- Images stay private, and the app opens them with temporary signed links.
insert into storage.buckets (id, name, public)
values ('codex-images', 'codex-images', false);

create policy "Signed-in users read Codex images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'codex-images');
