-- ===============================================
-- V3 SCHEMA UPDATE: Proposals Table
-- Run this in Supabase SQL Editor
-- ===============================================

-- Add onboarding_complete to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sectors text[];

-- Create proposals table for autonomous generation tracking
CREATE TABLE IF NOT EXISTS proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  tender_id text,
  tender_title text,
  tender_buyer text,
  status text CHECK (status IN ('queued','researching','strategizing','drafting','critiquing','humanizing','complete','failed')) DEFAULT 'queued',
  idea_injection text, -- User's optional angles/USPs
  research_output jsonb,
  strategy_output jsonb,
  draft_content text,
  critique jsonb,
  final_content text,
  score numeric,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proposals"
  ON proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proposals"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
  ON proposals FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster status queries
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);
CREATE INDEX IF NOT EXISTS proposals_user_id_idx ON proposals(user_id);

-- Past bids library (for RAG)
CREATE TABLE IF NOT EXISTS past_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text,
  content text,
  sector text,
  outcome text CHECK (outcome IN ('won','lost','unknown')),
  file_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE past_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own past bids"
  ON past_bids FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
