-- ============================================================
-- Performance Indexes
-- Run in Supabase SQL Editor
-- ============================================================

-- Messages performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Notifications performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- Tasks by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);

-- Projects by status
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(status, created_at DESC);

-- Project members composite
CREATE INDEX IF NOT EXISTS idx_project_members_team_project ON project_members(team_member_id, project_id);

-- Invoices by client and status
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);

-- Agreements by client
CREATE INDEX IF NOT EXISTS idx_agreements_client_status ON agreements(client_id, status);
