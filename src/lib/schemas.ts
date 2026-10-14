import { z } from 'zod'
import type { MapNode } from './types'

export const StepSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  example: z.string().default(''),
  takeaway: z.string().default(''),
  spoken: z.string().min(1),
})

export const QuestionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    answerIndex: z.number().int(),
    explanation: z.string().default(''),
  })
  .refine((q) => q.answerIndex >= 0 && q.answerIndex < q.options.length, 'answerIndex out of range')

export const MapNodeSchema: z.ZodType<MapNode> = z.lazy(() =>
  z.object({ label: z.string().min(1), children: z.array(MapNodeSchema).optional() }),
)

export const FlashcardSchema = z.object({ front: z.string().min(1), back: z.string().min(1) })

export const LessonSchema = z.object({
  key: z.string(),
  topic: z.string(),
  level: z.enum(['simple', 'normal', 'advanced']),
  steps: z.array(StepSchema).min(1),
  quiz: z.array(QuestionSchema).optional(),
  mindmap: MapNodeSchema.optional(),
  notes: z.string().optional(),
  flashcards: z.array(FlashcardSchema).optional(),
  createdAt: z.number(),
})

export const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  subject: z.string(),
  done: z.boolean(),
  rewarded: z.boolean().optional(),
})

export const BackupSchema = z.object({
  lessons: z.record(z.string(), LessonSchema).default({}),
  todos: z.array(TodoSchema).default([]),
  activity: z.record(z.string(), z.number().nonnegative()).default({}),
  currentKey: z.string().nullable().optional(),
})

export type Backup = z.infer<typeof BackupSchema>
