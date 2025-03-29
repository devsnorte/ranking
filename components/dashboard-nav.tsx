"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TrophyIcon,
  CalendarIcon,
  GitlabIcon as GitHubLogoIcon,
  BarChartIcon,
  UserIcon,
  LogOutIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { cn } from "@/lib/utils"

export default function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <BarChartIcon className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: <CalendarIcon className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/github-contributions",
      label: "GitHub",
      icon: <GitHubLogoIcon className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/leaderboard",
      label: "Leaderboard",
      icon: <TrophyIcon className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <TrophyIcon className="h-6 w-6" />
          <span>DevCommunity</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                pathname === route.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              {route.icon}
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.user_metadata?.name || user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

