"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/lib/database.types"
import { GithubContributionType, getGithubContributionLabel, getGithubContributionDescription } from "@/lib/types/github"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

type GithubScan = Database["public"]["Tables"]["github_scans"]["Row"]

interface GithubScanHistoryProps {
  initialScans: GithubScan[]
}

export function GithubScanHistory({ initialScans }: GithubScanHistoryProps) {
  const [scans, setScans] = useState<GithubScan[]>(initialScans)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const channel = supabase
      .channel("github_scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "github_scans",
        },
        (payload) => {
          setScans((prev) => [payload.new as GithubScan, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contributions</TableHead>
            <TableHead>Total Points</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => (
            <TableRow key={scan.id}>
              <TableCell>{scan.github_username}</TableCell>
              <TableCell>{scan.status}</TableCell>
              <TableCell>
                <ul className="list-inside list-disc">
                  {Object.entries(scan.contributions || {}).map(([type, count]) => {
                    const contributionType = type as GithubContributionType
                    return (
                      <li key={type} className="flex items-center gap-2">
                        <span>
                          {getGithubContributionLabel(contributionType)}: {count}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getGithubContributionDescription(contributionType)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    )
                  })}
                </ul>
              </TableCell>
              <TableCell>{scan.total_points}</TableCell>
              <TableCell>
                {new Date(scan.created_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
