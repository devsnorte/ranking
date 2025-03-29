import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase environment variables",
          variables: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
          },
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test a simple insert and delete to verify write permissions
    const testId = `test-${Date.now()}`

    // Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from("github_contributions")
      .insert({
        id: testId,
        user_id: "00000000-0000-0000-0000-000000000000",
        title: "Test Contribution",
        url: "https://example.com/test",
        repo_name: "test/repo",
        type: "test",
        points: 0,
        created_at: new Date().toISOString(),
      })
      .select()

    // If insert succeeded, delete the test record
    if (!insertError) {
      await supabase.from("github_contributions").delete().eq("id", testId)
    }

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase.from("github_contributions").select("*").limit(1)

    return NextResponse.json({
      success: !insertError,
      insertResult: insertError
        ? {
            error: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          }
        : "Success",
      tableStructure: tableError
        ? {
            error: tableError.message,
          }
        : {
            columns: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
          },
      supabaseConfig: {
        url: supabaseUrl.substring(0, 20) + "...",
        keyLength: supabaseKey.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

