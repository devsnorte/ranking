import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserGithubContributions } from "@/lib/github"
import GithubContributionScanner from "@/components/github-contribution-scanner"
import GithubContributionHistory from "@/components/github-contribution-history"

export default async function GithubContributionsPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user's GitHub contributions
  const contributions = await getUserGithubContributions(user?.id || "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">GitHub Contributions</h2>
        <p className="text-muted-foreground">Track your contributions to DevNorte GitHub repositories</p>
      </div>

      <Tabs defaultValue="scanner">
        <TabsList>
          <TabsTrigger value="scanner">Contribution Scanner</TabsTrigger>
          <TabsTrigger value="history">Contribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan GitHub Contributions</CardTitle>
              <CardDescription>Scan and track your contributions to the DevNorte organization</CardDescription>
            </CardHeader>
            <CardContent>
              <GithubContributionScanner userId={user?.id || ""} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
              <CardDescription>Your tracked GitHub contributions to DevNorte</CardDescription>
            </CardHeader>
            <CardContent>
              <GithubContributionHistory userId={user?.id || ""} contributions={contributions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

