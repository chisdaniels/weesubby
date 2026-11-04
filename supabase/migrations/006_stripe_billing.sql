-- Migration 006: Stripe billing records for contractors.
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- Stripe IDs live in their own table rather than on `contractors`, because
-- contractors is publicly readable. This table has RLS on and no policies, so
-- only the service role (the Edge Functions) can read or write it.

create table if not exists contractor_billing (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text unique not null,
  stripe_subscription_id text unique,
  subscription_status    text,
  updated_at             timestamptz default now()
);

alter table contractor_billing enable row level security;
revoke all on contractor_billing from anon, authenticated;
