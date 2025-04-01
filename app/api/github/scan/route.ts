import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { githubScanQueue } from "@/lib/queue/github-scan"
import type { GithubScanJobData } from "@/lib/queue/github-scan"
import type { JobsOptions } from "bullmq"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const userId = searchParams.get("userId")

    if (!username || !userId) {
      return NextResponse.json({ error: "Username and userId are required" }, { status: 400 })
    }

    // Use service role client for creating scan records
    const supabase = createServerClient(true)

    // Create a new scan record
    const { data: scan, error: scanError } = await supabase
      .from("github_scans")
      .insert({
        user_id: userId,
        username,
        status: "pending",
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (scanError) {
      console.error("Error creating scan record:", scanError)
      return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 })
    }

    // Add the job to the queue
    const jobData: GithubScanJobData = {
      username,
      userId,
      scanId: scan.id,
    }

    const jobOptions: JobsOptions = {
      jobId: scan.id,
    }

    await githubScanQueue.add("scan", jobData, jobOptions)

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      message: "Scan started in background",
    })
  } catch (error: any) {
    console.error("GitHub scan error:", error)
    return NextResponse.json(
      {
        error: "Failed to start GitHub scan",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

