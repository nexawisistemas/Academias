begin;

create table public.platform_site_settings (
  id text primary key default 'main',
  company jsonb not null default '{}'::jsonb,
  plans jsonb not null default '[]'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  conversion jsonb not null default '{}'::jsonb,
  legal jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint platform_site_settings_singleton check (id = 'main')
);

create table public.platform_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  business_name text,
  email text,
  phone text,
  units_count integer not null default 1 check (units_count between 1 and 999),
  students_count integer,
  interest text,
  source text not null default 'institutional_site',
  status text not null default 'new' check (status in ('new','contacting','demo_scheduled','proposal','won','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger platform_site_settings_updated_at before update on public.platform_site_settings
for each row execute function app_private.set_updated_at();
create trigger platform_leads_updated_at before update on public.platform_leads
for each row execute function app_private.set_updated_at();

alter table public.platform_site_settings enable row level security;
alter table public.platform_leads enable row level security;

create or replace function app_private.is_platform_operator()
returns boolean language sql stable security definer set search_path='' as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.organization_memberships m
    join public.organizations o on o.id=m.organization_id
    join public.membership_roles mr on mr.membership_id=m.id
    join public.roles r on r.id=mr.role_id
    where m.profile_id=auth.uid() and m.status='active' and r.code='owner' and o.slug='smart-tech'
  )
$$;
grant execute on function app_private.is_platform_operator() to authenticated;

create policy platform_settings_public_read on public.platform_site_settings
for select to anon,authenticated using (true);
create policy platform_settings_admin_manage on public.platform_site_settings
for all to authenticated using (app_private.is_platform_operator()) with check (app_private.is_platform_operator());
create policy platform_leads_admin_access on public.platform_leads
for all to authenticated using (app_private.is_platform_operator()) with check (app_private.is_platform_operator());

create or replace function public.capture_platform_lead(
  p_full_name text,
  p_business_name text default null,
  p_email text default null,
  p_phone text default null,
  p_units_count integer default 1,
  p_students_count integer default null,
  p_interest text default null
) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if char_length(trim(coalesce(p_full_name,''))) < 2 then raise exception 'Nome inválido.'; end if;
  if nullif(trim(coalesce(p_email,'')),'') is null and nullif(trim(coalesce(p_phone,'')),'') is null then
    raise exception 'Informe e-mail ou telefone.';
  end if;
  insert into public.platform_leads(full_name,business_name,email,phone,units_count,students_count,interest)
  values(trim(p_full_name),nullif(trim(p_business_name),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),least(999,greatest(1,coalesce(p_units_count,1))),p_students_count,nullif(trim(p_interest),''))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.capture_platform_lead(text,text,text,text,integer,integer,text) from public;
grant execute on function public.capture_platform_lead(text,text,text,text,integer,integer,text) to anon,authenticated;

insert into public.platform_site_settings(id,company,plans,analytics,conversion,legal)
values (
  'main',
  '{"legalName":"54954 James Costa Lima","tradeName":"NexaWi Academias","taxId":"54.954.915/0001-65","city":"Vitória da Conquista","state":"BA","email":"contato@nexawi.com.br","supportEmail":"contato@nexawi.com.br","whatsapp":"5577988656394","whatsappDisplay":"(77) 98865-6394","serviceHours":"Atendimento digital 24 horas, 7 dias por semana","domain":"academias.nexawi.com.br"}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  '{"primary":"demo","trialDays":7,"commitmentMonths":6}'::jsonb,
  '{"privacyVersion":"1.0","termsVersion":"1.0","contact":"contato@nexawi.com.br"}'::jsonb
)
on conflict (id) do update set company=excluded.company,conversion=excluded.conversion,legal=excluded.legal;

insert into public.organizations(name,slug,legal_name,email,status,saas_plan,metadata)
values('Áurea Performance Club','aurea-performance','Academia demonstrativa','contato@aureaperformance.example','active','demo','{"demo":true,"instagram":"@aureaperformance.demo"}'::jsonb)
on conflict(slug) do nothing;

insert into public.branches(organization_id,name,slug,is_main,email,address)
select id,'Áurea Candeias','aurea-candeias',true,'unidade@aureaperformance.example','{"street":"Avenida Movimento","number":"360","neighborhood":"Candeias","city":"Vitória da Conquista","state":"BA","note":"Endereço fictício para demonstração"}'::jsonb
from public.organizations where slug='aurea-performance'
on conflict(organization_id,slug) do nothing;

insert into public.organization_settings(organization_id,branding)
select id,'{
  "demo": true,
  "logo_url": "/images/gym-site/aurea-logo.svg",
  "eyebrow": "MOVIMENTO QUE MUDA TUDO",
  "headline": "Sua força encontra direção.",
  "headline_accent": "Sua melhor fase começa aqui.",
  "description": "Treino inteligente, ambiente premium e uma equipe presente para transformar intenção em evolução.",
  "primary_color": "#8bff2e",
  "instagram": "@aureaperformance.demo",
  "hours": ["Segunda a sexta · 05h às 23h", "Sábados · 07h às 18h", "Domingos e feriados · 08h às 13h"],
  "modalities": [
    {"title":"Musculação inteligente","description":"Força, técnica e progressão com acompanhamento."},
    {"title":"Treino funcional","description":"Condicionamento, mobilidade e energia em grupo."},
    {"title":"Cardio experience","description":"Aulas intensas para acelerar corpo e mente."}
  ],
  "team": [
    {"name":"Lívia Andrade","role":"Coordenação técnica","specialty":"Força e condicionamento"},
    {"name":"Rafael Nunes","role":"Coach","specialty":"Musculação e performance"},
    {"name":"Maya Torres","role":"Instrutora","specialty":"Funcional e cardio"}
  ],
  "seo_title": "Áurea Performance Club | Academia demonstrativa",
  "seo_description": "Conheça uma experiência fictícia de academia criada para demonstrar o site NexaWi Academias."
}'::jsonb from public.organizations where slug='aurea-performance'
on conflict(organization_id) do update set branding=excluded.branding;

insert into public.membership_plans(organization_id,name,description,billing_cycle,price_cents,benefits,active)
select o.id,p.name,p.description,'monthly',p.price,p.benefits,true
from public.organizations o
cross join (values
  ('Start','Para começar com liberdade e orientação.',9990,'["Musculação completa","Avaliação inicial","App de acompanhamento"]'::jsonb),
  ('Performance','A experiência mais completa para evoluir.',14990,'["Tudo do Start","Aulas coletivas","Reavaliações periódicas","Plano de evolução"]'::jsonb),
  ('Black','Mais flexibilidade, benefícios e experiências.',21990,'["Tudo do Performance","Acesso total aos horários","Convidado mensal","Experiências exclusivas"]'::jsonb)
) as p(name,description,price,benefits)
where o.slug='aurea-performance'
  and not exists(select 1 from public.membership_plans mp where mp.organization_id=o.id and mp.name=p.name and mp.active);

insert into public.organization_memberships(organization_id,profile_id,status,accepted_at)
select demo.id,m.profile_id,'active',now()
from public.organizations demo
join public.organizations source on source.slug='smart-tech'
join public.organization_memberships m on m.organization_id=source.id and m.status='active'
join public.membership_roles mr on mr.membership_id=m.id
join public.roles r on r.id=mr.role_id and r.code='owner'
where demo.slug='aurea-performance'
on conflict(organization_id,profile_id) do nothing;

insert into public.membership_roles(membership_id,role_id)
select m.id,r.id
from public.organization_memberships m
join public.organizations o on o.id=m.organization_id and o.slug='aurea-performance'
cross join public.roles r
where r.organization_id is null and r.code='owner'
on conflict do nothing;

commit;
