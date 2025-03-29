import { Card } from "@/components/ui/card"
import { GitPullRequestIcon, GitForkIcon, MessageSquareIcon } from "lucide-react"

interface GithubContributionHistoryProps {
  userId: string
  contributions: any[]
}

export default function GithubContributionHistory({ userId, contributions }: GithubContributionHistoryProps) {
  // Group contributions by month
  const groupedContributions = contributions.reduce(
    (acc, contribution) => {
      const date = new Date(contribution.created_at)
      const month = date.toLocaleString("default", { month: "long", year: "numeric" })

      if (!acc[month]) {
        acc[month] = []
      }

      acc[month].push(contribution)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Sort months in reverse chronological order
  const sortedMonths = Object.keys(groupedContributions).sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateB.getTime() - dateA.getTime()
  })

  // Calculate total points
  const totalPoints = contributions.reduce((sum, contribution) => sum + contribution.points, 0)

  if (contributions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No contributions tracked yet. Use the scanner to find and track your contributions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h3 className="text-lg font-medium">Total Contributions</h3>
          <p className="text-sm text-muted-foreground">{contributions.length} contributions tracked</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">{totalPoints}</span>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>
      </div>

      {sortedMonths.map((month) => (
        <div key={month} className="space-y-3">
          <h3 className="text-lg font-medium">{month}</h3>
          <div className="space-y-2">
            {groupedContributions[month].map((contribution, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    {contribution.type === "pr_merged" && <GitPullRequestIcon className="h-4 w-4 text-primary" />}
                    {contribution.type === "issue_opened" && <GitForkIcon className="h-4 w-4 text-primary" />}
                    {contribution.type === "issue_comment" && <MessageSquareIcon className="h-4 w-4 text-primary" />}
                    {contribution.type === "pr_comment" && <MessageSquareIcon className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{contribution.title}</h4>
                      <span className="font-bold">+{contribution.points} points</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{contribution.repo}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(contribution.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(contribution.type)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "pr_merged":
      return "Pull Request Merged"
    case "issue_opened":
      return "Issue Opened"
    case "issue_comment":
      return "Issue Comment"
    case "pr_comment":
      return "PR Comment"
    default:
      return type.replace("_", " ")
  }
}

