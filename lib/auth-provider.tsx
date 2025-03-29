"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-browser"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

async function ensureUserExists(supabase: any, user: User) {
  if (!user) {
    console.log("No user provided to ensureUserExists")
    return
  }

  console.log("Checking user existence:", {
    userId: user.id,
    email: user.email,
    metadata: user.user_metadata
  })

  try {
    // First check if user exists by ID
    const { data: existingUserById, error: fetchErrorById } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

    // Then check if user exists by email
    const { data: existingUserByEmail, error: fetchErrorByEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single()

    if (fetchErrorById && fetchErrorById.code !== "PGRST116") {
      console.log("Error checking user by ID:", {
        error: fetchErrorById,
        code: fetchErrorById.code,
        message: fetchErrorById.message
      })
      return
    }

    if (fetchErrorByEmail && fetchErrorByEmail.code !== "PGRST116") {
      console.log("Error checking user by email:", {
        error: fetchErrorByEmail,
        code: fetchErrorByEmail.code,
        message: fetchErrorByEmail.message
      })
      return
    }

    // If user exists by ID, update their information
    if (existingUserById) {
      console.log("Updating existing user:", existingUserById)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: user.user_metadata.full_name || user.email,
          email: user.email,
          avatar_url: user.user_metadata.avatar_url,
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating user:", {
          error: updateError,
          code: updateError.code,
          message: updateError.message
        })
      }
    }
    // If user exists by email but not by ID, update their ID
    else if (existingUserByEmail) {
      console.log("Updating user ID for existing email:", existingUserByEmail)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          id: user.id,
          name: user.user_metadata.full_name || user.email,
          avatar_url: user.user_metadata.avatar_url,
        })
        .eq("email", user.email)

      if (updateError) {
        console.error("Error updating user ID:", {
          error: updateError,
          code: updateError.code,
          message: updateError.message
        })
      }
    }
    // If user doesn't exist at all, create them
    else {
      const userData = {
        id: user.id,
        name: user.user_metadata.full_name || user.email,
        email: user.email,
        avatar_url: user.user_metadata.avatar_url,
        created_at: new Date().toISOString(),
      }

      console.log("Attempting to create new user with data:", userData)

      try {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert(userData)
          .select()
          .single()

        if (insertError) {
          console.error("Error creating user:", {
            error: insertError,
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            userData: userData
          })
        } else {
          console.log("Successfully created user:", newUser)
        }
      } catch (error) {
        console.error("Exception while creating user:", {
          error,
          userData
        })
      }
    }
  } catch (error) {
    console.error("Error in ensureUserExists:", {
      error,
      userId: user.id,
      email: user.email,
      metadata: user.user_metadata
    })
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const getSession = async () => {
      console.log("Getting initial session...")

      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log("Initial session:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      })

      setSession(session)
      setUser(session?.user ?? null)

      // Ensure user exists in the users table
      if (session?.user) {
        console.log("Ensuring user exists for initial session...")
        await ensureUserExists(supabase, session.user)
      }

      setIsLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", {
        event: _event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      })

      setSession(session)
      setUser(session?.user ?? null)

      // Ensure user exists in the users table when auth state changes
      if (session?.user) {
        console.log("Ensuring user exists for auth state change...")
        await ensureUserExists(supabase, session.user)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, session, isLoading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

