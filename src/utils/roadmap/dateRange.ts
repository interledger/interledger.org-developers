import type { ApiProject } from '../../types/roadmap'

export function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1))
}

export function monthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
}

export function computeDateRange(projects: ApiProject[]): {
  minDate: Date
  maxDate: Date
} {
  const allDates: Date[] = []
  for (const proj of projects) {
    if (proj.startDate) allDates.push(new Date(proj.startDate))
    if (proj.targetDate) allDates.push(new Date(proj.targetDate))
    for (const ms of proj.milestones) {
      if (ms.targetDate) allDates.push(new Date(ms.targetDate))
    }
  }

  const fallbackStart = new Date()
  const fallbackEnd = new Date(fallbackStart)
  fallbackEnd.setUTCFullYear(fallbackEnd.getUTCFullYear() + 1)

  return {
    minDate: allDates.length
      ? new Date(Math.min(...allDates.map((d) => d.getTime())))
      : fallbackStart,
    maxDate: allDates.length
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : fallbackEnd
  }
}
