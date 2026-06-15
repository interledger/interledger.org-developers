import { monthStart, monthEnd } from './dateRange'

export interface MonthEntry {
  label: string
  year: number
  month: number // 0-11
  start: Date
  end: Date
  isQuarterStart: boolean
  col: number // 1-based; col 1 = label, months start at col 2
}

export interface QuarterHeader {
  label: string
  q: number
  year: number
  colStart: number
  span: number
}

export function buildMonths(minDate: Date, maxDate: Date): MonthEntry[] {
  const months: MonthEntry[] = []
  let cm = minDate.getUTCMonth()
  let cmy = minDate.getUTCFullYear()
  const endYear = maxDate.getUTCFullYear()
  const endMonth = maxDate.getUTCMonth()

  while (cmy < endYear || (cmy === endYear && cm <= endMonth)) {
    months.push({
      label: new Date(Date.UTC(cmy, cm, 1)).toLocaleString('en-US', {
        month: 'short'
      }),
      year: cmy,
      month: cm,
      start: monthStart(cmy, cm),
      end: monthEnd(cmy, cm),
      isQuarterStart: cm % 3 === 0,
      col: months.length + 2
    })
    cm++
    if (cm > 11) {
      cm = 0
      cmy++
    }
  }

  return months
}

export function buildQuarterHeaders(months: MonthEntry[]): QuarterHeader[] {
  const headers: QuarterHeader[] = []
  let mi = 0

  while (mi < months.length) {
    const m = months[mi]
    const q = Math.floor(m.month / 3) + 1
    let span = 0
    while (mi + span < months.length) {
      const nm = months[mi + span]
      if (Math.floor(nm.month / 3) + 1 !== q || nm.year !== m.year) break
      span++
    }
    headers.push({
      label: `Q${q} ${m.year}`,
      q,
      year: m.year,
      colStart: m.col,
      span
    })
    mi += span
  }

  return headers
}
