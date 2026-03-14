create table if not exists public.keylock_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  scenario_cipher jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.keylock_profiles enable row level security;

drop policy if exists "keylock_profiles_select_own" on public.keylock_profiles;
create policy "keylock_profiles_select_own"
on public.keylock_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "keylock_profiles_insert_own" on public.keylock_profiles;
create policy "keylock_profiles_insert_own"
on public.keylock_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "keylock_profiles_update_own" on public.keylock_profiles;
create policy "keylock_profiles_update_own"
on public.keylock_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
