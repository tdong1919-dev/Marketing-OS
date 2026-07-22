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
