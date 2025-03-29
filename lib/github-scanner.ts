import { createBrowserClient } from "@/lib/supabase-browser"

// Point values for different contribution types
const POINT_VALUES = {
  issue_comment: 1,
  issue_opened: 2,
  pr_comment: 3,
  pr_merged: 5,
}

const isDevelopment = process.env.NODE_ENV === "development"

export async function scanGitHubContributions(username: string, userId: string) {
  try {
    // Get Supabase client
    const supabase = createBrowserClient()

    // First, ensure the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      // If user doesn't exist, create them
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) throw new Error("User not authenticated")

      const { error: createUserError } = await supabase.from("users").insert({
        id: userId,
        name: authUser.user.user_metadata.full_name || authUser.user.email,
        email: authUser.user.email,
        avatar_url: authUser.user.user_metadata.avatar_url,
      })

      if (createUserError) {
        console.error("Error creating user:", createUserError)
        throw new Error("Failed to create user record")
      }
    }

    // Fetch contributions from GitHub API with a limit parameter
    const response = await fetch(`/api/github/scan?username=${encodeURIComponent(username)}&limit=5`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to scan GitHub contributions")
    }

    const { contributions: rawContributions } = await response.json()

    // Get existing contributions to avoid duplicates
    const { data: existingContributions } = await supabase
      .from("github_contributions")
      .select("url")
      .eq("user_id", userId)

    const existingUrls = new Set(existingContributions?.map((c) => c.url) || [])

    // Process and filter contributions
    const newContributions = rawContributions
      .filter((contribution: any) => !existingUrls.has(contribution.url))
      .map((contribution: any) => {
        // Calculate points based on contribution type
        const points = POINT_VALUES[contribution.type as keyof typeof POINT_VALUES] || 0

        return {
          ...contribution,
          points,
        }
      })

    // Calculate total points
    const totalPoints = newContributions.reduce((sum: number, contribution: any) => sum + contribution.points, 0)

    // Save new contributions to database in batches to avoid timeouts
    if (newContributions.length > 0) {
      // Prepare contributions for database
      const contributionsToSave = newContributions.map((contribution: any) => ({
        user_id: userId,
        title: contribution.title,
        url: contribution.url,
        repo_name: contribution.repo,
        type: contribution.type,
        points: contribution.points,
        created_at: contribution.created_at,
      }))

      // Process in batches of 20
      const BATCH_SIZE = 20
      for (let i = 0; i < contributionsToSave.length; i += BATCH_SIZE) {
        const batch = contributionsToSave.slice(i, i + BATCH_SIZE)

        // Insert contributions batch
        const { error: contributionsError } = await supabase.from("github_contributions").insert(batch)

        if (contributionsError) {
          console.error("Error saving contributions batch:", contributionsError)

          // Log the actual data being saved for debugging
          if (isDevelopment) {
            console.log("Attempted to save:", batch)
          }

          throw new Error(
            isDevelopment
              ? `Failed to save contributions: ${contributionsError.message} (Code: ${contributionsError.code})`
              : "Failed to save contributions to database",
          )
        }
      }

      // Add activities for each contribution (also in batches)
      const activities = newContributions.map((contribution: any) => ({
        user_id: userId,
        type: "github",
        title: `GitHub: ${getTypeLabel(contribution.type)}`,
        description: `${contribution.title} in ${contribution.repo}`,
        points: contribution.points,
        timestamp: new Date().toISOString(),
      }))

      // Process activities in batches
      for (let i = 0; i < activities.length; i += BATCH_SIZE) {
        const batch = activities.slice(i, i + BATCH_SIZE)

        const { error: activitiesError } = await supabase.from("activities").insert(batch)

        if (activitiesError) {
          console.error("Error saving activities batch:", activitiesError)

          if (isDevelopment) {
            console.log("Attempted to save activities:", batch)
          }

          throw new Error(
            isDevelopment
              ? `Failed to save activities: ${activitiesError.message} (Code: ${activitiesError.code})`
              : "Failed to save activities to database",
          )
        }
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

