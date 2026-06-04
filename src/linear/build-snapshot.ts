import { linear } from './client.js'
import { LINEAR_CUSTOM_VIEW_ID } from '../config.js'
import type { Snapshot, Team, Project } from '../types/roadmap.js'

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const TEAMS_QUERY = `
  query FetchTeams($first: Int!, $after: String) {
    teams(first: $first, after: $after) {
      nodes {
        id
        name
        key
        color
        children { id }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

type TeamsQueryResult = {
  teams: {
    nodes: Array<{
      id: string
      name: string
      key: string
      color: string | null
      children: Array<{ id: string }>
    }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

const CUSTOM_VIEW_QUERY = `
  query FetchCustomView($id: String!, $after: String) {
    customView(id: $id) {
      projects(first: 50, after: $after) {
        nodes {
          id
          name
          description
          state
          color
          icon
          priority
          startDate
          targetDate
          completedAt
          progress
          url
          sortOrder
          teams {
            nodes { id name key color }
          }
          projectMilestones {
            nodes {
              id
              name
              targetDate
              sortOrder
            }
          }
          labelIds
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

type ViewProjectNode = {
  id: string
  name: string
  description: string | null
  state: string
  color: string | null
  icon: string | null
  priority: number
  startDate: string | null
  targetDate: string | null
  completedAt: string | null
  progress: number
  url: string | null
  sortOrder: number
  teams: {
    nodes: Array<{
      id: string
      name: string
      key: string
      color: string | null
    }>
  }
  projectMilestones: {
    nodes: Array<{
      id: string
      name: string
      targetDate: string | null
      sortOrder: number
    }>
  }
  labelIds: string[]
}

type CustomViewQueryResult = {
  customView: {
    projects: {
      nodes: ViewProjectNode[]
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  } | null
}

// Fetched separately to avoid blowing Linear's query-complexity limit when
// issues are nested inside a paginated projects list.
const PROJECT_ISSUE_TEAMS_QUERY = `
  query FetchProjectIssueTeams($id: String!, $after: String) {
    project(id: $id) {
      issues(first: 100, after: $after) {
        nodes { team { id } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`

type ProjectIssueTeamsQueryResult = {
  project: {
    issues: {
      nodes: Array<{ team: { id: string } | null }>
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  } | null
}

const PROJECT_LABELS_QUERY = `
  query FetchProjectLabels {
    projectLabels {
      nodes { id name }
    }
  }
`

type ProjectLabelsQueryResult = {
  projectLabels: {
    nodes: Array<{ id: string; name: string }>
  }
}

// ---------------------------------------------------------------------------
// Retry helper — retries transient 5xx errors with exponential backoff
// ---------------------------------------------------------------------------

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const status = (err as unknown as Record<string, unknown>).status
  if (typeof status === 'number' && status >= 500) return true
  if (/GraphQL Error \(Code: 5\d\d\)/.test(err.message)) return true
  return false
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransientError(err) || attempt === retries) throw err
      const wait = delayMs * 2 ** attempt
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw new Error('Retry loop exited unexpectedly')
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchTeams(): Promise<TeamsQueryResult['teams']['nodes']> {
  const all: TeamsQueryResult['teams']['nodes'] = []
  let hasNextPage = true
  let endCursor: string | null = null

  while (hasNextPage) {
    const result = await withRetry(() =>
      linear.client.request<
        TeamsQueryResult,
        { first: number; after: string | null }
      >(TEAMS_QUERY, {
        first: 50,
        after: endCursor
      })
    )
    all.push(...result.teams.nodes)
    hasNextPage = result.teams.pageInfo.hasNextPage
    endCursor = result.teams.pageInfo.endCursor
  }

  return all
}

async function fetchPublicLabelIds(): Promise<Set<string>> {
  const result = await withRetry(() =>
    linear.client.request<ProjectLabelsQueryResult, Record<string, never>>(
      PROJECT_LABELS_QUERY
    )
  )
  const ids = result.projectLabels.nodes
    .filter((l) => l.name.toLowerCase() === 'public')
    .map((l) => l.id)
  return new Set(ids)
}

async function fetchProjectIssueTeamCounts(
  projectId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  let hasNextPage = true
  let endCursor: string | null = null

  while (hasNextPage) {
    const result = await withRetry(() =>
      linear.client.request<
        ProjectIssueTeamsQueryResult,
        { id: string; after: string | null }
      >(PROJECT_ISSUE_TEAMS_QUERY, { id: projectId, after: endCursor })
    )
    const issues = result.project?.issues
    if (!issues) break
    for (const node of issues.nodes) {
      if (!node.team?.id) continue
      counts.set(node.team.id, (counts.get(node.team.id) ?? 0) + 1)
    }
    hasNextPage = issues.pageInfo.hasNextPage
    endCursor = issues.pageInfo.endCursor
  }

  return counts
}

async function fetchViewProjects(viewId: string): Promise<ViewProjectNode[]> {
  const all: ViewProjectNode[] = []
  let hasNextPage = true
  let endCursor: string | null = null

  while (hasNextPage) {
    const result = await withRetry(() =>
      linear.client.request<
        CustomViewQueryResult,
        { id: string; after: string | null }
      >(CUSTOM_VIEW_QUERY, {
        id: viewId,
        after: endCursor
      })
    )

    if (!result.customView) {
      throw new Error(
        `Custom view ${viewId} not found in Linear. Check LINEAR_CUSTOM_VIEW_ID.`
      )
    }

    all.push(...result.customView.projects.nodes)
    hasNextPage = result.customView.projects.pageInfo.hasNextPage
    endCursor = result.customView.projects.pageInfo.endCursor
  }

  return all
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function buildSnapshot(): Promise<Snapshot> {
  const viewId = LINEAR_CUSTOM_VIEW_ID!

  const [teamNodes, viewProjects, publicLabelIds] = await Promise.all([
    fetchTeams(),
    fetchViewProjects(viewId),
    fetchPublicLabelIds()
  ])

  // Fetch issue-team counts only for multi-team projects to stay under
  // Linear's query complexity limit.
  const multiTeamProjects = viewProjects.filter((p) => p.teams.nodes.length > 1)
  const issueCountEntries = await Promise.all(
    multiTeamProjects.map(async (p) => {
      const counts = await fetchProjectIssueTeamCounts(p.id)
      return [p.id, counts] as const
    })
  )
  const issueCountsByProjectId = new Map(issueCountEntries)

  function dominantTeam(
    p: ViewProjectNode
  ): ViewProjectNode['teams']['nodes'][number] | null {
    if (p.teams.nodes.length === 0) return null
    if (p.teams.nodes.length === 1) return p.teams.nodes[0]
    const counts = issueCountsByProjectId.get(p.id) ?? new Map<string, number>()
    let best = p.teams.nodes[0]
    let bestCount = counts.get(best.id) ?? 0
    for (const t of p.teams.nodes.slice(1)) {
      const c = counts.get(t.id) ?? 0
      if (c > bestCount) {
        best = t
        bestCount = c
      }
    }
    return best
  }

  const projects: Project[] = viewProjects
    .filter((p) => p.state !== 'completed' && p.state !== 'cancelled')
    .filter((p) => p.labelIds.some((id) => publicLabelIds.has(id)))
    .map((p) => {
      const primaryTeam = dominantTeam(p)
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        state: p.state,
        color: p.color,
        icon: p.icon,
        priority: p.priority ?? 0,
        progress: p.progress ?? 0,
        sortOrder: p.sortOrder ?? 0,
        startDate: p.startDate ?? null,
        targetDate: p.targetDate ?? null,
        completedAt: p.completedAt ?? null,
        url: p.url,
        team: primaryTeam
          ? {
              id: primaryTeam.id,
              name: primaryTeam.name,
              key: primaryTeam.key,
              color: primaryTeam.color
            }
          : null,
        milestones: p.projectMilestones.nodes
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m) => ({
            id: m.id,
            name: m.name,
            targetDate: m.targetDate ?? null
          }))
      }
    })

  const teams: Team[] = teamNodes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
      color: t.color,
      childrenIds: t.children.map((c) => c.id),
      projectCount: projects.filter((p) => p.team?.id === t.id).length
    }))

  /* eslint-disable-next-line no-console */
  console.log(
    `Fetched ${teams.length} teams and ${projects.length} projects from Linear at ${new Date().toISOString()}`
  )

  return {
    generatedAt: new Date().toISOString(),
    teams,
    projects
  }
}
