-- Create discord_auth_states table
CREATE TABLE IF NOT EXISTS discord_auth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(state)
);

-- Add RLS policies
ALTER TABLE discord_auth_states ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert states
CREATE POLICY "Service role can insert states"
    ON discord_auth_states FOR INSERT
    WITH CHECK (true);

-- Allow service role to select states
CREATE POLICY "Service role can select states"
    ON discord_auth_states FOR SELECT
    USING (true);

-- Allow service role to delete states
CREATE POLICY "Service role can delete states"
    ON discord_auth_states FOR DELETE
    USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discord_auth_states_state ON discord_auth_states(state);
