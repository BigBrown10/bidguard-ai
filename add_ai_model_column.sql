-- Add ai_model column to profiles table with default value
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-flash';

-- Update existing rows to have default model
UPDATE profiles 
SET ai_model = 'gemini-flash' 
WHERE ai_model IS NULL;
