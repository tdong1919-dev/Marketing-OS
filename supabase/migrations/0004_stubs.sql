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
