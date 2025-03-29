"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GitlabIcon as GitHubLogoIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true)

      // Get the Supabase URL and anon key from environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables")
      }

      // Create a new Supabase client for this request
      const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs")
      const supabase = createClientComponentClient()

      // Get the current URL to use as the base for the redirect
      const baseUrl = window.location.origin

      // Sign in with GitHub OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          scopes: "read:user repo read:org",
        },
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically from Supabase
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Authentication Error",
        description: error.message || "There was a problem signing in with GitHub.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>Sign in with your GitHub account to track your contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={handleGitHubLogin} disabled={isLoading}>
          <GitHubLogoIcon className="mr-2 h-4 w-4" />
          {isLoading ? "Signing in..." : "Sign in with GitHub"}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
        <div>By signing in, you agree to our Terms of Service and Privacy Policy.</div>
      </CardFooter>
    </Card>
  )
}

