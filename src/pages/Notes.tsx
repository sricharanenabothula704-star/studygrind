import { useState } from 'react'
import Markdown from '../components/Markdown'
import NoLesson from '../components/NoLesson'
import { generateNotes } from '../lib/gemini'
import { useStore } from '../store'

export default function Notes() {
  const { lessons, currentKey, patchLesson } = useStore()
  const lesson = currentKey ? lessons[currentKey] : null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  if (!lesson) return <NoLesson />

  async function make() {
    if (!lesson) return
    setBusy(true)
    setError('')
    try {
      patchLesson(lesson.key, await generateNotes(lesson))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!lesson?.notes) return
    const url = URL.createObjectURL(new Blob([`# ${lesson.topic}\n\n${lesson.notes}`], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${lesson.topic.replace(/\W+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">Notes: {lesson.topic}</h1>
        <div className="flex gap-2">
          {lesson.notes && <button className="btn" onClick={download}>Download .md</button>}
          <button className="btn btn-solid" disabled={busy} onClick={make}>
            {busy ? 'Writing…' : lesson.notes ? 'Regenerate' : 'Generate notes'}
          </button>
        </div>
      </div>
      {error && <p className="rounded-xl border border-red-500 p-3 text-sm text-red-500">{error}</p>}
      {lesson.notes && (
        <div className="card">
          <Markdown>{lesson.notes}</Markdown>
        </div>
      )}
      {lesson.flashcards && (
        <>
          <h2 className="label">Flashcards (click to flip)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.flashcards.map((c, i) => (
              <button
                key={i}
                onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                className={`card flex min-h-28 cursor-pointer items-center justify-center text-center transition ${
                  flipped[i] ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : ''
                }`}
              >
                {flipped[i] ? c.back : c.front}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
