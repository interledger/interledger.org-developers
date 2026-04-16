export interface BoardMilestone {
  id: string
  name: string
  targetDate: string | null
}

export interface BoardProject {
  id: string
  name: string
  description: string | null
  color: string | null
  state: string
  icon: string | null
  priority: number
  progress: number
  sortOrder: number
  startDate: string | null
  targetDate: string | null
  completedAt: string | null
  url: string | null
  milestones: BoardMilestone[]
}

// Project as returned by the API (has nested team object)
export interface ApiProject extends BoardProject {
  team: { id: string; name: string; key: string; color: string } | null
}

// Team as returned by the API
export interface BoardTeam {
  id: string
  name: string
  key: string
  color: string | null
  childrenIds: string[]
  projectCount: number
}

// Internal component types (used by RoadmapBoard)
export interface BoardGroup {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  status: string | null
  startDate: string | null
  targetDate: string | null
}

export interface BoardRow extends BoardGroup {
  projects: BoardProject[]
}
