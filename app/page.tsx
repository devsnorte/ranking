import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import LandingPage from "@/components/landing-page"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  // Check if the database is set up
  try {
    const { data: tableData, error } = await supabase.from("github_contributions").select("id").limit(1)

    // If there's no error, the table exists
    if (!error) {
      return <LandingPage />
    }

    // If there's an error and it's about the table not existing, redirect to setup
    if (error && (error.message.includes("does not exist") || error.code === "42P01")) {
      redirect("/setup")
    }

    // For other errors, show the landing page
    return <LandingPage />
  } catch (e) {
    // If there's an error checking the table, show the landing page
    return <LandingPage />
  }
}

