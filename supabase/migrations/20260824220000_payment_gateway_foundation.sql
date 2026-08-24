begin;

create table public.payment_provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('asaas','infinitepay')),
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  status text not null default 'draft' check (status in ('draft','testing','active','error','disabled')),
  display_name text,
  config jsonb not null default '{}'::jsonb,
  credentials_ciphertext text,
  credentials_hint text,
  last_tested_at timestamptz,
  last_error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table public.payment_provider_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.payment_provider_connections(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  provider_customer_id text not null,
  status text not null default 'active' check (status in ('active','inactive','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, member_id),
  unique (connection_id, provider_customer_id)
);

create table public.payment_provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.payment_provider_connections(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  provider_subscription_id text,
  provider_checkout_id text,
  mode text not null check (mode in ('native','invoice_link')),
  status text not null default 'pending' check (status in ('pending','active','paused','overdue','cancelled','ended','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, subscription_id)
);

create table public.payment_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.payment_provider_connections(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  kind text not null check (kind in ('invoice','recurring_setup')),
  status text not null default 'creating' check (status in ('creating','pending','paid','expired','cancelled','failed')),
  amount_cents integer not null check (amount_cents > 0),
  provider_checkout_id text,
  provider_payment_id text,
  checkout_url text,
  expires_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'invoice' and invoice_id is not null) or (kind = 'recurring_setup' and subscription_id is not null))
);

create table public.payment_webhook_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.payment_provider_connections(id) on delete cascade,
  provider text not null check (provider in ('asaas','infinitepay')),
  provider_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received','processed','ignored','failed')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (connection_id, provider_event_id)
);

alter table public.invoices
  add column payment_provider text check (payment_provider is null or payment_provider in ('asaas','infinitepay')),
  add column provider_payment_id text,
  add column payment_url text,
  add column provider_status text,
  add column gateway_updated_at timestamptz;

alter table public.payments
  add column provider text check (provider is null or provider in ('asaas','infinitepay')),
  add column provider_payment_id text,
  add column provider_fee_cents integer check (provider_fee_cents is null or provider_fee_cents >= 0),
  add column receipt_url text;

create index payment_connections_org_status_idx on public.payment_provider_connections(organization_id, status);
create index payment_provider_customers_member_idx on public.payment_provider_customers(organization_id, member_id);
create index payment_provider_subscriptions_status_idx on public.payment_provider_subscriptions(organization_id, status);
create index payment_checkout_sessions_invoice_idx on public.payment_checkout_sessions(invoice_id, created_at desc) where invoice_id is not null;
create index payment_checkout_sessions_subscription_idx on public.payment_checkout_sessions(subscription_id, created_at desc) where subscription_id is not null;
create unique index payment_checkout_provider_id_unique on public.payment_checkout_sessions(connection_id, provider_checkout_id) where provider_checkout_id is not null;
create unique index payments_provider_transaction_unique on public.payments(organization_id, provider, provider_payment_id) where provider is not null and provider_payment_id is not null;
create index payment_webhook_events_received_idx on public.payment_webhook_events(connection_id, received_at desc);

create trigger payment_provider_connections_set_updated_at before update on public.payment_provider_connections for each row execute function app_private.set_updated_at();
create trigger payment_provider_customers_set_updated_at before update on public.payment_provider_customers for each row execute function app_private.set_updated_at();
create trigger payment_provider_subscriptions_set_updated_at before update on public.payment_provider_subscriptions for each row execute function app_private.set_updated_at();
create trigger payment_checkout_sessions_set_updated_at before update on public.payment_checkout_sessions for each row execute function app_private.set_updated_at();

alter table public.payment_provider_connections enable row level security;
alter table public.payment_provider_customers enable row level security;
alter table public.payment_provider_subscriptions enable row level security;
alter table public.payment_checkout_sessions enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy payment_connections_select on public.payment_provider_connections for select to authenticated
using (app_private.has_permission(organization_id, 'billing.read'));
create policy payment_connections_manage on public.payment_provider_connections for all to authenticated
using (app_private.has_permission(organization_id, 'billing.manage'))
with check (app_private.has_permission(organization_id, 'billing.manage'));

create policy payment_customers_select on public.payment_provider_customers for select to authenticated
using (app_private.has_permission(organization_id, 'billing.read'));
create policy payment_customers_manage on public.payment_provider_customers for all to authenticated
using (app_private.has_permission(organization_id, 'billing.manage'))
with check (app_private.has_permission(organization_id, 'billing.manage'));

create policy payment_subscriptions_select on public.payment_provider_subscriptions for select to authenticated
using (app_private.has_permission(organization_id, 'billing.read'));
create policy payment_subscriptions_manage on public.payment_provider_subscriptions for all to authenticated
using (app_private.has_permission(organization_id, 'billing.manage'))
with check (app_private.has_permission(organization_id, 'billing.manage'));

create policy payment_checkout_sessions_select on public.payment_checkout_sessions for select to authenticated
using (app_private.has_permission(organization_id, 'billing.read'));
create policy payment_checkout_sessions_manage on public.payment_checkout_sessions for all to authenticated
using (app_private.has_permission(organization_id, 'billing.manage'))
with check (app_private.has_permission(organization_id, 'billing.manage'));

grant select, insert, update, delete on public.payment_provider_connections to authenticated;
grant select, insert, update, delete on public.payment_provider_customers to authenticated;
grant select, insert, update, delete on public.payment_provider_subscriptions to authenticated;
grant select, insert, update, delete on public.payment_checkout_sessions to authenticated;

commit;
