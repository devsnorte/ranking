"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getAuthInfo() {
      try {
        const supabase = createClientComponentClient()

        // Get session
        const { data: sessionData } = await supabase.auth.getSession()

        // Get auth settings if possible
        let settings = null
        try {
          const { data, error } = await fetch("/api/auth/get-settings").then((res) => res.json())
          if (!error) {
            settings = data
          }
        } catch (e) {
          console.error("Could not fetch auth settings:", e)
        }

        setAuthInfo({
          session: sessionData.session,
          user: sessionData.session?.user || null,
          settings,
          environment: {
            origin: window.location.origin,
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌",
          },
        })
      } catch (error) {
        console.error("Error fetching auth info:", error)
        setAuthInfo({ error: "Failed to fetch auth information" })
      } finally {
        setIsLoading(false)
      }
    }

    getAuthInfo()
  }, [])

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug Information</CardTitle>
          <CardDescription>Details about your authentication configuration and session</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading auth information...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Environment</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre>{JSON.stringify(authInfo?.environment, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Session</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre>{JSON.stringify(authInfo?.session, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">User</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre>{JSON.stringify(authInfo?.user, null, 2)}</pre>
                </div>
              </div>

              {authInfo?.settings && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Auth Settings</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto">
                    <pre>{JSON.stringify(authInfo?.settings, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button onClick={() => window.location.reload()}>Refresh Information</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

