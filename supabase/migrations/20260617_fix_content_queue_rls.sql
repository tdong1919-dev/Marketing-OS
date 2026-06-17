-- ============================================================
-- Fix agent-table RLS that never fully applied to production.
--
-- The original migration (20260609_agent_tables.sql) was only
-- partially applied: content_queue and dm_conversations had RLS
-- enabled but NO policy (every access denied), and platform_analytics
-- had RLS disabled entirely (readable by anyone with the anon key).
--
-- Symptom that surfaced this:
--   "new row violates row-level security policy for table content_queue"
--
-- This recreates each owner policy with an explicit WITH CHECK clause so
-- INSERT/UPDATE are validated against the authenticated user, and re-enables
-- RLS on platform_analytics.
--
-- comment_processing_log is intentionally left with RLS on and no policy:
-- it's an internal log written only by the service-role client.
-- ============================================================

-- content_queue ------------------------------------------------
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own content" ON content_queue;
DROP POLICY IF EXISTS "Users manage own content" ON content_queue;
CREATE POLICY "Users manage own content" ON content_queue
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- platform_analytics -------------------------------------------
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own analytics" ON platform_analytics;
CREATE POLICY "Users see own analytics" ON platform_analytics
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- dm_conversations ---------------------------------------------
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own DMs" ON dm_conversations;
CREATE POLICY "Users see own DMs" ON dm_conversations
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
