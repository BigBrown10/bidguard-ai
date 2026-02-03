-- Knowledge Base Table for Agent Training
-- Run this in Supabase SQL Editor AFTER creating blog_posts table

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'tip', -- 'tip', 'news', 'strategy', 'compliance'
    content TEXT NOT NULL,
    source TEXT,
    tags TEXT[],
    embedding vector(768), -- For semantic search (optional, requires pgvector)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_base(type);

-- Index for tag search
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags);

-- Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to knowledge_base"
    ON knowledge_base FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can read
CREATE POLICY "Authenticated can read knowledge_base"
    ON knowledge_base FOR SELECT
    TO authenticated
    USING (true);

GRANT SELECT ON knowledge_base TO authenticated;

COMMENT ON TABLE knowledge_base IS 'Knowledge base for training AI agents with bid writing tips and news';

-- Optional: If you have pgvector extension installed, you can add vector search
-- CREATE EXTENSION IF NOT EXISTS vector;
-- This enables semantic search for finding relevant knowledge when writing proposals
