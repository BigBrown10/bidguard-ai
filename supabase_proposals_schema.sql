-- Run this in your Supabase SQL Editor to enable Autonomous Proposals

-- 1. Create the proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tender_id TEXT NOT NULL,
    tender_title TEXT NOT NULL,
    tender_buyer TEXT,
    idea_injection TEXT,
    status TEXT DEFAULT 'queued',
    research_output JSONB,
    strategy_output JSONB,
    draft_content TEXT,
    critique JSONB,
    final_content TEXT,
    score INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can only see their own proposals
CREATE POLICY "Users can view own proposals" ON proposals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals" ON proposals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Service role can update (for Inngest backend)
CREATE POLICY "Service role can update proposals" ON proposals
    FOR UPDATE USING (true);

-- 5. Index for performance
CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
