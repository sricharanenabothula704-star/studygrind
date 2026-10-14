import { describe, expect, it } from 'vitest'
import { buildGrid, computeStreaks } from './stats'

const today = new Date(2026, 9, 14) // Wed 14 Oct 2026

describe('computeStreaks', () => {
  it('is zero with no activity', () => {
    expect(computeStreaks({}, today)).toEqual({ current: 0, longest: 0 })
  })

  it('counts consecutive days ending today', () => {
    const a = { '2026-10-14': 3, '2026-10-13': 1, '2026-10-12': 5, '2026-10-10': 2 }
    expect(computeStreaks(a, today)).toEqual({ current: 3, longest: 3 })
  })

  it('keeps the streak alive when today is still empty', () => {
    const a = { '2026-10-13': 1, '2026-10-12': 1 }
    expect(computeStreaks(a, today).current).toBe(2)
  })

  it('breaks the streak after a missed day', () => {
    const a = { '2026-10-12': 1, '2026-10-11': 1, '2026-10-10': 1 }
    expect(computeStreaks(a, today)).toEqual({ current: 0, longest: 3 })
  })

  it('handles month boundaries', () => {
    const a = { '2026-09-30': 1, '2026-10-01': 1, '2026-10-02': 1 }
    expect(computeStreaks(a, new Date(2026, 9, 2)).longest).toBe(3)
  })
})

describe('buildGrid', () => {
  const grid = buildGrid({ '2026-10-14': 7 }, today, 26)

  it('has weeks x 7 cells', () => expect(grid).toHaveLength(26 * 7))

  it("places today in the last column on Wednesday's row", () => {
    const i = grid.findIndex((c) => c.value === 7)
    expect(i % 26).toBe(25)
    expect(Math.floor(i / 26)).toBe(3)
  })

  it('marks only days after today as future', () => {
    const future = grid.filter((c) => c.future)
    expect(future).toHaveLength(3) // Thu, Fri, Sat
    expect(future.every((c) => c.date > today)).toBe(true)
  })
})
