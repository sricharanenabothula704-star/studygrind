import { useState } from 'react'
import Markdown from '../components/Markdown'
import NoLesson from '../components/NoLesson'
import { generateQuiz } from '../lib/gemini'
import { useStore } from '../store'

export default function Quiz() {
  const { lessons, currentKey, patchLesson, log } = useStore()
  const lesson = currentKey ? lessons[currentKey] : null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!lesson) return <NoLesson />
  const quiz = lesson.quiz

  async function make() {
    if (!lesson) return
    setBusy(true)
    setError('')
    try {
      patchLesson(lesson.key, { quiz: await generateQuiz(lesson) })
      setPicked({})
      setSubmitted(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const score = quiz ? quiz.filter((q, i) => picked[i] === q.answerIndex).length : 0

  function submit() {
    setSubmitted(true)
    log(score * 2)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Quiz: {lesson.topic}</h1>
      {error && <p className="rounded-xl border border-red-500 p-3 text-sm text-red-500">{error}</p>}
      {!quiz ? (
        <button className="btn btn-solid" disabled={busy} onClick={make}>
          {busy ? 'Writing questions…' : 'Generate quiz'}
        </button>
      ) : (
        <>
          {quiz.map((q, i) => (
            <div key={i} className="card space-y-2">
              <div className="font-semibold"><Markdown>{`${i + 1}. ${q.question}`}</Markdown></div>
              {q.options.map((o, j) => {
                const chosen = picked[i] === j
                const correct = submitted && j === q.answerIndex
                const wrong = submitted && chosen && j !== q.answerIndex
                return (
                  <button
                    key={j}
                    disabled={submitted}
                    onClick={() => setPicked((p) => ({ ...p, [i]: j }))}
                    className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      correct
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : wrong
                          ? 'border-red-500 text-red-500 line-through'
                          : chosen
                            ? 'border-zinc-900 dark:border-zinc-100'
                            : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-700'
                    }`}
                  >
                    {String.fromCharCode(65 + j)}. {o}
                  </button>
                )
              })}
              {submitted && <div className="text-sm text-zinc-500"><Markdown>{q.explanation}</Markdown></div>}
            </div>
          ))}
          {submitted ? (
            <div className="card flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-bold">Score: {score} / {quiz.length}</div>
              <button className="btn" disabled={busy} onClick={make}>New quiz</button>
            </div>
          ) : (
            <button className="btn btn-solid" disabled={Object.keys(picked).length < quiz.length} onClick={submit}>
              Submit answers
            </button>
          )}
        </>
      )}
    </div>
  )
}
