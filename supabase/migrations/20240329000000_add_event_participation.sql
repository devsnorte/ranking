-- Create event_participation table
CREATE TABLE IF NOT EXISTS event_participation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_awarded BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

-- Add RLS policies
ALTER TABLE event_participation ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own participations
CREATE POLICY "Users can view their own participations"
    ON event_participation FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role to insert participations
CREATE POLICY "Service role can insert participations"
    ON event_participation FOR INSERT
    WITH CHECK (true);

-- Allow service role to update participations
CREATE POLICY "Service role can update participations"
    ON event_participation FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Add points_awarded column to user_events table
ALTER TABLE public.user_events
ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN DEFAULT FALSE;

-- Create function to award points for event participation
CREATE OR REPLACE FUNCTION award_event_participation_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points if they haven't been awarded yet
    IF NOT NEW.points_awarded THEN
        -- Insert into activities table
        INSERT INTO activities (
            user_id,
            type,
            title,
            description,
            points,
            timestamp
        ) VALUES (
            NEW.user_id,
            'event_participation',
            'Event Participation',
            'Participated in a scheduled event',
            5,
            NEW.checked_in_at
        );

        -- Mark points as awarded
        NEW.points_awarded := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically award points
DROP TRIGGER IF EXISTS award_event_participation_points_trigger ON user_events;
CREATE TRIGGER award_event_participation_points_trigger
    BEFORE INSERT OR UPDATE ON user_events
    FOR EACH ROW
    EXECUTE FUNCTION award_event_participation_points();
