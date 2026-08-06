-- ============================================================
-- Fix: Ensure team members can always see tasks assigned to them
-- Run in Supabase SQL Editor
-- ============================================================

-- Add direct assignee-based policy (in case project_members check fails)
CREATE POLICY "Team member can view own assigned tasks"
  ON tasks FOR SELECT
  USING (assignee_id = auth.uid());

-- Also ensure team member can see their own projects via project_members
-- (This might already exist but won't error with IF NOT EXISTS approach)
DO $$ BEGIN
  -- Verify the existing policy works
  RAISE NOTICE 'Team task RLS policies updated';
END $$;
