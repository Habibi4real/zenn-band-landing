-- Apply in the existing Zenn Supabase project before enabling the form.
create table if not exists public.band_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'zenn-band-page',
  created_at timestamptz not null default now()
);
alter table public.band_waitlist enable row level security;
-- No anon/authenticated policies. Only the Vercel server function uses the service role.
