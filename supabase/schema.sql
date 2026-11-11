-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- The site talks to these tables only from the server (service role key),
-- so row level security is switched on with no public policies.

create extension if not exists pgcrypto;

create table if not exists profiles (
  wallet      text primary key,
  handle      text unique,
  bio         text default '',
  x_handle    text,
  skills      text[] default '{}',
  created_at  timestamptz default now()
);

create table if not exists gigs (
  id             uuid primary key default gen_random_uuid(),
  poster         text not null,
  title          text not null,
  description    text not null,
  category       text not null,
  currency       text not null check (currency in ('SOL','USDC')),
  amount         bigint not null check (amount > 0),        -- base units (lamports / USDC 6dp)
  deadline_days  int not null default 7,
  status         text not null default 'open'
                 check (status in ('open','hiring','funded','submitted','paid','refunded','cancelled')),
  worker         text,
  create_key     text,      -- one-time key used to derive the Squads vault
  multisig       text,      -- Squads multisig PDA
  vault          text,      -- Squads vault PDA (index 0)
  release_index  bigint,    -- Squads transaction index of the payout
  refund_index   bigint,    -- Squads transaction index of the refund
  disputed       boolean not null default false,
  hidden         boolean not null default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists gigs_status_idx on gigs (status, created_at desc);
create index if not exists gigs_poster_idx on gigs (poster);
create index if not exists gigs_worker_idx on gigs (worker);

create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  applicant   text not null,
  pitch       text not null,
  portfolio   text,
  created_at  timestamptz default now(),
  unique (gig_id, applicant)
);

create table if not exists submissions (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  worker      text not null,
  note        text not null,
  link        text,
  created_at  timestamptz default now()
);

create table if not exists disputes (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  opened_by   text not null,
  reason      text not null,
  resolution  text check (resolution in ('paid','refunded')),
  resolved_at timestamptz,
  created_at  timestamptz default now()
);

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  reporter    text not null,
  reason      text not null,
  created_at  timestamptz default now(),
  unique (gig_id, reporter)
);

create table if not exists events (
  id          bigserial primary key,
  gig_id      uuid not null references gigs(id) on delete cascade,
  actor       text,
  kind        text not null,
  tx          text,
  created_at  timestamptz default now()
);
create index if not exists events_gig_idx on events (gig_id, created_at);

alter table profiles     enable row level security;
alter table gigs         enable row level security;
alter table applications enable row level security;
alter table submissions  enable row level security;
alter table disputes     enable row level security;
alter table reports      enable row level security;
alter table events       enable row level security;

-- ---------- added: reviews (run this part if you ran the file before) ----------
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  author      text not null,
  subject     text not null,
  rating      int not null check (rating between 1 and 5),
  body        text not null default '',
  created_at  timestamptz default now(),
  unique (gig_id, author)
);
create index if not exists reviews_subject_idx on reviews (subject, created_at desc);
alter table reviews enable row level security;
