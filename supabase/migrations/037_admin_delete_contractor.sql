-- Migration 037: only admins can delete contractor profiles.
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- Admins delete a pro's profile from the Admin page, which calls the
-- `admin-delete-contractor` Edge Function. That function checks the caller is
-- in public.admins, cancels any live Pro subscription in Stripe, deletes the
-- row with the service role, and records the delete in admin_audit_log.
--
-- Deleting a contractor cascades to reviews, messages, contractor_credentials,
-- contractor_badges and contractor_denials; job_releases.contractor_row_id is
-- set to null. The pro's login account is kept.
--
-- This migration makes sure nobody can delete contractor rows directly.

drop policy if exists "contractors delete own" on contractors;
revoke delete on contractors from anon, authenticated;
