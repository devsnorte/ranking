import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GitlabIcon as GitHubLogoIcon, StarIcon, TrophyIcon, CalendarIcon, BarChart2Icon } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <TrophyIcon className="h-6 w-6" />
            <span>DevCommunity</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/leaderboard" className="text-sm font-medium hover:underline underline-offset-4">
              Leaderboard
            </Link>
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Gamify Your Community Contributions
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Track your contributions, participate in events, and earn points for your community involvement.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="gap-1">
                      <GitHubLogoIcon className="h-5 w-5" />
                      Sign in with GitHub
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button size="lg" variant="outline" className="gap-1">
                      <BarChart2Icon className="h-5 w-5" />
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <StarIcon className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">GitHub Contributions</h3>
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Track your PRs, issues, and code reviews
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Event Check-ins</h3>
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Earn points for attending community events
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

