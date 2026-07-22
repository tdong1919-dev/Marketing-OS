-- ───────────────────────────────────────────────────────────────
-- BrkFree Voice Intelligence Engine — Core schema
-- Extensions, profiles, clients, writing agents, assets, scripts.
-- ───────────────────────────────────────────────────────────────

create extension if not exists vector;

-- ── profiles: mirror of auth.users ──────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── clients ─────────────────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  industry    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists clients_owner_idx on public.clients (owner_id);

-- ── writing_agents ──────────────────────────────────────────────
-- status: draft | analyzing | ready | error
create table if not exists public.writing_agents (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  client_id         uuid references public.clients (id) on delete set null,
  name              text not null,
  industry          text,
  platform          text,
  notes             text,
  status            text not null default 'draft',
  last_analyzed_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists writing_agents_owner_idx on public.writing_agents (owner_id);
create index if not exists writing_agents_client_idx on public.writing_agents (client_id);

-- ── uploaded_assets: raw uploaded files / urls / pastes ─────────
-- kind: pdf|docx|txt|csv|url|paste|transcript|caption|script|email|vsl
-- status: pending|extracted|error
create table if not exists public.uploaded_assets (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references public.writing_agents (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  kind            text not null default 'paste',
  title           text,
  source_url      text,
  storage_path    text,
  mime_type       text,
  byte_size       bigint,
  extracted_text  text,
  char_count      integer,
  status          text not null default 'pending',
  error           text,
  created_at      timestamptz not null default now()
);
create index if not exists uploaded_assets_agent_idx on public.uploaded_assets (agent_id);
create index if not exists uploaded_assets_owner_idx on public.uploaded_assets (owner_id);

-- ── uploaded_scripts: chunked + embedded text for retrieval ─────
create table if not exists public.uploaded_scripts (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references public.writing_agents (id) on delete cascade,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  asset_id     uuid references public.uploaded_assets (id) on delete cascade,
  chunk_index  integer not null default 0,
  content      text not null,
  token_count  integer,
  embedding    vector(1536),
  created_at   timestamptz not null default now()
);
create index if not exists uploaded_scripts_agent_idx on public.uploaded_scripts (agent_id);
create index if not exists uploaded_scripts_owner_idx on public.uploaded_scripts (owner_id);
-- Cosine-distance ANN index for fast nearest-neighbour retrieval.
create index if not exists uploaded_scripts_embedding_idx
  on public.uploaded_scripts using hnsw (embedding vector_cosine_ops);
