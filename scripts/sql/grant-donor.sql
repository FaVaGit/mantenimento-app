-- Grant donor/premium entitlement globally (server-side) to selected users.
-- Usage in Supabase SQL Editor:
--   1) Edit the usernames/emails in the WHERE clause.
--   2) Run the script.

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'is_donor', true,
    'role', 'donor'
  )
where lower(split_part(email, '@', 1)) in ('favagit', 'fabio.vacchino');

-- Verification
select
  id,
  email,
  raw_user_meta_data->>'is_donor' as is_donor,
  raw_user_meta_data->>'role' as role
from auth.users
where lower(split_part(email, '@', 1)) in ('favagit', 'fabio.vacchino');
