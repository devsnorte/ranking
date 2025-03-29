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
                  <LeaderboardTable data={overall} />
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
                  <LeaderboardTable data={github} />
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
                  <LeaderboardTable data={events} />
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
                  <LeaderboardTable data={discord} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

interface LeaderboardTableProps {
  data: Array<{
    id: string
    name: string
    avatar_url?: string
    points: number
    rank: number
  }>
  currentUserId?: string
}

function LeaderboardTable({ data, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-muted">
          <tr>
            <th scope="col" className="px-6 py-3">
              Rank
            </th>
            <th scope="col" className="px-6 py-3">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((entry) => (
              <tr key={entry.id} className={`border-b ${entry.id === currentUserId ? "bg-primary/10" : ""}`}>
                <td className="px-6 py-4">
                  {entry.rank === 1 && <TrophyIcon className="h-4 w-4 text-yellow-500 inline mr-1" />}
                  {entry.rank === 2 && <TrophyIcon className="h-4 w-4 text-gray-400 inline mr-1" />}
                  {entry.rank === 3 && <TrophyIcon className="h-4 w-4 text-amber-700 inline mr-1" />}
                  {entry.rank}
                </td>
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url || "/placeholder.svg"}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span>{entry.name}</span>
                  {entry.id === currentUserId && <span className="text-xs text-muted-foreground">(You)</span>}
                </td>
                <td className="px-6 py-4 text-right font-bold">{entry.points}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

