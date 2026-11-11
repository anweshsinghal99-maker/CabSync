-- Run in the Supabase SQL editor before enabling live production pods.
create table if not exists public.pods (
  id text primary key,
  destination_hub text not null,
  departure_date date not null,
  campus_leave_time time not null,
  female_only boolean not null default false,
  fare integer not null check (fare >= 0),
  members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.pods enable row level security;
-- The client currently reads public matching summaries. Writes must use a
-- server route that validates the signed session and policy constraints.
create policy "verified clients can read pod summaries" on public.pods for select using (true);
alter publication supabase_realtime add table public.pods;
