begin;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  category text not null default 'operational',
  description text not null check (char_length(trim(description)) between 2 and 180),
  supplier text,
  amount_cents integer not null check (amount_cents > 0),
  due_date date not null default current_date,
  status text not null default 'planned' check (status in ('planned','paid','cancelled')),
  payment_method text check (payment_method is null or payment_method in ('pix','credit_card','debit_card','cash','bank_slip','transfer','other')),
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_org_due_idx on public.expenses(organization_id, due_date desc);
create index expenses_org_status_idx on public.expenses(organization_id, status, due_date desc);
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function app_private.set_updated_at();
alter table public.expenses enable row level security;
create policy expenses_access on public.expenses for all to authenticated
using (app_private.has_permission(organization_id, 'billing.read'))
with check (app_private.has_permission(organization_id, 'billing.manage'));
grant select, insert, update, delete on public.expenses to authenticated;

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role_id uuid not null references public.roles(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','cancelled','expired')),
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index team_invitations_pending_email_unique
on public.team_invitations(organization_id, email) where status = 'pending';
create index team_invitations_email_status_idx on public.team_invitations(email, status, expires_at);
create trigger team_invitations_set_updated_at before update on public.team_invitations
for each row execute function app_private.set_updated_at();
alter table public.team_invitations enable row level security;
create policy team_invitations_manage on public.team_invitations for all to authenticated
using (app_private.has_permission(organization_id, 'team.manage'))
with check (app_private.has_permission(organization_id, 'team.manage'));
grant select, insert, update, delete on public.team_invitations to authenticated;

create or replace function public.record_audit_event(
  p_organization_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_branch_id uuid default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not app_private.has_organization_access(p_organization_id) then raise exception 'Acesso negado.'; end if;
  if p_action !~ '^[a-z][a-z0-9_.-]{2,100}$' or trim(coalesce(p_entity_type,'')) = '' then raise exception 'Evento de auditoria inválido.'; end if;
  insert into public.audit_logs(organization_id, branch_id, actor_profile_id, action, entity_type, entity_id, metadata)
  values(p_organization_id, p_branch_id, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.create_team_invitation(p_organization_id uuid, p_email text, p_role_id uuid, p_branch_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not app_private.has_permission(p_organization_id, 'team.manage') then raise exception 'Acesso negado.'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'E-mail inválido.'; end if;
  if not exists(select 1 from public.roles r where r.id = p_role_id and (r.organization_id is null or r.organization_id = p_organization_id)) then raise exception 'Função inválida.'; end if;
  if p_branch_id is not null and not exists(select 1 from public.branches b where b.id = p_branch_id and b.organization_id = p_organization_id) then raise exception 'Unidade inválida.'; end if;
  update public.team_invitations set status = 'expired' where organization_id = p_organization_id and email = v_email and status = 'pending' and expires_at <= now();
  insert into public.team_invitations(organization_id, email, role_id, branch_id, invited_by)
  values(p_organization_id, v_email, p_role_id, p_branch_id, auth.uid())
  on conflict (organization_id, email) where status = 'pending'
  do update set role_id = excluded.role_id, branch_id = excluded.branch_id, invited_by = auth.uid(), expires_at = now() + interval '7 days', updated_at = now()
  returning id into v_id;
  perform public.record_audit_event(p_organization_id, 'team.invitation_created', 'team_invitation', v_id::text, jsonb_build_object('email', v_email), p_branch_id);
  return v_id;
end;
$$;

create or replace function public.claim_pending_team_invitations()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_email text; v_invite record; v_membership_id uuid; v_count integer := 0;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then return 0; end if;
  for v_invite in select * from public.team_invitations where email = v_email and status = 'pending' and expires_at > now() order by created_at loop
    insert into public.organization_memberships(organization_id, profile_id, status, invited_by, invited_at, accepted_at)
    values(v_invite.organization_id, auth.uid(), 'active', v_invite.invited_by, v_invite.created_at, now())
    on conflict (organization_id, profile_id) do update set status = 'active', accepted_at = now(), updated_at = now()
    returning id into v_membership_id;
    delete from public.membership_roles where membership_id = v_membership_id;
    insert into public.membership_roles(membership_id, role_id, branch_id) values(v_membership_id, v_invite.role_id, v_invite.branch_id);
    update public.team_invitations set status = 'accepted', accepted_at = now() where id = v_invite.id;
    insert into public.audit_logs(organization_id, branch_id, actor_profile_id, action, entity_type, entity_id, metadata)
    values(v_invite.organization_id, v_invite.branch_id, auth.uid(), 'team.invitation_accepted', 'membership', v_membership_id::text, jsonb_build_object('email', v_email));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.record_audit_event(uuid,text,text,text,jsonb,uuid) from public, anon;
revoke all on function public.create_team_invitation(uuid,text,uuid,uuid) from public, anon;
revoke all on function public.claim_pending_team_invitations() from public, anon;
grant execute on function public.record_audit_event(uuid,text,text,text,jsonb,uuid) to authenticated;
grant execute on function public.create_team_invitation(uuid,text,uuid,uuid) to authenticated;
grant execute on function public.claim_pending_team_invitations() to authenticated;

commit;
