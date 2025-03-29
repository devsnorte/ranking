import { createServerClient } from "@/lib/supabase-server"

export default async function DebugPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get environment variables (safely)
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌",
    SUPABASE_URL: process.env.SUPABASE_URL ? "✅" : "❌",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅" : "❌",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌",
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(
              {
                authenticated: !!session,
                user: session?.user
                  ? {
                      id: session.user.id,
                      email: session.user.email,
                      role: session.user.role,
                      metadata: session.user.user_metadata,
                    }
                  : null,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <pre className="bg-muted p-4 rounded overflow-auto">{JSON.stringify(envVars, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

