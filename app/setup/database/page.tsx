"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function DatabaseSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    details?: any
    needsManualSetup?: boolean
  }>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  const handleSetup = async () => {
    setIsLoading(true)
    setResult({})
    setLogs([])
    setProgress(10)

    addLog("Starting database setup...")

    try {
      // Try to check tables first
      addLog("Checking existing tables...")
      setProgress(20)

      const checkResponse = await fetch("/api/database/check-tables", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        // If we get an error about execute_sql function, we need manual setup
        if (checkData.error && checkData.error.includes("execute_sql")) {
          addLog("ERROR: The execute_sql function is not available in your Supabase instance")
          addLog("Manual setup is required")
          throw new Error("Manual setup required: The execute_sql function is not available")
        }

        throw new Error(checkData.error || "Failed to check database tables")
      }

      addLog(
        `Found ${checkData.existingTables.length} existing tables: ${checkData.existingTables.join(", ") || "none"}`,
      )

      // If some tables are missing, create them
      const missingTables = checkData.missingTables || []
      if (missingTables.length > 0) {
        addLog(`Missing tables: ${missingTables.join(", ")}`)
        setProgress(40)

        // Run the setup
        addLog("Creating missing tables...")
        const response = await fetch("/api/setup-database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to set up database")
        }

        setProgress(80)
        addLog("Tables created successfully!")

        // Verify tables were created
        addLog("Verifying tables...")
        const verifyResponse = await fetch("/api/database/check-tables", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const verifyData = await verifyResponse.json()

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || "Failed to verify database tables")
        }

        const stillMissingTables = verifyData.missingTables || []
        if (stillMissingTables.length > 0) {
          throw new Error(`Some tables could not be created: ${stillMissingTables.join(", ")}`)
        }

        addLog(`All tables verified: ${verifyData.existingTables.join(", ")}`)
      } else {
        addLog("All required tables already exist!")
      }

      setProgress(100)
      setResult({
        success: true,
        message: "Database setup completed successfully",
        details: checkData,
      })
    } catch (error: any) {
      setProgress(0)
      addLog(`ERROR: ${error.message}`)

      // Check if this is a case where manual setup is needed
      const needsManualSetup = error.message.includes("execute_sql") || error.message.includes("Manual setup required")

      setResult({
        success: false,
        error: error.message || "An unknown error occurred",
        needsManualSetup,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goToManualSetup = () => {
    window.location.href = "/setup/sql-script"
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup
          </CardTitle>
          <CardDescription>Set up the database tables for the gamification platform</CardDescription>
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
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                This will create the necessary database tables for the gamification platform:
              </p>

              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Users</li>
                <li>Events</li>
                <li>User Events (check-ins)</li>
                <li>GitHub Contributions</li>
                <li>Discord Activities</li>
                <li>Activities (for tracking all activities)</li>
              </ul>
            </div>

            {isLoading && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Setting up database...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Setup Log:</h3>
                <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      {log.startsWith("ERROR") ? <span className="text-destructive">{log}</span> : <span>{log}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {result.needsManualSetup ? (
            <>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button onClick={goToManualSetup}>Manual Setup Instructions</Button>
            </>
          ) : (
            <Button onClick={handleSetup} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up Database"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

