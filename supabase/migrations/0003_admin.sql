-- Admin support: hide a contribution from public activity feeds, and log
-- webhook processing failures for inspection.

alter table contributions
  add column if not exists hidden_from_activity boolean not null default false;

create table if not exists webhook_failures (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text,
  event_type text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table webhook_failures enable row level security;
-- No public policies: only the service-role key (server-side admin views) can read this.
