-- MY Arena board: private storage for one owner.
-- Everything here is locked to the accounts listed in public.arena_owners.
-- Add the owner's email after running this file (it is kept out of the repo on purpose):
--   insert into public.arena_owners (email) values ('you@example.com');

create schema if not exists private;

-- Who may open the board. No policies on purpose: only the dashboard and the
-- service role can read or change this list.
create table if not exists public.arena_owners (
  email text primary key check (email = lower(email))
);
alter table public.arena_owners enable row level security;
revoke all on public.arena_owners from anon, authenticated;

-- True only for a signed-in account whose confirmed email is on the owner list.
create or replace function private.arena_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.arena_owners o on o.email = lower(u.email)
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.arena_is_owner() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.arena_is_owner() to authenticated;

-- What the page calls after sign-in to decide whether to open the board.
create or replace function public.arena_is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.arena_is_owner();
$$;
revoke all on function public.arena_is_owner() from public, anon;
grant execute on function public.arena_is_owner() to authenticated;

-- One row per board item (app, site, workflow, task, inbox, intro).
create table if not exists public.arena_items (
  id text primary key check (id ~ '^[A-Za-z0-9_.~:@+-]{1,200}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 262144),
  updated_at timestamptz not null default now()
);
alter table public.arena_items enable row level security;
revoke all on public.arena_items from anon, authenticated;
grant select, insert, update, delete on public.arena_items to authenticated;

create policy "owner reads items" on public.arena_items
  for select to authenticated using ((select private.arena_is_owner()));
create policy "owner adds items" on public.arena_items
  for insert to authenticated with check ((select private.arena_is_owner()));
create policy "owner changes items" on public.arena_items
  for update to authenticated using ((select private.arena_is_owner())) with check ((select private.arena_is_owner()));
create policy "owner removes items" on public.arena_items
  for delete to authenticated using ((select private.arena_is_owner()));

create or replace function private.arena_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.arena_touch() from public, anon, authenticated;
drop trigger if exists arena_items_touch on public.arena_items;
create trigger arena_items_touch
  before insert or update on public.arena_items
  for each row execute function private.arena_touch();

-- Private bucket for project thumbnails. Images are shown through short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('arena-thumbs', 'arena-thumbs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "owner reads thumbs" on storage.objects
  for select to authenticated using (bucket_id = 'arena-thumbs' and (select private.arena_is_owner()));
create policy "owner adds thumbs" on storage.objects
  for insert to authenticated with check (bucket_id = 'arena-thumbs' and (select private.arena_is_owner()));
create policy "owner changes thumbs" on storage.objects
  for update to authenticated using (bucket_id = 'arena-thumbs' and (select private.arena_is_owner())) with check (bucket_id = 'arena-thumbs' and (select private.arena_is_owner()));
create policy "owner removes thumbs" on storage.objects
  for delete to authenticated using (bucket_id = 'arena-thumbs' and (select private.arena_is_owner()));
