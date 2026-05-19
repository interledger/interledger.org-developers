import type { ApiProject, RoadmapMilestone } from '../../types/roadmap'
import type { TimelinePositioner } from './timeline'

export interface ProjectBarProps {
  hasDates: boolean
  barLeft: string | null
  barWidth: string | null
  hasCompletedBar: boolean
  completedBarLeft: string | null
  completedBarWidth: string | null
  hasExtension: boolean
  extensionLeft: string | null
  extensionWidth: string | null
  datedMilestones: RoadmapMilestone[]
}

export function computeProjectBarProps(
  proj: ApiProject,
  pos: TimelinePositioner
): ProjectBarProps {
  const hasDates = !!(proj.startDate && proj.targetDate)
  const barLeft = hasDates
    ? pos.pctLeft(new Date(proj.startDate!)).toFixed(2)
    : null
  const barWidth = hasDates
    ? pos
        .pctWidth(new Date(proj.startDate!), new Date(proj.targetDate!))
        .toFixed(2)
    : null

  const datedMilestones = proj.milestones.filter((ms) => ms.targetDate)

  const hasCompletedBar = !!(
    proj.startDate &&
    !proj.targetDate &&
    proj.completedAt
  )
  const completedBarLeft = hasCompletedBar
    ? pos.pctLeft(new Date(proj.startDate!)).toFixed(2)
    : null
  const completedBarWidth = hasCompletedBar
    ? pos
        .pctWidth(new Date(proj.startDate!), new Date(proj.completedAt!))
        .toFixed(2)
    : null

  const lastMilestoneDate =
    datedMilestones.length > 0
      ? new Date(
          Math.max(
            ...datedMilestones.map((ms) => new Date(ms.targetDate!).getTime())
          )
        )
      : null

  const hasExtension =
    hasDates &&
    lastMilestoneDate !== null &&
    lastMilestoneDate > new Date(proj.targetDate!)
  const extensionLeft = hasExtension
    ? pos.pctLeft(new Date(proj.targetDate!)).toFixed(2)
    : null
  const extensionWidth =
    hasExtension && lastMilestoneDate
      ? pos.pctWidth(new Date(proj.targetDate!), lastMilestoneDate).toFixed(2)
      : null

  return {
    hasDates,
    barLeft,
    barWidth,
    hasCompletedBar,
    completedBarLeft,
    completedBarWidth,
    hasExtension,
    extensionLeft,
    extensionWidth,
    datedMilestones
  }
}
