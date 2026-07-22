-- ───────────────────────────────────────────────────────────────
-- BrkFree — Smart Scheduler, Calendar, Brand Brain, Analytics, Social
-- Ports the Autom8 content/scheduling/analytics model into BrkFree's
-- per-agent, owner-scoped structure. Run after 0001–0007.
-- ───────────────────────────────────────────────────────────────

-- ── generated_content: explicit TITLE (links to scheduled posts) ──
alter table public.generated_content
  add column if not exists title text;

-- ── brand_brains: editable per-agent brand knowledge ────────────
create table if not exists public.brand_brains (
  id                   uuid primary key default gen_random_uuid(),
  agent_id             uuid not null unique references public.writing_agents (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  business_name        text,
  industry             text,
  description          text,
  language             text default 'English',
  tone                 text[] not null default '{}',
  tone_notes           text,
  services_products    text,
  pricing              text,
  brand_voice_examples text,
  web_link             text,
  booking_link         text,
  allowed_ctas         text,
  cta_keywords         text[] not null default '{}',
  cta_links            jsonb not null default '[]'::jsonb,  -- [{ label, url }]
  faqs                 jsonb not null default '[]'::jsonb,  -- [{ q, a }]
  emoji_allowed        boolean not null default true,
  formality_level      integer not null default 50 check (formality_level between 0 and 100),
  location             text,
  hours                text,
  phone                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists brand_brains_owner_idx on public.brand_brains (owner_id);

-- ── social_accounts: connected platforms, per agent ─────────────
create table if not exists public.social_accounts (
  id                     uuid primary key default gen_random_uuid(),
  agent_id               uuid not null references public.writing_agents (id) on delete cascade,
  owner_id               uuid not null references auth.users (id) on delete cascade,
  platform               text not null
    check (platform in ('instagram','facebook','youtube','tiktok','x','linkedin')),
  external_account_id    text,
  username               text,
  profile_picture_url    text,
  access_token_encrypted text,
  page_id                text,
  page_token_encrypted   text,
  token_expires_at       timestamptz,
  status                 text not null default 'pending'
    check (status in ('pending','active','expired','disconnected')),
  connected_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists social_accounts_agent_idx on public.social_accounts (agent_id);
create index if not exists social_accounts_owner_idx on public.social_accounts (owner_id);

-- ── scheduled_posts: the Smart Scheduler queue ──────────────────
-- status: draft | scheduled | posting | posted | failed
-- content_type: image | reel | carousel | story | video
create table if not exists public.scheduled_posts (
  id                   uuid primary key default gen_random_uuid(),
  agent_id             uuid not null references public.writing_agents (id) on delete cascade,
  owner_id             uuid not null references auth.users (id) on delete cascade,
  generated_content_id uuid references public.generated_content (id) on delete set null,
  social_account_id    uuid references public.social_accounts (id) on delete set null,
  platform             text not null default 'instagram',
  title                text,
  caption              text,
  script               text,
  media_url            text,
  media_path           text,
  content_type         text not null default 'reel',
  status               text not null default 'draft'
    check (status in ('draft','scheduled','posting','posted','failed')),
  scheduled_time       timestamptz,
  best_posting_window  text,
  ideal_days           text,
  confidence_score     numeric,
  schedule_reason      text,
  posted_at            timestamptz,
  external_post_id     text,
  performance_score    numeric,
  error                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists scheduled_posts_agent_idx on public.scheduled_posts (agent_id);
create index if not exists scheduled_posts_owner_idx on public.scheduled_posts (owner_id);
create index if not exists scheduled_posts_due_idx
  on public.scheduled_posts (scheduled_time) where status = 'scheduled';
-- Title match lookups (case-insensitive done in app; this helps exact match)
create index if not exists scheduled_posts_title_idx on public.scheduled_posts (agent_id, title);

-- ── platform_analytics: per-post metrics ────────────────────────
create table if not exists public.platform_analytics (
  id                  uuid primary key default gen_random_uuid(),
  agent_id            uuid not null references public.writing_agents (id) on delete cascade,
  owner_id            uuid not null references auth.users (id) on delete cascade,
  social_account_id   uuid references public.social_accounts (id) on delete set null,
  scheduled_post_id   uuid references public.scheduled_posts (id) on delete set null,
  platform            text not null default 'instagram',
  post_id             text,
  title               text,
  posted_time         timestamptz,
  fetched_at          timestamptz not null default now(),
  date                date,
  hour                integer,
  day_of_week         text,
  caption             text,
  media_type          text,
  views               integer not null default 0,
  impressions         integer not null default 0,
  reach               integer not null default 0,
  likes               integer not null default 0,
  comments            integer not null default 0,
  shares              integer not null default 0,
  saves               integer not null default 0,
  reposts             integer not null default 0,
  watch_time          numeric not null default 0,
  followers_gained    integer not null default 0,
  engagement_score    integer not null default 0,
  performance_score   integer not null default 0,
  raw_metrics         jsonb,
  created_at          timestamptz not null default now(),
  unique (owner_id, platform, post_id)
);
create index if not exists platform_analytics_agent_idx on public.platform_analytics (agent_id);
create index if not exists platform_analytics_date_idx on public.platform_analytics (date);

-- ── updated_at triggers ─────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array['brand_brains','social_accounts','scheduled_posts'];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ── RLS (owner-scoped) ──────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array['brand_brains','social_accounts','scheduled_posts','platform_analytics'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (owner_id = auth.uid());', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (owner_id = auth.uid());', t, t);
    execute format('create policy %I_update on public.%I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());', t, t);
    execute format('create policy %I_delete on public.%I for delete using (owner_id = auth.uid());', t, t);
  end loop;
end;
$$;

-- ── Storage bucket for scheduler media (private, owner-foldered) ─
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

drop policy if exists "media_owner_read" on storage.objects;
drop policy if exists "media_owner_insert" on storage.objects;
drop policy if exists "media_owner_update" on storage.objects;
drop policy if exists "media_owner_delete" on storage.objects;

create policy "media_owner_read" on storage.objects
  for select using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_owner_insert" on storage.objects
  for insert with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_owner_update" on storage.objects
  for update using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_owner_delete" on storage.objects
  for delete using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
