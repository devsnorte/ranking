"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubContributionType, getGithubContributionLabel, getGithubContributionPoints, getGithubContributionDescription } from "@/lib/types/github"
import { GithubIcon } from "lucide-react"

export function GithubScanForm() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/github/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        throw new Error("Failed to start scan")
      }

      toast({
        title: "Scan started",
        description: "Your GitHub contributions are being scanned.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(GithubContributionType).map(([type, value]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getGithubContributionLabel(value)}</CardTitle>
              <GithubIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getGithubContributionPoints(value)}</div>
              <p className="text-xs text-muted-foreground">{getGithubContributionDescription(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          type="text"
          placeholder="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Scanning..." : "Start Scan"}
        </Button>
      </form>
    </div>
  )
}
