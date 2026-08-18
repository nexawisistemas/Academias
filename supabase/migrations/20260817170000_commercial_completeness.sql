begin;

create table public.member_contracts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade, subscription_id uuid references public.subscriptions(id) on delete set null,
  title text not null, terms_version text not null default '1.0', status text not null default 'pending' check(status in ('pending','accepted','cancelled','expired')),
  accepted_at timestamptz, accepted_ip inet, document_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.communication_campaigns (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, channel text not null check(channel in ('whatsapp','email','sms','push')), audience text not null check(audience in ('all','active','inactive','overdue','leads','birthday','custom')),
  message text not null, status text not null default 'draft' check(status in ('draft','scheduled','sent','cancelled')), scheduled_at timestamptz, sent_at timestamptz,
  recipients_count integer not null default 0, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.retention_tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade, lead_id uuid references public.crm_leads(id) on delete cascade,
  type text not null check(type in ('inactive_member','overdue_payment','renewal','lead_follow_up','birthday','manual')),
  title text not null, priority text not null default 'medium' check(priority in ('low','medium','high','urgent')),
  status text not null default 'open' check(status in ('open','in_progress','done','cancelled')), due_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create trigger member_contracts_set_updated_at before update on public.member_contracts for each row execute function app_private.set_updated_at();
create trigger communication_campaigns_set_updated_at before update on public.communication_campaigns for each row execute function app_private.set_updated_at();
create trigger retention_tasks_set_updated_at before update on public.retention_tasks for each row execute function app_private.set_updated_at();
alter table public.member_contracts enable row level security;
alter table public.communication_campaigns enable row level security;
alter table public.retention_tasks enable row level security;
create policy member_contracts_access on public.member_contracts for all to authenticated using(app_private.has_permission(organization_id,'members.read')) with check(app_private.has_permission(organization_id,'members.manage'));
create policy communication_campaigns_access on public.communication_campaigns for all to authenticated using(app_private.has_permission(organization_id,'crm.manage')) with check(app_private.has_permission(organization_id,'crm.manage'));
create policy retention_tasks_access on public.retention_tasks for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'crm.manage'));
grant select,insert,update,delete on public.member_contracts,public.communication_campaigns,public.retention_tasks to authenticated;

create or replace function public.generate_due_invoices(p_organization_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare s record;v_count integer:=0;v_months integer;begin
  if not app_private.has_permission(p_organization_id,'billing.manage') then raise exception 'Acesso negado.';end if;
  for s in select sub.*,p.name as plan_name,p.billing_cycle from public.subscriptions sub join public.membership_plans p on p.id=sub.plan_id
    where sub.organization_id=p_organization_id and sub.status in ('active','overdue') and sub.next_billing_on<=current_date
  loop
    if not exists(select 1 from public.invoices i where i.subscription_id=s.id and i.due_date=s.next_billing_on and i.status<>'cancelled') then
      insert into public.invoices(organization_id,member_id,subscription_id,description,amount_cents,due_date,status)
      values(s.organization_id,s.member_id,s.id,'Mensalidade · '||s.plan_name,s.amount_cents-s.discount_cents,s.next_billing_on,'open');v_count:=v_count+1;
    end if;
    v_months:=case s.billing_cycle when 'quarterly' then 3 when 'semiannual' then 6 when 'annual' then 12 else 1 end;
    update public.subscriptions set next_billing_on=(s.next_billing_on+(v_months||' months')::interval)::date where id=s.id;
  end loop;return v_count;
end $$;

create or replace function public.refresh_retention_tasks(p_organization_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer:=0;v_added integer:=0;begin
  if not app_private.has_permission(p_organization_id,'crm.manage') then raise exception 'Acesso negado.';end if;
  insert into public.retention_tasks(organization_id,member_id,type,title,priority,due_at)
  select p_organization_id,m.id,'overdue_payment','Regularizar mensalidade de '||m.full_name,'high',now()
  from public.members m where m.organization_id=p_organization_id and exists(select 1 from public.invoices i where i.member_id=m.id and i.status in ('open','overdue') and i.due_date<current_date)
  and not exists(select 1 from public.retention_tasks t where t.member_id=m.id and t.type='overdue_payment' and t.status in ('open','in_progress'));
  get diagnostics v_count=row_count;
  insert into public.retention_tasks(organization_id,member_id,type,title,priority,due_at)
  select p_organization_id,m.id,'inactive_member','Reativar '||m.full_name,'medium',now()+interval '1 day'
  from public.members m where m.organization_id=p_organization_id and m.status='active' and not exists(select 1 from public.access_events a where a.member_id=m.id and a.direction='entry' and a.occurred_at>now()-interval '14 days')
  and not exists(select 1 from public.retention_tasks t where t.member_id=m.id and t.type='inactive_member' and t.status in ('open','in_progress'));
  get diagnostics v_added=row_count;v_count:=v_count+v_added;return v_count;
end $$;

revoke all on function public.generate_due_invoices(uuid),public.refresh_retention_tasks(uuid) from public,anon;
grant execute on function public.generate_due_invoices(uuid),public.refresh_retention_tasks(uuid) to authenticated;

commit;
