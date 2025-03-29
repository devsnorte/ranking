import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitPullRequestIcon, GitForkIcon, CodeIcon } from "lucide-react"
import { getUserGithubContributions } from "@/lib/github"
import GithubContributionForm from "@/components/github-contribution-form"

export default async function ContributionsPage() {
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
        <p className="text-muted-foreground">Track your contributions to GitHub repositories</p>
      </div>

      <Tabs defaultValue="contributions">
        <TabsList>
          <TabsTrigger value="contributions">My Contributions</TabsTrigger>
          <TabsTrigger value="add">Add Contribution</TabsTrigger>
        </TabsList>
        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contributions</CardTitle>
              <CardDescription>Your recent GitHub contributions to community repositories</CardDescription>
            </CardHeader>
            <CardContent>
              {contributions.length > 0 ? (
                <div className="space-y-6">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        {contribution.type === "pull_request" && (
                          <GitPullRequestIcon className="h-4 w-4 text-primary" />
                        )}
                        {contribution.type === "issue" && <GitForkIcon className="h-4 w-4 text-primary" />}
                        {contribution.type === "code_review" && <CodeIcon className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{contribution.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {contribution.repo_name} - {contribution.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contribution.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+{contribution.points} points</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contributions recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add GitHub Contribution</CardTitle>
              <CardDescription>Submit your GitHub contributions to earn points</CardDescription>
            </CardHeader>
            <CardContent>
              <GithubContributionForm userId={user?.id || ""} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

