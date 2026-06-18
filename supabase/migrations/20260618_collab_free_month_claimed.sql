-- Track that a collaborator has claimed their one-time free month so they
-- can't start multiple trials. Applied to production via MCP apply_migration.
alter table public.collab_applications
  add column if not exists free_month_claimed_at timestamptz;
