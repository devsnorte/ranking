import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitlabIcon as GitHubLogoIcon, CalendarIcon, MessageSquareIcon, TrophyIcon, ScanIcon } from "lucide-react"
import { getUserPoints } from "@/lib/points"
import ActivityFeed from "@/components/activity-feed"
import { GithubScanForm } from "./github/components/github-scan-form"
import { GithubScanHistory } from "./github/components/github-scan-history"
import { GITHUB_CONTRIBUTION_TYPES } from "@/lib/types/github"

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user points from different categories
  const { totalPoints, githubPoints, eventPoints, discordPoints } = await getUserPoints(user?.id || "")

  // Get GitHub scan history
  const { data: scanHistory } = await supabase
    .from("github_scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.name || user?.email}!</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GitHub Points</CardTitle>
            <GitHubLogoIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{githubPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Points</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discord Points</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discordPoints}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="github">
            <ScanIcon className="mr-2 h-4 w-4" />
            GitHub Scan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed userId={user?.id || ""} />
        </TabsContent>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Check out these upcoming community events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No upcoming events at the moment.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="github" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">GitHub Contribution Points</h3>
            <p className="text-sm text-muted-foreground">
              Scan your GitHub contributions and earn points for your activity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(GITHUB_CONTRIBUTION_TYPES).map(([type, { label, points }]) => (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <GitHubLogoIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{points}</div>
                  <p className="text-xs text-muted-foreground">points per contribution</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <GithubScanForm />
          <GithubScanHistory initialScans={scanHistory || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

