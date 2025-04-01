import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get("scanId")

    if (!scanId) {
      return NextResponse.json({ error: "Scan ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get the scan status
    const { data: scan, error: scanError } = await supabase
      .from("github_scans")
      .select("*")
      .eq("id", scanId)
      .single()

    if (scanError) {
      console.error("Error fetching scan status:", scanError)
      return NextResponse.json({ error: "Failed to fetch scan status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scan,
    })
  } catch (error: any) {
    console.error("Error checking scan status:", error)
    return NextResponse.json(
      {
        error: "Failed to check scan status",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
