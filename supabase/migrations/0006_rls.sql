-- ───────────────────────────────────────────────────────────────
-- BrkFree — Row Level Security
-- Every table is owner-scoped. profiles key on id; all others on owner_id.
-- Service-role API routes bypass RLS and enforce ownership in code.
-- ───────────────────────────────────────────────────────────────

-- profiles -------------------------------------------------------
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_insert on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

-- Owner-scoped tables: identical CRUD policy keyed on owner_id ----
do $$
declare
  t text;
  tables text[] := array[
    'clients', 'writing_agents', 'uploaded_assets', 'uploaded_scripts',
    'voice_profiles', 'belief_profiles', 'hook_libraries',
    'story_frameworks', 'phrase_libraries', 'knowledge_graphs',
    'generated_content', 'quality_scores', 'revision_logs',
    'performance_metrics', 'training_assets'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_insert on public.%I for insert with check (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_update on public.%I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t, t);
    execute format(
      'create policy %I_delete on public.%I for delete using (owner_id = auth.uid());',
      t, t);
  end loop;
end;
$$;
