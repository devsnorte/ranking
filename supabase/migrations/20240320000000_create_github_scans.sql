-- Create github_scans table
CREATE TABLE IF NOT EXISTS github_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  contributions_count INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS github_scans_user_id_idx ON github_scans(user_id);
CREATE INDEX IF NOT EXISTS github_scans_status_idx ON github_scans(status);

-- Add RLS policies
ALTER TABLE github_scans ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own scans
CREATE POLICY "Users can view their own scans"
  ON github_scans FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own scans
CREATE POLICY "Users can create their own scans"
  ON github_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own scans
CREATE POLICY "Users can update their own scans"
  ON github_scans FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_github_scans_updated_at
  BEFORE UPDATE ON github_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
