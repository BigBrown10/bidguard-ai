-- ==========================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- Checklist Item: 5. Index Your "Where" Filters
-- ==========================================

-- TENDERS TABLE
-- Used heavily in the main feed filtering
CREATE INDEX IF NOT EXISTS idx_tenders_sector ON tenders(sector);
CREATE INDEX IF NOT EXISTS idx_tenders_value ON tenders(value);
-- Composite index for the specific feed query: "active tenders by sector sorted by time"
CREATE INDEX IF NOT EXISTS idx_tenders_feed ON tenders(sector, fetched_at DESC);

-- PROFILES TABLE
-- Used in Auth checks and middleware (Usually queried by ID, which is PK and indexed)
-- Note: Email is stored in auth.users, not profiles public table.

-- PROPOSALS TABLE
-- Used in "My Proposals" dashboard list
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tender_id ON proposals(tender_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- ANALYTICS / LOGS (If applicable, generally good practice)
-- CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
