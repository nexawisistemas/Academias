begin;

create extension if not exists pgcrypto;
create schema if not exists app_private;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  legal_name text,
  tax_id text,
  email text,
  phone text,
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended', 'cancelled')),
  saas_plan text not null default 'foundation',
  trial_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug)
);

create unique index organizations_tax_id_unique
  on public.organizations (regexp_replace(tax_id, '[^0-9]', '', 'g'))
  where tax_id is not null and tax_id <> '';

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_main boolean not null default false,
  timezone text not null default 'America/Bahia',
  phone text,
  email text,
  address jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_organization_slug_key unique (organization_id, slug)
);

create unique index branches_one_main_per_organization
  on public.branches (organization_id)
  where is_main = true;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  platform_role text not null default 'user' check (platform_role in ('user', 'super_admin')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_unique unique (organization_id, profile_id)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[a-z][a-z0-9_.-]{1,60}$'),
  name text not null,
  scope text not null default 'organization' check (scope in ('platform', 'organization', 'branch')),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index roles_system_code_unique on public.roles(code) where organization_id is null;
create unique index roles_organization_code_unique on public.roles(organization_id, code) where organization_id is not null;

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_.-]{2,80}$'),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.membership_roles (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.organization_memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index membership_roles_organization_scope_unique
  on public.membership_roles(membership_id, role_id)
  where branch_id is null;
create unique index membership_roles_branch_scope_unique
  on public.membership_roles(membership_id, role_id, branch_id)
  where branch_id is not null;

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  branding jsonb not null default '{}'::jsonb,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Bahia',
  lgpd jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hostname text not null,
  kind text not null default 'subdomain' check (kind in ('subdomain', 'custom')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'active', 'failed')),
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domains_hostname_key unique (hostname),
  constraint domains_hostname_lowercase check (hostname = lower(hostname))
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create index branches_organization_id_idx on public.branches(organization_id);
create index memberships_profile_id_idx on public.organization_memberships(profile_id);
create index memberships_organization_status_idx on public.organization_memberships(organization_id, status);
create index membership_roles_membership_id_idx on public.membership_roles(membership_id);
create index membership_roles_branch_id_idx on public.membership_roles(branch_id) where branch_id is not null;
create index domains_organization_id_idx on public.domains(organization_id);
create index audit_logs_organization_created_idx on public.audit_logs(organization_id, created_at desc);
create index audit_logs_actor_created_idx on public.audit_logs(actor_profile_id, created_at desc);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_role = 'super_admin'
  );
$$;

create or replace function app_private.has_organization_access(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.profile_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function app_private.shares_organization(p_other_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
    where mine.profile_id = auth.uid()
      and mine.status = 'active'
      and theirs.profile_id = p_other_profile_id
      and theirs.status = 'active'
  );
$$;

create or replace function app_private.has_permission(
  p_organization_id uuid,
  p_permission text,
  p_branch_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_platform_admin() or exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.roles r on r.id = mr.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.profile_id = auth.uid()
      and m.status = 'active'
      and p.code = p_permission
      and (mr.branch_id is null or (p_branch_id is not null and mr.branch_id = p_branch_id))
  );
$$;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function app_private.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.platform_role is distinct from new.platform_role
     and auth.role() <> 'service_role'
     and not app_private.is_platform_admin() then
    raise exception 'Somente um administrador da plataforma pode alterar platform_role.';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function app_private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function app_private.set_updated_at();
create trigger branches_set_updated_at before update on public.branches
for each row execute function app_private.set_updated_at();
create trigger memberships_set_updated_at before update on public.organization_memberships
for each row execute function app_private.set_updated_at();
create trigger roles_set_updated_at before update on public.roles
for each row execute function app_private.set_updated_at();
create trigger settings_set_updated_at before update on public.organization_settings
for each row execute function app_private.set_updated_at();
create trigger domains_set_updated_at before update on public.domains
for each row execute function app_private.set_updated_at();
create trigger profiles_protect_privileges before update on public.profiles
for each row execute function app_private.protect_profile_privileges();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

insert into public.permissions (code, name, description) values
  ('dashboard.read', 'Visualizar dashboard', 'Acesso aos indicadores da organização.'),
  ('organization.manage', 'Gerenciar organização', 'Alterar dados críticos da academia.'),
  ('branches.read', 'Visualizar unidades', 'Consultar unidades da organização.'),
  ('branches.manage', 'Gerenciar unidades', 'Criar e alterar unidades.'),
  ('team.read', 'Visualizar equipe', 'Consultar funcionários e vínculos.'),
  ('team.manage', 'Gerenciar equipe', 'Convidar, suspender e alterar vínculos.'),
  ('roles.manage', 'Gerenciar permissões', 'Criar funções e atribuir permissões.'),
  ('members.read', 'Visualizar alunos', 'Consultar alunos da organização.'),
  ('members.manage', 'Gerenciar alunos', 'Criar e alterar alunos.'),
  ('crm.manage', 'Gerenciar CRM', 'Operar leads e pipeline comercial.'),
  ('billing.read', 'Visualizar financeiro', 'Consultar cobranças e pagamentos.'),
  ('billing.manage', 'Gerenciar financeiro', 'Alterar cobranças e conciliações.'),
  ('training.manage', 'Gerenciar treinos', 'Criar e alterar treinos.'),
  ('classes.manage', 'Gerenciar aulas', 'Criar aulas e reservas.'),
  ('settings.manage', 'Gerenciar configurações', 'Alterar preferências da organização.'),
  ('domains.manage', 'Gerenciar domínios', 'Configurar subdomínios e domínios próprios.'),
  ('audit.read', 'Visualizar auditoria', 'Consultar ações administrativas.'),
  ('portal.self', 'Portal do aluno', 'Acessar somente informações próprias.')
on conflict (code) do nothing;

insert into public.roles (code, name, scope, is_system) values
  ('owner', 'Proprietário', 'organization', true),
  ('manager', 'Gerente', 'organization', true),
  ('reception', 'Recepção', 'branch', true),
  ('finance', 'Financeiro', 'organization', true),
  ('commercial', 'Comercial', 'branch', true),
  ('coach', 'Professor', 'branch', true),
  ('student', 'Aluno', 'organization', true)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.code = 'owner' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = any(array[
  'dashboard.read','branches.read','branches.manage','team.read','team.manage','roles.manage',
  'members.read','members.manage','crm.manage','billing.read','billing.manage','training.manage',
  'classes.manage','settings.manage','domains.manage','audit.read'
]) where r.code = 'manager' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = any(array[
  'dashboard.read','branches.read','team.read','members.read','members.manage','crm.manage','classes.manage'
]) where r.code = 'reception' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = any(array[
  'dashboard.read','branches.read','members.read','billing.read','billing.manage','audit.read'
]) where r.code = 'finance' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = any(array[
  'dashboard.read','branches.read','members.read','members.manage','crm.manage'
]) where r.code = 'commercial' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = any(array[
  'dashboard.read','branches.read','members.read','training.manage','classes.manage'
]) where r.code = 'coach' and r.organization_id is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = 'portal.self'
where r.code = 'student' and r.organization_id is null
on conflict do nothing;

create or replace function public.create_organization_with_owner(
  p_name text,
  p_slug text,
  p_branch_name text,
  p_legal_name text default null,
  p_tax_id text default null,
  p_city text default null,
  p_state text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_membership_id uuid;
  v_owner_role_id uuid;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória.';
  end if;

  if trim(coalesce(p_name, '')) = '' or p_slug !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'Nome ou slug inválido.';
  end if;

  insert into public.profiles (id) values (v_user_id) on conflict (id) do nothing;

  insert into public.organizations (name, slug, legal_name, tax_id, trial_ends_at)
  values (trim(p_name), lower(trim(p_slug)), nullif(trim(p_legal_name), ''), nullif(trim(p_tax_id), ''), now() + interval '14 days')
  returning id into v_organization_id;

  insert into public.branches (organization_id, name, slug, is_main, address)
  values (
    v_organization_id,
    coalesce(nullif(trim(p_branch_name), ''), 'Unidade principal'),
    'principal',
    true,
    jsonb_strip_nulls(jsonb_build_object('city', nullif(trim(p_city), ''), 'state', nullif(upper(trim(p_state)), '')))
  );

  insert into public.organization_memberships (organization_id, profile_id, status, accepted_at)
  values (v_organization_id, v_user_id, 'active', now())
  returning id into v_membership_id;

  select id into v_owner_role_id from public.roles
  where organization_id is null and code = 'owner';

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_owner_role_id);

  insert into public.organization_settings (organization_id) values (v_organization_id);

  insert into public.domains (organization_id, hostname, kind, status)
  values (v_organization_id, lower(trim(p_slug)) || '.academias.nexawi.com.br', 'subdomain', 'pending');

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id)
  values (v_organization_id, v_user_id, 'organization.created', 'organization', v_organization_id::text);

  return v_organization_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.organization_settings enable row level security;
alter table public.domains enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or app_private.shares_organization(id));
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid() or app_private.is_platform_admin())
with check (id = auth.uid() or app_private.is_platform_admin());

create policy organizations_select on public.organizations for select to authenticated
using (app_private.has_organization_access(id));
create policy organizations_update on public.organizations for update to authenticated
using (app_private.has_permission(id, 'organization.manage'))
with check (app_private.has_permission(id, 'organization.manage'));

create policy branches_select on public.branches for select to authenticated
using (app_private.has_organization_access(organization_id));
create policy branches_insert on public.branches for insert to authenticated
with check (app_private.has_permission(organization_id, 'branches.manage'));
create policy branches_update on public.branches for update to authenticated
using (app_private.has_permission(organization_id, 'branches.manage', id))
with check (app_private.has_permission(organization_id, 'branches.manage', id));
create policy branches_delete on public.branches for delete to authenticated
using (not is_main and app_private.has_permission(organization_id, 'branches.manage', id));

create policy memberships_select on public.organization_memberships for select to authenticated
using (profile_id = auth.uid() or app_private.has_permission(organization_id, 'team.read'));
create policy memberships_insert on public.organization_memberships for insert to authenticated
with check (app_private.has_permission(organization_id, 'team.manage'));
create policy memberships_update on public.organization_memberships for update to authenticated
using (app_private.has_permission(organization_id, 'team.manage'))
with check (app_private.has_permission(organization_id, 'team.manage'));
create policy memberships_delete on public.organization_memberships for delete to authenticated
using (app_private.has_permission(organization_id, 'team.manage'));

create policy roles_select on public.roles for select to authenticated
using (organization_id is null or app_private.has_organization_access(organization_id));
create policy roles_insert on public.roles for insert to authenticated
with check (organization_id is not null and app_private.has_permission(organization_id, 'roles.manage'));
create policy roles_update on public.roles for update to authenticated
using (organization_id is not null and app_private.has_permission(organization_id, 'roles.manage'))
with check (organization_id is not null and app_private.has_permission(organization_id, 'roles.manage'));
create policy roles_delete on public.roles for delete to authenticated
using (organization_id is not null and not is_system and app_private.has_permission(organization_id, 'roles.manage'));

create policy permissions_select on public.permissions for select to authenticated using (true);

create policy role_permissions_select on public.role_permissions for select to authenticated
using (exists (
  select 1 from public.roles r
  where r.id = role_id and (r.organization_id is null or app_private.has_organization_access(r.organization_id))
));
create policy role_permissions_insert on public.role_permissions for insert to authenticated
with check (exists (
  select 1 from public.roles r
  where r.id = role_id and r.organization_id is not null
    and app_private.has_permission(r.organization_id, 'roles.manage')
));
create policy role_permissions_delete on public.role_permissions for delete to authenticated
using (exists (
  select 1 from public.roles r
  where r.id = role_id and r.organization_id is not null
    and app_private.has_permission(r.organization_id, 'roles.manage')
));

create policy membership_roles_select on public.membership_roles for select to authenticated
using (exists (
  select 1 from public.organization_memberships m
  where m.id = membership_id
    and (m.profile_id = auth.uid() or app_private.has_permission(m.organization_id, 'team.read'))
));
create policy membership_roles_insert on public.membership_roles for insert to authenticated
with check (exists (
  select 1 from public.organization_memberships m
  where m.id = membership_id and app_private.has_permission(m.organization_id, 'team.manage')
));
create policy membership_roles_delete on public.membership_roles for delete to authenticated
using (exists (
  select 1 from public.organization_memberships m
  where m.id = membership_id and app_private.has_permission(m.organization_id, 'team.manage')
));

create policy settings_select on public.organization_settings for select to authenticated
using (app_private.has_organization_access(organization_id));
create policy settings_update on public.organization_settings for update to authenticated
using (app_private.has_permission(organization_id, 'settings.manage'))
with check (app_private.has_permission(organization_id, 'settings.manage'));

create policy domains_select on public.domains for select to authenticated
using (app_private.has_organization_access(organization_id));
create policy domains_insert on public.domains for insert to authenticated
with check (app_private.has_permission(organization_id, 'domains.manage'));
create policy domains_update on public.domains for update to authenticated
using (app_private.has_permission(organization_id, 'domains.manage'))
with check (app_private.has_permission(organization_id, 'domains.manage'));
create policy domains_delete on public.domains for delete to authenticated
using (app_private.has_permission(organization_id, 'domains.manage'));

create policy audit_logs_select on public.audit_logs for select to authenticated
using (organization_id is not null and app_private.has_permission(organization_id, 'audit.read'));

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.branches to authenticated;
grant select, insert, update, delete on public.organization_memberships to authenticated;
grant select, insert, update, delete on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select, insert, delete on public.role_permissions to authenticated;
grant select, insert, delete on public.membership_roles to authenticated;
grant select, update on public.organization_settings to authenticated;
grant select, insert, update, delete on public.domains to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

revoke all on function public.create_organization_with_owner(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_organization_with_owner(text, text, text, text, text, text, text) to authenticated;

revoke all on all functions in schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_platform_admin() to authenticated;
grant execute on function app_private.has_organization_access(uuid) to authenticated;
grant execute on function app_private.shares_organization(uuid) to authenticated;
grant execute on function app_private.has_permission(uuid, text, uuid) to authenticated;

commit;
