-- Migration 007: contractors can delete their own profile.
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- Deleting a contractor row also removes its reviews and messages
-- (both reference contractors with ON DELETE CASCADE).
--
-- Pro contractors must cancel their subscription first (Manage Billing),
-- otherwise Stripe would keep charging for a profile that no longer exists.
--
-- To remove any contractor as the site owner (e.g. the seeded demo ones),
-- run this in the SQL Editor, which uses the service role and skips RLS:
--   delete from contractors where id = <id>;

grant delete on contractors to authenticated;

drop policy if exists "contractors delete own" on contractors;
create policy "contractors delete own" on contractors for delete
  using (user_id = auth.uid() and plan <> 'pro');
