import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

const isDevelopment = process.env.NODE_ENV === "development"

export async function GET() {
  try {
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub token is not configured",
          message: "Please add a valid GITHUB_TOKEN to your environment variables",
        },
        { status: 500 },
      )
    }

    // Create Octokit instance
    const octokit = new Octokit({
      auth: githubToken,
    })

    // Test the token with a simple API call
    try {
      const { data } = await octokit.rest.users.getAuthenticated()

      return NextResponse.json({
        success: true,
        message: "GitHub token is valid",
        user: {
          login: data.login,
          name: data.name,
          type: data.type,
        },
        scopes: "Unable to determine scopes from this endpoint",
        tokenLength: githubToken.length,
      })
    } catch (authError: any) {
      // Only include detailed error info in development
      return NextResponse.json(
        {
          success: false,
          error: isDevelopment ? authError.message : "Authentication failed",
          message: "Invalid GitHub token",
          status: authError.status,
          tokenLength: githubToken.length,
        },
        { status: 401 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment ? error.message : "Internal server error",
        message: "Error testing GitHub token",
      },
      { status: 500 },
    )
  }
}

