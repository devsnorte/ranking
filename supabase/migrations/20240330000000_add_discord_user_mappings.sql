-- Create discord_user_mappings table
CREATE TABLE IF NOT EXISTS discord_user_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_user_id VARCHAR(255) NOT NULL,
    platform_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discord_user_id),
    UNIQUE(platform_user_id)
);

-- Add RLS policies
ALTER TABLE discord_user_mappings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own mappings
CREATE POLICY "Users can view their own mappings"
    ON discord_user_mappings FOR SELECT
    USING (auth.uid() = platform_user_id);

-- Allow service role to insert mappings
CREATE POLICY "Service role can insert mappings"
    ON discord_user_mappings FOR INSERT
    WITH CHECK (true);

-- Allow service role to update mappings
CREATE POLICY "Service role can update mappings"
    ON discord_user_mappings FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create function to record Discord activity
CREATE OR REPLACE FUNCTION record_discord_activity(
    p_discord_user_id VARCHAR,
    p_activity_type VARCHAR,
    p_channel VARCHAR,
    p_points INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    v_platform_user_id UUID;
BEGIN
    -- Get the platform user ID from the mapping
    SELECT platform_user_id INTO v_platform_user_id
    FROM discord_user_mappings
    WHERE discord_user_id = p_discord_user_id;

    IF v_platform_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Insert into discord_activities table
    INSERT INTO discord_activities (
        user_id,
        activity_type,
        channel,
        points
    ) VALUES (
        v_platform_user_id,
        p_activity_type,
        p_channel,
        p_points
    );

    -- Insert into activities table for the activity feed
    INSERT INTO activities (
        user_id,
        type,
        title,
        description,
        points,
        timestamp
    ) VALUES (
        v_platform_user_id,
        'discord',
        'Discord Activity',
        'Participated in a Discord event',
        p_points,
        NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
