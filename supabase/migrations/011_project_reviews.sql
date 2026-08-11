-- ============================================================
-- Project Reviews & Approval System
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'awaiting_client' CHECK (status IN ('awaiting_client', 'changes_requested', 'approved', 'resubmitted')),
  message TEXT,
  deadline DATE,
  checklist JSONB DEFAULT '[]',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  approval_comment TEXT,
  change_comment TEXT,
  change_priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_reviews_project ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_client ON project_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_status ON project_reviews(status);

CREATE TABLE IF NOT EXISTS review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES project_reviews(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_history_review ON review_history(review_id);

-- RLS
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_admin" ON project_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "reviews_client_select" ON project_reviews FOR SELECT USING (
  client_id = (SELECT id FROM clients WHERE profile_id = auth.uid())
);
CREATE POLICY "reviews_client_update" ON project_reviews FOR UPDATE USING (
  client_id = (SELECT id FROM clients WHERE profile_id = auth.uid())
) WITH CHECK (
  client_id = (SELECT id FROM clients WHERE profile_id = auth.uid())
);

CREATE POLICY "review_history_admin" ON review_history FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "review_history_client" ON review_history FOR SELECT USING (
  review_id IN (SELECT id FROM project_reviews WHERE client_id = (SELECT id FROM clients WHERE profile_id = auth.uid()))
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON project_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
