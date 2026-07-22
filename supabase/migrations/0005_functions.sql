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
