import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

const ORG_NAME = "devsnorte"
const isDevelopment = process.env.NODE_ENV === "development"
// Increase the timeout for the API route
export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10) // Limit number of repos to scan

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Create Octokit instance with GitHub token
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json(
        {
          error: "GitHub token is not configured. Please add a valid GITHUB_TOKEN to your environment variables.",
        },
        { status: 500 },
      )
    }

    // Only log in development
    if (isDevelopment) {
      console.log(`GitHub token length: ${githubToken.length}`)
    }

    const octokit = new Octokit({
      auth: githubToken,
      request: {
        timeout: 10000, // 10 second timeout for each request
      },
    })

    // Test the token with a simple API call
    try {
      await octokit.rest.users.getAuthenticated()
    } catch (authError: any) {
      // Only log detailed error in development
      if (isDevelopment) {
        console.error("GitHub authentication error:", authError)
      } else {
        console.error("GitHub authentication error occurred")
      }

      return NextResponse.json(
        {
          error: "Invalid GitHub token. Please check your GITHUB_TOKEN environment variable.",
          details: isDevelopment ? authError.message : "Authentication failed",
        },
        { status: 401 },
      )
    }

    // Get repositories in the organization
    const { data: repos } = await octokit.repos.listForOrg({
      org: ORG_NAME,
      per_page: 100,
      sort: "updated",
      direction: "desc", // Get most recently updated repos first
    })

    // Limit the number of repos to scan to avoid timeouts
    const reposToScan = repos.slice(0, limit).filter((repo) => !repo.archived)

    if (isDevelopment) {
      console.log(`Scanning ${reposToScan.length} repositories out of ${repos.length} total`)
    }

    const contributions: any[] = []

    // Process repositories in parallel with Promise.all
    await Promise.all(
      reposToScan.map(async (repo) => {
        const repoName = repo.name
        const fullRepoName = `${ORG_NAME}/${repoName}`

        // Use Promise.allSettled to continue even if some requests fail
        await Promise.allSettled([
          // 1. Check for merged PRs by the user
          (async () => {
            try {
              const { data: prs } = await octokit.pulls.list({
                owner: ORG_NAME,
                repo: repoName,
                state: "closed",
                per_page: 30, // Limit to 30 most recent PRs
              })

              for (const pr of prs) {
                if (pr.user?.login?.toLowerCase() === username.toLowerCase() && pr.merged_at) {
                  contributions.push({
                    type: "pr_merged",
                    title: pr.title,
                    url: pr.html_url,
                    repo: fullRepoName,
                    created_at: pr.created_at,
                  })
                }
              }
            } catch (error) {
              if (isDevelopment) {
                console.error(`Error fetching PRs for ${fullRepoName}:`, error)
              }
            }
          })(),

          // 2. Check for issues opened by the user
          (async () => {
            try {
              const { data: issues } = await octokit.issues.listForRepo({
                owner: ORG_NAME,
                repo: repoName,
                creator: username,
                state: "all",
                per_page: 30, // Limit to 30 most recent issues
              })

              for (const issue of issues) {
                // Skip pull requests (they're also returned by the issues API)
                if (issue.pull_request) continue

                contributions.push({
                  type: "issue_opened",
                  title: issue.title,
                  url: issue.html_url,
                  repo: fullRepoName,
                  created_at: issue.created_at,
                })
              }
            } catch (error) {
              if (isDevelopment) {
                console.error(`Error fetching issues for ${fullRepoName}:`, error)
              }
            }
          })(),

          // 3. Check for comments on issues by the user (limited to most recent)
          (async () => {
            try {
              const { data: issueComments } = await octokit.issues.listCommentsForRepo({
                owner: ORG_NAME,
                repo: repoName,
                per_page: 50, // Limit to 50 most recent comments
                sort: "created",
                direction: "desc",
              })

              // Filter comments by the user first to reduce API calls
              const userComments = issueComments.filter(
                (comment) => comment.user?.login?.toLowerCase() === username.toLowerCase(),
              )

              // Process only up to 10 comments to avoid too many API calls
              const commentsToProcess = userComments.slice(0, 10)

              for (const comment of commentsToProcess) {
                try {
                  // Extract issue number from URL to avoid parsing the entire URL
                  const urlParts = comment.issue_url.split("/")
                  const issueNumber = Number.parseInt(urlParts[urlParts.length - 1], 10)

                  const { data: issue } = await octokit.issues.get({
                    owner: ORG_NAME,
                    repo: repoName,
                    issue_number: issueNumber,
                  })

                  const type = issue.pull_request ? "pr_comment" : "issue_comment"

                  contributions.push({
                    type,
                    title: `Comment on ${issue.title}`,
                    url: comment.html_url,
                    repo: fullRepoName,
                    created_at: comment.created_at,
                  })
                } catch (error) {
                  if (isDevelopment) {
                    console.error(`Error processing comment in ${fullRepoName}:`, error)
                  }
                }
              }
            } catch (error) {
              if (isDevelopment) {
                console.error(`Error fetching comments for ${fullRepoName}:`, error)
              }
            }
          })(),
        ])
      }),
    )

    return NextResponse.json({
      success: true,
      contributions,
      meta: {
        totalRepos: repos.length,
        scannedRepos: reposToScan.length,
        totalContributions: contributions.length,
      },
    })
  } catch (error: any) {
    // Only log detailed error in development
    if (isDevelopment) {
      console.error("GitHub scan error:", error)
    } else {
      console.error("GitHub scan error occurred")
    }

    return NextResponse.json(
      {
        error: isDevelopment
          ? error.message || "Failed to scan GitHub contributions"
          : "An error occurred while scanning GitHub contributions",
      },
      { status: 500 },
    )
  }
}

