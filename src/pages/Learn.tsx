import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HalftoneBackdrop } from '../components/DotGrid'
import Markdown from '../components/Markdown'
import VoiceButton from '../components/VoiceButton'
import { anotherExample, generateLesson, lessonKey, simplifyStep } from '../lib/gemini'
import { useStore } from '../store'

export default function Learn() {
  const nav = useNavigate()
  const { apiKey, lessons, currentKey, saveLesson, patchLesson, deleteLesson, setCurrent, addTodos, log } = useStore()
  const lesson = currentKey ? lessons[currentKey] : null

  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)
  // furthest step reached per lesson, so going Back/Next can't farm points
  const [reached, setReached] = useState<Record<string, number>>({})

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(label)
    setError('')
    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  async function start() {
    if (!topic.trim()) return
    if (busy) return
    const key = lessonKey(topic, useStore.getState().level, details)
    const cached = lessons[key]
    if (cached) {
      setCurrent(key)
      setIdx(0)
      return
    }
    const l = await run('Building your lesson…', () => generateLesson(topic, details))
    if (l) {
      saveLesson(l)
      log(1)
      setIdx(0)
    }
  }

  const step = lesson?.steps[idx]

  async function simpler() {
    if (!lesson || !step) return
    const s = await run('Simplifying…', () => simplifyStep(lesson.topic, step))
    if (s) patchLesson(lesson.key, { steps: lesson.steps.map((x, i) => (i === idx ? s : x)) })
  }

  async function example() {
    if (!lesson || !step) return
    const ex = await run('Finding another example…', () => anotherExample(lesson.topic, step))
    if (ex) patchLesson(lesson.key, { steps: lesson.steps.map((x, i) => (i === idx ? { ...x, example: ex } : x)) })
  }

  function go(d: number) {
    if (!lesson) return
    const next = Math.min(lesson.steps.length - 1, Math.max(0, idx + d))
    if (next > (reached[lesson.key] ?? 0)) {
      log(1)
      setReached({ ...reached, [lesson.key]: next })
    }
    setIdx(next)
  }

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden">
        <HalftoneBackdrop className="pointer-events-none absolute -right-4 -top-4 w-72 opacity-20 sm:w-96" />
        <div className="relative space-y-3">
          <h1 className="text-2xl font-black tracking-tight">What do you want to learn?</h1>
          {!apiKey && (
            <p className="rounded-xl border border-dashed border-zinc-400 p-3 text-sm">
              First add your free Gemini API key in <Link className="underline" to="/settings">Settings</Link>.
            </p>
          )}
          <div>
            <label className="label" htmlFor="topic">Topic or chapter</label>
            <input
              id="topic"
              maxLength={200}
              className="input"
              placeholder="e.g. Newton's laws of motion"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && start()}
            />
          </div>
          <div>
            <label className="label" htmlFor="details">Details (optional)</label>
            <textarea
              id="details"
              maxLength={1000}
              className="input"
              rows={2}
              placeholder="e.g. NCERT chapter 5, focus on friction problems"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <button className="btn btn-solid" disabled={!topic.trim() || !!busy} onClick={start}>
            Teach me
          </button>
        </div>
      </section>

      {busy && <p className="animate-pulse text-sm text-zinc-500">{busy}</p>}
      {error && <p className="rounded-xl border border-red-500 p-3 text-sm text-red-500">{error}</p>}

      {lesson && step && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{lesson.topic}</div>
              <h2 className="text-xl font-bold">
                Step {idx + 1} of {lesson.steps.length}: {step.title}
              </h2>
            </div>
            <VoiceButton key={lesson.key + idx + step.spoken} text={step.spoken} />
          </div>
          <div className="flex gap-1">
            {lesson.steps.map((_, i) => (
              <button
                key={i}
                aria-label={`Step ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              />
            ))}
          </div>
          <Markdown>{step.explanation}</Markdown>
          <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800/60">
            <div className="label">Example</div>
            <Markdown>{step.example}</Markdown>
          </div>
          <p className="font-semibold">💡 {step.takeaway}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={!!busy} onClick={simpler}>Explain simpler</button>
            <button className="btn" disabled={!!busy} onClick={example}>Another example</button>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button className="btn" disabled={idx === 0} onClick={() => go(-1)}>← Back</button>
            <button className="btn btn-solid" disabled={idx === lesson.steps.length - 1} onClick={() => go(1)}>Next →</button>
          </div>
          {idx === lesson.steps.length - 1 && (
            <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="w-full text-sm text-zinc-500">Lesson done. What next?</span>
              <button className="btn btn-solid" onClick={() => nav('/quiz')}>Take a quiz</button>
              <button className="btn" onClick={() => nav('/mindmap')}>Mind map</button>
              <button className="btn" onClick={() => nav('/notes')}>Notes & flashcards</button>
              <button
                className="btn"
                onClick={() => {
                  addTodos(lesson.steps.map((s) => `Revise: ${s.title}`), lesson.topic)
                  nav('/todo')
                }}
              >
                Add steps to to-do
              </button>
            </div>
          )}
        </section>
      )}

      {Object.keys(lessons).length > 0 && (
        <section>
          <h3 className="label">Your lessons</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(lessons)
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((l) => (
                <span key={l.key} className="inline-flex">
                  <button
                    className={`btn rounded-r-none ${l.key === currentKey ? 'btn-solid' : ''}`}
                    onClick={() => {
                      setCurrent(l.key)
                      setIdx(0)
                    }}
                  >
                    {l.topic}
                  </button>
                  <button
                    className="btn rounded-l-none border-l-0 px-3"
                    aria-label={`Delete lesson ${l.topic}`}
                    onClick={() => {
                      if (confirm(`Delete the lesson "${l.topic}" and its quiz, notes and mind map?`)) deleteLesson(l.key)
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}
