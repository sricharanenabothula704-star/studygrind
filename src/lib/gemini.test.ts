// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiError as AiErrorType } from './gemini'

const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

const { AiError, classify, withModels, clean, lessonKey } = await import('./gemini')

const chain = ['m1', 'm2', 'm3']
let n = 0
const id = () => `t${n++}` // fresh "last good model" slot per test

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

async function run<T>(p: Promise<T>) {
  const settled = p.then(
    (v) => ({ ok: true as const, v }),
    (e: unknown) => ({ ok: false as const, e }),
  )
  await vi.runAllTimersAsync()
  return settled
}

describe('classify', () => {
  it.each([
    ['{"error":{"code":400,"message":"API key not valid. API_KEY_INVALID"}}', 'key'],
    ['{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}', 'next-model'],
    ['models/x is not found for API version', 'next-model'],
    ['{"error":{"code":503,"status":"UNAVAILABLE"}}', 'retry'],
    ['TypeError: Failed to fetch', 'retry'],
    ['something unexpected', 'fatal'],
  ])('%s -> %s', (msg, kind) => expect(classify(new Error(msg))).toBe(kind))

  it('treats bad AI output as retryable', () => expect(classify(new AiError('bad-output', 'x'))).toBe('retry'))
})

describe('withModels', () => {
  it('falls through to the next model on 404', async () => {
    const call = vi.fn(async (m: string) => {
      if (m === 'm1') throw new Error('404 NOT_FOUND')
      return m
    })
    const r = await run(withModels(chain, '', id(), call))
    expect(r).toEqual({ ok: true, v: 'm2' })
    expect(call.mock.calls.map((c) => c[0])).toEqual(['m1', 'm2'])
  })

  it('stops immediately on a bad API key', async () => {
    const call = vi.fn(async () => {
      throw new Error('API_KEY_INVALID')
    })
    const r = await run(withModels(chain, '', id(), call))
    expect(call).toHaveBeenCalledTimes(1)
    expect(r.ok).toBe(false)
    expect((r as { e: AiErrorType }).e.kind).toBe('key')
  })

  it('reports a quota error when every model is exhausted', async () => {
    const call = vi.fn(async () => {
      throw new Error('429 RESOURCE_EXHAUSTED')
    })
    const r = await run(withModels(chain, '', id(), call))
    expect(call).toHaveBeenCalledTimes(3)
    expect((r as { e: AiErrorType }).e.kind).toBe('quota')
  })

  it('does not fall through when a model is pinned', async () => {
    const call = vi.fn(async () => {
      throw new Error('429 RESOURCE_EXHAUSTED')
    })
    await run(withModels(chain, 'm2', id(), call))
    expect(call.mock.calls.every((c) => (c as unknown as [string])[0] === 'm2')).toBe(true)
  })

  it('retries once on the same model for transient errors', async () => {
    let calls = 0
    const call = vi.fn(async (m: string) => {
      if (calls++ === 0) throw new Error('503 UNAVAILABLE')
      return m
    })
    const r = await run(withModels(chain, '', id(), call))
    expect(r).toEqual({ ok: true, v: 'm1' })
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('tries the last model that worked first next time', async () => {
    const slot = id()
    await run(withModels(chain, '', slot, async (m) => { if (m === 'm1') throw new Error('404'); return m }))
    const call = vi.fn(async (m: string) => m)
    await run(withModels(chain, '', slot, call))
    expect(call.mock.calls[0][0]).toBe('m2')
  })
})

describe('input helpers', () => {
  it('clean collapses whitespace and truncates', () => {
    expect(clean('  a \n\n b  ', 10)).toBe('a b')
    expect(clean('x'.repeat(50), 5)).toBe('xxxxx')
  })
  it('lessonKey is case/whitespace-insensitive', () => {
    expect(lessonKey(' Newton  Laws ', 'normal', '')).toBe(lessonKey('newton laws', 'normal', ''))
  })
})
