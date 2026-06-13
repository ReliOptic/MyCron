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

-- A reused Supabase project may already have a public.cronlets table.
-- Keep the MyCron read spine additive; do not drop or rewrite old rows.
alter table public.cronlets
  add column if not exists account_id uuid references public.accounts(id) on delete cascade,
  add column if not exists client_ref text,
  add column if not exists name text,
  add column if not exists action_type text,
  add column if not exists schedule text,
  add column if not exists timezone text,
  add column if not exists requires_approval boolean not null default false,
  add column if not exists external_execution_approved boolean not null default false,
  add column if not exists next_run timestamptz null,
  add column if not exists spec jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists cronlets_account_id_client_ref_idx
  on public.cronlets (account_id, client_ref);

alter table public.accounts enable row level security;
alter table public.cronlets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'accounts'
      and policyname = 'accounts owner select'
  ) then
    create policy "accounts owner select"
      on public.accounts
      for select
      to authenticated
      using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cronlets'
      and policyname = 'cronlets owner select'
  ) then
    create policy "cronlets owner select"
      on public.cronlets
      for select
      to authenticated
      using (auth.uid() = account_id);
  end if;
end $$;

grant select on public.accounts to authenticated;
grant select on public.cronlets to authenticated;
