-- Migration 036: remember when a Pro subscription is set to end.
--
-- When a contractor cancels in the Stripe portal they keep Pro until the end
-- of the period they paid for. The stripe-webhook function stores that date
-- here so the app can say "Cancels on <date>". contractor_billing stays
-- service-role only; contractors read their own date through my_plan_cancels_at().
-- Idempotent without removing anything, so it can be re-run safely.

alter table contractor_billing add column if not exists cancel_at timestamptz;

create or replace function private.my_plan_cancels_at()
returns timestamptz
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select cancel_at from contractor_billing where user_id = auth.uid()
$$;
revoke all on function private.my_plan_cancels_at() from public, anon;
grant execute on function private.my_plan_cancels_at() to authenticated;

create or replace function public.my_plan_cancels_at()
returns timestamptz
language sql
stable
security invoker
set search_path = public, private, pg_catalog
as $$ select private.my_plan_cancels_at() $$;
revoke all on function public.my_plan_cancels_at() from public, anon;
grant execute on function public.my_plan_cancels_at() to authenticated;
