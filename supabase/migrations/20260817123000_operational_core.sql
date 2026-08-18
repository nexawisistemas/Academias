begin;

create table public.members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null, source_lead_id uuid unique references public.crm_leads(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160), email text, phone text, cpf text, birth_date date,
  status text not null default 'active' check (status in ('lead','active','paused','inactive','cancelled')), goal text, medical_notes text,
  address jsonb not null default '{}'::jsonb, emergency_contact jsonb not null default '{}'::jsonb,
  joined_at date not null default current_date, inactive_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index members_org_cpf_unique on public.members(organization_id, regexp_replace(cpf,'[^0-9]','','g')) where cpf is not null and cpf <> '';
create index members_org_status_idx on public.members(organization_id,status,created_at desc);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','quarterly','semiannual','annual')),
  price_cents integer not null check (price_cents >= 0), enrollment_fee_cents integer not null default 0 check (enrollment_fee_cents >= 0),
  access_limit_per_week smallint, benefits jsonb not null default '[]'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null, member_id uuid not null references public.members(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id) on delete restrict, status text not null default 'active' check (status in ('pending','active','paused','overdue','cancelled','ended')),
  starts_on date not null default current_date, ends_on date, next_billing_on date, amount_cents integer not null check (amount_cents >= 0), discount_cents integer not null default 0 check (discount_cents >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index subscriptions_org_status_idx on public.subscriptions(organization_id,status,next_billing_on);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade, subscription_id uuid references public.subscriptions(id) on delete set null,
  description text not null, amount_cents integer not null check (amount_cents >= 0), due_date date not null,
  status text not null default 'open' check (status in ('draft','open','paid','overdue','cancelled','refunded')), paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index invoices_org_status_due_idx on public.invoices(organization_id,status,due_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade, amount_cents integer not null check (amount_cents >= 0),
  method text not null check (method in ('pix','credit_card','debit_card','cash','bank_slip','transfer','other')),
  status text not null default 'confirmed' check (status in ('pending','confirmed','failed','refunded')), transaction_reference text,
  paid_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table public.class_types (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, description text, color text not null default '#5dff9f', duration_minutes smallint not null default 60 check(duration_minutes between 10 and 300),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name)
);
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade, class_type_id uuid references public.class_types(id) on delete set null,
  coach_profile_id uuid references public.profiles(id) on delete set null, title text not null, starts_at timestamptz not null, ends_at timestamptz not null,
  capacity smallint not null default 20 check(capacity > 0), status text not null default 'scheduled' check(status in ('scheduled','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at > starts_at)
);
create index class_sessions_org_start_idx on public.class_sessions(organization_id,starts_at);
create table public.class_bookings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null references public.class_sessions(id) on delete cascade, member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'booked' check(status in ('booked','waitlist','attended','no_show','cancelled')), checked_in_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(session_id,member_id)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, muscle_group text, equipment text, instructions text, media_url text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,name)
);
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, goal text, level text check(level in ('beginner','intermediate','advanced')), notes text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workout_items (
  id uuid primary key default gen_random_uuid(), workout_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict, sequence smallint not null default 1,
  sets smallint, reps text, load_guidance text, rest_seconds smallint, notes text, created_at timestamptz not null default now()
);
create table public.member_workouts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade, workout_id uuid not null references public.workout_templates(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null, starts_on date not null default current_date, ends_on date,
  status text not null default 'active' check(status in ('active','completed','cancelled')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.physical_assessments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade, assessor_profile_id uuid references public.profiles(id) on delete set null,
  assessed_at timestamptz not null default now(), weight_kg numeric(6,2), height_cm numeric(6,2), body_fat_percent numeric(5,2),
  measurements jsonb not null default '{}'::jsonb, notes text, created_at timestamptz not null default now()
);

create table public.access_events (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade, member_id uuid not null references public.members(id) on delete cascade,
  direction text not null default 'entry' check(direction in ('entry','exit','denied')), method text not null default 'manual' check(method in ('manual','qr_code','biometric','turnstile')),
  reason text, occurred_at timestamptz not null default now()
);
create index access_events_org_occurred_idx on public.access_events(organization_id,occurred_at desc);

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.crm_leads(id) on delete cascade, actor_profile_id uuid references public.profiles(id) on delete set null,
  type text not null check(type in ('note','call','whatsapp','email','visit','status_change','follow_up')), content text,
  scheduled_for timestamptz, completed_at timestamptz, created_at timestamptz not null default now()
);

do $$ declare t text; begin foreach t in array array['members','membership_plans','subscriptions','invoices','class_types','class_sessions','class_bookings','exercises','workout_templates','member_workouts'] loop execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function app_private.set_updated_at()',t,t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['members','membership_plans','subscriptions','invoices','payments','class_types','class_sessions','class_bookings','exercises','workout_templates','workout_items','member_workouts','physical_assessments','access_events','crm_activities'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

create policy members_select on public.members for select to authenticated using(app_private.has_permission(organization_id,'members.read',branch_id));
create policy members_manage on public.members for all to authenticated using(app_private.has_permission(organization_id,'members.manage',branch_id)) with check(app_private.has_permission(organization_id,'members.manage',branch_id));
create policy plans_access on public.membership_plans for all to authenticated using(app_private.has_permission(organization_id,'members.read')) with check(app_private.has_permission(organization_id,'members.manage'));
create policy subscriptions_access on public.subscriptions for all to authenticated using(app_private.has_permission(organization_id,'members.read',branch_id)) with check(app_private.has_permission(organization_id,'members.manage',branch_id));
create policy invoices_access on public.invoices for all to authenticated using(app_private.has_permission(organization_id,'billing.read')) with check(app_private.has_permission(organization_id,'billing.manage'));
create policy payments_access on public.payments for all to authenticated using(app_private.has_permission(organization_id,'billing.read')) with check(app_private.has_permission(organization_id,'billing.manage'));
create policy class_types_access on public.class_types for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'classes.manage'));
create policy class_sessions_access on public.class_sessions for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'classes.manage',branch_id));
create policy class_bookings_access on public.class_bookings for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'classes.manage'));
create policy exercises_access on public.exercises for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'training.manage'));
create policy workout_templates_access on public.workout_templates for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'training.manage'));
create policy workout_items_access on public.workout_items for all to authenticated using(exists(select 1 from public.workout_templates w where w.id=workout_id and app_private.has_organization_access(w.organization_id))) with check(exists(select 1 from public.workout_templates w where w.id=workout_id and app_private.has_permission(w.organization_id,'training.manage')));
create policy member_workouts_access on public.member_workouts for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'training.manage'));
create policy assessments_access on public.physical_assessments for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'training.manage'));
create policy access_events_access on public.access_events for all to authenticated using(app_private.has_organization_access(organization_id)) with check(app_private.has_permission(organization_id,'members.manage',branch_id));
create policy crm_activities_access on public.crm_activities for all to authenticated using(app_private.has_permission(organization_id,'crm.manage')) with check(app_private.has_permission(organization_id,'crm.manage'));

grant select,insert,update,delete on public.members,public.membership_plans,public.subscriptions,public.invoices,public.payments,public.class_types,public.class_sessions,public.class_bookings,public.exercises,public.workout_templates,public.workout_items,public.member_workouts,public.physical_assessments,public.access_events,public.crm_activities to authenticated;
grant usage,select on sequence public.access_events_id_seq to authenticated;

create or replace function public.convert_lead_to_member(p_lead_id uuid,p_plan_id uuid default null,p_branch_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_lead public.crm_leads; v_member_id uuid; v_plan public.membership_plans; begin
  select * into v_lead from public.crm_leads where id=p_lead_id;
  if v_lead.id is null or not app_private.has_permission(v_lead.organization_id,'crm.manage',v_lead.branch_id) then raise exception 'Lead não encontrado ou acesso negado.'; end if;
  insert into public.members(organization_id,branch_id,source_lead_id,full_name,email,phone,status,goal)
  values(v_lead.organization_id,coalesce(p_branch_id,v_lead.branch_id),v_lead.id,v_lead.full_name,v_lead.email,v_lead.phone,'active',v_lead.interest) returning id into v_member_id;
  if p_plan_id is not null then select * into v_plan from public.membership_plans where id=p_plan_id and organization_id=v_lead.organization_id and active;
    if v_plan.id is null then raise exception 'Plano inválido.'; end if;
    insert into public.subscriptions(organization_id,branch_id,member_id,plan_id,status,next_billing_on,amount_cents)
    values(v_lead.organization_id,coalesce(p_branch_id,v_lead.branch_id),v_member_id,v_plan.id,'active',current_date,v_plan.price_cents);
  end if;
  update public.crm_leads set status='won',won_at=now() where id=v_lead.id;
  insert into public.audit_logs(organization_id,branch_id,actor_profile_id,action,entity_type,entity_id,metadata)
  values(v_lead.organization_id,coalesce(p_branch_id,v_lead.branch_id),auth.uid(),'crm.lead_converted','member',v_member_id::text,jsonb_build_object('lead_id',v_lead.id));
  return v_member_id;
end $$;

create or replace function app_private.create_first_invoice() returns trigger language plpgsql security definer set search_path='' as $$
declare v_plan_name text; begin if new.status='active' and new.amount_cents-new.discount_cents > 0 then
  select name into v_plan_name from public.membership_plans where id=new.plan_id;
  insert into public.invoices(organization_id,member_id,subscription_id,description,amount_cents,due_date,status)
  values(new.organization_id,new.member_id,new.id,'Mensalidade · '||coalesce(v_plan_name,'Plano'),new.amount_cents-new.discount_cents,coalesce(new.next_billing_on,new.starts_on),'open');
end if; return new; end $$;
create trigger subscriptions_create_first_invoice after insert on public.subscriptions for each row execute function app_private.create_first_invoice();

revoke all on function public.convert_lead_to_member(uuid,uuid,uuid) from public,anon;
grant execute on function public.convert_lead_to_member(uuid,uuid,uuid) to authenticated;

create or replace function public.get_public_gym_site(p_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'organization',jsonb_build_object('id',o.id,'name',o.name,'slug',o.slug,'phone',o.phone,'email',o.email),
    'branding',coalesce(s.branding,'{}'::jsonb),
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'phone',b.phone,'address',b.address) order by b.is_main desc,b.name) from public.branches b where b.organization_id=o.id and b.status='active'),'[]'::jsonb),
    'plans',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'description',p.description,'price_cents',p.price_cents,'billing_cycle',p.billing_cycle,'benefits',p.benefits) order by p.price_cents) from public.membership_plans p where p.organization_id=o.id and p.active),'[]'::jsonb)
  ) from public.organizations o left join public.organization_settings s on s.organization_id=o.id
  where o.slug=lower(trim(p_slug)) and o.status in ('trial','active') limit 1
$$;

create or replace function public.capture_public_lead(p_slug text,p_full_name text,p_email text default null,p_phone text default null,p_interest text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_org uuid;v_branch uuid;v_id uuid;begin
  if char_length(trim(coalesce(p_full_name,'')))<2 then raise exception 'Nome inválido.';end if;
  select o.id into v_org from public.organizations o where o.slug=lower(trim(p_slug)) and o.status in ('trial','active');
  if v_org is null then raise exception 'Academia não encontrada.';end if;
  select b.id into v_branch from public.branches b where b.organization_id=v_org and b.is_main limit 1;
  insert into public.crm_leads(organization_id,branch_id,full_name,email,phone,interest,source,status)
  values(v_org,v_branch,trim(p_full_name),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_interest),''),'site','new') returning id into v_id;
  return v_id;
end $$;

revoke all on function public.get_public_gym_site(text),public.capture_public_lead(text,text,text,text,text) from public;
grant execute on function public.get_public_gym_site(text),public.capture_public_lead(text,text,text,text,text) to anon,authenticated;

commit;
