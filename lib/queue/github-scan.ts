import { Queue, Worker, Job } from "bullmq"
import { Octokit } from "@octokit/rest"
import { createServerClient } from "@/lib/supabase-server"
import { PostgrestResponse } from "@supabase/supabase-js"
import { GithubContributionType, getGithubContributionPoints } from "@/lib/types/github"

const ORG_NAME = "devsnorte"
const isDevelopment = process.env.NODE_ENV === "development"

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  delayBetweenRequests: 2000,
  concurrentRequests: 3,
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Define job data type
export interface GithubScanJobData {
  username: string
  userId: string
  scanId: string
}

// Create BullMQ queue for GitHub scanning
const githubScanQueue = new Queue<GithubScanJobData>("github-scan", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})

// Process a single repository
async function processRepository(
  octokit: Octokit,
  repo: { name: string; owner: { login: string } },
  username: string,
  contributions: Record<GithubContributionType, number>,
  totalPoints: number,
): Promise<{ contributions: Record<GithubContributionType, number>; totalPoints: number }> {
  // Get commits to main/master branch
  const { data: commits } = await octokit.repos.listCommits({
    owner: repo.owner.login,
    repo: repo.name,
    author: username,
    per_page: 100,
  })

  // Count commits to main/master branch
  const mainBranchCommits = commits.filter(commit => {
    const branch = commit.commit.message.includes("Merge pull request") ? "main" : "master"
    return commit.commit.message.includes(`Merge pull request`) || commit.commit.message.includes(`Merge branch '${branch}'`)
  })

  contributions[GithubContributionType.COMMIT] += mainBranchCommits.length
  totalPoints += mainBranchCommits.length * getGithubContributionPoints(GithubContributionType.COMMIT)

  // Get pull requests
  const { data: pullRequests } = await octokit.pulls.list({
    owner: repo.owner.login,
    repo: repo.name,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  })

  // Process pull requests
  for (const pr of pullRequests) {
    if (pr.user?.login === username) {
      if (pr.merged_at) {
        contributions[GithubContributionType.PULL_REQUEST]++
        totalPoints += getGithubContributionPoints(GithubContributionType.PULL_REQUEST)
      }

      // Get PR comments
      const { data: prComments } = await octokit.issues.listComments({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: pr.number,
        per_page: 100,
      })

      const userPrComments = prComments.filter(comment => comment.user?.login === username)
      contributions[GithubContributionType.PULL_REQUEST_COMMENT] += userPrComments.length
      totalPoints += userPrComments.length * getGithubContributionPoints(GithubContributionType.PULL_REQUEST_COMMENT)
    }
  }

  // Get issues
  const { data: issues } = await octokit.issues.listForRepo({
    owner: repo.owner.login,
    repo: repo.name,
    state: "all",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  })

  // Process issues
  for (const issue of issues) {
    if (issue.user?.login === username) {
      if (!issue.pull_request) {
        contributions[GithubContributionType.ISSUE]++
        totalPoints += getGithubContributionPoints(GithubContributionType.ISSUE)
      }

      // Get issue comments
      const { data: issueComments } = await octokit.issues.listComments({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number,
        per_page: 100,
      })

      const userIssueComments = issueComments.filter(comment => comment.user?.login === username)
      contributions[GithubContributionType.ISSUE_COMMENT] += userIssueComments.length
      totalPoints += userIssueComments.length * getGithubContributionPoints(GithubContributionType.ISSUE_COMMENT)
    }
  }

  return { contributions, totalPoints }
}

// Create worker to process jobs
const worker = new Worker<GithubScanJobData>(
  "github-scan",
  async (job) => {
    const { username, userId, scanId } = job.data
    const supabase = createServerClient(true) // Use service role for admin access

    try {
      // Initialize Octokit with GitHub token
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      })

      // Initialize contributions object
      const contributions: Record<GithubContributionType, number> = {
        [GithubContributionType.COMMIT]: 0,
        [GithubContributionType.PULL_REQUEST]: 0,
        [GithubContributionType.PULL_REQUEST_COMMENT]: 0,
        [GithubContributionType.ISSUE]: 0,
        [GithubContributionType.ISSUE_COMMENT]: 0,
      }
      let totalPoints = 0

      // Get organization repositories
      const { data: repos } = await octokit.repos.listForOrg({
        org: ORG_NAME,
        type: "all",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      })

      // Process repositories with rate limiting
      const batchSize = RATE_LIMIT.concurrentRequests
      for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize)
        const promises = batch.map((repo) =>
          processRepository(octokit, repo, username, contributions, totalPoints),
        )

        const results = await Promise.all(promises)
        results.forEach((result) => {
          Object.keys(result.contributions).forEach((type) => {
            contributions[type as GithubContributionType] += result.contributions[type as GithubContributionType]
          })
          totalPoints += result.totalPoints
        })

        // Update scan status
        await supabase
          .from("github_scans")
          .update({
            status: "processing",
            progress: Math.round((i + batch.length) / repos.length) * 100,
          })
          .eq("id", scanId)

        // Rate limiting delay
        await delay(RATE_LIMIT.delayBetweenRequests)
      }

      // Update scan record with results
      const { error: updateError } = await supabase
        .from("github_scans")
        .update({
          status: "completed",
          contributions,
          total_points: totalPoints,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanId)

      if (updateError) {
        throw updateError
      }

      // Create activity record
      const { error: activityError } = await supabase.from("activities").insert({
        user_id: userId,
        type: "github",
        points: totalPoints,
        metadata: {
          scan_id: scanId,
          contributions,
        },
      })

      if (activityError) {
        throw activityError
      }

      return { success: true }
    } catch (error) {
      console.error("Error processing GitHub scan:", error)

      // Update scan record with error
      await supabase
        .from("github_scans")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanId)

      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  },
)

// Handle job completion
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

// Handle job failure
worker.on("failed", (job: Job | undefined, error: Error) => {
  console.error(`Job ${job?.id || "unknown"} failed:`, error)
})

export { githubScanQueue }
