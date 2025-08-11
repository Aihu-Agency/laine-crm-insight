
do $$
declare _id uuid;
begin
  -- 1) Find the user's id by email
  select id into _id
  from auth.users
  where email ilike 'tommi@aihuagency.com'
  limit 1;

  if _id is null then
    raise exception 'User with email % not found in auth.users. Please create it under Authentication > Users first.', 'tommi@aihuagency.com';
  end if;

  -- 2) Grant 'admin' role if not already present
  insert into public.user_roles (user_id, role)
  select _id, 'admin'::app_role
  where not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _id
      and ur.role = 'admin'::app_role
  );

  -- 3) Ensure a profile exists for this user (kept empty if no metadata)
  insert into public.profiles (id, first_name, last_name)
  select _id, null, null
  where not exists (
    select 1 from public.profiles p where p.id = _id
  );
end $$;
