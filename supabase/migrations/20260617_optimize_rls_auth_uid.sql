-- ============================================================
-- Performance advisor 0003 (auth_rls_initplan), applied to production.
--
-- Every owner RLS policy called auth.uid() directly, which Postgres
-- re-evaluates once per row. Wrapping it in a scalar subselect
-- — (select auth.uid()) — makes the planner evaluate it once per query.
-- Same value, same access control; purely a planner optimization.
--
-- This DO block rewrites every public policy that references an unwrapped
-- auth.uid() in its USING or WITH CHECK expression. It is idempotent:
-- already-wrapped policies (containing "select auth.uid()") are skipped.
-- ============================================================
DO $$
DECLARE
  r record;
  stmt text;
BEGIN
  FOR r IN
    SELECT c.relname,
           p.polname,
           pg_get_expr(p.polqual, p.polrelid)       AS using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid)   AS check_expr
    FROM pg_policy p
    JOIN pg_class c     ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND ( pg_get_expr(p.polqual, p.polrelid)     LIKE '%auth.uid()%'
         OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%auth.uid()%' )
      AND coalesce(pg_get_expr(p.polqual, p.polrelid), '')     NOT ILIKE '%select auth.uid()%'
      AND coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') NOT ILIKE '%select auth.uid()%'
  LOOP
    stmt := format('ALTER POLICY %I ON public.%I', r.polname, r.relname);
    IF r.using_expr IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', replace(r.using_expr, 'auth.uid()', '(select auth.uid())'));
    END IF;
    IF r.check_expr IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', replace(r.check_expr, 'auth.uid()', '(select auth.uid())'));
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;
