// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// zustand `persist` needs a storage; give it an in-memory one
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

const { useStore, todayKey } = await import('./index')

beforeEach(() => {
  useStore.setState({ todos: [], activity: {}, lessons: {}, currentKey: null })
})

describe('todo rewards', () => {
  it('grants points once even if re-ticked', () => {
    useStore.getState().addTodos(['a'], 'Math')
    const id = useStore.getState().todos[0].id
    const t = () => useStore.getState().toggleTodo(id)
    t() // done
    t() // undone
    t() // done again
    expect(useStore.getState().activity[todayKey()]).toBe(2)
  })
})

describe('importData', () => {
  it('rejects invalid JSON and keeps existing data', () => {
    useStore.getState().addTodos(['keep'], 'x')
    expect(() => useStore.getState().importData('not json')).toThrow()
    expect(() => useStore.getState().importData('{"lessons":{"a":{"topic":5}}}')).toThrow()
    expect(useStore.getState().todos).toHaveLength(1)
  })

  it('restores a valid backup', () => {
    useStore.getState().importData(JSON.stringify({ activity: { '2026-01-01': 4 }, todos: [] }))
    expect(useStore.getState().activity['2026-01-01']).toBe(4)
  })
})

describe('log', () => {
  it('ignores zero and negative points', () => {
    useStore.getState().log(0)
    useStore.getState().log(-3)
    expect(useStore.getState().activity).toEqual({})
  })
})
