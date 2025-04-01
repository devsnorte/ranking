"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { GithubContributionType, getGithubContributionLabel, getGithubContributionPoints } from "@/lib/types/github"

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
  const [scanStatus, setScanStatus] = useState<string>("")
  const [scanId, setScanId] = useState<string | null>(null)
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

  // Function to check scan status
  const checkScanStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/github/scan/status?scanId=${id}`)
      if (!response.ok) {
        throw new Error("Failed to check scan status")
      }

      const { scan } = await response.json()

      if (scan.status === "completed") {
        setScanProgress(100)
        setScanStatus("Scan completed!")
        setIsScanning(false)
        setScanResult({
          success: true,
          message: scan.contributions_count > 0
            ? `Found ${scan.contributions_count} new contributions worth ${scan.total_points} points!`
            : "No new contributions found. You're all caught up!",
          totalPoints: scan.total_points,
        })

        toast({
          title: "Scan completed",
          description: scan.contributions_count > 0
            ? `Found ${scan.contributions_count} new contributions worth ${scan.total_points} points!`
            : "No new contributions found. You're all caught up!",
        })

        router.refresh()
        return true
      } else if (scan.status === "failed") {
        setScanProgress(0)
        setScanStatus("Scan failed")
        setIsScanning(false)
        setScanResult({
          success: false,
          message: scan.error || "Failed to scan GitHub contributions",
          error: scan.error,
        })

        toast({
          title: "Scan failed",
          description: scan.error || "Failed to scan GitHub contributions",
          variant: "destructive",
        })
        return true
      } else {
        setScanProgress(scan.progress || 0)
        setScanStatus(scan.status === "processing" ? "Scanning repositories..." : "Initializing scan...")
        return false
      }
    } catch (error: any) {
      console.error("Error checking scan status:", error)
      return false
    }
  }

  // Effect to poll scan status
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (scanId && isScanning) {
      interval = setInterval(async () => {
        const isComplete = await checkScanStatus(scanId)
        if (isComplete) {
          clearInterval(interval)
        }
      }, 2000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [scanId, isScanning])

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
    setScanProgress(10)
    setScanStatus("Initializing scan...")

    try {
      // Start the background scan
      const response = await fetch(`/api/github/scan?username=${encodeURIComponent(githubUsername)}&userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to start scan")
      }

      const { scanId: newScanId } = await response.json()
      setScanId(newScanId)
    } catch (error: any) {
      setIsScanning(false)
      setScanProgress(0)
      setScanStatus("Failed to start scan")

      const errorMessage = error.message || "Failed to start GitHub scan"
      setScanResult({
        success: false,
        message: errorMessage,
        error: error,
      })

      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      })
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
              <span>{scanStatus}</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              This may take a few minutes. We're scanning all repositories in parallel while respecting GitHub's rate limits.
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
          {Object.entries(GithubContributionType).map(([type, value]) => (
            <li key={type} className="flex justify-between">
              <span>{getGithubContributionLabel(value)}</span>
              <span className="font-medium">{getGithubContributionPoints(value)} points</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

