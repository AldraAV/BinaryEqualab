-- Binary EquaLab - Worksheets Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS worksheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own worksheets
CREATE POLICY "Users can view own worksheets" ON worksheets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own worksheets" ON worksheets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own worksheets" ON worksheets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own worksheets" ON worksheets
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_worksheets_user_id ON worksheets(user_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_updated_at ON worksheets(updated_at DESC);
