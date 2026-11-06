-- Migration 007: only admins can delete contractor profiles.
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- Contractors can't delete their own profile. Admins delete profiles from the
-- app's Admin tab, which calls the `admin-delete-contractor` Edge Function.
-- That function checks the caller is in public.admins, cancels any Pro subscription in
-- Stripe, then deletes the row with the service role. Deleting a contractor
-- also removes its reviews and messages (ON DELETE CASCADE).

-- Undo the earlier draft of this migration, if it was run.
drop policy if exists "contractors delete own" on contractors;
revoke delete on contractors from anon, authenticated;

-- Admins are the users listed in public.admins (checked by private.is_admin).
