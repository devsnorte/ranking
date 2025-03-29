import { createClient } from "@supabase/supabase-js"

export async function setupDatabase() {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create users table if it doesn't exist
    const { error: usersError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (usersError) {
      console.error("Error creating users table:", usersError)
      throw usersError
    }

    // Create events table if it doesn't exist
    const { error: eventsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          time VARCHAR(50),
          location VARCHAR(255),
          points INTEGER NOT NULL DEFAULT 5
        );
      `,
    })

    if (eventsError) {
      console.error("Error creating events table:", eventsError)
      throw eventsError
    }

    // Create user_events table if it doesn't exist
    const { error: userEventsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.user_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
          checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, event_id)
        );
      `,
    })

    if (userEventsError) {
      console.error("Error creating user_events table:", userEventsError)
      throw userEventsError
    }

    // Create github_contributions table if it doesn't exist
    const { error: githubError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.github_contributions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          repo_name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          points INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (githubError) {
      console.error("Error creating github_contributions table:", githubError)
      throw githubError
    }

    // Create discord_activities table if it doesn't exist
    const { error: discordError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.discord_activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          channel VARCHAR(255),
          points INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (discordError) {
      console.error("Error creating discord_activities table:", discordError)
      throw discordError
    }

    // Create activities table if it doesn't exist
    const { error: activitiesError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          points INTEGER NOT NULL DEFAULT 0,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (activitiesError) {
      console.error("Error creating activities table:", activitiesError)
      throw activitiesError
    }

    // Insert sample events if they don't exist
    const { data: existingEvents } = await supabase.from("events").select("id").limit(1)

    if (!existingEvents || existingEvents.length === 0) {
      const { error: insertError } = await supabase.from("events").insert([
        {
          name: "Community Meetup",
          description: "Monthly community meetup to discuss projects and ideas",
          date: "2023-12-15",
          time: "18:00",
          location: "Tech Hub",
          points: 10,
        },
        {
          name: "Hackathon",
          description: "Weekend hackathon to build innovative projects",
          date: "2023-12-20",
          time: "09:00",
          location: "Innovation Center",
          points: 20,
        },
        {
          name: "Workshop: Intro to React",
          description: "Learn the basics of React.js",
          date: "2023-12-10",
          time: "14:00",
          location: "Online",
          points: 5,
        },
      ])

      if (insertError) {
        console.error("Error inserting sample events:", insertError)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Database setup error:", error)
    return { success: false, error }
  }
}

