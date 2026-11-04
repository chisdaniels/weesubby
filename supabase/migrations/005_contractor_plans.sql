-- Migration 005: contractors pay, customers don't.
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- Pricing model:
--   Customers (homeowners)  → always free: sign up, post jobs, message, review.
--   Contractors, Free plan  → listed in Find, browse jobs, message.
--   Contractors, Pro plan   → also accept jobs and see homeowner contact info.
--
-- Until a payment provider is wired up, upgrade a contractor by hand:
--   update contractors set plan = 'pro', plan_started_at = now() where user_id = '<auth user id>';

-- ============================================================
-- SCHEMA
-- ============================================================

alter table contractors add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro'));
alter table contractors add column if not exists plan_started_at timestamptz;

create or replace function is_pro_contractor(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from contractors where user_id = uid and plan = 'pro');
$$;

-- ============================================================
-- CONTRACTORS: users can't grant themselves Pro
-- Column-level grants leave out plan / plan_started_at, so only
-- the service role (dashboard, future payment webhook) can set them.
-- ============================================================

revoke insert, update on contractors from anon, authenticated;
grant insert (user_id, name, trade, location, hourly, available, tags, bio, avatar)
  on contractors to authenticated;
grant update (user_id, name, trade, location, hourly, available, tags, bio, avatar)
  on contractors to authenticated;

-- ============================================================
-- JOBS: only Pro contractors can accept
-- ============================================================

drop policy if exists "jobs update any" on jobs;

revoke update on jobs from anon, authenticated;
grant update (accepted_by, accepted_at) on jobs to authenticated;

create policy "pro contractors accept open jobs" on jobs for update
  using (accepted_by is null)
  with check (accepted_by = auth.uid() and is_pro_contractor(auth.uid()));

-- ============================================================
-- JOBS: homeowner contact info is the paid part — hide it from
-- general reads. Everyone can still read the rest of the job.
-- ============================================================

revoke select on jobs from anon, authenticated;
grant select (id, title, trade, location, budget, description, posted_by,
              created_at, accepted_by, accepted_at)
  on jobs to anon, authenticated;

-- Contact info for jobs the caller accepted (and is still Pro) or posted.
create or replace function my_job_contacts()
returns table (job_id bigint, homeowner_name text, homeowner_email text, homeowner_phone text)
language sql stable security definer set search_path = public as $$
  select id, homeowner_name, homeowner_email, homeowner_phone
  from jobs
  where (accepted_by = auth.uid() and is_pro_contractor(auth.uid()))
     or posted_by = auth.uid();
$$;

revoke execute on function my_job_contacts() from public, anon;
grant execute on function my_job_contacts() to authenticated;
