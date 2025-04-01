import { createBrowserClient } from "@/lib/supabase-browser"
import { PostgrestResponse } from "@supabase/supabase-js"

// Point values for different contribution types
const POINT_VALUES = {
  issue_comment: 1,
  issue_opened: 2,
  pr_comment: 3,
  pr_merged: 5,
}

const isDevelopment = process.env.NODE_ENV === "development"

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to retry failed operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  baseDelay = RETRY_CONFIG.baseDelay
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries === 0) throw error
    await delay(baseDelay * (RETRY_CONFIG.maxRetries - retries + 1))
    return withRetry(operation, retries - 1, baseDelay)
  }
}

interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface GithubContribution {
  url: string
  title: string
  repo: string
  type: keyof typeof POINT_VALUES
  points: number
  created_at: string
}

export async function scanGitHubContributions(username: string, userId: string) {
  try {
    // Get Supabase client
    const supabase = createBrowserClient()

    // First, ensure the user exists in the users table
    const { data: userData, error: userError } = await withRetry(async () => {
      const result = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single()
      return result as PostgrestResponse<{ id: string }>
    })

    if (userError || !userData) {
      // If user doesn't exist, create them
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) throw new Error("User not authenticated")

      const { error: createUserError } = await withRetry(async () => {
        const result = await supabase.from("users").insert({
          id: userId,
          name: authUser.user.user_metadata.full_name || authUser.user.email,
          email: authUser.user.email,
          avatar_url: authUser.user.user_metadata.avatar_url,
        })
        return result as PostgrestResponse<null>
      })

      if (createUserError) {
        console.error("Error creating user:", createUserError)
        throw new Error("Failed to create user record")
      }
    }

    // Fetch contributions from GitHub API with a higher limit
    const response = await fetch(`/api/github/scan?username=${encodeURIComponent(username)}&limit=10`, {
      signal: AbortSignal.timeout(120000), // 120 second timeout
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to scan GitHub contributions")
    }

    const { contributions: rawContributions } = await response.json()

    // Get existing contributions to avoid duplicates
    const { data: existingContributions } = await withRetry(async () => {
      const result = await supabase
        .from("github_contributions")
        .select("url")
        .eq("user_id", userId)
      return result as PostgrestResponse<{ url: string }[]>
    })

    const existingUrls = new Set((existingContributions || []).map((c) => c.url))

    // Process and filter contributions
    const newContributions = rawContributions
      .filter((contribution: GithubContribution) => !existingUrls.has(contribution.url))
      .map((contribution: GithubContribution) => {
        const points = POINT_VALUES[contribution.type] || 0
        return {
          ...contribution,
          points,
        }
      })

    // Calculate total points
    const totalPoints = newContributions.reduce((sum: number, contribution: GithubContribution) => sum + contribution.points, 0)

    // Save new contributions to database in batches to avoid timeouts
    if (newContributions.length > 0) {
      // Prepare contributions for database
      const contributionsToSave = newContributions.map((contribution: GithubContribution) => ({
        user_id: userId,
        title: contribution.title,
        url: contribution.url,
        repo_name: contribution.repo,
        type: contribution.type,
        points: contribution.points,
        created_at: contribution.created_at,
      }))

      // Process in batches of 20 with retries
      const BATCH_SIZE = 20
      for (let i = 0; i < contributionsToSave.length; i += BATCH_SIZE) {
        const batch = contributionsToSave.slice(i, i + BATCH_SIZE)

        // Insert contributions batch with retry
        const { error: contributionsError } = await withRetry(async () => {
          const result = await supabase.from("github_contributions").insert(batch)
          return result as PostgrestResponse<null>
        })

        if (contributionsError) {
          console.error("Error saving contributions batch:", contributionsError)
          if (isDevelopment) {
            console.log("Attempted to save:", batch)
          }
          throw new Error(
            isDevelopment
              ? `Failed to save contributions: ${contributionsError.message} (Code: ${contributionsError.code})`
              : "Failed to save contributions to database"
          )
        }

        // Add delay between batches to avoid rate limiting
        await delay(1000)
      }

      // Add activities for each contribution (also in batches)
      const activities = newContributions.map((contribution: GithubContribution) => ({
        user_id: userId,
        type: "github",
        title: `GitHub: ${getTypeLabel(contribution.type)}`,
        description: `${contribution.title} in ${contribution.repo}`,
        points: contribution.points,
        timestamp: new Date().toISOString(),
      }))

      // Process activities in batches with retries
      for (let i = 0; i < activities.length; i += BATCH_SIZE) {
        const batch = activities.slice(i, i + BATCH_SIZE)

        const { error: activitiesError } = await withRetry(async () => {
          const result = await supabase.from("activities").insert(batch)
          return result as PostgrestResponse<null>
        })

        if (activitiesError) {
          console.error("Error saving activities batch:", activitiesError)
          if (isDevelopment) {
            console.log("Attempted to save activities:", batch)
          }
          throw new Error(
            isDevelopment
              ? `Failed to save activities: ${activitiesError.message} (Code: ${activitiesError.code})`
              : "Failed to save activities to database"
          )
        }

        // Add delay between batches to avoid rate limiting
        await delay(1000)
      }
    }

    return {
      contributions: newContributions,
      totalPoints,
    }
  } catch (error: any) {
    if (isDevelopment) {
      console.error("Error scanning GitHub contributions:", error)
    }
    throw error
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "pr_merged":
      return "Pull Request Merged"
    case "issue_opened":
      return "Issue Opened"
    case "issue_comment":
      return "Issue Comment"
    case "pr_comment":
      return "PR Comment"
    default:
      return type.replace("_", " ")
  }
}

