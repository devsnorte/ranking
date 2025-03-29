"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { scanGitHubContributions } from "@/lib/github-scanner"
import { useAuth } from "@/lib/auth-provider"

interface GithubContributionScannerProps {
  userId: string
}

export default function GithubContributionScanner({ userId }: GithubContributionScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<{
    success?: boolean
    message?: string
    contributions?: any[]
    totalPoints?: number
    error?: any
    dbTest?: any
  }>({})
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Extract GitHub username from user metadata
    if (user?.user_metadata?.user_name) {
      setGithubUsername(user.user_metadata.user_name)
    } else if (user?.user_metadata?.preferred_username) {
      setGithubUsername(user.user_metadata.preferred_username)
    }
  }, [user])

  const handleScan = async () => {
    if (!githubUsername) {
      toast({
        title: "GitHub username not found",
        description: "We couldn't detect your GitHub username from your profile. Please contact support.",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    setScanResult({})
    setScanProgress(10) // Start progress at 10%

    // Set up a progress simulation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        // Gradually increase progress, but never reach 100% until complete
        const increment = Math.random() * 10
        const newProgress = prev + increment
        return newProgress > 90 ? 90 : newProgress
      })
    }, 1000)

    try {
      const result = await scanGitHubContributions(githubUsername, userId)

      // Clear the interval and set progress to 100%
      clearInterval(progressInterval)
      setScanProgress(100)

      setScanResult({
        success: true,
        message:
          result.contributions.length > 0
            ? `Found ${result.contributions.length} new contributions worth ${result.totalPoints} points!`
            : "No new contributions found. You're all caught up!",
        contributions: result.contributions,
        totalPoints: result.totalPoints,
      })

      toast({
        title: "Scan completed",
        description:
          result.contributions.length > 0
            ? `Found ${result.contributions.length} new contributions worth ${result.totalPoints} points!`
            : "No new contributions found. You're all caught up!",
      })

      // Refresh the page data
      router.refresh()
    } catch (error: any) {
      // Clear the interval on error
      clearInterval(progressInterval)
      setScanProgress(0)

      const errorMessage = error.message || "Failed to scan GitHub contributions"
      const isDatabaseError = errorMessage.includes("Failed to save")

      setScanResult({
        success: false,
        message: errorMessage,
        error: error,
      })

      toast({
        title: isDatabaseError ? "Database Error" : "Scan failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
      // Clear the interval just in case
      clearInterval(progressInterval)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">GitHub Username</h3>
            <p className="text-sm text-muted-foreground">
              {githubUsername ? (
                <>
                  Scanning contributions for <span className="font-medium">{githubUsername}</span>
                </>
              ) : (
                "GitHub username not detected from your profile"
              )}
            </p>
          </div>
          <Button onClick={handleScan} disabled={isScanning || !githubUsername} size="lg" className="gap-2">
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Scanning Contributions...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Scan My Contributions
              </>
            )}
          </Button>
          {scanResult.success === false && scanResult.message?.includes("Failed to save") && (
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/github/test-db")
                  const data = await response.json()

                  toast({
                    title: data.success ? "Database Test Passed" : "Database Test Failed",
                    description: data.success
                      ? "Successfully connected to the database"
                      : `Database error: ${data.insertResult?.error || "Unknown error"}`,
                    variant: data.success ? "default" : "destructive",
                  })

                  // Show the detailed results
                  setScanResult({
                    ...scanResult,
                    dbTest: data,
                  })
                } catch (e: any) {
                  toast({
                    title: "Database Test Failed",
                    description: e.message || "Could not test database connection",
                    variant: "destructive",
                  })
                }
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Test Database Connection
            </Button>
          )}
        </div>

        {isScanning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scanning repositories...</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              This may take a minute. We're scanning the most active repositories first.
            </p>
          </div>
        )}

        {scanResult.success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Scan Completed</AlertTitle>
            <AlertDescription>{scanResult.message}</AlertDescription>
          </Alert>
        )}

        {scanResult.success === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scan Failed</AlertTitle>
            <AlertDescription>
              <p>{scanResult.message}</p>

              {scanResult.dbTest && (
                <div className="mt-2 text-xs bg-destructive/20 p-2 rounded">
                  <p>
                    <strong>Database Test Results:</strong>
                  </p>
                  <pre className="overflow-auto max-h-32 mt-1">{JSON.stringify(scanResult.dbTest, null, 2)}</pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {scanResult.contributions && scanResult.contributions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">New Contributions Found</h3>
          <div className="space-y-2">
            {scanResult.contributions.map((contribution, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{contribution.title}</h4>
                    <p className="text-sm text-muted-foreground">{contribution.repo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contribution.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">+{contribution.points} points</span>
                    <p className="text-xs text-muted-foreground">{contribution.type}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg">Total Points</span>
            <span className="text-lg font-bold">+{scanResult.totalPoints} points</span>
          </div>
        </div>
      )}

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Point System</h3>
        <ul className="space-y-1 text-sm">
          <li className="flex justify-between">
            <span>Comment in issue</span>
            <span className="font-medium">1 point</span>
          </li>
          <li className="flex justify-between">
            <span>Issues opened</span>
            <span className="font-medium">2 points</span>
          </li>
          <li className="flex justify-between">
            <span>PR comment</span>
            <span className="font-medium">3 points</span>
          </li>
          <li className="flex justify-between">
            <span>PR merged</span>
            <span className="font-medium">5 points</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

