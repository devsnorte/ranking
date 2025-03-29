import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      redirect("/login")
    }

    return (
      <div className="flex min-h-screen flex-col">
        <DashboardNav />
        <main className="flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect("/login")
  }
}

