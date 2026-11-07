-- Every account is a friend of every other account. Sign-ups are off, so that
-- only ever means the accounts created by hand under Authentication.
--
-- Friends are read through these two functions rather than wider table policies,
-- so the app's own queries on library_entries and profiles still only see the
-- signed-in user's rows. Both functions are read-only and skip the caller.

-- Every other account, with its character if it has saved one yet.
create function public.friend_profiles()
returns table (user_id uuid, profile jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, p.profile
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where auth.uid() is not null and u.id <> auth.uid()
  order by u.created_at;
$$;

-- Every other account's games, newest change first.
create function public.friend_library()
returns table (
  user_id uuid,
  game jsonb,
  status text,
  main_genre text,
  sessions jsonb,
  finished_at timestamptz,
  rating smallint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.user_id, l.game, l.status, l.main_genre, l.sessions, l.finished_at, l.rating, l.updated_at
  from public.library_entries l
  where auth.uid() is not null and l.user_id <> auth.uid()
  order by l.updated_at desc;
$$;

revoke execute on function public.friend_profiles() from public, anon;
revoke execute on function public.friend_library() from public, anon;
grant execute on function public.friend_profiles() to authenticated;
grant execute on function public.friend_library() to authenticated;
