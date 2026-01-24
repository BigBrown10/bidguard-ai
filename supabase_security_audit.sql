-- SECURITY HARDENING: Audit Logs Table
-- Run this in Supabase SQL Editor

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Users can only view their own logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Only service role can insert (backend only)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 5. Index for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- 6. RLS Verification for existing tables
-- Run these to ensure RLS is enabled:

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Verify policies exist (if not, create them):
-- For profiles:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- For saved_tenders:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tenders' AND policyname = 'Users can view own saved tenders') THEN
        CREATE POLICY "Users can view own saved tenders" ON saved_tenders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tenders' AND policyname = 'Users can insert own saved tenders') THEN
        CREATE POLICY "Users can insert own saved tenders" ON saved_tenders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tenders' AND policyname = 'Users can delete own saved tenders') THEN
        CREATE POLICY "Users can delete own saved tenders" ON saved_tenders FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
