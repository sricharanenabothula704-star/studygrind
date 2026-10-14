export type Level = 'simple' | 'normal' | 'advanced'

export interface Step {
  title: string
  explanation: string
  example: string
  takeaway: string
  spoken: string
}

export interface Question {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface MapNode {
  label: string
  children?: MapNode[]
}

export interface Flashcard {
  front: string
  back: string
}

export interface Lesson {
  key: string
  topic: string
  level: Level
  steps: Step[]
  quiz?: Question[]
  mindmap?: MapNode
  notes?: string
  flashcards?: Flashcard[]
  createdAt: number
}

export interface Todo {
  id: string
  text: string
  subject: string
  done: boolean
  /** points already granted, so un/re-ticking can't farm the graph */
  rewarded?: boolean
}
