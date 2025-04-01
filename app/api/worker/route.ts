import { NextResponse } from "next/server"
import { githubScanQueue } from "@/lib/queue/github-scan-queue"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, userId, scanId } = body

    if (!username || !userId || !scanId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    // Add job to queue
    await githubScanQueue.add("github-scan", {
      username,
      userId,
      scanId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in worker route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
