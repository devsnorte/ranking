import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrophyIcon, GitlabIcon as GitHubLogoIcon, CalendarIcon, MessageSquareIcon } from "lucide-react"
import { getLeaderboard } from "@/lib/leaderboard"
import PublicHeader from "@/components/public-header"

export default async function PublicLeaderboardPage() {
  // Get leaderboard data
  const { overall, github, events, discord } = await getLeaderboard()

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Community Leaderboard</h1>
            <p className="text-muted-foreground mt-2">
              See who's leading the community in contributions and participation
            </p>
          </div>

          <Tabs defaultValue="overall">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="discord">Discord</TabsTrigger>
            </TabsList>

            <TabsContent value="overall">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5" />
                    Overall Leaderboard
                  </CardTitle>
                  <CardDescription>Top contributors across all categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <PublicLeaderboardTable data={overall} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="github">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitHubLogoIcon className="h-5 w-5" />
                    GitHub Contributions
                  </CardTitle>
                  <CardDescription>Top GitHub contributors</CardDescription>
                </CardHeader>
                <CardContent>
                  <PublicLeaderboardTable data={github} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Event Participation
                  </CardTitle>
                  <CardDescription>Most active event participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <PublicLeaderboardTable data={events} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discord">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareIcon className="h-5 w-5" />
                    Discord Activity
                  </CardTitle>
                  <CardDescription>Most active Discord participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <PublicLeaderboardTable data={discord} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

interface PublicLeaderboardTableProps {
  data: Array<{
    id: string
    name: string
    avatar_url?: string
    points: number
    rank: number
  }>
}

function PublicLeaderboardTable({ data }: PublicLeaderboardTableProps) {
  return (
    <div className="grid gap-4">
      {data.length > 0 ? (
        data.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-6">
                  {entry.rank}
                </span>
                {entry.rank === 1 && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                {entry.rank === 2 && <TrophyIcon className="h-4 w-4 text-gray-400" />}
                {entry.rank === 3 && <TrophyIcon className="h-4 w-4 text-amber-700" />}
              </div>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-medium">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{entry.points}</span>
              <span className="text-sm text-muted-foreground">points</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  )
}

