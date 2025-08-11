
-- 1) Roles enum
create type public.app_role as enum ('admin', 'user');

-- 2) Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 3) user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 4) Insert profile automatically on user signup (from auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5) Role-check function (SECURITY DEFINER to avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- 6) Salespeople listing for dropdown (returns only names and ids)
create or replace function public.list_salespeople()
returns table (user_id uuid, first_name text, last_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id as user_id,
    coalesce(p.first_name, '') as first_name,
    coalesce(p.last_name, '') as last_name
  from public.profiles p
  order by p.first_name nulls last, p.last_name nulls last;
$$;

-- Allow authenticated users to call these functions
grant execute on function public.list_salespeople() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- 7) RLS policies

-- Profiles: users can view/update their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Profiles: admins can view/update all
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (true);

-- user_roles: users can view own roles
create policy "Users can view own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- user_roles: admins can view/manage all roles
create policy "Admins can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
