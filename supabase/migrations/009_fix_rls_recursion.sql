-- ============================================================
-- FIX: Infinite recursion in project_members RLS policy
-- This is the CRITICAL fix for "Failed to load projects/tasks"
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the broken policy that causes infinite recursion
DROP POLICY IF EXISTS "project_members_team" ON project_members;

-- Recreate WITHOUT self-referencing sub-select
-- Team members can see project_members rows where they are a member
CREATE POLICY "project_members_team" ON project_members FOR SELECT USING (
  team_member_id IN (SELECT id FROM team_members WHERE profile_id = auth.uid())
);

-- Also fix the projects policy for team members (it references project_members which triggers recursion)
DROP POLICY IF EXISTS "projects_team" ON projects;

-- Team members can see projects they are assigned to
-- Use a direct join to team_members to avoid recursion
CREATE POLICY "projects_team" ON projects FOR SELECT USING (
  id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- Fix tasks policy for team (same recursion path)
DROP POLICY IF EXISTS "tasks_team_select" ON tasks;

CREATE POLICY "tasks_team_select" ON tasks FOR SELECT USING (
  assignee_id = auth.uid()
  OR project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- Fix milestones policy for team
DROP POLICY IF EXISTS "milestones_team" ON milestones;

CREATE POLICY "milestones_team" ON milestones FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- Fix project_updates policy for team
DROP POLICY IF EXISTS "project_updates_team_select" ON project_updates;

CREATE POLICY "project_updates_team_select" ON project_updates FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- Fix project_updates INSERT for team
DROP POLICY IF EXISTS "project_updates_team_insert" ON project_updates;

CREATE POLICY "project_updates_team_insert" ON project_updates FOR INSERT WITH CHECK (
  author_id = auth.uid() AND project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- Fix project_files policies for team
DROP POLICY IF EXISTS "project_files_team_select" ON project_files;
DROP POLICY IF EXISTS "project_files_team_insert" ON project_files;

CREATE POLICY "project_files_team_select" ON project_files FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

CREATE POLICY "project_files_team_insert" ON project_files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    INNER JOIN team_members tm ON tm.id = pm.team_member_id 
    WHERE tm.profile_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════
-- VERIFY: Test queries after running this migration
-- ═══════════════════════════════════════════════
-- As client: SELECT * FROM projects LIMIT 5;
-- As team:   SELECT * FROM projects LIMIT 5;
-- As team:   SELECT * FROM tasks LIMIT 5;
-- All should return results without recursion error.
