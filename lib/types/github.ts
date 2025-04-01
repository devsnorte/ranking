export enum GithubContributionType {
  COMMIT = "commit",
  PULL_REQUEST = "pull_request",
  PULL_REQUEST_COMMENT = "pull_request_comment",
  ISSUE = "issue",
  ISSUE_COMMENT = "issue_comment",
}

export interface GithubContributionInfo {
  label: string
  points: number
  description: string
}

export const GITHUB_CONTRIBUTION_TYPES: Record<GithubContributionType, GithubContributionInfo> = {
  [GithubContributionType.COMMIT]: {
    label: "Commits",
    points: 5,
    description: "Commits to main/master branch",
  },
  [GithubContributionType.PULL_REQUEST]: {
    label: "Merged PRs",
    points: 20,
    description: "Pull requests merged to main/master",
  },
  [GithubContributionType.PULL_REQUEST_COMMENT]: {
    label: "PR Comments",
    points: 3,
    description: "Comments on pull requests",
  },
  [GithubContributionType.ISSUE]: {
    label: "Issues",
    points: 2,
    description: "Issues opened",
  },
  [GithubContributionType.ISSUE_COMMENT]: {
    label: "Issue Comments",
    points: 1,
    description: "Comments on issues",
  },
}

export function getGithubContributionLabel(type: GithubContributionType): string {
  return GITHUB_CONTRIBUTION_TYPES[type].label
}

export function getGithubContributionPoints(type: GithubContributionType): number {
  return GITHUB_CONTRIBUTION_TYPES[type].points
}

export function getGithubContributionDescription(type: GithubContributionType): string {
  return GITHUB_CONTRIBUTION_TYPES[type].description
}
