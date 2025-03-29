import { createServerClient } from "@/lib/supabase-server"

export async function getRecentActivity(userId: string) {
  if (!userId) return []

  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(10)

  return data || []
}

