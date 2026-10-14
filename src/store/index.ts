import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BackupSchema } from '../lib/schemas'
import type { Lesson, Level, Todo } from '../lib/types'

export type Theme = 'dark' | 'light'

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Settings = Pick<State, 'apiKey' | 'theme' | 'level' | 'voice' | 'geminiVoice' | 'textModel' | 'ttsModel'>

interface State {
  apiKey: string
  theme: Theme
  level: Level
  voice: string
  geminiVoice: boolean
  /** empty string = automatic fallback chain */
  textModel: string
  ttsModel: string
  lessons: Record<string, Lesson>
  currentKey: string | null
  todos: Todo[]
  activity: Record<string, number>

  set: (patch: Partial<Settings>) => void
  saveLesson: (lesson: Lesson) => void
  patchLesson: (key: string, patch: Partial<Lesson>) => void
  deleteLesson: (key: string) => void
  setCurrent: (key: string | null) => void
  addTodos: (texts: string[], subject: string) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  log: (points: number) => void
  /** throws if the JSON is not a valid backup */
  importData: (json: string) => void
}

const uid = () => crypto.randomUUID()

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      apiKey: '',
      theme: 'dark',
      level: 'normal',
      voice: 'Kore',
      geminiVoice: true,
      textModel: '',
      ttsModel: '',
      lessons: {},
      currentKey: null,
      todos: [],
      activity: {},

      set: (patch) => set(patch),
      saveLesson: (lesson) =>
        set((s) => ({ lessons: { ...s.lessons, [lesson.key]: lesson }, currentKey: lesson.key })),
      patchLesson: (key, patch) =>
        set((s) => (s.lessons[key] ? { lessons: { ...s.lessons, [key]: { ...s.lessons[key], ...patch } } } : s)),
      deleteLesson: (key) =>
        set((s) => {
          const { [key]: _removed, ...rest } = s.lessons
          return { lessons: rest, currentKey: s.currentKey === key ? null : s.currentKey }
        }),
      setCurrent: (key) => set({ currentKey: key }),
      addTodos: (texts, subject) =>
        set((s) => ({
          todos: [
            ...s.todos,
            ...texts.map((text) => ({ id: uid(), text, subject, done: false, rewarded: false })),
          ],
        })),
      toggleTodo: (id) => {
        const todo = get().todos.find((t) => t.id === id)
        if (!todo) return
        const grant = !todo.done && !todo.rewarded
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, done: !t.done, rewarded: t.rewarded || grant } : t,
          ),
        }))
        if (grant) get().log(2)
      },
      removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
      log: (points) => {
        if (points <= 0) return
        set((s) => {
          const k = todayKey()
          return { activity: { ...s.activity, [k]: (s.activity[k] ?? 0) + points } }
        })
      },
      importData: (json) => {
        const d = BackupSchema.parse(JSON.parse(json))
        set({
          lessons: d.lessons,
          todos: d.todos,
          activity: d.activity,
          currentKey: d.currentKey && d.lessons[d.currentKey] ? d.currentKey : null,
        })
      },
    }),
    {
      name: 'studygrind-v1',
      version: 1,
      // add a migration branch here whenever the persisted shape changes
      migrate: (persisted) => persisted as State,
    },
  ),
)
