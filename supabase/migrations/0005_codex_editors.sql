-- Accounts allowed to change the Codex. Add one by hand from the SQL editor:
--   insert into public.codex_editors (user_id) values ('<their user id>');
-- Nobody can add themselves, because this table has no write policies.
create table public.codex_editors (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.codex_editors enable row level security;

create policy "Editors can see their own access"
  on public.codex_editors for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Editors add Codex guides"
  on public.codex_entries for insert
  to authenticated
  with check (exists (select 1 from public.codex_editors where user_id = auth.uid()));

create policy "Editors change Codex guides"
  on public.codex_entries for update
  to authenticated
  using (exists (select 1 from public.codex_editors where user_id = auth.uid()))
  with check (exists (select 1 from public.codex_editors where user_id = auth.uid()));

create policy "Editors remove Codex guides"
  on public.codex_entries for delete
  to authenticated
  using (exists (select 1 from public.codex_editors where user_id = auth.uid()));

create policy "Editors upload Codex images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'codex-images'
    and exists (select 1 from public.codex_editors where user_id = auth.uid())
  );
