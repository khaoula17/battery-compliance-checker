-- Supabase schema for the Battery Compliance Checker.
-- Apply in the Supabase SQL editor. The checker engine works without this;
-- this powers accounts, saved checks, billing, white-label, and the API.

-- App-side profile (auth.users holds the identity).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free',          -- free | payg | pro | whitelabel
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Saved checks (dashboard + usage counting).
create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  ruleset_version text not null,
  operator text,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists checks_user_created_idx on public.checks (user_id, created_at desc);

-- White-label tenants for the 3PL portal (/<slug>).
create table if not exists public.domains (
  slug text primary key,
  owner_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  brand_color text default '#0f766e',
  custom_domain text,
  created_at timestamptz not null default now()
);

-- API keys for /api/v1/labels (store a SHA-256 hash, never the raw key).
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key_hash text not null unique,
  label text,
  last_used_at timestamptz,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);
-- If the table already exists, add the column:
-- alter table public.api_keys add column if not exists usage_count integer not null default 0;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.checks   enable row level security;
alter table public.api_keys enable row level security;
alter table public.domains  enable row level security;

-- Profiles: a user can see/update only their own row.
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile write"  on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- Checks: a user can read/insert only their own.
create policy "own checks read"   on public.checks for select using (auth.uid() = user_id);
create policy "own checks insert" on public.checks for insert with check (auth.uid() = user_id);

-- API keys: owner-only.
create policy "own keys read"   on public.api_keys for select using (auth.uid() = user_id);
create policy "own keys insert" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "own keys delete" on public.api_keys for delete using (auth.uid() = user_id);

-- Domains: public read (needed to render the white-label portal); writes via service role only.
create policy "domains public read" on public.domains for select using (true);

-- NOTE: the Stripe webhook and API-key lookup use the service-role key, which
-- bypasses RLS. Keep SUPABASE_SERVICE_ROLE_KEY server-side only.
