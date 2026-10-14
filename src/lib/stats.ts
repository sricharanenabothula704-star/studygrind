import { todayKey } from '../store'

const DAY = 864e5

const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Current streak ends today, or yesterday if today has no activity yet. */
export function computeStreaks(activity: Record<string, number>, today: Date) {
  let current = 0
  const d = new Date(today)
  d.setHours(0, 0, 0, 0)
  if (!activity[todayKey(d)]) d.setDate(d.getDate() - 1)
  while (activity[todayKey(d)]) {
    current++
    d.setDate(d.getDate() - 1)
  }

  const days = Object.keys(activity).filter((k) => activity[k] > 0).sort()
  let longest = 0
  let run = 0
  let prev: Date | null = null
  for (const k of days) {
    const cur = parse(k)
    run = prev && Math.round((cur.getTime() - prev.getTime()) / DAY) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = cur
  }
  return { current, longest }
}

export interface DayCell {
  date: Date
  value: number
  future: boolean
}

/** Row-major grid: rows = weekday (Sun..Sat), cols = weeks, ending with the current week. */
export function buildGrid(activity: Record<string, number>, today: Date, weeks: number): DayCell[] {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const start = new Date(t)
  start.setDate(t.getDate() - t.getDay() - (weeks - 1) * 7)
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const row = Math.floor(i / weeks)
    const col = i % weeks
    const date = new Date(start)
    date.setDate(start.getDate() + col * 7 + row)
    return { date, value: activity[todayKey(date)] ?? 0, future: date > t }
  })
}
