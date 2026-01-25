-- Run this in your Supabase SQL Editor to update the profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS iso_certs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS achievements text,
ADD COLUMN IF NOT EXISTS companies_house_number text,
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Optional: Add comments or verify
COMMENT ON COLUMN profiles.iso_certs IS 'Array of ISO certification IDs';
COMMENT ON COLUMN profiles.achievements IS 'Key company achievements and stats';
COMMENT ON COLUMN profiles.companies_house_number IS 'Official registration number';
COMMENT ON COLUMN profiles.onboarding_complete IS 'Flag to track if user has completed initial setup';
