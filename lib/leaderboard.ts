import { createServerClient } from "@/lib/supabase-server"

export async function getLeaderboard() {
  const supabase = createServerClient()

  // Get overall leaderboard
  const { data: activities } = await supabase.from("activities").select("user_id, points")

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

  // Get user details
  const { data: users } = await supabase.from("users").select("id, name, avatar_url")

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
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  // Get GitHub leaderboard
  const { data: githubActivities } = await supabase.from("activities").select("user_id, points").eq("type", "github")

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
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  // Get Events leaderboard
  const { data: eventActivities } = await supabase.from("activities").select("user_id, points").eq("type", "event")

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
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  // Get Discord leaderboard
  const { data: discordActivities } = await supabase.from("activities").select("user_id, points").eq("type", "discord")

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
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  return {
    overall: overallEntries,
    github: githubEntries,
    events: eventEntries,
    discord: discordEntries,
  }
}

