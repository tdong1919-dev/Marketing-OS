alter function public.brkfree_set_updated_at() set search_path = public;
revoke all on function public.brkfree_set_updated_at() from public;
revoke all on function public.brkfree_set_updated_at() from anon;
revoke all on function public.brkfree_set_updated_at() from authenticated;

alter function public.brkfree_match_scripts(uuid, vector, integer) security invoker;
alter function public.brkfree_match_scripts(uuid, vector, integer) set search_path = public;
revoke all on function public.brkfree_match_scripts(uuid, vector, integer) from public;
revoke all on function public.brkfree_match_scripts(uuid, vector, integer) from anon;
grant execute on function public.brkfree_match_scripts(uuid, vector, integer) to authenticated;
grant execute on function public.brkfree_match_scripts(uuid, vector, integer) to service_role;

do $$
declare
  r record;
begin
  for r in
    with fk as (
      select
        con.conrelid,
        con.conname as constraint_name,
        ns.nspname as schema_name,
        rel.relname as table_name,
        con.conkey as fk_attnums,
        string_agg(format('%I', att.attname), ', ' order by u.ord) as column_list
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
      join unnest(con.conkey) with ordinality as u(attnum, ord) on true
      join pg_attribute att on att.attrelid = rel.oid and att.attnum = u.attnum
      where con.contype = 'f'
        and ns.nspname = 'public'
        and rel.relname like 'brkfree_%'
      group by con.conrelid, con.conname, ns.nspname, rel.relname, con.conkey
    ), missing as (
      select fk.*
      from fk
      where not exists (
        select 1
        from pg_index i
        where i.indrelid = fk.conrelid
          and i.indisvalid
          and (
            select array_agg(k order by ord)
            from unnest(i.indkey::smallint[]) with ordinality as keys(k, ord)
            where ord <= array_length(fk.fk_attnums, 1)
          ) = (
            select array_agg(k order by ord)
            from unnest(fk.fk_attnums) with ordinality as keys(k, ord)
          )
      )
    )
    select
      schema_name,
      table_name,
      regexp_replace(constraint_name, '_fkey$', '_idx') as index_name,
      column_list
    from missing
  loop
    execute format(
      'create index if not exists %I on %I.%I (%s);',
      left(r.index_name, 63),
      r.schema_name,
      r.table_name,
      r.column_list
    );
  end loop;
end $$;

drop policy if exists brkfree_profiles_select on public.brkfree_profiles;
drop policy if exists brkfree_profiles_update on public.brkfree_profiles;
drop policy if exists brkfree_profiles_insert on public.brkfree_profiles;
create policy brkfree_profiles_select on public.brkfree_profiles
  for select using (id = (select auth.uid()));
create policy brkfree_profiles_update on public.brkfree_profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy brkfree_profiles_insert on public.brkfree_profiles
  for insert with check (id = (select auth.uid()));

do $$
declare
  t text;
  tables text[] := array[
    'brkfree_clients',
    'brkfree_writing_agents',
    'brkfree_uploaded_assets',
    'brkfree_uploaded_scripts',
    'brkfree_voice_profiles',
    'brkfree_belief_profiles',
    'brkfree_hook_libraries',
    'brkfree_story_frameworks',
    'brkfree_phrase_libraries',
    'brkfree_knowledge_graphs',
    'brkfree_generated_content',
    'brkfree_quality_scores',
    'brkfree_revision_logs',
    'brkfree_performance_metrics',
    'brkfree_training_assets',
    'brkfree_brand_brains',
    'brkfree_social_accounts',
    'brkfree_scheduled_posts',
    'brkfree_platform_analytics',
    'brkfree_social_intelligence_reports',
    'brkfree_workspace_members',
    'brkfree_media_assets',
    'brkfree_approval_requests',
    'brkfree_content_comments',
    'brkfree_content_status_history',
    'brkfree_competitor_accounts',
    'brkfree_notifications',
    'brkfree_integration_events',
    'brkfree_client_share_links',
    'brkfree_activity_events'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_update on public.%I for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));', t, t);
    execute format('create policy %I_delete on public.%I for delete using (owner_id = (select auth.uid()));', t, t);
  end loop;
end;
$$;

drop policy if exists "brkfree_storage_owner_read" on storage.objects;
drop policy if exists "brkfree_storage_owner_insert" on storage.objects;
drop policy if exists "brkfree_storage_owner_update" on storage.objects;
drop policy if exists "brkfree_storage_owner_delete" on storage.objects;

create policy "brkfree_storage_owner_read" on storage.objects
  for select using (
    bucket_id in ('brkfree-assets','brkfree-media','brkfree-brand-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "brkfree_storage_owner_insert" on storage.objects
  for insert with check (
    bucket_id in ('brkfree-assets','brkfree-media','brkfree-brand-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "brkfree_storage_owner_update" on storage.objects
  for update using (
    bucket_id in ('brkfree-assets','brkfree-media','brkfree-brand-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "brkfree_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id in ('brkfree-assets','brkfree-media','brkfree-brand-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
