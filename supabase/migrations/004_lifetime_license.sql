-- Switch from subscription model to lifetime (one-time payment) license.
alter table public.user_profiles
  add column if not exists stripe_payment_id text;

create unique index if not exists user_profiles_stripe_payment_id_key
  on public.user_profiles (stripe_payment_id)
  where stripe_payment_id is not null;

-- Old subscription column is no longer used; keep nullable for backward compatibility.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'stripe_subscription_id'
  ) then
    alter table public.user_profiles
      alter column stripe_subscription_id drop not null;
  end if;
end $$;
