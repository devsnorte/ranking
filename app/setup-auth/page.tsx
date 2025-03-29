"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function SetupAuthPage() {
  const [siteUrl, setSiteUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
  }>({})

  useEffect(() => {
    // Set the default site URL to the current origin
    setSiteUrl(window.location.origin)
  }, [])

  const handleSetup = async () => {
    setIsLoading(true)
    setResult({})

    try {
      const response = await fetch("/api/auth/setup-site-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update site URL")
      }

      setResult({
        success: true,
        message: `Site URL updated to: ${data.siteUrl}`,
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Auth Configuration</CardTitle>
          <CardDescription>Update the site URL for authentication redirects</CardDescription>
        </CardHeader>
        <CardContent>
          {result.success && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {result.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL</Label>
              <Input
                id="site-url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://your-site.vercel.app"
              />
              <p className="text-sm text-muted-foreground">This should be the URL of your deployed application</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetup} disabled={isLoading || !siteUrl} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Site URL"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

