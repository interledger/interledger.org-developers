import type { Project, Team } from '../../types/roadmap'

export const DEFAULT_TEAM_COLOR = '#888888'
export const DEFAULT_PROJECT_COLOR = '#888'

export type GridItem =
  | { type: 'team-header'; team: Team; row: number; teamColor: string }
  | { type: 'project'; project: Project; row: number; teamColor: string }

export function buildGridItems(projects: Project[], teams: Team[]): GridItem[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const allChildIds = new Set(teams.flatMap((t) => t.childrenIds))
  const rootTeams = teams.filter((t) => !allChildIds.has(t.id))

  const projectsByTeamId = new Map<string, Project[]>()
  for (const proj of projects) {
    if (!proj.team) continue
    const tid = proj.team.id
    if (!projectsByTeamId.has(tid)) projectsByTeamId.set(tid, [])
    projectsByTeamId.get(tid)!.push(proj)
  }

  function collectTeamProjects(teamId: string): Project[] {
    const team = teamMap.get(teamId)
    if (!team) return []
    const own = projectsByTeamId.get(teamId) ?? []
    const fromChildren = team.childrenIds.flatMap(
      (cid) => projectsByTeamId.get(cid) ?? []
    )
    return [...own, ...fromChildren].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const gridItems: GridItem[] = []
  let currentRow = 1

  for (const rootTeam of rootTeams) {
    const teamProjects = collectTeamProjects(rootTeam.id)
    if (teamProjects.length === 0) continue
    const teamColor = rootTeam.color ?? DEFAULT_TEAM_COLOR
    gridItems.push({
      type: 'team-header',
      team: rootTeam,
      row: currentRow,
      teamColor
    })
    currentRow++
    for (const proj of teamProjects) {
      gridItems.push({
        type: 'project',
        project: proj,
        row: currentRow,
        teamColor
      })
      currentRow++
    }
  }

  const assignedIds = new Set(
    gridItems.flatMap((i) => (i.type === 'project' ? [i.project.id] : []))
  )
  const uncategorised = projects
    .filter((p) => !assignedIds.has(p.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (const proj of uncategorised) {
    const teamColor = proj.team?.color ?? DEFAULT_TEAM_COLOR
    gridItems.push({
      type: 'project',
      project: proj,
      row: currentRow,
      teamColor
    })
    currentRow++
  }

  return gridItems
}
