"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function GitHubTokenChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    user?: any
    isDevelopment?: boolean
  } | null>(null)

  const checkToken = async () => {
    setIsChecking(true)
    setResult(null)

    try {
      const response = await fetch("/api/github/test-token")
      const data = await response.json()

      setResult({
        ...data,
        isDevelopment: process.env.NODE_ENV === "development",
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: "Error checking token",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to check GitHub token",
        isDevelopment: process.env.NODE_ENV === "development",
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkToken()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Token Status</CardTitle>
        <CardDescription>Check if your GitHub token is valid and has the necessary permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking GitHub token...</span>
          </div>
        ) : result ? (
          <>
            {result.success ? (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Valid GitHub Token</AlertTitle>
                <AlertDescription>
                  <p>{result.message}</p>
                  {result.user && (
                    <p className="mt-2">
                      Authenticated as: <strong>{result.user.login}</strong> ({result.user.name || "No name"})
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid GitHub Token</AlertTitle>
                <AlertDescription>
                  <p>{result.message}</p>
                  {result.isDevelopment && result.error && (
                    <p className="mt-2 text-xs bg-destructive/20 p-2 rounded">
                      <strong>Development Error:</strong> {result.error}
                    </p>
                  )}
                  <p className="mt-2">Please check your GITHUB_TOKEN environment variable.</p>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : null}

        <div className="mt-4 text-sm text-muted-foreground">
          <p className="mb-2">The GitHub token needs the following permissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Read access to repositories (<code>repo:read</code>)
            </li>
            <li>
              Read access to organization members (<code>read:org</code>)
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={checkToken} disabled={isChecking} variant="outline" className="w-full">
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Token Again"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

