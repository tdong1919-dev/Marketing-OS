-- ───────────────────────────────────────────────────────────────
-- Transfer all test data from one user to Erik, and label it "Test".
-- Replace the two emails below, then run in the Supabase SQL editor.
-- Erik must have signed up first (so his auth user exists).
-- ───────────────────────────────────────────────────────────────

do $$
declare
  src uuid;   -- current owner (the email you uploaded under)
  dst uuid;   -- Erik
begin
  select id into src from auth.users where lower(email) = lower('SOURCE_EMAIL');
  select id into dst from auth.users where lower(email) = lower('ERIK_EMAIL');

  if src is null then raise exception 'Source user not found — check SOURCE_EMAIL'; end if;
  if dst is null then raise exception 'Erik not found — have him sign up first'; end if;

  update public.clients            set owner_id = dst where owner_id = src;
  update public.writing_agents     set owner_id = dst where owner_id = src;
  update public.uploaded_assets    set owner_id = dst where owner_id = src;
  update public.uploaded_scripts   set owner_id = dst where owner_id = src;
  update public.voice_profiles     set owner_id = dst where owner_id = src;
  update public.belief_profiles    set owner_id = dst where owner_id = src;
  update public.hook_libraries     set owner_id = dst where owner_id = src;
  update public.story_frameworks   set owner_id = dst where owner_id = src;
  update public.phrase_libraries   set owner_id = dst where owner_id = src;
  update public.knowledge_graphs   set owner_id = dst where owner_id = src;
  update public.generated_content  set owner_id = dst where owner_id = src;
  update public.quality_scores     set owner_id = dst where owner_id = src;
  update public.revision_logs      set owner_id = dst where owner_id = src;
  update public.performance_metrics set owner_id = dst where owner_id = src;
  update public.training_assets    set owner_id = dst where owner_id = src;

  -- Label transferred records as test data (idempotent).
  update public.clients        set name = 'Test — ' || name
    where owner_id = dst and name not like 'Test — %';
  update public.writing_agents set name = 'Test — ' || name
    where owner_id = dst and name not like 'Test — %';
end $$;
