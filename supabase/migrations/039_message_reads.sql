-- Migration 039: remember which conversations each person has read
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- One row per person per conversation, holding the time they last read it.
-- Messages newer than that count as unread. Stored on the account (not just
-- in the browser) so read messages stay read after signing out and back in,
-- and across the website, the iPhone app and other devices.
-- thread_key matches the app's conversation keys: "<contractor id>:<other user id>",
-- "admin:team" (a user's thread with the team) or "admin:<user id>" (admins).
-- Idempotent; safe to re-run.

create table if not exists message_reads (
  user_id    uuid not null references auth.users(id) on delete cascade,
  thread_key text not null check (length(thread_key) between 1 and 200),
  seen_at    timestamptz not null,
  primary key (user_id, thread_key)
);
alter table message_reads enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'message_reads' and policyname = 'owner reads message reads') then
    create policy "owner reads message reads" on message_reads for select to authenticated
      using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'message_reads' and policyname = 'owner adds message reads') then
    create policy "owner adds message reads" on message_reads for insert to authenticated
      with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'message_reads' and policyname = 'owner updates message reads') then
    create policy "owner updates message reads" on message_reads for update to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on message_reads from anon, authenticated;
grant select, insert, update on message_reads to authenticated;
grant all on message_reads to service_role;
