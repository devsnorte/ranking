import { createServerClient } from "@/lib/supabase-server"

export async function getUserGithubContributions(userId: string) {
  if (!userId) return []

  const supabase = createServerClient()

  const { data } = await supabase
    .from("github_contributions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return data || []
}

