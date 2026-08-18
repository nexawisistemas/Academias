begin;

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  email text,
  phone text,
  source text not null default 'manual' check (source in ('manual', 'site', 'whatsapp', 'instagram', 'indicacao', 'trafego_pago', 'outro')),
  status text not null default 'new' check (status in ('new', 'contacting', 'experimental_scheduled', 'proposal', 'won', 'lost')),
  interest text,
  notes text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_leads_organization_status_idx on public.crm_leads(organization_id, status, created_at desc);
create index crm_leads_organization_next_action_idx on public.crm_leads(organization_id, next_action_at) where next_action_at is not null;
create index crm_leads_branch_idx on public.crm_leads(branch_id) where branch_id is not null;

create trigger crm_leads_set_updated_at before update on public.crm_leads
for each row execute function app_private.set_updated_at();

alter table public.crm_leads enable row level security;

create policy crm_leads_select on public.crm_leads for select to authenticated
using (app_private.has_permission(organization_id, 'crm.manage', branch_id));
create policy crm_leads_insert on public.crm_leads for insert to authenticated
with check (app_private.has_permission(organization_id, 'crm.manage', branch_id));
create policy crm_leads_update on public.crm_leads for update to authenticated
using (app_private.has_permission(organization_id, 'crm.manage', branch_id))
with check (app_private.has_permission(organization_id, 'crm.manage', branch_id));
create policy crm_leads_delete on public.crm_leads for delete to authenticated
using (app_private.has_permission(organization_id, 'crm.manage', branch_id));

grant select, insert, update, delete on public.crm_leads to authenticated;

commit;
