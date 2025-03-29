import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { siteUrl } = await request.json()

    if (!siteUrl) {
      return NextResponse.json({ error: "Site URL is required" }, { status: 400 })
    }

    // Create a Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase admin credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update the site URL in Supabase Auth settings
    const { error } = await supabase.auth.admin.updateConfig({
      site_url: siteUrl,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Site URL updated successfully",
      siteUrl,
    })
  } catch (error: any) {
    console.error("Error updating site URL:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to update site URL",
      },
      { status: 500 },
    )
  }
}

