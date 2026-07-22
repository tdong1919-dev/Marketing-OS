-- Jidoka Marketing Team OS — campaign-centered operating system.
-- This migration is intentionally additive. Existing marketing_os_* tables and
-- routes remain valid while campaigns become the central execution record.

create or replace function public.marketing_os_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.marketing_os_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users (id) on delete cascade,
  organization_id    uuid not null references auth.users (id) on delete cascade,
  client_id          uuid references public.marketing_os_clients (id) on delete set null,
  name               text not null,
  campaign_type      text not null default 'integrated',
  status             text not null default 'planning'
    check (status in ('planning','active','paused','completed','cancelled')),
  stage              text not null default 'strategy'
    check (stage in ('strategy','work','content','approval','publishing','leads','revenue','insights','improvement')),
  health             text not null default 'on_track'
    check (health in ('on_track','at_risk','blocked','complete')),
  priority           text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  goal               text,
  primary_kpi        text,
  target_audience    text,
  owner_name         text,
  budget             numeric(12,2) not null default 0,
  actual_spend       numeric(12,2) not null default 0,
  expected_revenue   numeric(12,2) not null default 0,
  attributed_revenue numeric(12,2) not null default 0,
  lead_goal          integer not null default 0,
  leads_count        integer not null default 0,
  start_date         date,
  end_date           date,
  brief              jsonb not null default '{}'::jsonb,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.marketing_os_campaign_briefs (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references auth.users (id) on delete cascade,
  organization_id       uuid not null references auth.users (id) on delete cascade,
  campaign_id           uuid not null references public.marketing_os_campaigns (id) on delete cascade,
  strategy_summary      text,
  audience              text,
  offer                 text,
  positioning           text,
  core_message          text,
  channels              text[] not null default '{}',
  content_pillars       jsonb not null default '[]'::jsonb,
  competitor_notes      text,
  approval_requirements text,
  measurement_plan      text,
  source_insights       jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (campaign_id)
);

create table if not exists public.marketing_os_work_items (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  organization_id   uuid not null references auth.users (id) on delete cascade,
  campaign_id       uuid references public.marketing_os_campaigns (id) on delete set null,
  client_id         uuid references public.marketing_os_clients (id) on delete set null,
  parent_id         uuid references public.marketing_os_work_items (id) on delete cascade,
  title             text not null,
  description       text,
  work_type         text not null default 'content'
    check (work_type in ('strategy','content','design','video','publishing','lead_gen','analytics','client_comms','ops')),
  status            text not null default 'not_started'
    check (status in ('backlog','not_started','in_progress','blocked','in_review','approved','done','cancelled')),
  priority          text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  assignee_user_id  uuid references auth.users (id) on delete set null,
  assignee_name     text,
  due_at            timestamptz,
  estimate_hours    numeric(8,2),
  actual_hours      numeric(8,2),
  capacity_week     date,
  source_type       text,
  source_id         uuid,
  created_by        uuid references auth.users (id) on delete set null,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.marketing_os_content_ideas (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references auth.users (id) on delete cascade,
  campaign_id     uuid references public.marketing_os_campaigns (id) on delete set null,
  client_id       uuid references public.marketing_os_clients (id) on delete set null,
  agent_id        uuid references public.marketing_os_writing_agents (id) on delete set null,
  title           text not null,
  description     text,
  source          text not null default 'manual',
  source_url      text,
  format          text,
  platform        text,
  funnel_stage    text not null default 'awareness'
    check (funnel_stage in ('awareness','consideration','conversion','retention')),
  status          text not null default 'idea'
    check (status in ('idea','briefed','generating','drafted','approved','scheduled','published','dismissed')),
  insight_payload jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.marketing_os_saved_insights (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references auth.users (id) on delete cascade,
  report_id       uuid references public.marketing_os_social_intelligence_reports (id) on delete set null,
  campaign_id     uuid references public.marketing_os_campaigns (id) on delete set null,
  client_id       uuid references public.marketing_os_clients (id) on delete set null,
  title           text not null,
  insight_type    text not null default 'opportunity',
  body            text not null,
  source          text not null default 'intelligence',
  status          text not null default 'saved'
    check (status in ('saved','dismissed','converted')),
  action_log      jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.marketing_os_leads (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  organization_id   uuid not null references auth.users (id) on delete cascade,
  campaign_id       uuid references public.marketing_os_campaigns (id) on delete set null,
  client_id         uuid references public.marketing_os_clients (id) on delete set null,
  source_channel    text,
  source_content_id uuid references public.marketing_os_generated_content (id) on delete set null,
  source_post_id    uuid references public.marketing_os_scheduled_posts (id) on delete set null,
  lead_name         text,
  email             text,
  phone             text,
  company           text,
  status            text not null default 'new'
    check (status in ('new','qualified','mql','sql','opportunity','customer','lost')),
  estimated_value   numeric(12,2) not null default 0,
  actual_value      numeric(12,2) not null default 0,
  converted_at      timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.marketing_os_revenue_events (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references auth.users (id) on delete cascade,
  organization_id       uuid not null references auth.users (id) on delete cascade,
  campaign_id           uuid references public.marketing_os_campaigns (id) on delete set null,
  client_id             uuid references public.marketing_os_clients (id) on delete set null,
  lead_id               uuid references public.marketing_os_leads (id) on delete set null,
  amount                numeric(12,2) not null default 0,
  currency              text not null default 'USD',
  event_type            text not null default 'deal_created'
    check (event_type in ('deal_created','closed_won','closed_lost','recurring','payment','refund')),
  attribution_model     text not null default 'manual',
  attributed_content_id uuid references public.marketing_os_generated_content (id) on delete set null,
  occurred_at           timestamptz not null default now(),
  notes                 text,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create table if not exists public.marketing_os_playbooks (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users (id) on delete cascade,
  organization_id  uuid not null references auth.users (id) on delete cascade,
  title            text not null,
  category         text not null default 'campaign'
    check (category in ('strategy','campaign','content','publishing','analytics','client_ops','sales','agency_ops')),
  status           text not null default 'draft'
    check (status in ('draft','active','archived')),
  summary          text,
  steps            jsonb not null default '[]'::jsonb,
  owner_name       text,
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.marketing_os_team_capacity (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references auth.users (id) on delete cascade,
  member_id       uuid references public.marketing_os_workspace_members (id) on delete set null,
  member_name     text not null,
  email           text,
  role            text not null default 'strategist',
  week_start      date not null,
  planned_hours   numeric(8,2) not null default 40,
  allocated_hours numeric(8,2) not null default 0,
  status          text not null default 'available'
    check (status in ('available','near_capacity','over_capacity','offline')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, email, week_start)
);

create table if not exists public.marketing_os_experiments (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references auth.users (id) on delete cascade,
  campaign_id     uuid references public.marketing_os_campaigns (id) on delete cascade,
  name            text not null,
  hypothesis      text,
  status          text not null default 'planned'
    check (status in ('planned','running','won','lost','inconclusive','archived')),
  metric          text,
  baseline_value  numeric,
  target_value    numeric,
  result_value    numeric,
  decision        text,
  started_at      timestamptz,
  ended_at        timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table if exists public.marketing_os_generated_content
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_scheduled_posts
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_media_assets
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_approval_requests
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_content_comments
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_content_status_history
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_performance_metrics
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_platform_analytics
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_film_sessions
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;
alter table if exists public.marketing_os_inbox_threads
  add column if not exists campaign_id uuid references public.marketing_os_campaigns (id) on delete set null;

create index if not exists marketing_os_campaigns_owner_status_idx
  on public.marketing_os_campaigns (owner_id, status, updated_at desc);
create index if not exists marketing_os_campaigns_client_idx
  on public.marketing_os_campaigns (client_id, updated_at desc);
create index if not exists marketing_os_campaigns_stage_idx
  on public.marketing_os_campaigns (owner_id, stage);
create index if not exists marketing_os_campaign_briefs_owner_idx
  on public.marketing_os_campaign_briefs (owner_id, campaign_id);
create index if not exists marketing_os_work_items_owner_status_idx
  on public.marketing_os_work_items (owner_id, status, due_at);
create index if not exists marketing_os_work_items_campaign_idx
  on public.marketing_os_work_items (campaign_id, status);
create index if not exists marketing_os_content_ideas_owner_status_idx
  on public.marketing_os_content_ideas (owner_id, status, created_at desc);
create index if not exists marketing_os_content_ideas_campaign_idx
  on public.marketing_os_content_ideas (campaign_id, status);
create index if not exists marketing_os_saved_insights_owner_status_idx
  on public.marketing_os_saved_insights (owner_id, status, created_at desc);
create index if not exists marketing_os_leads_campaign_status_idx
  on public.marketing_os_leads (campaign_id, status, created_at desc);
create index if not exists marketing_os_revenue_campaign_idx
  on public.marketing_os_revenue_events (campaign_id, occurred_at desc);
create index if not exists marketing_os_playbooks_owner_status_idx
  on public.marketing_os_playbooks (owner_id, status, updated_at desc);
create index if not exists marketing_os_team_capacity_owner_week_idx
  on public.marketing_os_team_capacity (owner_id, week_start, status);
create index if not exists marketing_os_experiments_campaign_idx
  on public.marketing_os_experiments (campaign_id, status);

create index if not exists marketing_os_generated_content_campaign_idx
  on public.marketing_os_generated_content (campaign_id, created_at desc);
create index if not exists marketing_os_scheduled_posts_campaign_idx
  on public.marketing_os_scheduled_posts (campaign_id, scheduled_time);
create index if not exists marketing_os_media_assets_campaign_idx
  on public.marketing_os_media_assets (campaign_id, created_at desc);
create index if not exists marketing_os_approval_requests_campaign_idx
  on public.marketing_os_approval_requests (campaign_id, status, created_at desc);
create index if not exists marketing_os_film_sessions_campaign_idx
  on public.marketing_os_film_sessions (campaign_id, created_at desc);
create index if not exists marketing_os_inbox_threads_campaign_idx
  on public.marketing_os_inbox_threads (campaign_id, updated_at desc);

do $$
declare
  t text;
  tables text[] := array[
    'marketing_os_campaigns',
    'marketing_os_campaign_briefs',
    'marketing_os_work_items',
    'marketing_os_content_ideas',
    'marketing_os_saved_insights',
    'marketing_os_leads',
    'marketing_os_revenue_events',
    'marketing_os_playbooks',
    'marketing_os_team_capacity',
    'marketing_os_experiments'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (owner_id = (select auth.uid()) and organization_id = (select auth.uid()));', t, t);
    execute format('create policy %I_update on public.%I for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and organization_id = (select auth.uid()));', t, t);
    execute format('create policy %I_delete on public.%I for delete using (owner_id = (select auth.uid()));', t, t);
  end loop;
end $$;

do $$
declare
  t text;
  tables text[] := array[
    'marketing_os_campaigns',
    'marketing_os_campaign_briefs',
    'marketing_os_work_items',
    'marketing_os_content_ideas',
    'marketing_os_saved_insights',
    'marketing_os_leads',
    'marketing_os_playbooks',
    'marketing_os_team_capacity',
    'marketing_os_experiments'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.marketing_os_set_updated_at();',
      t
    );
  end loop;
end $$;

comment on table public.marketing_os_campaigns is
  'Campaign-centered execution records for the Jidoka Marketing Team OS.';
comment on table public.marketing_os_work_items is
  'Cross-functional tasks for strategy, content, approval, publishing, leads, analytics, and client work.';
comment on table public.marketing_os_saved_insights is
  'Intelligence items saved, dismissed, or converted into campaigns, ideas, briefs, and work.';
