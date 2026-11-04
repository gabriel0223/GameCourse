-- Signed-in users read saved game data directly, which skips the Edge Function
-- when the answer is already here. Only the function can write to this table.
create policy "Signed-in users read saved game data"
  on public.igdb_cache for select
  to authenticated
  using (true);
