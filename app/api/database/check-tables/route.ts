import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// List of required tables
const REQUIRED_TABLES = ["users", "events", "user_events", "github_contributions", "discord_activities", "activities"]

export async function GET() {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase environment variables",
          variables: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try to check if tables exist by querying them directly
    const existingTables = []

    for (const table of REQUIRED_TABLES) {
      try {
        // Try to select from the table with a limit of 0 to just check if it exists
        const { error } = await supabase.from(table).select("*", { count: "exact", head: true })

        // If no error, the table exists
        if (!error) {
          existingTables.push(table)
        }
      } catch (e) {
        // Table doesn't exist or other error
      }
    }

    const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.includes(table))

    return NextResponse.json({
      success: true,
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0,
    })
  } catch (error: any) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        error: `Failed to check tables: ${error.message}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

