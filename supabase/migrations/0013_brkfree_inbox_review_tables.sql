-- BrkFree client Inbox / human review tables.
-- These tables persist Instagram Comment-to-DM review work separately from the
-- scheduler so inbound comments, AI drafts, approvals, and rejections have a
-- durable audit trail.

create table if not exists public.brkfree_inbox_threads (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users (id) on delete cascade,
  client_id          uuid references public.brkfree_clients (id) on delete cascade,
  agent_id           uuid references public.brkfree_writing_agents (id) on delete cascade,
  social_account_id  uuid references public.brkfree_social_accounts (id) on delete set null,
  scheduled_post_id  uuid unique references public.brkfree_scheduled_posts (id) on delete cascade,
  platform           text not null default 'instagram',
  channel            text not null default 'comment'
    check (channel in ('comment','dm')),
  external_thread_id text,
  participant_id     text,
  participant_username text,
  status             text not null default 'needs_review'
    check (status in ('needs_review','approved','rejected','posted','resolved','archived')),
  review_reason      text,
  last_message_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.brkfree_inbox_messages (
  id                  uuid primary key default gen_random_uuid(),
  thread_id           uuid not null references public.brkfree_inbox_threads (id) on delete cascade,
  owner_id            uuid not null references auth.users (id) on delete cascade,
  role                text not null default 'assistant'
    check (role in ('commenter','user','assistant','ai','human','system')),
  message_type        text not null default 'comment'
    check (message_type in ('comment','public_reply','dm','note','system')),
  body                text not null,
  ai_generated        boolean not null default false,
  status              text not null default 'draft'
    check (status in ('draft','approved','posted','rejected')),
  external_message_id text,
  created_at          timestamptz not null default now()
);

create table if not exists public.brkfree_inbox_reviews (
  id               uuid primary key default gen_random_uuid(),
  thread_id        uuid not null references public.brkfree_inbox_threads (id) on delete cascade,
  owner_id         uuid not null references auth.users (id) on delete cascade,
  reviewer_id      uuid references auth.users (id) on delete set null,
  action           text not null
    check (action in ('approved','rejected','edited','posted','resolved')),
  edited_body      text,
  note             text,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists brkfree_inbox_threads_owner_status_idx
  on public.brkfree_inbox_threads (owner_id, status, updated_at desc);
create index if not exists brkfree_inbox_threads_client_idx
  on public.brkfree_inbox_threads (client_id, updated_at desc);
create index if not exists brkfree_inbox_threads_agent_idx
  on public.brkfree_inbox_threads (agent_id, updated_at desc);
create index if not exists brkfree_inbox_messages_thread_idx
  on public.brkfree_inbox_messages (thread_id, created_at);
create index if not exists brkfree_inbox_reviews_thread_idx
  on public.brkfree_inbox_reviews (thread_id, created_at desc);

do $$
declare
  t text;
  tables text[] := array[
    'brkfree_inbox_threads',
    'brkfree_inbox_messages',
    'brkfree_inbox_reviews'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_update on public.%I for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_delete on public.%I for delete using (owner_id = (select auth.uid()));', t, t);
  end loop;
end $$;

drop trigger if exists set_updated_at on public.brkfree_inbox_threads;
create trigger set_updated_at
  before update on public.brkfree_inbox_threads
  for each row execute function public.brkfree_set_updated_at();
