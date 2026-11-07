-- Migration 038: iPhone app push tokens (Apple Push Notification service)
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- One row per iPhone that turned on notifications in the WeeSubby app.
-- People can read and remove only their own rows. Saving goes through
-- save_native_push_token() so an iPhone that switches accounts moves to the
-- new account (tokens are unique per device). notify-message-push reads
-- these with the service role. Idempotent; safe to re-run.

create table if not exists native_push_tokens (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null unique,
  platform   text not null default 'ios' check (platform in ('ios')),
  created_at timestamptz not null default now()
);
create index if not exists native_push_tokens_user_id_idx on native_push_tokens (user_id);
alter table native_push_tokens enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'native_push_tokens' and policyname = 'owner reads native push tokens') then
    create policy "owner reads native push tokens" on native_push_tokens for select to authenticated
      using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'native_push_tokens' and policyname = 'owner removes native push tokens') then
    create policy "owner removes native push tokens" on native_push_tokens for delete to authenticated
      using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on native_push_tokens from anon, authenticated;
grant select, delete on native_push_tokens to authenticated;
grant all on native_push_tokens to service_role;

create or replace function private.save_native_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to turn on notifications';
  end if;
  -- APNs device tokens are hex strings (64 characters today).
  if p_token !~ '^[0-9a-fA-F]{64,200}$' then
    raise exception 'Invalid push token';
  end if;
  insert into native_push_tokens (user_id, token)
  values (auth.uid(), lower(p_token))
  on conflict (token) do update set user_id = excluded.user_id, created_at = now();
end;
$$;
revoke all on function private.save_native_push_token(text) from public, anon;
grant execute on function private.save_native_push_token(text) to authenticated;

create or replace function public.save_native_push_token(p_token text)
returns void
language sql
security invoker
set search_path = public, private, pg_catalog
as $$ select private.save_native_push_token(p_token) $$;
revoke all on function public.save_native_push_token(text) from public, anon;
grant execute on function public.save_native_push_token(text) to authenticated;
