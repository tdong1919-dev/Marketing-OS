-- ───────────────────────────────────────────────────────────────
-- BrkFree — Film Sessions (batch script generator output)
-- A film session is a document of up to 50 scripts across formats,
-- laid out like the reference "Film Session" filming scripts.
-- ───────────────────────────────────────────────────────────────

create table if not exists public.brkfree_film_sessions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users (id) on delete cascade,
  agent_id       uuid not null references public.brkfree_writing_agents (id) on delete cascade,
  client_id      uuid references public.brkfree_clients (id) on delete set null,
  title          text not null,
  client_name    text,
  source_material text,
  format_mix     jsonb not null default '[]'::jsonb,   -- [{ formatId, count, topics }]
  scripts        jsonb not null default '[]'::jsonb,   -- GeneratedFilmScript[]
  script_count   integer not null default 0,
  status         text not null default 'ready',        -- generating | ready | error
  error          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists brkfree_film_sessions_owner_idx on public.brkfree_film_sessions (owner_id);
create index if not exists brkfree_film_sessions_agent_idx on public.brkfree_film_sessions (agent_id);

-- updated_at maintenance (self-contained, no cross-migration dependency)
create or replace function public.brkfree_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_updated_at on public.brkfree_film_sessions;
create trigger set_updated_at before update on public.brkfree_film_sessions
  for each row execute function public.brkfree_touch_updated_at();

-- RLS: owner-scoped
alter table public.brkfree_film_sessions enable row level security;
drop policy if exists brkfree_film_sessions_select on public.brkfree_film_sessions;
drop policy if exists brkfree_film_sessions_insert on public.brkfree_film_sessions;
drop policy if exists brkfree_film_sessions_update on public.brkfree_film_sessions;
drop policy if exists brkfree_film_sessions_delete on public.brkfree_film_sessions;
create policy brkfree_film_sessions_select on public.brkfree_film_sessions
  for select using (owner_id = auth.uid());
create policy brkfree_film_sessions_insert on public.brkfree_film_sessions
  for insert with check (owner_id = auth.uid());
create policy brkfree_film_sessions_update on public.brkfree_film_sessions
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy brkfree_film_sessions_delete on public.brkfree_film_sessions
  for delete using (owner_id = auth.uid());
