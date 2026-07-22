-- BrkFree agency collaboration, approvals, media library, notifications, and API logs.
-- Run after 0009_scheduler_product_updates.sql.

create table if not exists public.workspace_members (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  member_user_id  uuid references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete cascade,
  email           text not null,
  display_name    text,
  role            text not null default 'strategist'
    check (role in ('admin','strategist','writer','client')),
  status          text not null default 'invited'
    check (status in ('invited','active','disabled')),
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, email, client_id)
);

create table if not exists public.media_assets (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete cascade,
  agent_id        uuid references public.writing_agents (id) on delete cascade,
  uploaded_asset_id uuid references public.uploaded_assets (id) on delete set null,
  title           text,
  file_name       text not null,
  storage_path    text not null,
  mime_type       text,
  byte_size       bigint,
  media_type      text not null default 'asset'
    check (media_type in ('image','video','carousel','document','asset','other')),
  platform_fit    text[] not null default '{}',
  tags            text[] not null default '{}',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users (id) on delete cascade,
  client_id            uuid references public.clients (id) on delete cascade,
  agent_id             uuid references public.writing_agents (id) on delete cascade,
  generated_content_id uuid references public.generated_content (id) on delete cascade,
  scheduled_post_id    uuid references public.scheduled_posts (id) on delete cascade,
  requested_by         uuid references auth.users (id) on delete set null,
  reviewer_email       text,
  reviewer_name        text,
  share_token          text not null unique default encode(gen_random_bytes(24), 'hex'),
  status               text not null default 'pending'
    check (status in ('pending','approved','changes_requested','rejected','expired','cancelled')),
  message              text,
  response_note        text,
  due_at               timestamptz,
  expires_at           timestamptz,
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (generated_content_id is not null or scheduled_post_id is not null)
);

create table if not exists public.content_comments (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users (id) on delete cascade,
  client_id            uuid references public.clients (id) on delete cascade,
  agent_id             uuid references public.writing_agents (id) on delete cascade,
  generated_content_id uuid references public.generated_content (id) on delete cascade,
  scheduled_post_id    uuid references public.scheduled_posts (id) on delete cascade,
  approval_request_id  uuid references public.approval_requests (id) on delete cascade,
  author_user_id       uuid references auth.users (id) on delete set null,
  author_email         text,
  author_name          text,
  visibility           text not null default 'internal'
    check (visibility in ('internal','client','public')),
  comment_type         text not null default 'note'
    check (comment_type in ('note','revision_request','approval_note','system')),
  body                 text not null,
  resolved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (generated_content_id is not null or scheduled_post_id is not null or approval_request_id is not null)
);

create table if not exists public.content_status_history (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users (id) on delete cascade,
  client_id            uuid references public.clients (id) on delete cascade,
  agent_id             uuid references public.writing_agents (id) on delete cascade,
  generated_content_id uuid references public.generated_content (id) on delete cascade,
  scheduled_post_id    uuid references public.scheduled_posts (id) on delete cascade,
  from_status          text,
  to_status            text not null,
  actor_user_id        uuid references auth.users (id) on delete set null,
  actor_email          text,
  note                 text,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  check (generated_content_id is not null or scheduled_post_id is not null)
);

create table if not exists public.competitor_accounts (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete cascade,
  agent_id        uuid references public.writing_agents (id) on delete cascade,
  platform        text not null
    check (platform in ('instagram','facebook','youtube','tiktok','x','linkedin','website','podcast','other')),
  handle          text not null,
  profile_url     text,
  display_name    text,
  niche           text not null default 'functional medicine',
  scan_enabled    boolean not null default true,
  notes           text,
  last_scanned_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, platform, handle, client_id)
);

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete cascade,
  agent_id        uuid references public.writing_agents (id) on delete cascade,
  scheduled_post_id uuid references public.scheduled_posts (id) on delete cascade,
  generated_content_id uuid references public.generated_content (id) on delete cascade,
  type            text not null
    check (type in ('account_disconnected','approval_needed','revision_requested','publish_failed','missing_media','missing_caption','analytics_ready','system')),
  title           text not null,
  body            text,
  action_href     text,
  priority        text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.integration_events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users (id) on delete cascade,
  agent_id        uuid references public.writing_agents (id) on delete cascade,
  social_account_id uuid references public.social_accounts (id) on delete set null,
  scheduled_post_id uuid references public.scheduled_posts (id) on delete set null,
  platform        text not null,
  event_type      text not null
    check (event_type in ('oauth_started','oauth_connected','token_refreshed','token_expired','publish_attempt','publish_success','publish_failed','analytics_pull','webhook','api_error')),
  status          text not null default 'info'
    check (status in ('info','success','warning','error')),
  message         text,
  request_id      text,
  external_id     text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists public.client_share_links (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  client_id       uuid references public.clients (id) on delete cascade,
  approval_request_id uuid references public.approval_requests (id) on delete cascade,
  token           text not null unique default encode(gen_random_bytes(24), 'hex'),
  label           text,
  scope           text not null default 'approval'
    check (scope in ('approval','calendar','content_library','analytics')),
  permissions     jsonb not null default '{}'::jsonb,
  expires_at      timestamptz,
  last_accessed_at timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.activity_events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  actor_user_id   uuid references auth.users (id) on delete set null,
  actor_email     text,
  client_id       uuid references public.clients (id) on delete cascade,
  agent_id        uuid references public.writing_agents (id) on delete cascade,
  entity_type     text not null,
  entity_id       uuid,
  event_type      text not null,
  title           text not null,
  body            text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists workspace_members_owner_idx on public.workspace_members (owner_id);
create index if not exists workspace_members_client_idx on public.workspace_members (client_id);
create index if not exists media_assets_owner_idx on public.media_assets (owner_id, created_at desc);
create index if not exists media_assets_agent_idx on public.media_assets (agent_id);
create index if not exists approval_requests_owner_status_idx on public.approval_requests (owner_id, status, created_at desc);
create index if not exists approval_requests_token_idx on public.approval_requests (share_token);
create index if not exists content_comments_generated_idx on public.content_comments (generated_content_id, created_at);
create index if not exists content_comments_scheduled_idx on public.content_comments (scheduled_post_id, created_at);
create index if not exists content_status_history_generated_idx on public.content_status_history (generated_content_id, created_at desc);
create index if not exists content_status_history_scheduled_idx on public.content_status_history (scheduled_post_id, created_at desc);
create index if not exists competitor_accounts_owner_idx on public.competitor_accounts (owner_id, scan_enabled);
create index if not exists notifications_owner_unread_idx on public.notifications (owner_id, created_at desc) where read_at is null;
create index if not exists integration_events_owner_idx on public.integration_events (owner_id, created_at desc);
create index if not exists client_share_links_token_idx on public.client_share_links (token);
create index if not exists activity_events_owner_idx on public.activity_events (owner_id, created_at desc);

do $$
declare
  t text;
  tables text[] := array[
    'workspace_members',
    'media_assets',
    'approval_requests',
    'content_comments',
    'competitor_accounts',
    'client_share_links'
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

do $$
declare
  t text;
  tables text[] := array[
    'workspace_members',
    'media_assets',
    'approval_requests',
    'content_comments',
    'content_status_history',
    'competitor_accounts',
    'notifications',
    'integration_events',
    'client_share_links',
    'activity_events'
  ];
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

insert into storage.buckets (id, name, public)
values ('brand-media', 'brand-media', false)
on conflict (id) do nothing;

drop policy if exists "brand_media_owner_read" on storage.objects;
drop policy if exists "brand_media_owner_insert" on storage.objects;
drop policy if exists "brand_media_owner_update" on storage.objects;
drop policy if exists "brand_media_owner_delete" on storage.objects;

create policy "brand_media_owner_read" on storage.objects
  for select using (bucket_id = 'brand-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "brand_media_owner_insert" on storage.objects
  for insert with check (bucket_id = 'brand-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "brand_media_owner_update" on storage.objects
  for update using (bucket_id = 'brand-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "brand_media_owner_delete" on storage.objects
  for delete using (bucket_id = 'brand-media' and (storage.foldername(name))[1] = auth.uid()::text);
