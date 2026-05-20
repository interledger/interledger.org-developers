export interface TimelinePositioner {
  timelineStart: number
  timelineEnd: number
  totalMs: number
  pctLeft(date: Date): number
  pctWidth(start: Date, end: Date): number
}

export function createPositioner(
  timelineStart: number,
  timelineEnd: number
): TimelinePositioner {
  const totalMs = timelineEnd - timelineStart
  return {
    timelineStart,
    timelineEnd,
    totalMs,
    pctLeft(date: Date): number {
      return Math.max(
        0,
        Math.min(100, ((date.getTime() - timelineStart) / totalMs) * 100)
      )
    },
    pctWidth(start: Date, end: Date): number {
      return Math.max(((end.getTime() - start.getTime()) / totalMs) * 100, 0.5)
    }
  }
}
