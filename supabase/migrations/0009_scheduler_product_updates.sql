-- BrkFree scheduler/product refinements.
-- Adds Mailchimp as a connection target and scheduler controls needed by the UI.

alter table public.social_accounts
  drop constraint if exists social_accounts_platform_check;

alter table public.social_accounts
  add constraint social_accounts_platform_check
  check (platform in ('instagram','facebook','youtube','tiktok','x','linkedin','mailchimp'));

alter table public.scheduled_posts
  add column if not exists comment_dm_enabled boolean not null default false,
  add column if not exists comment_auto_reply text,
  add column if not exists dm_sequence text,
  add column if not exists source_import text,
  add column if not exists media_file_name text;

create table if not exists public.social_intelligence_reports (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users (id) on delete cascade,
  agent_id             uuid references public.writing_agents (id) on delete cascade,
  industry             text not null default 'functional medicine',
  platforms            text[] not null default '{}',
  competitor_accounts  text[] not null default '{}',
  trending_topics      jsonb not null default '[]'::jsonb,
  hooks                jsonb not null default '[]'::jsonb,
  audios               jsonb not null default '[]'::jsonb,
  content_opportunities jsonb not null default '[]'::jsonb,
  summary              text,
  scanned_at           timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

create index if not exists social_intelligence_reports_owner_idx
  on public.social_intelligence_reports (owner_id, scanned_at desc);

alter table public.social_intelligence_reports enable row level security;

drop policy if exists social_intelligence_reports_select on public.social_intelligence_reports;
drop policy if exists social_intelligence_reports_insert on public.social_intelligence_reports;
drop policy if exists social_intelligence_reports_update on public.social_intelligence_reports;
drop policy if exists social_intelligence_reports_delete on public.social_intelligence_reports;

create policy social_intelligence_reports_select
  on public.social_intelligence_reports for select using (owner_id = auth.uid());
create policy social_intelligence_reports_insert
  on public.social_intelligence_reports for insert with check (owner_id = auth.uid());
create policy social_intelligence_reports_update
  on public.social_intelligence_reports for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy social_intelligence_reports_delete
  on public.social_intelligence_reports for delete using (owner_id = auth.uid());
