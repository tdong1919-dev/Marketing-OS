-- ====================================================================
-- migrations/0001_core.sql
-- ====================================================================
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


-- ====================================================================
-- migrations/0002_profiles.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Intelligence profiles (one row per agent)
-- Voice DNA, Beliefs, Hooks, Story frameworks, Phrases, Knowledge graph.
-- Structured detail is stored as jsonb; shapes are mirrored by the
-- zod schemas in lib/schemas/* and the Database type in lib/supabase/types.ts.
-- ───────────────────────────────────────────────────────────────

-- ── voice_profiles (Voice DNA Engine) ───────────────────────────
create table if not exists public.voice_profiles (
  id                 uuid primary key default gen_random_uuid(),
  agent_id           uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id           uuid not null references auth.users (id) on delete cascade,
  tone               jsonb not null default '{}'::jsonb,
  syntax             jsonb not null default '{}'::jsonb,
  formatting         jsonb not null default '{}'::jsonb,
  emotional_profile  jsonb not null default '{}'::jsonb,
  quirks             jsonb not null default '{}'::jsonb,
  fingerprint        jsonb not null default '{}'::jsonb,
  summary            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── belief_profiles (Belief & Thought Model Engine) ─────────────
create table if not exists public.belief_profiles (
  id                   uuid primary key default gen_random_uuid(),
  agent_id             uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  core_beliefs         jsonb not null default '[]'::jsonb,
  contrarian_beliefs   jsonb not null default '[]'::jsonb,
  industry_opinions    jsonb not null default '[]'::jsonb,
  philosophies         jsonb not null default '[]'::jsonb,
  decision_frameworks  jsonb not null default '[]'::jsonb,
  summary              text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── hook_libraries (Hook DNA Engine) ────────────────────────────
-- hooks: [{ type, example, frequency }]
create table if not exists public.hook_libraries (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  hooks       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── story_frameworks (Storytelling + Emotional Arc Engines) ─────
create table if not exists public.story_frameworks (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  frameworks      jsonb not null default '[]'::jsonb,  -- [{ name, structure, frequency }]
  emotional_arcs  jsonb not null default '[]'::jsonb,  -- [{ arc, frequency }]
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── phrase_libraries (Phrase Memory System) ─────────────────────
create table if not exists public.phrase_libraries (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id         uuid not null references auth.users (id) on delete cascade,
  favorite_words   jsonb not null default '[]'::jsonb,
  favorite_phrases jsonb not null default '[]'::jsonb,
  openers          jsonb not null default '[]'::jsonb,
  closers          jsonb not null default '[]'::jsonb,
  transitions      jsonb not null default '[]'::jsonb,
  metaphors        jsonb not null default '[]'::jsonb,
  ctas             jsonb not null default '[]'::jsonb,
  analogies        jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── knowledge_graphs (Knowledge Engine) ─────────────────────────
create table if not exists public.knowledge_graphs (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id      uuid not null references auth.users (id) on delete cascade,
  company       jsonb not null default '{}'::jsonb,
  products      jsonb not null default '[]'::jsonb,
  customers     jsonb not null default '[]'::jsonb,
  competitors   jsonb not null default '[]'::jsonb,
  objections    jsonb not null default '[]'::jsonb,
  testimonials  jsonb not null default '[]'::jsonb,
  brand_assets  jsonb not null default '[]'::jsonb,
  summary       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ====================================================================
-- migrations/0003_generation.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Content generation, quality scoring, revision learning
-- ───────────────────────────────────────────────────────────────

-- ── generated_content (Content Generation Module) ──────────────
create table if not exists public.generated_content (
  id                   uuid primary key default gen_random_uuid(),
  agent_id             uuid not null references public.writing_agents (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  -- request inputs
  topic                text,
  goal                 text,
  platform             text,
  audience             text,
  offer                text,
  cta                  text,
  length               text,
  notes                text,
  -- outputs
  primary_script       text,
  alternate_hooks      jsonb not null default '[]'::jsonb,
  alternate_ctas       jsonb not null default '[]'::jsonb,
  short_version        text,
  long_version         text,
  organic_version      text,
  sales_version        text,
  -- provenance + QC
  retrieved_script_ids uuid[] not null default '{}',
  overall_score        numeric,
  below_threshold      boolean not null default false,
  attempts             integer not null default 1,
  model                text,
  created_at           timestamptz not null default now()
);
create index if not exists generated_content_agent_idx on public.generated_content (agent_id);
create index if not exists generated_content_owner_idx on public.generated_content (owner_id);

-- ── quality_scores (Quality Control Engine) ─────────────────────
create table if not exists public.quality_scores (
  id                   uuid primary key default gen_random_uuid(),
  generated_content_id uuid not null references public.generated_content (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  voice_match          numeric,
  syntax_match         numeric,
  hook_match           numeric,
  story_match          numeric,
  belief_match         numeric,
  emotional_match      numeric,
  phrase_match         numeric,
  brand_accuracy       numeric,
  knowledge_accuracy   numeric,
  overall              numeric,
  attempt              integer not null default 1,
  rationale            text,
  created_at           timestamptz not null default now()
);
create index if not exists quality_scores_content_idx on public.quality_scores (generated_content_id);

-- ── revision_logs (Revision Learning Engine — schema for later) ─
create table if not exists public.revision_logs (
  id                   uuid primary key default gen_random_uuid(),
  generated_content_id uuid not null references public.generated_content (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  original_text        text,
  edited_text          text,
  published_text       text,
  diff                 jsonb,
  notes                text,
  created_at           timestamptz not null default now()
);
create index if not exists revision_logs_content_idx on public.revision_logs (generated_content_id);


-- ====================================================================
-- migrations/0004_stubs.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Deferred-phase tables (created now, unused by Phase 1 UI)
-- Performance Intelligence Engine + generic training assets.
-- ───────────────────────────────────────────────────────────────

-- ── performance_metrics (Performance Intelligence Engine) ───────
-- tier: top10 | middle50 | bottom10
create table if not exists public.performance_metrics (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null references public.writing_agents (id) on delete cascade,
  owner_id         uuid not null references auth.users (id) on delete cascade,
  platform         text,
  external_id      text,
  content_excerpt  text,
  metrics          jsonb not null default '{}'::jsonb,
  tier             text,
  captured_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists performance_metrics_agent_idx on public.performance_metrics (agent_id);

-- ── training_assets (generic future learning inputs) ────────────
create table if not exists public.training_assets (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.writing_agents (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  kind        text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists training_assets_agent_idx on public.training_assets (agent_id);


-- ====================================================================
-- migrations/0005_functions.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Functions & triggers
-- ───────────────────────────────────────────────────────────────

-- ── Auto-create a profile row when a new auth user signs up ─────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Generic updated_at maintenance ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'profiles', 'clients', 'writing_agents',
    'voice_profiles', 'belief_profiles', 'hook_libraries',
    'story_frameworks', 'phrase_libraries', 'knowledge_graphs'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ── Vector retrieval: top-K most similar script chunks for an agent ─
-- SECURITY DEFINER so it can use the ANN index regardless of RLS, but it
-- explicitly scopes results to the caller (auth.uid()) and the given agent.
create or replace function public.match_scripts(
  p_agent_id uuid,
  p_query_embedding vector(1536),
  p_match_count integer default 20
)
returns table (
  id uuid,
  asset_id uuid,
  chunk_index integer,
  content text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.asset_id,
    s.chunk_index,
    s.content,
    1 - (s.embedding <=> p_query_embedding) as similarity
  from public.uploaded_scripts s
  where s.agent_id = p_agent_id
    and s.owner_id = auth.uid()
    and s.embedding is not null
  order by s.embedding <=> p_query_embedding
  limit greatest(p_match_count, 1);
$$;

revoke all on function public.match_scripts(uuid, vector, integer) from public;
grant execute on function public.match_scripts(uuid, vector, integer) to authenticated;


-- ====================================================================
-- migrations/0006_rls.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Row Level Security
-- Every table is owner-scoped. profiles key on id; all others on owner_id.
-- Service-role API routes bypass RLS and enforce ownership in code.
-- ───────────────────────────────────────────────────────────────

-- profiles -------------------------------------------------------
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_insert on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

-- Owner-scoped tables: identical CRUD policy keyed on owner_id ----
do $$
declare
  t text;
  tables text[] := array[
    'clients', 'writing_agents', 'uploaded_assets', 'uploaded_scripts',
    'voice_profiles', 'belief_profiles', 'hook_libraries',
    'story_frameworks', 'phrase_libraries', 'knowledge_graphs',
    'generated_content', 'quality_scores', 'revision_logs',
    'performance_metrics', 'training_assets'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_insert on public.%I for insert with check (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_update on public.%I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_delete on public.%I for delete using (owner_id = auth.uid());',
      t, t);
  end loop;
end;
$$;


-- ====================================================================
-- migrations/0007_storage.sql
-- ====================================================================
-- ───────────────────────────────────────────────────────────────
-- BrkFree — Storage bucket for uploaded assets
-- Private bucket. Objects are stored under `${auth.uid}/...` and each
-- user may only access their own top-level folder.
-- ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

drop policy if exists "assets_owner_read" on storage.objects;
drop policy if exists "assets_owner_insert" on storage.objects;
drop policy if exists "assets_owner_update" on storage.objects;
drop policy if exists "assets_owner_delete" on storage.objects;

create policy "assets_owner_read" on storage.objects
  for select using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_update" on storage.objects
  for update using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

