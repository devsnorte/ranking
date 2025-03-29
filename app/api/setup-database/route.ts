import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { setupDatabase } from "@/lib/database-setup"

export async function POST() {
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

    // Since we can't use execute_sql, we'll return a message directing to manual setup
    return NextResponse.json({
      success: false,
      message: "Automatic setup is not available. Please use the manual SQL script setup.",
      needsManualSetup: true,
    })
  } catch (error: any) {
    console.error("Setup database error:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const result = await setupDatabase()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to setup database",
      },
      { status: 500 }
    )
  }
}

