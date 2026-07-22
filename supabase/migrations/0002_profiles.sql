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
