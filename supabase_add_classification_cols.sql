-- Add AI classification columns to the tenders table
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classification jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classification_status text DEFAULT 'pending'; -- pending, completed, failed

-- Create index for faster filtering by tags
CREATE INDEX IF NOT EXISTS idx_tenders_ai_tags ON tenders USING GIN (ai_tags);
