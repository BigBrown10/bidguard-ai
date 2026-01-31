-- Add credits columns to profiles table
-- Run this in Supabase SQL Editor

-- Add credits column (default 3 for new users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;

-- Add credits_used tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

-- Update existing users to have 3 credits if they don't have any
UPDATE profiles SET credits = 3 WHERE credits IS NULL;
UPDATE profiles SET credits_used = 0 WHERE credits_used IS NULL;

-- Create index for credit lookups
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON profiles(credits);
