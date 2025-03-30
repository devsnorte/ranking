import { Queue, Worker, Job } from "bullmq"
import { Octokit } from "@octokit/rest"
import { createServerClient } from "@/lib/supabase-server"
import { PostgrestResponse } from "@supabase/supabase-js"
import { GithubContributionType, getGithubContributionLabel, getGithubContributionPoints } from "@/lib/types/github"

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
  repo: { name: string; default_branch?: string },
  username: string,
  requestCount: { count: number },
  startTime: number
) {
  const repoName = repo.name
  const fullRepoName = `${ORG_NAME}/${repoName}`
  const contributions: any[] = []

  // Check rate limit
  if (requestCount.count >= RATE_LIMIT.requestsPerMinute) {
    const elapsedTime = Date.now() - startTime
    if (elapsedTime < 60000) {
      await delay(60000 - elapsedTime)
    }
    requestCount.count = 0
  }

  try {
    // Process commits, PRs, issues, and comments concurrently
    const [commitsResult, prsResult, issuesResult, commentsResult] = await Promise.all([
      // Get commits to main/master branch
      octokit.repos.listCommits({
        owner: ORG_NAME,
        repo: repoName,
        sha: repo.default_branch || 'main',
        per_page: 30,
      }),
      octokit.pulls.list({
        owner: ORG_NAME,
        repo: repoName,
        state: "closed",
        per_page: 30,
      }),
      octokit.issues.listForRepo({
        owner: ORG_NAME,
        repo: repoName,
        creator: username,
        state: "all",
        per_page: 30,
      }),
      octokit.issues.listCommentsForRepo({
        owner: ORG_NAME,
        repo: repoName,
        per_page: 50,
        sort: "created",
        direction: "desc",
      })
    ])

    requestCount.count += 4

    // Process commits
    for (const commit of commitsResult.data) {
      if (commit.author?.login?.toLowerCase() === username.toLowerCase()) {
        contributions.push({
          type: "commit" as GithubContributionType,
          title: commit.commit.message,
          url: commit.html_url,
          repo: fullRepoName,
          created_at: commit.commit.author?.date || commit.commit.committer?.date,
          points: getGithubContributionPoints("commit"),
        })
      }
    }

    // Process PRs
    for (const pr of prsResult.data) {
      if (pr.user?.login?.toLowerCase() === username.toLowerCase() && pr.merged_at) {
        contributions.push({
          type: "pr_merged" as GithubContributionType,
          title: pr.title,
          url: pr.html_url,
          repo: fullRepoName,
          created_at: pr.created_at,
          points: getGithubContributionPoints("pr_merged"),
        })
      }
    }

    // Process issues
    for (const issue of issuesResult.data) {
      if (issue.pull_request) continue
      contributions.push({
        type: "issue_opened" as GithubContributionType,
        title: issue.title,
        url: issue.html_url,
        repo: fullRepoName,
        created_at: issue.created_at,
        points: getGithubContributionPoints("issue_opened"),
      })
    }

    // Process comments
    const userComments = commentsResult.data
      .filter(comment => comment.user?.login?.toLowerCase() === username.toLowerCase())
      .slice(0, 10)

    const commentPromises = userComments.map(async (comment) => {
      try {
        const urlParts = comment.issue_url.split("/")
        const issueNumber = Number.parseInt(urlParts[urlParts.length - 1], 10)

        if (requestCount.count >= RATE_LIMIT.requestsPerMinute) {
          const elapsedTime = Date.now() - startTime
          if (elapsedTime < 60000) {
            await delay(60000 - elapsedTime)
          }
          requestCount.count = 0
        }

        const { data: issue } = await octokit.issues.get({
          owner: ORG_NAME,
          repo: repoName,
          issue_number: issueNumber,
        })
        requestCount.count++

        const type = issue.pull_request ? "pr_comment" as GithubContributionType : "issue_comment" as GithubContributionType
        return {
          type,
          title: `Comment on ${issue.title}`,
          url: comment.html_url,
          repo: fullRepoName,
          created_at: comment.created_at,
          points: getGithubContributionPoints(type),
        }
      } catch (error) {
        if (isDevelopment) {
          console.error(`Error processing comment in ${fullRepoName}:`, error)
        }
        return null
      }
    })

    const commentResults = await Promise.all(commentPromises)
    contributions.push(...commentResults.filter(Boolean))

    return contributions
  } catch (error) {
    if (isDevelopment) {
      console.error(`Error processing repository ${fullRepoName}:`, error)
    }
    return []
  }
}

// Create worker to process jobs
const worker = new Worker<GithubScanJobData>(
  "github-scan",
  async (job: Job<GithubScanJobData>) => {
    const { username, userId, scanId } = job.data
    const supabase = createServerClient(true)
    const requestCount = { count: 0 }
    const startTime = Date.now()

    try {
      // Update scan status to processing
      await supabase
        .from("github_scans")
        .update({ status: "processing" })
        .eq("id", scanId)

      const githubToken = process.env.GITHUB_TOKEN
      if (!githubToken) {
        throw new Error("GitHub token is not configured")
      }

      const octokit = new Octokit({
        auth: githubToken,
        request: {
          timeout: 30000,
        },
      })

      // Get repositories
      const { data: repos } = await octokit.repos.listForOrg({
        org: ORG_NAME,
        per_page: 100,
        sort: "updated",
        direction: "desc",
      })

      const reposToScan = repos.slice(0, 10).filter((repo) => !repo.archived)
      const contributions: any[] = []

      // Process repositories in chunks
      for (let i = 0; i < reposToScan.length; i += RATE_LIMIT.concurrentRequests) {
        const chunk = reposToScan.slice(i, i + RATE_LIMIT.concurrentRequests)
        const chunkPromises = chunk.map(repo => processRepository(octokit, repo, username, requestCount, startTime))
        const chunkResults = await Promise.all(chunkPromises)
        contributions.push(...chunkResults.flat())

        // Update progress
        const progress = Math.round((i + RATE_LIMIT.concurrentRequests) / reposToScan.length * 100)
        await supabase
          .from("github_scans")
          .update({ progress })
          .eq("id", scanId)

        if (i + RATE_LIMIT.concurrentRequests < reposToScan.length) {
          await delay(RATE_LIMIT.delayBetweenRequests)
        }
      }

      // Get existing contributions
      const { data: existingContributions } = await supabase
        .from("github_contributions")
        .select("url")
        .eq("user_id", userId)

      const existingUrls = new Set((existingContributions || []).map((c) => c.url))
      const newContributions = contributions.filter(c => !existingUrls.has(c.url))

      // Save new contributions
      if (newContributions.length > 0) {
        const contributionsToSave = newContributions.map(c => ({
          user_id: userId,
          title: c.title,
          url: c.url,
          repo_name: c.repo,
          type: c.type,
          points: c.points,
          created_at: c.created_at,
        }))

        // Save in batches
        const BATCH_SIZE = 20
        for (let i = 0; i < contributionsToSave.length; i += BATCH_SIZE) {
          const batch = contributionsToSave.slice(i, i + BATCH_SIZE)
          await supabase.from("github_contributions").insert(batch)
          await delay(1000)
        }

        // Save activities
        const activities = newContributions.map(c => ({
          user_id: userId,
          type: "github",
          title: `GitHub: ${getGithubContributionLabel(c.type as GithubContributionType)}`,
          description: `${c.title} in ${c.repo}`,
          points: c.points,
          timestamp: new Date().toISOString(),
        }))

        for (let i = 0; i < activities.length; i += BATCH_SIZE) {
          const batch = activities.slice(i, i + BATCH_SIZE)
          await supabase.from("activities").insert(batch)
          await delay(1000)
        }
      }

      // Update scan status to completed
      const totalPoints = newContributions.reduce((sum, c) => sum + c.points, 0)
      await supabase
        .from("github_scans")
        .update({
          status: "completed",
          progress: 100,
          contributions_count: newContributions.length,
          total_points: totalPoints,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanId)

      return {
        success: true,
        contributions: newContributions,
        totalPoints,
      }
    } catch (error: any) {
      // Update scan status to failed
      await supabase
        .from("github_scans")
        .update({
          status: "failed",
          error: error.message,
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
    concurrency: 3,
  }
)

// Handle worker events
worker.on("completed", (job) => {
  if (isDevelopment) {
    console.log(`Job ${job.id} completed successfully`)
  }
})

worker.on("failed", (job, error) => {
  if (isDevelopment) {
    console.error(`Job ${job?.id} failed:`, error)
  }
})

// Export the queue for use in other files
export { githubScanQueue }
