-- ============================================================
-- Additional fields for business/document system
-- Run AFTER 003_storage.sql in Supabase SQL Editor
-- ============================================================

-- Add discount to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add discount and paid_amount to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Add agreement detail fields
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES profiles(id);
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS deliverables TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS revision_policy TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS support_terms TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS cancellation_terms TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS additional_terms TEXT;
