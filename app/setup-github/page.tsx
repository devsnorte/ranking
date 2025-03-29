"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SetupGitHubPage() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
  }>({})
  const { toast } = useToast()

  const handleSetup = async () => {
    if (!token) {
      toast({
        title: "Token required",
        description: "Please enter a GitHub token",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult({})

    try {
      const response = await fetch("/api/github/setup-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up GitHub token")
      }

      setResult({
        success: true,
        message: data.message || "GitHub token set up successfully",
      })

      toast({
        title: "Success",
        description: "GitHub token set up successfully",
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })

      toast({
        title: "Error",
        description: error.message || "Failed to set up GitHub token",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setToken("")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GitHub Token Setup</CardTitle>
          <CardDescription>Set up a GitHub token for scanning contributions</CardDescription>
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
              <Label htmlFor="github-token">GitHub Personal Access Token</Label>
              <Input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-sm text-muted-foreground">
                Create a token with <code>repo</code> and <code>read:org</code> scopes
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">How to create a GitHub token:</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings &gt; Developer settings &gt; Personal access tokens
                  </a>
                </li>
                <li>Click "Generate new token" and select "Fine-grained token"</li>
                <li>Give it a name like "DevNorte Contribution Scanner"</li>
                <li>Set an expiration date (recommended: 90 days)</li>
                <li>Under Repository access, select "Public repositories (read-only)"</li>
                <li>Under Permissions, enable "Read-only" access for "Organization"</li>
                <li>Click "Generate token" and copy the token</li>
              </ol>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetup} disabled={isLoading || !token} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Set Up GitHub Token"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

