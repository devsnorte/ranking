import { createServerClient } from "@/lib/supabase-server"

export type LeaderboardEntry = {
  id: string
  name: string
  avatar_url: string | null
  points: number
  rank: number
}

export type Leaderboard = {
  overall: LeaderboardEntry[]
  github: LeaderboardEntry[]
  events: LeaderboardEntry[]
  discord: LeaderboardEntry[]
}

export async function getLeaderboard(): Promise<Leaderboard> {
  const supabase = createServerClient()

  // Get overall leaderboard with public access
  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("user_id, points")
    .not("points", "is", null)

  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError)
    return { overall: [], github: [], events: [], discord: [] }
  }

  // Get user details with public access
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, avatar_url")

  if (usersError) {
    console.error("Error fetching users:", usersError)
    return { overall: [], github: [], events: [], discord: [] }
  }

  // Group by user and sum points
  const userPoints =
    activities?.reduce(
      (acc, activity) => {
        const userId = activity.user_id
        if (!acc[userId]) {
          acc[userId] = 0
        }
        acc[userId] += activity.points || 0
        return acc
      },
      {} as Record<string, number>,
    ) || {}
  console.log("User points:", userPoints)

  // Create leaderboard entries
  const overallEntries = Object.entries(userPoints)
    .map(([userId, points]) => {
      const user = users?.find((u) => u.id === userId)
      return {
        id: userId,
        name: user?.name || "Anonymous User",
        avatar_url: user?.avatar_url,
        points,
      }
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 100) // Limit to top 100
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  console.log("Overall entries:", overallEntries)

  // Get GitHub leaderboard
  const { data: githubActivities, error: githubError } = await supabase
    .from("activities")
    .select("user_id, points")
    .eq("type", "github")
    .not("points", "is", null)

  if (githubError) {
    console.error("Error fetching GitHub activities:", githubError)
    return { overall: overallEntries, github: [], events: [], discord: [] }
  }

  const githubPoints =
    githubActivities?.reduce(
      (acc, activity) => {
        const userId = activity.user_id
        if (!acc[userId]) {
          acc[userId] = 0
        }
        acc[userId] += activity.points || 0
        return acc
      },
      {} as Record<string, number>,
    ) || {}
  console.log("GitHub points:", githubPoints)

  const githubEntries = Object.entries(githubPoints)
    .map(([userId, points]) => {
      const user = users?.find((u) => u.id === userId)
      return {
        id: userId,
        name: user?.name || "Anonymous User",
        avatar_url: user?.avatar_url,
        points,
      }
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 100) // Limit to top 100
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  console.log("GitHub entries:", githubEntries)

  // Get Events leaderboard
  const { data: eventActivities, error: eventError } = await supabase
    .from("activities")
    .select("user_id, points")
    .eq("type", "event")
    .not("points", "is", null)

  if (eventError) {
    console.error("Error fetching event activities:", eventError)
    return { overall: overallEntries, github: githubEntries, events: [], discord: [] }
  }

  const eventPoints =
    eventActivities?.reduce(
      (acc, activity) => {
        const userId = activity.user_id
        if (!acc[userId]) {
          acc[userId] = 0
        }
        acc[userId] += activity.points || 0
        return acc
      },
      {} as Record<string, number>,
    ) || {}
  console.log("Event points:", eventPoints)

  const eventEntries = Object.entries(eventPoints)
    .map(([userId, points]) => {
      const user = users?.find((u) => u.id === userId)
      return {
        id: userId,
        name: user?.name || "Anonymous User",
        avatar_url: user?.avatar_url,
        points,
      }
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 100) // Limit to top 100
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  console.log("Event entries:", eventEntries)

  // Get Discord leaderboard
  const { data: discordActivities, error: discordError } = await supabase
    .from("activities")
    .select("user_id, points")
    .eq("type", "discord")
    .not("points", "is", null)

  if (discordError) {
    console.error("Error fetching discord activities:", discordError)
    return { overall: overallEntries, github: githubEntries, events: eventEntries, discord: [] }
  }

  const discordPoints =
    discordActivities?.reduce(
      (acc, activity) => {
        const userId = activity.user_id
        if (!acc[userId]) {
          acc[userId] = 0
        }
        acc[userId] += activity.points || 0
        return acc
      },
      {} as Record<string, number>,
    ) || {}
  console.log("Discord points:", discordPoints)

  const discordEntries = Object.entries(discordPoints)
    .map(([userId, points]) => {
      const user = users?.find((u) => u.id === userId)
      return {
        id: userId,
        name: user?.name || "Anonymous User",
        avatar_url: user?.avatar_url,
        points,
      }
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 100) // Limit to top 100
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  console.log("Discord entries:", discordEntries)

  const result = {
    overall: overallEntries,
    github: githubEntries,
    events: eventEntries,
    discord: discordEntries,
  }
  console.log("Final result:", result)
  return result
}

