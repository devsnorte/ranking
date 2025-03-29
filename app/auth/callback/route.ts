import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const origin = requestUrl.origin

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      })

      // Create a Supabase client with service role for admin operations
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Exchange the code for a session
      const { error: sessionError, data: { session } } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error("Error exchanging code for session:", sessionError)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError.message)}`)
      }

      if (session?.user) {
        console.log("Session user data:", {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        })

        // Check if user exists in the database
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error checking user:", {
            error: userError,
            code: userError.code,
            message: userError.message
          })
          return NextResponse.redirect(`${origin}/login?error=Database error`)
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Unknown User',
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
          }

          console.log("Attempting to create user with data:", userData)

          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert([userData])

          if (insertError) {
            console.error("Error creating user:", {
              error: insertError,
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            })
            return NextResponse.redirect(`${origin}/login?error=Failed to create user: ${encodeURIComponent(insertError.message)}`)
          }

          console.log("User created successfully")
        } else {
          console.log("User already exists")
        }
      }
    }

    // Redirect to the dashboard using the same origin
    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (error) {
    console.error("Callback error:", error)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login?error=Something went wrong`)
  }
}

