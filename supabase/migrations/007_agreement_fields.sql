-- ============================================================
-- Additional agreement fields
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS agreement_number TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_responsibilities TEXT;
