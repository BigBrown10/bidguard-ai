-- ⚡ Performance Indexes
-- Run this in your Supabase SQL Editor to speed up query performance

-- 1. Speed up filtering tenders by sector (used in Tenders Page filtering)
CREATE INDEX IF NOT EXISTS idx_tenders_sector ON tenders USING btree (sector);

-- 2. Speed up filtering tenders by value (used in price filter)
-- Note: 'value' column is text/varchar in some schemas, if so, this helps exact matches or you might need a functional index
CREATE INDEX IF NOT EXISTS idx_tenders_value ON tenders USING btree (value);

-- 3. Speed up fetching saved tenders for a user (used in personalization/exclusion)
CREATE INDEX IF NOT EXISTS idx_saved_tenders_user_id ON saved_tenders USING btree (user_id);

-- 4. Speed up profile lookup (middleware & headers)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles USING btree (id);

-- 5. Speed up checking if a tender is already in a proposal
CREATE INDEX IF NOT EXISTS idx_proposals_tender_id ON proposals USING btree (tender_id);

-- 6. Speed up admin dashboard stats (filtering by status)
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals USING btree (status);
