import { linear } from './client.js'
import type {
  RoadmapSnapshot,
  RoadmapTeam,
  RoadmapProject
} from '../types/roadmap.js'

const DEFAULT_VIEW_ID = '27df73bc-50ec-4fc1-bbb2-d906236a5bbc'

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
}

type CustomViewQueryResult = {
  customView: {
    projects: {
      nodes: ViewProjectNode[]
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  } | null
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
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransientError(err) || attempt === retries) throw err
      lastErr = err
      const wait = delayMs * 2 ** attempt
      console.warn(
        `[linear] Transient error (attempt ${attempt + 1}/${retries}), retrying in ${wait}ms...`
      )
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchTeams(): Promise<TeamsQueryResult['teams']['nodes']> {
  console.log('[linear] Fetching teams...')
  const all: TeamsQueryResult['teams']['nodes'] = []
  let hasNextPage = true
  let endCursor: string | null = null

  while (hasNextPage) {
    const result = await withRetry(() =>
      linear.client.request<TeamsQueryResult>(TEAMS_QUERY, {
        first: 50,
        after: endCursor
      })
    )
    all.push(...result.teams.nodes)
    hasNextPage = result.teams.pageInfo.hasNextPage
    endCursor = result.teams.pageInfo.endCursor
  }

  console.log(`[linear] Fetched ${all.length} teams.`)
  return all
}

async function fetchViewProjects(viewId: string): Promise<ViewProjectNode[]> {
  console.log(`[linear] Fetching projects from view ${viewId}...`)
  const all: ViewProjectNode[] = []
  let hasNextPage = true
  let endCursor: string | null = null

  while (hasNextPage) {
    const result = await withRetry(() =>
      linear.client.request<CustomViewQueryResult>(CUSTOM_VIEW_QUERY, {
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

  console.log(`[linear] Fetched ${all.length} projects from view.`)
  return all
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function buildSnapshot(): Promise<RoadmapSnapshot> {
  const viewId = process.env.LINEAR_CUSTOM_VIEW_ID ?? DEFAULT_VIEW_ID

  const [teamNodes, viewProjects] = await Promise.all([
    fetchTeams(),
    fetchViewProjects(viewId)
  ])

  const projects: RoadmapProject[] = viewProjects
    .filter((p) => !p.name.includes('(Archived) '))
    .map((p) => {
      const firstTeam = p.teams.nodes[0] ?? null
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
        team: firstTeam
          ? {
              id: firstTeam.id,
              name: firstTeam.name,
              key: firstTeam.key,
              color: firstTeam.color
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

  const teams: RoadmapTeam[] = teamNodes
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

  return {
    generatedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    teams,
    projects
  }
}
