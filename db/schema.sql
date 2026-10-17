-- Skema Postgres / Supabase untuk studio AI Roblox.
-- Jalankan sekali: npm run db:init  (atau tempel di Supabase SQL editor)

create table if not exists cycles (
  id            bigserial primary key,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running' check (status in ('running','done','failed')),
  trend_report  jsonb,
  error         text
);

-- Satu baris = satu karya dari satu agent (classic shirt, 3D shirt, 3D pants, atau game).
create table if not exists items (
  id            bigserial primary key,
  cycle_id      bigint references cycles(id) on delete set null,
  agent         text not null check (agent in ('kobbie','bruno','sesko','dalot')),
  kind          text not null check (kind in ('classic_shirt','ugc_shirt','ugc_pants','game')),
  name          text not null,
  data          jsonb not null,            -- output JSON mentah dari agent
  files         jsonb not null default '[]'::jsonb,  -- path relatif di storage/
  rule_check    jsonb,                     -- hasil cek deterministik (ukuran PNG, panjang teks, kata terlarang)
  qa            jsonb,                     -- hasil Quality & Safety Check AI
  status        text not null default 'pending_qa' check (status in (
                  'pending_qa','qa_failed','pending_review','revision_requested',
                  'approved','rejected','published','publish_failed')),
  admin_note    text,
  revision_of   bigint references items(id) on delete set null,
  roblox_asset_id text,
  bundle_key    text,                      -- Bruno + Sesko yang dijual sebagai set
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists items_status_idx on items(status);
create index if not exists items_cycle_idx on items(cycle_id);

-- Voting member komunitas (satu suara per member per item).
create table if not exists votes (
  item_id     bigint not null references items(id) on delete cascade,
  member_id   text not null,               -- mis. Roblox userId atau id login website
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  primary key (item_id, member_id)
);

-- Log aktivitas yang tampil di website komunitas.
create table if not exists activity_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor       text not null,               -- 'scout','kobbie','bruno','sesko','dalot','qa','admin','system'
  message     text not null,
  item_id     bigint references items(id) on delete set null,
  public      boolean not null default true
);
create index if not exists activity_log_at_idx on activity_log(at desc);
