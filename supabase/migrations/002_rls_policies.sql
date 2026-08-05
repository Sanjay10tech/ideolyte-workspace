-- ============================================================
-- Row Level Security (RLS) Policies
-- Run AFTER 001_schema.sql in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: check if current user is admin ───
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Helper function: get client_id for current user ───
CREATE OR REPLACE FUNCTION get_my_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM clients WHERE profile_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin() OR auth.uid() = id);

-- ═══════════════════════════════════════════════
-- CLIENTS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all clients"
  ON clients FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own record"
  ON clients FOR SELECT
  USING (profile_id = auth.uid());

-- ═══════════════════════════════════════════════
-- PROJECTS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all projects"
  ON projects FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own projects"
  ON projects FOR SELECT
  USING (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- MILESTONES
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all milestones"
  ON milestones FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own milestones"
  ON milestones FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- TASKS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all tasks"
  ON tasks FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own tasks"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- PROJECT UPDATES
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all project updates"
  ON project_updates FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own project updates"
  ON project_updates FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- QUOTATIONS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all quotations"
  ON quotations FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own quotations"
  ON quotations FOR SELECT
  USING (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- QUOTATION ITEMS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all quotation items"
  ON quotation_items FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own quotation items"
  ON quotation_items FOR SELECT
  USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- AGREEMENTS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all agreements"
  ON agreements FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own agreements"
  ON agreements FOR SELECT
  USING (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- INVOICES
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all invoices"
  ON invoices FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own invoices"
  ON invoices FOR SELECT
  USING (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- INVOICE ITEMS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all invoice items"
  ON invoice_items FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own invoice items"
  ON invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all payments"
  ON payments FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own payments"
  ON payments FOR SELECT
  USING (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- PROJECT FILES
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all project files"
  ON project_files FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own project files"
  ON project_files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = get_my_client_id()
    )
  );

CREATE POLICY "Client can upload files to own projects"
  ON project_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    project_id IN (
      SELECT id FROM projects WHERE client_id = get_my_client_id()
    )
  );

-- ═══════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all messages"
  ON messages FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark own messages as read"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- ═══════════════════════════════════════════════
-- SUPPORT TICKETS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can manage all tickets"
  ON support_tickets FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own tickets"
  ON support_tickets FOR SELECT
  USING (client_id = get_my_client_id());

CREATE POLICY "Client can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (client_id = get_my_client_id());

-- ═══════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admin can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (is_admin());

-- ═══════════════════════════════════════════════
-- ACTIVITY LOGS
-- ═══════════════════════════════════════════════
CREATE POLICY "Admin can view all activity logs"
  ON activity_logs FOR ALL
  USING (is_admin());

CREATE POLICY "Client can view own activity logs"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
