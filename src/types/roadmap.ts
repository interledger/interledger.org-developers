export interface Milestone {
  id: string
  name: string
  targetDate: string | null
}

export interface Team {
  id: string
  name: string
  key: string
  color: string | null
  childrenIds: string[]
  projectCount: number
}

export interface Project {
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
  team: { id: string; name: string; key: string; color: string | null } | null
  milestones: Milestone[]
}

export interface Snapshot {
  generatedAt: string
  teams: Team[]
  projects: Project[]
}
