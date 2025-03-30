-- Allow service role to bypass RLS
ALTER TABLE github_scans FORCE ROW LEVEL SECURITY;

-- Update the existing policies to handle both authenticated users and service role
DROP POLICY IF EXISTS "Users can view their own scans" ON github_scans;
DROP POLICY IF EXISTS "Users can create their own scans" ON github_scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON github_scans;

CREATE POLICY "Users can view their own scans"
  ON github_scans FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.jwt()->>'role' = 'service_role'
  );

CREATE POLICY "Users can create their own scans"
  ON github_scans FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.jwt()->>'role' = 'service_role'
  );

CREATE POLICY "Users can update their own scans"
  ON github_scans FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.jwt()->>'role' = 'service_role'
  );
