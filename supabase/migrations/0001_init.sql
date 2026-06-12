create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cronlets (
  id text primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  client_ref text not null,
  name text,
  state text not null default 'active',
  action_type text,
  schedule text,
  timezone text,
  requires_approval boolean not null default false,
  external_execution_approved boolean not null default false,
  next_run timestamptz null,
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (account_id, client_ref)
);

alter table public.accounts enable row level security;
alter table public.cronlets enable row level security;

create policy "accounts owner select"
  on public.accounts
  for select
  to authenticated
  using (auth.uid() = id);

create policy "cronlets owner select"
  on public.cronlets
  for select
  to authenticated
  using (auth.uid() = account_id);

grant select on public.accounts to authenticated;
grant select on public.cronlets to authenticated;
