alter table public.user_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.user_profiles add column if not exists is_premium boolean not null default false;
alter table public.user_profiles add column if not exists stripe_customer_id text;

create unique index if not exists user_profiles_stripe_customer_id_key
  on public.user_profiles (stripe_customer_id)
  where stripe_customer_id is not null;
