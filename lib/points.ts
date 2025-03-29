import { createServerClient } from "@/lib/supabase-server"

export async function getUserPoints(userId: string) {
  if (!userId) {
    return {
      totalPoints: 0,
      githubPoints: 0,
      eventPoints: 0,
      discordPoints: 0,
    }
  }

  const supabase = createServerClient()

  // Get GitHub points
  const { data: githubData } = await supabase.from("github_contributions").select("points").eq("user_id", userId)

  const githubPoints = githubData?.reduce((sum, item) => sum + (item.points || 0), 0) || 0

  // Get event points
  const { data: eventData } = await supabase.from("user_events").select("events(points)").eq("user_id", userId)

  const eventPoints = eventData?.reduce((sum, item) => sum + (item.events?.points || 0), 0) || 0

  // Get Discord points
  const { data: discordData } = await supabase.from("discord_activities").select("points").eq("user_id", userId)

  const discordPoints = discordData?.reduce((sum, item) => sum + (item.points || 0), 0) || 0

  // Calculate total points
  const totalPoints = githubPoints + eventPoints + discordPoints

  return {
    totalPoints,
    githubPoints,
    eventPoints,
    discordPoints,
  }
}

