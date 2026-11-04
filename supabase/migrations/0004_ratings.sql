-- Her own score for a game, from 1 to 10. Empty means not rated.
alter table public.library_entries
  add column rating smallint check (rating between 1 and 10);
