-- This schema is deliberately outside the public Data API schemas.
create schema if not exists valora_private;
revoke all on schema valora_private from public;

create table valora_private.app_state (
  environment text primary key check (environment in ('test', 'live')),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
insert into valora_private.app_state (environment, state) select environment, '{
  "participants": [], "registrations": [], "allocations": [],
  "credentials": [], "audit": [], "outbox": [], "counters": {},
  "rateLimits": {}, "matrices": {}
}'::jsonb from (values ('test'), ('live')) as modes(environment);

create table valora_private.rate_limits (
  key text primary key,
  hits integer not null,
  reset_at bigint not null
);
create index rate_limits_expiry on valora_private.rate_limits (reset_at);

alter table valora_private.app_state enable row level security;
alter table valora_private.rate_limits enable row level security;
revoke all on all tables in schema valora_private from public;
-- No anon/authenticated policies: only the trusted server's Postgres connection
-- can read or mutate records. Never expose DATABASE_URL to the browser.
