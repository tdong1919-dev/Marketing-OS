-- ============================================================
-- Help tickets — reliable storage for support requests.
-- ============================================================
CREATE TABLE IF NOT EXISTS help_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  page_name text,
  concern_type text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',   -- open | in_progress | resolved
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE help_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can file a ticket; they can read their own.
-- (The API uses the service role to insert + for admin reads, bypassing RLS.)
CREATE POLICY "anyone can file a ticket" ON help_tickets
  FOR INSERT WITH CHECK (true);
CREATE POLICY "users see own tickets" ON help_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_help_tickets_created ON help_tickets(created_at DESC);
