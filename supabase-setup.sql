-- Supabase Database Setup for Elementor Background Generator
-- Run this SQL in your Supabase SQL Editor

-- Create the presets table
CREATE TABLE IF NOT EXISTS presets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  css_body TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (optional - only if recreating)
-- DROP POLICY IF EXISTS "Allow public read and insert" ON presets;

-- Create a policy that allows public read and insert
-- For production, you may want to restrict this to authenticated users only
CREATE POLICY "Allow public read and insert" ON presets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_presets_created_at ON presets(created_at DESC);

-- Verify the table was created
SELECT * FROM presets LIMIT 1;

