export type GithubContributionType =
  | "commit"
  | "pr_merged"
  | "pr_comment"
  | "issue_opened"
  | "issue_comment"

export const GITHUB_CONTRIBUTION_TYPES = {
  commit: {
    label: "Commit to Main Branch",
    points: 3,
  },
  pr_merged: {
    label: "Merged Pull Request",
    points: 5,
  },
  pr_comment: {
    label: "Pull Request Comment",
    points: 1,
  },
  issue_opened: {
    label: "Opened Issue",
    points: 1,
  },
  issue_comment: {
    label: "Issue Comment",
    points: 1,
  },
} as const

export function getGithubContributionLabel(type: GithubContributionType): string {
  return GITHUB_CONTRIBUTION_TYPES[type].label
}

export function getGithubContributionPoints(type: GithubContributionType): number {
  return GITHUB_CONTRIBUTION_TYPES[type].points
}
