-- ============================================================
-- Team Member Role & Tables
-- Run AFTER 004_business_fields.sql in Supabase SQL Editor
-- ============================================================

-- Update the user_role enum to include team_member
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_member';

-- ─── TEAM MEMBERS ───
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL DEFAULT 'Developer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_profile ON team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ─── PROJECT MEMBERS (project-team assignment) ───
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role_in_project TEXT NOT NULL DEFAULT 'Member',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_team ON project_members(team_member_id);

-- ─── Update tasks table to support team member assignment ───
-- assignee_id already exists in tasks table referencing profiles(id)
-- This is sufficient - team members are assigned via their profile_id

-- ─── TRIGGERS ───
CREATE TRIGGER set_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ───
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage team members" ON team_members FOR ALL USING (is_admin());
CREATE POLICY "Admin can manage project members" ON project_members FOR ALL USING (is_admin());

-- Team members can view their own record
CREATE POLICY "Team member can view own record" ON team_members FOR SELECT
  USING (profile_id = auth.uid());

-- Team members can view project members for their assigned projects
CREATE POLICY "Team member can view assigned project members" ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- ─── Update existing RLS for team member access ───

-- Team members can view assigned projects
CREATE POLICY "Team member can view assigned projects" ON projects FOR SELECT
  USING (
    id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can view tasks on assigned projects
CREATE POLICY "Team member can view assigned project tasks" ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can update tasks assigned to them
CREATE POLICY "Team member can update own tasks" ON tasks FOR UPDATE
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- Team members can view milestones on assigned projects
CREATE POLICY "Team member can view assigned milestones" ON milestones FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can view project updates on assigned projects
CREATE POLICY "Team member can view assigned project updates" ON project_updates FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can create project updates on assigned projects
CREATE POLICY "Team member can create updates on assigned projects" ON project_updates FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can view and upload files on assigned projects
CREATE POLICY "Team member can view assigned project files" ON project_files FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Team member can upload files to assigned projects" ON project_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      WHERE tm.profile_id = auth.uid()
    )
  );

-- Team members can send/receive messages
CREATE POLICY "Team member can view own messages" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Team member can send messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Team members can view own notifications
CREATE POLICY "Team member can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Team member can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Team members can log activity
CREATE POLICY "Team member can log activity" ON activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team member can view own activity" ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Team members can view own profile
CREATE POLICY "Team member can view profiles in projects" ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    id IN (
      SELECT tm2.profile_id FROM project_members pm
      JOIN team_members tm ON tm.id = pm.team_member_id
      JOIN team_members tm2 ON tm2.id IN (
        SELECT pm2.team_member_id FROM project_members pm2 WHERE pm2.project_id = pm.project_id
      )
      WHERE tm.profile_id = auth.uid()
    )
  );
