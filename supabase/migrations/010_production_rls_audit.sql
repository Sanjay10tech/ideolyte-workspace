-- ============================================================
-- PRODUCTION RLS SECURITY AUDIT & FIX
-- Ideolyte Workspace — Complete Data Isolation
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════
-- HELPER FUNCTIONS (CREATE OR REPLACE — safe)
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_client_id()
RETURNS UUID AS $$
DECLARE cid UUID;
BEGIN
  SELECT id INTO cid FROM clients WHERE profile_id = auth.uid();
  RETURN cid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════
-- PROFILES — Fix: anonymous users must NOT read profiles
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Team member can view profiles in projects" ON profiles;

-- Only authenticated users can read profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.uid() IS NOT NULL AND (auth.uid() = id OR is_admin())
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id OR is_admin()
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR is_admin()
);

-- ═══════════════════════════════════════════════
-- CLIENTS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "clients_admin" ON clients;
DROP POLICY IF EXISTS "clients_own" ON clients;
DROP POLICY IF EXISTS "Admin can manage all clients" ON clients;
DROP POLICY IF EXISTS "Client can view own record" ON clients;
DROP POLICY IF EXISTS "Admin full access clients" ON clients;

CREATE POLICY "clients_admin" ON clients FOR ALL USING (is_admin());
CREATE POLICY "clients_own" ON clients FOR SELECT USING (profile_id = auth.uid());

-- ═══════════════════════════════════════════════
-- PROJECTS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "projects_admin" ON projects;
DROP POLICY IF EXISTS "projects_client" ON projects;
DROP POLICY IF EXISTS "projects_team" ON projects;
DROP POLICY IF EXISTS "Admin can manage all projects" ON projects;
DROP POLICY IF EXISTS "Client can view own projects" ON projects;
DROP POLICY IF EXISTS "Team member can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Admin full access projects" ON projects;

CREATE POLICY "projects_admin" ON projects FOR ALL USING (is_admin());
CREATE POLICY "projects_client" ON projects FOR SELECT USING (
  client_id = get_my_client_id()
);
CREATE POLICY "projects_team" ON projects FOR SELECT USING (
  id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════
-- PROJECT MEMBERS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "project_members_admin" ON project_members;
DROP POLICY IF EXISTS "project_members_team" ON project_members;
DROP POLICY IF EXISTS "Admin can manage project members" ON project_members;
DROP POLICY IF EXISTS "Team member can view assigned project members" ON project_members;
DROP POLICY IF EXISTS "Admin full access project_members" ON project_members;

CREATE POLICY "project_members_admin" ON project_members FOR ALL USING (is_admin());
CREATE POLICY "project_members_team" ON project_members FOR SELECT USING (
  team_member_id IN (SELECT id FROM team_members WHERE profile_id = auth.uid())
);

-- ═══════════════════════════════════════════════
-- TASKS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "tasks_admin" ON tasks;
DROP POLICY IF EXISTS "tasks_client" ON tasks;
DROP POLICY IF EXISTS "tasks_team_select" ON tasks;
DROP POLICY IF EXISTS "tasks_team_update" ON tasks;
DROP POLICY IF EXISTS "Admin can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Client can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Team member can view assigned project tasks" ON tasks;
DROP POLICY IF EXISTS "Team member can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Team member can view own assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admin full access tasks" ON tasks;

CREATE POLICY "tasks_admin" ON tasks FOR ALL USING (is_admin());
CREATE POLICY "tasks_client" ON tasks FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = get_my_client_id())
);
CREATE POLICY "tasks_team_select" ON tasks FOR SELECT USING (
  assignee_id = auth.uid() OR
  project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);
CREATE POLICY "tasks_team_update" ON tasks FOR UPDATE
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- ═══════════════════════════════════════════════
-- MILESTONES
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "milestones_admin" ON milestones;
DROP POLICY IF EXISTS "milestones_client" ON milestones;
DROP POLICY IF EXISTS "milestones_team" ON milestones;
DROP POLICY IF EXISTS "Admin can manage all milestones" ON milestones;
DROP POLICY IF EXISTS "Client can view own milestones" ON milestones;
DROP POLICY IF EXISTS "Team member can view assigned milestones" ON milestones;
DROP POLICY IF EXISTS "Admin full access milestones" ON milestones;

CREATE POLICY "milestones_admin" ON milestones FOR ALL USING (is_admin());
CREATE POLICY "milestones_client" ON milestones FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = get_my_client_id())
);
CREATE POLICY "milestones_team" ON milestones FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════
-- PROJECT UPDATES
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "project_updates_admin" ON project_updates;
DROP POLICY IF EXISTS "project_updates_client" ON project_updates;
DROP POLICY IF EXISTS "project_updates_team_select" ON project_updates;
DROP POLICY IF EXISTS "project_updates_team_insert" ON project_updates;
DROP POLICY IF EXISTS "Admin can manage all project updates" ON project_updates;
DROP POLICY IF EXISTS "Client can view own project updates" ON project_updates;
DROP POLICY IF EXISTS "Team member can view assigned project updates" ON project_updates;
DROP POLICY IF EXISTS "Team member can create updates on assigned projects" ON project_updates;
DROP POLICY IF EXISTS "Admin full access project_updates" ON project_updates;

CREATE POLICY "project_updates_admin" ON project_updates FOR ALL USING (is_admin());
CREATE POLICY "project_updates_client" ON project_updates FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = get_my_client_id())
);
CREATE POLICY "project_updates_team_select" ON project_updates FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);
CREATE POLICY "project_updates_team_insert" ON project_updates FOR INSERT WITH CHECK (
  author_id = auth.uid() AND project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════
-- MESSAGES — Critical isolation
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "messages_admin" ON messages;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "Admin can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can mark own messages as read" ON messages;
DROP POLICY IF EXISTS "Admin full access messages" ON messages;
DROP POLICY IF EXISTS "Team member can view own messages" ON messages;
DROP POLICY IF EXISTS "Team member can send messages" ON messages;
DROP POLICY IF EXISTS "Team member can select own messages" ON messages;
DROP POLICY IF EXISTS "Team member can insert messages" ON messages;

CREATE POLICY "messages_admin" ON messages FOR ALL USING (is_admin());
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  receiver_id = auth.uid()
);

-- ═══════════════════════════════════════════════
-- AGREEMENTS — Client isolation
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "agreements_admin" ON agreements;
DROP POLICY IF EXISTS "agreements_client_select" ON agreements;
DROP POLICY IF EXISTS "agreements_client_update" ON agreements;
DROP POLICY IF EXISTS "Admin can manage all agreements" ON agreements;
DROP POLICY IF EXISTS "Client can view own agreements" ON agreements;
DROP POLICY IF EXISTS "Admin full access agreements" ON agreements;

CREATE POLICY "agreements_admin" ON agreements FOR ALL USING (is_admin());
CREATE POLICY "agreements_client_select" ON agreements FOR SELECT USING (
  client_id = get_my_client_id()
);
CREATE POLICY "agreements_client_update" ON agreements FOR UPDATE USING (
  client_id = get_my_client_id()
) WITH CHECK (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- INVOICES — Client isolation, Team DENIED
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "invoices_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_client" ON invoices;
DROP POLICY IF EXISTS "Admin can manage all invoices" ON invoices;
DROP POLICY IF EXISTS "Client can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admin full access invoices" ON invoices;

CREATE POLICY "invoices_admin" ON invoices FOR ALL USING (is_admin());
CREATE POLICY "invoices_client" ON invoices FOR SELECT USING (
  client_id = get_my_client_id()
);

-- ═══════════════════════════════════════════════
-- INVOICE ITEMS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "invoice_items_admin" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_client" ON invoice_items;
DROP POLICY IF EXISTS "Admin can manage all invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Client can view own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Admin full access invoice_items" ON invoice_items;

CREATE POLICY "invoice_items_admin" ON invoice_items FOR ALL USING (is_admin());
CREATE POLICY "invoice_items_client" ON invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE client_id = get_my_client_id())
);

-- ═══════════════════════════════════════════════
-- PAYMENTS — Client isolation, Team DENIED
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "payments_admin" ON payments;
DROP POLICY IF EXISTS "payments_client" ON payments;
DROP POLICY IF EXISTS "Admin can manage all payments" ON payments;
DROP POLICY IF EXISTS "Client can view own payments" ON payments;
DROP POLICY IF EXISTS "Admin full access payments" ON payments;

CREATE POLICY "payments_admin" ON payments FOR ALL USING (is_admin());
CREATE POLICY "payments_client" ON payments FOR SELECT USING (
  client_id = get_my_client_id()
);

-- ═══════════════════════════════════════════════
-- QUOTATIONS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "quotations_admin" ON quotations;
DROP POLICY IF EXISTS "quotations_client" ON quotations;
DROP POLICY IF EXISTS "Admin can manage all quotations" ON quotations;
DROP POLICY IF EXISTS "Client can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Admin full access quotations" ON quotations;

CREATE POLICY "quotations_admin" ON quotations FOR ALL USING (is_admin());
CREATE POLICY "quotations_client" ON quotations FOR SELECT USING (
  client_id = get_my_client_id()
);

-- ═══════════════════════════════════════════════
-- QUOTATION ITEMS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "quotation_items_admin" ON quotation_items;
DROP POLICY IF EXISTS "quotation_items_client" ON quotation_items;
DROP POLICY IF EXISTS "Admin can manage all quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Client can view own quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Admin full access quotation_items" ON quotation_items;

CREATE POLICY "quotation_items_admin" ON quotation_items FOR ALL USING (is_admin());
CREATE POLICY "quotation_items_client" ON quotation_items FOR SELECT USING (
  quotation_id IN (SELECT id FROM quotations WHERE client_id = get_my_client_id())
);

-- ═══════════════════════════════════════════════
-- PROJECT FILES
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "project_files_admin" ON project_files;
DROP POLICY IF EXISTS "project_files_client_select" ON project_files;
DROP POLICY IF EXISTS "project_files_client_insert" ON project_files;
DROP POLICY IF EXISTS "project_files_team_select" ON project_files;
DROP POLICY IF EXISTS "project_files_team_insert" ON project_files;
DROP POLICY IF EXISTS "Admin can manage all project files" ON project_files;
DROP POLICY IF EXISTS "Client can view own project files" ON project_files;
DROP POLICY IF EXISTS "Client can upload files to own projects" ON project_files;
DROP POLICY IF EXISTS "Team member can view assigned project files" ON project_files;
DROP POLICY IF EXISTS "Team member can upload files to assigned projects" ON project_files;
DROP POLICY IF EXISTS "Admin full access project_files" ON project_files;

CREATE POLICY "project_files_admin" ON project_files FOR ALL USING (is_admin());
CREATE POLICY "project_files_client" ON project_files FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE client_id = get_my_client_id())
);
CREATE POLICY "project_files_team_select" ON project_files FOR SELECT USING (
  project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);
CREATE POLICY "project_files_team_insert" ON project_files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND project_id IN (
    SELECT pm.project_id FROM project_members pm
    INNER JOIN team_members tm ON tm.id = pm.team_member_id
    WHERE tm.profile_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════
-- SUPPORT TICKETS — Client only
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "support_tickets_admin" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_client_select" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_client_insert" ON support_tickets;
DROP POLICY IF EXISTS "Admin can manage all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Client can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Client can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admin full access support_tickets" ON support_tickets;

CREATE POLICY "support_tickets_admin" ON support_tickets FOR ALL USING (is_admin());
CREATE POLICY "support_tickets_client_select" ON support_tickets FOR SELECT USING (
  client_id = get_my_client_id()
);
CREATE POLICY "support_tickets_client_insert" ON support_tickets FOR INSERT WITH CHECK (
  client_id = get_my_client_id()
);

-- ═══════════════════════════════════════════════
-- NOTIFICATIONS — Per-user isolation
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "notifications_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admin full access notifications" ON notifications;
DROP POLICY IF EXISTS "Team member can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Team member can update own notifications" ON notifications;

CREATE POLICY "notifications_admin" ON notifications FOR ALL USING (is_admin());
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════
-- ACTIVITY LOGS — Per-user isolation
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "activity_logs_admin" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;
DROP POLICY IF EXISTS "Admin can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Client can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin full access activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Team member can log activity" ON activity_logs;
DROP POLICY IF EXISTS "Team member can view own activity" ON activity_logs;

CREATE POLICY "activity_logs_admin" ON activity_logs FOR ALL USING (is_admin());
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════
-- TEAM MEMBERS
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "team_members_admin" ON team_members;
DROP POLICY IF EXISTS "team_members_own" ON team_members;
DROP POLICY IF EXISTS "Admin can manage team members" ON team_members;
DROP POLICY IF EXISTS "Team member can view own record" ON team_members;
DROP POLICY IF EXISTS "Admin full access team_members" ON team_members;

CREATE POLICY "team_members_admin" ON team_members FOR ALL USING (is_admin());
CREATE POLICY "team_members_own" ON team_members FOR SELECT USING (profile_id = auth.uid());

-- ═══════════════════════════════════════════════
-- VERIFY RLS IS ENABLED ON ALL TABLES
-- ═══════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
