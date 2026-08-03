\set ON_ERROR_STOP on
\pset pager off

-- ===========================================================================
-- Onboarding: signing up must create profile + workspace + membership + categories.
-- Run as the `postgres` role; 02 and 03 continue from the users it creates.
-- ===========================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alice@test.dev', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"full_name":"Alice Ahmed"}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'bob@test.dev', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"full_name":"Bob Baig"}');

\echo '--- onboarding ---'
select p.full_name, p.preferred_currency, w.name as workspace, w.default_currency,
       m.role, (select count(*) from categories c where c.workspace_id = w.id) as categories
from profiles p
join workspaces w on w.owner_id = p.id
join workspace_members m on m.workspace_id = w.id and m.user_id = p.id
order by p.full_name;

\echo '--- category tree (Alice, expense roots + children) ---'
select coalesce(parent.name || ' > ', '') || c.name as category
from categories c
left join categories parent on parent.id = c.parent_id
where c.workspace_id = (select id from workspaces where owner_id = '11111111-1111-1111-1111-111111111111')
  and c.type = 'expense'
order by coalesce(parent.name, c.name), c.parent_id nulls first, c.name;
