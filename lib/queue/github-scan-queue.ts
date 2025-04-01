import { Queue } from "bullmq"
import { GithubScanJobData } from "./github-scan"

// Create BullMQ queue for GitHub scanning
export const githubScanQueue = new Queue<GithubScanJobData>("github-scan", {
  connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {
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
