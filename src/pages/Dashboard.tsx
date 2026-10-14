import { useState } from 'react'
import DotGrid from '../components/DotGrid'
import type { Cell } from '../components/DotGrid'
import { buildGrid, computeStreaks } from '../lib/stats'
import { useStore } from '../store'

const WEEKS = 26

export default function Dashboard() {
  const { activity, todos, lessons } = useStore()
  const [today] = useState(() => new Date())

  const cells: Cell[] = buildGrid(activity, today, WEEKS).map((c) => ({
    value: c.value,
    muted: c.future,
    title: `${c.date.toDateString()}: ${c.value} activity point${c.value === 1 ? '' : 's'}`,
  }))
  const { current, longest } = computeStreaks(activity, today)

  const total = Object.values(activity).reduce((a, b) => a + b, 0)
  const doneTodos = todos.filter((t) => t.done).length
  const stats = [
    ['Current streak', `${current} d`],
    ['Longest streak', `${longest} d`],
    ['Lessons', Object.keys(lessons).length],
    ['Tasks done', `${doneTodos}/${todos.length}`],
    ['Total points', total],
  ]

  const subjects = todos.reduce<Record<string, number>>((acc, t) => {
    if (t.done) acc[t.subject] = (acc[t.subject] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card !p-4">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
      <section className="card">
        <h2 className="label">Study dots: last {WEEKS} weeks (bigger dot = more studying)</h2>
        <DotGrid cols={WEEKS} rows={7} cells={cells} max={Math.max(10, ...Object.values(activity))} className="w-full" />
        <p className="mt-2 text-xs text-zinc-500">
          Points: +1 lesson started, +1 per new step reached, +2 per task done, +2 per correct quiz answer.
        </p>
      </section>
      {Object.keys(subjects).length > 0 && (
        <section className="card">
          <h2 className="label">Tasks done by subject</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(subjects).map(([s, n]) => (
              <li key={s} className="flex justify-between"><span>{s}</span><span className="font-bold">{n}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
