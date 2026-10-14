import { describe, expect, it } from 'vitest'
import { BackupSchema, MapNodeSchema, QuestionSchema } from './schemas'

describe('QuestionSchema', () => {
  const base = { question: 'q', options: ['a', 'b', 'c', 'd'], explanation: 'e' }
  it('accepts a valid answerIndex', () => expect(QuestionSchema.safeParse({ ...base, answerIndex: 2 }).success).toBe(true))
  it('rejects an out-of-range answerIndex', () => expect(QuestionSchema.safeParse({ ...base, answerIndex: 4 }).success).toBe(false))
  it('rejects a single option', () => expect(QuestionSchema.safeParse({ ...base, options: ['a'], answerIndex: 0 }).success).toBe(false))
})

describe('MapNodeSchema', () => {
  it('accepts nested children', () => {
    expect(MapNodeSchema.safeParse({ label: 'r', children: [{ label: 'a', children: [{ label: 'b' }] }] }).success).toBe(true)
  })
  it('rejects empty labels', () => expect(MapNodeSchema.safeParse({ label: '' }).success).toBe(false))
})

describe('BackupSchema', () => {
  it('fills defaults for an empty backup', () => {
    expect(BackupSchema.parse({})).toEqual({ lessons: {}, todos: [], activity: {} })
  })
  it('rejects malformed lessons', () => {
    expect(BackupSchema.safeParse({ lessons: { x: { topic: 1 } } }).success).toBe(false)
  })
  it('rejects negative activity', () => {
    expect(BackupSchema.safeParse({ activity: { '2026-01-01': -5 } }).success).toBe(false)
  })
})
