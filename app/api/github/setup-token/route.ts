import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

const isDevelopment = process.env.NODE_ENV === "development"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Test the token with a simple API call
    const octokit = new Octokit({
      auth: token,
    })

    try {
      const { data } = await octokit.rest.users.getAuthenticated()

      // Here you would normally save the token to a secure storage
      // For this example, we'll just return success
      // In a real app, you might use a service like Vercel's Environment Variables

      return NextResponse.json({
        success: true,
        message: `GitHub token is valid. Authenticated as ${data.login}.`,
        user: {
          login: data.login,
          name: data.name,
        },
      })
    } catch (authError: any) {
      return NextResponse.json(
        {
          error: "Invalid GitHub token",
          details: isDevelopment ? authError.message : "Authentication failed",
        },
        { status: 401 },
      )
    }
  } catch (error: any) {
    if (isDevelopment) {
      console.error("Error setting up GitHub token:", error)
    }

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : "Failed to set up GitHub token",
      },
      { status: 500 },
    )
  }
}

